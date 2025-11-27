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


  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('确定要删除这个订单吗？删除后无法恢复。')) return
    
    try {
      const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) throw new Error('删除订单失败')
      
      toast.success('订单已删除')
      loadOrders()
    } catch (error) {
      console.error('删除订单失败:', error)
      toast.error('删除订单失败')
    }
  }

  // 后端使用数字状态: 1=待付款, 2=待发货, 3=待收货, 4=已完成, 5=已取消
  const statusConfig: Record<string | number, { label: string; color: string; icon: React.ReactNode }> = {
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
    { value: 'pending', label: '待付款' },
    { value: 'paid', label: '已付款' },
    { value: 'shipped', label: '已发货' },
    { value: 'completed', label: '已完成' },
  ]

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
            <p className="text-stone-500 uppercase tracking-widest text-xs">My Orders ({orders.length})</p>
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
        {orders.length === 0 ? (
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
            {orders.map((order) => (
              <div key={order._id || order.id} className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
                {/* 订单头部 */}
                <div className="flex justify-between items-center px-6 py-4 bg-stone-50 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[order.status]?.color || 'text-stone-600 bg-stone-50'}`}>
                      {statusConfig[order.status]?.icon}
                      <span>{statusConfig[order.status]?.label || '未知状态'}</span>
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-red-600">¥{order.totalAmount?.toLocaleString() || 0}</div>
                </div>

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
                          selection.products?.map((product: any, pIdx: number) => (
                            <div key={`${idx}-${pIdx}`} className="flex gap-4 mb-3 last:mb-0">
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
                                <h4 className="text-base font-medium text-stone-800 truncate hover:text-primary">{product.productName}</h4>
                                <p className="text-sm text-stone-500 mt-1">
                                  {selection.categoryName} / {product.materials ? Object.entries(product.materials).map(([k, v]) => `${v}`).join(' / ') : '标准款'} × {product.quantity || 1}
                                </p>
                              </div>
                            </div>
                          ))
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
                              {item.specifications?.size && (
                                <p className="text-stone-500">规格: <span className="text-stone-800">{item.specifications.size}</span></p>
                              )}
                              
                              {/* 面料 */}
                              {item.specifications?.material && (
                                <p className="text-stone-500">
                                  面料: <span className="text-stone-800">{item.specifications.material}</span>
                                  {item.materialUpgradePrices?.[item.specifications.material] > 0 && (
                                    <span className="text-red-600 font-semibold ml-2">+¥{item.materialUpgradePrices[item.specifications.material]}</span>
                                  )}
                                </p>
                              )}
                              
                              {/* 填充 */}
                              {item.specifications?.fill && (
                                <p className="text-stone-500">
                                  填充: <span className="text-stone-800">{item.specifications.fill}</span>
                                  {item.materialUpgradePrices?.[item.specifications.fill] > 0 && (
                                    <span className="text-red-600 font-semibold ml-2">+¥{item.materialUpgradePrices[item.specifications.fill]}</span>
                                  )}
                                </p>
                              )}
                              
                              {/* 框架 */}
                              {item.specifications?.frame && (
                                <p className="text-stone-500">
                                  框架: <span className="text-stone-800">{item.specifications.frame}</span>
                                  {item.materialUpgradePrices?.[item.specifications.frame] > 0 && (
                                    <span className="text-red-600 font-semibold ml-2">+¥{item.materialUpgradePrices[item.specifications.frame]}</span>
                                  )}
                                </p>
                              )}
                              
                              {/* 脚架 */}
                              {item.specifications?.leg && (
                                <p className="text-stone-500">
                                  脚架: <span className="text-stone-800">{item.specifications.leg}</span>
                                  {item.materialUpgradePrices?.[item.specifications.leg] > 0 && (
                                    <span className="text-red-600 font-semibold ml-2">+¥{item.materialUpgradePrices[item.specifications.leg]}</span>
                                  )}
                                </p>
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
                    {(order.status === 5 || order.status === 'cancelled' || order.status === 6 || order.status === 4 || order.status === 'completed') && (
                      <button
                        onClick={() => handleDeleteOrder(order._id || order.id)}
                        className="px-4 py-2 text-sm border border-stone-300 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors"
                      >
                        删除订单
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
