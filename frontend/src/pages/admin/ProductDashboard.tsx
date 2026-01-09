import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, TrendingUp, Eye, ShoppingCart, Heart, Calendar } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatPrice } from '@/lib/utils'
import { getProductById } from '@/services/productService'
import apiClient from '@/lib/apiClient'

type TimePeriod = 'week' | 'month' | 'quarter' | 'year'

interface StatsData {
  views: number
  viewsGrowth: number
  sales: number
  salesGrowth: number
  favorites: number
  revenue: number
  trendData: Array<{ name: string; sales: number; revenue: number }>
  skuRankingData: Array<{ name: string; sales: number; revenue: number }>
}

export default function ProductDashboard() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(false)
  const [stats, setStats] = useState<StatsData>({
    views: 0,
    viewsGrowth: 0,
    sales: 0,
    salesGrowth: 0,
    favorites: 0,
    revenue: 0,
    trendData: [],
    skuRankingData: []
  })

  // 加载商品数据
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId) return
      try {
        const data = await getProductById(productId)
        setProduct(data)
      } catch (error) {
        console.error('加载商品失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [productId])

  // 加载统计数据
  useEffect(() => {
    const loadStats = async () => {
      if (!productId) return
      setStatsLoading(true)
      try {
        const res = await apiClient.get(`/products/${productId}/stats`, {
          params: { period: timePeriod }
        })
        if (res.data?.success) {
          setStats(res.data.data)
        }
      } catch (error) {
        console.error('加载统计数据失败:', error)
      } finally {
        setStatsLoading(false)
      }
    }
    loadStats()
  }, [productId, timePeriod])

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  if (!product) {
    return <div className="text-center py-12">商品不存在</div>
  }

  const totalSales = stats.trendData.reduce((sum, item) => sum + item.sales, 0)

  return (
    <div className="space-y-6">
      {/* 返回按钮和标题 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          返回商品列表
        </button>
        <h1 className="text-3xl font-bold">{product.name} - 数据看板</h1>
      </div>

      {/* 商品基本信息 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6 flex items-center gap-6"
      >
        {product.images?.[0] && (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-24 h-24 rounded-lg object-cover"
          />
        )}
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
          <p className="text-gray-600 mb-3">{product.description || '暂无描述'}</p>
          <div className="flex gap-6">
            <div>
              <p className="text-sm text-gray-600">基础价格</p>
              <p className="text-lg font-semibold">{formatPrice(product.basePrice)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">SKU数量</p>
              <p className="text-lg font-semibold">{product.skus?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">分类</p>
              <p className="text-lg font-semibold">{product.category}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 热度指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">浏览量</p>
              <h3 className="text-3xl font-bold">{statsLoading ? '-' : stats.views.toLocaleString()}</h3>
              <p className={`text-xs mt-2 ${stats.viewsGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.viewsGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.viewsGrowth)}% vs 上一周期
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">销售量</p>
              <h3 className="text-3xl font-bold">{statsLoading ? '-' : stats.sales}</h3>
              <p className={`text-xs mt-2 ${stats.salesGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.salesGrowth >= 0 ? '↑' : '↓'} {Math.abs(stats.salesGrowth)}% vs 上一周期
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">收藏数</p>
              <h3 className="text-3xl font-bold">{statsLoading ? '-' : stats.favorites}</h3>
              <p className="text-xs text-green-600 mt-2">↑ 5.2% vs 上周</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 收益统计 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">收益统计</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setTimePeriod('week')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timePeriod === 'week'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              周
            </button>
            <button
              onClick={() => setTimePeriod('month')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timePeriod === 'month'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              月
            </button>
            <button
              onClick={() => setTimePeriod('quarter')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timePeriod === 'quarter'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              季
            </button>
            <button
              onClick={() => setTimePeriod('year')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                timePeriod === 'year'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              年
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">总销售额</p>
            <h3 className="text-2xl font-bold text-blue-900">{formatPrice(stats.revenue)}</h3>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">销售件数</p>
            <h3 className="text-2xl font-bold text-green-900">{totalSales}</h3>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">平均单价</p>
            <h3 className="text-2xl font-bold text-purple-900">
              {formatPrice(stats.revenue / (totalSales || 1))}
            </h3>
          </div>
        </div>
      </motion.div>

      {/* 销售趋势图 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card p-6"
      >
        <h3 className="text-lg font-semibold mb-4">销售趋势</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={stats.trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              stroke="#3B82F6"
              strokeWidth={2}
              name="销售件数"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#10B981"
              strokeWidth={2}
              name="销售额"
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* SKU销售排名 */}
      {stats.skuRankingData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <h3 className="text-lg font-semibold mb-4">SKU销售排名</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">规格</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">销售件数</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">销售额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">占比</th>
                </tr>
              </thead>
              <tbody>
                {stats.skuRankingData.map((sku: any, index: number) => {
                  const totalRevenue = stats.skuRankingData.reduce((sum: number, s: any) => sum + s.revenue, 0)
                  const percentage = ((sku.revenue / totalRevenue) * 100).toFixed(1)
                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{sku.name}</td>
                      <td className="py-3 px-4 text-sm">{sku.sales}</td>
                      <td className="py-3 px-4 text-sm">{formatPrice(sku.revenue)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  )
}
