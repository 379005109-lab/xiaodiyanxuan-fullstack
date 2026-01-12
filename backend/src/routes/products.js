const express = require('express')
const multer = require('multer')
const router = express.Router()
const { optionalAuth, auth } = require('../middleware/auth')
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct, getProductCategories, getProductStyles, search, bulkImport, updateProductPricing, getProductPricing } = require('../controllers/productController')

// 配置 multer
const storage = multer.memoryStorage()
const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`不支持的文件类型: ${file.mimetype}`))
    }
  }
})

// 特定路由必须在参数路由之前
// GET /api/products/categories - Get categories
router.get('/categories', getProductCategories)

// GET /api/products/styles - Get styles
router.get('/styles', getProductStyles)

// GET /api/products/search - Search products
router.get('/search', optionalAuth, search)

// POST /api/products/bulk-import - Bulk import products
router.post('/bulk-import', auth, bulkImport)

// POST /api/products - Create product
router.post('/', auth, createProduct)

// GET /api/products - List products
router.get('/', optionalAuth, listProducts)

// 上传功能暂时禁用，待实现
// POST /api/products/:productId/upload-thumbnail - Upload thumbnail
// router.post('/:productId/upload-thumbnail', authenticate, upload.single('file'), uploadThumbnail)

// POST /api/products/:productId/upload-images - Upload images
// router.post('/:productId/upload-images', authenticate, upload.array('files', 10), uploadImages)

// DELETE /api/products/:productId/images/:imageIndex - Delete image
// router.delete('/:productId/images/:imageIndex', authenticate, deleteImage)

