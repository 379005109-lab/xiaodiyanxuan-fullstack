const jwt = require('jsonwebtoken')
const axios = require('axios')
const { errorResponse } = require('../utils/response')
const User = require('../models/User')
const Manufacturer = require('../models/Manufacturer')

// Java 后台地址
const JAVA_API_BASE = process.env.JAVA_API_BASE || 'http://10.1.32.21:30001'

/**
 * 调用 Java 后台验证 token 并获取用户信息
 * @param {string} token - Java 后台生成的 access_token
 * @returns {object|null} - 用户信息或 null
 */
const verifyJavaToken = async (token) => {
  try {
    const response = await axios.get(`${JAVA_API_BASE}/baseapi/accuser/currentUser`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      },
      timeout: 10000
    })
    // Java 后台返回格式: { code: 0, data: { userInfo, menuList, permissionList } }
    if (response.data?.code === 0 && response.data?.data?.userInfo) {
      return response.data.data.userInfo
    }
    return null
  } catch (error) {
    console.log('[auth] Java token 验证失败:', error.message)
    return null
  }
}

/**
 * 根据 Java 用户信息查找或创建 Node.js 用户
 * Java 用户字段（从 Vue 项目 org-structure 页面提取）：
 * - id: 用户ID
 * - userName: 姓名
 * - empNo: 员工编号
 * - phone: 手机号（登录账号）
 * - organizeId/deptId: 部门ID
 * - organizeName: 部门名称
 * - positionId: 职位ID
 * - positionName: 职位名称
 * - status: 在职状态 ('0'=离职, '1'=在职)
 * - enabled: 启用状态 ('0'=禁用, '1'=启用)
 * - systemFlag: 系统标识 ('0'=普通, '1'=系统)
 * - roleType: 角色类型 (0=超管, 1=管理员, 2=普通)
 * - tenantId: 租户ID
 * @param {object} javaUser - Java 后台返回的用户信息
 * @returns {object} - Node.js User 文档
 */
const findOrCreateUserFromJava = async (javaUser) => {
  // 优先通过 javaUserId 查找
  let user = await User.findOne({ javaUserId: javaUser.id }).select('-password')
  
  // 如果没找到，尝试通过手机号或用户名查找
  if (!user) {
    user = await User.findOne({
      $or: [
        { phone: javaUser.phone },
        { username: javaUser.userName || javaUser.username }
      ]
    }).select('-password')
  }
  
  if (user) {
    // 同步 Java 后台的用户信息
    user.javaUserId = javaUser.id
    user.javaUserName = javaUser.userName
    user.javaEmpNo = javaUser.empNo
    user.javaTenantId = javaUser.tenantId
    user.javaOrganizeId = javaUser.organizeId || javaUser.deptId
    user.javaOrganizeName = javaUser.organizeName
    user.javaPositionId = javaUser.positionId
    user.javaPositionName = javaUser.positionName
    user.javaRoleType = javaUser.roleType
    user.javaSystemFlag = javaUser.systemFlag || '0'
    user.javaStatus = javaUser.status || '1'
    user.javaEnabled = javaUser.enabled || '1'
    user.role = mapJavaRoleToNodeRole(javaUser)
    user.lastSyncAt = new Date()
    user.lastLoginAt = new Date()
    
    // 同步基础信息
    if (javaUser.userName && !user.nickname) {
      user.nickname = javaUser.userName
    }
    if (javaUser.phone && !user.phone) {
      user.phone = javaUser.phone
    }
    
    await user.save()
    return user
  }
  
  // 创建新用户
  user = new User({
    username: javaUser.userName || javaUser.username || javaUser.phone,
    nickname: javaUser.userName,
    phone: javaUser.phone,
    email: javaUser.email,
    role: mapJavaRoleToNodeRole(javaUser),
    status: 'active',
    // Java 后台关联字段
    javaUserId: javaUser.id,
    javaUserName: javaUser.userName,
    javaEmpNo: javaUser.empNo,
    javaTenantId: javaUser.tenantId,
    javaOrganizeId: javaUser.organizeId || javaUser.deptId,
    javaOrganizeName: javaUser.organizeName,
    javaPositionId: javaUser.positionId,
    javaPositionName: javaUser.positionName,
    javaRoleType: javaUser.roleType,
    javaSystemFlag: javaUser.systemFlag || '0',
    javaStatus: javaUser.status || '1',
    javaEnabled: javaUser.enabled || '1',
    lastSyncAt: new Date(),
    createdAt: new Date(),
    lastLoginAt: new Date()
  })
  
  await user.save()
  console.log('[auth] 创建新用户:', user.username, '关联 Java 用户:', javaUser.id)
  return user
}

/**
 * 将 Java 后台的角色映射到 Node.js 的角色
 * Java 角色字段（从 Vue 项目 permission 页面提取）：
 * - roleType: 0=超级管理员, 1=管理员, 2=普通用户
 * - systemFlag: '1'=系统用户（不可删除）
 * - positionName: 职位名称（可用于判断设计师等角色）
 * @param {object} javaUser - Java 用户信息
 * @returns {string} - Node.js 角色
 */
const mapJavaRoleToNodeRole = (javaUser) => {
  // 系统管理员（systemFlag='1' 表示系统内置用户）
  if (javaUser.systemFlag === '1') {
    return 'super_admin'
  }
  
  // 根据 roleType 映射
  switch (javaUser.roleType) {
    case 0:
      return 'super_admin'
    case 1:
      return 'platform_admin'
    default:
      // 根据职位名称进一步判断
      const positionName = javaUser.positionName || ''
      if (positionName.includes('设计') || positionName.includes('Designer')) {
        return 'designer'
      }
      if (positionName.includes('管理') || positionName.includes('Admin')) {
        return 'platform_staff'
      }
      return 'customer'
  }
}

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
    
    let user = null
    let isJavaToken = false
    
    // 先尝试用 Node.js JWT 验证
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = decoded.userId
      
      // 加载完整的用户信息
      user = await User.findById(decoded.userId).select('-password')
    } catch (jwtError) {
      // JWT 验证失败，尝试用 Java 后台验证
      console.log('[auth] Node.js JWT 验证失败，尝试 Java 后台验证...')
      const javaUser = await verifyJavaToken(token)
      if (javaUser) {
        console.log('[auth] Java token 验证成功，用户:', javaUser.userName || javaUser.phone)
        user = await findOrCreateUserFromJava(javaUser)
        isJavaToken = true
      }
    }
    
    if (!user) {
      return res.status(401).json(errorResponse('User not found or invalid token', 401))
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
    req.userId = user._id
    req.userRole = user.role || user.userType || 'customer'
    req.isJavaToken = isJavaToken
    next()
  } catch (err) {
    console.error('[auth] 认证错误:', err.message)
    return res.status(401).json(errorResponse('Invalid token', 401))
  }
}

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) {
      let user = null
      
      // 先尝试用 Node.js JWT 验证
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        req.userId = decoded.userId
        user = await User.findById(decoded.userId).select('-password')
      } catch (jwtError) {
        // JWT 验证失败，尝试用 Java 后台验证
        const javaUser = await verifyJavaToken(token)
        if (javaUser) {
          user = await findOrCreateUserFromJava(javaUser)
        }
      }
      
      if (user && user.status === 'active') {
        if (!(await isManufacturerExpiredForUser(user))) {
          req.user = user
          req.userId = user._id
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
