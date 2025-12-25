import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { getThumbnailUrl } from '@/services/uploadService'
import ImageUploader from '@/components/admin/ImageUploader'

type Manufacturer = {
  _id: string
  name: string
  fullName?: string
  shortName?: string
  code?: string
  logo?: any
  description?: string
  status?: 'active' | 'inactive'
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  settings?: {
    phone?: string
    servicePhone?: string
    wechatQrCode?: string
    alipayQrCode?: string
    businessLicense?: string
    bankInfo?: {
      bankName?: string
      accountName?: string
      accountNumber?: string
    }
    companyAddress?: string
  }
  accountQuota?: {
    authAccounts?: number
    subAccounts?: number
    designerAccounts?: number
    totalAccounts?: number
  }
  accountUsage?: {
    authAccounts?: number
    subAccounts?: number
    designerAccounts?: number
    totalAccounts?: number
  }
}

type ManufacturerAccount = {
  _id: string
  username: string
  nickname?: string
  accountType: 'auth' | 'sub' | 'designer' | 'normal'
  status: 'active' | 'inactive' | 'banned' | 'expired'
  role?: string
  permissions?: {
    canAccessAdmin?: boolean
    canViewCostPrice?: boolean
    canDownloadMaterial?: boolean
    canManageUsers?: boolean
    canManageProducts?: boolean
    canManageOrders?: boolean
    canViewReports?: boolean
  }
  specialAccountConfig?: {
    expiresAt?: string
  }
  lastLoginAt?: string
  createdAt?: string
}

const pickImageId = (v: any): string => {
  if (!v) return ''
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  if (Array.isArray(v)) return pickImageId(v[0])
  if (typeof v === 'object') return String(v.fileId || v.id || v._id || v.url || v.path || '')
  return ''
}

const normalizeFileId = (v: any): string => {
  const raw = pickImageId(v)
  if (!raw) return ''
  if (raw.startsWith('/api/files/')) return raw.replace('/api/files/', '').split('?')[0]
  return raw
}

const getLogoSrc = (logo: any, size: number) => {
  const id = normalizeFileId(logo)
  if (!id) return ''
  return getThumbnailUrl(id, size)
}

