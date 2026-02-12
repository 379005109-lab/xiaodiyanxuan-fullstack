const express = require('express')
const router = express.Router()
const StoreDecoration = require('../models/StoreDecoration')
const { auth } = require('../middleware/auth')

// ========== 角色判断工具 ==========
const PLATFORM_ROLES = ['admin', 'super_admin', 'platform_admin', 'platform_staff']

function isPlatform(user) {
  return PLATFORM_ROLES.includes(user.role)
}

function isEnterprise(user) {
  return user.role === 'enterprise_admin' || user.role === 'enterprise_staff'
}

function isDesigner(user) {
  return user.role === 'designer'
}

// 根据用户角色生成列表查询条件
function buildOwnerQuery(user) {
  if (isPlatform(user)) return { ownerType: 'platform' }
  if (isEnterprise(user)) {
    const mId = user.manufacturerId || (user.manufacturerIds && user.manufacturerIds[0])
    return { ownerType: 'manufacturer', manufacturerId: mId || null }
  }
  if (isDesigner(user)) return { ownerType: 'designer', merchantId: user._id }
  return { merchantId: user._id }
}

// 设置创建数据的归属信息
function setOwnership(data, user) {
  data.merchantId = user._id
  if (isPlatform(user)) {
    data.ownerType = 'platform'
    data.manufacturerId = null
  } else if (isEnterprise(user)) {
    data.ownerType = 'manufacturer'
    data.manufacturerId = user.manufacturerId || (user.manufacturerIds && user.manufacturerIds[0]) || null
  } else if (isDesigner(user)) {
    data.ownerType = 'designer'
    data.manufacturerId = null
  }
}

// 检查用户是否有权操作某个装修页面
function canAccess(user, page) {
  if (isPlatform(user)) return true
  if (isEnterprise(user)) {
    const mId = user.manufacturerId || (user.manufacturerIds && user.manufacturerIds[0])
    return page.ownerType === 'manufacturer' && String(page.manufacturerId) === String(mId)
  }
  if (isDesigner(user)) {
    return page.ownerType === 'designer' && String(page.merchantId) === String(user._id)
  }
  return String(page.merchantId) === String(user._id)
}

// ========== 路由 ==========

// 获取装修页面列表
router.get('/', auth, async (req, res) => {
  try {
    const { type, status, page = 1, limit = 20 } = req.query
    const query = buildOwnerQuery(req.user)

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

// 获取当前生效的默认首页配置（公开接口）
router.get('/default', async (req, res) => {
  try {
    const { ownerType, manufacturerId } = req.query
    const query = { isDefault: true, type: 'homepage' }
    if (ownerType) query.ownerType = ownerType
    if (manufacturerId) query.manufacturerId = manufacturerId
    // 如果没有指定任何过滤，默认返回平台首页
    if (!ownerType && !manufacturerId) query.ownerType = 'platform'

    const page = await StoreDecoration.findOne(query).lean()

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
    const page = await StoreDecoration.findById(req.params.id).lean()

    if (!page) {
      return res.status(404).json({ success: false, message: '装修页面不存在' })
    }

    if (!canAccess(req.user, page)) {
      return res.status(403).json({ success: false, message: '无权访问此装修页面' })
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
    setOwnership(data, req.user)

    const page = await StoreDecoration.create(data)
    res.status(201).json({ success: true, data: page, message: '创建成功' })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// 更新装修页面
router.put('/:id', auth, async (req, res) => {
  try {
    const existing = await StoreDecoration.findById(req.params.id)
    if (!existing) {
      return res.status(404).json({ success: false, message: '装修页面不存在' })
    }
    if (!canAccess(req.user, existing)) {
      return res.status(403).json({ success: false, message: '无权修改此装修页面' })
    }

    // 不允许修改归属字段
    const { ownerType, manufacturerId, merchantId, ...updateData } = req.body
    const page = await StoreDecoration.findByIdAndUpdate(
      req.params.id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    )

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
    if (!canAccess(req.user, page)) {
      return res.status(403).json({ success: false, message: '无权删除此装修页面' })
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
    if (!canAccess(req.user, page)) {
      return res.status(403).json({ success: false, message: '无权操作此装修页面' })
    }

    // 取消同归属下所有 homepage 的 isDefault
    const resetQuery = { type: 'homepage', ownerType: page.ownerType }
    if (page.ownerType === 'manufacturer') resetQuery.manufacturerId = page.manufacturerId
    if (page.ownerType === 'designer') resetQuery.merchantId = page.merchantId
    await StoreDecoration.updateMany(resetQuery, { isDefault: false })

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
