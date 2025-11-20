const mongoose = require('mongoose')

const bargainSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  thumbnail: String,
  originalPrice: Number,
  targetPrice: Number,
  currentPrice: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['active', 'completed', 'expired'], default: 'active' },
  helpCount: { type: Number, default: 0 },
  helpers: [{ userId: String, helpedAt: Date, priceReduction: Number }],
  startedAt: { type: Date, default: Date.now },
  expiresAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

bargainSchema.index({ userId: 1 })
bargainSchema.index({ productId: 1 })
bargainSchema.index({ status: 1 })

module.exports = mongoose.model('Bargain', bargainSchema)
