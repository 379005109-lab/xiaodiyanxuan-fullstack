const mongoose = require('mongoose')

// 渠道类型定义
const CHANNEL_TYPES = {
  C_END: 'c_end',           // C端业主
  DESIGNER: 'designer',      // 设计师
  FRANCHISE: 'franchise',    // 加盟渠道
  FLAGSHIP: 'flagship',      // 高定旗舰店
  B_END: 'b_end',           // B端渠道
  OTHER: 'other'            // 其他
}

// 角色代码映射（用于生成渠道编码）
const ROLE_CODES = {
  c_end: 'YZ',      // 业主
  designer: 'SJS',   // 设计师
  franchise: 'JM',   // 加盟
  flagship: 'QJ',    // 旗舰
  b_end: 'BD',      // B端
  other: 'QT'       // 其他
}

// 渠道节点 Schema（支持无限层级）
const channelNodeSchema = new mongoose.Schema({
  // 渠道编码（自动生成）: GS + SJS + 20251214 + 0123
  code: {
    type: String,
    required: true,
    unique: true
  },
  // 渠道名称
  name: {
    type: String,
    required: true,
    trim: true
  },
  // 渠道类型
  type: {
    type: String,
    enum: Object.values(CHANNEL_TYPES),
    required: true
  },
  // 父级渠道ID（null表示顶级渠道，直接属于厂家）
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChannelNode',
    default: null
  },
  // 所属分成体系ID
  commissionSystemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommissionSystem',
    required: true
  },
  // 层级深度（0=厂家直属，1=一级渠道，2=二级渠道...）
  level: {
    type: Number,
    default: 0
  },
  // 渠道路径（存储从根到当前节点的ID路径，方便查询）
  path: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChannelNode'
  }],
  // 分成比例（占上级毛利池的百分比）
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  // 是否固定毛利（true=固定百分比，false=从上级池中分配）
  isFixedMargin: {
    type: Boolean,
    default: false
  },
  // 固定毛利率（仅当isFixedMargin=true时有效）
  fixedMarginRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // 已分配给下级的比例总和
  allocatedRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // 剩余可分配比例
  availableRate: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  // 关联的用户账号（如果有）
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // 联系人信息
  contact: {
    name: String,
    phone: String,
    email: String
  },
  // 创建人（用于可见性控制）
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // 是否启用
  isActive: {
    type: Boolean,
    default: true
  },
  // 备注
  notes: String
}, {
  timestamps: true
})

// 分成体系 Schema（每个厂家一个）
const commissionSystemSchema = new mongoose.Schema({
  // 关联厂家
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: true,
    unique: true
  },
  // 厂家名称
  manufacturerName: {
    type: String,
    required: true
  },
  // 厂家代码（用于生成渠道编码，如 GS=各色, SG=诗歌, KF=科凡）
  manufacturerCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  // 总毛利率（毛利池，如40%）
  totalMarginRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 40
  },
  // 毛利类型：fixed(固定百分比), variable(可变)
  marginType: {
    type: String,
    enum: ['fixed', 'variable'],
    default: 'fixed'
  },
  // 厂家自留比例（从毛利池中）
  factoryRetainRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // 已分配给一级渠道的比例总和
  allocatedRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // 渠道编码计数器（用于生成唯一编号）
  codeCounter: {
    type: Number,
    default: 0
  },
  // 体系状态
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  // 版本号
  version: {
    type: String,
    default: '1.0'
  },
  // 创建人
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // 最后修改人
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // 备注
  notes: String
}, {
  timestamps: true
})

// 索引
channelNodeSchema.index({ commissionSystemId: 1 })
channelNodeSchema.index({ parentId: 1 })
channelNodeSchema.index({ code: 1 }, { unique: true })
channelNodeSchema.index({ createdBy: 1 })
channelNodeSchema.index({ level: 1 })
channelNodeSchema.index({ type: 1 })

commissionSystemSchema.index({ manufacturerId: 1 }, { unique: true })
commissionSystemSchema.index({ manufacturerCode: 1 })
commissionSystemSchema.index({ status: 1 })

// 生成渠道编码的静态方法
commissionSystemSchema.statics.generateChannelCode = async function(systemId, channelType) {
  const system = await this.findById(systemId)
  if (!system) throw new Error('分成体系不存在')
  
  // 获取角色代码
  const roleCode = ROLE_CODES[channelType] || 'QT'
  
  // 获取日期 YYYYMMDD
  const now = new Date()
  const dateStr = now.getFullYear().toString() +
    (now.getMonth() + 1).toString().padStart(2, '0') +
    now.getDate().toString().padStart(2, '0')
  
  // 递增计数器
  system.codeCounter += 1
  await system.save()
  
  // 生成4位编号
  const seqNum = system.codeCounter.toString().padStart(4, '0')
  
  // 组合编码: 厂家代码 + 角色代码 + 日期 + 编号
  return `${system.manufacturerCode}${roleCode}${dateStr}${seqNum}`
}

// 计算可分配比例的方法
channelNodeSchema.methods.getAvailableRate = function() {
  return this.commissionRate - this.allocatedRate
}

// 导出模型和常量
const CommissionSystem = mongoose.model('CommissionSystem', commissionSystemSchema)
const ChannelNode = mongoose.model('ChannelNode', channelNodeSchema)

module.exports = {
  CommissionSystem,
  ChannelNode,
  CHANNEL_TYPES,
  ROLE_CODES
}
