import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Factory, Phone, Mail, MapPin, Loader2, Key } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'

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
    status: 'active' as 'active' | 'inactive'
  })
  const [saving, setSaving] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<Manufacturer | null>(null)
  const [passwordForm, setPasswordForm] = useState({ username: '', password: '' })

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
      status: 'active'
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
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  item.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.status === 'active' ? '启用' : '停用'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
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
                {item.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {item.contactEmail}
                  </div>
                )}
                {item.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span className="line-clamp-1">{item.address}</span>
                  </div>
                )}
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
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="请输入厂家全称，如：广州市某某家具有限公司"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  厂家简称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData({ ...formData, shortName: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase"
                  placeholder="请输入简称（2-4个字母），如：GS、MMJJ"
                  maxLength={6}
                  disabled={!!editingItem}
                />
                {!editingItem && formData.shortName && (
                  <p className="text-xs text-gray-500 mt-1">
                    编号预览: <span className="font-mono text-primary">{formData.shortName}{new Date().toISOString().slice(0,10).replace(/-/g,'')}XXXX</span>
                  </p>
                )}
                {editingItem && (
                  <p className="text-xs text-gray-500 mt-1">简称创建后不可修改</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">厂家编号</label>
                <input
                  type="text"
                  value={editingItem?.code || '保存后自动生成'}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600 font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">编号由系统自动生成，格式：简称+日期+随机数</p>
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
                设置账号密码 - {passwordTarget.name}
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
    </div>
  )
}
