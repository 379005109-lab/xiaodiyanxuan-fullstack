import React, { useState } from 'react'
import { X, ShoppingCart, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cartStore'

interface ConciergeOrderModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ConciergeOrderModal({ isOpen, onClose }: ConciergeOrderModalProps) {
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const loadCartFromSimpleItems = useCartStore((state) => state.loadFromSimpleItems)

  const handleStartOrder = async () => {
    // 验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!customerPhone || !phoneRegex.test(customerPhone)) {
      toast.error('请输入正确的11位手机号码')
      return
    }

    if (!customerName.trim()) {
      toast.error('请输入客户名称')
      return
    }

    setLoading(true)
    try {
      // 保存客户信息到localStorage
      const conciergeOrder = {
        id: `concierge_${Date.now()}`,
        customerPhone,
        customerName,
        createdAt: new Date().toISOString(),
        items: [],
      }
      
      const stored = JSON.parse(localStorage.getItem('concierge_orders') || '[]')
      stored.push(conciergeOrder)
      localStorage.setItem('concierge_orders', JSON.stringify(stored))

      // 清空购物车并打开购物车页面
      loadCartFromSimpleItems([])
      
      toast.success(`已为 ${customerName} 创建代客下单，请选择商品`)
      
      // 保存当前代客下单信息到sessionStorage，以便在购物车页面显示
      sessionStorage.setItem('currentConciergeOrder', JSON.stringify({
        customerPhone,
        customerName,
        orderId: conciergeOrder.id,
      }))

      // 打开购物车页面
      window.open('/cart', '_blank')
      
      onClose()
      setCustomerPhone('')
      setCustomerName('')
    } catch (error) {
      console.error('创建代客下单失败:', error)
      toast.error('创建代客下单失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4 p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary-100 rounded-lg p-2">
              <ShoppingCart className="h-6 w-6 text-primary-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">代客下单</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 表单 */}
        <div className="space-y-4 mb-6">
          {/* 客户名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              客户名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="请输入客户名称"
              className="input w-full"
            />
          </div>

          {/* 客户手机号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                客户手机号 <span className="text-red-500">*</span>
              </div>
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="请输入11位手机号码"
              maxLength={11}
              className="input w-full"
            />
            <p className="text-xs text-gray-500 mt-1">用于订单中心识别代客下单人员</p>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-700">
            <span className="font-semibold">提示：</span>
            代客下单后，客户的订单中心会显示你的信息（标红），客户可以确认订单并支付。
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
          >
            取消
          </button>
          <button
            onClick={handleStartOrder}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-4 w-4" />
            {loading ? '创建中...' : '开始下单'}
          </button>
        </div>
      </div>
    </div>
  )
}
