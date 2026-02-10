/**
 * 小程序补充接口
 * 提供小程序所需但原有路由中缺失或格式不兼容的端点
 * 独立于已有业务路由，避免影响管理后台/PC端
 */

const express = require('express')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')
const Order = require('../models/Order')
const Product = require('../models/Product')
const Notification = require('../models/Notification')
const Coupon = require('../models/Coupon')
const User = require('../models/User')

// ========== 响应格式（与 miniapp.js 保持一致） ==========
const success = (data, message = 'success') => ({ code: 0, data, message })
const error = (code, message) => ({ code, message })

// ========== 1. 通知管理员 ==========
// POST /api/miniapp/notify-admin
// 小程序端用于发送订单取消、变更等通知给管理员
router.post('/notify-admin', auth, async (req, res) => {
  try {
    const { type, title, content, orderId, orderNo } = req.body

    if (!type || !title) {
      return res.status(400).json(error(400, '通知类型和标题不能为空'))
    }

    // 查找所有管理员用户
    const admins = await User.find({
      role: { $in: ['admin', 'super_admin'] },
      status: 'active'
    }).select('_id').lean()

    if (admins.length === 0) {
      console.log('[通知] 未找到管理员用户，通知已记录')
      return res.json(success(null, '通知已记录'))
    }

    // 为每个管理员创建通知
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: 'order',
      title: title || '订单通知',
      message: content || '',
      relatedId: orderId || '',
      data: {
        orderId,
        orderNo,
        notifyType: type,
        fromUserId: req.userId
      },
      createdAt: new Date()
    }))

    await Notification.insertMany(notifications)

    console.log(`[通知] 已向 ${admins.length} 位管理员发送 ${type} 通知`)
    res.json(success(null, '通知已发送'))
  } catch (err) {
    console.error('发送管理员通知失败:', err)
    res.status(500).json(error(500, '通知发送失败'))
  }
})

// ========== 2. 用户优惠券列表 ==========
// GET /api/miniapp/my-coupons
// 获取当前有效的优惠券列表（适配小程序端格式）
router.get('/my-coupons', optionalAuth, async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query
    const now = new Date()

    const query = { status: 'active' }

    // 按状态筛选
    if (status === 'available') {
      // 可用：有效期内且未用完
      query.validFrom = { $lte: now }
      query.validTo = { $gte: now }
      query.$expr = { $lt: ['$usageCount', '$usageLimit'] }
    } else if (status === 'expired') {
      // 已过期
      query.validTo = { $lt: now }
    } else {
      // 默认：有效期内
      query.validFrom = { $lte: now }
      query.validTo = { $gte: now }
    }

    const total = await Coupon.countDocuments(query)
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .lean()

    const list = coupons.map(c => ({
      id: c._id,
      code: c.code,
      type: c.type,
      value: c.value,
      minAmount: c.minAmount || 0,
      description: c.description || '',
      validFrom: c.validFrom,
      validTo: c.validTo,
      remaining: Math.max(0, (c.usageLimit || 1) - (c.usageCount || 0)),
      isExpired: now > c.validTo,
      isUsedUp: (c.usageCount || 0) >= (c.usageLimit || 1)
    }))

    res.json(success({ list, total, page: parseInt(page), pageSize: parseInt(pageSize) }))
  } catch (err) {
    console.error('获取优惠券列表失败:', err)
    res.status(500).json(error(500, err.message))
  }
})

// ========== 3. 增强版创建订单 ==========
// POST /api/miniapp/orders/v2
// 兼容小程序新版订单确认页的数据格式（支持 address 对象、couponId 等）
router.post('/orders/v2', auth, async (req, res) => {
  try {
    const { items, goods, address, receiver, couponId, remark, totalAmount, totalPrice, type = 'normal' } = req.body

    // 兼容两种商品数据格式
    const orderItems = items || goods
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json(error(400, '商品不能为空'))
    }

    // 兼容两种收货人格式
    let recipientInfo
    if (receiver && receiver.name) {
      // 旧格式: { name, phone, address }
      recipientInfo = receiver
    } else if (address) {
      // 新格式: address 对象（来自地址管理）
      recipientInfo = {
        name: address.name || address.receiverName || '',
        phone: address.phone || address.receiverPhone || '',
        address: [address.province, address.city, address.district, address.detail || address.address].filter(Boolean).join('')
          || address.fullAddress || address.address || ''
      }
    }

    if (!recipientInfo || !recipientInfo.name || !recipientInfo.phone) {
      return res.status(400).json(error(400, '收货信息不完整'))
    }

    // 处理优惠券
    let couponDiscount = 0
    if (couponId) {
      try {
        const coupon = await Coupon.findById(couponId)
        if (coupon && coupon.status === 'active') {
          const now = new Date()
          if (now >= coupon.validFrom && now <= coupon.validTo && coupon.usageCount < coupon.usageLimit) {
            couponDiscount = coupon.value || 0
            coupon.usageCount += 1
            await coupon.save()
          }
        }
      } catch (e) {
        console.log('优惠券处理失败:', e.message)
      }
    }

    // 生成订单号
    const orderNo = 'XD' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase()

    // 标准化商品数据
    const normalizedItems = orderItems.map(item => ({
      product: item.goodsId || item.id || item.product,
      productName: item.name || item.productName || '',
      image: item.thumb || item.image || '',
      price: item.price || 0,
      quantity: item.quantity || item.count || 1,
      specifications: {
        size: item.specs?.size || item.sizeName || '',
      },
      selectedMaterials: {
        fabric: item.specs?.material || item.materialName || '',
        color: item.specs?.color || item.materialColor || '',
        fill: item.specs?.fill || '',
        frame: item.specs?.frame || '',
        leg: item.specs?.leg || ''
      }
    }))

    // 计算实际总价
    const calculatedTotal = normalizedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const finalTotal = Math.max(0, (totalAmount || totalPrice || calculatedTotal) - couponDiscount)

    // 创建订单
    const order = await Order.create({
      orderNo,
      userId: req.userId,
      items: normalizedItems,
      totalAmount: finalTotal,
      status: 1, // 待付款
      recipient: recipientInfo,
      remark: remark || '',
      couponId: couponId || null,
      couponDiscount,
      orderType: type,
      createdAt: new Date()
    })

    // 异步发送通知（如果有邮件服务）
    try {
      const { sendNewOrderNotification } = require('../services/emailService')
      sendNewOrderNotification(order).catch(err => {
        console.error('发送订单通知邮件失败:', err)
      })
    } catch (e) {
      // emailService 不可用时静默处理
    }

    res.json(success({
      orderId: order._id,
      orderNo: order.orderNo,
      totalPrice: order.totalAmount,
      couponDiscount,
      status: 1,
      createTime: order.createdAt
    }, '订单创建成功'))
  } catch (err) {
    console.error('创建订单失败:', err)
    res.status(500).json(error(500, '创建订单失败'))
  }
})

module.exports = router
