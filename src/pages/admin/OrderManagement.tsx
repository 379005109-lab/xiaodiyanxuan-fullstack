import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Eye, Download, ShoppingCart, Sparkles, ChevronDown, MoreVertical, Truck, Clock, CheckCircle2, AlertCircle, DollarSign, MessageSquare, Copy, Printer, Phone, MapPin } from 'lucide-react'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { Order, OrderStatus } from '@/types'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'
import { mapAdminOrderToCartItems } from '@/utils/conciergeHelper'

export default function OrderManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [conciergeDrafts, setConciergeDrafts] = useState<Record<string, string>>({})
  const [conciergeLoading, setConciergeLoading] = useState<string | null>(null)
  const [flatPriceDrafts, setFlatPriceDrafts] = useState<Record<string, string>>({})
  const [flatPriceLoading, setFlatPriceLoading] = useState<string | null>(null)
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({})
  const [editingNote, setEditingNote] = useState<string | null>(null)

  // 从localStorage获取本地订单列表（完全本地化方案）
  useEffect(() => {
    try {
      setLoading(true)
      
      // 直接从localStorage读取本地订单
      const stored = localStorage.getItem('local_orders')
      let allOrders: Order[] = stored ? JSON.parse(stored) : []
      
      // 应用搜索
      if (searchQuery) {
        allOrders = allOrders.filter(o => 
          o.orderNo?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      // 应用状态筛选
      if (filterStatus) {
        allOrders = allOrders.filter(o => o.status === filterStatus)
      }
      
      // 排序（最新的在前）
      allOrders.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      
      // 分页
      const startIndex = (page - 1) * 10
      const endIndex = startIndex + 10
      const paginatedOrders = allOrders.slice(startIndex, endIndex)
      
      setOrders(paginatedOrders)
      setTotal(allOrders.length)
      setTotalPages(Math.ceil(allOrders.length / 10))
      
      // 初始化代客下单和一口价草稿
      setConciergeDrafts((prev) => {
        const next: Record<string, string> = {}
        allOrders.forEach((order) => {
          next[order._id] = (order as any).conciergePhone || prev[order._id] || ''
        })
        return next
      })
      setFlatPriceDrafts((prev) => {
        const next: Record<string, string> = {}
        allOrders.forEach((order) => {
          const flat = (order as any).flatPriceAmount
          next[order._id] = flat != null ? String(flat) : prev[order._id] || ''
        })
        return next
      })
      
    } catch (error: any) {
      console.error('读取本地订单失败:', error)
      setOrders([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [page, filterStatus, searchQuery])

  const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
    pending: { label: '待付款', color: 'bg-yellow-100 text-yellow-700' },
    processing: { label: '处理中', color: 'bg-amber-100 text-amber-700' },
    paid: { label: '已付款', color: 'bg-green-100 text-green-700' },
    shipped: { label: '已发货', color: 'bg-blue-100 text-blue-700' },
    completed: { label: '已完成', color: 'bg-gray-100 text-gray-700' },
    cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
    refunding: { label: '退款中', color: 'bg-orange-100 text-orange-700' },
    refunded: { label: '已退款', color: 'bg-purple-100 text-purple-700' },
  }

  const filteredOrders = orders

  const handleConciergeLoad = (order: Order) => {
    const simpleItems = mapAdminOrderToCartItems(order)
    if (!simpleItems.length) {
      toast.error('该订单暂无可编辑商品')
      return
    }
    // 直接调用 store 的方法
    useCartStore.getState().loadFromSimpleItems(simpleItems)
    toast.success('已载入购物车，请在前台购物车继续编辑')
    window.open('/cart', '_blank')
  }

  const handleConciergePush = (orderId: string) => {
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
    
    try {
      setConciergeLoading(orderId)
      
      // 本地化方案：更新 localStorage 中的订单数据
      const stored = localStorage.getItem('local_orders')
      const allOrders: Order[] = stored ? JSON.parse(stored) : []
      const updatedOrders = allOrders.map(o => 
        o._id === orderId 
          ? { ...o, conciergePhone: phone, conciergePushedAt: new Date().toISOString() }
          : o
      )
      localStorage.setItem('local_orders', JSON.stringify(updatedOrders))
      
      // 更新当前显示的订单
      setOrders(orders.map(o => 
        o._id === orderId 
          ? { ...o, conciergePhone: phone, conciergePushedAt: new Date().toISOString() }
          : o
      ))
      
      toast.success('客户信息已记录，可提醒其完成支付')
    } catch (error: any) {
      console.error('推送失败', error)
      toast.error('推送失败')
    } finally {
      setConciergeLoading(null)
    }
  }

  const handleFlatPriceUpdate = (orderId: string, reset = false) => {
    if (reset) {
      setFlatPriceDrafts((prev) => ({ ...prev, [orderId]: '' }))
    }
    const raw = flatPriceDrafts[orderId]
    const amount = Number(raw)
    if (!reset) {
      if (!raw || Number.isNaN(amount) || amount <= 0) {
        toast.error('请输入有效的一口价金额')
        return
      }
    }
    
    try {
      setFlatPriceLoading(orderId)
      
      // 本地化方案：更新 localStorage 中的订单数据
      const stored = localStorage.getItem('local_orders')
      const allOrders: Order[] = stored ? JSON.parse(stored) : []
      const updatedOrders = allOrders.map(o => 
        o._id === orderId 
          ? { 
              ...o, 
              flatPriceAmount: reset ? undefined : amount,
              isFlatPrice: !reset
            }
          : o
      )
      localStorage.setItem('local_orders', JSON.stringify(updatedOrders))
      
      // 更新当前显示的订单
      setOrders(orders.map(o => 
        o._id === orderId 
          ? { 
              ...o, 
              flatPriceAmount: reset ? undefined : amount,
              isFlatPrice: !reset
            }
          : o
      ))
      
      toast.success(reset ? '已取消一口价' : '一口价设置成功')
    } catch (error: any) {
      console.error('设置一口价失败', error)
      toast.error('设置一口价失败')
    } finally {
      setFlatPriceLoading(null)
    }
  }

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    try {
      // 本地化方案：更新 localStorage 中的订单数据
      const stored = localStorage.getItem('local_orders')
      const allOrders: Order[] = stored ? JSON.parse(stored) : []
      const updatedOrders = allOrders.map(o => 
        o._id === orderId ? { ...o, status } : o
      )
      localStorage.setItem('local_orders', JSON.stringify(updatedOrders))
      
      // 更新当前显示的订单
      setOrders(orders.map(o => o._id === orderId ? { ...o, status } : o))
      toast.success('订单状态已更新')
    } catch (error: any) {
      console.error('更新订单状态失败', error)
      toast.error('更新订单状态失败')
    }
  }

  // 批量操作函数
  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(o => o._id)))
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'paid':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'shipped':
        return <Truck className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-gray-600" />
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  // 统计各状态订单数量（从localStorage读取所有订单）
  const getStatusCount = (status: string) => {
    try {
      const stored = localStorage.getItem('local_orders')
      const allOrders: Order[] = stored ? JSON.parse(stored) : []
      return allOrders.filter((o) => o.status === status).length
    } catch {
      return orders.filter((o) => o.status === status).length
    }
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">订单管理</h1>
          <p className="text-gray-600 mt-1">共 {total} 个订单</p>
        </div>
        <button className="btn-secondary flex items-center">
          <Download className="h-5 w-5 mr-2" />
          导出数据
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: '待付款', count: getStatusCount('pending'), color: 'text-yellow-600' },
          { label: '已付款', count: getStatusCount('paid'), color: 'text-green-600' },
          { label: '已发货', count: getStatusCount('shipped'), color: 'text-blue-600' },
          { label: '已完成', count: getStatusCount('completed'), color: 'text-gray-600' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.color}`}>{stat.count}</p>
          </motion.div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索 */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订单号..."
              className="input pl-10"
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setPage(1) // 重置到第一页
            }}
            className="input"
          >
            <option value="">所有状态</option>
            <option value="pending">待付款</option>
            <option value="paid">已付款</option>
            <option value="shipped">已发货</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
            <option value="refunding">退款中</option>
            <option value="refunded">已退款</option>
          </select>

          {/* 高级筛选 */}
          <button className="btn-secondary flex items-center justify-center">
            <Filter className="h-5 w-5 mr-2" />
            高级筛选
          </button>
        </div>
      </div>

      {/* 批量操作栏 */}
      {selectedOrders.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card bg-blue-50 border border-blue-200"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-700">
              已选择 {selectedOrders.size} 个订单
            </span>
            <div className="flex gap-2">
              <button className="btn-secondary text-sm">批量发货</button>
              <button className="btn-secondary text-sm">批量备注</button>
              <button 
                onClick={() => setSelectedOrders(new Set())}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                取消选择
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 订单列表 - 卡片视图 */}
      <div className="space-y-3">
        {loading ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">暂无订单数据</p>
          </div>
        ) : (
          orders.map((order, index) => {
            const isExpanded = expandedOrder === order._id
            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-xl border transition-all ${
                  isExpanded
                    ? 'border-primary-200 shadow-lg'
                    : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
                }`}
              >
                {/* 订单卡片头部 */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors gap-3"
                >
                  {/* 左侧：选择框和基本信息 */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input 
                      type="checkbox"
                      checked={selectedOrders.has(order._id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        toggleOrderSelection(order._id)
                      }}
                      className="w-4 h-4 cursor-pointer flex-shrink-0"
                    />
                    
                    {/* 订单号和客户名 */}
                    <div className="min-w-0 flex-1">
                      <p className="text-base text-gray-900 font-bold truncate">{order.orderNo}</p>
                      <p className="text-base text-gray-600 truncate">
                        {order.shippingAddress?.name || '待确认'}
                      </p>
                    </div>
                  </div>

                  {/* 中间：金额 */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-red-600">{formatPrice(order.totalAmount)}</p>
                  </div>

                  {/* 右侧：状态和操作 */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* 状态徽章 */}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${statusConfig[order.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {statusConfig[order.status]?.label || order.status}
                    </span>

                    {/* 快速操作按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navigator.clipboard.writeText(order.orderNo)
                        toast.success('订单号已复制')
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                      title="复制"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        window.print()
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors text-gray-500 hover:text-gray-700"
                      title="打印"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <ChevronDown 
                      className={`h-5 w-5 transition-transform text-gray-600 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-4 space-y-4">
                    {/* 商品和地址信息 */}
                    <div className="grid md:grid-cols-2 gap-3">
                      {/* 订单商品 */}
                      {order.items && order.items.length > 0 && (
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4 text-base">
                            <ShoppingCart className="h-4 w-4" /> 商品清单 ({order.items.length})
                          </div>
                          <div className="space-y-3">
                            {order.items.map((item, itemIndex) => {
                              const productObj = typeof item.product === 'object' ? item.product : null
                              const productImage = item.productImage || productObj?.images?.[0]
                              // 从SKU列表中获取材质信息
                              const targetSku = productObj?.skus?.find((sku: any) => sku._id === (item as any).skuId) || productObj?.skus?.[0]
                              const skuMaterial = targetSku?.material
                              
                              return (
                                <div key={itemIndex} className="bg-white rounded-lg p-3 border border-gray-100">
                                  {/* 商品图片和基本信息 */}
                                  <div className="flex gap-3">
                                    {/* 商品图片 */}
                                    {productImage ? (
                                      <img
                                        src={productImage}
                                        alt="商品"
                                        className="w-20 h-20 object-cover rounded flex-shrink-0"
                                      />
                                    ) : (
                                      <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0 flex items-center justify-center text-gray-400 text-xs">
                                        无图片
                                      </div>
                                    )}
                                    
                                    {/* 商品信息 */}
                                    <div className="flex-1 min-w-0">
                                      <p className="font-bold text-gray-900 text-sm mb-1">
                                        {item.productName || productObj?.name || '商品'}
                                      </p>
                                      
                                      {/* 详细信息 */}
                                      <div className="space-y-1 text-xs text-gray-600">
                                        {/* SKU规格 */}
                                        {(item as any).spec && (
                                          <p><span className="text-gray-500 font-medium">规格:</span> {(item as any).spec}</p>
                                        )}
                                        {(item as any).length && (item as any).width && (item as any).height && (
                                          <p><span className="text-gray-500 font-medium">尺寸:</span> {(item as any).length}×{(item as any).width}×{(item as any).height}CM</p>
                                        )}
                                        
                                        {/* 材质信息 - 从SKU中获取 */}
                                        {skuMaterial && (
                                          <>
                                            {typeof skuMaterial === 'string' ? (
                                              <p><span className="text-gray-500 font-medium">材质:</span> {skuMaterial}</p>
                                            ) : (
                                              <>
                                                {(skuMaterial as any)?.fabric && (
                                                  <p><span className="text-gray-500 font-medium">面料:</span> 
                                                    {targetSku?.materialUpgradePrices?.[Array.isArray((skuMaterial as any).fabric) ? (skuMaterial as any).fabric[0] : (skuMaterial as any).fabric] ? (
                                                      <span className="text-red-600 font-bold">{Array.isArray((skuMaterial as any).fabric) ? (skuMaterial as any).fabric.join('/') : (skuMaterial as any).fabric} +¥{targetSku.materialUpgradePrices[Array.isArray((skuMaterial as any).fabric) ? (skuMaterial as any).fabric[0] : (skuMaterial as any).fabric]}</span>
                                                    ) : (
                                                      <span>{Array.isArray((skuMaterial as any).fabric) ? (skuMaterial as any).fabric.join('/') : (skuMaterial as any).fabric}</span>
                                                    )}
                                                  </p>
                                                )}
                                                {(skuMaterial as any)?.filling && (
                                                  <p><span className="text-gray-500 font-medium">填充:</span> 
                                                    {targetSku?.materialUpgradePrices?.[Array.isArray((skuMaterial as any).filling) ? (skuMaterial as any).filling[0] : (skuMaterial as any).filling] ? (
                                                      <span className="text-red-600 font-bold">{Array.isArray((skuMaterial as any).filling) ? (skuMaterial as any).filling.join('/') : (skuMaterial as any).filling} +¥{targetSku.materialUpgradePrices[Array.isArray((skuMaterial as any).filling) ? (skuMaterial as any).filling[0] : (skuMaterial as any).filling]}</span>
                                                    ) : (
                                                      <span>{Array.isArray((skuMaterial as any).filling) ? (skuMaterial as any).filling.join('/') : (skuMaterial as any).filling}</span>
                                                    )}
                                                  </p>
                                                )}
                                                {(skuMaterial as any)?.frame && (
                                                  <p><span className="text-gray-500 font-medium">框架:</span> 
                                                    {targetSku?.materialUpgradePrices?.[Array.isArray((skuMaterial as any).frame) ? (skuMaterial as any).frame[0] : (skuMaterial as any).frame] ? (
                                                      <span className="text-red-600 font-bold">{Array.isArray((skuMaterial as any).frame) ? (skuMaterial as any).frame.join('/') : (skuMaterial as any).frame} +¥{targetSku.materialUpgradePrices[Array.isArray((skuMaterial as any).frame) ? (skuMaterial as any).frame[0] : (skuMaterial as any).frame]}</span>
                                                    ) : (
                                                      <span>{Array.isArray((skuMaterial as any).frame) ? (skuMaterial as any).frame.join('/') : (skuMaterial as any).frame}</span>
                                                    )}
                                                  </p>
                                                )}
                                                {(skuMaterial as any)?.leg && (
                                                  <p><span className="text-gray-500 font-medium">脚架:</span> 
                                                    {targetSku?.materialUpgradePrices?.[Array.isArray((skuMaterial as any).leg) ? (skuMaterial as any).leg[0] : (skuMaterial as any).leg] ? (
                                                      <span className="text-red-600 font-bold">{Array.isArray((skuMaterial as any).leg) ? (skuMaterial as any).leg.join('/') : (skuMaterial as any).leg} +¥{targetSku.materialUpgradePrices[Array.isArray((skuMaterial as any).leg) ? (skuMaterial as any).leg[0] : (skuMaterial as any).leg]}</span>
                                                    ) : (
                                                      <span>{Array.isArray((skuMaterial as any).leg) ? (skuMaterial as any).leg.join('/') : (skuMaterial as any).leg}</span>
                                                    )}
                                                  </p>
                                                )}
                                              </>
                                            )}
                                          </>
                                        )}
                                        
                                        {/* 数量和价格 */}
                                        <p className="text-gray-700 font-medium pt-1">
                                          <span className="text-gray-500">数量:</span> {item.quantity} × {formatPrice(item.price)} = <span className="text-red-600">{formatPrice(item.price * item.quantity)}</span>
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* 收货地址和金额 */}
                      <div className="p-4 rounded-lg bg-primary-50 border border-primary-100 space-y-3">
                        <div>
                          <p className="text-gray-600 text-xs mb-1">订单总额</p>
                          <p className="text-2xl font-bold text-primary-600">{formatPrice(order.totalAmount)}</p>
                        </div>
                        <div className="border-t border-primary-200 pt-3 space-y-2">
                          {order.shippingAddress?.phone && (
                            <p className="flex items-center gap-2 text-gray-700 text-sm"><Phone className="h-4 w-4 text-gray-400" /> {order.shippingAddress.phone}</p>
                          )}
                          {order.shippingAddress?.address && (
                            <p className="flex items-start gap-2 text-gray-700 text-sm"><MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" /> <span className="line-clamp-2">{order.shippingAddress.address}</span></p>
                          )}
                          <p className="flex items-center gap-2 text-gray-600 text-sm"><Clock className="h-4 w-4 text-gray-400" /> {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* 一口价设置 */}
                    <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <label className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" /> 一口价
                      </label>
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          value={flatPriceDrafts[order._id] || ''}
                          onChange={(e) => setFlatPriceDrafts((prev) => ({ ...prev, [order._id]: e.target.value }))}
                          placeholder="输入一口价金额"
                          className="input flex-1"
                        />
                        {flatPriceDrafts[order._id] && (
                          <>
                            <button
                              onClick={() => handleFlatPriceUpdate(order._id, false)}
                              disabled={flatPriceLoading === order._id}
                              className="btn-primary text-sm"
                            >
                              {flatPriceLoading === order._id ? '设置中...' : '设置'}
                            </button>
                            <button
                              onClick={() => handleFlatPriceUpdate(order._id, true)}
                              disabled={flatPriceLoading === order._id}
                              className="btn-secondary text-sm"
                            >
                              取消
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* 代客下单按钮 */}
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                      <button
                        onClick={() => handleConciergeLoad(order)}
                        className="w-full btn-primary flex items-center justify-center gap-2"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        代客下单
                      </button>
                    </div>

                    {/* 操作区域 */}
                    <div className="border-t border-gray-100 pt-4 space-y-4">
                      {/* 备注区域 */}
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-semibold text-gray-900 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-primary-500" /> 备注
                          </label>
                          <button
                            onClick={() => setEditingNote(editingNote === order._id ? null : order._id)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            {editingNote === order._id ? '完成' : '编辑'}
                          </button>
                        </div>
                        {editingNote === order._id ? (
                          <textarea
                            value={orderNotes[order._id] || ''}
                            onChange={(e) => setOrderNotes((prev) => ({ ...prev, [order._id]: e.target.value }))}
                            placeholder="添加备注..."
                            className="input text-xs w-full min-h-[60px]"
                          />
                        ) : (
                          <p className="text-xs text-gray-600 bg-white p-2 rounded">
                            {orderNotes[order._id] || '暂无备注'}
                          </p>
                        )}
                      </div>

                      {/* 状态管理 - 一行排开 */}
                      <div className="p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <label className="text-base font-semibold text-gray-900 mb-3 block">订单状态</label>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { value: 'pending', label: '待付款' },
                            { value: 'processing', label: '处理中' },
                            { value: 'paid', label: '已付款' },
                            { value: 'shipped', label: '已发货' },
                            { value: 'completed', label: '已完成' },
                            { value: 'cancelled', label: '已取消' },
                          ].map((option) => (
                            <button
                              key={option.value}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleStatusChange(order._id, option.value as OrderStatus)
                              }}
                              className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
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
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, page - 2) + i
            return pageNum <= totalPages ? pageNum : null
          }).filter(Boolean).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setPage(pageNum as number)}
              className={`px-4 py-2 border rounded-lg ${
                page === pageNum
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  )
}

