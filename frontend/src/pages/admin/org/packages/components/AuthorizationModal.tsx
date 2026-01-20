import { useState, useEffect } from 'react';

interface AuthorizationModalProps {
  packageName: string;
  onClose: () => void;
  onSave: (data: any) => void;
}

interface Permission {
  id: string;
  name: string;
  checked: boolean;
}

interface Module {
  id: string;
  name: string;
  type: 'app' | 'web';
  expanded: boolean;
  children: Page[];
}

interface Page {
  id: string;
  name: string;
  expanded: boolean;
  permissions: Permission[];
}

export default function AuthorizationModal({ packageName, onClose, onSave }: AuthorizationModalProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [modules, setModules] = useState<Module[]>([
    {
      id: 'web',
      name: 'WEB',
      type: 'web',
      expanded: true,
      children: [
        {
          id: 'business-center',
          name: '业务中心',
          expanded: false,
          permissions: [
            { id: 'view', name: '查看', checked: true },
            { id: 'add', name: '新增', checked: true },
            { id: 'edit', name: '编辑', checked: true },
            { id: 'delete', name: '删除', checked: false },
            { id: 'export', name: '导出', checked: true }
          ]
        },
        {
          id: 'org-structure',
          name: '组织架构',
          expanded: false,
          permissions: [
            { id: 'view', name: '查看', checked: true },
            { id: 'add-dept', name: '新增部门', checked: true },
            { id: 'edit-dept', name: '编辑部门', checked: true },
            { id: 'delete-dept', name: '删除部门', checked: false },
            { id: 'add-employee', name: '新增员工', checked: true },
            { id: 'edit-employee', name: '编辑员工', checked: true },
            { id: 'delete-employee', name: '删除员工', checked: false }
          ]
        },
        {
          id: 'position-management',
          name: '职位管理',
          expanded: false,
          permissions: [
            { id: 'view', name: '查看', checked: true },
            { id: 'add', name: '新增', checked: true },
            { id: 'edit', name: '编辑', checked: true },
            { id: 'delete', name: '删除', checked: false }
          ]
        },
        {
          id: 'role-management',
          name: '角色管理',
          expanded: false,
          permissions: [
            { id: 'view', name: '查看', checked: true },
            { id: 'add', name: '新增', checked: false },
            { id: 'edit', name: '编辑', checked: false },
            { id: 'delete', name: '删除', checked: false },
            { id: 'permission-config', name: '权限配置', checked: false }
          ]
        },
        {
          id: 'data-dict',
          name: '数据字典',
          expanded: false,
          permissions: [
            { id: 'view', name: '查看', checked: true },
            { id: 'add', name: '新增', checked: false },
            { id: 'edit', name: '编辑', checked: false },
            { id: 'delete', name: '删除', checked: false }
          ]
        },
        {
          id: 'member-transfer',
          name: '成员交接',
          expanded: false,
          permissions: [
            { id: 'view', name: '查看', checked: true },
            { id: 'transfer', name: '交接', checked: false }
          ]
        }
      ]
    },
    {
      id: 'app',
      name: 'APP',
      type: 'app',
      expanded: false,
      children: [
        {
          id: 'home-mall',
          name: '家居商城',
          expanded: false,
          permissions: [
            { id: 'view', name: '查看', checked: true },
            { id: 'add', name: '新增', checked: false },
            { id: 'edit', name: '编辑', checked: false },
            { id: 'delete', name: '删除', checked: false }
          ]
        },
        {
          id: 'order-management',
          name: '订单管理',
          expanded: false,
          permissions: [
            { id: 'view', name: '查看', checked: true },
            { id: 'process', name: '处理', checked: false },
            { id: 'cancel', name: '取消', checked: false }
          ]
        }
      ]
    }
  ]);

  const toggleModuleExpand = (moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId ? { ...module, expanded: !module.expanded } : module
    ));
  };

  const togglePageExpand = (moduleId: string, pageId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            children: module.children.map(page =>
              page.id === pageId ? { ...page, expanded: !page.expanded } : page
            )
          }
        : module
    ));
  };

  const handlePermissionChange = (moduleId: string, pageId: string, permissionId: string) => {
    setHasUnsavedChanges(true);
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? {
            ...module,
            children: module.children.map(page =>
              page.id === pageId 
                ? {
                    ...page,
                    permissions: page.permissions.map(perm =>
                      perm.id === permissionId ? { ...perm, checked: !perm.checked } : perm
                    )
                  }
                : page
            )
          }
        : module
    ));
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('有未保存的更改，确定要关闭吗？')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = () => {
    console.log('保存授权配置:', modules);
    onSave(modules);
    setHasUnsavedChanges(false);
  };

  const getSelectedCount = () => {
    let count = 0;
    modules.forEach(module => {
      module.children.forEach(page => {
        count += page.permissions.filter(p => p.checked).length;
      });
    });
    return count;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-semibold text-stone-900">
            授权应用
          </h2>
          <button
            onClick={handleClose}
            className="text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-stone-600 mb-4">
              <i className="ri-information-line"></i>
              <span>为 <strong className="text-stone-900">{packageName}</strong> 选择授权的应用和功能按钮</span>
            </div>
          </div>

          {/* 模块列表 */}
          <div className="space-y-3">
            {modules.map(module => (
              <div key={module.id} className="border border-stone-200 rounded-lg bg-stone-50">
                {/* 模块头部 */}
                <div
                  onClick={() => toggleModuleExpand(module.id)}
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-stone-100 rounded-t-lg"
                >
                  <i className={`ri-arrow-${module.expanded ? 'down' : 'right'}-s-line text-stone-600`}></i>
                  <span className={`px-2 py-0.5 text-xs rounded font-medium ${
                    module.type === 'app' ? 'bg-blue-500 text-white' : 'bg-[#14B8A6] text-white'
                  }`}>
                    {module.name}
                  </span>
                  <span className="text-sm font-medium text-stone-700">{module.name === 'WEB' ? 'Web端应用' : 'App端应用'}</span>
                </div>

                {/* 页面列表 */}
                {module.expanded && (
                  <div className="border-t border-stone-200">
                    {module.children.map((page, pageIndex) => (
                      <div key={page.id} className={pageIndex > 0 ? 'border-t border-stone-200' : ''}>
                        {/* 页面头部 */}
                        <div
                          onClick={() => togglePageExpand(module.id, page.id)}
                          className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-white bg-stone-50/50"
                        >
                          <div className="w-4"></div>
                          <i className={`ri-arrow-${page.expanded ? 'down' : 'right'}-s-line text-stone-500 text-sm`}></i>
                          <i className="ri-file-list-3-line text-stone-500"></i>
                          <span className="text-sm text-stone-700">{page.name}</span>
                          <span className="text-xs text-stone-400">
                            ({page.permissions.filter(p => p.checked).length}/{page.permissions.length})
                          </span>
                        </div>

                        {/* 权限按钮列表 */}
                        {page.expanded && (
                          <div className="bg-white px-4 py-3">
                            <div className="pl-8 space-y-2">
                              {page.permissions.map(permission => (
                                <label
                                  key={permission.id}
                                  className="flex items-center gap-2 cursor-pointer hover:bg-stone-50 px-3 py-2 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={permission.checked}
                                    onChange={() => handlePermissionChange(module.id, page.id, permission.id)}
                                    className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                                  />
                                  <span className="text-sm text-stone-700">{permission.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 统计信息 */}
          <div className="mt-4 text-sm text-stone-600">
            已选择 <strong className="text-[#14B8A6]">{getSelectedCount()}</strong> 个功能权限
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-6 py-2 border border-stone-300 text-stone-700 rounded-md text-sm hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-2 bg-[#14B8A6] text-white rounded-md text-sm hover:bg-[#0d9488] transition-colors cursor-pointer whitespace-nowrap"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
