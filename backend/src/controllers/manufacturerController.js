const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Manufacturer = require('../models/Manufacturer')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const { USER_ROLES, USER_TYPES } = require('../config/constants')

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
    
    res.json(paginatedResponse(items, total, page, pageSize))
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
      code,
      contactName,
      contactPhone,
      contactEmail,
      address,
      description,
      productIntro,
      isPreferred: Boolean(isPreferred),
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      styleTags: Array.isArray(styleTags) ? styleTags : [],
      defaultDiscount: defaultDiscount !== undefined ? Number(defaultDiscount) : undefined,
      defaultCommission: defaultCommission !== undefined ? Number(defaultCommission) : undefined,
      logo,
      status: status || 'active'
    })

    const platformRoles = [USER_ROLES.SUPER_ADMIN, USER_ROLES.PLATFORM_ADMIN, 'super_admin', 'admin', 'platform_admin']
    const canAutoCreateAccount = platformRoles.includes(req.user?.role)
    if (canAutoCreateAccount) {
      try {
        const base = String(shortName || '')
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '')

        if (base) {
          let username = base
          let suffix = 0
          while (suffix < 50) {
            const exists = await User.findOne({ username }).select('_id').lean()
            if (!exists) break
            suffix += 1
            username = `${base}${suffix}`
          }

          if (suffix < 50) {
            const hashedPassword = await bcrypt.hash('123456', 10)
            await User.create({
              username,
              password: hashedPassword,
              nickname: manufacturerName,
              accountType: 'auth',
              role: USER_ROLES.ENTERPRISE_ADMIN,
              userType: USER_TYPES.ADMIN,
              manufacturerId: manufacturer._id,
              manufacturerIds: [manufacturer._id],
              status: 'active',
              createdBy: req.user?._id
            })
          }
        }
      } catch (e) {
        console.error('Auto create manufacturer admin account error:', e)
      }
    }
    
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
      fullName,
      shortName,
      code,
      contactName,
      contactPhone,
      contactEmail,
      address,
      description,
      productIntro,
      logo,
      galleryImages,
      status,
      accountQuota,
      settings,
      isPreferred,
      expiryDate,
      styleTags,
      categoryTags,
      priceRangeMin,
      priceRangeMax,
      defaultDiscount,
      defaultCommission,
      paymentRatioEnabled,
      paymentRatios,
      invoiceEnabled,
      invoiceMarkupPercent,
      certification,
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
    
    // 更新基本信息
    if (fullName !== undefined) manufacturer.fullName = fullName
    if (shortName !== undefined) manufacturer.shortName = shortName
    if (name !== undefined) manufacturer.name = name
    if (code !== undefined) manufacturer.code = code
    if (contactName !== undefined) manufacturer.contactName = contactName
    if (contactPhone !== undefined) manufacturer.contactPhone = contactPhone
    if (contactEmail !== undefined) manufacturer.contactEmail = contactEmail
    if (address !== undefined) manufacturer.address = address
    if (description !== undefined) manufacturer.description = description
    if (productIntro !== undefined) manufacturer.productIntro = productIntro
    if (logo !== undefined) manufacturer.logo = logo
    if (galleryImages !== undefined) manufacturer.galleryImages = Array.isArray(galleryImages) ? galleryImages : []
    if (isPreferred !== undefined) manufacturer.isPreferred = Boolean(isPreferred)
    if (expiryDate !== undefined) manufacturer.expiryDate = expiryDate ? new Date(expiryDate) : null
    if (styleTags !== undefined) manufacturer.styleTags = Array.isArray(styleTags) ? styleTags : []
    if (categoryTags !== undefined) manufacturer.categoryTags = Array.isArray(categoryTags) ? categoryTags : []
    if (priceRangeMin !== undefined) manufacturer.priceRangeMin = Number(priceRangeMin)
    if (priceRangeMax !== undefined) manufacturer.priceRangeMax = Number(priceRangeMax)
    if (defaultDiscount !== undefined) manufacturer.defaultDiscount = Number(defaultDiscount)
    if (defaultCommission !== undefined) manufacturer.defaultCommission = Number(defaultCommission)
    if (paymentRatioEnabled !== undefined) manufacturer.paymentRatioEnabled = Boolean(paymentRatioEnabled)
    if (paymentRatios !== undefined) manufacturer.paymentRatios = Array.isArray(paymentRatios) ? paymentRatios : []
    if (invoiceEnabled !== undefined) manufacturer.invoiceEnabled = Boolean(invoiceEnabled)
    if (invoiceMarkupPercent !== undefined) manufacturer.invoiceMarkupPercent = Number(invoiceMarkupPercent)
    if (status !== undefined) manufacturer.status = status
    
    // 更新认证信息
    if (certification !== undefined) {
      const existingCert = manufacturer.certification ? manufacturer.certification.toObject() : {}
      manufacturer.certification = {
        ...existingCert,
        ...certification
      }
    }
    
    // 更新账号配额
    if (accountQuota !== undefined) {
      // 需要将 Mongoose 子文档转为普通对象再合并，否则 spread 不生效
      const existingQuota = manufacturer.accountQuota ? manufacturer.accountQuota.toObject() : {}
      manufacturer.accountQuota = {
        ...existingQuota,
        ...accountQuota
      }
      console.log('📊 更新账号配额:', { existingQuota, newQuota: accountQuota, merged: manufacturer.accountQuota })
    }
    
    // 更新设置
    if (settings !== undefined) {
      // 将Mongoose子文档转为普通对象再合并
      const existingSettings = manufacturer.settings ? manufacturer.settings.toObject() : {}
      manufacturer.settings = {
        ...existingSettings,
        ...settings
      }
      console.log('📊 更新settings:', { existingSettings, newSettings: settings, merged: manufacturer.settings })
    }
    
    await manufacturer.save()
    
    console.log('✅ 厂家更新成功:', id, { accountQuota, settings })
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
