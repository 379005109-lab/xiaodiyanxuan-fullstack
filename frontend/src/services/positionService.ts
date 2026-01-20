import { javaApiClient } from '../api/javaApiClient';

/**
 * @description: 租户 - 业务中心 - 职位分页查询
 */
export const getPositionListAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/position/page', {
      params: data,
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

/**
 * @description: 租户 - 业务中心 - 职位新增
 */
export const addPositionAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.post('/position', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '新增职位失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 职位修改
 */
export const updatePositionAPI = async (data: Record<string, any>) => {
  try {
    const response = await javaApiClient.put('/position', data);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '修改职位失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 职位通过id查询
 */
export const getPositionInfoAPI = async (id: string) => {
  try {
    const response = await javaApiClient.get(`/position/${id}`, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '获取职位信息失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 职位启用禁用
 */
export const updatePositionEnabledAPI = async (id: string) => {
  try {
    const response = await javaApiClient.put(`/position/enabled/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '更新职位状态失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 职位通过id删除
 */
export const delPositionAPI = async (id: string) => {
  try {
    const response = await javaApiClient.delete(`/position/${id}`);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || '删除职位失败');
  }
};

/**
 * @description: 租户 - 业务中心 - 查询启用岗位搜索条件
 */
export const getPositionBizEnabledListAPI = async (data?: Record<string, any>) => {
  try {
    const response = await javaApiClient.get('/position/bizEnabledList', {
      params: data,
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
