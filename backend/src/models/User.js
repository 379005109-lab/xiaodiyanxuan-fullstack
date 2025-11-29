const mongoose = require('mongoose')
const { USER_TYPES } = require('../config/constants')

const userSchema = new mongoose.Schema({
  openId: { type: String, unique: true, sparse: true },
  unionId: String,
  username: { type: String, unique: true, sparse: true },
  password: String,
  nickname: String,
  gender: { type: String, enum: ['male', 'female', ''], default: '' },
  avatar: String,
  phone: String,
  email: String,
  role: { type: String, enum: ['customer', 'designer', 'distributor', 'admin', 'super_admin'], default: 'customer' },
  userType: { type: String, enum: Object.values(USER_TYPES), default: USER_TYPES.CUSTOMER },
  status: { type: String, enum: ['active', 'banned'], default: 'active' },
  balance: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  verifiedAt: Date,
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  // 用户标签（如：批量下载、高风险等）
  tags: [{ type: String }],
  // 图片下载统计
  downloadStats: {
    totalDownloads: { type: Number, default: 0 },
    lastDownloadAt: Date,
    consecutiveDownloads: { type: Number, default: 0 },  // 连续下载次数
    lastConsecutiveReset: Date  // 上次重置连续下载计数的时间
  },
  lastLoginAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

userSchema.index({ openId: 1 })
userSchema.index({ email: 1 })

module.exports = mongoose.model('User', userSchema)
