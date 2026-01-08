const { successResponse, errorResponse } = require('../utils/response')
const User = require('../models/User')
const Order = require('../models/Order')
const Product = require('../models/Product')
const BrowseHistory = require('../models/BrowseHistory')
const Favorite = require('../models/Favorite')
const Compare = require('../models/Compare')
const Cart = require('../models/Cart')

// 获取北京时间的今天开始和结束
const getBeijingDateRange = (daysOffset = 0) => {
  const now = new Date()
  // 转换为北京时间（UTC+8）
  const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000))
  const year = beijingTime.getUTCFullYear()
  const month = beijingTime.getUTCMonth()
  const date = beijingTime.getUTCDate() + daysOffset
  
  // 创建北京时间的日期范围（UTC时间）
  const start = new Date(Date.UTC(year, month, date, -8, 0, 0, 0)) // 北京时间00:00 = UTC前一天16:00
  const end = new Date(Date.UTC(year, month, date + 1, -8, 0, 0, 0)) // 北京时间次日00:00
  
  return { start, end }
}

const getDashboardData = async (req, res) => {
  try {
    // 获取今天的日期范围（北京时间）
    const { start: today, end: tomorrow } = getBeijingDateRange(0)
    
    // 获取昨天的日期范围
    const { start: yesterday } = getBeijingDateRange(-1)
    
    // 获取上周同一天
    const { start: lastWeekSameDay, end: lastWeekSameDayEnd } = getBeijingDateRange(-7)
    
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

// 用户活跃度看板
const getUserActivityDashboard = async (req, res) => {
  try {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const monthAgo = new Date(today)
    monthAgo.setMonth(monthAgo.getMonth() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // 1. 用户登录统计（基于 lastLoginAt 字段）
    const todayLogins = await User.countDocuments({
      lastLoginAt: { $gte: today, $lt: tomorrow }
    })
    
    const weekLogins = await User.countDocuments({
      lastLoginAt: { $gte: weekAgo, $lt: tomorrow }
    })
    
    const monthLogins = await User.countDocuments({
      lastLoginAt: { $gte: monthAgo, $lt: tomorrow }
    })

    // 2. 商品浏览统计
    const todayBrowse = await BrowseHistory.countDocuments({
      viewedAt: { $gte: today, $lt: tomorrow }
    })
    const weekBrowse = await BrowseHistory.countDocuments({
      viewedAt: { $gte: weekAgo, $lt: tomorrow }
    })
    const monthBrowse = await BrowseHistory.countDocuments({
      viewedAt: { $gte: monthAgo, $lt: tomorrow }
    })

    // 3. 商品收藏统计
    const todayFavorite = await Favorite.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })
    const weekFavorite = await Favorite.countDocuments({
      createdAt: { $gte: weekAgo, $lt: tomorrow }
    })
    const monthFavorite = await Favorite.countDocuments({
      createdAt: { $gte: monthAgo, $lt: tomorrow }
    })

    // 4. 商品对比统计
    const todayCompare = await Compare.countDocuments({
      addedAt: { $gte: today, $lt: tomorrow }
    })
    const weekCompare = await Compare.countDocuments({
      addedAt: { $gte: weekAgo, $lt: tomorrow }
    })
    const monthCompare = await Compare.countDocuments({
      addedAt: { $gte: monthAgo, $lt: tomorrow }
    })

    // 5. 加购统计
    const todayCart = await Cart.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    })
    const weekCart = await Cart.countDocuments({
      createdAt: { $gte: weekAgo, $lt: tomorrow }
    })
    const monthCart = await Cart.countDocuments({
      createdAt: { $gte: monthAgo, $lt: tomorrow }
    })

    // 6. 最活跃的10个用户（基于浏览、收藏、对比、加购的综合活跃度）
    const topActiveUsers = await User.aggregate([
      {
        $lookup: {
          from: 'browsehistories',
          localField: '_id',
          foreignField: 'userId',
          as: 'browseHistory'
        }
      },
      {
        $lookup: {
          from: 'favorites',
          localField: '_id',
          foreignField: 'userId',
          as: 'favorites'
        }
      },
      {
        $lookup: {
          from: 'compares',
          localField: '_id',
          foreignField: 'userId',
          as: 'compares'
        }
      },
      {
        $lookup: {
          from: 'carts',
          localField: '_id',
          foreignField: 'userId',
          as: 'carts'
        }
      },
      {
        $addFields: {
          browseCount: { $size: '$browseHistory' },
          favoriteCount: { $size: '$favorites' },
          compareCount: { $size: '$compares' },
          cartCount: { $size: '$carts' },
          activityScore: {
            $add: [
              { $multiply: [{ $size: '$browseHistory' }, 1] },
              { $multiply: [{ $size: '$favorites' }, 3] },
              { $multiply: [{ $size: '$compares' }, 2] },
              { $multiply: [{ $size: '$carts' }, 4] }
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          nickname: 1,
          phone: 1,
          username: 1,
          lastLoginAt: 1,
          browseCount: 1,
          favoriteCount: 1,
          compareCount: 1,
          cartCount: 1,
          activityScore: 1
        }
      },
      { $sort: { activityScore: -1 } },
      { $limit: 10 }
    ])

    // 7. 被浏览最多的商品 TOP 10
    const topBrowsedProducts = await BrowseHistory.aggregate([
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          thumbnail: { $first: '$thumbnail' },
          browseCount: { $sum: 1 }
        }
      },
      { $sort: { browseCount: -1 } },
      { $limit: 10 }
    ])

    // 8. 被收藏最多的商品 TOP 10
    const topFavoritedProducts = await Favorite.aggregate([
      {
        $group: {
          _id: '$productId',
          productName: { $first: '$productName' },
          thumbnail: { $first: '$thumbnail' },
          favoriteCount: { $sum: 1 }
        }
      },
      { $sort: { favoriteCount: -1 } },
      { $limit: 10 }
    ])

    // 9. 被对比最多的商品 TOP 10（添加商品信息）
    const topComparedProducts = await Compare.aggregate([
      {
        $group: {
          _id: '$productId',
          compareCount: { $sum: 1 }
        }
      },
      { $sort: { compareCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          let: { productId: { $toObjectId: '$_id' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$productId'] } } },
            { $project: { name: 1, images: 1 } }
          ],
          as: 'productInfo'
        }
      },
      {
        $addFields: {
          productName: { $arrayElemAt: ['$productInfo.name', 0] },
          thumbnail: { $arrayElemAt: [{ $arrayElemAt: ['$productInfo.images', 0] }, 0] }
        }
      },
      {
        $project: {
          productInfo: 0
        }
      }
    ])

    // 10. 每日用户登录趋势（最近7天 - 北京时间）
    const loginTrend = []
    for (let i = 6; i >= 0; i--) {
      const { start: dayStart, end: dayEnd } = getBeijingDateRange(-i)
      
      const count = await User.countDocuments({
        lastLoginAt: { $gte: dayStart, $lt: dayEnd }
      })
      
      // 转换为北京时间显示
      const beijingDate = new Date(dayStart.getTime() + (8 * 60 * 60 * 1000))
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      loginTrend.push({
        date: `${beijingDate.getUTCMonth() + 1}/${beijingDate.getUTCDate()}`,
        dayName: dayNames[beijingDate.getUTCDay()],
        count
      })
    }

    res.json(successResponse({
      // 登录统计
      loginStats: {
        today: todayLogins,
        week: weekLogins,
        month: monthLogins
      },
      // 浏览统计
      browseStats: {
        today: todayBrowse,
        week: weekBrowse,
        month: monthBrowse
      },
      // 收藏统计
      favoriteStats: {
        today: todayFavorite,
        week: weekFavorite,
        month: monthFavorite
      },
      // 对比统计
      compareStats: {
        today: todayCompare,
        week: weekCompare,
        month: monthCompare
      },
      // 加购统计
      cartStats: {
        today: todayCart,
        week: weekCart,
        month: monthCart
      },
      // 最活跃用户
      topActiveUsers,
      // 热门商品
      topBrowsedProducts,
      topFavoritedProducts,
      topComparedProducts,
      // 登录趋势
      loginTrend
    }))
  } catch (err) {
    console.error('Get user activity dashboard error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

// 获取用户登录详情
const getUserLoginDetails = async (req, res) => {
  try {
    const { period = 'today' } = req.query // today, week, month
    
    let dateRange
    if (period === 'today') {
      dateRange = getBeijingDateRange(0)
    } else if (period === 'week') {
      dateRange = getBeijingDateRange(-6)
      dateRange.end = getBeijingDateRange(0).end
    } else if (period === 'month') {
      dateRange = getBeijingDateRange(-29)
      dateRange.end = getBeijingDateRange(0).end
    } else {
      dateRange = getBeijingDateRange(0)
    }
    
    // 获取登录用户列表
    const users = await User.find({
      lastLoginAt: { $gte: dateRange.start, $lt: dateRange.end }
    }).select('username nickname phone email lastLoginAt').lean()
    
    // 为每个用户获取行为数据
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        // 浏览次数
        const browseCount = await BrowseHistory.countDocuments({ userId: user._id })
        
        // 收藏次数
        const favoriteCount = await Favorite.countDocuments({ userId: user._id })
        
        // 对比次数
        const compareCount = await Compare.countDocuments({ userId: user._id })
        
        // 购物车商品数
        const cartCount = await Cart.countDocuments({ userId: user._id })
        
        // 最近浏览的商品（最多6个）
        const recentBrowse = await BrowseHistory.find({ userId: user._id })
          .sort({ viewedAt: -1 })
          .limit(6)
          .select('productId productName thumbnail viewedAt')
          .lean()
        
        return {
          ...user,
          browseCount,
          favoriteCount,
          compareCount,
          cartCount,
          recentBrowse
        }
      })
    )
    
    // 按最后登录时间排序
    usersWithDetails.sort((a, b) => 
      new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
    )
    
    res.json(successResponse(usersWithDetails))
  } catch (err) {
    console.error('Get user login details error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  getDashboardData,
  getUserActivityDashboard,
  getUserLoginDetails
}
