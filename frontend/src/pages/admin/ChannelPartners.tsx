import { useState, useEffect } from 'react'
import { Plus, Search, MoreHorizontal, MapPin, Phone, Loader2, Upload, Edit, Trash2, CheckCircle, Clock } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'

interface Brand {
  manufacturerId: string
  manufacturerName: string
  manufacturerCode: string
  color: string
}

interface ChannelPartner {
  _id: string
  name: string
  code: string
  type: '2S' | '2D' | '2F' | 'KA' | 'other'
  brands: Brand[]
  region: {
    province?: string
    city?: string
    district?: string
    address?: string
  }
  contact: {
    name?: string
    phone?: string
    email?: string
    position?: string
  }
  totalGMV: number
  status: 'active' | 'pending' | 'signing' | 'suspended' | 'terminated'
  cooperationStartDate?: string
  notes?: string
  createdAt: string
}

interface Manufacturer {
  _id: string
  name: string
  fullName?: string
  shortName?: string
}

interface Stats {
  total: number
  active: number
  pending: number
}

export default function ChannelPartners() {
  const [partners, setPartners] = useState<ChannelPartner[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0 })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  
  // 筛选条件
  const [search, setSearch] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  
  // 弹窗状态
  const [showModal, setShowModal] = useState(false)
  const [editingPartner, setEditingPartner] = useState<ChannelPartner | null>(null)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '2S' as '2S' | '2D' | '2F' | 'KA',
    brandIds: [] as string[],
    region: {
      province: '',
      city: '',
      address: ''
    },
    contact: {
      name: '',
      phone: '',
      email: ''
    },
    totalGMV: 0,
    status: 'pending' as 'active' | 'pending' | 'signing'
  })

  // 加载数据
  useEffect(() => {
    fetchManufacturers()
  }, [])

  useEffect(() => {
    fetchPartners()
  }, [search, selectedBrand, selectedType, pagination.page])

  const fetchManufacturers = async () => {
    try {
      const response = await apiClient.get('/manufacturers/all')
      setManufacturers(response.data.data || [])
    } catch (error) {
      console.error('获取厂家列表失败:', error)
    }
  }

  const fetchPartners = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.page,
        limit: pagination.limit
      }
      if (search) params.search = search
      if (selectedBrand !== 'all') params.manufacturerId = selectedBrand
      if (selectedType !== 'all') params.type = selectedType

      const response = await apiClient.get('/channel-partners', { params })
      const data = response.data.data
      setPartners(data.list || [])
      setStats(data.stats || { total: 0, active: 0, pending: 0 })
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }))
    } catch (error) {
      console.error('获取渠道商列表失败:', error)
      toast.error('获取渠道商列表失败')
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setEditingPartner(null)
    setFormData({
      name: '',
      type: '2S',
      brandIds: [],
      region: { province: '', city: '', address: '' },
      contact: { name: '', phone: '', email: '' },
      totalGMV: 0,
      status: 'pending'
    })
    setShowModal(true)
  }

  const openEditModal = (partner: ChannelPartner) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name,
      type: partner.type as '2S' | '2D' | '2F' | 'KA',
      brandIds: partner.brands?.map(b => b.manufacturerId) || [],
      region: {
        province: partner.region?.province || '',
        city: partner.region?.city || '',
        address: partner.region?.address || ''
      },
      contact: {
        name: partner.contact?.name || '',
        phone: partner.contact?.phone || '',
        email: partner.contact?.email || ''
      },
      totalGMV: partner.totalGMV || 0,
      status: partner.status as 'active' | 'pending' | 'signing'
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入渠道商名称')
      return
    }

    try {
      setSaving(true)
      if (editingPartner) {
        await apiClient.put(`/channel-partners/${editingPartner._id}`, formData)
        toast.success('渠道商更新成功')
      } else {
        await apiClient.post('/channel-partners', formData)
        toast.success('渠道商创建成功')
      }
      setShowModal(false)
      fetchPartners()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该渠道商吗？')) return

    try {
      await apiClient.delete(`/channel-partners/${id}`)
      toast.success('渠道商已删除')
      fetchPartners()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '删除失败')
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await apiClient.put(`/channel-partners/${id}/status`, { status })
      toast.success('状态更新成功')
      fetchPartners()
    } catch (error: any) {
      toast.error(error.response?.data?.message || '更新失败')
    }
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      '2S': '2S',
      '2D': '2D',
      '2F': '2F',
      'KA': 'KA',
      'other': '其他'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '2S': 'bg-purple-100 text-purple-700',
      '2D': 'bg-blue-100 text-blue-700',
      '2F': 'bg-orange-100 text-orange-700',
      'KA': 'bg-green-100 text-green-700',
      'other': 'bg-gray-100 text-gray-700'
    }
    return colors[type] || colors['other']
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'active': '合作中',
      'pending': '待审核',
      'signing': '签约中',
      'suspended': '已暂停',
      'terminated': '已终止'
    }
    return labels[status] || status
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'active': 'text-green-600',
      'pending': 'text-orange-600',
      'signing': 'text-blue-600',
      'suspended': 'text-gray-600',
      'terminated': 'text-red-600'
    }
    return colors[status] || 'text-gray-600'
  }

  const formatGMV = (value: number) => {
    if (value >= 10000) {
      return `¥${(value / 10000).toFixed(0)}万`
    }
    return `¥${value.toLocaleString()}`
  }

  const formatPhone = (phone: string) => {
    if (!phone) return ''
    if (phone.length === 11) {
      return `${phone.slice(0, 3)}****${phone.slice(7)}`
    }
    return phone
  }

  return (
    <div className="p-6">
      {/* 标题区 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">渠道商档案</h1>
          <p className="text-sm text-gray-500 mt-1">
            管理各级分销商、门店及合作伙伴信息，监控渠道健康度
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm">
            <Upload className="w-4 h-4" />
            批量导入
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            新增渠道商
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">合作渠道总数</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{stats.active}</div>
            <div className="text-sm text-gray-500">活跃商户</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-sm text-gray-500">待审核/签约中</div>
          </div>
        </div>
      </div>

      {/* 筛选区 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
        <div className="flex items-center gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索商户名称、联系人或区域..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
            />
          </div>

          {/* 品牌筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">品牌筛选:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSelectedBrand('all')}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  selectedBrand === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {manufacturers.slice(0, 4).map((m) => (
                <button
                  key={m._id}
                  onClick={() => setSelectedBrand(m._id)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    selectedBrand === m._id
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.shortName || m.fullName || m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-sm font-medium text-gray-500">
          <div className="col-span-3">渠道商名称</div>
          <div className="col-span-1">类型</div>
          <div className="col-span-1">经营品牌</div>
          <div className="col-span-3">区域/联系人</div>
          <div className="col-span-2">累计销售额 (GMV)</div>
          <div className="col-span-1">合作状态</div>
          <div className="col-span-1 text-right">操作</div>
        </div>

        {/* 列表内容 */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : partners.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="mb-4">暂无渠道商数据</p>
            <button onClick={openCreateModal} className="text-primary hover:underline">
              点击新增第一个渠道商
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {partners.map((partner) => (
              <div key={partner._id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors">
                {/* 名称 */}
                <div className="col-span-3">
                  <div className="font-medium text-gray-900">{partner.name}</div>
                  <div className="text-xs text-gray-400">ID: {partner.code}</div>
                </div>

                {/* 类型 */}
                <div className="col-span-1">
                  <span className={`px-2.5 py-1 rounded text-xs font-medium ${getTypeColor(partner.type)}`}>
                    {getTypeLabel(partner.type)}
                  </span>
                </div>

                {/* 经营品牌 */}
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    {partner.brands?.map((brand, idx) => (
                      <div
                        key={idx}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: brand.color }}
                        title={brand.manufacturerName}
                      />
                    ))}
                    {(!partner.brands || partner.brands.length === 0) && (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </div>

                {/* 区域/联系人 */}
                <div className="col-span-3">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{partner.region?.province}{partner.region?.city}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{partner.contact?.name} ({formatPhone(partner.contact?.phone || '')})</span>
                  </div>
                </div>

                {/* GMV */}
                <div className="col-span-2">
                  <span className="font-semibold text-gray-900">{formatGMV(partner.totalGMV)}</span>
                </div>

                {/* 状态 */}
                <div className="col-span-1">
                  <span className={`flex items-center gap-1 text-sm ${getStatusColor(partner.status)}`}>
                    {partner.status === 'active' ? (
                      <CheckCircle className="w-3.5 h-3.5" />
                    ) : (
                      <Clock className="w-3.5 h-3.5" />
                    )}
                    {getStatusLabel(partner.status)}
                  </span>
                </div>

                {/* 操作 */}
                <div className="col-span-1 text-right">
                  <div className="relative group">
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                      <button
                        onClick={() => openEditModal(partner)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        编辑
                      </button>
                      {partner.status !== 'active' && (
                        <button
                          onClick={() => handleStatusChange(partner._id, 'active')}
                          className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          通过审核
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(partner._id)}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 分页 */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">显示 {partners.length} 条记录</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.pages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingPartner ? '编辑渠道商' : '新增渠道商'}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">渠道商名称 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="如：苏州各色旗舰店"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">渠道类型</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="2S">2S - 旗舰店</option>
                    <option value="2D">2D - 设计师/工作室</option>
                    <option value="2F">2F - 加盟商</option>
                    <option value="KA">KA - 大客户</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">合作状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    <option value="pending">待审核</option>
                    <option value="signing">签约中</option>
                    <option value="active">合作中</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">经营品牌</label>
                <div className="flex flex-wrap gap-2">
                  {manufacturers.map((m) => (
                    <label key={m._id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.brandIds.includes(m._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, brandIds: [...formData.brandIds, m._id] })
                          } else {
                            setFormData({ ...formData, brandIds: formData.brandIds.filter(id => id !== m._id) })
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-gray-700">{m.shortName || m.fullName || m.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">省份</label>
                  <input
                    type="text"
                    value={formData.region.province}
                    onChange={(e) => setFormData({ ...formData, region: { ...formData.region, province: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="如：江苏省"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
                  <input
                    type="text"
                    value={formData.region.city}
                    onChange={(e) => setFormData({ ...formData, region: { ...formData.region, city: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="如：苏州市"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
                  <input
                    type="text"
                    value={formData.contact.name}
                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, name: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="联系人姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                  <input
                    type="text"
                    value={formData.contact.phone}
                    onChange={(e) => setFormData({ ...formData, contact: { ...formData.contact, phone: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="联系电话"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">累计销售额</label>
                <input
                  type="number"
                  value={formData.totalGMV}
                  onChange={(e) => setFormData({ ...formData, totalGMV: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  placeholder="0"
                />
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
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
