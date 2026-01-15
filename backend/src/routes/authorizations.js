const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const { auth } = require('../middleware/auth')
const Authorization = require('../models/Authorization')
const Product = require('../models/Product')
const TierSystem = require('../models/TierSystem')
const Manufacturer = require('../models/Manufacturer')
const User = require('../models/User')
const Category = require('../models/Category')

const JWT_SECRET = process.env.JWT_SECRET || 'xiaodi-secret-key'

const verifyManufacturerToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }

    const decoded = jwt.verify(token, JWT_SECRET)
    if (decoded?.type !== 'manufacturer') {
      return res.status(403).json({ success: false, message: '无权访问' })
    }

    const manufacturer = await Manufacturer.findById(decoded.id).select('_id name status expiryDate').lean()
    if (!manufacturer) {
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' })
    }
    if (manufacturer.status !== 'active') {
      return res.status(403).json({ success: false, message: '账户已被禁用' })
    }
    if (manufacturer.expiryDate && new Date() > new Date(manufacturer.expiryDate)) {
      return res.status(403).json({ success: false, message: '厂家效期已到期，请联系管理员续期' })
    }

    req.manufacturerId = String(manufacturer._id)
    req.manufacturerName = manufacturer.name
    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: '登录已过期，请重新登录' })
  }
}

/**
 * 授权管理路由
 * 处理厂家之间、厂家与设计师之间的授权关系
 */

// ==================== 创建授权 ====================

// POST /api/authorizations - 创建新授权
router.post('/', auth, async (req, res) => {
  try {
    const {
      toManufacturer,
      toDesigner,
      authorizationType,
      scope,
      categories,
      products,
      priceSettings,
      validUntil,
      notes
    } = req.body

    // 验证当前用户是否有权限创建授权（必须是厂家管理员）
    const user = await User.findById(req.userId)
    if (!user.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以创建授权' })
    }

    // 验证被授权方
    if (authorizationType === 'manufacturer' && !toManufacturer) {
      return res.status(400).json({ success: false, message: '授权给厂家时必须指定目标厂家' })
    }
    if (authorizationType === 'designer' && !toDesigner) {
      return res.status(400).json({ success: false, message: '授权给设计师时必须指定目标设计师' })
    }

    let targetDesigner = null
    if (authorizationType === 'designer') {
      if (!mongoose.Types.ObjectId.isValid(toDesigner)) {
        return res.status(400).json({ success: false, message: '目标设计师ID无效' })
      }
      targetDesigner = await User.findById(toDesigner)
      if (!targetDesigner || targetDesigner.role !== 'designer') {
        return res.status(400).json({ success: false, message: '目标用户不是设计师' })
      }
    }

    // 检查是否已存在相同授权
    const existingAuth = await Authorization.findOne({
      fromManufacturer: user.manufacturerId,
      [authorizationType === 'manufacturer' ? 'toManufacturer' : 'toDesigner']: 
        authorizationType === 'manufacturer' ? toManufacturer : toDesigner,
      status: 'active'
    })

    if (existingAuth) {
      return res.status(400).json({ 
        success: false, 
        message: '已存在有效的授权，请先撤销或修改现有授权' 
      })
    }

    // 创建授权
    const authorization = await Authorization.create({
      fromManufacturer: user.manufacturerId,
      toManufacturer: authorizationType === 'manufacturer' ? toManufacturer : undefined,
      toDesigner: authorizationType === 'designer' ? toDesigner : undefined,
      authorizationType,
      scope,
      categories,
      products,
      priceSettings,
      validUntil,
      notes,
      createdBy: req.userId
    })

    if (authorizationType === 'designer' && targetDesigner) {
      await User.findByIdAndUpdate(
        targetDesigner._id,
        {
          $set: { manufacturerId: null },
          $addToSet: { manufacturerIds: user.manufacturerId }
        },
        { new: false }
      )
    }

    res.json({ success: true, data: authorization, message: '授权创建成功' })
  } catch (error) {
    console.error('创建授权失败:', error)
    res.status(500).json({ success: false, message: '创建授权失败' })
  }
})

router.put('/:id/select-folder', auth, async (req, res) => {
  try {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'id 无效' })
    }

    const { folderId, savedToFolderId, folderName, savedToFolderName } = req.body || {}
    const folder = folderId || savedToFolderId
    if (!folder || !mongoose.Types.ObjectId.isValid(String(folder))) {
      return res.status(400).json({ success: false, message: 'folderId 无效' })
    }

    const user = await User.findById(req.userId).select('role manufacturerId').lean()
    if (!user) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }

    const authDoc = await Authorization.findById(id)
    if (!authDoc) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }

    if (authDoc.status !== 'active') {
      return res.status(400).json({ success: false, message: '授权未生效，无法选择文件夹' })
    }
    if (authDoc.validUntil && new Date() > new Date(authDoc.validUntil)) {
      return res.status(400).json({ success: false, message: '授权已过期，无法选择文件夹' })
    }

    if (user.role === 'designer') {
      if (!authDoc.toDesigner || authDoc.toDesigner.toString() !== String(req.userId)) {
        return res.status(403).json({ success: false, message: '无权限操作此授权' })
      }
      if (authDoc.authorizationType !== 'designer') {
        return res.status(400).json({ success: false, message: '授权类型不匹配' })
      }
    } else if (user.manufacturerId) {
      if (!authDoc.toManufacturer || authDoc.toManufacturer.toString() !== String(user.manufacturerId)) {
        return res.status(403).json({ success: false, message: '无权限操作此授权' })
      }
      if (authDoc.authorizationType !== 'manufacturer') {
        return res.status(400).json({ success: false, message: '授权类型不匹配' })
      }
    } else {
      return res.status(403).json({ success: false, message: '只有接收方可以选择文件夹' })
    }

    const category = await Category.findById(folder).select('name').lean()
    const nextFolderName = category?.name || folderName || savedToFolderName || ''

    authDoc.savedToFolderId = folder
    authDoc.savedToFolderName = nextFolderName
    authDoc.isFolderSelected = true
    authDoc.updatedAt = new Date()
    await authDoc.save()

    res.json({ success: true, data: authDoc, message: '已保存文件夹' })
  } catch (error) {
    console.error('选择保存文件夹失败:', error)
    res.status(500).json({ success: false, message: '选择保存文件夹失败' })
  }
})

// ==================== 查询授权 ====================

// GET /api/authorizations/pending-requests - 获取待审批的授权申请（用于通知铃铛）
router.get('/pending-requests', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'platform_admin'
    const manufacturerId = currentUser?.manufacturerId || currentUser?.manufacturerIds?.[0]

    // 非管理员且非厂家用户返回空
    if (!isAdmin && !manufacturerId) {
      return res.json({ success: true, data: [] })
    }

    const query = {
      status: 'pending'
    }

    // 厂家用户只能看到自己收到的授权申请
    if (!isAdmin && manufacturerId) {
      query.fromManufacturer = manufacturerId
    }

    const list = await Authorization.find(query)
      .populate('toManufacturer', 'name fullName shortName')
      .populate('toDesigner', 'username nickname')
      .populate('fromManufacturer', 'name fullName shortName')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()

    res.json({ success: true, data: list })
  } catch (error) {
    console.error('获取待审批授权申请失败:', error)
    res.json({ success: true, data: [] })
  }
})

// GET /api/authorizations - 获取授权列表（支持按厂家ID和状态筛选）
router.get('/', auth, async (req, res) => {
  try {
    const { manufacturerId, status } = req.query
    const user = await User.findById(req.userId)
    
    const query = {}
    
    // 如果指定了厂家ID，则查询该厂家授权给当前用户的授权
    if (manufacturerId) {
      query.fromManufacturer = new mongoose.Types.ObjectId(String(manufacturerId))
      // 当前用户是厂家用户时，查询授权给该厂家的
      if (user?.manufacturerId) {
        query.toManufacturer = new mongoose.Types.ObjectId(String(user.manufacturerId))
      }
    }
    
    // 状态筛选
    if (status) {
      query.status = status
    }
    
    console.log('[GET /authorizations] Query:', JSON.stringify(query))
    
    const authorizations = await Authorization.find(query)
      .populate('fromManufacturer', '_id name fullName shortName')
      .populate('products', '_id name')
      .lean()
    
    console.log('[GET /authorizations] Found:', authorizations.length)
    
    res.json({ success: true, data: authorizations })
  } catch (error) {
    console.error('获取授权列表失败:', error)
    res.status(500).json({ success: false, message: '获取授权列表失败' })
  }
})

