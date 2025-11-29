import { useState, useEffect } from 'react'
import { 
  Search, RotateCcw, Package, Check, X, AlertCircle, Clock,
  CheckCircle2, XCircle, ChevronDown, Eye, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { Order } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'

// 退货状态配置
const refundStatusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  'pending': { label: '待处理', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'approved': { label: '已同意', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'rejected': { label: '已拒绝', color: 'text-red-600', bgColor: 'bg-red-100' },
  'completed': { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100' },
}

// 退货原因选项
const refundReasons = [
  '商品质量问题',
  '商品与描述不符',
  '尺寸/颜色选错',
  '不喜欢/不想要',
  '物流太慢',
  '商品破损',
  '其他原因'
]

interface RefundItem {
  _id: string
  orderId: string
  orderNo: string
  products: Array<{
    name: string
    image?: string
    quantity: number
    price: number
    sku?: string
  }>
  reason: string
  customReason?: string
  status: string
  totalAmount: number
  createdAt: string
  updatedAt?: string
  buyerName?: string
  buyerPhone?: string
}

export default function RefundManagementNew() {
  const [refunds, setRefunds] = useState<RefundItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [searchOrderNo, setSearchOrderNo] = useState('')
  const [foundOrder, setFoundOrder] = useState<Order | null>(null)
  const [showNewRefundModal, setShowNewRefundModal] = useState(false)
  const [showOrderSelectModal, setShowOrderSelectModal] = useState(false)
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [refundReason, setRefundReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all')

  // 统计数据
  const stats = {
    all: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    completed: refunds.filter(r => ['approved', 'rejected', 'completed'].includes(r.status)).length
  }

  useEffect(() => {
    loadRefunds()
    loadOrders()
  }, [])

  const loadRefunds = async () => {
    try {
      // 从localStorage加载退货记录（实际应从API加载）
      const savedRefunds = localStorage.getItem('refund_records')
      if (savedRefunds) {
        setRefunds(JSON.parse(savedRefunds))
      }
    } catch (error) {
      console.error('加载退货记录失败:', error)
    }
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/orders?pageSize=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      if (data.success) {
        // 只显示已付款及以后状态的订单
        const eligibleOrders = (data.data || []).filter((o: Order) => 
          o.status !== 1 && o.status !== 'pending' && o.status !== 6 && o.status !== 'cancelled'
        )
        setOrders(eligibleOrders)
      }
    } catch (error) {
      console.error('加载订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索订单
  const handleSearchOrder = async () => {
    if (!searchOrderNo.trim()) {
      toast.error('请输入订单号')
      return
    }
    
    const order = orders.find(o => o.orderNo === searchOrderNo.trim())
    if (order) {
      setFoundOrder(order)
    } else {
      toast.error('未找到该订单')
      setFoundOrder(null)
    }
  }

  // 创建退货申请
  const handleCreateRefund = (order: Order) => {
    if (!refundReason) {
      toast.error('请选择退货原因')
      return
    }
    
    const recipient = (order.recipient || order.shippingAddress) as any
    const products = order.items || (order as any).products || []
    
    const newRefund: RefundItem = {
      _id: `refund_${Date.now()}`,
      orderId: order._id,
      orderNo: order.orderNo,
      products: products.map((p: any) => ({
        name: p.name || p.productName,
        image: p.image,
        quantity: p.quantity || 1,
        price: p.price || p.unitPrice || 0,
        sku: p.skuName || p.sku
      })),
      reason: refundReason,
      customReason: refundReason === '其他原因' ? customReason : undefined,
      status: 'pending',
      totalAmount: order.totalAmount,
      createdAt: new Date().toISOString(),
      buyerName: recipient?.name,
      buyerPhone: recipient?.phone
    }
    
    const updatedRefunds = [...refunds, newRefund]
    setRefunds(updatedRefunds)
    localStorage.setItem('refund_records', JSON.stringify(updatedRefunds))
    
    toast.success('退货申请已创建')
    setShowNewRefundModal(false)
    setFoundOrder(null)
    setSearchOrderNo('')
    setRefundReason('')
    setCustomReason('')
  }

  // 批量创建退货
  const handleBatchCreateRefund = () => {
    if (selectedOrders.length === 0) {
      toast.error('请选择订单')
      return
    }
    if (!refundReason) {
      toast.error('请选择退货原因')
      return
    }
    
    const newRefunds: RefundItem[] = selectedOrders.map(orderId => {
      const order = orders.find(o => o._id === orderId)!
      const recipient = (order.recipient || order.shippingAddress) as any
      const products = order.items || (order as any).products || []
      
      return {
        _id: `refund_${Date.now()}_${orderId}`,
        orderId: order._id,
        orderNo: order.orderNo,
        products: products.map((p: any) => ({
          name: p.name || p.productName,
          image: p.image,
          quantity: p.quantity || 1,
          price: p.price || p.unitPrice || 0,
          sku: p.skuName || p.sku
        })),
        reason: refundReason,
        customReason: refundReason === '其他原因' ? customReason : undefined,
        status: 'pending',
        totalAmount: order.totalAmount,
        createdAt: new Date().toISOString(),
        buyerName: recipient?.name,
        buyerPhone: recipient?.phone
      }
    })
    
    const updatedRefunds = [...refunds, ...newRefunds]
    setRefunds(updatedRefunds)
    localStorage.setItem('refund_records', JSON.stringify(updatedRefunds))
    
    toast.success(`已创建 ${newRefunds.length} 个退货申请`)
    setShowOrderSelectModal(false)
    setSelectedOrders([])
    setRefundReason('')
    setCustomReason('')
  }

  // 处理退货
  const handleProcessRefund = (refundId: string, action: 'approved' | 'rejected') => {
    const updatedRefunds = refunds.map(r => 
      r._id === refundId 
        ? { ...r, status: action, updatedAt: new Date().toISOString() }
        : r
    )
    setRefunds(updatedRefunds)
    localStorage.setItem('refund_records', JSON.stringify(updatedRefunds))
    toast.success(action === 'approved' ? '已同意退货' : '已拒绝退货')
  }

  // 完成退货
  const handleCompleteRefund = (refundId: string) => {
    const updatedRefunds = refunds.map(r => 
      r._id === refundId 
        ? { ...r, status: 'completed', updatedAt: new Date().toISOString() }
        : r
    )
    setRefunds(updatedRefunds)
    localStorage.setItem('refund_records', JSON.stringify(updatedRefunds))
    toast.success('退货已完成')
  }

  // 删除退货记录
  const handleDeleteRefund = (refundId: string) => {
    if (!confirm('确定要删除这条退货记录吗？')) return
    
    const updatedRefunds = refunds.filter(r => r._id !== refundId)
    setRefunds(updatedRefunds)
    localStorage.setItem('refund_records', JSON.stringify(updatedRefunds))
    toast.success('已删除')
  }

  // 筛选退货记录
  const filteredRefunds = refunds.filter(r => {
    if (activeTab === 'pending') return r.status === 'pending'
    if (activeTab === 'completed') return ['approved', 'rejected', 'completed'].includes(r.status)
    return true
  })

  return (
    <div className="p-6">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">退货管理</h1>
          <p className="text-gray-500 mt-1">管理订单退货申请</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowOrderSelectModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Package className="w-4 h-4" />
            从订单选择
          </button>
          <button
            onClick={() => setShowNewRefundModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700"
          >
            <RotateCcw className="w-4 h-4" />
            新建退货
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`p-4 rounded-xl border-2 transition-all ${
            activeTab === 'all' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">全部退货</p>
          <p className="text-2xl font-bold mt-1">{stats.all}</p>
        </button>
        
        <button
          onClick={() => setActiveTab('pending')}
          className={`p-4 rounded-xl border-2 transition-all ${
            activeTab === 'pending' 
              ? 'border-orange-500 bg-orange-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">待处理</p>
          <p className="text-2xl font-bold mt-1 text-orange-600">{stats.pending}</p>
        </button>
        
        <button
          onClick={() => setActiveTab('completed')}
          className={`p-4 rounded-xl border-2 transition-all ${
            activeTab === 'completed' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">已处理</p>
          <p className="text-2xl font-bold mt-1 text-green-600">{stats.completed}</p>
        </button>
      </div>

      {/* 退货列表 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">订单信息</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">商品</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">退货原因</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">金额</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">状态</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredRefunds.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                  暂无退货记录
                </td>
              </tr>
            ) : (
              filteredRefunds.map(refund => {
                const status = refundStatusConfig[refund.status] || refundStatusConfig['pending']
                return (
                  <tr key={refund._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-blue-600">{refund.orderNo}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {refund.buyerName} · {new Date(refund.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {refund.products[0]?.image && (
                          <img 
                            src={getFileUrl(refund.products[0].image)} 
                            alt=""
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-sm truncate max-w-[150px]">{refund.products[0]?.name}</p>
                          {refund.products.length > 1 && (
                            <p className="text-xs text-gray-400">等 {refund.products.length} 件商品</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{refund.reason}</p>
                      {refund.customReason && (
                        <p className="text-xs text-gray-400 mt-1">{refund.customReason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-red-600">¥{formatPrice(refund.totalAmount)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${status.bgColor} ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {refund.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleProcessRefund(refund._id, 'approved')}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="同意退货"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleProcessRefund(refund._id, 'rejected')}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="拒绝退货"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {refund.status === 'approved' && (
                          <button
                            onClick={() => handleCompleteRefund(refund._id)}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            完成退货
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteRefund(refund._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 新建退货弹窗 */}
      {showNewRefundModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">新建退货申请</h2>
              <button onClick={() => setShowNewRefundModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 搜索订单 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">输入订单号</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchOrderNo}
                  onChange={(e) => setSearchOrderNo(e.target.value)}
                  placeholder="请输入订单号..."
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchOrder()}
                />
                <button
                  onClick={handleSearchOrder}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >
                  搜索
                </button>
              </div>
            </div>
            
            {/* 找到的订单 */}
            {foundOrder && (
              <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">{foundOrder.orderNo}</p>
                    <p className="text-sm text-gray-500">
                      {(foundOrder.recipient || foundOrder.shippingAddress)?.name} · 
                      ¥{formatPrice(foundOrder.totalAmount)}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-sm text-gray-600">
                  共 {foundOrder.items?.length || 0} 件商品
                </div>
              </div>
            )}
            
            {/* 退货原因 */}
            {foundOrder && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">退货原因</label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">请选择退货原因</option>
                    {refundReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                
                {refundReason === '其他原因' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">详细说明</label>
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="请描述退货原因..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                  </div>
                )}
                
                <button
                  onClick={() => handleCreateRefund(foundOrder)}
                  className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
                >
                  创建退货申请
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 从订单选择弹窗 */}
      {showOrderSelectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">选择订单</h2>
              <button onClick={() => setShowOrderSelectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 订单列表 */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {orders.map(order => {
                  const isSelected = selectedOrders.includes(order._id)
                  const recipient = (order.recipient || order.shippingAddress) as any
                  return (
                    <div
                      key={order._id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedOrders(prev => prev.filter(id => id !== order._id))
                        } else {
                          setSelectedOrders(prev => [...prev, order._id])
                        }
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{order.orderNo}</p>
                          <p className="text-sm text-gray-500">
                            {recipient?.name} · {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">¥{formatPrice(order.totalAmount)}</p>
                          <p className="text-sm text-gray-500">{order.items?.length || 0} 件</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* 底部操作 */}
            {selectedOrders.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">退货原因</label>
                  <select
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="">请选择退货原因</option>
                    {refundReasons.map(reason => (
                      <option key={reason} value={reason}>{reason}</option>
                    ))}
                  </select>
                </div>
                
                {refundReason === '其他原因' && (
                  <div className="mb-4">
                    <textarea
                      value={customReason}
                      onChange={(e) => setCustomReason(e.target.value)}
                      placeholder="请描述退货原因..."
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                    />
                  </div>
                )}
                
                <button
                  onClick={handleBatchCreateRefund}
                  className="w-full py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium"
                >
                  为 {selectedOrders.length} 个订单创建退货申请
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
