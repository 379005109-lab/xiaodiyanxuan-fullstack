import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInViewAnimation } from '../../../hooks/useInViewAnimation';

interface SpaceCard {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  link: string;
}

const spaces: SpaceCard[] = [
  {
    id: 1,
    title: '奶油风客厅',
    subtitle: '展厅实景方案',
    image:
      'https://readdy.ai/api/search-image?query=High-end%20residential%20living%20room%20inspiration%20dark%20wood%20paneling%20with%20light%20fabric%20sofa%20contrast%20rug%20and%20rock%20slab%20stone%20coffee%20table%20single%20large%20window%20side%20light%20creates%20strong%20chiaroscuro%20clean%20uncluttered%20space%2035mm%20lens%20low%20saturation%20warm%20neutral%20tones%20cinematic%20atmosphere%20ultra%20realistic%20no%20text%20no%20logo%20no%20watermark%20no%20UI&width=800&height=800&seq=space-inspiration-living-1&orientation=squarish',
    link: '/products/category',
  },
  {
    id: 2,
    title: '温馨卧室',
    subtitle: '软装搭配方案',
    image:
      'https://readdy.ai/api/search-image?query=High-end%20bedroom%20inspiration%20bed%20dominates%20frame%20gray%20beige%20layered%20bedding%20duvet%20blanket%20pillows%20dark%20gray%20wall%20with%20partial%20wood%20paneling%20bedside%20lamp%20only%20weak%20light%20accent%20overall%20window%20side%20light%20soft%20volumetric%20light%20quiet%20restrained%20low%20saturation%20realistic%20photography%20no%20text%20no%20logo%20no%20watermark%20no%20UI&width=800&height=800&seq=space-inspiration-bedroom-1&orientation=squarish',
    link: '/products/category',
  },
  {
    id: 3,
    title: '雅致餐厅',
    subtitle: '材质甄选方案',
    image:
      'https://readdy.ai/api/search-image?query=High-end%20residential%20dining%20room%20inspiration%20dark%20wood%20paneling%20with%20light%20dining%20chairs%20contrast%20elegant%20table%20setting%20single%20side%20window%20light%20creates%20strong%20chiaroscuro%20clean%20uncluttered%20space%2035mm%20lens%20low%20saturation%20warm%20neutral%20tones%20taupe%20sand%20walnut%20cinematic%20atmosphere%20ultra%20realistic%20no%20text%20no%20logo%20no%20watermark%20no%20UI&width=800&height=800&seq=space-inspiration-dining-1&orientation=squarish',
    link: '/products/category',
  },
  {
    id: 4,
    title: '简约书房',
    subtitle: '定制收纳方案',
    image:
      'https://readdy.ai/api/search-image?query=High-end%20residential%20study%20room%20inspiration%20dark%20wood%20shelving%20with%20light%20desk%20chair%20contrast%20organized%20workspace%20single%20large%20window%20side%20light%20creates%20strong%20chiaroscuro%20clean%20minimalist%20space%2035mm%20lens%20low%20saturation%20warm%20neutral%20tones%20taupe%20sand%20walnut%20cinematic%20atmosphere%20ultra%20realistic%20no%20text%20no%20logo%20no%20watermark%20no%20UI&width=800&height=800&seq=space-inspiration-study-1&orientation=squarish',
    link: '/products/category',
  },
];

export default function SpaceInspiration() {
  const navigate = useNavigate();

  const [imageStates, setImageStates] = useState<
    Record<number, 'loading' | 'loaded' | 'error'>
  >({});

  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isTitleInView = useInViewAnimation(titleRef, { threshold: 0.5 });
  const isGridInView = useInViewAnimation(gridRef, { threshold: 0.2 });

  const handleImageLoad = (id: number) => {
    setImageStates((prev) => ({ ...prev, [id]: 'loaded' }));
  };

  const handleImageError = (id: number) => {
    setImageStates((prev) => ({ ...prev, [id]: 'error' }));
  };

  const handleRetry = (id: number, imageSrc: string) => {
    setImageStates((prev) => ({ ...prev, [id]: 'loading' }));
    const img = new Image();
    img.onload = () => handleImageLoad(id);
    img.onerror = () => handleImageError(id);
    img.src = imageSrc;
  };

  return (
    <div className="px-4 bg-white">
      {/* 标题 */}
      <div
        ref={titleRef}
        className={`flex items-center justify-between mb-6 transition-all duration-500 ease-out ${
          isTitleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div>
          <h2 className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight leading-tight">
            空间灵感
          </h2>
          <p className="text-[13px] text-[#86868B] mt-1.5 leading-relaxed">展厅实景，所见即所得</p>
        </div>
        <button
          onClick={() => navigate('/products/category')}
          className="flex items-center gap-0.5 text-[13px] text-[#1D1D1F] cursor-pointer press-interactive"
        >
          更多
          <i className="ri-arrow-right-s-line text-[16px]"></i>
        </button>
      </div>

      {/* 2x2 网格 */}
      <div ref={gridRef} className="grid grid-cols-2 gap-4">
        {spaces.map((space, index) => {
          const imageState = imageStates[space.id] || 'loading';

          return (
            <div
              key={space.id}
              onClick={() => navigate(space.link)}
              className={`relative rounded-2xl overflow-hidden cursor-pointer hover-card hover-space-card group transition-all duration-500 ease-out ${
                isGridInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ 
                aspectRatio: '4/3',
                transitionDelay: isGridInView ? `${index * 70}ms` : '0ms'
              }}
            >
              {/* 加载骨架 */}
              {imageState === 'loading' && (
                <div className="absolute inset-0 bg-[#F5F5F7] animate-pulse" />
              )}

              {/* 加载失败 */}
              {imageState === 'error' && (
                <div className="absolute inset-0 bg-[#F5F5F7] flex flex-col items-center justify-center">
                  <i className="ri-image-line text-[32px] text-[#D2D2D7] mb-2"></i>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRetry(space.id, space.image);
                    }}
                    className="px-3.5 py-1.5 text-[11px] text-[#1D1D1F] border border-[#E5E5EA] rounded-full cursor-pointer whitespace-nowrap active:scale-95 transition-transform"
                  >
                    重试
                  </button>
                </div>
              )}

              {/* 图片 */}
              <img
                src={space.image}
                alt={space.title}
                className={`w-full h-full object-cover hover-img-zoom ${
                  imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => handleImageLoad(space.id)}
                onError={() => handleImageError(space.id)}
              />

              {/* 渐变蒙层 - 降低透明度 */}
              {imageState === 'loaded' && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent space-overlay" />
              )}

              {/* 文字 */}
              {imageState === 'loaded' && (
                <div className="absolute bottom-3.5 left-3.5 right-3.5">
                  <h3 className="text-white text-[15px] font-semibold leading-tight tracking-tight">
                    {space.title}
                  </h3>
                  <p className="text-white/70 text-[11px] mt-1 leading-relaxed">{space.subtitle}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
