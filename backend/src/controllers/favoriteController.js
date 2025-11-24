const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Favorite = require('../models/Favorite')
const Product = require('../models/Product')
const { calculatePagination } = require('../utils/helpers')

const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query
    const { skip, pageSize: size } = calculatePagination(page, pageSize)
    
    const total = await Favorite.countDocuments({ userId: req.userId })
    const favorites = await Favorite.find({ userId: req.userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(size)
      .lean()
    
    res.json(paginatedResponse(favorites, total, page, size))
  } catch (err) {
    console.error('List favorites error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const add = async (req, res) => {
  try {
    // 额外的安全检查：确保userId存在
    if (!req.userId) {
      return res.status(401).json(errorResponse('User not authenticated', 401))
    }
    
    const { productId } = req.body
    
    if (!productId) {
      return res.status(400).json(errorResponse('Product ID is required', 400))
    }
    
    const product = await Product.findById(productId)
    if (!product) {
      return res.status(404).json(errorResponse('Product not found', 404))
    }
    
    // Check if already favorited
    const existing = await Favorite.findOne({ userId: req.userId, productId })
    if (existing) {
      return res.status(400).json(errorResponse('Product already in favorites', 400))
    }
    
    const favorite = await Favorite.create({
      userId: req.userId,
      productId,
      productName: product.name,
      thumbnail: product.thumbnail,
      price: product.basePrice
    })
    
    res.status(201).json(successResponse(favorite))
  } catch (err) {
    console.error('Add favorite error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const remove = async (req, res) => {
  try {
    const { id } = req.params
    
    const favorite = await Favorite.findOneAndDelete({ _id: id, userId: req.userId })
    if (!favorite) {
      return res.status(404).json(errorResponse('Favorite not found', 404))
    }
    
    res.json(successResponse(null, 'Removed from favorites'))
  } catch (err) {
    console.error('Remove favorite error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 检查商品是否已收藏
const check = async (req, res) => {
  try {
    const { productId } = req.params
    
    const favorite = await Favorite.findOne({ userId: req.userId, productId })
    
    res.json(successResponse({ isFavorited: !!favorite }))
  } catch (err) {
    console.error('Check favorite error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  list,
  add,
  remove,
  check
}
