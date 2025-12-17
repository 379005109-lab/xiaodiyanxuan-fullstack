import apiClient from '@/lib/apiClient';
import { Category, CategoryDiscount } from '@/types';

export type { Category };

// 获取所有分类
export const getAllCategories = async (): Promise<Category[]> => {
  try {
    const response = await apiClient.get('/categories');
    const categories = response.data.data || [];
    // 确保每个分类都有 discounts 字段
    return categories.map((cat: any) => ({
      ...cat,
      manufacturerId: cat.manufacturerId ?? null,
      discounts: cat.discounts || [],
      hasDiscount: cat.hasDiscount || false,
      productCount: cat.productCount || 0,
      level: cat.level || 1,
      children: cat.children || []
    }));
  } catch (error: any) {
    console.error('获取分类列表失败:', error);
    throw error;
  }
};

// 获取树形结构的分类（使用 getAllCategories 代替，因为后端没有 /tree 端点）
export const getCategoryTree = async (): Promise<Category[]> => {
  return getAllCategories();
};

// 创建分类
export const createCategory = async (
  categoryData: Omit<Category, '_id' | 'createdAt' | 'updatedAt'>
): Promise<Category> => {
  try {
    const response = await apiClient.post('/categories', categoryData);
    return response.data.data;
  } catch (error: any) {
    console.error('创建分类失败:', error);
    throw error;
  }
};

// 更新分类
export const updateCategory = async (id: string, categoryData: Partial<Category>): Promise<Category | null> => {
  try {
    const response = await apiClient.put(`/categories/${id}`, categoryData);
    return response.data.data;
  } catch (error: any) {
    console.error('更新分类失败:', error);
    throw error;
  }
};

// 删除分类
export const deleteCategory = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.delete(`/categories/${id}`);
    return response.data.success;
  } catch (error: any) {
    console.error('删除分类失败:', error);
    throw error;
  }
};

// 切换分类状态
export const toggleCategoryStatus = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.patch(`/categories/${id}/status`);
    return response.data.success;
  } catch (error: any) {
    console.error('切换分类状态失败:', error);
    throw error;
  }
};

// 设置分类折扣
export const setCategoryDiscount = async (id: string, discounts: any[]): Promise<boolean> => {
  try {
    const response = await apiClient.post(`/categories/${id}/discounts`, { discounts });
    return response.data.success;
  } catch (error: any) {
    console.error('设置分类折扣失败:', error);
    throw error;
  }
};

// 批量设置所有分类折扣
export const setAllCategoriesDiscount = async (discounts: any[]): Promise<boolean> => {
  try {
    const response = await apiClient.post('/categories/discounts/batch', { discounts });
    return response.data.success;
  } catch (error: any) {
    console.error('批量设置分类折扣失败:', error);
    throw error;
  }
};

// 获取统计信息
export const getCategoryStats = async () => {
  try {
    const response = await apiClient.get('/categories/stats');
    return response.data.data;
  } catch (error: any) {
    console.error('获取分类统计失败:', error);
    throw error;
  }
};
