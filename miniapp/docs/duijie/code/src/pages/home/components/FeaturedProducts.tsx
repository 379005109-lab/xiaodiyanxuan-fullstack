import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInViewAnimation } from '../../../hooks/useInViewAnimation';

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const titleRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const isTitleInView = useInViewAnimation(titleRef, { threshold: 0.5 });
  const isGridInView = useInViewAnimation(gridRef, { threshold: 0.2 });

  const products = [
    {
      id: 'SF002',
      name: '北欧简约布艺沙发',
      price: 5680,
      originalPrice: 6980,
      image:
        'https://readdy.ai/api/search-image?query=Premium%20beige%20linen%20fabric%20close-up%20with%20visible%20weave%20texture%20and%20thread%20details%2C%20soft%20side%20backlight%20creating%20gentle%20highlights%20across%20the%20surface%2C%20deep%20charcoal%20gray%20defocused%20background%2C%20subtle%20film%20grain%20texture%2C%20ultra%20sharp%20material%20detail%2C%20low%20saturation%20warm%20neutral%20palette%2C%20cinematic%20editorial%20lighting%20with%20soft%20shadows%2C%20f%2F1.8%20shallow%20depth%20of%20field%2C%20photoreal%20quality%2C%20no%20text%20no%20logo%20no%20watermark%20no%20UI%20elements&width=600&height=600&seq=featured-material-1-v2&orientation=squarish',
      highlight: '科技布 · 源头工厂',
      sold: 289,
    },
    {
      id: 'SF003',
      name: '现代简约转角沙发',
      price: 8900,
      originalPrice: 10900,
      image:
        'https://readdy.ai/api/search-image?query=High-end%20woodworking%20craftsmanship%20close-up:%20walnut%20wood%20dovetail%20joint%20or%20mortise%20and%20tenon%20connection%20detail%2C%20light%20from%20upper%20left%20emphasizing%20grain%20texture%20and%20cut%20surfaces%2C%20minimalist%20deep%20color%20background%2C%20shallow%20depth%20of%20field%2C%20cinematic%20quality%2C%20low%20saturation%2C%20warm%20neutral%20tones%2C%20ultra%20realistic%2C%20f%2F2.0%2C%20no%20text%2C%20no%20logo%2C%20no%20watermark%2C%20no%20UI&width=600&height=600&seq=featured-craft-1&orientation=squarish',
      highlight: '大空间专属 · 质检交付',
      sold: 92,
    },
    {
      id: 'BD002',
      name: '日式榻榻米床',
      price: 4280,
      originalPrice: 5280,
      image:
        'https://readdy.ai/api/search-image?query=Premium%20fabric%20texture%20close-up:%20beige%20linen%20weave%20with%20visible%20thread%20detail%20and%20subtle%20texture%2C%20side%20backlight%20creating%20soft%20sheen%20across%20surface%2C%20deep%20gray%20defocused%20background%2C%20micro%20film%20grain%2C%20ultra%20sharp%20material%20detail%2C%20low%20saturation%2C%20editorial%20lighting%2C%20f%2F1.8%20shallow%20depth%20of%20field%2C%20no%20text%2C%20no%20logo%2C%20no%20watermark%2C%20no%20UI&width=600&height=600&seq=featured-material-2&orientation=squarish',
      highlight: '白蜡木 · 实木甄选',
      sold: 215,
    },
    {
      id: 'BD003',
      name: '北欧实木儿童床',
      price: 3580,
      originalPrice: 4380,
      image:
        'https://readdy.ai/api/search-image?query=Luxury%20furniture%20hardware%20detail%20close-up:%20brushed%20brass%20or%20matte%20black%20metal%20connector%20and%20hinge%20detail%2C%20side%20lighting%20emphasizing%20metallic%20texture%20and%20precision%20machining%2C%20minimalist%20dark%20background%20blur%2C%20cinematic%20quality%2C%20low%20saturation%2C%20warm%20neutral%20tones%2C%20f%2F2.0%20shallow%20depth%2C%20ultra%20realistic%2C%20no%20text%2C%20no%20logo%2C%20no%20watermark%2C%20no%20UI&width=600&height=600&seq=featured-craft-2&orientation=squarish',
      highlight: '安全护栏 · 样品可寄',
      sold: 178,
    },
    {
      id: 'DT002',
      name: '大理石餐桌',
      price: 7200,
      originalPrice: 8800,
      image:
        'https://readdy.ai/api/search-image?query=High-end%20leather%20craftsmanship%20close-up:%20sand%20color%20genuine%20leather%20with%20embossed%20texture%20and%20contrast%20stitching%2C%20side%20backlight%20grazing%20surface%20creating%20soft%20highlights%20and%20shadows%2C%20deep%20gray%20blurred%20background%2C%20subtle%20film%20grain%2C%20ultra%20sharp%20detail%2C%20low%20saturation%2C%20chiaroscuro%20lighting%2C%20f%2F1.8%2C%20no%20text%2C%20no%20logo%2C%20no%20watermark%2C%20no%20UI&width=600&height=600&seq=featured-material-3&orientation=squarish',
      highlight: '天然石材 · 工厂定制',
      sold: 73,
    },
    {
      id: 'DT003',
      name: '工业风铁艺餐桌',
      price: 3680,
      originalPrice: 4580,
      image:
        'https://readdy.ai/api/search-image?query=Premium%20wood%20grain%20close-up:%20white%20oak%20or%20walnut%20natural%20wood%20texture%20with%20visible%20growth%20rings%20and%20fine%20detail%2C%20warm%20side%20lighting%20emphasizing%20grain%20pattern%20and%20smooth%20finish%2C%20minimalist%20deep%20background%2C%20shallow%20depth%20of%20field%2C%20cinematic%20quality%2C%20low%20saturation%2C%20warm%20neutral%20tones%2C%20f%2F2.0%2C%20ultra%20realistic%2C%20no%20text%2C%20no%20logo%2C%20no%20watermark%2C%20no%20UI&width=600&height=600&seq=featured-craft-3&orientation=squarish',
      highlight: '老榆木 · 材质保障',
      sold: 142,
    },
  ];

  /** Toggle favorite status for a product.
   *  Stops event propagation to avoid triggering the parent click handler.
   */
  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <section className="px-4 bg-white">
      {/* 标题 */}
      <div
        ref={titleRef}
        className={`flex items-center justify-between mb-6 transition-all duration-500 ease-out ${
          isTitleInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div>
          <h2 className="text-[22px] font-semibold text-[#1D1D1F] tracking-tight leading-tight">
            精选好物
          </h2>
          <p className="text-[13px] text-[#86868B] mt-1.5 leading-relaxed">
            品质家具，匠心工艺之选
          </p>
        </div>
        <button
          onClick={() => navigate('/products/list')}
          className="flex items-center gap-0.5 text-[13px] text-[#1D1D1F] cursor-pointer press-interactive"
        >
          更多
          <i className="ri-arrow-right-s-line text-[16px]" />
        </button>
      </div>

      {/* 商品网格 */}
      <div ref={gridRef} className="grid grid-cols-2 gap-4">
        {products.map((product, index) => (
          <div
            key={product.id}
            onClick={() => navigate(`/products/detail/${product.id}`)}
            className={`cursor-pointer hover-card group transition-all duration-500 ease-out ${
              isGridInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{
              transitionDelay: isGridInView ? `${index * 60}ms` : '0ms'
            }}
          >
            {/* 图片 */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#F5F5F7]">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover hover-img-zoom"
              />
              {/* 收藏按钮 */}
              <button
                onClick={(e) => toggleFavorite(product.id, e)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-md cursor-pointer active:scale-90 transition-transform"
                aria-label={
                  favorites.has(product.id)
                    ? 'Remove from favorites'
                    : 'Add to favorites'
                }
              >
                <i
                  className={`${
                    favorites.has(product.id) ? 'ri-heart-fill' : 'ri-heart-line'
                  } text-[16px]`}
                  style={{
                    color: favorites.has(product.id) ? '#FF3B30' : '#1D1D1F',
                  }}
                />
              </button>
            </div>

            {/* 信息 */}
            <div className="mt-3 px-0.5">
              <h3 className="text-[13px] text-[#1D1D1F] line-clamp-2 leading-[1.4] min-h-[36px] tracking-tight">
                {product.name}
              </h3>
              <p className="text-[11px] text-[#86868B] mt-1.5 leading-relaxed">{product.highlight}</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">
                  ¥{product.price.toLocaleString()}
                </span>
                <span className="text-[11px] text-[#86868B] line-through">
                  ¥{product.originalPrice.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-[#86868B] mt-1">
                已售 {product.sold}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedProducts;
