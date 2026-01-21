import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Clock, CheckCircle2, Truck, X, Loader2, CreditCard, Smartphone, Building2, Copy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'
import axios from '@/lib/axios'

export default function OrdersPageNew() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [paymentModalOrder, setPaymentModalOrder] = useState<any>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(false)
  const [commissionModal, setCommissionModal] = useState<any>(null)  // 返佣申请弹窗
  const [invoiceUrl, setInvoiceUrl] = useState('')  // 发票URL

  const normalizeStagedPaymentAmounts = (order: any) => {
    const totalAmount = Number(order?.totalAmount || 0)
    const prEnabledRaw = (order as any)?.paymentRatioEnabled
    const paymentRatioEnabled =
      prEnabledRaw === true ||
      prEnabledRaw === 1 ||
      prEnabledRaw === 'true' ||
      prEnabledRaw === '1' ||
      (Boolean(prEnabledRaw) && prEnabledRaw !== 'false' && prEnabledRaw !== '0')
    const ratioRaw = Number(order?.paymentRatio || 0)
    const ratio = ratioRaw > 0 && ratioRaw < 100 ? ratioRaw : 50
    const depositAmount = Number(order?.depositAmount || 0)
    const finalPaymentAmount = Number(order?.finalPaymentAmount || 0)

    if (!paymentRatioEnabled || !Number.isFinite(totalAmount) || totalAmount <= 0) return order
    if (!Number.isFinite(ratio) || ratio <= 0 || ratio >= 100) return order

    if (depositAmount > 0 && finalPaymentAmount > 0) return order

    const computedDeposit = Math.round(totalAmount * ratio / 100)
    const computedFinal = Math.round(totalAmount - computedDeposit)
    if (computedDeposit <= 0 || computedFinal <= 0) return order

    return {
      ...order,
      depositAmount: depositAmount > 0 ? depositAmount : computedDeposit,
      finalPaymentAmount: finalPaymentAmount > 0 ? finalPaymentAmount : computedFinal,
      paymentRatio: Number.isFinite(ratio) ? ratio : 50,
      paymentRatioEnabled: true,
    }
  }

  // 检查登录状态
  useEffect(() => {
    if (!user || !token) {
      toast.error('请先登录')
      openLogin()
      navigate('/')
      return
    }
    loadOrders()
  }, [user, token, filterStatus])

  const loadOrders = async () => {
    try {
      setLoading(true)
      console.log('🔍 [Orders] Loading orders with token:', token?.slice(0, 20) + '...')
      
      let apiOrders: any[] = []
      let localOrders: any[] = []
      
      // 1. 尝试从API加载订单
      try {
        const data: any = await axios.get('/orders')
        console.log('🔍 [Orders] API orders count:', data?.data?.length || 0)
        apiOrders = data?.data || []
      } catch (apiError) {
        console.warn('⚠️ [Orders] API加载失败，将读取本地订单:', apiError)
      }
      
      // 2. 从localStorage加载订单
      try {
        const stored = localStorage.getItem('local_orders')
        if (stored) {
          localOrders = JSON.parse(stored)
          console.log('🔍 [Orders] Local orders count:', localOrders.length)
        }
      } catch (localError) {
        console.warn('⚠️ [Orders] localStorage读取失败:', localError)
      }
      
      // 3. 合并订单（API订单优先，本地订单补充）
      const allOrders = [...apiOrders]
      
      // 添加本地订单（排除已经在API中的订单）
      for (const localOrder of localOrders) {
        const exists = apiOrders.some(apiOrder => 
          apiOrder.orderNo === localOrder.orderNo || apiOrder._id === localOrder._id
        )
        if (!exists) {
          allOrders.push(localOrder)
        }
      }
      
      console.log('🔍 [Orders] Total orders count:', allOrders.length)
      setOrders(allOrders.map(normalizeStagedPaymentAmounts))
    } catch (error) {
      console.error('❌ [Orders] 加载订单失败:', error)
      toast.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }


  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('确定要申请取消这个订单吗？提交后需要等待管理员审核。')) {
      return
    }
    
    try {
      console.log('🔄 提交取消申请:', orderId)
      
      // 通过API提交取消申请
      await axios.post(`/orders/${orderId}/cancel`, {})
      console.log('✅ 取消申请已提交')
      
      // 更新UI状态 - 显示取消申请中
      setOrders(prev => prev.map((o: any) => {
        if ((o._id || o.id) === orderId) {
          return {
            ...o,
            cancelRequest: true,
            cancelRequestedAt: new Date().toISOString()
          }
        }
        return o
      }))
      
      toast.success('取消申请已提交，请等待管理员审核')
      
    } catch (error) {
      console.error('❌ 提交取消申请失败:', error)
      toast.error('提交失败，请重试')
    }
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('确定要删除这个订单吗？')) {
      return
    }
    
    try {
      // 从localStorage删除
      const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]')
      const updatedOrders = localOrders.filter((o: any) => (o._id || o.id) !== orderId)
      localStorage.setItem('local_orders', JSON.stringify(updatedOrders))
      
      // 更新显示
      setOrders(prev => prev.filter(o => (o._id || o.id) !== orderId))
      toast.success('订单已删除')
    } catch (error) {
      console.error('删除订单失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  const handleConfirmPayment = async (order: any) => {
    const isPriceModified = order.priceModified
    
    if (isPriceModified) {
      const latestModify = order.priceModifyHistory?.[order.priceModifyHistory.length - 1]
      const confirmMsg = `商家已将订单价格从 ¥${latestModify?.originalAmount?.toLocaleString()} 调整为 ¥${order.totalAmount?.toLocaleString()}${latestModify?.reason ? `\n原因：${latestModify.reason}` : ''}\n\n确认接受改价并继续付款吗？`
      if (!window.confirm(confirmMsg)) return
    }
    
    // 打开支付方式选择弹窗（先做分期金额兜底，避免显示/支付金额为0）
    const normalizedOrder = normalizeStagedPaymentAmounts(order)
    setPaymentModalOrder(normalizedOrder)
    setSelectedPaymentMethod('')
    setPaymentInfo(null)
    
    // 获取支付信息
    try {
      setLoadingPaymentInfo(true)
      const orderId = normalizedOrder._id || normalizedOrder.id
      const result: any = await axios.get(`/orders/${orderId}/payment-info`)
      setPaymentInfo(result?.data)
    } catch (error) {
      console.error('获取支付信息失败:', error)
    } finally {
      setLoadingPaymentInfo(false)
    }
  }

  const handlePaymentSubmit = async () => {
    if (!paymentModalOrder || !selectedPaymentMethod) {
      toast.error('请选择支付方式')
      return
    }
    
    const orderId = paymentModalOrder._id || paymentModalOrder.id
    const isStagedPayment = Boolean(paymentModalOrder.paymentRatioEnabled) && paymentModalOrder.paymentRatioEnabled !== 'false' && paymentModalOrder.paymentRatioEnabled !== '0'
    const isPayingDeposit = paymentModalOrder.status === 1 && isStagedPayment
    const isPayingFinal = paymentModalOrder.status === 12
    
    const amount = isPayingDeposit 
      ? paymentModalOrder.depositAmount 
      : isPayingFinal 
        ? paymentModalOrder.finalPaymentAmount 
        : paymentModalOrder.totalAmount
    
    const paymentType = isPayingDeposit ? '定金' : isPayingFinal ? '尾款' : '订单'
    const methodText = selectedPaymentMethod === 'wechat' ? '微信' : selectedPaymentMethod === 'alipay' ? '支付宝' : '银行卡'
    
    toast.success(`正在跳转到${methodText}支付页面，${paymentType}金额：¥${amount?.toLocaleString()}`)
    
    try {
      // 统一使用/pay API，后端会根据订单状态自动判断是定金、尾款还是全款
      await axios.post(`/orders/${orderId}/pay`, { paymentMethod: selectedPaymentMethod })
      const newStatus = isPayingDeposit ? 10 : isPayingFinal ? 13 : 9
      toast.success(`${paymentType}支付成功！`)
      setOrders(prev => prev.map((o: any) => (o._id || o.id) === orderId ? { ...o, status: newStatus } : o))
      setPaymentModalOrder(null)
      loadOrders() // 刷新订单列表
    } catch (error) {
      console.error('付款失败:', error)
      toast.error('付款失败，请重试')
    }
  }

  // 后端使用数字状态: 0=待确认, 1=待付款, 2=待发货, 3=待收货, 4=已完成, 5=已取消, 9=待确认收款, 10-13=分期付款状态
  const statusConfig: Record<string | number, { label: string; color: string; icon: React.ReactNode }> = {
    0: { label: '待确认', color: 'text-amber-600 bg-amber-50', icon: <Clock className="w-4 h-4" /> },
    1: { label: '待付款', color: 'text-orange-600 bg-orange-50', icon: <Clock className="w-4 h-4" /> },
    2: { label: '待发货', color: 'text-blue-600 bg-blue-50', icon: <Package className="w-4 h-4" /> },
    3: { label: '待收货', color: 'text-purple-600 bg-purple-50', icon: <Truck className="w-4 h-4" /> },
    4: { label: '已完成', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 className="w-4 h-4" /> },
    5: { label: '已取消', color: 'text-red-600 bg-red-50', icon: <X className="w-4 h-4" /> },
    9: { label: '待确认收款', color: 'text-amber-600 bg-amber-50', icon: <Clock className="w-4 h-4" /> },
    // 分期付款状态
    10: { label: '定金已付', color: 'text-cyan-600 bg-cyan-50', icon: <CreditCard className="w-4 h-4" /> },
    11: { label: '生产中', color: 'text-teal-600 bg-teal-50', icon: <Package className="w-4 h-4" /> },
    12: { label: '待付尾款', color: 'text-pink-600 bg-pink-50', icon: <CreditCard className="w-4 h-4" /> },
    13: { label: '尾款已付', color: 'text-rose-600 bg-rose-50', icon: <Clock className="w-4 h-4" /> },
    pending: { label: '待付款', color: 'text-orange-600 bg-orange-50', icon: <Clock className="w-4 h-4" /> },
    paid: { label: '已付款', color: 'text-blue-600 bg-blue-50', icon: <Package className="w-4 h-4" /> },
    shipped: { label: '已发货', color: 'text-purple-600 bg-purple-50', icon: <Truck className="w-4 h-4" /> },
    completed: { label: '已完成', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 className="w-4 h-4" /> },
    cancelled: { label: '已取消', color: 'text-red-600 bg-red-50', icon: <X className="w-4 h-4" /> },
  }

  const statusOptions = [
    { value: '', label: '全部订单' },
    { value: 'confirmation', label: '待确认' },
    { value: 'pending', label: '待付款' },
    { value: 'paid', label: '已付款' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
    { value: 'cancelled', label: '已取消' },
  ]

  // 筛选订单
  const filteredOrders = orders.filter(order => {
    if (!filterStatus) return true
    // 兼容数字和字符串状态
    const statusMap: Record<string, (number | string)[]> = {
      'pending': [1, 'pending'],
      'paid': [2, 'paid'],
      'shipped': [3, 'shipped'],
      'completed': [4, 'completed'],
      'cancelled': [5, 'cancelled'],
    }
    return statusMap[filterStatus]?.includes(order.status)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">我的订单</h1>
            <p className="text-stone-500 uppercase tracking-widest text-xs">My Orders ({filteredOrders.length})</p>
          </div>
        </div>

        {/* 状态筛选 */}
        <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm mb-8">
          <div className="flex flex-wrap gap-3">
            {statusOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === option.value
                    ? 'bg-primary text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 订单列表 */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
            <Package className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-400 font-serif italic mb-4">暂无订单记录</p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-green-900 transition-colors"
            >
              去购物 <Package className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const stagedOrder = normalizeStagedPaymentAmounts(order)
              const isCancelled = order.status === 5 || order.status === 'cancelled'
              const hasCancelRequest = order.cancelRequest === true
              return (
              <div key={order._id || order.id} className={`rounded-2xl border shadow-sm overflow-hidden transition-all ${
                isCancelled ? 'bg-gray-50 border-gray-200 opacity-75' : hasCancelRequest ? 'bg-orange-50 border-orange-200' : 'bg-white border-stone-100'
              }`}>
                {/* 订单头部 */}
                <div className={`flex justify-between items-center px-6 py-4 border-b ${
                  isCancelled ? 'bg-gray-100 border-gray-200' : hasCancelRequest ? 'bg-orange-100 border-orange-200' : order.priceModified ? 'bg-blue-50 border-blue-200' : 'bg-stone-50 border-stone-100'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'text-stone-600 bg-stone-50'}`}>
                      {statusConfig[order.status]?.icon}
                      <span>{statusConfig[order.status]?.label || '未知状态'}</span>
                    </div>
                    {hasCancelRequest && !isCancelled && (
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">取消申请中</span>
                    )}
                    {order.priceModified && (order.status === 1 || order.status === 'pending') && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">商家已改价</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {order.priceModified && order.priceModifyHistory?.length > 0 && (
                      <div className="text-sm text-stone-400 line-through">¥{order.priceModifyHistory[0]?.originalAmount?.toLocaleString() || 0}</div>
                    )}
                    <div className={`text-2xl font-bold ${
                      isCancelled ? 'text-gray-400' : order.priceModified ? 'text-blue-600' : 'text-red-600'
                    }`}>¥{order.totalAmount?.toLocaleString() || 0}</div>
                  </div>
                </div>
                
                {/* 改价通知 */}
                {order.priceModified && (order.status === 1 || order.status === 'pending') && order.priceModifyHistory?.length > 0 && (
                  <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">!</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">商家已调整订单价格</p>
                        <p className="text-xs text-blue-600 mt-1">
                          原价 ¥{order.priceModifyHistory[order.priceModifyHistory.length - 1]?.originalAmount?.toLocaleString()} → 现价 ¥{order.totalAmount?.toLocaleString()}
                          {order.priceModifyHistory[order.priceModifyHistory.length - 1]?.reason && (
                            <span className="ml-2">（{order.priceModifyHistory[order.priceModifyHistory.length - 1]?.reason}）</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 预付定制订单信息 */}
                {order.settlementMode === 'commission_mode' && Boolean(stagedOrder.paymentRatioEnabled) && stagedOrder.paymentRatioEnabled !== 'false' && stagedOrder.paymentRatioEnabled !== '0' && (
                  <div className="px-6 py-3 bg-gradient-to-r from-cyan-50 to-pink-50 border-b border-cyan-100">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">📦 预付定制订单</p>
                        {order.estimatedProductionDays && (
                          <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">
                            🏭 制作周期: {order.estimatedProductionDays} 天
                          </span>
                        )}
                      </div>
                      
                      {/* 两段式支付状态 */}
                      <div className="mt-2 p-2 bg-white/80 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1.5 font-medium">💳 支付状态</div>
                        <div className="flex items-center gap-2">
                          {/* 定金状态 */}
                          <div className={`flex-1 p-2 rounded text-center ${
                            order.depositVerified ? 'bg-green-100 border border-green-300' :
                            order.depositPaidAt ? 'bg-amber-100 border border-amber-300' :
                            'bg-gray-100 border border-gray-200'
                          }`}>
                            <div className="text-xs text-gray-500">定金({stagedOrder.paymentRatio || 50}%)</div>
                            <div className={`font-bold text-sm ${
                              order.depositVerified ? 'text-green-700' :
                              order.depositPaidAt ? 'text-amber-700' :
                              'text-gray-700'
                            }`}>¥{(stagedOrder.depositAmount || 0).toLocaleString()}</div>
                            <div className={`text-xs ${
                              order.depositVerified ? 'text-green-600' :
                              order.depositPaidAt ? 'text-amber-600' :
                              'text-gray-500'
                            }`}>
                              {order.depositVerified ? '✓已核销' :
                               order.depositPaidAt ? '⏳待核销' :
                               '○待支付'}
                            </div>
                          </div>

                          <div className="text-gray-400 text-sm">→</div>

                          {/* 尾款状态 */}
                          <div className={`flex-1 p-2 rounded text-center ${
                            order.finalPaymentVerified ? 'bg-green-100 border border-green-300' :
                            order.finalPaymentPaidAt ? 'bg-amber-100 border border-amber-300' :
                            order.finalPaymentRequested ? 'bg-pink-100 border border-pink-300' :
                            'bg-gray-100 border border-gray-200'
                          }`}>
                            <div className="text-xs text-gray-500">尾款({100 - (stagedOrder.paymentRatio || 50)}%)</div>
                            <div className={`font-bold text-sm ${
                              order.finalPaymentVerified ? 'text-green-700' :
                              order.finalPaymentPaidAt ? 'text-amber-700' :
                              order.finalPaymentRequested ? 'text-pink-700' :
                              'text-gray-700'
                            }`}>¥{(stagedOrder.finalPaymentAmount || 0).toLocaleString()}</div>
                            <div className={`text-xs ${
                              order.finalPaymentVerified ? 'text-green-600' :
                              order.finalPaymentPaidAt ? 'text-amber-600' :
                              order.finalPaymentRequested ? 'text-pink-600' :
                              'text-gray-500'
                            }`}>
                              {order.finalPaymentVerified ? '✓已核销' :
                               order.finalPaymentPaidAt ? '⏳待核销' :
                               order.finalPaymentRequested ? '📢已请求' :
                               '○待请求'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* 返佣信息 */}
                      {order.commissionAmount && (
                        <div className="text-xs mt-2 p-2 bg-white/60 rounded">
                          <span className="text-gray-500">💰 返佣金额:</span>
                          <span className="ml-1 font-bold text-purple-700">¥{order.commissionAmount?.toLocaleString()}</span>
                          <span className="ml-2 text-gray-400">(订单完成后可申请)</span>
                        </div>
                      )}
                      {/* 状态提示 */}
                      {order.status === 11 && (
                        <div className="text-xs mt-2 p-2 bg-teal-100 rounded text-teal-700 font-medium">
                          🏭 正在生产中，完成后厂家会发起尾款请求
                        </div>
                      )}
                      {order.status === 12 && (
                        <div className="text-xs mt-2 p-2 bg-pink-100 rounded text-pink-700 font-medium">
                          ⚠️ 厂家已发起尾款请求，请尽快支付尾款
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 开票信息 */}
                {order.needInvoice && (
                  <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🧾</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-amber-800">需要发票</p>
                        <div className="text-xs text-amber-700 mt-1">
                          <span>抬头: {order.invoiceInfo?.title || '-'}</span>
                          {order.invoiceInfo?.taxNumber && <span className="ml-3">税号: {order.invoiceInfo.taxNumber}</span>}
                          {order.invoiceMarkupAmount > 0 ? (
                            <span className="ml-3 font-bold text-amber-600">开票加价: +¥{order.invoiceMarkupAmount?.toLocaleString()}</span>
                          ) : (
                            <span className="ml-3 text-amber-600">（无加价）</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 结算模式信息 */}
                {order.settlementMode && (
                  <div className={`px-6 py-3 border-b ${order.settlementMode === 'supplier_transfer' ? 'bg-indigo-50 border-indigo-100' : 'bg-purple-50 border-purple-100'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {order.settlementMode === 'supplier_transfer' ? '🚚 供应商调货模式' : '💰 返佣模式'}
                        </p>
                        <div className="text-xs mt-1 space-x-3">
                          <span>原价: ¥{order.originalPrice?.toLocaleString() || 0}</span>
                          <span>折扣价: ¥{order.minDiscountPrice?.toLocaleString() || 0}</span>
                          {order.settlementMode === 'supplier_transfer' ? (
                            <span className="font-bold text-indigo-700">实付: ¥{order.supplierPrice?.toLocaleString() || 0}</span>
                          ) : (
                            <span className="text-purple-700">返佣: ¥{order.commissionAmount?.toLocaleString() || 0}</span>
                          )}
                          {order.invoiceMarkupAmount > 0 && (
                            <span className="text-amber-600">(含开票加价 ¥{order.invoiceMarkupAmount?.toLocaleString()})</span>
                          )}
                        </div>
                      </div>
                      
                      {/* 返佣模式下的操作按钮 */}
                      {order.settlementMode === 'commission_mode' && (
                        <div className="flex items-center gap-2">
                          {/* 尾款支付按钮 */}
                          {order.paymentRatioEnabled && order.remainingPaymentStatus !== 'paid' && order.remainingPaymentRemindedAt && (
                            <button
                              onClick={async () => {
                                if (!window.confirm(`确认支付尾款 ¥${order.remainingPaymentAmount?.toLocaleString()}？`)) return
                                try {
                                  await axios.post(`/orders/${order._id}/pay-remaining`, { paymentMethod: 'wechat' })
                                  toast.success('尾款支付成功')
                                  loadOrders()
                                } catch (error) {
                                  toast.error('支付失败')
                                }
                              }}
                              className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded hover:bg-orange-600"
                            >
                              支付尾款 ¥{order.remainingPaymentAmount?.toLocaleString()}
                            </button>
                          )}
                          
                          {/* 申请返佣按钮 - 必须订单已完成(status=4) */}
                          {order.commissionStatus === 'pending' && order.status === 4 && (
                            <button
                              onClick={() => {
                                setCommissionModal(order)
                                setInvoiceUrl('')
                              }}
                              className="px-3 py-1.5 bg-purple-500 text-white text-xs rounded hover:bg-purple-600"
                            >
                              申请返佣
                            </button>
                          )}
                          {/* 订单未完成时的提示 */}
                          {order.commissionStatus === 'pending' && order.status !== 4 && order.status !== 5 && (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              待订单完成
                            </span>
                          )}
                          
                          {/* 返佣状态显示 */}
                          {order.commissionStatus && order.commissionStatus !== 'pending' && (
                            <span className={`px-2 py-1 text-xs rounded ${
                              order.commissionStatus === 'applied' ? 'bg-yellow-100 text-yellow-700' :
                              order.commissionStatus === 'approved' ? 'bg-blue-100 text-blue-700' :
                              order.commissionStatus === 'paid' ? 'bg-green-100 text-green-700' : ''
                            }`}>
                              {order.commissionStatus === 'applied' ? '返佣已申请' :
                               order.commissionStatus === 'approved' ? '返佣已核销' :
                               order.commissionStatus === 'paid' ? '返佣已发放' : ''}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 订单商品列表 */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.orderType === 'package' && order.packageInfo ? (
                      // 套餐订单 - 点击跳转到套餐详情页
                      <div 
                        onClick={() => navigate(`/packages/${order.packageInfo.packageId || order.packageId || ''}`)}
                        className="cursor-pointer hover:bg-stone-50 -m-2 p-2 rounded-lg transition-colors"
                      >
                        {order.packageInfo.selections?.map((selection: any, idx: number) => (
                          selection.products?.map((product: any, pIdx: number) => {
                            // 获取材质信息（兼容中英文键名）
                            const materials = product.selectedMaterials || product.materials || {}
                            const fabric = materials.fabric || materials['面料'] || ''
                            const filling = materials.filling || materials['填充'] || ''
                            const frame = materials.frame || materials['框架'] || ''
                            const leg = materials.leg || materials['脚架'] || ''
                            const upgradePrices = product.materialUpgradePrices || {}
                            
                            return (
                              <div key={`${idx}-${pIdx}`} className="flex gap-4 mb-4 last:mb-0 pb-3 border-b border-stone-100 last:border-0">
                                <div className="w-20 h-20 bg-stone-100 rounded-lg flex-shrink-0 overflow-hidden">
                                  {product.image ? (
                                    <img src={product.image} alt={product.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                                      <Package className="w-8 h-8" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-medium text-stone-800 truncate hover:text-primary">
                                    {product.productName} <span className="text-stone-500">×{product.quantity || 1}</span>
                                  </h4>
                                  <p className="text-xs text-stone-400 mt-0.5">{selection.categoryName}</p>
                                  {/* 规格 */}
                                  {product.skuName && (
                                    <p className="text-sm text-stone-600 mt-1">规格: {product.skuName}</p>
                                  )}
                                  {/* 材质和加价明细 */}
                                  <div className="text-sm mt-1 space-y-0.5">
                                    {fabric && (
                                      <p className="text-stone-600">
                                        面料: <span className="text-stone-800">{fabric}</span>
                                        {(upgradePrices.fabric > 0 || upgradePrices['面料'] > 0) && (
                                          <span className="text-red-600 font-medium ml-1">+¥{upgradePrices.fabric || upgradePrices['面料']}</span>
                                        )}
                                      </p>
                                    )}
                                    {filling && (
                                      <p className="text-stone-600">
                                        填充: <span className="text-stone-800">{filling}</span>
                                        {(upgradePrices.filling > 0 || upgradePrices['填充'] > 0) && (
                                          <span className="text-red-600 font-medium ml-1">+¥{upgradePrices.filling || upgradePrices['填充']}</span>
                                        )}
                                      </p>
                                    )}
                                    {frame && (
                                      <p className="text-stone-600">
                                        框架: <span className="text-stone-800">{frame}</span>
                                        {(upgradePrices.frame > 0 || upgradePrices['框架'] > 0) && (
                                          <span className="text-red-600 font-medium ml-1">+¥{upgradePrices.frame || upgradePrices['框架']}</span>
                                        )}
                                      </p>
                                    )}
                                    {leg && (
                                      <p className="text-stone-600">
                                        脚架: <span className="text-stone-800">{leg}</span>
                                        {(upgradePrices.leg > 0 || upgradePrices['脚架'] > 0) && (
                                          <span className="text-red-600 font-medium ml-1">+¥{upgradePrices.leg || upgradePrices['脚架']}</span>
                                        )}
                                      </p>
                                    )}
                                  </div>
                                  {/* 商品加价汇总 */}
                                  {(product.upgradePrice > 0 || product.materialUpgrade > 0) && (
                                    <p className="text-red-600 font-medium text-sm mt-1">
                                      商品加价: +¥{product.upgradePrice || product.materialUpgrade}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        ))}
                      </div>
                    ) : (
                      // 普通商品订单 - 点击跳转到商品详情页
                      order.items?.map((item: any, idx: number) => (
                        <div 
                          key={idx} 
                          onClick={() => navigate(`/products/${item.product || item.productId || ''}`)}
                          className="flex gap-4 cursor-pointer hover:bg-stone-50 -m-2 p-2 rounded-lg transition-colors"
                        >
                          <div className="w-20 h-20 bg-stone-100 rounded-lg flex-shrink-0 overflow-hidden">
                            {(item.image || item.productImage) ? (
                              <img 
                                src={getFileUrl(item.image || item.productImage)} 
                                alt={item.name || item.productName} 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-stone-400">
                                <Package className="w-8 h-8" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-medium text-stone-800 truncate hover:text-primary">{item.name || item.productName}</h4>
                            <div className="text-sm mt-1 space-y-0.5">
                              {/* 规格 */}
                              {(item.sku?.color || item.skuName || item.specifications?.size) && (
                                <p className="text-stone-500">规格: <span className="text-stone-800">{item.sku?.color || item.skuName || item.specifications?.size}</span></p>
                              )}
                              {/* 尺寸 */}
                              {(item.skuDimensions?.length || item.skuDimensions?.width || item.skuDimensions?.height || item.specifications?.dimensions) && (
                                <p className="text-stone-500">尺寸: <span className="text-stone-800">{item.specifications?.dimensions || `${item.skuDimensions?.length || '-'}×${item.skuDimensions?.width || '-'}×${item.skuDimensions?.height || '-'}`} CM</span></p>
                              )}
                              {/* 材质信息 - 动态遍历所有材质类目 */}
                              {item.selectedMaterials && Object.keys(item.selectedMaterials).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {Object.entries(item.selectedMaterials).map(([category, material]) => {
                                    if (!material) return null
                                    const upgradePrice = item.materialUpgradePrices?.[category] || 0
                                    return (
                                      <span key={category} className="inline-flex items-center px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded">
                                        {material as string}
                                        {upgradePrice > 0 && (
                                          <span className="text-red-600 font-semibold ml-1">+¥{upgradePrice}</span>
                                        )}
                                      </span>
                                    )
                                  })}
                                </div>
                              )}
                              <p className="text-stone-500">× {item.quantity || 1}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* 收货信息 */}
                  <div className="mt-6 pt-4 border-t border-stone-100">
                    <p className="text-sm text-stone-500 mb-1">{order.orderNo || order.orderNumber}</p>
                    <p className="text-sm text-stone-800">
                      <span className="text-stone-600">收货人：</span>{order.recipient?.name || '未填写'}
                    </p>
                    <p className="text-sm text-stone-800 mt-1">
                      <span className="text-stone-600">电话：</span>{order.recipient?.phone || '未填写'}
                    </p>
                    <p className="text-sm text-stone-800 mt-1">
                      <span className="text-stone-600">地址：</span>{order.recipient?.address || '未填写'}
                    </p>
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="mt-4 flex gap-3 justify-end">
                    {/* 取消订单按钮 - 待付款和待发货状态可取消，且没有取消申请中的 */}
                    {(order.status === 1 || order.status === 2 || order.status === 'pending' || order.status === 'processing') && !order.cancelRequest && (
                      <button
                        onClick={() => handleCancelOrder(order._id || order.id)}
                        className="px-4 py-2 text-sm border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        取消订单
                      </button>
                    )}
                    {/* 删除订单按钮 - 已完成/已取消/申请取消中的订单可删除 */}
                    {(order.cancelRequest || order.status === 5 || order.status === 'cancelled' || order.status === 6 || order.status === 4 || order.status === 'completed') && (
                      <button
                        onClick={() => handleDeleteOrder(order._id || order.id)}
                        className="px-4 py-2 text-sm border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
                      >
                        删除订单
                      </button>
                    )}
                    {/* 确认付款按钮 - 待付款状态显示 */}
                    {(order.status === 1 || order.status === 'pending') && !order.cancelRequest && (
                      <button
                        onClick={() => handleConfirmPayment(order)}
                        className={`px-6 py-2 text-sm rounded-lg transition-colors ${
                          order.priceModified 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-primary text-white hover:bg-green-900'
                        }`}
                      >
                        {Boolean(stagedOrder.paymentRatioEnabled) && stagedOrder.paymentRatioEnabled !== 'false' && stagedOrder.paymentRatioEnabled !== '0'
                          ? `支付定金 ¥${(stagedOrder.depositAmount || 0).toLocaleString()}` 
                          : order.priceModified 
                            ? '确认改价并付款' 
                            : '立即付款'}
                      </button>
                    )}
                    {/* 支付尾款按钮 - 待付尾款状态(12)显示 */}
                    {order.status === 12 && (
                      <button
                        onClick={() => handleConfirmPayment(order)}
                        className="px-6 py-2 text-sm bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                      >
                        支付尾款 ¥{(stagedOrder.finalPaymentAmount || 0).toLocaleString()}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* 支付方式选择弹窗 */}
      {paymentModalOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">选择支付方式</h3>
                <button
                  onClick={() => setPaymentModalOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {/* 分期付款显示定金/尾款，否则显示全款 */}
              {paymentModalOrder.paymentRatioEnabled ? (
                <div className="mt-2 p-3 bg-gradient-to-r from-cyan-50 to-pink-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    {paymentModalOrder.status === 12 ? (
                      <>本次支付尾款：<span className="text-lg font-bold text-pink-600">¥{paymentModalOrder.finalPaymentAmount?.toLocaleString()}</span></>
                    ) : (
                      <>本次支付定金：<span className="text-lg font-bold text-cyan-600">¥{paymentModalOrder.depositAmount?.toLocaleString()}</span></>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    订单总额 ¥{paymentModalOrder.totalAmount?.toLocaleString()} = 
                    定金 ¥{paymentModalOrder.depositAmount?.toLocaleString()} + 
                    尾款 ¥{paymentModalOrder.finalPaymentAmount?.toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  订单金额：<span className="text-lg font-bold text-primary">¥{paymentModalOrder.totalAmount?.toLocaleString()}</span>
                </p>
              )}
            </div>
            
            <div className="p-6 space-y-3">
              {/* 微信支付 */}
              <button
                onClick={() => setSelectedPaymentMethod('wechat')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedPaymentMethod === 'wechat'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">微信支付</div>
                  <div className="text-sm text-gray-500">推荐使用微信扫码支付</div>
                </div>
                {selectedPaymentMethod === 'wechat' && (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                )}
              </button>

              {/* 支付宝 */}
              <button
                onClick={() => setSelectedPaymentMethod('alipay')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedPaymentMethod === 'alipay'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">支付宝</div>
                  <div className="text-sm text-gray-500">使用支付宝APP扫码支付</div>
                </div>
                {selectedPaymentMethod === 'alipay' && (
                  <CheckCircle2 className="w-6 h-6 text-blue-500" />
                )}
              </button>

              {/* 银行卡 */}
              <button
                onClick={() => setSelectedPaymentMethod('bank')}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedPaymentMethod === 'bank'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">银行卡支付</div>
                  <div className="text-sm text-gray-500">使用银行卡快捷支付</div>
                </div>
                {selectedPaymentMethod === 'bank' && (
                  <CheckCircle2 className="w-6 h-6 text-purple-500" />
                )}
              </button>

              {/* 显示收款码或银行信息 */}
              {selectedPaymentMethod && paymentInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  {selectedPaymentMethod === 'wechat' && paymentInfo.wechatQrCode && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">请使用微信扫描下方二维码付款</p>
                      <img 
                        src={paymentInfo.wechatQrCode} 
                        alt="微信收款码" 
                        className="w-48 h-48 mx-auto rounded-lg border border-gray-200"
                      />
                      <p className="text-xs text-gray-500 mt-2">{paymentModalOrder.paymentRatioEnabled ? (paymentModalOrder.status === 12 ? '尾款金额' : '定金金额') : '付款金额'}：¥{(paymentModalOrder.paymentRatioEnabled ? (paymentModalOrder.status === 12 ? paymentModalOrder.finalPaymentAmount : paymentModalOrder.depositAmount) : paymentModalOrder.totalAmount)?.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedPaymentMethod === 'alipay' && paymentInfo.alipayQrCode && (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">请使用支付宝扫描下方二维码付款</p>
                      <img 
                        src={paymentInfo.alipayQrCode} 
                        alt="支付宝收款码" 
                        className="w-48 h-48 mx-auto rounded-lg border border-gray-200"
                      />
                      <p className="text-xs text-gray-500 mt-2">{paymentModalOrder.paymentRatioEnabled ? (paymentModalOrder.status === 12 ? '尾款金额' : '定金金额') : '付款金额'}：¥{(paymentModalOrder.paymentRatioEnabled ? (paymentModalOrder.status === 12 ? paymentModalOrder.finalPaymentAmount : paymentModalOrder.depositAmount) : paymentModalOrder.totalAmount)?.toLocaleString()}</p>
                    </div>
                  )}
                  {selectedPaymentMethod === 'bank' && paymentInfo.bankInfo && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">银行转账信息</p>
                        <button
                          onClick={() => {
                            const payAmount = paymentModalOrder.paymentRatioEnabled 
                              ? (paymentModalOrder.status === 12 ? paymentModalOrder.finalPaymentAmount : paymentModalOrder.depositAmount) 
                              : paymentModalOrder.totalAmount
                            const payLabel = paymentModalOrder.paymentRatioEnabled 
                              ? (paymentModalOrder.status === 12 ? '尾款金额' : '定金金额') 
                              : '付款金额'
                            const bankText = `公户单位：${paymentInfo.bankInfo.companyName}\n开户银行：${paymentInfo.bankInfo.bankName}\n收款人：${paymentInfo.bankInfo.accountName}\n银行账号：${paymentInfo.bankInfo.accountNumber}\n${payLabel}：¥${payAmount?.toLocaleString()}`
                            navigator.clipboard.writeText(bankText)
                            toast.success('已复制全部转账信息')
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          一键复制全部
                        </button>
                      </div>
                      <div className="text-sm space-y-2 bg-white p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">公户单位</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">{paymentInfo.bankInfo.companyName}</span>
                            <button onClick={() => { navigator.clipboard.writeText(paymentInfo.bankInfo.companyName); toast.success('已复制') }} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">开户银行</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">{paymentInfo.bankInfo.bankName}</span>
                            <button onClick={() => { navigator.clipboard.writeText(paymentInfo.bankInfo.bankName); toast.success('已复制') }} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">收款人</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">{paymentInfo.bankInfo.accountName}</span>
                            <button onClick={() => { navigator.clipboard.writeText(paymentInfo.bankInfo.accountName); toast.success('已复制') }} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-gray-500">银行账号</span>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-bold tracking-wide">{paymentInfo.bankInfo.accountNumber}</span>
                            <button onClick={() => { navigator.clipboard.writeText(paymentInfo.bankInfo.accountNumber); toast.success('已复制银行账号') }} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                          <span className="text-gray-500">{paymentModalOrder.paymentRatioEnabled ? (paymentModalOrder.status === 12 ? '尾款金额' : '定金金额') : '付款金额'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-bold text-lg">¥{(paymentModalOrder.paymentRatioEnabled ? (paymentModalOrder.status === 12 ? paymentModalOrder.finalPaymentAmount : paymentModalOrder.depositAmount) : paymentModalOrder.totalAmount)?.toLocaleString()}</span>
                            <button onClick={() => { navigator.clipboard.writeText((paymentModalOrder.paymentRatioEnabled ? (paymentModalOrder.status === 12 ? paymentModalOrder.finalPaymentAmount : paymentModalOrder.depositAmount) : paymentModalOrder.totalAmount)?.toString() || ''); toast.success('已复制金额') }} className="p-1 hover:bg-gray-100 rounded"><Copy className="w-3.5 h-3.5 text-gray-400" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {((selectedPaymentMethod === 'wechat' && !paymentInfo.wechatQrCode) ||
                    (selectedPaymentMethod === 'alipay' && !paymentInfo.alipayQrCode) ||
                    (selectedPaymentMethod === 'bank' && !paymentInfo.bankInfo)) && (
                    <p className="text-sm text-gray-500 text-center">商家暂未配置该支付方式</p>
                  )}
                </div>
              )}
              {selectedPaymentMethod && loadingPaymentInfo && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 text-center">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                  <p className="text-sm text-gray-500 mt-2">加载中...</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setPaymentModalOrder(null)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={!selectedPaymentMethod || !paymentInfo || loadingPaymentInfo || 
                  (selectedPaymentMethod === 'wechat' && !paymentInfo?.wechatQrCode) ||
                  (selectedPaymentMethod === 'alipay' && !paymentInfo?.alipayQrCode) ||
                  (selectedPaymentMethod === 'bank' && !paymentInfo?.bankInfo?.accountNumber)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-colors ${
                  selectedPaymentMethod && paymentInfo && !loadingPaymentInfo &&
                  ((selectedPaymentMethod === 'wechat' && paymentInfo?.wechatQrCode) ||
                   (selectedPaymentMethod === 'alipay' && paymentInfo?.alipayQrCode) ||
                   (selectedPaymentMethod === 'bank' && paymentInfo?.bankInfo?.accountNumber))
                    ? 'bg-primary text-white hover:bg-green-900'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                我已完成付款
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 返佣申请弹窗 */}
      {commissionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">申请返佣</h3>
                <button onClick={() => setCommissionModal(null)} className="p-1 hover:bg-gray-100 rounded-full">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-purple-50 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">订单号</span>
                  <span className="font-medium text-gray-900">{commissionModal.orderNo}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-gray-600">返佣金额</span>
                  <span className="text-xl font-bold text-purple-600">¥{commissionModal.commissionAmount?.toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  发票图片 <span className="text-gray-400 font-normal">(可选)</span>
                </label>
                <input
                  type="text"
                  value={invoiceUrl}
                  onChange={(e) => setInvoiceUrl(e.target.value)}
                  placeholder="请输入发票图片URL（可选）"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">如需上传发票，请输入发票图片的URL地址</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setCommissionModal(null)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.post(`/orders/${commissionModal._id}/apply-commission`, { invoiceUrl: invoiceUrl || undefined })
                    toast.success('返佣申请已提交')
                    setCommissionModal(null)
                    loadOrders()
                  } catch (error) { 
                    toast.error('申请失败') 
                  }
                }}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors font-medium"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
