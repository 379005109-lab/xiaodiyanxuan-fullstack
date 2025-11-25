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
        </div>
      </div>
    </div>
  )
}
