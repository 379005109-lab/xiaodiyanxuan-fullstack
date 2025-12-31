const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const commissionRuleController = require('../controllers/commissionRuleController')

// 需要认证
router.use(auth)

// GET /api/commission-rules - 获取所有分成规则
router.get('/', commissionRuleController.list)

// GET /api/commission-rules/manufacturer/:manufacturerId - 获取单个厂家的分成规则
router.get('/manufacturer/:manufacturerId', commissionRuleController.getByManufacturer)

// POST /api/commission-rules/manufacturer/:manufacturerId - 保存厂家分成规则
router.post('/manufacturer/:manufacturerId', commissionRuleController.save)

// POST /api/commission-rules/manufacturer/:manufacturerId/channels - 添加渠道
router.post('/manufacturer/:manufacturerId/channels', commissionRuleController.addChannel)

// PUT /api/commission-rules/manufacturer/:manufacturerId/channels/:channelId - 更新渠道
router.put('/manufacturer/:manufacturerId/channels/:channelId', commissionRuleController.updateChannel)

// DELETE /api/commission-rules/manufacturer/:manufacturerId/channels/:channelId - 删除渠道
router.delete('/manufacturer/:manufacturerId/channels/:channelId', commissionRuleController.deleteChannel)

// POST /api/commission-rules/manufacturer/:manufacturerId/channels/:channelId/sub-rules - 添加子规则
router.post('/manufacturer/:manufacturerId/channels/:channelId/sub-rules', commissionRuleController.addSubRule)

// DELETE /api/commission-rules/manufacturer/:manufacturerId - 删除分成规则
router.delete('/manufacturer/:manufacturerId', commissionRuleController.delete)

module.exports = router
