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
      console.log('🔍 [套餐列表] 开始加载套餐数据...');
      console.log('🔍 [套餐列表] 请求URL: /packages?pageSize=100');
      
      // 请求所有状态的套餐，不只是active状态
      const response = await apiClient.get('/packages', { params: { pageSize: 100 } });
      console.log('🔍 [套餐列表] API响应状态:', response.status);
      console.log('🔍 [套餐列表] API响应数据:', response.data);
      
      if (!response.data.data || !Array.isArray(response.data.data)) {
        console.error('🔍 [套餐列表] API返回数据格式错误:', response.data);
        toast.error('套餐数据格式错误');
        return;
      }
      
      console.log('🔍 [套餐列表] 原始套餐数量:', response.data.data.length);
      
      const apiPackages = response.data.data.map((pkg: any, index: number) => {
        console.log(`🔍 [套餐列表] 处理套餐 ${index + 1}:`, {
          id: pkg._id,
          name: pkg.name,
          status: pkg.status,
          basePrice: pkg.basePrice,
          products: pkg.products?.length || 0
        });
        
        // 计算类别数量
        const categories = new Set();
        if (pkg.products && pkg.products.length > 0) {
          pkg.products.forEach((product: any) => {
            if (product.category) {
              categories.add(product.category);
            }
          });
        }
        
        return {
          id: pkg._id,
          name: pkg.name,
          price: pkg.basePrice,
          productCount: pkg.products?.length || 0,
          categoryCount: categories.size,
          image: pkg.thumbnail ? getFileUrl(pkg.thumbnail) : '/placeholder.svg',
          status: pkg.status
        };
      });
      
      console.log('🔍 [套餐列表] 处理后套餐数量:', apiPackages.length);
      console.log('🔍 [套餐列表] 处理后套餐数据:', apiPackages);
      setPackages(apiPackages);
    } catch (error) {
      console.error('🔍 [套餐列表] 加载套餐失败:', error);
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
      const statusText = newStatus === 'active' ? '上架' : '下架';
      
      await apiClient.put(`/packages/${packageId}`, { status: newStatus });
      
      toast.success(`套餐已${statusText}`);
      // 重新加载数据，确保状态更新
      await loadPackages();
    } catch (error) {
      console.error('更新状态失败', error);
      toast.error('更新状态失败');
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const searchTermMatch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = statusFilter === 'all' || pkg.status === statusFilter;
    const result = searchTermMatch && statusMatch;
    
    console.log(`🔍 [套餐筛选] 套餐"${pkg.name}": 搜索匹配=${searchTermMatch}, 状态匹配=${statusMatch}(${pkg.status} vs ${statusFilter}), 最终结果=${result}`);
    
    return result;
  });

  console.log('🔍 [套餐筛选] 总套餐数:', packages.length);
  console.log('🔍 [套餐筛选] 当前筛选条件: 搜索词="' + searchTerm + '", 状态筛选="' + statusFilter + '"');
  console.log('🔍 [套餐筛选] 筛选后套餐数:', filteredPackages.length);

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
          <option value="active">已上架</option>
          <option value="inactive">已下架</option>
          <option value="draft">草稿</option>
        </select>
      </div>

      {/* 提示信息 */}
      {statusFilter === 'all' && filteredPackages.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            💡 点击"已上架"按钮可以下架套餐，下架后的套餐可通过上方筛选器选择"已下架"查看
          </p>
        </div>
      )}

      {/* 空状态提示 */}
      {filteredPackages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">
            {statusFilter === 'all' ? '暂无套餐' : `暂无${statusFilter === 'active' ? '已上架' : statusFilter === 'inactive' ? '已下架' : '草稿'}套餐`}
          </p>
          {statusFilter !== 'all' && (
            <button 
              onClick={() => setStatusFilter('all')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              查看所有套餐
            </button>
          )}
        </div>
      )}

      {/* 卡片网格视图 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPackages.map((pkg) => (
          <div key={pkg.id} className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
            {/* 套餐图片 - 可点击进入编辑 */}
            <div 
              onClick={() => {
                if (user?.role === 'designer') {
                  navigate(`/admin/packages/designer-edit/${pkg.id}`);
                } else {
                  navigate(`/admin/packages/edit/${pkg.id}`);
                }
              }}
              className="relative aspect-square cursor-pointer overflow-hidden bg-gray-100"
            >
              <img 
                src={pkg.image} 
                alt={pkg.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <Edit className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={24} />
              </div>
              
              {/* 状态标签 */}
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  pkg.status === 'active' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {pkg.status === 'active' ? '已上架' : '已下架'}
                </span>
              </div>
            </div>

            {/* 套餐信息 */}
            <div className="p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1">{pkg.name}</h3>
              <p className="text-xl font-bold text-red-500 mb-3">{formatPrice(pkg.price)}</p>
              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>📦 {pkg.productCount}件</span>
                <span>🏷️ {pkg.categoryCount}类</span>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col gap-2">
                {/* 上架/下架按钮 */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusToggle(pkg.id);
                  }}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    pkg.status === 'active' 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pkg.status === 'active' ? (
                    <>
                      <Eye size={16} />
                      <span className="text-sm font-medium">已上架</span>
                    </>
                  ) : (
                    <>
                      <EyeOff size={16} />
                      <span className="text-sm font-medium">点击上架</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  {/* 利润管理按钮 - 仅管理员 */}
                  {user?.role !== 'designer' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/packages/profit/${pkg.id}`);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                      title="利润管理"
                    >
                      <DollarSign size={16} />
                      <span className="text-xs font-medium">利润</span>
                    </button>
                  )}

                  {/* 编辑按钮 */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (user?.role === 'designer') {
                        navigate(`/admin/packages/designer-edit/${pkg.id}`);
                      } else {
                        navigate(`/admin/packages/edit/${pkg.id}`);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    title="编辑套餐"
                  >
                    <Edit size={16} />
                    <span className="text-xs font-medium">编辑</span>
                  </button>

                  {/* 删除按钮 - 仅管理员 */}
                  {user?.role !== 'designer' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`确定要删除"${pkg.name}"吗？`)) {
                          handleDelete(pkg.id);
                        }
                      }}
                      className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                      title="删除套餐"
                    >
                      <Trash2 size={16} />
                      <span className="text-xs font-medium">删除</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageListPage;
