import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, CheckCircle2, Package, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import axios from '@/lib/axios'
import { formatPrice } from '@/lib/utils'

// 后端使用数字状态: 1=待付款, 2=待发货, 3=待收货, 4=已完成, 5=已取消
const STATUS_LABELS: Record<string | number, string> = {
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '已完成',
  5: '已取消',
  pending: '待处理',
  processing: '处理中',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<string | number, string> = {
  1: 'bg-amber-100 text-amber-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-indigo-100 text-indigo-700',
  4: 'bg-emerald-100 text-emerald-700',
  5: 'bg-gray-200 text-gray-500',
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-blue-100 text-blue-700',
  paid: 'bg-teal-100 text-teal-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-200 text-gray-500',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const { user, token } = useAuthStore()

  useEffect(() => {
    if (!user || !token) {
      toast.error('请先登录')
      navigate('/login')
      return
    }
    loadOrders()
  }, [user, token, navigate])

  const loadOrders = async () => {
    setLoading(true)
    try {
      console.log('🔍 [Orders] Loading orders with token:', token?.slice(0, 20) + '...')
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      console.log('🔍 [Orders] Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('🔍 [Orders] Response data:', JSON.stringify(data, null, 2))
      console.log('🔍 [Orders] Orders count:', data.data?.length || 0)
      setOrders(data.data || [])
    } catch (error: any) {
      console.error('❌ [Orders] 加载订单失败', error)
      toast.error(error?.message || '加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  // 计算订单统计（支持数字和字符串状态）
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 1 || o.status === 'pending').length,
    processing: orders.filter(o => o.status === 2 || o.status === 'processing').length,
    completed: orders.filter(o => o.status === 4 || o.status === 'completed').length,
    totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">订单中心</h1>
          <p className="text-gray-600">管理您的所有订单</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">总订单</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="text-sm text-gray-600">待处理</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{stats.pending + stats.processing}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">已完成</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-sm text-gray-600">总金额</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatPrice(stats.totalAmount)}</p>
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="card py-16 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-3" />
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card py-16 text-center">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">暂无订单</p>
            <Link to="/packages" className="btn-primary inline-block">
              去下单
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusLabel = STATUS_LABELS[order.status] || order.status
              const statusColor = STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-500'
              
              return (
                <div key={order._id} className="card hover:shadow-lg transition-shadow">
                  <div className="p-4">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                        <span className="text-sm text-gray-600">
                          订单号: {order.orderNo || order._id}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary-600">
                          {formatPrice(order.totalAmount)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>

                    {/* Order Content - 区分普通订单和套餐订单 */}
                    {order.orderType === 'package' && order.packageInfo ? (
                      /* 套餐订单显示 */
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2 py-2 border-t border-gray-100">
                          <Package className="h-5 w-5 text-primary-600" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900">
                              {order.packageInfo.packageName}
                            </p>
                            <p className="text-xs text-gray-500">
                              套餐基础价: {formatPrice(order.packageInfo.packagePrice || 0)}
                              {order.packageInfo.totalUpgradePrice > 0 && (
                                <span className="text-red-600 font-semibold ml-2">
                                  材质加价: +¥{order.packageInfo.totalUpgradePrice}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {order.packageInfo.selections && order.packageInfo.selections.map((selection: any, idx: number) => (
                          <div key={idx} className="pl-7 py-1 border-l-2 border-gray-200 ml-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">{selection.categoryName}:</p>
                            {selection.products.map((p: any, pIdx: number) => {
                              // 获取材质信息（兼容中英文键名）
                              const materials = p.selectedMaterials || p.materials || {}
                              const fabric = materials.fabric || materials['面料'] || ''
                              const filling = materials.filling || materials['填充'] || ''
                              const frame = materials.frame || materials['框架'] || ''
                              const leg = materials.leg || materials['脚架'] || ''
                              const upgradePrices = p.materialUpgradePrices || {}
                              
                              return (
                                <div key={pIdx} className="text-xs text-gray-600 mb-2 bg-gray-50 rounded p-2">
                                  <p className="font-medium text-gray-800">{p.productName} x{p.quantity}</p>
                                  {/* 规格信息 */}
                                  {p.skuName && <p className="text-gray-500">规格: {p.skuName}</p>}
                                  {/* 材质信息 */}
                                  <div className="mt-1 space-y-0.5">
                                    {fabric && (
                                      <p>面料: <span className="text-gray-800">{fabric}</span>
                                        {(upgradePrices.fabric > 0 || upgradePrices['面料'] > 0) && 
                                          <span className="text-red-600 font-semibold ml-1">+¥{upgradePrices.fabric || upgradePrices['面料']}</span>}
                                      </p>
                                    )}
                                    {filling && (
                                      <p>填充: <span className="text-gray-800">{filling}</span>
                                        {(upgradePrices.filling > 0 || upgradePrices['填充'] > 0) && 
                                          <span className="text-red-600 font-semibold ml-1">+¥{upgradePrices.filling || upgradePrices['填充']}</span>}
                                      </p>
                                    )}
                                    {frame && (
                                      <p>框架: <span className="text-gray-800">{frame}</span>
                                        {(upgradePrices.frame > 0 || upgradePrices['框架'] > 0) && 
                                          <span className="text-red-600 font-semibold ml-1">+¥{upgradePrices.frame || upgradePrices['框架']}</span>}
                                      </p>
                                    )}
                                    {leg && (
                                      <p>脚架: <span className="text-gray-800">{leg}</span>
                                        {(upgradePrices.leg > 0 || upgradePrices['脚架'] > 0) && 
                                          <span className="text-red-600 font-semibold ml-1">+¥{upgradePrices.leg || upgradePrices['脚架']}</span>}
                                      </p>
                                    )}
                                  </div>
                                  {/* 商品小计 */}
                                  {(p.upgradePrice > 0 || p.materialUpgrade > 0) && (
                                    <p className="text-red-600 font-medium mt-1">商品加价: +¥{p.upgradePrice || p.materialUpgrade}</p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* 普通订单显示 */
                      <div className="space-y-2 mb-3">
                        {order.items && order.items.slice(0, 3).map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3 py-2 border-t border-gray-100">
                            {item.image && (
                              <img 
                                src={item.image.startsWith('http') ? item.image : `/api/files/${item.image}`}
                                alt={item.productName}
                                className="w-12 h-12 object-cover rounded"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                              <div className="text-xs space-y-0.5 mt-1">
                                {/* 规格 */}
                                {(item.specifications?.size || item.spec) && (
                                  <p className="text-gray-500">规格: <span className="text-gray-800">{item.specifications?.size || item.spec}</span></p>
                                )}
                                
                                {/* 面料 */}
                                {(item.specifications?.material || item.selectedMaterials?.fabric) && (
                                  <p className="text-gray-500">
                                    面料: <span className="text-gray-800">{item.specifications?.material || item.selectedMaterials?.fabric}</span>
                                    {item.materialUpgradePrices?.[item.specifications?.material || item.selectedMaterials?.fabric] > 0 && (
                                      <span className="text-red-600 font-semibold ml-2">+¥{item.materialUpgradePrices[item.specifications?.material || item.selectedMaterials?.fabric]}</span>
                                    )}
                                  </p>
                                )}
                                
                                {/* 填充 */}
                                {(item.specifications?.fill || item.selectedMaterials?.filling) && (
                                  <p className="text-gray-500">
                                    填充: <span className="text-gray-800">{item.specifications?.fill || item.selectedMaterials?.filling}</span>
                                    {item.materialUpgradePrices?.[item.specifications?.fill || item.selectedMaterials?.filling] > 0 && (
                                      <span className="text-red-600 font-semibold ml-2">+¥{item.materialUpgradePrices[item.specifications?.fill || item.selectedMaterials?.filling]}</span>
                                    )}
                                  </p>
                                )}
                                
                                {/* 框架 */}
                                {(item.specifications?.frame || item.selectedMaterials?.frame) && (
                                  <p className="text-gray-500">
                                    框架: <span className="text-gray-800">{item.specifications?.frame || item.selectedMaterials?.frame}</span>
                                    {item.materialUpgradePrices?.[item.specifications?.frame || item.selectedMaterials?.frame] > 0 && (
                                      <span className="text-red-600 font-semibold ml-2">+¥{item.materialUpgradePrices[item.specifications?.frame || item.selectedMaterials?.frame]}</span>
                                    )}
                                  </p>
                                )}
                                
                                {/* 脚架 */}
                                {(item.specifications?.leg || item.selectedMaterials?.leg) && (
                                  <p className="text-gray-500">
                                    脚架: <span className="text-gray-800">{item.specifications?.leg || item.selectedMaterials?.leg}</span>
                                    {item.materialUpgradePrices?.[item.specifications?.leg || item.selectedMaterials?.leg] > 0 && (
                                      <span className="text-red-600 font-semibold ml-2">+¥{item.materialUpgradePrices[item.specifications?.leg || item.selectedMaterials?.leg]}</span>
                                    )}
                                  </p>
                                )}
                                
                                <p className="text-gray-600 font-medium pt-1">
                                  数量: {item.quantity} | 单价: {formatPrice(item.price)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {order.items && order.items.length > 3 && (
                          <p className="text-xs text-gray-500 text-center py-1">
                            还有 {order.items.length - 3} 件商品...
                          </p>
                        )}
                      </div>
                    )}

                    {/* Recipient Info */}
                    {order.recipient && (
                      <div className="border-t border-gray-100 pt-3 mb-3">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">收货人:</span> {order.recipient.name}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">电话:</span> {order.recipient.phone}
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">地址:</span> {order.recipient.address}
                        </p>
                      </div>
                    )}

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
