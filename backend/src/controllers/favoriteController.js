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
      console.error('❌ [Favorite] userId不存在')
      return res.status(401).json(errorResponse('User not authenticated', 401))
    }
    
    const { productId } = req.body
    
    if (!productId) {
      console.error('❌ [Favorite] productId不存在')
      return res.status(400).json(errorResponse('Product ID is required', 400))
    }
    
    console.log('📝 [Favorite] 查找商品:', productId)
    const product = await Product.findById(productId).lean()
    if (!product) {
      console.error('❌ [Favorite] 商品不存在:', productId)
      return res.status(404).json(errorResponse('Product not found', 404))
    }
    
    // Check if already favorited
    const existing = await Favorite.findOne({ userId: req.userId, productId })
    if (existing) {
      console.log('⚠️  [Favorite] 商品已在收藏列表')
      return res.status(400).json(errorResponse('Product already in favorites', 400))
    }
    
    console.log('📝 [Favorite] 创建收藏记录')
    const favorite = await Favorite.create({
      userId: req.userId,
      productId,
      productName: product.name || '未知商品',
      thumbnail: product.thumbnail || product.images?.[0] || '',
      price: product.basePrice || 0
    })
    
    console.log('✅ [Favorite] 收藏成功:', favorite._id)
    res.status(201).json(successResponse(favorite))
  } catch (err) {
    console.error('❌ [Favorite] 添加收藏错误:', err)
    console.error('❌ [Favorite] 错误详情:', err.stack)
    res.status(500).json(errorResponse(err.message || '添加收藏失败', 500))
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
