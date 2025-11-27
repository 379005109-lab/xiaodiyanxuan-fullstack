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
  1: { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  'pending': { label: '待付款', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  2: { label: '已付款', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  'paid': { label: '已付款', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  3: { label: '待发货', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  'processing': { label: '处理中', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  4: { label: '已发货', color: 'text-green-600', bgColor: 'bg-green-100' },
  'shipped': { label: '已发货', color: 'text-green-600', bgColor: 'bg-green-100' },
  5: { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  'completed': { label: '已完成', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  6: { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100' },
  'cancelled': { label: '已取消', color: 'text-red-600', bgColor: 'bg-red-100' },
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

  const products = getProducts()

  // 处理发货
  const handleShip = () => {
    if (onStatusChange) {
      onStatusChange(order._id, 4) // 4 = 已发货
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
          {(order.status === 2 || order.status === 3 || order.status === 'paid' || order.status === 'processing') && (
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
                  <div className="text-sm text-gray-800 font-medium">{product.name} x{product.quantity}</div>
                  {/* 规格信息 */}
                  {(product.skuName || product.specifications?.size) && (
                    <div className="text-xs text-gray-500 mt-1">规格: {product.skuName || product.specifications?.size}</div>
                  )}
                  {/* 材质信息 - 支持套餐订单和普通订单 */}
                  {(product.selectedMaterials?.fabric || product.specifications?.material) && (
                    <div className="text-xs text-gray-500">
                      面料: {product.selectedMaterials?.fabric || product.specifications?.material}
                      {(product.materialUpgradePrices?.fabric > 0 || product.materialUpgradePrices?.[product.specifications?.material] > 0) && (
                        <span className="text-red-600 font-semibold ml-1">+¥{product.materialUpgradePrices?.fabric || product.materialUpgradePrices?.[product.specifications?.material]}</span>
                      )}
                    </div>
                  )}
                  {(product.selectedMaterials?.filling || product.specifications?.fill) && (
                    <div className="text-xs text-gray-500">
                      填充: {product.selectedMaterials?.filling || product.specifications?.fill}
                      {(product.materialUpgradePrices?.filling > 0 || product.materialUpgradePrices?.[product.specifications?.fill] > 0) && (
                        <span className="text-red-600 font-semibold ml-1">+¥{product.materialUpgradePrices?.filling || product.materialUpgradePrices?.[product.specifications?.fill]}</span>
                      )}
                    </div>
                  )}
                  {(product.selectedMaterials?.frame || product.specifications?.frame) && (
                    <div className="text-xs text-gray-500">
                      框架: {product.selectedMaterials?.frame || product.specifications?.frame}
                      {(product.materialUpgradePrices?.frame > 0 || product.materialUpgradePrices?.[product.specifications?.frame] > 0) && (
                        <span className="text-red-600 font-semibold ml-1">+¥{product.materialUpgradePrices?.frame || product.materialUpgradePrices?.[product.specifications?.frame]}</span>
                      )}
                    </div>
                  )}
                  {(product.selectedMaterials?.leg || product.specifications?.leg) && (
                    <div className="text-xs text-gray-500">
                      脚架: {product.selectedMaterials?.leg || product.specifications?.leg}
                      {(product.materialUpgradePrices?.leg > 0 || product.materialUpgradePrices?.[product.specifications?.leg] > 0) && (
                        <span className="text-red-600 font-semibold ml-1">+¥{product.materialUpgradePrices?.leg || product.materialUpgradePrices?.[product.specifications?.leg]}</span>
                      )}
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

        {/* 订单动态 & 跟进 - 仅管理员显示 */}
        {showFollowUp && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              订单动态 & 跟进
            </h3>
            <div className="space-y-2">
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <Clock className="w-3 h-3" />
                {new Date(order.createdAt).toLocaleString('zh-CN')} 订单创建
              </div>
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
