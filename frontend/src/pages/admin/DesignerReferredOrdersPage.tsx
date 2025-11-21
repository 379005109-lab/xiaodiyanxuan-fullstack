import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, ChevronDown, ChevronUp, Link as LinkIcon } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface ReferredOrder {
  id: string
  orderNumber: string
  customerName: string
  referralLink: string
  totalAmount: number
  commission: number
  status: 'pending' | 'processing' | 'completed' | 'cancelled'
  createdAt: string
  items: {
    productName: string
    quantity: number
    price: number
  }[]
}

export default function DesignerReferredOrdersPage() {
  const [orders, setOrders] = useState<ReferredOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = () => {
    setLoading(true)
    try {
      // 从localStorage加载模拟数据
      const stored = JSON.parse(localStorage.getItem('designer_referred_orders') || '[]')
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

  const totalCommission = filteredOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.commission, 0)

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: '待提交' },
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
        <h1 className="text-3xl font-bold">推荐客户订单</h1>
        <p className="text-gray-600 mt-1">通过设计分享链接进入购买的订单</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <p className="text-sm text-gray-600">总订单数</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{orders.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">已完成订单</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {orders.filter(o => o.status === 'completed').length}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-600">累计佣金</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">{formatPrice(totalCommission)}</p>
        </div>
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
            <p className="text-gray-600">暂无推荐订单</p>
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
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                  {/* 商品列表 */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">订单商品</h4>
                    <div className="space-y-2">
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
                  </div>

                  {/* 佣金信息 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-blue-600 font-medium">订单金额</p>
                        <p className="text-lg font-bold text-blue-900 mt-1">{formatPrice(order.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600 font-medium">可获佣金</p>
                        <p className="text-lg font-bold text-blue-900 mt-1">{formatPrice(order.commission)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 分享链接 */}
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-2">分享链接</p>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 rounded border border-gray-200">
                      <LinkIcon className="h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={order.referralLink}
                        readOnly
                        className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(order.referralLink)
                          toast.success('链接已复制')
                        }}
                        className="text-xs px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                      >
                        复制
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  )
}
