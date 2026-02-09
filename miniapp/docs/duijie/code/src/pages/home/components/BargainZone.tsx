import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bargainProducts } from '../../../mocks/home';
import { useInViewAnimation } from '../../../hooks/useInViewAnimation';

export default function BargainZone() {
  const navigate = useNavigate();
  const [countdowns, setCountdowns] = useState<Record<string, string>>({});
  const titleRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const isTitleInView = useInViewAnimation(titleRef, { threshold: 0.5 });
  const areCardsInView = useInViewAnimation(cardsRef, { threshold: 0.2 });

  // -------------------------------------------------------------------------
  // Countdown logic – runs once on mount and then updates every second.
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Helper that safely calculates the remaining time for each product.
    const calculateCountdowns = (): Record<string, string> => {
      const result: Record<string, string> = {};

      bargainProducts.forEach((product) => {
        // Guard against malformed endTime values.
        if (typeof product.endTime !== 'number' || Number.isNaN(product.endTime)) {
          result[product.id] = '00:00:00';
          return;
        }

        const remaining = product.endTime - Date.now();

        if (remaining > 0) {
          const hours = Math.floor(remaining / 3_600_000);
          const minutes = Math.floor((remaining % 3_600_000) / 60_000);
          const seconds = Math.floor((remaining % 60_000) / 1_000);

          result[product.id] = `${hours
            .toString()
            .padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
        } else {
          result[product.id] = '00:00:00';
        }
      });

      return result;
    };

    // Initialise state.
    setCountdowns(calculateCountdowns());

    // Update every second.
    const timer = setInterval(() => {
      setCountdowns(calculateCountdowns());
    }, 1000);

    // Cleanup on unmount.
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white">
      {/* 标题 */}
      <div
        ref={titleRef}
        className={`flex items-center justify-between mb-6 transition-all duration-500 ease-out ${
          isTitleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div>
          <h2 className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight leading-tight">
            砍价专区
          </h2>
          <p className="text-[13px] text-[#86868B] mt-1.5 leading-relaxed">邀请好友帮砍，超低价带回家</p>
        </div>
        <Link
          to="/bargain/list"
          className="text-[13px] text-[#1D1D1F] flex items-center gap-0.5 cursor-pointer press-interactive"
        >
          全部
          <i className="ri-arrow-right-s-line text-[16px]"></i>
        </Link>
      </div>

      {/* 横向滚动 */}
      <div 
        ref={cardsRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4"
      >
        {bargainProducts.map((product, index) => (
          <Link
            key={product.id}
            to={`/bargain/detail/${product.id}`}
            className={`flex-shrink-0 cursor-pointer hover-card group transition-all duration-500 ease-out ${
              areCardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ 
              width: '160px',
              transitionDelay: areCardsInView ? `${index * 60}ms` : '0ms'
            }}
          >
            {/* 图片 */}
            <div className="relative w-[160px] h-[160px] rounded-2xl overflow-hidden bg-[#F5F5F7]">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover object-top hover-img-zoom"
              />
              {/* 倒计时 - 改为浅底胶囊 */}
              <div className="absolute top-3 left-3 bg-[#F5F5F7]/90 backdrop-blur-md border border-[#D2D2D7] text-[#1D1D1F] text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 font-mono">
                <i className="ri-time-line text-[10px]"></i>
                {countdowns[product.id] || '00:00:00'}
              </div>
            </div>

            {/* 信息 */}
            <div className="mt-3 px-0.5">
              <h3 className="text-[13px] font-normal text-[#1D1D1F] line-clamp-2 leading-[1.4] min-h-[36px]">
                {product.name}
              </h3>

              {/* 进度 */}
              <div className="mt-2.5 flex items-center gap-2">
                <div className="flex-1 h-[2px] bg-[#E5E5EA] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#1D1D1F] rounded-full transition-all duration-300"
                    style={{ width: `${product.progress}%` }}
                  />
                </div>
                <span className="text-[10px] text-[#86868B] font-medium">{product.progress}%</span>
              </div>

              {/* 价格 */}
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[#1D1D1F] font-semibold text-[17px] tracking-tight">
                  <span className="text-[11px]">¥</span>
                  {product.currentPrice}
                </span>
                <span className="text-[#86868B] text-[12px] line-through">
                  ¥{product.originalPrice}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 底部入口 */}
      <button
        onClick={() => navigate('/bargain/list')}
        className="w-full mt-6 h-[48px] bg-white border border-[#D2D2D7] rounded-[16px] flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-150 active:bg-[#F5F5F7] whitespace-nowrap"
      >
        <span className="text-[15px] text-[#1D1D1F] font-medium">
          查看全部砍价商品
        </span>
        <i className="ri-arrow-right-s-line text-[#86868B] text-[16px]"></i>
      </button>
    </div>
  );
}
