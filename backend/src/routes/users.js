const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { getProfile, updateProfile } = require('../controllers/userController')

// 所有用户路由都需要认证
router.use(auth)

// GET /api/users/profile - 获取用户资料
router.get('/profile', getProfile)

// PUT /api/users/profile - 更新用户资料
router.put('/profile', updateProfile)

module.exports = router
