const express = require('express');
const router = express.Router();
const ManufacturerOrder = require('../models/ManufacturerOrder');
const Order = require('../models/Order');
const Manufacturer = require('../models/Manufacturer');
const mongoose = require('mongoose');
const { auth, requireRole } = require('../middleware/auth')
const { USER_ROLES } = require('../config/constants')

const ADMIN_ROLES = [
  USER_ROLES.SUPER_ADMIN,
  USER_ROLES.PLATFORM_ADMIN,
  USER_ROLES.ENTERPRISE_ADMIN,
  'admin',
  'super_admin'
]

// 分发订单到厂家
router.post('/dispatch/:orderId', auth, requireRole(ADMIN_ROLES), async (req, res) => {
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
router.get('/', auth, requireRole(ADMIN_ROLES), async (req, res) => {
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

// 厂家确认订单
router.put('/:id/confirm', auth, requireRole(ADMIN_ROLES), async (req, res) => {
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
router.put('/:id/status', auth, requireRole(ADMIN_ROLES), async (req, res) => {
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

    if (status === 'completed') {
      order.completedAt = new Date();
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
router.get('/:id', auth, requireRole(ADMIN_ROLES), async (req, res) => {
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
router.get('/order/:orderId', auth, requireRole(ADMIN_ROLES), async (req, res) => {
  try {
    const orders = await ManufacturerOrder.find({ orderId: req.params.orderId })
      .populate('manufacturerId', 'name code');
    
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('获取分发记录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// ========== 厂家端专用 API ==========

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'xiaodi-secret-key';

// 厂家登录
router.post('/manufacturer/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: '请输入用户名和密码' });
    }
    
    const manufacturer = await Manufacturer.findOne({ username }).select('+password');
    
    if (!manufacturer) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    if (!manufacturer.password) {
      return res.status(401).json({ success: false, message: '账户未设置密码，请联系管理员' });
    }
    
    const isMatch = await manufacturer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    if (manufacturer.status !== 'active') {
      return res.status(403).json({ success: false, message: '账户已被禁用' });
    }

    if (manufacturer.expiryDate && new Date() > new Date(manufacturer.expiryDate)) {
      return res.status(403).json({ success: false, message: '厂家效期已到期，请联系管理员续期' });
    }
    
    // 生成 token
    const token = jwt.sign(
      { id: manufacturer._id, type: 'manufacturer', name: manufacturer.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        manufacturer: {
          id: manufacturer._id,
          name: manufacturer.name,
          code: manufacturer.code,
          contactName: manufacturer.contactName,
          contactPhone: manufacturer.contactPhone
        }
      }
    });
  } catch (error) {
    console.error('厂家登录失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 厂家端中间件：验证厂家token
const verifyManufacturer = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'manufacturer') {
      return res.status(403).json({ success: false, message: '无权访问' });
    }

    const manufacturer = await Manufacturer.findById(decoded.id).select('_id name status expiryDate').lean()
    if (!manufacturer) {
      return res.status(401).json({ success: false, message: '登录已过期，请重新登录' })
    }
    if (manufacturer.status !== 'active') {
      return res.status(403).json({ success: false, message: '账户已被禁用' })
    }
    if (manufacturer.expiryDate && new Date() > new Date(manufacturer.expiryDate)) {
      return res.status(403).json({ success: false, message: '厂家效期已到期，请联系管理员续期' })
    }

    req.manufacturerId = String(manufacturer._id);
    req.manufacturerName = manufacturer.name;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
};

// 获取厂家自己的订单列表
router.get('/manufacturer/orders', verifyManufacturer, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    
    const query = { manufacturerId: req.manufacturerId };
    if (status) query.status = status;
    
    const orders = await ManufacturerOrder.find(query)
      .populate('orderId', 'orderNo status totalAmount createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await ManufacturerOrder.countDocuments(query);
    
    // 统计各状态数量
    const stats = await ManufacturerOrder.aggregate([
      { $match: { manufacturerId: new mongoose.Types.ObjectId(req.manufacturerId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusCounts = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      completed: 0
    };
    stats.forEach(s => {
      if (statusCounts.hasOwnProperty(s._id)) {
        statusCounts[s._id] = s.count;
      }
    });
    
    res.json({
      success: true,
      data: orders,
      stats: statusCounts,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    console.error('获取厂家订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取厂家订单详情
router.get('/manufacturer/orders/:id', verifyManufacturer, async (req, res) => {
  try {
    const order = await ManufacturerOrder.findOne({
      _id: req.params.id,
      manufacturerId: req.manufacturerId
    }).populate('orderId', 'orderNo status totalAmount createdAt recipient');
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 厂家确认订单
router.post('/manufacturer/orders/:id/confirm', verifyManufacturer, async (req, res) => {
  try {
    const order = await ManufacturerOrder.findOne({
      _id: req.params.id,
      manufacturerId: req.manufacturerId
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ success: false, message: '只能确认待处理的订单' });
    }
    
    order.status = 'confirmed';
    order.confirmedAt = new Date();
    order.logs.push({
      action: 'confirm',
      content: '厂家已确认订单',
      operator: req.manufacturerName,
      createdAt: new Date()
    });
    
    await order.save();
    
    res.json({ success: true, message: '订单已确认', data: order });
  } catch (error) {
    console.error('确认订单失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 厂家开始生产
router.post('/manufacturer/orders/:id/start-production', verifyManufacturer, async (req, res) => {
  try {
    const order = await ManufacturerOrder.findOne({
      _id: req.params.id,
      manufacturerId: req.manufacturerId
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: '只能对已确认的订单开始生产' });
    }
    
    order.status = 'processing';
    order.logs.push({
      action: 'start_production',
      content: '开始生产',
      operator: req.manufacturerName,
      createdAt: new Date()
    });
    
    await order.save();
    
    res.json({ success: true, message: '已开始生产', data: order });
  } catch (error) {
    console.error('开始生产失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 厂家发货
router.post('/manufacturer/orders/:id/ship', verifyManufacturer, async (req, res) => {
  try {
    const { trackingNo, trackingCompany } = req.body;
    
    if (!trackingNo) {
      return res.status(400).json({ success: false, message: '请输入快递单号' });
    }
    
    const order = await ManufacturerOrder.findOne({
      _id: req.params.id,
      manufacturerId: req.manufacturerId
    });
    
    if (!order) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    if (order.status !== 'processing' && order.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: '当前状态不能发货' });
    }
    
    order.status = 'shipped';
    order.shippedAt = new Date();
    order.trackingNo = trackingNo;
    order.trackingCompany = trackingCompany || '顺丰速运';
    order.logs.push({
      action: 'ship',
      content: `已发货，${order.trackingCompany}：${trackingNo}`,
      operator: req.manufacturerName,
      createdAt: new Date()
    });
    
    await order.save();
    
    res.json({ success: true, message: '发货成功', data: order });
  } catch (error) {
    console.error('发货失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 获取厂家信息
router.get('/manufacturer/profile', verifyManufacturer, async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.manufacturerId);
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' });
    }
    
    res.json({ success: true, data: manufacturer });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 更新厂家信息（厂家端）
router.put('/manufacturer/profile', verifyManufacturer, async (req, res) => {
  try {
    const manufacturer = await Manufacturer.findById(req.manufacturerId);
    if (!manufacturer) {
      return res.status(404).json({ success: false, message: '厂家不存在' });
    }

    const { logo, settings } = req.body || {};
    if (logo !== undefined) manufacturer.logo = logo;

    if (settings && typeof settings === 'object') {
      manufacturer.settings = {
        ...(manufacturer.settings || {}),
        ...settings,
        bankInfo: {
          ...(manufacturer.settings?.bankInfo || {}),
          ...(settings.bankInfo || {})
        }
      };
    }

    await manufacturer.save();
    res.json({ success: true, data: manufacturer, message: '更新成功' });
  } catch (error) {
    console.error('更新厂家信息失败:', error);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

// 修改厂家密码
router.post('/manufacturer/change-password', verifyManufacturer, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: '请输入旧密码和新密码' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: '新密码至少6位' });
    }
    
    const manufacturer = await Manufacturer.findById(req.manufacturerId).select('+password');
    
    const isMatch = await manufacturer.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: '旧密码错误' });
    }
    
    manufacturer.password = newPassword;
    await manufacturer.save();
    
    res.json({ success: true, message: '密码修改成功' });
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

module.exports = router;
