// Build cache bust: 20260110-v1
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Edit, Trash2, Factory, Phone, Mail, MapPin, Loader2, Key, Layers, Shield, BarChart3, Power, Settings, MessageSquare, ChevronDown, ChevronRight, ChevronLeft, X, Upload } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import ImageUploader from '@/components/admin/ImageUploader'
import ManufacturerEditDrawer from '@/components/admin/ManufacturerEditDrawer'
import { getFileUrl } from '@/services/uploadService'
import { useAuthStore } from '@/store/authStore'

// 中文转拼音首字母（简化版）
const pinyinMap: Record<string, string> = {
  '各': 'G', '色': 'S', '佛': 'F', '山': 'S', '家': 'J', '具': 'J', '有': 'Y', '限': 'X', '公': 'G', '司': 'S',
  '广': 'G', '州': 'Z', '深': 'S', '圳': 'Z', '东': 'D', '莞': 'G', '惠': 'H', '中': 'Z', '珠': 'Z', '海': 'H',
  '顺': 'S', '德': 'D', '南': 'N', '北': 'B', '西': 'X', '美': 'M', '乐': 'L', '华': 'H', '龙': 'L', '江': 'J',
  '新': 'X', '明': 'M', '达': 'D', '成': 'C', '发': 'F', '展': 'Z', '盛': 'S', '旺': 'W', '富': 'F', '贵': 'G',
  '金': 'J', '银': 'Y', '铜': 'T', '铁': 'T', '木': 'M', '水': 'S', '火': 'H', '土': 'T', '天': 'T', '地': 'D',
  '大': 'D', '小': 'X', '上': 'S', '下': 'X', '左': 'Z', '右': 'Y', '前': 'Q', '后': 'H', '里': 'L', '外': 'W',
  '红': 'H', '黄': 'H', '蓝': 'L', '绿': 'L', '白': 'B', '黑': 'H', '灰': 'H', '紫': 'Z', '橙': 'C', '粉': 'F',
  '沙': 'S', '床': 'C', '柜': 'G', '桌': 'Z', '椅': 'Y', '门': 'M', '窗': 'C', '板': 'B', '架': 'J', '台': 'T',
  '皮': 'P', '布': 'B', '实': 'S', '原': 'Y', '创': 'C', '意': 'Y', '品': 'P', '质': 'Z', '优': 'Y', '良': 'L',
  '一': 'Y', '二': 'E', '三': 'S', '四': 'S', '五': 'W', '六': 'L', '七': 'Q', '八': 'B', '九': 'J', '十': 'S',
  '百': 'B', '千': 'Q', '万': 'W', '亿': 'Y', '元': 'Y', '年': 'N', '月': 'Y', '日': 'R', '时': 'S', '分': 'F',
  '业': 'Y', '工': 'G', '厂': 'C', '店': 'D', '铺': 'P', '行': 'H', '号': 'H', '室': 'S', '层': 'C', '栋': 'D',
  '迪': 'D', '严': 'Y', '选': 'X', '科': 'K', '技': 'J', '网': 'W', '络': 'L', '电': 'D', '子': 'Z', '商': 'S',
  '贸': 'M', '易': 'Y', '进': 'J', '出': 'C', '口': 'K', '国': 'G', '际': 'J', '集': 'J', '团': 'T', '股': 'G',
  '份': 'F', '合': 'H', '伙': 'H', '人': 'R', '独': 'D', '资': 'Z', '个': 'G', '体': 'T', '户': 'H', '企': 'Q'
}

function getChinesePinyinInitials(str: string): string {
  let result = ''
  for (const char of str) {
    if (pinyinMap[char]) {
      result += pinyinMap[char]
    } else if (/[a-zA-Z]/.test(char)) {
      result += char.toUpperCase()
    }
    // 忽略其他字符
  }
  return result.toUpperCase()
}

// 生成4个随机大写字母
function generateRandomLetters(length: number = 4): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += letters.charAt(Math.floor(Math.random() * letters.length))
  }
  return result
}

interface AccountQuota {
  totalAccounts: number
  authAccounts: number
  subAccounts: number
  designerAccounts: number
}

interface Manufacturer {
  _id: string
  name: string
  fullName?: string
  shortName?: string
  code?: string
  username?: string
  logo?: string
  galleryImages?: string[]
  isPreferred?: boolean
  expiryDate?: string
  defaultDiscount?: number
  defaultCommission?: number
  productIntro?: string
  styleTags?: string[]
  categoryTags?: string[]
  tags?: string[]
  priceRangeMin?: number
  priceRangeMax?: number
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  companyPhone?: string
  servicePhone?: string
  address?: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  accountQuota?: AccountQuota
  accountUsage?: AccountQuota
  // 业务设置新增字段
  paymentRatioEnabled?: boolean
  paymentRatios?: number[] // 如 [50, 75, 100]
  invoiceEnabled?: boolean
  invoiceMarkupPercent?: number // 开票加价比例，如10表示10%
  settings?: {
    phone?: string
    servicePhone?: string
    wechatQrCode?: string
    alipayQrCode?: string
    bankInfo?: {
      bankName?: string
      accountName?: string
      accountNumber?: string
    }
    settlementAccounts?: Array<{
      type: 'bank' | 'wechat' | 'alipay'
      bankName?: string
      accountName?: string
      accountNumber?: string
    }>
  }
  certification?: {
    status: 'none' | 'pending' | 'approved' | 'rejected'
    companyName?: string
    creditCode?: string
    businessLicense?: string
    legalPerson?: string
    invoiceName?: string
    taxNumber?: string
    invoiceBankName?: string
    invoiceBankAccount?: string
    invoiceAddress?: string
    invoicePhone?: string
  }
}

interface ManufacturerAccount {
  _id: string
  username: string
  nickname?: string
  accountType: 'auth' | 'sub' | 'designer' | 'normal'
  status: 'active' | 'inactive' | 'expired'
  permissions: {
    canAccessAdmin?: boolean
    canViewCostPrice?: boolean
    canDownloadMaterial?: boolean
    canManageUsers?: boolean
    canManageProducts?: boolean
    canManageOrders?: boolean
  }
  specialAccountConfig?: {
    expiresAt?: string
  }
  createdAt: string
}

