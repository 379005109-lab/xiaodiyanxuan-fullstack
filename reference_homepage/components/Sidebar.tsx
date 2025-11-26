
import React from 'react';
import { FilterState, StyleCategory } from '../types';
import { SlidersHorizontal } from 'lucide-react';

interface SidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const Sidebar: React.FC<SidebarProps> = ({ filters, setFilters }) => {
  const handleCategoryChange = (cat: StyleCategory) => {
    setFilters(prev => ({ ...prev, category: cat }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'min' | 'max') => {
    const val = parseInt(e.target.value) || 0;
    setFilters(prev => ({ 
      ...prev, 
      [type === 'min' ? 'minPrice' : 'maxPrice']: val 
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: StyleCategory.ALL,
      minPrice: 0,
      maxPrice: 50000,
      sortBy: 'newest'
    });
  };

  return (
    <aside className="w-64 flex-shrink-0 hidden md:block mr-10">
      <div className="sticky top-24 space-y-8">
        <div className="flex items-center gap-2 pb-4 border-b border-stone-200">
            <SlidersHorizontal className="w-4 h-4 text-primary" />
            <h2 className="font-serif font-bold text-lg text-primary">目录筛选 Catalog</h2>
        </div>

        {/* Style Section */}
        <div>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">设计风格 Style</h3>
          <div className="space-y-3">
            {[StyleCategory.ALL, StyleCategory.MODERN, StyleCategory.VINTAGE, StyleCategory.LUXURY, StyleCategory.MINIMALIST].map((cat) => (
              <label key={cat} className="flex items-center cursor-pointer group">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 transition-colors ${filters.category === cat ? 'border-primary' : 'border-stone-300 group-hover:border-primary/60'}`}>
                    {filters.category === cat && <div className="w-2 h-2 rounded-full bg-primary" />}
                </div>
                <input 
                  type="radio" 
                  name="style" 
                  className="hidden" 
                  checked={filters.category === cat}
                  onChange={() => handleCategoryChange(cat)}
                />
                <span className={`text-sm transition-colors ${filters.category === cat ? 'text-primary font-medium' : 'text-stone-500 group-hover:text-primary'}`}>
                  {cat}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Section */}
        <div>
          <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-4">价格区间 Price</h3>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white px-3 py-2 rounded-lg border border-stone-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 flex-1 transition-all">
                <span className="text-xs text-stone-400 block mb-0.5">Min</span>
                <input 
                  type="number" 
                  value={filters.minPrice}
                  onChange={(e) => handlePriceChange(e, 'min')}
                  className="w-full text-sm outline-none bg-transparent font-medium text-primary"
                />
            </div>
            <span className="text-stone-300">-</span>
            <div className="bg-white px-3 py-2 rounded-lg border border-stone-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 flex-1 transition-all">
                <span className="text-xs text-stone-400 block mb-0.5">Max</span>
                <input 
                  type="number" 
                  value={filters.maxPrice}
                  onChange={(e) => handlePriceChange(e, 'max')}
                  className="w-full text-sm outline-none bg-transparent font-medium text-primary"
                />
            </div>
          </div>
        </div>

        <button 
          onClick={resetFilters}
          className="w-full py-3 text-sm text-stone-500 underline hover:text-primary transition-colors"
        >
          重置筛选条件
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
