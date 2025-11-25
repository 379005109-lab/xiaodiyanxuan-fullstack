const { successResponse, errorResponse, paginatedResponse } = require('../utils/response')
const { createOrder, getOrders, getOrderById, cancelOrder, confirmReceipt } = require('../services/orderService')

const create = async (req, res) => {
  try {
    console.log('📝 [Order] 创建订单请求');
    console.log('📝 [Order] userId:', req.userId);
    console.log('📝 [Order] body:', JSON.stringify(req.body, null, 2));
    
    const { items, recipient, couponCode } = req.body
    
    if (!items || !recipient) {
      console.error('❌ [Order] 缺少必需字段: items=', !!items, 'recipient=', !!recipient);
      return res.status(400).json(errorResponse('Items and recipient are required', 400))
    }
    
    console.log('📝 [Order] 开始创建订单...');
    const order = await createOrder(req.userId, items, recipient, couponCode)
    console.log('✅ [Order] 订单创建成功:', order._id);
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
    
    const result = await getOrders(req.userId, page, pageSize, status ? parseInt(status) : null)
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
