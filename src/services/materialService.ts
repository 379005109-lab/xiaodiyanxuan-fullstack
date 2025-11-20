import apiClient from '@/lib/apiClient'
import { Material, MaterialCategory } from '@/types'

const MATERIALS_KEY = 'materials'
const CATEGORIES_KEY = 'material_categories'

// 初始化存储
const initStorage = () => {
  const hasKey = localStorage.getItem(MATERIALS_KEY)
  if (!hasKey) {
    localStorage.setItem(MATERIALS_KEY, JSON.stringify([]))
  }
  const hasCatKey = localStorage.getItem(CATEGORIES_KEY)
  if (!hasCatKey) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify([]))
  }
}

// 本地同步获取（用于其他函数）
const getAllMaterialsSync = (): Material[] => {
  initStorage()
  const data = localStorage.getItem(MATERIALS_KEY)
  return data ? JSON.parse(data) : []
}

export const getAllMaterials = (): Material[] => {
  return getAllMaterialsSync()
}

export const getMaterialById = (id: string): Material | null => {
  const materials = getAllMaterialsSync()
  return materials.find((m: Material) => m._id === id) || null
}

export const createMaterial = (materialData: Omit<Material, '_id' | 'createdAt' | 'updatedAt'>): Material => {
  const materials = getAllMaterialsSync()
  const sameCategoryMaterials = materials.filter(m => m.categoryId === materialData.categoryId)
  const newOrder = sameCategoryMaterials.length + 1
  
  const newMaterial: Material = {
    ...materialData,
    order: newOrder,
    _id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  
  materials.push(newMaterial)
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials))
  return newMaterial
}

export const updateMaterial = (id: string, materialData: Partial<Material>): Material | null => {
  const materials = getAllMaterialsSync()
  const index = materials.findIndex((m: Material) => m._id === id)
  
  if (index === -1) return null
  
  materials[index] = {
    ...materials[index],
    ...materialData,
    updatedAt: new Date().toISOString(),
  }
  
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(materials))
  return materials[index]
}

export const deleteMaterial = (id: string): boolean => {
  const materials = getAllMaterialsSync()
  const filtered = materials.filter((m: Material) => m._id !== id)
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(filtered))
  return true
}

export const deleteMaterials = (ids: string[]): boolean => {
  const materials = getAllMaterialsSync()
  const filtered = materials.filter((m: Material) => ids.indexOf(m._id) === -1)
  localStorage.setItem(MATERIALS_KEY, JSON.stringify(filtered))
  return true
}

export const reviewMaterial = (id: string, status: 'approved' | 'rejected', reviewBy: string, reviewNote?: string): Material | null => {
  const material = getMaterialById(id)
  if (material === null) return null
  
  return updateMaterial(id, {
    status,
    reviewBy,
    reviewAt: new Date().toISOString(),
    reviewNote,
  })
}

export const getMaterialStats = () => {
  const materials = getAllMaterialsSync()
  
  return {
    total: materials.length,
    pending: materials.filter((m: Material) => m.status === 'pending').length,
    approved: materials.filter((m: Material) => m.status === 'approved').length,
    rejected: materials.filter((m: Material) => m.status === 'rejected').length,
    offline: materials.filter((m: Material) => m.status === 'offline').length,
  }
}

// 分类相关
export const getMaterialCategoryTree = (): MaterialCategory[] => {
  initStorage()
  const data = localStorage.getItem(CATEGORIES_KEY)
  return data ? JSON.parse(data) : []
}

export const addMaterialCategory = (category: MaterialCategory): void => {
  const categories = getMaterialCategoryTree()
  categories.push(category)
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
}

export const createMaterialCategory = (categoryData: Omit<MaterialCategory, '_id' | 'createdAt' | 'updatedAt'>): MaterialCategory => {
  const categories = getMaterialCategoryTree()
  const newCategory: MaterialCategory = {
    ...categoryData,
    _id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as MaterialCategory
  categories.push(newCategory)
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  return newCategory
}

export const updateMaterialCategory = (id: string, updates: Partial<MaterialCategory>): void => {
  const categories = getMaterialCategoryTree()
  const index = categories.findIndex(c => c._id === id)
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updates }
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
  }
}

export const deleteMaterialCategory = (id: string): void => {
  const categories = getMaterialCategoryTree()
  const filtered = categories.filter(c => c._id !== id)
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered))
}

export const getAllMaterialCategories = (): MaterialCategory[] => {
  return getMaterialCategoryTree()
}

export const getMaterialCategoryById = (id: string): MaterialCategory | null => {
  const categories = getMaterialCategoryTree()
  return categories.find(c => c._id === id) || null
}