// GET /api/authorizations/summary - 获取授权摘要（用于厂家卡片显示）
router.get('/summary', auth, async (req, res) => {
  try {
    const { manufacturerId } = req.query
    const user = await User.findById(req.userId)
    
    // 确定要查询的厂家ID
    const targetManufacturerIdRaw = manufacturerId || user?.manufacturerId || (user?.manufacturerIds?.[0])
    
    if (!targetManufacturerIdRaw) {
      return res.json({ success: true, data: [] })
    }
    
    // 转换为 ObjectId（数据库中存储的是 ObjectId 类型）
    const mongoose = require('mongoose')
    let targetManufacturerId
    try {
      targetManufacturerId = new mongoose.Types.ObjectId(String(targetManufacturerIdRaw))
    } catch (e) {
      console.log('[Authorization Summary] Invalid manufacturerId:', targetManufacturerIdRaw)
      return res.json({ success: true, data: [] })
    }
    
    // 查询该厂家收到的所有授权（从其他厂家获得的授权）
    const authorizations = await Authorization.find({
      toManufacturer: targetManufacturerId,
      status: { $in: ['active', 'pending'] }
    })
      .populate('fromManufacturer', '_id name fullName shortName')
      .lean()
    
    // 聚合每个来源厂家的授权信息
    const summaryMap = new Map()
    
    console.log('[Authorization Summary] Found authorizations:', authorizations.length, 'for manufacturer:', targetManufacturerId)
    
    for (const auth of authorizations) {
      const fromId = auth.fromManufacturer?._id?.toString()
      if (!fromId) continue
      
      console.log('[Authorization Summary] Processing auth:', {
        fromId,
        scope: auth.scope,
        status: auth.status,
        productsLength: auth.products?.length,
        isEnabled: auth.isEnabled,
        authId: auth._id
      })
      
      if (!summaryMap.has(fromId)) {
        summaryMap.set(fromId, {
          fromManufacturer: auth.fromManufacturer,
          status: auth.status,
          productCount: 0,
          products: [],
          authorizationId: auth._id.toString(), // 转换为字符串
          priceSettings: auth.priceSettings || {},
          minDiscountRate: auth.minDiscountRate || 0,
          commissionRate: auth.commissionRate || 0,
          scope: auth.scope,
          isEnabled: auth.status === 'active' ? (auth.isEnabled !== false) : true // 只有active状态才使用真实的isEnabled
        })
      }
      
      const summary = summaryMap.get(fromId)
      // 更新状态（优先显示active）
      if (auth.status === 'active') {
        summary.status = auth.status
        summary.minDiscountRate = auth.minDiscountRate || summary.minDiscountRate
        summary.commissionRate = auth.commissionRate || summary.commissionRate
        summary.authorizationId = auth._id.toString() // 转换为字符串
        // 对于active的授权，使用其isEnabled状态
        summary.isEnabled = auth.isEnabled !== false
      }
      // 累加商品数量
      if (auth.scope === 'all') {
        // 如果是全部授权，查询实际商品数量（包括所有状态）
        const productCount = await Product.countDocuments({ 
          manufacturerId: auth.fromManufacturer._id || auth.fromManufacturer
        })
        console.log('[Authorization Summary] Scope ALL - productCount:', productCount, 'for manufacturer:', auth.fromManufacturer._id)
        summary.productCount = Math.max(summary.productCount, productCount)
      } else if (auth.scope === 'specific' && auth.products && Array.isArray(auth.products)) {
        // 对于指定商品授权，直接使用授权记录中的商品数量
        console.log('[Authorization Summary] Scope SPECIFIC - products:', auth.products.length)
        summary.productCount += auth.products.length
        summary.products.push(...auth.products)
      } else if (auth.scope === 'category' && auth.categories && Array.isArray(auth.categories)) {
        // 如果是分类授权，查询该分类下的商品数量（包括所有状态）
        const productCount = await Product.countDocuments({ 
          manufacturerId: auth.fromManufacturer._id || auth.fromManufacturer,
          category: { $in: auth.categories }
        })
        console.log('[Authorization Summary] Scope CATEGORY - productCount:', productCount, 'for categories:', auth.categories.length)
        summary.productCount += productCount
      }
    }
    
    console.log('[Authorization Summary] Final summaryMap size:', summaryMap.size)
    summaryMap.forEach((summary, key) => {
      console.log('[Authorization Summary] Manufacturer:', key, {
        productCount: summary.productCount, 
        status: summary.status,
        isEnabled: summary.isEnabled,
        authorizationId: summary.authorizationId
      })
    })
    
    const result = Array.from(summaryMap.values())
    
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('获取授权摘要失败:', error)
    res.status(500).json({ success: false, message: '获取授权摘要失败' })
  }
})

// GET /api/authorizations/my-grants - 我授权给别人的
router.get('/my-grants', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以查看授权' })
    }

    // 获取当前厂家信息（包含默认折扣和返佣设置）
    const currentManufacturer = await Manufacturer.findById(user.manufacturerId)
      .select('defaultDiscount defaultCommission')
      .lean()

    const authorizations = await Authorization.find({
      fromManufacturer: user.manufacturerId
    })
      .populate('toManufacturer', 'name fullName logo contactPerson')
      .populate('toDesigner', 'username nickname avatar email')
      .populate('products', '_id')
      .sort({ createdAt: -1 })
      .lean()

    const needParents = (authorizations || []).filter((a) => !a.tierCompanyId && a.parentAuthorizationId)
    const parentIds = Array.from(new Set(needParents.map((a) => String(a.parentAuthorizationId))))
    const parents = parentIds.length > 0
      ? await Authorization.find({ _id: { $in: parentIds } }).select('_id tierCompanyId tierLevel parentAuthorizationId').lean()
      : []
    const parentMap = new Map((parents || []).map((p) => [String(p._id), p]))
    const resolveCompanyId = (a) => {
      if (a.tierCompanyId) return String(a.tierCompanyId)
      if (!a.parentAuthorizationId || Number(a.tierLevel || 0) === 0) return String(a._id)
      const p = parentMap.get(String(a.parentAuthorizationId))
      if (!p) return String(a.parentAuthorizationId)
      return String(p.tierCompanyId || p._id)
    }

    // 计算厂家的总产品数量
    const totalProductCount = await Product.countDocuments({
      manufacturerId: user.manufacturerId,
      status: 'active'
    })
    
    // 厂家默认折扣和返佣
    const mfrDefaultDiscount = currentManufacturer?.defaultDiscount || 0
    const mfrDefaultCommission = currentManufacturer?.defaultCommission || 0
    
    // 预先计算各分类的产品数量
    const categoryProductCounts = {}
    
    const enrichedAuthorizations = await Promise.all(authorizations.map(async auth => {
      // SKU数量计算
      let skuCount = 0
      if (auth.scope === 'all') {
        // 全部产品
        skuCount = totalProductCount
      } else if (auth.scope === 'category' && Array.isArray(auth.categories) && auth.categories.length > 0) {
        // 按分类授权：统计这些分类下的产品数量
        const categoryIds = auth.categories.map(c => typeof c === 'string' ? c : String(c))
        const count = await Product.countDocuments({
          manufacturerId: user.manufacturerId,
          status: 'active',
          $or: [
            { 'category': { $in: categoryIds } },
            { 'category._id': { $in: categoryIds } }
          ]
        })
        skuCount = count
      } else if (Array.isArray(auth.products)) {
        // 指定产品或混合模式
        skuCount = auth.products.length
      }
      
      return {
        ...auth,
        tierCompanyId: resolveCompanyId(auth),
        actualProductCount: skuCount,
        // 优先使用授权记录的值，否则使用厂家默认值
        minDiscountRate: auth.minDiscountRate || mfrDefaultDiscount,
        commissionRate: auth.commissionRate || mfrDefaultCommission
      }
    }))

    res.json({ success: true, data: enrichedAuthorizations })
  } catch (error) {
    console.error('获取授权列表失败:', error)
    res.status(500).json({ success: false, message: '获取授权列表失败' })
  }
})

// GET /api/authorizations/stats - 获取授权统计（用于仪表盘显示）
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('role manufacturerId').lean()
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'platform_admin'
    const now = new Date()

    const validityQuery = {
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: null },
        { validUntil: { $gt: now } },
      ]
    }

    let pendingDesignerApprovals = 0
    let pendingManufacturerApprovals = 0

    if (isAdmin) {
      pendingDesignerApprovals = await Authorization.countDocuments({
        authorizationType: 'designer',
        status: 'pending',
      })
      pendingManufacturerApprovals = await Authorization.countDocuments({
        authorizationType: 'manufacturer',
        status: 'pending',
      })
    } else if (user?.manufacturerId) {
      pendingDesignerApprovals = await Authorization.countDocuments({
        authorizationType: 'designer',
        status: 'pending',
        fromManufacturer: user.manufacturerId,
      })
      pendingManufacturerApprovals = await Authorization.countDocuments({
        authorizationType: 'manufacturer',
        status: 'pending',
        fromManufacturer: user.manufacturerId,
      })
    }

    let folderSelectionPending = 0
    if (user?.role === 'designer') {
      folderSelectionPending = await Authorization.countDocuments({
        authorizationType: 'designer',
        status: 'active',
        toDesigner: req.userId,
        isFolderSelected: false,
        ...validityQuery,
      })
    } else if (user?.manufacturerId) {
      folderSelectionPending = await Authorization.countDocuments({
        authorizationType: 'manufacturer',
        status: 'active',
        toManufacturer: user.manufacturerId,
        isFolderSelected: false,
        ...validityQuery,
      })
    }

    const todoCount = pendingDesignerApprovals + pendingManufacturerApprovals + folderSelectionPending

    res.json({
      success: true,
      data: {
        pendingApprovals: {
          designer: pendingDesignerApprovals,
          manufacturer: pendingManufacturerApprovals,
          total: pendingDesignerApprovals + pendingManufacturerApprovals,
        },
        folderSelectionPending,
        todoCount,
      }
    })
  } catch (error) {
    console.error('获取授权汇总失败:', error)
    res.status(500).json({ success: false, message: '获取授权汇总失败' })
  }
})

router.get('/manufacturer/summary', verifyManufacturerToken, async (req, res) => {
  try {
    const now = new Date()

    const validityQuery = {
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: null },
        { validUntil: { $gt: now } },
      ]
    }

    const pendingDesignerApprovals = await Authorization.countDocuments({
      authorizationType: 'designer',
      status: 'pending',
      fromManufacturer: req.manufacturerId,
    })

    const pendingManufacturerApprovals = await Authorization.countDocuments({
      authorizationType: 'manufacturer',
      status: 'pending',
      fromManufacturer: req.manufacturerId,
    })

    const folderSelectionPending = await Authorization.countDocuments({
      authorizationType: 'manufacturer',
      status: 'active',
      toManufacturer: req.manufacturerId,
      isFolderSelected: false,
      ...validityQuery,
    })

    const todoCount = pendingDesignerApprovals + pendingManufacturerApprovals + folderSelectionPending

    res.json({
      success: true,
      data: {
        pendingApprovals: {
          designer: pendingDesignerApprovals,
          manufacturer: pendingManufacturerApprovals,
          total: pendingDesignerApprovals + pendingManufacturerApprovals,
        },
        folderSelectionPending,
        todoCount,
      }
    })
  } catch (error) {
    console.error('获取授权汇总失败(厂家端):', error)
    res.status(500).json({ success: false, message: '获取授权汇总失败' })
  }
})

