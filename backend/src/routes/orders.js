const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { create, list, getOrder, cancel, confirm } = require('../controllers/orderController')
const packageOrderController = require('../controllers/packageOrderController')
const { sendEmail, testConnection, ADMIN_EMAIL } = require('../services/emailService')

// 所有订单路由都需要认证
router.use(auth)

// ========== 邮件测试路由 ==========
// POST /api/orders/test-email - 测试邮件发送
router.post('/test-email', async (req, res) => {
  try {
    // 测试连接
    const connected = await testConnection()
    if (!connected) {
      return res.status(500).json({ success: false, message: '邮件服务连接失败' })
    }
    
    // 发送测试邮件
    const result = await sendEmail(
      ADMIN_EMAIL,
      '【测试】小迪严选邮件通知测试',
      `
        <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; padding: 20px;">
          <h1 style="color: #667eea;">✅ 邮件服务配置成功！</h1>
          <p>恭喜，您的邮件通知服务已正常工作。</p>
          <p>当有新订单时，您将收到邮件通知。</p>
          <p style="color: #999; margin-top: 20px;">发送时间：${new Date().toLocaleString('zh-CN')}</p>
        </div>
      `
    )
    
    if (result.success) {
      res.json({ success: true, message: '测试邮件已发送，请检查您的邮箱' })
    } else {
      res.status(500).json({ success: false, message: '邮件发送失败', error: result.error })
    }
  } catch (error) {
    console.error('测试邮件错误:', error)
    res.status(500).json({ success: false, message: error.message })
  }
})

