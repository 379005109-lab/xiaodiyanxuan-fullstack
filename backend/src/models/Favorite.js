const mongoose = require('mongoose')

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: String,
  productName: String,
  thumbnail: String,
  price: Number,
  createdAt: { type: Date, default: Date.now }
})

favoriteSchema.index({ userId: 1 })
// 删除unique索引，允许用户收藏多个商品
// 注意：如果数据库中已存在unique索引，需要手动删除
favoriteSchema.index({ userId: 1, productId: 1 })

module.exports = mongoose.model('Favorite', favoriteSchema)
