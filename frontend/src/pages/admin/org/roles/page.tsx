import { useState, useEffect } from 'react';
import RoleModal from './components/RoleModal';
import PermissionModal from './components/PermissionModal';
import UserRelationModal from './components/UserRelationModal';
import PositionRelationModal from './components/PositionRelationModal';
import OrgRelationModal from './components/OrgRelationModal';
import { getRoleListAPI, addRoleAPI, updateRoleAPI, delRoleAPI } from '../../../../services/roleService';

interface Role {
  id: string;
  roleName: string;
  roleCode: string;
  userCount?: number;
  enabled?: string;
  systemFlag?: string;
  createTime?: string;
  remark?: string;
}

export default function Roles() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionRole, setPermissionRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUserRelationModalOpen, setIsUserRelationModalOpen] = useState(false);
  const [isPositionRelationModalOpen, setIsPositionRelationModalOpen] = useState(false);
  const [isOrgRelationModalOpen, setIsOrgRelationModalOpen] = useState(false);
  const [relationRole, setRelationRole] = useState<Role | null>(null);

  // 获取角色列表
  const fetchRoleList = async () => {
    try {
      setLoading(true);
      const response = await getRoleListAPI({ name: searchText });
      setRoles(response.data || []);
    } catch (error) {
      console.error('获取角色列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleList();
  }, []);

  const handleAdd = () => {
    setEditingRole(null);
    setIsModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setIsModalOpen(true);
  };

  const handleSearch = () => {
    fetchRoleList();
  };

  const handleReset = () => {
    setSearchText('');
    setStatusFilter('全部');
    fetchRoleList();
  };

  const handleDelete = async (role: Role) => {
    if (role.systemFlag === '1') {
      alert('系统角色不能删除');
      return;
    }
    if (window.confirm('此操作将永久删除该数据, 是否继续？')) {
      try {
        await delRoleAPI(role.id);
        alert('删除成功！');
        fetchRoleList();
      } catch (error) {
        console.error('删除角色失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleSaveRole = async (data: any) => {
    try {
      if (editingRole?.id) {
        await updateRoleAPI({ ...data, id: editingRole.id });
      } else {
        await addRoleAPI(data);
      }
      alert('保存成功！');
      setIsModalOpen(false);
      fetchRoleList();
    } catch (error) {
      console.error('保存角色失败:', error);
      alert('保存失败，请重试');
    }
  };

  const handlePermission = (role: Role) => {
    setPermissionRole(role);
    setIsPermissionModalOpen(true);
  };

  const handleUserRelation = (role: Role) => {
    setRelationRole(role);
    setIsUserRelationModalOpen(true);
  };

  const handlePositionRelation = (role: Role) => {
    setRelationRole(role);
    setIsPositionRelationModalOpen(true);
  };

  const handleOrgRelation = (role: Role) => {
    setRelationRole(role);
    setIsOrgRelationModalOpen(true);
  };

  return (
    <>
      {/* 面包屑 */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-stone-600">
          <span>组织管理</span>
          <i className="ri-arrow-right-s-line"></i>
          <span className="text-stone-900 font-medium">角色管理</span>
        </div>
      </div>

      {/* 页面标题 */}
      <h1 className="text-2xl font-semibold text-stone-900 mb-6">角色管理</h1>

      <div className="bg-white rounded-lg shadow-sm">
        {/* 搜索筛选区域 */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索角色名称或编码"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
            >
              <option>全部</option>
              <option>正常</option>
              <option>禁用</option>
            </select>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleSearch}
              className="bg-[#14B8A6] text-white px-6 py-2 rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
            >
              <i className="ri-search-line"></i>
              查询
            </button>
            <button
              onClick={handleReset}
              className="bg-white text-stone-600 px-6 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
            >
              <i className="ri-refresh-line"></i>
              重置
            </button>
            <div className="flex-1"></div>
            <button
              onClick={handleAdd}
              className="bg-[#14B8A6] text-white px-5 py-2 rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line"></i>
              新增角色
            </button>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">序号</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">角色名称</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">角色编码</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">角色描述</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">人员数量</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">创建时间</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {roles.map((role, index) => (
                <tr key={role.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{index + 1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900 font-medium">{role.roleName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{role.roleCode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-stone-600 max-w-xs truncate">{role.remark || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{role.userCount || 0}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {role.enabled === '1' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-700">
                        正常
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-700">
                        禁用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{role.createTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleEdit(role)}
                        className="text-[#14B8A6] hover:text-[#0d9488] text-sm cursor-pointer whitespace-nowrap"
                      >
                        编辑
                      </button>
                      {role.systemFlag === '0' && (
                        <>
                          <button
                            onClick={() => handleUserRelation(role)}
                            className="text-[#14B8A6] hover:text-[#0d9488] text-sm cursor-pointer whitespace-nowrap"
                          >
                            关联人员
                          </button>
                          <button
                            onClick={() => handlePositionRelation(role)}
                            className="text-green-600 hover:text-green-700 text-sm cursor-pointer whitespace-nowrap"
                          >
                            关联职位
                          </button>
                          <button
                            onClick={() => handleOrgRelation(role)}
                            className="text-green-600 hover:text-green-700 text-sm cursor-pointer whitespace-nowrap"
                          >
                            关联部门
                          </button>
                          <button
                            onClick={() => handlePermission(role)}
                            className="text-blue-600 hover:text-blue-700 text-sm cursor-pointer whitespace-nowrap"
                          >
                            权限配置
                          </button>
                          <button
                            onClick={() => handleDelete(role)}
                            className="text-red-600 hover:text-red-700 text-sm cursor-pointer whitespace-nowrap"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 角色弹窗 */}
      {isModalOpen && (
        <RoleModal
          role={editingRole ? {
            id: editingRole.id,
            name: editingRole.roleName,
            code: editingRole.roleCode,
            description: editingRole.remark || ''
          } : null}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveRole}
        />
      )}

      {/* 权限配置弹窗 */}
      {isPermissionModalOpen && permissionRole && (
        <PermissionModal
          role={{
            id: permissionRole.id,
            name: permissionRole.roleName,
            code: permissionRole.roleCode,
            description: permissionRole.remark || ''
          }}
          onClose={() => {
            setIsPermissionModalOpen(false);
            setPermissionRole(null);
          }}
          onSave={(data) => {
            console.log('保存权限配置:', data);
            fetchRoleList();
          }}
        />
      )}

      {/* 关联人员弹窗 */}
      {isUserRelationModalOpen && relationRole && (
        <UserRelationModal
          role={{ id: relationRole.id, name: relationRole.roleName }}
          onClose={() => {
            setIsUserRelationModalOpen(false);
            setRelationRole(null);
          }}
          onSave={() => fetchRoleList()}
        />
      )}

      {/* 关联职位弹窗 */}
      {isPositionRelationModalOpen && relationRole && (
        <PositionRelationModal
          role={{ id: relationRole.id, name: relationRole.roleName }}
          onClose={() => {
            setIsPositionRelationModalOpen(false);
            setRelationRole(null);
          }}
          onSave={() => fetchRoleList()}
        />
      )}

      {/* 关联部门弹窗 */}
      {isOrgRelationModalOpen && relationRole && (
        <OrgRelationModal
          role={{ id: relationRole.id, name: relationRole.roleName }}
          onClose={() => {
            setIsOrgRelationModalOpen(false);
            setRelationRole(null);
          }}
          onSave={() => fetchRoleList()}
        />
      )}
    </>
  );
}