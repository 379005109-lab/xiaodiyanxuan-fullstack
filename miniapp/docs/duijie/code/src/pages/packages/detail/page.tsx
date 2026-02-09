import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { packages } from '../../../mocks/packages';

export default function PackageDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);

  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-[48px] text-[#C7C7CC] mb-4"></i>
          <p className="text-[15px] text-[#6E6E73]">无效的套餐 ID</p>
        </div>
      </div>
    );
  }

  const pkg = packages.find(p => p.id === numericId);

  if (!pkg) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center">
        <div className="text-center">
          <i className="ri-error-warning-line text-[48px] text-[#C7C7CC] mb-4"></i>
          <p className="text-[15px] text-[#6E6E73]">套餐不存在</p>
        </div>
      </div>
    );
  }

  const handlePurchase = () => {
    setShowPurchaseModal(true);
  };

  const confirmPurchase = () => {
    setIsPurchased(true);
    setShowPurchaseModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] pb-[calc(100px+env(safe-area-inset-bottom))]">
      {/* 顶部导航栏 - Apple风格 */}
      <div
        className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E5E5EA]"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-11 flex items-center justify-between px-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90"
          >
            <i className="ri-arrow-left-s-line text-[28px] text-[#1D1D1F]"></i>
          </button>
          <h1 className="text-[17px] font-semibold text-[#1D1D1F]">套餐详情</h1>
          <button className="w-8 h-8 flex items-center justify-center cursor-pointer transition-transform duration-150 active:scale-90">
            <i className="ri-share-line text-[22px] text-[#1D1D1F]"></i>
          </button>
        </div>
      </div>

      <div style={{ paddingTop: 'calc(44px + env(safe-area-inset-top))' }}>
        {/* 套餐图片 */}
        <div className="relative h-[220px]">
          <img
            src={pkg.image}
            alt={pkg.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex gap-1.5 mb-2">
              {pkg.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/20 backdrop-blur-sm text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-[24px] font-bold text-white">{pkg.name}</h2>
          </div>
        </div>

        {/* 价格信息 */}
        <div className="mx-4 -mt-4 relative z-10 bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-[#1D1D1F]">
                  <span className="text-[16px] font-medium">¥</span>
                  <span className="text-[32px] font-bold">{pkg.price.toLocaleString()}</span>
                </div>
                <span className="text-[14px] text-[#8E8E93] line-through">
                  ¥{pkg.originalPrice.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 bg-[#F5F5F7] rounded-full text-[12px] font-medium text-[#6E6E73]">
                  {pkg.discount}
                </span>
              </div>
              <p className="text-[13px] text-[#6E6E73] mt-1">
                已省 ¥{(pkg.originalPrice - pkg.price).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-medium text-[#1D1D1F]">{pkg.salesCount}人已购</p>
              <p className="text-[12px] text-[#8E8E93]">有效期{pkg.validDays}天</p>
            </div>
          </div>
        </div>

        {/* 适用人群 */}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-[#F5F5F7] rounded-lg">
              <i className="ri-user-smile-line text-[16px] text-[#6E6E73]"></i>
            </div>
            <span className="text-[14px] text-[#6E6E73]">适用人群：</span>
            <span className="text-[14px] font-medium text-[#1D1D1F]">{pkg.targetAudience}</span>
          </div>
        </div>

        {/* 套餐亮点 */}
        {pkg.highlights && pkg.highlights.length > 0 && (
          <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
            <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-3">套餐亮点</h3>
            <div className="grid grid-cols-2 gap-2">
              {pkg.highlights.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#F5F5F7] rounded-xl px-3 py-2.5">
                  <i className="ri-star-fill text-[14px] text-[#1D1D1F]"></i>
                  <span className="text-[14px] font-medium text-[#1D1D1F]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 套餐内容 - 按房间分组 */}
        {pkg.contentGroups && pkg.contentGroups.length > 0 && (
          <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
            <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-3">套餐内容</h3>
            <div className="space-y-4">
              {pkg.contentGroups.map((group, gIdx) => (
                <div key={gIdx}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 bg-[#F5F5F7] rounded-lg text-[13px] font-medium text-[#1D1D1F]">
                      {group.room}
                    </span>
                  </div>
                  <div className="space-y-1.5 pl-1">
                    {group.items.map((item, iIdx) => (
                      <div key={iIdx} className="flex items-start gap-2">
                        <i className="ri-checkbox-circle-fill text-[14px] text-[#1D1D1F] mt-0.5 flex-shrink-0"></i>
                        <span className="text-[14px] text-[#6E6E73] leading-relaxed">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 产品图片展示 */}
        {pkg.productImages && pkg.productImages.length > 0 && (
          <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
            <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-3">产品展示</h3>
            <div className="grid grid-cols-3 gap-2">
              {pkg.productImages.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#F5F5F7]">
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                  </div>
                  <span className="text-[12px] text-[#6E6E73] mt-1.5">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 价格明细 */}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-3">价格明细</h3>
          <div className="space-y-0">
            {pkg.contents.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between py-3 border-b border-[#E5E5EA] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-[#F5F5F7] rounded-full text-[12px] font-medium text-[#6E6E73]">
                    {idx + 1}
                  </span>
                  <span className="text-[15px] text-[#1D1D1F]">{item.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[13px] text-[#8E8E93]">×{item.quantity}</span>
                  <span className="text-[14px] text-[#1D1D1F]">¥{item.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-[#E5E5EA] flex items-center justify-between">
            <span className="text-[14px] text-[#8E8E93]">单买总价</span>
            <span className="text-[16px] font-medium text-[#8E8E93] line-through">
              ¥{pkg.originalPrice.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 权益说明 */}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-3">权益说明</h3>
          <div className="grid grid-cols-2 gap-3">
            {pkg.benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <i className="ri-checkbox-circle-fill text-[16px] text-[#1D1D1F]"></i>
                <span className="text-[14px] text-[#6E6E73]">{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 套餐说明 */}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-3">套餐说明</h3>
          <p className="text-[14px] text-[#6E6E73] leading-relaxed">{pkg.description}</p>
        </div>

        {/* 有效期说明 */}
        <div className="mx-4 mt-3 bg-white rounded-2xl p-4">
          <h3 className="text-[17px] font-semibold text-[#1D1D1F] mb-3">有效期</h3>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex items-center justify-center bg-[#F5F5F7] rounded-lg">
              <i className="ri-calendar-line text-[16px] text-[#6E6E73]"></i>
            </div>
            <span className="text-[14px] text-[#6E6E73]">
              购买后{' '}
              <span className="font-medium text-[#1D1D1F]">{pkg.validDays}天</span> 内有效
            </span>
          </div>
        </div>

        {/* 购买记录入口 */}
        <div className="mx-4 mt-3 bg-white rounded-2xl overflow-hidden">
          <button
            onClick={() => navigate('/packages/my')}
            className="w-full flex items-center justify-between px-4 py-4 cursor-pointer transition-colors duration-150 active:bg-[#F5F5F7]"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 flex items-center justify-center bg-[#F5F5F7] rounded-lg">
                <i className="ri-file-list-3-line text-[16px] text-[#6E6E73]"></i>
              </div>
              <span className="text-[17px] text-[#1D1D1F]">查看购买记录</span>
            </div>
            <i className="ri-arrow-right-s-line text-[20px] text-[#C7C7CC]"></i>
          </button>
        </div>

        <div className="h-4"></div>
      </div>

      {/* 底部购买栏 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-[#E5E5EA]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="h-[60px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button className="flex flex-col items-center cursor-pointer transition-transform duration-150 active:scale-90">
              <i className="ri-customer-service-2-line text-[22px] text-[#6E6E73]"></i>
              <span className="text-[10px] text-[#8E8E93]">客服</span>
            </button>
            <button className="flex flex-col items-center cursor-pointer transition-transform duration-150 active:scale-90">
              <i className="ri-heart-line text-[22px] text-[#6E6E73]"></i>
              <span className="text-[10px] text-[#8E8E93]">收藏</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(`/packages/config/${id}`)}
              className="px-5 py-2.5 bg-white border border-[#D2D2D7] rounded-[14px] text-[15px] font-medium text-[#1D1D1F] whitespace-nowrap cursor-pointer transition-all duration-150 active:bg-[#F5F5F7]"
            >
              配置此套系
            </button>
            <button
              onClick={handlePurchase}
              disabled={isPurchased}
              className={`px-6 py-2.5 rounded-[14px] text-[15px] font-medium whitespace-nowrap cursor-pointer transition-all duration-150 ${
                isPurchased
                  ? 'bg-[#E5E5EA] text-[#8E8E93] border border-[#E5E5EA]'
                  : 'bg-white border border-[#D2D2D7] text-[#1D1D1F] active:bg-[#F5F5F7]'
              }`}
            >
              {isPurchased ? '已购买' : `¥${pkg.price.toLocaleString()} 立即购买`}
            </button>
          </div>
        </div>
      </div>

      {/* 购买确认弹窗 - iOS风格 */}
      {showPurchaseModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowPurchaseModal(false)}
          ></div>
          <div
            className="relative w-full bg-white rounded-t-[20px] p-6 animate-slide-up"
            style={{ paddingBottom: 'calc(24px + env(safe-area-inset-bottom))' }}
          >
            <div className="flex justify-center mb-2">
              <div className="w-9 h-1 bg-[#D1D1D6] rounded-full"></div>
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[17px] font-semibold text-[#1D1D1F]">确认购买</h3>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="w-8 h-8 flex items-center justify-center bg-[#F5F5F7] rounded-full cursor-pointer transition-transform duration-150 active:scale-90"
              >
                <i className="ri-close-line text-[20px] text-[#6E6E73]"></i>
              </button>
            </div>

            <div className="flex items-center gap-4 p-4 bg-[#F5F5F7] rounded-2xl mb-6">
              <img
                src={pkg.image}
                alt={pkg.name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h4 className="text-[16px] font-medium text-[#1D1D1F] mb-1">{pkg.name}</h4>
                <p className="text-[13px] text-[#8E8E93] mb-2">有效期{pkg.validDays}天</p>
                <div className="text-[#1D1D1F]">
                  <span className="text-[14px]">¥</span>
                  <span className="text-[20px] font-bold">{pkg.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#8E8E93]">套餐价格</span>
                <span className="text-[14px] text-[#1D1D1F]">¥{pkg.price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#8E8E93]">优惠</span>
                <span className="text-[14px] text-[#34C759]">
                  -¥{(pkg.originalPrice - pkg.price).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#E5E5EA]">
                <span className="text-[15px] font-medium text-[#1D1D1F]">实付金额</span>
                <div className="text-[#1D1D1F]">
                  <span className="text-[14px]">¥</span>
                  <span className="text-[22px] font-bold">{pkg.price.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={confirmPurchase}
              className="w-full py-4 bg-white border border-[#D2D2D7] rounded-[14px] text-[17px] font-medium text-[#1D1D1F] cursor-pointer transition-all duration-150 active:bg-[#F5F5F7] whitespace-nowrap"
            >
              确认支付
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
