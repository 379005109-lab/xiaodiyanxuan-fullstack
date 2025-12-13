const mongoose = require('mongoose')

const channelPartnerSchema = new mongoose.Schema({
  // 渠道商名称
  name: {
    type: String,
    required: true,
    trim: true
  },
  // 渠道商编号，如 C1, C2, C3
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // 渠道类型：2S(旗舰店), 2D(设计师/工作室), 2F(加盟商), KA(大客户)
  type: {
    type: String,
    enum: ['2S', '2D', '2F', 'KA', 'other'],
    required: true
  },
  // 经营的品牌（关联的厂家ID列表）
  brands: [{
    manufacturerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manufacturer'
    },
    manufacturerName: String,
    manufacturerCode: String, // 如 各色, 诗歌, 科凡, 美的
    // 品牌颜色标识
    color: {
      type: String,
      default: '#6366f1' // 默认紫色
    }
  }],
  // 区域信息
  region: {
    province: String,
    city: String,
    district: String,
    address: String
  },
  // 联系人信息
  contact: {
    name: String,
    phone: String,
    email: String,
    position: String // 职位
  },
  // 累计销售额 (GMV)
  totalGMV: {
    type: Number,
    default: 0
  },
  // 合作状态：active(合作中), pending(待审核), signing(签约中), suspended(暂停), terminated(终止)
  status: {
    type: String,
    enum: ['active', 'pending', 'signing', 'suspended', 'terminated'],
    default: 'pending'
  },
  // 合作开始日期
  cooperationStartDate: {
    type: Date
  },
  // 合作结束日期（如有）
  cooperationEndDate: {
    type: Date
  },
  // 合同信息
  contract: {
    // 合同编号
    contractNo: String,
    // 合同开始日期
    startDate: Date,
    // 合同结束日期
    endDate: Date,
    // 合同文件URL
    fileUrl: String
  },
  // 银行账户信息
  bankInfo: {
    bankName: String,
    accountName: String,
    accountNumber: String
  },
  // 营业执照
  businessLicense: {
    // 统一社会信用代码
    creditCode: String,
    // 营业执照图片
    imageUrl: String,
    // 公司注册名称
    companyName: String
  },
  // 备注
  notes: String,
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
channelPartnerSchema.index({ code: 1 })
channelPartnerSchema.index({ type: 1 })
channelPartnerSchema.index({ status: 1 })
channelPartnerSchema.index({ 'brands.manufacturerId': 1 })
channelPartnerSchema.index({ 'region.province': 1, 'region.city': 1 })
channelPartnerSchema.index({ name: 'text', 'contact.name': 'text' })

module.exports = mongoose.model('ChannelPartner', channelPartnerSchema)
