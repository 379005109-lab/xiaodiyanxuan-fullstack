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

// POST /api/orders/:id/pay - 确认付款
router.post('/:id/pay', async (req, res) => {
  try {
    const { id } = req.params
    const { paymentMethod } = req.body
    const Order = require('../models/Order')
    const { ORDER_STATUS } = require('../config/constants')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (order.status !== ORDER_STATUS.PENDING_PAYMENT) {
      return res.status(400).json({ success: false, message: '订单状态不允许付款' })
    }
    
    order.status = ORDER_STATUS.PENDING_SHIPMENT
    order.paymentMethod = paymentMethod || 'wechat'
    order.paidAt = new Date()
    
    await order.save()
    console.log(`✅ 订单 ${order.orderNo} 付款成功，状态更新为待发货`)
    
    res.json({ success: true, message: '付款成功', data: order })
  } catch (error) {
    console.error('付款失败:', error)
    res.status(500).json({ success: false, message: '付款失败' })
  }
})

// POST /api/orders/:id/manufacturer-confirm - 厂家确认订单（状态从0变为1）
router.post('/:id/manufacturer-confirm', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    const { ORDER_STATUS } = require('../config/constants')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (order.status !== ORDER_STATUS.PENDING_CONFIRMATION) {
      return res.status(400).json({ success: false, message: '订单状态不允许确认，当前状态需为待确认' })
    }
    
    order.status = ORDER_STATUS.PENDING_PAYMENT
    order.confirmedAt = new Date()
    await order.save()
    
    console.log(`✅ 订单 ${order.orderNo} 厂家已确认，状态更新为待付款`)
    res.json({ success: true, message: '订单已确认，等待用户付款', data: order })
  } catch (error) {
    console.error('厂家确认订单失败:', error)
    res.status(500).json({ success: false, message: '确认订单失败' })
  }
})

// POST /api/orders/:id/settlement-mode - 选择结算模式
router.post('/:id/settlement-mode', async (req, res) => {
  console.log('📍 [settlement-mode] 收到请求:', req.params.id, req.body)
  try {
    const { id } = req.params
    const { settlementMode, minDiscountRate, commissionRate, paymentRatio } = req.body
    const Order = require('../models/Order')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    // 获取原价（商城标价）
    const originalPrice = order.totalAmount || 0
    
    // 使用传入的折扣率和返佣率，或使用默认值
    const discountRate = minDiscountRate || 0.6
    const commRate = commissionRate || 0.4
    
    // 计算价格
    const minDiscountPrice = originalPrice * discountRate           // 最低折扣价
    const commissionAmount = minDiscountPrice * commRate            // 返佣金额
    const supplierPrice = minDiscountPrice - commissionAmount       // 供应商价格（一键到底）
    
    // 更新订单
    order.settlementMode = settlementMode
    order.originalPrice = originalPrice
    order.minDiscountRate = discountRate
    order.commissionRate = commRate
    order.minDiscountPrice = minDiscountPrice
    order.commissionAmount = commissionAmount
    order.supplierPrice = supplierPrice
    
    if (settlementMode === 'supplier_transfer') {
      // 供应商调货模式：直接使用供应商价格
      order.totalAmount = supplierPrice
      order.paymentRatioEnabled = false
      order.commissionStatus = null  // 返佣已包含在价格中
    } else if (settlementMode === 'commission_mode') {
      // 返佣模式：使用最低折扣价，返佣单独申请
      order.totalAmount = minDiscountPrice
      order.commissionStatus = 'pending'  // 返佣待申请
      
      // 检查是否启用分期付款
      if (paymentRatio && paymentRatio < 100) {
        order.paymentRatioEnabled = true
        order.paymentRatio = paymentRatio
        order.firstPaymentAmount = Math.round(minDiscountPrice * paymentRatio / 100)
        order.remainingPaymentAmount = minDiscountPrice - order.firstPaymentAmount
        order.remainingPaymentStatus = 'pending'
      }
    }
    
    await order.save()
    
    console.log(`✅ 订单 ${order.orderNo} 结算模式设置为: ${settlementMode}`)
    res.json({ 
      success: true, 
      message: settlementMode === 'supplier_transfer' ? '已选择供应商调货模式' : '已选择返佣模式',
      data: order 
    })
  } catch (error) {
    console.error('设置结算模式失败:', error)
    res.status(500).json({ success: false, message: '设置结算模式失败' })
  }
})

