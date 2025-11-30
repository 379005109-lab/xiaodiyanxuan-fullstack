const mongoose = require('mongoose');
const { DEFAULT_DESIGNER_DISCOUNT } = require('../config/constants');

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
  },
  
  // === 设计师折扣配置 ===
  designerDiscount: {
    enabled: { type: Boolean, default: true },           // 是否启用设计师折扣
    rate: { type: Number, default: DEFAULT_DESIGNER_DISCOUNT, min: 0, max: 1 }, // 折扣率（0.4=4折）
    minPrice: Number,                                     // 最低售价保护（可选）
  },
  
  // === 数据归属（可选，用于平台/企业独立分类）===
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
}, {
  timestamps: true
});

// 索引
MaterialCategorySchema.index({ order: 1, createdAt: 1 });
MaterialCategorySchema.index({ organizationId: 1 });
MaterialCategorySchema.index({ parentId: 1 });

module.exports = mongoose.model('MaterialCategory', MaterialCategorySchema);
