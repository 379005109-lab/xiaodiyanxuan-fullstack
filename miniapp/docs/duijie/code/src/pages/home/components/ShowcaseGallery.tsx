
import { Link } from 'react-router-dom';
import { heroShowcase } from '../../../mocks/home';
import { useState } from 'react';

export default function ShowcaseGallery() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-[17px] font-semibold text-[#1C1C1E]">
          <a href="/products/list" className="hover:opacity-80">大图鉴赏</a>
        </h4>
        <Link
          to="/products/list"
          className="text-[13px] text-[#FF6B35] flex items-center cursor-pointer whitespace-nowrap"
        >
          更多 <i className="ri-arrow-right-s-line text-[15px]"></i>
        </Link>
      </div>

      {/* 主图展示 */}
      <Link
        to={heroShowcase[activeIndex].link}
        className="block relative rounded-2xl overflow-hidden cursor-pointer active:opacity-95 transition-opacity"
        style={{ height: '220px' }}
      >
        <img
          src={heroShowcase[activeIndex].image}
          alt={heroShowcase[activeIndex].title}
          className="w-full h-full object-cover object-top transition-all duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 z-10">
          <h3 className="text-white text-[18px] font-bold">{heroShowcase[activeIndex].title}</h3>
          <p className="text-white/70 text-[13px] mt-0.5">{heroShowcase[activeIndex].subtitle}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-white font-bold text-[16px]">
              <span className="text-[12px]">¥</span>{heroShowcase[activeIndex].price}
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap">
              查看详情
            </span>
          </div>
        </div>
      </Link>

      {/* 缩略图切换 */}
      <div className="flex gap-2.5 mt-3">
        {heroShowcase.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setActiveIndex(index)}
            className={`flex-1 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${
              index === activeIndex
                ? 'ring-2 ring-[#FF6B35] ring-offset-1'
                : 'opacity-60 hover:opacity-80'
            }`}
            style={{ height: '64px' }}
          >
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover object-top"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
