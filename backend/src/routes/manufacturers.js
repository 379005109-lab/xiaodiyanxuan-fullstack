const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { list, listAll, get, create, update, remove } = require('../controllers/manufacturerController')
const manufacturerAccountController = require('../controllers/manufacturerAccountController')
const Product = require('../models/Product')
const Category = require('../models/Category')

// 需要认证
router.use(auth)

// GET /api/manufacturers - 获取厂家列表（分页）
router.get('/', list)

// GET /api/manufacturers/all - 获取所有厂家（不分页，用于下拉选择）
router.get('/all', listAll)

// GET /api/manufacturers/me - 获取当前登录厂家的信息
const ManufacturerModel = require('../models/Manufacturer')
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

router.get('/:manufacturerId/product-categories', async (req, res) => {
  try {
    const { manufacturerId } = req.params
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }

    const mid = new mongoose.Types.ObjectId(manufacturerId)
    const products = await Product.find({
      status: 'active',
      $or: [{ manufacturerId: mid }, { 'skus.manufacturerId': mid }]
    }).select('category').lean()

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

router.get('/:manufacturerId/products', async (req, res) => {
  try {
    const { manufacturerId } = req.params
    if (!manufacturerId || !mongoose.Types.ObjectId.isValid(manufacturerId)) {
      return res.status(400).json({ success: false, message: 'manufacturerId 无效' })
    }

    const { status = 'active', limit = 2000 } = req.query

    const mid = new mongoose.Types.ObjectId(manufacturerId)
    const query = {
      $or: [{ manufacturerId: mid }, { 'skus.manufacturerId': mid }]
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

module.exports = router
