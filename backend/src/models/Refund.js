const mongoose = require('mongoose')

const refundSchema = new mongoose.Schema({
  // 关联订单
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  orderNo: { type: String, required: true },
  
  // 申请人信息
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  buyerName: { type: String },
  buyerPhone: { type: String },
  
  // 退货商品
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    image: { type: String },
    quantity: { type: Number, default: 1 },
    price: { type: Number, default: 0 },
    sku: { type: String }
  }],
  
  // 退款金额
  totalAmount: { type: Number, default: 0 },
  
  // 退货原因
  reason: { type: String, required: true },
  customReason: { type: String },
  
  // 状态: pending-待处理, approved-已同意, rejected-已拒绝, completed-已完成
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  
  // 处理信息
  handleRemark: { type: String },  // 处理备注
  handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  handledAt: { type: Date },
  
  // 退货物流
  returnLogistics: {
    company: { type: String },
    trackingNo: { type: String },
    sentAt: { type: Date }
  }
}, {
  timestamps: true
})

// 索引
refundSchema.index({ orderId: 1 })
refundSchema.index({ orderNo: 1 })
refundSchema.index({ status: 1 })
refundSchema.index({ createdAt: -1 })

module.exports = mongoose.model('Refund', refundSchema)
