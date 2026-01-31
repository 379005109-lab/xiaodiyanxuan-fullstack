const mongoose = require('mongoose')

const productReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: String,
  rating: { type: Number, min: 1, max: 5, default: 5 },
  content: String,
  images: [String], // 实景案例图片
  videos: [String], // 实景案例视频
  skuId: String, // 购买的SKU ID
  skuSpec: String, // SKU规格描述
  isApproved: { type: Boolean, default: false }, // 是否审核通过
  isVisible: { type: Boolean, default: true }, // 是否可见
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  reply: String, // 商家回复
  replyAt: Date, // 回复时间
}, {
  timestamps: true
})

productReviewSchema.index({ productId: 1, createdAt: -1 })
productReviewSchema.index({ userId: 1 })
productReviewSchema.index({ orderId: 1 })
productReviewSchema.index({ isApproved: 1, isVisible: 1 })

module.exports = mongoose.model('ProductReview', productReviewSchema)
