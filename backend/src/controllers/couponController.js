const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Coupon = require('../models/Coupon')
const { calculatePagination } = require('../utils/helpers')

// 生成优惠券码
const generateCouponCode = (prefix = 'CP') => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = prefix
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// 后台管理 - 获取所有优惠券
const adminList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, type } = req.query
    const { skip, pageSize: size } = calculatePagination(page, pageSize)
    
    const query = {}
    if (status) query.status = status
    if (type) query.type = type
    
    const total = await Coupon.countDocuments(query)
    const coupons = await Coupon.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(size)
      .lean()
    
    res.json(paginatedResponse(coupons, total, page, size))
  } catch (err) {
    console.error('Admin list coupons error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 后台管理 - 创建优惠券
const create = async (req, res) => {
  try {
    const { code, type, value, minAmount, maxAmount, description, validFrom, validTo, usageLimit, status } = req.body
    
    // 如果没有提供code，自动生成
    const couponCode = code || generateCouponCode()
    
    // 检查code是否已存在
    const existing = await Coupon.findOne({ code: couponCode })
    if (existing) {
      return res.status(400).json(errorResponse('优惠券码已存在', 400))
    }
    
    const coupon = await Coupon.create({
      code: couponCode,
      type: type || 'fixed',
      value,
      minAmount: minAmount || 0,
      maxAmount: maxAmount || 999999,
      description,
      validFrom: validFrom || new Date(),
      validTo: validTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 默认30天有效
      usageLimit: usageLimit || 1,
      status: status || 'active'
    })
    
    res.json(successResponse(coupon, '优惠券创建成功'))
  } catch (err) {
    console.error('Create coupon error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 后台管理 - 更新优惠券
const update = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body
    updates.updatedAt = new Date()
    
    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true })
    if (!coupon) {
      return res.status(404).json(errorResponse('优惠券不存在', 404))
    }
    
    res.json(successResponse(coupon, '优惠券更新成功'))
  } catch (err) {
    console.error('Update coupon error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 后台管理 - 删除优惠券
const remove = async (req, res) => {
  try {
    const { id } = req.params
    
    const coupon = await Coupon.findByIdAndDelete(id)
    if (!coupon) {
      return res.status(404).json(errorResponse('优惠券不存在', 404))
    }
    
    res.json(successResponse(null, '优惠券删除成功'))
  } catch (err) {
    console.error('Delete coupon error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 陪买服务 - 自动发放优惠券
const createShoppingServiceCoupon = async (req, res) => {
  try {
    const couponCode = generateCouponCode('PM')
    
    const coupon = await Coupon.create({
      code: couponCode,
      type: 'fixed',
      value: 1000, // 减1000元
      minAmount: 5000, // 满5000元可用
      maxAmount: 999999,
      description: '陪买服务专享券 - 满5000减1000',
      validFrom: new Date(),
      validTo: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90天有效
      usageLimit: 1,
      status: 'active'
    })
    
    res.json(successResponse(coupon, '陪买服务优惠券创建成功'))
  } catch (err) {
    console.error('Create shopping service coupon error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const { skip, pageSize: size } = calculatePagination(page, pageSize)
    
    const now = new Date()
    const query = {
      status: 'active',
      validFrom: { $lte: now },
      validTo: { $gte: now }
    }
    
    const total = await Coupon.countDocuments(query)
    const coupons = await Coupon.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(size)
      .lean()
    
    res.json(paginatedResponse(coupons, total, page, size))
  } catch (err) {
    console.error('List coupons error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const claim = async (req, res) => {
  try {
    const { id } = req.params
    
    const coupon = await Coupon.findById(id)
    if (!coupon) {
      return res.status(404).json(errorResponse('Coupon not found', 404))
    }
    
    if (coupon.status !== 'active') {
      return res.status(400).json(errorResponse('Coupon is not active', 400))
    }
    
    if (coupon.usageCount >= coupon.usageLimit) {
      return res.status(400).json(errorResponse('Coupon usage limit exceeded', 400))
    }
    
    const now = new Date()
    if (now < coupon.validFrom || now > coupon.validTo) {
      return res.status(400).json(errorResponse('Coupon expired', 400))
    }
    
    coupon.usageCount += 1
    await coupon.save()
    
    res.json(successResponse(coupon, 'Coupon claimed successfully'))
  } catch (err) {
    console.error('Claim coupon error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  list,
  claim,
  adminList,
  create,
  update,
  remove,
  createShoppingServiceCoupon
}
