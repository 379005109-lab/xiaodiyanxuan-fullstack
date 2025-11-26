import { useState } from 'react'
import { Check, MapPin, Car, Users, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { toast } from 'sonner'

export default function BuyingServicePage() {
  const { isAuthenticated } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const [selectedService, setSelectedService] = useState<'standard' | 'expert' | null>(null)

  const handleBooking = (serviceType: 'standard' | 'expert') => {
    if (!isAuthenticated) {
      toast.error('请先登录账号')
      openLogin()
      return
    }
    setSelectedService(serviceType)
    toast.success(`已选择${serviceType === 'standard' ? '基础陪买服务' : '专家定制陪买'}，请联系客服预约`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1e5a3f] to-[#2d7050] pt-20 pb-16">
      {/* Hero Section - 严格按照图片 */}
      <div className="text-center text-white py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">佛山源头陪买服务</h1>
        <p className="text-lg md:text-xl mb-3 leading-relaxed">
          深入佛山家具产地，专车接送，资深买手带您逛遍 200+ 源头展厅。
        </p>
        <p className="text-base opacity-95">
          省去中间商差价，享受真正的一手出厂价。
        </p>
      </div>

      {/* Service Cards - 严格按照图片 */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {/* 基础陪买服务 - 金色边框 + Most Value标签 */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-[#D4A574] relative">
          {/* Most Value标签 */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#D4A574] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
            # MOST VALUE
          </div>
          
          <div className="p-8 pt-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">基础陪买服务</h3>
              <p className="text-sm text-gray-500 uppercase tracking-wider">STANDARD GUIDE</p>
            </div>

            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-[#D4A574] mb-3">¥1,000</div>
              <p className="text-sm text-gray-600">* 购满5万元退还服务费</p>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">专车接送（「顺德港」、「龙江镇」、「乐从镇」）</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">1天深度选购行程</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">专业陪价</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">购满5000元抵扣服务费</span>
              </li>
            </ul>

            <button 
              onClick={() => handleBooking('standard')}
              className="w-full bg-[#1e5a3f] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#2d7050] transition-all shadow-lg"
            >
              立即预约
            </button>
          </div>
        </div>

        {/* 专家定制陪买 - 灰色边框 */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-300">
          <div className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">专家定制陪买</h3>
              <p className="text-sm text-gray-500 uppercase tracking-wider">EXPERT GUIDE</p>
            </div>

            <div className="text-center mb-8">
              <div className="text-6xl font-bold text-gray-700 mb-3">¥5,000</div>
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">包含基础陪买服务所有权益</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">资深软装设计师陪同</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">3天深度选品对比</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">全屋搭配方案</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">出厂价验货跟单</span>
              </li>
            </ul>

            <button 
              onClick={() => handleBooking('expert')}
              className="w-full bg-gray-400 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-500 transition-all"
            >
              立即预约
            </button>
          </div>
        </div>
      </div>

      {/* Why Choose Us - 严格按照图片 */}
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-white text-center mb-12">为什么选择小迪陪买？</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">源头直达</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              直达 200+ 工厂，相接中间商渠道差价。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">专车接送</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              高端私房专车接送，全程轻松随意。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">专业陪关</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              资深行业老手陪同，帮您筛选较优性价比。
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 text-center shadow-lg">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-gray-900">售后无忧</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              平台统一质量客服，出现问题秒前响应。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
