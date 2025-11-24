const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { list, get, update, batchUpdate } = require('../controllers/siteConfigController')

// GET /api/site-config - 获取所有配置（公开）
router.get('/', list)

// GET /api/site-config/:key - 获取单个配置（公开）
router.get('/:key', get)

// PUT /api/site-config/:key - 更新单个配置（需要认证）
router.put('/:key', auth, update)

// POST /api/site-config/batch - 批量更新配置（需要认证）
router.post('/batch', auth, batchUpdate)

module.exports = router
