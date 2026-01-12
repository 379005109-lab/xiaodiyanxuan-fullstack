import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, MapPin, ShoppingBag, Sofa, Layers, Palette } from 'lucide-react'
import { getProducts } from '@/services/productService'
import { getFileUrl } from '@/services/uploadService'
import { formatPrice } from '@/lib/utils'

interface Product {
  _id: string
  name: string
  basePrice: number
  images: string[]
  styles?: string[]
  views?: number
}

export default function HomePage() {
  const navigate = useNavigate()
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        // 按热度（views）降序获取商品
        const data = await getProducts({ limit: 8, sort: '-views' })
        const products = Array.isArray(data) ? data : (data.products || [])
        setFeaturedProducts(products)
      } catch (error) {
        console.error('加载商品失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  return (
    <div className="font-sans">
      {/* Hero Section - 全屏 */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#F8F7F4] to-white">
        <div className="max-w-7xl mx-auto px-6 py-20 w-full">
          {/* 标题区域 */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#14452F] mb-6 leading-tight">
              源头好货<br className="md:hidden" />一件也是出厂价
            </h1>
            <p className="text-lg md:text-xl text-stone-500 max-w-2xl mx-auto mb-8">
              200+ 佛山优质工厂直供，砍掉中间商，为您严选最好的设计与工艺
            </p>
            <button 
              onClick={() => navigate('/products')}
              className="bg-[#14452F] text-white px-10 py-4 rounded-full font-medium hover:bg-green-900 transition-colors inline-flex items-center gap-2 text-lg shadow-lg hover:shadow-xl"
            >
              进入选品中心 <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* 4个热门商品模块 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loading ? (
              [1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse shadow-sm">
                  <div className="aspect-square bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))
            ) : (
              featuredProducts.slice(0, 4).map(product => (
                <div 
                  key={product._id} 
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={getFileUrl(product.images[0])} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Sofa className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-stone-800 mb-2 line-clamp-1 text-sm md:text-base">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[#14452F] font-bold text-sm md:text-base">{formatPrice(product.basePrice)}</span>
                      {product.styles && product.styles.length > 0 && (
                        <span className="text-xs text-stone-400 hidden md:inline">{product.styles[0]}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 滚动提示 */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-stone-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5"/>
          </svg>
        </div>
      </section>

      {/* Advantages Section */}
      <section className="py-20 bg-[#F2F4F3]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-stone-100 flex items-start gap-6 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#14452F]/5 rounded-full flex items-center justify-center flex-shrink-0 text-[#14452F]">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#14452F] mb-2">源头工厂直供</h3>
                <p className="text-xs font-bold text-[#C9A227] uppercase tracking-wider mb-3">Factory Direct</p>
                <p className="text-stone-500">200+ 佛山优质工厂资源，砍掉中间商，一件也是出厂价。</p>
              </div>
            </div>
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-stone-100 flex items-start gap-6 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-[#14452F]/5 rounded-full flex items-center justify-center flex-shrink-0 text-[#14452F]">
                <Palette className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-[#14452F] mb-2">专业设计服务</h3>
                <p className="text-xs font-bold text-[#C9A227] uppercase tracking-wider mb-3">Design Service</p>
                <p className="text-stone-500">专业设计师团队，提供全屋定制方案，让您省心省力。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Showroom & Guide Service */}
      <section className="bg-white py-20 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 border border-[#14452F]/20 rounded-full px-3 py-1 bg-[#14452F]/5">
              <MapPin className="w-3 h-3 text-[#14452F]" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#14452F]">Foshan, China</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              佛山 200+ 源头展厅<br/>
              <span className="text-stone-400">Offline Showrooms</span>
            </h2>
            <p className="text-stone-500 leading-relaxed text-lg border-l-2 border-[#C9A227] pl-6">
              依托佛山家具产业带优势，严选 200 多家优质工厂展厅。我们提供专业的线下陪买服务，专车接送，帮您拿到真正的一手出厂价。
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div 
                className="bg-stone-50 p-6 rounded-xl border border-stone-100 hover:border-[#C9A227] transition-colors cursor-pointer group" 
                onClick={() => navigate('/buying-service')}
              >
                <div className="text-2xl font-bold text-[#14452F] mb-1">¥1,000</div>
                <h4 className="font-bold text-stone-700 text-sm mb-2">基础陪买</h4>
                <p className="text-xs text-stone-400">专车接送 · 1天行程 · 购满抵扣</p>
                <ArrowRight className="w-4 h-4 text-[#C9A227] mt-3 group-hover:translate-x-1 transition-transform" />
              </div>
              <div 
                className="bg-stone-50 p-6 rounded-xl border border-stone-100 hover:border-[#C9A227] transition-colors cursor-pointer group" 
                onClick={() => navigate('/buying-service')}
              >
                <div className="text-2xl font-bold text-[#14452F] mb-1">¥5,000</div>
                <h4 className="font-bold text-stone-700 text-sm mb-2">专家陪买</h4>
                <p className="text-xs text-stone-400">设计师陪同 · 深度选品 · 验货</p>
                <ArrowRight className="w-4 h-4 text-[#C9A227] mt-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <button 
              onClick={() => navigate('/buying-service')}
              className="w-full bg-[#14452F] text-white py-4 rounded-xl font-bold hover:bg-green-900 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              预约一键陪买服务
            </button>
          </div>
          <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200" 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="Showroom" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <div className="text-white">
                <div className="text-3xl font-bold mb-2">线下体验馆</div>
                <p className="opacity-80">实地考察材质与工艺，所见即所得。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-[#F2F4F3]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12 border-b border-stone-200 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-[#14452F] mb-2">精选商品</h2>
              <p className="text-stone-500 uppercase tracking-widest text-xs font-bold">Featured Products</p>
            </div>
            <button 
              onClick={() => navigate('/products')} 
              className="group text-[#14452F] hover:text-[#C9A227] transition-colors flex items-center gap-2 text-sm font-bold"
            >
              查看全部商品 
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:bg-[#14452F] group-hover:text-white transition-colors shadow-sm">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <div 
                  key={product._id} 
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate(`/products/${product._id}`)}
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={getFileUrl(product.images[0])} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Sofa className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-stone-800 mb-2 line-clamp-1">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-[#14452F] font-bold">{formatPrice(product.basePrice)}</span>
                      {product.styles && product.styles.length > 0 && (
                        <span className="text-xs text-stone-400">{product.styles[0]}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
