const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const tierSystemController = require('../controllers/tierSystemController')

router.use(auth)

router.get('/effective', tierSystemController.getEffectiveTierRule)
router.get('/', tierSystemController.getTierSystem)
router.put('/', tierSystemController.upsertTierSystem)

module.exports = router
