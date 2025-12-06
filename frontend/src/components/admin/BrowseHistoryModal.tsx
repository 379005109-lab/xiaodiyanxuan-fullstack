import { useState, useEffect } from 'react'
import { X, Eye, Clock, ShoppingBag, ArrowRight, RefreshCw } from 'lucide-react'
import { getUserBrowsePath, getUserBrowseStats, BrowsePathItem, BrowseStats } from '@/services/browseHistoryService'
import { getFileUrl } from '@/services/uploadService'

interface BrowseHistoryModalProps {
  userId: string
  userName: string
  onClose: () => void
}

export default function BrowseHistoryModal({ userId, userName, onClose }: BrowseHistoryModalProps) {
  const [activeTab, setActiveTab] = useState<'path' | 'stats'>('path')
  const [browsePath, setBrowsePath] = useState<BrowsePathItem[]>([])
  const [stats, setStats] = useState<BrowseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  })

  useEffect(() => {
    loadData()
  }, [userId, dateRange])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pathData, statsData] = await Promise.all([
        getUserBrowsePath(userId, {
          startDate: dateRange.start || undefined,
          endDate: dateRange.end || undefined,
          limit: 200
        }),
        getUserBrowseStats(userId)
      ])
      setBrowsePath(pathData)
      setStats(statsData)
    } catch (error) {
      console.error('加载浏览历史失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      web: '网页端',
      miniapp: '小程序',
      admin: '管理后台',
      share: '分享链接'
    }
    return labels[source] || source
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-lg font-bold">用户浏览路径</h2>
            <p className="text-sm text-gray-500">{userName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 筛选和标签 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('path')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'path'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-1" />
                浏览路径
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'stats'
                    ? 'bg-primary text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4 inline mr-1" />
                浏览统计
              </button>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="input text-sm px-2 py-1"
              />
              <span className="text-gray-400">至</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="input text-sm px-2 py-1"
              />
              <button
                onClick={loadData}
                className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : activeTab === 'path' ? (
            <div className="space-y-2">
              {browsePath.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无浏览记录
                </div>
              ) : (
                browsePath.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    {/* 步骤指示器 */}
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                        {item.step}
                      </div>
                      {index < browsePath.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-200 my-1"></div>
                      )}
                    </div>

                    {/* 商品信息 */}
                    <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                      {item.productImage && (
                        <img
                          src={getFileUrl(item.productImage)}
                          alt={item.productName}
                          className="w-12 h-12 rounded object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {item.productName}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          {item.productCode && (
                            <span className="bg-gray-200 px-1.5 py-0.5 rounded">
                              {item.productCode}
                            </span>
                          )}
                          {item.categoryName && (
                            <span>{item.categoryName}</span>
                          )}
                          <span className="text-blue-500">{getSourceLabel(item.source)}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">{formatTime(item.viewedAt)}</div>
                        {item.intervalMinutes > 0 && (
                          <div className="text-xs text-gray-400 flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {item.intervalMinutes < 60
                              ? `${item.intervalMinutes}分钟后`
                              : `${Math.round(item.intervalMinutes / 60)}小时后`
                            }
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* 统计卡片 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">总浏览次数</div>
                  <div className="text-3xl font-bold text-blue-900">{stats?.totalViews || 0}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">今日浏览</div>
                  <div className="text-3xl font-bold text-green-900">{stats?.todayViews || 0}</div>
                </div>
              </div>

              {/* 常看分类 */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">常看分类 TOP5</h3>
                <div className="space-y-2">
                  {stats?.topCategories?.map((cat, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1 text-gray-700">{cat._id || '未分类'}</div>
                      <div className="text-sm text-gray-500">{cat.count}次</div>
                    </div>
                  ))}
                  {(!stats?.topCategories || stats.topCategories.length === 0) && (
                    <div className="text-gray-400 text-sm">暂无数据</div>
                  )}
                </div>
              </div>

              {/* 最近浏览 */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">最近浏览商品</h3>
                <div className="grid grid-cols-2 gap-3">
                  {stats?.recentProducts?.map((product) => (
                    <div key={product._id} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
                      {product.productImage && (
                        <img
                          src={getFileUrl(product.productImage)}
                          alt={product.productName}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.productName}
                        </div>
                        <div className="text-xs text-gray-500">
                          浏览{product.viewCount}次
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!stats?.recentProducts || stats.recentProducts.length === 0) && (
                    <div className="text-gray-400 text-sm col-span-2">暂无数据</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="p-4 border-t bg-gray-50 text-center text-sm text-gray-500">
          共 {browsePath.length} 条浏览记录
        </div>
      </div>
    </div>
  )
}
