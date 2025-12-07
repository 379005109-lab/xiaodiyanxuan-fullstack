const express = require('express');
const router = express.Router();
const ManufacturerOrder = require('../models/ManufacturerOrder');
const Order = require('../models/Order');
const Manufacturer = require('../models/Manufacturer');
const mongoose = require('mongoose');

// 分发订单到厂家
router.post('/dispatch/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // 获取订单
    const order = await Order.findById(orderId).populate('items.productId');
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    // 检查订单状态
    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: '已取消的订单不能分发' });
    }
    
    // 检查是否已经分发过
    const existingDispatch = await ManufacturerOrder.find({ orderId });
    if (existingDispatch.length > 0) {
      return res.status(400).json({ success: false, message: '该订单已经分发过，请勿重复分发' });
    }
    
    // 按厂家分组商品
    const manufacturerItems = {};
    
    for (const item of order.items) {
      const manufacturerId = item.manufacturerId || item.productId?.manufacturerId;
      const manufacturerName = item.manufacturerName || item.productId?.manufacturerName || '未知厂家';
      
      if (!manufacturerId) {
        // 如果商品没有厂家信息，归类到"未分配"
        const unknownKey = 'unknown';
        if (!manufacturerItems[unknownKey]) {
          manufacturerItems[unknownKey] = {
            manufacturerId: null,
            manufacturerName: '未分配厂家',
            items: [],
            totalAmount: 0
          };
        }
        manufacturerItems[unknownKey].items.push({
          productId: item.productId?._id || item.productId,
          productName: item.productName || item.productId?.name,
          skuId: item.skuId,
          skuName: item.skuName,
          specs: item.specs,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
          image: item.image || item.productId?.images?.[0]
        });
        manufacturerItems[unknownKey].totalAmount += item.subtotal || 0;
        continue;
      }
      
      const key = manufacturerId.toString();
      if (!manufacturerItems[key]) {
        manufacturerItems[key] = {
          manufacturerId,
          manufacturerName,
          items: [],
          totalAmount: 0
        };
      }
      
      manufacturerItems[key].items.push({
        productId: item.productId?._id || item.productId,
        productName: item.productName || item.productId?.name,
        skuId: item.skuId,
        skuName: item.skuName,
        specs: item.specs,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
        image: item.image || item.productId?.images?.[0]
      });
      manufacturerItems[key].totalAmount += item.subtotal || 0;
    }
    
    // 创建厂家订单
    const createdOrders = [];
    for (const key in manufacturerItems) {
      const data = manufacturerItems[key];
      
      const manufacturerOrder = new ManufacturerOrder({
        orderId: order._id,
        orderNo: order.orderNo,
        manufacturerId: data.manufacturerId,
        manufacturerName: data.manufacturerName,
        items: data.items,
        totalAmount: data.totalAmount,
        customerName: order.shippingAddress?.name || order.customerName,
        customerPhone: order.shippingAddress?.phone || order.customerPhone,
        customerAddress: order.shippingAddress 
          ? `${order.shippingAddress.province}${order.shippingAddress.city}${order.shippingAddress.district}${order.shippingAddress.detail}`
          : order.customerAddress,
        logs: [{
          action: 'dispatch',
          content: '订单已分发',
          operator: '系统',
          createdAt: new Date()
        }]
      });
      
      await manufacturerOrder.save();
      createdOrders.push(manufacturerOrder);
    }
    
    // 更新原订单状态
    order.dispatchStatus = 'dispatched';
    order.dispatchedAt = new Date();
    await order.save();
    
    res.json({ 
      success: true, 
      data: createdOrders, 
      message: `订单已分发到 ${createdOrders.length} 个厂家` 
    });
  } catch (error) {
    console.error('分发订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取厂家订单列表（管理端）
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, manufacturerId, keyword } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (manufacturerId) query.manufacturerId = manufacturerId;
    if (keyword) {
      query.$or = [
        { orderNo: { $regex: keyword, $options: 'i' } },
        { manufacturerName: { $regex: keyword, $options: 'i' } },
        { customerName: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    const orders = await ManufacturerOrder.find(query)
      .populate('orderId', 'orderNo status totalAmount')
      .populate('manufacturerId', 'name code contact')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await ManufacturerOrder.countDocuments(query);
    
    res.json({ 
      success: true, 
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('获取厂家订单列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取指定厂家的订单列表（厂家端）
router.get('/manufacturer/:manufacturerId', async (req, res) => {
  try {
    const { manufacturerId } = req.params;
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { manufacturerId };
    if (status) query.status = status;
    
    const orders = await ManufacturerOrder.find(query)
      .populate('orderId', 'orderNo status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await ManufacturerOrder.countDocuments(query);
    
    // 统计数据
    const stats = await ManufacturerOrder.aggregate([
      { $match: { manufacturerId: new mongoose.Types.ObjectId(manufacturerId) } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          confirmed: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          processing: { $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] } },
          shipped: { $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);
    
    res.json({ 
      success: true, 
      data: orders,
      stats: stats[0] || { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, completed: 0 },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total
      }
    });
  } catch (error) {
    console.error('获取厂家订单列表失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 厂家确认订单
router.put('/:id/confirm', async (req, res) => {
  try {
    const { id } = req.params;
    const { manufacturerRemark } = req.body;
    
    const order = await ManufacturerOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '只有待确认的订单才能确认' });
    }
    
    order.status = 'confirmed';
    order.confirmedAt = new Date();
    if (manufacturerRemark) order.manufacturerRemark = manufacturerRemark;
    
    order.logs.push({
      action: 'confirm',
      content: '厂家已确认订单',
      operator: '厂家',
      createdAt: new Date()
    });
    
    await order.save();
    
    res.json({ success: true, data: order, message: '订单已确认' });
  } catch (error) {
    console.error('确认订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新厂家订单状态
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNo, trackingCompany, remark } = req.body;
    
    const order = await ManufacturerOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    const oldStatus = order.status;
    order.status = status;
    
    if (status === 'shipped') {
      order.shippedAt = new Date();
      if (trackingNo) order.trackingNo = trackingNo;
      if (trackingCompany) order.trackingCompany = trackingCompany;
    }
    
    if (remark) order.manufacturerRemark = remark;
    
    const statusNames = {
      pending: '待确认',
      confirmed: '已确认',
      processing: '生产中',
      shipped: '已发货',
      completed: '已完成',
      cancelled: '已取消'
    };
    
    order.logs.push({
      action: 'status_change',
      content: `状态从"${statusNames[oldStatus]}"变更为"${statusNames[status]}"`,
      operator: '厂家',
      createdAt: new Date()
    });
    
    await order.save();
    
    res.json({ success: true, data: order, message: '状态更新成功' });
  } catch (error) {
    console.error('更新状态失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取厂家订单详情
router.get('/:id', async (req, res) => {
  try {
    const order = await ManufacturerOrder.findById(req.params.id)
      .populate('orderId', 'orderNo status totalAmount createdAt')
      .populate('manufacturerId', 'name code contact phone address');
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取订单的分发记录
router.get('/order/:orderId', async (req, res) => {
  try {
    const orders = await ManufacturerOrder.find({ orderId: req.params.orderId })
      .populate('manufacturerId', 'name code');
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('获取分发记录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
