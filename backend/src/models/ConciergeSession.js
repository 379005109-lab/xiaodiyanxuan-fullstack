const mongoose = require('mongoose');

/**
 * 代客下单临时会话
 * 用于在管理后台跳转到前台购物车时传递订单数据
 */
const conciergeSessionSchema = new mongoose.Schema({
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  orderId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    required: true
  },
  orderSource: {
    type: String,
    default: 'self'
  },
  items: [{
    id: String,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    description: String
  }],
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL索引，自动删除过期文档
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ConciergeSession', conciergeSessionSchema);
