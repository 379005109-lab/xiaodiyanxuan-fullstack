const { errorResponse } = require('../utils/response')
const { USER_ROLES } = require('../config/constants')

/**
 * 数据隔离中间件
 * 根据用户角色设置数据过滤条件
 * 平台/企业账号只能访问自己组织的数据
 */
const dataIsolation = (req, res, next) => {
  const user = req.user
  
  if (!user) {
    req.dataFilter = {}
    return next()
  }
  
  switch (user.role) {
    // 超级管理员可以看全部数据
    case USER_ROLES.SUPER_ADMIN:
      req.dataFilter = {}
      req.canViewAllData = true
      break
    
    // 设计师和特殊账号可以看全部商品（你的商品库）
    case USER_ROLES.DESIGNER:
    case USER_ROLES.SPECIAL_GUEST:
      req.dataFilter = { organizationId: { $exists: false } }  // 只看公共数据
      req.canViewAllData = false
      break
    
    // 平台/企业账号只能看自己组织的数据
    case USER_ROLES.PLATFORM_ADMIN:
    case USER_ROLES.PLATFORM_STAFF:
    case USER_ROLES.ENTERPRISE_ADMIN:
    case USER_ROLES.ENTERPRISE_STAFF:
      if (user.organizationId) {
        req.dataFilter = { organizationId: user.organizationId }
        req.canViewAllData = false
      } else {
        // 没有组织归属的异常情况
        req.dataFilter = { organizationId: 'invalid' }
        req.canViewAllData = false
      }
      break
    
    // 普通客户看公开的商品
    default:
      req.dataFilter = { organizationId: { $exists: false } }
      req.canViewAllData = false
      break
  }
  
  next()
}

/**
 * 检查数据所有权中间件
 * 用于单个数据项的增删改操作
 */
const checkDataOwnership = (modelField = 'organizationId') => {
  return (req, res, next) => {
    const user = req.user
    
    // 超级管理员可以操作所有数据
    if (user?.role === USER_ROLES.SUPER_ADMIN) {
      return next()
    }
    
    // 将组织ID存入请求，供控制器使用
    req.requiredOrganizationId = user?.organizationId || null
    next()
  }
}

/**
 * 强制数据归属中间件
 * 创建数据时自动设置organizationId
 */
const enforceDataOwnership = (req, res, next) => {
  const user = req.user
  
  if (!user) {
    return next()
  }
  
  // 超级管理员创建的数据归属于公共（无organizationId）
  if (user.role === USER_ROLES.SUPER_ADMIN) {
    // 除非明确指定organizationId
    if (!req.body.organizationId) {
      req.body.organizationId = null
    }
    return next()
  }
  
  // 平台/企业用户创建的数据归属于其组织
  if (user.organizationId) {
    req.body.organizationId = user.organizationId
  }
  
  next()
}

module.exports = {
  dataIsolation,
  checkDataOwnership,
  enforceDataOwnership,
}
