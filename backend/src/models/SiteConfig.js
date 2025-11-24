const mongoose = require('mongoose')

const siteConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: mongoose.Schema.Types.Mixed,
  type: { type: String, enum: ['image', 'text', 'json'], default: 'text' },
  label: String,
  description: String,
  updatedAt: { type: Date, default: Date.now }
})

siteConfigSchema.index({ key: 1 })

module.exports = mongoose.model('SiteConfig', siteConfigSchema)
