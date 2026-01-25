const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const { auth, requireRole } = require('../middleware/auth')
const { USER_ROLES } = require('../config/constants')
const { list, listAll, get, create, update, remove } = require('../controllers/manufacturerController')
const manufacturerAccountController = require('../controllers/manufacturerAccountController')
const { sendVerificationCode, verifyCode } = require('../services/smsService')
const { recognizeBusinessLicense } = require('../services/ocrService')
const Product = require('../models/Product')
const Category = require('../models/Category')
const ManufacturerModel = require('../models/Manufacturer')

// 管理员角色列表（包含旧的 admin 角色）
const ADMIN_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.PLATFORM_ADMIN,
  USER_ROLES.ENTERPRISE_ADMIN,
  USER_ROLES.ENTERPRISE_STAFF,
  'admin',
  'super_admin'
]

const PLATFORM_ONLY_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.PLATFORM_ADMIN,
  'admin',
  'super_admin'
]

const canAccessManufacturer = (user, manufacturerId) => {
  if (!user) return false
  if (PLATFORM_ONLY_ROLES.includes(user.role)) return true
  const mid = String(manufacturerId)
  if (user.manufacturerId && String(user.manufacturerId) === mid) return true
  if (Array.isArray(user.manufacturerIds) && user.manufacturerIds.map(String).includes(mid)) return true
  return false
}

// ========== 公开路由（不需要认证） ==========

