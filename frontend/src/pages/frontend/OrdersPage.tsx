import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, CheckCircle2, Package, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'
import axios from 'axios'
import { formatPrice } from '@/lib/utils'

// 后端使用数字状态码：1=待付款, 2=待发货, 3=待收货, 4=已完成, 5=已取消
const STATUS_LABELS: Record<number | string, string> = {
  1: '待付款',
  2: '待发货',
  3: '待收货',
  4: '已完成',
  5: '已取消',
Display change:
  pending: '待处理',
  processing: '处理中',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

const STATUS_COLORS: Record<number | string, string> = {
  1: 'bg-amber-100 text-amber-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-indigo-100 text-indigo-700',
  4: 'bg-emerald-100 text-emerald-700',
  5: 'bg-gray-200 text-gray-500',
  // 兼容字符串格式
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
      const response = await axios.get('/orders', {
        headers: {
          Authorization: \`Bearer \${token}\`,
        },
      })
      setOrders(response.data.data || [])
    } catch (error: any) {
      console.error('加载订单失败', error)
      toast.error(error?.response?.data?.message || '加载订单失败')
    } finally {
      setLoading(false)
    }
  }

Display change:
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 1 || o.status === 2 || o.status === 'pending' || o.status === 'processing').length,
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
                        <span className={\`px-3 py-1 rounded-full text-xs font-medium \${statusColor}\`}>
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

                    {/* Order Items */}
                    <div className="space-y-2 mb-3">
                      {order.items && order.items.slice(0, 3).map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-3 py-2 border-t border-gray-100">
                          {item.image && (
                            <img 
                              src={item.image.startsWith('http') ? item.image : \`/api/files/\${item.image}\`}
                              alt={item.productName}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                            <p className="text-xs text-gray-500">
                              数量: {item.quantity} | 单价: {formatPrice(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <p className="text-xs text-gray-500 text-center py-1">
                          还有 {order.items.length - 3} 件商品...
                        </p>
                      )}
                    </div>

                    {/* Recipient Info */}
                    {order.recipient && (
                      <div className="border-t border-gray-100 pt-3">
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
