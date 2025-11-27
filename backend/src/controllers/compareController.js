const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Compare = require('../models/Compare')

// 获取对比列表
const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const skip = (page - 1) * pageSize
    
    console.log('========== [Compare] List request ==========')
    console.log('userId:', req.userId)
    
    const total = await Compare.countDocuments({ userId: req.userId })
    const items = await Compare.find({ userId: req.userId })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean()
    
    console.log(`✅ Found ${items.length} compare items (total: ${total})`)
    console.log('==========================================')
    
    // 返回前端期望的格式: { success: true, data: { items: [...] } }
    res.json(successResponse({
      items,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    }))
  } catch (err) {
    console.error('❌ List compare items error:', err)
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
    let { productId, skuId, selectedMaterials } = req.body

    console.log('========== [Compare] Add request ==========')
    console.log('Full request body:', JSON.stringify(req.body, null, 2))
    console.log('productId type:', typeof productId)
    console.log('productId value:', productId)
    console.log('skuId:', skuId)
    console.log('userId:', req.userId)
    console.log('==========================================')

    // 转换 productId 为字符串（处理可能的对象传递）
    if (productId && typeof productId === 'object' && productId._id) {
      productId = productId._id
    }
    if (productId && typeof productId === 'object' && productId.id) {
      productId = productId.id
    }

    if (!productId) {
      console.error('❌ [Compare] Missing productId')
      return res.status(400).json(errorResponse('缺少产品ID', 400))
    }

    // 验证productId是否是有效的字符串
    productId = String(productId).trim()
    if (!productId) {
      console.error('❌ [Compare] Invalid productId - empty after trim')
      return res.status(400).json(errorResponse('无效的产品ID', 400))
    }
    
    // 检查是否已存在（需要比较productId + skuId + selectedMaterials组合）
    const existingItems = await Compare.find({
      userId: req.userId,
      productId,
      skuId
    })
    
    // 如果有selectedMaterials，需要精确匹配
    if (selectedMaterials && Object.keys(selectedMaterials).length > 0) {
      const materialKey = JSON.stringify(selectedMaterials)
      const duplicate = existingItems.find(item => {
        const itemMaterialKey = JSON.stringify(item.selectedMaterials || {})
        return itemMaterialKey === materialKey
      })
      if (duplicate) {
        return res.status(400).json(errorResponse('该商品配置已在对比列表中', 400))
      }
    } else if (existingItems.length > 0 && !existingItems[0].selectedMaterials) {
      // 如果没有材质选择，且已存在相同的productId+skuId（也没有材质），则视为重复
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
