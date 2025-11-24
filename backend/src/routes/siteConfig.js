const express = require('express')
const router = express.Router()
const { auth, adminOnly } = require('../middleware/auth')
const { list, get, update, batchUpdate } = require('../controllers/siteConfigController')

// GET /api/site-config - 获取所有配置（公开）
router.get('/', list)

// GET /api/site-config/:key - 获取单个配置（公开）
router.get('/:key', get)

// PUT /api/site-config/:key - 更新单个配置（需要管理员权限）
router.put('/:key', auth, adminOnly, update)

// POST /api/site-config/batch - 批量更新配置（需要管理员权限）
router.post('/batch', auth, adminOnly, batchUpdate)

module.exports = router
