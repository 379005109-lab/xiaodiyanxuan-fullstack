import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-stone-200 relative z-50">
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          {/* 左侧：品牌名称和描述 */}
          <div className="max-w-md">
            <h3 className="text-3xl font-serif font-bold text-stone-900 mb-3 tracking-wide">
              XiaoDi Yanxuan
            </h3>
            <p className="text-sm text-stone-500 leading-relaxed">
              源头好货，一键也是出厂价
            </p>
          </div>

          {/* 右侧：链接 */}
          <div className="flex gap-8 text-sm">
            <Link 
              to="/about" 
              className="text-stone-600 hover:text-primary transition-colors"
            >
              关于我们
            </Link>
            <Link 
              to="/buying-service" 
              className="text-stone-600 hover:text-primary transition-colors"
            >
              陪选服务
            </Link>
            <Link 
              to="/contact" 
              className="text-stone-600 hover:text-primary transition-colors"
            >
              版权政策
            </Link>
            <span className="text-stone-400">
              © 2025 XiaoDi Yanxuan.
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}

