const CustomizationRequest = require('../models/CustomizationRequest')
const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')

// 创建定制需求
const create = async (req, res) => {
  try {
    const { contactName, contactPhone, contactEmail, productType, customizationDetails, dimensions, materials, colors, budget, deadline, images } = req.body
    
    // 只需要至少有一项定制内容
    if (!dimensions && !materials && !colors && !customizationDetails) {
      return res.status(400).json(errorResponse('请至少填写一项定制需求', 400))
    }
    
    // 使用默认值
    const finalContactName = contactName || '当前用户'
    const finalContactPhone = contactPhone || '待补充'
    const finalProductType = productType || '定制家具'
    const finalCustomizationDetails = customizationDetails || [
      dimensions && `尺寸：${dimensions}`,
      materials && `材质：${materials}`,
      colors && `颜色：${colors}`,
    ].filter(Boolean).join(' | ')
    
    const customization = await CustomizationRequest.create({
      userId: req.userId || null,
      contactName: finalContactName,
      contactPhone: finalContactPhone,
      contactEmail,
      productType: finalProductType,
      customizationDetails: finalCustomizationDetails,
      dimensions,
      materials,
      colors,
      budget,
      deadline,
      images: images || [],
      status: 'pending'
    })
    
    res.status(201).json(successResponse(customization))
  } catch (err) {
    console.error('Create customization error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取所有定制需求（管理员）
const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    
    const query = {}
    if (status) {
      query.status = status
    }
    
    const skip = (page - 1) * pageSize
    const [customizations, total] = await Promise.all([
      CustomizationRequest.find(query)
        .populate('userId', 'username email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(pageSize)),
      CustomizationRequest.countDocuments(query)
    ])
    
    res.json(paginatedResponse(customizations, total, parseInt(page), parseInt(pageSize)))
  } catch (err) {
    console.error('List customizations error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取单个定制需求
const getOne = async (req, res) => {
  try {
    const { id } = req.params
    const customization = await CustomizationRequest.findById(id).populate('userId', 'username email')
    
    if (!customization) {
      return res.status(404).json(errorResponse('定制需求不存在', 404))
    }
    
    res.json(successResponse(customization))
  } catch (err) {
    console.error('Get customization error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 更新定制需求（管理员）
const update = async (req, res) => {
  try {
    const { id } = req.params
    const { status, adminNotes, quotedPrice } = req.body
    
    const updateData = {}
    if (status) updateData.status = status
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    if (quotedPrice !== undefined) {
      updateData.quotedPrice = quotedPrice
      updateData.quotedAt = new Date()
    }
    
    const customization = await CustomizationRequest.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    
    if (!customization) {
      return res.status(404).json(errorResponse('定制需求不存在', 404))
    }
    
    res.json(successResponse(customization))
  } catch (err) {
    console.error('Update customization error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 删除定制需求（管理员）
const remove = async (req, res) => {
  try {
    const { id } = req.params
    
    const customization = await CustomizationRequest.findByIdAndDelete(id)
    
    if (!customization) {
      return res.status(404).json(errorResponse('定制需求不存在', 404))
    }
    
    res.json(successResponse({ message: '删除成功' }))
  } catch (err) {
    console.error('Delete customization error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  create,
  list,
  getOne,
  update,
  remove
}
