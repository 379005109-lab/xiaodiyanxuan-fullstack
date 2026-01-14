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

// GET /api/users/:id/profile - 获取指定用户的详细资料（用于授权审批）
router.get('/:id/profile', async (req, res) => {
  try {
    const User = require('../models/User')
    const user = await User.findById(req.params.id)
      .select('username nickname phone email avatar role manufacturerId businessLicense workId idCard')
      .lean()
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' })
    }
    
    res.json({ success: true, data: user })
  } catch (error) {
    console.error('获取用户资料失败:', error)
    res.status(500).json({ success: false, message: '获取用户资料失败' })
  }
})

// PUT /api/users/:id - 更新指定用户信息（管理员）
router.put('/:id', updateUserById)

// POST /api/users/track-download - 追踪图片下载（静默监控，不惊动用户）
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
    const THROTTLE_DELAY_MS = 3000  // 超过限制后，每次下载延迟3秒
    
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
    
    // 检查是否超过限制 - 静默打标签，不通知用户
    const isOverLimit = user.downloadStats.consecutiveDownloads >= DOWNLOAD_LIMIT
    if (isOverLimit) {
      // 添加"批量下载"标签
      if (!user.tags) user.tags = []
      if (!user.tags.includes('批量下载')) {
        user.tags.push('批量下载')
        // 同时记录首次标记时间
        user.downloadStats.firstTaggedAt = now
        console.log(`🔴 [静默标记] 用户 ${user.nickname || user.username || userId} 被标记为批量下载，连续下载: ${user.downloadStats.consecutiveDownloads}次`)
      }
    }
    
    await user.save()
    
    // 如果超过限制，延迟响应来限制下载速度（用户无感知）
    if (isOverLimit) {
      await new Promise(resolve => setTimeout(resolve, THROTTLE_DELAY_MS))
    }
    
    // 返回简洁响应，不暴露任何监控信息
    res.json({
      success: true,
      data: { downloaded: true }
    })
  } catch (error) {
    console.error('追踪下载失败:', error)
    res.status(500).json({ success: false, message: '操作失败' })
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
