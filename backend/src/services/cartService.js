const Cart = require('../models/Cart')
const Product = require('../models/Product')
const { calculatePrice } = require('../utils/helpers')
const { NotFoundError, ValidationError } = require('../utils/errors')

const getCart = async (userId) => {
  let cart = await Cart.findOne({ userId })
  
  if (!cart) {
    cart = await Cart.create({ userId, items: [] })
  }
  
  return cart
}

const addToCart = async (userId, productId, quantity, specifications = {}) => {
  const product = await Product.findById(productId)
  if (!product) {
    throw new NotFoundError('Product not found')
  }
  
  if (product.stock < quantity) {
    throw new ValidationError('Insufficient stock')
  }
  
  let cart = await Cart.findOne({ userId })
  if (!cart) {
    cart = await Cart.create({ userId, items: [] })
  }
  
  // Calculate price
  const price = calculatePrice(product.basePrice, specifications)
  const subtotal = price * quantity
  
  // Check if product already in cart
  const existingItem = cart.items.find(item => item.productId === productId)
  
  if (existingItem) {
    existingItem.quantity += quantity
    existingItem.subtotal = existingItem.quantity * price
  } else {
    cart.items.push({
      productId,
      productName: product.name,
      thumbnail: product.thumbnail,
      basePrice: product.basePrice,
      quantity,
      specifications,
      subtotal
    })
  }
  
  cart.updatedAt = new Date()
  await cart.save()
  
  return cart
}

const updateCartItem = async (userId, cartItemId, quantity) => {
  const cart = await Cart.findOne({ userId })
  if (!cart) {
    throw new NotFoundError('Cart not found')
  }
  
  const item = cart.items.id(cartItemId)
  if (!item) {
    throw new NotFoundError('Cart item not found')
  }
  
  if (quantity <= 0) {
    item.remove()
  } else {
    item.quantity = quantity
    item.subtotal = item.quantity * (item.basePrice + 
      (item.specifications.sizeExtra || 0) +
      (item.specifications.materialExtra || 0) +
      (item.specifications.fillExtra || 0) +
      (item.specifications.frameExtra || 0) +
      (item.specifications.legExtra || 0))
  }
  
  cart.updatedAt = new Date()
  await cart.save()
  
  return cart
}

const removeFromCart = async (userId, cartItemId) => {
  const cart = await Cart.findOne({ userId })
  if (!cart) {
    throw new NotFoundError('Cart not found')
  }
  
  const item = cart.items.id(cartItemId)
  if (!item) {
    throw new NotFoundError('Cart item not found')
  }
  
  item.remove()
  cart.updatedAt = new Date()
  await cart.save()
  
  return cart
}

const clearCart = async (userId) => {
  const cart = await Cart.findOne({ userId })
  if (!cart) {
    throw new NotFoundError('Cart not found')
  }
  
  cart.items = []
  cart.updatedAt = new Date()
  await cart.save()
  
  return cart
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
}
