const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { list, create, update, remove } = require('../controllers/addressController')

// 所有地址路由都需要认证
router.use(auth)

// GET /api/addresses - 获取地址列表
router.get('/', list)

// POST /api/addresses - 创建地址
router.post('/', create)

// PUT /api/addresses/:id - 更新地址
router.put('/:id', update)

// DELETE /api/addresses/:id - 删除地址
router.delete('/:id', remove)

module.exports = router
