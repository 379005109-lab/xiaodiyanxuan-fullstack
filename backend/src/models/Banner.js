const mongoose = require('mongoose')

const bannerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['hero', 'service', 'promotion'],  // hero: 首页轮播, service: 服务图, promotion: 促销
    default: 'hero'
  },
  platform: {
    type: String,
    enum: ['miniapp', 'web', 'all'],  // miniapp: 小程序, web: 网站, all: 所有平台
    default: 'miniapp'
  },
  image: { type: String, required: true },
  link: String,  // 点击跳转链接
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  startTime: Date,  // 开始展示时间
  endTime: Date,    // 结束展示时间
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

bannerSchema.index({ type: 1, platform: 1, status: 1, order: 1 })

module.exports = mongoose.model('Banner', bannerSchema)
