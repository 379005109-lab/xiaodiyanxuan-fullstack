const mongoose = require('mongoose')

const browseHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  productImage: String,
  productCode: String,
  categoryName: String,
  // 访问来源
  source: { 
    type: String, 
    enum: ['web', 'miniapp', 'admin', 'share'], 
    default: 'web' 
  },
  // 访问设备信息
  deviceInfo: {
    userAgent: String,
    ip: String,
    platform: String
  },
  // 停留时间（秒）
  duration: { type: Number, default: 0 },
  // 访问时间
  viewedAt: { type: Date, default: Date.now }
})

// 索引
browseHistorySchema.index({ userId: 1, viewedAt: -1 })
browseHistorySchema.index({ productId: 1, viewedAt: -1 })
browseHistorySchema.index({ viewedAt: -1 })

module.exports = mongoose.model('BrowseHistory', browseHistorySchema)
