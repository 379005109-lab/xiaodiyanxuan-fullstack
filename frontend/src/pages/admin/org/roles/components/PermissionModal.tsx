import { useState, useEffect } from 'react';

interface Role {
  id: string;
  name: string;
}

interface Member {
  id: string;
  type: 'user' | 'position' | 'department';
  typeName: string;
  name: string;
}

interface Permission {
  view?: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  export?: boolean;
}

interface DataScope {
  type: 'mine' | 'department' | 'specified' | 'all';
  departments?: string[];
}

interface ModulePermission {
  moduleName: string;
  permissions: Permission;
  dataScope: DataScope;
}

interface PermissionModalProps {
  role: Role;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function PermissionModal({ role, onClose, onSave }: PermissionModalProps) {
  const [activeTab, setActiveTab] = useState<'member' | 'web' | 'app'>('member');
  const [hasChanges, setHasChanges] = useState(false);
  
  // 成员相关状态
  const [memberSearchName, setMemberSearchName] = useState('');
  const [memberSearchType, setMemberSearchType] = useState('全部');
  const [members, setMembers] = useState<Member[]>([
    { id: '1', type: 'user', typeName: '人员', name: '张三' },
    { id: '2', type: 'position', typeName: '职位', name: '部门经理' },
    { id: '3', type: 'department', typeName: '部门', name: '技术部' }
  ]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);

  // WEB权限状态
  const [webPermissions, setWebPermissions] = useState<ModulePermission[]>([
    {
      moduleName: '租户管理',
      permissions: { view: true, add: true, edit: true, delete: false, export: true },
      dataScope: { type: 'department' }
    },
    {
      moduleName: '组织管理',
      permissions: { view: true, add: false, edit: false, delete: false, export: false },
      dataScope: { type: 'mine' }
    },
    {
      moduleName: '账号管理',
      permissions: { view: true, add: true, edit: true, delete: true, export: true },
      dataScope: { type: 'all' }
    },
    {
      moduleName: '订单管理',
      permissions: { view: true, add: false, edit: true, delete: false, export: true },
      dataScope: { type: 'specified', departments: ['dept1', 'dept2'] }
    },
    {
      moduleName: '商品管理',
      permissions: { view: true, add: true, edit: false, delete: false, export: false },
      dataScope: { type: 'department' }
    }
  ]);

  // APP权限状态
  const [appPermissions, setAppPermissions] = useState<ModulePermission[]>([
    {
      moduleName: '工作台',
      permissions: { view: true, add: false, edit: false, delete: false },
      dataScope: { type: 'mine' }
    },
    {
      moduleName: '客户管理',
      permissions: { view: true, add: true, edit: true, delete: false },
      dataScope: { type: 'department' }
    },
    {
      moduleName: '报表中心',
      permissions: { view: true, add: false, edit: false, delete: false },
      dataScope: { type: 'all' }
    }
  ]);

  const [showDeptTreeModal, setShowDeptTreeModal] = useState(false);
  const [currentEditingModule, setCurrentEditingModule] = useState<number | null>(null);

  useEffect(() => {
    // 模拟加载权限配置
    // GET /api/roles/:id/permission-config
    console.log('加载角色权限配置:', role.id);
  }, [role.id]);

  const handleClose = () => {
    if (hasChanges) {
      if (window.confirm('有未保存的更改，确定要关闭吗？')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    const data = {
      roleId: role.id,
      members,
      webPermissions,
      appPermissions
    };
    
    console.log('保存权限配置:', data);
    // POST /api/roles/:id/permission-config
    
    await onSave(data);
    setHasChanges(false);
    onClose();
  };

  const handleMemberSearch = () => {
    console.log('搜索成员:', { memberSearchName, memberSearchType });
  };

  const handleMemberReset = () => {
    setMemberSearchName('');
    setMemberSearchType('全部');
  };

  const handleDeleteMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    setHasChanges(true);
  };

  const handlePermissionChange = (
    type: 'web' | 'app',
    index: number,
    field: keyof Permission,
    value: boolean
  ) => {
    if (type === 'web') {
      const newPermissions = [...webPermissions];
      newPermissions[index].permissions[field] = value;
      setWebPermissions(newPermissions);
    } else {
      const newPermissions = [...appPermissions];
      newPermissions[index].permissions[field] = value;
      setAppPermissions(newPermissions);
    }
    setHasChanges(true);
  };

  const handleDataScopeChange = (
    type: 'web' | 'app',
    index: number,
    scopeType: DataScope['type']
  ) => {
    if (type === 'web') {
      const newPermissions = [...webPermissions];
      newPermissions[index].dataScope = { type: scopeType };
      setWebPermissions(newPermissions);
    } else {
      const newPermissions = [...appPermissions];
      newPermissions[index].dataScope = { type: scopeType };
      setAppPermissions(newPermissions);
    }
    setHasChanges(true);
  };

  const handleSelectDepartments = (index: number, type: 'web' | 'app') => {
    setCurrentEditingModule(index);
    setShowDeptTreeModal(true);
  };

  const handleDepartmentTreeConfirm = (selectedDepts: string[]) => {
    if (currentEditingModule !== null) {
      const permissions = activeTab === 'web' ? webPermissions : appPermissions;
      const newPermissions = [...permissions];
      newPermissions[currentEditingModule].dataScope.departments = selectedDepts;
      
      if (activeTab === 'web') {
        setWebPermissions(newPermissions);
      } else {
        setAppPermissions(newPermissions);
      }
      setHasChanges(true);
    }
    setShowDeptTreeModal(false);
    setCurrentEditingModule(null);
  };

  const renderMemberTab = () => (
    <>
      {/* 搜索区域 */}
      <div className="p-6 border-b border-stone-200">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            placeholder="成员名称"
            value={memberSearchName}
            onChange={(e) => setMemberSearchName(e.target.value)}
            className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
          />
          <select
            value={memberSearchType}
            onChange={(e) => setMemberSearchType(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
          >
            <option>全部</option>
            <option>人员</option>
            <option>职位</option>
            <option>部门</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleMemberSearch}
            className="bg-[#14B8A6] text-white px-6 py-2 rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
          >
            查询
          </button>
          <button
            onClick={handleMemberReset}
            className="bg-white text-stone-600 px-6 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors text-sm cursor-pointer whitespace-nowrap"
          >
            重置
          </button>
          <div className="flex-1"></div>
          <button
            onClick={() => setShowUserModal(true)}
            className="bg-[#14B8A6] text-white px-5 py-2 rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
          >
            关联人员
          </button>
          <button
            onClick={() => setShowPositionModal(true)}
            className="bg-[#14B8A6] text-white px-5 py-2 rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
          >
            关联职位
          </button>
          <button
            onClick={() => setShowDepartmentModal(true)}
            className="bg-[#14B8A6] text-white px-5 py-2 rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
          >
            关联部门
          </button>
        </div>
      </div>

      {/* 成员表格 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">成员类型</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">成员名称</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">操作</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-stone-200">
            {members.map((member) => (
              <tr key={member.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-stone-900">{member.typeName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-stone-900">{member.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteMember(member.id)}
                    className="text-red-600 hover:text-red-700 text-sm cursor-pointer whitespace-nowrap"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  const renderPermissionTab = (type: 'web' | 'app') => {
    const permissions = type === 'web' ? webPermissions : appPermissions;
    
    return (
      <div className="p-6">
        <div className="space-y-4">
          {permissions.map((module, index) => (
            <div key={index} className="border border-stone-200 rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between gap-6">
                  {/* 左侧：模块名称和功能权限 */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <h4 className="text-base font-semibold text-stone-900 mb-3">{module.moduleName}</h4>
                      <div className="text-sm text-stone-500 mb-3">功能权限</div>
                    </div>
                    
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={module.permissions.view || false}
                          onChange={(e) => handlePermissionChange(type, index, 'view', e.target.checked)}
                          className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900">查看</span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={module.permissions.add || false}
                          onChange={(e) => handlePermissionChange(type, index, 'add', e.target.checked)}
                          className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900">新增</span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={module.permissions.edit || false}
                          onChange={(e) => handlePermissionChange(type, index, 'edit', e.target.checked)}
                          className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900">编辑</span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={module.permissions.delete || false}
                          onChange={(e) => handlePermissionChange(type, index, 'delete', e.target.checked)}
                          className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900">删除</span>
                      </label>
                      
                      {type === 'web' && (
                        <>
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={module.permissions.export || false}
                              onChange={(e) => handlePermissionChange(type, index, 'export', e.target.checked)}
                              className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                            />
                            <span className="text-sm text-stone-700 group-hover:text-stone-900">导出</span>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                            />
                            <span className="text-sm text-stone-700 group-hover:text-stone-900">禁用启用员工</span>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                            />
                            <span className="text-sm text-stone-700 group-hover:text-stone-900">新增部门</span>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                            />
                            <span className="text-sm text-stone-700 group-hover:text-stone-900">编辑员工</span>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                            />
                            <span className="text-sm text-stone-700 group-hover:text-stone-900">删除员工</span>
                          </label>
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                            />
                            <span className="text-sm text-stone-700 group-hover:text-stone-900">禁用启用员工</span>
                          </label>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* 右侧：数据权限 */}
                  <div className="w-64 border-l border-stone-200 pl-6">
                    <div className="mb-3">
                      <div className="text-sm text-stone-500 mb-3">数据权限</div>
                    </div>
                    
                    <div className="space-y-2.5">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name={`dataScope-${type}-${index}`}
                          checked={module.dataScope.type === 'all'}
                          onChange={() => handleDataScopeChange(type, index, 'all')}
                          className="w-4 h-4 text-[#14B8A6] border-stone-300 focus:ring-[#14B8A6] cursor-pointer"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900">全部</span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name={`dataScope-${type}-${index}`}
                          checked={module.dataScope.type === 'mine'}
                          onChange={() => handleDataScopeChange(type, index, 'mine')}
                          className="w-4 h-4 text-[#14B8A6] border-stone-300 focus:ring-[#14B8A6] cursor-pointer"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900">我参与的</span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="radio"
                          name={`dataScope-${type}-${index}`}
                          checked={module.dataScope.type === 'department'}
                          onChange={() => handleDataScopeChange(type, index, 'department')}
                          className="w-4 h-4 text-[#14B8A6] border-stone-300 focus:ring-[#14B8A6] cursor-pointer"
                        />
                        <span className="text-sm text-stone-700 group-hover:text-stone-900">我部门的</span>
                      </label>
                      
                      <div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                          <input
                            type="radio"
                            name={`dataScope-${type}-${index}`}
                            checked={module.dataScope.type === 'specified'}
                            onChange={() => handleDataScopeChange(type, index, 'specified')}
                            className="w-4 h-4 text-[#14B8A6] border-stone-300 focus:ring-[#14B8A6] cursor-pointer"
                          />
                          <span className="text-sm text-stone-700 group-hover:text-stone-900">指定部门</span>
                        </label>
                        
                        {module.dataScope.type === 'specified' && (
                          <div className="mt-2 ml-7">
                            <button
                              onClick={() => handleSelectDepartments(index, type)}
                              className="text-[#14B8A6] hover:text-[#0d9488] text-sm cursor-pointer whitespace-nowrap flex items-center gap-1"
                            >
                              <i className="ri-add-line"></i>
                              <span>关联部门</span>
                            </button>
                            {module.dataScope.departments && module.dataScope.departments.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {module.dataScope.departments.map((dept, deptIndex) => (
                                  <span
                                    key={deptIndex}
                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-stone-100 text-stone-700"
                                  >
                                    部门{deptIndex + 1}
                                    <button
                                      onClick={() => {
                                        const newPermissions = type === 'web' ? [...webPermissions] : [...appPermissions];
                                        const newDepts = newPermissions[index].dataScope.departments?.filter((_, i) => i !== deptIndex);
                                        newPermissions[index].dataScope.departments = newDepts;
                                        if (type === 'web') {
                                          setWebPermissions(newPermissions);
                                        } else {
                                          setAppPermissions(newPermissions);
                                        }
                                        setHasChanges(true);
                                      }}
                                      className="ml-1.5 text-stone-500 hover:text-stone-700 cursor-pointer"
                                    >
                                      <i className="ri-close-line text-xs"></i>
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
          {/* 头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
            <h3 className="text-lg font-semibold text-stone-900">
              【{role.name}】权限配置
            </h3>
            <button
              onClick={handleClose}
              className="text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <i className="ri-close-line text-xl"></i>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 px-6 pt-4 border-b border-stone-200">
            <button
              onClick={() => setActiveTab('member')}
              className={`px-6 py-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'member'
                  ? 'text-[#14B8A6] border-b-2 border-[#14B8A6]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              成员
            </button>
            <button
              onClick={() => setActiveTab('web')}
              className={`px-6 py-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'web'
                  ? 'text-[#14B8A6] border-b-2 border-[#14B8A6]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              WEB
            </button>
            <button
              onClick={() => setActiveTab('app')}
              className={`px-6 py-3 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'app'
                  ? 'text-[#14B8A6] border-b-2 border-[#14B8A6]'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              APP
            </button>
          </div>

          {/* 内容区域 - 可滚动 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'member' && renderMemberTab()}
            {activeTab === 'web' && renderPermissionTab('web')}
            {activeTab === 'app' && renderPermissionTab('app')}
          </div>

          {/* 底部按钮 - 固定 */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 bg-white">
            <button
              onClick={handleClose}
              className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors text-sm cursor-pointer whitespace-nowrap"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
            >
              确认
            </button>
          </div>
        </div>
      </div>

      {/* 关联人员弹窗 */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-semibold text-stone-900">关联人员</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜索人员姓名"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
                />
              </div>
              <div className="max-h-96 overflow-y-auto border border-stone-200 rounded-lg">
                {['张三', '李四', '王五', '赵六', '孙七'].map((name, index) => (
                  <label key={index} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-b-0">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                    />
                    <span className="text-sm text-stone-900">{name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
              <button
                onClick={() => setShowUserModal(false)}
                className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors text-sm cursor-pointer whitespace-nowrap"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setHasChanges(true);
                }}
                className="px-6 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 关联职位弹窗 */}
      {showPositionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-semibold text-stone-900">关联职位</h3>
              <button
                onClick={() => setShowPositionModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="max-h-96 overflow-y-auto border border-stone-200 rounded-lg">
                {['部门经理', '项目经理', '技术总监', '产品经理', '设计师'].map((position, index) => (
                  <label key={index} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-b-0">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                    />
                    <span className="text-sm text-stone-900">{position}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
              <button
                onClick={() => setShowPositionModal(false)}
                className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors text-sm cursor-pointer whitespace-nowrap"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowPositionModal(false);
                  setHasChanges(true);
                }}
                className="px-6 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 关联部门弹窗 */}
      {showDepartmentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-semibold text-stone-900">关联部门</h3>
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜索部门名称"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
                />
              </div>
              <div className="max-h-96 overflow-y-auto border border-stone-200 rounded-lg p-4">
                {/* 部门树结构 */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                    />
                    <i className="ri-folder-line text-stone-600"></i>
                    <span className="text-sm text-stone-900">技术部</span>
                  </label>
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                      />
                      <i className="ri-folder-line text-stone-600"></i>
                      <span className="text-sm text-stone-900">前端组</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                      />
                      <i className="ri-folder-line text-stone-600"></i>
                      <span className="text-sm text-stone-900">后端组</span>
                    </label>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                    />
                    <i className="ri-folder-line text-stone-600"></i>
                    <span className="text-sm text-stone-900">产品部</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                    />
                    <i className="ri-folder-line text-stone-600"></i>
                    <span className="text-sm text-stone-900">设计部</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
              <button
                onClick={() => setShowDepartmentModal(false)}
                className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors text-sm cursor-pointer whitespace-nowrap"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowDepartmentModal(false);
                  setHasChanges(true);
                }}
                className="px-6 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 选择部门树弹窗（用于数据权限） */}
      {showDeptTreeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
              <h3 className="text-lg font-semibold text-stone-900">选择部门</h3>
              <button
                onClick={() => {
                  setShowDeptTreeModal(false);
                  setCurrentEditingModule(null);
                }}
                className="text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <i className="ri-close-line text-xl"></i>
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="搜索部门名称"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
                />
              </div>
              <div className="max-h-96 overflow-y-auto border border-stone-200 rounded-lg p-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                    />
                    <i className="ri-folder-line text-stone-600"></i>
                    <span className="text-sm text-stone-900">技术部</span>
                  </label>
                  <div className="ml-6 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                      />
                      <i className="ri-folder-line text-stone-600"></i>
                      <span className="text-sm text-stone-900">前端组</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                      />
                      <i className="ri-folder-line text-stone-600"></i>
                      <span className="text-sm text-stone-900">后端组</span>
                    </label>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6] cursor-pointer"
                    />
                    <i className="ri-folder-line text-stone-600"></i>
                    <span className="text-sm text-stone-900">产品部</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
              <button
                onClick={() => {
                  setShowDeptTreeModal(false);
                  setCurrentEditingModule(null);
                }}
                className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors text-sm cursor-pointer whitespace-nowrap"
              >
                取消
              </button>
              <button
                onClick={() => handleDepartmentTreeConfirm(['dept1', 'dept2', 'dept3'])}
                className="px-6 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
