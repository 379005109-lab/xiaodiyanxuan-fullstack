const mongoose = require('mongoose')

// 折扣规则子schema
const discountSchema = new mongoose.Schema({
  role: { type: String, required: true }, // 'designer', 'agent', 'vip' 等
  discountPercent: { type: Number, required: true, min: 0, max: 100 } // 折扣百分比，如 90 表示9折
}, { _id: false })

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true, sparse: true }, // sparse: true 允许多个null值
  description: String,
  icon: String,
  image: String,
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // 父分类ID
  level: { type: Number, default: 1 }, // 层级：1为顶级，2为二级
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  discounts: [discountSchema], // 折扣规则数组
  hasDiscount: { type: Boolean, default: false }, // 是否有折扣
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// 自动生成slug
categorySchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    // 简单的slug生成：将名称转为小写并替换空格为连字符
    this.slug = this.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '')
  }
  next()
})

categorySchema.index({ status: 1, order: 1 })

module.exports = mongoose.model('Category', categorySchema)
