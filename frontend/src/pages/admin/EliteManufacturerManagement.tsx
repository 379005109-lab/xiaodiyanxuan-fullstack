import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'
import { getThumbnailUrl } from '@/services/uploadService'
import { useAuthStore } from '@/store/authStore'

interface Manufacturer {
  _id: string
  name: string
  fullName?: string
  shortName?: string
  code?: string
  logo?: string
  description?: string
  status?: 'active' | 'inactive'
}

interface CategoryItem {
  id: string
  name: string
  parentId: string | null
  count: number
}

interface ManufacturerMeta {
  totalProducts: number
  topCategories: CategoryItem[]
  previewImages: string[]
  tierRule?: {
    profitSettings?: {
      minSaleDiscountRate?: number
    }
    discountRule?: {
      discountType?: 'rate' | 'minPrice'
      discountRate?: number
      minDiscountPrice?: number
      commissionRate?: number
    }
  } | null
}

const asyncPool = async <T, R>(poolLimit: number, array: T[], iteratorFn: (item: T) => Promise<R>) => {
  const ret: Promise<R>[] = []
  const executing: Promise<any>[] = []
  for (const item of array) {
    const p = Promise.resolve().then(() => iteratorFn(item))
    ret.push(p)
    if (poolLimit <= array.length) {
      const e: Promise<any> = p.then(() => executing.splice(executing.indexOf(e), 1))
      executing.push(e)
      if (executing.length >= poolLimit) {
        await Promise.race(executing)
      }
    }
  }
  return Promise.all(ret)
}

