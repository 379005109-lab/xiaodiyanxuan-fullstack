import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import {
  getMenuInfoAPI,
  addOrUpdateMenuAPI,
  type MenuInfo,
  type ApplicationInfo,
} from '@/services/applicationService';

interface MenuFormModalProps {
  menuId: string | null;
  applicationId: string;
  isApp: string;
  appList: ApplicationInfo[];
  menuList: MenuInfo[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  id?: string;
  name: string;
  path: string;
  icon: string;
  type: string;
  sortOrder: number;
  permission: string;
  enabled: string;
  parentId: string;
  applicationId: string;
  isApp: string;
}

export default function MenuFormModal({
  menuId,
  applicationId,
  isApp,
  appList,
  menuList,
  onClose,
  onSuccess,
}: MenuFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    path: '',
    icon: '',
    type: '0',
    sortOrder: 0,
    permission: '',
    enabled: '1',
    parentId: '0',
    applicationId: applicationId,
    isApp: isApp,
  });

  const isEdit = !!menuId;

  useEffect(() => {
    if (menuId) {
      loadMenuInfo();
    }
  }, [menuId]);

  const loadMenuInfo = async () => {
    if (!menuId) return;
    try {
      setLoading(true);
      const res = await getMenuInfoAPI(menuId);
      if (res.code === 0 || res.code === 200) {
        const data = res.data;
        setFormData({
          id: data.id,
          name: data.name || '',
          path: data.path || '',
          icon: data.icon || '',
          type: data.type || '0',
          sortOrder: data.sortOrder || 0,
          permission: data.permission || '',
          enabled: data.enabled || '1',
          parentId: data.parentId || '0',
          applicationId: data.applicationId || applicationId,
          isApp: data.isApp || isApp,
        });
      }
    } catch (error: any) {
      toast.error(error.message || '获取菜单详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('请输入菜单名称');
      return;
    }

    try {
      setSubmitting(true);
      const res = await addOrUpdateMenuAPI(formData);
      if (res.code === 0 || res.code === 200) {
        toast.success(isEdit ? '修改成功' : '新增成功');
        onSuccess();
      } else {
        toast.error(res.msg || '保存失败');
      }
    } catch (error: any) {
      toast.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 递归渲染菜单选项
  const renderMenuOptions = (menus: MenuInfo[], level = 0): React.ReactNode => {
    return menus.map((menu) => (
      <>
        <option key={menu.id} value={menu.id}>
          {'　'.repeat(level)}
          {menu.name}
        </option>
        {menu.children && menu.children.length > 0 && renderMenuOptions(menu.children, level + 1)}
      </>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">
            {isEdit ? '编辑菜单' : '新增菜单'}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {loading ? (
            <div className="text-center py-8 text-stone-500">加载中...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  所属应用 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.applicationId}
                  onChange={(e) => handleChange('applicationId', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  disabled={isEdit}
                >
                  {appList.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  上级菜单
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => handleChange('parentId', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                >
                  <option value="0">顶级节点</option>
                  {renderMenuOptions(menuList)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  菜单名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  placeholder="请输入菜单名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  菜单类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                >
                  <option value="0">目录</option>
                  <option value="1">页面</option>
                  <option value="2">按钮</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  菜单地址
                </label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => handleChange('path', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  placeholder="请输入菜单地址"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  图标
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleChange('icon', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  placeholder="请输入图标类名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  权限标识
                </label>
                <input
                  type="text"
                  value={formData.permission}
                  onChange={(e) => handleChange('permission', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  placeholder="请输入权限标识"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  排序
                </label>
                <input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  placeholder="请输入排序"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  状态
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="enabled"
                      value="1"
                      checked={formData.enabled === '1'}
                      onChange={(e) => handleChange('enabled', e.target.value)}
                      className="text-[#14B8A6]"
                    />
                    <span className="text-sm text-stone-700">启用</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="enabled"
                      value="0"
                      checked={formData.enabled === '0'}
                      onChange={(e) => handleChange('enabled', e.target.value)}
                      className="text-[#14B8A6]"
                    />
                    <span className="text-sm text-stone-700">禁用</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm disabled:opacity-50"
          >
            {submitting ? '保存中...' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
}
