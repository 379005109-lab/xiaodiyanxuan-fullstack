import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, RefreshCw, Plus } from 'lucide-react';
import {
  getApplicationListAPI,
  getTenantPackagePageAPI,
  delTenantPackageAPI,
  EXPIRES_TYPE_MAP,
  type ApplicationInfo,
  type PackageInfo,
} from '@/services/applicationService';
import PackageFormModal from './components/PackageFormModal';
import PackageAuthModal from './components/PackageAuthModal';

export default function Packages() {
  const [appList, setAppList] = useState<ApplicationInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [packageList, setPackageList] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPackageId, setAuthPackageId] = useState<string | null>(null);

  // 获取应用列表
  const fetchAppList = async () => {
    try {
      setTreeLoading(true);
      const res = await getApplicationListAPI();
      if (res.code === 0 || res.code === 200) {
        setAppList(res.data || []);
        if (res.data && res.data.length > 0) {
          setSelectedAppId(res.data[0].id);
        }
      }
    } catch (error: any) {
      toast.error(error.message || '获取应用列表失败');
    } finally {
      setTreeLoading(false);
    }
  };

  // 获取套餐列表
  const fetchPackageList = async () => {
    if (!selectedAppId) return;
    try {
      setLoading(true);
      const res = await getTenantPackagePageAPI({
        applicationId: selectedAppId,
        name: searchName || undefined,
        current: currentPage,
        size: pageSize,
      });
      if (res.code === 0 || res.code === 200) {
        setPackageList(res.data?.records || []);
        setTotal(res.data?.total || 0);
      }
    } catch (error: any) {
      toast.error(error.message || '获取套餐列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppList();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      fetchPackageList();
    }
  }, [selectedAppId, currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPackageList();
  };

  const handleReset = () => {
    setSearchName('');
    setCurrentPage(1);
    fetchPackageList();
  };

  const handleAdd = () => {
    setEditingPackageId(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingPackageId(id);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('此操作将永久删除该数据, 是否继续？')) return;
    try {
      const res = await delTenantPackageAPI(id);
      if (res.code === 0 || res.code === 200) {
        toast.success('删除成功！');
        fetchPackageList();
      } else {
        toast.error(res.msg || '删除失败');
      }
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const handleAuthorize = (id: string) => {
    setAuthPackageId(id);
    setIsAuthModalOpen(true);
  };

  const formatPrice = (pkg: PackageInfo) => {
    const price = pkg.price || 0;
    const unit = EXPIRES_TYPE_MAP[pkg.expiresType || 'year'] || '年';
    return `${price}元/${unit}`;
  };

  const formatEnterpriseCount = (pkg: PackageInfo) => {
    if (pkg.inviteType === 2) {
      return '不限人数';
    }
    return pkg.inviteNumber || 0;
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {/* 面包屑 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <span>组织管理</span>
          <span>{'>'}</span>
          <span className="text-stone-900 font-medium">应用套餐</span>
        </div>
      </div>

      {/* 页面标题 */}
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">应用套餐</h1>

      <div className="flex gap-6">
        {/* 左侧应用列表 */}
        <div className="w-64 bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-stone-200">
            <h3 className="font-medium text-stone-800">应用列表</h3>
          </div>
          <div className="p-2 max-h-[600px] overflow-y-auto">
            {treeLoading ? (
              <div className="text-center py-4 text-stone-500">加载中...</div>
            ) : (
              appList.map((app) => (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppId(app.id)}
                  className={`px-3 py-2 rounded cursor-pointer transition-colors ${
                    selectedAppId === app.id
                      ? 'bg-[#14B8A6] text-white'
                      : 'hover:bg-stone-100 text-stone-700'
                  }`}
                >
                  {app.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 右侧套餐列表 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm">
          {/* 搜索区域 */}
          <div className="p-4 border-b border-stone-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-stone-600">服务包名称</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="请输入服务包名称"
                  className="px-3 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:border-[#14B8A6] w-48"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-1.5 bg-[#14B8A6] text-white rounded text-sm hover:bg-[#0d9488] flex items-center gap-1"
              >
                <Search className="w-4 h-4" />
                查询
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-1.5 border border-stone-300 text-stone-600 rounded text-sm hover:bg-stone-50 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                重置
              </button>
              <div className="flex-1" />
              <button
                onClick={handleAdd}
                className="px-4 py-1.5 bg-[#14B8A6] text-white rounded text-sm hover:bg-[#0d9488] flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                新增
              </button>
            </div>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-stone-500">加载中...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">服务包名称</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">价格</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">企业人数</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">最后修改人</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">最后修改时间</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">备注</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {packageList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    packageList.map((pkg) => (
                      <tr key={pkg.id} className="hover:bg-stone-50 transition-colors">
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-stone-900">
                          {pkg.name}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-stone-900">
                          {formatPrice(pkg)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-stone-900">
                          {formatEnterpriseCount(pkg)}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-stone-600">
                          {pkg.updateName || '-'}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-stone-600">
                          {pkg.updateTime || '-'}
                        </td>
                        <td className="px-6 py-3 text-sm text-stone-600 max-w-xs truncate">
                          {pkg.remark || '-'}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(pkg.id)}
                              className="text-[#14B8A6] hover:text-[#0d9488] text-sm"
                            >
                              编辑
                            </button>
                            <button
                              onClick={() => handleDelete(pkg.id)}
                              className="text-red-500 hover:text-red-600 text-sm"
                            >
                              删除
                            </button>
                            <button
                              onClick={() => handleAuthorize(pkg.id)}
                              className="text-[#14B8A6] hover:text-[#0d9488] text-sm"
                            >
                              授权
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* 分页 */}
          {total > 0 && (
            <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-between">
              <div className="text-sm text-stone-600">
                共 {total} 条
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1 border border-stone-300 rounded text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-3 py-1 bg-[#14B8A6] text-white rounded text-sm">
                  {currentPage}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1 border border-stone-300 rounded text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 套餐表单弹窗 */}
      {isFormModalOpen && (
        <PackageFormModal
          packageId={editingPackageId}
          applicationId={selectedAppId}
          appList={appList}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => {
            setIsFormModalOpen(false);
            fetchPackageList();
          }}
        />
      )}

      {/* 授权弹窗 */}
      {isAuthModalOpen && authPackageId && (
        <PackageAuthModal
          packageId={authPackageId}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => {
            setIsAuthModalOpen(false);
          }}
        />
      )}
    </>
  );
}
