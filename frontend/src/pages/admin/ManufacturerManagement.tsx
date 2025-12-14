import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Factory, Phone, Mail, MapPin, Loader2, Key, TrendingUp } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'

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
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  accountQuota?: AccountQuota
  accountUsage?: AccountQuota
  logo?: string
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
  }
  certification?: {
    status: 'none' | 'pending' | 'approved' | 'rejected'
    companyName?: string
    creditCode?: string
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
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<Manufacturer | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    shortName: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    // 扩展字段
    logo: '',
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

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/manufacturers', { params: { keyword, pageSize: 100 } })
      setManufacturers(response.data.data || [])
    } catch (error) {
      console.error('获取厂家列表失败:', error)
      toast.error('获取厂家列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [keyword])

  const openCreateModal = () => {
    setEditingItem(null)
    setFormData({
      fullName: '',
      shortName: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      description: '',
      status: 'active',
      logo: '',
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
    setFormData({
      fullName: item.fullName || item.name || '',
      shortName: item.shortName || '',
      contactName: item.contactName || '',
      contactPhone: item.contactPhone || '',
      contactEmail: item.contactEmail || '',
      address: item.address || '',
      description: item.description || '',
      status: item.status,
      logo: item.logo || '',
      settings: {
        phone: item.settings?.phone || '',
        servicePhone: item.settings?.servicePhone || '',
        wechatQrCode: item.settings?.wechatQrCode || '',
        alipayQrCode: item.settings?.alipayQrCode || '',
        bankInfo: {
          bankName: item.settings?.bankInfo?.bankName || '',
          accountName: item.settings?.bankInfo?.accountName || '',
          accountNumber: item.settings?.bankInfo?.accountNumber || ''
        }
      }
    })
    setShowModal(true)
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
      if (editingItem) {
        await apiClient.put(`/manufacturers/${editingItem._id}`, formData)
        toast.success('更新成功')
      } else {
        await apiClient.post('/manufacturers', formData)
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Factory className="w-6 h-6" />
          厂家信息管理
        </h1>
        <div className="flex items-center gap-3">
          <a
            href="/admin/channel-partners"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            📋 渠道商档案
          </a>
          <a
            href="/admin/commission-rules"
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            📊 分成规则
          </a>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            新建厂家
          </button>
        </div>
      </div>

      {/* 搜索栏 */}
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

      {/* 列表 */}
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
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">{item.fullName || item.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {item.shortName && <span className="font-medium text-primary">[{item.shortName}]</span>}
                    {item.code && <span>编号：{item.code}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.certification?.status === 'approved' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                      ✓ 已认证
                    </span>
                  )}
                  {item.certification?.status === 'pending' && (
                    <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700">
                      待审核
                    </span>
                  )}
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {item.status === 'active' ? '启用' : '停用'}
                  </span>
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

              {/* 账号配额信息 */}
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
                  <button
                    onClick={() => openQuotaModal(item)}
                    className="text-xs text-primary hover:underline"
                  >
                    设置配额
                  </button>
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

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(item)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  编辑
                </button>
                <button
                  onClick={() => openAccountsModal(item)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Key className="w-4 h-4" />
                  账号
                </button>
                <button
                  onClick={() => handleDelete(item._id)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
              <a
                href={`/admin/commission-system/${item._id}`}
                className="flex items-center justify-center gap-2 mt-2 px-3 py-2 text-sm text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 rounded-lg transition-colors"
              >
                <TrendingUp className="w-4 h-4" />
                分成体系管理
              </a>
            </div>
          ))}
        </div>
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
    </div>
  )
}
