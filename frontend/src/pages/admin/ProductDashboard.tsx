import { useState, useMemo } from 'react'
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

type TimePeriod = 'week' | 'month' | 'quarter' | 'year'

export default function ProductDashboard() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // 模拟商品热度数据
  const heatData = useMemo(() => {
    if (!product) return { views: 0, sales: 0, favorites: 0 }
    return {
      views: Math.floor(Math.random() * 5000) + 1000,
      sales: Math.floor(Math.random() * 500) + 50,
      favorites: Math.floor(Math.random() * 300) + 20,
    }
  }, [product])

  // 模拟收益数据
  const revenueData = useMemo(() => {
    const baseRevenue = (product?.basePrice || 0) * (heatData.sales || 0)
    return {
      week: baseRevenue * 0.2,
      month: baseRevenue,
      quarter: baseRevenue * 3.2,
      year: baseRevenue * 12,
    }
  }, [product, heatData])

  // 模拟销售趋势数据
  const salesTrendData = useMemo(() => {
    if (timePeriod === 'week') {
      return [
        { name: '周一', sales: 12, revenue: 2400 },
        { name: '周二', sales: 19, revenue: 2210 },
        { name: '周三', sales: 15, revenue: 2290 },
        { name: '周四', sales: 22, revenue: 2000 },
        { name: '周五', sales: 28, revenue: 2181 },
        { name: '周六', sales: 35, revenue: 2500 },
        { name: '周日', sales: 31, revenue: 2100 },
      ]
    } else if (timePeriod === 'month') {
      return [
        { name: '第1周', sales: 87, revenue: 17400 },
        { name: '第2周', sales: 95, revenue: 19000 },
        { name: '第3周', sales: 112, revenue: 22400 },
        { name: '第4周', sales: 128, revenue: 25600 },
      ]
    } else if (timePeriod === 'quarter') {
      return [
        { name: '1月', sales: 234, revenue: 46800 },
        { name: '2月', sales: 267, revenue: 53400 },
        { name: '3月', sales: 289, revenue: 57800 },
      ]
    } else {
      return [
        { name: '1月', sales: 234, revenue: 46800 },
        { name: '2月', sales: 267, revenue: 53400 },
        { name: '3月', sales: 289, revenue: 57800 },
        { name: '4月', sales: 312, revenue: 62400 },
        { name: '5月', sales: 298, revenue: 59600 },
        { name: '6月', sales: 334, revenue: 66800 },
        { name: '7月', sales: 356, revenue: 71200 },
        { name: '8月', sales: 378, revenue: 75600 },
        { name: '9月', sales: 401, revenue: 80200 },
        { name: '10月', sales: 423, revenue: 84600 },
        { name: '11月', sales: 445, revenue: 89000 },
        { name: '12月', sales: 467, revenue: 93400 },
      ]
    }
  }, [timePeriod])

  // 模拟SKU销售排名
  const skuRankingData = useMemo(() => {
    if (!product?.skus) return []
    return product.skus.map((sku: any, index: number) => ({
      name: sku.spec || `规格${index + 1}`,
      sales: Math.floor(Math.random() * 200) + 10,
      revenue: Math.floor(Math.random() * 50000) + 5000,
    }))
  }, [product])

  // 加载商品数据
  useMemo(() => {
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

  if (loading) {
    return <div className="text-center py-12">加载中...</div>
  }

  if (!product) {
    return <div className="text-center py-12">商品不存在</div>
  }

  const currentRevenue = revenueData[timePeriod]
  const totalSales = salesTrendData.reduce((sum, item) => sum + item.sales, 0)

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
              <h3 className="text-3xl font-bold">{heatData.views.toLocaleString()}</h3>
              <p className="text-xs text-green-600 mt-2">↑ 12.5% vs 上周</p>
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
              <h3 className="text-3xl font-bold">{heatData.sales}</h3>
              <p className="text-xs text-green-600 mt-2">↑ 8.3% vs 上周</p>
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
              <h3 className="text-3xl font-bold">{heatData.favorites}</h3>
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
            <h3 className="text-2xl font-bold text-blue-900">{formatPrice(currentRevenue)}</h3>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">销售件数</p>
            <h3 className="text-2xl font-bold text-green-900">{totalSales}</h3>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">平均单价</p>
            <h3 className="text-2xl font-bold text-purple-900">
              {formatPrice(currentRevenue / (totalSales || 1))}
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
          <LineChart data={salesTrendData}>
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
      {skuRankingData.length > 0 && (
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
                {skuRankingData.map((sku: any, index: number) => {
                  const totalRevenue = skuRankingData.reduce((sum: number, s: any) => sum + s.revenue, 0)
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
