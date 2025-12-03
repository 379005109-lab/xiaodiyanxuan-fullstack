import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, TrendingDown, Package, DollarSign, 
  Calendar, BarChart3, PieChart, Users, MapPin,
  Clock, ShoppingBag, Percent, RefreshCw
} from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'

interface AnalysisData {
  // 时间维度分析
  hourlyDistribution: { hour: number; count: number; revenue: number }[]
  weekdayDistribution: { day: string; count: number; revenue: number }[]
  monthlyTrend: { month: string; count: number; revenue: number }[]
  
  // 商品分析
  topProducts: { name: string; count: number; revenue: number }[]
  categoryDistribution: { category: string; count: number; percentage: number }[]
  
  // 客户分析
  customerStats: {
    totalCustomers: number
    repeatCustomers: number
    repeatRate: number
    avgOrdersPerCustomer: number
  }
  
  // 订单金额分布
  amountDistribution: { range: string; count: number; percentage: number }[]
  
  // 转化率
  conversionStats: {
    cartToOrder: number
    orderToPaid: number
    paidToComplete: number
  }
}

export default function OrderAnalysis() {
  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // 最近30天

  useEffect(() => {
    loadAnalysisData()
  }, [dateRange])

  const loadAnalysisData = async () => {
    setLoading(true)
    try {
      const response = await apiClient.get(`/orders/analysis?days=${dateRange}`)
      if (response.data.success) {
        setData(response.data.data)
      }
    } catch (error) {
      console.error('加载分析数据失败:', error)
      // 使用模拟数据
      setData(getMockData())
    } finally {
      setLoading(false)
    }
  }

  // 模拟数据（当API不可用时使用）
  const getMockData = (): AnalysisData => ({
    hourlyDistribution: Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: Math.floor(Math.random() * 20),
      revenue: Math.floor(Math.random() * 50000)
    })),
    weekdayDistribution: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map(day => ({
      day,
      count: Math.floor(Math.random() * 50),
      revenue: Math.floor(Math.random() * 100000)
    })),
    monthlyTrend: ['1月', '2月', '3月', '4月', '5月', '6月'].map(month => ({
      month,
      count: Math.floor(Math.random() * 200),
      revenue: Math.floor(Math.random() * 500000)
    })),
    topProducts: [
      { name: '柯布西耶沙发', count: 15, revenue: 293700 },
      { name: '地平线沙发', count: 12, revenue: 215880 },
      { name: '蛋椅', count: 10, revenue: 89900 },
      { name: '巴塞罗那椅', count: 8, revenue: 71920 },
      { name: '天鹅椅', count: 6, revenue: 53940 }
    ],
    categoryDistribution: [
      { category: '沙发', count: 45, percentage: 35 },
      { category: '椅子', count: 38, percentage: 30 },
      { category: '桌子', count: 25, percentage: 20 },
      { category: '灯具', count: 12, percentage: 10 },
      { category: '其他', count: 6, percentage: 5 }
    ],
    customerStats: {
      totalCustomers: 156,
      repeatCustomers: 42,
      repeatRate: 26.9,
      avgOrdersPerCustomer: 1.8
    },
    amountDistribution: [
      { range: '0-5000', count: 25, percentage: 20 },
      { range: '5000-10000', count: 35, percentage: 28 },
      { range: '10000-20000', count: 30, percentage: 24 },
      { range: '20000-50000', count: 25, percentage: 20 },
      { range: '50000+', count: 10, percentage: 8 }
    ],
    conversionStats: {
      cartToOrder: 45.2,
      orderToPaid: 78.5,
      paidToComplete: 92.3
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!data) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 页头 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">订单分析</h1>
          <p className="text-gray-600 mt-1">深度分析订单数据，洞察业务趋势</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="7">最近7天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
            <option value="365">最近一年</option>
          </select>
          <button
            onClick={loadAnalysisData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            刷新
          </button>
        </div>
      </div>

      {/* 客户统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-gradient-to-br from-blue-50 to-blue-100"
        >
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">总客户数</p>
              <p className="text-2xl font-bold text-blue-600">{data.customerStats.totalCustomers}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card bg-gradient-to-br from-green-50 to-green-100"
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">复购客户</p>
              <p className="text-2xl font-bold text-green-600">{data.customerStats.repeatCustomers}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card bg-gradient-to-br from-purple-50 to-purple-100"
        >
          <div className="flex items-center gap-3">
            <Percent className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">复购率</p>
              <p className="text-2xl font-bold text-purple-600">{data.customerStats.repeatRate}%</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card bg-gradient-to-br from-orange-50 to-orange-100"
        >
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">人均订单数</p>
              <p className="text-2xl font-bold text-orange-600">{data.customerStats.avgOrdersPerCustomer}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 热销商品 TOP5 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            热销商品 TOP5
          </h3>
          <div className="space-y-3">
            {data.topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-400 text-yellow-900' :
                  index === 1 ? 'bg-gray-300 text-gray-700' :
                  index === 2 ? 'bg-orange-300 text-orange-800' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{product.name}</p>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>销量: {product.count}</span>
                    <span>收入: {formatPrice(product.revenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 品类分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary-600" />
            品类分布
          </h3>
          <div className="space-y-3">
            {data.categoryDistribution.map((cat, index) => {
              const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-gray-400']
              return (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{cat.category}</span>
                    <span>{cat.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[index % colors.length]} transition-all`}
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* 订单金额分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-600" />
            订单金额分布
          </h3>
          <div className="space-y-3">
            {data.amountDistribution.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>¥{item.range}</span>
                  <span>{item.count} 单 ({item.percentage}%)</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 转化漏斗 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary-600" />
            转化漏斗
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <div className="bg-blue-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">加购 → 下单</p>
                <p className="text-2xl font-bold text-blue-600">{data.conversionStats.cartToOrder}%</p>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-2">
                <TrendingDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div className="relative">
              <div className="bg-green-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">下单 → 支付</p>
                <p className="text-2xl font-bold text-green-600">{data.conversionStats.orderToPaid}%</p>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-2">
                <TrendingDown className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <div className="bg-purple-100 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-600">支付 → 完成</p>
                <p className="text-2xl font-bold text-purple-600">{data.conversionStats.paidToComplete}%</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 每周订单分布 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="card"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary-600" />
          每周订单分布
        </h3>
        <div className="grid grid-cols-7 gap-2">
          {data.weekdayDistribution.map((item, index) => {
            const maxCount = Math.max(...data.weekdayDistribution.map(d => d.count))
            const height = (item.count / maxCount) * 100
            return (
              <div key={index} className="text-center">
                <div className="h-32 flex items-end justify-center mb-2">
                  <div
                    className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600"
                    style={{ height: `${height}%`, minHeight: '8px' }}
                  />
                </div>
                <p className="text-sm font-medium">{item.day}</p>
                <p className="text-xs text-gray-500">{item.count} 单</p>
              </div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

