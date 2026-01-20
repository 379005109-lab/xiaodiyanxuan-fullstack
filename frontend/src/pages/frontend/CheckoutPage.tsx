import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, X, CreditCard, Smartphone, Building2, Copy, CheckCircle, FileText, Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
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
    companyName?: string  // 公户单位全称
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

// 开票信息类型
interface InvoiceInfo {
  _id?: string
  invoiceType: 'personal' | 'company'
  title: string
  taxNumber?: string
  bankName?: string
  bankAccount?: string
  companyAddress?: string
  companyPhone?: string
  email?: string
  phone?: string
  mailingAddress?: string
  isDefault?: boolean
}

// 厂家业务设置类型
interface ManufacturerSettings {
  invoiceEnabled?: boolean
  invoiceMarkupPercent?: number
  paymentRatioEnabled?: boolean
  paymentRatios?: number[]
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
  
  // 开票相关状态
  const [needInvoice, setNeedInvoice] = useState(false)
  const [invoiceInfoList, setInvoiceInfoList] = useState<InvoiceInfo[]>([])
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>('')
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null)
  const [invoiceForm, setInvoiceForm] = useState<InvoiceInfo>({
    invoiceType: 'company',
    title: '',
    taxNumber: '',
    bankName: '',
    bankAccount: '',
    companyAddress: '',
    companyPhone: '',
    email: '',
    phone: '',
    mailingAddress: '',
    isDefault: false
  })
  const [savingInvoice, setSavingInvoice] = useState(false)
  
  // 付款比例相关状态
  const [selectedPaymentRatio, setSelectedPaymentRatio] = useState<number>(100)
  
  // 厂家业务设置
  const [manufacturerSettings, setManufacturerSettings] = useState<ManufacturerSettings>({
    invoiceEnabled: false,
    invoiceMarkupPercent: 0,
    paymentRatioEnabled: false,
    paymentRatios: [100]
  })
  
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
  
  // 加载用户开票信息
  useEffect(() => {
    const loadInvoiceInfo = async () => {
      if (!isAuthenticated) return
      try {
        const response = await axios.get('/invoice-info')
        const list = response.data?.data || []
        setInvoiceInfoList(list)
        // 自动选择默认开票信息
        const defaultInvoice = list.find((inv: InvoiceInfo) => inv.isDefault)
        if (defaultInvoice) {
          setSelectedInvoiceId(defaultInvoice._id || '')
        }
      } catch (error) {
        console.error('加载开票信息失败:', error)
      }
    }
    loadInvoiceInfo()
  }, [isAuthenticated])
  
  // 加载厂家业务设置（开票加价、付款比例）
  useEffect(() => {
    const loadManufacturerSettings = async () => {
      if (items.length === 0) return
      try {
        // 获取第一个商品的厂家ID
        const firstProduct = items[0].product as any
        let manufacturerId = firstProduct.manufacturerId || firstProduct.manufacturer?._id || firstProduct.manufacturer
        if (!manufacturerId && firstProduct._id) {
          const productRes = await axios.get(`/products/${firstProduct._id}`)
          const productData = productRes.data?.data || productRes.data
          manufacturerId = productData?.manufacturerId || productData?.manufacturer?._id
        }
        if (manufacturerId) {
          const res = await axios.get(`/manufacturers/${manufacturerId}`)
          const mfr = res.data?.data || res.data
          setManufacturerSettings({
            invoiceEnabled: mfr.invoiceEnabled || false,
            invoiceMarkupPercent: mfr.invoiceMarkupPercent || 0,
            paymentRatioEnabled: mfr.paymentRatioEnabled || false,
            paymentRatios: mfr.paymentRatios || [100]
          })
          // 默认选择最高付款比例
          if (mfr.paymentRatioEnabled && mfr.paymentRatios?.length > 0) {
            setSelectedPaymentRatio(Math.max(...mfr.paymentRatios))
          }
        }
      } catch (error) {
        console.error('加载厂家设置失败:', error)
      }
    }
    loadManufacturerSettings()
  }, [items])
  
  // 计算开票加价金额
  const getInvoiceMarkupAmount = () => {
    if (!needInvoice || !manufacturerSettings.invoiceEnabled) return 0
    return Math.round(getTotalPrice() * (manufacturerSettings.invoiceMarkupPercent || 0) / 100)
  }
  
  // 计算最终总价（含开票加价）
  const getFinalTotalPrice = () => {
    return getTotalPrice() + getInvoiceMarkupAmount()
  }
  
  // 计算首付金额
  const getDepositAmount = () => {
    return Math.round(getFinalTotalPrice() * selectedPaymentRatio / 100)
  }
  
  // 保存开票信息
  const handleSaveInvoiceInfo = async () => {
    if (!invoiceForm.title) {
      toast.error('请填写发票抬头')
      return
    }
    if (invoiceForm.invoiceType === 'company' && !invoiceForm.taxNumber) {
      toast.error('企业发票必须填写税号')
      return
    }
    setSavingInvoice(true)
    try {
      if (editingInvoiceId) {
        await axios.put(`/invoice-info/${editingInvoiceId}`, invoiceForm)
        toast.success('开票信息更新成功')
      } else {
        const res = await axios.post('/invoice-info', invoiceForm)
        const newInvoice = res.data?.data
        if (newInvoice?._id) {
          setSelectedInvoiceId(newInvoice._id)
        }
        toast.success('开票信息添加成功')
      }
      // 重新加载列表
      const response = await axios.get('/invoice-info')
      setInvoiceInfoList(response.data?.data || [])
      setShowInvoiceForm(false)
      setEditingInvoiceId(null)
      setInvoiceForm({
        invoiceType: 'company', title: '', taxNumber: '', bankName: '', bankAccount: '',
        companyAddress: '', companyPhone: '', email: '', phone: '', mailingAddress: '', isDefault: false
      })
    } catch (error: any) {
      toast.error(error.response?.data?.message || '保存失败')
    } finally {
      setSavingInvoice(false)
    }
  }
  
  // 编辑开票信息
  const handleEditInvoice = (inv: InvoiceInfo) => {
    setInvoiceForm(inv)
    setEditingInvoiceId(inv._id || null)
    setShowInvoiceForm(true)
  }
  
  // 删除开票信息
  const handleDeleteInvoice = async (id: string) => {
    if (!confirm('确定删除这条开票信息吗？')) return
    try {
      await axios.delete(`/invoice-info/${id}`)
      toast.success('已删除')
      const response = await axios.get('/invoice-info')
      setInvoiceInfoList(response.data?.data || [])
      if (selectedInvoiceId === id) setSelectedInvoiceId('')
    } catch (error) {
      toast.error('删除失败')
    }
  }
  
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

    // 验证开票信息
    if (needInvoice && invoiceInfoList.length > 0 && !selectedInvoiceId) {
      toast.error('请选择开票信息')
      setSubmitting(false)
      return
    }
    
    // 获取选中的开票信息
    const selectedInvoice = needInvoice ? invoiceInfoList.find(inv => inv._id === selectedInvoiceId) : null
    
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
        totalAmount: getFinalTotalPrice(),  // 使用包含开票加价的最终价格
        subtotal: getTotalPrice(),  // 商品小计
        recipient: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address
        },
        paymentMethod: 'alipay', // 默认支付宝
        notes: formData.notes,
        // 开票信息
        needInvoice,
        invoiceInfo: selectedInvoice ? {
          invoiceType: selectedInvoice.invoiceType,
          title: selectedInvoice.title,
          taxNumber: selectedInvoice.taxNumber,
          bankName: selectedInvoice.bankName,
          bankAccount: selectedInvoice.bankAccount,
          companyAddress: selectedInvoice.companyAddress,
          companyPhone: selectedInvoice.companyPhone,
          email: selectedInvoice.email,
          phone: selectedInvoice.phone,
          mailingAddress: selectedInvoice.mailingAddress
        } : undefined,
        invoiceMarkupPercent: needInvoice ? manufacturerSettings.invoiceMarkupPercent : 0,
        invoiceMarkupAmount: getInvoiceMarkupAmount(),
        // 付款比例
        paymentRatioEnabled: manufacturerSettings.paymentRatioEnabled && selectedPaymentRatio < 100,
        paymentRatio: selectedPaymentRatio,
        depositAmount: getDepositAmount(),
        finalPaymentAmount: getFinalTotalPrice() - getDepositAmount()
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
        console.error('⚠️ 后端返回:', error.response?.data)
        
        // 不要自动清除登录状态，只显示错误信息
        toast.error('订单提交失败：认证错误，请刷新页面后重试')
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
        console.log('🔍 商品数据:', firstProduct)
        
        // 尝试多种方式获取厂家ID
        let manufacturerId = firstProduct.manufacturerId || firstProduct.manufacturer?._id || firstProduct.manufacturer
        
        // 如果商品没有厂家ID，尝试从商品详情API重新获取
        if (!manufacturerId && firstProduct._id) {
          try {
            console.log('🔍 尝试从API获取商品厂家信息...')
            const productRes = await axios.get(`/products/${firstProduct._id}`)
            const productData = productRes.data?.data || productRes.data
            manufacturerId = productData?.manufacturerId || productData?.manufacturer?._id || productData?.manufacturer
            console.log('🔍 从API获取到厂家ID:', manufacturerId)
          } catch (e) {
            console.log('获取商品详情失败:', e)
          }
        }
        
        // 如果仍然没有厂家ID，尝试使用当前用户的厂家ID（适用于厂家下单自己的商品）
        if (!manufacturerId && user?.manufacturerId) {
          manufacturerId = user.manufacturerId
          console.log('🔍 使用当前用户的厂家ID:', manufacturerId)
        }
        
        let manufacturerName = '商家'
        let bankInfo = null
        let wechatQrCode = ''
        let alipayQrCode = ''
        let paymentAccounts: any[] = []
        
        console.log('🔍 最终厂家ID:', manufacturerId)
        
        if (manufacturerId) {
          try {
            const paymentRes = await axios.get(`/manufacturers/${manufacturerId}`)
            const manufacturerData = paymentRes.data?.data || paymentRes.data
            console.log('🔍 厂家数据:', manufacturerData)
            console.log('🔍 厂家settings:', manufacturerData?.settings)
            manufacturerName = manufacturerData?.fullName || manufacturerData?.shortName || manufacturerData?.name || '商家'
            wechatQrCode = manufacturerData?.settings?.wechatQrCode || ''
            alipayQrCode = manufacturerData?.settings?.alipayQrCode || ''
            bankInfo = manufacturerData?.settings?.bankInfo || null
            paymentAccounts = manufacturerData?.settings?.paymentAccounts || []
            console.log('🔍 结算信息:', { wechatQrCode, alipayQrCode, bankInfo, paymentAccounts })
          } catch (e) {
            console.log('获取厂家信息失败:', e)
          }
        } else {
          console.log('⚠️ 未找到商品的厂家ID，也无法获取当前用户的厂家ID')
        }
        
        // 不再使用模拟数据，显示实际配置的结算信息
        
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

            {/* 开票信息卡片 - 始终显示 */}
            <div className="bg-white rounded-[28px] shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <h2 className="text-xl font-semibold text-gray-900">开票信息</h2>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={needInvoice}
                    onChange={(e) => setNeedInvoice(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                    <span className="ml-2 text-sm text-gray-600">{needInvoice ? '需要开票' : '不开票'}</span>
                  </label>
                </div>
                
                {needInvoice && (
                  <div className="space-y-4">
                    {manufacturerSettings.invoiceMarkupPercent > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <p className="text-sm text-amber-800">
                          <span className="font-medium">开票加价提示：</span>
                          需开票的订单将加收 <span className="font-bold text-amber-600">{manufacturerSettings.invoiceMarkupPercent}%</span> 的开票费用
                        </p>
                      </div>
                    )}
                    
                    {/* 已保存的开票信息列表 */}
                    {invoiceInfoList.length > 0 && !showInvoiceForm && (
                      <div className="space-y-3">
                        <label className="block text-sm font-medium text-gray-700">选择开票信息</label>
                        <div className="grid grid-cols-1 gap-3">
                          {invoiceInfoList.map((inv) => (
                            <div
                              key={inv._id}
                              onClick={() => setSelectedInvoiceId(inv._id || '')}
                              className={`relative cursor-pointer border-2 rounded-xl p-4 transition-all ${
                                selectedInvoiceId === inv._id
                                  ? 'border-amber-500 bg-amber-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {inv.isDefault && (
                                <span className="absolute top-2 right-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded">
                                  默认
                                </span>
                              )}
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                      {inv.invoiceType === 'company' ? '企业' : '个人'}
                                    </span>
                                    <span className="font-medium text-gray-900">{inv.title}</span>
                                  </div>
                                  {inv.taxNumber && (
                                    <p className="text-sm text-gray-500">税号：{inv.taxNumber}</p>
                                  )}
                                  {inv.email && (
                                    <p className="text-sm text-gray-500">邮箱：{inv.email}</p>
                                  )}
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleEditInvoice(inv); }}
                                    className="p-1.5 hover:bg-gray-100 rounded-lg"
                                  >
                                    <Edit2 className="w-4 h-4 text-gray-500" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(inv._id!); }}
                                    className="p-1.5 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowInvoiceForm(true)
                            setEditingInvoiceId(null)
                            setInvoiceForm({
                              invoiceType: 'company', title: '', taxNumber: '', bankName: '', bankAccount: '',
                              companyAddress: '', companyPhone: '', email: '', phone: '', mailingAddress: '', isDefault: false
                            })
                          }}
                          className="flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700"
                        >
                          <Plus className="w-4 h-4" /> 添加新开票信息
                        </button>
                      </div>
                    )}
                    
                    {/* 开票信息表单 */}
                    {(showInvoiceForm || invoiceInfoList.length === 0) && (
                      <div className="space-y-4 border border-gray-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">
                            {editingInvoiceId ? '编辑开票信息' : '新增开票信息'}
                          </h3>
                          {invoiceInfoList.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowInvoiceForm(false)}
                              className="text-sm text-gray-500 hover:text-gray-700"
                            >
                              取消
                            </button>
                          )}
                        </div>
                        
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="invoiceType"
                              checked={invoiceForm.invoiceType === 'company'}
                              onChange={() => setInvoiceForm({...invoiceForm, invoiceType: 'company'})}
                              className="text-amber-600"
                            />
                            <span className="text-sm">企业发票</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name="invoiceType"
                              checked={invoiceForm.invoiceType === 'personal'}
                              onChange={() => setInvoiceForm({...invoiceForm, invoiceType: 'personal'})}
                              className="text-amber-600"
                            />
                            <span className="text-sm">个人发票</span>
                          </label>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              发票抬头 <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={invoiceForm.title}
                              onChange={(e) => setInvoiceForm({...invoiceForm, title: e.target.value})}
                              className="input w-full"
                              placeholder={invoiceForm.invoiceType === 'company' ? '企业全称' : '个人姓名'}
                            />
                          </div>
                          {invoiceForm.invoiceType === 'company' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                税号 <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                value={invoiceForm.taxNumber || ''}
                                onChange={(e) => setInvoiceForm({...invoiceForm, taxNumber: e.target.value})}
                                className="input w-full"
                                placeholder="纳税人识别号"
                              />
                            </div>
                          )}
                        </div>
                        
                        {invoiceForm.invoiceType === 'company' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">开户银行</label>
                              <input
                                type="text"
                                value={invoiceForm.bankName || ''}
                                onChange={(e) => setInvoiceForm({...invoiceForm, bankName: e.target.value})}
                                className="input w-full"
                                placeholder="开户银行名称"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">银行账号</label>
                              <input
                                type="text"
                                value={invoiceForm.bankAccount || ''}
                                onChange={(e) => setInvoiceForm({...invoiceForm, bankAccount: e.target.value})}
                                className="input w-full"
                                placeholder="银行账号"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">企业地址</label>
                              <input
                                type="text"
                                value={invoiceForm.companyAddress || ''}
                                onChange={(e) => setInvoiceForm({...invoiceForm, companyAddress: e.target.value})}
                                className="input w-full"
                                placeholder="企业注册地址"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">企业电话</label>
                              <input
                                type="text"
                                value={invoiceForm.companyPhone || ''}
                                onChange={(e) => setInvoiceForm({...invoiceForm, companyPhone: e.target.value})}
                                className="input w-full"
                                placeholder="企业电话"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">收票邮箱</label>
                            <input
                              type="email"
                              value={invoiceForm.email || ''}
                              onChange={(e) => setInvoiceForm({...invoiceForm, email: e.target.value})}
                              className="input w-full"
                              placeholder="接收电子发票的邮箱"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">收票手机</label>
                            <input
                              type="tel"
                              value={invoiceForm.phone || ''}
                              onChange={(e) => setInvoiceForm({...invoiceForm, phone: e.target.value})}
                              className="input w-full"
                              placeholder="接收发票通知的手机"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="invoiceDefault"
                            checked={invoiceForm.isDefault || false}
                            onChange={(e) => setInvoiceForm({...invoiceForm, isDefault: e.target.checked})}
                            className="rounded text-amber-600"
                          />
                          <label htmlFor="invoiceDefault" className="text-sm text-gray-600">设为默认开票信息</label>
                        </div>
                        
                        <button
                          type="button"
                          onClick={handleSaveInvoiceInfo}
                          disabled={savingInvoice}
                          className="w-full py-2.5 bg-amber-500 text-white font-medium rounded-xl hover:bg-amber-600 disabled:opacity-50"
                        >
                          {savingInvoice ? '保存中...' : '保存开票信息'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

            {/* 付款比例卡片 */}
            {manufacturerSettings.paymentRatioEnabled && manufacturerSettings.paymentRatios && manufacturerSettings.paymentRatios.length > 1 && (
              <div className="bg-white rounded-[28px] shadow-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-semibold text-gray-900">付款比例</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">选择您希望的首付比例，剩余金额可在后续支付</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {manufacturerSettings.paymentRatios.sort((a, b) => b - a).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setSelectedPaymentRatio(ratio)}
                      className={`py-3 px-4 rounded-xl text-center transition-all ${
                        selectedPaymentRatio === ratio
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-lg font-bold">{ratio}%</div>
                      <div className="text-xs opacity-80">
                        {ratio === 100 ? '全款' : `首付 ${formatPrice(Math.round(getFinalTotalPrice() * ratio / 100))}`}
                      </div>
                    </button>
                  ))}
                </div>
                {selectedPaymentRatio < 100 && (
                  <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-700">首付金额</span>
                      <span className="font-bold text-emerald-700">{formatPrice(getDepositAmount())}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-emerald-700">尾款金额</span>
                      <span className="font-bold text-emerald-700">{formatPrice(getFinalTotalPrice() - getDepositAmount())}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                  {needInvoice && getInvoiceMarkupAmount() > 0 && (
                    <div className="flex justify-between text-amber-600">
                      <span>开票加价 ({manufacturerSettings.invoiceMarkupPercent}%)</span>
                      <span className="font-semibold">+{formatPrice(getInvoiceMarkupAmount())}</span>
                    </div>
                  )}
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
                    <span>{formatPrice(getFinalTotalPrice())}</span>
                  </div>
                  {selectedPaymentRatio < 100 && (
                    <div className="mt-2 p-2 bg-emerald-50 rounded-lg">
                      <div className="flex justify-between text-sm text-emerald-700">
                        <span>首付 ({selectedPaymentRatio}%)</span>
                        <span className="font-bold">{formatPrice(getDepositAmount())}</span>
                      </div>
                      <div className="flex justify-between text-xs text-emerald-600 mt-1">
                        <span>尾款</span>
                        <span>{formatPrice(getFinalTotalPrice() - getDepositAmount())}</span>
                      </div>
                    </div>
                  )}
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
      
      {/* 订单确认弹窗 - 提交后显示订单信息，等待厂家确认 */}
      {showPaymentModal && merchantPaymentInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-3xl">
              <div>
                <h2 className="text-xl font-bold text-gray-900">订单已提交</h2>
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
              {/* 订单信息 */}
              <div className="bg-emerald-50 rounded-xl p-4 mb-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-emerald-800 font-medium text-lg">订单提交成功！</p>
                <p className="text-emerald-600 text-sm mt-2">等待厂家确认后即可付款</p>
              </div>
              
              {/* 订单金额 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-600">商家</span>
                  <span className="font-medium text-gray-900">{merchantPaymentInfo.manufacturerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">订单金额</span>
                  <span className="text-2xl font-bold text-red-600">{formatPrice(getTotalPrice())}</span>
                </div>
              </div>
              
              {/* 流程说明 */}
              <div className="bg-amber-50 rounded-xl p-4">
                <h4 className="font-medium text-amber-800 mb-2">接下来的流程</h4>
                <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                  <li>厂家收到订单后会进行确认</li>
                  <li>厂家确认后，订单状态变为"待付款"</li>
                  <li>您可以在"我的订单"中进行付款</li>
                </ol>
              </div>
              
              {/* 提示信息 */}
              <div className="text-center text-sm text-gray-500">
                <p>订单提交后，商家将收到订单通知</p>
                <p className="mt-1">如有问题请联系商家客服</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white rounded-b-3xl">
              <button
                onClick={() => {
                  clearCart()
                  setShowPaymentModal(false)
                  navigate('/orders')
                }}
                className="w-full py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                查看我的订单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

