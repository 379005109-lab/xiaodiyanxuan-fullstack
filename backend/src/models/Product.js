const mongoose = require('mongoose')
const { PRODUCT_STATUS } = require('../config/constants')

// SKU子文档Schema
const skuSchema = new mongoose.Schema({
  code: String,
  spec: String,
  color: String,
  material: mongoose.Schema.Types.Mixed, // 支持字符串或对象 {fabric, filling, frame, leg}
  materialId: String,
  materialUpgradePrices: mongoose.Schema.Types.Mixed,
  materialImages: mongoose.Schema.Types.Mixed,
  materialDescriptions: mongoose.Schema.Types.Mixed,
  stock: { type: Number, default: 0 },
  price: { type: Number, required: true },
  discountPrice: Number,
  images: [String],
  length: Number,
  width: Number,
  height: Number,
  isPro: { type: Boolean, default: false },
  proFeature: String,
  status: { type: Boolean, default: true },
  sales: { type: Number, default: 0 }
}, { _id: true })

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  productCode: String,
  code: { type: String, unique: true, sparse: true },
  subCodes: [String], // 副编号数组
  description: String,
  basePrice: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  thumbnail: String,
  images: [String],
  videos: [String], // 视频URL数组
  videoTitles: [String], // 视频标题数组，与videos一一对应
  files: [mongoose.Schema.Types.Mixed], // 设计文件数组 {name, url, size}
  category: mongoose.Schema.Types.Mixed, // 支持字符串ID或对象
  style: mongoose.Schema.Types.Mixed,
  styles: [String], // 多个风格标签（现代风、轻奢风等）
  specifications: mongoose.Schema.Types.Mixed,
  skus: [skuSchema], // SKU数组
  tags: [String],
  isCombo: { type: Boolean, default: false },
  comboItems: [String],
  sales: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  order: { type: Number, default: 0 },
  status: { type: String, enum: Object.values(PRODUCT_STATUS), default: PRODUCT_STATUS.ACTIVE },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

productSchema.index({ name: 'text', description: 'text' })
productSchema.index({ category: 1 })
productSchema.index({ style: 1 })
productSchema.index({ status: 1 })
productSchema.index({ order: 1 })  // 排序字段索引

module.exports = mongoose.model('Product', productSchema)
