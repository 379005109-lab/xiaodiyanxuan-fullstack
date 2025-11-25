const express = require('express');
const router = express.Router();
const conciergeController = require('../controllers/conciergeController');
const { auth } = require('../middleware/auth');

/**
 * 创建代客下单临时会话
 * POST /api/concierge/session
 * 需要认证（管理员）
 */
router.post('/session', auth, conciergeController.createSession);

/**
 * 获取代客下单临时会话
 * GET /api/concierge/session/:token
 * 无需认证（前台购物车访问）
 */
router.get('/session/:token', conciergeController.getSession);

module.exports = router;