export default function ManufacturerManagement() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const role = (user as any)?.role
  const isAdmin = role === 'admin' || role === 'super_admin' || role === 'platform_admin' || role === 'platform_staff'
  const myManufacturerId = (user as any)?.manufacturerId ? String((user as any).manufacturerId) : ''
  const isManufacturerUser = user?.role === 'enterprise_admin' || user?.role === 'enterprise_staff' || (user as any)?.permissions?.canAccessAdmin === true

  const isFactoryPortal = !!myManufacturerId && !isAdmin

  const canManageManufacturer = (manufacturerId: string) => {
    if (isAdmin) return true
    const mid = String(manufacturerId)
    if (myManufacturerId && mid === myManufacturerId) return true
    const mids = Array.isArray((user as any)?.manufacturerIds) ? (user as any).manufacturerIds.map(String) : []
    if (mids.includes(mid)) return true
    return false
  }

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [portalKeyword, setPortalKeyword] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [editingItem, setEditingItem] = useState<Manufacturer | null>(null)
  const [formData, setFormData] = useState({
    logo: '',
    fullName: '',
    shortName: '',
    isPreferred: false,
    expiryDate: '',
    defaultDiscount: 0,
    defaultCommission: 0,
    styleTagsText: '',
    productIntro: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    // 扩展字段
    settings: {
      phone: '',
      servicePhone: '',
      wechatQrCode: '',
      alipayQrCode: '',
      bankInfo: {
        bankName: '',
        accountName: '',
        accountNumber: ''
      }
    }
  })
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<Manufacturer | null>(null)
  const [passwordForm, setPasswordForm] = useState({ username: '', password: '' })
  // 账号配额编辑
  const [showQuotaModal, setShowQuotaModal] = useState(false)
  const [quotaTarget, setQuotaTarget] = useState<Manufacturer | null>(null)
  const [quotaForm, setQuotaForm] = useState({
    totalAccounts: 0,
    authAccounts: 0,
    subAccounts: 0,
    designerAccounts: 0
  })
  
  // 账号管理
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [accountsTarget, setAccountsTarget] = useState<Manufacturer | null>(null)
  const [accounts, setAccounts] = useState<ManufacturerAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<ManufacturerAccount | null>(null)
  const [accountForm, setAccountForm] = useState({
    username: '',
    password: '',
    nickname: '',
    accountType: 'sub' as 'auth' | 'sub' | 'designer',
    expiresAt: '',
    permissions: {
      canAccessAdmin: false,
      canViewCostPrice: false,
      canDownloadMaterial: false,
      canManageUsers: false,
      canManageProducts: false,
      canManageOrders: false
    }
  })

  // 授权状态跟踪
  const [authorizationMap, setAuthorizationMap] = useState<Record<string, { 
    status: string; 
    productCount: number;
    authorizationId?: string;
    minDiscountRate?: number;
    commissionRate?: number;
    isEnabled?: boolean;
  }>>({})

  // 厂家管理TAB
  type FactoryTabType = 'home' | 'partners' | 'channels'
  const [factoryTab, setFactoryTab] = useState<FactoryTabType>('home')
  const [receivedAuths, setReceivedAuths] = useState<any[]>([])
  const [grantedAuths, setGrantedAuths] = useState<any[]>([])
  const [showMarketplace, setShowMarketplace] = useState(false) // 是否显示合作市场
  const [marketplaceFilter, setMarketplaceFilter] = useState('') // 合作市场筛选标签
  const [showEditSectionModal, setShowEditSectionModal] = useState(false) // 资料编辑弹窗
  const [editSection, setEditSection] = useState<'basic' | 'settlement' | 'qualification' | 'tags' | 'priceRange' | 'discount' | 'commission' | 'paymentRatio' | 'invoice'>('basic')
  const [editSectionData, setEditSectionData] = useState<any>({})
  const [editSectionSaving, setEditSectionSaving] = useState(false)
  
  const [showGalleryModal, setShowGalleryModal] = useState(false)
  const [galleryTarget, setGalleryTarget] = useState<Manufacturer | null>(null)
  
  const [showSmsModal, setShowSmsModal] = useState(false)
  const [smsTarget, setSmsTarget] = useState<Manufacturer | null>(null)
  const [smsLoading, setSmsLoading] = useState(false)
  const [smsSending, setSmsSending] = useState(false)
  const [smsBinding, setSmsBinding] = useState(false)
  const [smsCountdown, setSmsCountdown] = useState(0)
  const [smsStatus, setSmsStatus] = useState<{ phone: string; verifiedAt: string | null }>({ phone: '', verifiedAt: null })
  const [smsPhoneInput, setSmsPhoneInput] = useState('')
  const [smsCodeInput, setSmsCodeInput] = useState('')

  useEffect(() => {
    if (smsCountdown <= 0) return
    const t = setInterval(() => {
      setSmsCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [smsCountdown])

  const fetchKeyword = isAdmin ? keyword : ''

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/manufacturers', { params: { keyword: fetchKeyword, pageSize: 100 } })
      setManufacturers(response.data.data || [])
      
      console.log('[ManufacturerManagement] isFactoryPortal:', isFactoryPortal, 'myManufacturerId:', myManufacturerId, 'isAdmin:', isAdmin)
      
      // 如果是厂家门户，获取授权状态
      if (isFactoryPortal && myManufacturerId) {
        try {
          console.log('[ManufacturerManagement] Fetching authorization summary for:', myManufacturerId)
          const authRes = await apiClient.get('/authorizations/summary', { params: { manufacturerId: myManufacturerId } })
          console.log('[ManufacturerManagement] Authorization response:', authRes.data)
          const authData = authRes.data?.data || authRes.data || []
          const authMap: Record<string, { status: string; productCount: number; authorizationId?: string; minDiscountRate?: number; commissionRate?: number; isEnabled?: boolean }> = {}
          
          if (Array.isArray(authData)) {
            authData.forEach((auth: any) => {
              const targetId = auth.fromManufacturer?._id || auth.fromManufacturer
              console.log('[ManufacturerManagement] Processing auth:', { 
                targetId, 
                productCount: auth.productCount, 
                status: auth.status,
                isEnabled: auth.isEnabled,
                authorizationId: auth.authorizationId
              })
              if (targetId) {
                authMap[targetId] = {
                  status: auth.status || 'pending',
                  productCount: auth.productCount || auth.products?.length || 0,
                  authorizationId: auth.authorizationId,
                  minDiscountRate: auth.minDiscountRate || 0,
                  commissionRate: auth.commissionRate || 0,
                  isEnabled: auth.isEnabled !== false // 默认为启用
                } as any
              }
            })
          }
          
          
          console.log('[ManufacturerManagement] Final authMap:', authMap)
          setAuthorizationMap(authMap)
        } catch (e) {
          console.log('[ManufacturerManagement] 获取授权状态失败', e)
        }

        // 获取合作商家（其他商家授权给本厂家）和渠道管理（本厂家授权给其他商家）
        try {
          const [receivedRes, grantedRes] = await Promise.all([
            apiClient.get('/authorizations/received').catch(() => ({ data: { data: [] } })),
            apiClient.get('/authorizations/my-grants').catch(() => ({ data: { data: [] } }))
          ])
          setReceivedAuths(receivedRes.data?.data || [])
          setGrantedAuths((grantedRes.data?.data || []).filter((a: any) => a?.status === 'active'))
        } catch (e) {
          console.log('[ManufacturerManagement] 获取授权列表失败', e)
        }
      }
    } catch (error) {
      console.error('获取厂家列表失败:', error)
      toast.error('获取厂家列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (item: Manufacturer) => {
    try {
      await apiClient.put(`/manufacturers/${item._id}`, {
        status: item.status === 'active' ? 'inactive' : 'active',
      })
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '更新状态失败')
    }
  }

  const handleTogglePreferred = async (item: Manufacturer) => {
    try {
      await apiClient.put(`/manufacturers/${item._id}`, {
        isPreferred: !item.isPreferred,
      })
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '更新失败')
    }
  }

  useEffect(() => {
    fetchData()
  }, [fetchKeyword])

  const myManufacturer = useMemo(() => {
    if (!myManufacturerId) return null
    return manufacturers.find(m => String(m._id) === String(myManufacturerId)) || null
  }, [manufacturers, myManufacturerId])

  const otherManufacturers = useMemo(() => {
    if (!myManufacturerId) return manufacturers
    return manufacturers.filter(m => String(m._id) !== String(myManufacturerId))
  }, [manufacturers, myManufacturerId])

  const filteredOtherManufacturers = useMemo(() => {
    const q = portalKeyword.trim().toLowerCase()
    if (!q) return otherManufacturers
    return otherManufacturers.filter(m => {
      const name = (m.fullName || m.name || '').toLowerCase()
      const code = (m.code || m.shortName || '').toLowerCase()
      const contact = (m.contactName || '').toLowerCase()
      return name.includes(q) || code.includes(q) || contact.includes(q)
    })
  }, [otherManufacturers, portalKeyword])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      logo: '',
      fullName: '',
      shortName: '',
      isPreferred: false,
      expiryDate: '',
      defaultDiscount: 0,
      defaultCommission: 0,
      styleTagsText: '',
      productIntro: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      description: '',
      status: 'active',
      settings: {
        phone: '',
        servicePhone: '',
        wechatQrCode: '',
        alipayQrCode: '',
        bankInfo: { bankName: '', accountName: '', accountNumber: '' }
      }
    })
    setShowModal(true)
  }

  const openEditModal = (item: Manufacturer) => {
    setEditingItem(item)
    // 使用新的完整档案编辑抽屉
    setShowEditDrawer(true)
  }

  const openPasswordModal = (item: Manufacturer) => {
    setPasswordTarget(item)
    setPasswordForm({ username: item.username || item.code || '', password: '' })
    setShowPasswordModal(true)
  }

  const handleSetPassword = async () => {
    if (!passwordTarget) return
    if (!passwordForm.username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!passwordForm.password.trim() || passwordForm.password.length < 6) {
      toast.error('密码至少6位')
      return
    }

    try {
      setSaving(true)
      await apiClient.post(`/manufacturers/${passwordTarget._id}/set-password`, passwordForm)
      toast.success('账号密码设置成功')
      setShowPasswordModal(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '设置失败')
    } finally {
      setSaving(false)
    }
  }

  // 账号管理相关函数
  const openAccountsModal = async (item: Manufacturer) => {
    setAccountsTarget(item)
    setShowAccountsModal(true)
    await fetchAccounts(item._id)
  }

  const fetchAccounts = async (manufacturerId: string) => {
    try {
      setAccountsLoading(true)
      const response = await apiClient.get(`/manufacturers/${manufacturerId}/accounts`)
      setAccounts(response.data.data || [])
    } catch (error) {
      console.error('获取账号列表失败:', error)
      toast.error('获取账号列表失败')
    } finally {
      setAccountsLoading(false)
    }
  }

  const loadSmsStatus = async (manufacturerId: string) => {
    try {
      setSmsLoading(true)
      const res = await apiClient.get(`/manufacturers/${manufacturerId}/sms/status`)
      if (res.data?.success) {
        setSmsStatus({
          phone: res.data.data?.smsNotifyPhone || '',
          verifiedAt: res.data.data?.smsNotifyVerifiedAt || null
        })
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '加载短信绑定状态失败')
    } finally {
      setSmsLoading(false)
    }
  }

  const openSmsModal = async (item: Manufacturer) => {
    setSmsTarget(item)
    setShowSmsModal(true)
    setSmsCodeInput('')
    setSmsPhoneInput('')
    setSmsCountdown(0)
    await loadSmsStatus(item._id)
  }

  const handleBindSmsPhone = async () => {
    if (!smsTarget) return
    if (!smsPhoneInput) {
      toast.error('请输入手机号')
      return
    }
    try {
      setSmsBinding(true)
      const res = await apiClient.post(`/manufacturers/${smsTarget._id}/sms/bind`, { phone: smsPhoneInput })
      if (res.data?.success) {
        toast.success('手机号已绑定，请发送验证码完成验证')
        await loadSmsStatus(smsTarget._id)
      } else {
        toast.error(res.data?.message || '绑定失败')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '绑定失败')
    } finally {
      setSmsBinding(false)
    }
  }

  const handleSendSmsCode = async () => {
    if (!smsTarget) return
    try {
      setSmsSending(true)
      const res = await apiClient.post(`/manufacturers/${smsTarget._id}/sms/send-code`, {})
      if (res.data?.success) {
        toast.success('验证码已发送')
        setSmsCountdown(60)
      } else {
        toast.error(res.data?.message || '发送失败')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '发送失败')
    } finally {
      setSmsSending(false)
    }
  }

  const handleVerifySmsPhone = async () => {
    if (!smsTarget) return
    if (!smsCodeInput) {
      toast.error('请输入验证码')
      return
    }
    try {
      setSmsBinding(true)
      const res = await apiClient.post(`/manufacturers/${smsTarget._id}/sms/verify`, { code: smsCodeInput })
      if (res.data?.success) {
        toast.success('验证成功')
        setSmsCodeInput('')
        await loadSmsStatus(smsTarget._id)
      } else {
        toast.error(res.data?.message || '验证失败')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '验证失败')
    } finally {
      setSmsBinding(false)
    }
  }

  const handleUnbindSmsPhone = async () => {
    if (!smsTarget) return
    try {
      setSmsBinding(true)
      const res = await apiClient.post(`/manufacturers/${smsTarget._id}/sms/unbind`, {})
      if (res.data?.success) {
        toast.success('已解绑')
        await loadSmsStatus(smsTarget._id)
      } else {
        toast.error(res.data?.message || '解绑失败')
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || '解绑失败')
    } finally {
      setSmsBinding(false)
    }
  }

  const openCreateAccountModal = () => {
    setEditingAccount(null)
    setAccountForm({
      username: '',
      password: '',
      nickname: '',
      accountType: 'sub',
      expiresAt: '',
      permissions: {
        canAccessAdmin: false,
        canViewCostPrice: false,
        canDownloadMaterial: false,
        canManageUsers: false,
        canManageProducts: false,
        canManageOrders: false
      }
    })
    setShowCreateAccountModal(true)
  }

  const openEditAccountModal = (account: ManufacturerAccount) => {
    setEditingAccount(account)
    setAccountForm({
      username: account.username,
      password: '',
      nickname: account.nickname || '',
      accountType: account.accountType as 'auth' | 'sub' | 'designer',
      expiresAt: account.specialAccountConfig?.expiresAt?.slice(0, 10) || '',
      permissions: {
        canAccessAdmin: account.permissions?.canAccessAdmin || false,
        canViewCostPrice: account.permissions?.canViewCostPrice || false,
        canDownloadMaterial: account.permissions?.canDownloadMaterial || false,
        canManageUsers: account.permissions?.canManageUsers || false,
        canManageProducts: account.permissions?.canManageProducts || false,
        canManageOrders: account.permissions?.canManageOrders || false
      }
    })
    setShowCreateAccountModal(true)
  }

  const handleSaveAccount = async () => {
    if (!accountsTarget) return
    if (!editingAccount && !accountForm.username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!editingAccount && (!accountForm.password.trim() || accountForm.password.length < 6)) {
      toast.error('密码至少6位')
      return
    }

    try {
      setSaving(true)
      if (editingAccount) {
        await apiClient.put(`/manufacturers/${accountsTarget._id}/accounts/${editingAccount._id}`, {
          nickname: accountForm.nickname,
          accountType: accountForm.accountType,
          expiresAt: accountForm.expiresAt || null,
          permissions: accountForm.permissions
        })
        toast.success('账号更新成功')
      } else {
        await apiClient.post(`/manufacturers/${accountsTarget._id}/accounts`, accountForm)
        toast.success('账号创建成功')
      }
      setShowCreateAccountModal(false)
      await fetchAccounts(accountsTarget._id)
      fetchData() // 刷新厂家列表以更新使用量
    } catch (error: any) {
      toast.error(error.response?.data?.message || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async (accountId: string) => {
    if (!accountsTarget) return
    if (!confirm('确定要删除该账号吗？')) return

    try {
      await apiClient.delete(`/manufacturers/${accountsTarget._id}/accounts/${accountId}`)
      toast.success('账号已删除')
      await fetchAccounts(accountsTarget._id)
      fetchData() // 刷新厂家列表以更新使用量
    } catch (error: any) {
      toast.error(error.response?.data?.message || '删除失败')
    }
  }

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'auth': '授权账号',
      'sub': '子账号',
      'designer': '设计师',
      'normal': '普通账号'
    }
    return labels[type] || type
  }

  const getAccountTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'auth': 'bg-purple-100 text-purple-700',
      'sub': 'bg-blue-100 text-blue-700',
      'designer': 'bg-green-100 text-green-700',
      'normal': 'bg-gray-100 text-gray-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      toast.error('请输入厂家全称')
      return
    }
    if (!formData.shortName.trim()) {
      toast.error('请输入厂家简称')
      return
    }

    try {
      setSaving(true)
      const payload: any = {
        logo: formData.logo || undefined,
        fullName: formData.fullName,
        shortName: formData.shortName,
        isPreferred: formData.isPreferred,
        expiryDate: formData.expiryDate || undefined,
        defaultDiscount: formData.defaultDiscount,
        defaultCommission: formData.defaultCommission,
        productIntro: formData.productIntro,
        styleTags: formData.styleTagsText
          ? formData.styleTagsText.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        contactName: formData.contactName,
        contactPhone: formData.contactPhone,
        contactEmail: formData.contactEmail,
        address: formData.address,
        description: formData.description,
        status: formData.status,
      }
      if (editingItem) {
        await apiClient.put(`/manufacturers/${editingItem._id}`, payload)
        toast.success('更新成功')
      } else {
        await apiClient.post('/manufacturers', payload)
        toast.success('创建成功')
      }
      setShowModal(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个厂家吗？')) return

    try {
      await apiClient.delete(`/manufacturers/${id}`)
      toast.success('删除成功')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '删除失败')
    }
  }

  // 打开配额编辑弹窗
  const openQuotaModal = (item: Manufacturer) => {
    setQuotaTarget(item)
    setQuotaForm({
      totalAccounts: item.accountQuota?.totalAccounts || 0,
      authAccounts: item.accountQuota?.authAccounts || 0,
      subAccounts: item.accountQuota?.subAccounts || 0,
      designerAccounts: item.accountQuota?.designerAccounts || 0
    })
    setShowQuotaModal(true)
  }

  // 保存配额设置
  const handleSaveQuota = async () => {
    if (!quotaTarget) return
    try {
      setSaving(true)
      await apiClient.put(`/manufacturers/${quotaTarget._id}`, {
        accountQuota: quotaForm
      })
      toast.success('账号配额更新成功')
      setShowQuotaModal(false)
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenTierSystem = (item: Manufacturer, tab?: 'hierarchy' | 'pool' | 'reconciliation') => {
    // 跳转到授权管理的层级结构标签页
    navigate('/admin/authorizations?tab=tier_hierarchy')
  }

  const handleOpenProductAuthorization = (item: Manufacturer) => {
    navigate(`/admin/manufacturers/${item._id}/product-authorization`)
  }

  const handleOpenAuthorizationRequests = () => {
    navigate('/admin/manufacturers/authorization-requests')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Factory className="w-7 h-7" />
          厂家管理
        </h1>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建厂家
            </button>
          )}
        </div>
      </div>

      {isFactoryPortal ? (
        <>
          {/* 厂家管理TAB */}
          <div className="flex items-center gap-6 mb-6 border-b border-gray-200">
            <button
              onClick={() => setFactoryTab('home')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                factoryTab === 'home'
                  ? 'border-[#153e35] text-[#153e35]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              首页
            </button>
            <button
              onClick={() => setFactoryTab('partners')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                factoryTab === 'partners'
                  ? 'border-[#153e35] text-[#153e35]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              合作商家 {receivedAuths.length > 0 && `(${receivedAuths.length})`}
            </button>
            <button
              onClick={() => setFactoryTab('channels')}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                factoryTab === 'channels'
                  ? 'border-[#153e35] text-[#153e35]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              渠道管理 {grantedAuths.length > 0 && `(${grantedAuths.length})`}
            </button>
          </div>

          {factoryTab === 'home' && (
          <>
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div>
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">品牌工厂中心</h2>
              <p className="text-sm text-gray-500 mt-2">管理自有资产或申请跨品牌授权</p>
            </div>
            <div className="flex items-center gap-3">
              {/* 设置下拉菜单 */}
              {myManufacturer && (
                <div className="relative group">
                  <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                    <Settings className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">设置</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <button
                      onClick={() => openSmsModal(myManufacturer)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-cyan-600" />
                      短信通知绑定
                    </button>
                    <button
                      onClick={() => openEditModal(myManufacturer)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                      资料编辑
                    </button>
                  </div>
                </div>
              )}
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索品牌库..."
                  value={portalKeyword}
                  onChange={(e) => setPortalKeyword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-full bg-white shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : !myManufacturer ? (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-8">
              当前账号已绑定厂家，但未能加载到厂家信息
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div 
                className="rounded-[2.5rem] border border-gray-100 shadow-[0_30px_60px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all relative overflow-hidden bg-white"
              >
                {/* 卡片上半部分：LOGO图片填充，点击查看相册 */}
                {myManufacturer.logo ? (
                  <div 
                    className="h-40 w-full overflow-hidden relative cursor-pointer"
                    onClick={() => {
                      setGalleryTarget(myManufacturer)
                      setShowGalleryModal(true)
                    }}
                  >
                    <img
                      src={getFileUrl(myManufacturer.logo)}
                      alt={myManufacturer.fullName || myManufacturer.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/30"></div>
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={myManufacturer.status === 'active'}
                            onChange={() => {
                              if (!confirm(myManufacturer.status === 'active' ? '确定要下架停运该品牌吗？' : '确定要恢复启用该品牌吗？')) return
                              handleToggleStatus(myManufacturer)
                            }}
                          />
                          <div className="w-12 h-7 bg-white/50 backdrop-blur-sm peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-5"></div>
                        </label>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm ${myManufacturer.status === 'active' ? 'bg-emerald-500/80 text-white' : 'bg-gray-500/80 text-white'}`}>
                          {myManufacturer.status === 'active' ? '启用中' : '已停用'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-32 w-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                    <div className="text-gray-300 text-4xl font-black">{(myManufacturer.shortName || myManufacturer.name || '?')[0]}</div>
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={myManufacturer.status === 'active'}
                            onChange={() => {
                              if (!confirm(myManufacturer.status === 'active' ? '确定要下架停运该品牌吗？' : '确定要恢复启用该品牌吗？')) return
                              handleToggleStatus(myManufacturer)
                            }}
                          />
                          <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:after:translate-x-5"></div>
                        </label>
                        <span className={`text-xs font-semibold ${myManufacturer.status === 'active' ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {myManufacturer.status === 'active' ? '启用中' : '已停用'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 卡片下半部分：信息 */}
                <div className="p-8 pt-4">
                <div>
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">工厂门户</div>
                  <div className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
                    {myManufacturer.shortName || myManufacturer.fullName || myManufacturer.name}
                  </div>
                  <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">
                    {myManufacturer.code || ''}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-center">
                    <div className="text-xs font-semibold text-emerald-700">经销折扣(%)</div>
                    <div className="text-2xl font-black text-[#153e35] mt-1">{myManufacturer.defaultDiscount || 0}</div>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-center">
                    <div className="text-xs font-semibold text-blue-700">返佣比例(%)</div>
                    <div className="text-2xl font-black text-blue-700 mt-1">{myManufacturer.defaultCommission || 0}</div>
                  </div>
                </div>

                {/* 价格范围 */}
                <div className="mt-4 bg-gray-50 rounded-2xl p-4">
                  <div className="text-xs font-semibold text-gray-500 mb-1">产品价格范围</div>
                  <div className="text-lg font-bold text-gray-900">
                    ¥{myManufacturer.priceRangeMin || 0} - ¥{myManufacturer.priceRangeMax || 0}
                  </div>
                </div>

                {/* 标签 */}
                <div className="mt-4">
                  {(myManufacturer.styleTags && myManufacturer.styleTags.length > 0) && (
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-gray-500 mb-1">风格</div>
                      <div className="flex flex-wrap gap-1">
                        {myManufacturer.styleTags.slice(0, 4).map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#153e35]/10 text-[#153e35] text-xs rounded-full">{tag}</span>
                        ))}
                        {myManufacturer.styleTags.length > 4 && (
                          <span className="text-xs text-gray-400">+{myManufacturer.styleTags.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(myManufacturer.categoryTags && myManufacturer.categoryTags.length > 0) && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-1">品类</div>
                      <div className="flex flex-wrap gap-1">
                        {myManufacturer.categoryTags.slice(0, 4).map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{tag}</span>
                        ))}
                        {myManufacturer.categoryTags.length > 4 && (
                          <span className="text-xs text-gray-400">+{myManufacturer.categoryTags.length - 4}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {(!myManufacturer.styleTags || myManufacturer.styleTags.length === 0) && (!myManufacturer.categoryTags || myManufacturer.categoryTags.length === 0) && (
                    <div className="text-xs text-gray-400">暂未设置标签</div>
                  )}
                </div>

                <button
                  onClick={() => navigate(`/admin/manufacturers/${myManufacturer._id}/business-panel`)}
                  className="mt-6 w-full px-6 py-3 rounded-2xl bg-[#123a32] text-white font-bold hover:bg-[#0f2f29] transition-colors"
                >
                  经营授权
                </button>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={() => handleOpenTierSystem(myManufacturer, 'hierarchy')}
                    className="px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    分成体系
                  </button>
                  <button
                    onClick={() => {
                      if (!confirm(myManufacturer.status === 'active' ? '确定要下架停运该品牌吗？' : '确定要恢复启用该品牌吗？')) return
                      handleToggleStatus(myManufacturer)
                    }}
                    className={`px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-semibold transition-colors ${
                      myManufacturer.status === 'active'
                        ? 'text-red-500 hover:bg-red-50'
                        : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {myManufacturer.status === 'active' ? '下架停运' : '恢复启用'}
                  </button>
                </div>
                </div>
              </div>

              {/* 资料编辑模块 */}
              <div className="bg-gradient-to-br from-gray-50 to-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-6">资料编辑</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 基础档案 */}
                  <button
                    onClick={() => {
                      setEditSection('basic')
                      setShowEditSectionModal(true)
                    }}
                    className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Factory className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">基础档案</div>
                      <div className="text-xs text-gray-500">公司名称、LOGO、联系方式</div>
                    </div>
                  </button>

                  {/* 结算账号配置 */}
                  <button
                    onClick={() => {
                      setEditSection('settlement')
                      setShowEditSectionModal(true)
                    }}
                    className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <Layers className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">结算账号配置</div>
                      <div className="text-xs text-gray-500">银行账号、收款码</div>
                    </div>
                  </button>

                  {/* 资质与开票 */}
                  <button
                    onClick={() => {
                      setEditSection('qualification')
                      setShowEditSectionModal(true)
                    }}
                    className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                      <Shield className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-gray-900">资质与开票</div>
                      <div className="text-xs text-gray-500">营业执照、开票信息</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 业务设置模块 */}
              <div className="bg-gradient-to-br from-[#153e35]/5 to-white rounded-[2.5rem] border border-[#153e35]/10 p-8 shadow-sm mt-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6">业务设置</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 标签 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="text-xs font-medium text-gray-500 mb-2">产品标签</div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {(myManufacturer.tags && myManufacturer.tags.length > 0) ? (
                        myManufacturer.tags.slice(0, 3).map((tag: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">未设置</span>
                      )}
                      {myManufacturer.tags && myManufacturer.tags.length > 3 && (
                        <span className="text-gray-400 text-xs">+{myManufacturer.tags.length - 3}</span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setEditSection('tags')
                        setEditSectionData({
                          styleTags: myManufacturer.styleTags || [],
                          categoryTags: myManufacturer.categoryTags || []
                        })
                        setShowEditSectionModal(true)
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      编辑标签
                    </button>
                  </div>

                  {/* 价格范围 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="text-xs font-medium text-gray-500 mb-2">产品价格范围</div>
                    <div className="text-xl font-bold text-gray-900 mb-3">
                      {myManufacturer.priceRangeMin || 0} - {myManufacturer.priceRangeMax || 0}
                    </div>
                    <button
                      onClick={() => {
                        setEditSection('priceRange')
                        setShowEditSectionModal(true)
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      编辑范围
                    </button>
                  </div>

                  {/* 最低折扣 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="text-xs font-medium text-gray-500 mb-2">最低折扣</div>
                    <div className="text-xl font-bold text-[#153e35] mb-3">
                      {myManufacturer.defaultDiscount || 0}%
                    </div>
                    <button
                      onClick={() => {
                        setEditSection('discount')
                        setShowEditSectionModal(true)
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      编辑折扣
                    </button>
                  </div>

                  {/* 返佣 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="text-xs font-medium text-gray-500 mb-2">默认返佣</div>
                    <div className="text-xl font-bold text-blue-600 mb-3">
                      {myManufacturer.defaultCommission || 0}%
                    </div>
                    <button
                      onClick={() => {
                        setEditSection('commission')
                        setShowEditSectionModal(true)
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      编辑返佣
                    </button>
                  </div>

                  {/* 付款比例 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-gray-500">付款比例</div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={myManufacturer.paymentRatioEnabled || false}
                          onChange={async () => {
                            try {
                              await apiClient.put(`/manufacturers/${myManufacturer._id}`, {
                                paymentRatioEnabled: !myManufacturer.paymentRatioEnabled
                              })
                              fetchData()
                            } catch (error) {
                              toast.error('更新失败')
                            }
                          }}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-[#153e35] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                      </label>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      {myManufacturer.paymentRatioEnabled ? (
                        <span className="text-[#153e35] font-medium">已开启</span>
                      ) : (
                        <span className="text-gray-400">未开启</span>
                      )}
                    </div>
                    {myManufacturer.paymentRatioEnabled && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(myManufacturer.paymentRatios || [50, 75, 100]).map((ratio: number) => (
                          <span key={ratio} className="px-2 py-0.5 bg-[#153e35]/10 text-[#153e35] text-xs rounded-full">{ratio}%</span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setEditSection('paymentRatio')
                        setShowEditSectionModal(true)
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      设置比例
                    </button>
                  </div>

                  {/* 开票设置 */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-medium text-gray-500">开票加价</div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={myManufacturer.invoiceEnabled || false}
                          onChange={async () => {
                            try {
                              await apiClient.put(`/manufacturers/${myManufacturer._id}`, {
                                invoiceEnabled: !myManufacturer.invoiceEnabled
                              })
                              fetchData()
                            } catch (error) {
                              toast.error('更新失败')
                            }
                          }}
                        />
                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                      </label>
                    </div>
                    {myManufacturer.invoiceEnabled ? (
                      <div className="text-xl font-bold text-amber-600 mb-2">
                        +{myManufacturer.invoiceMarkupPercent || 10}%
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 mb-2">未开启</div>
                    )}
                    <button
                      onClick={() => {
                        setEditSection('invoice')
                        setShowEditSectionModal(true)
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      设置加价
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </>
          )}

          {/* 合作商家TAB */}
          {factoryTab === 'partners' && !showMarketplace && (
            <div>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">合作商家</h2>
                  <p className="text-sm text-gray-500 mt-1">已建立合作关系的品牌厂家</p>
                </div>
              </div>

              {/* 已合作厂家区域 */}
              {(() => {
                const cooperatingManufacturers = filteredOtherManufacturers.filter(item => {
                  const authInfo = authorizationMap[item._id]
                  return authInfo?.status === 'approved' || authInfo?.status === 'active'
                })
                
                return cooperatingManufacturers.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center mb-8">
                    <Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无已合作的品牌</p>
                    <p className="text-sm text-gray-400 mt-2">点击下方"合作市场"寻找合作伙伴</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                    {cooperatingManufacturers.map((item) => {
                      const authInfo = authorizationMap[item._id]
                      return (
                        <div
                          key={item._id}
                          className="bg-white rounded-[2.5rem] border border-emerald-200 ring-2 ring-emerald-100 p-8 shadow-[0_30px_60px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                              {authInfo?.isEnabled !== false ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                  ✓ 已合作 · {authInfo?.productCount || 0}件商品
                                </span>
                              ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                                  ⏸ 已关闭 · {authInfo?.productCount || 0}件商品
                                </span>
                              )}
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border shadow-inner flex items-center justify-center overflow-hidden">
                              <img
                                src={getFileUrl(item.logo || '')}
                                alt={item.fullName || item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="mt-5">
                            <div className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
                              {item.shortName || item.fullName || item.name}
                            </div>
                            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">
                              {item.code || ''}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 text-center">
                              <div className="text-xs font-semibold text-emerald-700">授权折扣(%)</div>
                              <div className="text-3xl font-black text-[#153e35] mt-2">
                                {authInfo?.minDiscountRate || 0}
                              </div>
                            </div>
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 text-center">
                              <div className="text-xs font-semibold text-blue-700">授权返佣(%)</div>
                              <div className="text-3xl font-black text-blue-700 mt-2">
                                {authInfo?.commissionRate || 0}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenProductAuthorization(item)}
                            className="mt-6 w-full px-6 py-3 rounded-2xl bg-[#123a32] text-white font-bold hover:bg-[#0f2f29] transition-colors"
                          >
                            查看授权商品
                          </button>
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            {authInfo?.isEnabled === false ? (
                              <button
                                onClick={async () => {
                                  const authId = authInfo?.authorizationId
                                  if (!authId) return
                                  try {
                                    setAuthorizationMap(prev => ({ ...prev, [item._id]: { ...prev[item._id], isEnabled: true } }))
                                    const response = await apiClient.put(`/authorizations/${authId}/toggle-enabled`, { enabled: true })
                                    setAuthorizationMap(prev => ({ ...prev, [item._id]: { ...prev[item._id], isEnabled: response.data.isEnabled } }))
                                    toast.success('已开启该厂家商品显示')
                                  } catch (e: any) {
                                    setAuthorizationMap(prev => ({ ...prev, [item._id]: { ...prev[item._id], isEnabled: false } }))
                                    toast.error(e.response?.data?.message || '操作失败')
                                  }
                                }}
                                className="px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors"
                              >
                                恢复启用
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  const authId = authInfo?.authorizationId
                                  if (!authId) return
                                  try {
                                    setAuthorizationMap(prev => ({ ...prev, [item._id]: { ...prev[item._id], isEnabled: false } }))
                                    await apiClient.put(`/authorizations/${authId}/toggle-enabled`, { enabled: false })
                                    toast.success('已关闭该厂家商品显示')
                                  } catch (e: any) {
                                    setAuthorizationMap(prev => ({ ...prev, [item._id]: { ...prev[item._id], isEnabled: true } }))
                                    toast.error(e.response?.data?.message || '操作失败')
                                  }
                                }}
                                className="px-4 py-3 rounded-2xl bg-white border border-gray-100 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                              >
                                下架停运
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* 合作市场入口 */}
              <div 
                onClick={() => setShowMarketplace(true)}
                className="bg-gradient-to-r from-[#153e35] to-[#1a5548] rounded-[2rem] p-8 cursor-pointer hover:shadow-xl transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">合作市场</h3>
                    <p className="text-emerald-200 text-sm">探索更多品牌厂家，寻找合作伙伴</p>
                    <p className="text-emerald-300/70 text-xs mt-2">
                      {filteredOtherManufacturers.filter(item => {
                        const authInfo = authorizationMap[item._id]
                        return authInfo?.status !== 'approved' && authInfo?.status !== 'active'
                      }).length} 个待合作品牌
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <ChevronRight className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 合作市场视图 */}
          {factoryTab === 'partners' && showMarketplace && (
            <div>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowMarketplace(false)
                      setMarketplaceFilter('')
                      setPortalKeyword('')
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">合作市场</h2>
                    <p className="text-sm text-gray-500 mt-1">探索品牌厂家，申请建立合作</p>
                  </div>
                </div>
                <div className="relative max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索品牌..."
                    value={portalKeyword}
                    onChange={(e) => setPortalKeyword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-full bg-white shadow-sm focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              {/* 标签筛选 */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setMarketplaceFilter('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    marketplaceFilter === '' 
                      ? 'bg-[#153e35] text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                {['中古风', '现代简约', '轻奢', '北欧', '新中式', '单椅', '沙发', '床', '餐桌', '柜类'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setMarketplaceFilter(marketplaceFilter === tag ? '' : tag)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      marketplaceFilter === tag 
                        ? 'bg-[#153e35] text-white' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              {/* 待合作厂家列表 */}
              {(() => {
                const pendingManufacturers = filteredOtherManufacturers.filter(item => {
                  const authInfo = authorizationMap[item._id]
                  const isNotCooperating = authInfo?.status !== 'approved' && authInfo?.status !== 'active'
                  // 如果有筛选标签，可以根据厂家的tags或category进行筛选（假设厂家有tags字段）
                  if (marketplaceFilter && item.tags && Array.isArray(item.tags)) {
                    return isNotCooperating && item.tags.includes(marketplaceFilter)
                  }
                  return isNotCooperating
                })

                return pendingManufacturers.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center">
                    <Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">暂无匹配的品牌</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pendingManufacturers.map((item) => {
                      const authInfo = authorizationMap[item._id]
                      const isPending = authInfo?.status === 'pending'
                      return (
                        <div
                          key={item._id}
                          className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-[0_30px_60px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex flex-col gap-1">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                {item.status === 'active' ? '启用中' : '已停用'}
                              </span>
                              {isPending && (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                                  ⏳ 申请中
                                </span>
                              )}
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border shadow-inner flex items-center justify-center overflow-hidden">
                              <img
                                src={getFileUrl(item.logo || '')}
                                alt={item.fullName || item.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                          <div className="mt-5">
                            <div className="mt-2 text-2xl font-black text-gray-900 tracking-tight">
                              {item.shortName || item.fullName || item.name}
                            </div>
                            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">
                              {item.code || ''}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 text-center">
                              <div className="text-xs font-semibold text-emerald-700">经销折扣(%)</div>
                              <div className="text-3xl font-black text-[#153e35] mt-2">
                                {item.defaultDiscount || 0}
                              </div>
                            </div>
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 text-center">
                              <div className="text-xs font-semibold text-blue-700">返佣比例(%)</div>
                              <div className="text-3xl font-black text-blue-700 mt-2">
                                {item.defaultCommission || 0}
                              </div>
                            </div>
                          </div>
                          <button
                            disabled={item.status !== 'active'}
                            onClick={() => handleOpenProductAuthorization(item)}
                            className={`mt-6 w-full px-6 py-3 rounded-2xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              isPending
                                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' 
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {isPending ? '查看申请状态' : '申请经销授权'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}

          {/* 渠道管理TAB：本厂家授权给其他商家的信息 */}
          {factoryTab === 'channels' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">渠道管理</h2>
                  <p className="text-sm text-gray-500 mt-1">本厂家授权给其他商家的信息</p>
                </div>
                <button
                  onClick={() => navigate(`/admin/authorization-requests`)}
                  className="px-4 py-2 bg-[#153e35] text-white text-sm rounded-lg hover:bg-[#1a4d42]"
                >
                  下发准入邀请码
                </button>
              </div>

              {grantedAuths.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                  <Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">暂无渠道授权</p>
                  <p className="text-sm text-gray-400 mt-2">您授权给其他商家时，会显示在这里</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {grantedAuths.map((auth: any) => {
                    const targetName = auth.toDesigner?.nickname || auth.toDesigner?.username || 
                                      auth.toManufacturer?.name || auth.toManufacturer?.fullName || '未知渠道'
                    const targetAvatar = auth.toDesigner?.avatar || auth.toManufacturer?.logo
                    const targetType = auth.authorizationType === 'manufacturer' ? '厂家' : '设计师'
                    const productCount = auth.actualProductCount || (Array.isArray(auth.products) ? auth.products.length : 0)
                    
                    return (
                      <div key={auth._id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                              {targetAvatar ? (
                                <img src={getFileUrl(targetAvatar)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Factory className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{targetName}</span>
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  auth.authorizationType === 'manufacturer' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-purple-100 text-purple-700'
                                }`}>
                                  {targetType}
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                合约期至: {auth.validUntil ? new Date(auth.validUntil).toLocaleDateString() : '永久有效'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-center">
                              <div className="text-xs text-gray-500">最低折扣</div>
                              <div className="text-lg font-bold text-green-600">{auth.minDiscountRate ?? '--'}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">返佣比例</div>
                              <div className="text-lg font-bold text-blue-600">{auth.commissionRate ?? '--'}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs text-gray-500">已授权SKU</div>
                              <div className="text-lg font-bold text-gray-900">{productCount}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => navigate(`/admin/authorizations/${auth._id}/pricing`)}
                                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
                              >
                                专属价格池
                              </button>
                              <button 
                                onClick={() => {
                                  const rt = encodeURIComponent(`/admin/manufacturer-management`)
                                  navigate(`/admin/tier-system?tab=hierarchy&manufacturerId=${myManufacturerId}&returnTo=${rt}`)
                                }}
                                className="px-4 py-2 text-sm bg-[#153e35] text-white rounded-lg hover:bg-[#1a4d42]"
                              >
                                分成体系
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索厂家名称、编码、联系人..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : manufacturers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
              <Factory className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无厂家数据</p>
              <button
                onClick={openCreateModal}
                className="mt-4 text-primary hover:underline"
              >
                点击创建第一个厂家
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {manufacturers.map((item) => (
                <div
                  key={item._id}
                  className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-[0_30px_60px_rgba(0,0,0,0.03)] hover:shadow-[0_40px_80px_rgba(0,0,0,0.06)] transition-all"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-gray-50 border shadow-inner flex items-center justify-center overflow-hidden">
                        <img
                          src={getFileUrl(item.logo || '')}
                          alt={item.fullName || item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                          {item.shortName || item.fullName || item.name}
                        </h3>
                        <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mt-2">
                          {item.code || ''}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      {isAdmin && (
                        <button
                          onClick={() => handleTogglePreferred(item)}
                          className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            item.isPreferred
                              ? 'bg-amber-100 text-amber-600 border border-amber-200'
                              : 'bg-gray-50 text-gray-300 border border-gray-100'
                          }`}
                        >
                          {item.isPreferred ? '优质厂家 ★' : '设为优质'}
                        </button>
                      )}
                      
                      {/* 到期时间显示 */}
                      <div className="text-xs text-gray-500">
                        效期至：<span className={item.expiryDate && new Date(item.expiryDate) < new Date() ? 'text-red-500 font-bold' : 'text-emerald-600 font-medium'}>
                          {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-') : '--'}
                        </span>
                      </div>

                      {canManageManufacturer(item._id) && (
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${item.status === 'active' ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {item.status === 'active' ? '启用' : '停用'}
                          </span>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={item.status === 'active'}
                              onChange={() => handleToggleStatus(item)}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-lg p-3 text-center">
                      <div className="text-xs text-emerald-700">最低折扣</div>
                      <div className="text-lg font-bold text-[#153e35]">{item.defaultDiscount || 0}%</div>
                    </div>
                    <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-center">
                      <div className="text-xs text-blue-700">返佣比例</div>
                      <div className="text-lg font-bold text-blue-700">{item.defaultCommission || 0}%</div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-3">
                    {item.contactName && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">联系人：</span>
                        {item.contactName}
                      </div>
                    )}
                    {item.contactPhone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {item.contactPhone}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        账号配额
                        {item.accountQuota?.totalAccounts ? (
                          <span className="ml-2 text-primary font-bold">
                            (总配额: {item.accountQuota.totalAccounts})
                          </span>
                        ) : null}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => openQuotaModal(item)}
                          className="text-xs text-primary hover:underline"
                        >
                          设置配额
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {item.accountUsage?.authAccounts || 0}/{item.accountQuota?.authAccounts || 0}
                        </div>
                        <div className="text-xs text-gray-500">授权账号</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {item.accountUsage?.subAccounts || 0}/{item.accountQuota?.subAccounts || 0}
                        </div>
                        <div className="text-xs text-gray-500">子账号</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900">
                          {item.accountUsage?.designerAccounts || 0}/{item.accountQuota?.designerAccounts || 0}
                        </div>
                        <div className="text-xs text-gray-500">设计师</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                    {canManageManufacturer(item._id) ? (
                      <>
                        <button
                          onClick={() => openEditModal(item)}
                          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                          资料编辑
                        </button>
                        <button
                          onClick={() => handleOpenTierSystem(item, 'hierarchy')}
                          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-purple-50 hover:text-purple-600 rounded-xl transition-colors"
                        >
                          <Layers className="w-4 h-4" />
                          分层体系
                        </button>
                        <button
                          onClick={() => handleOpenTierSystem(item, 'pool')}
                          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          角色授权
                        </button>
                        <button
                          onClick={() => handleOpenProductAuthorization(item)}
                          className="flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          选品授权
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleOpenProductAuthorization(item)}
                        className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        商品授权
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingItem ? '编辑厂家' : '新建厂家'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  品牌头像/Logo
                </label>
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/30">
                  <ImageUploader
                    images={formData.logo ? [formData.logo] : []}
                    onChange={(imgs) => setFormData({ ...formData, logo: imgs?.[0] || '' })}
                    multiple={false}
                    maxImages={1}
                    label="上传Logo"
                  />
                </div>
                {formData.logo && (
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border bg-white">
                      <img src={getFileUrl(formData.logo)} alt="logo" className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: '' })}
                      className="text-sm text-gray-500 hover:text-red-600"
                    >
                      移除Logo
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  厂家全称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => {
                    const newFullName = e.target.value
                    // 自动从中文提取拼音首字母作为简称
                    const autoShortName = !editingItem ? getChinesePinyinInitials(newFullName) : formData.shortName
                    setFormData({ ...formData, fullName: newFullName, shortName: autoShortName })
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入厂家全称，如：佛山各色家具有限公司"
                  disabled={!!editingItem}
                />
                {editingItem && (
                  <p className="text-xs text-gray-500 mt-1">厂家全称创建后不可修改</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  厂家简称（自动提取）
                </label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 font-mono uppercase"
                  placeholder="根据厂家全称自动提取"
                  disabled={!!editingItem}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingItem ? '简称创建后不可修改' : '根据厂家全称中文自动提取拼音首字母，可手动修改'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">优质厂家</label>
                  <select
                    value={formData.isPreferred ? 'yes' : 'no'}
                    onChange={(e) => setFormData({ ...formData, isPreferred: e.target.value === 'yes' })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="no">否</option>
                    <option value="yes">是</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">效期至</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最低折扣(%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.defaultDiscount}
                    onChange={(e) => setFormData({ ...formData, defaultDiscount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="如：60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">返佣比例(%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.defaultCommission}
                    onChange={(e) => setFormData({ ...formData, defaultCommission: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="如：25"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">风格标签（逗号分隔）</label>
                <input
                  type="text"
                  value={formData.styleTagsText}
                  onChange={(e) => setFormData({ ...formData, styleTagsText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="如：意式极简, 全屋定制"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">产品介绍</label>
                <textarea
                  value={formData.productIntro}
                  onChange={(e) => setFormData({ ...formData, productIntro: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="如：主打意式简约、现代极简系列..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">厂家编号</label>
                <input
                  type="text"
                  value={editingItem?.code || (formData.shortName ? `${formData.shortName}${new Date().toISOString().slice(0,10).replace(/-/g,'')}XXXX` : '输入厂家全称后自动生成')}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">编号格式：简称 + 日期 + 4位随机字母（如：GS20251211ABCD）</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                  <input
                    type="text"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="联系人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="联系电话"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">联系邮箱</label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入联系邮箱"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入厂家地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注说明</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  placeholder="请输入备注说明"
                />
              </div>

              {/* 扩展信息 - 仅编辑时显示 */}
              {editingItem && (
                <>
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">企业信息设置</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">企业LOGO（图片URL）</label>
                        <input
                          type="text"
                          value={formData.logo}
                          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="请输入LOGO图片URL"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">公司电话</label>
                          <input
                            type="text"
                            value={formData.settings.phone}
                            onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, phone: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="公司电话"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">客服电话</label>
                          <input
                            type="text"
                            value={formData.settings.servicePhone}
                            onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, servicePhone: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="客服电话"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">收款信息</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">银行开户行</label>
                        <input
                          type="text"
                          value={formData.settings.bankInfo.bankName}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            settings: { 
                              ...formData.settings, 
                              bankInfo: { ...formData.settings.bankInfo, bankName: e.target.value } 
                            } 
                          })}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          placeholder="如：中国工商银行佛山分行"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">户名</label>
                          <input
                            type="text"
                            value={formData.settings.bankInfo.accountName}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              settings: { 
                                ...formData.settings, 
                                bankInfo: { ...formData.settings.bankInfo, accountName: e.target.value } 
                              } 
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="公司名称"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">银行账号</label>
                          <input
                            type="text"
                            value={formData.settings.bankInfo.accountNumber}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              settings: { 
                                ...formData.settings, 
                                bankInfo: { ...formData.settings.bankInfo, accountNumber: e.target.value } 
                              } 
                            })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="银行账号"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">微信企业收款码（URL）</label>
                          <input
                            type="text"
                            value={formData.settings.wechatQrCode}
                            onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, wechatQrCode: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="微信收款码图片URL"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">支付宝企业收款码（URL）</label>
                          <input
                            type="text"
                            value={formData.settings.alipayQrCode}
                            onChange={(e) => setFormData({ ...formData, settings: { ...formData.settings, alipayQrCode: e.target.value } })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            placeholder="支付宝收款码图片URL"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 企业认证信息 */}
                  <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-gray-900">企业认证</h3>
                      {editingItem?.certification?.status && (
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          editingItem.certification.status === 'approved' 
                            ? 'bg-blue-100 text-blue-700' 
                            : editingItem.certification.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : editingItem.certification.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {editingItem.certification.status === 'approved' ? '已认证' :
                           editingItem.certification.status === 'pending' ? '待审核' :
                           editingItem.certification.status === 'rejected' ? '已拒绝' : '未提交'}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mb-4">
                      上传营业执照和开票信息，经审核后将获得"已认证"标识
                    </p>
                    
                    <div className="space-y-4 bg-blue-50 rounded-lg p-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">营业执照（图片URL）</label>
                        <input
                          type="text"
                          value={(editingItem as any)?.certification?.businessLicenseImage || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                          placeholder="厂家通过API提交"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">统一社会信用代码</label>
                          <input
                            type="text"
                            value={(editingItem as any)?.certification?.creditCode || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                            placeholder="厂家通过API提交"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">企业名称</label>
                          <input
                            type="text"
                            value={(editingItem as any)?.certification?.companyName || ''}
                            readOnly
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                            placeholder="厂家通过API提交"
                          />
                        </div>
                      </div>
                      
                      {editingItem?.certification?.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm('确定通过该企业认证吗？')) return
                              try {
                                await apiClient.put(`/manufacturers/${editingItem._id}/certification/review`, {
                                  status: 'approved'
                                })
                                toast.success('认证已通过')
                                fetchData()
                                setShowModal(false)
                              } catch (error: any) {
                                toast.error(error.response?.data?.message || '操作失败')
                              }
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            通过认证
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const reason = prompt('请输入拒绝原因：')
                              if (!reason) return
                              try {
                                await apiClient.put(`/manufacturers/${editingItem._id}/certification/review`, {
                                  status: 'rejected',
                                  reviewNote: reason
                                })
                                toast.success('已拒绝认证')
                                fetchData()
                                setShowModal(false)
                              } catch (error: any) {
                                toast.error(error.response?.data?.message || '操作失败')
                              }
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                          >
                            拒绝
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="active">启用</option>
                  <option value="inactive">停用</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingItem ? '保存修改' : '创建厂家'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSmsModal && smsTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">短信通知绑定 - {smsTarget.fullName || smsTarget.name}</h2>
              <button
                onClick={() => {
                  setShowSmsModal(false)
                  setSmsTarget(null)
                  setSmsCodeInput('')
                  setSmsPhoneInput('')
                  setSmsCountdown(0)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {smsLoading ? (
                <div className="text-sm text-gray-400">加载中...</div>
              ) : smsStatus.phone ? (
                <div className="text-sm text-gray-600">
                  已绑定：<span className="font-medium">{smsStatus.phone}</span>
                  {smsStatus.verifiedAt ? (
                    <span className="text-gray-400">（{new Date(smsStatus.verifiedAt).toLocaleString('zh-CN')}）</span>
                  ) : (
                    <span className="text-amber-600">（未验证）</span>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-400">未绑定</div>
              )}

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                  <input
                    value={smsPhoneInput}
                    onChange={(e) => setSmsPhoneInput(e.target.value)}
                    placeholder="请输入手机号"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
                  <input
                    value={smsCodeInput}
                    onChange={(e) => setSmsCodeInput(e.target.value)}
                    placeholder="请输入验证码"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleBindSmsPhone}
                  disabled={smsBinding}
                  className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
                >
                  {smsBinding ? '处理中...' : '绑定手机号'}
                </button>

                <button
                  onClick={handleSendSmsCode}
                  disabled={smsSending || smsCountdown > 0 || !smsStatus.phone}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  {smsCountdown > 0 ? `${smsCountdown}s` : smsSending ? '发送中...' : '发送验证码'}
                </button>

                <button
                  onClick={handleVerifySmsPhone}
                  disabled={smsBinding || !smsStatus.phone}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  验证
                </button>

                <button
                  onClick={handleUnbindSmsPhone}
                  disabled={smsBinding || !smsStatus.phone}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  解绑
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 设置密码弹窗 */}
      {showPasswordModal && passwordTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                设置账号密码 - {passwordTarget.fullName || passwordTarget.name}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                <input
                  type="text"
                  value={passwordForm.username}
                  onChange={(e) => setPasswordForm({ ...passwordForm, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入登录用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
                <input
                  type="password"
                  value={passwordForm.password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入密码（至少6位）"
                />
              </div>
              <p className="text-sm text-gray-500">
                设置后，厂家可通过 <span className="text-primary font-medium">/manufacturer/login</span> 登录系统管理订单
              </p>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSetPassword}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 设置账号配额弹窗 */}
      {showQuotaModal && quotaTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                账号配额设置 - {quotaTarget.fullName || quotaTarget.shortName || quotaTarget.name}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  总账号配额（由管理员设置）
                </label>
                <input
                  type="number"
                  min="0"
                  value={quotaForm.totalAccounts}
                  onChange={(e) => setQuotaForm({ ...quotaForm, totalAccounts: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  placeholder="如：500"
                />
                <p className="text-xs text-blue-600 mt-2">
                  厂家可在此总配额范围内，自行分配各类型账号数量
                </p>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-600 mb-3">分配明细（厂家可自行调整）：</p>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      授权账号
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.authAccounts}
                      onChange={(e) => setQuotaForm({ ...quotaForm, authAccounts: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      已用：{quotaTarget.accountUsage?.authAccounts || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      子账号
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.subAccounts}
                      onChange={(e) => setQuotaForm({ ...quotaForm, subAccounts: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      已用：{quotaTarget.accountUsage?.subAccounts || 0}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      设计师账号
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={quotaForm.designerAccounts}
                      onChange={(e) => setQuotaForm({ ...quotaForm, designerAccounts: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      已用：{quotaTarget.accountUsage?.designerAccounts || 0}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 text-sm">
                  <span className="text-gray-500">已分配：</span>
                  <span className={`font-medium ${
                    (quotaForm.authAccounts + quotaForm.subAccounts + quotaForm.designerAccounts) > quotaForm.totalAccounts 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {quotaForm.authAccounts + quotaForm.subAccounts + quotaForm.designerAccounts}
                  </span>
                  <span className="text-gray-500"> / {quotaForm.totalAccounts} 个</span>
                  {(quotaForm.authAccounts + quotaForm.subAccounts + quotaForm.designerAccounts) > quotaForm.totalAccounts && (
                    <span className="text-red-500 text-xs ml-2">（超出总配额）</span>
                  )}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  ⚠️ 厂家登录后可在总配额范围内，根据实际经营需要调整各类账号分配
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowQuotaModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveQuota}
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                保存配额
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 账号管理弹窗 */}
      {showAccountsModal && accountsTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                账号管理 - {accountsTarget.fullName || accountsTarget.name}
              </h2>
              <button
                onClick={() => setShowAccountsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="text-sm text-gray-600">
                配额使用：
                <span className="text-purple-600 font-medium ml-2">授权 {accountsTarget.accountUsage?.authAccounts || 0}/{accountsTarget.accountQuota?.authAccounts || 0}</span>
                <span className="text-blue-600 font-medium ml-3">子账号 {accountsTarget.accountUsage?.subAccounts || 0}/{accountsTarget.accountQuota?.subAccounts || 0}</span>
                <span className="text-green-600 font-medium ml-3">设计师 {accountsTarget.accountUsage?.designerAccounts || 0}/{accountsTarget.accountQuota?.designerAccounts || 0}</span>
              </div>
              <button
                onClick={openCreateAccountModal}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                新建账号
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {accountsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
              ) : accounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无账号，点击"新建账号"创建
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map((account) => (
                    <div key={account._id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{account.nickname || account.username}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getAccountTypeColor(account.accountType)}`}>
                            {getAccountTypeLabel(account.accountType)}
                          </span>
                          {account.status !== 'active' && (
                            <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                              {account.status === 'expired' ? '已过期' : '已禁用'}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center gap-4">
                          <span>用户名: {account.username}</span>
                          {account.specialAccountConfig?.expiresAt && (
                            <span>
                              到期: {new Date(account.specialAccountConfig.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex flex-wrap gap-2">
                          {account.permissions?.canAccessAdmin && <span className="bg-gray-200 px-1.5 py-0.5 rounded">后台</span>}
                          {account.permissions?.canViewCostPrice && <span className="bg-gray-200 px-1.5 py-0.5 rounded">成本价</span>}
                          {account.permissions?.canDownloadMaterial && <span className="bg-gray-200 px-1.5 py-0.5 rounded">下载</span>}
                          {account.permissions?.canManageOrders && <span className="bg-gray-200 px-1.5 py-0.5 rounded">订单</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditAccountModal(account)}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account._id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 创建/编辑账号弹窗 */}
      {showCreateAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAccount ? '编辑账号' : '新建账号'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {!editingAccount && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                    <input
                      type="text"
                      value={accountForm.username}
                      onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="请输入用户名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">密码 *</label>
                    <input
                      type="password"
                      value={accountForm.password}
                      onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      placeholder="请输入密码（至少6位）"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
                <input
                  type="text"
                  value={accountForm.nickname}
                  onChange={(e) => setAccountForm({ ...accountForm, nickname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入昵称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">账号类型</label>
                <select
                  value={accountForm.accountType}
                  onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value as 'auth' | 'sub' | 'designer' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="auth">授权账号</option>
                  <option value="sub">子账号</option>
                  <option value="designer">设计师账号</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">到期时间</label>
                <input
                  type="date"
                  value={accountForm.expiresAt}
                  onChange={(e) => setAccountForm({ ...accountForm, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <p className="text-xs text-gray-500 mt-1">留空表示永久有效</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">权限设置</label>
                <div className="space-y-2">
                  {[
                    { key: 'canAccessAdmin', label: '访问后台' },
                    { key: 'canViewCostPrice', label: '查看成本价' },
                    { key: 'canDownloadMaterial', label: '下载素材' },
                    { key: 'canManageOrders', label: '管理订单' },
                    { key: 'canManageProducts', label: '管理商品' },
                    { key: 'canManageUsers', label: '管理用户' }
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={accountForm.permissions[perm.key as keyof typeof accountForm.permissions]}
                        onChange={(e) => setAccountForm({
                          ...accountForm,
                          permissions: { ...accountForm.permissions, [perm.key]: e.target.checked }
                        })}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateAccountModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveAccount}
                disabled={saving}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 资料编辑弹窗 */}
      {showEditSectionModal && myManufacturer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEditSectionModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editSection === 'basic' && '基础档案'}
                {editSection === 'settlement' && '结算账户配置'}
                {editSection === 'qualification' && '资质与开票'}
                {editSection === 'tags' && '编辑标签'}
                {editSection === 'priceRange' && '产品价格范围'}
                {editSection === 'discount' && '最低折扣设置'}
                {editSection === 'commission' && '默认返佣设置'}
                {editSection === 'paymentRatio' && '付款比例设置'}
                {editSection === 'invoice' && '开票加价设置'}
              </h3>
              <button onClick={() => setShowEditSectionModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* 基础档案 */}
              {editSection === 'basic' && (
                <>
                  <div className="flex items-center gap-2 text-[#153e35] font-semibold">
                    <div className="w-1 h-5 bg-[#153e35] rounded"></div>
                    01. 品牌身份与经营地址
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="row-span-2">
                      <label className="block text-sm text-gray-600 mb-2">LOGO</label>
                      <ImageUploader
                        images={editSectionData.logo ? [editSectionData.logo] : (myManufacturer.logo ? [myManufacturer.logo] : [])}
                        onChange={(urls) => setEditSectionData({...editSectionData, logo: urls[0] || ''})}
                        label="上传LOGO"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">厂家ID</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={myManufacturer.code || myManufacturer._id}
                          disabled
                          className="flex-1 px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('确定要重新生成厂家ID吗？将根据简称生成英文格式ID。')) return
                            try {
                              // 清空code让后端自动重新生成
                              await apiClient.put(`/manufacturers/${myManufacturer._id}`, { code: '' })
                              toast.success('ID已更新，请刷新页面查看')
                              fetchData()
                            } catch (error) {
                              toast.error('重新生成失败')
                            }
                          }}
                          className="px-4 py-2 bg-[#153e35] text-white text-sm rounded-xl hover:bg-[#1a4d42]"
                        >
                          重新生成
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">点击重新生成将根据简称自动生成英文格式ID</p>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">厂家全称</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.fullName || myManufacturer.name}
                        onChange={(e) => setEditSectionData({...editSectionData, fullName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">厂家简称（字母缩写）</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.shortName || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, shortName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-1">经营办公地址</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.address || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, address: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm text-gray-600 mb-2">厂家图片相册</label>
                      <ImageUploader
                        images={editSectionData.galleryImages !== undefined ? editSectionData.galleryImages : (myManufacturer.galleryImages || [])}
                        onChange={(urls) => setEditSectionData({...editSectionData, galleryImages: urls})}
                        maxImages={10}
                        label="上传厂家图片（最多10张）"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#153e35] font-semibold mt-8">
                    <div className="w-1 h-5 bg-[#153e35] rounded"></div>
                    02. 联系人 & 服务信息
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">联系人</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.contactName || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, contactName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">联系人电话</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.contactPhone || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, contactPhone: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">联系人邮箱</label>
                      <input
                        type="email"
                        defaultValue={myManufacturer.contactEmail || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, contactEmail: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">公司电话</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.companyPhone || myManufacturer.settings?.phone || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, companyPhone: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">客服电话</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.servicePhone || myManufacturer.settings?.servicePhone || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, servicePhone: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">状态</label>
                      <select
                        defaultValue={myManufacturer.status}
                        onChange={(e) => setEditSectionData({...editSectionData, status: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      >
                        <option value="active">启用</option>
                        <option value="inactive">停用</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* 结算账户配置 */}
              {editSection === 'settlement' && (
                <>
                  <div className="flex items-center gap-2 text-[#153e35] font-semibold">
                    <div className="w-1 h-5 bg-[#153e35] rounded"></div>
                    01. 收款码
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center">
                      <ImageUploader
                        images={editSectionData.wechatQrCode ? [editSectionData.wechatQrCode] : (myManufacturer.settings?.wechatQrCode ? [myManufacturer.settings.wechatQrCode] : [])}
                        onChange={(urls) => setEditSectionData({...editSectionData, wechatQrCode: urls[0] || ''})}
                        label="微信收款码"
                      />
                    </div>
                    <div className="text-center">
                      <ImageUploader
                        images={editSectionData.alipayQrCode ? [editSectionData.alipayQrCode] : (myManufacturer.settings?.alipayQrCode ? [myManufacturer.settings.alipayQrCode] : [])}
                        onChange={(urls) => setEditSectionData({...editSectionData, alipayQrCode: urls[0] || ''})}
                        label="支付宝收款码"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[#153e35] font-semibold mt-8">
                    <div className="w-1 h-5 bg-[#153e35] rounded"></div>
                    02. 银行/三方结算信息
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex gap-2 mb-4">
                      {['bank', 'wechat', 'alipay'].map(type => (
                        <button
                          key={type}
                          onClick={() => setEditSectionData({...editSectionData, settlementType: type})}
                          className={`px-4 py-2 rounded-full text-sm ${
                            (editSectionData.settlementType || 'bank') === type
                              ? 'bg-[#153e35] text-white'
                              : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                        >
                          {type === 'bank' ? '银行' : type === 'wechat' ? '微信' : '支付宝'}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">开户银行/平台全称</label>
                        <input
                          type="text"
                          defaultValue={myManufacturer.settings?.bankInfo?.bankName || ''}
                          onChange={(e) => setEditSectionData({...editSectionData, bankName: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                          placeholder="招商银行 / 支付宝..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">收款人/实名姓名</label>
                        <input
                          type="text"
                          defaultValue={myManufacturer.settings?.bankInfo?.accountName || ''}
                          onChange={(e) => setEditSectionData({...editSectionData, accountName: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm text-gray-600 mb-1">卡号 / UID / 账号</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.settings?.bankInfo?.accountNumber || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, accountNumber: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                      />
                    </div>
                  </div>
                  <button className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-primary/50 hover:text-primary">
                    + 新增财务结算方式
                  </button>
                </>
              )}

              {/* 资质与开票 */}
              {editSection === 'qualification' && (
                <>
                  <div className="flex items-center gap-2 text-[#153e35] font-semibold">
                    <div className="w-1 h-5 bg-[#153e35] rounded"></div>
                    01. 资质合规：营业执照认证
                  </div>
                  <ImageUploader
                    images={editSectionData.businessLicense ? [editSectionData.businessLicense] : (myManufacturer.certification?.businessLicense ? [myManufacturer.certification.businessLicense] : [])}
                    onChange={async (urls) => {
                      const imageUrl = urls[0] || ''
                      setEditSectionData({...editSectionData, businessLicense: imageUrl})
                      
                      // 自动OCR识别
                      if (imageUrl) {
                        try {
                          toast.info('正在识别营业执照...')
                          const res = await apiClient.post('/manufacturers/ocr/business-license', { 
                            imageUrl: getFileUrl(imageUrl) 
                          })
                          if (res.data.success && res.data.data) {
                            const ocr = res.data.data
                            setEditSectionData((prev: any) => ({
                              ...prev,
                              businessLicense: imageUrl,
                              invoiceCompanyName: ocr.companyName || prev.invoiceCompanyName,
                              creditCode: ocr.creditCode || prev.creditCode,
                              legalPerson: ocr.legalPerson || prev.legalPerson,
                              invoiceAddress: ocr.address || prev.invoiceAddress
                            }))
                            toast.success('识别完成，请核对信息')
                          }
                        } catch (error) {
                          console.log('OCR识别失败，请手动填写')
                        }
                      }
                    }}
                    label="上传营业执照（自动识别）"
                  />
                  <p className="text-xs text-gray-500">上传后自动识别营业执照信息。需确保执照处于有效期内，公章清晰。</p>

                  <div className="flex items-center gap-2 text-[#153e35] font-semibold mt-8">
                    <div className="w-1 h-5 bg-[#153e35] rounded"></div>
                    02. 税务开票资料
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">企业名称</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.certification?.companyName || myManufacturer.fullName || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, invoiceCompanyName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">统一社会信用代码</label>
                        <input
                          type="text"
                          defaultValue={myManufacturer.certification?.creditCode || ''}
                          onChange={(e) => setEditSectionData({...editSectionData, creditCode: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">法人代表</label>
                        <input
                          type="text"
                          defaultValue={myManufacturer.certification?.legalPerson || ''}
                          onChange={(e) => setEditSectionData({...editSectionData, legalPerson: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">开票名称</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.certification?.invoiceName || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, invoiceName: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">税号</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.certification?.taxNumber || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, taxNumber: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">开户银行</label>
                        <input
                          type="text"
                          defaultValue={myManufacturer.certification?.invoiceBankName || ''}
                          onChange={(e) => setEditSectionData({...editSectionData, invoiceBankName: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">银行账号</label>
                        <input
                          type="text"
                          defaultValue={myManufacturer.certification?.invoiceBankAccount || ''}
                          onChange={(e) => setEditSectionData({...editSectionData, invoiceBankAccount: e.target.value})}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">企业地址</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.certification?.invoiceAddress || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, invoiceAddress: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">企业电话</label>
                      <input
                        type="text"
                        defaultValue={myManufacturer.certification?.invoicePhone || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, invoicePhone: e.target.value})}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 标签编辑 - 风格和品类分开 */}
              {editSection === 'tags' && (
                <>
                  <div className="flex items-center gap-2 text-[#153e35] font-semibold">
                    <div className="w-1 h-5 bg-[#153e35] rounded"></div>
                    风格标签
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['中古风', '现代简约', '轻奢', '北欧', '新中式', '美式', '欧式', '日式', '工业风', '田园'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const currentTags = editSectionData.styleTags || myManufacturer.styleTags || []
                          if (currentTags.includes(tag)) {
                            setEditSectionData({...editSectionData, styleTags: currentTags.filter((t: string) => t !== tag)})
                          } else {
                            setEditSectionData({...editSectionData, styleTags: [...currentTags, tag]})
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          (editSectionData.styleTags || myManufacturer.styleTags || []).includes(tag)
                            ? 'bg-[#153e35] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="自定义风格标签"
                      value={editSectionData.customStyleTag || ''}
                      onChange={(e) => setEditSectionData({...editSectionData, customStyleTag: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      onClick={() => {
                        if (editSectionData.customStyleTag?.trim()) {
                          const currentTags = editSectionData.styleTags || myManufacturer.styleTags || []
                          if (!currentTags.includes(editSectionData.customStyleTag.trim())) {
                            setEditSectionData({
                              ...editSectionData, 
                              styleTags: [...currentTags, editSectionData.customStyleTag.trim()],
                              customStyleTag: ''
                            })
                          }
                        }
                      }}
                      className="px-4 py-2 bg-[#153e35] text-white rounded-xl hover:bg-[#1a4d42]"
                    >
                      添加
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-[#153e35] font-semibold mt-6">
                    <div className="w-1 h-5 bg-[#153e35] rounded"></div>
                    品类标签
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {['单椅', '沙发', '床', '餐桌', '餐椅', '柜类', '茶几', '书桌', '灯具', '软装', '地毯', '装饰品'].map(tag => (
                      <button
                        key={tag}
                        onClick={() => {
                          const currentTags = editSectionData.categoryTags || myManufacturer.categoryTags || []
                          if (currentTags.includes(tag)) {
                            setEditSectionData({...editSectionData, categoryTags: currentTags.filter((t: string) => t !== tag)})
                          } else {
                            setEditSectionData({...editSectionData, categoryTags: [...currentTags, tag]})
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                          (editSectionData.categoryTags || myManufacturer.categoryTags || []).includes(tag)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="自定义品类标签"
                      value={editSectionData.customCategoryTag || ''}
                      onChange={(e) => setEditSectionData({...editSectionData, customCategoryTag: e.target.value})}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <button
                      onClick={() => {
                        if (editSectionData.customCategoryTag?.trim()) {
                          const currentTags = editSectionData.categoryTags || myManufacturer.categoryTags || []
                          if (!currentTags.includes(editSectionData.customCategoryTag.trim())) {
                            setEditSectionData({
                              ...editSectionData, 
                              categoryTags: [...currentTags, editSectionData.customCategoryTag.trim()],
                              customCategoryTag: ''
                            })
                          }
                        }
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                    >
                      添加
                    </button>
                  </div>
                </>
              )}

              {/* 价格范围 */}
              {editSection === 'priceRange' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">最低价格 (元)</label>
                    <input
                      type="number"
                      defaultValue={myManufacturer.priceRangeMin || 0}
                      onChange={(e) => setEditSectionData({...editSectionData, priceRangeMin: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">最高价格 (元)</label>
                    <input
                      type="number"
                      defaultValue={myManufacturer.priceRangeMax || 0}
                      onChange={(e) => setEditSectionData({...editSectionData, priceRangeMax: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              )}

              {/* 最低折扣 */}
              {editSection === 'discount' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最低折扣 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={myManufacturer.defaultDiscount || 0}
                    onChange={(e) => setEditSectionData({...editSectionData, defaultDiscount: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">设置后，授权给其他商家时的最低折扣不得低于此值</p>
                </div>
              )}

              {/* 默认返佣 */}
              {editSection === 'commission' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">默认返佣比例 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={myManufacturer.defaultCommission || 0}
                    onChange={(e) => setEditSectionData({...editSectionData, defaultCommission: Number(e.target.value)})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                  <p className="text-xs text-gray-500 mt-1">授权给其他商家时的默认返佣比例</p>
                </div>
              )}

              {/* 付款比例设置 */}
              {editSection === 'paymentRatio' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900">启用付款比例</div>
                      <div className="text-sm text-gray-500">开启后，客户可选择定制状态下的付款比例</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={editSectionData.paymentRatioEnabled ?? myManufacturer.paymentRatioEnabled ?? false}
                        onChange={(e) => setEditSectionData({...editSectionData, paymentRatioEnabled: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-[#153e35] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">可选付款比例</label>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[25, 30, 50, 70, 75, 100].map(ratio => (
                        <button
                          key={ratio}
                          onClick={() => {
                            const currentRatios = editSectionData.paymentRatios || myManufacturer.paymentRatios || [50, 75, 100]
                            if (currentRatios.includes(ratio)) {
                              setEditSectionData({...editSectionData, paymentRatios: currentRatios.filter((r: number) => r !== ratio)})
                            } else {
                              setEditSectionData({...editSectionData, paymentRatios: [...currentRatios, ratio].sort((a, b) => a - b)})
                            }
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                            (editSectionData.paymentRatios || myManufacturer.paymentRatios || [50, 75, 100]).includes(ratio)
                              ? 'bg-[#153e35] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {ratio}%
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="自定义比例"
                        value={editSectionData.customPaymentRatio || ''}
                        onChange={(e) => setEditSectionData({...editSectionData, customPaymentRatio: e.target.value})}
                        className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <button
                        onClick={() => {
                          const val = Number(editSectionData.customPaymentRatio)
                          if (val > 0 && val <= 100) {
                            const currentRatios = editSectionData.paymentRatios || myManufacturer.paymentRatios || [50, 75, 100]
                            if (!currentRatios.includes(val)) {
                              setEditSectionData({
                                ...editSectionData,
                                paymentRatios: [...currentRatios, val].sort((a, b) => a - b),
                                customPaymentRatio: ''
                              })
                            }
                          }
                        }}
                        className="px-4 py-2 bg-[#153e35] text-white rounded-xl hover:bg-[#1a4d42]"
                      >
                        添加
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500">
                    已选比例：{(editSectionData.paymentRatios || myManufacturer.paymentRatios || [50, 75, 100]).map((r: number) => `${r}%`).join('、') || '无'}
                  </p>
                </div>
              )}

              {/* 开票加价设置 */}
              {editSection === 'invoice' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <div className="font-medium text-gray-900">启用开票加价</div>
                      <div className="text-sm text-gray-500">开启后，需要开票的订单将按比例加价</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={editSectionData.invoiceEnabled ?? myManufacturer.invoiceEnabled ?? false}
                        onChange={(e) => setEditSectionData({...editSectionData, invoiceEnabled: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">开票加价比例 (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      defaultValue={myManufacturer.invoiceMarkupPercent || 10}
                      onChange={(e) => setEditSectionData({...editSectionData, invoiceMarkupPercent: Number(e.target.value)})}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      例如：售价1000元的产品，开票加价10%后，客户需支付1100元
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditSectionModal(false)
                  setEditSectionData({})
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  try {
                    setEditSectionSaving(true)
                    const updateData: any = {}
                    
                    if (editSection === 'basic') {
                      if (editSectionData.logo) updateData.logo = editSectionData.logo
                      if (editSectionData.galleryImages !== undefined) updateData.galleryImages = editSectionData.galleryImages
                      if (editSectionData.fullName) updateData.fullName = editSectionData.fullName
                      if (editSectionData.shortName) updateData.shortName = editSectionData.shortName
                      if (editSectionData.contactName) updateData.contactName = editSectionData.contactName
                      if (editSectionData.contactPhone) updateData.contactPhone = editSectionData.contactPhone
                      if (editSectionData.contactEmail) updateData.contactEmail = editSectionData.contactEmail
                      if (editSectionData.companyPhone) updateData.companyPhone = editSectionData.companyPhone
                      if (editSectionData.servicePhone) updateData.servicePhone = editSectionData.servicePhone
                      if (editSectionData.address) updateData.address = editSectionData.address
                      if (editSectionData.status) updateData.status = editSectionData.status
                    } else if (editSection === 'settlement') {
                      updateData.settings = {
                        ...myManufacturer.settings,
                        wechatQrCode: editSectionData.wechatQrCode || myManufacturer.settings?.wechatQrCode,
                        alipayQrCode: editSectionData.alipayQrCode || myManufacturer.settings?.alipayQrCode,
                        bankInfo: {
                          bankName: editSectionData.bankName || myManufacturer.settings?.bankInfo?.bankName,
                          accountName: editSectionData.accountName || myManufacturer.settings?.bankInfo?.accountName,
                          accountNumber: editSectionData.accountNumber || myManufacturer.settings?.bankInfo?.accountNumber
                        }
                      }
                    } else if (editSection === 'qualification') {
                      updateData.certification = {
                        ...myManufacturer.certification,
                        businessLicense: editSectionData.businessLicense || myManufacturer.certification?.businessLicense,
                        companyName: editSectionData.invoiceCompanyName || myManufacturer.certification?.companyName,
                        creditCode: editSectionData.creditCode || myManufacturer.certification?.creditCode,
                        legalPerson: editSectionData.legalPerson || myManufacturer.certification?.legalPerson,
                        invoiceName: editSectionData.invoiceName || myManufacturer.certification?.invoiceName,
                        taxNumber: editSectionData.taxNumber || myManufacturer.certification?.taxNumber,
                        invoiceBankName: editSectionData.invoiceBankName || myManufacturer.certification?.invoiceBankName,
                        invoiceBankAccount: editSectionData.invoiceBankAccount || myManufacturer.certification?.invoiceBankAccount,
                        invoiceAddress: editSectionData.invoiceAddress || myManufacturer.certification?.invoiceAddress,
                        invoicePhone: editSectionData.invoicePhone || myManufacturer.certification?.invoicePhone
                      }
                    } else if (editSection === 'tags') {
                      updateData.styleTags = editSectionData.styleTags || myManufacturer.styleTags
                      updateData.categoryTags = editSectionData.categoryTags || myManufacturer.categoryTags
                    } else if (editSection === 'priceRange') {
                      if (editSectionData.priceRangeMin !== undefined) updateData.priceRangeMin = editSectionData.priceRangeMin
                      if (editSectionData.priceRangeMax !== undefined) updateData.priceRangeMax = editSectionData.priceRangeMax
                    } else if (editSection === 'discount') {
                      if (editSectionData.defaultDiscount !== undefined) updateData.defaultDiscount = editSectionData.defaultDiscount
                    } else if (editSection === 'commission') {
                      if (editSectionData.defaultCommission !== undefined) updateData.defaultCommission = editSectionData.defaultCommission
                    } else if (editSection === 'paymentRatio') {
                      if (editSectionData.paymentRatioEnabled !== undefined) updateData.paymentRatioEnabled = editSectionData.paymentRatioEnabled
                      if (editSectionData.paymentRatios) updateData.paymentRatios = editSectionData.paymentRatios
                    } else if (editSection === 'invoice') {
                      if (editSectionData.invoiceEnabled !== undefined) updateData.invoiceEnabled = editSectionData.invoiceEnabled
                      if (editSectionData.invoiceMarkupPercent !== undefined) updateData.invoiceMarkupPercent = editSectionData.invoiceMarkupPercent
                    }

                    await apiClient.put(`/manufacturers/${myManufacturer._id}`, updateData)
                    toast.success('保存成功')
                    setShowEditSectionModal(false)
                    setEditSectionData({})
                    fetchData()
                  } catch (error: any) {
                    toast.error(error.response?.data?.message || '保存失败')
                  } finally {
                    setEditSectionSaving(false)
                  }
                }}
                disabled={editSectionSaving}
                className="px-6 py-2 bg-[#153e35] text-white rounded-lg hover:bg-[#1a4d42] disabled:opacity-50 flex items-center gap-2"
              >
                {editSectionSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 厂家资料编辑抽屉 - 使用共享组件 */}
      <ManufacturerEditDrawer
        open={showEditDrawer}
        onClose={() => {
          setShowEditDrawer(false)
          setEditingItem(null)
        }}
        manufacturer={editingItem}
        onSaved={() => {
          fetchData()
          setShowEditDrawer(false)
          setEditingItem(null)
        }}
        isFactoryPortal={isFactoryPortal}
      />

      {/* 厂家图片相册弹窗 */}
      {showGalleryModal && galleryTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {galleryTarget.shortName || galleryTarget.fullName} - 图片相册
              </h3>
              <button
                onClick={() => setShowGalleryModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              {/* LOGO */}
              {galleryTarget.logo && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-gray-500 mb-2">品牌LOGO</div>
                  <img
                    src={getFileUrl(galleryTarget.logo)}
                    alt="LOGO"
                    className="max-w-xs rounded-xl shadow-md"
                  />
                </div>
              )}
              {/* 相册图片 */}
              <div className="text-sm font-semibold text-gray-500 mb-2">厂家相册</div>
              {galleryTarget.galleryImages && galleryTarget.galleryImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {galleryTarget.galleryImages.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={getFileUrl(img)}
                      alt={`图片${idx + 1}`}
                      className="w-full h-48 object-cover rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.open(getFileUrl(img), '_blank')}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-8">暂无相册图片</div>
              )}
              {/* 编辑按钮 - 仅对自己的厂家显示 */}
              {myManufacturer && galleryTarget._id === myManufacturer._id && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setShowGalleryModal(false)
                      setEditSection('basic')
                      setShowEditSectionModal(true)
                    }}
                    className="px-4 py-2 bg-[#153e35] text-white rounded-lg hover:bg-[#1a4d42]"
                  >
                    编辑图片
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
