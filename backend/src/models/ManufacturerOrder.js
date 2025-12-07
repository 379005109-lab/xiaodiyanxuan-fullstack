const mongoose = require('mongoose');

const manufacturerOrderSchema = new mongoose.Schema({
  // 原始订单信息
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderNo: String,
  
  // 厂家信息
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manufacturer',
    required: true
  },
  manufacturerName: String,
  
  // 分配的商品项
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    skuId: String,
    skuName: String,
    specs: String,
    quantity: Number,
    price: Number,
    subtotal: Number,
    image: String
  }],
  
  // 金额
  totalAmount: {
    type: Number,
    default: 0
  },
  
  // 客户信息（收货信息）
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  
  // 状态
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'],
    default: 'pending'
    // pending: 待确认
    // confirmed: 已确认
    // processing: 生产中
    // shipped: 已发货
    // completed: 已完成
    // cancelled: 已取消
  },
  
  // 确认信息
  confirmedAt: Date,
  confirmedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 发货信息
  shippedAt: Date,
  trackingNo: String,
  trackingCompany: String,
  
  // 备注
  remark: String,
  manufacturerRemark: String, // 厂家备注
  
  // 操作日志
  logs: [{
    action: String,
    content: String,
    operator: String,
    createdAt: {
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
  }
});

manufacturerOrderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 索引
manufacturerOrderSchema.index({ orderId: 1 });
manufacturerOrderSchema.index({ manufacturerId: 1 });
manufacturerOrderSchema.index({ status: 1 });
manufacturerOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ManufacturerOrder', manufacturerOrderSchema);
