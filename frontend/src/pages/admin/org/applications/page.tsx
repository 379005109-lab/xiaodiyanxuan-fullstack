import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, RefreshCw, Plus } from 'lucide-react';
import {
  getApplicationPageAPI,
  delApplicationAPI,
  type ApplicationInfo,
} from '@/services/applicationService';
import ApplicationFormModal from './components/ApplicationFormModal';
import TenantListModal from './components/TenantListModal';
import MemberListModal from './components/MemberListModal';

export default function Applications() {
  const [appList, setAppList] = useState<ApplicationInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  // 获取应用列表
  const fetchAppList = async () => {
    try {
      setLoading(true);
      const res = await getApplicationPageAPI({
        name: searchName || undefined,
        current: currentPage,
        size: pageSize,
      });
      if (res.code === 0 || res.code === 200) {
        setAppList(res.data?.records || []);
        setTotal(res.data?.total || 0);
      }
    } catch (error: any) {
      toast.error(error.message || '获取应用列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppList();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAppList();
  };

  const handleReset = () => {
    setSearchName('');
    setCurrentPage(1);
    fetchAppList();
  };

  const handleAdd = () => {
    setEditingAppId(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingAppId(id);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('此操作将永久删除该数据, 是否继续？')) return;
    try {
      const res = await delApplicationAPI(id);
      if (res.code === 0 || res.code === 200) {
        toast.success('删除成功！');
        fetchAppList();
      } else {
        toast.error(res.msg || '删除失败');
      }
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const handleViewTenants = (id: string) => {
    setSelectedAppId(id);
    setIsTenantModalOpen(true);
  };

  const handleViewMembers = (id: string) => {
    setSelectedAppId(id);
    setIsMemberModalOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {/* 面包屑 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <span>组织管理</span>
          <span>{'>'}</span>
          <span className="text-stone-900 font-medium">应用管理</span>
        </div>
      </div>

      {/* 页面标题 */}
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">应用管理</h1>

      <div className="bg-white rounded-lg shadow-sm">
        {/* 搜索区域 */}
        <div className="p-4 border-b border-stone-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-stone-600">应用名称</label>
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="请输入应用名称"
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
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">应用名称</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {appList.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-6 py-12 text-center text-stone-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  appList.map((app) => (
                    <tr key={app.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-stone-900">
                        {app.name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleEdit(app.id)}
                            className="text-[#14B8A6] hover:text-[#0d9488] text-sm"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(app.id)}
                            className="text-red-500 hover:text-red-600 text-sm"
                          >
                            删除
                          </button>
                          <button
                            onClick={() => handleViewTenants(app.id)}
                            className="text-[#14B8A6] hover:text-[#0d9488] text-sm"
                          >
                            应用租户
                          </button>
                          <button
                            onClick={() => handleViewMembers(app.id)}
                            className="text-[#14B8A6] hover:text-[#0d9488] text-sm"
                          >
                            平台成员
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

      {/* 应用表单弹窗 */}
      {isFormModalOpen && (
        <ApplicationFormModal
          appId={editingAppId}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => {
            setIsFormModalOpen(false);
            fetchAppList();
          }}
        />
      )}

      {/* 应用租户弹窗 */}
      {isTenantModalOpen && selectedAppId && (
        <TenantListModal
          applicationId={selectedAppId}
          onClose={() => setIsTenantModalOpen(false)}
        />
      )}

      {/* 平台成员弹窗 */}
      {isMemberModalOpen && selectedAppId && (
        <MemberListModal
          applicationId={selectedAppId}
          onClose={() => setIsMemberModalOpen(false)}
        />
      )}
    </>
  );
}
