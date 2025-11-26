const express = require('express')
const router = express.Router()
const { auth } = require('../middleware/auth')
const BuyingServiceRequest = require('../models/BuyingServiceRequest')

// 创建陪买服务预约
router.post('/', auth, async (req, res) => {
  try {
    const { serviceType, scheduledDate, notes, user, userName, userPhone } = req.body

    // 验证必填字段
    if (!serviceType || !scheduledDate) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段'
      })
    }

    // 创建预约记录
    const request = new BuyingServiceRequest({
      user: user || req.user._id,
      userName: userName || req.user.username || '未知用户',
      userPhone: userPhone || req.user.phone || '',
      serviceType,
      scheduledDate: new Date(scheduledDate),
      notes: notes || '',
      status: 'pending'
    })

    await request.save()

    console.log('✅ 陪买服务预约创建成功:', request._id)

    res.status(201).json({
      success: true,
      message: '预约成功',
      data: request
    })
  } catch (error) {
    console.error('❌ 创建陪买服务预约失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
})

// 获取所有陪买服务预约（管理员）
router.get('/', auth, async (req, res) => {
  try {
    const { status, sortBy = 'createdAt', order = 'desc' } = req.query

    const filter = {}
    if (status) {
      filter.status = status
    }

    const sortOrder = order === 'asc' ? 1 : -1
    const sortOptions = { [sortBy]: sortOrder }

    const requests = await BuyingServiceRequest.find(filter)
      .populate('user', 'username email phone')
      .sort(sortOptions)

    res.json({
      success: true,
      data: requests
    })
  } catch (error) {
    console.error('❌ 获取陪买服务预约列表失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
})

// 更新陪买服务预约状态（管理员）
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的状态值'
      })
    }

    const request = await BuyingServiceRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '预约记录不存在'
      })
    }

    res.json({
      success: true,
      message: '状态更新成功',
      data: request
    })
  } catch (error) {
    console.error('❌ 更新陪买服务预约状态失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
})

// 删除陪买服务预约（管理员）
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    const request = await BuyingServiceRequest.findByIdAndDelete(id)

    if (!request) {
      return res.status(404).json({
        success: false,
        message: '预约记录不存在'
      })
    }

    res.json({
      success: true,
      message: '删除成功'
    })
  } catch (error) {
    console.error('❌ 删除陪买服务预约失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
})

module.exports = router
