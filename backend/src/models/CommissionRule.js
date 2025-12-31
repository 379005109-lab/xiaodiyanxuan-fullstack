const mongoose = require('mongoose')

// 分成规则子项 Schema
const commissionSubRuleSchema = new mongoose.Schema({
  // 子规则编号，如 1.1, 2.1, 2.2
  code: {
    type: String,
    required: true
  },
  // 渠道路径，如 "F > C", "F > B > C"
  channelPath: {
    type: String,
    required: true
  },
  // 渠道类型：direct(直销), franchise(加盟商), designer(设计师)
  channelType: {
    type: String,
    enum: ['direct', 'franchise', 'designer', 'other'],
    default: 'direct'
  },
  // 描述
  description: {
    type: String
  },
  // 利益分配详情
  profitDistribution: [{
    // 角色：Factory(厂家), Broker(经销商), Customer(客户), Designer(设计师), Platform(平台)
    role: {
      type: String,
      required: true
    },
    // 角色代码，如 F, B, C, D, P
    roleCode: {
      type: String,
      required: true
    },
    // 分成比例（百分比）
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    // 分成类型：gross_margin(毛利分成), fixed(固定金额), tiered(阶梯)
    type: {
      type: String,
      enum: ['gross_margin', 'fixed', 'tiered'],
      default: 'gross_margin'
    }
  }],
  // 是否启用
  isActive: {
    type: Boolean,
    default: true
  }
})

// 分成渠道 Schema
const commissionChannelSchema = new mongoose.Schema({
  // 渠道编号，如 1, 2
  index: {
    type: Number,
    required: true
  },
  // 渠道代码，如 "2C", "2F", "2D", "2S"
  code: {
    type: String,
    required: true
  },
  // 渠道名称，如 "直接客户", "加盟商渠道", "设计师渠道", "高定旗舰店"
  name: {
    type: String,
    required: true
  },
  // 渠道类型
  type: {
    type: String,
    enum: ['2C', '2F', '2D', '2S', '2B', 'other'],
    default: '2C'
  },
  // 毛利率（百分比）
  grossMargin: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  // 渠道描述
  description: {
    type: String
  },
  // 子规则列表
  subRules: [commissionSubRuleSchema],
  // 是否展开显示
  expanded: {
    type: Boolean,
    default: false
  },
  // 是否启用
  isActive: {
    type: Boolean,
    default: true
  }
})

// 分成规则体系 Schema
const commissionRuleSchema = new mongoose.Schema({
  // 关联厂家
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: true
  },
  // 厂家名称（冗余存储方便查询）
  manufacturerName: {
    type: String,
    required: true
  },
  // 厂家代码，如 "Gese", "Shige", "Kefan", "Midea"
  manufacturerCode: {
    type: String,
    required: true
  },
  // 规则版本
  version: {
    type: String,
    default: '1.0'
  },
  // 渠道列表
  channels: [commissionChannelSchema],
  // 规则状态
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },
  // 备注
  notes: {
    type: String
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
  }
}, {
  timestamps: true
})

// 索引
commissionRuleSchema.index({ manufacturerId: 1 })
commissionRuleSchema.index({ manufacturerCode: 1 })
commissionRuleSchema.index({ status: 1 })

module.exports = mongoose.model('CommissionRule', commissionRuleSchema)
