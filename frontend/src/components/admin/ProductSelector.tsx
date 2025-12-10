import React, { useState, useEffect } from 'react';
import { getProducts } from '@/services/productService.mock';
import { getAllCategories, Category } from '@/services/categoryService';
import { formatPrice } from '@/lib/utils';

interface ProductSelectorProps {
  onSelect: (product: any) => void;
  selectedProductId: number | null;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ onSelect, selectedProductId }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        getProducts(),
        getAllCategories().catch(() => [])
      ]);
      
      if (productsRes.success) {
        const formattedProducts = productsRes.data.map((p: any) => ({
          id: p._id ? parseInt(p._id.slice(-4), 16) : Math.random(),
          _id: p._id,
          name: p.name,
          price: p.basePrice || 0,
          specs: Object.values(p.specifications || {}).join(' | ') || '无规格',
          image: p.images?.[0] || '/placeholder.svg',
          category: p.category,
          categoryName: '', // 将在下面填充
        }));
        setProducts(formattedProducts);
      }
      
      setCategories(categoriesRes || []);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取分类名称
  const getCategoryName = (categoryKey: string) => {
    const category = categories.find(c => c.slug === categoryKey || c._id === categoryKey || c.name === categoryKey);
    return category?.name || categoryKey || '未分类';
  };

  // 获取唯一的分类列表
  const uniqueCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean);

  const filteredProducts = products.filter(p => 
    (activeCategory === 'all' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50 text-center">
        <p className="text-gray-500">加载商品中...</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center gap-4 mb-4">
        <input 
          type="text" 
          placeholder="搜索商品..." 
          className="input input-sm w-full"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap border-b mb-2 gap-1">
        <button 
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-2 text-sm font-medium rounded-t ${activeCategory === 'all' ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
          全部
        </button>
        {uniqueCategories.map(cat => (
          <button 
            key={cat} 
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-2 text-sm font-medium rounded-t ${activeCategory === cat ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
            {getCategoryName(cat)}
          </button>
        ))}
      </div>
      <div className="space-y-2 h-64 overflow-y-auto">
        {filteredProducts.length === 0 ? (
          <p className="text-center text-gray-500 py-8">暂无商品</p>
        ) : (
          filteredProducts.map(p => (
            <div 
              key={p._id || p.id} 
              onClick={() => onSelect(p)}
              className={`p-3 rounded-lg border-2 flex items-center gap-4 transition-all ${selectedProductId === p.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-100'} cursor-pointer`}>
              <img src={p.image} alt={p.name} className="w-12 h-12 rounded-md object-cover bg-gray-200" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 truncate">{p.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="px-1.5 py-0.5 bg-gray-100 rounded">{getCategoryName(p.category)}</span>
                  <span>{formatPrice(p.price)}</span>
                </div>
                {p.specs && p.specs !== '无规格' && (
                  <p className="text-xs text-gray-400 truncate mt-0.5">规格: {p.specs}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductSelector;
