const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['order', 'system', 'message'],
    default: 'system'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  relatedId: String,
  actionUrl: String,
  data: mongoose.Schema.Types.Mixed,
  link: String,
  icon: String,
  expiresAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// 索引优化查询
notificationSchema.index({ userId: 1, createdAt: -1 })
notificationSchema.index({ userId: 1, read: 1 })
notificationSchema.index({ userId: 1, type: 1 })

// TTL 索引：自动删除过期通知（可选）
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true })

module.exports = mongoose.model('Notification', notificationSchema)
