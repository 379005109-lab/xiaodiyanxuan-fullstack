const express = require('express')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')
const { list, claim, adminList, create, update, remove, createShoppingServiceCoupon } = require('../controllers/couponController')

// ==================== 后台管理接口 ====================

// GET /api/coupons/admin - 后台获取所有优惠券
router.get('/admin', auth, adminList)

// POST /api/coupons - 创建优惠券
router.post('/', auth, create)

// PUT /api/coupons/:id - 更新优惠券
router.put('/:id', auth, update)

// DELETE /api/coupons/:id - 删除优惠券
router.delete('/:id', auth, remove)

// POST /api/coupons/shopping-service - 陪买服务自动发券
router.post('/shopping-service', auth, createShoppingServiceCoupon)

// ==================== 前端接口 ====================

// GET /api/coupons - 获取优惠券列表（可选认证）
router.get('/', optionalAuth, list)

// POST /api/coupons/:id/claim - 领取优惠券（需要认证）
router.post('/:id/claim', auth, claim)

module.exports = router
