import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function ShopInfoPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'cert'>('info');

  const shopInfo = {
    name: '小迪严选',
    logo: 'https://readdy.ai/api/search-image?query=Modern%20minimalist%20furniture%20store%20logo%20design%20elegant%20simple%20circular%20badge%20with%20stylized%20home%20furniture%20icon%20warm%20orange%20and%20white%20color%20scheme%20professional%20brand%20identity%20clean%20background&width=200&height=200&seq=shop-logo-xiaodi&orientation=squarish',
    contactName: '小迪',
    phone: '13000000000',
    businessHours: '9:00-18:00',
    address: '广东省佛山市顺德区十里家私城325国道辅道3537号',
    isVerified: true,
    factoryArea: '12000㎡',
    showroomArea: '3000㎡',
    craftProcesses: '36道工序',
    description: '小迪严选专注于高品质家具定制，拥有现代化生产基地和专业设计团队，为客户提供一站式家居解决方案。',
  };

  const handleCall = () => {
    window.location.href = `tel:${shopInfo.phone}`;
  };

  const handleNavigate = () => {
    // 导航到店铺位置
    const address = encodeURIComponent(shopInfo.address);
    window.open(`https://uri.amap.com/marker?position=113.29,22.80&name=${encodeURIComponent(shopInfo.name)}&src=myapp&coordinate=gaode&callnative=1`);
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center -ml-2 cursor-pointer active:scale-95 transition-transform"
          >
            <i className="ri-arrow-left-line text-[20px] text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">
            店铺信息
          </h1>
          <button
            className="w-8 h-8 flex items-center justify-center -mr-2 cursor-pointer active:scale-95 transition-transform"
          >
            <i className="ri-more-2-fill text-[20px] text-[#1D1D1F]"></i>
          </button>
        </div>
      </div>

      {/* 地图区域 */}
      <div className="relative w-full h-[280px] bg-[#F5F5F7]">
        <iframe
          src={`https://maps.google.com/maps?q=${encodeURIComponent(shopInfo.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
        
        {/* 地图上的店铺标记 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
          <i className="ri-map-pin-fill text-[40px] text-[#FF3B30]"></i>
        </div>
      </div>

      {/* 店铺基本信息 */}
      <div className="px-4 py-5 border-b border-[#E5E5EA]">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-[#F5F5F7] flex items-center justify-center">
            <img
              src={shopInfo.logo}
              alt={shopInfo.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[20px] font-semibold text-[#1D1D1F] tracking-tight">
                {shopInfo.name}
              </h2>
              {shopInfo.isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#34C759]/10 text-[#34C759] text-[11px] rounded-full border border-[#34C759]/20">
                  <i className="ri-checkbox-circle-fill text-[11px]"></i>
                  认证连锁
                </span>
              )}
            </div>

            {/* 工厂数据 */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[13px] text-[#86868B]">
                工厂 {shopInfo.factoryArea}
              </span>
              <span className="text-[13px] text-[#D2D2D7]">·</span>
              <span className="text-[13px] text-[#86868B]">
                展厅 {shopInfo.showroomArea}
              </span>
              <span className="text-[13px] text-[#D2D2D7]">·</span>
              <span className="text-[13px] text-[#86868B]">
                {shopInfo.craftProcesses}
              </span>
            </div>

            <p className="text-[13px] text-[#86868B] leading-[1.5]">
              {shopInfo.description}
            </p>
          </div>
        </div>
      </div>

      {/* 联系信息 */}
      <div className="px-4 py-5 border-b border-[#E5E5EA]">
        <div className="space-y-4">
          {/* 联系人 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
              <i className="ri-user-line text-[16px] text-[#1D1D1F]"></i>
            </div>
            <div className="flex-1">
              <div className="text-[13px] text-[#86868B] mb-0.5">联系人</div>
              <div className="text-[15px] text-[#1D1D1F] font-medium">{shopInfo.contactName}</div>
            </div>
            <button
              onClick={handleCall}
              className="px-4 py-1.5 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-[13px] font-medium rounded-full cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
            >
              拨打
            </button>
          </div>

          {/* 电话 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
              <i className="ri-phone-line text-[16px] text-[#1D1D1F]"></i>
            </div>
            <div className="flex-1">
              <div className="text-[13px] text-[#86868B] mb-0.5">电话</div>
              <div className="text-[15px] text-[#1D1D1F] font-medium">{shopInfo.phone}</div>
            </div>
          </div>

          {/* 营业时间 */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
              <i className="ri-time-line text-[16px] text-[#1D1D1F]"></i>
            </div>
            <div className="flex-1">
              <div className="text-[13px] text-[#86868B] mb-0.5">运营时间</div>
              <div className="text-[15px] text-[#1D1D1F] font-medium">{shopInfo.businessHours}</div>
            </div>
          </div>

          {/* 地址 */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F5F5F7] flex items-center justify-center flex-shrink-0">
              <i className="ri-map-pin-line text-[16px] text-[#1D1D1F]"></i>
            </div>
            <div className="flex-1">
              <div className="text-[13px] text-[#86868B] mb-0.5">地址</div>
              <div className="text-[15px] text-[#1D1D1F] font-medium leading-[1.5]">
                {shopInfo.address}
              </div>
            </div>
            <button
              onClick={handleNavigate}
              className="px-4 py-1.5 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-[13px] font-medium rounded-full cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-colors whitespace-nowrap"
            >
              导航
            </button>
          </div>
        </div>
      </div>

      {/* 底部操作栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E5EA] px-4 py-3 safe-area-inset-bottom">
        <div className="flex gap-3">
          <button
            onClick={handleCall}
            className="flex-1 h-12 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-[15px] font-semibold rounded-xl cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-all whitespace-nowrap flex items-center justify-center gap-2"
          >
            <i className="ri-phone-line text-[18px]"></i>
            电话咨询
          </button>
          <button
            onClick={handleNavigate}
            className="flex-1 h-12 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-[15px] font-semibold rounded-xl cursor-pointer hover:bg-[#F5F5F7] active:bg-[#F5F5F7] transition-all whitespace-nowrap flex items-center justify-center gap-2"
          >
            <i className="ri-navigation-line text-[18px]"></i>
            导航到店
          </button>
        </div>
      </div>
    </div>
  );
}
