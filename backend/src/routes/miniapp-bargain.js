/**
 * 小程序砍价专用路由
 * 从 bargains.js 提取仅小程序端接口，修正路由顺序（/my 在 /:id 之前）
 * 不包含管理端路由，安全隔离
 */
const express = require('express')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')
const BargainProduct = require('../models/BargainProduct')
const Bargain = require('../models/Bargain')
const Product = require('../models/Product')

// ========== 获取可砍价商品列表 ==========
// GET /api/miniapp/bargains
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

// ========== 获取我发起的砍价活动 ==========
// GET /api/miniapp/bargains/my
// 注意：此路由必须在 /:id 之前定义，否则 /my 会被当作 :id 匹配
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

// ========== 获取砍价详情 ==========
// GET /api/miniapp/bargains/:id
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
    const helperIds = (bargain.helpers || []).map(h => h.userId)
    const users = await User.find({ _id: { $in: helperIds } }).select('username nickname avatar').lean()
    const userMap = new Map(users.map(u => [u._id.toString(), u]))

    // 合并帮砍记录和用户信息
    const enrichedHelpers = (bargain.helpers || []).map(h => ({
      ...h,
      userName: userMap.get(h.userId)?.nickname || userMap.get(h.userId)?.username || '用户',
      userAvatar: userMap.get(h.userId)?.avatar || ''
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

// ========== 发起砍价 ==========
// POST /api/miniapp/bargains
router.post('/', auth, async (req, res) => {
  try {
    const { productId, productName, originalPrice, targetPrice, coverImage } = req.body
    console.log('发起砍价请求:', { productId, productName, originalPrice, targetPrice, coverImage, userId: req.userId })

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
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    })

    // 更新砍价商品的统计
    await BargainProduct.findByIdAndUpdate(productId, { $inc: { totalBargains: 1 } })

    res.json({ success: true, data: bargain, message: '砍价已发起' })
  } catch (error) {
    console.error('发起砍价失败:', error)
    res.status(500).json({ success: false, message: '发起砍价失败' })
  }
})

// ========== 取消我的砍价 ==========
// DELETE /api/miniapp/bargains/:id
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

// ========== 帮好友砍价 ==========
// POST /api/miniapp/bargains/:id/help
router.post('/:id/help', auth, async (req, res) => {
  try {
    const bargain = await Bargain.findById(req.params.id)
    if (!bargain) {
      return res.status(404).json({ success: false, message: '砍价活动不存在' })
    }

    if (bargain.status !== 'active') {
      return res.status(400).json({ success: false, message: '该砍价活动已结束' })
    }

    // 检查用户帮砍次数
    const helpers = bargain.helpers || []
    const userHelpCount = helpers.filter(h => h.userId === req.userId.toString()).length
    const isOwner = bargain.userId.toString() === req.userId.toString()

    if (isOwner && userHelpCount >= 3) {
      return res.status(400).json({ success: false, message: '您最多只能帮自己砍3次' })
    }
    if (!isOwner && userHelpCount >= 1) {
      return res.status(400).json({ success: false, message: '您已经帮砍过了' })
    }

    // 获取砍价商品的规则
    const product = await BargainProduct.findById(bargain.productId)
    const minCut = product?.minCutAmount || 1
    const maxCut = product?.maxCutAmount || 50

    // 随机砍价金额
    const cutAmount = Math.floor(Math.random() * (maxCut - minCut + 1)) + minCut
    const actualCut = Math.min(cutAmount, bargain.currentPrice - bargain.targetPrice)
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
      await BargainProduct.findByIdAndUpdate(bargain.productId, { $inc: { successBargains: 1 } })
    }

    await bargain.save()

    res.json({
      success: true,
      data: {
        cutAmount: bargain.currentPrice === newPrice ? actualCut : (bargain.currentPrice - newPrice + actualCut),
        currentPrice: newPrice,
        status: bargain.status,
        helpCount: bargain.helpers.length
      },
      message: `砍掉 ¥${actualCut}`
    })
  } catch (error) {
    console.error('帮砍失败:', error)
    res.status(500).json({ success: false, message: '帮砍失败' })
  }
})

module.exports = router