export default function EliteManufacturerManagement() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const pickImageId = (v: any): string => {
    if (!v) return ''
    if (typeof v === 'string' || typeof v === 'number') return String(v)
    if (Array.isArray(v)) return pickImageId(v[0])
    if (typeof v === 'object') return String(v.fileId || v.id || v._id || v.url || v.path || '')
    return ''
  }

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Manufacturer[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [metaById, setMetaById] = useState<Record<string, ManufacturerMeta>>({})

  const userKey = String((user as any)?._id || (user as any)?.id || 'anonymous')
  const enabledStorageKey = `manufacturer_library_enabled_${userKey}`
  const [enabledById, setEnabledById] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem(enabledStorageKey)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        setEnabledById(parsed)
      }
    } catch {
    }
  }, [enabledStorageKey])

  useEffect(() => {
    try {
      localStorage.setItem(enabledStorageKey, JSON.stringify(enabledById))
    } catch {
    }
  }, [enabledById, enabledStorageKey])

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return items
    return items.filter(m => {
      const name = (m.fullName || m.name || '').toLowerCase()
      const desc = (m.description || '').toLowerCase()
      const code = (m.code || m.shortName || '').toLowerCase()
      return name.includes(q) || desc.includes(q) || code.includes(q)
    })
  }, [items, searchQuery])

  const load = async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/manufacturers', {
        params: { keyword: searchQuery, pageSize: 100 }
      })
      setItems(res.data?.data || [])
    } catch (e) {
      toast.error('获取厂家列表失败')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  useEffect(() => {
    const visible = filtered
    const missing = visible.filter(m => !metaById[String(m._id)])
    if (missing.length === 0) return

    let cancelled = false

    const loadMetaForOne = async (m: Manufacturer) => {
      const id = String(m._id)
      try {
        const [catRes, prodRes, tierRes] = await Promise.all([
          apiClient.get(`/manufacturers/${id}/product-categories`).catch(() => ({ data: { data: [] } })),
          apiClient.get(`/manufacturers/${id}/products`, { params: { status: 'active', limit: 8 } }).catch(() => ({ data: { data: [] } })),
          apiClient.get('/tier-system/effective', { params: { manufacturerId: id } }).catch(() => ({ data: { data: null } })),
        ])

        const categories: CategoryItem[] = Array.isArray(catRes.data?.data) ? catRes.data.data : []
        const totalProducts = categories.reduce((sum, c) => sum + (Number(c.count) || 0), 0)

        const products: any[] = Array.isArray(prodRes.data?.data) ? prodRes.data.data : []
        const previewImages = products
          .map(p => p?.thumbnail || p?.images?.[0])
          .filter(Boolean)
          .slice(0, 4)

        const tierData = tierRes.data?.data || null
        const tierRule = tierData ? { profitSettings: tierData.profitSettings, discountRule: tierData.discountRule } : null

        const meta: ManufacturerMeta = {
          totalProducts,
          topCategories: categories.slice(0, 3),
          previewImages,
          tierRule,
        }

        if (!cancelled) {
          setMetaById(prev => ({ ...prev, [id]: meta }))
        }
      } catch {
        if (!cancelled) {
          setMetaById(prev => ({
            ...prev,
            [id]: {
              totalProducts: 0,
              topCategories: [],
              previewImages: [],
              tierRule: null,
            }
          }))
        }
      }
    }

    const run = async () => {
      await asyncPool(6, missing, loadMetaForOne)
    }

    run()

    return () => {
      cancelled = true
    }
  }, [filtered, metaById])

  const handleOpen = (m: Manufacturer) => {
    const id = String(m._id)
    const enabled = enabledById[id] !== false
    const active = (m.status || 'active') === 'active'
    if (!enabled || !active) return
    navigate(`/admin/manufacturers/${m._id}/product-authorization`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd]">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-3">品牌合伙库</h2>
            <p className="text-gray-400 font-bold uppercase tracking-widest mt-2 px-1">全域品牌准入控制与资产分销中心</p>
          </div>

          <div className="w-full md:w-[420px]">
            <div className="flex items-center bg-gray-100/50 border border-gray-100 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition-all shadow-sm">
              <svg className="w-4 h-4 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="搜索品牌名称、编码或简介..."
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400 font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-24 text-center flex flex-col items-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-400 font-bold text-lg">没有找到相关品牌</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-emerald-600 font-bold mt-4 hover:underline"
              type="button"
            >
              查看全部品牌
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filtered.map(m => {
              const name = m.fullName || m.name
              const code = m.code || m.shortName || ''
              const desc = m.description || '暂无品牌介绍'
              const intro = m.shortName ? `核心系列：${m.shortName}` : '核心系列：暂无'
              const isOfficial = (m.name || '').includes('小迪严选') || (m.code || '').toUpperCase() === 'XDYX'

              const id = String(m._id)
              const enabled = enabledById[id] !== false
              const active = (m.status || 'active') === 'active'
              const canEnter = enabled && active

              const meta = metaById[String(m._id)]
              const discountRule = meta?.tierRule?.discountRule
              const discountText = discountRule
                ? (discountRule.discountType === 'minPrice'
                    ? `最低¥${Number(discountRule.minDiscountPrice || 0).toFixed(0)}`
                    : `${((Number(discountRule.discountRate || 1)) * 10).toFixed(1)}折`)
                : '--'
              const commissionText = discountRule?.commissionRate
                ? `${(Number(discountRule.commissionRate) * 100).toFixed(0)}%`
                : '--'

              return (
                <div
                  key={m._id}
                  className={`bg-white rounded-[2rem] border ${canEnter ? 'border-gray-100' : 'border-gray-200 bg-gray-50/50'} shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full cursor-pointer group relative ${canEnter ? '' : 'opacity-60 grayscale'}`}
                  onClick={() => handleOpen(m)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOpen(m)
                  }}
                >
                  <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-2xl border border-gray-100 shadow-sm">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={enabled}
                        onChange={(e) => {
                          e.stopPropagation()
                          setEnabledById(prev => ({ ...prev, [id]: !enabled }))
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${enabled ? 'text-emerald-700' : 'text-gray-400'}`}>{enabled ? '已开启显示' : '已隐藏商品'}</span>
                  </div>

                  <div className="relative h-40 bg-[#f9fbfc] flex items-center justify-center p-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {m.logo ? (
                      <img
                        src={getThumbnailUrl(pickImageId(m.logo), 240)}
                        alt={name}
                        className="w-24 h-24 rounded-2xl object-cover shadow-2xl transform group-hover:scale-110 transition-transform duration-700 z-10 border-4 border-white"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-emerald-50 border-4 border-white shadow-2xl flex items-center justify-center z-10">
                        <span className="text-emerald-700 font-black text-lg">{(code || name || '').slice(0, 2)}</span>
                      </div>
                    )}

                    {isOfficial && (
                      <div className="absolute top-4 right-4 bg-[#153e35] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-20 tracking-widest uppercase">
                        官方严选
                      </div>
                    )}
                  </div>

                  <div className="p-8 flex flex-col flex-grow relative">
                    <div className="mb-6">
                      <h3 className="text-2xl font-black text-gray-900 group-hover:text-emerald-800 transition-colors leading-tight mb-1">{name}</h3>
                      <span className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">{code}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-[11px] font-bold border border-gray-100">
                        商品 {meta ? meta.totalProducts : '--'}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                        折扣 {discountText}
                      </span>
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-[11px] font-bold border border-orange-100">
                        返佣 {commissionText}
                      </span>
                    </div>

                    <div className="space-y-5 flex-grow">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2"></span>
                          品牌愿景
                        </p>
                        <p
                          className="text-sm text-gray-500 leading-relaxed font-medium italic"
                          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          “{desc}”
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest mb-2 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 mr-2"></span>
                          核心系列
                        </p>
                        <p
                          className="text-sm text-gray-700 font-bold"
                          style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                        >
                          {intro}
                        </p>
                      </div>

                      {meta?.topCategories?.length ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {meta.topCategories.slice(0, 3).map(c => (
                            <span
                              key={c.id}
                              className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-gray-100 text-gray-500 text-[10px] font-bold"
                            >
                              {c.name} · {c.count}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex -space-x-3">
                        {(meta?.previewImages?.length ? meta.previewImages : [null, null, null, null]).slice(0, 4).map((src, i) => (
                          <div key={i} className="w-8 h-8 rounded-xl border-2 border-white bg-gray-100 overflow-hidden shadow-sm">
                            {src ? <img src={getThumbnailUrl(pickImageId(src), 80)} alt="" className="w-full h-full object-cover" /> : null}
                          </div>
                        ))}
                        <div className="w-8 h-8 rounded-xl border-2 border-white bg-[#153e35] flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                          ···
                        </div>
                      </div>
                      <div className="flex items-center text-[#153e35] font-black text-xs group-hover:translate-x-1 transition-transform">
                        {canEnter ? '进入品牌选库' : (active ? '开启后可进入' : '品牌已停用')}
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
