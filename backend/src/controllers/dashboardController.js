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
    
    // 获取上周同一天
    const lastWeekSameDay = new Date(today)
    lastWeekSameDay.setDate(lastWeekSameDay.getDate() - 7)
    const lastWeekSameDayEnd = new Date(lastWeekSameDay)
    lastWeekSameDayEnd.setDate(lastWeekSameDayEnd.getDate() + 1)
    
    // 今日订单数和金额
    const todayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })
    
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
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ])
    const todayGMV = todayOrdersData[0]?.totalAmount || 0
    const todayValidOrders = todayOrdersData[0]?.count || 0
    
    // 上周同一天数据（用于计算变化）
    const lastWeekData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: lastWeekSameDay, $lt: lastWeekSameDayEnd },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ])
    const lastWeekGMV = lastWeekData[0]?.totalAmount || 0
    const lastWeekOrders = lastWeekData[0]?.count || 0
    
    // 今日活跃用户数（有订单的用户）
    const activeUsers = await Order.distinct('userId', {
      createdAt: { $gte: today, $lt: tomorrow }
    })
    const todayActiveUsers = activeUsers.length
    
    // 上周活跃用户
    const lastWeekActiveUsers = await Order.distinct('userId', {
      createdAt: { $gte: lastWeekSameDay, $lt: lastWeekSameDayEnd }
    })
    
    // 计算平均订单金额
    const avgOrderValue = todayValidOrders > 0 ? Math.round(todayGMV / todayValidOrders) : 0
    const lastWeekAvgOrder = lastWeekOrders > 0 ? Math.round(lastWeekGMV / lastWeekOrders) : 0
    
    // 计算变化百分比
    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return parseFloat(((current - previous) / previous * 100).toFixed(1))
    }
    
    // 获取近7天订单趋势
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    
    const orderTrendData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo, $lt: tomorrow },
          status: { $ne: 'cancelled' }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          orders: { $sum: 1 },
          gmv: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 转换为前端期望的格式
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const orderTrend = orderTrendData.map(item => ({
      date: dayNames[new Date(item._id).getDay()],
      orders: item.orders,
      gmv: item.gmv
    }))
    
    // 热销商品（按订单数量排序）
    const hotProductsData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo, $lt: tomorrow },
          status: { $ne: 'cancelled' }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productName',
          gmv: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orders: { $sum: 1 }
        }
      },
      { $sort: { orders: -1 } },
      { $limit: 5 }
    ])
    
    const hotProducts = hotProductsData.map(item => ({
      name: item._id || '未知商品',
      gmv: item.gmv,
      orders: item.orders,
      conversion: Math.round(Math.random() * 20 + 10) // 模拟转化率
    }))
    
    // 总统计
    const totalUsers = await User.countDocuments()
    const totalOrders = await Order.countDocuments()
    const totalProducts = await Product.countDocuments()
    
    // 构建响应数据
    const dashboardData = {
      // 摘要数据
      summary: {
        todayGMV: todayGMV,
        todayOrders: todayOrdersCount,
        avgOrderValue: avgOrderValue,
        activeUsers: todayActiveUsers,
        flatPriceOrders: 0, // 一口价订单数
        shareConversion: 0, // 分享转化率
      },
      // 变化趋势
      summaryTrend: {
        todayGMVChange: calcChange(todayGMV, lastWeekGMV),
        todayOrdersChange: calcChange(todayOrdersCount, lastWeekOrders),
        avgOrderChange: calcChange(avgOrderValue, lastWeekAvgOrder),
        activeChange: calcChange(todayActiveUsers, lastWeekActiveUsers.length),
        flatPriceChange: 0,
        shareChange: 0,
      },
      // 订单趋势
      orderTrend: orderTrend,
      // 热销商品
      hotProducts: hotProducts,
      // 兼容旧格式
      todayOrders: todayOrdersCount.toString(),
      ordersChange: `${calcChange(todayOrdersCount, lastWeekOrders) >= 0 ? '+' : ''}${calcChange(todayOrdersCount, lastWeekOrders)}%`,
      newCustomers: (await User.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } })).toString(),
      customersChange: '+0%',
      conversionRate: todayActiveUsers > 0 ? `${(todayValidOrders / todayActiveUsers * 100).toFixed(1)}%` : '0%',
      conversionChange: '+0%',
      todayRevenue: todayGMV.toFixed(2),
      revenueChange: `${calcChange(todayGMV, lastWeekGMV) >= 0 ? '+' : ''}${calcChange(todayGMV, lastWeekGMV)}%`,
      totalUsers,
      totalOrders,
      totalProducts,
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
