const mongoose = require('mongoose')
const { ORGANIZATION_TYPES } = require('../config/constants')

/**
 * 组织模型 - 平台/企业
 * 用于管理供应链平台和企业账号
 */
const organizationSchema = new mongoose.Schema({
  // 基础信息
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: Object.values(ORGANIZATION_TYPES), 
    required: true 
  },
  code: { type: String, unique: true }, // 组织编码，用于快速识别
  logo: String,
  description: String,
  
  // 联系信息
  contactPerson: String,
  contactPhone: String,
  contactEmail: String,
  address: String,
  
  // 管理员账号
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // === 折扣配置（平台/企业自己设置）===
  discountConfig: {
    // 默认折扣（1=原价，0.8=8折）
    defaultDiscount: { type: Number, default: 1, min: 0, max: 1 },
    // 是否允许查看成本价
    canViewCostPrice: { type: Boolean, default: false },
    // 按分类设置的折扣
    categoryDiscounts: [{
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MaterialCategory' },
      categoryName: String,
      discountRate: { type: Number, min: 0, max: 1 },
    }],
  },
  
  // === 配额限制 ===
  quota: {
    maxUsers: { type: Number, default: 50 },      // 最大子账号数
    maxProducts: { type: Number, default: 1000 }, // 最大商品数
    usedUsers: { type: Number, default: 0 },
    usedProducts: { type: Number, default: 0 },
  },
  
  // === 功能权限 ===
  features: {
    canManageProducts: { type: Boolean, default: true },   // 可管理商品
    canManageOrders: { type: Boolean, default: true },     // 可管理订单
    canDownloadMaterials: { type: Boolean, default: true }, // 可下载素材
    canViewReports: { type: Boolean, default: true },      // 可查看报表
  },
  
  // 状态
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended'], 
    default: 'active' 
  },
  
  // 审计字段
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

// 索引
organizationSchema.index({ type: 1 })
organizationSchema.index({ code: 1 })
organizationSchema.index({ status: 1 })
organizationSchema.index({ adminUserId: 1 })

// 更新时间中间件
organizationSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// 生成组织编码
organizationSchema.pre('save', async function(next) {
  if (!this.code) {
    const prefix = this.type === 'platform' ? 'PLT' : 'ENT'
    const count = await this.constructor.countDocuments({ type: this.type })
    this.code = `${prefix}${String(count + 1).padStart(4, '0')}`
  }
  next()
})

module.exports = mongoose.model('Organization', organizationSchema)
