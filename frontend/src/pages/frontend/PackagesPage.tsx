// Fixed React error #306 - component rendering issue v2
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Loader2 } from 'lucide-react'
import { PackagePlan } from '@/types'
import { getAllPackages } from '@/services/packageService'
import { getFileUrl } from '@/services/uploadService'
import { formatPrice } from '@/lib/utils'

function PackagesPage() {
  const [packages, setPackages] = useState<PackagePlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPackages = async () => {
      setLoading(true)
      try {
        const plans = await getAllPackages()
        setPackages(plans || [])
      } catch (error) {
        console.error('加载套餐失败', error)
        setPackages([])
      } finally {
        setLoading(false)
      }
    }
    loadPackages()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="bg-stone-100 py-16 text-center">
        <h1 className="text-4xl font-serif font-bold text-primary mb-2">灵感套系</h1>
        <p className="text-stone-500 uppercase tracking-[0.2em] text-sm">Curated Collections</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-1 gap-12">
          {packages.map((pkg, idx) => (
            <div key={pkg.id || idx} className={`flex flex-col ${idx % 2 === 1 ? 'md:flex-row-reverse' : 'md:flex-row'} bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 group`}>
              <div className="md:w-3/5 relative overflow-hidden h-48 md:h-auto cursor-pointer">
                <img 
                  src={pkg.banner ? getFileUrl(pkg.banner) : '/placeholder.svg'} 
                  alt={pkg.name || '套餐'} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
              </div>
              
              <div className="md:w-2/5 p-10 flex flex-col justify-center space-y-6">
                <div className="flex items-center gap-3">
                  <span className="text-6xl font-serif text-stone-100 font-bold -ml-2">0{idx + 1}</span>
                  <div className="h-px bg-primary flex-1 opacity-20"></div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-serif font-bold text-primary mb-2">{pkg.name || '套餐方案'}</h2>
                  <p className="text-stone-500 leading-relaxed text-sm">{pkg.description || '精心搭配的整屋方案。'}</p>
                </div>

                <div className="bg-stone-50 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">包含单品</span>
                    <span className="font-medium text-primary">{pkg.categories?.reduce((sum, category) => sum + (category.products?.length || 0), 0) || 0} 件</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">起售价</span>
                    <span className="font-serif font-bold text-accent text-lg">{formatPrice(pkg.price || 0)}</span>
                  </div>
                </div>

                <Link
                  to={`/packages/${pkg.id || idx}`}
                  className="flex items-center justify-between w-full bg-primary text-white p-4 rounded-xl hover:bg-green-900 transition-colors group/btn"
                >
                  <span className="font-serif italic text-sm">配置此套系</span>
                  <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
          
          {packages.length === 0 && !loading && (
            <div className="text-center py-20">
              <p className="text-stone-400">暂无套餐数error</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PackagesPage
