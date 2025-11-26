import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Clock, CheckCircle2, Truck, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'

export default function OrdersPageNew() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

  // 检查登录状态
  useEffect(() => {
    if (!user || !token) {
      toast.error('请先登录')
      openLogin()
      navigate('/')
      return
    }
    loadOrders()
  }, [user, token, filterStatus])

  const loadOrders = async () => {
    try {
      setLoading(true)
      console.log('🔍 [Orders] Loading orders with token:', token?.slice(0, 20) + '...')
      
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      console.log('🔍 [Orders] Response status:', response.status)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      console.log('🔍 [Orders] Response data:', JSON.stringify(data, null, 2))
      console.log('🔍 [Orders] Orders count:', data.data?.length || 0)
      
      setOrders(data.data || [])
    } catch (error) {
      console.error('❌ [Orders] 加载订单失败:', error)
      toast.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('确定要取消这个订单吗？')) return
    
    try {
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) throw new Error('取消订单失败')
      
      toast.success('订单已取消')
      loadOrders()
    } catch (error) {
      console.error('取消订单失败:', error)
      toast.error('取消订单失败')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('确定要删除这个订单吗？删除后无法恢复。')) return
    
    try {
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('删除订单失败')
      
      toast.success('订单已删除')
      loadOrders()
    } catch (error) {
      console.error('删除订单失败:', error)
      toast.error('删除订单失败')
    }
  }

  // 后端使用数字状态: 1=待付款, 2=待发货, 3=待收货, 4=已完成, 5=已取消
  const statusConfig: Record<string | number, { label: string; color: string; icon: React.ReactNode }> = {
    1: { label: '待付款', color: 'text-orange-600 bg-orange-50', icon: <Clock className="w-4 h-4" /> },
    2: { label: '待发货', color: 'text-blue-600 bg-blue-50', icon: <Package className="w-4 h-4" /> },
    3: { label: '待收货', color: 'text-purple-600 bg-purple-50', icon: <Truck className="w-4 h-4" /> },
    4: { label: '已完成', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 className="w-4 h-4" /> },
    5: { label: '已取消', color: 'text-red-600 bg-red-50', icon: <X className="w-4 h-4" /> },
    pending: { label: '待付款', color: 'text-orange-600 bg-orange-50', icon: <Clock className="w-4 h-4" /> },
    paid: { label: '已付款', color: 'text-blue-600 bg-blue-50', icon: <Package className="w-4 h-4" /> },
    shipped: { label: '已发货', color: 'text-purple-600 bg-purple-50', icon: <Truck className="w-4 h-4" /> },
    completed: { label: '已完成', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 className="w-4 h-4" /> },
    cancelled: { label: '已取消', color: 'text-red-600 bg-red-50', icon: <X className="w-4 h-4" /> },
  }

  const statusOptions = [
    { value: '', label: '全部订单' },
    { value: 'pending', label: '待付款' },
    { value: 'paid', label: '已付款' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">我的订单</h1>
            <p className="text-stone-500 uppercase tracking-widest text-xs">My Orders ({orders.length})</p>
          </div>
        </div>

        {/* 状态筛选 */}
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm mb-8">
          <div className="flex flex-wrap gap-3">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === option.value
                    ? 'bg-primary text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 订单列表 */}
        {orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
            <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-400 font-serif italic mb-4">暂无订单记录</p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-green-900 transition-colors"
            >
              去购物 <Package className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order._id || order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                {/* 订单头部 */}
                <div className="flex justify-between items-center px-6 py-4 bg-stone-50 border-b border-stone-100">
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'text-stone-600 bg-stone-50'}`}>
                      {statusConfig[order.status]?.icon}
                      {statusConfig[order.status]?.label || `未知状态`}
                    </div>
                    <span className="text-sm text-stone-500">{new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-red-600">¥{(order.totalAmount || 0).toLocaleString()}</span>
                  </div>
                </div>

                {/* 订单商品列表 */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.orderType === 'package' && order.packageInfo ? (
                      // 套餐订单
                      order.packageInfo.selections?.map((selection: any, idx: number) => (
                        selection.products?.map((product: any, pIdx: number) => (
                          <div key={`${idx}-${pIdx}`} className="flex gap-4">
                            <div className="w-20 h-20 bg-stone-100 rounded-lg flex-shrink-0 overflow-hidden">
                              {product.image ? (
                                <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400">
                                  <Package className="w-8 h-8" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-medium text-stone-800 truncate">{product.productName}</h4>
                              <p className="text-sm text-stone-500 mt-1">
                                {selection.categoryName} / {product.materials ? Object.entries(product.materials).map(([k, v]) => `${v}`).join(' / ') : '标准款'} × {product.quantity || 1}
                              </p>
                            </div>
                          </div>
                        ))
                      ))
                    ) : (
                      // 普通商品订单
                      order.items?.map((item: any, idx: number) => (
                        <div key={idx} className="flex gap-4">
                          <div className="w-20 h-20 bg-stone-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Package className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-medium text-stone-800 truncate">{item.name}</h4>
                            <p className="text-sm text-stone-500 mt-1">× {item.quantity || 1}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* 收货信息 */}
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <p className="text-sm text-stone-500 mb-1">ORD{order.orderNo || order.orderNumber}</p>
                    <p className="text-sm text-stone-800">
                      <span className="text-stone-600">收货人：</span>{order.recipient?.name || '未填写'}
                    </p>
                    <p className="text-sm text-stone-800 mt-1">
                      <span className="text-stone-600">电话：</span>{order.recipient?.phone || '未填写'}
                    </p>
                    <p className="text-sm text-stone-800 mt-1">
                      <span className="text-stone-600">地址：</span>{order.recipient?.address || '未填写'}
                    </p>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="mt-4 flex gap-3 justify-end">
                    {(order.status === 1 || order.status === 'pending') && (
                      <button
                        onClick={() => handleCancelOrder(order._id || order.id)}
                        className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        取消订单
                      </button>
                    )}
                    {(order.status === 5 || order.status === 'cancelled' || order.status === 4 || order.status === 'completed') && (
                      <button
                        onClick={() => handleDeleteOrder(order._id || order.id)}
                        className="px-4 py-2 text-sm border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
                      >
                        删除订单
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