// GET /api/manufacturers/:manufacturerId/product-categories - 获取厂家商品分类（公开）
router.get('/:manufacturerId/product-categories', async (req, res) => {
  try {
    const { manufacturerId } = req.params
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }

    const mid = new mongoose.Types.ObjectId(manufacturerId)
    
    // 获取厂家信息用于名称匹配
    const manufacturer = await ManufacturerModel.findById(mid).select('name fullName shortName code').lean()
    const manufacturerNames = [
      manufacturer?.name,
      manufacturer?.fullName,
      manufacturer?.shortName,
      manufacturer?.code
    ].filter(Boolean)
    
    // 方法1: 通过商品的manufacturerId查询
    // 方法2: 通过商品的manufacturerName查询（兼容旧数据）
    const productQuery = {
      status: 'active',
      $or: [
        { manufacturerId: mid },
        { 'skus.manufacturerId': mid }
      ]
    }
    
    // 如果有厂家名称，也通过名称匹配
    if (manufacturerNames.length > 0) {
      productQuery.$or.push({ manufacturerName: { $in: manufacturerNames } })
      productQuery.$or.push({ 'skus.manufacturerName': { $in: manufacturerNames } })
    }
    
    const products = await Product.find(productQuery).select('category').lean()

    const countByCategoryId = new Map()
    for (const p of products) {
      const c = p?.category
      let categoryId = null
      if (typeof c === 'string') {
        categoryId = c
      } else if (c && typeof c === 'object') {
        categoryId = c._id || c.id || c.slug
      }
      if (!categoryId) continue
      const key = String(categoryId)
      countByCategoryId.set(key, (countByCategoryId.get(key) || 0) + 1)
    }

    // 方法2: 直接查询厂家关联的分类（作为备选）
    const manufacturerCategories = await Category.find({ 
      manufacturerId: mid,
      status: { $ne: 'inactive' }
    }).select('_id name parentId').lean()
    
    // 合并厂家分类（如果商品查询没有结果）
    for (const cat of manufacturerCategories) {
      const catId = String(cat._id)
      if (!countByCategoryId.has(catId)) {
        const catProductCount = await Product.countDocuments({
          status: 'active',
          $or: [
            { category: cat._id },
            { 'category._id': cat._id },
            { category: catId }
          ]
        })
        countByCategoryId.set(catId, catProductCount)
      }
    }

    const categoryIds = Array.from(countByCategoryId.keys())
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id))

    const categories = categoryIds.length > 0
      ? await Category.find({ _id: { $in: categoryIds } }).select('_id name parentId').lean()
      : []

    const categoryById = new Map(categories.map(c => [String(c._id), c]))
    const data = Array.from(countByCategoryId.entries())
      .map(([id, count]) => {
        const cat = categoryById.get(id)
        return {
          id,
          name: cat?.name || id,
          parentId: cat?.parentId ? String(cat.parentId) : null,
          count
        }
      })
      .sort((a, b) => b.count - a.count)

    res.json({ success: true, data })
  } catch (error) {
    console.error('获取厂家商品分类失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// GET /api/manufacturers/:manufacturerId/products - 获取厂家商品（公开）
router.get('/:manufacturerId/products', async (req, res) => {
  try {
    const { manufacturerId } = req.params
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }

    const { status = 'active', limit = 2000 } = req.query

    const mid = new mongoose.Types.ObjectId(manufacturerId)
    
    // 获取厂家信息用于名称匹配
    const manufacturer = await ManufacturerModel.findById(mid).select('name fullName shortName code').lean()
    const manufacturerNames = [
      manufacturer?.name,
      manufacturer?.fullName,
      manufacturer?.shortName,
      manufacturer?.code
    ].filter(Boolean)
    
    const query = {
      $or: [
        { manufacturerId: mid },
        { 'skus.manufacturerId': mid }
      ]
    }
    
    // 如果有厂家名称，也通过名称匹配
    if (manufacturerNames.length > 0) {
      query.$or.push({ manufacturerName: { $in: manufacturerNames } })
      query.$or.push({ 'skus.manufacturerName': { $in: manufacturerNames } })
    }
    
    if (status && status !== 'all') {
      query.status = status
    }

    const products = await Product.find(query)
      .select('_id name productCode category thumbnail images status basePrice skus')
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 10000, 20000))
      .lean()

    res.json({ success: true, data: products })
  } catch (error) {
    console.error('获取厂家商品失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// ========== 需要认证的路由 ==========
router.use(auth)

// GET /api/manufacturers - 获取厂家列表（分页）
router.get('/', list)

// GET /api/manufacturers/all - 获取所有厂家（不分页，用于下拉选择）
router.get('/all', listAll)

// ========== 厂家短信通知绑定（管理员按厂家维度操作） ==========

// GET /api/manufacturers/:manufacturerId/sms/status
router.get('/:manufacturerId/sms/status', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { manufacturerId } = req.params
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }
    if (!canAccessManufacturer(req.user, manufacturerId)) {
      return res.status(403).json({ success: false, message: '无权限执行此操作' })
    }

    const manufacturer = await ManufacturerModel.findById(manufacturerId)
      .select('settings.smsNotifyPhone settings.smsNotifyVerifiedAt')
      .lean()
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }

    res.json({
      success: true,
      data: {
        smsNotifyPhone: manufacturer?.settings?.smsNotifyPhone || '',
        smsNotifyVerifiedAt: manufacturer?.settings?.smsNotifyVerifiedAt || null
      }
    })
  } catch (error) {
    console.error('获取厂家短信绑定状态失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// POST /api/manufacturers/:manufacturerId/sms/bind  (保存手机号，未验证)
router.post('/:manufacturerId/sms/bind', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { phone } = req.body || {}
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }
    if (!canAccessManufacturer(req.user, manufacturerId)) {
      return res.status(403).json({ success: false, message: '无权限执行此操作' })
    }
    if (!phone || !/^1[3-9]\d{9}$/.test(String(phone).trim())) {
      return res.status(400).json({ success: false, message: '请输入有效的手机号' })
    }

    const manufacturer = await ManufacturerModel.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }

    manufacturer.settings = {
      ...(manufacturer.settings?.toObject?.() || manufacturer.settings || {}),
      smsNotifyPhone: String(phone).trim(),
      smsNotifyVerifiedAt: null
    }
    await manufacturer.save()

    res.json({
      success: true,
      message: '手机号已绑定，请发送验证码完成验证',
      data: {
        smsNotifyPhone: manufacturer.settings?.smsNotifyPhone || '',
        smsNotifyVerifiedAt: manufacturer.settings?.smsNotifyVerifiedAt || null
      }
    })
  } catch (error) {
    console.error('管理员绑定厂家手机号失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// POST /api/manufacturers/:manufacturerId/sms/send-code
router.post('/:manufacturerId/sms/send-code', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { manufacturerId } = req.params
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }
    if (!canAccessManufacturer(req.user, manufacturerId)) {
      return res.status(403).json({ success: false, message: '无权限执行此操作' })
    }

    const manufacturer = await ManufacturerModel.findById(manufacturerId)
      .select('settings.smsNotifyPhone')
      .lean()
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }

    const boundPhone = manufacturer?.settings?.smsNotifyPhone || ''
    if (!boundPhone) {
      return res.status(400).json({ success: false, message: '请先绑定手机号' })
    }

    const result = await sendVerificationCode(boundPhone)
    if (!result?.success) {
      return res.status(400).json({ success: false, message: result?.message || '发送失败' })
    }

    res.json({ success: true, message: '验证码已发送' })
  } catch (error) {
    console.error('管理员发送厂家验证码失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// POST /api/manufacturers/:manufacturerId/sms/verify
router.post('/:manufacturerId/sms/verify', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { manufacturerId } = req.params
    const { code } = req.body || {}
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }
    if (!canAccessManufacturer(req.user, manufacturerId)) {
      return res.status(403).json({ success: false, message: '无权限执行此操作' })
    }
    if (!code) {
      return res.status(400).json({ success: false, message: '请输入验证码' })
    }

    const manufacturer = await ManufacturerModel.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }

    const boundPhone = manufacturer?.settings?.smsNotifyPhone || ''
    if (!boundPhone) {
      return res.status(400).json({ success: false, message: '请先绑定手机号' })
    }

    const ok = verifyCode(boundPhone, code)
    if (!ok) {
      return res.status(400).json({ success: false, message: '验证码无效或已过期' })
    }

    manufacturer.settings = {
      ...(manufacturer.settings?.toObject?.() || manufacturer.settings || {}),
      smsNotifyPhone: String(boundPhone).trim(),
      smsNotifyVerifiedAt: new Date()
    }
    await manufacturer.save()

    res.json({
      success: true,
      message: '验证成功',
      data: {
        smsNotifyPhone: manufacturer.settings?.smsNotifyPhone || '',
        smsNotifyVerifiedAt: manufacturer.settings?.smsNotifyVerifiedAt || null
      }
    })
  } catch (error) {
    console.error('管理员验证厂家手机号失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// POST /api/manufacturers/:manufacturerId/sms/unbind
router.post('/:manufacturerId/sms/unbind', requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const { manufacturerId } = req.params
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }
    if (!canAccessManufacturer(req.user, manufacturerId)) {
      return res.status(403).json({ success: false, message: '无权限执行此操作' })
    }

    const manufacturer = await ManufacturerModel.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }

    manufacturer.settings = {
      ...(manufacturer.settings?.toObject?.() || manufacturer.settings || {}),
      smsNotifyPhone: '',
      smsNotifyVerifiedAt: null
    }
    await manufacturer.save()

    res.json({ success: true, message: '已解绑' })
  } catch (error) {
    console.error('管理员解绑厂家手机号失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// GET /api/manufacturers/me - 获取当前登录厂家的信息
router.get('/me', async (req, res) => {
  try {
    // 从用户信息中获取厂家ID（需要厂家登录后设置）
    const manufacturerId = req.manufacturerId || req.user?.manufacturerId
    
    if (!manufacturerId) {
      return res.status(400).json({ success: false, message: '未找到厂家信息，请重新登录' })
    }
    
    const manufacturer = await ManufacturerModel.findById(manufacturerId)
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }
    
    res.json({ success: true, data: manufacturer })
  } catch (error) {
    console.error('获取厂家信息失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// GET /api/manufacturers/:id - 获取单个厂家
router.get('/:id', get)

// POST /api/manufacturers - 创建厂家
router.post('/', create)

// PUT /api/manufacturers/:id - 更新厂家
router.put('/:id', update)

// DELETE /api/manufacturers/:id - 删除厂家
router.delete('/:id', remove)

// POST /api/manufacturers/:id/set-password - 设置厂家登录账号密码
const Manufacturer = require('../models/Manufacturer')
router.post('/:id/set-password', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请提供用户名和密码' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: '密码至少6位' })
    }
    
    // 检查用户名是否已存在
    const existing = await Manufacturer.findOne({ username, _id: { $ne: req.params.id } })
    if (existing) {
      return res.status(400).json({ success: false, message: '用户名已被使用' })
    }
    
    const manufacturer = await Manufacturer.findById(req.params.id)
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' })
    }
    
    manufacturer.username = username
    manufacturer.password = password
    await manufacturer.save()
    
    res.json({ success: true, message: '账号密码设置成功' })
  } catch (error) {
    console.error('设置密码失败:', error)
    res.status(500).json({ success: false, message: '服务器错误' })
  }
})

// ========== 厂家账号管理 ==========

// GET /api/manufacturers/:manufacturerId/accounts - 获取厂家的所有账号
router.get('/:manufacturerId/accounts', manufacturerAccountController.getAccounts)

// POST /api/manufacturers/:manufacturerId/accounts - 创建厂家账号
router.post('/:manufacturerId/accounts', manufacturerAccountController.createAccount)

// PUT /api/manufacturers/:manufacturerId/accounts/:accountId - 更新厂家账号
router.put('/:manufacturerId/accounts/:accountId', manufacturerAccountController.updateAccount)

// DELETE /api/manufacturers/:manufacturerId/accounts/:accountId - 删除厂家账号
router.delete('/:manufacturerId/accounts/:accountId', manufacturerAccountController.deleteAccount)

// POST /api/manufacturers/:manufacturerId/accounts/:accountId/reset-password - 重置账号密码
router.post('/:manufacturerId/accounts/:accountId/reset-password', manufacturerAccountController.resetPassword)

// ========== 厂家设置管理 ==========

// PUT /api/manufacturers/:manufacturerId/settings - 更新厂家设置（LOGO、电话、收款信息）
router.put('/:manufacturerId/settings', manufacturerAccountController.updateSettings)

// ========== 企业认证 ==========

// POST /api/manufacturers/:manufacturerId/certification - 提交企业认证
router.post('/:manufacturerId/certification', manufacturerAccountController.submitCertification)

// PUT /api/manufacturers/:manufacturerId/certification/review - 审核企业认证（管理员）
router.put('/:manufacturerId/certification/review', manufacturerAccountController.reviewCertification)

// ========== 厂家ID重新生成 ==========

// POST /api/manufacturers/regenerate-codes - 重新生成所有厂家的英文ID
router.post('/regenerate-codes', requireRole(PLATFORM_ONLY_ROLES), async (req, res) => {
  try {
    const manufacturers = await ManufacturerModel.find({})
    let updated = 0
    
    for (const m of manufacturers) {
      if (m.shortName) {
        // 强制重新生成code
        m.code = undefined
        await m.save()
        updated++
      }
    }
    
    res.json({ success: true, message: `已更新 ${updated} 个厂家的ID`, updated })
  } catch (error) {
    console.error('重新生成厂家ID失败:', error)
    res.status(500).json({ success: false, message: '重新生成失败', error: error.message })
  }
})

// ========== OCR识别 ==========

// POST /api/manufacturers/ocr/business-license - 营业执照OCR识别
router.post('/ocr/business-license', async (req, res) => {
  try {
    const { imageUrl } = req.body
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: '请提供图片URL' })
    }
    
    const result = await recognizeBusinessLicense(imageUrl)
    res.json(result)
  } catch (error) {
    console.error('OCR识别失败:', error)
    res.status(500).json({ success: false, message: '识别失败', error: error.message })
  }
})

module.exports = router
