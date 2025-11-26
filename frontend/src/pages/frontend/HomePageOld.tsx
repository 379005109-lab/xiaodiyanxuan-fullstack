import { ArrowRight, Layers, Palette, Armchair, Sofa, Lamp, Box, Truck, Gem, Ruler } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  // 生成粒子动画
  const particles = Array.from({ length: 12 }).map((_, i) => {
    const angle = (i / 12) * 2 * Math.PI
    const distance = 400
    const startX = Math.cos(angle) * distance
    const startY = Math.sin(angle) * distance
    const delay = Math.random() * 2
    const Icon = [Armchair, Sofa, Lamp, Box, Palette, Truck, Gem, Ruler][i % 8]
    
    return (
      <div 
        key={i}
        className="absolute top-1/2 left-1/2 animate-implode drop-shadow-2xl" 
        style={{ 
          '--start-x': `${startX}px`, 
          '--start-y': `${startY}px`,
          animationDelay: `${delay}s`,
          animationDuration: '3.5s',
          opacity: 1
        } as React.CSSProperties}
      >
        <Icon className="w-24 h-24 stroke-[2] drop-shadow-xl text-white opacity-100" /> 
      </div>
    )
  })

  // 优势数据
  const advantages = [
    {
      title: '源头工厂',
      subtitle: 'FACTORY DIRECT',
      desc: '深入佛山家具产业带，200+优质工厂直供，剔除中间商加价'
    },
    {
      title: '品质保证',
      subtitle: 'QUALITY ASSURED',
      desc: '严格质检标准，每件产品都经过专业团队实地验厂和品控'
    }
  ]

  return (
    <div className="animate-fade-in-up font-sans">
      {/* 全屏Hero - 重力聚合效果 */}
      <div className="relative h-[90vh] w-full overflow-hidden bg-stone-900 flex items-center justify-center">
        
        {/* 动态背景 */}
        <div className="absolute inset-0 bg-stone-900 z-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[100px] animate-pulse-slow"></div>
        </div>

        {/* 聚合粒子 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
          {particles}
        </div>

        {/* 重力核心内容 */}
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

      {/* 优势展示网格 */}
      <div className="py-24 bg-[#F2F4F3]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {advantages.map((adv, idx) => (
              <div key={idx} className="bg-white p-10 rounded-2xl shadow-sm border border-stone-100 flex items-start gap-6 hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center flex-shrink-0 text-primary">
                  {idx === 0 ? <Layers className="w-8 h-8" /> : <Palette className="w-8 h-8" />}
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold text-primary mb-2">{adv.title}</h3>
                  <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">{adv.subtitle}</p>
                  <p className="text-stone-500">{adv.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 佛山200+源头项目 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100">
              <p className="text-stone-400 text-sm mb-2">7 months ago</p>
              <h3 className="text-2xl font-bold text-stone-800 mb-4">佛山200+源头项目<br/>Online Showrooms</h3>
              <p className="text-stone-600 mb-6">
                线上展示200+佛山源头工厂优质产品，涵盖客厅、卧室、餐厅等全品类。每个展厅都配有专业顾问，帮您快速找到心仪商品，一件也是出厂价。
              </p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-3xl font-bold text-stone-800">¥1,000</p>
                  <p className="text-sm text-stone-500">起步价格</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-stone-800">¥5,000</p>
                  <p className="text-sm text-stone-500">平均订单</p>
                </div>
              </div>
              <button 
                onClick={() => navigate('/products')}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                在线浏览展厅
              </button>
            </div>

            <div className="bg-stone-800 p-8 rounded-2xl shadow-sm overflow-hidden relative">
              <img 
                src="https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600&h=400&fit=crop" 
                alt="线下展示" 
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-white mb-2">线下展示</h3>
                <p className="text-white/80 text-sm">实体展厅，亲临体验</p>
              </div>
            </div>
          </div>

          {/* 场景化Catalog */}
          <div className="mt-16">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-bold text-stone-800 mb-2">场景化Catalog</h3>
                <p className="text-stone-500">实景搭配，风格多样</p>
              </div>
              <button 
                onClick={() => navigate('/products')}
                className="text-primary hover:text-primary/80 transition-colors flex items-center gap-2"
              >
                查看全部 <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate('/products')}>
                <div className="relative">
                  <span className="absolute top-4 left-4 bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold z-10">新品</span>
                  <img 
                    src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop" 
                    alt="现代简约" 
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-stone-800 mb-2">现代简约风</h4>
                  <p className="text-stone-500 text-sm">时尚简洁，年轻人的首选</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate('/products')}>
                <div className="relative">
                  <span className="absolute top-4 left-4 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold z-10">热销</span>
                  <img 
                    src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop" 
                    alt="轻奢风格" 
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-stone-800 mb-2">轻奢风格</h4>
                  <p className="text-stone-500 text-sm">高端品质，优雅生活</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100 hover:shadow-lg transition-all cursor-pointer group" onClick={() => navigate('/products')}>
                <div className="relative">
                  <img 
                    src="https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=400&h=300&fit=crop" 
                    alt="北欧风格" 
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-stone-800 mb-2">北欧原木</h4>
                  <p className="text-stone-500 text-sm">自然温馨，舒适宜居</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