// GET /api/orders/:id/payment-info - 获取订单支付信息（收款码等）
router.get('/:id/payment-info', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    const Manufacturer = require('../models/Manufacturer')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    // 获取订单关联的厂家ID
    const manufacturerId = order.manufacturerId || order.items?.[0]?.manufacturerId
    
    let paymentInfo = {
      wechatQrCode: null,
      alipayQrCode: null,
      bankInfo: null,
      paymentAccounts: []
    }
    
    if (manufacturerId) {
      const manufacturer = await Manufacturer.findById(manufacturerId)
      if (manufacturer?.settings) {
        paymentInfo = {
          wechatQrCode: manufacturer.settings.wechatQrCode,
          alipayQrCode: manufacturer.settings.alipayQrCode,
          bankInfo: manufacturer.settings.bankInfo,
          paymentAccounts: manufacturer.settings.paymentAccounts || []
        }
      }
    }
    
    res.json({ 
      success: true, 
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        totalAmount: order.totalAmount,
        ...paymentInfo
      }
    })
  } catch (error) {
    console.error('获取支付信息失败:', error)
    res.status(500).json({ success: false, message: '获取支付信息失败' })
  }
})

// POST /api/orders/:id/request-remaining-payment - 厂家发起尾款收款
router.post('/:id/request-remaining-payment', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (!order.paymentRatioEnabled) {
      return res.status(400).json({ success: false, message: '该订单未启用分期付款' })
    }
    
    if (order.remainingPaymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: '尾款已支付' })
    }
    
    order.remainingPaymentRemindedAt = new Date()
    await order.save()
    
    console.log(`✅ 订单 ${order.orderNo} 尾款收款提醒已发送`)
    res.json({ 
      success: true, 
      message: `尾款收款提醒已发送，待收金额: ¥${order.remainingPaymentAmount}`,
      data: order 
    })
  } catch (error) {
    console.error('发起尾款收款失败:', error)
    res.status(500).json({ success: false, message: '发起尾款收款失败' })
  }
})

// POST /api/orders/:id/pay-remaining - 用户支付尾款
router.post('/:id/pay-remaining', async (req, res) => {
  try {
    const { id } = req.params
    const { paymentMethod } = req.body
    const Order = require('../models/Order')
    const { ORDER_STATUS } = require('../config/constants')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (!order.paymentRatioEnabled) {
      return res.status(400).json({ success: false, message: '该订单未启用分期付款' })
    }
    
    if (order.remainingPaymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: '尾款已支付' })
    }
    
    order.remainingPaymentStatus = 'paid'
    order.remainingPaymentPaidAt = new Date()
    order.paymentMethod = paymentMethod || order.paymentMethod
    
    await order.save()
    
    console.log(`✅ 订单 ${order.orderNo} 尾款支付成功`)
    res.json({ success: true, message: '尾款支付成功', data: order })
  } catch (error) {
    console.error('尾款支付失败:', error)
    res.status(500).json({ success: false, message: '尾款支付失败' })
  }
})

// POST /api/orders/:id/apply-commission - 用户申请返佣
router.post('/:id/apply-commission', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (order.settlementMode !== 'commission_mode') {
      return res.status(400).json({ success: false, message: '该订单不是返佣模式' })
    }
    
    if (order.commissionStatus !== 'pending') {
      return res.status(400).json({ success: false, message: '返佣状态不允许申请' })
    }
    
    order.commissionStatus = 'applied'
    order.commissionAppliedAt = new Date()
    await order.save()
    
    console.log(`✅ 订单 ${order.orderNo} 返佣申请已提交，金额: ¥${order.commissionAmount}`)
    res.json({ 
      success: true, 
      message: `返佣申请已提交，金额: ¥${order.commissionAmount}`,
      data: order 
    })
  } catch (error) {
    console.error('返佣申请失败:', error)
    res.status(500).json({ success: false, message: '返佣申请失败' })
  }
})

