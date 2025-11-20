const mongoose = require('mongoose')
const bcryptjs = require('bcryptjs')
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

// 密码 hash pre-save hook
userSchema.pre('save', async function(next) {
  // 如果密码没有被修改，跳过 hash
  if (!this.isModified('password')) {
    return next()
  }

  // 如果密码为空，跳过 hash
  if (!this.password) {
    return next()
  }

  try {
    // 检查密码是否已经被 hash（hash 后的密码通常以 $2a$ 或 $2b$ 开头）
    if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
      return next()
    }

    // Hash 密码
    const salt = await bcryptjs.genSalt(10)
    this.password = await bcryptjs.hash(this.password, salt)
    next()
  } catch (err) {
    next(err)
  }
})

module.exports = mongoose.model('User', userSchema)
