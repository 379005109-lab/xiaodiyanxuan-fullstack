const ChannelPartner = require('../models/ChannelPartner')
const Manufacturer = require('../models/Manufacturer')

// 获取渠道商列表
exports.list = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search = '', 
      type, 
      status, 
      manufacturerId,
      province,
      city
    } = req.query

    const query = {}

    // 搜索条件
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { 'contact.name': { $regex: search, $options: 'i' } },
        { 'contact.phone': { $regex: search, $options: 'i' } },
        { 'region.city': { $regex: search, $options: 'i' } }
      ]
    }

    // 类型筛选
    if (type && type !== 'all') {
      query.type = type
    }

    // 状态筛选
    if (status && status !== 'all') {
      query.status = status
    }

    // 按厂家/品牌筛选
    if (manufacturerId && manufacturerId !== 'all') {
      query['brands.manufacturerId'] = manufacturerId
    }

    // 区域筛选
    if (province) {
      query['region.province'] = province
    }
    if (city) {
      query['region.city'] = city
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)

    const [partners, total] = await Promise.all([
      ChannelPartner.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ChannelPartner.countDocuments(query)
    ])

    // 统计数据
    const stats = await ChannelPartner.aggregate([
      { $match: manufacturerId && manufacturerId !== 'all' ? { 'brands.manufacturerId': require('mongoose').Types.ObjectId(manufacturerId) } : {} },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $in: ['$status', ['pending', 'signing']] }, 1, 0] } }
        }
      }
    ])

    res.json({
      success: true,
      data: {
        list: partners,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: stats[0] || { total: 0, active: 0, pending: 0 }
      }
    })
  } catch (error) {
    console.error('获取渠道商列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取渠道商列表失败'
    })
  }
}

// 获取单个渠道商详情
exports.getById = async (req, res) => {
  try {
    const { id } = req.params
    
    const partner = await ChannelPartner.findById(id).lean()
    
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: '渠道商不存在'
      })
    }

    res.json({
      success: true,
      data: partner
    })
  } catch (error) {
    console.error('获取渠道商详情失败:', error)
    res.status(500).json({
      success: false,
      message: '获取渠道商详情失败'
    })
  }
}

// 创建渠道商
exports.create = async (req, res) => {
  try {
    const data = req.body

    // 生成编号
    if (!data.code) {
      const count = await ChannelPartner.countDocuments()
      data.code = `C${count + 1}`
    }

    // 检查编号是否已存在
    const existing = await ChannelPartner.findOne({ code: data.code })
    if (existing) {
      return res.status(400).json({
        success: false,
        message: '渠道商编号已存在'
      })
    }

    // 处理品牌信息
    if (data.brandIds && Array.isArray(data.brandIds)) {
      const manufacturers = await Manufacturer.find({ _id: { $in: data.brandIds } })
      data.brands = manufacturers.map(m => ({
        manufacturerId: m._id,
        manufacturerName: m.fullName || m.name,
        manufacturerCode: m.shortName || m.code,
        color: getBrandColor(m.shortName || m.code)
      }))
    }

    data.createdBy = req.user?._id
    data.updatedBy = req.user?._id

    const partner = new ChannelPartner(data)
    await partner.save()

    res.json({
      success: true,
      message: '渠道商创建成功',
      data: partner
    })
  } catch (error) {
    console.error('创建渠道商失败:', error)
    res.status(500).json({
      success: false,
      message: '创建渠道商失败'
    })
  }
}

// 更新渠道商
exports.update = async (req, res) => {
  try {
    const { id } = req.params
    const data = req.body

    const partner = await ChannelPartner.findById(id)
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: '渠道商不存在'
      })
    }

    // 处理品牌信息更新
    if (data.brandIds && Array.isArray(data.brandIds)) {
      const manufacturers = await Manufacturer.find({ _id: { $in: data.brandIds } })
      data.brands = manufacturers.map(m => ({
        manufacturerId: m._id,
        manufacturerName: m.fullName || m.name,
        manufacturerCode: m.shortName || m.code,
        color: getBrandColor(m.shortName || m.code)
      }))
    }

    data.updatedBy = req.user?._id

    Object.assign(partner, data)
    await partner.save()

    res.json({
      success: true,
      message: '渠道商更新成功',
      data: partner
    })
  } catch (error) {
    console.error('更新渠道商失败:', error)
    res.status(500).json({
      success: false,
      message: '更新渠道商失败'
    })
  }
}

// 删除渠道商
exports.delete = async (req, res) => {
  try {
    const { id } = req.params

    const partner = await ChannelPartner.findByIdAndDelete(id)
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: '渠道商不存在'
      })
    }

    res.json({
      success: true,
      message: '渠道商已删除'
    })
  } catch (error) {
    console.error('删除渠道商失败:', error)
    res.status(500).json({
      success: false,
      message: '删除渠道商失败'
    })
  }
}

// 更新合作状态
exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, notes } = req.body

    const partner = await ChannelPartner.findById(id)
    if (!partner) {
      return res.status(404).json({
        success: false,
        message: '渠道商不存在'
      })
    }

    partner.status = status
    if (notes) {
      partner.notes = notes
    }
    if (status === 'active' && !partner.cooperationStartDate) {
      partner.cooperationStartDate = new Date()
    }
    partner.updatedBy = req.user?._id
    await partner.save()

    res.json({
      success: true,
      message: '状态更新成功',
      data: partner
    })
  } catch (error) {
    console.error('更新状态失败:', error)
    res.status(500).json({
      success: false,
      message: '更新状态失败'
    })
  }
}

// 批量导入渠道商
exports.batchImport = async (req, res) => {
  try {
    const { partners } = req.body

    if (!Array.isArray(partners) || partners.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要导入的渠道商数据'
      })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    }

    for (const partnerData of partners) {
      try {
        // 生成编号
        if (!partnerData.code) {
          const count = await ChannelPartner.countDocuments()
          partnerData.code = `C${count + 1}`
        }

        partnerData.createdBy = req.user?._id
        partnerData.updatedBy = req.user?._id

        const partner = new ChannelPartner(partnerData)
        await partner.save()
        results.success++
      } catch (err) {
        results.failed++
        results.errors.push({
          name: partnerData.name,
          error: err.message
        })
      }
    }

    res.json({
      success: true,
      message: `导入完成：成功 ${results.success} 条，失败 ${results.failed} 条`,
      data: results
    })
  } catch (error) {
    console.error('批量导入失败:', error)
    res.status(500).json({
      success: false,
      message: '批量导入失败'
    })
  }
}

// 获取品牌颜色
function getBrandColor(code) {
  const colors = {
    '各色': '#8b5cf6', // 紫色
    'GS': '#8b5cf6',
    '诗歌': '#f59e0b', // 橙色
    'SG': '#f59e0b',
    '科凡': '#3b82f6', // 蓝色
    'KF': '#3b82f6',
    '美的': '#10b981', // 绿色
    'MD': '#10b981'
  }
  return colors[code] || '#6b7280' // 默认灰色
}
