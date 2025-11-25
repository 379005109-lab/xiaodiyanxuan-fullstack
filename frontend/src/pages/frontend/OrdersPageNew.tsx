import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Package, User, Phone, MapPin, ChevronRight, Clock, CheckCircle2, Truck, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'
import { Order } from '@/types'

// 状态配置
const statusConfig: Record<number | string, { label: string; color: string; bgColor: string }> = {
  1: { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  'pending': { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  2: { label: '已付款', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  'paid': { label: '已付款', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  3: { label: '待发货', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  'processing': { label: '处理中', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  4: { label: '已发货', color: 'text-green-600', bgColor: 'bg-green-50' },
  'shipped': { label: '已发货', color: 'text-green-600', bgColor: 'bg-green-50' },
  5: { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  'completed': { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  6: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-50' },
  'cancelled': { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-50' },
}

// 状态筛选选项
const statusOptions = [
  { value: '', label: '全部订单' },
  { value: '1', label: '待付款' },
  { value: '2', label: '待发货' },
  { value: '4', label: '已发货' },
  { value: '5', label: '已完成' },
]

export default function OrdersPageNew() {
  const navigate = useNavigate()
  const { user, token } = useAuthStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // 统计数据
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 1 || o.status === 'pending').length,
    completed: orders.filter(o => o.status === 5 || o.status === 'completed').length,
    totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
  }

  // 加载订单
  useEffect(() => {
    if (!user || !token) {
      toast.error('请先登录')
      navigate('/login')
      return
    }
    loadOrders()
  }, [user, token, filterStatus])

  const loadOrders = async () => {
    try {
      setLoading(true)
      
      let url = 'https://pkochbpmcgaa.sealoshzh.site/api/orders?pageSize=50'
      if (filterStatus) {
        url += `&status=${filterStatus}`
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      
      const data = await response.json()
      setOrders(data.data || [])
      
    } catch (error: any) {
      console.error('加载订单失败:', error)
      toast.error('加载订单失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取商品列表
  const getProducts = (order: Order) => {
    if (order.orderType === 'package' && order.packageInfo) {
      const products: any[] = []
      order.packageInfo.selections?.forEach((selection) => {
        selection.products?.forEach((product) => {
          products.push({
            name: product.productName,
            quantity: product.quantity,
            materials: product.materials,
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
        image: item.image || item.productImage
      }))
    }
    return []
  }

  // 订单卡片组件
  const OrderCard = ({ order, isSelected, onClick }: { order: Order, isSelected: boolean, onClick: () => void }) => {
    const status = statusConfig[order.status] || statusConfig[1]
    const createdAt = new Date(order.createdAt).toLocaleDateString('zh-CN')
    const products = getProducts(order)
    const recipient = order.recipient || order.shippingAddress

    return (
      <div 
        className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'border-blue-500 shadow-md' : 'border-gray-100'
        }`}
        onClick={onClick}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color} ${status.bgColor}`}>
              {status.label}
            </span>
            <span className="text-gray-400 text-xs">{createdAt}</span>
          </div>
          <span className="text-blue-600 font-bold">¥{formatPrice(order.totalAmount)}</span>
        </div>

        {/* 订单号 */}
        <div className="text-xs text-gray-400 mb-3">{order.orderNo}</div>

        {/* 套餐标签 */}
        {order.orderType === 'package' && order.packageInfo && (
          <div className="mb-3 px-2 py-1 bg-amber-50 rounded text-xs text-amber-700 inline-flex items-center gap-1">
            <Package className="w-3 h-3" />
            套餐：{order.packageInfo.packageName}
          </div>
        )}

        {/* 商品列表 */}
        <div className="space-y-2 mb-3">
          {products.slice(0, 2).map((product, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                {product.image ? (
                  <img src={getFileUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Package className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800 truncate">{product.name}</div>
                <div className="text-xs text-gray-400">
                  {product.materials?.fabric && `${product.materials.fabric} / `}x{product.quantity}
                </div>
              </div>
            </div>
          ))}
          {products.length > 2 && (
            <div className="text-xs text-gray-400">还有 {products.length - 2} 件商品...</div>
          )}
        </div>

        {/* 收货人 */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <User className="w-3 h-3" />
            <span>{recipient?.name || '-'}</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
        </div>
      </div>
    )
  }

  // 订单详情面板
  const OrderDetail = ({ order, onClose }: { order: Order, onClose: () => void }) => {
    const status = statusConfig[order.status] || statusConfig[1]
    const recipient = order.recipient || order.shippingAddress || { name: '', phone: '', address: '' }
    const shippingAddr = order.shippingAddress as any
    const address = recipient.address || 
      (shippingAddr ? [shippingAddr.province, shippingAddr.city, shippingAddr.district, shippingAddr.detail].filter(Boolean).join('') : '')
    const products = getProducts(order)

    return (
      <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
        {/* 头部 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${status.bgColor}`}></span>
            <span className={`font-medium ${status.color}`}>{status.label}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 收货信息 - 用户可以看到自己的地址 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              收货信息
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-800">{recipient.name || '-'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-800">{recipient.phone || '-'}</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <span className="text-gray-800">{address || '-'}</span>
              </div>
            </div>
          </div>

          {/* 商品清单 */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
              <Package className="w-4 h-4" />
              商品清单
            </h3>
            
            {order.orderType === 'package' && order.packageInfo && (
              <div className="mb-3 px-3 py-2 bg-amber-50 rounded-lg">
                <div className="text-sm font-medium text-amber-800">📦 套餐：{order.packageInfo.packageName}</div>
                <div className="text-xs text-amber-600 mt-1">套餐价：¥{formatPrice(order.packageInfo.packagePrice)}</div>
              </div>
            )}

            <div className="space-y-3">
              {products.map((product, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-14 h-14 bg-white rounded overflow-hidden flex-shrink-0 border border-gray-100">
                    {product.image ? (
                      <img src={getFileUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 font-medium">{product.name}</div>
                    {product.materials?.fabric && (
                      <div className="text-xs text-gray-500 mt-1">{product.materials.fabric}</div>
                    )}
                    {product.category && (
                      <div className="text-xs text-gray-400 mt-0.5">{product.category}</div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">x{product.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 订单金额 */}
          <div className="pt-3 border-t border-gray-100">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">商品小计</span>
              <span className="text-gray-800">¥{formatPrice(order.subtotal || order.totalAmount)}</span>
            </div>
            {order.discountAmount && order.discountAmount > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">优惠</span>
                <span className="text-red-500">-¥{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-medium mt-2">
              <span className="text-gray-800">订单总额</span>
              <span className="text-blue-600">¥{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* 订单时间 */}
          <div className="pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-400 space-y-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                下单时间：{new Date(order.createdAt).toLocaleString('zh-CN')}
              </div>
              {order.paidAt && (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  付款时间：{new Date(order.paidAt).toLocaleString('zh-CN')}
                </div>
              )}
              {order.shippedAt && (
                <div className="flex items-center gap-2">
                  <Truck className="w-3 h-3" />
                  发货时间：{new Date(order.shippedAt).toLocaleString('zh-CN')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页头 */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="container-custom">
          <h1 className="text-2xl font-bold text-gray-800">订单中心</h1>
          <p className="text-sm text-gray-500 mt-1">ORDER MANAGEMENT</p>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* 统计栏 */}
        <div className="bg-white rounded-xl p-6 mb-6 grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
            <div className="text-xs text-gray-500 mt-1">📋 总订单</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
            <div className="text-xs text-gray-500 mt-1">⏳ 待处理</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-xs text-gray-500 mt-1">✅ 已完成</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">¥{formatPrice(stats.totalAmount)}</div>
            <div className="text-xs text-gray-500 mt-1">💰 总金额</div>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilterStatus(option.value)}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  filterStatus === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex gap-6" style={{ minHeight: '600px' }}>
          {/* 左侧订单列表 */}
          <div className="w-1/2 space-y-4">
            {loading ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-500">
                加载中...
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2" />
                <p>暂无订单</p>
              </div>
            ) : (
              orders.map((order) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  isSelected={selectedOrder?._id === order._id}
                  onClick={() => setSelectedOrder(order)}
                />
              ))
            )}
          </div>

          {/* 右侧详情 */}
          <div className="w-1/2">
            {selectedOrder ? (
              <OrderDetail order={selectedOrder} onClose={() => setSelectedOrder(null)} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col items-center justify-center text-gray-400 p-8">
                <Package className="w-12 h-12 mb-2" />
                <p>选择一个订单查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
