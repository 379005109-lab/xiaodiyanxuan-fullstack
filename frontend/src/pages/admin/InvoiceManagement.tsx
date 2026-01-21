import { useState, useEffect } from 'react'
import { FileText, Search, Filter, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import axios from '@/lib/axios'
import { formatPrice } from '@/lib/utils'

interface InvoiceOrder {
  _id: string
  orderNo: string
  totalAmount: number
  needInvoice: boolean
  invoiceInfo?: {
    invoiceType: 'personal' | 'company'
    title: string
    taxNumber?: string
    bankName?: string
    bankAccount?: string
    companyAddress?: string
    companyPhone?: string
    email?: string
    phone?: string
    mailingAddress?: string
  }
  invoiceMarkupPercent?: number
  invoiceMarkupAmount?: number
  invoiceStatus?: 'pending' | 'processing' | 'issued' | 'sent'
  invoiceIssuedAt?: string
  recipient?: {
    name: string
    phone: string
    address: string
  }
  createdAt: string
  status: number
}

const invoiceStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待开票', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: '开票中', color: 'bg-blue-100 text-blue-800', icon: AlertCircle },
  issued: { label: '已开票', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  sent: { label: '已寄出', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
}

export default function InvoiceManagement() {
  const [orders, setOrders] = useState<InvoiceOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<InvoiceOrder | null>(null)

  // 加载需要开票的订单
  const loadInvoiceOrders = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/orders', {
        params: { pageSize: 100 }
      })
      const allOrders = response.data?.data || response.data?.orders || []
      // 过滤需要开票的订单
      const invoiceOrders = allOrders.filter((order: any) => order.needInvoice)
      setOrders(invoiceOrders)
    } catch (error) {
      console.error('加载开票订单失败:', error)
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoiceOrders()
  }, [])

  // 更新开票状态
  const updateInvoiceStatus = async (orderId: string, status: string) => {
    try {
      await axios.put(`/orders/${orderId}/invoice-status`, { invoiceStatus: status })
      toast.success('状态已更新')
      loadInvoiceOrders()
      setSelectedOrder(null)
    } catch (error) {
      toast.error('更新失败')
    }
  }

  // 过滤订单
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchKeyword || 
      order.orderNo?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      order.invoiceInfo?.title?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      order.recipient?.name?.toLowerCase().includes(searchKeyword.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || 
      (order.invoiceStatus || 'pending') === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // 统计数据
  const stats = {
    total: orders.length,
    pending: orders.filter(o => !o.invoiceStatus || o.invoiceStatus === 'pending').length,
    processing: orders.filter(o => o.invoiceStatus === 'processing').length,
    issued: orders.filter(o => o.invoiceStatus === 'issued').length,
    sent: orders.filter(o => o.invoiceStatus === 'sent').length,
    totalAmount: orders.reduce((sum, o) => sum + (o.invoiceMarkupAmount || 0), 0)
  }

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-amber-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">开票管理</h1>
            <p className="text-sm text-gray-500">管理所有需要开票的订单</p>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border">
          <p className="text-sm text-gray-500">总开票订单</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
          <p className="text-sm text-yellow-700">待开票</p>
          <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
          <p className="text-sm text-blue-700">开票中</p>
          <p className="text-2xl font-bold text-blue-800">{stats.processing}</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
          <p className="text-sm text-green-700">已开票</p>
          <p className="text-2xl font-bold text-green-800">{stats.issued + stats.sent}</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-4 shadow-sm border border-amber-200">
          <p className="text-sm text-amber-700">开票加价总额</p>
          <p className="text-2xl font-bold text-amber-800">¥{stats.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="搜索订单号、发票抬头、客户名称..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">待开票</option>
            <option value="processing">开票中</option>
            <option value="issued">已开票</option>
            <option value="sent">已寄出</option>
          </select>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">加载中...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">暂无需要开票的订单</div>
        ) : (
          <div className="divide-y">
            {filteredOrders.map((order) => {
              const status = invoiceStatusMap[order.invoiceStatus || 'pending']
              const StatusIcon = status.icon
              return (
                <div
                  key={order._id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-gray-600">{order.orderNo}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          <StatusIcon className="w-3 h-3 inline mr-1" />
                          {status.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {order.invoiceInfo?.invoiceType === 'company' ? '企业' : '个人'}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          发票抬头: {order.invoiceInfo?.title || '-'}
                        </p>
                        {order.invoiceInfo?.taxNumber && (
                          <p className="text-sm text-gray-500">税号: {order.invoiceInfo.taxNumber}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>客户: {order.recipient?.name}</span>
                          <span>电话: {order.recipient?.phone}</span>
                          {order.invoiceInfo?.email && <span>邮箱: {order.invoiceInfo.email}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                      {order.invoiceMarkupAmount > 0 && (
                        <p className="text-sm text-amber-600">
                          含开票加价 +¥{order.invoiceMarkupAmount?.toLocaleString()}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 订单详情弹窗 */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">开票详情</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* 订单信息 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">订单号</p>
                <p className="font-mono">{selectedOrder.orderNo}</p>
                <p className="text-sm text-gray-500 mb-1 mt-3">订单金额</p>
                <p className="text-xl font-bold">{formatPrice(selectedOrder.totalAmount)}</p>
                {selectedOrder.invoiceMarkupAmount > 0 && (
                  <p className="text-sm text-amber-600">
                    含开票加价: +¥{selectedOrder.invoiceMarkupAmount?.toLocaleString()} ({selectedOrder.invoiceMarkupPercent}%)
                  </p>
                )}
              </div>

              {/* 发票信息 */}
              <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                <p className="font-medium text-amber-800 mb-3">🧾 发票信息</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">发票类型</span>
                    <span className="font-medium">{selectedOrder.invoiceInfo?.invoiceType === 'company' ? '企业发票' : '个人发票'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">发票抬头</span>
                    <span className="font-medium">{selectedOrder.invoiceInfo?.title}</span>
                  </div>
                  {selectedOrder.invoiceInfo?.taxNumber && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">税号</span>
                      <span className="font-mono text-xs">{selectedOrder.invoiceInfo.taxNumber}</span>
                    </div>
                  )}
                  {selectedOrder.invoiceInfo?.bankName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">开户银行</span>
                      <span>{selectedOrder.invoiceInfo.bankName}</span>
                    </div>
                  )}
                  {selectedOrder.invoiceInfo?.bankAccount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">银行账号</span>
                      <span className="font-mono text-xs">{selectedOrder.invoiceInfo.bankAccount}</span>
                    </div>
                  )}
                  {selectedOrder.invoiceInfo?.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">收票邮箱</span>
                      <span>{selectedOrder.invoiceInfo.email}</span>
                    </div>
                  )}
                  {selectedOrder.invoiceInfo?.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">收票手机</span>
                      <span>{selectedOrder.invoiceInfo.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 客户信息 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="font-medium text-gray-700 mb-2">客户信息</p>
                <div className="text-sm space-y-1">
                  <p>姓名: {selectedOrder.recipient?.name}</p>
                  <p>电话: {selectedOrder.recipient?.phone}</p>
                  <p>地址: {selectedOrder.recipient?.address}</p>
                </div>
              </div>

              {/* 更新状态按钮 */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">更新开票状态</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateInvoiceStatus(selectedOrder._id, 'processing')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                  >
                    标记为开票中
                  </button>
                  <button
                    onClick={() => updateInvoiceStatus(selectedOrder._id, 'issued')}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
                  >
                    标记为已开票
                  </button>
                  <button
                    onClick={() => updateInvoiceStatus(selectedOrder._id, 'sent')}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm"
                  >
                    标记为已寄出
                  </button>
                  <button
                    onClick={() => updateInvoiceStatus(selectedOrder._id, 'pending')}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                  >
                    重置为待开票
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
