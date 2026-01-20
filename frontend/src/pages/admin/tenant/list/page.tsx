import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, RefreshCw, Plus } from 'lucide-react';
import { 
  getTenantPageAPI, 
  toggleTenantEnabledAPI, 
  ROLE_TYPE_MAP,
  type TenantInfo 
} from '@/services/tenantService';
import AuthorizationModal from './components/AuthorizationModal';

export default function TenantList() {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [enabled, setEnabled] = useState('');
  const [loading, setLoading] = useState(false);
  const [tenantList, setTenantList] = useState<TenantInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [size] = useState(10);
  const navigate = useNavigate();
  
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  const fetchTenantList = async () => {
    setLoading(true);
    try {
      const params = {
        current,
        size,
        code: code || undefined,
        name: name || undefined,
        clientName: clientName || undefined,
        enabled: enabled || undefined,
      };
      const res = await getTenantPageAPI(params);
      if (res.code === 0 || res.code === 200) {
        setTenantList(res.data?.records || []);
        setTotal(res.data?.total || 0);
      } else {
        toast.error(res.msg || '获取租户列表失败');
      }
    } catch (error: any) {
      toast.error(error.message || '获取租户列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantList();
  }, [current]);

  const handleSearch = () => {
    setCurrent(1);
    fetchTenantList();
  };

  const handleReset = () => {
    setCode('');
    setName('');
    setClientName('');
    setEnabled('');
    setCurrent(1);
    setTimeout(() => fetchTenantList(), 0);
  };

  const handleEdit = (id: string) => {
    navigate(`/admin/tenant/form?id=${id}`);
  };

  const handleToggleEnabled = async (tenant: TenantInfo) => {
    const action = tenant.enabled === '1' ? '禁用' : '启用';
    if (tenant.enabled === '1') {
      if (!confirm(`确定${action}该账号吗？`)) return;
    }
    
    try {
      const res = await toggleTenantEnabledAPI(tenant.id);
      if (res.code === 0 || res.code === 200) {
        toast.success(`${action}成功！`);
        fetchTenantList();
      } else {
        toast.error(res.msg || `${action}失败`);
      }
    } catch (error: any) {
      toast.error(error.message || `${action}失败`);
    }
  };

  const handleAddAuthorization = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setIsAuthModalOpen(true);
  };

  const getRoleTypeLabel = (roleType: number) => {
    return ROLE_TYPE_MAP[roleType] || '未知类型';
  };

  const totalPages = Math.ceil(total / size);

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
          <span>租户管理</span>
          <span>{'>'}</span>
          <span>租户列表</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800">租户列表</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {/* 搜索筛选区域 */}
        <div className="p-6 border-b border-stone-200">
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-stone-600 mb-2">账号编号</label>
              <input
                type="text"
                placeholder="请输入账号编号"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm text-stone-600 mb-2">账号名称</label>
              <input
                type="text"
                placeholder="请输入账号名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm text-stone-600 mb-2">联系人</label>
              <input
                type="text"
                placeholder="请输入联系人"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm text-stone-600 mb-2">状态</label>
              <select
                value={enabled}
                onChange={(e) => setEnabled(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
              >
                <option value="">全部</option>
                <option value="1">启用</option>
                <option value="0">禁用</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#14B8A6] text-white px-6 py-2 rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              查询
            </button>
            <button
              onClick={handleReset}
              className="bg-white text-stone-600 px-6 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              重置
            </button>
            <div className="flex-1"></div>
            <Link
              to="/admin/tenant/form"
              className="bg-[#14B8A6] text-white px-5 py-2 rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              新增账号
            </Link>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-stone-500">加载中...</div>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">序号</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">账号编号</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">账号类型</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">账号名称</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">联系人</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">联系方式</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">状态</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-stone-200">
                {tenantList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-stone-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  tenantList.map((tenant, index) => (
                    <tr key={tenant.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900">{(current - 1) * size + index + 1}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900">{tenant.code || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-700">
                          {getRoleTypeLabel(tenant.roleType)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900">{tenant.name || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900">{tenant.clientName || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-stone-900">{tenant.clientMobile || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                          tenant.enabled === '1' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {tenant.enabled === '1' ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button 
                            className="text-[#14B8A6] hover:text-[#0d9488] text-sm cursor-pointer whitespace-nowrap"
                            onClick={() => handleEdit(tenant.id)}
                          >
                            编辑
                          </button>
                          {tenant.enabled === '0' ? (
                            <button 
                              className="text-[#14B8A6] hover:text-[#0d9488] text-sm cursor-pointer whitespace-nowrap"
                              onClick={() => handleToggleEnabled(tenant)}
                            >
                              启用
                            </button>
                          ) : (
                            <button 
                              className="text-red-600 hover:text-red-700 text-sm cursor-pointer whitespace-nowrap"
                              onClick={() => handleToggleEnabled(tenant)}
                            >
                              禁用
                            </button>
                          )}
                          <button 
                            className="text-[#14B8A6] hover:text-[#0d9488] text-sm cursor-pointer whitespace-nowrap"
                            onClick={() => handleAddAuthorization(tenant.id)}
                          >
                            添加授权
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
            <div className="text-sm text-stone-500">
              共 {total} 条记录，第 {current} / {totalPages} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrent(Math.max(1, current - 1))}
                disabled={current === 1}
                className="px-3 py-1 border border-stone-300 rounded text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <button
                onClick={() => setCurrent(Math.min(totalPages, current + 1))}
                disabled={current === totalPages}
                className="px-3 py-1 border border-stone-300 rounded text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 授权弹窗 */}
      {isAuthModalOpen && selectedTenantId && (
        <AuthorizationModal
          tenantId={selectedTenantId}
          onClose={() => {
            setIsAuthModalOpen(false);
            setSelectedTenantId(null);
          }}
          onSuccess={() => {
            setIsAuthModalOpen(false);
            setSelectedTenantId(null);
            fetchTenantList();
          }}
        />
      )}
    </div>
  );
}