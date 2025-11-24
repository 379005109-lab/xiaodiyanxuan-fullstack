const mongoose = require('mongoose');

const MaterialSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    index: true
  },
  type: { 
    type: String, 
    enum: ['texture', 'color', 'pattern'], 
    default: 'texture' 
  },
  categoryId: { 
    type: String, // 简化为String，前端兼容
    index: true
  },
  image: { 
    type: String // GridFS fileId或URL
  },
  tags: [String],
  properties: {
    材质: String,
    工艺: String
  },
  description: String,
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'offline'], 
    default: 'pending',
    index: true
  },
  order: { 
    type: Number, 
    default: 0 
  },
  isCategory: {
    type: Boolean,
    default: false // false表示是SKU，true表示是类别
  },
  reviewBy: String,
  reviewAt: Date,
  reviewNote: String
}, {
  timestamps: true
});

// 索引
MaterialSchema.index({ categoryId: 1, order: 1 });
MaterialSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Material', MaterialSchema);
