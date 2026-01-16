const mongoose = require('mongoose')

const siteSettingsSchema = new mongoose.Schema({
  siteName: {
    type: String,
    default: 'XIAODI'
  },
  siteSubtitle: {
    type: String,
    default: 'SUPPLY CHAIN'
  },
  siteLogo: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    sparse: true
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

siteSettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

module.exports = mongoose.model('SiteSettings', siteSettingsSchema)
