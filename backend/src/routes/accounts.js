const express = require('express')
const router = express.Router()
const { auth, requireRole } = require('../middleware/auth')
const { USER_ROLES } = require('../config/constants')
const accountController = require('../controllers/accountController')

// 管理员角色列表（包含旧的 admin 角色）
const ADMIN_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.PLATFORM_ADMIN,
  USER_ROLES.ENTERPRISE_ADMIN,
  USER_ROLES.PLATFORM_STAFF,
  'admin',        // 兼容旧的管理员角色
  'super_admin',
  'platform_admin',
  'enterprise_admin',
  'platform_staff'
]

// 仅平台/超级管理员可访问
const PLATFORM_ONLY_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.PLATFORM_ADMIN,
  'admin',
  'super_admin'
]

// 所有路由需要认证
router.use(auth)

// ==================== 用户看板统计 ====================
router.get('/dashboard', requireRole(ADMIN_ROLES), accountController.getDashboard)

// ==================== 组织管理 ====================
router.get('/organizations', requireRole(PLATFORM_ONLY_ROLES), accountController.getOrganizations)
router.post('/organizations', requireRole(PLATFORM_ONLY_ROLES), accountController.createOrganization)
router.put('/organizations/:id', requireRole(PLATFORM_ONLY_ROLES), accountController.updateOrganization)
router.delete('/organizations/:id', requireRole(PLATFORM_ONLY_ROLES), accountController.deleteOrganization)
router.put('/organizations/:id/discount', requireRole(PLATFORM_ONLY_ROLES), accountController.setOrganizationDiscount)

// ==================== 用户管理（包含所有用户类型）====================
router.get('/users', requireRole(ADMIN_ROLES), accountController.getUsers)
router.post('/users', requireRole(ADMIN_ROLES), accountController.createUser)
router.put('/users/:id', requireRole(ADMIN_ROLES), accountController.updateUser)
router.post('/users/:id/reset-password', requireRole(ADMIN_ROLES), accountController.resetUserPassword)
router.delete('/users/:id', requireRole(ADMIN_ROLES), accountController.deleteUser)

// ==================== 特殊账号管理 ====================
router.get('/special-accounts', requireRole(ADMIN_ROLES), accountController.getSpecialAccounts)
router.post('/special-accounts', requireRole(ADMIN_ROLES), accountController.createSpecialAccount)
router.post('/special-accounts/:id/invalidate', requireRole(ADMIN_ROLES), accountController.invalidateSpecialAccount)

// ==================== 统计 ====================
router.get('/stats', requireRole(ADMIN_ROLES), accountController.getRoleStats)

module.exports = router
