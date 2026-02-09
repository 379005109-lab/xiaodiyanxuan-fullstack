import { useState } from 'react';
import { usePressAnimation } from '../../../hooks/usePressAnimation';

export default function ShopPosterPage() {
  const [showToast, setShowToast] = useState(false);
  const backButtonPress = usePressAnimation();
  const shareButtonPress = usePressAnimation();
  const saveButtonPress = usePressAnimation();

  const handleBack = () => {
    window.REACT_APP_NAVIGATE?.(-1);
  };

  const handleShare = () => {
    // Share functionality
  };

  const handleSave = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-[#1D1D1F] text-white px-6 py-3 rounded-full text-sm font-medium shadow-lg">
            海报已保存到相册
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA] z-40">
        <div className="flex items-center justify-between h-14 px-4">
          <button
            onClick={handleBack}
            className="w-10 h-10 flex items-center justify-center -ml-2"
            {...backButtonPress.handlers}
            style={backButtonPress.style}
          >
            <i className="ri-arrow-left-line text-[22px] text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">店铺海报</h1>
          <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center -mr-2"
            {...shareButtonPress.handlers}
            style={shareButtonPress.style}
          >
            <i className="ri-share-line text-[22px] text-[#1D1D1F]"></i>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-5 py-8 overflow-y-auto">
        {/* Poster Card */}
        <div className="max-w-md mx-auto bg-[#F5F5F7] rounded-2xl overflow-hidden">
          {/* Top Info Section */}
          <div className="px-8 pt-10 pb-6 text-center">
            {/* Shop Icon */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl overflow-hidden">
              <img
                src="https://readdy.ai/api/search-image?query=Modern%20minimalist%20furniture%20store%20logo%20design%20with%20warm%20orange%20gradient%20background%2C%20featuring%20a%20circular%20badge%20with%20house%20and%20sofa%20elements%2C%20geometric%20shapes%2C%20clean%20lines%2C%20professional%20quality%2C%20simple%20and%20elegant%20style%2C%20suitable%20for%20home%20furnishing%20brand%20identity&width=160&height=160&seq=xiaodi-logo-v2&orientation=squarish"
                alt="小迪严选"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Shop Name */}
            <h2 className="text-[22px] font-semibold text-[#1D1D1F] mb-6">
              小迪严选
            </h2>

            {/* Contact Info Card */}
            <div className="bg-white rounded-2xl border border-[#E5E5EA] overflow-hidden">
              {/* Contact Person */}
              <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-[15px] text-[#6E6E73]">联系人</span>
                <span className="text-[15px] text-[#1D1D1F] font-medium">小迪</span>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#E5E5EA] mx-5"></div>

              {/* Phone */}
              <div className="px-5 py-4 flex items-center justify-between">
                <span className="text-[15px] text-[#6E6E73]">电话</span>
                <span className="text-[15px] text-[#1D1D1F] font-medium">13000000000</span>
              </div>

              {/* Divider */}
              <div className="h-px bg-[#E5E5EA] mx-5"></div>

              {/* Address */}
              <div className="px-5 py-4 flex items-start justify-between">
                <span className="text-[15px] text-[#6E6E73] whitespace-nowrap">地址</span>
                <span className="text-[15px] text-[#1D1D1F] font-medium text-right ml-4">
                  广东省佛山市顺德区大良街道325国道辅道3537号
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Section - Main Visual */}
          <div className="px-6 pb-10">
            <div className="bg-white rounded-[20px] border border-[#E5E5EA] p-8">
              {/* QR Code */}
              <div className="w-full aspect-square max-w-[280px] mx-auto mb-6 bg-white rounded-2xl flex items-center justify-center">
                <img
                  src="https://readdy.ai/api/search-image?query=WeChat%20Mini%20Program%20QR%20code%20for%20furniture%20store%2C%20black%20and%20white%20square%20code%20pattern%2C%20clean%20design%2C%20scannable%20format%2C%20centered%20composition%2C%20high%20contrast%2C%20professional%20appearance&width=560&height=560&seq=xiaodi-qrcode-main&orientation=squarish"
                  alt="小迪严选小程序码"
                  className="w-full h-full object-contain"
                />
              </div>

              {/* QR Code Description */}
              <p className="text-center text-[13px] text-[#6E6E73] leading-relaxed">
                长按或扫描二维码进入小迪严选小店
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="sticky bottom-0 bg-white border-t border-[#E5E5EA] px-5 py-4">
        <button
          onClick={handleSave}
          className="w-full h-12 bg-white border border-[#D2D2D7] text-[#1D1D1F] text-[17px] font-semibold rounded-2xl whitespace-nowrap"
          {...saveButtonPress.handlers}
          style={saveButtonPress.style}
        >
          保存店铺海报后分享
        </button>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -8px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
}
