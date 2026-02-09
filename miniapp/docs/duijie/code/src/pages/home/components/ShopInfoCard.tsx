import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInViewAnimation } from '../../../hooks/useInViewAnimation';

interface ShopInfo {
  logo?: string;
  name: string;
  address?: string;
  contactName?: string;
  phone?: string;
  isVerified: boolean;
}

const shopData: ShopInfo = {
  logo: 'https://readdy.ai/api/search-image?query=Minimalist%20modern%20furniture%20store%20logo%20design%20featuring%20elegant%20house%20icon%20with%20sofa%20silhouette%20inside%20circular%20badge%20warm%20orange%20gradient%20background%20professional%20clean%20simple%20geometric%20shapes%20premium%20quality%20brand%20identity%20smooth%20gradients%20contemporary%20style&width=200&height=200&seq=xiaodi-select-logo-v2&orientation=squarish',
  name: '小迪严选',
  address: '广东省佛山市顺德区十里家私城325国道辅道3537号',
  contactName: '小迪',
  phone: '13000000000',
  isVerified: true,
};

export default function ShopInfoCard() {
  const navigate = useNavigate();
  const [logoState, setLogoState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [showFullAddress, setShowFullAddress] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInViewAnimation(cardRef, { threshold: 0.3 });

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (shopData.phone) {
      window.location.href = `tel:${shopData.phone}`;
    }
  };

  const handleShopInfo = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/shop/info');
  };

  const handleShopPoster = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/shop/poster');
  };

  return (
    <div
      ref={cardRef}
      className={`px-4 bg-white transition-all duration-500 ease-out ${
        isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div
        className="bg-[#F5F5F7] rounded-2xl overflow-hidden cursor-pointer hover-info-card"
        onClick={handleShopInfo}
      >
        {/* 主信息 */}
        <div className="p-5">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
              {logoState === 'error' && (
                <span className="text-[20px] font-semibold text-[#1D1D1F]">
                  {shopData.name.charAt(0)}
                </span>
              )}
              {shopData.logo && (
                <img
                  src={shopData.logo}
                  alt={shopData.name}
                  className={`w-full h-full object-cover transition-opacity duration-300 ${
                    logoState === 'loaded' ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setLogoState('loaded')}
                  onError={() => setLogoState('error')}
                />
              )}
            </div>

            {/* 信息 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-[17px] font-semibold text-[#1D1D1F] truncate tracking-tight">
                  {shopData.name}
                </h3>
                {shopData.isVerified && (
                  <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 bg-white text-[#1D1D1F] text-[11px] rounded-full">
                    <i className="ri-checkbox-circle-fill text-[11px] text-[#34C759]"></i>
                    已认证
                  </span>
                )}
              </div>

              {/* 联系人和手机号 */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[13px] text-[#86868B]">
                  联系人：{shopData.contactName}
                </span>
                <span className="text-[13px] text-[#D2D2D7]">·</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] text-[#86868B]">
                    {shopData.phone}
                  </span>
                  <button
                    onClick={handleCall}
                    className="w-5 h-5 flex items-center justify-center cursor-pointer hover:bg-white/50 rounded-full transition-colors active:scale-95"
                  >
                    <i className="ri-phone-fill text-[13px] text-[#34C759]"></i>
                  </button>
                </div>
              </div>

              {/* 地址 */}
              {shopData.address && (
                <div
                  className="flex items-start gap-1.5 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullAddress(!showFullAddress);
                  }}
                >
                  <i className="ri-map-pin-line text-[13px] text-[#86868B] mt-0.5 flex-shrink-0"></i>
                  <p
                    className={`text-[12px] text-[#86868B] leading-[1.5] ${
                      showFullAddress ? '' : 'line-clamp-1'
                    }`}
                  >
                    {shopData.address}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="border-t border-[#E5E5EA]">
          <div className="flex">
            <button
              onClick={handleShopInfo}
              className="flex-1 py-3.5 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#EBEBED] active:bg-[#E0E0E2] transition-colors"
            >
              <i className="ri-store-2-line text-[15px] text-[#1D1D1F]"></i>
              <span className="text-[13px] text-[#1D1D1F] font-medium">店铺信息</span>
            </button>
            <div className="w-px bg-[#E5E5EA]"></div>
            <button
              onClick={handleShopPoster}
              className="flex-1 py-3.5 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#EBEBED] active:bg-[#E0E0E2] transition-colors"
            >
              <i className="ri-image-line text-[15px] text-[#1D1D1F]"></i>
              <span className="text-[13px] text-[#1D1D1F] font-medium">店铺海报</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