const AccountManagementModal = ({
  open,
  onClose,
  manufacturer,
  onChanged,
}: {
  open: boolean
  onClose: () => void
  manufacturer: Manufacturer | null
  onChanged: () => void
}) => {
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<ManufacturerAccount[]>([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'auth' | 'sub' | 'designer' | 'normal'>('all')
  const [showEditor, setShowEditor] = useState(false)
  const [editing, setEditing] = useState<ManufacturerAccount | null>(null)
  const [form, setForm] = useState({
    username: '',
    password: '',
    nickname: '',
    accountType: 'sub' as 'auth' | 'sub' | 'designer' | 'normal',
    expiresAt: '',
    permissions: {
      canAccessAdmin: false,
      canViewCostPrice: false,
      canDownloadMaterial: false,
      canManageUsers: false,
      canManageProducts: false,
      canManageOrders: false,
      canViewReports: false,
    },
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!manufacturer?._id) return
    try {
      setLoading(true)
      const res = await apiClient.get(`/manufacturers/${manufacturer._id}/accounts`)
      setAccounts(res.data?.data || [])
    } catch {
      toast.error('获取账号列表失败')
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, manufacturer?._id])

  const openCreate = () => {
    setEditing(null)
    setForm({
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
        canManageOrders: false,
        canViewReports: false,
      },
    })
    setShowEditor(true)
  }

  const openEdit = (acc: ManufacturerAccount) => {
    setEditing(acc)
    setForm({
      username: acc.username,
      password: '',
      nickname: acc.nickname || '',
      accountType: acc.accountType,
      expiresAt: (acc.specialAccountConfig?.expiresAt || '').slice(0, 10),
      permissions: {
        canAccessAdmin: !!acc.permissions?.canAccessAdmin,
        canViewCostPrice: !!acc.permissions?.canViewCostPrice,
        canDownloadMaterial: !!acc.permissions?.canDownloadMaterial,
        canManageUsers: !!acc.permissions?.canManageUsers,
        canManageProducts: !!acc.permissions?.canManageProducts,
        canManageOrders: !!acc.permissions?.canManageOrders,
        canViewReports: !!acc.permissions?.canViewReports,
      },
    })
    setShowEditor(true)
  }

  const save = async () => {
    if (!manufacturer?._id) return
    if (!editing && !form.username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!editing && (!form.password.trim() || form.password.length < 6)) {
      toast.error('密码至少6位')
      return
    }

    try {
      setSaving(true)
      if (editing) {
        await apiClient.put(`/manufacturers/${manufacturer._id}/accounts/${editing._id}`, {
          nickname: form.nickname,
          accountType: form.accountType,
          expiresAt: form.expiresAt || null,
          permissions: form.permissions,
        })
        toast.success('账号更新成功')
      } else {
        await apiClient.post(`/manufacturers/${manufacturer._id}/accounts`, form)
        toast.success('账号创建成功')
      }
      setShowEditor(false)
      await load()
      onChanged()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '操作失败')
    } finally {
      setSaving(false)
    }
  }

  const toggleFreeze = async (acc: ManufacturerAccount) => {
    if (!manufacturer?._id) return
    const nextStatus = acc.status === 'active' ? 'inactive' : 'active'
    try {
      await apiClient.put(`/manufacturers/${manufacturer._id}/accounts/${acc._id}`, { status: nextStatus })
      toast.success(nextStatus === 'inactive' ? '已冻结' : '已解冻')
      await load()
    } catch {
      toast.error('操作失败')
    }
  }

  const resetPassword = async (acc: ManufacturerAccount) => {
    if (!manufacturer?._id) return
    const pwd = window.prompt('请输入新密码（至少6位）')
    if (!pwd) return
    if (pwd.length < 6) {
      toast.error('密码至少6位')
      return
    }
    try {
      await apiClient.post(`/manufacturers/${manufacturer._id}/accounts/${acc._id}/reset-password`, { newPassword: pwd })
      toast.success('密码已重置')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '重置失败')
    }
  }

  const remove = async (acc: ManufacturerAccount) => {
    if (!manufacturer?._id) return
    if (!window.confirm('确定要删除该账号吗？')) return
    try {
      await apiClient.delete(`/manufacturers/${manufacturer._id}/accounts/${acc._id}`)
      toast.success('账号已删除')
      await load()
      onChanged()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '删除失败')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return accounts.filter(a => {
      const matchQ = !q || (a.username || '').toLowerCase().includes(q) || (a.nickname || '').toLowerCase().includes(q)
      const matchT = filterType === 'all' || a.accountType === filterType
      return matchQ && matchT
    })
  }, [accounts, search, filterType])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-[1200px] bg-white rounded-[3rem] shadow-2xl overflow-hidden">
        <div className="p-10 border-b flex items-center justify-between bg-white">
          <div>
            <div className="text-3xl font-black text-gray-900">账号分发管控中心</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{manufacturer?.name || ''}</div>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400" type="button">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="p-10">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between mb-6">
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="搜索用户名/昵称"
                className="px-6 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold w-80"
              />
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="px-6 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold"
              >
                <option value="all">全部</option>
                <option value="auth">授权账号</option>
                <option value="sub">子账号</option>
                <option value="designer">设计师</option>
                <option value="normal">普通</option>
              </select>
            </div>
            <button onClick={openCreate} className="rounded-2xl px-8 py-3 bg-[#153e35] text-white font-black" type="button">
              + 新建账号
            </button>
          </div>

          {loading ? (
            <div className="py-10 text-gray-400 font-bold">加载中...</div>
          ) : (
            <div className="space-y-3 max-h-[55vh] overflow-y-auto custom-scrollbar pr-2">
              {filtered.map(acc => (
                <div key={acc._id} className="bg-white border border-gray-100 rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${acc.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <div className="text-sm font-black text-gray-900 truncate">{acc.username}</div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{acc.accountType}</div>
                    </div>
                    <div className="text-xs font-bold text-gray-400 mt-1 truncate">{acc.nickname || '-'}</div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => openEdit(acc)} className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-black" type="button">编辑</button>
                    <button onClick={() => resetPassword(acc)} className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-100 text-xs font-black" type="button">重置密码</button>
                    <button onClick={() => toggleFreeze(acc)} className={`px-4 py-2 rounded-xl text-xs font-black ${acc.status === 'active' ? 'bg-red-50 text-red-500 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`} type="button">
                      {acc.status === 'active' ? '冻结' : '解冻'}
                    </button>
                    <button onClick={() => remove(acc)} className="px-4 py-2 rounded-xl bg-red-500 text-white text-xs font-black" type="button">删除</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditor && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowEditor(false)} />
          <div className="relative w-full max-w-[720px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="p-8 border-b flex items-center justify-between">
              <div className="text-2xl font-black text-gray-900">{editing ? '编辑账号' : '新建账号'}</div>
              <button onClick={() => setShowEditor(false)} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400" type="button">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              {!editing && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">用户名</div>
                    <input value={form.username} onChange={e => setForm(prev => ({ ...prev, username: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">初始密码</div>
                    <input type="password" value={form.password} onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">昵称</div>
                  <input value={form.nickname} onChange={e => setForm(prev => ({ ...prev, nickname: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">账号类型</div>
                  <select value={form.accountType} onChange={e => setForm(prev => ({ ...prev, accountType: e.target.value as any }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold">
                    <option value="auth">授权账号</option>
                    <option value="sub">子账号</option>
                    <option value="designer">设计师</option>
                    <option value="normal">普通</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest">到期时间（可选）</div>
                <input type="date" value={form.expiresAt} onChange={e => setForm(prev => ({ ...prev, expiresAt: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(
                  [
                    ['canAccessAdmin', '可进后台'],
                    ['canViewCostPrice', '可看成本'],
                    ['canDownloadMaterial', '可下载素材'],
                    ['canManageUsers', '可管用户'],
                    ['canManageProducts', '可管商品'],
                    ['canManageOrders', '可管订单'],
                    ['canViewReports', '可看报表'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4">
                    <input
                      type="checkbox"
                      checked={(form.permissions as any)[k]}
                      onChange={e => setForm(prev => ({ ...prev, permissions: { ...prev.permissions, [k]: e.target.checked } }))}
                    />
                    <span className="text-sm font-black text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-8 border-t flex gap-4">
              <button onClick={() => setShowEditor(false)} className="flex-1 rounded-2xl py-4 border border-gray-200 font-black" type="button">取消</button>
              <button disabled={saving} onClick={save} className="flex-1 rounded-2xl py-4 bg-[#153e35] text-white font-black disabled:opacity-60" type="button">
                {saving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const ManufacturerEditDrawer = ({
  open,
  onClose,
  manufacturer,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  manufacturer: Manufacturer | null
  onSaved: () => void
}) => {
  const isCreate = !manufacturer?._id

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<{
    fullName: string
    shortName: string
    contactName: string
    contactPhone: string
    contactEmail: string
    address: string
    description: string
    status: 'active' | 'inactive'
    logo: string
    accountQuota: {
      authAccounts: number
      subAccounts: number
      designerAccounts: number
      totalAccounts: number
    }
    settings: {
      phone: string
      servicePhone: string
      wechatQrCode: string
      alipayQrCode: string
      businessLicense: string
      companyAddress: string
      bankInfo: {
        bankName: string
        accountName: string
        accountNumber: string
      }
    }
  }>(null as any)

  const hydrate = (m?: Manufacturer | null) => {
    const quota = m?.accountQuota || {}
    setForm({
      fullName: m?.fullName || m?.name || '',
      shortName: m?.shortName || '',
      contactName: m?.contactName || '',
      contactPhone: m?.contactPhone || '',
      contactEmail: m?.contactEmail || '',
      address: m?.address || '',
      description: m?.description || '',
      status: (m?.status || 'active') as any,
      logo: normalizeFileId(m?.logo) || '',
      accountQuota: {
        authAccounts: Number(quota.authAccounts || 0),
        subAccounts: Number(quota.subAccounts || 0),
        designerAccounts: Number(quota.designerAccounts || 0),
        totalAccounts: Number(quota.totalAccounts || 0),
      },
      settings: {
        phone: m?.settings?.phone || '',
        servicePhone: m?.settings?.servicePhone || '',
        wechatQrCode: normalizeFileId(m?.settings?.wechatQrCode) || '',
        alipayQrCode: normalizeFileId(m?.settings?.alipayQrCode) || '',
        businessLicense: normalizeFileId(m?.settings?.businessLicense) || '',
        companyAddress: m?.settings?.companyAddress || '',
        bankInfo: {
          bankName: m?.settings?.bankInfo?.bankName || '',
          accountName: m?.settings?.bankInfo?.accountName || '',
          accountNumber: m?.settings?.bankInfo?.accountNumber || '',
        },
      },
    })
  }

  useEffect(() => {
    if (!open) return
    if (!manufacturer?._id) {
      hydrate(null)
      return
    }
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get(`/manufacturers/${manufacturer._id}`)
        hydrate(res.data?.data || null)
      } catch {
        toast.error('加载厂家资料失败')
        hydrate(manufacturer)
      } finally {
        setLoading(false)
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, manufacturer?._id])

  if (!open) return null
  if (!form) return null

  const save = async () => {
    if (!form.fullName.trim()) {
      toast.error('请输入厂家全称')
      return
    }
    if (!form.shortName.trim()) {
      toast.error('请输入厂家简称')
      return
    }
    try {
      setSaving(true)
      if (isCreate) {
        await apiClient.post('/manufacturers', {
          fullName: form.fullName,
          shortName: form.shortName,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          address: form.address,
          description: form.description,
          logo: normalizeFileId(form.logo),
          status: form.status,
        })
        toast.success('创建成功')
      } else {
        await apiClient.put(`/manufacturers/${manufacturer!._id}`, {
          fullName: form.fullName,
          shortName: form.shortName,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          address: form.address,
          description: form.description,
          logo: normalizeFileId(form.logo),
          status: form.status,
          settings: {
            phone: form.settings.phone,
            servicePhone: form.settings.servicePhone,
            wechatQrCode: normalizeFileId(form.settings.wechatQrCode),
            alipayQrCode: normalizeFileId(form.settings.alipayQrCode),
            businessLicense: normalizeFileId(form.settings.businessLicense),
            companyAddress: form.settings.companyAddress,
            bankInfo: form.settings.bankInfo,
          },
          accountQuota: form.accountQuota,
        })
        toast.success('保存成功')
      }

      onClose()
      onSaved()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[140] flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white shadow-2xl h-full flex flex-col overflow-hidden">
        <div className="p-10 border-b bg-white flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{isCreate ? '品牌入驻申请' : '修改厂家核心资料'}</h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Global Identity & Certification</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400" type="button">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-gray-400 font-bold">加载中...</div>
        ) : (
          <div className="flex-grow overflow-y-auto custom-scrollbar p-10 space-y-10">
            <section className="space-y-6">
              <div className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-[#153e35] pl-4">01. 品牌身份与经营地址</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">LOGO</div>
                  <ImageUploader images={form.logo ? [form.logo] : []} onChange={imgs => setForm(prev => ({ ...prev, logo: imgs[0] || '' }))} multiple={false} label="上传LOGO" />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">厂家全称</div>
                      <input value={form.fullName} onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">厂家简称</div>
                      <input value={form.shortName} onChange={e => setForm(prev => ({ ...prev, shortName: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">经营办公地址</div>
                    <input value={form.address} onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-amber-500 pl-4">02. 联系人 & 服务信息</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">联系人</div>
                  <input value={form.contactName} onChange={e => setForm(prev => ({ ...prev, contactName: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">联系人电话</div>
                  <input value={form.contactPhone} onChange={e => setForm(prev => ({ ...prev, contactPhone: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">联系人邮箱</div>
                  <input value={form.contactEmail} onChange={e => setForm(prev => ({ ...prev, contactEmail: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">公司电话</div>
                  <input value={form.settings.phone} onChange={e => setForm(prev => ({ ...prev, settings: { ...prev.settings, phone: e.target.value } }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">客服电话</div>
                  <input value={form.settings.servicePhone} onChange={e => setForm(prev => ({ ...prev, settings: { ...prev.settings, servicePhone: e.target.value } }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">状态</div>
                  <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold">
                    <option value="active">启用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <div className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-500 pl-4">03. 账号配额</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">授权主号配额</div>
                  <input type="number" value={form.accountQuota.authAccounts} onChange={e => setForm(prev => ({ ...prev, accountQuota: { ...prev.accountQuota, authAccounts: Number(e.target.value || 0) } }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">子账号配额</div>
                  <input type="number" value={form.accountQuota.subAccounts} onChange={e => setForm(prev => ({ ...prev, accountQuota: { ...prev.accountQuota, subAccounts: Number(e.target.value || 0) } }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">设计师配额</div>
                  <input type="number" value={form.accountQuota.designerAccounts} onChange={e => setForm(prev => ({ ...prev, accountQuota: { ...prev.accountQuota, designerAccounts: Number(e.target.value || 0) } }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">总配额（可选）</div>
                  <input type="number" value={form.accountQuota.totalAccounts} onChange={e => setForm(prev => ({ ...prev, accountQuota: { ...prev.accountQuota, totalAccounts: Number(e.target.value || 0) } }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                </div>
              </div>
            </section>
          </div>
        )}

        <div className="p-10 border-t bg-white flex gap-6">
          <button onClick={onClose} className="flex-grow rounded-2xl py-5 font-black border border-gray-200" type="button">放弃修改</button>
          <button onClick={save} disabled={saving} className="flex-grow rounded-2xl py-5 bg-[#153e35] text-white font-black disabled:opacity-60" type="button">
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AdminManufacturerCenter() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Manufacturer[]>([])
  const [search, setSearch] = useState('')
  const [activeM, setActiveM] = useState<Manufacturer | null>(null)
  const [showAccounts, setShowAccounts] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(m => (m.name || '').toLowerCase().includes(q) || (m.code || m.shortName || '').toLowerCase().includes(q))
  }, [items, search])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const res = await apiClient.get('/manufacturers', { params: { keyword: search, pageSize: 100 } })
        setItems(res.data?.data || [])
      } catch (e) {
        toast.error('获取厂家列表失败')
        setItems([])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [search])

  const refresh = async () => {
    try {
      const res = await apiClient.get('/manufacturers', { params: { keyword: search, pageSize: 100 } })
      setItems(res.data?.data || [])
    } catch {
      setItems([])
    }
  }

  const handleOpenTierSystem = (m: Manufacturer) => {
    localStorage.setItem('tier_system_selected_manufacturer', String(m._id))
    navigate('/admin/tier-system')
  }

  const handleOpenProductAuthorization = (m: Manufacturer) => {
    navigate(`/admin/manufacturers/${m._id}/product-authorization`)
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-4">
        <div>
          <h2 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">厂家中心管理系统</h2>
          <p className="text-gray-400 font-bold uppercase tracking-widest flex items-center gap-3">
            <span className="w-10 h-1 bg-[#153e35] rounded-full"></span>
            多级垂直分销链条与利润体系管控
          </p>
        </div>
        <div className="flex items-center gap-6">
          <input
            type="text"
            placeholder="搜索厂家名称..."
            className="pl-8 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-xl w-80 font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            onClick={() => {
              setActiveM(null)
              setShowEdit(true)
            }}
            className="rounded-[2rem] px-12 py-5 bg-[#153e35] text-white font-black text-lg shadow-2xl shadow-emerald-900/40"
            type="button"
          >
            + 品牌入驻
          </button>
        </div>
      </div>

      {loading ? (
        <div className="px-4 py-12 text-gray-400 font-bold">加载中...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 px-4">
          {filtered.map(m => {
            const name = m.name || m.fullName || ''
            const code = m.code || m.shortName || ''
            const logoSrc = m.logo ? getLogoSrc(m.logo, 200) : ''
            const quotaMax = m.accountQuota || {}
            const quotaCur = m.accountUsage || {}
            const authMax = Number(quotaMax.authAccounts || 0)
            const subMax = Number(quotaMax.subAccounts || 0)
            const desMax = Number(quotaMax.designerAccounts || 0)
            const authCur = Number(quotaCur.authAccounts || 0)
            const subCur = Number(quotaCur.subAccounts || 0)
            const desCur = Number(quotaCur.designerAccounts || 0)
            const totalQuota = authMax + subMax + desMax

            return (
              <div key={String(m._id)} className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden flex flex-col hover:-translate-y-3 transition-all duration-700 group relative">
                <div className="p-12 pb-8">
                  <div className="flex items-start gap-6 mb-10">
                    <div className="w-20 h-20 rounded-[2rem] bg-[#f9fbfc] border border-gray-100 p-4 shadow-inner flex items-center justify-center overflow-hidden">
                      {logoSrc ? <img src={logoSrc} alt={name} className="w-full h-full object-contain" /> : null}
                    </div>
                    <div className="min-w-0 pr-24">
                      <h3 className="text-3xl font-black text-gray-900 leading-tight truncate">{name}</h3>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{code}</div>
                    </div>
                  </div>

                  <div className="mb-10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black uppercase tracking-widest text-gray-400">账号总额</div>
                      <div className="bg-gray-100 px-3 py-1 rounded-lg text-[9px] font-black text-gray-500">{totalQuota}</div>
                    </div>
                    <div className="bg-[#fcfdfd] rounded-[2.5rem] p-8 border border-gray-50 shadow-inner">
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div>
                          <p className="text-2xl font-black text-gray-900">{authCur}/{authMax}</p>
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-1">授权主号</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-gray-900">{subCur}/{subMax}</p>
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-1">员工/子号</p>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-gray-900">{desCur}/{desMax}</p>
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-1">注册设计</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-auto grid grid-cols-2 p-6 gap-4 bg-gray-50/50 border-t">
                  <button
                    onClick={() => {
                      setActiveM(m)
                      setShowAccounts(true)
                    }}
                    className="py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black text-gray-600 hover:text-emerald-700 transition-all shadow-sm"
                    type="button"
                  >
                    账号管控
                  </button>
                  <button
                    onClick={() => handleOpenProductAuthorization(m)}
                    className="py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black text-gray-600 hover:text-indigo-700 transition-all shadow-sm"
                    type="button"
                  >
                    选品授权
                  </button>
                  <button
                    onClick={() => {
                      setActiveM(m)
                      setShowEdit(true)
                    }}
                    className="py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black text-gray-600 hover:border-[#153e35] transition-all shadow-sm"
                    type="button"
                  >
                    核心档案
                  </button>
                  <button
                    onClick={() => handleOpenTierSystem(m)}
                    className="py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black text-gray-600 hover:text-blue-700 transition-all shadow-sm"
                    type="button"
                  >
                    分层体系
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AccountManagementModal open={showAccounts} onClose={() => setShowAccounts(false)} manufacturer={activeM} onChanged={refresh} />
      <ManufacturerEditDrawer open={showEdit} onClose={() => setShowEdit(false)} manufacturer={activeM} onSaved={refresh} />
    </div>
  )
}
