const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const Notification = require('../models/Notification')

// 获取通知列表
const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, type, read } = req.query
    const skip = (page - 1) * pageSize
    
    // 构建查询条件
    const query = { userId: req.userId }
    if (type) query.type = type
    if (read !== undefined) query.read = read === 'true'
    
    const total = await Notification.countDocuments(query)
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .lean()
    
    res.json(paginatedResponse(notifications, total, page, pageSize))
  } catch (err) {
    console.error('List notifications error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取未读通知数
const unreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.userId,
      read: false
    })
    
    res.json(successResponse({ unreadCount: count }))
  } catch (err) {
    console.error('Get unread count error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取通知统计
const stats = async (req, res) => {
  try {
    const total = await Notification.countDocuments({ userId: req.userId })
    const unread = await Notification.countDocuments({
      userId: req.userId,
      read: false
    })
    const read = total - unread
    
    // 按类型统计
    const byType = await Notification.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ])
    
    const typeStats = {}
    byType.forEach(item => {
      typeStats[item._id] = item.count
    })
    
    res.json(successResponse({
      total,
      unread,
      read,
      byType: typeStats
    }))
  } catch (err) {
    console.error('Get stats error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 创建通知（仅管理员）
const create = async (req, res) => {
  try {
    const { type, title, message, relatedId, actionUrl, data, link, icon, expiresAt } = req.body
    
    if (!title || !message) {
      return res.status(400).json(errorResponse('标题和内容不能为空', 400))
    }
    
    const notification = await Notification.create({
      userId: req.userId,
      type: type || 'system',
      title,
      message,
      relatedId,
      actionUrl,
      data,
      link,
      icon,
      expiresAt,
      read: false,
      status: 'unread'
    })
    
    res.status(201).json(successResponse(notification, '通知已创建'))
  } catch (err) {
    console.error('Create notification error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 标记单个通知为已读
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params
    const { read = true } = req.body
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: req.userId },
      {
        read,
        status: read ? 'read' : 'unread'
      },
      { new: true }
    )
    
    if (!notification) {
      return res.status(404).json(errorResponse('通知不存在', 404))
    }
    
    res.json(successResponse(notification, read ? '已标记为已读' : '已标记为未读'))
  } catch (err) {
    console.error('Mark as read error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 标记所有通知为已读
const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.userId, read: false },
      { read: true, status: 'read' }
    )
    
    res.json(successResponse({
      modifiedCount: result.modifiedCount
    }, '已标记全部为已读'))
  } catch (err) {
    console.error('Mark all as read error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 删除单个通知
const remove = async (req, res) => {
  try {
    const { id } = req.params
    
    const result = await Notification.deleteOne({
      _id: id,
      userId: req.userId
    })
    
    if (result.deletedCount === 0) {
      return res.status(404).json(errorResponse('通知不存在', 404))
    }
    
    res.json(successResponse(null, '已删除'))
  } catch (err) {
    console.error('Delete notification error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 清空所有通知
const clearAll = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.userId })
    
    res.json(successResponse({
      deletedCount: result.deletedCount
    }, '已清空'))
  } catch (err) {
    console.error('Clear all notifications error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  list,
  unreadCount,
  stats,
  create,
  markAsRead,
  markAllAsRead,
  remove,
  clearAll
}
