import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Trash2, RotateCcw, AlertCircle, Package, Clock, Phone, MapPin, ChevronDown, Sparkles } from 'lucide-react'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import { getFileUrl } from '@/services/uploadService'

interface Order {
  _id: string
  orderNo: string
  orderType?: string
  packageInfo?: any
  items?: any[]
  totalAmount: number
  status: number | string
  recipient?: { name: string; phone: string; address: string }
  shippingAddress?: { name: string; phone: string; address: string }
  createdAt: string
  deletedAt?: string
}

const statusConfig: Record<string | number, { label: string; color: string }> = {
  1: { label: '待付款', color: 'bg-yellow-100 text-yellow-700' },
  2: { label: '待发货', color: 'bg-blue-100 text-blue-700' },
  3: { label: '待收货', color: 'bg-purple-100 text-purple-700' },
  4: { label: '已完成', color: 'bg-green-100 text-green-700' },
  5: { label: '已取消', color: 'bg-red-100 text-red-700' },
  pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  paid: { label: '已付款', color: 'bg-teal-100 text-teal-700' },
  shipped: { label: '已发货', color: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
}

export default function OrderTrashPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/trash/list?page=${page}&pageSize=10000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.data?.orders || [])
        setTotal(data.data?.total || 0)
        setTotalPages(data.data?.totalPages || 1)
      }
    } catch (error) {
      console.error('加载回收站订单失败:', error)
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [page])

  const handleRestore = async (orderId: string) => {
    if (!window.confirm('确定要恢复此订单吗？')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/${orderId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast.success('订单已恢复')
        loadOrders()
      } else {
        toast.error('恢复失败')
      }
    } catch (error) {
      toast.error('恢复失败')
    }
  }

  const handlePermanentDelete = async (orderId: string) => {
    if (!window.confirm('⚠️ 确定要永久删除此订单吗？此操作不可恢复！')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/orders/${orderId}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        toast.success('订单已永久删除')
        loadOrders()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="h-6 w-6 text-gray-400" />
            订单回收站
          </h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 个已删除订单</p>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border">
            <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">回收站为空</p>
          </div>
        ) : (
          orders.map((order) => {
            const isExpanded = expandedOrder === order._id
            
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-75"
              >
                {/* 订单头部 */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                  className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    {/* 订单类型图标 */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      order.orderType === 'package' ? 'bg-amber-100' : 'bg-gray-100'
                    }`}>
                      {order.orderType === 'package' ? (
                        <Sparkles className="h-5 w-5 text-amber-600" />
                      ) : (
                        <Package className="h-5 w-5 text-gray-600" />
                      )}
                    </div>
                    
                    {/* 订单信息 */}
                    <div className="min-w-0 flex-1">
                      <p className="text-base text-gray-900 font-bold truncate">{order.orderNo}</p>
                      <p className="text-sm text-gray-500">
                        删除时间: {order.deletedAt ? new Date(order.deletedAt).toLocaleString() : '-'}
                      </p>
                    </div>
                  </div>

                  {/* 金额 */}
                  <div className="text-right flex-shrink-0 mr-4">
                    <p className="text-xl font-bold text-gray-400">{formatPrice(order.totalAmount)}</p>
                  </div>

                  {/* 状态 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {statusConfig[order.status]?.label || order.status}
                    </span>
                    <ChevronDown className={`h-5 w-5 transition-transform text-gray-600 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {/* 套餐订单显示 */}
                    {order.orderType === 'package' && order.packageInfo ? (
                      <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                        <div className="flex items-center gap-2 text-amber-700 font-semibold mb-4 text-base">
                          <Sparkles className="h-4 w-4" /> 套餐: {order.packageInfo.packageName}
                        </div>
                        <div className="space-y-2">
                          {order.packageInfo.selections?.map((selection: any, idx: number) => (
                            <div key={idx} className="bg-white rounded-lg p-3 border border-amber-100">
                              <p className="font-semibold text-gray-800 text-sm mb-2">{selection.categoryName}</p>
                              {selection.products?.map((product: any, pIdx: number) => (
                                <div key={pIdx} className="ml-3 text-xs text-gray-600">
                                  {product.productName} x{product.quantity}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* 普通订单显示 */
                      order.items && order.items.length > 0 && (
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="space-y-2">
                            {order.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-2">
                                {item.image && (
                                  <img src={getFileUrl(item.image)} alt="" className="w-12 h-12 object-cover rounded" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm truncate">{item.productName}</p>
                                  <p className="text-xs text-gray-500">数量: {item.quantity} × {formatPrice(item.price)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}

                    {/* 收货信息 */}
                    <div className="p-4 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
                      {(order.recipient?.phone || order.shippingAddress?.phone) && (
                        <p className="flex items-center gap-2 text-gray-700 text-sm">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {order.recipient?.phone || order.shippingAddress?.phone}
                        </p>
                      )}
                      {(order.recipient?.address || order.shippingAddress?.address) && (
                        <p className="flex items-start gap-2 text-gray-700 text-sm">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{order.recipient?.address || order.shippingAddress?.address}</span>
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-gray-600 text-sm">
                        <Clock className="h-4 w-4 text-gray-400" />
                        创建时间: {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleRestore(order._id)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <RotateCcw className="h-4 w-4" />
                        恢复订单
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(order._id)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        永久删除
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })
        )}
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-gray-600">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}
