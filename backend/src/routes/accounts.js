const express = require('express')
const router = express.Router()
const { auth, requireRole } = require('../middleware/auth')
const { USER_ROLES } = require('../config/constants')
const accountController = require('../controllers/accountController')

// 所有路由需要认证
router.use(auth)

// ==================== 组织管理（仅超级管理员）====================
router.get('/organizations', requireRole([USER_ROLES.SUPER_ADMIN]), accountController.getOrganizations)
router.post('/organizations', requireRole([USER_ROLES.SUPER_ADMIN]), accountController.createOrganization)
router.put('/organizations/:id', requireRole([USER_ROLES.SUPER_ADMIN]), accountController.updateOrganization)
router.delete('/organizations/:id', requireRole([USER_ROLES.SUPER_ADMIN]), accountController.deleteOrganization)
router.put('/organizations/:id/discount', requireRole([USER_ROLES.SUPER_ADMIN]), accountController.setOrganizationDiscount)

// ==================== 用户管理 ====================
// 超级管理员可以管理所有用户
// 平台/企业管理员可以管理自己组织的用户
router.get('/users', requireRole([
  USER_ROLES.SUPER_ADMIN, 
  USER_ROLES.PLATFORM_ADMIN, 
  USER_ROLES.ENTERPRISE_ADMIN
]), accountController.getUsers)

router.post('/users', requireRole([
  USER_ROLES.SUPER_ADMIN, 
  USER_ROLES.PLATFORM_ADMIN, 
  USER_ROLES.ENTERPRISE_ADMIN
]), accountController.createUser)

router.put('/users/:id', requireRole([
  USER_ROLES.SUPER_ADMIN, 
  USER_ROLES.PLATFORM_ADMIN, 
  USER_ROLES.ENTERPRISE_ADMIN
]), accountController.updateUser)

router.post('/users/:id/reset-password', requireRole([
  USER_ROLES.SUPER_ADMIN, 
  USER_ROLES.PLATFORM_ADMIN, 
  USER_ROLES.ENTERPRISE_ADMIN
]), accountController.resetUserPassword)

router.delete('/users/:id', requireRole([
  USER_ROLES.SUPER_ADMIN, 
  USER_ROLES.PLATFORM_ADMIN, 
  USER_ROLES.ENTERPRISE_ADMIN
]), accountController.deleteUser)

// ==================== 特殊账号管理（仅超级管理员）====================
router.get('/special-accounts', requireRole([USER_ROLES.SUPER_ADMIN]), accountController.getSpecialAccounts)
router.post('/special-accounts', requireRole([USER_ROLES.SUPER_ADMIN]), accountController.createSpecialAccount)
router.post('/special-accounts/:id/invalidate', requireRole([USER_ROLES.SUPER_ADMIN]), accountController.invalidateSpecialAccount)

// ==================== 统计 ====================
router.get('/stats', requireRole([USER_ROLES.SUPER_ADMIN]), accountController.getRoleStats)

module.exports = router
