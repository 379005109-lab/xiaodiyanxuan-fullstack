const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const channelPartnerController = require('../controllers/channelPartnerController')

// 需要认证
router.use(auth)

// GET /api/channel-partners - 获取渠道商列表
router.get('/', channelPartnerController.list)

// GET /api/channel-partners/:id - 获取单个渠道商详情
router.get('/:id', channelPartnerController.getById)

// POST /api/channel-partners - 创建渠道商
router.post('/', channelPartnerController.create)

// PUT /api/channel-partners/:id - 更新渠道商
router.put('/:id', channelPartnerController.update)

// DELETE /api/channel-partners/:id - 删除渠道商
router.delete('/:id', channelPartnerController.delete)

// PUT /api/channel-partners/:id/status - 更新合作状态
router.put('/:id/status', channelPartnerController.updateStatus)

// POST /api/channel-partners/batch-import - 批量导入
router.post('/batch-import', channelPartnerController.batchImport)

module.exports = router
