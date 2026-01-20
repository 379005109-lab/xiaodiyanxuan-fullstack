import { useState, useEffect } from 'react';

interface MenuFormProps {
  menu: any;
  onSave: (data: any) => void;
}

export default function MenuForm({ menu, onSave }: MenuFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'WEB',
    parentId: '',
    sort: '',
    icon: '',
    path: '',
    component: '',
    redirect: '',
    status: true,
    visible: true,
    cache: false,
    alwaysShow: false,
    remark: '',
  });

  useEffect(() => {
    if (menu) {
      setFormData({
        name: menu.name || '',
        type: menu.type || 'WEB',
        parentId: menu.parentId || '',
        sort: menu.sort?.toString() || '',
        icon: menu.icon || '',
        path: menu.path || '',
        component: menu.component || '',
        redirect: menu.redirect || '',
        status: menu.status ?? true,
        visible: menu.visible ?? true,
        cache: menu.cache ?? false,
        alwaysShow: menu.alwaysShow ?? false,
        remark: menu.remark || '',
      });
    }
  }, [menu]);

  const handleSubmit = () => {
    onSave(formData);
  };

  if (!menu) {
    return (
      <div className="flex items-center justify-center h-full text-stone-400">
        <div className="text-center">
          <i className="ri-file-list-line text-5xl mb-4"></i>
          <p className="text-sm">请选择左侧菜单进行编辑</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
        <h2 className="text-lg font-semibold text-stone-900">菜单详情</h2>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-stone-600 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap">
            取消
          </button>
          <button 
            onClick={handleSubmit}
            className="px-4 py-2 text-sm text-white bg-[#14B8A6] rounded-lg hover:bg-[#12a594] transition-colors cursor-pointer whitespace-nowrap"
          >
            保存
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">
          {/* 基本信息 */}
          <div className="mb-6">
            <h3 className="text-base font-medium text-stone-900 mb-4">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-stone-700 mb-2">
                  <span className="text-red-500">*</span> 菜单名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
                  placeholder="请输入菜单名称"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-700 mb-2">
                  <span className="text-red-500">*</span> 类型
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] cursor-pointer"
                >
                  <option value="WEB">WEB</option>
                  <option value="APP">APP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-700 mb-2">上级菜单</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] cursor-pointer"
                >
                  <option value="">无</option>
                  <option value="1">租户管理</option>
                  <option value="4">前台配置</option>
                  <option value="10">订单管理</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-stone-700 mb-2">
                  <span className="text-red-500">*</span> 排序
                </label>
                <input
                  type="number"
                  value={formData.sort}
                  onChange={(e) => setFormData({ ...formData, sort: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
                  placeholder="请输入排序号"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-700 mb-2">图标</label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
                  placeholder="请输入图标类名"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-700 mb-2">路由地址</label>
                <input
                  type="text"
                  value={formData.path}
                  onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
                  placeholder="请输入路由地址"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-700 mb-2">组件路径</label>
                <input
                  type="text"
                  value={formData.component}
                  onChange={(e) => setFormData({ ...formData, component: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
                  placeholder="请输入组件路径"
                />
              </div>

              <div>
                <label className="block text-sm text-stone-700 mb-2">重定向地址</label>
                <input
                  type="text"
                  value={formData.redirect}
                  onChange={(e) => setFormData({ ...formData, redirect: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]"
                  placeholder="请输入重定向地址"
                />
              </div>
            </div>
          </div>

          {/* 状态设置 */}
          <div className="mb-6">
            <h3 className="text-base font-medium text-stone-900 mb-4">状态设置</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-stone-700 font-medium">状态</div>
                  <div className="text-xs text-stone-500 mt-1">是否启用该菜单</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#14B8A6]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-stone-700 font-medium">显示状态</div>
                  <div className="text-xs text-stone-500 mt-1">是否在菜单中显示</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.visible}
                    onChange={(e) => setFormData({ ...formData, visible: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#14B8A6]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-stone-700 font-medium">缓存</div>
                  <div className="text-xs text-stone-500 mt-1">是否缓存该路由页面</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.cache}
                    onChange={(e) => setFormData({ ...formData, cache: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#14B8A6]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                </label>
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-sm text-stone-700 font-medium">总是显示</div>
                  <div className="text-xs text-stone-500 mt-1">即使只有一个子菜单也显示父菜单</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.alwaysShow}
                    onChange={(e) => setFormData({ ...formData, alwaysShow: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#14B8A6]/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div>
            <h3 className="text-base font-medium text-stone-900 mb-4">备注</h3>
            <textarea
              value={formData.remark}
              onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6] resize-none"
              placeholder="请输入备注信息"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
