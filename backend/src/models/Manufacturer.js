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
  productIntro: {
    type: String,
    trim: true
  },
  styleTags: [{
    type: String,
    trim: true
  }],
  isPreferred: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: Date
  },
  defaultDiscount: {
    type: Number,
    default: 0
  },
  defaultCommission: {
    type: Number,
    default: 0
  },
  logo: {
    type: String
  },
  isPreferred: {
    type: Boolean,
    default: false
  },
  expiryDate: {
    type: Date
  },
  styleTags: {
    type: [String],
    default: []
  },
  // 品类标签
  categoryTags: {
    type: [String],
    default: []
  },
  // 价格范围
  priceRangeMin: {
    type: Number,
    default: 0
  },
  priceRangeMax: {
    type: Number,
    default: 0
  },
  defaultDiscount: {
    type: Number,
    default: 0
  },
  defaultCommission: {
    type: Number,
    default: 0
  },
  // 付款比例设置（新版 - 支持多比例选择）
  paymentRatioEnabled: {
    type: Boolean,
    default: false
  },
  // 可选付款比例数组（如 [50, 75, 100]）
  paymentRatios: {
    type: [Number],
    default: [50, 75, 100]
  },
  // 开票设置（新版）
  invoiceEnabled: {
    type: Boolean,
    default: false
  },
  // 开票加价比例 (百分比，如 10 表示加价10%)
  invoiceMarkupPercent: {
    type: Number,
    default: 10,
    min: 0,
    max: 100
  },
  // 兼容旧版付款比例设置
  paymentRatio: {
    enabled: {
      type: Boolean,
      default: false
    },
    ratio: {
      type: Number,
      default: 100,
      enum: [50, 75, 100]
    }
  },
  // 兼容旧版开票设置
  invoiceSetting: {
    enabled: {
      type: Boolean,
      default: false
    },
    ratio: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  // 厂家设置信息
  settings: {
    // 公司电话
    phone: {
      type: String,
      trim: true
    },
    // 客服电话
    servicePhone: {
      type: String,
      trim: true
    },
    smsNotifyPhone: {
      type: String,
      trim: true
    },
    smsNotifyVerifiedAt: {
      type: Date
    },
    // 微信收款码
    wechatQrCode: {
      type: String
    },
    // 支付宝收款码
    alipayQrCode: {
      type: String
    },
    // 银行转账信息
    bankInfo: {
      bankName: String,
      accountName: String,
      accountNumber: String
    },

    paymentAccounts: [{
      type: {
        type: String,
        enum: ['bank', 'wechat', 'alipay'],
        default: 'bank'
      },
      bankName: String,
      accountName: String,
      accountNumber: String
    }],
    // 公司地址
    companyAddress: {
      type: String,
      trim: true
    },
    // 营业执照
    businessLicense: {
      type: String
    }
  },
  // 企业认证信息
  certification: {
    // 认证状态: pending(待审核), approved(已认证), rejected(已拒绝), none(未提交)
    status: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    // 营业执照图片（新字段，与前端匹配）
    businessLicense: {
      type: String
    },
    // 营业执照图片（旧字段，兼容）
    businessLicenseImage: {
      type: String
    },
    // 统一社会信用代码
    creditCode: {
      type: String,
      trim: true
    },
    // 企业名称（营业执照上的）
    companyName: {
      type: String,
      trim: true
    },
    // 法人代表（新字段，与前端匹配）
    legalPerson: {
      type: String,
      trim: true
    },
    // 法人代表（旧字段，兼容）
    legalRepresentative: {
      type: String,
      trim: true
    },
    // 开票名称（与前端匹配）
    invoiceName: { type: String, trim: true },
    // 税号（与前端匹配）
    taxNumber: { type: String, trim: true },
    // 开户银行（与前端匹配）
    invoiceBankName: { type: String, trim: true },
    // 银行账号（与前端匹配）
    invoiceBankAccount: { type: String, trim: true },
    // 企业地址（与前端匹配）
    invoiceAddress: { type: String, trim: true },
    // 企业电话（与前端匹配）
    invoicePhone: { type: String, trim: true },
    // 开票信息（旧嵌套结构，兼容）
    invoiceInfo: {
      name: { type: String, trim: true },
      taxNumber: { type: String, trim: true },
      bankName: { type: String, trim: true },
      bankAccount: { type: String, trim: true },
      address: { type: String, trim: true },
      phone: { type: String, trim: true }
    },
    // 认证时间
    certifiedAt: {
      type: Date
    },
    // 审核备注
    reviewNote: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // 账号配额（由超级管理员配置）
  accountQuota: {
    totalAccounts: {
      type: Number,
      default: 0
    },
    // 授权账号配额
    authAccounts: {
      type: Number,
      default: 0
    },
    // 子账号配额
    subAccounts: {
      type: Number,
      default: 0
    },
    // 设计师账号配额
    designerAccounts: {
      type: Number,
      default: 0
    }
  },
  // 已使用账号数量
  accountUsage: {
    authAccounts: {
      type: Number,
      default: 0
    },
    subAccounts: {
      type: Number,
      default: 0
    },
    designerAccounts: {
      type: Number,
      default: 0
    }
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

// 生成4位随机数字
function generateRandomDigits(length = 4) {
  const digits = '0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length))
  }
  return result
}

// 生成唯一编号的辅助函数
async function generateUniqueCode(shortName) {
  const today = new Date()
  const dateStr = today.getFullYear().toString() +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    today.getDate().toString().padStart(2, '0')
  
  // 生成4位随机数字
  const randomDigits = generateRandomDigits(4)
  
  // 组合编号：简称 + 日期 + 4位随机数字（如：GS20251211XXXX）
  const code = `${shortName.toUpperCase()}${dateStr}${randomDigits}`
  
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
  
  // 自动生成编号（缺失时自动补齐，兼容旧数据）
  if (!this.code && this.shortName) {
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
