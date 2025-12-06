const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const browseHistoryService = require('../services/browseHistoryService')

/**
 * 记录浏览历史
 * POST /api/browse-history
 */
const recordBrowse = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json(errorResponse('请先登录', 401))
    }
    
    const { productId, source } = req.body
    if (!productId) {
      return res.status(400).json(errorResponse('商品ID不能为空', 400))
    }
    
    const record = await browseHistoryService.recordBrowse(userId, productId, {
      source: source || 'web',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      platform: req.headers['x-platform'] || 'web'
    })
    
    res.json(successResponse(record, '记录成功'))
  } catch (err) {
    console.error('Record browse error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 获取当前用户的浏览历史
 * GET /api/browse-history/my
 */
const getMyBrowseHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json(errorResponse('请先登录', 401))
    }
    
    const { page = 1, limit = 50, startDate, endDate } = req.query
    const result = await browseHistoryService.getUserBrowseHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate
    })
    
    res.json(paginatedResponse(result.records, result.total, result.page, result.limit))
  } catch (err) {
    console.error('Get my browse history error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 获取当前用户的浏览路径
 * GET /api/browse-history/my/path
 */
const getMyBrowsePath = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json(errorResponse('请先登录', 401))
    }
    
    const { startDate, endDate, limit = 100 } = req.query
    const path = await browseHistoryService.getUserBrowsePath(userId, {
      startDate,
      endDate,
      limit: parseInt(limit)
    })
    
    res.json(successResponse(path))
  } catch (err) {
    console.error('Get my browse path error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 获取当前用户的浏览统计
 * GET /api/browse-history/my/stats
 */
const getMyBrowseStats = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id
    if (!userId) {
      return res.status(401).json(errorResponse('请先登录', 401))
    }
    
    const stats = await browseHistoryService.getUserBrowseStats(userId)
    res.json(successResponse(stats))
  } catch (err) {
    console.error('Get my browse stats error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 管理员：获取指定用户的浏览历史
 * GET /api/browse-history/user/:userId
 */
const getUserBrowseHistory = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 50, startDate, endDate } = req.query
    
    const result = await browseHistoryService.getUserBrowseHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      startDate,
      endDate
    })
    
    res.json(paginatedResponse(result.records, result.total, result.page, result.limit))
  } catch (err) {
    console.error('Get user browse history error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 管理员：获取指定用户的浏览路径
 * GET /api/browse-history/user/:userId/path
 */
const getUserBrowsePath = async (req, res) => {
  try {
    const { userId } = req.params
    const { startDate, endDate, limit = 100 } = req.query
    
    const path = await browseHistoryService.getUserBrowsePath(userId, {
      startDate,
      endDate,
      limit: parseInt(limit)
    })
    
    res.json(successResponse(path))
  } catch (err) {
    console.error('Get user browse path error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 管理员：获取指定用户的浏览统计
 * GET /api/browse-history/user/:userId/stats
 */
const getUserBrowseStats = async (req, res) => {
  try {
    const { userId } = req.params
    const stats = await browseHistoryService.getUserBrowseStats(userId)
    res.json(successResponse(stats))
  } catch (err) {
    console.error('Get user browse stats error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

/**
 * 管理员：获取所有浏览历史
 * GET /api/browse-history/all
 */
const getAllBrowseHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, productId, startDate, endDate } = req.query
    
    const result = await browseHistoryService.getAllBrowseHistory({
      page: parseInt(page),
      limit: parseInt(limit),
      userId,
      productId,
      startDate,
      endDate
    })
    
    res.json(paginatedResponse(result.records, result.total, result.page, result.limit))
  } catch (err) {
    console.error('Get all browse history error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  recordBrowse,
  getMyBrowseHistory,
  getMyBrowsePath,
  getMyBrowseStats,
  getUserBrowseHistory,
  getUserBrowsePath,
  getUserBrowseStats,
  getAllBrowseHistory
}