router.get('/manufacturer/my-grants', verifyManufacturerToken, async (req, res) => {
  try {
    const authorizations = await Authorization.find({
      fromManufacturer: req.manufacturerId
    })
      .populate('toManufacturer', 'name fullName shortName code contactPerson')
      .populate('toDesigner', 'username nickname phone email')
      .select('+tierCompanyName +tierCompanyId +tierLevel +tierType +parentAuthorizationId +minDiscountRate +commissionRate')
      .sort({ createdAt: -1 })
      .lean()

    const needParents = (authorizations || []).filter((a) => !a.tierCompanyId && a.parentAuthorizationId)
    const parentIds = Array.from(new Set(needParents.map((a) => String(a.parentAuthorizationId))))
    const parents = parentIds.length > 0
      ? await Authorization.find({ _id: { $in: parentIds } }).select('_id tierCompanyId tierLevel parentAuthorizationId').lean()
      : []
    const parentMap = new Map((parents || []).map((p) => [String(p._id), p]))
    const resolveCompanyId = (a) => {
      if (a.tierCompanyId) return String(a.tierCompanyId)
      if (!a.parentAuthorizationId || Number(a.tierLevel || 0) === 0) return String(a._id)
      const p = parentMap.get(String(a.parentAuthorizationId))
      if (!p) return String(a.parentAuthorizationId)
      return String(p.tierCompanyId || p._id)
    }

    const withCompanyId = (authorizations || []).map((a) => ({
      ...a,
      tierCompanyId: resolveCompanyId(a)
    }))

    res.json({ success: true, data: withCompanyId })
  } catch (error) {
    console.error('获取授权列表失败(厂家端):', error)
    res.status(500).json({ success: false, message: '获取授权列表失败' })
  }
})

router.get('/manufacturer/received', verifyManufacturerToken, async (req, res) => {
  try {
    const query = {
      status: 'active',
      toManufacturer: req.manufacturerId,
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: null },
        { validUntil: { $gt: new Date() } }
      ]
    }

    const authorizations = await Authorization.find(query)
      .populate('fromManufacturer', 'name fullName shortName code contactPerson')
      .populate('products', 'name basePrice thumbnail')
      .select('+tierCompanyName +tierCompanyId +tierLevel +tierType +parentAuthorizationId +minDiscountRate +commissionRate')
      .sort({ createdAt: -1 })
      .lean()

    const needParents = (authorizations || []).filter((a) => !a.tierCompanyId && a.parentAuthorizationId)
    const parentIds = Array.from(new Set(needParents.map((a) => String(a.parentAuthorizationId))))
    const parents = parentIds.length > 0
      ? await Authorization.find({ _id: { $in: parentIds } }).select('_id tierCompanyId tierLevel parentAuthorizationId').lean()
      : []
    const parentMap = new Map((parents || []).map((p) => [String(p._id), p]))
    const resolveCompanyId = (a) => {
      if (a.tierCompanyId) return String(a.tierCompanyId)
      if (!a.parentAuthorizationId || Number(a.tierLevel || 0) === 0) return String(a._id)
      const p = parentMap.get(String(a.parentAuthorizationId))
      if (!p) return String(a.parentAuthorizationId)
      return String(p.tierCompanyId || p._id)
    }

    const withCompanyId = (authorizations || []).map((a) => ({
      ...a,
      tierCompanyId: resolveCompanyId(a)
    }))

    res.json({ success: true, data: withCompanyId })
  } catch (error) {
    console.error('获取授权列表失败(厂家端):', error)
    res.status(500).json({ success: false, message: '获取授权列表失败' })
  }
})

router.get('/manufacturer/designer-requests/pending', verifyManufacturerToken, async (req, res) => {
  try {
    const list = await Authorization.find({
      authorizationType: 'designer',
      status: 'pending',
      fromManufacturer: req.manufacturerId,
    })
      .populate('toDesigner', 'username nickname phone email')
      .populate('fromManufacturer', 'fullName shortName name')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: list })
  } catch (error) {
    console.error('获取授权申请失败(厂家端):', error)
    res.status(500).json({ success: false, message: '获取授权申请失败' })
  }
})

router.get('/manufacturer/manufacturer-requests/pending', verifyManufacturerToken, async (req, res) => {
  try {
    const list = await Authorization.find({
      authorizationType: 'manufacturer',
      status: 'pending',
      fromManufacturer: req.manufacturerId,
    })
      .populate('toManufacturer', 'name fullName shortName code contactPerson')
      .populate('fromManufacturer', 'fullName shortName name')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: list })
  } catch (error) {
    console.error('获取厂家授权申请失败(厂家端):', error)
    res.status(500).json({ success: false, message: '获取厂家授权申请失败' })
  }
})

router.put('/manufacturer/designer-requests/:id/approve', verifyManufacturerToken, async (req, res) => {
  try {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'id 无效' })
    }

    const authDoc = await Authorization.findById(id)
    if (!authDoc) {
      return res.status(404).json({ success: false, message: '授权申请不存在' })
    }

    if (authDoc.authorizationType !== 'designer') {
      return res.status(403).json({ success: false, message: '只能审核设计师授权申请' })
    }

    if (authDoc.fromManufacturer?.toString() !== String(req.manufacturerId)) {
      return res.status(403).json({ success: false, message: '无权限审核此申请' })
    }

    if (authDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该申请不是待审核状态' })
    }

    const {
      scope,
      categories,
      products,
      priceSettings,
      validUntil,
      notes,
      discountRate,
      commissionRate,
      tierType,
      parentAuthorizationId,
      tierCompanyName,
      allowSubAuthorization
    } = req.body || {}
    if (scope) authDoc.scope = scope
    if (categories !== undefined) authDoc.categories = categories
    if (products !== undefined) authDoc.products = products
    if (priceSettings) authDoc.priceSettings = priceSettings
    if (validUntil !== undefined) authDoc.validUntil = validUntil
    if (notes !== undefined) authDoc.notes = notes

    // 设置折扣和返佣
    if (discountRate !== undefined && discountRate >= 0 && discountRate <= 100) {
      authDoc.minDiscountRate = discountRate
    }
    if (commissionRate !== undefined && commissionRate >= 0 && commissionRate <= 100) {
      authDoc.commissionRate = commissionRate
    }

    // 处理分层体系
    if (tierType) {
      authDoc.tierType = tierType

      if (tierType === 'new_company') {
        authDoc.tierLevel = 0
        authDoc.tierCompanyName = tierCompanyName || '未命名公司'
        authDoc.parentAuthorizationId = null
        authDoc.tierCompanyId = authDoc._id
      } else if (tierType === 'existing_tier' && parentAuthorizationId) {
        if (!mongoose.Types.ObjectId.isValid(parentAuthorizationId)) {
          return res.status(400).json({ success: false, message: '父级授权ID无效' })
        }

        const parentAuth = await Authorization.findById(parentAuthorizationId)
        if (!parentAuth) {
          return res.status(404).json({ success: false, message: '父级授权不存在' })
        }
        if (!parentAuth.allowSubAuthorization) {
          return res.status(403).json({ success: false, message: '父级不允许创建下级授权' })
        }

        authDoc.parentAuthorizationId = parentAuthorizationId
        authDoc.tierLevel = (parentAuth.tierLevel || 0) + 1
        authDoc.tierCompanyName = tierCompanyName || `第${authDoc.tierLevel}级下级`
        authDoc.tierCompanyId = parentAuth.tierCompanyId || parentAuth._id
      }
    }

    if (allowSubAuthorization !== undefined) {
      authDoc.allowSubAuthorization = allowSubAuthorization
    }

    authDoc.status = 'active'
    authDoc.updatedAt = new Date()
    await authDoc.save()

    if (authDoc.toDesigner) {
      const designer = await User.findById(authDoc.toDesigner)
      if (designer && designer.role === 'designer') {
        const grantingManufacturerId = authDoc.fromManufacturer
        await User.findByIdAndUpdate(
          designer._id,
          {
            $set: { manufacturerId: null },
            $addToSet: { manufacturerIds: grantingManufacturerId }
          },
          { new: false }
        )
      }
    }

    res.json({ success: true, data: authDoc, message: '已通过' })
  } catch (error) {
    console.error('审核授权申请失败(厂家端):', error)
    res.status(500).json({ success: false, message: '审核授权申请失败' })
  }
})

router.put('/manufacturer/designer-requests/:id/reject', verifyManufacturerToken, async (req, res) => {
  try {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'id 无效' })
    }

    const authDoc = await Authorization.findById(id)
    if (!authDoc) {
      return res.status(404).json({ success: false, message: '授权申请不存在' })
    }

    if (authDoc.authorizationType !== 'designer') {
      return res.status(403).json({ success: false, message: '只能审核设计师授权申请' })
    }

    if (authDoc.fromManufacturer?.toString() !== String(req.manufacturerId)) {
      return res.status(403).json({ success: false, message: '无权限审核此申请' })
    }

    if (authDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该申请不是待审核状态' })
    }

    const { notes } = req.body || {}
    if (notes !== undefined) authDoc.notes = notes
    authDoc.status = 'revoked'
    authDoc.updatedAt = new Date()
    await authDoc.save()

    res.json({ success: true, data: authDoc, message: '已拒绝' })
  } catch (error) {
    console.error('拒绝设计师授权申请失败(厂家端):', error)
    res.status(500).json({ success: false, message: '拒绝设计师授权申请失败' })
  }
})

router.put('/manufacturer/manufacturer-requests/:id/reject', verifyManufacturerToken, async (req, res) => {
  try {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'id 无效' })
    }

    const authDoc = await Authorization.findById(id)
    if (!authDoc) {
      return res.status(404).json({ success: false, message: '授权申请不存在' })
    }

    if (authDoc.authorizationType !== 'manufacturer') {
      return res.status(403).json({ success: false, message: '只能审核厂家授权申请' })
    }

    if (authDoc.fromManufacturer?.toString() !== String(req.manufacturerId)) {
      return res.status(403).json({ success: false, message: '无权限审核此申请' })
    }

    if (authDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该申请不是待审核状态' })
    }

    const { notes } = req.body || {}
    if (notes !== undefined) authDoc.notes = notes
    authDoc.status = 'revoked'
    authDoc.updatedAt = new Date()
    await authDoc.save()

    res.json({ success: true, data: authDoc, message: '已拒绝' })
  } catch (error) {
    console.error('拒绝厂家授权申请失败(厂家端):', error)
    res.status(500).json({ success: false, message: '拒绝厂家授权申请失败' })
  }
})

