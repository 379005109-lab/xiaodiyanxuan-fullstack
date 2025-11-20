const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { list, stats, add, remove, clear } = require('../controllers/compareController')

// 所有对比路由都需要认证
router.use(auth)

// 特定路由必须在参数路由之前定义
// GET /api/compare/stats - 获取统计
router.get('/stats', stats)

// DELETE /api/compare - 清空对比列表
router.delete('/', clear)

// 通用路由
// GET /api/compare - 获取对比列表
router.get('/', list)

// POST /api/compare - 添加到对比
router.post('/', add)

// DELETE /api/compare/:productId - 移除对比
router.delete('/:productId', remove)

module.exports = router
