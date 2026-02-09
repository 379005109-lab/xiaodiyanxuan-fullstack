import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ServicePackage {
  id: number;
  name: string;
  price: number;
  features: string[];
  highlight?: string;
}

const packages: ServicePackage[] = [
  {
    id: 1,
    name: '基础陪选服务',
    price: 1000,
    features: [
      '专车接送（高铁站/机场/酒店）',
      '1天深度选购行程',
      '专业陪价',
      '购满5000元抵扣服务费'
    ]
  },
  {
    id: 2,
    name: '专家定制陪选',
    price: 5000,
    highlight: '推荐',
    features: [
      '包含基础权益',
      '资深软装设计师陪同',
      '3天深度选品对比',
      '全屋搭配方案',
      '出厂价验货/清单'
    ]
  }
];

const benefits = [
  { icon: 'ri-map-pin-line', title: '源头直达', desc: '深入佛山产地' },
  { icon: 'ri-car-line', title: '专车接送', desc: '全程无忧出行' },
  { icon: 'ri-user-star-line', title: '专业陪同', desc: '资深买手服务' },
  { icon: 'ri-shield-check-line', title: '售后无忧', desc: '品质保障' }
];

export default function AccompanyServicePage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<ServicePackage | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    arrivalTime: '',
    city: '',
    note: ''
  });

  useEffect(() => {
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, []);

  const handleBooking = (pkg: ServicePackage) => {
    setSelectedPackage(pkg);
    setShowBookingModal(true);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.phone || !formData.arrivalTime) {
      return;
    }

    setIsSubmitting(true);

    // 模拟提交
    setTimeout(() => {
      setIsSubmitting(false);
      setShowBookingModal(false);
      setShowToast(true);
      
      // 重置表单
      setFormData({
        name: '',
        phone: '',
        arrivalTime: '',
        city: '',
        note: ''
      });

      // 2秒后隐藏提示
      setTimeout(() => {
        setShowToast(false);
      }, 2000);
    }, 1000);
  };

  const canSubmit = formData.name && formData.phone && formData.arrivalTime;

  // 加载中骨架屏
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] pb-[calc(80px+env(safe-area-inset-bottom))]">
        <div 
          className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="h-11 px-4 flex items-center justify-between">
            <div className="w-8 h-8 bg-[#E5E5EA] rounded-full animate-pulse"></div>
            <div className="w-20 h-5 bg-[#E5E5EA] rounded animate-pulse"></div>
            <div className="w-8"></div>
          </div>
        </div>
        
        <div style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}>
          <div className="h-[200px] bg-[#E5E5EA] animate-pulse"></div>
          <div className="px-4 mt-4 space-y-3">
            <div className="h-32 bg-white rounded-xl animate-pulse"></div>
            <div className="h-32 bg-white rounded-xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-[calc(80px+env(safe-area-inset-bottom))]">
      {/* 顶部导航栏 */}
      <nav 
        className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 px-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
          >
            <i className="ri-arrow-left-line text-[22px] text-[#1C1C1E]"></i>
          </button>
          <h1 className="font-semibold text-[17px] text-[#1C1C1E]">陪选服务</h1>
          <div className="w-8"></div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <div style={{ marginTop: 'calc(44px + env(safe-area-inset-top))' }}>
        {/* 头图 Banner */}
        <div className="relative h-[200px]">
          <img 
            src="https://readdy.ai/api/search-image?query=modern%20luxury%20furniture%20showroom%20in%20Foshan%20China%2C%20professional%20interior%20design%20exhibition%20hall%20with%20elegant%20furniture%20displays%2C%20warm%20lighting%2C%20spacious%20layout%2C%20high-end%20furniture%20pieces%2C%20contemporary%20style%2C%20professional%20photography&width=800&height=400&seq=accompany-banner-001&orientation=landscape"
            alt="佛山源头陪选"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h2 className="text-white text-[22px] font-bold mb-2">佛山源头陪选服务</h2>
            <p className="text-white/90 text-[14px] leading-relaxed">
              深入佛山家具产地，资深买手陪同<br/>
              逛200+展厅，省去中间商差价
            </p>
          </div>
        </div>

        {/* 套餐对比卡 */}
        <div className="px-4 mt-4 space-y-3">
          {packages.map((pkg) => (
            <div 
              key={pkg.id}
              className="bg-white rounded-[16px] p-4 relative overflow-hidden"
            >
              {pkg.highlight && (
                <div className="absolute top-0 right-0">
                  <div className="bg-[#FF6B35] text-white text-[11px] px-3 py-1 rounded-bl-[8px] font-medium">
                    {pkg.highlight}
                  </div>
                </div>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#1C1C1E] mb-1">
                    {pkg.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-[#FF6B35] text-[14px] font-medium">¥</span>
                    <span className="text-[#FF6B35] text-[28px] font-bold">{pkg.price.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {pkg.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <i className="ri-checkbox-circle-fill text-[16px] text-[#34C759] mt-0.5 flex-shrink-0"></i>
                    <span className="text-[14px] text-[#3C3C43] leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleBooking(pkg)}
                className="w-full h-11 bg-white border border-[#D2D2D7] text-[#1D1D1F] rounded-[14px] text-[16px] font-semibold cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-all whitespace-nowrap"
              >
                立即预约
              </button>
            </div>
          ))}
        </div>

        {/* 为什么选择陪选 */}
        <div className="px-4 mt-5">
          <h3 className="text-[17px] font-semibold text-[#1C1C1E] mb-3">为什么选择陪选？</h3>
          <div className="grid grid-cols-2 gap-3">
            {benefits.map((benefit, idx) => (
              <div 
                key={idx}
                className="bg-white rounded-[12px] p-4 flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mb-2">
                  <i className={`${benefit.icon} text-[24px] text-[#FF6B35]`}></i>
                </div>
                <h4 className="text-[15px] font-medium text-[#1C1C1E] mb-1">{benefit.title}</h4>
                <p className="text-[12px] text-[#8E8E93]">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 服务流程 */}
        <div className="px-4 mt-5 mb-6">
          <h3 className="text-[17px] font-semibold text-[#1C1C1E] mb-3">服务流程</h3>
          <div className="bg-white rounded-[16px] p-4">
            <div className="space-y-4">
              {[
                { step: '01', title: '提交预约', desc: '填写预约信息，选择服务套餐' },
                { step: '02', title: '确认行程', desc: '专属顾问联系，确认时间地点' },
                { step: '03', title: '专车接送', desc: '高铁站/机场/酒店接送服务' },
                { step: '04', title: '深度选购', desc: '资深买手陪同，逛200+展厅' },
                { step: '05', title: '售后保障', desc: '品质验货，全程跟踪服务' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-[14px] font-bold text-[#FF6B35]">{item.step}</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-[15px] font-medium text-[#1C1C1E] mb-0.5">{item.title}</h4>
                    <p className="text-[13px] text-[#8E8E93]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 预约弹窗 - iOS Bottom Sheet */}
      {showBookingModal && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-50"
            onClick={() => setShowBookingModal(false)}
          ></div>
          <div 
            className="fixed left-0 right-0 bottom-0 z-50 bg-white rounded-t-[20px] animate-slide-up"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="px-4 pt-4 pb-6">
              {/* 标题栏 */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[18px] font-semibold text-[#1C1C1E]">预约{selectedPackage?.name}</h3>
                <button 
                  onClick={() => setShowBookingModal(false)}
                  className="w-8 h-8 flex items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
                >
                  <i className="ri-close-line text-[24px] text-[#8E8E93]"></i>
                </button>
              </div>

              {/* 表单 */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-[14px] text-[#1C1C1E] font-medium mb-2">
                    姓名 <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入您的姓名"
                    className="w-full h-11 bg-[#F2F2F7] rounded-[8px] px-3 text-[15px] text-[#1C1C1E] placeholder-[#C6C6C8] outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#1C1C1E] font-medium mb-2">
                    联系电话 <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="请输入手机号码"
                    className="w-full h-11 bg-[#F2F2F7] rounded-[8px] px-3 text-[15px] text-[#1C1C1E] placeholder-[#C6C6C8] outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#1C1C1E] font-medium mb-2">
                    到达时间 <span className="text-[#FF3B30]">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                    className="w-full h-11 bg-[#F2F2F7] rounded-[8px] px-3 text-[15px] text-[#1C1C1E] outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#1C1C1E] font-medium mb-2">
                    城市/酒店
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="如：佛山市/希尔顿酒店"
                    className="w-full h-11 bg-[#F2F2F7] rounded-[8px] px-3 text-[15px] text-[#1C1C1E] placeholder-[#C6C6C8] outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
                  />
                </div>

                <div>
                  <label className="block text-[14px] text-[#1C1C1E] font-medium mb-2">
                    备注说明
                  </label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="请输入其他需求或说明..."
                    maxLength={200}
                    className="w-full h-20 bg-[#F2F2F7] rounded-[8px] p-3 text-[14px] text-[#1C1C1E] placeholder-[#C6C6C8] resize-none outline-none focus:ring-2 focus:ring-[#FF6B35]/30"
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className={`w-full h-12 rounded-[14px] text-[16px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  canSubmit && !isSubmitting
                    ? 'bg-white border border-[#D2D2D7] text-[#1D1D1F] hover:bg-[#F5F5F7] active:bg-[#F5F5F7]'
                    : 'bg-[#E5E5EA] text-[#8E8E93] border border-[#E5E5EA] cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="ri-loader-4-line animate-spin"></i>
                    提交中...
                  </span>
                ) : (
                  '确认预约'
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* 成功提示 Toast */}
      {showToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 backdrop-blur-sm rounded-[12px] px-6 py-4 min-w-[160px]">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-[#34C759] rounded-full flex items-center justify-center mb-3">
              <i className="ri-check-line text-white text-[24px]"></i>
            </div>
            <p className="text-white text-[15px] font-medium text-center">预约成功</p>
            <p className="text-white/80 text-[13px] text-center mt-1">我们将尽快与您联系</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
