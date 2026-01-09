import { useEffect, useState } from 'react'
import { Users, Eye, Heart, GitCompare, ShoppingCart, TrendingUp, Crown, Calendar } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getFileUrl } from '@/services/uploadService'

interface ActivityData {
  loginStats: { today: number; week: number; month: number }
  browseStats: { today: number; week: number; month: number }
  favoriteStats: { today: number; week: number; month: number }
  compareStats: { today: number; week: number; month: number }
  cartStats: { today: number; week: number; month: number }
  topActiveUsers: Array<{
    _id: string
    nickname?: string
    phone?: string
    username?: string
    lastLoginAt?: string
    browseCount: number
    favoriteCount: number
    compareCount: number
    cartCount: number
    activityScore: number
  }>
  topBrowsedProducts: Array<{ _id: string; productName: string; thumbnail?: string; browseCount: number }>
  topFavoritedProducts: Array<{ _id: string; productName: string; thumbnail?: string; favoriteCount: number }>
  topComparedProducts: Array<{ _id: string; productName?: string; thumbnail?: string; compareCount: number }>
  loginTrend: Array<{ date: string; dayName: string; count: number }>
}

export default function ActivityDashboard() {
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await apiClient.get('/dashboard/activity')
        setData(response.data.data)
      } catch (error) {
        console.error('获取活跃度数据失败:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-8 text-gray-500">加载数据失败</div>
  }

  const StatCard = ({ title, icon: Icon, today, week, month, color }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">{today}</p>
          <p className="text-xs text-gray-500">今日</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{week}</p>
          <p className="text-xs text-gray-500">本周</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">{month}</p>
          <p className="text-xs text-gray-500">本月</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">用户活跃度看板</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          {new Date().toLocaleDateString('zh-CN')}
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="用户登录"
          icon={Users}
          today={data.loginStats.today}
          week={data.loginStats.week}
          month={data.loginStats.month}
          color="bg-blue-500"
        />
        <StatCard
          title="商品浏览"
          icon={Eye}
          today={data.browseStats.today}
          week={data.browseStats.week}
          month={data.browseStats.month}
          color="bg-purple-500"
        />
        <StatCard
          title="商品收藏"
          icon={Heart}
          today={data.favoriteStats.today}
          week={data.favoriteStats.week}
          month={data.favoriteStats.month}
          color="bg-red-500"
        />
        <StatCard
          title="商品对比"
          icon={GitCompare}
          today={data.compareStats.today}
          week={data.compareStats.week}
          month={data.compareStats.month}
          color="bg-orange-500"
        />
        <StatCard
          title="加入购物车"
          icon={ShoppingCart}
          today={data.cartStats.today}
          week={data.cartStats.week}
          month={data.cartStats.month}
          color="bg-green-500"
        />
      </div>

      {/* 登录趋势图 */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          近7天用户登录趋势
        </h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {data.loginTrend.map((item, index) => {
            const maxCount = Math.max(...data.loginTrend.map(d => d.count), 1)
            const height = (item.count / maxCount) * 100
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs text-gray-600 font-medium">{item.count}</span>
                <div
                  className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                  style={{ height: `${Math.max(height, 5)}%` }}
                />
                <div className="text-center">
                  <p className="text-xs text-gray-500">{item.dayName}</p>
                  <p className="text-xs text-gray-400">{item.date}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最活跃用户 TOP 10 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            最活跃用户 TOP 10
          </h3>
          <div className="space-y-3">
            {data.topActiveUsers.map((user, index) => (
              <div
                key={user._id}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  index < 3 ? 'bg-yellow-50 border border-yellow-100' : 'bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-400 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {user.nickname || user.phone || user.username || '未知用户'}
                  </p>
                  <p className="text-xs text-gray-500">
                    活跃度: {user.activityScore} · 浏览: {user.browseCount} · 收藏: {user.favoriteCount} · 对比: {user.compareCount} · 加购: {user.cartCount}
                  </p>
                </div>
                {index < 3 && (
                  <span className="text-lg">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                )}
              </div>
            ))}
            {data.topActiveUsers.length === 0 && (
              <p className="text-center text-gray-500 py-4">暂无数据</p>
            )}
          </div>
        </div>

        {/* 热门商品 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-purple-500" />
            被浏览最多的商品 TOP 10
          </h3>
          <div className="space-y-3">
            {data.topBrowsedProducts.map((product, index) => (
              <div key={product._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <span className="w-6 text-center text-sm font-medium text-gray-500">{index + 1}</span>
                {product.thumbnail ? (
                  <img
                    src={getFileUrl(product.thumbnail)}
                    alt={product.productName}
                    className="w-10 h-10 rounded object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.productName || '未知商品'}</p>
                </div>
                <span className="text-sm font-semibold text-purple-600">{product.browseCount} 次</span>
              </div>
            ))}
            {data.topBrowsedProducts.length === 0 && (
              <p className="text-center text-gray-500 py-4">暂无数据</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 被收藏最多的商品 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            被收藏最多的商品 TOP 10
          </h3>
          <div className="space-y-3">
            {data.topFavoritedProducts.map((product, index) => (
              <div key={product._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <span className="w-6 text-center text-sm font-medium text-gray-500">{index + 1}</span>
                {product.thumbnail ? (
                  <img
                    src={getFileUrl(product.thumbnail)}
                    alt={product.productName}
                    className="w-10 h-10 rounded object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.productName || '未知商品'}</p>
                </div>
                <span className="text-sm font-semibold text-red-600">{product.favoriteCount} 次</span>
              </div>
            ))}
            {data.topFavoritedProducts.length === 0 && (
              <p className="text-center text-gray-500 py-4">暂无数据</p>
            )}
          </div>
        </div>

        {/* 被对比最多的商品 */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-orange-500" />
            被对比最多的商品 TOP 10
          </h3>
          <div className="space-y-3">
            {data.topComparedProducts.map((product, index) => (
              <div key={product._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                <span className="w-6 text-center text-sm font-medium text-gray-500">{index + 1}</span>
                {product.thumbnail ? (
                  <img
                    src={getFileUrl(product.thumbnail)}
                    alt={product.productName || '商品'}
                    className="w-10 h-10 rounded object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center">
                    <GitCompare className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.productName || '未知商品'}</p>
                </div>
                <span className="text-sm font-semibold text-orange-600">{product.compareCount} 次</span>
              </div>
            ))}
            {data.topComparedProducts.length === 0 && (
              <p className="text-center text-gray-500 py-4">暂无数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
