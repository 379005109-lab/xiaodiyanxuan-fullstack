const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { create, list, getOrder, cancel, confirm } = require('../controllers/orderController')

// 所有订单路由都需要认证
router.use(auth)

// POST /api/orders - 创建订单
router.post('/', create)

// GET /api/orders - 获取订单列表
router.get('/', list)

// GET /api/orders/:id - 获取订单详情
router.get('/:id', getOrder)

// POST /api/orders/:id/cancel - 取消订单
router.post('/:id/cancel', cancel)

// POST /api/orders/:id/confirm - 确认收货
router.post('/:id/confirm', confirm)

module.exports = router
