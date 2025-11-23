const mongoose = require('mongoose');

const MaterialCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true
  },
  description: String,
  parentId: String, // 简化为String
  order: { 
    type: Number, 
    default: 0 
  }
}, {
  timestamps: true
});

// 索引
MaterialCategorySchema.index({ order: 1, createdAt: 1 });

module.exports = mongoose.model('MaterialCategory', MaterialCategorySchema);
