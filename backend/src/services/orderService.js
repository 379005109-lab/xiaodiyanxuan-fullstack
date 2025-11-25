const Order = require('../models/Order')
const Cart = require('../models/Cart')
const User = require('../models/User')
const Coupon = require('../models/Coupon')
const { generateOrderNo, calculatePagination } = require('../utils/helpers')
const { ORDER_STATUS } = require('../config/constants')
const { NotFoundError, ValidationError } = require('../utils/errors')

const createOrder = async (userId, items, recipient, couponCode = null) => {
  if (!items || items.length === 0) {
    throw new ValidationError('Order must contain at least one item')
  }
  
  // Calculate totals
  let subtotal = 0
  items.forEach(item => {
    subtotal += item.subtotal || 0
  })
  
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
  
  const order = await Order.create({
    orderNo: generateOrderNo(),
    userId,
    items,
    subtotal,
    discountAmount,
    totalAmount,
    recipient,
    status: ORDER_STATUS.PENDING_PAYMENT,
    couponCode
  })
  
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
  
  const query = { userId }
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
    console.log('📋 [OrderService] first order:', orders[0]._id, orders[0].status);
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
  
  order.status = ORDER_STATUS.CANCELLED
  order.cancelledAt = new Date()
  await order.save()
  
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
