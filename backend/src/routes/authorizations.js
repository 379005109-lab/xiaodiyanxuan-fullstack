const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { auth } = require('../middleware/auth')
const Authorization = require('../models/Authorization')
const Product = require('../models/Product')
const Manufacturer = require('../models/Manufacturer')
const User = require('../models/User')

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

// ==================== 查询授权 ====================

// GET /api/authorizations/my-grants - 我授权给别人的
router.get('/my-grants', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (!user.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以查看授权' })
    }

    const authorizations = await Authorization.find({
      fromManufacturer: user.manufacturerId
    })
      .populate('toManufacturer', 'name contactPerson')
      .populate('toDesigner', 'username email')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: authorizations })
  } catch (error) {
    console.error('获取授权列表失败:', error)
    res.status(500).json({ success: false, message: '获取授权列表失败' })
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
      .populate('fromManufacturer', 'name contactPerson')
      .populate('products', 'name basePrice thumbnail')
      .sort({ createdAt: -1 })
      .lean()

    res.json({ success: true, data: authorizations })
  } catch (error) {
    console.error('获取授权列表失败:', error)
    res.status(500).json({ success: false, message: '获取授权列表失败' })
  }
})

router.post('/designer-requests', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    if (!currentUser || currentUser.role !== 'designer') {
      return res.status(403).json({ success: false, message: '只有设计师可以申请厂家授权' })
    }

    const { manufacturerId, notes } = req.body
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

    const authorization = await Authorization.create({
      fromManufacturer: manufacturerId,
      toDesigner: req.userId,
      authorizationType: 'designer',
      scope: 'all',
      categories: [],
      products: [],
      priceSettings: {
        globalDiscount: 1,
        categoryDiscounts: [],
        productPrices: []
      },
      status: 'pending',
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
    if (!currentUser || currentUser.role !== 'designer') {
      return res.status(403).json({ success: false, message: '只有设计师可以查看申请记录' })
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
    if (!currentUser?.manufacturerId) {
      return res.status(403).json({ success: false, message: '只有厂家用户可以查看授权申请' })
    }

    const list = await Authorization.find({
      fromManufacturer: currentUser.manufacturerId,
      authorizationType: 'designer',
      status: 'pending'
    })
      .populate('toDesigner', 'username nickname phone email')
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
    if (!currentUser?.manufacturerId) {
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

    if (authDoc.authorizationType !== 'designer' || authDoc.fromManufacturer?.toString() !== currentUser.manufacturerId.toString()) {
      return res.status(403).json({ success: false, message: '无权限审核此申请' })
    }

    if (authDoc.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该申请不是待审核状态' })
    }

    const { scope, categories, products, priceSettings, validUntil, notes } = req.body
    if (scope) authDoc.scope = scope
    if (categories !== undefined) authDoc.categories = categories
    if (products !== undefined) authDoc.products = products
    if (priceSettings) authDoc.priceSettings = priceSettings
    if (validUntil !== undefined) authDoc.validUntil = validUntil
    if (notes !== undefined) authDoc.notes = notes

    authDoc.status = 'active'
    authDoc.updatedAt = new Date()
    await authDoc.save()

    if (authDoc.toDesigner) {
      const designer = await User.findById(authDoc.toDesigner)
      if (designer && designer.role === 'designer') {
        await User.findByIdAndUpdate(
          designer._id,
          {
            $set: { manufacturerId: null },
            $addToSet: { manufacturerIds: currentUser.manufacturerId }
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
    if (!currentUser?.manufacturerId) {
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

    if (authDoc.authorizationType !== 'designer' || authDoc.fromManufacturer?.toString() !== currentUser.manufacturerId.toString()) {
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

// GET /api/authorizations/:id - 获取授权详情
router.get('/:id', auth, async (req, res) => {
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

    // 权限检查：只有相关方可以查看
    const user = await User.findById(req.userId)
    const isAuthorized = 
      authorization.fromManufacturer._id.toString() === user.manufacturerId?.toString() ||
      authorization.toManufacturer?._id.toString() === user.manufacturerId?.toString() ||
      authorization.toDesigner?._id.toString() === req.userId.toString()

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
router.put('/:id', auth, async (req, res) => {
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

// DELETE /api/authorizations/:id - 撤销授权
router.delete('/:id', auth, async (req, res) => {
  try {
    const authorization = await Authorization.findById(req.params.id)
    if (!authorization) {
      return res.status(404).json({ success: false, message: '授权不存在' })
    }

    // 权限检查
    const user = await User.findById(req.userId)
    if (authorization.fromManufacturer.toString() !== user.manufacturerId?.toString()) {
      return res.status(403).json({ success: false, message: '只有授权方可以撤销授权' })
    }

    authorization.status = 'revoked'
    authorization.updatedAt = new Date()
    await authorization.save()

    res.json({ success: true, message: '授权已撤销' })
  } catch (error) {
    console.error('撤销授权失败:', error)
    res.status(500).json({ success: false, message: '撤销授权失败' })
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

module.exports = router
