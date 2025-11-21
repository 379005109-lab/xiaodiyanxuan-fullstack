import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getAllCategories, Category } from '@/services/categoryService';
import { createCategoryLookup, getRoleDiscountMultiplier } from '@/utils/categoryHelper';

interface BargainProduct {
  id: number;
  productId: number;
  productName: string;
  productImage: string; // Add product image
  originalPrice: number;
  floorPrice: number;
  status: 'active' | 'inactive';
}

const AdminBargainListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [bargainProducts, setBargainProducts] = useState<BargainProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLookup, setCategoryLookup] = useState<Map<string, Category>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');

  const loadProducts = () => {
    const stored = JSON.parse(localStorage.getItem('bargain_products') || '[]');
    const withImages = stored.map((p: BargainProduct) => ({ ...p, productImage: p.productImage || '/placeholder.svg' }));
    setBargainProducts(withImages);
  };

  const loadCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);
      setCategoryLookup(createCategoryLookup(allCategories));
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const getDiscountMultiplier = (categoryKey?: string) => {
    return getRoleDiscountMultiplier(categoryLookup, user?.role, categoryKey);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('您确定要删除这个砍价活动吗？此操作不可撤销。')) {
      const stored = JSON.parse(localStorage.getItem('bargain_products') || '[]');
      const updated = stored.filter((p: BargainProduct) => p.id !== id);
      localStorage.setItem('bargain_products', JSON.stringify(updated));
      loadProducts(); // Reload products to reflect deletion
    }
  };

  const filteredProducts = bargainProducts.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页头 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">砍价商品管理</h1>
          <p className="text-gray-600 mt-1">共 {bargainProducts.length} 个砍价活动</p>
        </div>
        <Link to="/admin/bargain/new" className="btn-primary">
          <Plus size={20} className="mr-2" />
          新建砍价商品
        </Link>
      </div>

      {/* 搜索栏 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索砍价商品..."
            className="input pl-10 w-full"
          />
        </div>
      </div>

      {/* 砍价列表 */}
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">暂无砍价商品</p>
          </div>
        ) : (
          filteredProducts.map((product) => {
            const multiplier = getDiscountMultiplier(product.productName);
            const designerFloorPrice = Math.round(product.floorPrice * multiplier);
            
            return (
              <div 
                key={product.id} 
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-6">
                  {/* 商品图片 */}
                  <div className="flex-shrink-0">
                    <img 
                      src={product.productImage} 
                      alt={product.productName} 
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  </div>

                  {/* 商品信息 */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{product.productName}</h3>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                      {user?.role === 'designer' ? (
                        <>
                          <div>
                            <p className="text-xs text-gray-600">供货价</p>
                            <p className="text-lg font-bold text-primary-600 mt-1">¥{designerFloorPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">砍价底价</p>
                            <p className="text-lg font-bold text-gray-900 mt-1">¥{product.floorPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">状态</p>
                            <p className="mt-1">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                {product.status === 'active' ? '进行中' : '已结束'}
                              </span>
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs text-gray-600">原价</p>
                            <p className="text-lg font-bold text-gray-400 line-through mt-1">¥{product.originalPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">砍价底价</p>
                            <p className="text-lg font-bold text-red-600 mt-1">¥{product.floorPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">省价</p>
                            <p className="text-lg font-bold text-green-600 mt-1">¥{product.originalPrice - product.floorPrice}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">状态</p>
                            <p className="mt-1">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${product.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                                {product.status === 'active' ? '进行中' : '已结束'}
                              </span>
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex-shrink-0 flex gap-2">
                    {user?.role === 'designer' ? (
                      <button
                        onClick={() => navigate(`/admin/bargain/edit/${product.id}`)}
                        className="btn btn-primary btn-sm"
                      >
                        <Edit size={16} />
                        编辑
                      </button>
                    ) : (
                      <>
                        <Link to={`/admin/bargain/edit/${product.id}`} className="btn btn-primary btn-sm">
                          <Edit size={16} />
                          编辑
                        </Link>
                        <button 
                          onClick={() => handleDelete(product.id)} 
                          className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                          删除
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminBargainListPage;
