
import React from 'react';

interface Props {
  onClose: () => void;
}

const shareChannels = [
  { icon: 'ri-wechat-fill', label: '微信', bg: 'bg-[#07C160]' },
  { icon: 'ri-wechat-line', label: '朋友圈', bg: 'bg-[#07C160]' },
  { icon: 'ri-qq-fill', label: 'QQ', bg: 'bg-[#1296DB]' },
  {
    icon: 'ri-link',
    label: '复制链接',
    bg: 'bg-[#E5E5EA]',
    iconColor: 'text-[#6E6E73]',
  },
];

export default function BargainSharePanel({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/30 z-50 flex items-end"
      onClick={onClose}
    >
      <div
        className="w-full bg-white rounded-t-[20px] animate-[slideUp_0.26s_cubic-bezier(0.25,0.46,0.45,0.94)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center pt-6 pb-4 px-4">
          <h3 className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight mb-1">
            分享给好友
          </h3>
          <p className="text-[13px] text-[#86868B]">
            邀请好友帮砍，更快达到目标价
          </p>
        </div>

        <div className="grid grid-cols-4 gap-5 px-6 pb-6">
          {shareChannels.map((channel) => (
            <button
              key={channel.label}
              className="flex flex-col items-center gap-2 cursor-pointer transition-all duration-150 active:scale-95"
            >
              <div
                className={`w-12 h-12 rounded-full ${channel.bg} flex items-center justify-center`}
              >
                <i
                  className={`${channel.icon} text-xl ${
                    channel.iconColor || 'text-white'
                  }`}
                />
              </div>
              <span className="text-[11px] text-[#6E6E73]">
                {channel.label}
              </span>
            </button>
          ))}
        </div>

        <div className="border-t border-[#E5E5EA] px-4 py-3">
          <button
            onClick={onClose}
            className="w-full h-[44px] bg-[#F5F5F7] text-[#1D1D1F] rounded-full text-[15px] font-medium cursor-pointer whitespace-nowrap transition-all duration-150 active:scale-[0.98] active:bg-[#EBEBED]"
          >
            取消
          </button>
        </div>
      </div>

      {/* Inline keyframes definition – moved out of JSX expression to avoid syntax errors */}
      <style>
        {`@keyframes slideUp {
            from { transform: translateY(100%); }
            to   { transform: translateY(0); }
          }`}
      </style>
    </div>
  );
}
