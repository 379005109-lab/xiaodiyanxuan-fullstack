import { javaApiClient } from '../api/javaApiClient';

/**
 * @description: 租户 - 业务中心 - 角色列表
 */
export const getRoleListAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/role/list', {
      params: data,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取角色列表失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 新增门店角色
 */
export const addRoleAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.post('/role', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '新增角色失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 修改门店角色
 */
export const updateRoleAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.put('/role', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '修改角色失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 通过id删除门店角色
 */
export const delRoleAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/role/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除角色失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 获取角色和岗位部门人员关联关系
 */
export const getRoleUserListAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/rolepermission/rolePOUPage', {
      params: data,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取角色关联用户失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 查询功能树
 */
export const getRoleMenuTreeAPI = async (type: string, roleId: string) => {
  try {
    const response = await javaApiClient.get(`/role/menuTree/${type}/${roleId}`, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取功能树失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 用户角色关系（不在角色中的用户）
 */
export const getPageNotInRoleListAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/role/pageNotInRole', {
      params: data,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取用户列表失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 新增用户角色关系
 */
export const updateUserRelationAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.post('/rolepermission/user', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '关联用户失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 保存或更新角色菜单权限
 */
export const updateRoleMenuAPI = async (roleId: string, data: Record<string, any>) => {
  try {
    const response = await javaApiClient.put(`/role/saveOrUpdateRoleMenu/${roleId}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '保存权限配置失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 通过id删除用户角色关系
 */
export const delUserRelationAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/rolepermission/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除关联关系失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 角色管理 - 新增角色和岗位关联关系
 */
export const correlationRoleAndPositionAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.post('/rolepermission/post', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '关联职位失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 角色管理 - 新增部门角色关系
 */
export const correlationRoleAndOrgAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.post('/rolepermission/organize', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '关联部门失败');
  }
};
