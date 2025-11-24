const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { getAllUsers, getProfile, updateProfile, updateUserById } = require('../controllers/userController')

// 所有用户路由都需要认证
router.use(auth)

// GET /api/users - 获取所有用户（管理员）
router.get('/', getAllUsers)

// GET /api/users/profile - 获取用户资料
router.get('/profile', getProfile)

// PUT /api/users/profile - 更新用户资料
router.put('/profile', updateProfile)

// PUT /api/users/:id - 更新指定用户信息（管理员）
router.put('/:id', updateUserById)

module.exports = router
