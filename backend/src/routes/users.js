const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const { getAllUsers, getProfile, updateProfile, updateUserById } = require('../controllers/userController')

// 所有用户路由都需要认证
router.use(auth)

// GET /api/users - 获取所有用户（管理员）
router.get('/', getAllUsers)

// GET /api/users/profile - 获取用户资料
router.get('/profile', getProfile)

// PUT /api/users/profile - 更新用户资料
router.put('/profile', updateProfile)

// PUT /api/users/:id - 更新指定用户信息（管理员）
router.put('/:id', updateUserById)

// POST /api/users/track-download - 追踪图片下载
router.post('/track-download', async (req, res) => {
  try {
    const User = require('../models/User')
    const userId = req.userId
    
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    const now = new Date()
    const CONSECUTIVE_WINDOW_MS = 5 * 60 * 1000  // 5分钟内算连续下载
    const DOWNLOAD_LIMIT = 10  // 连续下载超过10次则打标签
    
    // 初始化 downloadStats
    if (!user.downloadStats) {
      user.downloadStats = {
        totalDownloads: 0,
        consecutiveDownloads: 0
      }
    }
    
    // 检查是否在连续下载窗口内
    const lastDownload = user.downloadStats.lastDownloadAt
    const isConsecutive = lastDownload && (now - new Date(lastDownload)) < CONSECUTIVE_WINDOW_MS
    
    // 更新统计
    user.downloadStats.totalDownloads = (user.downloadStats.totalDownloads || 0) + 1
    user.downloadStats.lastDownloadAt = now
    
    if (isConsecutive) {
      user.downloadStats.consecutiveDownloads = (user.downloadStats.consecutiveDownloads || 0) + 1
    } else {
      // 重置连续下载计数
      user.downloadStats.consecutiveDownloads = 1
      user.downloadStats.lastConsecutiveReset = now
    }
    
    // 检查是否超过限制
    let tagAdded = false
    if (user.downloadStats.consecutiveDownloads >= DOWNLOAD_LIMIT) {
      // 添加"批量下载"标签
      if (!user.tags) user.tags = []
      if (!user.tags.includes('批量下载')) {
        user.tags.push('批量下载')
        tagAdded = true
        console.log(`⚠️ 用户 ${userId} 被标记为批量下载，连续下载次数: ${user.downloadStats.consecutiveDownloads}`)
      }
    }
    
    await user.save()
    
    res.json({
      success: true,
      data: {
        totalDownloads: user.downloadStats.totalDownloads,
        consecutiveDownloads: user.downloadStats.consecutiveDownloads,
        tagAdded,
        warning: user.downloadStats.consecutiveDownloads >= DOWNLOAD_LIMIT - 2 
          ? `您已连续下载 ${user.downloadStats.consecutiveDownloads} 张图片，接近限制` 
          : null
      }
    })
  } catch (error) {
    console.error('追踪下载失败:', error)
    res.status(500).json({ success: false, message: '追踪下载失败' })
  }
})

// GET /api/users/:id/tags - 获取用户标签
router.get('/:id/tags', async (req, res) => {
  try {
    const User = require('../models/User')
    const user = await User.findById(req.params.id).select('tags downloadStats')
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    res.json({ success: true, data: { tags: user.tags || [], downloadStats: user.downloadStats } })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户标签失败' })
  }
})

// POST /api/users/:id/tags - 添加用户标签（管理员）
router.post('/:id/tags', async (req, res) => {
  try {
    const User = require('../models/User')
    const { tag } = req.body
    
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    if (!user.tags) user.tags = []
    if (!user.tags.includes(tag)) {
      user.tags.push(tag)
      await user.save()
    }
    
    res.json({ success: true, data: { tags: user.tags } })
  } catch (error) {
    res.status(500).json({ success: false, message: '添加标签失败' })
  }
})

// DELETE /api/users/:id/tags/:tag - 移除用户标签（管理员）
router.delete('/:id/tags/:tag', async (req, res) => {
  try {
    const User = require('../models/User')
    const { id, tag } = req.params
    
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    if (user.tags) {
      user.tags = user.tags.filter(t => t !== tag)
      await user.save()
    }
    
    res.json({ success: true, data: { tags: user.tags || [] } })
  } catch (error) {
    res.status(500).json({ success: false, message: '移除标签失败' })
  }
})

module.exports = router
