import { Link } from 'react-router-dom';
import { galleryImages } from '../../../mocks/home';
import { useState } from 'react';

export default function ImageGallery() {
  const [imageStates, setImageStates] = useState<Record<number, 'loading' | 'loaded' | 'error'>>(
    galleryImages.reduce((acc, item) => ({ ...acc, [item.id]: 'loading' }), {})
  );

  const handleImageLoad = (id: number) => {
    setImageStates(prev => ({ ...prev, [id]: 'loaded' }));
  };

  const handleImageError = (id: number) => {
    setImageStates(prev => ({ ...prev, [id]: 'error' }));
  };

  const handleRetry = (id: number, imageSrc: string) => {
    setImageStates(prev => ({ ...prev, [id]: 'loading' }));
    const img = new Image();
    img.onload = () => handleImageLoad(id);
    img.onerror = () => handleImageError(id);
    img.src = imageSrc;
  };

  const getPlaceholderIcon = (title: string) => {
    if (title.includes('客厅')) return 'ri-sofa-line';
    if (title.includes('卧室')) return 'ri-hotel-bed-line';
    if (title.includes('餐厅')) return 'ri-restaurant-line';
    if (title.includes('书房')) return 'ri-book-line';
    return 'ri-image-line';
  };

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-[17px] font-semibold text-[#1C1C1E]">
          <a href="/products/list" className="hover:opacity-80">空间灵感</a>
        </h4>
        <Link
          to="/products/list"
          className="text-[13px] text-[#FF6B35] flex items-center cursor-pointer whitespace-nowrap"
        >
          更多 <i className="ri-arrow-right-s-line text-[15px]"></i>
        </Link>
      </div>

      {/* 瀑布流双列布局 */}
      <div className="flex gap-2.5">
        {/* 左列 */}
        <div className="flex-1 flex flex-col gap-2.5">
          {galleryImages.filter((_, i) => i % 2 === 0).map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="relative rounded-xl overflow-hidden cursor-pointer active:opacity-90 transition-opacity group bg-white shadow-sm"
              style={{ height: item.height === 'tall' ? '240px' : '160px' }}
            >
              {/* 加载中骨架屏 */}
              {imageStates[item.id] === 'loading' && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" 
                       style={{ 
                         backgroundSize: '200% 100%',
                         animation: 'shimmer 1.5s infinite'
                       }} 
                  />
                </div>
              )}

              {/* 加载失败占位图 */}
              {imageStates[item.id] === 'error' && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    <i className={`${getPlaceholderIcon(item.title)} text-[32px] text-gray-300`}></i>
                  </div>
                  <span className="text-[12px] text-gray-400 mb-3">暂无封面</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRetry(item.id, item.image);
                    }}
                    className="px-3 py-1 bg-white text-[12px] text-gray-600 rounded-full border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all whitespace-nowrap"
                  >
                    重试
                  </button>
                </div>
              )}

              {/* 实际图片 */}
              <img
                src={item.image}
                alt={item.title}
                title={item.title}
                className={`w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-500 ${
                  imageStates[item.id] === 'loaded' ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => handleImageLoad(item.id)}
                onError={() => handleImageError(item.id)}
              />
              
              {/* 渐变蒙层和标题 */}
              {imageStates[item.id] === 'loaded' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white text-[14px] font-medium drop-shadow-sm">{item.title}</span>
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>
        
        {/* 右列 */}
        <div className="flex-1 flex flex-col gap-2.5">
          {galleryImages.filter((_, i) => i % 2 === 1).map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className="relative rounded-xl overflow-hidden cursor-pointer active:opacity-90 transition-opacity group bg-white shadow-sm"
              style={{ height: item.height === 'tall' ? '240px' : '160px' }}
            >
              {/* 加载中骨架屏 */}
              {imageStates[item.id] === 'loading' && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" 
                       style={{ 
                         backgroundSize: '200% 100%',
                         animation: 'shimmer 1.5s infinite'
                       }} 
                  />
                </div>
              )}

              {/* 加载失败占位图 */}
              {imageStates[item.id] === 'error' && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 flex items-center justify-center mb-2">
                    <i className={`${getPlaceholderIcon(item.title)} text-[32px] text-gray-300`}></i>
                  </div>
                  <span className="text-[12px] text-gray-400 mb-3">暂无封面</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleRetry(item.id, item.image);
                    }}
                    className="px-3 py-1 bg-white text-[12px] text-gray-600 rounded-full border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all whitespace-nowrap"
                  >
                    重试
                  </button>
                </div>
              )}

              {/* 实际图片 */}
              <img
                src={item.image}
                alt={item.title}
                title={item.title}
                className={`w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-500 ${
                  imageStates[item.id] === 'loaded' ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => handleImageLoad(item.id)}
                onError={() => handleImageError(item.id)}
              />
              
              {/* 渐变蒙层和标题 */}
              {imageStates[item.id] === 'loaded' && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="text-white text-[14px] font-medium drop-shadow-sm">{item.title}</span>
                  </div>
                </>
              )}
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
}
