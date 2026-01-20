import javaApiClient from '@/api/javaApiClient';

// 应用信息
export interface ApplicationInfo {
  id: string;
  name: string;
  code?: string;
  remark?: string;
  createTime?: string;
}

// 菜单信息
export interface MenuInfo {
  id: string;
  name: string;
  path?: string;
  icon?: string;
  type: string; // 0-目录, 1-页面, 2-按钮
  sortOrder?: number;
  permission?: string;
  enabled: string;
  parentId?: string;
  applicationId?: string;
  isApp?: string;
  children?: MenuInfo[];
}

// 套餐信息
export interface PackageInfo {
  id: string;
  name: string;
  price?: number;
  expiresType?: string; // year, month
  inviteType?: number; // 1-限制人数, 2-不限人数
  inviteNumber?: number;
  applicationId?: string;
  updateName?: string;
  updateTime?: string;
  remark?: string;
}

// ==================== 应用管理 API ====================

// 应用分页查询
export const getApplicationPageAPI = async (params: { name?: string; current: number; size: number }) => {
  try {
    const response = await javaApiClient.get('/application/page', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取应用列表失败');
  }
};

// 应用列表查询（不分页）
export const getApplicationListAPI = async (params?: { name?: string }) => {
  try {
    const response = await javaApiClient.get('/application/list', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取应用列表失败');
  }
};

// 新增应用
export const addApplicationAPI = async (data: { name: string; code?: string; remark?: string }) => {
  try {
    const response = await javaApiClient.post('/application', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '新增应用失败');
  }
};

// 修改应用
export const updateApplicationAPI = async (data: { id: string; name: string; code?: string; remark?: string }) => {
  try {
    const response = await javaApiClient.put('/application', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '修改应用失败');
  }
};

// 获取应用详情
export const getApplicationInfoAPI = async (id: string) => {
  try {
    const response = await javaApiClient.get(`/application/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取应用详情失败');
  }
};

// 删除应用
export const delApplicationAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/application/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除应用失败');
  }
};

// 应用租户分页查询
export const getTenantAppPageAPI = async (params: { applicationId: string; current: number; size: number }) => {
  try {
    const response = await javaApiClient.get('/tenantapplication/page', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取应用租户列表失败');
  }
};

// 平台成员分页查询
export const getUserAppPageAPI = async (params: { applicationId: string; current: number; size: number }) => {
  try {
    const response = await javaApiClient.get('/user/pltPage', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取平台成员列表失败');
  }
};

// ==================== 应用菜单管理 API ====================

// 获取菜单列表（树形）
export const getMenuListAPI = async (params: { applicationId: string; isApp?: string; name?: string; enabled?: string }) => {
  try {
    const response = await javaApiClient.get('/menu', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取菜单列表失败');
  }
};

// 新增或修改菜单
export const addOrUpdateMenuAPI = async (data: Partial<MenuInfo>) => {
  try {
    const response = await javaApiClient.post('/menu', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '保存菜单失败');
  }
};

// 获取菜单详情
export const getMenuInfoAPI = async (id: string) => {
  try {
    const response = await javaApiClient.get(`/menu/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取菜单详情失败');
  }
};

// 启用/禁用菜单
export const updateMenuEnabledAPI = async (id: string) => {
  try {
    const response = await javaApiClient.put(`/menu/enabled/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '操作失败');
  }
};

// 删除菜单
export const delMenuAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/menu/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除菜单失败');
  }
};

// ==================== 应用套餐 API ====================

// 套餐分页查询
export const getTenantPackagePageAPI = async (params: { applicationId?: string; name?: string; current: number; size: number }) => {
  try {
    const response = await javaApiClient.get('/tenantpackage/page', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取套餐列表失败');
  }
};

// 套餐列表查询（不分页）
export const getTenantPackageListAPI = async (params?: { applicationId?: string }) => {
  try {
    const response = await javaApiClient.get('/tenantpackage/list', { params });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取套餐列表失败');
  }
};

// 新增套餐
export const addTenantPackageAPI = async (data: Partial<PackageInfo>) => {
  try {
    const response = await javaApiClient.post('/tenantpackage', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '新增套餐失败');
  }
};

// 修改套餐
export const updateTenantPackageAPI = async (data: Partial<PackageInfo>) => {
  try {
    const response = await javaApiClient.put('/tenantpackage', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '修改套餐失败');
  }
};

// 获取套餐详情
export const getTenantPackageInfoAPI = async (id: string) => {
  try {
    const response = await javaApiClient.get(`/tenantpackage/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取套餐详情失败');
  }
};

// 删除套餐
export const delTenantPackageAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/tenantpackage/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除套餐失败');
  }
};

// 获取菜单权限树
export const getMenuPermissionsAPI = async () => {
  try {
    const response = await javaApiClient.get('/menu/permissions');
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取菜单权限失败');
  }
};

// 获取套餐已授权菜单
export const getTenantPackageMenuAPI = async (id: string) => {
  try {
    const response = await javaApiClient.get(`/tenantpackagemenu/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取授权菜单失败');
  }
};

// 配置套餐功能模块
export const updateTenantPackageMenuAPI = async (data: { tenantPackageId: string; menuIds: string[] }) => {
  try {
    const response = await javaApiClient.put('/tenantpackagemenu', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '配置授权失败');
  }
};

// 菜单类型映射
export const MENU_TYPE_MAP: Record<string, string> = {
  '0': '目录',
  '1': '页面',
  '2': '按钮',
};

// 套餐有效期类型映射
export const EXPIRES_TYPE_MAP: Record<string, string> = {
  'year': '年',
  'month': '月',
};
