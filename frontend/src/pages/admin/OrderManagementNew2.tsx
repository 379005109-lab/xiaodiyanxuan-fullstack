import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Search, Download, ArrowLeft, User, Phone, MapPin,
  Package, Clock, CheckCircle2, Truck, AlertCircle, FileText, Trash2, Check, XCircle, X,
  Eye, EyeOff, Edit2, Ban, CreditCard, ChevronDown, MessageSquare, Plus, Tag, Image as ImageIcon, Copy, RotateCcw
} from 'lucide-react'
import { toast } from 'sonner'
import { Order, OrderStatus } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'

type TabType = 'all' | 'pending' | 'shipping' | 'afterSale' | 'cancelled'

// 订单状态配置 - 匹配后端常量
const statusConfig: Record<number | string, { label: string; color: string; bgColor: string }> = {
  1: { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'pending': { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  9: { label: '待确认收款', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  'pending_payment_verify': { label: '待确认收款', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  2: { label: '待发货', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'paid': { label: '待发货', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  3: { label: '待收货', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'processing': { label: '待收货', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'shipped': { label: '待收货', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  4: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100' },
  'completed': { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100' },
  5: { label: '已取消', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  'cancelled': { label: '已取消', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  6: { label: '退款中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  'refunding': { label: '退款中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  7: { label: '已退款', color: 'text-red-600', bgColor: 'bg-red-100' },
  'refunded': { label: '已退款', color: 'text-red-600', bgColor: 'bg-red-100' },
  8: { label: '换货中', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  'exchanging': { label: '换货中', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  // 分期付款状态
  10: { label: '定金已付', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  'deposit_paid': { label: '定金已付', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  11: { label: '生产中', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  'in_production': { label: '生产中', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  12: { label: '待付尾款', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  'awaiting_final_payment': { label: '待付尾款', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  13: { label: '尾款已付', color: 'text-rose-600', bgColor: 'bg-rose-100' },
  'final_payment_paid': { label: '尾款已付', color: 'text-rose-600', bgColor: 'bg-rose-100' },
}

// 隐藏手机号中间4位
const maskPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

// 隐藏地址
const maskAddress = (address: string) => {
  if (!address) return ''
  if (address.length > 15) {
    return address.slice(0, 15) + '******'
  }
  return address
}

export default function OrderManagementNew2() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [showCustomerInfo, setShowCustomerInfo] = useState(false) // 客户信息显示状态
  const [showStatusEdit, setShowStatusEdit] = useState(false) // 状态编辑弹窗
  const [showPaymentModal, setShowPaymentModal] = useState(false) // 支付渠道选择弹窗
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('') // 选择的支付方式
  const [showShippingModal, setShowShippingModal] = useState(false) // 发货物流弹窗
  const [shippingInfo, setShippingInfo] = useState({ company: '', trackingNo: '' }) // 物流信息
  const [showVerifyPaymentModal, setShowVerifyPaymentModal] = useState(false) // 确认收款弹窗
  const [verifyPaymentMethod, setVerifyPaymentMethod] = useState<string>('') // 确认的收款方式
  const [showCancelModal, setShowCancelModal] = useState(false) // 取消订单弹窗
  const [cancelReason, setCancelReason] = useState('') // 取消原因
  const [showRemarkEdit, setShowRemarkEdit] = useState(false) // 备注编辑
  const [remarkText, setRemarkText] = useState('') // 备注内容
  const [showFollowUpModal, setShowFollowUpModal] = useState(false) // 跟进记录弹窗
  const [followUpText, setFollowUpText] = useState('') // 跟进内容
  const [orderLogs, setOrderLogs] = useState<any[]>([]) // 订单动态记录
  const [isAdmin, setIsAdmin] = useState(true) // 是否超级管理员（后续从用户信息获取）
  const [showPriceModal, setShowPriceModal] = useState(false) // 改价弹窗
  const [priceEditMode, setPriceEditMode] = useState<'flat' | 'itemized'>('flat') // 改价模式：一口价或逐项改价
  const [newPrice, setNewPrice] = useState('') // 新价格
  const [priceReason, setPriceReason] = useState('') // 改价原因
  const [itemPrices, setItemPrices] = useState<{[key: number]: string}>({}) // 单个商品价格
  
  // 分单相关状态
  const [showSplitModal, setShowSplitModal] = useState(false) // 分单弹窗
  const [splitOrderId, setSplitOrderId] = useState<string | null>(null) // 当前分单的订单ID
  const [splittingOrder, setSplittingOrder] = useState(false) // 分单中状态
  
  // 分期付款相关状态
  const [showVerifyDepositModal, setShowVerifyDepositModal] = useState(false) // 核销定金弹窗
  const [depositVerifyMethod, setDepositVerifyMethod] = useState<string>('') // 定金核销收款方式
  const [productionDays, setProductionDays] = useState<string>('') // 预计生产天数
  const [showVerifyFinalModal, setShowVerifyFinalModal] = useState(false) // 核销尾款弹窗
  const [finalVerifyMethod, setFinalVerifyMethod] = useState<string>('') // 尾款核销收款方式
  const [showCommissionModeModal, setShowCommissionModeModal] = useState(false) // 返佣模式设置弹窗
  const [commissionProductionDays, setCommissionProductionDays] = useState<string>('30') // 返佣模式生产周期
  
  // 统计数据
  const [stats, setStats] = useState({
    all: 0,
    pending: 0,
    shipping: 0,
    afterSale: 0,
    cancelled: 0
  })

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      console.log('[OrderManagement] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'null')
      
      if (!token) {
        toast.error('请先登录')
        navigate('/')
        return
      }
      
      // 使用完整的公网地址
      const apiUrl = 'https://pkochbpmcgaa.sealoshzh.site/api/orders?pageSize=10000'
      console.log('[OrderManagement] Fetching from:', apiUrl)
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log('[OrderManagement] Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[OrderManagement] Error response:', errorText)
        throw new Error(`加载失败: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('[OrderManagement] Received data - total:', data.pagination?.total, 'count:', data.data?.length)
      console.log('[OrderManagement] Order numbers:', data.data?.map(o => o.orderNo))
      const allOrders: Order[] = data.data || []
      
      // 按时间倒序
      allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      
      setOrders(allOrders)
      
      // 计算统计 - 匹配后端状态常量
      setStats({
        all: allOrders.length,
        pending: allOrders.filter(o => o.status === 1 || o.status === 'pending').length,
        shipping: allOrders.filter(o => o.status === 2 || o.status === 3 || o.status === 'paid' || o.status === 'processing' || o.status === 'shipped').length,
        afterSale: allOrders.filter(o => o.status === 6 || o.status === 7 || o.status === 8 || o.status === 'refunding' || o.status === 'refunded' || o.status === 'exchanging' || (o as any).refundStatus).length,
        cancelled: allOrders.filter(o => o.status === 5 || o.status === 'cancelled').length,
      })
    } catch (error: any) {
      console.error('加载订单失败:', error)
      const errorMessage = error?.message || '加载订单失败'
      toast.error(errorMessage)
      // Set empty orders on error
      setOrders([])
      setStats({
        all: 0,
        pending: 0,
        shipping: 0,
        afterSale: 0,
        cancelled: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  // 过滤订单 - 匹配后端状态常量
  const filteredOrders = orders.filter(order => {
    // 搜索过滤 - 支持订单号和买家名字搜索
    const recipient = order.recipient || order.shippingAddress
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchOrderNo = order.orderNo?.toLowerCase().includes(query)
      const matchName = recipient?.name?.toLowerCase().includes(query)
      if (!matchOrderNo && !matchName) {
        return false
      }
    }
    
    // Tab过滤 - 匹配后端状态: 1待付款 2待发货 3待收货 4已完成 5已取消 6退款中 7已退款 8换货中
    switch (activeTab) {
      case 'pending':
        return order.status === 1 || order.status === 'pending'
      case 'shipping':
        return order.status === 2 || order.status === 3 || order.status === 'paid' || order.status === 'processing' || order.status === 'shipped'
      case 'afterSale':
        return order.status === 6 || order.status === 7 || order.status === 8 || order.status === 'refunding' || order.status === 'refunded' || order.status === 'exchanging' || (order as any).refundStatus
      case 'cancelled':
        return order.status === 5 || order.status === 'cancelled'
      default:
        return true
    }
  })

  const handleMarkPaid = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod: 'wechat' })
      })
      
      if (response.ok) {
        toast.success('已标记为已付款')
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const selectedOrder = orders.find(o => o._id === selectedOrderId)

  // 获取商品列表 - 支持套餐订单和普通订单
  const getProducts = (order: Order) => {
    if (order.orderType === 'package' && order.packageInfo) {
      const products: any[] = []
      order.packageInfo.selections?.forEach((selection: any) => {
        selection.products?.forEach((product: any) => {
          const materials = product.selectedMaterials || product.materials || {}
          const upgradePrices = product.materialUpgradePrices || {}
          
          products.push({
            name: product.productName,
            quantity: product.quantity,
            skuName: product.skuName,
            manufacturerId: product.manufacturerId,
            manufacturerName: product.manufacturerName,
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
        manufacturerId: item.manufacturerId,
        manufacturerName: item.manufacturerName,
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
  const openPriceModal = (orderId: string) => {
    const order = orders.find(o => o._id === orderId)
    if (order) {
      setSelectedOrderId(orderId)
      setNewPrice(order.totalAmount?.toString() || '0')
      setPriceReason('')
      setPriceEditMode('flat')
      
      // 初始化商品价格
      const products = getProducts(order)
      const prices: {[key: number]: string} = {}
      products.forEach((_, index) => {
        prices[index] = '0'
      })
      setItemPrices(prices)
      
      setShowPriceModal(true)
    }
  }

  // 处理改价
  const handleChangePrice = async () => {
    if (!selectedOrderId) {
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
      priceData.priceMode = 'flat'
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
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${selectedOrderId}/price`, {
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

  // 处理发货
  const handleShip = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 4 }) // 4 = 已发货
      })
      
      if (response.ok) {
        toast.success('订单已发货')
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 更新订单状态
  const handleUpdateStatus = async (orderId: string, newStatus: number) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      if (response.ok) {
        toast.success('状态已更新')
        setShowStatusEdit(false)
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 取消订单（带原因）
  const handleCancelOrderWithReason = async (orderId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 5, // 5 = 已取消
          cancelReason: reason
        })
      })
      
      if (response.ok) {
        toast.success('订单已取消')
        setShowCancelModal(false)
        setCancelReason('')
        addOrderLog(orderId, 'cancel', `订单已取消，原因：${reason || '未填写'}`)
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 删除订单（移至回收站）
  const handleDeleteOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      })
      
      if (response.ok) {
        toast.success('订单已移至回收站')
        setSelectedOrderId(null)
        loadOrders()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }

  // 标记付款（带支付渠道）
  const handleMarkPaidWithChannel = async (orderId: string, paymentMethod: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod })
      })
      
      if (response.ok) {
        const methodLabels: Record<string, string> = { wechat: '微信', alipay: '支付宝', bank: '对公账户' }
        toast.success('已标记为已付款')
        setShowPaymentModal(false)
        setSelectedPaymentMethod('')
        addOrderLog(orderId, 'payment', `订单已付款，支付渠道：${methodLabels[paymentMethod] || paymentMethod}`)
        loadOrders()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 发货（带物流信息）
  const handleShipWithTracking = async (orderId: string) => {
    if (!shippingInfo.company || !shippingInfo.trackingNo) {
      toast.error('请填写完整的物流信息')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: 3, // 3 = 待收货（已发货）
          shippingCompany: shippingInfo.company,
          trackingNumber: shippingInfo.trackingNo
        })
      })
      
      if (response.ok) {
        toast.success('订单已发货')
        setShowShippingModal(false)
        setShippingInfo({ company: '', trackingNo: '' })
        addOrderLog(orderId, 'ship', `订单已发货，${shippingInfo.company}：${shippingInfo.trackingNo}`)
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 确认收款（核销）
  const handleVerifyPayment = async (orderId: string) => {
    if (!verifyPaymentMethod) {
      toast.error('请选择收款方式')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod: verifyPaymentMethod })
      })
      
      if (response.ok) {
        const methodText = verifyPaymentMethod === 'wechat' ? '微信' : verifyPaymentMethod === 'alipay' ? '支付宝' : '银行卡'
        toast.success(`已确认收款(${methodText})`)
        setShowVerifyPaymentModal(false)
        setVerifyPaymentMethod('')
        addOrderLog(orderId, 'verify_payment', `已确认收款(${methodText})`)
        loadOrders()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // ==================== 分期付款相关处理函数 ====================
  
  // 核销定金并设置生产周期
  const handleVerifyDeposit = async (orderId: string) => {
    if (!depositVerifyMethod) {
      toast.error('请选择收款方式')
      return
    }
    if (!productionDays || parseInt(productionDays) < 1) {
      toast.error('请填写预计生产天数')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/verify-deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          paymentMethod: depositVerifyMethod,
          estimatedProductionDays: parseInt(productionDays)
        })
      })
      
      if (response.ok) {
        const methodText = depositVerifyMethod === 'wechat' ? '微信' : depositVerifyMethod === 'alipay' ? '支付宝' : '银行卡'
        toast.success(`定金已核销(${methodText})，开始生产`)
        setShowVerifyDepositModal(false)
        setDepositVerifyMethod('')
        setProductionDays('')
        addOrderLog(orderId, 'verify_deposit', `定金已核销(${methodText})，预计生产${productionDays}天`)
        loadOrders()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 发起尾款请求
  const handleRequestFinalPayment = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/request-final-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      })
      
      if (response.ok) {
        toast.success('已发起尾款请求，等待客户支付')
        addOrderLog(orderId, 'request_final', '发起尾款请求')
        loadOrders()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 核销尾款
  const handleVerifyFinalPayment = async (orderId: string) => {
    if (!finalVerifyMethod) {
      toast.error('请选择收款方式')
      return
    }
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/verify-final-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod: finalVerifyMethod })
      })
      
      if (response.ok) {
        const methodText = finalVerifyMethod === 'wechat' ? '微信' : finalVerifyMethod === 'alipay' ? '支付宝' : '银行卡'
        toast.success(`尾款已核销(${methodText})，可以发货`)
        setShowVerifyFinalModal(false)
        setFinalVerifyMethod('')
        addOrderLog(orderId, 'verify_final', `尾款已核销(${methodText})`)
        loadOrders()
      } else {
        const data = await response.json().catch(() => ({}))
        toast.error(data.message || '操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // ==================== 分期付款处理函数结束 ====================

  // 完成订单
  const handleCompleteOrder = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 4 }) // 4 = 已完成
      })
      
      if (response.ok) {
        toast.success('订单已完成')
        addOrderLog(orderId, 'complete', '订单已完成')
        loadOrders()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 保存商家备注
  const handleSaveRemark = async (orderId: string, remark: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ adminNote: remark })
      })
      
      if (response.ok) {
        toast.success('备注已保存')
        setShowRemarkEdit(false)
        addOrderLog(orderId, 'remark', `更新商家备注：${remark}`)
        loadOrders()
      } else {
        toast.error('保存失败')
      }
    } catch (error) {
      toast.error('保存失败')
    }
  }

  // 添加跟进记录
  const handleAddFollowUp = async (orderId: string, content: string) => {
    if (!content.trim()) {
      toast.error('请输入跟进内容')
      return
    }
    // TODO: 调用API保存跟进记录
    addOrderLog(orderId, 'followup', content)
    toast.success('跟进记录已添加')
    setShowFollowUpModal(false)
    setFollowUpText('')
  }

  // 添加订单动态记录（本地模拟，后续改为API）
  const addOrderLog = (orderId: string, type: string, content: string) => {
    const newLog = {
      id: Date.now().toString(),
      orderId,
      type,
      content,
      operator: 'admin', // 后续从用户信息获取
      createdAt: new Date().toISOString()
    }
    setOrderLogs(prev => [newLog, ...prev])
  }

  // 导出订单到Excel
  const handleExportExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error('没有可导出的订单')
      return
    }
    
    const exportData = filteredOrders.map(order => {
      const products = getProducts(order)
      const status = statusConfig[order.status] || statusConfig[1]
      
      return {
        '订单号': order.orderNo,
        '创建时间': new Date(order.createdAt).toLocaleString('zh-CN'),
        '商品信息': products.map((p: any) => `${p.name}x${p.quantity}`).join('; '),
        '订单状态': status.label,
        '商家备注': (order as any).adminNote || '',
        '物流公司': (order as any).shippingCompany || '',
        '物流单号': (order as any).trackingNumber || '',
      }
    })
    
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '订单列表')
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 20 }, // 订单号
      { wch: 20 }, // 创建时间
      { wch: 40 }, // 商品信息
      { wch: 10 }, // 订单状态
      { wch: 30 }, // 商家备注
      { wch: 15 }, // 物流公司
      { wch: 20 }, // 物流单号
    ]
    
    XLSX.writeFile(wb, `订单导出_${new Date().toLocaleDateString('zh-CN')}.xlsx`)
    toast.success(`已导出 ${filteredOrders.length} 条订单`)
  }

  // 导出订单清单图片（包含商品图片、规格、材质、数量等）
  const handleExportImages = async () => {
    if (!selectedOrder) {
      toast.error('请先选择一个订单')
      return
    }
    
    const products = getProducts(selectedOrder)
    if (products.length === 0) {
      toast.error('该订单没有商品')
      return
    }
    const status = statusConfig[selectedOrder.status] || statusConfig[1]

    const manufacturerGroups = new Map<string, { manufacturerId: string; manufacturerName: string; products: any[] }>()
    products.forEach((p: any) => {
      const manufacturerId = String(p.manufacturerId || 'unknown')
      const manufacturerName = p.manufacturerName || '未分配厂家'
      if (!manufacturerGroups.has(manufacturerId)) {
        manufacturerGroups.set(manufacturerId, { manufacturerId, manufacturerName, products: [] })
      }
      manufacturerGroups.get(manufacturerId)!.products.push(p)
    })

    const sanitizeFileName = (name: string) => (name || '').replace(/[\\/:*?"<>|]/g, '_')

    const buildSpecHtml = (p: any) => {
      const specs = p.specifications || p.specs || {}
      const selectedMaterials = p.selectedMaterials || p.materials || {}
      const merged: Record<string, any> = { ...specs, ...selectedMaterials }

      const keyMap: Record<string, string> = {
        'size': '尺寸',
        'spec': '规格',
        'material': '材质',
        'fabric': '面料',
        'filling': '填充',
        'fill': '填充',
        'frame': '框架',
        'color': '颜色',
        'style': '风格',
        'leg': '脚架',
        'legs': '脚架',
        'armrest': '扶手',
        'cushion': '坐垫',
        'back': '靠背',
        'width': '宽度',
        'height': '高度',
        'depth': '深度',
        'length': '长度',
        'seat': '座位',
        'base': '底座',
        'cover': '套面',
        'inner': '内胆',
        'support': '支撑',
        'spring': '弹簧',
        'foam': '海绵',
        'wood': '木材',
        'metal': '金属',
      }

      const lines = Object.entries(merged)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => {
          const displayKey = keyMap[String(k).toLowerCase()] || k
          return `<div style="margin-bottom: 4px;"><span style="color: #6b7280;">${displayKey}：</span>${v}</div>`
        })

      return lines.length > 0 ? lines.join('') : (p.spec ? `<div>${p.spec}</div>` : '<div>-</div>')
    }

    const buildContainerHtml = (group: { manufacturerName: string; products: any[] }) => {
      const manufacturerLine = manufacturerGroups.size > 1
        ? `<p style="margin: 4px 0 0 0; opacity: 0.9;">厂家：${group.manufacturerName}</p>`
        : ''

      return `
        <div style="border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <!-- 订单头部 -->
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px;">
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">订单商品清单</h1>
            <p style="margin: 0; opacity: 0.9;">订单号：${selectedOrder.orderNo}</p>
            <p style="margin: 4px 0 0 0; opacity: 0.9;">下单时间：${new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</p>
            ${manufacturerLine}
          </div>
          
          <!-- 商品清单 -->
          <div style="padding: 20px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">📦 商品清单</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">商品图片</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">商品名称</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">规格/材质</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">数量</th>
                </tr>
              </thead>
              <tbody>
                ${group.products.map((p: any) => {
                  const specHtml = buildSpecHtml(p)
                  return `
                    <tr>
                      <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: middle;">
                        ${p.image ? `<img src="${getFileUrl(p.image)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" crossorigin="anonymous" />` : '<div style="width: 80px; height: 80px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">无图</div>'}
                      </td>
                      <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: middle;">
                        <div style="font-weight: 600; color: #1f2937;">${p.name || '未知商品'}</div>
                        ${p.category ? `<div style=\"margin-top: 4px; font-size: 12px; color: #6b7280;\">分类：${p.category}</div>` : ''}
                      </td>
                      <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: top; color: #4b5563; font-size: 13px;">
                        ${specHtml}
                      </td>
                      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #1f2937; vertical-align: middle;">
                        ×${p.quantity || 1}
                      </td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- 订单状态 -->
          <div style="padding: 20px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 16px; color: #374151;">订单状态：<span style="color: #3b82f6; font-weight: 600;">${status.label}</span></span>
              <span style="font-size: 14px; color: #6b7280;">共 ${group.products.length} 件商品</span>
            </div>
            ${(selectedOrder as any).adminNote ? `<p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">商家备注：${(selectedOrder as any).adminNote}</p>` : ''}
          </div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">生成时间：${new Date().toLocaleString('zh-CN')}</p>
      `
    }

    try {
      toast.loading('正在生成订单图片...')

      for (const group of manufacturerGroups.values()) {
        // 创建一个临时的订单详情容器用于生成图片
        const container = document.createElement('div')
        container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; background: white; padding: 40px; font-family: system-ui, -apple-system, sans-serif;'
        container.innerHTML = buildContainerHtml(group)
        document.body.appendChild(container)

        // 等待图片加载
        const images = container.querySelectorAll('img')
        await Promise.all(Array.from(images).map(img => {
          return new Promise((resolve) => {
            if (img.complete) resolve(true)
            else {
              img.onload = () => resolve(true)
              img.onerror = () => resolve(true)
            }
          })
        }))

        const canvas = await html2canvas(container, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          allowTaint: true,
          logging: false
        })

        // 下载图片
        const link = document.createElement('a')
        const suffix = manufacturerGroups.size > 1 ? `_${sanitizeFileName(group.manufacturerName)}` : ''
        link.download = `订单清单_${selectedOrder.orderNo}${suffix}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()

        document.body.removeChild(container)
      }

      toast.dismiss()
      toast.success(manufacturerGroups.size > 1 ? `订单清单图片已导出（${manufacturerGroups.size}张）` : '订单清单图片已导出')
    } catch (error) {
      console.error('生成图片失败:', error)
      toast.dismiss()
      toast.error('生成图片失败')
    }
  }

  // 导出整单图片（不分单）
  const handleExportWholeOrderImages = async () => {
    if (!selectedOrder) {
      toast.error('请先选择一个订单')
      return
    }
    
    const products = getProducts(selectedOrder)
    if (products.length === 0) {
      toast.error('该订单没有商品')
      return
    }
    const status = statusConfig[selectedOrder.status] || statusConfig[1]

    const sanitizeFileName = (name: string) => (name || '').replace(/[\\/:*?"<>|]/g, '_')

    const buildSpecHtml = (p: any) => {
      const specs = p.specifications || p.specs || {}
      const selectedMaterials = p.selectedMaterials || p.materials || {}
      const merged: Record<string, any> = { ...specs, ...selectedMaterials }

      const keyMap: Record<string, string> = {
        'size': '尺寸', 'spec': '规格', 'material': '材质', 'fabric': '面料',
        'filling': '填充', 'fill': '填充', 'frame': '框架', 'color': '颜色',
        'style': '风格', 'leg': '脚架', 'legs': '脚架', 'armrest': '扶手',
        'cushion': '坐垫', 'back': '靠背',
      }

      const lines = Object.entries(merged)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => {
          const displayKey = keyMap[String(k).toLowerCase()] || k
          return `<div style="margin-bottom: 4px;"><span style="color: #6b7280;">${displayKey}：</span>${v}</div>`
        })

      return lines.length > 0 ? lines.join('') : (p.spec ? `<div>${p.spec}</div>` : '<div>-</div>')
    }

    const buildWholeOrderHtml = () => {
      return `
        <div style="border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 24px;">
            <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: bold;">订单商品清单（完整版）</h1>
            <p style="margin: 0; opacity: 0.9;">订单号：${selectedOrder.orderNo}</p>
            <p style="margin: 4px 0 0 0; opacity: 0.9;">下单时间：${new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</p>
          </div>
          <div style="padding: 20px;">
            <h3 style="margin: 0 0 16px 0; font-size: 16px; color: #374151;">📦 商品清单</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <thead>
                <tr style="background: #f3f4f6;">
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">商品图片</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">商品名称</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">规格/材质</th>
                  <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">厂家</th>
                  <th style="padding: 12px; text-align: center; border: 1px solid #e5e7eb;">数量</th>
                </tr>
              </thead>
              <tbody>
                ${products.map((p: any) => {
                  const specHtml = buildSpecHtml(p)
                  const manufacturerName = p.manufacturerName || '未分配厂家'
                  return `
                    <tr>
                      <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: middle;">
                        ${p.image ? `<img src="${getFileUrl(p.image)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" crossorigin="anonymous" />` : '<div style="width: 80px; height: 80px; background: #e5e7eb; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">无图</div>'}
                      </td>
                      <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: middle;">
                        <div style="font-weight: 600; color: #1f2937;">${p.name || '未知商品'}</div>
                        ${p.category ? `<div style=\"margin-top: 4px; font-size: 12px; color: #6b7280;\">分类：${p.category}</div>` : ''}
                      </td>
                      <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: top; color: #4b5563; font-size: 13px;">
                        ${specHtml}
                      </td>
                      <td style="padding: 12px; border: 1px solid #e5e7eb; vertical-align: middle; color: #4b5563;">
                        ${manufacturerName}
                      </td>
                      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; font-weight: 600; color: #1f2937; vertical-align: middle;">
                        ×${p.quantity || 1}
                      </td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>
          <div style="padding: 20px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 16px; color: #374151;">订单状态：<span style="color: #3b82f6; font-weight: 600;">${status.label}</span></span>
              <span style="font-size: 14px; color: #6b7280;">共 ${products.length} 件商品</span>
            </div>
            ${(selectedOrder as any).adminNote ? `<p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">商家备注：${(selectedOrder as any).adminNote}</p>` : ''}
          </div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">生成时间：${new Date().toLocaleString('zh-CN')}</p>
      `
    }

    try {
      toast.loading('正在生成整单图片...')

      const container = document.createElement('div')
      container.style.cssText = 'position: absolute; left: -9999px; top: 0; width: 800px; background: white; padding: 40px; font-family: system-ui, -apple-system, sans-serif;'
      container.innerHTML = buildWholeOrderHtml()
      document.body.appendChild(container)

      const images = container.querySelectorAll('img')
      await Promise.all(Array.from(images).map(img => {
        return new Promise((resolve) => {
          if (img.complete) resolve(true)
          else {
            img.onload = () => resolve(true)
            img.onerror = () => resolve(true)
          }
        })
      }))

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      })

      const link = document.createElement('a')
      link.download = `订单清单_${selectedOrder.orderNo}_完整版.png`
      link.href = canvas.toDataURL('image/png')
      link.click()

      document.body.removeChild(container)

      toast.dismiss()
      toast.success('整单图片已导出')
    } catch (error) {
      console.error('生成整单图片失败:', error)
      toast.dismiss()
      toast.error('生成整单图片失败')
    }
  }

  // 记录查看客户信息（数据留痕）
  const handleViewCustomerInfo = async (orderId: string) => {
    // 记录查看敏感信息
    addOrderLog(orderId, 'view_sensitive', '查看了客户敏感信息')
    console.log('查看客户信息留痕:', {
      orderId,
      viewedAt: new Date().toISOString(),
      viewedBy: 'admin' // 后续从用户信息获取
    })
    setShowCustomerInfo(true)
  }

  // 关闭敏感信息显示
  const handleHideCustomerInfo = () => {
    setShowCustomerInfo(false)
  }

  // 订单详情页
  if (selectedOrder) {
    const status = statusConfig[selectedOrder.status] || statusConfig[1]
    const recipient = selectedOrder.recipient || selectedOrder.shippingAddress || { name: '', phone: '', address: '' }
    const shippingAddr = selectedOrder.shippingAddress as any
    const address = (recipient as any).address || 
      (shippingAddr ? [shippingAddr.province, shippingAddr.city, shippingAddr.district, shippingAddr.detail].filter(Boolean).join('') : '')
    const products = getProducts(selectedOrder)
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* 顶部导航 */}
        <div className="bg-white px-6 py-4 border-b">
          <button 
            onClick={() => setSelectedOrderId(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            返回订单列表
          </button>
        </div>

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* 订单状态头部 */}
          <div className={`bg-white rounded-2xl p-6 shadow-sm ${selectedOrder.status === 5 || selectedOrder.status === 'cancelled' ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${status.bgColor}`}></span>
                <h1 className={`text-2xl font-bold ${selectedOrder.status === 5 || selectedOrder.status === 'cancelled' ? 'line-through text-gray-400' : ''}`}>
                  {status.label}
                </h1>
                <button 
                  onClick={() => setShowStatusEdit(!showStatusEdit)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  title="编辑状态"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <span className="text-gray-400 text-sm">订单号: {selectedOrder.orderNo}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* 待付款 -> 标记已付 */}
                {(selectedOrder.status === 1 || selectedOrder.status === 'pending') && (
                  <button 
                    onClick={() => setShowPaymentModal(true)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                  >
                    标记已付
                  </button>
                )}
                {/* 待确认收款 -> 确认收款（核销）- 非分期付款 */}
                {selectedOrder.status === 9 && !(selectedOrder as any).paymentRatioEnabled && (
                  <button 
                    onClick={() => {
                      setVerifyPaymentMethod(selectedOrder.paymentMethod || '')
                      setShowVerifyPaymentModal(true)
                    }}
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    确认收款
                  </button>
                )}
                {/* 分期付款：定金已付(10) -> 核销定金 */}
                {selectedOrder.status === 10 && (
                  <button 
                    onClick={() => {
                      setDepositVerifyMethod((selectedOrder as any).depositPaymentMethod || '')
                      setShowVerifyDepositModal(true)
                    }}
                    className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    核销定金
                  </button>
                )}
                {/* 分期付款：生产中(11) -> 发起尾款 */}
                {selectedOrder.status === 11 && (
                  <button 
                    onClick={() => handleRequestFinalPayment(selectedOrder._id)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm flex items-center gap-1"
                  >
                    <CreditCard className="w-4 h-4" />
                    发起尾款
                  </button>
                )}
                {/* 分期付款：尾款已付(13) -> 核销尾款 */}
                {selectedOrder.status === 13 && (
                  <button 
                    onClick={() => {
                      setFinalVerifyMethod((selectedOrder as any).finalPaymentMethod || '')
                      setShowVerifyFinalModal(true)
                    }}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    核销尾款
                  </button>
                )}
                {/* 已付款 -> 发货 */}
                {(selectedOrder.status === 2 || selectedOrder.status === 'paid' || selectedOrder.status === 'processing') && (
                  <button 
                    onClick={() => setShowShippingModal(true)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                  >
                    发货
                  </button>
                )}
                {/* 已发货 -> 完成 */}
                {(selectedOrder.status === 3 || selectedOrder.status === 'shipped') && (
                  <button 
                    onClick={() => handleCompleteOrder(selectedOrder._id)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm"
                  >
                    完成订单
                  </button>
                )}
                {/* 取消申请处理按钮 */}
                {selectedOrder.cancelRequest && (
                  <>
                    <button 
                      onClick={async () => {
                        if (!window.confirm('确定要批准取消此订单吗？')) return
                        try {
                          const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${selectedOrder._id}/cancel-approve`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('token')}`,
                              'Content-Type': 'application/json'
                            }
                          })
                          if (response.ok) {
                            toast.success('已批准取消')
                            loadOrders()
                            setSelectedOrderId(null)
                          } else {
                            toast.error('操作失败')
                          }
                        } catch (error) {
                          toast.error('操作失败')
                        }
                      }}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" />
                      批准取消
                    </button>
                    <button 
                      onClick={async () => {
                        if (!window.confirm('确定要拒绝取消请求吗？')) return
                        try {
                          const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${selectedOrder._id}/cancel-reject`, {
                            method: 'POST',
                            headers: {
                              'Authorization': `Bearer ${localStorage.getItem('token')}`,
                              'Content-Type': 'application/json'
                            }
                          })
                          if (response.ok) {
                            toast.success('已拒绝取消')
                            loadOrders()
                          } else {
                            toast.error('操作失败')
                          }
                        } catch (error) {
                          toast.error('操作失败')
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      拒绝取消
                    </button>
                  </>
                )}
                {/* 取消按钮（非已取消/已完成状态可用） */}
                {!selectedOrder.cancelRequest && selectedOrder.status !== 5 && selectedOrder.status !== 'cancelled' && selectedOrder.status !== 4 && selectedOrder.status !== 'completed' && (
                  <button 
                    onClick={() => setShowCancelModal(true)}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                  >
                    <Ban className="w-4 h-4" />
                    取消
                  </button>
                )}
                {/* 改价按钮 - 仅待付款状态可改价 */}
                {(selectedOrder.status === 1 || selectedOrder.status === 'pending') && (
                  <button 
                    onClick={() => {
                      if (showPriceModal) {
                        setShowPriceModal(false)
                        return
                      }
                      openPriceModal(selectedOrder._id)
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    改价
                  </button>
                )}
                {/* 导出图片按钮 - 合并为下拉菜单 */}
                <div className="relative group">
                  <button 
                    onClick={handleExportWholeOrderImages}
                    className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                  >
                    <ImageIcon className="w-4 h-4" />
                    导出图片
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </button>
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 min-w-[140px]">
                    <button 
                      onClick={handleExportWholeOrderImages}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
                    >
                      整单图片
                    </button>
                    <button 
                      onClick={handleExportImages}
                      className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg border-t border-gray-100"
                    >
                      分单图片
                    </button>
                  </div>
                </div>
                {/* 删除按钮 */}
                <button 
                  onClick={() => handleDeleteOrder(selectedOrder._id)}
                  className="px-4 py-2 border border-gray-300 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors text-sm flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            </div>
            
            {/* 状态编辑下拉 */}
            {showStatusEdit && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-3">选择新状态：</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 1, label: '待付款' },
                    { value: 2, label: '待发货' },
                    { value: 3, label: '待收货' },
                    { value: 4, label: '已完成' },
                    { value: 5, label: '已取消' },
                  ].map(s => (
                    <button
                      key={s.value}
                      onClick={() => handleUpdateStatus(selectedOrder._id, s.value)}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        selectedOrder.status === s.value 
                          ? 'bg-blue-600 text-white border-blue-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showPriceModal && (selectedOrder.status === 1 || selectedOrder.status === 'pending') && (
              <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                  <div className="text-sm font-semibold text-gray-900">改价</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPriceEditMode('flat')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        priceEditMode === 'flat'
                          ? 'bg-orange-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      整单一口价
                    </button>
                    <button
                      onClick={() => setPriceEditMode('itemized')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        priceEditMode === 'itemized'
                          ? 'bg-orange-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      商品逐项
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-xs text-gray-500">原价格</div>
                  <div className="text-base font-semibold text-gray-400 line-through">
                    ¥{formatPrice(selectedOrder.totalAmount)}
                  </div>
                </div>

                {priceEditMode === 'flat' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-gray-600 mb-1">新总价</div>
                      <input
                        type="number"
                        step="0.01"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        placeholder="请输入新总价"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">改价原因（可选）</div>
                      <input
                        type="text"
                        value={priceReason}
                        onChange={(e) => setPriceReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        placeholder="如：优惠活动"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-600">逐项输入每个商品的新价格（按行）</div>
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {products.map((p: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 px-3 py-2 ${idx > 0 ? 'border-t border-gray-100' : ''}`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{p.name}</div>
                            <div className="text-xs text-gray-500">x{p.quantity}</div>
                          </div>
                          <div className="w-40">
                            <input
                              type="number"
                              step="0.01"
                              value={itemPrices[idx] || ''}
                              onChange={(e) =>
                                setItemPrices((prev) => ({
                                  ...prev,
                                  [idx]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                              placeholder="该商品新价格"
                            />
                          </div>
                        </div>
                      ))}
                      <div className="bg-gray-50 px-3 py-2 flex items-center justify-between border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700">新总价（自动汇总）</div>
                        <div className="text-base font-bold text-orange-700">
                          ¥{formatPrice(
                            Object.values(itemPrices).reduce((sum, v) => sum + parseFloat(v || '0'), 0)
                          )}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 mb-1">改价原因（可选）</div>
                      <input
                        type="text"
                        value={priceReason}
                        onChange={(e) => setPriceReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                        placeholder="如：优惠活动"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowPriceModal(false)}
                    className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-white text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleChangePrice}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 结算模式选择 - 简洁版 */}
          {(selectedOrder.status === 0 || selectedOrder.status === 1 || selectedOrder.status === 'pending') && !(selectedOrder as any).settlementMode && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">结算模式</span>
                <div className="flex gap-2">
                  <button
                    onClick={async () => {
                      if (!window.confirm(`供应商调货模式\n\n实付: ¥${(selectedOrder.totalAmount * 0.36).toLocaleString()}\n\n确定？`)) return
                      try {
                        const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${selectedOrder._id}/settlement-mode`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ settlementMode: 'supplier_transfer', minDiscountRate: 0.6, commissionRate: 0.4 })
                        })
                        if (response.ok) {
                          toast.success('已选择供应商调货模式')
                          loadOrders()
                        } else {
                          const data = await response.json().catch(() => ({}))
                          toast.error(data.message || '设置失败')
                        }
                      } catch (error: any) {
                        toast.error(error?.message || '设置失败')
                      }
                    }}
                    className="px-4 py-2 bg-gray-800 text-white text-sm rounded-lg hover:bg-gray-900 transition-colors"
                  >
                    供应商调货 (36%)
                  </button>
                  <button
                    onClick={() => {
                      setCommissionProductionDays('30')
                      setShowCommissionModeModal(true)
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors border border-gray-300"
                  >
                    返佣模式 (60%+返佣)
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 已选择结算模式显示 */}
          {(selectedOrder as any).settlementMode && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">结算模式</span>
                <span className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg">
                  {(selectedOrder as any).settlementMode === 'supplier_transfer' ? '供应商调货' : '返佣模式'}
                </span>
              </div>
            </div>
          )}

          {/* 客户信息 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold">客户信息</h2>
                <span className="text-xs text-gray-400">{showCustomerInfo ? '(已解密)' : '(已加密)'}</span>
              </div>
              <button 
                onClick={() => showCustomerInfo ? handleHideCustomerInfo() : handleViewCustomerInfo(selectedOrder._id)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                  showCustomerInfo 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title={showCustomerInfo ? '点击隐藏' : '点击查看完整信息'}
              >
                {showCustomerInfo ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                <span className="text-xs">{showCustomerInfo ? '隐藏' : '查看'}</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">联系人</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{recipient.name || '未填写'}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">联系电话</span>
                <span className="font-medium">
                  {showCustomerInfo ? recipient.phone : (recipient.phone ? maskPhone(recipient.phone) : '未填写')}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <span className="text-gray-500">收货地址</span>
                <span className="font-medium">
                  {showCustomerInfo ? address : (address ? maskAddress(address) : '未填写')}
                </span>
              </div>
            </div>
          </div>
          
          {/* 支付渠道选择弹窗 */}
          {showPaymentModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">选择支付渠道</h3>
                  <button onClick={() => setShowPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3">
                  {[
                    { value: 'wechat', label: '微信支付', icon: '💚' },
                    { value: 'alipay', label: '支付宝', icon: '💙' },
                    { value: 'bank', label: '对公账户', icon: '🏦' },
                  ].map(method => (
                    <button
                      key={method.value}
                      onClick={() => setSelectedPaymentMethod(method.value)}
                      className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-colors ${
                        selectedPaymentMethod === method.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-medium">{method.label}</span>
                      {selectedPaymentMethod === method.value && (
                        <Check className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => selectedPaymentMethod && handleMarkPaidWithChannel(selectedOrder._id, selectedPaymentMethod)}
                    disabled={!selectedPaymentMethod}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    确认付款
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 发货物流弹窗 */}
          {showShippingModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" />
                    填写物流信息
                  </h3>
                  <button onClick={() => setShowShippingModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">物流公司</label>
                    <select
                      value={shippingInfo.company}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">请选择物流公司</option>
                      <option value="顺丰速运">顺丰速运</option>
                      <option value="京东物流">京东物流</option>
                      <option value="圆通速递">圆通速递</option>
                      <option value="中通快递">中通快递</option>
                      <option value="韵达快递">韵达快递</option>
                      <option value="申通快递">申通快递</option>
                      <option value="德邦物流">德邦物流</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1.5">快递单号</label>
                    <input
                      type="text"
                      value={shippingInfo.trackingNo}
                      onChange={(e) => setShippingInfo(prev => ({ ...prev, trackingNo: e.target.value }))}
                      placeholder="请输入快递单号"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => setShowShippingModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleShipWithTracking(selectedOrder._id)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    确认发货
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 确认收款弹窗 */}
          {showVerifyPaymentModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-600" />
                    确认收款
                  </h3>
                  <button onClick={() => setShowVerifyPaymentModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4">请确认已收到客户付款，选择实际收款方式：</p>
                <div className="space-y-3">
                  <button
                    onClick={() => setVerifyPaymentMethod('wechat')}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      verifyPaymentMethod === 'wechat' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">微</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">微信到账</div>
                      <div className="text-sm text-gray-500">已通过微信收到款项</div>
                    </div>
                    {verifyPaymentMethod === 'wechat' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  </button>
                  <button
                    onClick={() => setVerifyPaymentMethod('alipay')}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      verifyPaymentMethod === 'alipay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">支</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">支付宝到账</div>
                      <div className="text-sm text-gray-500">已通过支付宝收到款项</div>
                    </div>
                    {verifyPaymentMethod === 'alipay' && <CheckCircle2 className="w-5 h-5 text-blue-500" />}
                  </button>
                  <button
                    onClick={() => setVerifyPaymentMethod('bank')}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      verifyPaymentMethod === 'bank' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">银</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium">银行卡到账</div>
                      <div className="text-sm text-gray-500">已通过银行转账收到款项</div>
                    </div>
                    {verifyPaymentMethod === 'bank' && <CheckCircle2 className="w-5 h-5 text-purple-500" />}
                  </button>
                </div>
                <div className="mt-6 flex gap-3">
                  <button 
                    onClick={() => setShowVerifyPaymentModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleVerifyPayment(selectedOrder._id)}
                    disabled={!verifyPaymentMethod}
                    className={`flex-1 px-4 py-2.5 rounded-lg ${
                      verifyPaymentMethod 
                        ? 'bg-amber-600 text-white hover:bg-amber-700' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    确认已收款
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 核销定金弹窗 */}
          {showVerifyDepositModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-cyan-600" />
                    核销定金
                  </h3>
                  <button onClick={() => setShowVerifyDepositModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-cyan-800">
                    <div>定金金额：<span className="font-bold text-lg">¥{(selectedOrder as any).depositAmount || 0}</span></div>
                    <div className="text-xs mt-1">尾款金额：¥{(selectedOrder as any).finalPaymentAmount || 0}</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">请确认已收到定金，并填写预计生产天数：</p>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1.5">预计生产天数 <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    value={productionDays}
                    onChange={(e) => setProductionDays(e.target.value)}
                    placeholder="请输入天数，如 15"
                    min="1"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">到期后系统将提醒厂家和客户</p>
                </div>
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-gray-600">选择收款方式：</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setDepositVerifyMethod('wechat')}
                      className={`p-3 rounded-lg border-2 text-center ${
                        depositVerifyMethod === 'wechat' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-green-600 font-medium">微信</div>
                    </button>
                    <button
                      onClick={() => setDepositVerifyMethod('alipay')}
                      className={`p-3 rounded-lg border-2 text-center ${
                        depositVerifyMethod === 'alipay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-blue-600 font-medium">支付宝</div>
                    </button>
                    <button
                      onClick={() => setDepositVerifyMethod('bank')}
                      className={`p-3 rounded-lg border-2 text-center ${
                        depositVerifyMethod === 'bank' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-purple-600 font-medium">银行卡</div>
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowVerifyDepositModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleVerifyDeposit(selectedOrder._id)}
                    disabled={!depositVerifyMethod || !productionDays}
                    className={`flex-1 px-4 py-2.5 rounded-lg ${
                      depositVerifyMethod && productionDays
                        ? 'bg-cyan-600 text-white hover:bg-cyan-700' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    确认核销定金
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 核销尾款弹窗 */}
          {showVerifyFinalModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-rose-600" />
                    核销尾款
                  </h3>
                  <button onClick={() => setShowVerifyFinalModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-rose-800">
                    <div>尾款金额：<span className="font-bold text-lg">¥{(selectedOrder as any).finalPaymentAmount || 0}</span></div>
                    <div className="text-xs mt-1">定金已核销：¥{(selectedOrder as any).depositAmount || 0}</div>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">请确认已收到尾款，核销后订单将进入待发货状态：</p>
                <div className="space-y-3 mb-4">
                  <p className="text-sm text-gray-600">选择收款方式：</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setFinalVerifyMethod('wechat')}
                      className={`p-3 rounded-lg border-2 text-center ${
                        finalVerifyMethod === 'wechat' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-green-600 font-medium">微信</div>
                    </button>
                    <button
                      onClick={() => setFinalVerifyMethod('alipay')}
                      className={`p-3 rounded-lg border-2 text-center ${
                        finalVerifyMethod === 'alipay' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-blue-600 font-medium">支付宝</div>
                    </button>
                    <button
                      onClick={() => setFinalVerifyMethod('bank')}
                      className={`p-3 rounded-lg border-2 text-center ${
                        finalVerifyMethod === 'bank' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                      }`}
                    >
                      <div className="text-purple-600 font-medium">银行卡</div>
                    </button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowVerifyFinalModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleVerifyFinalPayment(selectedOrder._id)}
                    disabled={!finalVerifyMethod}
                    className={`flex-1 px-4 py-2.5 rounded-lg ${
                      finalVerifyMethod
                        ? 'bg-rose-600 text-white hover:bg-rose-700' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    确认核销尾款
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 返佣模式设置弹窗 */}
          {showCommissionModeModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    💰 设置返佣模式
                  </h3>
                  <button onClick={() => setShowCommissionModeModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
                  <div className="text-sm text-purple-800 space-y-1">
                    <div>订单总额：<span className="font-bold">¥{selectedOrder.totalAmount?.toLocaleString()}</span></div>
                    <div>折扣价(60%)：<span className="font-bold">¥{(selectedOrder.totalAmount * 0.6).toLocaleString()}</span></div>
                    <div className="pt-2 border-t border-purple-200 mt-2">
                      <div>定金(50%)：<span className="font-bold text-cyan-700">¥{(selectedOrder.totalAmount * 0.6 * 0.5).toLocaleString()}</span></div>
                      <div>尾款(50%)：<span className="font-bold text-pink-700">¥{(selectedOrder.totalAmount * 0.6 * 0.5).toLocaleString()}</span></div>
                    </div>
                    <div className="pt-2 border-t border-purple-200 mt-2">
                      <div>返佣(40%)：<span className="font-bold text-green-700">¥{(selectedOrder.totalAmount * 0.6 * 0.4).toLocaleString()}</span>（完成后申请）</div>
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    预计生产周期（天）<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={commissionProductionDays}
                    onChange={(e) => setCommissionProductionDays(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="请输入预计生产天数，如 30"
                  />
                  <p className="text-xs text-gray-500 mt-1">客户支付定金后，将进入生产周期</p>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowCommissionModeModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={async () => {
                      if (!commissionProductionDays || parseInt(commissionProductionDays) <= 0) {
                        toast.error('请填写有效的生产周期')
                        return
                      }
                      try {
                        const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${selectedOrder._id}/settlement-mode`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            settlementMode: 'commission_mode', 
                            minDiscountRate: 0.6, 
                            commissionRate: 0.4, 
                            paymentRatio: 50,
                            estimatedProductionDays: parseInt(commissionProductionDays)
                          })
                        })
                        if (response.ok) { 
                          toast.success('已设置返佣模式，预计生产' + commissionProductionDays + '天')
                          setShowCommissionModeModal(false)
                          loadOrders() 
                        } else { 
                          const data = await response.json().catch(() => ({}))
                          toast.error(data.message || '设置失败') 
                        }
                      } catch (error: any) { 
                        toast.error(error?.message || '设置失败') 
                      }
                    }}
                    disabled={!commissionProductionDays || parseInt(commissionProductionDays) <= 0}
                    className={`flex-1 px-4 py-2.5 rounded-lg ${
                      commissionProductionDays && parseInt(commissionProductionDays) > 0
                        ? 'bg-purple-600 text-white hover:bg-purple-700' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    确认设置
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 取消订单弹窗 */}
          {showCancelModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-500" />
                    取消订单
                  </h3>
                  <button onClick={() => setShowCancelModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 mb-4">确定要取消此订单吗？取消后订单将显示为灰色划线状态。</p>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1.5">取消原因（可选）</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="请输入取消原因..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowCancelModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    返回
                  </button>
                  <button 
                    onClick={() => handleCancelOrderWithReason(selectedOrder._id, cancelReason)}
                    className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    确认取消
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 跟进记录弹窗 */}
          {showFollowUpModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    添加跟进记录
                  </h3>
                  <button onClick={() => setShowFollowUpModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mb-4">
                  <textarea
                    value={followUpText}
                    onChange={(e) => setFollowUpText(e.target.value)}
                    placeholder="请输入跟进内容..."
                    rows={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowFollowUpModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleAddFollowUp(selectedOrder._id, followUpText)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    保存
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 买家备注 */}
          {selectedOrder.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <span className="text-amber-700 font-medium">买家备注</span>
              <span className="text-red-500 ml-3">{selectedOrder.notes}</span>
            </div>
          )}

          {/* 商品清单 */}
          <div className="bg-white rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
              <Package className="w-5 h-5 text-gray-400" />
              <h2 className="font-medium text-gray-700">商品清单</h2>
            </div>
            
            {/* 套餐标签 */}
            {selectedOrder.orderType === 'package' && selectedOrder.packageInfo && (
              <div className="mx-6 mt-4 px-3 py-2 bg-amber-50 rounded-lg">
                <div className="text-sm font-medium text-amber-800">
                  📦 套餐：{selectedOrder.packageInfo.packageName}
                </div>
                <div className="text-xs text-amber-600 mt-1">
                  套餐价：¥{formatPrice(selectedOrder.packageInfo.packagePrice)}
                </div>
              </div>
            )}
            
            <div className="divide-y divide-gray-100">
              {products.map((product, index) => {
                // 收集所有材质信息
                const materials: string[] = []
                if (product.selectedMaterials?.fabric || product.specifications?.material) {
                  materials.push(product.selectedMaterials?.fabric || product.specifications?.material)
                }
                if (product.selectedMaterials?.filling || product.specifications?.fill) {
                  materials.push(product.selectedMaterials?.filling || product.specifications?.fill)
                }
                if (product.selectedMaterials?.frame || product.specifications?.frame) {
                  materials.push(product.selectedMaterials?.frame || product.specifications?.frame)
                }
                if (product.selectedMaterials?.leg || product.specifications?.leg) {
                  materials.push(product.selectedMaterials?.leg || product.specifications?.leg)
                }
                
                // 收集加价信息
                const upgrades: { name: string; price: number }[] = []
                if (product.materialUpgradePrices?.fabric > 0) {
                  upgrades.push({ name: '面料', price: product.materialUpgradePrices.fabric })
                }
                if (product.materialUpgradePrices?.filling > 0) {
                  upgrades.push({ name: '填充', price: product.materialUpgradePrices.filling })
                }
                if (product.materialUpgradePrices?.frame > 0) {
                  upgrades.push({ name: '框架', price: product.materialUpgradePrices.frame })
                }
                if (product.materialUpgradePrices?.leg > 0) {
                  upgrades.push({ name: '脚架', price: product.materialUpgradePrices.leg })
                }
                
                return (
                  <div key={index} className="flex items-start gap-4 px-6 py-5">
                    {/* 商品图片 */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.image ? (
                        <img 
                          src={getFileUrl(product.image)} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg'
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* 商品信息 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-blue-600">{product.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.skuName || '标准款'} / {product.specifications?.color || '默认'}
                      </p>
                      
                      {/* 标签区域 */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {/* 尺寸标签 */}
                        {product.specifications?.size && (
                          <span className="px-2.5 py-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
                            {product.specifications.size}
                          </span>
                        )}
                        
                        {/* 材质标签 */}
                        {materials.map((mat, i) => (
                          <span key={i} className="px-2.5 py-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
                            {mat}
                          </span>
                        ))}
                      </div>
                      
                      {/* 加价信息 */}
                      {(upgrades.length > 0 || product.upgradePrice > 0) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {upgrades.map((up, i) => (
                            <span key={i} className="text-xs text-red-600">
                              {up.name} +¥{up.price}
                            </span>
                          ))}
                          {product.upgradePrice > 0 && upgrades.length === 0 && (
                            <span className="text-xs text-red-600">加价 +¥{product.upgradePrice}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* 数量 */}
                    <div className="text-gray-400 text-sm flex-shrink-0">
                      x{product.quantity}
                    </div>
                  </div>
                )
              })}
            </div>
            
            {/* 订单金额 */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">商品小计</span>
                <span className="text-gray-800">¥{formatPrice(selectedOrder.subtotal || selectedOrder.totalAmount)}</span>
              </div>
              {selectedOrder.discountAmount && selectedOrder.discountAmount > 0 && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">优惠</span>
                  <span className="text-red-500">-¥{formatPrice(selectedOrder.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-800 font-medium">订单总额</span>
                <span className="text-red-600 text-2xl font-bold">¥{formatPrice(selectedOrder.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* 订单动态 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold">订单动态</h2>
              </div>
              <button 
                onClick={() => setShowFollowUpModal(true)}
                className="text-blue-600 text-sm hover:text-blue-700 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                添加跟进
              </button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {/* 系统动态 */}
              <div className="text-sm text-gray-500 flex items-start gap-2 pb-3 border-b border-gray-100">
                <Clock className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-gray-400 text-xs">{new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</span>
                  <p className="text-gray-600">订单创建</p>
                </div>
              </div>
              {((selectedOrder as any).priceModifyHistory || []).map((h: any, idx: number) => (
                <div key={`${h.modifiedAt || ''}-${idx}`} className="text-sm text-gray-500 flex items-start gap-2 pb-3 border-b border-gray-100">
                  <Edit2 className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400 text-xs">{new Date(h.modifiedAt || Date.now()).toLocaleString('zh-CN')}</span>
                    <p className="text-gray-600">
                      改价{h.priceMode === 'itemized' ? '（逐项）' : h.priceMode === 'flat' ? '（整单）' : ''}：
                      ¥{formatPrice(h.originalAmount)} → ¥{formatPrice(h.newAmount)}
                      {h.reason ? `（${h.reason}）` : ''}
                    </p>
                    <span className="text-xs text-gray-400">操作人: 管理员</span>
                  </div>
                </div>
              ))}
              {selectedOrder.paidAt && (
                <div className="text-sm text-gray-500 flex items-start gap-2 pb-3 border-b border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400 text-xs">{new Date(selectedOrder.paidAt).toLocaleString('zh-CN')}</span>
                    <p className="text-gray-600">订单已付款 {selectedOrder.paymentMethod && `（${selectedOrder.paymentMethod === 'wechat' ? '微信' : selectedOrder.paymentMethod === 'alipay' ? '支付宝' : '对公账户'}）`}</p>
                  </div>
                </div>
              )}
              {selectedOrder.shippedAt && (
                <div className="text-sm text-gray-500 flex items-start gap-2 pb-3 border-b border-gray-100">
                  <Truck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400 text-xs">{new Date(selectedOrder.shippedAt).toLocaleString('zh-CN')}</span>
                    <p className="text-gray-600">订单已发货 {selectedOrder.trackingNumber && `（${selectedOrder.trackingNumber}）`}</p>
                  </div>
                </div>
              )}
              {selectedOrder.completedAt && (
                <div className="text-sm text-gray-500 flex items-start gap-2 pb-3 border-b border-gray-100">
                  <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-gray-400 text-xs">{new Date(selectedOrder.completedAt).toLocaleString('zh-CN')}</span>
                    <p className="text-gray-600">订单已完成</p>
                  </div>
                </div>
              )}
              
              {/* 后端活动日志 activityLogs */}
              {((selectedOrder as any).activityLogs || []).map((log: any, idx: number) => (
                <div key={`activity-${idx}`} className={`text-sm flex items-start gap-2 pb-3 border-b border-gray-100 ${
                  log.action === 'settlement_mode_set' ? 'bg-purple-50 rounded p-2' :
                  log.action === 'deposit_paid' ? 'bg-cyan-50 rounded p-2' :
                  log.action === 'deposit_verified' ? 'bg-green-50 rounded p-2' :
                  log.action === 'final_payment_requested' ? 'bg-orange-50 rounded p-2' :
                  log.action === 'final_payment_paid' ? 'bg-pink-50 rounded p-2' :
                  log.action === 'final_payment_verified' ? 'bg-teal-50 rounded p-2' :
                  ''
                }`}>
                  <CheckCircle2 className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                    log.action === 'settlement_mode_set' ? 'text-purple-500' :
                    log.action === 'deposit_paid' ? 'text-cyan-500' :
                    log.action === 'deposit_verified' ? 'text-green-500' :
                    log.action === 'final_payment_requested' ? 'text-orange-500' :
                    log.action === 'final_payment_paid' ? 'text-pink-500' :
                    log.action === 'final_payment_verified' ? 'text-teal-500' :
                    'text-gray-500'
                  }`} />
                  <div>
                    <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleString('zh-CN')}</span>
                    <p className="text-gray-700 font-medium">{log.details}</p>
                    {log.operator && <span className="text-xs text-gray-400">操作人: {log.operator}</span>}
                  </div>
                </div>
              ))}
              
              {/* 订单日志记录 */}
              {orderLogs
                .filter(log => log.orderId === selectedOrder._id)
                .filter(log => {
                  // 非管理员看不到查看敏感信息的记录
                  if (log.type === 'view_sensitive' && !isAdmin) return false
                  return true
                })
                .map(log => (
                  <div key={log.id} className="text-sm flex items-start gap-2 pb-3 border-b border-gray-100">
                    {log.type === 'followup' && <MessageSquare className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'remark' && <Tag className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'cancel' && <Ban className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'payment' && <CreditCard className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'ship' && <Truck className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'complete' && <CheckCircle2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />}
                    {log.type === 'view_sensitive' && <Eye className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />}
                    <div>
                      <span className="text-gray-400 text-xs">{new Date(log.createdAt).toLocaleString('zh-CN')}</span>
                      <p className={`${log.type === 'view_sensitive' ? 'text-red-600' : 'text-gray-600'}`}>{log.content}</p>
                      <span className="text-xs text-gray-400">操作人: {log.operator}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* 商家备注 - 移到最下面 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-gray-500" />
                <h2 className="font-semibold">商家备注</h2>
              </div>
              <button 
                onClick={() => {
                  setRemarkText((selectedOrder as any).adminNote || '')
                  setShowRemarkEdit(!showRemarkEdit)
                }}
                className="text-gray-600 text-sm hover:text-gray-800 flex items-center gap-1"
              >
                <Edit2 className="w-4 h-4" />
                {showRemarkEdit ? '取消' : '编辑'}
              </button>
            </div>
            {showRemarkEdit ? (
              <div className="space-y-3">
                <textarea
                  value={remarkText}
                  onChange={(e) => setRemarkText(e.target.value)}
                  placeholder="添加商家备注..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button 
                    onClick={() => setShowRemarkEdit(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    取消
                  </button>
                  <button 
                    onClick={() => handleSaveRemark(selectedOrder._id, remarkText)}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 text-sm"
                  >
                    保存
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                {(selectedOrder as any).adminNote || '暂无备注'}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 订单列表页
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* 统计Tab */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            activeTab === 'all' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">全部</p>
          <p className="text-2xl font-bold mt-1">{stats.all}</p>
        </button>
        
        <button
          onClick={() => setActiveTab('pending')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            activeTab === 'pending' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">待付款</p>
          <p className="text-2xl font-bold mt-1">{stats.pending}</p>
        </button>
        
        <button
          onClick={() => setActiveTab('shipping')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            activeTab === 'shipping' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">待发货</p>
          <p className="text-2xl font-bold mt-1">{stats.shipping}</p>
        </button>
        
        <button
          onClick={() => setActiveTab('afterSale')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            activeTab === 'afterSale' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">售后</p>
          <p className="text-2xl font-bold mt-1">{stats.afterSale}</p>
        </button>
        
        <button
          onClick={() => setActiveTab('cancelled')}
          className={`flex-1 p-4 rounded-xl border-2 transition-all ${
            activeTab === 'cancelled' 
              ? 'border-gray-500 bg-gray-50' 
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <p className="text-sm text-gray-500">已取消</p>
          <p className="text-2xl font-bold mt-1">{stats.cancelled}</p>
        </button>
      </div>

      {/* 搜索和操作栏 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <select 
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="">支付方式</option>
            <option value="wechat">微信支付</option>
            <option value="alipay">支付宝</option>
            <option value="bank">银行转账</option>
          </select>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索订单..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 w-64 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate('/products')}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            新增订单
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Download className="w-4 h-4" />
            导出表格
          </button>
        </div>
      </div>

      {/* 订单表格 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">订单信息</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">买家</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">商家备注 (REMARKS)</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">金额</th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">状态</th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                  加载中...
                </td>
              </tr>
            ) : filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                  暂无订单数据
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const status = statusConfig[order.status] || statusConfig[1]
                // 获取买家名字 - 兼容recipient和shippingAddress
                const recipient = order.recipient || order.shippingAddress
                const buyerName = recipient?.name || '未知'
                const buyerInitial = buyerName.charAt(0)
                
                return (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedOrderId(order._id)
                            }}
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {order.orderNo}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // 复制订单信息
                              const r = (order.recipient || order.shippingAddress) as any
                              const address = r?.address || 
                                [r?.province, r?.city, r?.district, r?.detail].filter(Boolean).join('')
                              const products = (order.items || (order as any).products || []).map((p: any) => 
                                `${p.name || p.productName} x${p.quantity || 1}`
                              ).join('\n')
                              const orderInfo = `订单号：${order.orderNo}\n收件人：${r?.name || ''}\n电话：${r?.phone || ''}\n地址：${address}\n商品：\n${products}\n总金额：¥${formatPrice(order.totalAmount)}`
                              navigator.clipboard.writeText(orderInfo)
                              toast.success('订单信息已复制')
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="复制订单信息"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(order.createdAt).toLocaleDateString('zh-CN')} · 共 {order.items?.length || 0} 件
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-medium">
                          {buyerInitial}
                        </div>
                        <span className="font-medium">{buyerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-600 truncate max-w-[200px]">
                        {order.notes || '添加备注...'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-red-600">
                        ¥{formatPrice(order.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm ${status.bgColor} ${status.color}`}>
                          {status.label}
                        </span>
                        {order.cancelRequest && (
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-300 animate-pulse">
                            ⚠️ 取消申请
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        {(order.status === 1 || order.status === 'pending') && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              openPriceModal(order._id)
                            }}
                            className="px-3 py-1.5 text-sm bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200"
                          >
                            改价
                          </button>
                        )}
                        {(order.status === 2 || order.status === 'paid') && (order.items?.length || 0) > 1 && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation()
                              setSplitOrderId(order._id)
                              setShowSplitModal(true)
                            }}
                            className="px-3 py-1.5 text-sm bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200"
                          >
                            分单
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrderId(order._id)
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          详情
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

      {/* 分单弹窗 */}
      {showSplitModal && splitOrderId && (
        <SplitOrderModal
          orderId={splitOrderId}
          orders={orders}
          onClose={() => {
            setShowSplitModal(false)
            setSplitOrderId(null)
          }}
          onSuccess={() => {
            setShowSplitModal(false)
            setSplitOrderId(null)
            loadOrders()
            toast.success('分单成功，已通知相关厂家')
          }}
        />
      )}
    </div>
  )
}

// 分单弹窗组件
function SplitOrderModal({ 
  orderId, 
  orders, 
  onClose, 
  onSuccess 
}: { 
  orderId: string
  orders: Order[]
  onClose: () => void
  onSuccess: () => void
}) {
  const order = orders.find(o => o._id === orderId)
  const [splitting, setSplitting] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({}) // manufacturerId -> itemIds

  useEffect(() => {
    if (!order) return
    // 按厂家分组商品
    const grouped: Record<string, string[]> = {}
    ;(order.items || []).forEach((item: any, index: number) => {
      const mfId = item.manufacturerId || item.manufacturer?._id || 'unknown'
      if (!grouped[mfId]) grouped[mfId] = []
      grouped[mfId].push(String(index))
    })
    setSelectedItems(grouped)
  }, [order])

  const handleSplit = async () => {
    if (!order) return
    setSplitting(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/orders/' + orderId + '/split', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          splitByManufacturer: true,
          notifyManufacturers: true
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '分单失败')
      }
      
      onSuccess()
    } catch (error: any) {
      console.error('分单失败:', error)
      toast.error(error.message || '分单失败')
    } finally {
      setSplitting(false)
    }
  }

  if (!order) {
    return null
  }

  // 获取厂家分组信息
  const manufacturerGroups: Record<string, { name: string; items: any[] }> = {}
  ;(order.items || []).forEach((item: any) => {
    const mfId = item.manufacturerId || item.manufacturer?._id || 'unknown'
    const mfName = item.manufacturer?.name || item.manufacturerName || '未知厂家'
    if (!manufacturerGroups[mfId]) {
      manufacturerGroups[mfId] = { name: mfName, items: [] }
    }
    manufacturerGroups[mfId].items.push(item)
  })

  const manufacturerCount = Object.keys(manufacturerGroups).length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-xl font-bold">分单 - 订单 {order.orderNo}</h3>
          <p className="text-sm text-gray-500 mt-1">
            将订单按厂家拆分为 {manufacturerCount} 个子订单，并通知各厂家
          </p>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {Object.entries(manufacturerGroups).map(([mfId, group]) => (
            <div key={mfId} className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{group.name}</h4>
                <span className="text-sm text-gray-500">{group.items.length} 件商品</span>
              </div>
              <div className="space-y-2">
                {group.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 text-sm">
                    <span className="flex-1 truncate">{item.name || item.productName}</span>
                    <span className="text-gray-500">x{item.quantity || 1}</span>
                    <span className="font-medium">¥{formatPrice(item.price || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <Package className="w-4 h-4 inline-block mr-1" />
            分单后将自动通知厂家微信接收订单
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-100"
              disabled={splitting}
            >
              取消
            </button>
            <button
              onClick={handleSplit}
              disabled={splitting || manufacturerCount <= 1}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50"
            >
              {splitting ? '分单中...' : `确认分单 (${manufacturerCount}个子订单)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
