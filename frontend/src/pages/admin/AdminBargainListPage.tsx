import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

interface BargainProduct {
  _id: string;
  name: string;
  coverImage: string;
  originalPrice: number;
  targetPrice: number;
  category: string;
  style: string;
  status: 'active' | 'inactive' | 'soldout';
  totalBargains: number;
  successBargains: number;
  minCutAmount: number;
  maxCutAmount: number;
  createdAt: string;
}

const AdminBargainListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [bargainProducts, setBargainProducts] = useState<BargainProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/bargains/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setBargainProducts(data.data || []);
      }
    } catch (error) {
      console.error('加载砍价商品失败:', error);
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('确定要删除这个砍价商品吗？')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bargains/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        toast.success('删除成功');
        loadProducts();
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleToggleStatus = async (product: BargainProduct) => {
    const newStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/bargains/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(newStatus === 'active' ? '已上架' : '已下架');
        loadProducts();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const filteredProducts = bargainProducts.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页头 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">砍价商品管理</h1>
          <p className="text-gray-600 mt-1">共 {bargainProducts.length} 个砍价商品</p>
        </div>
        <div className="flex gap-3">
          <button onClick={loadProducts} className="btn btn-secondary" disabled={loading}>
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link to="/admin/bargain/new" className="btn-primary flex items-center gap-2">
            <Plus size={20} />
            新建砍价商品
          </Link>
        </div>
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
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-600 mt-2">加载中...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-600">暂无砍价商品，点击上方按钮新建</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div 
              key={product._id} 
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-6">
                {/* 商品图片 */}
                <div className="flex-shrink-0">
                  <img 
                    src={product.coverImage || '/placeholder.svg'} 
                    alt={product.name} 
                    className="w-24 h-24 rounded-lg object-cover bg-gray-100"
                  />
                </div>

                {/* 商品信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {product.status === 'active' ? '上架中' : '已下架'}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    {product.category} · {product.style}
                  </div>
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">原价</p>
                      <p className="text-lg font-bold text-gray-400 line-through">¥{product.originalPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">目标价</p>
                      <p className="text-lg font-bold text-red-600">¥{product.targetPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">可省</p>
                      <p className="text-lg font-bold text-green-600">¥{product.originalPrice - product.targetPrice}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">发起次数</p>
                      <p className="text-lg font-bold text-blue-600">{product.totalBargains || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">成功次数</p>
                      <p className="text-lg font-bold text-purple-600">{product.successBargains || 0}</p>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex-shrink-0 flex flex-col gap-2">
                  <button
                    onClick={() => handleToggleStatus(product)}
                    className={`btn btn-sm ${product.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                  >
                    {product.status === 'active' ? '下架' : '上架'}
                  </button>
                  <Link to={`/admin/bargain/edit/${product._id}`} className="btn btn-secondary btn-sm flex items-center gap-1">
                    <Edit size={14} />
                    编辑
                  </Link>
                  <button 
                    onClick={() => handleDelete(product._id)} 
                    className="btn btn-secondary btn-sm text-red-600 hover:bg-red-50 flex items-center gap-1"
                  >
                    <Trash2 size={14} />
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminBargainListPage;