router.put('/manufacturer/:id/select-folder', verifyManufacturerToken, async (req, res) => {
  try {
    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'id 无效' })
    }

    const { folderId, savedToFolderId, folderName, savedToFolderName } = req.body || {}
    const folder = folderId || savedToFolderId
    if (!folder || !mongoose.Types.ObjectId.isValid(String(folder))) {
      return res.status(400).json({ success: false, message: 'folderId 无效' })
    }

    const authDoc = await Authorization.findById(id)
    if (!authDoc) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }

    if (authDoc.status !== 'active') {
      return res.status(400).json({ success: false, message: '授权未生效，无法选择文件夹' })
    }
    if (authDoc.validUntil && new Date() > new Date(authDoc.validUntil)) {
      return res.status(400).json({ success: false, message: '授权已过期，无法选择文件夹' })
    }

    if (!authDoc.toManufacturer || authDoc.toManufacturer.toString() !== String(req.manufacturerId)) {
      return res.status(403).json({ success: false, message: '无权限操作此授权' })
    }
    if (authDoc.authorizationType !== 'manufacturer') {
      return res.status(400).json({ success: false, message: '授权类型不匹配' })
    }

    const category = await Category.findById(folder).select('name').lean()
    const nextFolderName = category?.name || folderName || savedToFolderName || ''

    authDoc.savedToFolderId = folder
    authDoc.savedToFolderName = nextFolderName
    authDoc.isFolderSelected = true
    authDoc.updatedAt = new Date()
    await authDoc.save()

    res.json({ success: true, data: authDoc, message: '已保存文件夹' })
  } catch (error) {
    console.error('选择保存文件夹失败(厂家端):', error)
    res.status(500).json({ success: false, message: '选择保存文件夹失败' })
  }
})

// GET /api/authorizations/tier-hierarchy - 获取当前用户可见的层级结构
router.get('/tier-hierarchy', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }

    // 查找所有与当前用户相关的授权
    const query = {
      status: 'active',
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: { $gt: new Date() } }
      ]
    }

    // 根据用户类型构建查询
    if (user.role === 'designer') {
      query.toDesigner = req.userId
    } else if (user.manufacturerId) {
      query.toManufacturer = user.manufacturerId
    } else {
      return res.json({ success: true, data: { visible: [], parent: null, children: [] } })
    }

    // 查找授予给当前用户的授权（当前用户的授权记录）
    const myAuthorizations = await Authorization.find(query)
      .populate('fromManufacturer', 'name fullName shortName')
      .populate('toDesigner', 'username nickname')
      .populate('toManufacturer', 'name fullName shortName')
      .populate('parentAuthorizationId')
      .lean()

    const visibleAuths = []

    // 对每个授权，查找其可见的相关授权
    for (const myAuth of myAuthorizations) {
      visibleAuths.push(myAuth)

      // 1. 查找直接父级（如果存在）
      if (myAuth.parentAuthorizationId) {
        const parentAuth = await Authorization.findById(myAuth.parentAuthorizationId)
          .populate('fromManufacturer', 'name fullName shortName')
          .populate('toDesigner', 'username nickname')
          .populate('toManufacturer', 'name fullName shortName')
          .lean()
        
        if (parentAuth && !visibleAuths.find(a => a._id.toString() === parentAuth._id.toString())) {
          visibleAuths.push(parentAuth)
        }
      }

      // 2. 查找直接下级（由当前用户创建的）
      const childAuths = await Authorization.find({
        parentAuthorizationId: myAuth._id,
        status: 'active',
        createdBy: req.userId
      })
        .populate('fromManufacturer', 'name fullName shortName')
        .populate('toDesigner', 'username nickname')
        .populate('toManufacturer', 'name fullName shortName')
        .lean()

      for (const childAuth of childAuths) {
        if (!visibleAuths.find(a => a._id.toString() === childAuth._id.toString())) {
          visibleAuths.push(childAuth)
        }
      }
    }

    const authMap = new Map(visibleAuths.map((a) => [String(a._id), a]))
    const resolveCompanyId = (a, seen = new Set()) => {
      const id = String(a?._id || '')
      if (!id) return ''
      if (a.tierCompanyId) return String(a.tierCompanyId)
      if (!a.parentAuthorizationId || Number(a.tierLevel || 0) === 0) return id
      const pid = typeof a.parentAuthorizationId === 'object'
        ? String(a.parentAuthorizationId?._id || a.parentAuthorizationId)
        : String(a.parentAuthorizationId)
      if (!pid) return id
      if (seen.has(pid)) return pid
      seen.add(pid)
      const p = authMap.get(pid)
      if (!p) return pid
      return p.tierCompanyId ? String(p.tierCompanyId) : resolveCompanyId(p, seen)
    }

    // 构建层级结构
    const hierarchy = visibleAuths.map(auth => ({
      ...auth,
      tierCompanyId: auth.tierCompanyId ? String(auth.tierCompanyId) : resolveCompanyId(auth),
      isMyAuth: myAuthorizations.some(a => a._id.toString() === auth._id.toString()),
      isParent: myAuthorizations.some(a => a.parentAuthorizationId?.toString() === auth._id.toString()),
      isChild: auth.parentAuthorizationId && myAuthorizations.some(a => a._id.toString() === auth.parentAuthorizationId.toString())
    }))

    res.json({ 
      success: true, 
      data: {
        visible: hierarchy,
        myAuthorizations: myAuthorizations.map(a => a._id.toString())
      }
    })
  } catch (error) {
    console.error('获取层级结构失败:', error)
    res.status(500).json({ success: false, message: '获取层级结构失败' })
  }
})

// GET /api/authorizations/received - 我收到的授权
router.get('/received', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    
    const query = {
      status: 'active',
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: { $gt: new Date() } }
      ]
    }

    // 根据用户类型查询
    if (user.role === 'designer') {
      query.toDesigner = req.userId
    } else if (user.manufacturerId) {
      query.toManufacturer = user.manufacturerId
    } else {
      return res.json({ success: true, data: [] })
    }

    const authorizations = await Authorization.find(query)
      .populate('fromManufacturer', 'name fullName contactPerson')
      .populate('products', 'name basePrice thumbnail')
      .select('+minDiscountRate +commissionRate +tierCompanyName +tierCompanyId +tierLevel +tierType +parentAuthorizationId')
      .sort({ createdAt: -1 })
      .lean()

    const needParents = (authorizations || []).filter((a) => !a.tierCompanyId && a.parentAuthorizationId)
    const parentIds = Array.from(new Set(needParents.map((a) => String(a.parentAuthorizationId))))
    const parents = parentIds.length > 0
      ? await Authorization.find({ _id: { $in: parentIds } }).select('_id tierCompanyId tierLevel parentAuthorizationId').lean()
      : []
    const parentMap = new Map((parents || []).map((p) => [String(p._id), p]))
    const resolveCompanyId = (a) => {
      if (a.tierCompanyId) return String(a.tierCompanyId)
      if (!a.parentAuthorizationId || Number(a.tierLevel || 0) === 0) return String(a._id)
      const p = parentMap.get(String(a.parentAuthorizationId))
      if (!p) return String(a.parentAuthorizationId)
      return String(p.tierCompanyId || p._id)
    }

    const withCompanyId = (authorizations || []).map((a) => ({
      ...a,
      tierCompanyId: resolveCompanyId(a)
    }))

    res.json({ success: true, data: withCompanyId })
  } catch (error) {
    console.error('获取授权列表失败:', error)
    res.status(500).json({ success: false, message: '获取授权列表失败' })
  }
})

router.post('/designer-requests', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    const adminRoles = ['super_admin', 'admin', 'platform_admin']
    const isAdmin = adminRoles.includes(currentUser?.role)
    if (!currentUser || (!isAdmin && currentUser.role !== 'designer')) {
      return res.status(403).json({ success: false, message: '只有设计师或管理员可以申请厂家授权' })
    }

    const { manufacturerId, notes, scope, categories, products, validUntil } = req.body
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }

    const manufacturer = await Manufacturer.findById(manufacturerId).select('_id')
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }

    const existing = await Authorization.findOne({
      fromManufacturer: manufacturerId,
      toDesigner: req.userId,
      authorizationType: 'designer',
      status: { $in: ['pending', 'active'] }
    }).select('_id status')

    if (existing) {
      return res.status(400).json({ success: false, message: '已存在申请记录或已授权' })
    }

    const normalizedScope = ['all', 'category', 'specific', 'mixed'].includes(scope) ? scope : 'all'

    let normalizedCategories = []
    let normalizedProducts = []

    // 支持mixed模式：同时选择分类和商品
    if (normalizedScope === 'category' || normalizedScope === 'mixed') {
      if (Array.isArray(categories) && categories.length > 0) {
        normalizedCategories = categories
          .map((c) => String(c))
          .filter((c) => c && c.length <= 128)
          .slice(0, 200)
      } else if (normalizedScope === 'category') {
        return res.status(400).json({ success: false, message: '请选择要授权的分类' })
      }
    }

    if (normalizedScope === 'specific' || normalizedScope === 'mixed') {
      if (Array.isArray(products) && products.length > 0) {
        const productIds = products
          .map((p) => String(p))
          .filter((p) => mongoose.Types.ObjectId.isValid(p))
          .slice(0, 10000)

        if (productIds.length > 0) {
          const manufacturerOid = new mongoose.Types.ObjectId(manufacturerId)
          const productOids = productIds.map((id) => new mongoose.Types.ObjectId(id))

          const ownedProducts = await Product.find({
            _id: { $in: productOids },
            status: 'active',
            $or: [{ manufacturerId: manufacturerOid }, { 'skus.manufacturerId': manufacturerOid }]
          })
            .select('_id')
            .lean()

          if ((ownedProducts || []).length !== productOids.length) {
            return res.status(400).json({ success: false, message: '所选商品中包含无效商品或不属于该厂家' })
          }

          normalizedProducts = ownedProducts.map((p) => p._id)
        }
      } else if (normalizedScope === 'specific') {
        return res.status(400).json({ success: false, message: '请选择要授权的商品' })
      }
    }

    // mixed模式必须至少选择一个分类或商品
    if (normalizedScope === 'mixed' && normalizedCategories.length === 0 && normalizedProducts.length === 0) {
      return res.status(400).json({ success: false, message: '请至少选择一个分类或商品' })
    }

    let parsedValidUntil = undefined
    if (validUntil !== undefined && validUntil !== null && String(validUntil).trim() !== '') {
      const d = new Date(validUntil)
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: 'validUntil 无效' })
      }
      parsedValidUntil = d
    }

    const authorization = await Authorization.create({
      fromManufacturer: manufacturerId,
      toDesigner: req.userId,
      authorizationType: 'designer',
      scope: normalizedScope,
      categories: normalizedCategories,
      products: normalizedProducts,
      priceSettings: {
        globalDiscount: 1,
        categoryDiscounts: [],
        productPrices: []
      },
      status: 'pending',
      ...(parsedValidUntil ? { validUntil: parsedValidUntil } : {}),
      notes,
      createdBy: req.userId
    })

    res.json({ success: true, data: authorization, message: '申请已提交' })
  } catch (error) {
    console.error('提交授权申请失败:', error)
    res.status(500).json({ success: false, message: '提交授权申请失败' })
  }
})