// POST /api/orders/:id/approve-commission - 厂家核销返佣
router.post('/:id/approve-commission', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (order.commissionStatus !== 'applied') {
      return res.status(400).json({ success: false, message: '该订单没有待核销的返佣申请' })
    }
    
    order.commissionStatus = 'approved'
    order.commissionApprovedAt = new Date()
    await order.save()
    
    console.log(`✅ 订单 ${order.orderNo} 返佣已核销`)
    res.json({ success: true, message: '返佣已核销', data: order })
  } catch (error) {
    console.error('返佣核销失败:', error)
    res.status(500).json({ success: false, message: '返佣核销失败' })
  }
})

// POST /api/orders/:id/pay-commission - 厂家发放返佣
router.post('/:id/pay-commission', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (order.commissionStatus !== 'approved') {
      return res.status(400).json({ success: false, message: '返佣未核销，无法发放' })
    }
    
    order.commissionStatus = 'paid'
    order.commissionPaidAt = new Date()
    await order.save()
    
    console.log(`✅ 订单 ${order.orderNo} 返佣已发放，金额: ¥${order.commissionAmount}`)
    res.json({ 
      success: true, 
      message: `返佣已发放，金额: ¥${order.commissionAmount}`,
      data: order 
    })
  } catch (error) {
    console.error('返佣发放失败:', error)
    res.status(500).json({ success: false, message: '返佣发放失败' })
  }
})

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
      
      // 发货后检查是否有尾款需要支付，发送提醒
      if (order.paymentRatioEnabled && order.remainingPaymentAmount > 0 && order.remainingPaymentStatus === 'pending') {
        order.remainingPaymentRemindedAt = new Date()
        console.log('💰 订单发货，需支付尾款:', order.orderNo, '尾款金额:', order.remainingPaymentAmount)
        // TODO: 可以在这里添加短信/邮件提醒逻辑
      }
    } else if (status === 4) {
      order.shippedAt = new Date()
      if (shippingCompany) order.shippingCompany = shippingCompany
      if (trackingNumber) order.trackingNumber = trackingNumber
      
      // 发货后检查是否有尾款需要支付
      if (order.paymentRatioEnabled && order.remainingPaymentAmount > 0 && order.remainingPaymentStatus === 'pending') {
        order.remainingPaymentRemindedAt = new Date()
        console.log('💰 订单发货，需支付尾款:', order.orderNo, '尾款金额:', order.remainingPaymentAmount)
      }
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
        
        // 发货后检查是否有尾款需要支付
        if (order.paymentRatioEnabled && order.remainingPaymentAmount > 0 && order.remainingPaymentStatus === 'pending') {
          order.remainingPaymentRemindedAt = new Date()
          console.log('💰 订单发货，需支付尾款:', order.orderNo, '尾款金额:', order.remainingPaymentAmount)
        }
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

// POST /api/orders/:id/pay-remaining - 确认尾款支付
router.post('/:id/pay-remaining', async (req, res) => {
  try {
    const { id } = req.params
    const Order = require('../models/Order')
    
    const order = await Order.findById(id)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    if (!order.paymentRatioEnabled) {
      return res.status(400).json({ success: false, message: '该订单未启用分期付款' })
    }
    
    if (order.remainingPaymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: '尾款已支付' })
    }
    
    order.remainingPaymentStatus = 'paid'
    order.remainingPaymentPaidAt = new Date()
    order.updatedAt = new Date()
    await order.save()
    
    console.log('💰 尾款支付确认:', order.orderNo, '金额:', order.remainingPaymentAmount)
    
    res.json({ success: true, message: '尾款支付确认成功', data: order })
  } catch (error) {
    console.error('确认尾款支付失败:', error)
    res.status(500).json({ success: false, message: '确认尾款支付失败' })
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
    const { totalAmount, reason, priceMode, itemPrices } = req.body
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
    const nextAmount = Number(totalAmount)
    if (Number.isNaN(nextAmount) || nextAmount < 0) {
      return res.status(400).json({ success: false, message: '请输入有效的价格' })
    }

    order.totalAmount = nextAmount
    order.priceModified = true
    order.priceModifyHistory = order.priceModifyHistory || []
    order.priceModifyHistory.push({
      originalAmount,
      newAmount: nextAmount,
      reason: reason || '管理员改价',
      priceMode: priceMode || null,
      itemPrices: itemPrices || null,
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
        newAmount: nextAmount
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

// POST /api/orders/:id/split - 分单（按厂家拆分订单）
router.post('/:id/split', async (req, res) => {
  try {
    const { id } = req.params
    const { splitByManufacturer = true, notifyManufacturers = true } = req.body
    const Order = require('../models/Order')
    const Manufacturer = require('../models/Manufacturer')
    
    const order = await Order.findById(id).populate('items.manufacturer')
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    // 只有待发货状态的订单可以分单
    if (order.status !== 2 && order.status !== 'paid') {
      return res.status(400).json({ success: false, message: '只有待发货状态的订单可以分单' })
    }
    
    // 按厂家分组商品
    const manufacturerGroups = {}
    ;(order.items || []).forEach((item, index) => {
      const mfId = item.manufacturerId?.toString() || item.manufacturer?._id?.toString() || 'unknown'
      if (!manufacturerGroups[mfId]) {
        manufacturerGroups[mfId] = {
          manufacturer: item.manufacturer,
          manufacturerId: mfId,
          items: []
        }
      }
      manufacturerGroups[mfId].items.push(item)
    })
    
    const manufacturerIds = Object.keys(manufacturerGroups)
    
    // 如果只有一个厂家，无需分单
    if (manufacturerIds.length <= 1) {
      return res.status(400).json({ success: false, message: '订单只有一个厂家，无需分单' })
    }
    
    // 创建子订单
    const subOrders = []
    for (const mfId of manufacturerIds) {
      const group = manufacturerGroups[mfId]
      const subOrderItems = group.items
      const subTotalAmount = subOrderItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
      
      const subOrder = new Order({
        orderNo: `${order.orderNo}-${mfId.slice(-4)}`,
        user: order.user,
        items: subOrderItems,
        totalAmount: subTotalAmount,
        status: order.status,
        recipient: order.recipient,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        notes: order.notes,
        parentOrderId: order._id,
        manufacturerId: mfId !== 'unknown' ? mfId : undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      
      await subOrder.save()
      subOrders.push(subOrder)
      
      // 通知厂家（如果需要）
      if (notifyManufacturers && mfId !== 'unknown') {
        try {
          const manufacturer = await Manufacturer.findById(mfId)
          if (manufacturer?.smsPhone) {
            // TODO: 发送短信或微信通知给厂家
            console.log(`📱 通知厂家 ${manufacturer.name} 有新的分单订单: ${subOrder.orderNo}`)
          }
        } catch (notifyError) {
          console.error('通知厂家失败:', notifyError)
        }
      }
    }
    
    // 标记原订单已分单
    order.isSplit = true
    order.splitOrderIds = subOrders.map(so => so._id)
    order.splitAt = new Date()
    await order.save()
    
    console.log(`📦 订单 ${order.orderNo} 已分单为 ${subOrders.length} 个子订单`)
    
    res.json({
      success: true,
      message: `订单已成功分为 ${subOrders.length} 个子订单`,
      data: {
        originalOrder: order._id,
        subOrders: subOrders.map(so => ({
          _id: so._id,
          orderNo: so.orderNo,
          manufacturerId: so.manufacturerId,
          itemCount: so.items.length,
          totalAmount: so.totalAmount
        }))
      }
    })
  } catch (error) {
    console.error('分单失败:', error)
    res.status(500).json({ success: false, message: '分单失败: ' + error.message })
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
