import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ClipboardList, Clock, CheckCircle2, MapPin, Phone, Package, MessageSquare, ChevronDown, Sparkles, ShoppingCart, Copy, Printer, TrendingUp, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { CustomerOrder, OrderStatus, PackageSelectionGroup } from '@/types'
import { getCustomerOrders, updateOrderStatus, updateCustomerOrder, deleteCustomerOrder } from '@/services/customerOrderService'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'
import { mapCustomerOrderToCartItems } from '@/utils/conciergeHelper'

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: '待确认' },
  { value: 'processing', label: '待支付' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  processing: 'bg-[#E8F0FF] text-[#3E76FF]',
  paid: 'bg-teal-100 text-teal-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-gray-200 text-gray-500',
  refunding: 'bg-rose-100 text-rose-700',
  refunded: 'bg-rose-50 text-rose-600',
}

const ALLOWED_STATUS_SET: Set<OrderStatus> = new Set(['pending', 'processing', 'completed', 'cancelled'])
const formatCurrency = (value: number) => `¥${value.toLocaleString()}`

export default function OrdersPage() {
  const [orders, setOrders] = useState<CustomerOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'self' | 'backend'>('all')
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})
  const [conciergeDrafts, setConciergeDrafts] = useState<Record<string, string>>({})
  const [conciergeLoading, setConciergeLoading] = useState<string | null>(null)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const navigate = useNavigate()
  const loadCartFromSimpleItems = useCartStore((state) => state.loadFromSimpleItems)
  const enterConciergeMode = useCartStore((state) => state.enterConciergeMode)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const list = await getCustomerOrders()
      setOrders(list)
      setNoteDrafts(
        list.reduce<Record<string, string>>((acc, order) => {
          acc[order.id] = order.note || ''
          return acc
        }, {})
      )
      setConciergeDrafts(
        list.reduce<Record<string, string>>((acc, order) => {
          acc[order.id] = order.conciergePhone || ''
          return acc
        }, {})
      )
    } catch (error) {
      console.error('加载订单失败', error)
      toast.error('加载订单失败，请稍后再试')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (!ALLOWED_STATUS_SET.has(order.status)) return false
      const matchStatus = statusFilter === 'all' || order.status === statusFilter
      const matchSource = sourceFilter === 'all' || order.source === sourceFilter
      return matchStatus && matchSource
    })
  }, [orders, statusFilter, sourceFilter])

  // 计算订单统计数据
  const orderStats = useMemo(() => {
    const validOrders = orders.filter(o => ALLOWED_STATUS_SET.has(o.status))
    return {
      total: validOrders.length,
      pending: validOrders.filter(o => o.status === 'pending').length,
      processing: validOrders.filter(o => o.status === 'processing').length,
      completed: validOrders.filter(o => o.status === 'completed').length,
      totalAmount: validOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      avgAmount: validOrders.length > 0 ? Math.round(validOrders.reduce((sum, o) => sum + o.totalAmount, 0) / validOrders.length) : 0,
    }
  }, [orders])

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, status)
      toast.success('订单状态已更新')
      await loadOrders()
    } catch (error) {
      console.error('更新订单状态失败', error)
      toast.error('更新状态失败')
    }
  }

  const handleSaveNote = async (orderId: string) => {
    try {
      await updateCustomerOrder(orderId, { note: noteDrafts[orderId] })
      toast.success('备注已保存')
      await loadOrders()
    } catch (error) {
      console.error('保存备注失败', error)
      toast.error('保存备注失败')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('确定要删除该订单吗？')) return
    try {
      await deleteCustomerOrder(orderId)
      toast.success('订单已删除')
      await loadOrders()
    } catch (error) {
      console.error('删除订单失败', error)
      toast.error('删除订单失败')
    }
  }

  const handleConciergeOrder = (order: CustomerOrder) => {
    // 获取客户电话
    const customerPhone = order.phone || '13800138000'
    
    // 将订单商品转换为简化格式
    const simpleItems = mapCustomerOrderToCartItems(order)
    if (!simpleItems.length) {
      toast.error('该订单暂无可编辑的商品')
      return
    }

    // 进入代客下单模式，传递订单来源
    enterConciergeMode(order.id, order.title || '订单', customerPhone, simpleItems, order.source)
    
    toast.success(`已进入代客下单模式，订单：${order.title}`)
    
    // 打开购物车页面
    navigate('/cart')
  }

  const handleConciergePush = async (orderId: string) => {
    const phone = (conciergeDrafts[orderId] || '').trim()
    if (!phone) {
      toast.error('请输入客户手机号')
      return
    }
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      toast.error('请输入正确的11位手机号码')
      return
    }
    const duplicate = orders.some((order) => order.id !== orderId && order.conciergePhone === phone)
    if (duplicate) {
      toast.error('该手机号已关联其他订单，请确认唯一性')
      return
    }
    try {
      setConciergeLoading(orderId)
      await updateCustomerOrder(orderId, {
        conciergePhone: phone,
        conciergePushedAt: new Date().toISOString(),
      })
      toast.success('已记录客户手机号，可随时回访推送进度')
      await loadOrders()
    } catch (error) {
      console.error('代客推送失败', error)
      toast.error('推送失败，请稍后再试')
    } finally {
      setConciergeLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="container-custom">
        <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
          <Link to="/" className="hover:text-primary-600">首页</Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold">我的订单</span>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <ClipboardList className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">管理我的订单</p>
                <h1 className="text-2xl font-bold text-gray-900">订单中心</h1>
              </div>
            </div>
            <div className="flex-1 flex flex-wrap gap-3 justify-end">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | 'all')}
                className="input w-full sm:w-48"
              >
                <option value="all">全部状态</option>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value as 'all' | 'self' | 'backend')}
                className="input w-full sm:w-48"
              >
                <option value="all">全部来源</option>
                <option value="self">我的下单</option>
                <option value="backend">后台推送</option>
              </select>
            </div>
          </div>

          {/* 订单统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '总订单数', value: orderStats.total, icon: ClipboardList, color: 'text-blue-600' },
              { label: '待处理', value: orderStats.pending + orderStats.processing, icon: AlertCircle, color: 'text-orange-600' },
              { label: '已完成', value: orderStats.completed, icon: CheckCircle2, color: 'text-green-600' },
              { label: '平均金额', value: `¥${orderStats.avgAmount.toLocaleString()}`, icon: TrendingUp, color: 'text-purple-600' },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-xl bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <p className="text-xs text-gray-600">{stat.label}</p>
                  </div>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {loading && (
            <div className="card py-16 text-center text-gray-500">加载中...</div>
          )}

          {!loading && filteredOrders.length === 0 && (
            <div className="card py-16 text-center">
              <p className="text-gray-500 mb-4">暂无相关订单</p>
              <Link to="/packages" className="btn-primary inline-flex items-center gap-2">
                去看看套餐 <ChevronDown className="rotate-90 h-4 w-4" />
              </Link>
            </div>
          )}

          {!loading && filteredOrders.map((order, orderIndex) => {
            const isExpanded = expandedOrder === order.id
            const statusLabel = STATUS_OPTIONS.find((opt) => opt.value === order.status)?.label || '其他'
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: orderIndex * 0.05 }}
                className={`bg-white rounded-2xl border transition-all ${
                  isExpanded 
                    ? 'border-primary-200 shadow-lg' 
                    : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                }`}
              >
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors gap-3"
                >
                  {/* 左侧：状态和订单信息 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* 状态徽章 */}
                    <div className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-500'}`}>
                      {statusLabel}
                    </div>
                    
                    {/* 订单信息 */}
                    <div className="text-left min-w-0 flex-1">
                      <p className="text-xs text-gray-900 font-medium truncate">{order.orderNo}</p>
                      <p className="text-xs text-gray-500 truncate">{order.title}</p>
                    </div>
                  </div>

                  {/* 右侧：金额和操作 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 金额 */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-600">{formatCurrency(order.totalAmount)}</p>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigator.clipboard.writeText(order.orderNo)
                          toast.success('订单号已复制')
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                        title="复制"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          window.print()
                        }}
                        className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                        title="打印"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                      <ChevronDown className={`h-4 w-4 transition-transform text-gray-600 ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* 移动端显示金额 */}
                {!isExpanded && (
                  <div className="sm:hidden px-6 pb-3 flex justify-between items-center">
                    <p className="text-xs text-gray-500">{new Date(order.updatedAt).toLocaleDateString()}</p>
                    <p className="text-lg font-bold text-primary-600">{formatCurrency(order.totalAmount)}</p>
                  </div>
                )}

                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {/* 订单摘要 */}
                    <div className="grid md:grid-cols-2 gap-3">
                      {/* 商品列表 */}
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2 text-sm">
                          <Package className="h-4 w-4" /> 商品清单 ({order.items.length})
                        </div>
                        <div className="space-y-2">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-start justify-between p-2 bg-white rounded text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                {item.selections && (
                                  <p className="text-gray-500 truncate">
                                    {Object.entries(item.selections)
                                      .map(([key, value]) => `${key}: ${value}`)
                                      .join(' | ')}
                                  </p>
                                )}
                              </div>
                              <div className="text-right ml-2 flex-shrink-0">
                                <p className="font-semibold text-primary-600">¥{item.price.toLocaleString()}</p>
                                <p className="text-gray-400">×{item.quantity}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 订单信息 */}
                      <div className="p-3 rounded-lg bg-primary-50 border border-primary-100 space-y-2 text-sm">
                        <div>
                          <p className="text-gray-600 text-xs mb-0.5">订单总额</p>
                          <p className="text-xl font-bold text-primary-600">{formatCurrency(order.totalAmount)}</p>
                        </div>
                        <div className="border-t border-primary-200 pt-2 space-y-1">
                          {order.phone && (
                            <p className="flex items-center gap-2 text-gray-700 text-xs"><Phone className="h-3 w-3 text-gray-400" /> {order.phone}</p>
                          )}
                          {order.address && (
                            <p className="flex items-start gap-2 text-gray-700 text-xs"><MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" /> <span className="line-clamp-2">{order.address}</span></p>
                          )}
                          <p className="flex items-center gap-2 text-gray-600 text-xs"><Clock className="h-3 w-3 text-gray-400" /> {new Date(order.createdAt).toLocaleDateString()}</p>
                          <p className="flex items-center gap-2 text-gray-600 text-xs"><CheckCircle2 className="h-3 w-3 text-gray-400" /> {order.source === 'backend' ? '后台推送' : '我自己'}</p>
                        </div>
                      </div>
                    </div>

                    {order.packageSelections && order.packageSelections.length > 0 && (
                      <div className="border-t border-gray-100 px-6 py-6">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                          <Package className="h-4 w-4" /> 选择总览
                        </div>
                        <div className="space-y-4">
                          {order.packageSelections.map((group: PackageSelectionGroup) => (
                            <div key={group.categoryKey} className="border border-gray-100 rounded-2xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-gray-900">{group.categoryName}</p>
                                <span className="text-xs text-gray-500">需 {group.required}</span>
                              </div>
                              {group.items.length === 0 ? (
                                <p className="text-xs text-gray-400">未选择</p>
                              ) : (
                                <div className="space-y-2">
                                  {group.items.map((item) => (
                                    <div key={`${group.categoryKey}-${item.productId}`} className="text-sm text-gray-600">
                                      <p className="font-medium text-gray-900 flex items-center gap-2">
                                        {item.productName}
                                        <span className="text-xs text-gray-500">× {item.quantity}</span>
                                      </p>
                                      {item.materials && (
                                        <p className="text-xs text-gray-500">
                                          {Object.entries(item.materials)
                                            .map(([key, value]) => `${key.toUpperCase()}·${value}`)
                                            .join(' / ')}
                                        </p>
                                      )}
                                      {item.materialUpgrade ? (
                                        <p className="text-xs text-red-600">材质升级 +{formatCurrency(item.materialUpgrade)}</p>
                                      ) : (
                                        <p className="text-xs text-green-600">基础配置</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 操作区域 */}
                    <div className="border-t border-gray-100 pt-3 space-y-3">
                      {/* 备注区域 */}
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-primary-500" /> 备注
                          </label>
                          <button
                            onClick={() => setEditingNote(editingNote === order.id ? null : order.id)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            {editingNote === order.id ? '完成' : '编辑'}
                          </button>
                        </div>
                        {editingNote === order.id ? (
                          <>
                            <textarea
                              value={noteDrafts[order.id] || ''}
                              onChange={(e) => setNoteDrafts({ ...noteDrafts, [order.id]: e.target.value })}
                              className="input w-full min-h-[60px] mb-2 text-xs"
                              placeholder="添加备注..."
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  handleSaveNote(order.id)
                                  setEditingNote(null)
                                }}
                                className="btn-primary flex-1 text-xs py-1"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => {
                                  setNoteDrafts({ ...noteDrafts, [order.id]: order.note || '' })
                                  setEditingNote(null)
                                }}
                                className="btn-secondary flex-1 text-xs py-1"
                              >
                                取消
                              </button>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-gray-600 bg-white p-2 rounded">
                            {noteDrafts[order.id] || order.note || '暂无备注'}
                          </p>
                        )}
                      </div>

                      {/* 状态和操作 */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* 状态更新 */}
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                          <label className="text-xs font-semibold text-gray-900 mb-2 block">状态</label>
                          <div className="grid grid-cols-2 gap-1">
                            {STATUS_OPTIONS.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => handleStatusChange(order.id, option.value)}
                                className={`px-2 py-1 rounded text-xs font-medium border transition ${
                                  order.status === option.value
                                    ? 'border-primary-300 bg-primary-50 text-primary-600'
                                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-white'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 快速操作 */}
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-100 space-y-2">
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-medium w-full text-left"
                          >
                            删除
                          </button>
                          <button
                            onClick={() => handleConciergeOrder(order)}
                            className="px-2 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 flex items-center justify-center gap-1 transition-colors text-xs w-full"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            代客下单
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
