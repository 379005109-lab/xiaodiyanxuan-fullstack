import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import axios from '@/lib/axios'
import { getFileUrl } from '@/services/uploadService'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()
  
  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('请先登录')
      useAuthModalStore.getState().openLogin()
      navigate('/')
    }
  }, [isAuthenticated, navigate])
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  })
  
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  
  // 加载用户地址
  useEffect(() => {
    const loadAddresses = async () => {
      if (!isAuthenticated) return
      
      try {
        const response = await axios.get('/addresses')
        const addressList = response.data || []
        setAddresses(addressList)
        
        // 自动选择默认地址
        const defaultAddr = addressList.find((addr: any) => addr.isDefault)
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr._id)
          setFormData({
            name: defaultAddr.name || '',
            phone: defaultAddr.phone || '',
            address: `${defaultAddr.province || ''}${defaultAddr.city || ''}${defaultAddr.district || ''}${defaultAddr.address || ''}`,
            notes: formData.notes
          })
        }
      } catch (error) {
        console.error('加载地址失败:', error)
      }
    }
    
    loadAddresses()
  }, [isAuthenticated])
  
  // 选择地址
  const handleSelectAddress = (address: any) => {
    setSelectedAddressId(address._id)
    setFormData({
      name: address.name || '',
      phone: address.phone || '',
      address: `${address.province || ''}${address.city || ''}${address.district || ''}${address.address || ''}`,
      notes: formData.notes
    })
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">购物车是空的</h2>
          <p className="text-gray-600 mb-8">请先添加商品到购物车</p>
          <Link to="/products" className="btn-primary inline-block">
            去购物
          </Link>
        </div>
      </div>
    )
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
    const orderData = {
        items: items.map(item => ({
          product: item.product._id,
          productId: item.product._id, // 同时传递productId，确保后端能识别
          productName: item.product.name,
          productImage: item.sku.images?.[0] || item.product.images[0],
          skuId: item.sku._id, // 传递skuId
          sku: {
            _id: item.sku._id, // 同时传递sku._id
            color: item.sku.color || '',
            material: typeof item.sku.material === 'string' 
              ? item.sku.material 
              : JSON.stringify(item.sku.material)
          },
          quantity: item.quantity,
          price: item.price !== undefined ? item.price : (item.sku.discountPrice && item.sku.discountPrice < item.sku.price
            ? item.sku.discountPrice
            : item.sku.price)
        })),
        totalAmount: getTotalPrice(),
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address
        },
        paymentMethod: 'alipay', // 默认支付宝
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
    const localOrder = {
      _id: `local_${Date.now()}_${random}`,
      orderNo,
      user: user?._id || user || 'local_user',
      items: orderData.items.map((item: any) => ({
        product: item.product || item.productId,
        productName: item.productName || '',
        productImage: item.productImage || '',
        sku: item.sku || { color: '', material: '' },
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: orderData.totalAmount,
      status: 'pending',
      shippingAddress: orderData.shippingAddress,
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
          sku: {
            _id: typeof item.sku === 'object' && item.sku?._id ? item.sku._id : '',
            color: typeof item.sku === 'object' ? item.sku?.color || '' : '',
            material: typeof item.sku === 'object' ? item.sku?.material || '' : ''
          },
          quantity: item.quantity || 1,
          price: item.price || 0
        })),
        totalAmount: localOrder.totalAmount || 0,
        status: localOrder.status || 'pending',
        shippingAddress: localOrder.shippingAddress || {},
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
    
    // 尝试提交到API（如果失败也不影响，因为已经保存到本地）
    try {
      const response = await axios.post('/orders', orderData)
      
      // axios拦截器返回的是response.data，所以response已经是数据本身
      if (response && (response as any).success) {
        console.log('✅ API提交成功')
        toast.success('订单提交成功！')
      } else {
        console.log('⚠️ API返回失败，但已保存到本地')
        toast.success(`订单已保存到本地！订单号：${orderNo}`)
      }
    } catch (error: any) {
      console.log('⚠️ API提交失败，但已保存到本地')
      console.error('API错误详情:', {
        message: error.message,
        code: error.code,
        response: error.response,
        request: error.request
      })
      toast.success(`订单已保存到本地！订单号：${orderNo}`)
    }
    
    // 清空购物车并跳转
    clearCart()
    
    // 跳转到订单管理页面
    setTimeout(() => {
      navigate('/admin/orders')
    }, 500)
    
    setSubmitting(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container-custom max-w-6xl xl:max-w-7xl">
        <Link to="/cart" className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回购物车
        </Link>

        <div className="flex flex-col gap-4 mb-10">
          <p className="text-sm text-gray-500">核对收货人与商品清单后即可提交订单，订单摘要已放大展示成本细节。</p>
          <h1 className="text-4xl font-semibold text-gray-900">确认订单</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1.3fr] gap-10">
          <section className="space-y-8">
            <div className="bg-white rounded-[28px] shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">收货信息</h2>
                <span className="text-xs text-gray-400">请确认信息准确</span>
              </div>
              
              {/* 地址选择器 */}
              {addresses.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    选择收货地址
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr._id}
                        onClick={() => handleSelectAddress(addr)}
                        className={`relative cursor-pointer border-2 rounded-lg p-4 transition-all ${
                          selectedAddressId === addr._id
                            ? 'border-primary-600 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {addr.isDefault && (
                          <span className="absolute top-2 right-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                            默认
                          </span>
                        )}
                        <div className="flex items-start gap-2">
                          <MapPin className="w-4 h-4 mt-1 text-gray-400" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{addr.name} {addr.phone}</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {addr.province}{addr.city}{addr.district}{addr.address}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-sm text-gray-500">
                    或手动填写新地址
                  </div>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      rows={2}
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
                </div>
              </form>
            </div>

            <div className="bg-white rounded-[28px] shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">商品清单</h2>
                <span className="text-sm text-gray-400">共 {items.length} 件</span>
              </div>
              <div className="space-y-4 divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={`${item.product._id}-${item.sku._id}`} className="flex gap-4 pt-4 first:pt-0">
                    <img
                      src={getFileUrl(item.sku.images?.[0] || item.product.images?.[0] || '/placeholder.png')}
                      alt={item.product.name}
                      className="w-24 h-24 object-cover rounded-2xl"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            {item.sku.color && <p>颜色：{item.sku.color}</p>}
                            {item.sku.spec && <p>规格：{item.sku.spec}</p>}
                          </div>
                        </div>
                        <p className="text-base font-bold text-primary-600 whitespace-nowrap">
                          {formatPrice((item.price !== undefined ? item.price : (item.sku.discountPrice && item.sku.discountPrice < item.sku.price ? item.sku.discountPrice : item.sku.price)) * item.quantity)}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                        <span>数量：{item.quantity}</span>
                        <span>单价：{formatPrice(item.price !== undefined ? item.price : (item.sku.discountPrice && item.sku.discountPrice < item.sku.price ? item.sku.discountPrice : item.sku.price))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside>
            <div className="sticky top-20">
              <div className="bg-white rounded-[32px] shadow-2xl p-7 space-y-6 border border-white">
                <div>
                  <p className="text-xs text-gray-400">实时汇总</p>
                  <div className="flex items-baseline justify-between mt-2">
                    <h2 className="text-2xl font-semibold text-gray-900">订单摘要</h2>
                    <p className="text-sm text-gray-500">{items.length} 件商品</p>
                  </div>
                </div>

                <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50">
                  <p className="text-xs text-gray-500 mb-3">商品概览</p>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={`summary-${item.product._id}-${item.sku._id}`} className="flex items-start gap-3">
                        <img
                          src={getFileUrl(item.sku.images?.[0] || item.product.images?.[0] || '/placeholder.png')}
                          alt={item.product.name}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                          <p className="text-xs text-gray-500">× {item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-primary-600">
                          {formatPrice((item.price || item.sku.price) * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 生产周期提醒 */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-900 mb-1">生产周期提醒</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        所有产品均为定制生产，<span className="font-bold">生产周期为6-8周</span>。我们将在发货前与您确认，感谢您的耐心等待！
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>商品总计</span>
                    <span className="font-semibold">{formatPrice(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>运费</span>
                    <span className="text-green-600 font-semibold">免费</span>
                  </div>
                  <div className="flex justify-between">
                    <span>预计配送</span>
                    <span>7-10 个工作日</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-2xl font-bold text-primary-600">
                    <span>合计</span>
                    <span>{formatPrice(getTotalPrice())}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">价格包含所有材质升级与当前优惠</p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '提交中...' : '提交订单'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/cart')}
                  className="w-full h-11 rounded-2xl border border-gray-200 text-sm font-medium text-gray-600 hover:border-gray-400"
                >
                  返回购物车继续修改
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

