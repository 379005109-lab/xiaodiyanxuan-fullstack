import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInViewAnimation } from '../../../hooks/useInViewAnimation';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image: string;
  sales: number;
  highlight: string;
}

const mockProducts: Product[] = [
  {
    id: 'SF001',
    name: '意式轻奢真皮沙发',
    price: 12800,
    originalPrice: 15800,
    image:
      'https://readdy.ai/api/search-image?query=luxury%20designer%20armchair%20with%20light%20brown%20leather%20and%20walnut%20wood%20legs%20placed%20in%20minimalist%20setting%20with%20deep%20grey%20textured%20wall%20background%2C%20side%20backlight%20emphasizing%20contours%20and%20material%20texture%2C%20minimal%20props%20like%20single%20book%20or%20ceramic%20vase%20not%20stealing%20focus%2C%20shallow%20depth%20of%20field%2C%20low%20saturation%2C%20cinematic%20lighting%2C%20editorial%20style%2C%20ultra%20realistic%20photography%2C%20no%20text%2C%20no%20logo%2C%20no%20watermark%2C%20no%20UI&width=600&height=750&seq=home-recommend-v10-1&orientation=portrait',
    sales: 156,
    highlight: '头层牛皮 · 源头工厂直供',
  },
  {
    id: 'DT001',
    name: '实木餐桌椅组合',
    price: 4580,
    originalPrice: 5680,
    image:
      'https://readdy.ai/api/search-image?query=white%20oak%20wood%20dining%20table%20with%20single%20chair%20in%20minimalist%20interior%2C%20deep%20walnut%20or%20dark%20grey%20wall%20background%2C%20warm%20side%20lighting%20highlighting%20wood%20grain%20and%20edge%20details%2C%20clean%20composition%20with%20subtle%20volumetric%20light%2C%20low%20saturation%2C%20cinematic%20atmosphere%2C%20shallow%20depth%20of%20field%2C%20ultra%20realistic%20photography%2C%20no%20text%2C%20no%20logo%2C%20no%20watermark%2C%20no%20UI&width=600&height=750&seq=home-recommend-v10-2&orientation=portrait',
    sales: 167,
    highlight: '白橡木 · 原木直拼工艺',
  },
  {
    id: 'BD001',
    name: '轻奢软包双人床',
    price: 6800,
    originalPrice: 8200,
    image:
      'https://readdy.ai/api/search-image?query=high-end%20bedding%20scene%20in%20minimalist%20bedroom%2C%20linen%20grey%20bed%20sheets%20with%20thick%20pillows%2C%20deep%20walnut%20wood%20or%20dark%20grey%20wall%20background%2C%20morning%20side%20light%20through%20sheer%20curtains%20creating%20soft%20light%20bands%2C%20visible%20dust%20particles%20in%20air%2C%20low%20saturation%2C%20quiet%20breathing%20atmosphere%2C%20ultra%20realistic%20photography%2C%20no%20text%2C%20no%20logo%2C%20no%20watermark%2C%20no%20UI&width=600&height=750&seq=home-recommend-v10-3&orientation=portrait',
    sales: 128,
    highlight: '绒布面料 · 质检合格交付',
  },
  {
    id: 'DC001',
    name: '手工羊毛地毯',
    price: 1580,
    originalPrice: 1980,
    image:
      'https://readdy.ai/api/search-image?query=designer%20side%20table%20with%20small%20accent%20chair%2C%20beige%20fabric%20or%20light%20brown%20leather%20with%20walnut%20wood%20combination%2C%20placed%20against%20deep%20grey%20micro-textured%20background%2C%20side%20backlight%20emphasizing%20outline%20and%20material%20texture%2C%20minimal%20props%20like%20single%20book%20or%20pottery%20not%20stealing%20focus%2C%20shallow%20depth%20of%20field%2C%20low%20saturation%2C%20cinematic%20lighting%2C%20editorial%20style%2C%20ultra%20realistic%20photography%2C%20no%20text%2C%20no%20logo%2C%20no%20watermark%2C%20no%20UI&width=600&height=750&seq=home-recommend-v10-4&orientation=portrait',
    sales: 98,
    highlight: '手工编织 · 样品可寄',
  },
];

const RecommendProducts = () => {
  const navigate = useNavigate();
  const [products] = useState(mockProducts);
  const titleRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isTitleInView = useInViewAnimation(titleRef, { threshold: 0.5 });
  const isListInView = useInViewAnimation(listRef, { threshold: 0.2 });

  // Safe navigation handler
  const handleNavigate = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
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
            新品推荐
          </h2>
          <p className="text-[13px] text-[#86868B] mt-1.5 leading-relaxed">精选优质家具，工厂直发</p>
        </div>
        <button
          onClick={() => handleNavigate('/products/list')}
          className="flex items-center gap-0.5 text-[13px] text-[#1D1D1F] cursor-pointer press-interactive"
        >
          更多
          <i className="ri-arrow-right-s-line text-[16px]" />
        </button>
      </div>

      {/* 列表 */}
      <div ref={listRef} className="space-y-0">
        {products.map((product, index) => (
          <div key={product.id}>
            <div
              onClick={() => handleNavigate(`/products/detail/${product.id}`)}
              className={`flex gap-4 py-4 cursor-pointer hover-list-item group rounded-xl px-2 -mx-2 transition-all duration-500 ease-out ${
                isListInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{
                transitionDelay: isListInView ? `${index * 70}ms` : '0ms'
              }}
            >
              {/* 图片 */}
              <div className="w-[110px] h-[110px] flex-shrink-0 rounded-2xl overflow-hidden bg-[#F5F5F7]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover hover-img-zoom"
                />
              </div>

              {/* 信息 */}
              <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
                <div>
                  <h3 className="text-[15px] font-medium text-[#1D1D1F] line-clamp-1 tracking-tight">
                    {product.name}
                  </h3>
                  <p className="text-[12px] text-[#86868B] mt-1.5 leading-relaxed">{product.highlight}</p>
                </div>

                <div className="flex items-end justify-between mt-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[17px] font-semibold text-[#1D1D1F] tracking-tight">
                      ¥{product.price.toLocaleString()}
                    </span>
                    <span className="text-[12px] text-[#86868B] line-through">
                      ¥{product.originalPrice.toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#86868B]">已售 {product.sales}</span>
                </div>
              </div>
            </div>
            {/* 分割线 */}
            {index < products.length - 1 && (
              <div className="ml-[126px] border-t border-[#E5E5EA]" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default RecommendProducts;
