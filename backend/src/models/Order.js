const mongoose = require('mongoose')
const { ORDER_STATUS } = require('../config/constants')

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: String,
    productName: String,
    price: Number,
    quantity: Number,
    specifications: { size: String, material: String, color: String, fill: String, frame: String, leg: String },
    subtotal: Number
  }],
  subtotal: Number,
  discountAmount: { type: Number, default: 0 },
  totalAmount: Number,
  recipient: { name: String, phone: String, address: String },
  status: { type: Number, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING_PAYMENT },
  couponCode: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  paidAt: Date,
  shippedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  updatedAt: { type: Date, default: Date.now }
})

orderSchema.index({ userId: 1 })
orderSchema.index({ orderNo: 1 })
orderSchema.index({ status: 1 })
orderSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Order', orderSchema)
