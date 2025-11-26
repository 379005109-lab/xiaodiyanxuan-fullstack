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
    toast.success(`已选择${serviceType === 'standard' ? '基础陪买服务' : '专家陪买定制'}，请联系客服预约`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#14452F] to-[#1a5a3d] pt-20 pb-16">
      {/* Hero Section */}
      <div className="text-center text-white py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">佛山源头陪买服务</h1>
        <p className="text-lg md:text-xl opacity-90 mb-2">
          深入佛山家具产地，专车接送，实景实价亲商 200+ 源头展厅。
        </p>
        <p className="text-sm opacity-75">
          省去中间商成本，客户真正买到一手出厂价。
        </p>
      </div>

      {/* Service Cards */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* 基础陪买服务 */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-[#D6AD60] relative">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-[#D6AD60] text-white text-xs font-bold px-4 py-1 rounded-full uppercase">
            Most Value
          </div>
          <div className="p-8 pt-12">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">基础陪买服务</h3>
              <p className="text-sm text-gray-600 uppercase tracking-wider">STANDARD GUIDE</p>
            </div>

            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-[#D6AD60] mb-2">¥1,000</div>
              <p className="text-sm text-gray-600">* 购满 5 万元可退还陪买服务费</p>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                '专车接送（「顺德港」、「龙江镇」、「乐从镇」）',
                '1天深度选购程',
                '专业陪购',
                '购满5000元即可抵扣服务费'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleBooking('standard')}
              className="w-full bg-[#14452F] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#1a5a3d] transition-all shadow-lg"
            >
              立即预约
            </button>
          </div>
        </div>

        {/* 专家定制陪买 */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200">
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">专家定制陪买</h3>
              <p className="text-sm text-gray-600 uppercase tracking-wider">EXPERT GUIDE</p>
            </div>

            <div className="text-center mb-8">
              <div className="text-5xl font-bold text-gray-700 mb-2">¥5,000</div>
            </div>

            <ul className="space-y-4 mb-8">
              {[
                '包含基础陪买服务所有权益',
                '资深设计师全程陪同',
                '3天深度选品对比',
                '全套配置方案',
                '出厂物流跟踪保障'
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>

            <button 
              onClick={() => handleBooking('expert')}
              className="w-full bg-gray-300 text-gray-700 py-4 rounded-xl font-bold text-lg hover:bg-gray-400 transition-all"
            >
              立即预约
            </button>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-white text-center mb-12">为什么选择小迪陪买？</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            {
              icon: MapPin,
              title: '源头直达',
              desc: '直达 200+ 工厂，相当中间商的价格。'
            },
            {
              icon: Car,
              title: '专车接送',
              desc: '高端私人专车接送，全程轻松自由。'
            },
            {
              icon: Users,
              title: '专业陪同',
              desc: '资深行业专家陪同，给您最优性价比。'
            },
            {
              icon: Shield,
              title: '售后无忧',
              desc: '平台一站式客服，出现问题朎前解决。'
            }
          ].map((item, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center text-white border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg mb-2">{item.title}</h3>
              <p className="text-sm opacity-90">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
