const { successResponse, errorResponse } = require('../utils/response')
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../services/cartService')

const getCartData = async (req, res) => {
  try {
    const cart = await getCart(req.userId)
    res.json(successResponse(cart))
  } catch (err) {
    console.error('Get cart error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const add = async (req, res) => {
  try {
    const { productId, quantity, specifications } = req.body
    
    if (!productId || !quantity) {
      return res.status(400).json(errorResponse('Product ID and quantity are required', 400))
    }
    
    const cart = await addToCart(req.userId, productId, quantity, specifications)
    res.status(201).json(successResponse(cart))
  } catch (err) {
    console.error('Add to cart error:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

const update = async (req, res) => {
  try {
    const { id } = req.params
    const { quantity } = req.body
    
    if (quantity === undefined) {
      return res.status(400).json(errorResponse('Quantity is required', 400))
    }
    
    const cart = await updateCartItem(req.userId, id, quantity)
    res.json(successResponse(cart))
  } catch (err) {
    console.error('Update cart error:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

const remove = async (req, res) => {
  try {
    const { id } = req.params
    const cart = await removeFromCart(req.userId, id)
    res.json(successResponse(cart))
  } catch (err) {
    console.error('Remove from cart error:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

const clear = async (req, res) => {
  try {
    const cart = await clearCart(req.userId)
    res.json(successResponse(cart))
  } catch (err) {
    console.error('Clear cart error:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

module.exports = {
  getCartData,
  add,
  update,
  remove,
  clear
}
