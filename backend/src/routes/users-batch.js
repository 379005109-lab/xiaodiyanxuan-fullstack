const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const User = require('../models/User')

router.post('/batch-update', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId)
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') {
      return res.status(403).json({ success: false, message: '只有管理员可以批量修改账号' })
    }

    const { userIds, updates } = req.body
    
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: 'userIds 必须是非空数组' })
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'updates 必须是对象' })
    }

    const updateData = {}
    if (updates.role) updateData.role = updates.role
    if (updates.permissions) {
      updateData.permissions = updates.permissions
    }
    if (updates.status) updateData.status = updates.status

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: '没有要更新的字段' })
    }

    updateData.updatedAt = new Date()

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: updateData }
    )

    res.json({
      success: true,
      message: `成功更新 ${result.modifiedCount} 个账号`,
      data: { modifiedCount: result.modifiedCount }
    })
  } catch (error) {
    console.error('批量更新账号失败:', error)
    res.status(500).json({ success: false, message: '批量更新失败' })
  }
})

module.exports = router