router.get('/designer-requests/my', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)

    const adminRoles = ['super_admin', 'admin', 'platform_admin']
    const isAdmin = adminRoles.includes(currentUser?.role)
    if (!currentUser || (!isAdmin && currentUser.role !== 'designer')) {
      return res.status(403).json({ success: false, message: '只有设计师或管理员可以查看申请记录' })
    }

    const list = await Authorization.find({
      authorizationType: 'designer',
      toDesigner: req.userId
    })
      .populate('fromManufacturer', 'name fullName shortName code')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: list })
  } catch (error) {
    console.error('获取我的授权申请失败:', error)
    res.status(500).json({ success: false, message: '获取我的授权申请失败' })
  }
})

router.get('/designer-requests/pending', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'platform_admin'
    
    if (!isAdmin && !currentUser?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户或管理员可以查看授权申请' })
    }

    const query = {
      authorizationType: 'designer',
      status: 'pending'
    }
    
    if (!isAdmin) {
      query.fromManufacturer = currentUser.manufacturerId
    }

    const list = await Authorization.find(query)
      .populate('toDesigner', 'username nickname phone email')
      .populate('fromManufacturer', 'fullName shortName name')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: list })
  } catch (error) {
    console.error('获取授权申请失败:', error)
    res.status(500).json({ success: false, message: '获取授权申请失败' })
  }
})

router.put('/designer-requests/:id/approve', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'platform_admin'
    
    if (!isAdmin && !currentUser?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以审核授权申请' })
    }

    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'id 无效' })
    }

    const authDoc = await Authorization.findById(id)
    if (!authDoc) {
      return res.status(404).json({ success: false, message: '授权申请不存在' })
    }

    if (authDoc.authorizationType !== 'designer') {
      return res.status(403).json({ success: false, message: '只能审核设计师授权申请' })
    }
    
    if (!isAdmin && authDoc.fromManufacturer?.toString() !== currentUser.manufacturerId.toString()) {
      return res.status(403).json({ success: false, message: '无权限审核此申请' })
    }

    if (authDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该申请不是待审核状态' })
    }

    const { 
      scope, 
      categories, 
      products, 
      priceSettings, 
      validUntil, 
      notes,
      discountRate,
      commissionRate,
      tierType,
      parentAuthorizationId,
      tierCompanyName,
      allowSubAuthorization
    } = req.body
    
    if (scope) authDoc.scope = scope
    if (categories !== undefined) authDoc.categories = categories
    if (products !== undefined) authDoc.products = products
    if (priceSettings) authDoc.priceSettings = priceSettings
    if (validUntil !== undefined) authDoc.validUntil = validUntil
    if (notes !== undefined) authDoc.notes = notes
    
    // 设置折扣和返佣
    if (discountRate !== undefined && discountRate >= 0 && discountRate <= 100) {
      authDoc.minDiscountRate = discountRate
    }
    if (commissionRate !== undefined && commissionRate >= 0 && commissionRate <= 100) {
      authDoc.commissionRate = commissionRate
    }
    
    // 处理分层体系
    if (tierType) {
      authDoc.tierType = tierType
      
      if (tierType === 'new_company') {
        // 新建公司，层级为0
        authDoc.tierLevel = 0
        authDoc.tierCompanyName = tierCompanyName || '未命名公司'
        authDoc.parentAuthorizationId = null
        // 根节点即公司唯一ID
        authDoc.tierCompanyId = authDoc._id
      } else if (tierType === 'existing_tier' && parentAuthorizationId) {
        // 插入现有层级
        if (!mongoose.Types.ObjectId.isValid(parentAuthorizationId)) {
          return res.status(400).json({ success: false, message: '父级授权ID无效' })
        }
        
        const parentAuth = await Authorization.findById(parentAuthorizationId)
        if (!parentAuth) {
          return res.status(404).json({ success: false, message: '父级授权不存在' })
        }
        
        // 检查父级是否允许下级授权
        if (!parentAuth.allowSubAuthorization) {
          return res.status(403).json({ success: false, message: '父级不允许创建下级授权' })
        }
        
        authDoc.parentAuthorizationId = parentAuthorizationId
        authDoc.tierLevel = (parentAuth.tierLevel || 0) + 1
        authDoc.tierCompanyName = tierCompanyName || `第${authDoc.tierLevel}级下级`
        authDoc.tierCompanyId = parentAuth.tierCompanyId || parentAuth._id
      }
    }
    
    if (allowSubAuthorization !== undefined) {
      authDoc.allowSubAuthorization = allowSubAuthorization
    }

    authDoc.status = 'active'
    authDoc.updatedAt = new Date()
    await authDoc.save()

    if (authDoc.toDesigner) {
      const designer = await User.findById(authDoc.toDesigner)
      if (designer && designer.role === 'designer') {
        const grantingManufacturerId = authDoc.fromManufacturer
        await User.findByIdAndUpdate(
          designer._id,
          {
            $set: { manufacturerId: null },
            $addToSet: { manufacturerIds: grantingManufacturerId }
          },
          { new: false }
        )
      }
    }

    res.json({ success: true, data: authDoc, message: '已通过' })
  } catch (error) {
    console.error('审核授权申请失败:', error)
    res.status(500).json({ success: false, message: '审核授权申请失败' })
  }
})

router.put('/designer-requests/:id/reject', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'platform_admin'
    
    if (!isAdmin && !currentUser?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以审核授权申请' })
    }

    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'id 无效' })
    }

    const authDoc = await Authorization.findById(id)
    if (!authDoc) {
      return res.status(404).json({ success: false, message: '授权申请不存在' })
    }

    if (authDoc.authorizationType !== 'designer') {
      return res.status(403).json({ success: false, message: '只能审核设计师授权申请' })
    }
    
    if (!isAdmin && authDoc.fromManufacturer?.toString() !== currentUser.manufacturerId.toString()) {
      return res.status(403).json({ success: false, message: '无权限审核此申请' })
    }

    if (authDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该申请不是待审核状态' })
    }

    const { notes } = req.body
    if (notes !== undefined) authDoc.notes = notes
    authDoc.status = 'revoked'
    authDoc.updatedAt = new Date()
    await authDoc.save()

    res.json({ success: true, data: authDoc, message: '已拒绝' })
  } catch (error) {
    console.error('拒绝授权申请失败:', error)
    res.status(500).json({ success: false, message: '拒绝授权申请失败' })
  }
})

router.post('/manufacturer-requests', auth, async (req, res) => {
  try {
    console.log('收到厂家授权申请:', req.body)
    const currentUser = await User.findById(req.userId)
    if (!currentUser?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以申请厂家授权' })
    }

    const { manufacturerId, notes, scope, categories, products, validUntil } = req.body
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }

    const requesterManufacturerId = currentUser.manufacturerId
    if (String(requesterManufacturerId) === String(manufacturerId)) {
      return res.status(400).json({ success: false, message: '不能向自己申请授权' })
    }

    const manufacturer = await Manufacturer.findById(manufacturerId).select('_id')
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }

    const existing = await Authorization.findOne({
      fromManufacturer: manufacturerId,
      toManufacturer: requesterManufacturerId,
      authorizationType: 'manufacturer',
      status: { $in: ['pending', 'active'] }
    }).select('_id status')

    if (existing) {
      return res.status(400).json({ success: false, message: '已存在申请记录或已授权' })
    }

    const normalizedScope = ['all', 'category', 'specific', 'mixed'].includes(scope) ? scope : 'all'
    let normalizedCategories = []
    let normalizedProducts = []

    if (normalizedScope === 'category' || normalizedScope === 'mixed') {
      if (Array.isArray(categories) && categories.length > 0) {
        normalizedCategories = categories
          .map((c) => String(c))
          .filter((c) => c && c.length <= 128)
          .slice(0, 200)
      } else if (normalizedScope === 'category') {
        return res.status(400).json({ success: false, message: '请选择要授权的分类' })
      }
    }

    if (normalizedScope === 'specific' || normalizedScope === 'mixed') {
      if (Array.isArray(products) && products.length > 0) {
        const productIds = products
          .map((p) => String(p))
          .filter((p) => mongoose.Types.ObjectId.isValid(p))
          .slice(0, 10000)

        if (productIds.length > 0) {
          const manufacturerOid = new mongoose.Types.ObjectId(manufacturerId)
          const productOids = productIds.map((id) => new mongoose.Types.ObjectId(id))

          const ownedProducts = await Product.find({
            _id: { $in: productOids },
            status: 'active',
            $or: [{ manufacturerId: manufacturerOid }, { 'skus.manufacturerId': manufacturerOid }]
          })
            .select('_id')
            .lean()

          if ((ownedProducts || []).length !== productOids.length) {
            return res.status(400).json({ success: false, message: '所选商品中包含无效商品或不属于该厂家' })
          }

          normalizedProducts = ownedProducts.map((p) => p._id)
        }
      } else if (normalizedScope === 'specific') {
        return res.status(400).json({ success: false, message: '请选择要授权的商品' })
      }
    }

    if (normalizedScope === 'mixed' && normalizedCategories.length === 0 && normalizedProducts.length === 0) {
      return res.status(400).json({ success: false, message: '请至少选择一个分类或商品' })
    }

    let parsedValidUntil = undefined
    if (validUntil !== undefined && validUntil !== null && String(validUntil).trim() !== '') {
      const d = new Date(validUntil)
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: 'validUntil 无效' })
      }
      parsedValidUntil = d
    }

    const authorization = await Authorization.create({
      fromManufacturer: manufacturerId,
      toManufacturer: requesterManufacturerId,
      authorizationType: 'manufacturer',
      scope: normalizedScope,
      categories: normalizedCategories,
      products: normalizedProducts,
      priceSettings: {
        globalDiscount: 1,
        categoryDiscounts: [],
        productPrices: []
      },
      status: 'pending',
      ...(parsedValidUntil ? { validUntil: parsedValidUntil } : {}),
      notes,
      createdBy: req.userId
    })

    res.json({ success: true, data: authorization, message: '申请已提交' })
  } catch (error) {
    console.error('提交厂家授权申请失败:', error)
    res.status(500).json({ success: false, message: '提交厂家授权申请失败' })
  }
})

