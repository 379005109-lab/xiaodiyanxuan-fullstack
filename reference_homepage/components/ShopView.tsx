
import React, { useState, useMemo } from 'react';
import Sidebar from './Sidebar';
import ProductCard from './ProductCard';
import { PRODUCTS, CATEGORY_CARDS } from '../constants';
import { FilterState, StyleCategory, Product } from '../types';
import { LayoutGrid, List, X, ShoppingCart, ArrowRight, Ruler } from 'lucide-react';

interface ShopViewProps {
    onProductClick?: (productId: string) => void;
}

const ShopView: React.FC<ShopViewProps> = ({ onProductClick }) => {
  const [filters, setFilters] = useState<FilterState>({
    category: StyleCategory.ALL,
    minPrice: 0,
    maxPrice: 50000,
    sortBy: 'newest'
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Filter Logic
  const filteredProducts = useMemo(() => {
    let result = PRODUCTS.filter(product => {
      // Category match
      if (filters.category !== StyleCategory.ALL && product.category !== filters.category) {
        return false;
      }
      // Price match
      if (product.price < filters.minPrice || product.price > filters.maxPrice) {
        return false;
      }
      return true;
    });

    // Sorting
    if (filters.sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (filters.sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }
    
    return result;
  }, [filters]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(StyleCategory).forEach(cat => counts[cat] = 0);
    PRODUCTS.forEach(p => {
        if (counts[p.category] !== undefined) counts[p.category]++;
    });
    return counts;
  }, []);

  return (
      <div className="animate-fade-in-up">
        {/* Catalog Hero */}
        <div className="relative h-[200px] overflow-hidden bg-stone-900">
            <div className="absolute inset-0 bg-stone-800 flex items-center justify-center">
                <div className="text-center text-white space-y-2">
                    <h1 className="text-3xl font-serif font-bold tracking-wide">产品目录</h1>
                    <p className="text-xs font-light tracking-[0.3em] uppercase opacity-70">Product Catalog 2024</p>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto w-full px-6 py-12 flex relative">
            {/* Sidebar */}
            <Sidebar filters={filters} setFilters={setFilters} />
        
            {/* Main Content */}
            <main className="flex-1 min-w-0">
            
            {/* Category Visual Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                {CATEGORY_CARDS.map((card) => {
                const count = categoryCounts[card.categoryEnum] || 0;
                const isActive = filters.category === card.categoryEnum;
                const Icon = card.icon;
                
                return (
                    <div 
                    key={card.id}
                    onClick={() => setFilters(prev => ({...prev, category: card.categoryEnum}))}
                    className={`relative h-28 md:h-36 rounded-xl overflow-hidden cursor-pointer group shadow-sm transition-all duration-300 ${isActive ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                    >
                    <img src={card.bgImage} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={card.name} />
                    <div className={`absolute inset-0 bg-primary/30 group-hover:bg-primary/40 transition-colors ${isActive ? 'bg-primary/60' : ''}`}></div>
                    
                    <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                            <Icon className="w-5 h-5 opacity-90" />
                            <span className="text-xs font-medium bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">{count}</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{card.name}</h3>
                            <p className="text-[10px] opacity-80 uppercase tracking-wider">{card.subtitle}</p>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-end border-b border-stone-200 pb-4 mb-8">
                <div className="mb-4 sm:mb-0">
                    <h2 className="text-2xl font-serif font-bold text-primary">单品列表 Items</h2>
                    <p className="text-stone-500 text-sm mt-1">找到 <span className="text-primary font-semibold">{filteredProducts.length}</span> 件商品</p>
                </div>
                
                <div className="flex items-center space-x-4">
                <div className="relative group">
                    <select 
                    className="appearance-none bg-transparent pr-8 pl-0 py-2 text-sm font-medium text-stone-700 outline-none cursor-pointer hover:text-primary transition-colors focus:text-primary"
                    value={filters.sortBy}
                    onChange={(e) => setFilters(prev => ({...prev, sortBy: e.target.value as any}))}
                    >
                    <option value="newest">最新上架 Newest</option>
                    <option value="price-asc">价格: 从低到高</option>
                    <option value="price-desc">价格: 从高到低</option>
                    </select>
                </div>

                <div className="flex bg-stone-100 rounded-lg p-1">
                    <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                    <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button 
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-stone-400 hover:text-stone-600'}`}
                    >
                    <List className="w-4 h-4" />
                    </button>
                </div>
                </div>
            </div>

            {/* Product Grid */}
            {filteredProducts.length > 0 ? (
                <div className={`grid gap-x-6 gap-y-10 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {filteredProducts.map(product => (
                    <ProductCard 
                        key={product.id} 
                        product={product} 
                        onClick={onProductClick} 
                        onQuickView={setQuickViewProduct}
                    />
                ))}
                </div>
            ) : (
                <div className="text-center py-32">
                <p className="text-stone-400 font-serif text-lg italic">暂无相关商品</p>
                <button 
                    onClick={() => setFilters({
                    category: StyleCategory.ALL,
                    minPrice: 0,
                    maxPrice: 50000,
                    sortBy: 'newest'
                    })}
                    className="mt-4 text-primary border-b border-primary pb-0.5 hover:opacity-70 transition-opacity text-sm"
                >
                    清除筛选 Clear Filters
                </button>
                </div>
            )}
            </main>
        </div>

        {/* Quick View Modal */}
        {quickViewProduct && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in-up" onClick={() => setQuickViewProduct(null)}>
                <div className="bg-white w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[550px]" onClick={e => e.stopPropagation()}>
                    <div className="w-full md:w-1/2 bg-stone-100 relative">
                        <img src={quickViewProduct.imageUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="w-full md:w-1/2 p-8 flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-primary">{quickViewProduct.name}</h3>
                                <p className="text-xs text-stone-400 font-mono mt-1">{quickViewProduct.modelNo}</p>
                            </div>
                            <button onClick={() => setQuickViewProduct(null)} className="p-1 hover:bg-stone-100 rounded-full transition-colors"><X className="w-6 h-6 text-stone-400" /></button>
                        </div>
                        
                        <div className="flex-1 space-y-6">
                            <div className="text-3xl font-serif font-bold text-[#C04E39]">¥{quickViewProduct.price.toLocaleString()}</div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm border-b border-stone-100 pb-2">
                                    <span className="text-stone-500">风格 Style</span>
                                    <span className="font-medium">{quickViewProduct.category}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-stone-100 pb-2">
                                    <span className="text-stone-500">起订量 (MOQ)</span>
                                    <span className="font-medium">{quickViewProduct.moq || 1} Pcs</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-stone-100 pb-2">
                                    <span className="text-stone-500 flex items-center gap-1">
                                        <Ruler className="w-3 h-3" /> 尺寸 Dimensions
                                    </span>
                                    <span className="font-medium font-mono text-stone-700">{quickViewProduct.dimensions || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-sm border-b border-stone-100 pb-2">
                                    <span className="text-stone-500">库存状态 Stock</span>
                                    <span className="font-medium text-green-600 capitalize">{quickViewProduct.stockStatus?.replace('_', ' ') || 'In Stock'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button 
                                onClick={() => {
                                    onProductClick?.(quickViewProduct.id);
                                    setQuickViewProduct(null);
                                }}
                                className="flex-1 border border-primary text-primary py-3 rounded-lg font-bold hover:bg-primary/5 transition-colors"
                            >
                                查看详情
                            </button>
                            <button className="flex-1 bg-primary text-white py-3 rounded-lg font-bold hover:bg-green-900 transition-colors flex items-center justify-center gap-2">
                                <ShoppingCart className="w-4 h-4" /> 加入购物车
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
  );
};

export default ShopView;
