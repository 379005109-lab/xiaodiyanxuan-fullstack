import { useState, useEffect } from 'react';

interface Props {
  currentPrice: number;
  originalPrice: number;
  targetPrice: number;
  savedAmount: number;
  remainingAmount: number;
  progress: number;
  remainingTime: number;
  userStatus: string;
}

/**
 * BargainPriceSection
 *
 * Displays price information, progress bar and a countdown timer.
 * The component is defensive – it validates numeric inputs and
 * guarantees that the timer never goes below zero.
 */
export default function BargainPriceSection({
  currentPrice,
  originalPrice,
  targetPrice,
  savedAmount,
  remainingAmount,
  progress,
  remainingTime: initialTime,
  userStatus,
}: Props) {
  // -------------------------------------------------------------------------
  // State & Effects
  // -------------------------------------------------------------------------
  const [remainingTime, setRemainingTime] = useState(() =>
    Number.isFinite(initialTime) && initialTime > 0 ? Math.floor(initialTime) : 0,
  );

  // Reset timer when the prop changes
  useEffect(() => {
    setRemainingTime(Number.isFinite(initialTime) && initialTime > 0 ? Math.floor(initialTime) : 0);
  }, [initialTime]);

  // Countdown logic – runs while remainingTime > 0
  useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        const next = prev - 1;
        return next > 0 ? next : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
    // Only re‑run when remainingTime becomes 0 or when it is reset from props
  }, [remainingTime]);

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const h = Math.floor(safeSeconds / 3600);
    const m = Math.floor((safeSeconds % 3600) / 60);
    const s = safeSeconds % 60;
    return {
      h: String(h).padStart(2, '0'),
      m: String(m).padStart(2, '0'),
      s: String(s).padStart(2, '0'),
    };
  };

  const time = formatTime(remainingTime);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="border-t border-[#E5E5EA]">
      <div className="px-4 py-5">
        {/* 价格区域 */}
        <div className="flex items-end justify-between mb-5">
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-[11px] text-[#1D1D1F] font-medium">¥</span>
              <span className="text-[32px] font-bold text-[#1D1D1F] tracking-tight leading-none">
                {Number.isFinite(currentPrice) ? currentPrice.toLocaleString() : '--'}
              </span>
              <span className="text-[13px] text-[#86868B] line-through ml-1">
                ¥{Number.isFinite(originalPrice) ? originalPrice.toLocaleString() : '--'}
              </span>
            </div>
            <div className="text-[12px] text-[#86868B] mt-1">
              目标价 ¥{Number.isFinite(targetPrice) ? targetPrice.toLocaleString() : '--'}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#86868B] mb-0.5">还差</div>
            <div className="text-[22px] font-bold text-[#1D1D1F] tracking-tight leading-none">
              ¥{Number.isFinite(remainingAmount) ? remainingAmount.toFixed(0) : '--'}
            </div>
          </div>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] text-[#86868B] mb-2">
            <span>已砍 ¥{Number.isFinite(savedAmount) ? savedAmount.toFixed(0) : '--'}</span>
            <span className="font-medium text-[#1D1F1F]">
              {Number.isFinite(progress) ? progress.toFixed(0) : '--'}%
            </span>
          </div>
          <div className="h-[3px] bg-[#E5E5EA] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#1D1D1F] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${Math.min(progress ?? 0, 100)}%` }}
            />
          </div>
        </div>

        {/* 倒计时 */}
        {userStatus !== 'expired' && remainingTime > 0 && (
          <div className="flex items-center justify-center gap-2.5 py-3 bg-[#F5F5F7] rounded-xl">
            <i className="ri-time-line text-[13px] text-[#86868B]" />
            <span className="text-[12px] text-[#86868B]">距离结束</span>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-[#1D1D1F] text-white text-[12px] font-mono font-bold rounded-md">
                {time.h}
              </span>
              <span className="text-[#1D1D1F] font-bold text-[12px]">:</span>
              <span className="inline-flex items-center justify-center w-6 h-6 bg-[#1D1D1F] text-white text-[12px] font-mono font-bold rounded-md">
                {time.m}
              </span>
              <span className="text-[#1D1D1F] font-bold text-[12px]">:</span>
              <span className="inline-flex items-center justify-center w-6 h-6 bg-[#1D1D1F] text-white text-[12px] font-mono font-bold rounded-md">
                {time.s}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
