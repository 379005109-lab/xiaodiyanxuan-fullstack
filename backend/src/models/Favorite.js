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
favoriteSchema.index({ userId: 1, productId: 1 }, { unique: true })

module.exports = mongoose.model('Favorite', favoriteSchema)
