const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Refund = require('../models/Refund')
const Order = require('../models/Order')
const { auth } = require('../middleware/auth')

// 验证 ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// 获取退款列表
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query
    
    const query = {}
    if (status && status !== 'all') {
      query.status = status
    }
    
    const total = await Refund.countDocuments(query)
    const refunds = await Refund.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()
    
    res.json({
      success: true,
      data: refunds,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / pageSize)
      }
    })
  } catch (error) {
    console.error('获取退款列表失败:', error)
    res.status(500).json({ success: false, message: '获取退款列表失败' })
  }
})

// 获取单个退款详情
router.get('/:id', auth, async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate('orderId')
      .lean()
    
    if (!refund) {
      return res.status(404).json({ success: false, message: '退款记录不存在' })
    }
    
    res.json({ success: true, data: refund })
  } catch (error) {
    console.error('获取退款详情失败:', error)
    res.status(500).json({ success: false, message: '获取退款详情失败' })
  }
})

// 创建退款申请
router.post('/', auth, async (req, res) => {
  try {
    const { orderId, orderNo, products, reason, customReason, totalAmount, buyerName, buyerPhone } = req.body
    
    // 检查订单是否存在
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' })
    }
    
    // 检查是否已有待处理的退款申请
    const existingRefund = await Refund.findOne({ 
      orderId, 
      status: { $in: ['pending', 'approved'] }
    })
    if (existingRefund) {
      return res.status(400).json({ success: false, message: '该订单已有进行中的退款申请' })
    }
    
    // 创建退款记录
    const refund = await Refund.create({
      orderId,
      orderNo: orderNo || order.orderNo,
      userId: order.userId,
      buyerName: buyerName || order.recipient?.name,
      buyerPhone: buyerPhone || order.recipient?.phone,
      products,
      totalAmount,
      reason,
      customReason,
      status: 'pending'
    })
    
    // 更新订单状态为退款中
    await Order.findByIdAndUpdate(orderId, { 
      status: 6,  // 退款中
      refundId: refund._id,
      refundStatus: 'pending'
    })
    
    res.json({ success: true, data: refund, message: '退款申请已提交' })
  } catch (error) {
    console.error('创建退款申请失败:', error)
    res.status(500).json({ success: false, message: '创建退款申请失败' })
  }
})

// 处理退款申请（同意/拒绝）
router.put('/:id/handle', auth, async (req, res) => {
  try {
    const { action, handleRemark } = req.body
    const refundId = req.params.id
    
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: '无效的操作' })
    }
    
    if (!isValidObjectId(refundId)) {
      return res.status(400).json({ success: false, message: '无效的退款ID' })
    }
    
    const refund = await Refund.findById(refundId)
    if (!refund) {
      return res.status(404).json({ success: false, message: '退款记录不存在' })
    }
    
    if (refund.status !== 'pending') {
      return res.status(400).json({ success: false, message: '该退款申请已处理' })
    }
    
    const newStatus = action === 'approve' ? 'approved' : 'rejected'
    
    refund.status = newStatus
    refund.handleRemark = handleRemark
    refund.handledBy = req.userId
    refund.handledAt = new Date()
    await refund.save()
    
    // 更新订单状态
    if (action === 'approve') {
      await Order.findByIdAndUpdate(refund.orderId, { 
        status: 6,  // 退款中
        refundStatus: 'approved'
      })
    } else {
      // 拒绝退款，恢复订单原状态
      await Order.findByIdAndUpdate(refund.orderId, { 
        status: 3,  // 已发货/待收货
        refundId: null,
        refundStatus: 'rejected'
      })
    }
    
    res.json({ success: true, data: refund, message: action === 'approve' ? '已同意退款' : '已拒绝退款' })
  } catch (error) {
    console.error('处理退款申请失败:', error)
    res.status(500).json({ success: false, message: '处理退款申请失败' })
  }
})

// 完成退款
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
    if (!refund) {
      return res.status(404).json({ success: false, message: '退款记录不存在' })
    }
    
    if (refund.status !== 'approved') {
      return res.status(400).json({ success: false, message: '只有已同意的退款才能完成' })
    }
    
    refund.status = 'completed'
    await refund.save()
    
    // 更新订单状态为已退款
    await Order.findByIdAndUpdate(refund.orderId, { 
      status: 7,  // 已退款
      refundStatus: 'completed'
    })
    
    res.json({ success: true, data: refund, message: '退款已完成' })
  } catch (error) {
    console.error('完成退款失败:', error)
    res.status(500).json({ success: false, message: '完成退款失败' })
  }
})

// 删除退款记录
router.delete('/:id', auth, async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
    if (!refund) {
      return res.status(404).json({ success: false, message: '退款记录不存在' })
    }
    
    // 只能删除已完成或已拒绝的记录
    if (!['completed', 'rejected'].includes(refund.status)) {
      return res.status(400).json({ success: false, message: '只能删除已完成或已拒绝的退款记录' })
    }
    
    await Refund.findByIdAndDelete(req.params.id)
    
    res.json({ success: true, message: '删除成功' })
  } catch (error) {
    console.error('删除退款记录失败:', error)
    res.status(500).json({ success: false, message: '删除退款记录失败' })
  }
})

module.exports = router
