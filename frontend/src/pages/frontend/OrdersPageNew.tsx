import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, Clock, CheckCircle2, Truck, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'

export default function OrdersPageNew() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')

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
        const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/orders', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })
        
        console.log('🔍 [Orders] Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('🔍 [Orders] API orders count:', data.data?.length || 0)
          apiOrders = data.data || []
        }
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
      setOrders(allOrders)
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
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
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
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || '提交取消申请失败')
      }
      
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
    const orderId = order._id || order.id
    const amount = order.totalAmount
    const isPriceModified = order.priceModified
    
    if (isPriceModified) {
      const latestModify = order.priceModifyHistory?.[order.priceModifyHistory.length - 1]
      const confirmMsg = `商家已将订单价格从 ¥${latestModify?.originalAmount?.toLocaleString()} 调整为 ¥${amount?.toLocaleString()}${latestModify?.reason ? `\n原因：${latestModify.reason}` : ''}\n\n确认接受改价并继续付款吗？`
      if (!window.confirm(confirmMsg)) return
    }
    
    toast.success(`正在跳转到付款页面，订单金额：¥${amount?.toLocaleString()}`)
    
    try {
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'wechat' })
      })
      
      if (response.ok) {
        toast.success('付款成功！')
        setOrders(prev => prev.map((o: any) => (o._id || o.id) === orderId ? { ...o, status: 2 } : o))
      } else {
        const errorData = await response.json().catch(() => ({}))
        toast.error(errorData.message || '付款失败，请重试')
      }
    } catch (error) {
      console.error('付款失败:', error)
      toast.error('付款失败，请重试')
    }
  }

  // 后端使用数字状态: 0=待确认, 1=待付款, 2=待发货, 3=待收货, 4=已完成, 5=已取消
  const statusConfig: Record<string | number, { label: string; color: string; icon: React.ReactNode }> = {
    0: { label: '待确认', color: 'text-amber-600 bg-amber-50', icon: <Clock className="w-4 h-4" /> },
    1: { label: '待付款', color: 'text-orange-600 bg-orange-50', icon: <Clock className="w-4 h-4" /> },
    2: { label: '待发货', color: 'text-blue-600 bg-blue-50', icon: <Package className="w-4 h-4" /> },
    3: { label: '待收货', color: 'text-purple-600 bg-purple-50', icon: <Truck className="w-4 h-4" /> },
    4: { label: '已完成', color: 'text-green-600 bg-green-50', icon: <CheckCircle2 className="w-4 h-4" /> },
    5: { label: '已取消', color: 'text-red-600 bg-red-50', icon: <X className="w-4 h-4" /> },
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
                    <p className="text-sm text-stone-500 mb-1">ORD{order.orderNo || order.orderNumber}</p>
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
                        {order.priceModified ? '确认改价并付款' : '立即付款'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  )
}
