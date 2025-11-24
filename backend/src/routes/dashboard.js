const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { getDashboardData } = require('../controllers/dashboardController')

// 所有dashboard路由都需要认证
router.use(auth)

// GET /api/dashboard - 获取仪表板数据
router.get('/', getDashboardData)

module.exports = router
