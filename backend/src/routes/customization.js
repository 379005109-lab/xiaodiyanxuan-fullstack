const express = require('express')
const router = express.Router()
const { create, list, getOne, update, remove } = require('../controllers/customizationController')
const auth = require('../middleware/auth')
const adminAuth = require('../middleware/adminAuth')

// POST /api/customization - 创建定制需求（任何人都可以）
router.post('/', create)

// GET /api/customization - 获取所有定制需求（管理员）
router.get('/', auth, adminAuth, list)

// GET /api/customization/:id - 获取单个定制需求（管理员）
router.get('/:id', auth, adminAuth, getOne)

// PUT /api/customization/:id - 更新定制需求（管理员）
router.put('/:id', auth, adminAuth, update)

// DELETE /api/customization/:id - 删除定制需求（管理员）
router.delete('/:id', auth, adminAuth, remove)

module.exports = router
