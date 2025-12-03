const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const { createOrder, getOrders, getOrderById, cancelOrder, confirmReceipt } = require('../services/orderService')
const { sendNewOrderNotification } = require('../services/emailService')

const create = async (req, res) => {
  try {
    console.log('📝 [Order] 创建订单请求');
    console.log('📝 [Order] userId:', req.userId);
    console.log('📝 [Order] body:', JSON.stringify(req.body, null, 2));
    
    let { items, recipient, couponCode } = req.body
    
    // 兼容旧格式：如果没有recipient但有address/phone/contactName，自动构建recipient
    if (!recipient && (req.body.address || req.body.phone || req.body.contactName)) {
      console.log('📝 [Order] 检测到旧格式，自动转换recipient');
      recipient = {
        name: req.body.contactName || req.body.name || '未知',
        phone: req.body.phone || '',
        address: req.body.address || ''
      }
    }
    
    if (!items || !recipient) {
      console.error('❌ [Order] 缺少必需字段: items=', !!items, 'recipient=', !!recipient);
      return res.status(400).json(errorResponse('Items and recipient are required', 400))
    }
    
    console.log('📝 [Order] recipient:', JSON.stringify(recipient));
    console.log('📝 [Order] 开始创建订单...');
    const order = await createOrder(req.userId, items, recipient, couponCode)
    console.log('✅ [Order] 订单创建成功:', order._id);
    
    // 异步发送邮件通知（不阻塞响应）
    sendNewOrderNotification(order).then(result => {
      if (result.success) {
        console.log('📧 [Order] 新订单邮件通知已发送');
      } else {
        console.error('📧 [Order] 邮件发送失败:', result.error);
      }
    }).catch(err => {
      console.error('📧 [Order] 邮件发送异常:', err);
    });
    
    res.status(201).json(successResponse(order))
  } catch (err) {
    console.error('❌ [Order] 创建订单错误:', err)
    console.error('❌ [Order] 错误堆栈:', err.stack)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

const list = async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query
    
    // 管理员可以看到所有订单，普通用户只能看到自己的
    const isAdmin = req.userRole === 'admin' || req.userRole === 'super_admin' || req.userRole === 'superadmin'
    const userId = isAdmin ? null : req.userId
    
    console.log('📋 [OrderController] list orders:', { userId, isAdmin, userRole: req.userRole })
    const result = await getOrders(userId, page, pageSize, status ? parseInt(status) : null)
    console.log('📋 [OrderController] found orders:', result.total)
    res.json(paginatedResponse(result.orders, result.total, result.page, result.pageSize))
  } catch (err) {
    console.error('List orders error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

const getOrder = async (req, res) => {
  try {
    const { id } = req.params
    const order = await getOrderById(id, req.userId)
    res.json(successResponse(order))
  } catch (err) {
    console.error('Get order error:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

const cancel = async (req, res) => {
  try {
    const { id } = req.params
    const order = await cancelOrder(id, req.userId)
    res.json(successResponse(order))
  } catch (err) {
    console.error('Cancel order error:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

const confirm = async (req, res) => {
  try {
    const { id } = req.params
    const order = await confirmReceipt(id, req.userId)
    res.json(successResponse(order))
  } catch (err) {
    console.error('Confirm receipt error:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

module.exports = {
  create,
  list,
  getOrder,
  cancel,
  confirm
}