router.get('/manufacturer-requests/my', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    if (!currentUser?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以查看申请记录' })
    }

    const list = await Authorization.find({
      authorizationType: 'manufacturer',
      toManufacturer: currentUser.manufacturerId
    })
      .populate('fromManufacturer', 'name fullName shortName code')
      .populate('toManufacturer', 'name fullName shortName code')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: list })
  } catch (error) {
    console.error('获取我的厂家授权申请失败:', error)
    res.status(500).json({ success: false, message: '获取我的厂家授权申请失败' })
  }
})

router.get('/manufacturer-requests/pending', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'platform_admin'

    if (!isAdmin && !currentUser?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户或管理员可以查看授权申请' })
    }

    const query = {
      authorizationType: 'manufacturer',
      status: 'pending'
    }

    if (!isAdmin) {
      query.fromManufacturer = currentUser.manufacturerId
    }

    const list = await Authorization.find(query)
      .populate('toManufacturer', 'name fullName shortName code contactPerson')
      .populate('fromManufacturer', 'fullName shortName name')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: list })
  } catch (error) {
    console.error('获取厂家授权申请失败:', error)
    res.status(500).json({ success: false, message: '获取厂家授权申请失败' })
  }
})

router.put('/manufacturer-requests/:id/approve', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'platform_admin'

    if (!isAdmin && !currentUser?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以审核授权申请' })
    }

    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'id 无效' })
    }

    const authDoc = await Authorization.findById(id)
    if (!authDoc) {
      return res.status(404).json({ success: false, message: '授权申请不存在' })
    }

    if (authDoc.authorizationType !== 'manufacturer') {
      return res.status(403).json({ success: false, message: '只能审核厂家授权申请' })
    }

    if (!isAdmin && authDoc.fromManufacturer?.toString() !== currentUser.manufacturerId.toString()) {
      return res.status(403).json({ success: false, message: '无权限审核此申请' })
    }

    if (authDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该申请不是待审核状态' })
    }

    const {
      scope,
      categories,
      products,
      priceSettings,
      validUntil,
      notes,
      discountRate,
      commissionRate,
      tierType,
      parentAuthorizationId,
      tierCompanyName,
      allowSubAuthorization
    } = req.body
    if (scope) authDoc.scope = scope
    if (categories !== undefined) authDoc.categories = categories
    if (products !== undefined) authDoc.products = products
    if (priceSettings) authDoc.priceSettings = priceSettings
    if (validUntil !== undefined) authDoc.validUntil = validUntil
    if (notes !== undefined) authDoc.notes = notes

    // 设置折扣和返佣
    if (discountRate !== undefined && discountRate >= 0 && discountRate <= 100) {
      authDoc.minDiscountRate = discountRate
    }
    if (commissionRate !== undefined && commissionRate >= 0 && commissionRate <= 100) {
      authDoc.commissionRate = commissionRate
    }

    // 处理分层体系
    if (tierType) {
      authDoc.tierType = tierType
      if (tierType === 'new_company') {
        authDoc.tierLevel = 0
        authDoc.tierCompanyName = tierCompanyName || '未命名公司'
        authDoc.parentAuthorizationId = null
        authDoc.tierCompanyId = authDoc._id
      } else if (tierType === 'existing_tier' && parentAuthorizationId) {
        if (!mongoose.Types.ObjectId.isValid(parentAuthorizationId)) {
          return res.status(400).json({ success: false, message: '父级授权ID无效' })
        }
        const parentAuth = await Authorization.findById(parentAuthorizationId)
        if (!parentAuth) {
          return res.status(404).json({ success: false, message: '父级授权不存在' })
        }
        if (!parentAuth.allowSubAuthorization) {
          return res.status(403).json({ success: false, message: '父级不允许创建下级授权' })
        }
        authDoc.parentAuthorizationId = parentAuthorizationId
        authDoc.tierLevel = (parentAuth.tierLevel || 0) + 1
        authDoc.tierCompanyName = tierCompanyName || `第${authDoc.tierLevel}级下级`
        authDoc.tierCompanyId = parentAuth.tierCompanyId || parentAuth._id
      }
    }

    if (allowSubAuthorization !== undefined) {
      authDoc.allowSubAuthorization = allowSubAuthorization
    }

    authDoc.status = 'active'
    authDoc.updatedAt = new Date()
    await authDoc.save()

    res.json({ success: true, data: authDoc, message: '已通过' })
  } catch (error) {
    console.error('审核厂家授权申请失败:', error)
    res.status(500).json({ success: false, message: '审核厂家授权申请失败' })
  }
})

router.put('/manufacturer-requests/:id/reject', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' || currentUser?.role === 'platform_admin'

    if (!isAdmin && !currentUser?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以审核授权申请' })
    }

    const { id } = req.params
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'id 无效' })
    }

    const authDoc = await Authorization.findById(id)
    if (!authDoc) {
      return res.status(404).json({ success: false, message: '授权申请不存在' })
    }

    if (authDoc.authorizationType !== 'manufacturer') {
      return res.status(403).json({ success: false, message: '只能审核厂家授权申请' })
    }

    if (!isAdmin && authDoc.fromManufacturer?.toString() !== currentUser.manufacturerId.toString()) {
      return res.status(403).json({ success: false, message: '无权限审核此申请' })
    }

    if (authDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该申请不是待审核状态' })
    }

    const { notes } = req.body
    if (notes !== undefined) authDoc.notes = notes
    authDoc.status = 'revoked'
    authDoc.updatedAt = new Date()
    await authDoc.save()

    res.json({ success: true, data: authDoc, message: '已拒绝' })
  } catch (error) {
    console.error('拒绝厂家授权申请失败:', error)
    res.status(500).json({ success: false, message: '拒绝厂家授权申请失败' })
  }
})

// GET /api/authorizations/:id - 获取授权详情
router.get('/:id([0-9a-fA-F]{24})', auth, async (req, res) => {
  try {
    const authorization = await Authorization.findById(req.params.id)
      .populate('fromManufacturer')
      .populate('toManufacturer')
      .populate('toDesigner')
      .populate('products')
      .lean()

    if (!authorization) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }

    // 权限检查：管理员或相关方可以查看
    const user = await User.findById(req.userId)
    const isAdmin = ['admin', 'super_admin', 'platform_admin', 'platform_staff', 'enterprise_admin'].includes(user?.role)
    const isAuthorized = isAdmin ||
      authorization.fromManufacturer?._id?.toString() === user?.manufacturerId?.toString() ||
      authorization.toManufacturer?._id?.toString() === user?.manufacturerId?.toString() ||
      authorization.toDesigner?._id?.toString() === req.userId?.toString()

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: '无权查看此授权' })
    }

    res.json({ success: true, data: authorization })
  } catch (error) {
    console.error('获取授权详情失败:', error)
    res.status(500).json({ success: false, message: '获取授权详情失败' })
  }
})

// ==================== 更新授权 ====================

// PUT /api/authorizations/:id - 更新授权
router.put('/:id([0-9a-fA-F]{24})', auth, async (req, res) => {
  try {
    const authorization = await Authorization.findById(req.params.id)
    if (!authorization) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }

    // 权限检查：只有授权方可以修改
    const user = await User.findById(req.userId)
    if (authorization.fromManufacturer.toString() !== user.manufacturerId?.toString()) {
      return res.status(403).json({ success: false, message: '只有授权方可以修改授权' })
    }

    const { priceSettings, validUntil, status, notes } = req.body

    if (priceSettings) authorization.priceSettings = priceSettings
    if (validUntil !== undefined) authorization.validUntil = validUntil
    if (status) authorization.status = status
    if (notes !== undefined) authorization.notes = notes
    
    authorization.updatedAt = new Date()
    await authorization.save()

    res.json({ success: true, data: authorization, message: '授权更新成功' })
  } catch (error) {
    console.error('更新授权失败:', error)
    res.status(500).json({ success: false, message: '更新授权失败' })
  }
})

