const express = require('express')
const router = express.Router()
const { auth, optionalAuth } = require('../middleware/auth')
const {
  recordBrowse,
  getMyBrowseHistory,
  getMyBrowsePath,
  getMyBrowseStats,
  getUserBrowseHistory,
  getUserBrowsePath,
  getUserBrowseStats,
  getAllBrowseHistory
} = require('../controllers/browseHistoryController')

// 记录浏览历史
router.post('/', optionalAuth, recordBrowse)

// 当前用户的浏览记录
router.get('/my', auth, getMyBrowseHistory)
router.get('/my/path', auth, getMyBrowsePath)
router.get('/my/stats', auth, getMyBrowseStats)

// 管理员：查看所有浏览历史
router.get('/all', auth, getAllBrowseHistory)

// 管理员：查看指定用户的浏览记录
router.get('/user/:userId', auth, getUserBrowseHistory)
router.get('/user/:userId/path', auth, getUserBrowsePath)
router.get('/user/:userId/stats', auth, getUserBrowseStats)

module.exports = router
