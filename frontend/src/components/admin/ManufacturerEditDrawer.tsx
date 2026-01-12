// 厂家资料编辑抽屉组件 - 共享于管理员和厂家门户
import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/authStore'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import ImageUploader from '@/components/admin/ImageUploader'

// 厂家类型定义
export type Manufacturer = {
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
  paymentRatio?: {
    enabled?: boolean
    ratio?: number
  }
  invoiceSetting?: {
    enabled?: boolean
    ratio?: number
  }
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

interface ManufacturerEditDrawerProps {
  open: boolean
  onClose: () => void
  manufacturer: Manufacturer | null
  onSaved: () => void
  isFactoryPortal?: boolean // 是否为厂家门户模式（隐藏部分管理员字段）
}

export default function ManufacturerEditDrawer({
  open,
  onClose,
  manufacturer,
  onSaved,
  isFactoryPortal = false,
}: ManufacturerEditDrawerProps) {
  const isCreate = !manufacturer?._id
  const { user } = useAuthStore()
  const isSuperAdmin = useMemo(() => user?.role === 'super_admin', [user?.role])

  // 拼音首字母映射表（常用汉字）
  const pinyinMap: Record<string, string> = {
    '各': 'G', '色': 'S', '家': 'J', '具': 'J', '沙': 'S', '发': 'F',
    '床': 'C', '垫': 'D', '柜': 'G', '子': 'Z', '桌': 'Z', '椅': 'Y',
    '门': 'M', '窗': 'C', '灯': 'D', '饰': 'S', '皮': 'P', '革': 'G',
    '布': 'B', '艺': 'Y', '木': 'M', '材': 'C', '金': 'J', '属': 'S',
    '玻': 'B', '璃': 'L', '石': 'S', '瓷': 'C', '砖': 'Z',
    '地': 'D', '板': 'B', '墙': 'Q', '纸': 'Z', '涂': 'T', '料': 'L',
    '油': 'Y', '漆': 'Q', '水': 'S', '电': 'D', '暖': 'N', '通': 'T',
    '卫': 'W', '浴': 'Y', '厨': 'C', '房': 'F', '阳': 'Y', '台': 'T',
    '花': 'H', '园': 'Y', '景': 'J', '观': 'G', '装': 'Z', '修': 'X',
    '设': 'S', '计': 'J', '工': 'G', '程': 'C', '建': 'J', '筑': 'Z',
    '大': 'D', '小': 'X', '中': 'Z', '新': 'X', '旧': 'J', '好': 'H',
    '美': 'M', '丽': 'L', '华': 'H', '盛': 'S', '达': 'D',
    '宏': 'H', '伟': 'W', '鑫': 'X', '瑞': 'R', '祥': 'X', '福': 'F',
    '禄': 'L', '寿': 'S', '喜': 'X', '财': 'C', '宝': 'B', '贵': 'G',
    '顺': 'S', '利': 'L', '安': 'A', '康': 'K', '乐': 'L', '富': 'F',
    '强': 'Q', '盈': 'Y', '兴': 'X', '隆': 'L', '茂': 'M', '昌': 'C',
    '泰': 'T', '恒': 'H', '源': 'Y', '远': 'Y', '长': 'C', '久': 'J',
    '东': 'D', '西': 'X', '南': 'N', '北': 'B', '上': 'S', '下': 'X',
    '左': 'Z', '右': 'Y', '前': 'Q', '后': 'H', '里': 'L', '外': 'W',
    '红': 'H', '黄': 'H', '蓝': 'L', '绿': 'L', '白': 'B', '黑': 'H',
    '青': 'Q', '紫': 'Z', '橙': 'C', '粉': 'F', '灰': 'H', '棕': 'Z',
    '一': 'Y', '二': 'E', '三': 'S', '四': 'S', '五': 'W', '六': 'L',
    '七': 'Q', '八': 'B', '九': 'J', '十': 'S', '百': 'B', '千': 'Q',
    '万': 'W', '亿': 'Y', '零': 'L', '正': 'Z', '负': 'F', '加': 'J',
  }

  // 获取汉字拼音首字母
  const getPinyinInitial = (char: string): string => {
    if (/[a-zA-Z]/.test(char)) return char.toUpperCase()
    return pinyinMap[char] || char.charAt(0).toUpperCase()
  }

  // 自动生成厂家简称
  const generateShortName = (fullName: string): string => {
    if (!fullName) return ''
    const chars = fullName.slice(0, 2)
    return chars.split('').map(getPinyinInitial).join('')
  }

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
    paymentRatio: {
      enabled: boolean
      ratio: number
    }
    invoiceSetting: {
      enabled: boolean
      ratio: number
    }
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
      paymentRatio: {
        enabled: (m as any)?.paymentRatio?.enabled || false,
        ratio: Number((m as any)?.paymentRatio?.ratio || 100),
      },
      invoiceSetting: {
        enabled: (m as any)?.invoiceSetting?.enabled || false,
        ratio: Number((m as any)?.invoiceSetting?.ratio || 0),
      },
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
          paymentRatio: form.paymentRatio,
          invoiceSetting: form.invoiceSetting,
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
          ...(!isFactoryPortal && { accountQuota: form.accountQuota }),
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
                          <input value={form.fullName} onChange={e => {
                            const newFullName = e.target.value
                            setForm(prev => ({
                              ...prev,
                              fullName: newFullName,
                              shortName: prev.shortName || generateShortName(newFullName)
                            }))
                          }} onBlur={e => {
                            if (!form.shortName && e.target.value) {
                              setForm(prev => ({ ...prev, shortName: generateShortName(prev.fullName) }))
                            }
                          }} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">厂家简称（字母缩写）</div>
                          <input value={form.shortName} onChange={e => setForm(prev => ({ ...prev, shortName: e.target.value.toUpperCase() }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" placeholder="自动根据厂家全称生成" />
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
                    {!isFactoryPortal && (
                      <div>
                        <div className="text-xs font-black text-gray-400 uppercase tracking-widest">状态</div>
                        <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))} className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold">
                          <option value="active">启用</option>
                          <option value="inactive">停用</option>
                        </select>
                      </div>
                    )}
                  </div>
                </section>

                {!isFactoryPortal && (
                  <>
                    <section className="space-y-6">
                      <div className="text-sm font-black text-gray-900 uppercase tracking-widest border-l-4 border-amber-500 pl-4">03-1. 付款与开票规则</div>
                      
                      {/* 付款比例设置 */}
                      <div className="bg-white border border-gray-100 rounded-[2rem] p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm font-black text-gray-900">付款比例</div>
                            <div className="text-xs text-gray-500 mt-1">开启后客户下单需按比例付款</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, paymentRatio: { ...prev.paymentRatio, enabled: !prev.paymentRatio.enabled } }))}
                            className={`w-14 h-8 rounded-full transition-all ${form.paymentRatio.enabled ? 'bg-[#153e35]' : 'bg-gray-200'}`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${form.paymentRatio.enabled ? 'ml-7' : 'ml-1'}`} />
                          </button>
                        </div>
                        {form.paymentRatio.enabled && (
                          <div className="pt-4 border-t">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">付款比例</div>
                            <div className="flex gap-3">
                              {[50, 75, 100].map(ratio => (
                                <button
                                  key={ratio}
                                  type="button"
                                  onClick={() => setForm(prev => ({ ...prev, paymentRatio: { ...prev.paymentRatio, ratio } }))}
                                  className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
                                    form.paymentRatio.ratio === ratio
                                      ? 'bg-[#153e35] text-white'
                                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                  }`}
                                >
                                  {ratio}%
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 开票设置 */}
                      <div className="bg-white border border-gray-100 rounded-[2rem] p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <div className="text-sm font-black text-gray-900">开票加价</div>
                            <div className="text-xs text-gray-500 mt-1">开启后所有价格按比例加价（含税价）</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, invoiceSetting: { ...prev.invoiceSetting, enabled: !prev.invoiceSetting.enabled } }))}
                            className={`w-14 h-8 rounded-full transition-all ${form.invoiceSetting.enabled ? 'bg-[#153e35]' : 'bg-gray-200'}`}
                          >
                            <div className={`w-6 h-6 bg-white rounded-full shadow transition-all ${form.invoiceSetting.enabled ? 'ml-7' : 'ml-1'}`} />
                          </button>
                        </div>
                        {form.invoiceSetting.enabled && (
                          <div className="pt-4 border-t">
                            <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">加价比例 (%)</div>
                            <input
                              type="number"
                              value={form.invoiceSetting.ratio}
                              onChange={e => setForm(prev => ({ ...prev, invoiceSetting: { ...prev.invoiceSetting, ratio: Number(e.target.value || 0) } }))}
                              min="0"
                              max="100"
                              className="w-full px-5 py-3 rounded-2xl bg-amber-50/50 border border-amber-100 text-sm font-black text-amber-700"
                              placeholder="如：6 表示加价6%"
                            />
                            <div className="text-xs text-gray-400 mt-2">例如：商品价格100元，加价6%后显示为106元</div>
                          </div>
                        )}
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
                          <input 
                            type="number" 
                            value={form.accountQuota.totalAccounts} 
                            onChange={e => setForm(prev => ({ ...prev, accountQuota: { ...prev.accountQuota, totalAccounts: Number(e.target.value || 0) } }))} 
                            disabled={!isSuperAdmin}
                            className={`w-full mt-2 px-5 py-3 rounded-2xl border text-sm font-bold ${isSuperAdmin ? 'bg-emerald-50/30 border-emerald-100 text-emerald-700' : 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'}`}
                          />
                          {!isSuperAdmin && <div className="text-xs text-gray-400 mt-1">仅超级管理员可修改</div>}
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">已分配 / 剩余</div>
                          <div className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold">
                            {(form.accountQuota.authAccounts || 0) + (form.accountQuota.subAccounts || 0) + (form.accountQuota.designerAccounts || 0)} / {Math.max(0, (form.accountQuota.totalAccounts || 0) - (form.accountQuota.authAccounts || 0) - (form.accountQuota.subAccounts || 0) - (form.accountQuota.designerAccounts || 0))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">授权主号配额</div>
                          <input 
                            type="number" 
                            value={form.accountQuota.authAccounts} 
                            onChange={e => {
                              const newVal = Number(e.target.value || 0)
                              const total = form.accountQuota.totalAccounts || 0
                              const others = (form.accountQuota.subAccounts || 0) + (form.accountQuota.designerAccounts || 0)
                              if (total > 0 && newVal + others > total) {
                                return // 超过总配额不允许
                              }
                              setForm(prev => ({ ...prev, accountQuota: { ...prev.accountQuota, authAccounts: newVal } }))
                            }} 
                            className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" 
                          />
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">子账号配额</div>
                          <input 
                            type="number" 
                            value={form.accountQuota.subAccounts} 
                            onChange={e => {
                              const newVal = Number(e.target.value || 0)
                              const total = form.accountQuota.totalAccounts || 0
                              const others = (form.accountQuota.authAccounts || 0) + (form.accountQuota.designerAccounts || 0)
                              if (total > 0 && newVal + others > total) {
                                return
                              }
                              setForm(prev => ({ ...prev, accountQuota: { ...prev.accountQuota, subAccounts: newVal } }))
                            }} 
                            className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" 
                          />
                        </div>
                        <div>
                          <div className="text-xs font-black text-gray-400 uppercase tracking-widest">设计师配额</div>
                          <input 
                            type="number" 
                            value={form.accountQuota.designerAccounts} 
                            onChange={e => {
                              const newVal = Number(e.target.value || 0)
                              const total = form.accountQuota.totalAccounts || 0
                              const others = (form.accountQuota.authAccounts || 0) + (form.accountQuota.subAccounts || 0)
                              if (total > 0 && newVal + others > total) {
                                return
                              }
                              setForm(prev => ({ ...prev, accountQuota: { ...prev.accountQuota, designerAccounts: newVal } }))
                            }} 
                            className="w-full mt-2 px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-bold" 
                          />
                        </div>
                      </div>
                    </section>
                  </>
                )}
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