router.put('/:id/designer-product-discount/:productId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user || user.role !== 'designer') {
      return res.status(403).json({ success: false, message: '只有设计师可以修改单品折扣' })
    }

    const authorization = await Authorization.findById(req.params.id)
    if (!authorization) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }
    if (!authorization.toDesigner || authorization.toDesigner.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: '无权限修改此授权' })
    }
    if (authorization.status !== 'active') {
      return res.status(400).json({ success: false, message: '授权未生效，无法修改' })
    }
    if (authorization.validUntil && new Date() > new Date(authorization.validUntil)) {
      return res.status(400).json({ success: false, message: '授权已过期，无法修改' })
    }

    const productId = req.params.productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ success: false, message: '商品ID无效' })
    }

    const product = await Product.findById(productId).lean()
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }

    const ownerManufacturerId = (product.manufacturerId?._id || product.manufacturerId || product?.skus?.[0]?.manufacturerId)
    if (!ownerManufacturerId || ownerManufacturerId.toString() !== authorization.fromManufacturer.toString()) {
      return res.status(400).json({ success: false, message: '该商品不属于此授权的厂家范围' })
    }

    if (authorization.scope === 'specific') {
      const inList = Array.isArray(authorization.products) && authorization.products.some((p) => p.toString() === productId.toString())
      if (!inList) {
        return res.status(400).json({ success: false, message: '该商品不在授权范围内' })
      }
    } else if (authorization.scope === 'category') {
      const categoryId = (product.category?._id || product.category?.id || product.category)
      const allowed = Array.isArray(authorization.categories) && authorization.categories.some((c) => c.toString() === categoryId?.toString())
      if (!allowed) {
        return res.status(400).json({ success: false, message: '该商品分类不在授权范围内' })
      }
    } else if (authorization.scope === 'mixed') {
      const categoryId = (product.category?._id || product.category?.id || product.category)
      const allowedCategory = Array.isArray(authorization.categories) && authorization.categories.some((c) => c.toString() === categoryId?.toString())
      const allowedProduct = Array.isArray(authorization.products) && authorization.products.some((p) => p.toString() === productId.toString())
      if (!allowedCategory && !allowedProduct) {
        return res.status(400).json({ success: false, message: '该商品不在授权范围内' })
      }
    }

    const incoming = req.body?.discountRate
    let discountRate = incoming === null || incoming === '' || incoming === undefined ? null : Number(incoming)

    if (discountRate !== null) {
      if (!Number.isFinite(discountRate) || discountRate <= 0 || discountRate > 1) {
        return res.status(400).json({ success: false, message: '折扣比例无效' })
      }

      const tier = await TierSystem.findOne({ manufacturerId: ownerManufacturerId }).lean()
      const minSaleDiscountRate = Number(tier?.profitSettings?.minSaleDiscountRate ?? 0)
      if (Number.isFinite(minSaleDiscountRate) && minSaleDiscountRate > 0 && discountRate < minSaleDiscountRate) {
        discountRate = minSaleDiscountRate
      }
    }

    const next = Array.isArray(authorization.priceSettings?.productPrices)
      ? [...authorization.priceSettings.productPrices]
      : []

    const idx = next.findIndex((x) => x?.productId?.toString?.() === productId.toString())
    if (discountRate === null) {
      if (idx >= 0) next.splice(idx, 1)
    } else {
      const value = { productId, discount: discountRate }
      if (idx >= 0) {
        next[idx] = value
      } else {
        next.push(value)
      }
    }

    if (!authorization.priceSettings) authorization.priceSettings = {}
    authorization.priceSettings.productPrices = next
    authorization.markModified('priceSettings')
    authorization.updatedAt = new Date()
    await authorization.save()

    res.json({ success: true, data: authorization, message: '单品折扣已更新' })
  } catch (error) {
    console.error('更新单品折扣失败:', error)
    res.status(500).json({ success: false, message: '更新单品折扣失败' })
  }
})

// DELETE /api/authorizations/:id - 撤销/删除授权
router.delete('/:id([0-9a-fA-F]{24})', auth, async (req, res) => {
  try {
    const authorization = await Authorization.findById(req.params.id)
    if (!authorization) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }

    // 权限检查
    const user = await User.findById(req.userId)
    const isAdmin = user?.role === 'super_admin' || user?.role === 'admin'
    const isOwner = authorization.fromManufacturer.toString() === user.manufacturerId?.toString()
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: '只有授权方可以撤销授权' })
    }

    // 如果请求永久删除，则真正删除；否则只标记为revoked
    const permanent = req.query.permanent === 'true'
    if (permanent) {
      await Authorization.findByIdAndDelete(req.params.id)
      res.json({ success: true, message: '授权已删除' })
    } else {
      authorization.status = 'revoked'
      authorization.updatedAt = new Date()
      await authorization.save()
      res.json({ success: true, message: '授权已撤销' })
    }
  } catch (error) {
    console.error('撤销/删除授权失败:', error)
    res.status(500).json({ success: false, message: '操作失败' })
  }
})

// ==================== 授权商品查询 ====================

// GET /api/authorizations/products/authorized - 获取我有权限访问的商品列表
router.get('/products/authorized', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const { page = 1, pageSize = 20, category } = req.query
    
    // 查询我收到的所有有效授权
    const query = {
      status: 'active',
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: { $gt: new Date() } }
      ]
    }

    if (user.role === 'designer') {
      query.toDesigner = req.userId
    } else if (user.manufacturerId) {
      query.toManufacturer = user.manufacturerId
    } else {
      return res.json({ success: true, data: [], total: 0 })
    }

    const authorizations = await Authorization.find(query).lean()
    
    // 收集所有授权的商品ID
    const authorizedProductIds = new Set()
    const authByProduct = new Map() // 用于后续获取授权价格
    
    for (const auth of authorizations) {
      if (auth.scope === 'all') {
        // 全部商品 - 需要查询授权方的所有商品
        const products = await Product.find({ 
          manufacturerId: auth.fromManufacturer,
          status: 'active'
        }).select('_id').lean()
        
        products.forEach(p => {
          authorizedProductIds.add(p._id.toString())
          authByProduct.set(p._id.toString(), auth)
        })
      } else if (auth.scope === 'category') {
        // 按分类 - 查询指定分类的商品
        const products = await Product.find({
          manufacturerId: auth.fromManufacturer,
          category: { $in: auth.categories },
          status: 'active'
        }).select('_id').lean()
        
        products.forEach(p => {
          authorizedProductIds.add(p._id.toString())
          authByProduct.set(p._id.toString(), auth)
        })
      } else if (auth.scope === 'specific') {
        // 指定商品
        auth.products.forEach(pid => {
          authorizedProductIds.add(pid.toString())
          authByProduct.set(pid.toString(), auth)
        })
      } else if (auth.scope === 'mixed') {
        const manufacturerOid = auth.fromManufacturer
        if (Array.isArray(auth.categories) && auth.categories.length > 0) {
          const products = await Product.find({
            manufacturerId: manufacturerOid,
            category: { $in: auth.categories },
            status: 'active'
          }).select('_id').lean()
          products.forEach(p => {
            authorizedProductIds.add(p._id.toString())
            authByProduct.set(p._id.toString(), auth)
          })
        }
        ;(auth.products || []).forEach(pid => {
          authorizedProductIds.add(pid.toString())
          authByProduct.set(pid.toString(), auth)
        })
      }
    }

    // 查询商品详情
    const productQuery = {
      _id: { $in: Array.from(authorizedProductIds) },
      status: 'active'
    }
    if (category) productQuery.category = category

    const total = await Product.countDocuments(productQuery)
    const products = await Product.find(productQuery)
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .populate('manufacturerId', 'name')
      .lean()

    // 添加授权价格信息
    const productsWithAuthPrice = products.map(product => {
      const auth = authByProduct.get(product._id.toString())
      const Authorization = require('../models/Authorization')
      const authModel = new Authorization(auth)
      
      return {
        ...product,
        authorizedPrice: authModel.getAuthorizedPrice(product),
        authorizationInfo: {
          fromManufacturer: auth.fromManufacturer,
          discount: auth.priceSettings.globalDiscount
        }
      }
    })

    res.json({ 
      success: true, 
      data: productsWithAuthPrice,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    })
  } catch (error) {
    console.error('获取授权商品失败:', error)
    res.status(500).json({ success: false, message: '获取授权商品失败' })
  }
})

// GET /api/authorizations/products/:productId/price - 获取商品的授权价格
router.get('/products/:productId/price', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const product = await Product.findById(req.params.productId).lean()
    
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }

    // 检查是否是商品所属厂家
    if (user.manufacturerId?.toString() === product.manufacturerId?.toString()) {
      return res.json({
        success: true,
        data: {
          basePrice: product.basePrice,
          isOwner: true
        }
      })
    }

    // 查找授权
    const query = {
      status: 'active',
      $or: [
        { validUntil: { $exists: false } },
        { validUntil: { $gt: new Date() } }
      ]
    }

    if (user.role === 'designer') {
      query.toDesigner = req.userId
    } else if (user.manufacturerId) {
      query.toManufacturer = user.manufacturerId
    }

    const authorizations = await Authorization.find(query).lean()
    
    for (const auth of authorizations) {
      let hasAuth = false
      
      if (auth.scope === 'all' && auth.fromManufacturer.toString() === product.manufacturerId.toString()) {
        hasAuth = true
      } else if (auth.scope === 'category' && auth.categories.includes(product.category)) {
        hasAuth = true
      } else if (auth.scope === 'specific' && auth.products.some(p => p.toString() === req.params.productId)) {
        hasAuth = true
      } else if (auth.scope === 'mixed') {
        const byCategory = Array.isArray(auth.categories) && auth.categories.includes(product.category)
        const byProduct = Array.isArray(auth.products) && auth.products.some(p => p.toString() === req.params.productId)
        hasAuth = Boolean(byCategory || byProduct)
      }
      
      if (hasAuth) {
        const Authorization = require('../models/Authorization')
        const authModel = new Authorization(auth)
        const authorizedPrice = authModel.getAuthorizedPrice(product)
        
        return res.json({
          success: true,
          data: {
            basePrice: product.basePrice,
            authorizedPrice,
            discount: authorizedPrice / product.basePrice,
            isOwner: false
          }
        })
      }
    }

    res.status(403).json({ success: false, message: '您没有此商品的授权' })
  } catch (error) {
    console.error('获取授权价格失败:', error)
    res.status(500).json({ success: false, message: '获取授权价格失败' })
  }
})

