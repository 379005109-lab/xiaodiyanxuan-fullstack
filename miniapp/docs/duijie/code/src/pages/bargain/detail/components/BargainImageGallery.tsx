
import { useState, useRef, useCallback } from 'react';

interface Props {
  images: string[];
  title: string;
  /** 
   * The textual style label of the product (e.g., “简约”, “复古”).  
   * Renamed from `style` to avoid conflict with the native JSX `style` attribute. 
   */
  styleLabel: string;
  hotLevel: number;
}

export default function BargainImageGallery({
  images,
  title,
  styleLabel,
  hotLevel,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgStates, setImgStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>(
    // Initialise every image state as “loading”
    Object.fromEntries(images.map((_, i) => [i, 'loading'] as const))
  );

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  /** Record the X coordinate when a touch starts */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  /** Determine swipe direction & update the current index */
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      touchEndX.current = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX.current;

      // Only react to a swipe larger than 50 px
      if (Math.abs(diff) > 50) {
        if (diff > 0 && currentIndex < images.length - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else if (diff < 0 && currentIndex > 0) {
          setCurrentIndex((prev) => prev - 1);
        }
      }
    },
    [currentIndex, images.length]
  );

  /** Mark an image as successfully loaded */
  const handleImgLoad = (index: number) => {
    setImgStates((prev) => ({ ...prev, [index]: 'loaded' }));
  };

  /** Mark an image as failed to load */
  const handleImgError = (index: number) => {
    setImgStates((prev) => ({ ...prev, [index]: 'error' }));
  };

  return (
    <div className="bg-white">
      {/* 图片轮播 */}
      <div
        className="relative w-full aspect-square overflow-hidden bg-[#F5F5F7]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {images.map((img, index) => (
            <div key={index} className="w-full aspect-square flex-shrink-0 relative">
              {imgStates[index] === 'error' ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F5F7]">
                  <i className="ri-image-line text-3xl text-[#C6C6C8] mb-2" />
                  <span className="text-[12px] text-[#86868B]">加载失败</span>
                </div>
              ) : (
                <img
                  src={img}
                  alt={`${title} ${index + 1}`}
                  className={`w-full h-full object-cover object-top transition-opacity duration-300 ${
                    imgStates[index] === 'loaded' ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => handleImgLoad(index)}
                  onError={() => handleImgError(index)}
                />
              )}
            </div>
          ))}
        </div>

        {/* 指示器 */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-[3px] rounded-full transition-all duration-300 cursor-pointer ${
                index === currentIndex
                  ? 'w-5 bg-[#1D1D1F]'
                  : 'w-[3px] bg-[#1D1D1F]/25'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 商品标题信息 */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="px-2.5 py-1 border border-[#E5E5EA] text-[#6E6E73] text-[11px] rounded-full tracking-wide">
            {styleLabel}
          </span>
          <span className="px-2.5 py-1 border border-[#E5E5EA] text-[#6E6E73] text-[11px] rounded-full flex items-center gap-1 tracking-wide">
            <i className="ri-fire-line text-[11px]" />
            热度 {hotLevel}
          </span>
        </div>
        <h1 className="text-[20px] font-semibold text-[#1D1D1F] leading-[1.35] tracking-tight">
          {title}
        </h1>
      </div>
    </div>
  );
}
