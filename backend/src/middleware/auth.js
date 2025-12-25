const jwt = require('jsonwebtoken')
const { errorResponse } = require('../utils/response')
const User = require('../models/User')
const Manufacturer = require('../models/Manufacturer')

const isManufacturerExpiredForUser = async (user) => {
  if (!user) return false
  if (user.role === 'super_admin' || user.role === 'admin' || user.role === 'platform_admin') return false

  const mids = []
  if (user.manufacturerId) mids.push(String(user.manufacturerId))
  if (Array.isArray(user.manufacturerIds) && user.manufacturerIds.length) {
    for (const id of user.manufacturerIds) {
      const s = String(id)
      if (s && !mids.includes(s)) mids.push(s)
    }
  }

  if (!mids.length) return false

  const manufacturers = await Manufacturer.find({ _id: { $in: mids } }).select('status expiryDate').lean()
  const now = new Date()
  return (manufacturers || []).some(m => m?.status === 'active' && m?.expiryDate && now > new Date(m.expiryDate))
}

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    
    if (!token) {
      return res.status(401).json(errorResponse('No token provided', 401))
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.userId
    
    // 加载完整的用户信息
    const user = await User.findById(decoded.userId).select('-password')
    if (!user) {
      return res.status(401).json(errorResponse('User not found', 401))
    }
    
    // 检查用户状态
    if (user.status === 'banned') {
      return res.status(403).json(errorResponse('账号已被禁用', 403))
    }
    if (user.status === 'expired') {
      return res.status(403).json(errorResponse('账号已过期', 403))
    }

    if (await isManufacturerExpiredForUser(user)) {
      return res.status(403).json(errorResponse('厂家效期已到期', 403))
    }
    
    // 检查特殊账号是否过期
    if (user.role === 'special_guest') {
      if (user.specialAccountConfig?.expiresAt && new Date() > user.specialAccountConfig.expiresAt) {
        user.status = 'expired'
        await user.save()
        return res.status(403).json(errorResponse('访问码已过期', 403))
      }
      if (user.specialAccountConfig?.maxUsage && 
          user.specialAccountConfig.usedCount >= user.specialAccountConfig.maxUsage) {
        return res.status(403).json(errorResponse('访问码使用次数已达上限', 403))
      }
    }
    
    req.user = user
    req.userRole = user.role || user.userType || 'customer'
    next()
  } catch (err) {
    return res.status(401).json(errorResponse('Invalid token', 401))
  }
}

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = decoded.userId
      
      const user = await User.findById(decoded.userId).select('-password')
      if (user && user.status === 'active') {
        if (!(await isManufacturerExpiredForUser(user))) {
          req.user = user
        }
      }
    }
    next()
  } catch (err) {
    next()
  }
}

/**
 * 角色权限中间件
 * @param {Array} allowedRoles - 允许的角色列表
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('请先登录', 401))
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(errorResponse('无权限执行此操作', 403))
    }
    
    next()
  }
}

/**
 * 权限检查中间件
 * @param {String} permission - 权限名称
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(errorResponse('请先登录', 401))
    }
    
    // 超级管理员拥有所有权限
    if (req.user.role === 'super_admin') {
      return next()
    }
    
    if (!req.user.permissions?.[permission]) {
      return res.status(403).json(errorResponse('无权限执行此操作', 403))
    }
    
    next()
  }
}

module.exports = { auth, optionalAuth, requireRole, requirePermission }
