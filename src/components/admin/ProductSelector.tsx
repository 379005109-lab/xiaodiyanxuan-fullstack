import React, { useState } from 'react';

// Mock data - in a real app, this would come from props or a store
const categoryTree = [
  { id: 'all', name: '所有分类' },
  { id: 'sofa', name: '沙发' },
  { id: 'table', name: '桌几' },
];

const allProducts = [
  { id: 1, name: '现代简约布艺沙发', price: 2999, image: '/placeholder.svg', category: '沙发' },
  { id: 2, name: '轻奢科技绒沙发', price: 3599, image: '/placeholder.svg', category: '沙发' },
  { id: 3, name: '北欧风格岩板茶几', price: 899, image: '/placeholder.svg', category: '茶几' },
];

interface ProductSelectorProps {
  onSelect: (product: any) => void;
  selectedProductId: number | null;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({ onSelect, selectedProductId }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = allProducts.filter(p => 
    (activeCategory === 'all' || p.category === activeCategory) &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="flex border-b mb-2">
        {categoryTree.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 text-sm font-medium ${activeCategory === cat.name ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}>
            {cat.name}
          </button>
        ))}
      </div>
      <div className="space-y-2 h-64 overflow-y-auto">
        {filteredProducts.map(p => (
          <div 
            key={p.id} 
            onClick={() => onSelect(p)}
            className={`p-3 rounded-lg border-2 flex items-center gap-4 transition-all ${selectedProductId === p.id ? 'border-blue-500 bg-blue-50' : 'border-transparent hover:bg-gray-100'} cursor-pointer`}>
            <img src={p.image} alt={p.name} className="w-12 h-12 rounded-md object-cover" />
            <div>
              <p className="font-semibold text-gray-800">{p.name}</p>
              <p className="text-xs text-gray-500">¥{p.price}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductSelector;
