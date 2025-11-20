const mongoose = require('mongoose')

const compareSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  productId: {
    type: String,
    required: true
  },
  skuId: String,
  selectedMaterials: {
    fabric: String,
    filling: String,
    frame: String,
    leg: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// 复合索引：用户 + 产品 ID + SKU ID
compareSchema.index({ userId: 1, productId: 1, skuId: 1 })

module.exports = mongoose.model('Compare', compareSchema)
