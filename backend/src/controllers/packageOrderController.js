const { createPackageOrder, getPackageOrderDetail } = require('../services/packageOrderService')
const { successResponse, errorResponse } = require('../utils/response')

/**
 * 创建套餐订单
 * POST /api/orders/package
 */
const create = async (req, res) => {
  try {
    console.log('📦 [PackageOrderController] 创建套餐订单请求');
    console.log('📦 [PackageOrderController] userId:', req.userId);
    console.log('📦 [PackageOrderController] body:', JSON.stringify(req.body, null, 2));
    
    const { packageData, recipient, notes } = req.body
    
    if (!packageData) {
      console.error('❌ [PackageOrderController] 缺少packageData字段');
      return res.status(400).json(errorResponse('套餐数据不能为空', 400))
    }
    
    if (!recipient) {
      console.error('❌ [PackageOrderController] 缺少recipient字段');
      return res.status(400).json(errorResponse('收件人信息不能为空', 400))
    }
    
    console.log('📦 [PackageOrderController] 开始创建套餐订单...');
    const order = await createPackageOrder(req.userId, packageData, recipient, notes)
    
    console.log('✅ [PackageOrderController] 套餐订单创建成功:', order._id);
    res.status(201).json(successResponse(order))
  } catch (err) {
    console.error('❌ [PackageOrderController] 创建套餐订单错误:', err)
    console.error('❌ [PackageOrderController] 错误堆栈:', err.stack)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

/**
 * 获取套餐订单详情
 * GET /api/orders/package/:id
 */
const getDetail = async (req, res) => {
  try {
    const { id } = req.params
    const order = await getPackageOrderDetail(id, req.userId)
    res.json(successResponse(order))
  } catch (err) {
    console.error('❌ [PackageOrderController] 获取套餐订单详情错误:', err)
    const status = err.status || 500
    res.status(status).json(errorResponse(err.message, status))
  }
}

module.exports = {
  create,
  getDetail
}
