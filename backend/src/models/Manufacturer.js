const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const manufacturerSchema = new mongoose.Schema({
  // 厂家全称
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  // 厂家简称（用于生成编号）
  shortName: {
    type: String,
    required: true,
    trim: true,
    uppercase: true // 自动转大写
  },
  // 厂家编号（自动生成：简称+日期+随机数，如 GS20251211XXXX）
  code: {
    type: String,
    trim: true,
    unique: true
  },
  // 兼容旧字段
  name: {
    type: String,
    trim: true
  },
  // 登录凭证
  username: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  password: {
    type: String,
    select: false  // 默认不返回密码
  },
  contactName: {
    type: String,
    trim: true
  },
  contactPhone: {
    type: String,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

// 生成4位随机大写字母
function generateRandomLetters(length = 4) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  return result
}

// 生成唯一编号的辅助函数
async function generateUniqueCode(shortName) {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0')
  
  // 生成4位随机字母
  const randomLetters = generateRandomLetters(4)
  
  // 组合编号：简称 + 日期 + 4位随机字母（如：GS20251211ABCD）
  const code = `${shortName.toUpperCase()}${dateStr}${randomLetters}`
  
  // 检查是否已存在
  const existing = await mongoose.model('Manufacturer').findOne({ code })
  if (existing) {
    // 如果存在，递归生成新的
    return generateUniqueCode(shortName)
  }
  
  return code
}

manufacturerSchema.pre('save', async function(next) {
  this.updatedAt = new Date()
  
  // 自动生成编号（仅新建时）
  if (this.isNew && !this.code && this.shortName) {
    this.code = await generateUniqueCode(this.shortName)
  }
  
  // 兼容：将fullName同步到name字段
  if (this.fullName && !this.name) {
    this.name = this.fullName
  }
  
  // 密码加密
  if (this.isModified('password') && this.password) {
    this.password = await bcrypt.hash(this.password, 10)
  }
  next()
})

// 验证密码方法
manufacturerSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

module.exports = mongoose.model('Manufacturer', manufacturerSchema)
