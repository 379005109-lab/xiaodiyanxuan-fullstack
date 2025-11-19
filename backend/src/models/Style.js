const mongoose = require('mongoose')

const styleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: String,
  icon: String,
  image: String,
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

styleSchema.index({ status: 1, order: 1 })

module.exports = mongoose.model('Style', styleSchema)
