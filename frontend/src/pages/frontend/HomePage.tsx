import { ArrowRight, Layers, Palette } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="animate-fade-in-up font-sans">
      {/* Hero区域 - 深绿色背景 */}
      <div className="relative h-[400px] w-full bg-[#0d5345] flex items-center justify-center">
        <div className="relative z-30 text-center text-white max-w-4xl mx-auto px-6">
          <h2 className="text-5xl md:text-6xl font-serif font-bold leading-none tracking-tight">
            源头好货<br/>一件也是出厂价
          </h2>
          <p className="text-lg md:text-xl font-light text-white/90 leading-relaxed max-w-2xl mx-auto mt-6">
            Factory Direct, Wholesale Price for One.
          </p>
        </div>
      </div>

      {/* 优势展示 - 浅灰色背景 */}
      <div className="py-16 bg-[#F5F5F7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 源头「家直供 */}
            <div className="bg-white p-8 rounded-2xl flex items-start gap-6 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0 text-[#0d5345]">
                <Layers className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-1">源头「家直供</h3>
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-2">FACTORY DIRECT</p>
                <p className="text-stone-600 text-sm">品牌平台仓·价格官方保</p>
              </div>
            </div>
            
            {/* 款式更多更新 */}
            <div className="bg-white p-8 rounded-2xl flex items-start gap-6 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0 text-[#0d5345]">
                <Palette className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-stone-800 mb-1">款式更多更新</h3>
                <p className="text-xs text-red-500 font-bold uppercase tracking-wider mb-2">LATEST STYLES</p>
                <p className="text-stone-600 text-sm">每周上新·紧跟国际潮流</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 佛山200+源头展厅 - 白色背景 */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 左侧卡片 */}
            <div className="bg-white border border-stone-200 p-8 rounded-2xl">
              <div className="flex items-center gap-2 text-stone-400 text-xs mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <span>FOSHAN, CHINA</span>
              </div>
              
              <h3 className="text-3xl font-bold text-stone-800 mb-2">佛山 200+ 源头展厅</h3>
              <p className="text-xl text-stone-500 mb-6 font-light">Offline Showrooms</p>
              
              <p className="text-stone-600 text-sm mb-6 leading-relaxed">
                依托佛山区域具有产业带优势，严选 200 多家优质工厂工厂，我们提供多种专业服务，专车接送，帮您轻松选到满意商品，享受到真正的一手订「市。
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="border border-stone-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-stone-800 mb-1">¥1,000</p>
                  <p className="text-xs text-stone-600 mb-2">基础配套</p>
                  <ul className="text-[10px] text-stone-500 space-y-0.5">
                    <li>· 专车接送</li>
                    <li>· 综合指导</li>
                    <li>· 物流组货</li>
                  </ul>
                </div>
                <div className="border border-stone-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-stone-800 mb-1">¥5,000</p>
                  <p className="text-xs text-stone-600 mb-2">专家配套</p>
                  <ul className="text-[10px] text-stone-500 space-y-0.5">
                    <li>· 深度服务</li>
                    <li>· 定制方案</li>
                    <li>· 全程管家</li>
                  </ul>
                </div>
              </div>
              
              <button 
                onClick={() => navigate('/design-service')}
                className="w-full bg-[#0d5345] text-white py-3 rounded-lg font-bold hover:bg-[#0d5345]/90 transition-colors flex items-center justify-center gap-2"
              >
                预约一顺同采购服务
              </button>
            </div>

            {/* 右侧图片卡片 */}
            <div className="bg-stone-800 rounded-2xl overflow-hidden relative h-[550px] group">
              <img 
                src="https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&h=600&fit=crop" 
                alt="线下体验馆" 
                className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-50 transition-opacity duration-500"
              />
              <div className="absolute bottom-8 left-8 right-8 z-10">
                <h3 className="text-3xl font-bold text-white mb-2">线下体验馆</h3>
                <p className="text-white/90 text-sm">实地考察线材工艺，所见即所得。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 选配中心 Catalog - 浅灰色背景 */}
      <div className="py-16 bg-[#F5F5F7]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-3xl font-bold text-stone-800 mb-1">选配中心 Catalog</h3>
              <p className="text-stone-500 text-sm">RECOMMENDED FOR YOU</p>
            </div>
            <button 
              onClick={() => navigate('/products')}
              className="text-[#0d5345] hover:text-[#0d5345]/80 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              查看全部品类 <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                name: '现代简约系列',
                tag: '新品',
                tagColor: 'bg-green-500',
                image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop'
              },
              {
                name: '奢华经典Mod',
                tag: '热销',
                tagColor: 'bg-red-500',
                image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop'
              },
              {
                name: '简欧轻奢Ome',
                image: 'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=300&fit=crop'
              },
              {
                name: '美式简雅Jane',
                image: 'https://images.unsplash.com/photo-1567016432779-094069958ea5?w=400&h=300&fit=crop'
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group" 
                onClick={() => navigate('/products')}
              >
                <div className="relative">
                  {item.tag && (
                    <span className={`absolute top-4 left-4 ${item.tagColor} text-white text-xs px-3 py-1 rounded-full font-bold z-10`}>
                      {item.tag}
                    </span>
                  )}
                  <img 
                    src={item.image}
                    alt={item.name}
                    className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h4 className="text-base font-bold text-stone-800 mb-1">{item.name}</h4>
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>查看详情</span>
                    <button className="bg-stone-800 text-white px-3 py-1 rounded text-xs hover:bg-stone-700 transition-colors">
                      立即购买
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
