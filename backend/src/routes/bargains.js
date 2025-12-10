const express = require('express')
const multer = require('multer')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')
const BargainProduct = require('../models/BargainProduct')
const Bargain = require('../models/Bargain')
const Product = require('../models/Product')

// 配置 multer
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`))
    }
  }
})

// ==================== 砍价商品管理（管理后台） ====================

// GET /api/bargains/products - 获取砍价商品列表（管理后台）
router.get('/products', auth, async (req, res) => {
  try {
    const { status, category, page = 1, pageSize = 20 } = req.query
    const query = {}
    if (status) query.status = status
    if (category) query.category = category
    
    const total = await BargainProduct.countDocuments(query)
    const products = await BargainProduct.find(query)
      .sort({ sortOrder: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()
    
    res.json({ success: true, data: products, total, page: parseInt(page), pageSize: parseInt(pageSize) })
  } catch (error) {
    console.error('获取砍价商品列表失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// POST /api/bargains/products - 创建砍价商品
router.post('/products', auth, async (req, res) => {
  try {
    const { name, coverImage, originalPrice, targetPrice, category, style, minCutAmount, maxCutAmount, maxHelpers, sortOrder } = req.body
    
    if (!name || !originalPrice || !targetPrice) {
      return res.status(400).json({ success: false, message: '商品名称、原价和目标价必填' })
    }
    
    if (targetPrice >= originalPrice) {
      return res.status(400).json({ success: false, message: '目标价必须低于原价' })
    }
    
    const product = await BargainProduct.create({
      name,
      coverImage,
      originalPrice,
      targetPrice,
      category: category || '沙发',
      style: style || '现代简约',
      minCutAmount: minCutAmount || 1,
      maxCutAmount: maxCutAmount || 50,
      maxHelpers: maxHelpers || 20,
      sortOrder: sortOrder || 0,
      status: 'active'
    })
    
    res.json({ success: true, data: product, message: '创建成功' })
  } catch (error) {
    console.error('创建砍价商品失败:', error)
    res.status(500).json({ success: false, message: '创建失败' })
  }
})

// PUT /api/bargains/products/:id - 更新砍价商品
router.put('/products/:id', auth, async (req, res) => {
  try {
    const updates = req.body
    updates.updatedAt = new Date()
    
    const product = await BargainProduct.findByIdAndUpdate(req.params.id, updates, { new: true })
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    
    res.json({ success: true, data: product, message: '更新成功' })
  } catch (error) {
    console.error('更新砍价商品失败:', error)
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

// DELETE /api/bargains/products/:id - 删除砍价商品
router.delete('/products/:id', auth, async (req, res) => {
  try {
    await BargainProduct.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除砍价商品失败:', error)
    res.status(500).json({ success: false, message: '删除失败' })
  }
})

// ==================== 小程序端接口 ====================

// GET /api/bargains - 获取可砍价商品列表（小程序首页展示）
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, style, page = 1, pageSize = 20 } = req.query
    const query = { status: 'active' }
    if (category && category !== '全部') query.category = category
    if (style && style !== '全部') query.style = style
    
    const products = await BargainProduct.find(query)
      .sort({ sortOrder: -1, createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()
    
    // 获取关联商品的材质数据
    const productIds = products.filter(p => p.productId).map(p => p.productId)
    const relatedProducts = await Product.find({ _id: { $in: productIds } }).lean()
    const productMap = new Map(relatedProducts.map(p => [p._id.toString(), p]))
    
    // 合并材质数据到砍价商品
    const enrichedProducts = products.map(bp => {
      const product = bp.productId ? productMap.get(bp.productId.toString()) : null
      return {
        ...bp,
        materialsGroups: product?.materialsGroups || [],
        materialImages: product?.materialImages || null,
        materialCategories: product?.materialCategories || []
      }
    })
    
    res.json({ success: true, data: enrichedProducts })
  } catch (error) {
    console.error('获取砍价商品列表失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// GET /api/bargains/:id - 获取砍价详情
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const bargain = await Bargain.findById(req.params.id).lean()
    if (!bargain) {
      return res.status(404).json({ success: false, message: '砍价活动不存在' })
    }
    
    // 获取商品详情
    const product = await BargainProduct.findById(bargain.productId).lean()
    
    // 获取帮砍用户的信息
    const User = require('../models/User')
    const helperIds = bargain.helpers.map(h => h.userId)
    const users = await User.find({ _id: { $in: helperIds } }).select('username avatar').lean()
    const userMap = new Map(users.map(u => [u._id.toString(), u]))
    
    // 合并帮砍记录和用户信息
    const enrichedHelpers = bargain.helpers.map(h => ({
      ...h,
      userName: userMap.get(h.userId)?.username || '用户',
      userAvatar: userMap.get(h.userId)?.avatar || '/placeholder.svg'
    }))
    
    res.json({ 
      success: true, 
      data: {
        ...bargain,
        helpers: enrichedHelpers,
        product
      }
    })
  } catch (error) {
    console.error('获取砍价详情失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// GET /api/bargains/my - 获取我发起的砍价活动
router.get('/my', auth, async (req, res) => {
  try {
    const bargains = await Bargain.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .lean()
    
    res.json({ success: true, data: bargains })
  } catch (error) {
    console.error('获取我的砍价失败:', error)
    res.status(500).json({ success: false, message: '获取失败' })
  }
})

// POST /api/bargains - 发起砍价（用户从商品发起砍价活动）
router.post('/', auth, async (req, res) => {
  try {
    const { productId, productName, originalPrice, targetPrice, coverImage } = req.body
    console.log('发起砍价请求:', { productId, productName, originalPrice, targetPrice, coverImage, userId: req.userId })
    
    // 参数验证
    if (!productId) {
      return res.status(400).json({ success: false, message: '商品ID不能为空' })
    }
    if (!productName) {
      return res.status(400).json({ success: false, message: '商品名称不能为空' })
    }
    if (!originalPrice || originalPrice <= 0) {
      return res.status(400).json({ success: false, message: '原价必须大于0' })
    }
    if (!targetPrice || targetPrice <= 0) {
      return res.status(400).json({ success: false, message: '目标价必须大于0' })
    }
    
    // 检查是否已有进行中的砍价
    const existing = await Bargain.findOne({ 
      userId: req.userId, 
      productId, 
      status: 'active' 
    })
    if (existing) {
      return res.status(400).json({ success: false, message: '您已有该商品的进行中砍价' })
    }
    
    const bargain = await Bargain.create({
      productId,
      productName,
      thumbnail: coverImage,
      originalPrice,
      targetPrice,
      currentPrice: originalPrice,
      userId: req.userId,
      status: 'active',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时有效
    })
    
    // 更新砍价商品的统计
    await BargainProduct.findByIdAndUpdate(productId, { $inc: { totalBargains: 1 } })
    
    res.json({ success: true, data: bargain, message: '砍价已发起' })
  } catch (error) {
    console.error('发起砍价失败:', error)
    res.status(500).json({ success: false, message: '发起砍价失败' })
  }
})

// DELETE /api/bargains/:id - 取消我的砍价
router.delete('/:id', auth, async (req, res) => {
  try {
    const bargain = await Bargain.findOne({ _id: req.params.id, userId: req.userId })
    if (!bargain) {
      return res.status(404).json({ success: false, message: '砍价活动不存在' })
    }
    
    if (bargain.status !== 'active') {
      return res.status(400).json({ success: false, message: '只能取消进行中的砍价' })
    }
    
    bargain.status = 'cancelled'
    bargain.cancelledAt = new Date()
    await bargain.save()
    
    res.json({ success: true, message: '已取消砍价' })
  } catch (error) {
    console.error('取消砍价失败:', error)
    res.status(500).json({ success: false, message: '取消失败' })
  }
})

// POST /api/bargains/:id/help - 帮好友砍价
router.post('/:id/help', auth, async (req, res) => {
  try {
    const bargain = await Bargain.findById(req.params.id)
    if (!bargain) {
      return res.status(404).json({ success: false, message: '砍价活动不存在' })
    }
    
    if (bargain.status !== 'active') {
      return res.status(400).json({ success: false, message: '该砍价活动已结束' })
    }
    
    // 检查用户帮砍次数（包括自己发起的砍价）
    const userHelpCount = bargain.helpers.filter(h => h.userId === req.userId.toString()).length
    const isOwner = bargain.userId.toString() === req.userId.toString()
    
    // 如果是自己的砍价，最多只能砍3次
    if (isOwner && userHelpCount >= 3) {
      return res.status(400).json({ success: false, message: '您最多只能帮自己砍3次' })
    }
    
    // 如果不是自己的砍价，只能帮砍1次
    if (!isOwner && userHelpCount >= 1) {
      return res.status(400).json({ success: false, message: '您已经帮砍过了' })
    }
    
    // 获取砍价商品的规则
    const product = await BargainProduct.findById(bargain.productId)
    const minCut = product?.minCutAmount || 1
    const maxCut = product?.maxCutAmount || 50
    
    // 随机砍价金额
    const cutAmount = Math.floor(Math.random() * (maxCut - minCut + 1)) + minCut
    const newPrice = Math.max(bargain.targetPrice, bargain.currentPrice - cutAmount)
    
    bargain.helpers.push({
      userId: req.userId.toString(),
      helpedAt: new Date(),
      priceReduction: bargain.currentPrice - newPrice
    })
    bargain.currentPrice = newPrice
    bargain.helpCount = bargain.helpers.length
    
    // 检查是否砍价成功
    if (newPrice <= bargain.targetPrice) {
      bargain.status = 'completed'
      bargain.completedAt = new Date()
      // 更新砍价商品的成功统计
      await BargainProduct.findByIdAndUpdate(bargain.productId, { $inc: { successBargains: 1 } })
    }
    
    await bargain.save()
    
    res.json({ 
      success: true, 
      data: bargain, 
      message: `砍掉 ¥${bargain.currentPrice - newPrice + cutAmount - (bargain.currentPrice - newPrice)}` 
    })
  } catch (error) {
    console.error('帮砍失败:', error)
    res.status(500).json({ success: false, message: '帮砍失败' })
  }
})

module.exports = router
