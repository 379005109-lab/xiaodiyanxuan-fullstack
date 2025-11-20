const express = require('express')
const router = express.Router()
const { optionalAuth } = require('../middleware/auth')
const { getHomeData } = require('../controllers/homeController')

// GET /api/home - 获取首页数据
router.get('/', optionalAuth, getHomeData)

module.exports = router
