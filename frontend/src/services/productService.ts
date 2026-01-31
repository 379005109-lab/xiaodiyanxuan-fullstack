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

// 创建商品
export const createProduct = async (productData: any) => {
  try {
    console.log('📤 [createProduct] 发送请求到后端, 商品名称:', productData.name);
    console.log('📤 [createProduct] API URL:', apiClient.defaults.baseURL);
    const response = await apiClient.post('/products', productData);
    console.log('📥 [createProduct] 后端响应:', response.status, response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ [createProduct] 请求失败:', error.message);
    console.error('❌ [createProduct] 响应状态:', error.response?.status);
    console.error('❌ [createProduct] 响应数据:', error.response?.data);
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

