const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Manufacturer = require('../models/Manufacturer')

// 获取所有厂家列表
const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query
    const skip = (page - 1) * pageSize
    
    const query = {}
    if (status) query.status = status
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { fullName: { $regex: keyword, $options: 'i' } },
        { shortName: { $regex: keyword, $options: 'i' } },
        { code: { $regex: keyword, $options: 'i' } },
        { contactName: { $regex: keyword, $options: 'i' } },
        { contactPhone: { $regex: keyword, $options: 'i' } }
      ]
    }
    
    const total = await Manufacturer.countDocuments(query)
    const items = await Manufacturer.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean()
    
    res.json(paginatedResponse(items, parseInt(page), parseInt(pageSize), total))
  } catch (err) {
    console.error('List manufacturers error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取所有厂家（不分页，用于下拉选择）
const listAll = async (req, res) => {
  try {
    const items = await Manufacturer.find({ status: 'active' })
      .sort({ name: 1 })
      .select('_id name code')
      .lean()
    
    res.json(successResponse(items))
  } catch (err) {
    console.error('List all manufacturers error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取单个厂家
const get = async (req, res) => {
  try {
    const { id } = req.params
    const manufacturer = await Manufacturer.findById(id).lean()
    
    if (!manufacturer) {
      return res.status(404).json(errorResponse('厂家不存在', 404))
    }
    
    res.json(successResponse(manufacturer))
  } catch (err) {
    console.error('Get manufacturer error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 创建厂家
const create = async (req, res) => {
  try {
    const {
      fullName,
      shortName,
      name,
      code,
      contactName,
      contactPhone,
      contactEmail,
      address,
      description,
      productIntro,
      styleTags,
      isPreferred,
      expiryDate,
      defaultDiscount,
      defaultCommission,
      logo,
      status,
    } = req.body
    
    // 支持新字段fullName，兼容旧字段name
    const manufacturerName = fullName || name
    if (!manufacturerName) {
      return res.status(400).json(errorResponse('厂家名称不能为空', 400))
    }
    
    if (!shortName) {
      return res.status(400).json(errorResponse('厂家简称不能为空', 400))
    }
    
    // 检查编码是否重复（如果手动传入）
    if (code) {
      const existing = await Manufacturer.findOne({ code })
      if (existing) {
        return res.status(400).json(errorResponse('厂家编码已存在', 400))
      }
    }
    
    const manufacturer = await Manufacturer.create({
      fullName: manufacturerName,
      shortName,
      name: manufacturerName, // 兼容旧字段
      contactName,
      contactPhone,
      contactEmail,
      address,
      description,
      productIntro,
      styleTags,
      isPreferred: Boolean(isPreferred),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      defaultDiscount: defaultDiscount !== undefined ? Number(defaultDiscount) : undefined,
      defaultCommission: defaultCommission !== undefined ? Number(defaultCommission) : undefined,
      logo,
      status: status || 'active'
    })
    
    res.status(201).json(successResponse(manufacturer, '创建成功'))
  } catch (err) {
    console.error('Create manufacturer error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 更新厂家
const update = async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      code,
      contactName,
      contactPhone,
      contactEmail,
      address,
      description,
      productIntro,
      styleTags,
      isPreferred,
      expiryDate,
      defaultDiscount,
      defaultCommission,
      logo,
      status,
      accountQuota,
    } = req.body
    
    const manufacturer = await Manufacturer.findById(id)
    if (!manufacturer) {
      return res.status(404).json(errorResponse('厂家不存在', 404))
    }
    
    // 检查编码是否重复（排除自身）
    if (code && code !== manufacturer.code) {
      const existing = await Manufacturer.findOne({ code, _id: { $ne: id } })
      if (existing) {
        return res.status(400).json(errorResponse('厂家编码已存在', 400))
      }
    }
    
    manufacturer.name = name || manufacturer.name
    if (code !== undefined) manufacturer.code = code
    manufacturer.contactName = contactName
    manufacturer.contactPhone = contactPhone
    manufacturer.contactEmail = contactEmail
    manufacturer.address = address
    manufacturer.description = description
    if (productIntro !== undefined) manufacturer.productIntro = productIntro
    if (styleTags !== undefined) manufacturer.styleTags = Array.isArray(styleTags) ? styleTags : []
    if (isPreferred !== undefined) manufacturer.isPreferred = Boolean(isPreferred)
    if (expiryDate !== undefined) manufacturer.expiryDate = expiryDate ? new Date(expiryDate) : null
    if (defaultDiscount !== undefined) manufacturer.defaultDiscount = Number(defaultDiscount)
    if (defaultCommission !== undefined) manufacturer.defaultCommission = Number(defaultCommission)
    manufacturer.logo = logo
    manufacturer.status = status || manufacturer.status
    if (accountQuota && typeof accountQuota === 'object') {
      manufacturer.accountQuota = {
        ...(manufacturer.accountQuota || {}),
        ...accountQuota
      }
    }
    
    await manufacturer.save()
    
    res.json(successResponse(manufacturer, '更新成功'))
  } catch (err) {
    console.error('Update manufacturer error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 删除厂家
const remove = async (req, res) => {
  try {
    const { id } = req.params
    
    const manufacturer = await Manufacturer.findById(id)
    if (!manufacturer) {
      return res.status(404).json(errorResponse('厂家不存在', 404))
    }
    
    await Manufacturer.deleteOne({ _id: id })
    
    res.json(successResponse(null, '删除成功'))
  } catch (err) {
    console.error('Delete manufacturer error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  list,
  listAll,
  get,
  create,
  update,
  remove
}
