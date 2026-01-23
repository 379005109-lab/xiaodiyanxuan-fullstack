import { useState } from 'react'
import { Package, User, Phone, MapPin, FileText, Truck, Clock, CheckCircle2, X, AlertCircle, Trash2, Check, XCircle } from 'lucide-react'
import { Order } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'

interface OrderDetailPanelProps {
  order: Order
  onClose: () => void
  onStatusChange?: (orderId: string, newStatus: number) => void
  onRefresh?: () => void  // 刷新订单列表
  showFollowUp?: boolean  // 是否显示跟进功能
}

// 订单状态配置
const statusConfig: Record<number | string, { label: string; color: string; bgColor: string }> = {
  0: { label: '待确认', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  1: { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  2: { label: '待发货', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  3: { label: '待收货', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  4: { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  5: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100' },
  6: { label: '退款中', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  7: { label: '已退款', color: 'text-red-600', bgColor: 'bg-red-100' },
  8: { label: '换货中', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  9: { label: '待确认收款', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  10: { label: '定金已付', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  11: { label: '生产中', color: 'text-teal-600', bgColor: 'bg-teal-100' },
  12: { label: '待付尾款', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  13: { label: '尾款已付', color: 'text-rose-600', bgColor: 'bg-rose-100' },
  pending: { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  paid: { label: '待发货', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  processing: { label: '待收货', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  shipped: { label: '待收货', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  completed: { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  cancelled: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100' },
}

// 隐藏手机号中间4位
const maskPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

// 隐藏地址（只显示省市区）
const maskAddress = (address: string) => {
  if (!address) return ''
  // 简单隐藏：显示前面部分，后面用*替代
  if (address.length > 10) {
    return address.slice(0, 10) + '******'
  }
  return address
}

export default function OrderDetailPanel({ order, onClose, onStatusChange, onRefresh, showFollowUp = true }: OrderDetailPanelProps) {
  const status = statusConfig[order.status] || statusConfig[1]
  const [followUpNote, setFollowUpNote] = useState('')

  const prEnabledRaw = (order as any).paymentRatioEnabled
  const paymentRatioEnabled =
    prEnabledRaw === true ||
    prEnabledRaw === 1 ||
    prEnabledRaw === 'true' ||
    prEnabledRaw === '1' ||
    (Boolean(prEnabledRaw) && prEnabledRaw !== 'false' && prEnabledRaw !== '0')

  const paymentRatioRaw = Number((order as any).paymentRatio || 0)
  const paymentRatio = paymentRatioRaw > 0 && paymentRatioRaw < 100 ? paymentRatioRaw : 50
  const totalAmountNumber = Number((order as any).totalAmount || 0)
  const depositAmountNumber = Number((order as any).depositAmount || 0)
  const finalPaymentAmountNumber = Number((order as any).finalPaymentAmount || 0)
  const computedDepositAmount = paymentRatioEnabled && totalAmountNumber > 0 && paymentRatio > 0 && paymentRatio < 100
    ? Math.round(totalAmountNumber * paymentRatio / 100)
    : 0
  const computedFinalPaymentAmount = paymentRatioEnabled && totalAmountNumber > 0 && paymentRatio > 0 && paymentRatio < 100
    ? Math.round(totalAmountNumber - computedDepositAmount)
    : 0
  const displayDepositAmount = depositAmountNumber > 0 ? depositAmountNumber : computedDepositAmount
  const displayFinalPaymentAmount = finalPaymentAmountNumber > 0 ? finalPaymentAmountNumber : computedFinalPaymentAmount

  // 处理删除订单
  const handleDelete = async () => {
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
        onRefresh?.()
        onClose()
      } else {
        toast.error('删除失败')
      }
    } catch (error) {
      toast.error('删除失败')
    }
  }
  
  // 批准取消
  const handleApproveCancel = async () => {
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
        onRefresh?.()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }
  
  // 拒绝取消
  const handleRejectCancel = async () => {
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
        toast.success('已拒绝取消')
        onRefresh?.()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }
  
  // 获取收货人信息
  const recipient = order.recipient || order.shippingAddress || { name: '', phone: '', address: '' }
  const shippingAddr = order.shippingAddress as any
  const address = recipient.address || 
    (shippingAddr ? [shippingAddr.province, shippingAddr.city, shippingAddr.district, shippingAddr.detail].filter(Boolean).join('') : '')

  // 获取商品列表
  const getProducts = () => {
    if (order.orderType === 'package' && order.packageInfo) {
      const products: any[] = []
      order.packageInfo.selections?.forEach((selection: any) => {
        selection.products?.forEach((product: any) => {
          // 获取材质信息（兼容中英文键名）
          const rawMaterials = product.selectedMaterials || product.materials || {}
          const upgradePrices = product.materialUpgradePrices || {}
          
          // 规范化材质数据，去重英文/中文键
          const fabricVal = rawMaterials.fabric || rawMaterials['面料'] || rawMaterials.material || rawMaterials['材质'] || ''
          const fillingVal = rawMaterials.filling || rawMaterials['填充'] || rawMaterials.fill || ''
          const frameVal = rawMaterials.frame || rawMaterials['框架'] || ''
          const legVal = rawMaterials.leg || rawMaterials['脚架'] || rawMaterials.legs || ''
          
          const normalizedMaterials: Record<string, string> = {}
          if (fabricVal) normalizedMaterials['面料'] = fabricVal
          if (fillingVal) normalizedMaterials['填充'] = fillingVal
          if (frameVal) normalizedMaterials['框架'] = frameVal
          if (legVal) normalizedMaterials['脚架'] = legVal
          
          products.push({
            name: product.productName,
            quantity: product.quantity,
            skuName: product.skuName,
            materials: normalizedMaterials,
            selectedMaterials: {
              fabric: fabricVal,
              filling: fillingVal,
              frame: frameVal,
              leg: legVal
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
      return order.items.map((item: any) => {
        // 规范化材质数据，去重英文/中文键
        const rawMaterials = item.selectedMaterials || item.materials || {}
        const fabricVal = rawMaterials.fabric || rawMaterials['面料'] || rawMaterials.material || rawMaterials['材质'] || ''
        const fillingVal = rawMaterials.filling || rawMaterials['填充'] || rawMaterials.fill || ''
        const frameVal = rawMaterials.frame || rawMaterials['框架'] || ''
        const legVal = rawMaterials.leg || rawMaterials['脚架'] || rawMaterials.legs || ''
        
        const normalizedMaterials: Record<string, string> = {}
        if (fabricVal) normalizedMaterials['面料'] = fabricVal
        if (fillingVal) normalizedMaterials['填充'] = fillingVal
        if (frameVal) normalizedMaterials['框架'] = frameVal
        if (legVal) normalizedMaterials['脚架'] = legVal
        
        return {
          name: item.productName,
          quantity: item.quantity,
          materials: normalizedMaterials,
          specifications: item.specifications,
          selectedMaterials: {
            fabric: fabricVal,
            filling: fillingVal,
            frame: frameVal,
            leg: legVal
          },
          materialUpgradePrices: item.materialUpgradePrices,
          skuDimensions: item.skuDimensions,
          skuName: item.sku?.color || item.skuName,
          image: item.image || item.productImage
        }
      })
    }
    return []
  }

  const products = getProducts()

  // 处理发货
  const handleShip = () => {
    if (onStatusChange) {
      onStatusChange(order._id, 3) // 3 = 待收货（已发货）
      toast.success('订单已发货')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 h-full flex flex-col">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.bgColor}`}></span>
          <span className={`font-medium ${status.color}`}>{status.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {(order.status === 2 || order.status === 'paid') && (
            <button
              onClick={handleShip}
              className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              发货
            </button>
          )}
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 内容区域 - 可滚动 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 结算模式选择 - 待确认或待付款状态显示 */}
        {(order.status === 0 || order.status === 1 || order.status === 'pending') && !(order as any).settlementMode && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">💰</span>
              选择结算模式
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={async () => {
                  if (!window.confirm(`供应商调货模式（一键到底）\n\n原价: ¥${order.totalAmount?.toLocaleString()}\n最低折扣价(60%): ¥${(order.totalAmount * 0.6).toLocaleString()}\n返佣(40%): ¥${(order.totalAmount * 0.6 * 0.4).toLocaleString()}\n\n实付金额: ¥${(order.totalAmount * 0.6 * 0.6).toLocaleString()}\n\n确定选择此模式？`)) return
                  try {
                    const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/settlement-mode`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ settlementMode: 'supplier_transfer', minDiscountRate: 0.6, commissionRate: 0.4 })
                    })
                    if (response.ok) {
                      toast.success('已选择供应商调货模式')
                      onRefresh?.()
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
                onClick={async () => {
                  if (!window.confirm(`返佣模式\n\n原价: ¥${order.totalAmount?.toLocaleString()}\n最低折扣价(60%): ¥${(order.totalAmount * 0.6).toLocaleString()}\n\n首付(50%): ¥${(order.totalAmount * 0.6 * 0.5).toLocaleString()}\n尾款(50%): ¥${(order.totalAmount * 0.6 * 0.5).toLocaleString()}\n\n返佣(40%): ¥${(order.totalAmount * 0.6 * 0.4).toLocaleString()}（完成后申请）\n\n确定选择此模式？`)) return
                  try {
                    const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/settlement-mode`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ settlementMode: 'commission_mode', minDiscountRate: 0.6, commissionRate: 0.4, paymentRatio: 50, estimatedProductionDays: 30 })
                    })
                    if (response.ok) {
                      toast.success('已选择返佣模式')
                      onRefresh?.()
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
        {(order as any).settlementMode && (
          <div className={`border-2 rounded-xl p-4 ${
            (order as any).settlementMode === 'supplier_transfer' 
              ? 'bg-indigo-50 border-indigo-300' 
              : 'bg-purple-50 border-purple-300'
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{(order as any).settlementMode === 'supplier_transfer' ? '🚚' : '💰'}</span>
              <div>
                <p className="font-bold text-lg">
                  {(order as any).settlementMode === 'supplier_transfer' ? '供应商调货模式' : '返佣模式'}
                </p>
                <p className="text-sm text-gray-600">已选择结算模式</p>
              </div>
            </div>
          </div>
        )}

        {/* 客户信息 */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
            <User className="w-4 h-4" />
            客户信息
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">联系人</span>
              <span className="text-gray-800">{recipient.name || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">联系电话</span>
              <span className="text-gray-800">{maskPhone(recipient.phone) || '-'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">收货地址</span>
              <span className="text-gray-800 text-right max-w-[200px]">{maskAddress(address) || '-'}</span>
            </div>
          </div>
        </div>

        {/* 买家备注 */}
        {order.notes && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">买家备注</h3>
            <p className="text-sm text-orange-600 bg-orange-50 p-2 rounded">{order.notes}</p>
          </div>
        )}

        {/* 商品清单 */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
            <Package className="w-4 h-4" />
            商品清单
          </h3>
          
          {/* 套餐标签 */}
          {order.orderType === 'package' && order.packageInfo && (
            <div className="mb-3 px-3 py-2 bg-amber-50 rounded-lg">
              <div className="text-sm font-medium text-amber-800">
                📦 套餐：{order.packageInfo.packageName}
              </div>
              <div className="text-xs text-amber-600 mt-1">
                套餐价：¥{formatPrice(order.packageInfo.packagePrice)}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {products.map((product, index) => (
              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div className="w-14 h-14 bg-white rounded overflow-hidden flex-shrink-0 border border-gray-100">
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
                  <div className="text-sm text-gray-800 font-medium">{product.name}</div>
                  {/* 规格信息 */}
                  {product.skuName && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{product.skuName}</span>
                  )}
                  {/* 尺寸信息 */}
                  {(product.skuDimensions?.length || product.skuDimensions?.width || product.skuDimensions?.height || product.specifications?.dimensions) && (
                    <div className="text-xs text-gray-500 mt-1">
                      尺寸: {product.specifications?.dimensions || `${product.skuDimensions?.length || '-'}×${product.skuDimensions?.width || '-'}×${product.skuDimensions?.height || '-'}`} CM
                    </div>
                  )}
                  {/* 材质信息 - 动态显示所有材质类目 */}
                  {product.selectedMaterials && Object.keys(product.selectedMaterials).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(product.selectedMaterials).map(([category, material]) => {
                        if (!material) return null
                        const upgradePrice = product.materialUpgradePrices?.[category] || 0
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
                  {/* 商品加价汇总 */}
                  {product.upgradePrice > 0 && (
                    <div className="text-xs text-red-600 font-medium mt-1">商品加价: +¥{product.upgradePrice}</div>
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
            <span className="text-green-600">¥{formatPrice(order.totalAmount)}</span>
          </div>
        </div>

        {/* 预付定制订单信息 */}
        {(order as any).paymentRatioEnabled && (
          <div className="bg-gradient-to-r from-cyan-50 to-pink-50 rounded-xl p-4 border border-cyan-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              📦 预付定制订单
              {(order as any).estimatedProductionDays > 0 && (
                <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                  🏭 制作周期: {(order as any).estimatedProductionDays} 天
                </span>
              )}
            </h3>
            
            {/* 两段式支付状态 */}
            <div className="mb-3 p-3 bg-white/80 rounded-lg">
              <div className="text-xs text-gray-500 mb-2 font-medium">💳 支付状态</div>
              <div className="flex items-center gap-2">
                {/* 定金状态 */}
                <div className={`flex-1 p-2 rounded-lg text-center ${
                  (order as any).depositVerified ? 'bg-green-100 border border-green-300' :
                  (order as any).depositPaidAt ? 'bg-amber-100 border border-amber-300' :
                  'bg-gray-100 border border-gray-300'
                }`}>
                  <div className="text-xs text-gray-500">定金({(order as any).paymentRatio || 50}%)</div>
                  <div className={`font-bold ${
                    (order as any).depositVerified ? 'text-green-700' :
                    (order as any).depositPaidAt ? 'text-amber-700' :
                    'text-gray-700'
                  }`}>¥{(displayDepositAmount || 0).toLocaleString()}</div>
                  <div className={`text-xs mt-1 ${
                    (order as any).depositVerified ? 'text-green-600' :
                    (order as any).depositPaidAt ? 'text-amber-600' :
                    'text-gray-500'
                  }`}>
                    {(order as any).depositVerified ? '✓ 已核销' :
                     (order as any).depositPaidAt ? '⏳ 待核销' :
                     '○ 待支付'}
                  </div>
                </div>
                
                {/* 箭头 */}
                <div className="text-gray-400">→</div>
                
                {/* 尾款状态 */}
                <div className={`flex-1 p-2 rounded-lg text-center ${
                  (order as any).finalPaymentVerified ? 'bg-green-100 border border-green-300' :
                  (order as any).finalPaymentPaidAt ? 'bg-amber-100 border border-amber-300' :
                  (order as any).finalPaymentRequested ? 'bg-pink-100 border border-pink-300' :
                  'bg-gray-100 border border-gray-300'
                }`}>
                  <div className="text-xs text-gray-500">尾款({100 - ((order as any).paymentRatio || 50)}%)</div>
                  <div className={`font-bold ${
                    (order as any).finalPaymentVerified ? 'text-green-700' :
                    (order as any).finalPaymentPaidAt ? 'text-amber-700' :
                    (order as any).finalPaymentRequested ? 'text-pink-700' :
                    'text-gray-700'
                  }`}>¥{(displayFinalPaymentAmount || 0).toLocaleString()}</div>
                  <div className={`text-xs mt-1 ${
                    (order as any).finalPaymentVerified ? 'text-green-600' :
                    (order as any).finalPaymentPaidAt ? 'text-amber-600' :
                    (order as any).finalPaymentRequested ? 'text-pink-600' :
                    'text-gray-500'
                  }`}>
                    {(order as any).finalPaymentVerified ? '✓ 已核销' :
                     (order as any).finalPaymentPaidAt ? '⏳ 待核销' :
                     (order as any).finalPaymentRequested ? '📢 已请求' :
                     '○ 待请求'}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/60 rounded-lg p-2">
                <div className="text-gray-500 text-xs">返佣金额</div>
                <div className="font-bold text-purple-700">¥{((order as any).commissionAmount || 0).toLocaleString()}</div>
                <div className="text-xs text-gray-400">(订单完成后可申请)</div>
              </div>
              <div className="bg-white/60 rounded-lg p-2">
                <div className="text-gray-500 text-xs">原价 → 折扣价</div>
                <div className="font-bold">
                  <span className="text-gray-400 line-through text-sm">¥{((order as any).originalPrice || 0).toLocaleString()}</span>
                  <span className="text-green-700 ml-1">¥{((order as any).minDiscountPrice || order.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            {/* 生产进度和剩余天数 */}
            {(order as any).depositPaidAt && (
              <div className="mt-3 p-2 bg-white/60 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">生产进度</div>
                {(() => {
                  const startDate = new Date((order as any).depositPaidAt)
                  const days = (order as any).estimatedProductionDays || 30
                  const deadline = new Date(startDate.getTime() + days * 24 * 60 * 60 * 1000)
                  const remaining = Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
                  const progress = Math.min(100, Math.max(0, ((days - remaining) / days) * 100))
                  return (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>开始: {startDate.toLocaleDateString('zh-CN')}</span>
                        <span className={remaining > 0 ? 'text-teal-600' : 'text-red-600'}>
                          {remaining > 0 ? `剩余 ${remaining} 天` : '已到期'}
                        </span>
                        <span>截止: {deadline.toLocaleDateString('zh-CN')}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${remaining > 0 ? 'bg-teal-500' : 'bg-red-500'}`} style={{width: `${progress}%`}}></div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
            
            {/* 提前交付按钮 */}
            {(order as any).depositVerified && order.status === 11 && (
              <button
                onClick={async () => {
                  try {
                    const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/orders/${order._id}/request-final-payment`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' }
                    })
                    if (response.ok) {
                      toast.success('已发起尾款请求，等待客户支付')
                      onRefresh?.()
                    } else {
                      toast.error('操作失败')
                    }
                  } catch (error) {
                    toast.error('操作失败')
                  }
                }}
                className="mt-3 w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm"
              >
                🚀 提前交付 - 发起尾款请求
              </button>
            )}
          </div>
        )}

        {/* 订单动态 & 跟进 - 仅管理员显示 */}
        {showFollowUp && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              订单动态
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {new Date(order.createdAt).toLocaleString('zh-CN')} 订单创建
              </div>
              
              {/* 显示后端返回的活动日志 */}
              {(order as any).activityLogs?.map((log: any, idx: number) => (
                <div key={idx} className={`text-xs flex items-start gap-2 p-2 rounded ${
                  log.action === 'settlement_mode_set' ? 'bg-purple-50 text-purple-700' :
                  log.action === 'deposit_paid' ? 'bg-cyan-50 text-cyan-700' :
                  log.action === 'final_payment_paid' ? 'bg-pink-50 text-pink-700' :
                  log.action === 'deposit_verified' ? 'bg-green-50 text-green-700' :
                  log.action === 'production_started' ? 'bg-teal-50 text-teal-700' :
                  'bg-gray-50 text-gray-600'
                }`}>
                  <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <div>{new Date(log.timestamp).toLocaleString('zh-CN')}</div>
                    <div className="font-medium">{log.details}</div>
                    {log.operator && <div className="text-xs opacity-70">操作人: {log.operator}</div>}
                  </div>
                </div>
              ))}
              
              {/* 预付定制订单生产周期显示 */}
              {(order as any).paymentRatioEnabled && (order as any).estimatedProductionDays && (
                <div className="text-xs p-2 bg-teal-50 text-teal-700 rounded">
                  <div className="font-medium">📦 预付定制订单</div>
                  <div>生产周期: {(order as any).estimatedProductionDays} 天</div>
                  {(order as any).productionDeadline && (
                    <div>预计完成: {new Date((order as any).productionDeadline).toLocaleDateString('zh-CN')}</div>
                  )}
                  {(order as any).depositPaidAt && !((order as any).productionDeadline) && (
                    <div>
                      预计完成: {new Date(new Date((order as any).depositPaidAt).getTime() + (order as any).estimatedProductionDays * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN')}
                      {(() => {
                        const deadline = new Date(new Date((order as any).depositPaidAt).getTime() + (order as any).estimatedProductionDays * 24 * 60 * 60 * 1000)
                        const remaining = Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
                        return remaining > 0 ? ` (剩余 ${remaining} 天)` : ' (已到期)'
                      })()}
                    </div>
                  )}
                </div>
              )}
              
              {order.paidAt && (
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" />
                  {new Date(order.paidAt).toLocaleString('zh-CN')} 订单已付款
                </div>
              )}
              {order.shippedAt && (
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <Truck className="w-3 h-3" />
                  {new Date(order.shippedAt).toLocaleString('zh-CN')} 订单已发货
                </div>
              )}
            </div>
            
            {/* 写跟进 */}
            <div className="mt-3">
              <textarea
                value={followUpNote}
                onChange={(e) => setFollowUpNote(e.target.value)}
                placeholder="添加跟进记录..."
                className="w-full p-2 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2}
              />
              <button
                onClick={() => {
                  if (followUpNote.trim()) {
                    toast.success('跟进记录已添加')
                    setFollowUpNote('')
                  }
                }}
                className="mt-2 px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                写跟进
              </button>
            </div>
          </div>
        )}
        
        {/* 取消申请处理 */}
        {(order as any).cancelRequest && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-700 font-medium mb-3">
              <AlertCircle className="w-4 h-4" />
              客户申请取消订单
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApproveCancel}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center justify-center gap-1"
              >
                <Check className="w-4 h-4" />
                批准取消
              </button>
              <button
                onClick={handleRejectCancel}
                className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm flex items-center justify-center gap-1"
              >
                <XCircle className="w-4 h-4" />
                拒绝
              </button>
            </div>
          </div>
        )}
        
        {/* 删除订单按钮 */}
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            删除订单
          </button>
        </div>
      </div>
    </div>
  )
}
