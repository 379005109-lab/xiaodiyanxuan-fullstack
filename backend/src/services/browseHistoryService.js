const BrowseHistory = require('../models/BrowseHistory')
const Product = require('../models/Product')

/**
 * 记录用户浏览商品
 */
const recordBrowse = async (userId, productId, options = {}) => {
  if (!userId || !productId) return null
  
  try {
    const product = await Product.findById(productId).lean()
    if (!product) return null
    
    // 获取分类名称
    let categoryName = ''
    if (product.category) {
      categoryName = typeof product.category === 'string' 
        ? product.category 
        : (product.category.name || product.category.id || '')
    }
    
    const record = await BrowseHistory.create({
      userId,
      productId,
      productName: product.name,
      productImage: product.thumbnail || (product.images && product.images[0]) || '',
      productCode: product.productCode || product.code || '',
      categoryName,
      source: options.source || 'web',
      deviceInfo: {
        userAgent: options.userAgent || '',
        ip: options.ip || '',
        platform: options.platform || ''
      },
      viewedAt: new Date()
    })
    
    return record
  } catch (error) {
    console.error('记录浏览历史失败:', error)
    return null
  }
}

/**
 * 获取用户的浏览历史
 */
const getUserBrowseHistory = async (userId, options = {}) => {
  const { page = 1, limit = 50, startDate, endDate } = options
  
  const query = { userId }
  
  if (startDate || endDate) {
    query.viewedAt = {}
    if (startDate) query.viewedAt.$gte = new Date(startDate)
    if (endDate) query.viewedAt.$lte = new Date(endDate)
  }
  
  const total = await BrowseHistory.countDocuments(query)
  const records = await BrowseHistory.find(query)
    .sort({ viewedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
  
  return { records, total, page, limit }
}

/**
 * 获取用户浏览路径（按时间顺序的商品浏览轨迹）
 */
const getUserBrowsePath = async (userId, options = {}) => {
  const { startDate, endDate, limit = 100 } = options
  
  const query = { userId }
  
  if (startDate || endDate) {
    query.viewedAt = {}
    if (startDate) query.viewedAt.$gte = new Date(startDate)
    if (endDate) query.viewedAt.$lte = new Date(endDate)
  }
  
  const records = await BrowseHistory.find(query)
    .sort({ viewedAt: 1 }) // 升序，从早到晚
    .limit(limit)
    .lean()
  
  // 构建浏览路径
  const path = records.map((r, index) => ({
    step: index + 1,
    productId: r.productId,
    productName: r.productName,
    productCode: r.productCode,
    productImage: r.productImage,
    categoryName: r.categoryName,
    source: r.source,
    viewedAt: r.viewedAt,
    // 与上一步的时间间隔（分钟）
    intervalMinutes: index > 0 
      ? Math.round((new Date(r.viewedAt) - new Date(records[index - 1].viewedAt)) / 60000) 
      : 0
  }))
  
  return path
}

/**
 * 获取用户浏览统计
 */
const getUserBrowseStats = async (userId) => {
  const totalViews = await BrowseHistory.countDocuments({ userId })
  
  // 今日浏览
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayViews = await BrowseHistory.countDocuments({
    userId,
    viewedAt: { $gte: today }
  })
  
  // 最常浏览的分类
  const categoryStats = await BrowseHistory.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
    { $group: { _id: '$categoryName', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ])
  
  // 最近浏览的商品（去重）
  const recentProducts = await BrowseHistory.aggregate([
    { $match: { userId: require('mongoose').Types.ObjectId(userId) } },
    { $sort: { viewedAt: -1 } },
    { $group: { 
      _id: '$productId', 
      productName: { $first: '$productName' },
      productImage: { $first: '$productImage' },
      lastViewedAt: { $first: '$viewedAt' },
      viewCount: { $sum: 1 }
    }},
    { $sort: { lastViewedAt: -1 } },
    { $limit: 10 }
  ])
  
  return {
    totalViews,
    todayViews,
    topCategories: categoryStats,
    recentProducts
  }
}

/**
 * 获取所有用户的浏览历史（管理员用）
 */
const getAllBrowseHistory = async (options = {}) => {
  const { page = 1, limit = 50, userId, productId, startDate, endDate } = options
  
  const query = {}
  if (userId) query.userId = userId
  if (productId) query.productId = productId
  
  if (startDate || endDate) {
    query.viewedAt = {}
    if (startDate) query.viewedAt.$gte = new Date(startDate)
    if (endDate) query.viewedAt.$lte = new Date(endDate)
  }
  
  const total = await BrowseHistory.countDocuments(query)
  const records = await BrowseHistory.find(query)
    .populate('userId', 'nickname phone username avatar role')
    .sort({ viewedAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean()
  
  return { records, total, page, limit }
}

module.exports = {
  recordBrowse,
  getUserBrowseHistory,
  getUserBrowsePath,
  getUserBrowseStats,
  getAllBrowseHistory
}
