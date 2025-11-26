import { useState } from 'react'
import { Check, MapPin, Car, Users, Shield } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { toast } from 'sonner'

export default function BuyingServicePage() {
  const { isAuthenticated } = useAuthStore()
  const { openLogin } = useAuthModalStore()

  const handleBooking = (serviceType: 'standard' | 'expert') => {
    if (!isAuthenticated) {
      toast.error('请先登录账号')
      openLogin()
      return
    }
    toast.success(`已选择${serviceType === 'standard' ? '基础陪买服务' : '专家定制陪买'}，请联系客服预约`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2d5a42] via-[#2d5a42] to-[#234433] pt-20 pb-16">
      {/* Hero Section */}
      <div className="text-center text-white py-16 px-4">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">佛山源头陪买服务</h1>
        <p className="text-base md:text-lg mb-2">
          深入佛山家具产地，专车接送，资深买手带您逛遍 200+ 源头展厅，
        </p>
        <p className="text-base md:text-lg">
          省去中间商差价，享受真正的一手出厂价。
        </p>
      </div>

      {/* Service Cards */}
      <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        {/* 基础陪买服务 - 金色边框 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-4 border-[#D4A574]">
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">基础陪买服务</h3>
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-[#D4A574] mb-2">¥1,000</div>
              <p className="text-sm text-gray-600">* 购满 5 万元全额抵扣陪买服务费</p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">专车接送（「顺德港」、「龙江镇」、「乐从镇」）</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">1天深度选购行程</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">专业陪价</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">购满5000元抵扣服务费</span>
              </li>
            </ul>

            <button 
              onClick={() => handleBooking('standard')}
              className="w-full bg-[#2d5a42] text-white py-3 rounded-lg font-bold hover:bg-[#234433] transition-all"
            >
              立即预约
            </button>
          </div>
        </div>

        {/* 专家定制陪买 */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gray-300">
          <div className="p-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">专家定制陪买</h3>
            </div>

            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-gray-700 mb-2">¥5,000</div>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">包含基础陪买服务所有权益</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">资深软装设计师陪同</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">3天深度选品对比</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">全屋搭配方案</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">出厂价验货跟单</span>
              </li>
            </ul>

            <button 
              onClick={() => handleBooking('expert')}
              className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition-all"
            >
              立即预约
            </button>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-white text-center mb-10">为什么选择小迪陪买？</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MapPin className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold text-base mb-2 text-gray-900">源头直达</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              直达 200+ 工厂，相接中间商渠道差价
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Car className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold text-base mb-2 text-gray-900">专车接送</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              高端私房专车接送，全程轻松随意
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold text-base mb-2 text-gray-900">专业陪关</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              资深行业老手陪同，帮您筛选较优性价比
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-gray-700" />
            </div>
            <h3 className="font-bold text-base mb-2 text-gray-900">售后无忧</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              平台统一质量客服，出现问题秒前响应
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
