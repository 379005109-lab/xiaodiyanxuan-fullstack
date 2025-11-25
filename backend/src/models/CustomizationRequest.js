const mongoose = require('mongoose')

const customizationRequestSchema = new mongoose.Schema({
  // 用户信息
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // 可以是未登录用户
  },
  
  // 联系信息
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true
  },
  contactEmail: {
    type: String,
    trim: true
  },
  
  // 定制需求详情
  productType: {
    type: String, // 产品类型：沙发、床、桌子等
    required: true
  },
  customizationDetails: {
    type: String, // 详细描述
    required: true
  },
  dimensions: {
    type: String, // 尺寸要求
  },
  materials: {
    type: String, // 材质要求
  },
  colors: {
    type: String, // 颜色要求
  },
  budget: {
    type: Number, // 预算
  },
  deadline: {
    type: Date, // 期望完成时间
  },
  
  // 附件
  images: [{
    type: String // 参考图片URLs
  }],
  
  // 状态
  status: {
    type: String,
    enum: ['pending', 'contacted', 'quoted', 'confirmed', 'in_production', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // 备注
  adminNotes: {
    type: String // 管理员备注
  },
  
  // 报价
  quotedPrice: {
    type: Number
  },
  quotedAt: {
    type: Date
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('CustomizationRequest', customizationRequestSchema)
