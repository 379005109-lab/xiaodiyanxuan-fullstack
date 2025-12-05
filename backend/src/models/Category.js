const mongoose = require('mongoose')

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
