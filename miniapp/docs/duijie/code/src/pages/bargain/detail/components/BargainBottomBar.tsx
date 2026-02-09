import React from 'react';

interface Props {
  userStatus: 'not_started' | 'ongoing' | 'success' | 'expired';
  onStartBargain: () => void;
  onCutAgain: () => void;
  onInviteFriends: () => void;
  onShare: () => void;
  onOrder: () => void;
  onViewSimilar: () => void;
}

/**
 * Bottom bar component for the bargain page.
 *
 * Handles four possible user states:
 *  - not_started : show a single "发起砍价" button
 *  - ongoing     : show "我再砍一刀" & "邀请好友帮砍"
 *  - success     : show "分享喜报" & "立即下单"
 *  - expired     : show "查看相似" & a disabled "已结束" button
 *
 * All callbacks are optional‑safe – if a prop is omitted the component
 * will simply ignore the click instead of throwing.
 */
export default function BargainBottomBar({
  userStatus,
  onStartBargain = () => {},
  onCutAgain = () => {},
  onInviteFriends = () => {},
  onShare = () => {},
  onOrder = () => {},
  onViewSimilar = () => {},
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-[#E5E5EA] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {/* Not started – single start button */}
      {userStatus === 'not_started' && (
        <button
          type="button"
          onClick={onStartBargain}
          className="w-full h-[48px] bg-white text-[#1D1D1F] rounded-[16px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 active:bg-[#F5F5F7] border border-[#D2D2D7]"
        >
          发起砍价
        </button>
      )}

      {/* Ongoing – cut again & invite friends */}
      {userStatus === 'ongoing' && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCutAgain}
            className="flex-1 h-[48px] border border-[#D2D2D7] text-[#1D1D1F] rounded-[16px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 active:bg-[#F5F5F7] bg-white"
          >
            我再砍一刀
          </button>
          <button
            type="button"
            onClick={onInviteFriends}
            className="flex-1 h-[48px] bg-white text-[#1D1D1F] rounded-[16px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 active:bg-[#F5F5F7] border border-[#D2D2D7]"
          >
            邀请好友帮砍
          </button>
        </div>
      )}

      {/* Success – share & order */}
      {userStatus === 'success' && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onShare}
            className="flex-1 h-[48px] border border-[#D2D2D7] text-[#1D1D1F] rounded-[16px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 active:bg-[#F5F5F7] bg-white"
          >
            分享喜报
          </button>
          <button
            type="button"
            onClick={onOrder}
            className="flex-1 h-[48px] bg-white text-[#1D1D1F] rounded-[16px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 active:bg-[#F5F5F7] border border-[#D2D2D7]"
          >
            立即下单
          </button>
        </div>
      )}

      {/* Expired – view similar & disabled end button */}
      {userStatus === 'expired' && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onViewSimilar}
            className="flex-1 h-[48px] border border-[#D2D2D7] text-[#1D1D1F] rounded-[16px] text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-200 active:bg-[#F5F5F7] bg-white"
          >
            查看相似
          </button>
          <button
            type="button"
            disabled
            className="flex-1 h-[48px] bg-[#E5E5EA] text-[#86868B] rounded-[16px] text-[15px] font-medium whitespace-nowrap cursor-not-allowed border border-[#E5E5EA]"
          >
            已结束
          </button>
        </div>
      )}
    </div>
  );
}
