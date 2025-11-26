const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productId: String,
    productName: String,
    thumbnail: String,
    sku: {
      _id: String,
      spec: String,
      color: String,
      material: mongoose.Schema.Types.Mixed,
      price: Number,
      discountPrice: Number,
      images: [String]
    },
    selectedMaterials: {
      fabric: String,
      filling: String,
      frame: String,
      leg: String
    },
    materialUpgradePrices: mongoose.Schema.Types.Mixed, // { "材质名": 价格 }
    quantity: Number,
    price: Number, // 最终单价（包含材质升级）
    specifications: {
      size: String,
      material: String,
      fill: String,
      frame: String,
      leg: String
    },
    // 兼容旧字段
    basePrice: Number,
    subtotal: Number
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

cartSchema.index({ userId: 1 })

module.exports = mongoose.model('Cart', cartSchema)
