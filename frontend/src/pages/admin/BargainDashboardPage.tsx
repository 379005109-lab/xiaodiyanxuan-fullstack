import React, { useState, useEffect } from 'react';
import { Share2, Users, Tag, Package, TrendingUp, RefreshCw } from 'lucide-react';

interface BargainProduct {
  _id: string;
  name: string;
  originalPrice: number;
  targetPrice: number;
  totalBargains: number;
  successBargains: number;
  status: string;
}

const BargainDashboardPage: React.FC = () => {
  const [products, setProducts] = useState<BargainProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bargains/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 计算统计数据
  const stats = {
    totalProducts: products.length,
    activeProducts: products.filter(p => p.status === 'active').length,
    totalBargains: products.reduce((sum, p) => sum + (p.totalBargains || 0), 0),
    successBargains: products.reduce((sum, p) => sum + (p.successBargains || 0), 0),
  };

  // 按发起次数排序的商品
  const topProducts = [...products]
    .sort((a, b) => (b.totalBargains || 0) - (a.totalBargains || 0))
    .slice(0, 5);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">砍价裂变数据看板</h1>

      {/* 刷新按钮 */}
      <div className="flex justify-end mb-4">
        <button onClick={loadData} disabled={loading} className="btn btn-secondary flex items-center gap-2">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          刷新数据
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-blue-100 p-3 rounded-full"><Package className="text-blue-500" /></div>
          <div>
            <p className="text-gray-500 text-sm">砍价商品数</p>
            <p className="text-2xl font-bold">{stats.totalProducts}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-green-100 p-3 rounded-full"><Tag className="text-green-500" /></div>
          <div>
            <p className="text-gray-500 text-sm">上架中</p>
            <p className="text-2xl font-bold">{stats.activeProducts}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-purple-100 p-3 rounded-full"><Share2 className="text-purple-500" /></div>
          <div>
            <p className="text-gray-500 text-sm">总发起砍价</p>
            <p className="text-2xl font-bold">{stats.totalBargains}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center gap-4">
          <div className="bg-orange-100 p-3 rounded-full"><TrendingUp className="text-orange-500" /></div>
          <div>
            <p className="text-gray-500 text-sm">砍价成功</p>
            <p className="text-2xl font-bold">{stats.successBargains}</p>
          </div>
        </div>
      </div>

      {/* 热门砍价商品 */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-xl font-bold mb-4">热门砍价商品</h2>
        {topProducts.length === 0 ? (
          <p className="text-gray-500 text-center py-8">暂无砍价商品数据</p>
        ) : (
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product._id} className="flex items-center p-4 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold mr-4">
                  {index + 1}
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-gray-500">
                    ¥{product.originalPrice} → ¥{product.targetPrice}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-blue-600">{product.totalBargains || 0}</p>
                  <p className="text-xs text-gray-400">发起次数</p>
                </div>
                <div className="text-right ml-6">
                  <p className="font-bold text-lg text-green-600">{product.successBargains || 0}</p>
                  <p className="text-xs text-gray-400">成功次数</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BargainDashboardPage;
