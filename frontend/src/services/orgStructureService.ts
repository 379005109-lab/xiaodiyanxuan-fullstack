import { javaApiClient } from '../api/javaApiClient';

/**
 * @description: 租户 - 业务中心 - 查询组织架构树
 */
export const getOrganizeTreeAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/api/organize/tree', {
      params: data,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取组织架构树失败');
  }
};

/**
 * @description: 租户 - 业务中心 -新增组织架构
 */
export const addOrganizeAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.post('/api/organize', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '新增组织架构失败');
  }
};

/**
 * @description: 租户 - 业务中心 -修改组织架构
 */
export const updateOrganizeAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.put('/api/organize', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '修改组织架构失败');
  }
};

/**
 * @description: 租户 - 业务中心 -通过id删除组织架构
 */
export const delOrganizeAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/organize/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除组织架构失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 门店用户分页查询
 */
export const getUserListAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/api/user/page', {
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
 * @description: 租户 - 业务中心 - 新增门店用户
 */
export const addUserAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.post('/api/user', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '新增用户失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 修改门店用户
 */
export const updateUserAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.put('/api/user', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '修改用户失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 通过id查询
 */
export const getUserInfoAPI = async (id: string) => {
  try {
    const response = await javaApiClient.get(`/user/${id}`, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取用户信息失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 启用禁用
 */
export const updateUserEnabledAPI = async (id: string) => {
  try {
    const response = await javaApiClient.put(`/user/enabled/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '更新用户状态失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 通过id删除门店用户
 */
export const delUserAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/user/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除用户失败');
  }
};

/**
 * @description: 查询部门
 */
export const getOrganizeAPI = async () => {
  try {
    const response = await javaApiClient.get('/api/organize/bizTree', {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取部门列表失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 关联部门列表 排除当前角色已关联部门
 */
export const getOrganizeTreeNotInAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/api/organize/treeNotIn', {
      params: data,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取部门列表失败');
  }
};

/**
 * @description: 查询职位列表
 */
export const getPositionBizEnabledListAPI = async () => {
  try {
    const response = await javaApiClient.get('/api/position/bizEnabledList', {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取职位列表失败');
  }
};