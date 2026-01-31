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

// 复合唯一索引：防止重复添加同一商品配置
compareSchema.index({ userId: 1, productId: 1, skuId: 1, 'selectedMaterials.fabric': 1, 'selectedMaterials.filling': 1 }, { unique: true, sparse: true })

module.exports = mongoose.model('Compare', compareSchema)
