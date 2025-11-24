const { successResponse, errorResponse } = require('../utils/response')
const User = require('../models/User')
const Order = require('../models/Order')
const Product = require('../models/Product')

const getDashboardData = async (req, res) => {
  try {
    // 获取今天的日期范围
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // 获取昨天的日期范围
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // 今日订单数
    const todayOrders = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })
    
    // 昨日订单数
    const yesterdayOrders = await Order.countDocuments({
      createdAt: { $gte: yesterday, $lt: today }
    })
    
    // 今日新客户数
    const newCustomers = await User.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })
    
    // 昨日新客户数
    const yesterdayNewCustomers = await User.countDocuments({
      createdAt: { $gte: yesterday, $lt: today }
    })
    
    // 今日订单总额
    const todayOrdersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])
    const todayRevenue = todayOrdersData[0]?.totalAmount || 0
    
    // 昨日订单总额
    const yesterdayOrdersData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: yesterday, $lt: today },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ])
    const yesterdayRevenue = yesterdayOrdersData[0]?.totalAmount || 0
    
    // 计算变化百分比
    const ordersChange = yesterdayOrders > 0 
      ? `${((todayOrders - yesterdayOrders) / yesterdayOrders * 100).toFixed(1)}%`
      : '+0%'
    
    const customersChange = yesterdayNewCustomers > 0
      ? `${((newCustomers - yesterdayNewCustomers) / yesterdayNewCustomers * 100).toFixed(1)}%`
      : '+0%'
    
    const revenueChange = yesterdayRevenue > 0
      ? `${((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)}%`
      : '+0%'
    
    // 总用户数
    const totalUsers = await User.countDocuments()
    
    // 总订单数
    const totalOrders = await Order.countDocuments()
    
    // 总商品数
    const totalProducts = await Product.countDocuments()
    
    // 转化率（这里简单计算为今日订单数/今日访客数，假设每个新客都是访客）
    const conversionRate = newCustomers > 0 
      ? ((todayOrders / (newCustomers + todayOrders)) * 100).toFixed(1) + '%'
      : '0%'
    
    const dashboardData = {
      todayOrders: todayOrders.toString(),
      ordersChange,
      newCustomers: newCustomers.toString(),
      customersChange,
      conversionRate,
      conversionChange: '+0%', // 需要更复杂的计算
      todayRevenue: todayRevenue.toFixed(2),
      revenueChange,
      totalUsers,
      totalOrders,
      totalProducts,
      // 可以添加更多数据
    }
    
    res.json(successResponse(dashboardData))
  } catch (err) {
    console.error('Get dashboard data error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  getDashboardData
}
