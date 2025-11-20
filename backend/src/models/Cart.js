const mongoose = require('mongoose')

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: [{
    productId: String,
    productName: String,
    thumbnail: String,
    basePrice: Number,
    quantity: Number,
    specifications: {
      size: String,
      sizeExtra: Number,
      material: String,
      color: String,
      materialExtra: Number,
      fill: String,
      fillExtra: Number,
      frame: String,
      frameExtra: Number,
      leg: String,
      legExtra: Number
    },
    subtotal: Number
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

cartSchema.index({ userId: 1 })

module.exports = mongoose.model('Cart', cartSchema)
