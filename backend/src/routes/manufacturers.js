const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { list, listAll, get, create, update, remove } = require('../controllers/manufacturerController')

// 需要认证
router.use(auth)

// GET /api/manufacturers - 获取厂家列表（分页）
router.get('/', list)

// GET /api/manufacturers/all - 获取所有厂家（不分页，用于下拉选择）
router.get('/all', listAll)

// GET /api/manufacturers/:id - 获取单个厂家
router.get('/:id', get)

// POST /api/manufacturers - 创建厂家
router.post('/', create)

// PUT /api/manufacturers/:id - 更新厂家
router.put('/:id', update)

// DELETE /api/manufacturers/:id - 删除厂家
router.delete('/:id', remove)

module.exports = router
