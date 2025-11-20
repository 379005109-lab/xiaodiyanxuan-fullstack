const express = require('express')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')
const { list, claim } = require('../controllers/couponController')

// GET /api/coupons - 获取优惠券列表（可选认证）
router.get('/', optionalAuth, list)

// POST /api/coupons/:id/claim - 领取优惠券（需要认证）
router.post('/:id/claim', auth, claim)

module.exports = router
