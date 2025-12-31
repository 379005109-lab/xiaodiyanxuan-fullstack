const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const commissionSystemController = require('../controllers/commissionSystemController')

// 需要认证
router.use(auth)

// GET /api/commission-system - 获取所有分成体系列表
router.get('/', commissionSystemController.listSystems)

// GET /api/commission-system/manufacturer/:manufacturerId - 获取厂家的分成体系
router.get('/manufacturer/:manufacturerId', commissionSystemController.getByManufacturer)

// POST /api/commission-system/manufacturer/:manufacturerId - 创建分成体系
router.post('/manufacturer/:manufacturerId', commissionSystemController.createSystem)

// PUT /api/commission-system/manufacturer/:manufacturerId - 更新分成体系
router.put('/manufacturer/:manufacturerId', commissionSystemController.updateSystem)

// POST /api/commission-system/manufacturer/:manufacturerId/channels - 创建渠道
router.post('/manufacturer/:manufacturerId/channels', commissionSystemController.createChannel)

// GET /api/commission-system/channels/:channelId - 获取渠道详情
router.get('/channels/:channelId', commissionSystemController.getChannelDetail)

// PUT /api/commission-system/channels/:channelId - 更新渠道
router.put('/channels/:channelId', commissionSystemController.updateChannel)

// DELETE /api/commission-system/channels/:channelId - 删除渠道
router.delete('/channels/:channelId', commissionSystemController.deleteChannel)

module.exports = router
