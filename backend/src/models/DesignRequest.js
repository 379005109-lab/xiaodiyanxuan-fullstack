const mongoose = require('mongoose');

const designRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    required: true
  },
  userPhone: {
    type: String,
    required: true
  },
  userEmail: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'rejected'],
    default: 'pending'
  },
  notes: {
    type: String
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// 创建索引
designRequestSchema.index({ status: 1 });
designRequestSchema.index({ createdAt: -1 });
designRequestSchema.index({ userName: 1 });
designRequestSchema.index({ userPhone: 1 });

module.exports = mongoose.model('DesignRequest', designRequestSchema);
