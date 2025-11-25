const mongoose = require('mongoose')
const { ORDER_STATUS } = require('../config/constants')

const orderSchema = new mongoose.Schema({
  orderNo: { type: String, unique: true, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // 订单类型：product=普通商品订单, package=套餐订单
  orderType: { type: String, enum: ['product', 'package'], default: 'product' },
  
  // 普通商品订单的items
  items: [{
    productId: String,
    productName: String,
    price: Number,
    quantity: Number,
    specifications: { size: String, material: String, color: String, fill: String, frame: String, leg: String },
    subtotal: Number
  }],
  
  // 套餐订单专用字段
  packageInfo: {
    packageId: String,
    packageName: String,
    packagePrice: Number,
    selections: [{
      categoryKey: String,
      categoryName: String,
      required: Number,  // 该分类需要选择的数量
      products: [{
        productId: String,
        productName: String,
        quantity: Number,
        materials: mongoose.Schema.Types.Mixed,  // 材质选择 { fabric: '半青皮-蓝色' }
        materialUpgrade: Number  // 材质升级费用
      }]
    }]
  },
  
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
