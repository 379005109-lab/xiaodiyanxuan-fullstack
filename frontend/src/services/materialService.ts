import apiClient from '@/lib/apiClient'
import { Material, MaterialCategory } from '@/types'

// ============ Material API ============

// 全局材质缓存
let materialCache: Material[] | null = null;
let materialCachePromise: Promise<Material[]> | null = null;

// 材质图片缓存（避免重复请求）
const materialImageLocalCache: Record<string, string> = {};
let pendingImageRequest: Promise<Record<string, string>> | null = null;
let pendingImageNames: string[] = [];

export const getAllMaterials = async (): Promise<Material[]> => {
  // 如果有缓存，直接返回
  if (materialCache) {
    return materialCache;
  }
  
  // 如果正在加载，等待加载完成
  if (materialCachePromise) {
    return materialCachePromise;
  }
  
  // 发起请求并缓存 Promise
  materialCachePromise = (async () => {
    try {
      const response = await apiClient.get('/materials', { params: { limit: 10000 } })
      const materials = response.data.data || []
      console.log(`[材质服务] 获取到 ${materials.length} 条材质`)
      materialCache = materials;
      return materials
    } catch (error: any) {
      console.error('获取材质列表失败:', error)
      materialCachePromise = null; // 失败时清除 Promise 缓存
      throw new Error(error.response?.data?.message || '获取材质列表失败')
    }
  })();
  
  return materialCachePromise;
}

// 根据材质名称列表批量获取图片
export const getMaterialImagesByNames = async (names: string[]): Promise<Record<string, string>> => {
  if (!names || names.length === 0) return {};
  
  // 先从本地缓存获取已有的
  const result: Record<string, string> = {};
  const uncachedNames: string[] = [];
  
  names.forEach(name => {
    if (materialImageLocalCache[name]) {
      result[name] = materialImageLocalCache[name];
    } else {
      uncachedNames.push(name);
    }
  });
  
  // 如果所有都有缓存，直接返回
  if (uncachedNames.length === 0) {
    return result;
  }
  
  try {
    // 直接调用 API 获取材质图片（更可靠的匹配）
    const batchSize = 50;
    for (let i = 0; i < uncachedNames.length; i += batchSize) {
      const batch = uncachedNames.slice(i, i + batchSize);
      const response = await apiClient.post('/materials/images-by-names', { names: batch });
      const batchResult = response.data.data || {};
      Object.assign(result, batchResult);
      Object.assign(materialImageLocalCache, batchResult);
    }
    
    return result;
  } catch (error: any) {
    console.error('批量获取材质图片失败:', error);
    return result;
  }
}

// 清除材质缓存（在材质管理页面更新后调用）
export const clearMaterialCache = () => {
  materialCache = null;
  materialCachePromise = null;
}

export const getMaterialById = async (id: string): Promise<Material | null> => {
  try {
    const response = await apiClient.get(`/materials/${id}`)
    return response.data.data || null
  } catch (error: any) {
    console.error('获取材质详情失败:', error)
    return null
  }
}

export const createMaterial = async (materialData: Omit<Material, '_id' | 'createdAt' | 'updatedAt'>): Promise<Material> => {
  try {
    const response = await apiClient.post('/materials', materialData)
    return response.data.data
  } catch (error: any) {
    console.error('创建材质失败:', error)
    throw new Error(error.response?.data?.message || '创建材质失败')
  }
}

export const updateMaterial = async (id: string, materialData: Partial<Material> & { originalGroupName?: string }): Promise<Material | null> => {
  try {
    console.log('🔄 [前端] updateMaterial 调用:', { id, materialData })
    const response = await apiClient.put(`/materials/${id}`, materialData)
    console.log('🔄 [前端] updateMaterial 响应:', response.data)
    return response.data.data || null
  } catch (error: any) {
    console.error('更新材质失败:', error)
    throw new Error(error.response?.data?.message || '更新材质失败')
  }
}

export const deleteMaterial = async (id: string): Promise<boolean> => {
  try {
    await apiClient.delete(`/materials/${id}`)
    return true
  } catch (error: any) {
    console.error('删除材质失败:', error)
    throw new Error(error.response?.data?.message || '删除材质失败')
  }
}

export const deleteMaterials = async (ids: string[]): Promise<boolean> => {
  try {
    await apiClient.post('/materials/batch-delete', { ids })
    return true
  } catch (error: any) {
    console.error('批量删除材质失败:', error)
    throw new Error(error.response?.data?.message || '批量删除材质失败')
  }
}

export const reviewMaterial = async (id: string, status: 'approved' | 'rejected', reviewBy: string, reviewNote?: string): Promise<Material | null> => {
  return await updateMaterial(id, {
    status,
    reviewBy,
    reviewAt: new Date().toISOString(),
    reviewNote,
  })
}

export const getMaterialStats = async () => {
  try {
    const response = await apiClient.get('/materials/stats')
    return response.data.data || {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      offline: 0,
    }
  } catch (error: any) {
    console.error('获取材质统计失败:', error)
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      offline: 0,
    }
  }
}

// ============ Material Category API ============

export const getMaterialCategoryTree = async (): Promise<MaterialCategory[]> => {
  try {
    const response = await apiClient.get('/materials/categories/list')
    const flatCategories = response.data.data || []
    
    // 将平面分类数据构建成树结构
    const buildTree = (categories: MaterialCategory[], parentId: string | null = null): MaterialCategory[] => {
      return categories
        .filter(cat => cat.parentId === parentId || (!cat.parentId && parentId === null))
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map(cat => ({
          ...cat,
          children: buildTree(categories, cat._id)
        }))
    }
    
    return buildTree(flatCategories)
  } catch (error: any) {
    console.error('获取材质分类失败:', error)
    return []
  }
}

// 获取所有分类（平面结构，用于选择器等）
export const getAllMaterialCategories = async (): Promise<MaterialCategory[]> => {
  try {
    const response = await apiClient.get('/materials/categories/list')
    return response.data.data || []
  } catch (error: any) {
    console.error('获取材质分类失败:', error)
    return []
  }
}

export const getMaterialCategoryById = async (id: string): Promise<MaterialCategory | null> => {
  try {
    const categories = await getAllMaterialCategories()
    return categories.find(c => c._id === id) || null
  } catch (error) {
    return null
  }
}

export const createMaterialCategory = async (categoryData: Omit<MaterialCategory, '_id' | 'createdAt' | 'updatedAt'>): Promise<MaterialCategory> => {
  try {
    const response = await apiClient.post('/materials/categories', categoryData)
    return response.data.data
  } catch (error: any) {
    console.error('创建材质分类失败:', error)
    throw new Error(error.response?.data?.message || '创建材质分类失败')
  }
}

export const updateMaterialCategory = async (id: string, updates: Partial<MaterialCategory>): Promise<void> => {
  try {
    await apiClient.put(`/materials/categories/${id}`, updates)
  } catch (error: any) {
    console.error('更新材质分类失败:', error)
    throw new Error(error.response?.data?.message || '更新材质分类失败')
  }
}

export const deleteMaterialCategory = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/materials/categories/${id}`)
  } catch (error: any) {
    console.error('删除材质分类失败:', error)
    throw new Error(error.response?.data?.message || '删除材质分类失败')
  }
}

export const addMaterialCategory = async (category: MaterialCategory): Promise<void> => {
  await createMaterialCategory(category)
}
