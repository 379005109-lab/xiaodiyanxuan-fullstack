import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, Download, Package } from 'lucide-react'
import { Order } from '@/types'
import { toast } from 'sonner'
import OrderCard from '@/components/admin/OrderCard'
import OrderDetailPanel from '@/components/admin/OrderDetailPanel'

// 状态筛选选项
const statusOptions = [
  { value: '', label: '全部订单' },
  { value: '1', label: '待付款' },
  { value: '2', label: '已付款' },
  { value: '3', label: '待发货' },
  { value: '4', label: '已发货' },
  { value: '5', label: '已完成' },
  { value: '6', label: '已取消' },
]

export default function OrderManagementNew() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // 统计数据
  const stats = {
    pending: orders.filter(o => o.status === 1 || o.status === 'pending').length,
    paid: orders.filter(o => o.status === 2 || o.status === 'paid').length,
    shipping: orders.filter(o => o.status === 3 || o.status === 4 || o.status === 'processing' || o.status === 'shipped').length,
    completed: orders.filter(o => o.status === 5 || o.status === 'completed').length,
  }

  // 加载订单
  useEffect(() => {
    loadOrders()
  }, [filterStatus, page])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('请先登录')
        navigate('/')
        return
      }
      
      let url = `https://pkochbpmcgaa.sealoshzh.site/api/orders?page=${page}&pageSize=20`
      if (filterStatus) {
        url += `&status=${filterStatus}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.status === 401) {
        localStorage.removeItem('token')
        toast.error('登录已过期，请重新登录')
        navigate('/')
        return
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      let allOrders: Order[] = data.data || []
      
      // 应用搜索
      if (searchQuery) {
        allOrders = allOrders.filter(o => 
          o.orderNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.recipient?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.recipient?.phone?.includes(searchQuery)
        )
      }
      
      setOrders(allOrders)
      setTotal(data.pagination?.total || allOrders.length)
      setTotalPages(data.pagination?.totalPages || Math.ceil(allOrders.length / 20))
      
    } catch (error: any) {
      console.error('加载订单失败:', error)
      toast.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  // 处理状态变更
  const handleStatusChange = async (orderId: string, newStatus: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (response.ok) {
        toast.success('订单状态已更新')
        loadOrders()
      }
    } catch (error) {
      console.error('更新状态失败:', error)
    }
  }

  // 搜索
  const handleSearch = () => {
    loadOrders()
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 页头 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-800">订单中心</h1>
        <p className="text-sm text-gray-500">ORDER MANAGEMENT</p>
      </div>

      {/* 统计栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            <div className="text-xs text-gray-500">待付款</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.paid}</div>
            <div className="text-xs text-gray-500">待发货</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">{stats.shipping}</div>
            <div className="text-xs text-gray-500">配送中</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-xs text-gray-500">已完成</div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          {/* 搜索框 */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单号、收货人..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* 状态筛选 */}
          <div className="flex items-center gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  filterStatus === option.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 导出按钮 */}
          <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">
            <Download className="w-4 h-4" />
            导出数据
          </button>
        </div>
      </div>

      {/* 主内容区：左侧列表 + 右侧详情 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧订单列表 */}
        <div className="w-1/2 border-r border-gray-200 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Package className="w-12 h-12 mb-2" />
              <p>暂无订单数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  isSelected={selectedOrder?._id === order._id}
                  onClick={() => setSelectedOrder(order)}
                />
              ))}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
              >
                上一页
              </button>
              <span className="text-sm text-gray-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm bg-gray-100 rounded disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          )}
        </div>

        {/* 右侧详情面板 */}
        <div className="w-1/2 bg-gray-50 overflow-hidden">
          {selectedOrder ? (
            <OrderDetailPanel
              order={selectedOrder}
              onClose={() => setSelectedOrder(null)}
              onStatusChange={handleStatusChange}
              showFollowUp={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Package className="w-12 h-12 mb-2" />
              <p>选择一个订单查看详情</p>
            </div>
          )}
        </div>
      </div>

      {/* 底部信息 */}
      <div className="bg-white border-t border-gray-200 px-6 py-2 text-sm text-gray-500">
        共 {total} 个订单
      </div>
    </div>
  )
}
