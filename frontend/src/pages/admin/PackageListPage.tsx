import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Edit, DollarSign, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { formatPrice } from '@/lib/utils';
import { getAllPackages } from '@/services/packageService';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';
import { getFileUrl } from '@/services/uploadService';

// 定义套餐类型
interface Package {
  id: number;
  name: string;
  price: number;
  image: string;
  productCount: number;
  categoryCount: number;
  status?: string; // 状态是可选的
  channelPrice?: number;
  designerPrice?: number;
}

const PackageListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const response = await apiClient.get('/packages');
      const apiPackages = response.data.data.map((pkg: any) => ({
        id: pkg._id,
        name: pkg.name,
        price: pkg.basePrice,
        productCount: pkg.products?.length || 0,
        categoryCount: 0,
        image: pkg.thumbnail ? getFileUrl(pkg.thumbnail) : '/placeholder.svg',
        status: pkg.status
      }));
      setPackages(apiPackages);
    } catch (error) {
      console.error('加载套餐失败', error);
      toast.error('加载套餐失败');
    }
  };

  const handleDelete = async (packageId: string | number) => {
    try {
      await apiClient.delete(`/packages/${packageId}`);
      toast.success('套餐已删除');
      loadPackages();
    } catch (error) {
      console.error('删除套餐失败', error);
      toast.error('删除套餐失败');
    }
  };

  const handleStatusToggle = async (packageId: string | number) => {
    try {
      const pkg = packages.find(p => p.id === packageId);
      if (!pkg) return;
      
      const newStatus = pkg.status === 'active' ? 'inactive' : 'active';
      await apiClient.put(`/packages/${packageId}`, { status: newStatus });
      
      toast.success('状态已更新');
      loadPackages();
    } catch (error) {
      console.error('更新状态失败', error);
      toast.error('更新状态失败');
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const searchTermMatch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || pkg.status === statusFilter;
    return searchTermMatch && statusMatch;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">套餐列表</h1>
        <Link to="/admin/packages/new" className="btn-primary">
          <Plus size={20} className="mr-2" />
          新建套餐
        </Link>
      </div>

      {/* 筛选和搜索 */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex items-center gap-4">
        <input 
          type="text" 
          placeholder="搜索套餐名称..."
          className="input w-full max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">所有状态</option>
          <option value="已上架">已上架</option>
          <option value="已下架">已下架</option>
          <option value="草稿">草稿</option>
        </select>
      </div>

      {/* 列表视图 */}
      <div className="space-y-3">
        {filteredPackages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              {/* 套餐图片 - 可点击进入编辑 */}
              <div 
                onClick={() => {
                  if (user?.role === 'designer') {
                    navigate(`/admin/packages/designer-edit/${pkg.id}`);
                  } else {
                    navigate(`/admin/packages/edit/${pkg.id}`);
                  }
                }}
                className="flex-shrink-0 cursor-pointer group"
              >
                <div className="relative w-40 h-32 rounded-lg overflow-hidden bg-gray-100">
                  <img 
                    src={pkg.image} 
                    alt={pkg.name} 
                    className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                    <Edit className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={20} />
                  </div>
                </div>
              </div>

              {/* 套餐信息 */}
              <div className="flex-grow">
                <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                <p className="text-2xl font-bold text-red-500 mt-1">{formatPrice(pkg.price)}</p>
                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>📦 {pkg.productCount} 件商品</span>
                  <span>🏷️ {pkg.categoryCount} 个类别</span>
                </div>
              </div>

              {/* 状态和操作按钮 */}
              <div className="flex items-center gap-3">
                {/* 上架/下架按钮 */}
                <button 
                  onClick={() => handleStatusToggle(pkg.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pkg.status === '已上架' 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  title={pkg.status === '已上架' ? '点击下架' : '点击上架'}
                >
                  {pkg.status === '已上架' ? (
                    <>
                      <Eye size={18} />
                      <span className="text-sm font-medium">已上架</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={18} />
                      <span className="text-sm font-medium">已下架</span>
                    </>
                  )}
                </button>

                {/* 利润管理按钮 - 仅管理员 */}
                {user?.role !== 'designer' && (
                  <button 
                    onClick={() => navigate(`/admin/packages/profit/${pkg.id}`)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                    title="利润管理"
                  >
                    <DollarSign size={18} />
                    <span className="text-sm font-medium">利润</span>
                  </button>
                )}

                {/* 编辑按钮 */}
                <button 
                  onClick={() => {
                    if (user?.role === 'designer') {
                      navigate(`/admin/packages/designer-edit/${pkg.id}`);
                    } else {
                      navigate(`/admin/packages/edit/${pkg.id}`);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                  title="编辑套餐"
                >
                  <Edit size={18} />
                  <span className="text-sm font-medium">编辑</span>
                </button>

                {/* 删除按钮 - 仅管理员 */}
                {user?.role !== 'designer' && (
                  <button 
                    onClick={() => {
                      if (window.confirm(`确定要删除"${pkg.name}"吗？`)) {
                        handleDelete(pkg.id);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                    title="删除套餐"
                  >
                    <Trash2 size={18} />
                    <span className="text-sm font-medium">删除</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageListPage;