// ========== 订单统计路由 ==========
// GET /api/orders/stats - 获取订单统计数据（数据看板）
router.get('/stats', async (req, res) => {
  try {
    const Order = require('../models/Order')
    const { ORDER_STATUS } = require('../config/constants')
    
    // 获取日期范围
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // 本周开始
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    
    // 本月开始
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    
    // 基础统计
    const [
      totalOrders,
      totalRevenue,
      todayOrders,
      todayRevenue,
      weekOrders,
      weekRevenue,
      monthOrders,
      monthRevenue,
      statusCounts
    ] = await Promise.all([
      // 总订单数（排除已删除）
      Order.countDocuments({ isDeleted: { $ne: true } }),
      // 总收入
      Order.aggregate([
        { $match: { isDeleted: { $ne: true }, status: { $nin: [5, 6, 'cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // 今日订单
      Order.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: today, $lt: tomorrow } }),
      // 今日收入
      Order.aggregate([
        { $match: { isDeleted: { $ne: true }, createdAt: { $gte: today, $lt: tomorrow }, status: { $nin: [5, 6, 'cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // 本周订单
      Order.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: weekStart } }),
      // 本周收入
      Order.aggregate([
        { $match: { isDeleted: { $ne: true }, createdAt: { $gte: weekStart }, status: { $nin: [5, 6, 'cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // 本月订单
      Order.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: monthStart } }),
      // 本月收入
      Order.aggregate([
        { $match: { isDeleted: { $ne: true }, createdAt: { $gte: monthStart }, status: { $nin: [5, 6, 'cancelled'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ]),
      // 各状态订单数
      Order.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ])
    ])
    
    // 构建状态分布
    const statusBreakdown = {
      pending: 0,      // 待付款 (1)
      paid: 0,         // 已付款/待发货 (2)
      shipped: 0,      // 已发货/待收货 (3)
      completed: 0,    // 已完成 (4)
      cancelled: 0,    // 已取消 (5)
      refunding: 0,    // 退款中
      refunded: 0,     // 已退款
    }
    
    statusCounts.forEach(item => {
      const s = item._id
      if (s === 1 || s === 'pending') statusBreakdown.pending = item.count
      else if (s === 2 || s === 'paid' || s === 'processing') statusBreakdown.paid = item.count
      else if (s === 3 || s === 'shipped') statusBreakdown.shipped = item.count
      else if (s === 4 || s === 'completed') statusBreakdown.completed = item.count
      else if (s === 5 || s === 6 || s === 'cancelled') statusBreakdown.cancelled = item.count
      else if (s === 'refunding') statusBreakdown.refunding = item.count
      else if (s === 'refunded') statusBreakdown.refunded = item.count
    })
    
    // 获取最近7天趋势数据
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    
    const dailyTrend = await Order.aggregate([
      { $match: { isDeleted: { $ne: true }, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $in: ['$status', [5, 6, 'cancelled']] }, 0, '$totalAmount'] } }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 获取最近10个订单
    const recentOrders = await Order.find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    
    const totalRevenueValue = totalRevenue[0]?.total || 0
    const avgOrderValue = totalOrders > 0 ? totalRevenueValue / totalOrders : 0
    
    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue: totalRevenueValue,
        avgOrderValue,
        todayOrders,
        todayRevenue: todayRevenue[0]?.total || 0,
        weekOrders,
        weekRevenue: weekRevenue[0]?.total || 0,
        monthOrders,
        monthRevenue: monthRevenue[0]?.total || 0,
        pendingOrders: statusBreakdown.pending + statusBreakdown.paid,
        completedOrders: statusBreakdown.completed,
        statusBreakdown,
        dailyTrend: dailyTrend.map(d => ({ date: d._id, orders: d.orders, revenue: d.revenue })),
        recentOrders
      }
    })
  } catch (error) {
    console.error('获取订单统计失败:', error)
    res.status(500).json({ success: false, message: '获取订单统计失败' })
  }
})

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

// PATCH /api/orders/:id/status - 更新订单状态
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status, paymentMethod, shippingCompany, trackingNumber } = req.body
    const Order = require('../models/Order')
    const { ORDER_STATUS } = require('../config/constants')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    const validStatuses = Object.values(ORDER_STATUS)
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '无效的订单状态' })
    }
    
    const oldStatus = order.status
    order.status = status
    
    // 根据状态更新时间字段和其他信息
    if (status === ORDER_STATUS.PENDING_SHIPMENT || status === 2) {
      order.paidAt = new Date()
      if (paymentMethod) order.paymentMethod = paymentMethod
    } else if (status === ORDER_STATUS.PENDING_RECEIPT || status === 3) {
      order.shippedAt = new Date()
      if (shippingCompany) order.shippingCompany = shippingCompany
      if (trackingNumber) order.trackingNumber = trackingNumber
    } else if (status === 4) {
      order.shippedAt = new Date()
      if (shippingCompany) order.shippingCompany = shippingCompany
      if (trackingNumber) order.trackingNumber = trackingNumber
    } else if (status === ORDER_STATUS.COMPLETED || status === 5) {
      order.completedAt = new Date()
    } else if (status === ORDER_STATUS.CANCELLED || status === 6) {
      order.cancelledAt = new Date()
      order.cancelRequest = false
    }
    
    order.updatedAt = new Date()
    await order.save()
    
    console.log('📝 更新订单状态:', id, oldStatus, '->', status)
    res.json({ success: true, message: '状态更新成功', data: order })
  } catch (error) {
    console.error('更新订单状态失败:', error)
    res.status(500).json({ success: false, message: '更新订单状态失败' })
  }
})

// PATCH /api/orders/:id - 更新订单信息（商家备注、状态等）
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { adminNote, status } = req.body
    const Order = require('../models/Order')
    const { ORDER_STATUS } = require('../config/constants')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    // 更新商家备注
    if (adminNote !== undefined) {
      order.adminNote = adminNote
      console.log('📝 更新商家备注:', id, adminNote)
    }
    
    // 更新订单状态
    if (status !== undefined) {
      const validStatuses = Object.values(ORDER_STATUS)
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: '无效的订单状态' })
      }
      
      const oldStatus = order.status
      order.status = status
      
      // 根据状态更新时间字段
      if (status === ORDER_STATUS.PENDING_SHIPMENT && oldStatus === ORDER_STATUS.PENDING_PAYMENT) {
        order.paidAt = new Date()
      } else if (status === ORDER_STATUS.PENDING_RECEIPT && oldStatus === ORDER_STATUS.PENDING_SHIPMENT) {
        order.shippedAt = new Date()
      } else if (status === ORDER_STATUS.COMPLETED) {
        order.completedAt = new Date()
      } else if (status === ORDER_STATUS.CANCELLED) {
        order.cancelledAt = new Date()
        order.cancelRequest = false  // 清除取消请求标记
      }
      
      console.log('📝 更新订单状态:', id, oldStatus, '->', status)
    }
    
    order.updatedAt = new Date()
    await order.save()
    
    res.json({ success: true, message: '订单更新成功', data: order })
  } catch (error) {
    console.error('更新订单失败:', error)
    res.status(500).json({ success: false, message: '更新订单失败' })
  }
})

