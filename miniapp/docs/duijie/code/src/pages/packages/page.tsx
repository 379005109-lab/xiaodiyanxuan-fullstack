import { Link } from 'react-router-dom';
import TabBar from '../../components/TabBar';
import { packages } from '../../mocks/packages';

export default function PackagesPage() {
  return (
    <div className="min-h-screen bg-white pb-[calc(49px+env(safe-area-inset-bottom))]">
      {/* 顶部导航栏 - Apple风格 */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]">
        <div className="h-11 flex items-center justify-between px-4">
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">套餐</h1>
          <Link
            to="/packages/my"
            className="flex items-center gap-1 text-[14px] text-[#1D1D1F] cursor-pointer transition-opacity duration-150 active:opacity-60"
          >
            <i className="ri-file-list-3-line text-[16px]"></i>
            <span>我的套餐</span>
          </Link>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* 页面标题 */}
        <div className="mb-5">
          <h2 className="text-[22px] font-bold text-[#1D1D1F] mb-1">灵感套系</h2>
          <p className="text-[13px] text-[#6E6E73]">精选家具套餐，一站式配齐</p>
        </div>

        {/* 套餐列表 - Apple卡片风格 */}
        <div className="space-y-3 pb-4">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-[#F5F5F7] rounded-2xl overflow-hidden border border-[#E5E5EA]">
              <Link
                to={`/packages/detail/${pkg.id}`}
                className="block transition-colors duration-150 active:bg-[#E8E8ED] cursor-pointer"
              >
                <div className="flex p-3.5 gap-3.5">
                  {/* 左侧图片 */}
                  <div className="w-[100px] h-[100px] rounded-xl overflow-hidden flex-shrink-0 bg-white">
                    <img
                      src={pkg.image}
                      alt={pkg.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* 右侧信息 */}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      {/* 套餐名称 */}
                      <h3 className="text-[16px] font-semibold text-[#1D1D1F] mb-1.5">
                        {pkg.name}
                      </h3>
                      {/* 标签 - 浅底胶囊 */}
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="px-2.5 py-1 bg-white border border-[#D2D2D7] rounded-full text-[11px] text-[#6E6E73]">
                          {pkg.style}
                        </span>
                        <span className="px-2.5 py-1 bg-white border border-[#D2D2D7] rounded-full text-[11px] text-[#6E6E73]">
                          {pkg.roomType}
                        </span>
                      </div>
                    </div>

                    {/* 底部价格和数量 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[11px] text-[#6E6E73]">¥</span>
                        <span className="text-[18px] font-bold text-[#1D1D1F]">
                          {pkg.price?.toLocaleString?.() ?? pkg.price}
                        </span>
                      </div>
                      <span className="text-[12px] text-[#6E6E73]">
                        可选{pkg.salesCount}件
                      </span>
                    </div>
                  </div>

                  {/* 右侧箭头 */}
                  <div className="flex items-center">
                    <i className="ri-arrow-right-s-line text-[20px] text-[#C7C7CC]"></i>
                  </div>
                </div>
              </Link>

              {/* 底部操作按钮 */}
              <div className="px-3.5 pb-3.5">
                <Link
                  to={`/packages/config/${pkg.id}`}
                  className="block w-full h-[44px] bg-white border border-[#D2D2D7] rounded-[14px] text-[14px] font-medium text-[#1D1D1F] text-center cursor-pointer transition-all duration-150 active:bg-[#F5F5F7] whitespace-nowrap flex items-center justify-center"
                >
                  配置此套系
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 底部提示 */}
        <div className="text-center py-6 text-[13px] text-[#6E6E73]">已展示全部套餐</div>
      </div>

      <TabBar />
    </div>
  );
}
