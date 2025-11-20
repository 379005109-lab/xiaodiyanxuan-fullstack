const mongoose = require('mongoose')

const packageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  thumbnail: String,
  images: [String],
  basePrice: { type: Number, required: true },
  discountPrice: Number,
  products: [{ productId: String, productName: String, quantity: Number, price: Number }],
  stock: { type: Number, default: 0 },
  sales: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

packageSchema.index({ status: 1 })

module.exports = mongoose.model('Package', packageSchema)
