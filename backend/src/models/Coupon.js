const mongoose = require('mongoose')
const { COUPON_TYPES } = require('../config/constants')

const couponSchema = new mongoose.Schema({
  code: { type: String, unique: true, required: true },
  type: { type: String, enum: Object.values(COUPON_TYPES), default: COUPON_TYPES.FIXED },
  value: { type: Number, required: true },
  minAmount: { type: Number, default: 0 },
  maxAmount: { type: Number, default: 999999 },
  description: String,
  validFrom: { type: Date, required: true },
  validTo: { type: Date, required: true },
  usageLimit: { type: Number, default: 1 },
  usageCount: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

couponSchema.index({ code: 1 })
couponSchema.index({ validFrom: 1, validTo: 1 })

module.exports = mongoose.model('Coupon', couponSchema)
