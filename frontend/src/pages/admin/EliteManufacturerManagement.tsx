import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '@/lib/apiClient'
import { toast } from 'sonner'

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

export default function EliteManufacturerManagement() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Manufacturer[]>([])
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleOpen = (m: Manufacturer) => {
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
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-3">合作品牌库</h2>
            <p className="text-gray-500 font-medium max-w-xl text-base md:text-lg leading-relaxed">
              汇聚优质家具制造工厂，快速进入品牌库进行选品与授权。
            </p>
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

              return (
                <div
                  key={m._id}
                  className="bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col h-full cursor-pointer group"
                  onClick={() => handleOpen(m)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleOpen(m)
                  }}
                >
                  <div className="relative h-40 bg-[#f9fbfc] flex items-center justify-center p-8 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    {m.logo ? (
                      <img
                        src={m.logo}
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
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="w-8 h-8 rounded-xl border-2 border-white bg-gray-100 overflow-hidden shadow-sm" />
                        ))}
                        <div className="w-8 h-8 rounded-xl border-2 border-white bg-[#153e35] flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                          ···
                        </div>
                      </div>
                      <div className="flex items-center text-[#153e35] font-black text-xs group-hover:translate-x-1 transition-transform">
                        进入品牌库
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
