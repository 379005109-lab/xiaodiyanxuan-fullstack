import javaApiClient from '@/api/javaApiClient';

// 组织架构树节点
export interface OrgTreeNode {
  id: string;
  name: string;
  parentId?: string;
  systemFlag: string;
  children?: OrgTreeNode[];
}

// 用户信息
export interface UserInfo {
  id: string;
  userName: string;
  phone: string;
  organizeName: string;
  positionName: string;
  status: string;
  enabled: string;
  systemFlag: string;
}

// 用户表单数据
export interface UserFormData {
  id?: string;
  userName: string;
  phone: string;
  organizeId: string;
  positionId?: string;
  status?: string;
}

// 组织表单数据
export interface OrgFormData {
  id?: string;
  name: string;
  parentId?: string;
  sort?: number;
}

// 查询组织架构树
export const getOrganizeTreeAPI = async (params?: { name?: string }) => {
  try {
    const response = await javaApiClient.get('/organize/tree', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取组织架构失败');
  }
};

// 新增组织架构
export const addOrganizeAPI = async (data: OrgFormData) => {
  try {
    const response = await javaApiClient.post('/organize', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '新增组织失败');
  }
};

// 修改组织架构
export const updateOrganizeAPI = async (data: OrgFormData) => {
  try {
    const response = await javaApiClient.put('/organize', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '修改组织失败');
  }
};

// 删除组织架构
export const delOrganizeAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/organize/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除组织失败');
  }
};

// 用户分页查询
export const getUserListAPI = async (params: {
  organizeId?: string;
  name?: string;
  phone?: string;
  enabled?: string;
  current: number;
  size: number;
}) => {
  try {
    const response = await javaApiClient.get('/user/page', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取用户列表失败');
  }
};

// 新增用户
export const addUserAPI = async (data: UserFormData) => {
  try {
    const response = await javaApiClient.post('/user', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '新增用户失败');
  }
};

// 修改用户
export const updateUserAPI = async (data: UserFormData) => {
  try {
    const response = await javaApiClient.put('/user', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '修改用户失败');
  }
};

// 获取用户详情
export const getUserInfoAPI = async (id: string) => {
  try {
    const response = await javaApiClient.get(`/user/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取用户详情失败');
  }
};

// 启用/禁用用户
export const updateUserEnabledAPI = async (id: string) => {
  try {
    const response = await javaApiClient.put(`/user/enabled/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '操作失败');
  }
};

// 删除用户
export const delUserAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/user/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除用户失败');
  }
};

// 查询启用岗位列表
export const getPositionBizEnabledListAPI = async (params?: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/position/bizEnabledList', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取职位列表失败');
  }
};

// 关联部门列表（排除当前角色已关联部门）
export const getOrganizeTreeNotInAPI = async (params: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/organize/treeNotIn', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取部门列表失败');
  }
};
