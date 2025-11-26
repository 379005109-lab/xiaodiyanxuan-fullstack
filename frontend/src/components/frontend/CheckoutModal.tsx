import { useState, useEffect } from 'react'
import { X, AlertCircle } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import axios from '@/lib/axios'
import { getFileUrl } from '@/services/uploadService'

interface CheckoutModalProps {
  onClose: () => void
}

export default function CheckoutModal({ onClose }: CheckoutModalProps) {
  const { items, getTotalPrice, clearCart, conciergeMode, conciergeOrderInfo } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  })
  
  // 代客下单模式自动填充客户信息
  useEffect(() => {
    if (conciergeMode && conciergeOrderInfo) {
      setFormData({
        name: conciergeOrderInfo.customerName,
        phone: conciergeOrderInfo.customerPhone,
        address: '', // 地址留空，由客服填写
        notes: `代客下单 - 订单ID: ${conciergeOrderInfo.orderId}`
      })
    }
  }, [conciergeMode, conciergeOrderInfo])
  
  const [submitting, setSubmitting] = useState(false)

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('请先登录')
      onClose()
    }
  }, [isAuthenticated, onClose])

  // 计算单个商品的价格
  // 使用保存的价格（添加时的价格）
  const getItemPrice = (item: any): number => {
    // 如果有保存的价格，直接使用
    if (item.price !== undefined) {
      return item.price
    }
    
    // 向后兼容：如果没有保存的价格，则动态计算
    const basePrice = item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price
      ? item.sku.discountPrice
      : item.sku.price
    
    const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
    let upgradePrice = 0
    if (item.selectedMaterials) {
      const selectedMaterialList: string[] = []
      if (item.selectedMaterials.fabric) selectedMaterialList.push(item.selectedMaterials.fabric)
      if (item.selectedMaterials.filling) selectedMaterialList.push(item.selectedMaterials.filling)
      if (item.selectedMaterials.frame) selectedMaterialList.push(item.selectedMaterials.frame)
      if (item.selectedMaterials.leg) selectedMaterialList.push(item.selectedMaterials.leg)
      
      upgradePrice = selectedMaterialList.reduce((sum, matName) => {
        return sum + (materialUpgradePrices[matName] || 0)
      }, 0)
    }
    
    return basePrice + upgradePrice
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证必填字段
    if (!formData.name || !formData.phone || !formData.address) {
      toast.error('请填写完整的收货信息')
      return
    }

    // 验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(formData.phone)) {
      toast.error('请输入正确的手机号码')
      return
    }

    setSubmitting(true)

    // 构建订单数据（在try外面定义，确保catch中可以访问）
    const orderData: any = {
      items: items.map(item => ({
        product: item.product._id,
        productId: item.product._id, // 同时传递productId，确保后端能识别
        productName: item.product.name,
        productImage: item.sku.images?.[0] || item.product.images[0],
        image: item.sku.images?.[0] || item.product.images[0], // 添加image字段
        skuId: item.sku._id, // 传递skuId
        sku: {
          _id: item.sku._id, // 同时传递sku._id
          color: item.sku.color || '',
          material: typeof item.sku.material === 'string' 
            ? item.sku.material 
            : JSON.stringify(item.sku.material)
        },
        specifications: {
          size: item.sku.spec || '',
          material: item.selectedMaterials?.fabric || '',
          fill: item.selectedMaterials?.filling || '',
          frame: item.selectedMaterials?.frame || '',
          leg: item.selectedMaterials?.leg || ''
        },
        selectedMaterials: item.selectedMaterials || {},  // 保存材质选择
        materialUpgradePrices: item.materialUpgradePrices || {},  // 保存升级价格
        quantity: item.quantity,
        price: item.price !== undefined ? item.price : getItemPrice(item)
      })),
      totalAmount: getTotalPrice(),
      shippingAddress: {
        name: formData.name,
        phone: formData.phone,
        address: formData.address
      },
      paymentMethod: 'alipay',
      notes: formData.notes
    }

    // 生成订单号
    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const orderNo = `ORD${dateStr}${random}`
    
    // 获取用户信息
    const { user } = useAuthStore.getState()
    
    // 创建本地订单（无论API是否成功都保存）
    const localOrder: any = {
      _id: `local_${Date.now()}_${random}`,
      orderNo,
      user: user?._id || user || 'local_user',
      items: orderData.items.map((item: any) => ({
        product: item.product || item.productId,
        productName: item.productName || '',
        productImage: item.productImage || item.image || '',
        image: item.image || item.productImage || '',
        sku: item.sku || { color: '', material: '' },
        specifications: item.specifications || {},  // 保存规格信息
        selectedMaterials: item.selectedMaterials || {},  // 保存材质选择
        materialUpgradePrices: item.materialUpgradePrices || {},  // 保存升级价格
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: orderData.totalAmount,
      status: 'pending',
      shippingAddress: orderData.shippingAddress,
      recipient: orderData.shippingAddress,  // 添加recipient字段以兼容
      paymentMethod: orderData.paymentMethod,
      notes: orderData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    console.log('📦 准备保存订单:', localOrder)
    
    // 先保存到本地存储（用于测试）
    try {
      // 检查localStorage是否可用
      if (typeof Storage === 'undefined') {
        throw new Error('浏览器不支持localStorage')
      }
      
      // 尝试读取现有订单
      let existingOrders: any[] = []
      try {
        const stored = localStorage.getItem('local_orders')
        if (stored) {
          existingOrders = JSON.parse(stored)
          if (!Array.isArray(existingOrders)) {
            console.warn('localStorage中的数据不是数组，重置为空数组')
            existingOrders = []
          }
        }
      } catch (parseError) {
        console.warn('解析现有订单失败，重置为空数组:', parseError)
        existingOrders = []
      }
      
      // 清理订单数据，确保可以序列化
      const cleanOrder = {
        _id: localOrder._id,
        orderNo: localOrder.orderNo,
        user: typeof localOrder.user === 'object' ? (localOrder.user as any)?._id || 'local_user' : localOrder.user,
        items: localOrder.items.map((item: any) => ({
          product: typeof item.product === 'object' ? (item.product as any)?._id : item.product,
          productId: item.product || item.productId,
          productName: item.productName || '',
          productImage: item.productImage || '',
          image: item.image || item.productImage || '',
          sku: {
            _id: typeof item.sku === 'object' && item.sku?._id ? item.sku._id : '',
            color: typeof item.sku === 'object' ? item.sku?.color || '' : '',
            material: typeof item.sku === 'object' ? item.sku?.material || '' : ''
          },
          specifications: item.specifications || {},
          selectedMaterials: item.selectedMaterials || {},
          materialUpgradePrices: item.materialUpgradePrices || {},
          quantity: item.quantity || 1,
          price: item.price || 0
        })),
        totalAmount: localOrder.totalAmount || 0,
        status: localOrder.status || 'pending',
        shippingAddress: localOrder.shippingAddress || {},
        recipient: localOrder.recipient || localOrder.shippingAddress || {},
        paymentMethod: localOrder.paymentMethod || 'alipay',
        notes: localOrder.notes || '',
        createdAt: localOrder.createdAt,
        updatedAt: localOrder.updatedAt
      }
      
      console.log('🧹 清理后的订单数据:', cleanOrder)
      
      // 添加到数组
      existingOrders.push(cleanOrder)
      
      // 尝试序列化
      let serialized: string
      try {
        serialized = JSON.stringify(existingOrders)
        console.log('✅ 序列化成功，数据大小:', serialized.length, '字节')
      } catch (stringifyError) {
        console.error('❌ JSON序列化失败:', stringifyError)
        throw new Error(`序列化失败: ${stringifyError}`)
      }
      
      // 检查数据大小（localStorage通常限制5-10MB）
      if (serialized.length > 5 * 1024 * 1024) {
        console.warn('⚠️ 数据较大，可能超过localStorage限制')
      }
      
      // 保存到localStorage
      try {
        localStorage.setItem('local_orders', serialized)
        console.log('✅ 已写入localStorage')
      } catch (setError: any) {
        // 可能是存储空间不足
        if (setError.name === 'QuotaExceededError' || setError.code === 22) {
          console.error('❌ localStorage空间不足')
          throw new Error('存储空间不足，请清理浏览器数据')
        }
        throw setError
      }
      
      // 验证保存是否成功
      const verify = JSON.parse(localStorage.getItem('local_orders') || '[]')
      console.log('✅ 订单已保存到localStorage')
      console.log('订单号:', orderNo)
      console.log('订单ID:', cleanOrder._id)
      console.log('当前订单总数:', existingOrders.length)
      console.log('验证：localStorage中的订单数量:', verify.length)
      
      if (verify.length !== existingOrders.length) {
        console.error('❌ 验证失败：订单数量不匹配')
        throw new Error('验证失败：订单数量不匹配')
      }
    } catch (storageError: any) {
      console.error('❌ 保存到localStorage失败')
      console.error('错误类型:', storageError?.name || typeof storageError)
      console.error('错误消息:', storageError?.message || storageError)
      console.error('完整错误:', storageError)
      
      // 显示更详细的错误信息
      let errorMessage = '保存订单失败'
      if (storageError?.message) {
        errorMessage += ': ' + storageError.message
      } else if (typeof storageError === 'string') {
        errorMessage += ': ' + storageError
      }
      
      toast.error(errorMessage + '，请检查浏览器控制台')
      setSubmitting(false)
      return
    }
    
    // 提交到云端API
    try {
      const response = await axios.post('/orders', orderData)
      
      // axios拦截器返回的是response.data，所以response已经是数据本身
      if (response && (response as any).success) {
        console.log('✅ 订单已提交到云端')
        toast.success(`订单提交成功！订单号：${orderNo}`)
        
        // 清空购物车并跳转
        clearCart()
        onClose()
        
        // 跳转到前端订单列表
        setTimeout(() => {
          window.location.href = '/orders'
        }, 500)
      } else {
        throw new Error('API返回失败')
      }
    } catch (error: any) {
      console.error('❌ 订单提交失败，尝试保存到本地备份', error)
      
      // 如果云端失败，保存到本地作为备份
      try {
        const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]')
        existingOrders.unshift(localOrder)
        localStorage.setItem('orders', JSON.stringify(existingOrders))
        console.log('✅ 订单已保存到本地备份')
      } catch (localError) {
        console.error('❌ 本地备份也失败', localError)
      }
      
      toast.error('订单提交失败，请检查网络或联系客服')
      setSubmitting(false)
      return
    }
    
    setSubmitting(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">确认订单</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 代客下单模式提示 */}
          {conciergeMode && conciergeOrderInfo && (
            <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-900">代客下单模式</p>
                  <p className="text-sm text-amber-700 mt-1">
                    您正在为客户 <span className="font-bold">{conciergeOrderInfo.customerName}</span> ({conciergeOrderInfo.customerPhone}) 代客下单
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左侧：收货信息 */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold mb-4">收货信息</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      收货人姓名 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="input w-full"
                      placeholder="请输入收货人姓名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      联系电话 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="input w-full"
                      placeholder="请输入手机号码"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    收货地址 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    required
                    className="input w-full"
                    placeholder="请输入完整的收货地址"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    备注（选填）
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="input w-full"
                    placeholder="如有特殊要求，请在此说明"
                  />
                </div>
              </form>
            </div>

            {/* 右侧：订单摘要 */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-semibold mb-4">订单摘要</h3>
              {/* 商品列表 */}
              <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto pr-1">
                {items.map((item) => {
                  const priceInfo = getItemPrice(item)
                  return (
                    <div key={`${item.product._id}-${item.sku._id}-${JSON.stringify(item.selectedMaterials)}`} className="border border-gray-100 rounded-2xl p-3 flex gap-3">
                      <img
                        src={getFileUrl(item.sku.images?.[0] || item.product.images?.[0] || '/placeholder.png')}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-gray-900 truncate">{item.product.name}</h4>
                            {item.sku.spec && <p className="text-xs text-gray-500">规格：{item.sku.spec}</p>}
                            {item.sku.length && item.sku.width && item.sku.height && (
                              <p className="text-xs text-gray-500">尺寸：{item.sku.length}×{item.sku.width}×{item.sku.height}CM</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">单价</p>
                            <p className="text-sm font-bold text-red-600">{formatPrice(priceInfo)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                          {item.selectedMaterials?.fabric && (() => {
                            const fabricName = item.selectedMaterials.fabric
                            const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                            let upgradePrice = materialUpgradePrices[fabricName]
                            if (!upgradePrice) {
                              const fabricBase = fabricName.split(/\s+/)[0]
                              upgradePrice = materialUpgradePrices[fabricBase]
                              if (!upgradePrice) {
                                for (const [key, price] of Object.entries(materialUpgradePrices)) {
                                  if (fabricName.includes(key) || key.includes(fabricName)) {
                                    upgradePrice = price as number
                                    break
                                  }
                                }
                              }
                            }
                            return (
                              <p>面料：
                                <span className="text-gray-900">{fabricName}</span>
                                {upgradePrice > 0 && <span className="text-red-600 font-semibold"> +¥{upgradePrice}</span>}
                              </p>
                            )
                          })()}
                          {item.selectedMaterials?.filling && (() => {
                            const fillingName = item.selectedMaterials.filling
                            const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                            let upgradePrice = materialUpgradePrices[fillingName]
                            if (!upgradePrice) {
                              const fillingBase = fillingName.split(/\s+/)[0]
                              upgradePrice = materialUpgradePrices[fillingBase]
                              if (!upgradePrice) {
                                for (const [key, price] of Object.entries(materialUpgradePrices)) {
                                  if (fillingName.includes(key) || key.includes(fillingName)) {
                                    upgradePrice = price as number
                                    break
                                  }
                                }
                              }
                            }
                            return (
                              <p>填充：
                                <span className="text-gray-900">{fillingName}</span>
                                {upgradePrice > 0 && <span className="text-red-600 font-semibold"> +¥{upgradePrice}</span>}
                              </p>
                            )
                          })()}
                          {item.selectedMaterials?.frame && (() => {
                            const frameName = item.selectedMaterials.frame
                            const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                            let upgradePrice = materialUpgradePrices[frameName]
                            if (!upgradePrice) {
                              const frameBase = frameName.split(/\s+/)[0]
                              upgradePrice = materialUpgradePrices[frameBase]
                              if (!upgradePrice) {
                                for (const [key, price] of Object.entries(materialUpgradePrices)) {
                                  if (frameName.includes(key) || key.includes(frameName)) {
                                    upgradePrice = price as number
                                    break
                                  }
                                }
                              }
                            }
                            return (
                              <p>框架：
                                <span className="text-gray-900">{frameName}</span>
                                {upgradePrice > 0 && <span className="text-red-600 font-semibold"> +¥{upgradePrice}</span>}
                              </p>
                            )
                          })()}
                          {item.selectedMaterials?.leg && (() => {
                            const legName = item.selectedMaterials.leg
                            const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                            let upgradePrice = materialUpgradePrices[legName]
                            if (!upgradePrice) {
                              const legBase = legName.split(/\s+/)[0]
                              upgradePrice = materialUpgradePrices[legBase]
                              if (!upgradePrice) {
                                for (const [key, price] of Object.entries(materialUpgradePrices)) {
                                  if (legName.includes(key) || key.includes(legName)) {
                                    upgradePrice = price as number
                                    break
                                  }
                                }
                              }
                            }
                            return (
                              <p>脚架：
                                <span className="text-gray-900">{legName}</span>
                                {upgradePrice > 0 && <span className="text-red-600 font-semibold"> +¥{upgradePrice}</span>}
                              </p>
                            )
                          })()}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>数量：{item.quantity}</span>
                          <span className="text-sm font-bold text-red-600">{formatPrice(priceInfo * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              
              {/* 价格汇总 */}
              <div className="space-y-2 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-gray-600">
                  <span>商品总计</span>
                  <span className="text-red-600 font-bold">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>运费</span>
                  <span className="text-green-600">免费</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>合计</span>
                    <span className="text-red-600 font-bold">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn-secondary px-6"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '提交订单'}
          </button>
        </div>
      </div>
    </div>
  )
}

