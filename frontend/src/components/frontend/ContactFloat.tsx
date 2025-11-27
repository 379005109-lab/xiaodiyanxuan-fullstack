import { useState } from 'react'
import { X, Phone, MessageCircle } from 'lucide-react'

export default function ContactFloat() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* 浮动按钮 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[999] bg-primary hover:bg-green-900 text-white rounded-full p-4 shadow-2xl transition-all duration-300 hover:scale-110 flex items-center gap-2 group"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="hidden group-hover:inline-block text-sm font-semibold pr-2">联系我们</span>
        </button>
      )}

      {/* 联系卡片 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[999] bg-white rounded-2xl shadow-2xl border border-stone-200 w-80 overflow-hidden animate-in slide-in-from-bottom-4">
          {/* 头部 */}
          <div className="bg-gradient-to-r from-primary to-green-800 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-bold text-lg">联系我们</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容 */}
          <div className="p-6 space-y-6">
            {/* 电话 */}
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-stone-500 mb-1">客服电话</div>
                <a 
                  href="tel:18573402324" 
                  className="text-lg font-bold text-primary hover:text-green-900 transition-colors"
                >
                  185 7340 2324
                </a>
                <div className="text-xs text-stone-400 mt-1">工作时间: 9:00-18:00</div>
              </div>
            </div>

            {/* 微信二维码 */}
            <div className="text-center">
              <div className="text-sm text-stone-500 mb-3">扫码添加微信</div>
              <div className="inline-block p-3 bg-stone-50 rounded-xl">
                <img 
                  src="/wechat-qr.png" 
                  alt="微信二维码" 
                  className="w-40 h-40 object-contain"
                  onError={(e) => {
                    // 如果图片加载失败，显示占位符
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="160"%3E%3Crect width="160" height="160" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="14" fill="%23999"%3E微信二维码%3C/text%3E%3C/svg%3E'
                  }}
                />
              </div>
              <div className="text-xs text-stone-400 mt-2">7x24小时在线服务</div>
            </div>

            {/* 介绍文字 */}
            <div className="text-center pt-4 border-t border-stone-100">
              <div className="text-sm text-stone-600 leading-relaxed">
                数字方式获取全球端到端全球化<br/>
                打造进一步的线上线下体验<br/>
                © 2024 Xiaodi Yanxuan
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
