import apiClient from '@/lib/apiClient';
import { Product } from '@/types';

// 获取商品列表
export const getProducts = async (params?: any) => {
  try {
    const response = await apiClient.get('/api/products', { params });
    return response.data;
  } catch (error: any) {
    console.error('获取商品列表失败:', error);
    throw error;
  }
};

// 获取单个商品
export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const response = await apiClient.get(`/api/products/${id}`);
    return response.data.data;
  } catch (error: any) {
    console.error('获取商品失败:', error);
    return null;
  }
};

// 创建商品
export const createProduct = async (productData: any) => {
  try {
    const response = await apiClient.post('/api/products', productData);
    return response.data;
  } catch (error: any) {
    console.error('创建商品失败:', error);
    throw error;
  }
};

// 更新商品
export const updateProduct = async (id: string, productData: any) => {
  try {
    const response = await apiClient.put(`/api/products/${id}`, productData);
    return response.data;
  } catch (error: any) {
    console.error('更新商品失败:', error);
    throw error;
  }
};

// 删除商品
export const deleteProduct = async (id: string) => {
  try {
    const response = await apiClient.delete(`/api/products/${id}`);
    return response.data;
  } catch (error: any) {
    console.error('删除商品失败:', error);
    throw error;
  }
};

// 切换商品状态
export const toggleProductStatus = async (id: string) => {
  try {
    const response = await apiClient.patch(`/api/products/${id}/status`);
    return response.data;
  } catch (error: any) {
    console.error('切换商品状态失败:', error);
    throw error;
  }
};

// 搜索商品
export const searchProducts = async (keyword: string, params?: any) => {
  try {
    const response = await apiClient.get('/api/products/search', {
      params: { keyword, ...params }
    });
    return response.data;
  } catch (error: any) {
    console.error('搜索商品失败:', error);
    throw error;
  }
};

