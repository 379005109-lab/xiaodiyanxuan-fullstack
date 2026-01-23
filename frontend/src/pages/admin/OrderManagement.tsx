import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, Eye, Download, ShoppingCart, Sparkles, ChevronDown, MoreVertical, Truck, Clock, CheckCircle2, AlertCircle, DollarSign, MessageSquare, Copy, Printer, Phone, MapPin, Edit2, Package, X } from 'lucide-react'
import { formatPrice, formatDateTime } from '@/lib/utils'
import { Order, OrderStatus } from '@/types'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'
import { mapAdminOrderToCartItems } from '@/utils/conciergeHelper'
import { getFileUrl } from '@/services/uploadService'

export default function OrderManagement() {
  const navigate = useNavigate()
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
  
  // 改价功能状态
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [selectedOrderForPricing, setSelectedOrderForPricing] = useState<Order | null>(null)
  const [priceEditMode, setPriceEditMode] = useState<'flat' | 'itemized'>('flat')
  const [newPrice, setNewPrice] = useState('')
  const [priceReason, setPriceReason] = useState('')
  const [itemPrices, setItemPrices] = useState<{[key: number]: string}>({})

  // 从API获取订单列表
  useEffect(() => {
    loadOrders()
  }, [searchQuery, filterStatus, page])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      const token = localStorage.getItem('token')
      console.log('[OrderManagement] Loading orders, token exists:', !!token)
      
      if (!token) {
        console.warn('[OrderManagement] No token found, redirecting to home')
        toast.error('请先登录')
        navigate('/')
        return
      }
      
      // 从API获取订单数据
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/orders?page=' + page + '&pageSize=10000', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      console.log('[OrderManagement] API response status:', response.status)
      
      if (response.status === 401) {
        console.warn('[OrderManagement] Token invalid, redirecting to home')
        localStorage.removeItem('token')
        toast.error('登录已过期，请重新登录')
        navigate('/')
        return
      }
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[OrderManagement] API error:', errorText)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[OrderManagement] Orders loaded:', data.data?.length, 'total:', data.pagination?.total)
      let allOrders: Order[] = data.data || []
      
      // 打印取消申请订单数量
      const cancelRequestOrders = allOrders.filter(o => (o as any).cancelRequest === true)
      console.log('[OrderManagement] Orders with cancelRequest:', cancelRequestOrders.length, cancelRequestOrders.map(o => o.orderNo))
      
      // 应用搜索
      if (searchQuery) {
        allOrders = allOrders.filter(o => 
          o.orderNo?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }
      
      // 应用状态筛选
      if (filterStatus) {
        if (filterStatus === 'cancel_request') {
          // 筛选有取消申请的订单
          allOrders = allOrders.filter(o => (o as any).cancelRequest === true)
        } else {
          // 状态值可能是数字或字符串，需要同时匹配
          const statusMap: Record<string, (number | string)[]> = {
            'pending': [1, 'pending'],
            'paid': [2, 'paid', 'processing'],
            'shipped': [3, 'shipped'],
            'completed': [4, 'completed'],
            'cancelled': [5, 6, 'cancelled'],
            'refunding': [6, 'refunding'],
            'refunded': [7, 'refunded'],
          }
          const matchStatuses = statusMap[filterStatus] || [filterStatus]
          allOrders = allOrders.filter(o => matchStatuses.includes(o.status as any))
        }
      }
      
      // 排序（最新的在前）
      allOrders.sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      
      console.log('[OrderManagement] 准备设置订单状态:', allOrders.length, '个订单')
      console.log('[OrderManagement] 订单号列表:', allOrders.map(o => o.orderNo))
      setOrders(allOrders)
      setTotal(data.pagination?.total || allOrders.length)
      setTotalPages(Math.ceil((data.pagination?.total || allOrders.length) / 10))
      console.log('[OrderManagement] 订单状态已设置')
      
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
      console.error('加载订单失败:', error)
      setOrders([])
      setTotal(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  // 订单状态映射（后端使用数字，前端显示文本）
  const statusConfig: Record<string | number, { label: string; color: string }> = {
    // 数字状态（后端实际值）
    0: { label: '待确认', color: 'bg-amber-100 text-amber-700' },
    1: { label: '待付款', color: 'bg-yellow-100 text-yellow-700' },
    2: { label: '待发货', color: 'bg-green-100 text-green-700' },
    3: { label: '待收货', color: 'bg-blue-100 text-blue-700' },
    4: { label: '已完成', color: 'bg-gray-100 text-gray-700' },
    5: { label: '已取消', color: 'bg-red-100 text-red-700' },
    6: { label: '退款中', color: 'bg-orange-100 text-orange-700' },
    7: { label: '已退款', color: 'bg-purple-100 text-purple-700' },
    8: { label: '换货中', color: 'bg-amber-100 text-amber-700' },
    // 字符串状态（兼容旧数据）
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

  const invoiceStatusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: '待开票', color: 'bg-amber-100 text-amber-700' },
    processing: { label: '开票中', color: 'bg-blue-100 text-blue-700' },
    issued: { label: '已开票', color: 'bg-green-100 text-green-700' },
    sent: { label: '已寄出', color: 'bg-purple-100 text-purple-700' }
  }

  const handleInvoiceStatusChange = async (orderId: string, invoiceStatus: string) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        toast.error('请先登录')
        return
      }

      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/invoice-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ invoiceStatus })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({} as any))
        toast.error(data.message || '开票状态更新失败')
        return
      }

      setOrders(prev => prev.map(o => o._id === orderId ? ({ ...o, invoiceStatus } as any) : o))
      toast.success('开票状态已更新')
    } catch (error) {
      console.error('更新开票状态失败:', error)
      toast.error('开票状态更新失败')
    }
  }

  // 获取商品列表 - 支持套餐订单和普通订单
  const getProducts = (order: Order) => {
    if ((order as any).orderType === 'package' && (order as any).packageInfo) {
      const products: any[] = []
      const selections = (order as any).packageInfo.selections || []
      selections.forEach((selection: any) => {
        const selectionProducts = selection.products || []
        selectionProducts.forEach((product: any) => {
          const materials = product.selectedMaterials || product.materials || {}
          const upgradePrices = product.materialUpgradePrices || {}
          
          products.push({
            name: product.productName,
            quantity: product.quantity,
            skuName: product.skuName,
            materials: materials,
            selectedMaterials: {
              fabric: materials.fabric || materials['面料'] || '',
              filling: materials.filling || materials['填充'] || '',
              frame: materials.frame || materials['框架'] || '',
              leg: materials.leg || materials['脚架'] || ''
            },
            materialUpgradePrices: {
              fabric: upgradePrices.fabric || upgradePrices['面料'] || 0,
              filling: upgradePrices.filling || upgradePrices['填充'] || 0,
              frame: upgradePrices.frame || upgradePrices['框架'] || 0,
              leg: upgradePrices.leg || upgradePrices['脚架'] || 0
            },
            upgradePrice: product.upgradePrice || product.materialUpgrade || 0,
            image: product.image,
            category: selection.categoryName
          })
        })
      })
      return products
    } else if (order.items) {
      return order.items.map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
        materials: item.materials,
        specifications: item.specifications,
        selectedMaterials: item.selectedMaterials,
        materialUpgradePrices: item.materialUpgradePrices,
        image: item.image || item.productImage
      }))
    }
    return []
  }

  // 打开改价弹窗
  const openPriceModal = (order: Order) => {
    setSelectedOrderForPricing(order)
    setNewPrice(order.totalAmount?.toString() || '0')
    setPriceReason('')
    setPriceEditMode('flat')
    
    // 初始化商品价格
    const products = getProducts(order)
    const prices: {[key: number]: string} = {}
    products.forEach((_, index) => {
      prices[index] = '0' // 默认为0，用户需要填入新价格
    })
    setItemPrices(prices)
    
    setShowPriceModal(true)
  }

  // 处理改价
  const handleChangePrice = async () => {
    if (!selectedOrderForPricing) {
      toast.error('未选择订单')
      return
    }
    
    let finalPrice: number
    let priceData: any = {
      reason: priceReason || '管理员改价'
    }
    
    if (priceEditMode === 'flat') {
      // 一口价模式
      if (!newPrice) {
        toast.error('请输入新价格')
        return
      }
      finalPrice = parseFloat(newPrice)
      if (isNaN(finalPrice) || finalPrice < 0) {
        toast.error('请输入有效的价格')
        return
      }
      priceData.totalAmount = finalPrice
    } else {
      // 逐项改价模式
      const itemPricesArray = Object.values(itemPrices)
      if (itemPricesArray.some(p => !p || parseFloat(p) < 0)) {
        toast.error('请为所有商品输入有效价格')
        return
      }
      
      // 计算总价
      finalPrice = itemPricesArray.reduce((sum, p) => sum + parseFloat(p), 0)
      priceData.totalAmount = finalPrice
      priceData.itemPrices = itemPrices
      priceData.priceMode = 'itemized'
    }
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${selectedOrderForPricing._id}/price`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(priceData)
      })
      
      if (response.ok) {
        toast.success('价格修改成功')
        setShowPriceModal(false)
        loadOrders()
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || '修改失败')
      }
    } catch (error) {
      console.error('改价失败:', error)
      toast.error('修改失败，请重试')
    }
  }

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

  // 统计各状态订单数量
  const getStatusCount = (status: string) => {
    if (status === 'cancel_request') {
      return orders.filter((o) => (o as any).cancelRequest === true).length
    }
    const statusMap: Record<string, (number | string)[]> = {
      'pending': [1, 'pending'],
      'paid': [2, 'paid', 'processing'],
      'shipped': [3, 'shipped'],
      'completed': [4, 'completed'],
      'cancelled': [5, 6, 'cancelled'],
    }
    const matchStatuses = statusMap[status] || [status]
    return orders.filter((o) => matchStatuses.includes(o.status as any)).length
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          { label: '待付款', count: getStatusCount('pending'), color: 'text-yellow-600' },
          { label: '已付款', count: getStatusCount('paid'), color: 'text-green-600' },
          { label: '已发货', count: getStatusCount('shipped'), color: 'text-blue-600' },
          { label: '取消申请', count: getStatusCount('cancel_request'), color: 'text-orange-600' },
          { label: '已取消', count: getStatusCount('cancelled'), color: 'text-red-600' },
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
            <option value="cancel_request">⚠️ 取消申请</option>
            <option value="confirmation">待确认</option>
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
                    {/* 取消申请标记 */}
                    {order.cancelRequest && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 whitespace-nowrap animate-pulse border-2 border-orange-300">
                        ⚠️ 取消申请中
                      </span>
                    )}

                    {/* 开票状态标记 */}
                    {(order as any).needInvoice && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${(invoiceStatusConfig as any)[(order as any).invoiceStatus || 'pending']?.color || 'bg-amber-100 text-amber-700'}`}>
                        🧾 {(invoiceStatusConfig as any)[(order as any).invoiceStatus || 'pending']?.label || '待开票'}
                      </span>
                    )}
                    
                    {/* 调试按钮 - 显示订单状态 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        alert(`订单状态: ${order.status}\n结算模式: ${order.settlementMode || '未设置'}\n条件检查: status=${order.status}, settlementMode=${order.settlementMode}`)
                      }}
                      className="px-3 py-1.5 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700"
                      title="点击查看订单状态"
                    >
                      🔍 调试
                    </button>
                    
                    {/* 结算模式快捷按钮 - 待确认或待付款且未选择模式 */}
                    {(order.status === 0 || order.status === 1 || order.status === 'pending') && !order.settlementMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!window.confirm(`供应商调货模式（一键到底）\n\n原价: ¥${order.totalAmount?.toLocaleString()}\n最低折扣价(60%): ¥${(order.totalAmount * 0.6).toLocaleString()}\n返佣(40%): ¥${(order.totalAmount * 0.6 * 0.4).toLocaleString()}\n\n实付金额: ¥${(order.totalAmount * 0.6 * 0.6).toLocaleString()}\n\n确定选择此模式？`)) return
                          fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/settlement-mode`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ settlementMode: 'supplier_transfer', minDiscountRate: 0.6, commissionRate: 0.4 })
                          }).then((r) => {
                            if (r.ok) {
                              toast.success('已选择供应商调货模式')
                              loadOrders()
                            } else {
                              toast.error('设置失败')
                            }
                          })
                        }}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 whitespace-nowrap"
                        title="供应商调货"
                      >
                        🚚 调货
                      </button>
                    )}
                    
                    {(order.status === 0 || order.status === 1 || order.status === 'pending') && !order.settlementMode && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!window.confirm(`返佣模式\n\n原价: ¥${order.totalAmount?.toLocaleString()}\n最低折扣价(60%): ¥${(order.totalAmount * 0.6).toLocaleString()}\n\n首付(50%): ¥${(order.totalAmount * 0.6 * 0.5).toLocaleString()}\n尾款(50%): ¥${(order.totalAmount * 0.6 * 0.5).toLocaleString()}\n\n返佣(40%): ¥${(order.totalAmount * 0.6 * 0.4).toLocaleString()}（完成后申请）\n\n确定选择此模式？`)) return
                          fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/settlement-mode`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ settlementMode: 'commission_mode', minDiscountRate: 0.6, commissionRate: 0.4, paymentRatio: 50 })
                          }).then((r) => {
                            if (r.ok) {
                              toast.success('已选择返佣模式')
                              loadOrders()
                            } else {
                              toast.error('设置失败')
                            }
                          })
                        }}
                        className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 whitespace-nowrap"
                        title="返佣模式"
                      >
                        💰 返佣
                      </button>
                    )}
                    
                    {/* 已选择结算模式标记 */}
                    {order.settlementMode && (
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        order.settlementMode === 'supplier_transfer' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {order.settlementMode === 'supplier_transfer' ? '🚚 调货' : '💰 返佣'}
                      </span>
                    )}
                    
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
                    {/* 结算模式选择 - 在详情顶部显示 */}
                    {(order.status === 0 || order.status === 1 || order.status === 'pending') && !order.settlementMode && (
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6 mb-4">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <span className="text-2xl">💰</span>
                          选择结算模式
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!window.confirm(`供应商调货模式（一键到底）\n\n原价: ¥${order.totalAmount?.toLocaleString()}\n最低折扣价(60%): ¥${(order.totalAmount * 0.6).toLocaleString()}\n返佣(40%): ¥${(order.totalAmount * 0.6 * 0.4).toLocaleString()}\n\n实付金额: ¥${(order.totalAmount * 0.6 * 0.6).toLocaleString()}\n\n确定选择此模式？`)) return
                              try {
                                const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/settlement-mode`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ settlementMode: 'supplier_transfer', minDiscountRate: 0.6, commissionRate: 0.4 })
                                })
                                if (response.ok) {
                                  toast.success('已选择供应商调货模式')
                                  loadOrders()
                                } else {
                                  toast.error('设置失败')
                                }
                              } catch (error) { toast.error('设置失败') }
                            }}
                            className="flex flex-col items-center justify-center p-6 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg"
                          >
                            <span className="text-4xl mb-3">🚚</span>
                            <span className="text-xl font-bold mb-2">供应商调货</span>
                            <span className="text-sm opacity-90">一键到底 36%</span>
                            <span className="text-xs mt-2 opacity-75">实付: ¥{(order.totalAmount * 0.36).toLocaleString()}</span>
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!window.confirm(`返佣模式\n\n原价: ¥${order.totalAmount?.toLocaleString()}\n最低折扣价(60%): ¥${(order.totalAmount * 0.6).toLocaleString()}\n\n首付(50%): ¥${(order.totalAmount * 0.6 * 0.5).toLocaleString()}\n尾款(50%): ¥${(order.totalAmount * 0.6 * 0.5).toLocaleString()}\n\n返佣(40%): ¥${(order.totalAmount * 0.6 * 0.4).toLocaleString()}（完成后申请）\n\n确定选择此模式？`)) return
                              try {
                                const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/settlement-mode`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ settlementMode: 'commission_mode', minDiscountRate: 0.6, commissionRate: 0.4, paymentRatio: 50 })
                                })
                                if (response.ok) {
                                  toast.success('已选择返佣模式')
                                  loadOrders()
                                } else {
                                  toast.error('设置失败')
                                }
                              } catch (error) { toast.error('设置失败') }
                            }}
                            className="flex flex-col items-center justify-center p-6 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all transform hover:scale-105 shadow-lg"
                          >
                            <span className="text-4xl mb-3">💰</span>
                            <span className="text-xl font-bold mb-2">返佣模式</span>
                            <span className="text-sm opacity-90">60% + 40%返佣</span>
                            <span className="text-xs mt-2 opacity-75">首付: ¥{(order.totalAmount * 0.3).toLocaleString()}</span>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* 已选择结算模式显示 */}
                    {order.settlementMode && (
                      <div className={`border-2 rounded-xl p-4 mb-4 ${
                        order.settlementMode === 'supplier_transfer' 
                          ? 'bg-indigo-50 border-indigo-300' 
                          : 'bg-purple-50 border-purple-300'
                      }`}>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{order.settlementMode === 'supplier_transfer' ? '🚚' : '💰'}</span>
                          <div>
                            <p className="font-bold text-lg">
                              {order.settlementMode === 'supplier_transfer' ? '供应商调货模式' : '返佣模式'}
                            </p>
                            <p className="text-sm text-gray-600">已选择结算模式</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* 商品和地址信息 */}
                    <div className="grid md:grid-cols-2 gap-3">
                      {/* 套餐订单显示 */}
                      {(order as any).orderType === 'package' && (order as any).packageInfo ? (
                        <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                          <div className="flex items-center gap-2 text-amber-700 font-semibold mb-4 text-base">
                            <Sparkles className="h-4 w-4" /> 套餐订单: {(order as any).packageInfo.packageName}
                          </div>
                          <div className="text-sm text-amber-600 mb-3">
                            套餐基础价: {formatPrice((order as any).packageInfo.packagePrice || 0)}
                            {(order as any).packageInfo.totalUpgradePrice > 0 && (
                              <span className="text-red-600 font-bold ml-2">
                                材质加价: +¥{(order as any).packageInfo.totalUpgradePrice}
                              </span>
                            )}
                          </div>
                          <div className="space-y-3">
                            {(order as any).packageInfo.selections?.map((selection: any, selIdx: number) => (
                              <div key={selIdx} className="bg-white rounded-lg p-3 border border-amber-100">
                                <p className="font-semibold text-gray-800 text-sm mb-2">{selection.categoryName}</p>
                                {selection.products?.map((product: any, pIdx: number) => (
                                  <div key={pIdx} className="ml-3 mb-2 text-xs text-gray-600 border-l-2 border-amber-200 pl-3">
                                    <p className="font-medium text-gray-800">{product.productName} x{product.quantity}</p>
                                    {product.skuName && <p className="text-gray-500">规格: {product.skuName}</p>}
                                    {/* 材质信息 */}
                                    {(product.selectedMaterials?.fabric || product.materials?.fabric || product.materials?.['面料']) && (
                                      <p>面料: {product.selectedMaterials?.fabric || product.materials?.fabric || product.materials?.['面料']}
                                        {(product.materialUpgradePrices?.fabric > 0 || product.materialUpgradePrices?.['面料'] > 0) && 
                                          <span className="text-red-600 font-bold ml-1">+¥{product.materialUpgradePrices?.fabric || product.materialUpgradePrices?.['面料']}</span>}
                                      </p>
                                    )}
                                    {(product.selectedMaterials?.filling || product.materials?.filling || product.materials?.['填充']) && (
                                      <p>填充: {product.selectedMaterials?.filling || product.materials?.filling || product.materials?.['填充']}
                                        {(product.materialUpgradePrices?.filling > 0 || product.materialUpgradePrices?.['填充'] > 0) && 
                                          <span className="text-red-600 font-bold ml-1">+¥{product.materialUpgradePrices?.filling || product.materialUpgradePrices?.['填充']}</span>}
                                      </p>
                                    )}
                                    {(product.selectedMaterials?.frame || product.materials?.frame || product.materials?.['框架']) && (
                                      <p>框架: {product.selectedMaterials?.frame || product.materials?.frame || product.materials?.['框架']}
                                        {(product.materialUpgradePrices?.frame > 0 || product.materialUpgradePrices?.['框架'] > 0) && 
                                          <span className="text-red-600 font-bold ml-1">+¥{product.materialUpgradePrices?.frame || product.materialUpgradePrices?.['框架']}</span>}
                                      </p>
                                    )}
                                    {(product.selectedMaterials?.leg || product.materials?.leg || product.materials?.['脚架']) && (
                                      <p>脚架: {product.selectedMaterials?.leg || product.materials?.leg || product.materials?.['脚架']}
                                        {(product.materialUpgradePrices?.leg > 0 || product.materialUpgradePrices?.['脚架'] > 0) && 
                                          <span className="text-red-600 font-bold ml-1">+¥{product.materialUpgradePrices?.leg || product.materialUpgradePrices?.['脚架']}</span>}
                                      </p>
                                    )}
                                    {(product.upgradePrice > 0 || product.materialUpgrade > 0) && (
                                      <p className="text-red-600 font-medium mt-1">商品加价: +¥{product.upgradePrice || product.materialUpgrade}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : order.items && order.items.length > 0 ? (
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                          <div className="flex items-center gap-2 text-gray-700 font-semibold mb-4 text-base">
                            <ShoppingCart className="h-4 w-4" /> 商品清单 ({order.items.length})
                          </div>
                          <div className="space-y-3">
                            {order.items.map((item, itemIndex) => {
                              const productObj = typeof item.product === 'object' ? item.product : null
                              // 优先使用SKU图片，回退到商品图片
                              const skuImages = (item as any).sku?.images
                              const productImage = skuImages?.[0] || item.productImage || (item as any).image || productObj?.images?.[0]
                              // 直接从订单项获取保存的规格和材质信息
                              const itemSpecs = (item as any).specifications || {}
                              const itemMaterials = (item as any).selectedMaterials || {}
                              const itemUpgradePrices = (item as any).materialUpgradePrices || {}
                              const dims = (item as any).skuDimensions || {}
                              const fabricValue = itemSpecs.material || itemMaterials.fabric || itemMaterials['面料']
                              
                              return (
                                <div key={itemIndex} className="bg-white rounded-lg p-3 border border-gray-100">
                                  {/* 商品图片和基本信息 */}
                                  <div className="flex gap-3">
                                    {/* 商品图片 */}
                                    {productImage ? (
                                      <img
                                        src={getFileUrl(productImage)}
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
                                        {(itemSpecs.size || (item as any).spec) && (
                                          <p><span className="text-gray-500 font-medium">规格:</span> {itemSpecs.size || (item as any).spec}</p>
                                        )}

                                        {/* 尺寸（长×宽×高） */}
                                        {(dims.length || dims.width || dims.height || itemSpecs.dimensions) && (
                                          <p>
                                            <span className="text-gray-500 font-medium">尺寸:</span>{' '}
                                            {itemSpecs.dimensions || `${dims.length || '-'}×${dims.width || '-'}×${dims.height || '-'}`} CM
                                          </p>
                                        )}
                                        
                                        {/* 材质信息 - 优先从订单项的 selectedMaterials 和 specifications 获取 */}
                                        {fabricValue && (
                                          <p>
                                            <span className="text-gray-500 font-medium">面料:</span>{' '}
                                            <span className={itemUpgradePrices[fabricValue] > 0 ? 'text-red-600 font-bold' : ''}>
                                              {fabricValue}
                                              {itemUpgradePrices[fabricValue] > 0 && ` +¥${itemUpgradePrices[fabricValue]}`}
                                            </span>
                                          </p>
                                        )}
                                        {(itemSpecs.fill || itemMaterials.filling) && (
                                          <p>
                                            <span className="text-gray-500 font-medium">填充:</span>{' '}
                                            <span className={itemUpgradePrices[itemSpecs.fill || itemMaterials.filling] > 0 ? 'text-red-600 font-bold' : ''}>
                                              {itemSpecs.fill || itemMaterials.filling}
                                              {itemUpgradePrices[itemSpecs.fill || itemMaterials.filling] > 0 && ` +¥${itemUpgradePrices[itemSpecs.fill || itemMaterials.filling]}`}
                                            </span>
                                          </p>
                                        )}
                                        {(itemSpecs.frame || itemMaterials.frame) && (
                                          <p>
                                            <span className="text-gray-500 font-medium">框架:</span>{' '}
                                            <span className={itemUpgradePrices[itemSpecs.frame || itemMaterials.frame] > 0 ? 'text-red-600 font-bold' : ''}>
                                              {itemSpecs.frame || itemMaterials.frame}
                                              {itemUpgradePrices[itemSpecs.frame || itemMaterials.frame] > 0 && ` +¥${itemUpgradePrices[itemSpecs.frame || itemMaterials.frame]}`}
                                            </span>
                                          </p>
                                        )}
                                        {(itemSpecs.leg || itemMaterials.leg) && (
                                          <p>
                                            <span className="text-gray-500 font-medium">脚架:</span>{' '}
                                            <span className={itemUpgradePrices[itemSpecs.leg || itemMaterials.leg] > 0 ? 'text-red-600 font-bold' : ''}>
                                              {itemSpecs.leg || itemMaterials.leg}
                                              {itemUpgradePrices[itemSpecs.leg || itemMaterials.leg] > 0 && ` +¥${itemUpgradePrices[itemSpecs.leg || itemMaterials.leg]}`}
                                            </span>
                                          </p>
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
                      ) : null}

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

                    {/* 订单分发按钮 */}
                    {!(order as any).dispatchStatus && (
                      <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!window.confirm('确定要将此订单分发给厂家吗？')) return
                            try {
                              const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/manufacturer-orders/dispatch/${order._id}`, {
                                method: 'POST',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                  'Content-Type': 'application/json'
                                }
                              })
                              const data = await response.json()
                              if (data.success) {
                                toast.success(data.message || '订单已分发')
                                loadOrders()
                              } else {
                                toast.error(data.message || '分发失败')
                              }
                            } catch (error) {
                              toast.error('分发失败')
                            }
                          }}
                          className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2 font-medium"
                        >
                          <Truck className="h-4 w-4" />
                          分发给厂家
                        </button>
                      </div>
                    )}
                    {(order as any).dispatchStatus === 'dispatched' && (
                      <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                        <div className="flex items-center justify-center gap-2 text-green-700 font-medium">
                          <CheckCircle2 className="h-4 w-4" />
                          已分发给厂家
                        </div>
                      </div>
                    )}

                    {/* 取消申请处理 */}
                    {order.cancelRequest && (
                      <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                        <div className="flex items-center gap-2 text-orange-700 font-semibold mb-3">
                          <AlertCircle className="h-4 w-4" />
                          客户申请取消订单
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!window.confirm('确定要批准取消此订单吗？')) return
                              try {
                                const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/cancel-approve`, {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                    'Content-Type': 'application/json'
                                  }
                                })
                                if (response.ok) {
                                  toast.success('已批准取消')
                                  loadOrders()
                                } else {
                                  toast.error('操作失败')
                                }
                              } catch (error) {
                                toast.error('操作失败')
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            批准取消
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!window.confirm('确定要拒绝取消请求吗？')) return
                              try {
                                const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/cancel-reject`, {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                    'Content-Type': 'application/json'
                                  }
                                })
                                if (response.ok) {
                                  toast.success('已拒绝取消请求')
                                  loadOrders()
                                } else {
                                  toast.error('操作失败')
                                }
                              } catch (error) {
                                toast.error('操作失败')
                              }
                            }}
                            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                          >
                            拒绝取消
                          </button>
                        </div>
                      </div>
                    )}

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

                      {/* 确认订单按钮 - 仅待确认状态显示 */}
                      {order.status === 0 && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation()
                              if (!window.confirm('确认此订单后，用户将可以进行付款。确定要确认吗？')) return
                              try {
                                const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/manufacturer-confirm`, {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                    'Content-Type': 'application/json'
                                  }
                                })
                                if (response.ok) {
                                  toast.success('订单已确认，等待用户付款')
                                  loadOrders()
                                } else {
                                  const data = await response.json()
                                  toast.error(data.message || '确认失败')
                                }
                              } catch (error) {
                                toast.error('确认失败')
                              }
                            }}
                            className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            确认订单
                          </button>
                        </div>
                      )}

                      {/* 结算模式选择 - 待付款状态且未选择模式时显示 */}
                      {(order.status === 1 || order.status === 'pending') && !order.settlementMode && (
                        <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-100">
                          <p className="text-sm font-medium text-indigo-800 mb-3">选择结算模式</p>
                          <div className="space-y-2">
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!window.confirm(`供应商调货模式（一键到底）\n\n原价: ¥${order.totalAmount?.toLocaleString()}\n最低折扣价(60%): ¥${(order.totalAmount * 0.6).toLocaleString()}\n返佣(40%): ¥${(order.totalAmount * 0.6 * 0.4).toLocaleString()}\n\n实付金额: ¥${(order.totalAmount * 0.6 * 0.6).toLocaleString()}\n\n确定选择此模式？`)) return
                                try {
                                  const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/settlement-mode`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ settlementMode: 'supplier_transfer', minDiscountRate: 0.6, commissionRate: 0.4 })
                                  })
                                  if (response.ok) {
                                    toast.success('已选择供应商调货模式')
                                    loadOrders()
                                  } else {
                                    const data = await response.json()
                                    toast.error(data.message || '设置失败')
                                  }
                                } catch (error) { toast.error('设置失败') }
                              }}
                              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                            >
                              供应商调货（一键到底 36%）
                            </button>
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!window.confirm(`返佣模式\n\n原价: ¥${order.totalAmount?.toLocaleString()}\n最低折扣价(60%): ¥${(order.totalAmount * 0.6).toLocaleString()}\n\n首付(50%): ¥${(order.totalAmount * 0.6 * 0.5).toLocaleString()}\n尾款(50%): ¥${(order.totalAmount * 0.6 * 0.5).toLocaleString()}\n\n返佣(40%): ¥${(order.totalAmount * 0.6 * 0.4).toLocaleString()}（完成后申请）\n\n确定选择此模式？`)) return
                                try {
                                  const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/settlement-mode`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ settlementMode: 'commission_mode', minDiscountRate: 0.6, commissionRate: 0.4, paymentRatio: 50 })
                                  })
                                  if (response.ok) {
                                    toast.success('已选择返佣模式')
                                    loadOrders()
                                  } else {
                                    const data = await response.json()
                                    toast.error(data.message || '设置失败')
                                  }
                                } catch (error) { toast.error('设置失败') }
                              }}
                              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                            >
                              返佣模式（60% + 40%返佣）
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 开票信息 */}
                      {order.needInvoice && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 mb-3">
                          <p className="text-sm font-medium mb-2 text-amber-800">🧾 需要开票</p>
                          <div className="text-xs space-y-1 text-amber-700">
                            <p>发票类型: {order.invoiceInfo?.invoiceType === 'company' ? '企业发票' : '个人发票'}</p>
                            <p>发票抬头: {order.invoiceInfo?.title || '-'}</p>
                            {order.invoiceInfo?.taxNumber && <p>税号: {order.invoiceInfo.taxNumber}</p>}
                            {order.invoiceInfo?.bankName && <p>开户银行: {order.invoiceInfo.bankName}</p>}
                            {order.invoiceInfo?.bankAccount && <p>银行账号: {order.invoiceInfo.bankAccount}</p>}
                            {order.invoiceInfo?.companyAddress && <p>企业地址: {order.invoiceInfo.companyAddress}</p>}
                            {order.invoiceInfo?.companyPhone && <p>企业电话: {order.invoiceInfo.companyPhone}</p>}
                            {order.invoiceInfo?.email && <p>收票邮箱: {order.invoiceInfo.email}</p>}
                            {order.invoiceInfo?.phone && <p>收票手机: {order.invoiceInfo.phone}</p>}
                            {order.invoiceInfo?.mailingAddress && <p>邮寄地址: {order.invoiceInfo.mailingAddress}</p>}
                            {order.invoiceMarkupAmount > 0 && (
                              <p className="font-bold text-amber-600">开票加价: +¥{order.invoiceMarkupAmount?.toLocaleString()} ({order.invoiceMarkupPercent}%)</p>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-amber-800 font-medium">开票状态</span>
                            <select
                              value={(order as any).invoiceStatus || 'pending'}
                              onChange={(e) => {
                                handleInvoiceStatusChange(order._id, e.target.value)
                              }}
                              className="text-xs px-2 py-1 rounded border border-amber-200 bg-white text-amber-800"
                            >
                              <option value="pending">待开票</option>
                              <option value="processing">开票中</option>
                              <option value="issued">已开票</option>
                              <option value="sent">已寄出</option>
                            </select>
                          </div>
                        </div>
                      )}

                      {/* 已选择结算模式时显示信息 */}
                      {order.settlementMode && (
                        <div className={`p-3 rounded-lg ${order.settlementMode === 'supplier_transfer' ? 'bg-indigo-50 border border-indigo-100' : 'bg-purple-50 border border-purple-100'}`}>
                          <p className="text-sm font-medium mb-2">
                            {order.settlementMode === 'supplier_transfer' ? '🚚 供应商调货模式' : '💰 返佣模式'}
                          </p>
                          <div className="text-xs space-y-1">
                            <p>原价: ¥{order.originalPrice?.toLocaleString() || 0}</p>
                            <p>最低折扣价: ¥{order.minDiscountPrice?.toLocaleString() || 0}</p>
                            {order.invoiceMarkupAmount > 0 && (
                              <p className="text-amber-600">开票加价: +¥{order.invoiceMarkupAmount?.toLocaleString()}</p>
                            )}
                            {order.settlementMode === 'supplier_transfer' ? (
                              <p className="font-bold text-indigo-700">实付: ¥{order.supplierPrice?.toLocaleString() || 0}</p>
                            ) : (
                              <>
                                {order.paymentRatioEnabled && (
                                  <>
                                    <p>首付({order.paymentRatio}%): ¥{order.firstPaymentAmount?.toLocaleString() || 0}</p>
                                    <p>尾款: ¥{order.remainingPaymentAmount?.toLocaleString() || 0} 
                                      <span className={`ml-1 ${order.remainingPaymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
                                        ({order.remainingPaymentStatus === 'paid' ? '已付' : '待付'})
                                      </span>
                                    </p>
                                  </>
                                )}
                                <p className="text-purple-700">返佣: ¥{order.commissionAmount?.toLocaleString() || 0}
                                  <span className="ml-1">
                                    ({order.commissionStatus === 'pending' ? '待申请' : order.commissionStatus === 'applied' ? '已申请' : order.commissionStatus === 'approved' ? '已核销' : order.commissionStatus === 'paid' ? '已发放' : '-'})
                                  </span>
                                </p>
                              </>
                            )}
                          </div>
                          
                          {/* 尾款收款按钮 */}
                          {order.settlementMode === 'commission_mode' && order.paymentRatioEnabled && order.remainingPaymentStatus !== 'paid' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/request-remaining-payment`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
                                  })
                                  if (response.ok) {
                                    toast.success('尾款收款提醒已发送')
                                    loadOrders()
                                  } else {
                                    const data = await response.json()
                                    toast.error(data.message || '发送失败')
                                  }
                                } catch (error) { toast.error('发送失败') }
                              }}
                              className="mt-2 w-full px-3 py-1.5 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600"
                            >
                              发起尾款收款
                            </button>
                          )}
                          
                          {/* 返佣核销按钮 */}
                          {order.settlementMode === 'commission_mode' && order.commissionStatus === 'applied' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!window.confirm(`确认核销返佣 ¥${order.commissionAmount?.toLocaleString()}？`)) return
                                try {
                                  const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/approve-commission`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
                                  })
                                  if (response.ok) {
                                    toast.success('返佣已核销')
                                    loadOrders()
                                  } else {
                                    const data = await response.json()
                                    toast.error(data.message || '核销失败')
                                  }
                                } catch (error) { toast.error('核销失败') }
                              }}
                              className="mt-2 w-full px-3 py-1.5 bg-purple-500 text-white rounded text-xs font-medium hover:bg-purple-600"
                            >
                              核销返佣
                            </button>
                          )}
                          
                          {/* 返佣发放按钮 */}
                          {order.settlementMode === 'commission_mode' && order.commissionStatus === 'approved' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation()
                                if (!window.confirm(`确认发放返佣 ¥${order.commissionAmount?.toLocaleString()}？`)) return
                                try {
                                  const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/pay-commission`, {
                                    method: 'POST',
                                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
                                  })
                                  if (response.ok) {
                                    toast.success('返佣已发放')
                                    loadOrders()
                                  } else {
                                    const data = await response.json()
                                    toast.error(data.message || '发放失败')
                                  }
                                } catch (error) { toast.error('发放失败') }
                              }}
                              className="mt-2 w-full px-3 py-1.5 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600"
                            >
                              发放返佣
                            </button>
                          )}
                        </div>
                      )}

                      {/* 改价按钮 - 仅待付款状态可改价 */}
                      {(order.status === 1 || order.status === 'pending') && (
                        <div className="p-3 rounded-lg bg-orange-50 border border-orange-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openPriceModal(order)
                            }}
                            className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Edit2 className="h-4 w-4" />
                            修改订单价格
                          </button>
                        </div>
                      )}

                      {/* 删除订单按钮 */}
                      <div className="p-3 rounded-lg bg-red-50 border border-red-100">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (!window.confirm('确定要删除此订单吗？订单将移至回收站。')) return
                            try {
                              const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}`, {
                                method: 'DELETE',
                                headers: {
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`,
                                  'Content-Type': 'application/json'
                                }
                              })
                              if (response.ok) {
                                toast.success('订单已移至回收站')
                                loadOrders()
                              } else {
                                const data = await response.json()
                                toast.error(data.message || '删除失败')
                              }
                            } catch (error) {
                              toast.error('删除失败')
                            }
                          }}
                          className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <AlertCircle className="h-4 w-4" />
                          删除订单
                        </button>
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

      {/* 改价弹窗 */}
      {showPriceModal && selectedOrderForPricing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">订单改价</h3>
            <p className="text-sm text-gray-500 mb-4">订单号: {selectedOrderForPricing.orderNo}</p>
            
            {/* 改价模式选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">改价方式</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setPriceEditMode('flat')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priceEditMode === 'flat'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  整单一口价
                </button>
                <button
                  onClick={() => setPriceEditMode('itemized')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    priceEditMode === 'itemized'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  商品逐项改价
                </button>
              </div>
            </div>

            {/* 原价格显示 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                原价格
              </label>
              <div className="text-lg font-bold text-gray-400 line-through">
                ¥{formatPrice(selectedOrderForPricing.totalAmount)}
              </div>
            </div>
            
            {priceEditMode === 'flat' ? (
              /* 一口价模式 */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    新价格 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="请输入新价格"
                  />
                </div>
              </div>
            ) : (
              /* 逐项改价模式 */
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  商品价格明细 <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  {(() => {
                    const products = getProducts(selectedOrderForPricing)
                    let totalItemPrice = 0
                    Object.values(itemPrices).forEach(price => {
                      totalItemPrice += parseFloat(price || '0')
                    })
                    
                    return (
                      <>
                        {products.map((product, index) => (
                          <div key={index} className={`flex items-center gap-4 p-4 ${index > 0 ? 'border-t border-gray-100' : ''}`}>
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              {product.image ? (
                                <img 
                                  src={getFileUrl(product.image)} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{product.name}</div>
                              <div className="text-sm text-gray-500">x{product.quantity}</div>
                            </div>
                            <div className="w-32">
                              <input
                                type="number"
                                step="0.01"
                                value={itemPrices[index] || ''}
                                onChange={(e) => setItemPrices(prev => ({
                                  ...prev,
                                  [index]: e.target.value
                                }))}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                placeholder="价格"
                              />
                            </div>
                          </div>
                        ))}
                        <div className="bg-gray-50 px-4 py-3 flex justify-between items-center border-t border-gray-200">
                          <span className="font-medium text-gray-700">总计</span>
                          <span className="text-lg font-bold text-blue-600">
                            ¥{formatPrice(totalItemPrice)}
                          </span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              </div>
            )}
            
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                改价原因（可选）
              </label>
              <input
                type="text"
                value={priceReason}
                onChange={(e) => setPriceReason(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="如：优惠活动、会员折扣等"
              />
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleChangePrice}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
              >
                确认改价
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

