import apiClient from '@/lib/apiClient';
import { Product } from '@/types';

// 获取商品列表
export const getProducts = async (params?: any) => {
  try {
    const response = await apiClient.get('/products', { params });
    return response.data;
  } catch (error: any) {
    console.error('获取商品列表失败:', error);
    throw error;
  }
};

// 获取单个商品
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const response = await apiClient.get(`/products/${id}`, { params: { _t: Date.now() } });
    return response.data.data;
  } catch (error: any) {
    console.error('获取商品失败:', error);
    return null;
  }
};

// 创建商品 - Build: 20260131-v2
export const createProduct = async (productData: any) => {
  try {
    // 强制使用真实API
    alert(`正在创建商品: ${productData.name}`);
    const response = await apiClient.post('/products', productData);
    alert(`创建成功: ${JSON.stringify(response.data).substring(0, 100)}`);
    return response.data;
  } catch (error: any) {
    alert(`创建失败: ${error.message}`);
    throw error;
  }
};

// 更新商品
export const updateProduct = async (id: string, productData: any) => {
  try {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  } catch (error: any) {
    console.error('更新商品失败:', error);
    throw error;
  }
};

// 删除商品
export const deleteProduct = async (id: string) => {
  try {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('删除商品失败:', error);
    throw error;
  }
};

// 切换商品状态
export const toggleProductStatus = async (id: string) => {
  try {
    const response = await apiClient.patch(`/products/${id}/status`);
    return response.data;
  } catch (error: any) {
    console.error('切换商品状态失败:', error);
    throw error;
  }
};

// 搜索商品
export const searchProducts = async (keyword: string, params?: any) => {
  try {
    const response = await apiClient.get('/products/search', {
      params: { keyword, ...params }
    });
    return response.data;
  } catch (error: any) {
    console.error('搜索商品失败:', error);
    throw error;
  }
};

