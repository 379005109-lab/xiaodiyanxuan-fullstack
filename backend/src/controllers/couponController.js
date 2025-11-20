const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Coupon = require('../models/Coupon')
const { calculatePagination } = require('../utils/helpers')

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
  claim
}
