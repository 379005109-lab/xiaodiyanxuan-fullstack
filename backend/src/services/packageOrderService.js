const Order = require('../models/Order')
const User = require('../models/User')
const { generateOrderNo } = require('../utils/helpers')
const { ORDER_STATUS } = require('../config/constants')
const { ValidationError } = require('../utils/errors')

/**
 * 创建套餐订单
 * @param {String} userId - 用户ID
 * @param {Object} packageData - 套餐数据
 * @param {String} packageData.packageId - 套餐ID
 * @param {String} packageData.packageName - 套餐名称
 * @param {Number} packageData.packagePrice - 套餐基础价格
 * @param {Array} packageData.selections - 套餐选择详情
 * @param {Object} recipient - 收件人信息
 * @param {String} notes - 订单备注
 */
const createPackageOrder = async (userId, packageData, recipient, notes = '') => {
  console.log('📦 [PackageOrderService] createPackageOrder called');
  console.log('📦 [PackageOrderService] userId:', userId);
  console.log('📦 [PackageOrderService] packageData:', JSON.stringify(packageData, null, 2));
  console.log('📦 [PackageOrderService] recipient:', recipient);
  
  // 验证必需字段
  if (!packageData.packageId || !packageData.packageName) {
    throw new ValidationError('套餐ID和名称不能为空')
  }
  
  if (!packageData.selections || packageData.selections.length === 0) {
    throw new ValidationError('套餐选择不能为空')
  }
  
  if (!recipient || !recipient.name || !recipient.phone || !recipient.address) {
    throw new ValidationError('收件人信息不完整')
  }
  
  // 计算总价
  let totalAmount = packageData.packagePrice || 0
  
  // 累加材质升级费用
  packageData.selections.forEach(selection => {
    selection.products.forEach(product => {
      if (product.materialUpgrade) {
        totalAmount += product.materialUpgrade * (product.quantity || 1)
      }
    })
  })
  
  console.log('📦 [PackageOrderService] Calculated totalAmount:', totalAmount);
  
  // 生成订单号
  const orderNo = generateOrderNo()
  console.log('📦 [PackageOrderService] Generated orderNo:', orderNo);
  
  // 创建订单
  const order = await Order.create({
    orderNo,
    userId,
    orderType: 'package',
    packageInfo: {
      packageId: packageData.packageId,
      packageName: packageData.packageName,
      packagePrice: packageData.packagePrice,
      selections: packageData.selections
    },
    subtotal: totalAmount,
    discountAmount: 0,
    totalAmount,
    recipient,
    status: ORDER_STATUS.PENDING_PAYMENT,
    notes
  })
  
  console.log('✅ [PackageOrderService] Package order created successfully!');
  console.log('✅ [PackageOrderService] Order ID:', order._id);
  console.log('✅ [PackageOrderService] Order No:', order.orderNo);
  console.log('✅ [PackageOrderService] Total Amount:', order.totalAmount);
  
  // 更新用户统计
  const user = await User.findById(userId)
  if (user) {
    user.totalOrders = (user.totalOrders || 0) + 1
    user.totalSpent = (user.totalSpent || 0) + totalAmount
    await user.save()
    console.log('✅ [PackageOrderService] User stats updated');
  }
  
  return order
}

/**
 * 获取套餐订单详情
 * @param {String} orderId - 订单ID
 * @param {String} userId - 用户ID（用于权限验证）
 */
const getPackageOrderDetail = async (orderId, userId) => {
  const order = await Order.findOne({ 
    _id: orderId, 
    userId,
    orderType: 'package' 
  })
  
  if (!order) {
    throw new ValidationError('套餐订单不存在')
  }
  
  return order
}

module.exports = {
  createPackageOrder,
  getPackageOrderDetail
}