// DELETE /api/orders/:id - 删除订单（软删除，移至回收站）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    // 查找订单
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    // 管理员可以删除任何订单，普通用户只能删除自己的
    const isAdmin = req.userRole === 'admin' || req.userRole === 'superadmin'
    if (!isAdmin && order.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ success: false, message: '无权删除此订单' })
    }
    
    // 普通用户只能删除已取消或已完成的订单
    if (!isAdmin && order.status !== 5 && order.status !== 4 && order.status !== 'cancelled' && order.status !== 'completed') {
      return res.status(400).json({ success: false, message: '只能删除已取消或已完成的订单' })
    }
    
    // 软删除订单（移至回收站）
    order.isDeleted = true
    order.deletedAt = new Date()
    order.deletedBy = req.userId
    await order.save()
    
    console.log('🗑️ 订单已移至回收站:', id)
    res.json({ success: true, message: '订单已移至回收站' })
  } catch (error) {
    console.error('删除订单失败:', error)
    res.status(500).json({ success: false, message: '删除订单失败' })
  }
})

// GET /api/orders/trash - 获取回收站订单列表
router.get('/trash/list', async (req, res) => {
  try {
    const Order = require('../models/Order')
    const { page = 1, pageSize = 20 } = req.query
    
    const skip = (Number(page) - 1) * Number(pageSize)
    
    const [orders, total] = await Promise.all([
      Order.find({ isDeleted: true })
        .sort({ deletedAt: -1 })
        .skip(skip)
        .limit(Number(pageSize))
        .lean(),
      Order.countDocuments({ isDeleted: true })
    ])
    
    res.json({
      success: true,
      data: {
        orders,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages: Math.ceil(total / Number(pageSize))
      }
    })
  } catch (error) {
    console.error('获取回收站订单失败:', error)
    res.status(500).json({ success: false, message: '获取回收站订单失败' })
  }
})

// PATCH /api/orders/:id/price - 修改订单价格（改价）
router.patch('/:id/price', async (req, res) => {
  try {
    const { id } = req.params
    const { totalAmount, reason } = req.body
    const Order = require('../models/Order')
    
    // 验证权限（只有管理员可以改价）
    const isAdmin = req.userRole === 'admin' || req.userRole === 'superadmin' || req.userRole === 'super_admin'
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: '只有管理员可以修改订单价格' })
    }
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    // 只有待付款订单可以改价
    if (order.status !== 1 && order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '只有待付款订单可以修改价格' })
    }
    
    // 记录原价格
    const originalAmount = order.totalAmount
    
    // 更新价格
    order.totalAmount = totalAmount
    order.priceModified = true
    order.priceModifyHistory = order.priceModifyHistory || []
    order.priceModifyHistory.push({
      originalAmount,
      newAmount: totalAmount,
      reason: reason || '管理员改价',
      modifiedBy: req.userId,
      modifiedAt: new Date()
    })
    
    await order.save()
    
    console.log('💰 订单价格已修改:', id, originalAmount, '->', totalAmount)
    res.json({ 
      success: true, 
      message: '价格修改成功',
      data: {
        orderId: id,
        originalAmount,
        newAmount: totalAmount
      }
    })
  } catch (error) {
    console.error('修改订单价格失败:', error)
    res.status(500).json({ success: false, message: '修改价格失败' })
  }
})

// POST /api/orders/:id/restore - 恢复订单
router.post('/:id/restore', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (!order.isDeleted) {
      return res.status(400).json({ success: false, message: '该订单不在回收站中' })
    }
    
    // 恢复订单
    order.isDeleted = false
    order.deletedAt = null
    order.deletedBy = null
    await order.save()
    
    console.log('♻️ 订单已恢复:', id)
    res.json({ success: true, message: '订单已恢复', data: order })
  } catch (error) {
    console.error('恢复订单失败:', error)
    res.status(500).json({ success: false, message: '恢复订单失败' })
  }
})

// DELETE /api/orders/:id/permanent - 永久删除订单
router.delete('/:id/permanent', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (!order.isDeleted) {
      return res.status(400).json({ success: false, message: '只能永久删除回收站中的订单' })
    }
    
    // 永久删除
    await Order.findByIdAndDelete(id)
    
    console.log('🗑️ 订单已永久删除:', id)
    res.json({ success: true, message: '订单已永久删除' })
  } catch (error) {
    console.error('永久删除订单失败:', error)
    res.status(500).json({ success: false, message: '永久删除订单失败' })
  }
})

module.exports = router
