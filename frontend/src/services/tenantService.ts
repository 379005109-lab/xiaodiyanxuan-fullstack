import javaApiClient from '@/api/javaApiClient';

// 租户列表查询参数
export interface TenantQueryParams {
  current: number;
  size: number;
  code?: string;
  name?: string;
  clientName?: string;
  enabled?: string;
}

// 租户信息
export interface TenantInfo {
  id: string;
  code: string;
  name: string;
  roleType: number;
  clientName: string;
  clientMobile: string;
  address?: string;
  email?: string;
  enabled: string;
  createTime?: string;
  expiresTime?: string;
}

// 租户表单数据
export interface TenantFormData {
  id?: string;
  name: string;
  code?: string;
  roleType: number;
  clientName: string;
  clientMobile: string;
  address?: string;
  email?: string;
}

// 分页查询租户列表
export const getTenantPageAPI = async (params: TenantQueryParams) => {
  try {
    const response = await javaApiClient.get('/tenant/page', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取租户列表失败');
  }
};

// 新增租户
export const addTenantAPI = async (data: TenantFormData) => {
  try {
    const response = await javaApiClient.post('/tenant', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '新增租户失败');
  }
};

// 编辑租户
export const updateTenantAPI = async (data: TenantFormData) => {
  try {
    const response = await javaApiClient.put('/tenant', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '编辑租户失败');
  }
};

// 获取租户详情
export const getTenantDetailAPI = async (id: string) => {
  try {
    const response = await javaApiClient.get(`/tenant/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取租户详情失败');
  }
};

// 启用/禁用租户
export const toggleTenantEnabledAPI = async (id: string) => {
  try {
    const response = await javaApiClient.put(`/tenant/enabled/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '操作失败');
  }
};

// 添加授权
export const addTenantPackageAPI = async (id: string, data: any) => {
  try {
    const response = await javaApiClient.post(`/tenant/addPackage/${id}`, data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '添加授权失败');
  }
};

// 获取租户应用列表
export const getTenantApplicationPageAPI = async (params: { current: number; size: number; tenantId: string }) => {
  try {
    const response = await javaApiClient.get('/tenantapplication/page', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取应用列表失败');
  }
};

// 账号类型映射
export const ROLE_TYPE_MAP: Record<number, string> = {
  1: '普通账号',
  2: '设计师',
  3: '分销商',
  4: '特定对象',
  5: '企业内部联系人',
};
