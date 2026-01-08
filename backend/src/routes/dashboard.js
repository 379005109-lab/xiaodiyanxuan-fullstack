const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { getDashboardData, getUserActivityDashboard, getUserLoginDetails } = require('../controllers/dashboardController')

// 所有dashboard路由都需要认证
router.use(auth)

// GET /api/dashboard - 获取仪表板数据
router.get('/', getDashboardData)

// GET /api/dashboard/activity - 获取用户活跃度看板
router.get('/activity', getUserActivityDashboard)

// GET /api/dashboard/user-logins - 获取用户登录详情
router.get('/user-logins', getUserLoginDetails)

module.exports = router
