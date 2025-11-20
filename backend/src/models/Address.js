const mongoose = require('mongoose')

const addressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  province: String,
  city: String,
  district: String,
  address: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

addressSchema.index({ userId: 1 })

module.exports = mongoose.model('Address', addressSchema)
