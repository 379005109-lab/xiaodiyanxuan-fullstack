const express = require('express')
const router = express.Router()
const Banner = require('../models/Banner')
const { auth } = require('../middleware/auth')

// 获取 Banner 列表
router.get('/', async (req, res) => {
  try {
    const { type, platform, status, page = 1, limit = 50 } = req.query
    const query = {}
    
    if (type) query.type = type
    if (platform) query.platform = platform
    if (status) query.status = status
    
    const total = await Banner.countDocuments(query)
    const banners = await Banner.find(query)
      .sort({ type: 1, order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean()
    
    res.json({
      success: true,
      data: banners,
      pagination: { total, page: parseInt(page), limit: parseInt(limit) }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 获取单个 Banner
router.get('/:id', async (req, res) => {
  try {
    const banner = await Banner.findById(req.params.id)
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner 不存在' })
    }
    res.json({ success: true, data: banner })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 创建 Banner
router.post('/', auth, async (req, res) => {
  try {
    const banner = await Banner.create(req.body)
    res.status(201).json({ success: true, data: banner, message: '创建成功' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 更新 Banner
router.put('/:id', auth, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    )
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner 不存在' })
    }
    res.json({ success: true, data: banner, message: '更新成功' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 删除 Banner
router.delete('/:id', auth, async (req, res) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id)
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner 不存在' })
    }
    res.json({ success: true, message: '删除成功' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

module.exports = router
