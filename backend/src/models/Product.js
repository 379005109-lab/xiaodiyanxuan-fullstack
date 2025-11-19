const mongoose = require('mongoose')
const { PRODUCT_STATUS } = require('../config/constants')

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, sparse: true },
  description: String,
  basePrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  thumbnail: String,
  images: [String],
  category: { id: String, name: String },
  style: { id: String, name: String },
  specifications: {
    sizes: [{ id: String, name: String, priceExtra: { type: Number, default: 0 } }],
    materials: [{ id: String, name: String, priceExtra: { type: Number, default: 0 }, colors: [String] }],
    fills: [{ id: String, name: String, priceExtra: { type: Number, default: 0 } }],
    frames: [{ id: String, name: String, priceExtra: { type: Number, default: 0 } }],
    legs: [{ id: String, name: String, priceExtra: { type: Number, default: 0 } }]
  },
  sales: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  status: { type: String, enum: Object.values(PRODUCT_STATUS), default: PRODUCT_STATUS.ACTIVE },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ category: 1 })
productSchema.index({ style: 1 })
productSchema.index({ status: 1 })

module.exports = mongoose.model('Product', productSchema)
