const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Compare = require('../models/Compare')

// 获取对比列表
const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const skip = (page - 1) * pageSize
    
    const total = await Compare.countDocuments({ userId: req.userId })
    const items = await Compare.find({ userId: req.userId })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean()
    
    res.json(paginatedResponse(items, total, page, pageSize))
  } catch (err) {
    console.error('List compare items error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取对比统计
const stats = async (req, res) => {
  try {
    const count = await Compare.countDocuments({ userId: req.userId })
    
    res.json(successResponse({
      total: count,
      maxItems: 4,
      isFull: count >= 4,
      canAddMore: count < 4
    }))
  } catch (err) {
    console.error('Get compare stats error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 添加到对比
const add = async (req, res) => {
  try {
    const { productId, skuId, selectedMaterials } = req.body
    
    if (!productId) {
      return res.status(400).json(errorResponse('缺少产品ID', 400))
    }
    
    // 检查是否已存在
    const existing = await Compare.findOne({
      userId: req.userId,
      productId,
      skuId
    })
    
    if (existing) {
      return res.status(400).json(errorResponse('该商品已在对比列表中', 400))
    }
    
    // 检查数量限制
    const count = await Compare.countDocuments({ userId: req.userId })
    if (count >= 4) {
      return res.status(400).json(errorResponse('最多只能对比4个商品', 400))
    }
    
    const item = await Compare.create({
      userId: req.userId,
      productId,
      skuId,
      selectedMaterials,
      addedAt: new Date()
    })
    
    res.status(201).json(successResponse(item, '已添加到对比列表'))
  } catch (err) {
    console.error('Add compare item error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 移除对比
const remove = async (req, res) => {
  try {
    const { productId } = req.params
    const { skuId } = req.body
    
    const result = await Compare.deleteOne({
      userId: req.userId,
      productId,
      skuId
    })
    
    if (result.deletedCount === 0) {
      return res.status(404).json(errorResponse('未找到该对比项', 404))
    }
    
    res.json(successResponse(null, '已移除'))
  } catch (err) {
    console.error('Remove compare item error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 清空对比列表
const clear = async (req, res) => {
  try {
    await Compare.deleteMany({ userId: req.userId })
    
    res.json(successResponse(null, '已清空'))
  } catch (err) {
    console.error('Clear compare list error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  list,
  stats,
  add,
  remove,
  clear
}
