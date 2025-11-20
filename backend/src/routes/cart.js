const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { getCartData, add, update, remove, clear } = require('../controllers/cartController')

// All cart routes require authentication
router.use(auth)

// GET /api/cart - Get cart
router.get('/', getCartData)

// POST /api/cart - Add to cart
router.post('/', add)

// PUT /api/cart/:id - Update cart item
router.put('/:id', update)

// DELETE /api/cart/:id - Remove from cart
router.delete('/:id', remove)

// DELETE /api/cart/clear - Clear cart
router.delete('/clear', clear)

module.exports = router
