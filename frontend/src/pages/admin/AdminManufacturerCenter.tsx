import { useCallback, useEffect, useMemo, useState } from 'react'
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
  isPreferred?: boolean
  expiryDate?: string | Date | null
  styleTags?: string[]
  defaultDiscount?: number
  defaultCommission?: number
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  address?: string
  certification?: {
    status?: 'none' | 'pending' | 'approved' | 'rejected'
    businessLicenseImage?: string
    creditCode?: string
    companyName?: string
    legalRepresentative?: string
    invoiceInfo?: {
      name?: string
      taxNumber?: string
      bankName?: string
      bankAccount?: string
      address?: string
      phone?: string
    }
  }
  settings?: {
    phone?: string
    servicePhone?: string
    wechatQrCode?: string
    alipayQrCode?: string
    businessLicense?: string
    paymentAccounts?: Array<{
      type?: 'bank' | 'wechat' | 'alipay'
      bankName?: string
      accountName?: string
      accountNumber?: string
    }>
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

const formatDateYmd = (v: any): string => {
  if (!v) return ''
  const d = v instanceof Date ? v : new Date(v)
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const SmsBindingModal = ({
  open,
  onClose,
  manufacturer,
}: {
  open: boolean
  onClose: () => void
  manufacturer: Manufacturer | null
}) => {
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [binding, setBinding] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [status, setStatus] = useState<{ phone: string; verifiedAt: string | null }>({ phone: '', verifiedAt: null })
  const [phoneInput, setPhoneInput] = useState('')
  const [codeInput, setCodeInput] = useState('')

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(t)
  }, [countdown])

  const loadStatus = useCallback(async () => {
    if (!manufacturer?._id) return
    try {
      setLoading(true)
      const res = await apiClient.get(`/manufacturers/${manufacturer._id}/sms/status`)
      if (res.data?.success) {
        setStatus({
          phone: res.data.data?.smsNotifyPhone || '',
          verifiedAt: res.data.data?.smsNotifyVerifiedAt || null,
        })
      } else {
        setStatus({ phone: '', verifiedAt: null })
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '加载短信绑定状态失败')
      setStatus({ phone: '', verifiedAt: null })
    } finally {
      setLoading(false)
    }
  }, [manufacturer?._id])

  useEffect(() => {
    if (!open) return
    setPhoneInput('')
    setCodeInput('')
    setCountdown(0)
    loadStatus()
  }, [open, loadStatus])

  const bindPhone = async (phone: string) => {
    if (!manufacturer?._id) return false
    const p = String(phone || '').trim()
    if (!p) {
      toast.error('请输入手机号')
      return false
    }
    try {
      setBinding(true)
      const res = await apiClient.post(`/manufacturers/${manufacturer._id}/sms/bind`, { phone: p })
      if (res.data?.success) {
        await loadStatus()
        return true
      }
      toast.error(res.data?.message || '绑定失败')
      return false
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '绑定失败')
      return false
    } finally {
      setBinding(false)
    }
  }

  const handleSendCode = async () => {
    if (!manufacturer?._id) return
    try {
      setSending(true)
      if (!status.phone) {
        const ok = await bindPhone(phoneInput)
        if (!ok) return
      }
      const res = await apiClient.post(`/manufacturers/${manufacturer._id}/sms/send-code`, {})
      if (res.data?.success) {
        toast.success('验证码已发送')
        setCountdown(60)
      } else {
        toast.error(res.data?.message || '发送失败')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '发送失败')
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async () => {
    if (!manufacturer?._id) return
    if (!codeInput.trim()) {
      toast.error('请输入验证码')
      return
    }
    try {
      setBinding(true)
      const res = await apiClient.post(`/manufacturers/${manufacturer._id}/sms/verify`, { code: codeInput.trim() })
      if (res.data?.success) {
        toast.success('验证成功')
        setCodeInput('')
        await loadStatus()
      } else {
        toast.error(res.data?.message || '验证失败')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '验证失败')
    } finally {
      setBinding(false)
    }
  }

  const handleUnbind = async () => {
    if (!manufacturer?._id) return
    try {
      setBinding(true)
      const res = await apiClient.post(`/manufacturers/${manufacturer._id}/sms/unbind`, {})
      if (res.data?.success) {
        toast.success('已解绑')
        setCodeInput('')
        setPhoneInput('')
        await loadStatus()
      } else {
        toast.error(res.data?.message || '解绑失败')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '解绑失败')
    } finally {
      setBinding(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-[720px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 border-b flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-gray-900">短信绑定</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{manufacturer?.name || ''}</div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400" type="button">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <div className="p-8 space-y-6">
          {loading ? (
            <div className="text-sm font-bold text-gray-400">加载中...</div>
          ) : (
            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100">
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest">当前绑定</div>
              <div className="mt-3 flex flex-col gap-1">
                <div className="text-lg font-black text-gray-900">{status.phone || '-'}</div>
                <div className="text-xs font-bold text-gray-400">
                  {status.verifiedAt ? `已验证：${String(status.verifiedAt).slice(0, 19).replace('T', ' ')}` : '未验证'}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">绑定手机号（如需更换，输入新号码并点击绑定）</div>
            <input
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold"
              placeholder="请输入手机号"
            />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <button
                onClick={() => bindPhone(phoneInput)}
                disabled={binding}
                className="rounded-2xl py-4 bg-[#153e35] text-white font-black disabled:opacity-60"
                type="button"
              >
                {binding ? '处理中...' : '绑定手机号'}
              </button>
              <button
                onClick={handleSendCode}
                disabled={sending || countdown > 0 || (!status.phone && !phoneInput)}
                className="rounded-2xl py-4 bg-white border border-gray-200 font-black text-gray-700 disabled:opacity-60"
                type="button"
              >
                {countdown > 0 ? `重新发送(${countdown}s)` : sending ? '发送中...' : '发送验证码'}
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">验证码</div>
            <input
              value={codeInput}
              onChange={e => setCodeInput(e.target.value)}
              className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold"
              placeholder="请输入验证码"
            />
            <div className="mt-4 grid grid-cols-2 gap-4">
              <button
                onClick={handleVerify}
                disabled={binding || !codeInput.trim()}
                className="rounded-2xl py-4 bg-blue-600 text-white font-black disabled:opacity-60"
                type="button"
              >
                {binding ? '处理中...' : '验证'}
              </button>
              <button
                onClick={handleUnbind}
                disabled={binding || !status.phone}
                className="rounded-2xl py-4 bg-white border border-red-200 font-black text-red-600 disabled:opacity-60"
                type="button"
              >
                {binding ? '处理中...' : '解绑'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-8 border-t bg-white flex gap-6">
          <button onClick={onClose} className="flex-grow rounded-2xl py-5 font-black border border-gray-200" type="button">关闭</button>
        </div>
      </div>
    </div>
  )
}

const getLogoSrc = (logo: any, size: number) => {
  const id = normalizeFileId(logo)
  if (!id) return ''
  return getThumbnailUrl(id, size)
}

const getAccountTypeLabel = (t: ManufacturerAccount['accountType']) => {
  if (t === 'auth') return '主账号'
  if (t === 'sub') return '子账号'
  if (t === 'normal') return '合作账号'
  if (t === 'designer') return '设计师'
  return t
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
            <div className="text-3xl font-black text-gray-900">厂家账号管理</div>
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
                <option value="auth">主账号</option>
                <option value="sub">子账号</option>
                <option value="normal">合作账号</option>
                <option value="designer">设计师</option>
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
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{getAccountTypeLabel(acc.accountType)}</div>
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
                    <option value="auth">主账号</option>
                    <option value="sub">子账号</option>
                    <option value="normal">合作账号</option>
                    <option value="designer">设计师</option>
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
  const [activeSec, setActiveSec] = useState<'base' | 'payment' | 'legal'>('base')
  const [form, setForm] = useState<{
    fullName: string
    shortName: string
    code: string
    contactName: string
    contactPhone: string
    contactEmail: string
    address: string
    description: string
    status: 'active' | 'inactive'
    logo: string
    defaultDiscount: number
    defaultCommission: number
    accountQuota: {
      authAccounts: number
      subAccounts: number
      designerAccounts: number
      totalAccounts: number
    }
    certification: {
      businessLicenseImage: string
      creditCode: string
      companyName: string
      legalRepresentative: string
      invoiceInfo: {
        name: string
        taxNumber: string
        bankName: string
        bankAccount: string
        address: string
        phone: string
      }
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
      paymentAccounts: Array<{
        type: 'bank' | 'wechat' | 'alipay'
        bankName: string
        accountName: string
        accountNumber: string
      }>
    }
  }>(null as any)

  const hydrate = (m?: Manufacturer | null) => {
    const quota = m?.accountQuota || {}
    const paymentAccountsRaw = Array.isArray(m?.settings?.paymentAccounts) ? m?.settings?.paymentAccounts : []
    const paymentAccounts = paymentAccountsRaw.length
      ? paymentAccountsRaw.map((p: any) => ({
          type: (p?.type || 'bank') as any,
          bankName: p?.bankName || '',
          accountName: p?.accountName || '',
          accountNumber: p?.accountNumber || '',
        }))
      : [
          {
            type: 'bank' as const,
            bankName: m?.settings?.bankInfo?.bankName || '',
            accountName: m?.settings?.bankInfo?.accountName || '',
            accountNumber: m?.settings?.bankInfo?.accountNumber || '',
          },
        ]

    setForm({
      fullName: m?.fullName || m?.name || '',
      shortName: m?.shortName || '',
      code: m?.code || '',
      contactName: m?.contactName || '',
      contactPhone: m?.contactPhone || '',
      contactEmail: m?.contactEmail || '',
      address: m?.address || '',
      description: m?.description || '',
      status: (m?.status || 'active') as any,
      logo: normalizeFileId(m?.logo) || '',
      defaultDiscount: Number((m as any)?.defaultDiscount || 0),
      defaultCommission: Number((m as any)?.defaultCommission || 0),
      accountQuota: {
        authAccounts: Number(quota.authAccounts || 0),
        subAccounts: Number(quota.subAccounts || 0),
        designerAccounts: Number(quota.designerAccounts || 0),
        totalAccounts: Number(quota.totalAccounts || 0),
      },
      certification: {
        businessLicenseImage: (m as any)?.certification?.businessLicenseImage || normalizeFileId(m?.settings?.businessLicense) || '',
        creditCode: (m as any)?.certification?.creditCode || '',
        companyName: (m as any)?.certification?.companyName || '',
        legalRepresentative: (m as any)?.certification?.legalRepresentative || '',
        invoiceInfo: {
          name: (m as any)?.certification?.invoiceInfo?.name || '',
          taxNumber: (m as any)?.certification?.invoiceInfo?.taxNumber || '',
          bankName: (m as any)?.certification?.invoiceInfo?.bankName || '',
          bankAccount: (m as any)?.certification?.invoiceInfo?.bankAccount || '',
          address: (m as any)?.certification?.invoiceInfo?.address || '',
          phone: (m as any)?.certification?.invoiceInfo?.phone || '',
        },
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
        paymentAccounts,
      },
    })
  }

  useEffect(() => {
    if (!open) return
    setActiveSec('base')
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

  const certLocked = (manufacturer as any)?.certification?.status === 'approved'

  const save = async () => {
    if (!form.fullName.trim()) {
      toast.error('请输入厂家全称')
      return
    }
    if (!form.shortName.trim()) {
      toast.error('请输入厂家简称')
      return
    }

    const hasCertification = (() => {
      const inv = form.certification?.invoiceInfo
      const values = [
        form.settings?.businessLicense,
        form.certification?.businessLicenseImage,
        form.certification?.creditCode,
        form.certification?.companyName,
        form.certification?.legalRepresentative,
        inv?.name,
        inv?.taxNumber,
        inv?.bankName,
        inv?.bankAccount,
        inv?.address,
        inv?.phone,
      ]
      return values.some(v => String(v || '').trim())
    })()

    const certificationPayload = {
      businessLicenseImage: normalizeFileId(form.settings.businessLicense) || form.certification.businessLicenseImage,
      creditCode: form.certification.creditCode,
      companyName: form.certification.companyName,
      legalRepresentative: form.certification.legalRepresentative,
      invoiceInfo: {
        ...form.certification.invoiceInfo,
      },
    }

    try {
      setSaving(true)
      if (isCreate) {
        const res = await apiClient.post('/manufacturers', {
          fullName: form.fullName,
          shortName: form.shortName,
          contactName: form.contactName,
          contactPhone: form.contactPhone,
          contactEmail: form.contactEmail,
          address: form.address,
          description: form.description,
          logo: normalizeFileId(form.logo),
          status: form.status,
          defaultDiscount: form.defaultDiscount,
          defaultCommission: form.defaultCommission,
        })

        const createdId = res.data?.data?._id
        if (createdId && hasCertification && !certLocked) {
          await apiClient.post(`/manufacturers/${createdId}/certification`, {
            certification: certificationPayload,
          })
        }

        toast.success('创建成功')
      } else {
        const paymentAccounts = Array.isArray(form.settings.paymentAccounts) ? form.settings.paymentAccounts : []
        const firstBank = paymentAccounts.find(p => p?.type === 'bank')
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
          defaultDiscount: form.defaultDiscount,
          defaultCommission: form.defaultCommission,
          settings: {
            phone: form.settings.phone,
            servicePhone: form.settings.servicePhone,
            wechatQrCode: normalizeFileId(form.settings.wechatQrCode),
            alipayQrCode: normalizeFileId(form.settings.alipayQrCode),
            businessLicense: normalizeFileId(form.settings.businessLicense),
            companyAddress: form.settings.companyAddress,
            bankInfo: {
              bankName: firstBank?.bankName || form.settings.bankInfo.bankName,
              accountName: firstBank?.accountName || form.settings.bankInfo.accountName,
              accountNumber: firstBank?.accountNumber || form.settings.bankInfo.accountNumber,
            },
            paymentAccounts,
          },
          accountQuota: form.accountQuota,
        })

        if (hasCertification && !certLocked) {
          await apiClient.post(`/manufacturers/${manufacturer!._id}/certification`, {
            certification: certificationPayload,
          })
        }

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
      <div className="relative w-full max-w-5xl bg-white shadow-2xl h-full flex flex-col overflow-hidden">
        <div className="p-10 border-b bg-white flex items-center justify-between">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{isCreate ? '厂家入驻申请' : '厂家资料管理'}</h2>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Manufacturer Profile Management</p>
          </div>
          <button onClick={onClose} className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400" type="button">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6" /></svg>
          </button>
        </div>

        <nav className="flex px-10 py-6 bg-white border-b gap-12 shrink-0">
          {(['base', 'payment', 'legal'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveSec(t)}
              className={`py-2 border-b-4 font-black text-xs uppercase tracking-widest transition-all ${activeSec === t ? 'border-[#153e35] text-[#153e35]' : 'border-transparent text-gray-300'}`}
              type="button"
            >
              {t === 'base' ? '基础档案' : t === 'payment' ? '结算账户配置' : '资质与开票'}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="p-10 text-gray-400 font-bold">加载中...</div>
        ) : (
          <div className="flex-grow overflow-y-auto custom-scrollbar p-10">
            {activeSec === 'base' && (
              <div className="space-y-10">
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
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">厂家ID</div>
                          <input value={form.code} disabled className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold text-gray-500" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">厂家全称</div>
                          <input value={form.fullName} onChange={e => setForm(prev => ({ ...prev, fullName: e.target.value }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">厂家简称（字母缩写）</div>
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
                  <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 mb-4">
                    <div className="text-xs font-bold text-amber-700">💡 说明：账号配额总数仅超级管理员可设置，各类型账号数量之和不能超过总配额</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">账号配额总数</div>
                      <input type="number" value={form.accountQuota.totalAccounts} onChange={e => setForm(prev => ({ ...prev, accountQuota: { ...prev.accountQuota, totalAccounts: Number(e.target.value || 0) } }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-emerald-50/30 border border-emerald-100 text-sm font-bold text-emerald-700" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">已分配 / 剩余</div>
                      <div className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold">
                        {(form.accountQuota.authAccounts || 0) + (form.accountQuota.subAccounts || 0) + (form.accountQuota.designerAccounts || 0)} / {Math.max(0, (form.accountQuota.totalAccounts || 0) - (form.accountQuota.authAccounts || 0) - (form.accountQuota.subAccounts || 0) - (form.accountQuota.designerAccounts || 0))}
                      </div>
                    </div>
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
                  </div>
                </section>
              </div>
            )}

            {activeSec === 'payment' && (
              <div className="space-y-10">
                <section className="space-y-6">
                  <div className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-[#153e35] pl-4">01. 收款码</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ImageUploader images={form.settings.wechatQrCode ? [form.settings.wechatQrCode] : []} onChange={imgs => setForm(prev => ({ ...prev, settings: { ...prev.settings, wechatQrCode: imgs[0] || '' } }))} multiple={false} label="上传微信收款码" />
                    <ImageUploader images={form.settings.alipayQrCode ? [form.settings.alipayQrCode] : []} onChange={imgs => setForm(prev => ({ ...prev, settings: { ...prev.settings, alipayQrCode: imgs[0] || '' } }))} multiple={false} label="上传支付宝收款码" />
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-[#153e35] pl-4">02. 银行/三方结算信息</div>
                  <div className="space-y-4">
                    {(form.settings.paymentAccounts || []).map((p, idx) => (
                      <div key={idx} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            {(['bank', 'wechat', 'alipay'] as const).map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => {
                                  setForm(prev => {
                                    const next = { ...prev }
                                    const arr = [...next.settings.paymentAccounts]
                                    arr[idx] = { ...arr[idx], type: t }
                                    next.settings = { ...next.settings, paymentAccounts: arr }
                                    return next
                                  })
                                }}
                                className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${p.type === t ? 'bg-[#153e35] text-white border-[#153e35]' : 'bg-gray-50 text-gray-500 border-gray-100'}`}
                              >
                                {t === 'bank' ? '银行' : t === 'wechat' ? '微信' : '支付宝'}
                              </button>
                            ))}
                          </div>
                          {(form.settings.paymentAccounts || []).length > 1 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setForm(prev => {
                                  const next = { ...prev }
                                  const arr = [...next.settings.paymentAccounts]
                                  arr.splice(idx, 1)
                                  next.settings = { ...next.settings, paymentAccounts: arr }
                                  return next
                                })
                              }}
                              className="text-[10px] font-black uppercase tracking-widest text-red-500"
                            >
                              移除该账户
                            </button>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">开户银行/平台全称</div>
                            <input
                              value={p.bankName}
                              onChange={e => {
                                const v = e.target.value
                                setForm(prev => {
                                  const next = { ...prev }
                                  const arr = [...next.settings.paymentAccounts]
                                  arr[idx] = { ...arr[idx], bankName: v }
                                  next.settings = { ...next.settings, paymentAccounts: arr }
                                  return next
                                })
                              }}
                              className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold"
                              placeholder="招商银行 / 支付宝..."
                            />
                          </div>
                          <div>
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">收款人/实名姓名</div>
                            <input
                              value={p.accountName}
                              onChange={e => {
                                const v = e.target.value
                                setForm(prev => {
                                  const next = { ...prev }
                                  const arr = [...next.settings.paymentAccounts]
                                  arr[idx] = { ...arr[idx], accountName: v }
                                  next.settings = { ...next.settings, paymentAccounts: arr }
                                  return next
                                })
                              }}
                              className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest">卡号 / UID / 账号</div>
                            <input
                              value={p.accountNumber}
                              onChange={e => {
                                const v = e.target.value
                                setForm(prev => {
                                  const next = { ...prev }
                                  const arr = [...next.settings.paymentAccounts]
                                  arr[idx] = { ...arr[idx], accountNumber: v }
                                  next.settings = { ...next.settings, paymentAccounts: arr }
                                  return next
                                })
                              }}
                              className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            paymentAccounts: [
                              ...(prev.settings.paymentAccounts || []),
                              { type: 'bank', bankName: '', accountName: '', accountNumber: '' }
                            ]
                          }
                        }))
                      }}
                      className="w-full py-5 border-2 border-dashed border-gray-200 rounded-[2rem] text-xs font-black text-gray-500 hover:text-[#153e35]"
                    >
                      + 新增财务结算方式
                    </button>
                  </div>
                </section>
              </div>
            )}

            {activeSec === 'legal' && (
              <div className="space-y-10">
                <section className="space-y-6">
                  <div className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-blue-500 pl-4">01. 资质合规：营业执照认证</div>
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2.5rem] p-10">
                    <div className="max-w-md">
                      <ImageUploader
                        images={form.settings.businessLicense ? [form.settings.businessLicense] : []}
                        onChange={imgs =>
                          setForm(prev => ({
                            ...prev,
                            certification: { ...prev.certification, businessLicenseImage: imgs[0] || '' },
                            settings: { ...prev.settings, businessLicense: imgs[0] || '' }
                          }))
                        }
                        multiple={false}
                        label="上传营业执照"
                      />
                    </div>
                    <div className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      需确保执照处于有效期内，公章清晰。支持 JPG、PDF 格式。
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-emerald-500 pl-4">02. 税务开票资料</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">企业名称</div>
                      <input value={form.certification.companyName} onChange={e => setForm(prev => ({ ...prev, certification: { ...prev.certification, companyName: e.target.value } }))} disabled={certLocked} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold disabled:opacity-70" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">统一社会信用代码</div>
                      <input value={form.certification.creditCode} onChange={e => setForm(prev => ({ ...prev, certification: { ...prev.certification, creditCode: e.target.value } }))} disabled={certLocked} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold disabled:opacity-70" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">法人代表</div>
                      <input value={form.certification.legalRepresentative} onChange={e => setForm(prev => ({ ...prev, certification: { ...prev.certification, legalRepresentative: e.target.value } }))} disabled={certLocked} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold disabled:opacity-70" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">开票名称</div>
                      <input value={form.certification.invoiceInfo.name} onChange={e => setForm(prev => ({ ...prev, certification: { ...prev.certification, invoiceInfo: { ...prev.certification.invoiceInfo, name: e.target.value } } }))} disabled={certLocked} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold disabled:opacity-70" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">税号</div>
                      <input value={form.certification.invoiceInfo.taxNumber} onChange={e => setForm(prev => ({ ...prev, certification: { ...prev.certification, invoiceInfo: { ...prev.certification.invoiceInfo, taxNumber: e.target.value } } }))} disabled={certLocked} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold disabled:opacity-70" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">开户银行</div>
                      <input value={form.certification.invoiceInfo.bankName} onChange={e => setForm(prev => ({ ...prev, certification: { ...prev.certification, invoiceInfo: { ...prev.certification.invoiceInfo, bankName: e.target.value } } }))} disabled={certLocked} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold disabled:opacity-70" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">银行账号</div>
                      <input value={form.certification.invoiceInfo.bankAccount} onChange={e => setForm(prev => ({ ...prev, certification: { ...prev.certification, invoiceInfo: { ...prev.certification.invoiceInfo, bankAccount: e.target.value } } }))} disabled={certLocked} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold disabled:opacity-70" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">企业地址</div>
                      <input value={form.certification.invoiceInfo.address} onChange={e => setForm(prev => ({ ...prev, certification: { ...prev.certification, invoiceInfo: { ...prev.certification.invoiceInfo, address: e.target.value } } }))} disabled={certLocked} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold disabled:opacity-70" />
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest">企业电话</div>
                      <input value={form.certification.invoiceInfo.phone} onChange={e => setForm(prev => ({ ...prev, certification: { ...prev.certification, invoiceInfo: { ...prev.certification.invoiceInfo, phone: e.target.value } } }))} disabled={certLocked} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold disabled:opacity-70" />
                    </div>
                  </div>
                </section>
              </div>
            )}
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
  const [showSms, setShowSms] = useState(false)
  const [smsTarget, setSmsTarget] = useState<Manufacturer | null>(null)
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null)

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

  const updateManufacturer = async (manufacturerId: string, payload: any) => {
    const prev = items
    setItems(prevItems =>
      prevItems.map(x => {
        if (String(x._id) !== String(manufacturerId)) return x
        const next: any = { ...x, ...payload }
        if (payload?.accountQuota) {
          next.accountQuota = { ...(x as any).accountQuota, ...payload.accountQuota }
        }
        if (payload?.settings) {
          next.settings = { ...(x as any).settings, ...payload.settings }
        }
        return next
      })
    )
    try {
      await apiClient.put(`/manufacturers/${manufacturerId}`, payload)
    } catch (e: any) {
      setItems(prev)
      toast.error(e?.response?.data?.message || '保存失败')
    }
  }

  const handleUpdateField = async (manufacturerId: string, field: string, value: string) => {
    if (!manufacturerId) return

    if (field === 'discount') {
      await updateManufacturer(manufacturerId, { defaultDiscount: Number(value) || 0 })
      return
    }
    if (field === 'commission') {
      await updateManufacturer(manufacturerId, { defaultCommission: Number(value) || 0 })
      return
    }
    if (field === 'expiryDate') {
      await updateManufacturer(manufacturerId, { expiryDate: value ? new Date(value).toISOString() : null })
      return
    }
    if (field === 'styleTags') {
      const tags = value
        .split(',')
        .map(v => v.trim())
        .filter(Boolean)
      await updateManufacturer(manufacturerId, { styleTags: tags })
      return
    }
    if (field === 'quota-total') {
      await updateManufacturer(manufacturerId, { accountQuota: { totalAccounts: Number(value) || 0 } })
      return
    }
    if (field.startsWith('quota-')) {
      const key = field.split('-')[1]
      const nextVal = Number(value) || 0
      const m = items.find(x => String(x._id) === String(manufacturerId))
      const existing = m?.accountQuota || {}
      const nextQuota = {
        ...existing,
        [key]: nextVal,
      }
      const sum = Number(nextQuota.authAccounts || 0) + Number(nextQuota.subAccounts || 0) + Number(nextQuota.designerAccounts || 0)
      if (!('totalAccounts' in nextQuota) || Number(nextQuota.totalAccounts || 0) === 0) {
        nextQuota.totalAccounts = sum
      }
      await updateManufacturer(manufacturerId, { accountQuota: nextQuota })
      return
    }
  }

  const handleOpenTierSystem = (m: Manufacturer, tab?: 'hierarchy' | 'pool' | 'reconciliation') => {
    localStorage.setItem('tier_system_selected_manufacturer', String(m._id))
    navigate(`/admin/tier-hierarchy?manufacturerId=${m._id}`)
  }

  const handleOpenProductAuthorization = (m: Manufacturer) => {
    navigate(`/admin/manufacturers/${m._id}/product-authorization`)
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 px-4">
        <div>
          <h2 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">厂家管理</h2>
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
            + 新建厂家
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
            const totalQuota = Number(quotaMax.totalAccounts || 0) || authMax + subMax + desMax
            const isPreferred = Boolean(m.isPreferred)
            const expiryText = formatDateYmd(m.expiryDate)
            const tags = Array.isArray(m.styleTags) ? m.styleTags : []
            const defaultDiscount = Number(m.defaultDiscount || 0)
            const defaultCommission = Number(m.defaultCommission || 0)

            return (
              <div
                key={String(m._id)}
                className={`bg-white rounded-[3.5rem] border ${isPreferred ? 'border-amber-200 ring-4 ring-amber-50' : 'border-gray-100 shadow-gray-200/20'} shadow-2xl overflow-hidden flex flex-col hover:-translate-y-3 transition-all duration-700 group relative`}
              >
                <div className="absolute top-0 right-0 p-8 flex flex-col items-end gap-3 z-20">
                  <button
                    onClick={() => updateManufacturer(String(m._id), { isPreferred: !isPreferred })}
                    className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isPreferred ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-xl' : 'bg-white text-gray-400 border-gray-100 hover:border-amber-200'}`}
                    type="button"
                  >
                    {isPreferred ? '优质厂家 ★' : '设为优质'}
                  </button>
                  <div
                    className="px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-500 border border-blue-100 cursor-pointer"
                    onClick={() => setEditingField({ id: String(m._id), field: 'expiryDate' })}
                  >
                    {editingField?.id === String(m._id) && editingField?.field === 'expiryDate' ? (
                      <input
                        autoFocus
                        type="date"
                        defaultValue={expiryText}
                        onBlur={e => {
                          handleUpdateField(String(m._id), 'expiryDate', e.target.value)
                          setEditingField(null)
                        }}
                        className="bg-transparent outline-none"
                      />
                    ) : (
                      <>效期至: {expiryText || '--'}</>
                    )}
                  </div>
                </div>

                <div className="p-12 pb-8">
                  <div className="flex items-start gap-6 mb-10">
                    <button
                      type="button"
                      className="w-20 h-20 rounded-[2rem] bg-[#f9fbfc] border border-gray-100 p-4 shadow-inner flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => {
                        setActiveM(m)
                        setShowEdit(true)
                      }}
                    >
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt={name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-[10px] font-black text-gray-300">点击编辑</div>
                      )}
                    </button>
                    <div className="min-w-0 pr-24">
                      <h3 className="text-3xl font-black text-gray-900 leading-tight truncate">{name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-2" onClick={() => setEditingField({ id: String(m._id), field: 'styleTags' })}>
                        {editingField?.id === String(m._id) && editingField?.field === 'styleTags' ? (
                          <input
                            autoFocus
                            defaultValue={tags.join(',')}
                            onBlur={e => {
                              handleUpdateField(String(m._id), 'styleTags', e.target.value)
                              setEditingField(null)
                            }}
                            className="w-full text-[10px] font-black bg-transparent outline-none border-b border-gray-200"
                          />
                        ) : (
                          <>
                            {tags.map(tag => (
                              <span key={tag} className="text-[9px] font-black px-2 py-0.5 bg-gray-50 text-gray-400 rounded-lg border">
                                {tag}
                              </span>
                            ))}
                            {!tags.length ? (
                              <span className="text-[9px] font-black px-2 py-0.5 bg-gray-50 text-gray-300 rounded-lg border">点击添加标签</span>
                            ) : null}
                          </>
                        )}
                      </div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">{code}</div>
                    </div>
                  </div>

                  <div className="mb-8 grid grid-cols-2 gap-4">
                    <div
                      className="bg-emerald-50/50 rounded-[2rem] p-6 border border-emerald-100 text-center cursor-pointer hover:bg-emerald-100/50 transition-all"
                      onClick={() => setEditingField({ id: String(m._id), field: 'discount' })}
                    >
                      <p className="text-[9px] font-black text-emerald-700/60 uppercase tracking-widest mb-1">最低折扣</p>
                      {editingField?.id === String(m._id) && editingField?.field === 'discount' ? (
                        <input
                          autoFocus
                          type="number"
                          defaultValue={defaultDiscount}
                          onBlur={e => {
                            handleUpdateField(String(m._id), 'discount', e.target.value)
                            setEditingField(null)
                          }}
                          className="w-full text-center bg-transparent text-3xl font-black text-[#153e35] outline-none"
                        />
                      ) : (
                        <p className="text-3xl font-black text-[#153e35]">{defaultDiscount}%</p>
                      )}
                    </div>
                    <div
                      className="bg-emerald-50/50 rounded-[2rem] p-6 border border-emerald-100 text-center cursor-pointer hover:bg-emerald-100/50 transition-all"
                      onClick={() => setEditingField({ id: String(m._id), field: 'commission' })}
                    >
                      <p className="text-[9px] font-black text-emerald-700/60 uppercase tracking-widest mb-1">返佣比例</p>
                      {editingField?.id === String(m._id) && editingField?.field === 'commission' ? (
                        <input
                          autoFocus
                          type="number"
                          defaultValue={defaultCommission}
                          onBlur={e => {
                            handleUpdateField(String(m._id), 'commission', e.target.value)
                            setEditingField(null)
                          }}
                          className="w-full text-center bg-transparent text-3xl font-black text-emerald-600 outline-none"
                        />
                      ) : (
                        <p className="text-3xl font-black text-emerald-600">{defaultCommission}%</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-10 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-black uppercase tracking-widest text-gray-400">账号总额</div>
                      <div
                        className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-black text-gray-700 cursor-pointer"
                        onClick={() => setEditingField({ id: String(m._id), field: 'quota-total' })}
                      >
                        {editingField?.id === String(m._id) && editingField?.field === 'quota-total' ? (
                          <input
                            autoFocus
                            type="number"
                            defaultValue={totalQuota}
                            onBlur={e => {
                              handleUpdateField(String(m._id), 'quota-total', e.target.value)
                              setEditingField(null)
                            }}
                            className="w-28 text-center bg-transparent outline-none"
                          />
                        ) : (
                          Number(totalQuota || 0).toLocaleString()
                        )}
                      </div>
                    </div>
                    <div className="bg-[#fcfdfd] rounded-[2.5rem] p-8 border border-gray-50 shadow-inner">
                      <div className="grid grid-cols-3 gap-6 text-center">
                        <div
                          className="cursor-pointer hover:bg-emerald-50 rounded-xl p-1 transition-all"
                          onClick={() => setEditingField({ id: String(m._id), field: 'quota-authAccounts' })}
                        >
                          {editingField?.id === String(m._id) && editingField?.field === 'quota-authAccounts' ? (
                            <input
                              autoFocus
                              type="number"
                              defaultValue={authMax}
                              onBlur={e => {
                                handleUpdateField(String(m._id), 'quota-authAccounts', e.target.value)
                                setEditingField(null)
                              }}
                              className="w-full text-center bg-transparent text-xl font-black text-gray-900 outline-none"
                            />
                          ) : (
                            <p className="text-2xl font-black text-gray-900">{authCur}/{authMax}</p>
                          )}
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-1">授权主号</p>
                        </div>
                        <div
                          className="cursor-pointer hover:bg-emerald-50 rounded-xl p-1 transition-all"
                          onClick={() => setEditingField({ id: String(m._id), field: 'quota-subAccounts' })}
                        >
                          {editingField?.id === String(m._id) && editingField?.field === 'quota-subAccounts' ? (
                            <input
                              autoFocus
                              type="number"
                              defaultValue={subMax}
                              onBlur={e => {
                                handleUpdateField(String(m._id), 'quota-subAccounts', e.target.value)
                                setEditingField(null)
                              }}
                              className="w-full text-center bg-transparent text-xl font-black text-gray-900 outline-none"
                            />
                          ) : (
                            <p className="text-2xl font-black text-gray-900">{subCur}/{subMax}</p>
                          )}
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-tighter mt-1">员工/子号</p>
                        </div>
                        <div
                          className="cursor-pointer hover:bg-emerald-50 rounded-xl p-1 transition-all"
                          onClick={() => setEditingField({ id: String(m._id), field: 'quota-designerAccounts' })}
                        >
                          {editingField?.id === String(m._id) && editingField?.field === 'quota-designerAccounts' ? (
                            <input
                              autoFocus
                              type="number"
                              defaultValue={desMax}
                              onBlur={e => {
                                handleUpdateField(String(m._id), 'quota-designerAccounts', e.target.value)
                                setEditingField(null)
                              }}
                              className="w-full text-center bg-transparent text-xl font-black text-gray-900 outline-none"
                            />
                          ) : (
                            <p className="text-2xl font-black text-gray-900">{desCur}/{desMax}</p>
                          )}
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
                      setShowEdit(true)
                    }}
                    className="py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black text-gray-600 hover:border-[#153e35] hover:text-[#153e35] transition-all shadow-sm"
                    type="button"
                  >
                    资料编辑
                  </button>
                  <button
                    onClick={() => handleOpenTierSystem(m, 'hierarchy')}
                    className="py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black text-gray-600 hover:text-purple-700 hover:border-purple-200 transition-all shadow-sm"
                    type="button"
                  >
                    分层体系
                  </button>
                  <button
                    onClick={() => handleOpenTierSystem(m, 'pool')}
                    className="py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black text-gray-600 hover:text-emerald-700 hover:border-emerald-200 transition-all shadow-sm"
                    type="button"
                  >
                    角色授权
                  </button>
                  <button
                    onClick={() => handleOpenProductAuthorization(m)}
                    className="py-4 bg-white border border-gray-100 rounded-[1.5rem] text-xs font-black text-gray-600 hover:text-blue-700 hover:border-blue-200 transition-all shadow-sm"
                    type="button"
                  >
                    选品授权
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AccountManagementModal open={showAccounts} onClose={() => setShowAccounts(false)} manufacturer={activeM} onChanged={refresh} />
      <ManufacturerEditDrawer open={showEdit} onClose={() => setShowEdit(false)} manufacturer={activeM} onSaved={refresh} />
      <SmsBindingModal
        open={showSms}
        onClose={() => {
          setShowSms(false)
          setSmsTarget(null)
        }}
        manufacturer={smsTarget}
      />
    </div>
  )
}
