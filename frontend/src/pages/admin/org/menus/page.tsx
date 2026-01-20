import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, RefreshCw, Plus, Edit, Trash2 } from 'lucide-react';
import {
  getApplicationListAPI,
  getMenuListAPI,
  updateMenuEnabledAPI,
  delMenuAPI,
  MENU_TYPE_MAP,
  type MenuInfo,
  type ApplicationInfo,
} from '@/services/applicationService';
import MenuFormModal from './components/MenuFormModal';

export default function MenuManagement() {
  const [appList, setAppList] = useState<ApplicationInfo[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [menuList, setMenuList] = useState<MenuInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [enabledFilter, setEnabledFilter] = useState('');
  const [isApp, setIsApp] = useState('0'); // 0-WEB, 1-APP
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);

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

  // 获取菜单列表
  const fetchMenuList = async () => {
    if (!selectedAppId) return;
    try {
      setLoading(true);
      const res = await getMenuListAPI({
        applicationId: selectedAppId,
        isApp,
        name: searchName || undefined,
        enabled: enabledFilter || undefined,
      });
      if (res.code === 0 || res.code === 200) {
        setMenuList(res.data || []);
      }
    } catch (error: any) {
      toast.error(error.message || '获取菜单列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppList();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      fetchMenuList();
    }
  }, [selectedAppId, isApp]);

  const handleSearch = () => {
    fetchMenuList();
  };

  const handleReset = () => {
    setSearchName('');
    setEnabledFilter('');
    fetchMenuList();
  };

  const handleAdd = () => {
    setEditingMenuId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingMenuId(id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('此操作将永久删除该数据, 是否继续？')) return;
    try {
      const res = await delMenuAPI(id);
      if (res.code === 0 || res.code === 200) {
        toast.success('删除成功！');
        fetchMenuList();
      } else {
        toast.error(res.msg || '删除失败');
      }
    } catch (error: any) {
      toast.error(error.message || '删除失败');
    }
  };

  const handleToggleEnabled = async (menu: MenuInfo) => {
    const action = menu.enabled === '1' ? '禁用' : '启用';
    if (!confirm(`是否${action}菜单?`)) return;
    try {
      const res = await updateMenuEnabledAPI(menu.id);
      if (res.code === 0 || res.code === 200) {
        toast.success(`${action}成功`);
        fetchMenuList();
      } else {
        toast.error(res.msg || `${action}失败`);
      }
    } catch (error: any) {
      toast.error(error.message || `${action}失败`);
    }
  };

  // 递归渲染菜单树
  const renderMenuRows = (menus: MenuInfo[], level = 0): React.ReactNode => {
    return menus.map((menu) => (
      <>
        <tr key={menu.id} className="hover:bg-stone-50 transition-colors">
          <td className="px-6 py-3 whitespace-nowrap">
            <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
              {menu.icon && <i className={`${menu.icon} mr-2 text-stone-500`} />}
              <span className="text-sm text-stone-900">{menu.name}</span>
            </div>
          </td>
          <td className="px-6 py-3 whitespace-nowrap">
            <div className="text-sm text-stone-600 truncate max-w-xs">{menu.path || '-'}</div>
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-center">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
              {MENU_TYPE_MAP[menu.type] || '未知'}
            </span>
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-center">
            <span className="text-sm text-stone-600">{menu.sortOrder || 0}</span>
          </td>
          <td className="px-6 py-3">
            <div className="text-sm text-stone-600 truncate max-w-xs">{menu.permission || '-'}</div>
          </td>
          <td className="px-6 py-3 whitespace-nowrap text-center">
            <button
              onClick={() => handleToggleEnabled(menu)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                menu.enabled === '1' ? 'bg-[#14B8A6]' : 'bg-stone-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  menu.enabled === '1' ? 'translate-x-4' : 'translate-x-1'
                }`}
              />
            </button>
          </td>
          <td className="px-6 py-3 whitespace-nowrap">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(menu.id)}
                className="text-[#14B8A6] hover:text-[#0d9488] text-sm"
              >
                编辑
              </button>
              <button
                onClick={() => handleDelete(menu.id)}
                className="text-red-500 hover:text-red-600 text-sm"
              >
                删除
              </button>
            </div>
          </td>
        </tr>
        {menu.children && menu.children.length > 0 && renderMenuRows(menu.children, level + 1)}
      </>
    ));
  };

  return (
    <>
      {/* 面包屑 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <span>组织管理</span>
          <span>{'>'}</span>
          <span className="text-stone-900 font-medium">应用菜单管理</span>
        </div>
      </div>

      {/* 页面标题 */}
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">应用菜单管理</h1>

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

        {/* 右侧菜单列表 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm">
          {/* 搜索区域 */}
          <div className="p-4 border-b border-stone-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-stone-600">关键字</label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="请输入关键字"
                  className="px-3 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:border-[#14B8A6] w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-stone-600">状态</label>
                <select
                  value={enabledFilter}
                  onChange={(e) => setEnabledFilter(e.target.value)}
                  className="px-3 py-1.5 border border-stone-300 rounded text-sm focus:outline-none focus:border-[#14B8A6]"
                >
                  <option value="">全部</option>
                  <option value="1">启用</option>
                  <option value="0">禁用</option>
                </select>
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
            </div>

            {/* Tab 切换 */}
            <div className="flex border-b border-stone-200">
              <button
                onClick={() => setIsApp('0')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isApp === '0'
                    ? 'border-[#14B8A6] text-[#14B8A6]'
                    : 'border-transparent text-stone-600 hover:text-stone-800'
                }`}
              >
                WEB
              </button>
              <button
                onClick={() => setIsApp('1')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  isApp === '1'
                    ? 'border-[#14B8A6] text-[#14B8A6]'
                    : 'border-transparent text-stone-600 hover:text-stone-800'
                }`}
              >
                APP
              </button>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="px-4 py-3 border-b border-stone-200">
            <button
              onClick={handleAdd}
              className="px-4 py-1.5 bg-[#14B8A6] text-white rounded text-sm hover:bg-[#0d9488] flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              新增
            </button>
          </div>

          {/* 表格 */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="text-center py-12 text-stone-500">加载中...</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">菜单名称</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">菜单地址</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-stone-600">类型</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-stone-600">排序</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">权限标识</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-stone-600">状态</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {menuList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-stone-500">
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    renderMenuRows(menuList)
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* 菜单表单弹窗 */}
      {isModalOpen && (
        <MenuFormModal
          menuId={editingMenuId}
          applicationId={selectedAppId}
          isApp={isApp}
          appList={appList}
          menuList={menuList}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            fetchMenuList();
          }}
        />
      )}
    </>
  );
}