const mongoose = require('mongoose')
const { USER_TYPES, USER_ROLES } = require('../config/constants')

const userSchema = new mongoose.Schema({
  // === 基础信息 ===
  openId: { type: String, unique: true, sparse: true },
  unionId: String,
  username: { type: String, unique: true, sparse: true },
  password: String,
  nickname: String,
  gender: { type: String, enum: ['male', 'female', ''], default: '' },
  profileCompleted: { type: Boolean, default: false },
  profileCompletedAt: Date,
  avatar: String,
  phone: String,
  email: String,
  
  // === 角色与权限 ===
  role: { 
    type: String, 
    enum: [...Object.values(USER_ROLES), 'admin', 'user'], // 兼容旧角色
    default: USER_ROLES.CUSTOMER 
  },
  userType: { type: String, enum: Object.values(USER_TYPES), default: USER_TYPES.CUSTOMER },
  
  // === 组织归属（平台/企业账号）===
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },

  // === 厂家归属（厂家体系账号）===
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },
  
  // === 厂家归属 ===
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' },

  // === 厂家归属（多选）===
  manufacturerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer' }],
  
  // === 账号类型（厂家账号用）===
  accountType: { 
    type: String, 
    enum: ['auth', 'sub', 'designer', 'normal'],  // 授权账号、子账号、设计师账号、普通账号
    default: 'normal'
  },
  
  // === 功能权限 ===
  permissions: {
    canAccessAdmin: { type: Boolean, default: false },      // 能否进入管理后台
    canViewCostPrice: { type: Boolean, default: false },    // 能否看成本价
    canDownloadMaterial: { type: Boolean, default: false }, // 能否下载素材
    canManageUsers: { type: Boolean, default: false },      // 能否管理用户
    canManageProducts: { type: Boolean, default: false },   // 能否管理商品
    canManageOrders: { type: Boolean, default: false },     // 能否管理订单
    canViewReports: { type: Boolean, default: false },      // 能否查看报表
  },
  
  // === 特殊账号配置 ===
  specialAccountConfig: {
    expiresAt: Date,                    // 过期时间
    accessCode: String,                 // 访问码
    maxUsage: Number,                   // 最大使用次数
    usedCount: { type: Number, default: 0 },
    note: String,                       // 备注（如：给XX客户看价）
  },
  
  // === 状态与统计 ===
  status: { type: String, enum: ['active', 'inactive', 'banned', 'expired'], default: 'active' },
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
    consecutiveDownloads: { type: Number, default: 0 },
    lastConsecutiveReset: Date
  },
  
  // === 审计字段 ===
  lastLoginAt: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// 索引
userSchema.index({ openId: 1 })
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ organizationId: 1 })
userSchema.index({ manufacturerId: 1 })
userSchema.index({ status: 1 })
userSchema.index({ 'specialAccountConfig.accessCode': 1 })

// 更新时间中间件
userSchema.pre('save', function(next) {
  this.updatedAt = new Date()
  next()
})

// 根据角色自动设置权限
userSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    const rolePermissions = {
      super_admin: {
        canAccessAdmin: true,
        canViewCostPrice: true,
        canDownloadMaterial: true,
        canManageUsers: true,
        canManageProducts: true,
        canManageOrders: true,
        canViewReports: true,
      },
      platform_admin: {
        canAccessAdmin: true,
        canViewCostPrice: false,
        canDownloadMaterial: true,
        canManageUsers: true,
        canManageProducts: true,
        canManageOrders: true,
        canViewReports: true,
      },
      platform_staff: {
        canAccessAdmin: true,
        canViewCostPrice: false,
        canDownloadMaterial: true,
        canManageUsers: false,
        canManageProducts: true,
        canManageOrders: true,
        canViewReports: true,
      },
      enterprise_admin: {
        canAccessAdmin: true,
        canViewCostPrice: false,
        canDownloadMaterial: true,
        canManageUsers: true,
        canManageProducts: false,
        canManageOrders: true,
        canViewReports: true,
      },
      enterprise_staff: {
        canAccessAdmin: false,
        canViewCostPrice: false,
        canDownloadMaterial: false,
        canManageUsers: false,
        canManageProducts: false,
        canManageOrders: false,
        canViewReports: false,
      },
      designer: {
        canAccessAdmin: false,
        canViewCostPrice: true,
        canDownloadMaterial: true,
        canManageUsers: false,
        canManageProducts: false,
        canManageOrders: false,
        canViewReports: false,
      },
      special_guest: {
        canAccessAdmin: false,
        canViewCostPrice: true,
        canDownloadMaterial: false,
        canManageUsers: false,
        canManageProducts: false,
        canManageOrders: false,
        canViewReports: false,
      },
      customer: {
        canAccessAdmin: false,
        canViewCostPrice: false,
        canDownloadMaterial: false,
        canManageUsers: false,
        canManageProducts: false,
        canManageOrders: false,
        canViewReports: false,
      },
    }
    
    if (rolePermissions[this.role]) {
      this.permissions = { ...this.permissions, ...rolePermissions[this.role] }
    }
  }
  next()
})

module.exports = mongoose.model('User', userSchema)
