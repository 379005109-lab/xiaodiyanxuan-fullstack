import { useNavigate } from 'react-router-dom';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* 导航栏 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="px-4 h-11 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer"
          >
            <i className="ri-arrow-left-s-line text-xl text-[#1D1D1F]"></i>
          </button>
          <h1 className="flex-1 text-center text-base font-semibold text-[#1D1D1F]">隐私设置</h1>
          <div className="w-8"></div>
        </div>
      </div>

      {/* 隐私政策与用户协议 */}
      <div className="p-3">
        <div className="bg-white rounded-xl overflow-hidden">
          <button
            onClick={() => {/* 查看隐私政策 */}}
            className="w-full flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA] cursor-pointer active:bg-black/5"
          >
            <span className="text-sm text-[#1D1D1F]">隐私政策</span>
            <i className="ri-arrow-right-s-line text-lg text-[#C7C7CC]"></i>
          </button>

          <button
            onClick={() => {/* 查看用户协议 */}}
            className="w-full flex items-center justify-between px-4 py-3 cursor-pointer active:bg-black/5"
          >
            <span className="text-sm text-[#1D1D1F]">用户协议</span>
            <i className="ri-arrow-right-s-line text-lg text-[#C7C7CC]"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
