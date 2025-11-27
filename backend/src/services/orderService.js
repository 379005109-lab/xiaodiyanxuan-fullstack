const Order = require('../models/Order')
const Cart = require('../models/Cart')
const User = require('../models/User')
const Coupon = require('../models/Coupon')
const { generateOrderNo, calculatePagination } = require('../utils/helpers')
const { ORDER_STATUS } = require('../config/constants')
const { NotFoundError, ValidationError } = require('../utils/errors')

const createOrder = async (userId, items, recipient, couponCode = null) => {
  console.log('🛒 [OrderService] createOrder called');
  console.log('🛒 [OrderService] userId:', userId);
  console.log('🛒 [OrderService] userId type:', typeof userId);
  console.log('🛒 [OrderService] items count:', items?.length);
  console.log('🛒 [OrderService] recipient:', recipient);
  
  if (!items || items.length === 0) {
    throw new ValidationError('Order must contain at least one item')
  }
  
  // Calculate totals
  let subtotal = 0
  items.forEach(item => {
    subtotal += item.subtotal || (item.price * item.quantity) || 0
  })
  console.log('🛒 [OrderService] subtotal:', subtotal);
  
  let discountAmount = 0
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode, status: 'active' })
    if (coupon) {
      if (coupon.usageCount >= coupon.usageLimit) {
        throw new ValidationError('Coupon usage limit exceeded')
      }
      
      const now = new Date()
      if (now < coupon.validFrom || now > coupon.validTo) {
        throw new ValidationError('Coupon expired')
      }
      
      if (subtotal < coupon.minAmount) {
        throw new ValidationError(`Minimum order amount is ${coupon.minAmount}`)
      }
      
      if (coupon.type === 'fixed') {
        discountAmount = Math.min(coupon.value, subtotal)
      } else if (coupon.type === 'percentage') {
        discountAmount = Math.round(subtotal * coupon.value / 100)
      }
      
      coupon.usageCount += 1
      await coupon.save()
    }
  }
  
  const totalAmount = subtotal - discountAmount
  
  const orderNo = generateOrderNo();
  console.log('🛒 [OrderService] Generated orderNo:', orderNo);
  
  const order = await Order.create({
    orderNo,
    userId,
    items,
    subtotal,
    discountAmount,
    totalAmount,
    recipient,
    status: ORDER_STATUS.PENDING_PAYMENT,
    couponCode
  })
  
  console.log('✅ [OrderService] Order created successfully!');
  console.log('✅ [OrderService] Order ID:', order._id);
  console.log('✅ [OrderService] Order userId:', order.userId);
  console.log('✅ [OrderService] Order status:', order.status);
  
  // Update user stats
  const user = await User.findById(userId)
  if (user) {
    user.totalOrders = (user.totalOrders || 0) + 1
    user.totalSpent = (user.totalSpent || 0) + totalAmount
    await user.save()
  }
  
  // Clear cart
  await Cart.updateOne({ userId }, { items: [] })
  
  return order
}

const getOrders = async (userId, page = 1, pageSize = 10, status = null) => {
  console.log('📋 [OrderService] getOrders called:', { userId, page, pageSize, status });
  const { skip, pageSize: size } = calculatePagination(page, pageSize)
  
  const query = { isDeleted: { $ne: true } }  // 排除已删除的订单
  // 如果userId为null，查询所有订单（管理员模式）
  if (userId !== null) {
    query.userId = userId
  }
  console.log('📋 [OrderService] query:', query);
  if (status) {
    query.status = status
  }
  
  const total = await Order.countDocuments(query)
  console.log('📋 [OrderService] total orders found:', total);
  
  const orders = await Order.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(size)
    .lean()
  
  console.log('📋 [OrderService] orders returned:', orders.length);
  if (orders.length > 0) {
    console.log('📋 [OrderService] first order:', orders[0]._id, orders[0].status, 'cancelRequest:', orders[0].cancelRequest);
  }
  
  return { orders, total, page, pageSize: size }
}

const getOrderById = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) {
    throw new NotFoundError('Order not found')
  }
  return order
}

const cancelOrder = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) {
    throw new NotFoundError('Order not found')
  }
  
  if (order.status !== ORDER_STATUS.PENDING_PAYMENT && order.status !== ORDER_STATUS.PENDING_SHIPMENT) {
    throw new ValidationError('Cannot cancel order in current status')
  }
  
  // 修改为提交取消请求，需要管理后台确认
  order.cancelRequest = true
  order.cancelRequestedAt = new Date()
  await order.save()
  
  console.log('📝 用户提交取消请求，订单ID:', orderId)
  
  return order
}

const confirmReceipt = async (orderId, userId) => {
  const order = await Order.findOne({ _id: orderId, userId })
  if (!order) {
    throw new NotFoundError('Order not found')
  }
  
  if (order.status !== ORDER_STATUS.PENDING_RECEIPT) {
    throw new ValidationError('Order is not in pending receipt status')
  }
  
  order.status = ORDER_STATUS.COMPLETED
  order.completedAt = new Date()
  await order.save()
  
  return order
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
  confirmReceipt
}
