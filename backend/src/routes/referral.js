const express = require('express');
const router = express.Router();
const Referral = require('../models/Referral');
const Order = require('../models/Order');
const User = require('../models/User');
const mongoose = require('mongoose');

// 创建推荐（客户端）
router.post('/', async (req, res) => {
  try {
    const { orderId, refereeName, refereePhone, refereeRemark, userId } = req.body;
    
    if (!orderId || !refereeName || !refereePhone || !userId) {
      return res.status(400).json({ success: false, message: '缺少必要参数' });
    }
    
    // 检查订单是否存在且已完成
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ success: false, message: '只有已完成的订单才能推荐' });
    }
    
    // 检查是否已经推荐过相同的手机号
    const existingReferral = await Referral.findOne({ 
      orderId, 
      refereePhone 
    });
    if (existingReferral) {
      return res.status(400).json({ success: false, message: '该手机号已被推荐过' });
    }
    
    // 获取推荐人信息
    const user = await User.findById(userId);
    
    const referral = new Referral({
      referrerId: userId,
      referrerName: user?.nickname || user?.phone || '客户',
      referrerPhone: user?.phone || '',
      orderId,
      orderAmount: order.totalAmount || 0,
      refereeName,
      refereePhone,
      refereeRemark,
      rewardRate: 0.05 // 5%
    });
    
    await referral.save();
    
    res.json({ success: true, data: referral, message: '推荐成功，感谢您的推荐！' });
  } catch (error) {
    console.error('创建推荐失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取我的推荐列表（客户端）
router.get('/my/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const referrals = await Referral.find({ referrerId: userId })
      .populate('orderId', 'orderNo totalAmount')
      .populate('convertedOrderId', 'orderNo totalAmount')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Referral.countDocuments({ referrerId: userId });
    
    // 统计数据
    const stats = await Referral.aggregate([
      { $match: { referrerId: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalReferrals: { $sum: 1 },
          convertedCount: {
            $sum: { $cond: [{ $in: ['$status', ['converted', 'rewarded']] }, 1, 0] }
          },
          totalReward: {
            $sum: { $cond: [{ $eq: ['$rewardStatus', 'paid'] }, '$rewardAmount', 0] }
          },
          pendingReward: {
            $sum: { 
              $cond: [
                { $and: [
                  { $in: ['$status', ['converted', 'rewarded']] },
                  { $ne: ['$rewardStatus', 'paid'] }
                ]},
                '$rewardAmount', 
                0
              ] 
            }
          }
        }
      }
    ]);
    
    res.json({ 
      success: true, 
      data: referrals,
      stats: stats[0] || { totalReferrals: 0, convertedCount: 0, totalReward: 0, pendingReward: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('获取推荐列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取所有推荐列表（管理端）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, keyword } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (keyword) {
      query.$or = [
        { refereeName: { $regex: keyword, $options: 'i' } },
        { refereePhone: { $regex: keyword, $options: 'i' } },
        { referrerName: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const referrals = await Referral.find(query)
      .populate('referrerId', 'nickname phone')
      .populate('orderId', 'orderNo totalAmount')
      .populate('convertedOrderId', 'orderNo totalAmount')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await Referral.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: referrals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('获取推荐列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新推荐状态（管理端）
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, convertedOrderId, rewardStatus, followUpNote, rewardRemark } = req.body;
    
    const referral = await Referral.findById(id);
    if (!referral) {
      return res.status(404).json({ success: false, message: '推荐记录不存在' });
    }
    
    // 更新状态
    if (status) referral.status = status;
    
    // 关联成交订单
    if (convertedOrderId) {
      referral.convertedOrderId = convertedOrderId;
      const convertedOrder = await Order.findById(convertedOrderId);
      if (convertedOrder) {
        referral.convertedOrderAmount = convertedOrder.totalAmount || 0;
        referral.rewardAmount = referral.convertedOrderAmount * referral.rewardRate;
      }
    }
    
    // 更新奖励状态
    if (rewardStatus) {
      referral.rewardStatus = rewardStatus;
      if (rewardStatus === 'paid') {
        referral.rewardPaidAt = new Date();
        referral.status = 'rewarded';
      }
    }
    
    if (rewardRemark) referral.rewardRemark = rewardRemark;
    
    // 添加跟进记录
    if (followUpNote) {
      referral.followUpNotes.push({
        content: followUpNote,
        createdAt: new Date()
      });
    }
    
    await referral.save();
    
    res.json({ success: true, data: referral, message: '更新成功' });
  } catch (error) {
    console.error('更新推荐失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取推荐详情
router.get('/:id', async (req, res) => {
  try {
    const referral = await Referral.findById(req.params.id)
      .populate('referrerId', 'nickname phone')
      .populate('orderId', 'orderNo totalAmount items')
      .populate('convertedOrderId', 'orderNo totalAmount items');
    
    if (!referral) {
      return res.status(404).json({ success: false, message: '推荐记录不存在' });
    }
    
    res.json({ success: true, data: referral });
  } catch (error) {
    console.error('获取推荐详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 删除推荐
router.delete('/:id', async (req, res) => {
  try {
    await Referral.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除推荐失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
