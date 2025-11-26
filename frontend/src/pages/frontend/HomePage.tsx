import { ArrowRight, Layers, Palette, MapPin, ShoppingBag, Armchair, Sofa, Lamp, Box, Truck, Gem, Ruler } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function HomePage() {
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 生成行星式聚集旋转的粒子图标
  const icons = [Armchair, Sofa, Lamp, Box, Palette, Truck, Gem, Ruler, ShoppingBag, Layers, MapPin]
  const particles = icons.map((Icon, i) => {
    const angle = (i / icons.length) * 2 * Math.PI
    
    // 行星轨道半径（逐渐缩小到Logo周围）
    const orbitRadius = 180
    const orbitX = Math.cos(angle) * orbitRadius
    const orbitY = Math.sin(angle) * orbitRadius

    return (
      <div 
        key={i}
        className="absolute top-1/2 left-1/2 drop-shadow-lg pointer-events-none" 
        style={{ 
          '--orbit-x': `${orbitX}px`,
          '--orbit-y': `${orbitY}px`,
          '--angle': `${angle}rad`,
          '--delay': `${i * 0.1}s`,
          animation: 'planetOrbit 25s linear infinite',
          animationDelay: `${i * 0.1}s`,
          zIndex: 10,
        } as any}
      >
        <Icon className="w-12 h-12 md:w-14 md:h-14 stroke-[1.5] text-white/95" />
      </div>
    )
  })

  return (
    <div className={`animate-fade-in-up font-sans ${mounted ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}>
      {/* Hero区域 - 万物归宗向心汇聚 */}
      <div className="relative h-[90vh] w-full overflow-hidden bg-stone-900 flex items-center justify-center">
        {/* 动态背景 */}
        <div className="absolute inset-0 bg-stone-900 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[100px] animate-pulse-slow"></div>
        </div>

        {/* 向心汇聚粒子 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          {particles}
        </div>

        {/* 中心Logo和文案 */}
        <div className="relative z-30 text-center text-white space-y-8 max-w-4xl mx-auto px-6 flex flex-col items-center">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.2)] relative z-20 mb-8 border-4 border-primary/20">
            <div className="text-center">
              <h1 className="text-3xl font-serif font-bold text-primary tracking-tighter leading-none">XIAODI</h1>
              <span className="text-[8px] font-sans font-bold text-accent tracking-[0.2em] uppercase block mt-1">Supply Chain</span>
            </div>
          </div>

          <h2 className="text-5xl md:text-7xl font-serif font-bold leading-none tracking-tight animate-fade-in-up">
            源头好货<br/>一件也是出厂价
          </h2>

          <p className="text-lg md:text-xl font-light text-stone-300 leading-relaxed max-w-2xl mx-auto animate-fade-in-up">
            万物归一，以小迪为核心的家居供应链生态。<br/>
            <span className="text-sm opacity-60 mt-2 block">Factory Direct, Wholesale Price for One.</span>
          </p>

          <div className="flex justify-center gap-6 mt-8 animate-fade-in-up">
            <button 
              onClick={() => navigate('/products')}
              className="bg-accent text-stone-900 px-10 py-4 rounded-full hover:bg-white transition-all duration-300 font-bold tracking-wide flex items-center gap-2 group shadow-lg shadow-accent/20"
            >
              进入选品中心 <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* 优势展示 */}
      <div className="py-24 bg-[#F2F4F3]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <div className="bg-white p-10 rounded-2xl shadow-sm border border-stone-100 flex items-start gap-6 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                <Layers className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-2">源头「工厂直供</h3>
                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">FACTORY DIRECT</p>
                <p className="text-stone-500">品牌平台仓·价格官方保</p>
              </div>
            </div>

            <div className="bg-white p-10 rounded-2xl shadow-sm border border-stone-100 flex items-start gap-6 hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                <Palette className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-serif font-bold text-primary mb-2">款式更多更新</h3>
                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">LATEST STYLES</p>
                <p className="text-stone-500">每周上新·紧跟国际潮流</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 佛山200+源头展厅 */}
      <div className="bg-white py-24 border-t border-stone-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 border border-primary/20 rounded-full px-3 py-1 bg-primary/5">
              <MapPin className="w-3 h-3 text-primary" />
              <span className="text-[10px] uppercase tracking-widest font-bold text-primary">Foshan, China</span>
            </div>
            
            <h2 className="text-4xl font-serif font-bold leading-tight">
              佛山 200+ 源头展厅<br/>
              <span className="text-stone-400">Offline Showrooms</span>
            </h2>
            
            <p className="text-stone-500 leading-relaxed text-lg border-l-2 border-accent pl-6">
              依托佛山家具产业带优势，严选 200 多家优质工厂展厅。我们提供专业的线下陪买服务，专车接送，帮您拿到真正的一手出厂价。
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-stone-50 p-6 rounded-xl border border-stone-100 hover:border-accent transition-colors cursor-pointer group" onClick={() => navigate('/design-service')}>
                <div className="text-2xl font-bold text-primary mb-1">¥1,000</div>
                <h4 className="font-bold text-stone-700 text-sm mb-2">基础陪买</h4>
                <p className="text-xs text-stone-400">专车接送 · 1天行程 · 购满抵扣</p>
                <ArrowRight className="w-4 h-4 text-accent mt-3 group-hover:translate-x-1 transition-transform" />
              </div>
              
              <div className="bg-stone-50 p-6 rounded-xl border border-stone-100 hover:border-accent transition-colors cursor-pointer group" onClick={() => navigate('/design-service')}>
                <div className="text-2xl font-bold text-primary mb-1">¥5,000</div>
                <h4 className="font-bold text-stone-700 text-sm mb-2">专家陪买</h4>
                <p className="text-xs text-stone-400">设计师陪同 · 深度选品 · 验货</p>
                <ArrowRight className="w-4 h-4 text-accent mt-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            <button 
              onClick={() => navigate('/design-service')}
              className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-green-900 transition-colors shadow-lg flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              预约一键陪买服务
            </button>
          </div>
          
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200" 
              className="absolute inset-0 w-full h-full object-cover" 
              alt="Showroom" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
              <div className="text-white">
                <div className="text-3xl font-bold font-serif mb-2">线下体验馆</div>
                <p className="opacity-80">实地考察材质与工艺，所见即所得。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 选配中心 Catalog */}
      <div className="py-24 bg-[#F2F4F3]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-end mb-12 border-b border-stone-200 pb-6">
            <div>
              <h2 className="text-3xl font-serif font-bold text-primary mb-2">选配中心 Catalog</h2>
              <p className="text-stone-500 uppercase tracking-widest text-xs font-bold">Recommended for you</p>
            </div>
            <button 
              onClick={() => navigate('/products')} 
              className="group text-primary hover:text-accent transition-colors flex items-center gap-2 text-sm font-bold"
            >
              查看完整产品库 
              <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
          </div>
          
          <div className="text-center text-stone-500 py-12">
            <p className="text-lg">正在加载精选商品...</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes planetOrbit {
          0% {
            transform: translate(calc(var(--orbit-x) * 1.8), calc(var(--orbit-y) * 1.8)) rotate(0deg) scale(0.6);
            opacity: 0.3;
          }
          10% {
            opacity: 0.8;
          }
          25% {
            transform: translate(calc(var(--orbit-x) * 1.2), calc(var(--orbit-y) * 1.2)) rotate(90deg) scale(0.85);
            opacity: 1;
          }
          50% {
            transform: translate(var(--orbit-x), var(--orbit-y)) rotate(180deg) scale(1);
            opacity: 1;
          }
          75% {
            transform: translate(calc(var(--orbit-x) * 0.8), calc(var(--orbit-y) * 0.8)) rotate(270deg) scale(0.9);
            opacity: 1;
          }
          100% {
            transform: translate(calc(var(--orbit-x) * 1.8), calc(var(--orbit-y) * 1.8)) rotate(360deg) scale(0.6);
            opacity: 0.3;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }
        
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
