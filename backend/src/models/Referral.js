const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  // 推荐人（发起推荐的客户）
  referrerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  referrerName: String,
  referrerPhone: String,
  
  // 关联的原始订单
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  orderAmount: {
    type: Number,
    default: 0
  },
  
  // 被推荐人信息
  refereeName: {
    type: String,
    required: true
  },
  refereePhone: {
    type: String,
    required: true
  },
  refereeRemark: String, // 备注说明
  
  // 推荐状态
  status: {
    type: String,
    enum: ['pending', 'contacted', 'converted', 'rewarded', 'invalid'],
    default: 'pending'
    // pending: 待跟进
    // contacted: 已联系
    // converted: 已成交
    // rewarded: 已发放奖励
    // invalid: 无效
  },
  
  // 成交信息
  convertedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  convertedOrderAmount: {
    type: Number,
    default: 0
  },
  
  // 奖励信息
  rewardRate: {
    type: Number,
    default: 0.05 // 5%
  },
  rewardAmount: {
    type: Number,
    default: 0
  },
  rewardStatus: {
    type: String,
    enum: ['pending', 'approved', 'paid'],
    default: 'pending'
  },
  rewardPaidAt: Date,
  rewardRemark: String,
  
  // 跟进记录
  followUpNotes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
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

referralSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 索引
referralSchema.index({ referrerId: 1 });
referralSchema.index({ orderId: 1 });
referralSchema.index({ status: 1 });
referralSchema.index({ refereePhone: 1 });

module.exports = mongoose.model('Referral', referralSchema);
