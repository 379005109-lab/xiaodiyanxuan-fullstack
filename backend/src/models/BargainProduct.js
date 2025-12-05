const mongoose = require('mongoose')

// 砍价商品 - 管理员设置的可砍价商品
const bargainProductSchema = new mongoose.Schema({
  // 关联商品（可选，如果是自定义商品则不关联）
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  
  // 商品信息
  name: { type: String, required: true },
  coverImage: { type: String },
  
  // 价格设置
  originalPrice: { type: Number, required: true },  // 原价
  targetPrice: { type: Number, required: true },    // 砍价目标价（底价）
  
  // 砍价规则
  minCutAmount: { type: Number, default: 1 },       // 每次最少砍多少
  maxCutAmount: { type: Number, default: 50 },      // 每次最多砍多少
  maxHelpers: { type: Number, default: 20 },        // 最多多少人帮砍
  
  // 分类和风格（用于筛选）
  category: { type: String, default: '沙发' },
  style: { type: String, default: '现代简约' },
  
  // 状态
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'soldout'],
    default: 'active'
  },
  
  // 统计
  totalBargains: { type: Number, default: 0 },      // 总共发起的砍价次数
  successBargains: { type: Number, default: 0 },    // 砍价成功次数
  
  // 时间限制
  startTime: { type: Date },                        // 活动开始时间
  endTime: { type: Date },                          // 活动结束时间
  
  // 排序权重
  sortOrder: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

bargainProductSchema.index({ status: 1 })
bargainProductSchema.index({ category: 1 })
bargainProductSchema.index({ style: 1 })
bargainProductSchema.index({ sortOrder: -1 })

module.exports = mongoose.model('BargainProduct', bargainProductSchema)