// GET /api/products/:id/stats - Get product dashboard statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { period = 'month' } = req.query
    const mongoose = require('mongoose')
    const BrowseHistory = require('../models/BrowseHistory')
    const Favorite = require('../models/Favorite')
    const Order = require('../models/Order')
    const Product = require('../models/Product')
    
    // 验证商品存在
    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    
    // 计算时间范围
    const now = new Date()
    let startDate, prevStartDate
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        prevStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        prevStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        break
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        prevStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        prevStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        prevStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    }
    
    // 当前周期浏览量
    const currentViews = await BrowseHistory.countDocuments({
      productId: new mongoose.Types.ObjectId(id),
      viewedAt: { $gte: startDate }
    })
    
    // 上一周期浏览量
    const prevViews = await BrowseHistory.countDocuments({
      productId: new mongoose.Types.ObjectId(id),
      viewedAt: { $gte: prevStartDate, $lt: startDate }
    })
    
    // 收藏数
    const favorites = await Favorite.countDocuments({ productId: id })
    
    // 销售数据（从订单中统计）
    const orderItems = await Order.aggregate([
      { $match: { 
        'items.productId': id,
        status: { $gte: 2 }, // 已支付及以上状态
        createdAt: { $gte: startDate }
      }},
      { $unwind: '$items' },
      { $match: { 'items.productId': id } },
      { $group: {
        _id: null,
        totalSales: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' }
      }}
    ])
    
    const prevOrderItems = await Order.aggregate([
      { $match: { 
        'items.productId': id,
        status: { $gte: 2 },
        createdAt: { $gte: prevStartDate, $lt: startDate }
      }},
      { $unwind: '$items' },
      { $match: { 'items.productId': id } },
      { $group: {
        _id: null,
        totalSales: { $sum: '$items.quantity' },
        totalRevenue: { $sum: '$items.subtotal' }
      }}
    ])
    
    const currentSales = orderItems[0]?.totalSales || 0
    const currentRevenue = orderItems[0]?.totalRevenue || 0
    const prevSales = prevOrderItems[0]?.totalSales || 0
    
    // 计算增长率
    const viewsGrowth = prevViews > 0 ? ((currentViews - prevViews) / prevViews * 100).toFixed(1) : 0
    const salesGrowth = prevSales > 0 ? ((currentSales - prevSales) / prevSales * 100).toFixed(1) : 0
    
    // 销售趋势数据
    let trendData = []
    if (period === 'week') {
      // 按天统计
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        dayStart.setHours(0, 0, 0, 0)
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
        
        const dayOrders = await Order.aggregate([
          { $match: { 
            'items.productId': id,
            status: { $gte: 2 },
            createdAt: { $gte: dayStart, $lt: dayEnd }
          }},
          { $unwind: '$items' },
          { $match: { 'items.productId': id } },
          { $group: {
            _id: null,
            sales: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' }
          }}
        ])
        
        const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
        trendData.push({
          name: dayNames[dayStart.getDay()],
          sales: dayOrders[0]?.sales || 0,
          revenue: dayOrders[0]?.revenue || 0
        })
      }
    } else if (period === 'month') {
      // 按周统计
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000)
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000)
        
        const weekOrders = await Order.aggregate([
          { $match: { 
            'items.productId': id,
            status: { $gte: 2 },
            createdAt: { $gte: weekStart, $lt: weekEnd }
          }},
          { $unwind: '$items' },
          { $match: { 'items.productId': id } },
          { $group: {
            _id: null,
            sales: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' }
          }}
        ])
        
        trendData.push({
          name: `第${4-i}周`,
          sales: weekOrders[0]?.sales || 0,
          revenue: weekOrders[0]?.revenue || 0
        })
      }
    } else {
      // 按月统计
      const months = period === 'quarter' ? 3 : 12
      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
        
        const monthOrders = await Order.aggregate([
          { $match: { 
            'items.productId': id,
            status: { $gte: 2 },
            createdAt: { $gte: monthStart, $lt: monthEnd }
          }},
          { $unwind: '$items' },
          { $match: { 'items.productId': id } },
          { $group: {
            _id: null,
            sales: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.subtotal' }
          }}
        ])
        
        trendData.push({
          name: `${monthStart.getMonth() + 1}月`,
          sales: monthOrders[0]?.sales || 0,
          revenue: monthOrders[0]?.revenue || 0
        })
      }
    }
    
    // SKU销售排名
    const skuRanking = await Order.aggregate([
      { $match: { 
        'items.productId': id,
        status: { $gte: 2 },
        createdAt: { $gte: startDate }
      }},
      { $unwind: '$items' },
      { $match: { 'items.productId': id } },
      { $group: {
        _id: '$items.specifications',
        sales: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.subtotal' }
      }},
      { $sort: { sales: -1 } },
      { $limit: 10 }
    ])
    
    const skuRankingData = skuRanking.map((item, index) => ({
      name: item._id ? Object.values(item._id).filter(Boolean).join(' / ') : `规格${index + 1}`,
      sales: item.sales,
      revenue: item.revenue
    }))
    
    res.json({
      success: true,
      data: {
        views: currentViews,
        viewsGrowth: Number(viewsGrowth),
        sales: currentSales,
        salesGrowth: Number(salesGrowth),
        favorites,
        revenue: currentRevenue,
        trendData,
        skuRankingData
      }
    })
  } catch (error) {
    console.error('获取商品统计失败:', error)
    res.status(500).json({ success: false, message: '获取商品统计失败' })
  }
})

// GET /api/products/:id/pricing - Get product pricing config
router.get('/:id/pricing', auth, getProductPricing)

// PUT /api/products/:id/pricing - Update product pricing config
router.put('/:id/pricing', auth, updateProductPricing)

// PATCH /api/products/:id/status - 切换商品状态（上架/下架）
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params
    const Product = require('../models/Product')
    
    const product = await Product.findById(id)
    if (!product) {
      return res.status(404).json({ success: false, message: '商品不存在' })
    }
    
    // 切换状态
    product.status = product.status === 'active' ? 'inactive' : 'active'
    await product.save()
    
    res.json({ 
      success: true, 
      data: product,
      message: product.status === 'active' ? '商品已上架' : '商品已下架'
    })
  } catch (error) {
    console.error('切换商品状态失败:', error)
    res.status(500).json({ success: false, message: '切换商品状态失败' })
  }
})

// GET /api/products/:id - Get product details
router.get('/:id', optionalAuth, getProduct)

// PUT /api/products/:id - Update product
router.put('/:id', auth, updateProduct)

// DELETE /api/products/:id - Delete product
router.delete('/:id', auth, deleteProduct)

module.exports = router
