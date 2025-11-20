const mongoose = require('mongoose');

const websiteImageSchema = new mongoose.Schema({
  section: {
    type: String,
    enum: ['supply-chain', 'full-house', 'pricing', 'designer-resources', 'mini-program'],
    required: true,
    unique: true
  },
  items: [{
    id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    image: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// 创建索引
websiteImageSchema.index({ section: 1 });

module.exports = mongoose.model('WebsiteImage', websiteImageSchema);
