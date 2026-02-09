import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { heroBanners } from '../../../mocks/home';

type VideoState = 'idle' | 'loading' | 'playing' | 'error';

export default function HeroBanner() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [videoState, setVideoState] = useState<VideoState>('idle');
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const totalSlides = heroBanners.length;

  // 自动轮播
  const startAutoPlay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % totalSlides);
    }, 5000);
  }, [totalSlides]);

  const stopAutoPlay = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isAutoPlay && videoState !== 'playing') {
      startAutoPlay();
    }
    return () => stopAutoPlay();
  }, [isAutoPlay, videoState, startAutoPlay, stopAutoPlay]);

  // 切换 slide 时重置视频状态
  useEffect(() => {
    const banner = heroBanners[current];
    if (banner.type !== 'video') {
      setVideoState('idle');
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [current]);

  // 视区检测：滑出暂停视频
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && videoState === 'playing' && videoRef.current) {
          videoRef.current.pause();
          setVideoState('idle');
          setIsAutoPlay(true);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [videoState]);

  const handlePlayVideo = () => {
    setVideoState('loading');
    setIsAutoPlay(false);
    stopAutoPlay();

    // 模拟视频加载（实际项目替换为真实视频源）
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current
          .play()
          .then(() => setVideoState('playing'))
          .catch(() => setVideoState('error'));
      } else {
        // 无真实视频源时展示 error 态以演示
        setVideoState('error');
      }
    }, 800);
  };

  const handleRetryVideo = () => {
    setVideoState('idle');
  };

  const handleVideoEnd = () => {
    setVideoState('idle');
    setIsAutoPlay(true);
    setCurrent((prev) => (prev + 1) % totalSlides);
  };

  // 触摸滑动
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    stopAutoPlay();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrent((prev) => (prev + 1) % totalSlides);
      } else {
        setCurrent((prev) => (prev - 1 + totalSlides) % totalSlides);
      }
    }
    if (isAutoPlay) startAutoPlay();
  };

  const goToSlide = (index: number) => {
    setCurrent(index);
    if (isAutoPlay) startAutoPlay();
  };

  const banner = heroBanners[current];

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-[#F5F5F7]"
      style={{ height: 'calc(100vh - 60px)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 所有 slides */}
      {heroBanners.map((slide, index) => {
        const isActive = index === current;
        const isVideoSlide = slide.type === 'video';

        return (
          <div
            key={slide.id}
            className="absolute inset-0 transition-opacity duration-700 ease-out"
            style={{
              opacity: isActive ? 1 : 0,
              zIndex: isActive ? 10 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            {/* 背景图 / 封面 */}
            <div className="absolute inset-0">
              <img
                src={isVideoSlide ? slide.poster : slide.image}
                alt={slide.title}
                className="w-full h-full object-cover object-top"
              />
            </div>

            {/* 视频播放层 */}
            {isVideoSlide && isActive && videoState === 'playing' && (
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                poster={slide.poster}
                muted
                playsInline
                onEnded={handleVideoEnd}
                aria-label="工厂工艺视频展示"
              >
                <source src={slide.videoUrl} type="video/mp4" />
              </video>
            )}

            {/* 暗色渐变蒙层 - 降低透明度 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

            {/* 整个 slide 可点击跳转（非视频播放态） */}
            {!(isVideoSlide && isActive && (videoState === 'playing' || videoState === 'loading')) && (
              <div
                className="absolute inset-0 z-10 cursor-pointer"
                onClick={() => {
                  if (isVideoSlide && isActive && videoState === 'idle') return;
                  navigate(slide.link);
                }}
              />
            )}

            {/* 视频播放按钮 - 封面态 */}
            {isVideoSlide && isActive && videoState === 'idle' && (
              <button
                onClick={handlePlayVideo}
                className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 transition-all duration-200 group-active:scale-90">
                  <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                    <i className="ri-play-fill text-[#1D1D1F] text-[24px] ml-0.5"></i>
                  </div>
                </div>
              </button>
            )}

            {/* 视频加载中 */}
            {isVideoSlide && isActive && videoState === 'loading' && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              </div>
            )}

            {/* 视频加载失败 */}
            {isVideoSlide && isActive && videoState === 'error' && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3">
                <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <i className="ri-wifi-off-line text-white/80 text-[24px]"></i>
                </div>
                <p className="text-white/70 text-[13px]">视频加载失败</p>
                <button
                  onClick={handleRetryVideo}
                  className="h-[44px] px-6 rounded-[14px] bg-white border border-[#D2D2D7] text-[#1D1D1F] text-[15px] font-medium cursor-pointer transition-all duration-150 active:bg-[#F5F5F7] whitespace-nowrap"
                >
                  重试
                </button>
              </div>
            )}

            {/* 底部文案 */}
            {!(isVideoSlide && isActive && videoState === 'playing') && (
              <div className="absolute bottom-14 left-0 right-0 z-20 px-6">
                <h2 className="text-white text-[24px] font-semibold leading-tight tracking-tight">
                  {slide.title}
                </h2>
                <p className="text-white/70 text-[14px] mt-1.5 font-normal">
                  {slide.subtitle}
                </p>
                <button
                  onClick={() => navigate(slide.link)}
                  className="mt-4 inline-flex items-center gap-1.5 h-[44px] px-5 rounded-[14px] bg-white border border-[#D2D2D7] text-[#1D1D1F] text-[15px] font-medium cursor-pointer transition-all duration-150 active:bg-[#F5F5F7] whitespace-nowrap"
                >
                  {isVideoSlide ? '探索工艺' : '了解更多'}
                  <i className="ri-arrow-right-line text-[14px]"></i>
                </button>
              </div>
            )}

            {/* 视频播放中的控制条 */}
            {isVideoSlide && isActive && videoState === 'playing' && (
              <div className="absolute bottom-14 left-0 right-0 z-20 px-6 flex items-center justify-between">
                <span className="text-white/60 text-[12px]">正在播放 · 工厂工艺</span>
                <button
                  onClick={() => {
                    if (videoRef.current) videoRef.current.pause();
                    setVideoState('idle');
                    setIsAutoPlay(true);
                  }}
                  className="w-8 h-8 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer active:scale-90 transition-transform"
                >
                  <i className="ri-pause-fill text-white text-[16px]"></i>
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* 底部指示器 */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {heroBanners.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="relative cursor-pointer group"
            style={{ padding: '4px 0' }}
          >
            <div
              className="h-[2px] rounded-full transition-all duration-500 ease-out"
              style={{
                width: index === current ? '24px' : '8px',
                backgroundColor:
                  index === current ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
