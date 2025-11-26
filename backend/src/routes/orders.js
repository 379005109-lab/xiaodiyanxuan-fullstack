const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { create, list, getOrder, cancel, confirm } = require('../controllers/orderController')
const packageOrderController = require('../controllers/packageOrderController')

// 所有订单路由都需要认证
router.use(auth)

// ========== 套餐订单路由 ==========
// POST /api/orders/package - 创建套餐订单
router.post('/package', packageOrderController.create)

// GET /api/orders/package/:id - 获取套餐订单详情
router.get('/package/:id', packageOrderController.getDetail)

// ========== 普通订单路由 ==========
// POST /api/orders - 创建订单
router.post('/', create)

// GET /api/orders - 获取订单列表
router.get('/', list)

// GET /api/orders/:id - 获取订单详情
router.get('/:id', getOrder)

// POST /api/orders/:id/cancel - 取消订单
router.post('/:id/cancel', cancel)
router.put('/:id/cancel', cancel)  // 支持PUT方法

// POST /api/orders/:id/confirm - 确认收货
router.post('/:id/confirm', confirm)

// GET /api/orders/cancel-requests - 获取所有取消请求
router.get('/cancel-requests', async (req, res) => {
  try {
    const Order = require('../models/Order')
    
    const requests = await Order.find({ cancelRequest: true })
      .sort({ cancelRequestedAt: -1 })
      .lean()
    
    res.json({
      success: true,
      data: requests
    })
  } catch (error) {
    console.error('获取取消请求失败:', error)
    res.status(500).json({ success: false, message: '获取取消请求失败' })
  }
})

// POST /api/orders/:id/cancel-approve - 批准取消订单
router.post('/:id/cancel-approve', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    const { ORDER_STATUS } = require('../config/constants')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (!order.cancelRequest) {
      return res.status(400).json({ success: false, message: '该订单没有取消请求' })
    }
    
    // 批准取消
    order.status = ORDER_STATUS.CANCELLED
    order.cancelledAt = new Date()
    order.cancelRequest = false
    await order.save()
    
    console.log('✅ 订单取消请求已批准:', id)
    res.json({ success: true, message: '已批准取消订单', data: order })
  } catch (error) {
    console.error('批准取消失败:', error)
    res.status(500).json({ success: false, message: '批准取消失败' })
  }
})

// POST /api/orders/:id/cancel-reject - 拒绝取消订单
router.post('/:id/cancel-reject', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (!order.cancelRequest) {
      return res.status(400).json({ success: false, message: '该订单没有取消请求' })
    }
    
    // 拒绝取消，清除取消请求标记
    order.cancelRequest = false
    order.cancelRequestedAt = null
    await order.save()
    
    console.log('❌ 订单取消请求已拒绝:', id)
    res.json({ success: true, message: '已拒绝取消请求', data: order })
  } catch (error) {
    console.error('拒绝取消失败:', error)
    res.status(500).json({ success: false, message: '拒绝取消失败' })
  }
})

// DELETE /api/orders/:id - 删除订单（直接删除）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    // 查找订单
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    // 验证订单所有者
    if (order.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: '无权删除此订单' })
    }
    
    // 只能删除已取消或已完成的订单
    if (order.status !== 5 && order.status !== 4 && order.status !== 'cancelled' && order.status !== 'completed') {
      return res.status(400).json({ success: false, message: '只能删除已取消或已完成的订单' })
    }
    
    // 直接删除订单
    await Order.findByIdAndDelete(id)
    
    console.log('🗑️ 订单已删除:', id)
    res.json({ success: true, message: '订单已删除' })
  } catch (error) {
    console.error('删除订单失败:', error)
    res.status(500).json({ success: false, message: '删除订单失败' })
  }
})

module.exports = router