// PUT /api/authorizations/product-override/:productId - 更新授权商品的本地覆盖设置（价格、可见性）
router.put('/product-override/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params
    const { price, hidden } = req.body
    
    const user = await User.findById(req.userId).select('manufacturerId').lean()
    if (!user?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以操作' })
    }
    
    // 查找该商品
    const Product = require('../models/Product')
    const product = await Product.findById(productId).lean()
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    
    // 获取商品的厂家ID（可能在product.manufacturerId或skus[0].manufacturerId）
    const productManufacturerId = product.manufacturerId || product.skus?.[0]?.manufacturerId
    if (!productManufacturerId) {
      return res.status(400).json({ success: false, message: '商品没有关联厂家' })
    }
    
    // 检查是否有该商品的授权
    console.log('[product-override] 查找授权:', { productId, productManufacturerId, userManufacturerId: user.manufacturerId })
    const authorization = await Authorization.findOne({
      fromManufacturer: productManufacturerId,
      $or: [
        { toManufacturer: user.manufacturerId },
        { toDesigner: req.userId }
      ],
      status: 'active'
    })
    
    if (!authorization) {
      console.log('[product-override] 未找到授权')
      return res.status(403).json({ success: false, message: '您没有该商品的授权' })
    }
    
    console.log('[product-override] 找到授权:', authorization._id)
    
    // 验证价格下限（60%）
    if (price !== undefined) {
      const originalPrice = product.skus?.[0]?.price || product.basePrice || 0
      const minAllowed = originalPrice * 0.6
      if (price < minAllowed) {
        return res.status(400).json({ 
          success: false, 
          message: `价格不能低于授权标价的60%（最低 ¥${Math.ceil(minAllowed)}）` 
        })
      }
    }
    
    // 更新或创建商品覆盖设置
    if (!authorization.productOverrides) {
      authorization.productOverrides = new Map()
    }
    
    // 获取现有的覆盖设置或创建新的
    const existingOverride = authorization.productOverrides.get(productId)
    const updatedOverride = {
      price: existingOverride?.price,
      hidden: existingOverride?.hidden
    }
    
    if (price !== undefined) {
      updatedOverride.price = price
    }
    if (hidden !== undefined) {
      updatedOverride.hidden = hidden
    }
    
    // 使用Map的set方法更新
    console.log('[product-override] 更新前:', { productId, existingOverride, updatedOverride })
    authorization.productOverrides.set(productId, updatedOverride)
    authorization.markModified('productOverrides')
    
    const saveResult = await authorization.save()
    console.log('[product-override] 保存成功:', { authId: saveResult._id, updatedAt: saveResult.updatedAt })
    
    const finalData = authorization.productOverrides.get(productId)
    console.log('[product-override] 最终数据:', finalData)
    
    res.json({ 
      success: true, 
      data: finalData,
      message: price !== undefined ? '价格已更新' : (hidden ? '商品已隐藏' : '商品已显示')
    })
  } catch (error) {
    console.error('更新授权商品覆盖设置失败:', error)
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

// GET /api/authorizations/product-overrides - 获取所有授权商品的覆盖设置
router.get('/product-overrides', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('manufacturerId').lean()
    if (!user?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以操作' })
    }
    
    const authorizations = await Authorization.find({
      $or: [
        { toManufacturer: user.manufacturerId },
        { toDesigner: req.userId }
      ],
      status: 'active'
    }).select('productOverrides').lean()
    
    const allOverrides = {}
    for (const auth of authorizations) {
      if (auth.productOverrides) {
        // productOverrides是Map类型，需要转换为普通对象
        if (auth.productOverrides instanceof Map) {
          auth.productOverrides.forEach((value, key) => {
            allOverrides[key] = value
          })
        } else {
          // 兼容旧数据格式
          Object.assign(allOverrides, auth.productOverrides)
        }
      }
    }
    
    res.json({ success: true, data: allOverrides })
  } catch (error) {
    console.error('获取授权商品覆盖设置失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// GET /api/authorizations/gmv-stats - 获取授权渠道的GMV统计
router.get('/gmv-stats', auth, async (req, res) => {
  try {
    const { manufacturerId } = req.query
    const Order = require('../models/Order')
    
    // 获取该厂家发出的所有授权
    const authorizations = await Authorization.find({
      fromManufacturer: manufacturerId,
      status: 'active'
    }).lean()
    
    const gmvData = {}
    
    for (const auth of authorizations) {
      const targetId = auth.authorizationType === 'manufacturer' 
        ? String(auth.toManufacturer)
        : String(auth.toDesigner)
      
      // 查询该渠道的订单GMV
      let orderQuery = { status: { $in: [2, 3, 4, 5] } } // 已付款及之后状态
      
      if (auth.authorizationType === 'designer') {
        orderQuery.designerId = auth.toDesigner
      }
      // 对于厂家授权，统计包含该厂家商品的订单
      
      const orders = await Order.find(orderQuery).select('totalAmount items').lean()
      
      let gmv = 0
      for (const order of orders) {
        // 计算属于授权商品的金额
        const items = order.items || []
        for (const item of items) {
          if (String(item.manufacturerId) === String(manufacturerId)) {
            gmv += (item.price || 0) * (item.quantity || 1)
          }
        }
      }
      
      gmvData[targetId] = gmv
    }
    
    res.json({ success: true, data: gmvData })
  } catch (error) {
    console.error('获取GMV统计失败:', error)
    res.status(500).json({ success: false, message: '获取GMV统计失败' })
  }
})

// PUT /api/authorizations/:id/toggle-status - 切换授权状态（暂停/恢复合作）
router.put('/:id/toggle-status', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { active } = req.body
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID无效' })
    }
    
    const authorization = await Authorization.findById(id)
    if (!authorization) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }
    
    const user = await User.findById(req.userId).select('role manufacturerId').lean()
    if (!user) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }
    
    const isAdmin = ['admin', 'super_admin'].includes(user.role)
    const isRecipient = user.manufacturerId && String(authorization.toManufacturer) === String(user.manufacturerId)
    
    if (!isAdmin && !isRecipient) {
      return res.status(403).json({ success: false, message: '无权限操作此授权' })
    }
    
    authorization.status = active ? 'active' : 'suspended'
    await authorization.save()
    
    res.json({ success: true, data: authorization, message: active ? '已恢复合作' : '已暂停合作' })
  } catch (error) {
    console.error('切换授权状态失败:', error)
    res.status(500).json({ success: false, message: '切换授权状态失败' })
  }
})

// PUT /api/authorizations/:id/toggle-enabled - 切换授权商品显示（开启/关闭）
router.put('/:id/toggle-enabled', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { enabled } = req.body
    
    console.log('[toggle-enabled] Request:', { id, enabled, userId: req.userId })
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID无效' })
    }
    
    const authorization = await Authorization.findById(id)
    if (!authorization) {
      console.log('[toggle-enabled] Authorization not found:', id)
      return res.status(404).json({ success: false, message: '授权不存在' })
    }
    
    console.log('[toggle-enabled] Found authorization:', {
      _id: authorization._id,
      fromManufacturer: authorization.fromManufacturer,
      toManufacturer: authorization.toManufacturer,
      currentIsEnabled: authorization.isEnabled
    })
    
    const user = await User.findById(req.userId).select('role manufacturerId').lean()
    if (!user) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }
    
    const isAdmin = ['admin', 'super_admin'].includes(user.role)
    const isRecipient = user.manufacturerId && String(authorization.toManufacturer) === String(user.manufacturerId)
    
    if (!isAdmin && !isRecipient) {
      return res.status(403).json({ success: false, message: '无权限操作此授权' })
    }
    
    authorization.isEnabled = enabled
    await authorization.save()
    
    console.log('[toggle-enabled] Saved successfully:', {
      _id: authorization._id,
      newIsEnabled: authorization.isEnabled
    })
    
    res.json({ success: true, data: authorization, message: enabled ? '已开启商品显示' : '已关闭商品显示' })
  } catch (error) {
    console.error('切换授权显示状态失败:', error)
    res.status(500).json({ success: false, message: '切换显示状态失败' })
  }
})

// PUT /api/authorizations/:id/pricing - 更新授权价格设置
router.put('/:id/pricing', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { priceSettings } = req.body
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID无效' })
    }
    
    const authorization = await Authorization.findById(id)
    if (!authorization) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }
    
    const user = await User.findById(req.userId).select('role manufacturerId').lean()
    if (!user) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }
    
    const isAdmin = ['admin', 'super_admin'].includes(user.role)
    const isOwner = user.manufacturerId && String(authorization.fromManufacturer) === String(user.manufacturerId)
    
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: '无权限修改此授权的价格设置' })
    }
    
    authorization.priceSettings = {
      ...authorization.priceSettings,
      ...priceSettings
    }
    await authorization.save()
    
    res.json({ success: true, data: authorization, message: '价格设置已更新' })
  } catch (error) {
    console.error('更新授权价格设置失败:', error)
    res.status(500).json({ success: false, message: '更新授权价格设置失败' })
  }
})

// GET /api/authorizations/:id - 获取授权详情 (放在最后，避免捕获其他/:id/xxx路由)
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID无效' })
    }
    
    const authorization = await Authorization.findById(id)
      .populate('toManufacturer', 'name logo fullName')
      .populate('toDesigner', 'nickname username avatar')
      .populate('fromManufacturer', 'name logo fullName')
      .lean()
    
    if (!authorization) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }
    
    res.json({ success: true, data: authorization })
  } catch (error) {
    console.error('获取授权详情失败:', error)
    res.status(500).json({ success: false, message: '获取授权详情失败' })
  }
})

// GET /api/authorizations/:id/products - 获取授权商品列表
router.get('/:id/products', auth, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID无效' })
    }
    
    const authorization = await Authorization.findById(id).lean()
    if (!authorization) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }
    
    let products = []
    
    if (authorization.scope === 'all') {
      // 全部商品
      products = await Product.find({ 
        manufacturerId: authorization.fromManufacturer,
        status: 'active'
      }).select('name productCode images basePrice skus category').populate('category', 'name').lean()
    } else if (authorization.scope === 'category') {
      // 按分类
      products = await Product.find({
        manufacturerId: authorization.fromManufacturer,
        category: { $in: authorization.categories || [] },
        status: 'active'
      }).select('name productCode images basePrice skus category').populate('category', 'name').lean()
    } else if (authorization.scope === 'specific' || authorization.scope === 'mixed') {
      // 指定商品
      products = await Product.find({
        _id: { $in: authorization.products || [] },
        status: 'active'
      }).select('name productCode images basePrice skus category').populate('category', 'name').lean()
    }
    
    res.json({ success: true, data: products })
  } catch (error) {
    console.error('获取授权商品列表失败:', error)
    res.status(500).json({ success: false, message: '获取授权商品列表失败' })
  }
})

module.exports = router
