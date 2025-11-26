const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Favorite = require('../models/Favorite')
const Product = require('../models/Product')
const { calculatePagination } = require('../utils/helpers')

const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 100 } = req.query  // 默认返回更多收藏
    const { skip, pageSize: size } = calculatePagination(page, pageSize)
    
    const total = await Favorite.countDocuments({ userId: req.userId })
    const favorites = await Favorite.find({ userId: req.userId })
      .sort('-createdAt')
      .skip(skip)
      .limit(size)
      .lean()
    
    // 填充商品详细信息
    const favoritesWithProducts = await Promise.all(
      favorites.map(async (fav) => {
        try {
          const product = await Product.findById(fav.productId).lean()
          return {
            ...fav,
            product: product || null,  // 如果商品被删除，返回null
          }
        } catch (err) {
          console.error(`Error fetching product ${fav.productId}:`, err)
          return {
            ...fav,
            product: null,
          }
        }
      })
    )
    
    res.json(paginatedResponse(favoritesWithProducts, total, page, size))
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
    
    const { productId, productName, thumbnail, price } = req.body
    
    if (!productId) {
      return res.status(400).json(errorResponse('Product ID is required', 400))
    }
    
    // Check if already favorited
    const existing = await Favorite.findOne({ userId: req.userId, productId })
    if (existing) {
      return res.status(400).json(errorResponse('Product already in favorites', 400))
    }
    
    // 尝试从数据库获取商品信息，如果不存在则使用传入的数据
    let favoriteData = {
      userId: req.userId,
      productId
    }
    
    const product = await Product.findById(productId).catch(() => null)
    if (product) {
      favoriteData.productName = product.name
      favoriteData.thumbnail = product.thumbnail
      favoriteData.price = product.basePrice
    } else if (productName) {
      // 如果商品不存在但提供了商品信息，使用传入的数据
      favoriteData.productName = productName
      favoriteData.thumbnail = thumbnail
      favoriteData.price = price
    } else {
      // 商品不存在且没有提供信息
      return res.status(404).json(errorResponse('Product not found', 404))
    }
    
    const favorite = await Favorite.create(favoriteData)
    
    res.status(201).json(successResponse(favorite))
  } catch (err) {
    console.error('Add favorite error:', err)
    console.error('Add favorite error stack:', err.stack)
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
