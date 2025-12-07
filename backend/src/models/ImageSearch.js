const mongoose = require('mongoose');

const imageSearchSchema = new mongoose.Schema({
  // 上传的图片
  imageUrl: {
    type: String,
    required: true
  },
  
  // 图片哈希（用于去重和快速匹配）
  imageHash: String,
  
  // 检测到的水印/来源
  detectedSource: {
    type: String,
    enum: ['xiaohongshu', 'douyin', 'kuaishou', 'weibo', 'taobao', 'pinterest', 'unknown', 'none'],
    default: 'unknown'
  },
  
  // 水印检测详情
  watermarkDetails: {
    hasWatermark: { type: Boolean, default: false },
    watermarkText: String,        // 识别到的水印文字
    watermarkPosition: String,    // 水印位置
    confidence: Number            // 置信度 0-1
  },
  
  // 搜索结果
  matchedProducts: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    similarity: Number,  // 相似度 0-100
    productImage: String
  }],
  
  // 用户信息
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userPhone: String,
  
  // 来源渠道（web/miniapp）
  channel: {
    type: String,
    enum: ['web', 'miniapp'],
    default: 'web'
  },
  
  // 设备信息
  deviceInfo: {
    platform: String,     // ios/android/windows/mac
    browser: String,
    userAgent: String
  },
  
  // IP地址
  ipAddress: String,
  
  // 是否有后续行为
  hasFollowUp: { type: Boolean, default: false },
  followUpAction: {
    type: String,
    enum: ['view_product', 'add_cart', 'purchase', 'contact', null],
    default: null
  },
  followUpProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 索引
imageSearchSchema.index({ detectedSource: 1 });
imageSearchSchema.index({ createdAt: -1 });
imageSearchSchema.index({ userId: 1 });
imageSearchSchema.index({ channel: 1 });
imageSearchSchema.index({ imageHash: 1 });

module.exports = mongoose.model('ImageSearch', imageSearchSchema);
