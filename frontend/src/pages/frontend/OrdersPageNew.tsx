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
      // 这里应该调用真实的API
      // const response = await getCustomerOrders()
      // setOrders(response.data)
      setOrders([]) // 暂时设为空数组
    } catch (error) {
      console.error('加载订单失败:', error)
      toast.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
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
              <div key={order.id} className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-primary">订单 #{order.orderNumber}</h3>
                    <p className="text-sm text-stone-500">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusConfig[order.status]?.color || 'text-stone-600 bg-stone-50'}`}>
                    {statusConfig[order.status]?.icon}
                    {statusConfig[order.status]?.label || '未知状态'}
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-stone-600">
                      共 {order.items?.length || 0} 件商品
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-stone-500">订单金额</p>
                      <p className="font-serif font-bold text-xl text-accent">{formatPrice(order.totalAmount || 0)}</p>
                    </div>
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
