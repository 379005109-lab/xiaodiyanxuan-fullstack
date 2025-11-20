const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const {
  list,
  unreadCount,
  stats,
  create,
  markAsRead,
  markAllAsRead,
  remove,
  clearAll
} = require('../controllers/notificationController')

// 所有通知路由都需要认证
router.use(auth)

// 特定路由必须在参数路由之前定义
// GET /api/notifications/unread/count - 获取未读通知数
router.get('/unread/count', unreadCount)

// GET /api/notifications/stats - 获取统计
router.get('/stats', stats)

// PATCH /api/notifications/mark-all-read - 标记全部为已读
router.patch('/mark-all-read', markAllAsRead)

// DELETE /api/notifications/clear-all - 清空所有通知
router.delete('/clear-all', clearAll)

// 通用路由
// GET /api/notifications - 获取通知列表
router.get('/', list)

// POST /api/notifications - 创建通知
router.post('/', create)

// PATCH /api/notifications/:id/read - 标记为已读
router.patch('/:id/read', markAsRead)

// DELETE /api/notifications/:id - 删除通知
router.delete('/:id', remove)

module.exports = router
