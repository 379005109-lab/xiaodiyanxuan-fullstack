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
    console.log('========== [Favorite] Add request ==========')
    console.log('Full request body:', JSON.stringify(req.body, null, 2))
    console.log('userId:', req.userId)
    
    // 额外的安全检查：确保userId存在
    if (!req.userId) {
      console.error('❌ Favorite add: userId not found')
      return res.status(401).json(errorResponse('User not authenticated', 401))
    }
    
    const { productId } = req.body
    console.log('productId type:', typeof productId)
    console.log('productId value:', productId)
    
    if (!productId) {
      console.error('❌ Missing productId')
      return res.status(400).json(errorResponse('Product ID is required', 400))
    }
    
    // 验证productId格式
    if (typeof productId !== 'string' || productId.trim() === '') {
      console.error('❌ Invalid productId:', typeof productId, productId)
      return res.status(400).json(errorResponse('Invalid product ID', 400))
    }
    
    // Check if already favorited
    console.log('Checking existing favorite...')
    const existing = await Favorite.findOne({ userId: req.userId, productId })
    if (existing) {
      console.log('⚠️ Product already favorited:', productId)
      return res.status(400).json(errorResponse('Product already in favorites', 400))
    }
    
    // 直接创建收藏，不查找产品
    console.log('Creating favorite record...')
    const favorite = await Favorite.create({
      userId: req.userId,
      productId,
      productName: 'Product',
      thumbnail: '',
      price: 0
    })
    
    console.log('✅ Favorite created successfully:', favorite._id)
    console.log('==========================================')
    res.status(201).json(successResponse(favorite))
  } catch (err) {
    console.error('❌ Add favorite error:', err.message)
    console.error('Error stack:', err.stack)
    console.error('Error name:', err.name)
    console.error('==========================================')
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
