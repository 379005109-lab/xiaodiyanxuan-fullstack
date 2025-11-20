import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  totalAmount: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
  items: {
    productName: string
    quantity: number
    price: number
  }[]
}

export default function DesignerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const enterConciergeMode = useCartStore((state) => state.enterConciergeMode)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = () => {
    setLoading(true)
    try {
      // 从localStorage加载模拟数据
      const stored = JSON.parse(localStorage.getItem('designer_orders') || '[]')
      setOrders(stored)
    } catch (error) {
      console.error('加载订单失败:', error)
      toast.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders
    .filter(order => {
      if (searchQuery && !order.orderNumber.includes(searchQuery) && !order.customerName.includes(searchQuery)) {
        return false
      }
      if (filterStatus && order.status !== filterStatus) {
        return false
      }
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-700', label: '待处理' },
      processing: { bg: 'bg-blue-50', text: 'text-blue-700', label: '处理中' },
      completed: { bg: 'bg-green-50', text: 'text-green-700', label: '已完成' },
      cancelled: { bg: 'bg-red-50', text: 'text-red-700', label: '已取消' },
    }
    const config = statusMap[status] || statusMap.pending
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const handleConciergeOrder = (order: Order) => {
    // 获取客户电话（从订单中提取或使用默认值）
    const customerPhone = (order as any).customerPhone || '13800138000'
    
    // 将订单商品转换为简化格式
    const simpleItems = order.items.map((item, index) => ({
      id: `order-item-${order.id}-${index}`,
      name: item.productName,
      price: item.price,
      quantity: item.quantity,
      image: '/placeholder.svg'
    }))

    // 进入代客下单模式，传递订单来源（设计师订单默认为'self'）
    enterConciergeMode(order.id, order.customerName, customerPhone, simpleItems, 'self')
    
    // 保存到sessionStorage以便在新标签页中恢复
    sessionStorage.setItem('conciergeOrderData', JSON.stringify({
      orderId: order.id,
      customerName: order.customerName,
      customerPhone: customerPhone,
      orderSource: 'self',
      items: simpleItems
    }))
    
    toast.success(`已进入代客下单模式，客户：${order.customerName}`)
    
    // 打开购物车页面
    window.open('/cart', '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-bold">我的订单</h1>
        <p className="text-gray-600 mt-1">共 {orders.length} 个订单</p>
      </div>

      {/* 筛选栏 */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订单号或客户名称..."
              className="input pl-10 w-full"
            />
          </div>

          {/* 状态筛选 */}
          <div className="w-full md:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input w-full"
            >
              <option value="">所有状态</option>
              <option value="pending">待处理</option>
              <option value="processing">处理中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">暂无订单</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="card hover:shadow-md transition-shadow">
              {/* 订单头部 */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">订单号: {order.orderNumber}</p>
                      <p className="text-sm text-gray-600 mt-1">客户: {order.customerName}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-600">{formatPrice(order.totalAmount)}</p>
                    <p className="text-xs text-gray-600 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                    {expandedOrderId === order.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* 订单详情 */}
              {expandedOrderId === order.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">订单商品</h4>
                  <div className="space-y-2 mb-4">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-600">数量: {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-gray-900">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* 代客下单按钮 */}
                  <button
                    onClick={() => handleConciergeOrder(order)}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    代客下单
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}
