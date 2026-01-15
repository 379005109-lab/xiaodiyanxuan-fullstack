import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, X, CreditCard, Smartphone, Building2, Copy, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { formatPrice } from '@/lib/utils'
import { toast } from 'sonner'
import axios from '@/lib/axios'
import { getFileUrl } from '@/services/uploadService'

// 商家支付信息类型
interface MerchantPaymentInfo {
  manufacturerId: string
  manufacturerName: string
  wechatQrCode?: string
  alipayQrCode?: string
  bankInfo?: {
    bankName: string
    accountName: string
    accountNumber: string
  }
  paymentAccounts?: Array<{
    type: 'bank' | 'wechat' | 'alipay'
    bankName: string
    accountName: string
    accountNumber: string
  }>
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, getTotalPrice, clearCart } = useCartStore()
  const { user, token, isAuthenticated } = useAuthStore()
  const [isHydrated, setIsHydrated] = useState(false)
  
  // 等待购物车状态从 localStorage 加载完成
  useEffect(() => {
    // 给 Zustand persist 一点时间来 hydrate
    const timer = setTimeout(() => {
      setIsHydrated(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])
  
  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('请先登录')
      useAuthModalStore.getState().openLogin()
    }
  }, [isAuthenticated])
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: ''
  })
  
  const [addresses, setAddresses] = useState<any[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  
  // 商家支付弹窗状态
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [merchantPaymentInfo, setMerchantPaymentInfo] = useState<MerchantPaymentInfo | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'wechat' | 'alipay' | 'bank'>('wechat')
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [orderNo, setOrderNo] = useState<string>('')
  
  // 判断是否为厂家或设计师用户
  const isManufacturerOrDesigner = (user as any)?.role === 'manufacturer' || (user as any)?.role === 'designer' || (user as any)?.manufacturerId
  
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

  // 等待 hydration 完成后再检查购物车
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
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
    
    // 详细的token调试信息
    const localStorageToken = localStorage.getItem('token')
    console.log('🔐 提交订单 - 用户:', user)
    console.log('🔑 提交订单 - Store Token:', token ? '存在' : '不存在')
    console.log('🔑 提交订单 - LocalStorage Token:', localStorageToken ? '存在' : '不存在')
    console.log('🔑 提交订单 - Token前10位:', localStorageToken ? localStorageToken.substring(0, 10) + '...' : '无')
    console.log('🔑 提交订单 - isAuthenticated:', isAuthenticated)
    console.log('🔑 提交订单 - User ID:', user?._id)
    
    // 验证用户登录（使用组件级别的状态）
    if (!user || !token || !localStorageToken) {
      console.error('⚠️ 登录状态异常:', { 
        user: !!user, 
        storeToken: !!token, 
        localStorageToken: !!localStorageToken,
        isAuthenticated 
      })
      toast.error('请先登录后再提交订单')
      useAuthModalStore.getState().openLogin()
      return
    }
    
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
          productId: item.product._id,
          productName: item.product.name,
          image: item.sku.images?.[0] || item.product.images[0],
          skuId: item.sku._id,
          sku: {
            _id: item.sku._id,
            color: item.sku.color || '',
            material: typeof item.sku.material === 'string' 
              ? item.sku.material 
              : JSON.stringify(item.sku.material)
          },
          specifications: {
            size: item.sku.spec || '',
            // 添加尺寸信息
            dimensions: (item.sku.length || item.sku.width || item.sku.height) 
              ? `${item.sku.length || '-'}×${item.sku.width || '-'}×${item.sku.height || '-'}` 
              : '',
            // 材质信息（兼容中英文）
            material: item.selectedMaterials?.['面料'] || item.selectedMaterials?.fabric || '',
            fill: item.selectedMaterials?.['填充'] || item.selectedMaterials?.filling || '',
            frame: item.selectedMaterials?.['框架'] || item.selectedMaterials?.frame || '',
            leg: item.selectedMaterials?.['脚架'] || item.selectedMaterials?.leg || ''
          },
          // 保存 SKU 尺寸原始数据
          skuDimensions: {
            length: item.sku.length,
            width: item.sku.width,
            height: item.sku.height
          },
          selectedMaterials: item.selectedMaterials,  // 保存材质选择
          materialUpgradePrices: item.materialUpgradePrices || {},  // 保存升级价格
          quantity: item.quantity,
          price: item.price !== undefined ? item.price : (item.sku.discountPrice && item.sku.discountPrice < item.sku.price
            ? item.sku.discountPrice
            : item.sku.price)
        })),
        totalAmount: getTotalPrice(),
        recipient: {
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
    const currentUser = useAuthStore.getState().user
    
    // 创建本地订单（无论API是否成功都保存）
    const localOrder = {
      _id: `local_${Date.now()}_${random}`,
      orderNo,
      user: currentUser?._id || currentUser || 'local_user',
      items: orderData.items.map((item: any) => ({
        product: item.product || item.productId,
        productName: item.productName || '',
        image: item.image || '',
        sku: item.sku || { color: '', material: '' },
        specifications: item.specifications || {},  // 保存规格信息
        selectedMaterials: item.selectedMaterials,  // 保存材质选择
        materialUpgradePrices: item.materialUpgradePrices || {},  // 保存升级价格
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: orderData.totalAmount,
      status: 'pending',
      recipient: orderData.recipient,
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
          image: item.image || '',
          sku: {
            _id: typeof item.sku === 'object' && item.sku?._id ? item.sku._id : '',
            color: typeof item.sku === 'object' ? item.sku?.color || '' : '',
            material: typeof item.sku === 'object' ? item.sku?.material || '' : ''
          },
          specifications: item.specifications || {},  // 保存规格信息
          selectedMaterials: item.selectedMaterials || {},  // 保存材质选择
          materialUpgradePrices: item.materialUpgradePrices || {},  // 保存材质升级价格
          quantity: item.quantity || 1,
          price: item.price || 0
        })),
        totalAmount: localOrder.totalAmount || 0,
        status: localOrder.status || 'pending',
        recipient: localOrder.recipient || {},
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
    
    // 尝试提交到API
    try {
      console.log('🚀 提交订单到API...')
      const response = await axios.post('/orders', orderData)
      
      console.log('✅ API提交成功:', response)
      // axios拦截器返回的是response.data，所以response已经是数据本身
      if (response && (response as any).success) {
        toast.success('订单提交成功！')
      } else {
        toast.success('订单提交成功！订单号：' + orderNo)
      }
    } catch (error: any) {
      console.error('❌ API提交失败:', error)
      console.error('API错误详情:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.config?.headers,
      })
      
      // 如果API失败，显示错误信息
      if (error.response?.status === 401) {
        console.error('⚠️ 401错误 - Token验证失败')
        console.error('⚠️ 请求头:', error.config?.headers)
        console.error('⚠️ LocalStorage Token:', localStorage.getItem('token'))
        
        // 清除登录状态并提示重新登录
        localStorage.removeItem('token')
        useAuthStore.getState().logout()
        toast.error('登录已过期，请重新登录')
        useAuthModalStore.getState().openLogin()
        setSubmitting(false)
        return
      } else if (error.response?.data?.message) {
        toast.error('订单提交失败：' + error.response.data.message)
      } else {
        toast.error('订单提交失败，但已保存到本地')
      }
    }
    
    // 如果是厂家或设计师用户，显示商家支付弹窗
    if (isManufacturerOrDesigner && items.length > 0) {
      try {
        // 获取商品所属厂家的支付信息
        const firstProduct = items[0].product as any
        const manufacturerId = firstProduct.manufacturerId || firstProduct.manufacturer?._id || firstProduct.manufacturer
        
        let manufacturerName = '商家'
        let bankInfo = null
        let wechatQrCode = ''
        let alipayQrCode = ''
        let paymentAccounts: any[] = []
        
        if (manufacturerId) {
          try {
            const paymentRes = await axios.get(`/manufacturers/${manufacturerId}`)
            const manufacturerData = paymentRes.data?.data || paymentRes.data
            manufacturerName = manufacturerData?.fullName || manufacturerData?.shortName || manufacturerData?.name || '商家'
            wechatQrCode = manufacturerData?.settings?.wechatQrCode || ''
            alipayQrCode = manufacturerData?.settings?.alipayQrCode || ''
            bankInfo = manufacturerData?.settings?.bankInfo
            paymentAccounts = manufacturerData?.settings?.paymentAccounts || []
          } catch (e) {
            console.log('获取厂家信息失败，使用模拟数据')
          }
        }
        
        // 如果没有真实支付信息，使用模拟数据
        if (!bankInfo?.bankName && !paymentAccounts?.some((p: any) => p?.type === 'bank')) {
          bankInfo = {
            bankName: '中国工商银行佛山顺德支行',
            accountName: manufacturerName,
            accountNumber: '6222 0200 1234 5678 901'
          }
        }
        
        setMerchantPaymentInfo({
          manufacturerId: manufacturerId || '',
          manufacturerName,
          wechatQrCode,
          alipayQrCode,
          bankInfo,
          paymentAccounts
        })
        setOrderNo(orderNo)
        // 默认选择银行转账（因为有模拟数据）
        setSelectedPaymentMethod('bank')
        setShowPaymentModal(true)
        setSubmitting(false)
        return // 不跳转，等待用户确认支付
      } catch (err) {
        console.log('获取商家支付信息失败，使用默认流程', err)
      }
    }
    
    // 清空购物车并跳转
    clearCart()
    
    // 跳转到我的订单页面
    setTimeout(() => {
      navigate('/orders')
    }, 500)
    
    setSubmitting(false)
  }
  
  // 复制到剪贴板
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    toast.success('已复制到剪贴板')
    setTimeout(() => setCopiedField(null), 2000)
  }
  
  // 已完成支付
  const handlePaymentConfirm = async () => {
    // 更新订单支付状态为已支付
    try {
      await axios.put(`/orders/${orderNo}/payment-status`, { paymentStatus: 'paid' })
    } catch (e) {
      console.log('更新支付状态失败', e)
    }
    clearCart()
    setShowPaymentModal(false)
    toast.success('支付确认成功，商家将尽快处理您的订单')
    navigate('/orders')
  }
  
  // 未完成支付（稍后支付）
  const handlePaymentLater = () => {
    clearCart()
    setShowPaymentModal(false)
    toast.info('订单已保存，请尽快完成支付')
    navigate('/orders')
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
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{item.product.name}</h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            {(item.sku.color || item.sku.spec) && <p>规格：{item.sku.color || item.sku.spec}</p>}
                            {/* 尺寸信息 */}
                            {(item.sku.length || item.sku.width || item.sku.height) && (
                              <p>尺寸：{item.sku.length || '-'}×{item.sku.width || '-'}×{item.sku.height || '-'} CM</p>
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
                          <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                            {(item.sku.color || item.sku.spec) && <p>规格: {item.sku.color || item.sku.spec}</p>}
                            {/* 尺寸信息 */}
                            {(item.sku.length || item.sku.width || item.sku.height) && (
                              <p>尺寸: {item.sku.length || '-'}×{item.sku.width || '-'}×{item.sku.height || '-'} CM</p>
                            )}
                            {/* 材质信息 - 动态遍历 */}
                            {item.selectedMaterials && Object.keys(item.selectedMaterials).length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(item.selectedMaterials).map(([category, material]) => {
                                  if (!material) return null
                                  const upgradePrice = item.materialUpgradePrices?.[category] || 0
                                  return (
                                    <span key={category} className="text-stone-600">
                                      {material as string}
                                      {upgradePrice > 0 && <span className="text-red-600 ml-0.5">+¥{upgradePrice}</span>}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                            <p>× {item.quantity}</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-primary-600 flex-shrink-0">
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
      
      {/* 商家支付弹窗 */}
      {showPaymentModal && merchantPaymentInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">支付订单</h2>
                <p className="text-sm text-gray-500 mt-1">订单号：{orderNo}</p>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  clearCart()
                  navigate('/orders')
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 商家信息 */}
              <div className="bg-emerald-50 rounded-2xl p-4">
                <p className="text-sm text-emerald-700">
                  请向 <span className="font-bold">{merchantPaymentInfo.manufacturerName}</span> 支付
                </p>
                <p className="text-2xl font-bold text-emerald-800 mt-1">
                  {formatPrice(getTotalPrice())}
                </p>
              </div>
              
              {/* 支付方式选择 - 始终显示三个选项 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedPaymentMethod('wechat')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === 'wechat'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="font-medium">微信</span>
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod('alipay')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === 'alipay'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="font-medium">支付宝</span>
                </button>
                <button
                  onClick={() => setSelectedPaymentMethod('bank')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    selectedPaymentMethod === 'bank'
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="font-medium">银行转账</span>
                </button>
              </div>
              
              {/* 支付信息展示 */}
              <div className="bg-gray-50 rounded-2xl p-6">
                {selectedPaymentMethod === 'wechat' && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">请使用微信扫描下方二维码支付</p>
                    {merchantPaymentInfo.wechatQrCode ? (
                      <img
                        src={getFileUrl(merchantPaymentInfo.wechatQrCode)}
                        alt="微信收款码"
                        className="w-48 h-48 mx-auto rounded-xl border border-gray-200"
                      />
                    ) : (
                      <div className="w-48 h-48 mx-auto rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                        <div className="text-center text-gray-400">
                          <Smartphone className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">商家暂未配置微信收款码</p>
                          <p className="text-xs mt-1">请选择其他支付方式</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedPaymentMethod === 'alipay' && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-4">请使用支付宝扫描下方二维码支付</p>
                    {merchantPaymentInfo.alipayQrCode ? (
                      <img
                        src={getFileUrl(merchantPaymentInfo.alipayQrCode)}
                        alt="支付宝收款码"
                        className="w-48 h-48 mx-auto rounded-xl border border-gray-200"
                      />
                    ) : (
                      <div className="w-48 h-48 mx-auto rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-white">
                        <div className="text-center text-gray-400">
                          <CreditCard className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">商家暂未配置支付宝收款码</p>
                          <p className="text-xs mt-1">请选择其他支付方式</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {selectedPaymentMethod === 'bank' && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 mb-4">请转账至以下银行账户</p>
                    {(() => {
                      const bankAccount = merchantPaymentInfo.paymentAccounts?.find(p => p.type === 'bank') || {
                        bankName: merchantPaymentInfo.bankInfo?.bankName || '',
                        accountName: merchantPaymentInfo.bankInfo?.accountName || '',
                        accountNumber: merchantPaymentInfo.bankInfo?.accountNumber || ''
                      }
                      return (
                        <>
                          <div className="flex items-center justify-between py-3 border-b border-gray-200">
                            <span className="text-gray-500">开户银行</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{bankAccount.bankName}</span>
                              <button
                                onClick={() => copyToClipboard(bankAccount.bankName, 'bank')}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                {copiedField === 'bank' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-3 border-b border-gray-200">
                            <span className="text-gray-500">户名</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{bankAccount.accountName}</span>
                              <button
                                onClick={() => copyToClipboard(bankAccount.accountName, 'name')}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                {copiedField === 'name' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between py-3">
                            <span className="text-gray-500">银行账号</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 font-mono">{bankAccount.accountNumber}</span>
                              <button
                                onClick={() => copyToClipboard(bankAccount.accountNumber, 'account')}
                                className="p-1 hover:bg-gray-200 rounded"
                              >
                                {copiedField === 'account' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                              </button>
                            </div>
                          </div>
                        </>
                      )
                    })()}
                    <div className="mt-4 p-3 bg-amber-50 rounded-xl">
                      <p className="text-xs text-amber-700">
                        转账时请备注订单号：<span className="font-mono font-bold">{orderNo}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* 提示信息 */}
              <div className="text-center text-sm text-gray-500">
                <p>支付完成后，商家将收到订单通知</p>
                <p className="mt-1">如有问题请联系商家客服</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-3xl space-y-3">
              <button
                onClick={handlePaymentConfirm}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                已完成支付
              </button>
              <button
                onClick={handlePaymentLater}
                className="w-full py-3 bg-gray-100 text-gray-600 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
              >
                未完成支付（稍后支付）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

