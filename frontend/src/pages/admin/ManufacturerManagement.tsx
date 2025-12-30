import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Factory, Phone, Mail, MapPin, Loader2, Key } from 'lucide-react'
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
  isPreferred?: boolean
  expiryDate?: string
  defaultDiscount?: number
  defaultCommission?: number
  productIntro?: string
  styleTags?: string[]
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  description?: string
  status: 'active' | 'inactive'
  createdAt: string
  accountQuota?: AccountQuota
  accountUsage?: AccountQuota
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
    status: 'active' as 'active' | 'inactive'
  })
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<Manufacturer | null>(null)
  const [passwordForm, setPasswordForm] = useState({ username: '', password: '' })
  // 账号配额编辑
  const [showQuotaModal, setShowQuotaModal] = useState(false)
  const [quotaTarget, setQuotaTarget] = useState<Manufacturer | null>(null)
  const [quotaForm, setQuotaForm] = useState({
    authAccounts: 0,
    subAccounts: 0,
    designerAccounts: 0
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
      status: 'active'
    })
    setShowModal(true)
  }

  const openEditModal = (item: Manufacturer) => {
    setEditingItem(item)
    setFormData({
      fullName: item.fullName || item.name || '',
      shortName: item.shortName || '',
      isPreferred: Boolean(item.isPreferred),
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
      defaultDiscount: item.defaultDiscount || 0,
      defaultCommission: item.defaultCommission || 0,
      styleTagsText: (item.styleTags || []).join(', '),
      productIntro: item.productIntro || '',
      contactName: item.contactName || '',
      contactPhone: item.contactPhone || '',
      contactEmail: item.contactEmail || '',
      address: item.address || '',
      description: item.description || '',
      status: item.status
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
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新建厂家
        </button>
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
                  <div className="mt-1 flex flex-wrap gap-2">
                    {item.isPreferred && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        优质厂家
                      </span>
                    )}
                    {item.expiryDate && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        效期至 {new Date(item.expiryDate).toISOString().slice(0, 10)}
                      </span>
                    )}
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.status === 'active' ? '启用' : '停用'}
                </span>
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

              {/* 账号配额信息 */}
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500">账号配额</span>
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
                  onClick={() => openPasswordModal(item)}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  授权账号配额
                </label>
                <input
                  type="number"
                  min="0"
                  value={quotaForm.authAccounts}
                  onChange={(e) => setQuotaForm({ ...quotaForm, authAccounts: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  当前已使用：{quotaTarget.accountUsage?.authAccounts || 0} 个
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  子账号配额
                </label>
                <input
                  type="number"
                  min="0"
                  value={quotaForm.subAccounts}
                  onChange={(e) => setQuotaForm({ ...quotaForm, subAccounts: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  当前已使用：{quotaTarget.accountUsage?.subAccounts || 0} 个
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  设计师账号配额
                </label>
                <input
                  type="number"
                  min="0"
                  value={quotaForm.designerAccounts}
                  onChange={(e) => setQuotaForm({ ...quotaForm, designerAccounts: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  当前已使用：{quotaTarget.accountUsage?.designerAccounts || 0} 个
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  ⚠️ 设置配额后，厂家可在配额范围内创建对应类型的账号
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
    </div>
  )
}
