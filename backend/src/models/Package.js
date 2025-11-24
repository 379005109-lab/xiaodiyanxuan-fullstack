const mongoose = require('mongoose')

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  thumbnail: String,
  images: [String],
  basePrice: { type: Number, required: true },
  discountPrice: Number,
  channelPrice: Number,    // 渠道价格
  designerPrice: Number,   // 设计师价格
  products: [{ productId: String, productName: String, quantity: Number, price: Number }],
  // 添加categories字段用于存储套餐分类信息
  categories: [{ 
    name: String,      // 分类名称
    required: Number,  // 该分类需要选择的商品数量
    products: [String] // 该分类下的商品ID列表
  }],
  stock: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

packageSchema.index({ status: 1 })

module.exports = mongoose.model('Package', packageSchema)
