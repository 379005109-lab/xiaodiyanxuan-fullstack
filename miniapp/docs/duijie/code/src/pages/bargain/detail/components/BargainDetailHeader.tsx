
import { useState, useEffect } from 'react';

interface Props {
  onBack: () => void;
  onShare: () => void;
}

export default function BargainDetailHeader({ onBack, onShare }: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup to avoid memory leaks
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-[#E5E5EA]'
          : 'bg-white border-b border-[#E5E5EA]'
      }`}
    >
      <div className="flex items-center justify-between h-12 px-4">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 active:scale-90 active:bg-[#F5F5F7]"
        >
          <i className="ri-arrow-left-line text-lg text-[#1D1D1F]" />
        </button>
        <span className="text-[15px] font-semibold text-[#1D1D1F] tracking-tight">
          砍价详情
        </span>
        <button
          onClick={onShare}
          className="w-8 h-8 flex items-center justify-center rounded-full cursor-pointer transition-all duration-150 active:scale-90 active:bg-[#F5F5F7]"
        >
          <i className="ri-share-forward-line text-lg text-[#1D1D1F]" />
        </button>
      </div>
    </div>
  );
}
