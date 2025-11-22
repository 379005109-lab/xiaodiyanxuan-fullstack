import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sparkles, ArrowRight, Tag, Loader2 } from 'lucide-react'
import { PackagePlan } from '@/types'
import { getAllPackages } from '@/services/packageService'

const TAG_PALETTE = ['#EF4444', '#F97316', '#0EA5E9', '#10B981', '#8B5CF6', '#EC4899']

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackagePlan[]>([])
  const [loading, setLoading] = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag') || '全部'

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true)
      try {
        const plans = await getAllPackages()
        setPackages(plans)
      } catch (error) {
        console.error('加载套餐失败', error)
      } finally {
        setLoading(false)
      }
    }
    loadPackages()
  }, [])

  const tags = useMemo(() => {
    const all = new Set<string>(['全部'])
    packages.forEach((pkg) => pkg.tags.forEach((tag) => all.add(tag)))
    return Array.from(all)
  }, [packages])

  const filteredPackages = useMemo(() => {
    if (activeTag === '全部') return packages
    return packages.filter((pkg) => pkg.tags.includes(activeTag))
  }, [packages, activeTag])

  const handleTagClick = (tag: string) => {
    if (tag === '全部') {
      searchParams.delete('tag')
    } else {
      searchParams.set('tag', tag)
    }
    setSearchParams(searchParams)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white pb-16">
      <div className="container-custom">
        <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
          <Link to="/" className="hover:text-primary-600">首页</Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">套餐专区</span>
        </div>

        <section className="rounded-3xl bg-gradient-to-r from-primary-600 to-primary-400 text-white p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8">
          <div className="flex-1 space-y-3">
            <p className="inline-flex items-center text-sm uppercase tracking-[0.3em] text-primary-100">
              <Sparkles className="h-4 w-4 mr-2" /> LOCALIZED PACKAGES
            </p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">精选整屋搭配，一键完成本地化软装</h1>
            <p className="text-primary-50 text-lg leading-relaxed">
              针对本地户型、生活方式定制的套餐，涵盖沙发、餐桌、卧室、收纳等核心品类。
              所见即所得，线上挑选、线下体验，快速锁定适合你的生活场景。
            </p>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-2xl p-6 min-w-[260px]">
            <h3 className="text-sm uppercase text-white/70 mb-3">当前提供</h3>
            <p className="text-5xl font-bold">{packages.length}</p>
            <p className="text-sm text-white/70">套整屋方案</p>
            <div className="mt-6 space-y-2 text-sm text-white/80">
              <p>· 支持品类自由组合</p>
              <p>· 自动同步材质与规格</p>
              <p>· 本地化售后与交付</p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="flex flex-wrap gap-3">
            {tags.map((tag, index) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTag === tag
                    ? 'bg-gray-900 text-white shadow-lg shadow-gray-200'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                }`}
                style={activeTag === tag ? { backgroundColor: TAG_PALETTE[index % TAG_PALETTE.length], color: '#fff' } : {}}
              >
                {tag}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-10 space-y-8">
          {loading && (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
            </div>
          )}

          {!loading && filteredPackages.length === 0 && (
            <div className="card text-center py-16">
              <p className="text-gray-500">暂无对应标签的套餐，尝试切换筛选</p>
            </div>
          )}

          {!loading && filteredPackages.map((pkg) => (
            <Link
              to={`/packages/${pkg.id}`}
              key={pkg.id}
              className="block rounded-3xl overflow-hidden shadow-xl bg-white transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex flex-col lg:flex-row">
                <div className="lg:w-1/2 relative">
                  <img
                    src={pkg.banner}
                    alt={pkg.name}
                    className="h-80 lg:h-full w-full object-cover"
                  />
                  <div className="absolute bottom-6 left-6 flex flex-wrap gap-2">
                    {(pkg.tags || []).slice(0, 4).map((tag, index) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: TAG_PALETTE[index % TAG_PALETTE.length] }}
                      >
                        <Tag className="h-3 w-3 mr-1" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="lg:w-1/2 p-8 lg:p-12 space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-gray-400">套餐编号 #{pkg.id}</p>
                      <h2 className="text-3xl font-semibold text-gray-900 mt-1">{pkg.name}</h2>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">整套到手价</p>
                      <p className="text-3xl font-bold text-primary-600">¥{pkg.price.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed line-clamp-3">{pkg.description || '立即查看搭配详情，获取更多材质与规格信息。'}</p>
                  <div className="flex flex-wrap gap-4">
                    {pkg.categories.map((category) => (
                      <div key={category.key} className="flex items-center space-x-2 text-sm text-gray-500 bg-gray-50 rounded-full px-4 py-1">
                        <span className="font-semibold text-gray-800">{category.required} 选 1</span>
                        <span className="text-gray-400">{category.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-400">
                      包含 {pkg.categories.length} 大品类 · {pkg.categories.reduce((sum, category) => sum + category.products.length, 0)} 个细项
                    </div>
                    <div className="inline-flex items-center text-primary-600 font-semibold">
                      查看详情 <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </section>
      </div>
    </div>
  )
}
