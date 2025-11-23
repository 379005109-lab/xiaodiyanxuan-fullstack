import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sparkles, ArrowRight, Tag, Loader2 } from 'lucide-react'
import { PackagePlan } from '@/types'
import { getAllPackages } from '@/services/packageService'
import { getFileUrl } from '@/services/uploadService'

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

  const filteredPackages = packages

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
            <p className="text-sm text-white/70">套餐方案</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {!loading && filteredPackages.map((pkg) => (
              <Link
                to={`/packages/${pkg.id}`}
                key={pkg.id}
                className="block rounded-2xl overflow-hidden shadow-lg bg-white transition hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative">
                  <img
                    src={pkg.banner ? getFileUrl(pkg.banner) : '/placeholder.svg'}
                    alt={pkg.name}
                    className="h-64 w-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full">
                    <p className="text-lg font-bold text-primary-600">¥{(pkg.price || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 line-clamp-1">{pkg.name}</h2>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{pkg.description || '立即查看搭配详情，获取更多材质与规格信息。'}</p>
                  <div className="flex flex-wrap gap-2">
                    {pkg.categories.slice(0, 3).map((category) => (
                      <div key={category.key} className="text-xs text-gray-500 bg-gray-50 rounded-full px-3 py-1">
                        {category.name}
                      </div>
                    ))}
                    {pkg.categories.length > 3 && (
                      <div className="text-xs text-gray-400 bg-gray-50 rounded-full px-3 py-1">
                        +{pkg.categories.length - 3}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-400">
                      {pkg.categories.length} 大品类 · {pkg.categories.reduce((sum, category) => sum + category.products.length, 0)} 个细项
                    </div>
                    <div className="inline-flex items-center text-primary-600 font-medium text-sm">
                      查看详情 <ArrowRight className="h-4 w-4 ml-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
