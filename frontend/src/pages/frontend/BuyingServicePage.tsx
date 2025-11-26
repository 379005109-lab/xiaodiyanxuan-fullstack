import { useState } from 'react'
import { Check, MapPin, Car, Users, Shield, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { toast } from 'sonner'
import axios from '@/lib/apiClient'

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

  const handleBookingClick = (serviceType?: 'standard' | 'expert') => {
    if (!isAuthenticated) {
      toast.error('请先登录账号')
      openLogin()
      return
    }
    // 如果传入了serviceType，自动选择
    if (serviceType) {
      setSelectedService(serviceType)
    }
    // 不再检查selectedService，直接打开对话框
    setShowBookingModal(true)
  }

  const handleSubmitBooking = async () => {
    if (!bookingDate) {
      toast.error('请选择预约时间')
      return
    }
    
    try {
      const { user } = useAuthStore.getState()
      
      const bookingData = {
        serviceType: selectedService,
        scheduledDate: bookingDate,
        notes: bookingNotes,
        user: (user as any)?.id || user?._id || user, // 修复：使用id字段
        userName: (user as any)?.username || (user as any)?.name || '未知用户',
        userPhone: (user as any)?.phone || '',
        status: 'pending',
      }
      
      console.log('📤 提交陪买预约:', bookingData)
      
      const response = await axios.post('/buying-service-requests', bookingData)
      
      console.log('✅ 预约提交成功:', response)
      toast.success('预约成功！我们将尽快与您联系')
      
      setShowBookingModal(false)
      setBookingDate('')
      setBookingNotes('')
      setSelectedService(null)
    } catch (error: any) {
      console.error('❌ 预约提交失败:', error)
      if (error.response?.data?.message) {
        toast.error('预约失败：' + error.response.data.message)
      } else {
        toast.error('预约失败，请稍后重试')
      }
    }
  }

  return (
    <div className="min-h-screen">
      {/* Green Background Section - 绿色背景区域包含标题和服务卡片 */}
      <div className="bg-[#2d5a42] pb-24">
        {/* Hero Section */}
        <div className="text-center text-white pt-24 pb-12 px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">佛山源头陪买服务</h1>
          <p className="text-sm md:text-base max-w-3xl mx-auto">
            深入佛山家具产地，专车接送，资深买手带您逛遍 200+ 源头展厅，<br className="hidden md:block" />
            省去中间商差价，享受真正的一手出厂价。
          </p>
        </div>

        {/* Service Cards - 白色卡片在绿色背景上 */}
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 基础陪买服务 - 左侧卡片，金色边框 */}
          <div 
            onClick={() => handleServiceSelect('standard')}
            className={`bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all ${
              selectedService === 'standard' ? 'border-4 border-[#D4A574]' : 'border-4 border-[#D4A574]'
            }`}
          >
            <div className="p-8">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">基础陪买服务</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">STANDARD GUIDE</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-[#D4A574] mb-2">¥1,000</div>
                <p className="text-xs text-gray-500">* 购满 5000 元全额抵扣陪买服务费</p>
              </div>

              <ul className="space-y-2.5 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">专车接送（广佛区域：高铁站、机场、酒店）</span>
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
                  handleBookingClick('standard')  // 直接传入服务类型
                }}
                className="w-full bg-[#2d5a42] text-white py-3 rounded-lg font-bold hover:bg-[#234433] transition-all"
              >
                立即预约
              </button>
            </div>
          </div>

          {/* 专家定制陪买 - 右侧卡片 */}
          <div 
            onClick={() => handleServiceSelect('expert')}
            className={`bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transition-all ${
              selectedService === 'expert' ? 'border-4 border-[#D4A574]' : 'border-2 border-gray-200'
            }`}
          >
            <div className="p-8">
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 mb-1">专家定制陪买</h3>
                <p className="text-xs text-gray-500 uppercase tracking-wider">EXPERT GUIDE</p>
              </div>

              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-gray-700 mb-2">¥5,000</div>
                <p className="text-xs text-gray-500">* 购满 1 万元全额抵扣陪买服务费</p>
              </div>

              <ul className="space-y-2.5 mb-6">
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
                  handleBookingClick('expert')  // 直接传入服务类型
                }}
                className="w-full bg-gray-200 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-300 transition-all"
              >
                立即预约
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gray Background Section - 浅灰色背景区域 */}
      <div className="bg-gray-50 py-20 px-4">
        {/* Why Choose Us */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">为什么选择小迪陪买？</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="font-bold text-base mb-2 text-gray-900">源头直达</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                直达 200+ 工厂，省接中间商渠道差价
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="font-bold text-base mb-2 text-gray-900">专车接送</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                高端商务专车接送，全程轻松惬意
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="font-bold text-base mb-2 text-gray-900">专业陪同</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                资深行业老手陪同，帮您筛选最优性价比
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-gray-700" />
              </div>
              <h3 className="font-bold text-base mb-2 text-gray-900">售后无忧</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                平台统一售后客服，出现问题秒级响应
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
