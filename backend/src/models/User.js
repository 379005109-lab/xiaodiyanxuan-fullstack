const mongoose = require('mongoose')
const { USER_TYPES } = require('../config/constants')

const userSchema = new mongoose.Schema({
  openId: { type: String, unique: true, sparse: true },
  unionId: String,
  username: { type: String, unique: true, sparse: true },
  password: String,
  nickname: String,
  avatar: String,
  phone: String,
  email: String,
  userType: { type: String, enum: Object.values(USER_TYPES), default: USER_TYPES.CUSTOMER },
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastLoginAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

userSchema.index({ openId: 1 })
userSchema.index({ email: 1 })

module.exports = mongoose.model('User', userSchema)
