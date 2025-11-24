const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { list, add, remove, check } = require('../controllers/favoriteController')

// 所有收藏路由都需要认证
router.use(auth)

// GET /api/favorites - 获取收藏列表
router.get('/', list)

// GET /api/favorites/check/:productId - 检查商品是否已收藏
router.get('/check/:productId', check)

// POST /api/favorites - 添加收藏
router.post('/', add)

// DELETE /api/favorites/:id - 删除收藏
router.delete('/:id', remove)

module.exports = router
