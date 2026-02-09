
import { useState, useRef } from 'react';
import { videoShowcase } from '../../../mocks/home';

export default function VideoSection() {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-[17px] font-semibold text-[#1C1C1E]">
          <a href="/products/list" className="hover:opacity-80">视频展示</a>
        </h4>
        <span className="text-[12px] text-[#8E8E93] bg-[#F2F2F7] px-2.5 py-1 rounded-full whitespace-nowrap">
          <i className="ri-play-circle-line mr-1"></i>品牌故事
        </span>
      </div>

      {/* 视频卡片 */}
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
        <div className="relative" style={{ height: '200px' }}>
          {!isPlaying ? (
            <>
              <img
                src={videoShowcase.poster}
                alt={videoShowcase.title}
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-black/20" />
              {/* 播放按钮 */}
              <button
                onClick={handlePlay}
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
              >
                <div className="w-14 h-14 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg group-active:scale-95 transition-transform">
                  <i className="ri-play-fill text-[#FF6B35] text-[28px] ml-1"></i>
                </div>
              </button>
              {/* 时长标签 */}
              <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded">
                02:36
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-[#1C1C1E] flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                poster={videoShowcase.poster}
                controls
                autoPlay
                aria-label="品牌工艺视频展示"
              >
                <source src={videoShowcase.videoUrl} type="video/mp4" />
              </video>
            </div>
          )}
        </div>

        {/* 视频信息 */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-[16px] font-semibold text-[#1C1C1E]">{videoShowcase.title}</h3>
              <p className="text-[13px] text-[#8E8E93] mt-0.5">{videoShowcase.subtitle}</p>
            </div>
            <div className="flex items-center gap-3 ml-3">
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] cursor-pointer active:bg-[#E5E5EA] transition-colors">
                <i className="ri-heart-line text-[#8E8E93] text-[16px]"></i>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] cursor-pointer active:bg-[#E5E5EA] transition-colors">
                <i className="ri-share-forward-line text-[#8E8E93] text-[16px]"></i>
              </button>
            </div>
          </div>
          <p className="text-[13px] text-[#636366] mt-2 leading-relaxed line-clamp-2">
            {videoShowcase.description}
          </p>
        </div>
      </div>
    </div>
  );
}
