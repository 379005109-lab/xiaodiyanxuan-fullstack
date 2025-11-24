import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Package, DollarSign, Clock, CheckCircle, AlertCircle, BarChart3 } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Order, OrderStatus } from '@/types'
import axios from '@/lib/axios'

interface DashboardStats {
  totalOrders: number
  totalRevenue: number
  pendingOrders: number
  completedOrders: number
  avgOrderValue: number
  statusBreakdown: Record<OrderStatus, number>
}

interface ChartData {
  date: string
  orders: number
  revenue: number
}

export default function OrderDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    avgOrderValue: 0,
    statusBreakdown: {
      pending: 0,
      processing: 0,
      paid: 0,
      shipped: 0,
      completed: 0,
      cancelled: 0,
      refunding: 0,
      refunded: 0,
    },
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      let allOrders: Order[] = []

      // 从本地存储读取订单（管理后台使用本地存储）
      const stored = localStorage.getItem('orders') || localStorage.getItem('local_orders')
      allOrders = stored ? JSON.parse(stored) : []
      console.log('📊 订单数据看板：从本地存储读取', allOrders.length, '个订单')

      // 计算统计数据
      const totalOrders = allOrders.length
      const totalRevenue = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // 统计各状态订单
      const statusBreakdown: Record<OrderStatus, number> = {
        pending: 0,
        processing: 0,
        paid: 0,
        shipped: 0,
        completed: 0,
        cancelled: 0,
        refunding: 0,
        refunded: 0,
      }

      allOrders.forEach((order) => {
        statusBreakdown[order.status]++
      })

      const pendingOrders = statusBreakdown.pending + statusBreakdown.processing
      const completedOrders = statusBreakdown.completed

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders,
        avgOrderValue,
        statusBreakdown,
      })

      // 获取最近10个订单
      const recentOrdersList = allOrders
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
      setRecentOrders(recentOrdersList)

      // 生成图表数据（按日期统计）
      const dateMap = new Map<string, { orders: number; revenue: number }>()
      allOrders.forEach((order) => {
        const date = new Date(order.createdAt).toLocaleDateString('zh-CN')
        const existing = dateMap.get(date) || { orders: 0, revenue: 0 }
        existing.orders++
        existing.revenue += order.totalAmount || 0
        dateMap.set(date, existing)
      })

      const chartDataArray = Array.from(dateMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-7) // 只显示最近7天

      setChartData(chartDataArray)
    } catch (error) {
      console.error('加载仪表板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const statusConfig: Record<OrderStatus, { label: string; color: string; bgColor: string }> = {
    pending: { label: '待付款', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    processing: { label: '处理中', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    paid: { label: '已付款', color: 'text-green-700', bgColor: 'bg-green-100' },
    shipped: { label: '已发货', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    completed: { label: '已完成', color: 'text-gray-700', bgColor: 'bg-gray-100' },
    cancelled: { label: '已取消', color: 'text-red-700', bgColor: 'bg-red-100' },
    refunding: { label: '退款中', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    refunded: { label: '已退款', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-bold">订单数据看板</h1>
        <p className="text-gray-600 mt-1">实时订单统计和分析</p>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 总订单数 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">总订单数</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalOrders}</p>
            </div>
            <Package className="h-12 w-12 text-blue-300 opacity-50" />
          </div>
        </motion.div>

        {/* 总收入 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-br from-green-50 to-green-100 border border-green-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">总收入</p>
              <p className="text-3xl font-bold text-green-600">{formatPrice(stats.totalRevenue)}</p>
            </div>
            <DollarSign className="h-12 w-12 text-green-300 opacity-50" />
          </div>
        </motion.div>

        {/* 待处理订单 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">待处理订单</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
            </div>
            <Clock className="h-12 w-12 text-yellow-300 opacity-50" />
          </div>
        </motion.div>

        {/* 平均订单金额 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">平均订单金额</p>
              <p className="text-3xl font-bold text-purple-600">{formatPrice(stats.avgOrderValue)}</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-300 opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* 订单状态分布 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          订单状态分布
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {Object.entries(stats.statusBreakdown).map(([status, count]) => {
            const config = statusConfig[status as OrderStatus]
            return (
              <div key={status} className="text-center">
                <div className={`${config.bgColor} ${config.color} rounded-lg p-4 mb-2`}>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
                <p className="text-xs text-gray-600">{config.label}</p>
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* 日期统计图表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <h2 className="text-xl font-semibold mb-6">最近7天订单趋势</h2>
        <div className="space-y-4">
          {chartData.length > 0 ? (
            chartData.map((data, index) => {
              const maxOrders = Math.max(...chartData.map((d) => d.orders), 1)
              const maxRevenue = Math.max(...chartData.map((d) => d.revenue), 1)
              const orderWidth = (data.orders / maxOrders) * 100
              const revenueWidth = (data.revenue / maxRevenue) * 100

              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{data.date}</span>
                    <span className="text-gray-600">
                      {data.orders} 订单 · {formatPrice(data.revenue)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <div className="bg-blue-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full transition-all"
                          style={{ width: `${orderWidth}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="bg-green-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-green-500 h-full transition-all"
                          style={{ width: `${revenueWidth}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-gray-500 text-center py-8">暂无数据</p>
          )}
        </div>
      </motion.div>

      {/* 最近订单列表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="card"
      >
        <h2 className="text-xl font-semibold mb-6">最近订单</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">订单号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">客户</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">金额</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">商品数</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">时间</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => {
                  const config = statusConfig[order.status]
                  const customerName =
                    typeof order.user === 'string' ? order.user : (order.user as any)?.name || '未知客户'

                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{order.orderNo}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{customerName}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-primary-600">{formatPrice(order.totalAmount)}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700">{order.items?.length || 0}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${config.bgColor} ${config.color}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    暂无订单数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  )
}
