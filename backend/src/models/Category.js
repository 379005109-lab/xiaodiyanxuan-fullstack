const mongoose = require('mongoose')

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, sparse: true }, // sparse: true 允许多个null值
  description: String,
  icon: String,
  image: String,
  manufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Manufacturer', default: null },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null }, // 父分类ID
  level: { type: Number, default: 1 }, // 层级：1为顶级，2为二级
  order: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
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
categorySchema.index({ manufacturerId: 1, name: 1 }, { unique: true })
categorySchema.index({ manufacturerId: 1, slug: 1 }, { unique: true, sparse: true })

module.exports = mongoose.model('Category', categorySchema)
