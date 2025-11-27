import { useState } from 'react'
import { Package, User, Phone, MapPin, ChevronRight } from 'lucide-react'
import { Order } from '@/types'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'

interface OrderCardProps {
  order: Order
  isSelected: boolean
  onClick: () => void
}

// 订单状态配置
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

// 隐藏手机号中间4位
const maskPhone = (phone: string) => {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

// 隐藏姓名（只显示姓）
const maskName = (name: string) => {
  if (!name) return ''
  return name.charAt(0) + '**'
}

export default function OrderCard({ order, isSelected, onClick }: OrderCardProps) {
  const status = statusConfig[order.status] || statusConfig[1]
  const createdAt = new Date(order.createdAt).toLocaleDateString('zh-CN')
  
  // 获取商品列表（普通订单或套餐订单）
  const getProducts = () => {
    if (order.orderType === 'package' && order.packageInfo) {
      // 套餐订单
      const products: any[] = []
      order.packageInfo.selections?.forEach((selection: any) => {
        selection.products?.forEach((product: any) => {
          products.push({
            name: product.productName,
            quantity: product.quantity,
            materials: product.materials,
            image: product.image
          })
        })
      })
      return products
    } else if (order.items) {
      // 普通订单
      return order.items.map((item: any) => ({
        name: item.productName,
        quantity: item.quantity,
        materials: item.materials,
        image: item.image
      }))
    }
    return []
  }

  const products = getProducts()

  return (
    <div 
      className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-green-500 shadow-md' : 'border-gray-100'
      }`}
      onClick={onClick}
    >
      {/* 头部：状态、日期、价格 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${status.color} ${status.bgColor}`}>
            {status.label}
          </span>
          <span className="text-gray-400 text-xs">{createdAt}</span>
        </div>
        <span className="text-green-600 font-bold">¥{formatPrice(order.totalAmount)}</span>
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
        {products.slice(0, 3).map((product, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex-shrink-0">
              {product.image ? (
                <img 
                  src={getFileUrl(product.image)} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Package className="w-5 h-5" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-800 truncate">{product.name}</div>
              <div className="text-xs text-gray-400">
                {product.materials?.fabric && `${product.materials.fabric} / `}
                x{product.quantity}
              </div>
            </div>
          </div>
        ))}
        {products.length > 3 && (
          <div className="text-xs text-gray-400">还有 {products.length - 3} 件商品...</div>
        )}
      </div>

      {/* 收货人信息 */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <User className="w-3 h-3" />
          <span>{maskName(order.recipient?.name || '')}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
      </div>
    </div>
  )
}
