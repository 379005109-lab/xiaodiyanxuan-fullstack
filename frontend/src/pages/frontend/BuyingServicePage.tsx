import { useState } from 'react'
import { Check, MapPin, Car, Users, Shield, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { toast } from 'sonner'

export default function BuyingServicePage() {
  const { isAuthenticated } = useAuthStore()
  const { openLogin } = useAuthModalStore()
  const [selectedService, setSelectedService] = useState<'standard' | 'expert' | null>(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [bookingDate, setBookingDate] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')

  const handleServiceSelect = (serviceType: 'standard' | 'expert') => {
    setSelectedService(serviceType)
  }

  const handleBookingClick = () => {
    if (!isAuthenticated) {
      toast.error('请先登录账号')
      openLogin()
      return
    }
    if (!selectedService) {
      toast.error('请先选择陪买服务类型')
      return
    }
    setShowBookingModal(true)
  }

  const handleSubmitBooking = () => {
    if (!bookingDate) {
      toast.error('请选择预约时间')
      return
    }
    // TODO: 提交预约到后端
    toast.success('预约成功！我们将尽快与您联系')
    setShowBookingModal(false)
    setBookingDate('')
    setBookingNotes('')
    setSelectedService(null)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Green Section - 上部1/3绿色 */}
      <div className="bg-gradient-to-b from-[#2d5a42] to-[#2d5a42] pt-20 pb-20" style={{ minHeight: '33.33vh' }}>
        {/* Hero Section */}
        <div className="text-center text-white py-8 px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">佛山源头陪买服务</h1>
          <p className="text-base md:text-lg mb-2">
            深入佛山家具产地，专车接送，资深买手带您逛遍 200+ 源头展厅，
          </p>
          <p className="text-base md:text-lg">
            省去中间商差价，享受真正的一手出厂价。
          </p>
        </div>

        {/* Service Cards - 仍在绿色区域 */}
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 基础陪买服务 */}
          <div 
            onClick={() => handleServiceSelect('standard')}
            className={`bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all transform hover:scale-105 ${
              selectedService === 'standard' ? 'border-4 border-[#D4A574] ring-4 ring-[#D4A574]/30' : 'border-2 border-gray-200'
            }`}
          >
            <div className="relative">
              {/* MOST VALUE 标签 */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                <div className="bg-[#D4A574] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  # MOST VALUE
                </div>
              </div>
              
              <div className="p-8 pt-16">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">基础陪买服务</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">STANDARD GUIDE</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-[#D4A574] mb-2">¥1,000</div>
                  <p className="text-sm text-gray-600">* 购满 5000 元全额抵扣陪买服务费</p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">专车接送（广佛区域：含高铁站、飞机场）</span>
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
                  onClick={(e) => {
                    e.stopPropagation()
                    handleServiceSelect('standard')
                    handleBookingClick()
                  }}
                  className="w-full bg-[#2d5a42] text-white py-3 rounded-lg font-bold hover:bg-[#234433] transition-all shadow-md"
                >
                  立即预约
                </button>
              </div>
            </div>
          </div>

          {/* 专家定制陪买 */}
          <div 
            onClick={() => handleServiceSelect('expert')}
            className={`bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all transform hover:scale-105 ${
              selectedService === 'expert' ? 'border-4 border-[#D4A574] ring-4 ring-[#D4A574]/30' : 'border-2 border-gray-300'
            }`}
          >
            <div className="p-8">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">专家定制陪买</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">EXPERT GUIDE</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-700 mb-2">¥5,000</div>
                <p className="text-sm text-gray-600">* 购满 1 万元全额抵扣陪买服务费</p>
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
                onClick={(e) => {
                  e.stopPropagation()
                  handleServiceSelect('expert')
                  handleBookingClick()
                }}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-400 transition-all"
              >
                立即预约
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gray Section - 下部2/3浅灰色 */}
      <div className="bg-gray-100 py-16 px-4 flex-1" style={{ minHeight: '66.67vh' }}>
        {/* Why Choose Us */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">为什么选择小迪陪买？</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-bold text-base mb-2 text-gray-900">源头直达</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                直达 200+ 工厂，相接中间商渠道差价
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Car className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-bold text-base mb-2 text-gray-900">专车接送</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                高端私房专车接送，全程轻松随意
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-gray-700" />
              </div>
              <h3 className="font-bold text-base mb-2 text-gray-900">专业陪关</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                资深行业老手陪同，帮您筛选较优性价比
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm">
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

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">预约陪买服务</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-6">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
                <p className="text-sm text-primary font-medium">
                  已选择: {selectedService === 'standard' ? '基础陪买服务 ¥1,000' : '专家定制陪买 ¥5,000'}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">预约时间 *</label>
                  <input
                    type="datetime-local"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">备注信息（选填）</label>
                  <textarea
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    placeholder="请填写您的特殊需求或备注..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmitBooking}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-green-900 transition-colors shadow-md"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
