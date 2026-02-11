const express = require('express')
const router = express.Router()
const StoreDecoration = require('../models/StoreDecoration')
const { auth } = require('../middleware/auth')

// 获取装修页面列表
router.get('/', auth, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query
    const query = {}

    // 管理员可以查看所有，普通用户只看自己的
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.role !== 'platform_admin') {
      query.merchantId = req.user._id
    }

    if (type) query.type = type
    if (status) query.status = status

    const total = await StoreDecoration.countDocuments(query)
    const list = await StoreDecoration.find(query)
      .select('-value')
      .sort({ isDefault: -1, updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean()

    res.json({
      success: true,
      data: list,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 获取当前生效的默认首页配置
router.get('/default', async (req, res) => {
  try {
    const { merchantId } = req.query
    const query = { isDefault: true, type: 'homepage' }
    if (merchantId) query.merchantId = merchantId

    const page = await StoreDecoration.findOne(query)
      .populate('value.productList.productIds', 'name basePrice originalPrice thumbnail images sales')
      .populate('value.coupons.couponId', 'code type value minAmount validFrom validTo')
      .lean()

    if (!page) {
      return res.json({ success: true, data: null, message: '暂无默认首页' })
    }

    res.json({ success: true, data: page })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 获取单个装修页面详情
router.get('/:id', auth, async (req, res) => {
  try {
    const page = await StoreDecoration.findById(req.params.id)
      .populate('value.productList.productIds', 'name basePrice originalPrice thumbnail images sales')
      .populate('value.coupons.couponId', 'code type value minAmount validFrom validTo')
      .lean()

    if (!page) {
      return res.status(404).json({ success: false, message: '装修页面不存在' })
    }

    res.json({ success: true, data: page })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 新建装修页面
router.post('/', auth, async (req, res) => {
  try {
    const data = { ...req.body }
    // 如果没有指定 merchantId，使用当前用户
    if (!data.merchantId) {
      data.merchantId = req.user._id
    }

    const page = await StoreDecoration.create(data)
    res.status(201).json({ success: true, data: page, message: '创建成功' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 更新装修页面
router.put('/:id', auth, async (req, res) => {
  try {
    const page = await StoreDecoration.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )

    if (!page) {
      return res.status(404).json({ success: false, message: '装修页面不存在' })
    }

    res.json({ success: true, data: page, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 删除装修页面
router.delete('/:id', auth, async (req, res) => {
  try {
    const page = await StoreDecoration.findById(req.params.id)
    if (!page) {
      return res.status(404).json({ success: false, message: '装修页面不存在' })
    }

    if (page.isDefault) {
      return res.status(400).json({ success: false, message: '默认首页不能删除，请先取消默认设置' })
    }

    await StoreDecoration.findByIdAndDelete(req.params.id)
    res.json({ success: true, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 设为默认首页
router.put('/:id/set-default', auth, async (req, res) => {
  try {
    const page = await StoreDecoration.findById(req.params.id)
    if (!page) {
      return res.status(404).json({ success: false, message: '装修页面不存在' })
    }

    // 取消同 merchantId 下所有 homepage 的 isDefault
    await StoreDecoration.updateMany(
      { merchantId: page.merchantId, type: 'homepage' },
      { isDefault: false }
    )

    // 设置当前页面为默认
    page.isDefault = true
    page.status = 'active'
    await page.save()

    res.json({ success: true, data: page, message: '已设为默认首页' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
