const express = require('express');
const {
  getAllRequests,
  getRequestById,
  createRequest,
  updateStatus,
  updateNotes,
  assignDesigner,
  deleteRequest,
  getStats
} = require('../controllers/designRequestController');
const { auth: authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 公开接口
router.post('/', createRequest);

// 需要认证和 admin 权限的接口
// 获取统计信息 (需要在获取列表之前，避免路由冲突)
router.get('/stats/summary', authMiddleware, getStats);

// 获取列表
router.get('/', authMiddleware, getAllRequests);

// 获取详情
router.get('/:id', authMiddleware, getRequestById);

// 更新状态
router.put('/:id/status', authMiddleware, updateStatus);

// 更新备注
router.put('/:id/notes', authMiddleware, updateNotes);

// 分配设计师
router.put('/:id/assign', authMiddleware, assignDesigner);

// 删除
router.delete('/:id', authMiddleware, deleteRequest);

module.exports = router;
