import React from 'react';
import { Link } from 'react-router-dom';

const mockBargainProducts = [
  {
    id: 1,
    name: '质感沙发 · 莫兰迪灰',
    originalPrice: 3999,
    bargainPrice: 2199,
    maxSaving: '50%',
    alreadyHelped: 12,
    imageUrl: '/placeholder.svg',
    tags: ['限时特惠', '热门', '家居'],
    countdown: '00:00:00',
  },
  // Add more mock products here
];

interface BargainRule {
  totalBargainPercent: number;
}

const BargainListPage: React.FC = () => {
  const getBargainInfo = (product: any) => {
    const rules: BargainRule | null = JSON.parse(localStorage.getItem(`bargain_rules_${product.id}`) || 'null');
    const maxSavingPercent = rules ? rules.totalBargainPercent : 50; // Default to 50% if no rules
    const bargainPrice = product.originalPrice * (1 - maxSavingPercent / 100);
    const savingAmount = product.originalPrice - bargainPrice;

    return { 
      ...product, 
      maxSaving: `${maxSavingPercent}%`,
      bargainPrice: Math.round(bargainPrice),
      savingAmount: Math.round(savingAmount),
    };
  };

  const productsWithBargainInfo = mockBargainProducts.map(getBargainInfo);

  return (
    <div className="bg-gray-100 min-h-screen p-4">
      {productsWithBargainInfo.map(product => (
        <div key={product.id} className="bg-white rounded-lg shadow-md mb-4 overflow-hidden">
          {/* Banner */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4 text-center">
            <h2 className="text-2xl font-bold text-white">🔥 砍价活动进行中</h2>
            <p className="text-sm text-white/80">邀请好友助力，享超低价格！</p>
          </div>

          {/* Tags */}
          <div className="p-4 flex justify-center gap-2">
            {product.tags.map((tag: string, index: number) => (
              <span key={tag} className={`px-3 py-1 text-xs rounded-full ${index === 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                {tag}
              </span>
            ))}
          </div>

          {/* Product Image */}
          <img src={product.imageUrl} alt={product.name} className="w-full h-64 object-cover" />

          {/* Product Info */}
          <div className="p-4">
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm text-gray-500 line-through">原价: ¥{product.originalPrice}</span>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">邀请好友砍价</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
              <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
            </div>
            <p className="text-sm text-gray-600 mt-1">已有 {product.alreadyHelped} 人助力</p>
          </div>

          {/* Actions */}
          <div className="p-4 flex gap-4">
            <Link to={`/bargain/${product.id}`} className="btn btn-primary flex-1">发起砍价</Link>
            <button className="btn btn-secondary flex-1">帮我砍</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BargainListPage;
