import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { MaterialCategory } from '@/types'
import { createMaterialCategory, updateMaterialCategory, getAllMaterialCategories } from '@/services/materialService'

interface MaterialCategoryModalProps {
  category: MaterialCategory | null
  onClose: () => void
}

export default function MaterialCategoryModal({ category, onClose }: MaterialCategoryModalProps) {
  const isEdit = !!category && category._id

  const [formData, setFormData] = useState({
    name: category?.name || '',
    parentId: category?.parentId || null,
  })

  const [allCategories, setAllCategories] = useState<MaterialCategory[]>([])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCats = await getAllMaterialCategories()
        // 过滤掉当前正在编辑的分类（避免选择自己作为父分类）
        const filteredCats = Array.isArray(allCats) 
          ? allCats.filter(cat => !category || cat._id !== category._id)
          : []
        setAllCategories(filteredCats)
      } catch (error) {
        console.error('加载分类失败:', error)
        setAllCategories([])
      }
    }
    loadCategories()
  }, [category])

  // 构建分类树结构用于显示层级
  const buildCategoryOptions = (categories: MaterialCategory[], parentId: string | null = null, level: number = 0): { cat: MaterialCategory; level: number }[] => {
    const result: { cat: MaterialCategory; level: number }[] = []
    const children = categories.filter(cat => cat.parentId === parentId)
    children.sort((a, b) => (a.order || 0) - (b.order || 0))
    
    for (const child of children) {
      // 避免选择当前分类或其子分类作为父分类
      if (category && isDescendant(categories, category._id, child._id)) {
        continue
      }
      result.push({ cat: child, level })
      result.push(...buildCategoryOptions(categories, child._id, level + 1))
    }
    return result
  }

  // 检查targetId是否是ancestorId的子孙分类
  const isDescendant = (categories: MaterialCategory[], ancestorId: string, targetId: string): boolean => {
    if (ancestorId === targetId) return true
    const children = categories.filter(cat => cat.parentId === ancestorId)
    return children.some(child => isDescendant(categories, child._id, targetId))
  }

  const categoryOptions = buildCategoryOptions(allCategories)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('请输入分类名称')
      return
    }

    // 获取同级分类的最大order值需要异步处理
    let maxOrder = 0

    try {
      // 获取同级分类的最大order值
      const allCategories = await getAllMaterialCategories()
      const sameLevelCategories = Array.isArray(allCategories) 
        ? allCategories.filter(cat => cat.parentId === formData.parentId)
        : []
      maxOrder = sameLevelCategories.length > 0 
        ? Math.max(...sameLevelCategories.map(cat => cat.order))
        : 0

      if (isEdit && category) {
        await updateMaterialCategory(category._id, formData)
        toast.success('分类已更新')
      } else {
        await createMaterialCategory({
          ...formData,
          order: maxOrder + 1,
        })
        toast.success('分类已创建')
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            {isEdit ? '编辑分类' : '新建分类'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 分类名称 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              分类名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入分类名称"
              className="input w-full"
              required
            />
          </div>

          {/* 父分类 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              父分类 <span className="text-gray-400 text-xs">（支持多级分类）</span>
            </label>
            <select
              value={formData.parentId || ''}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
              className="input w-full"
            >
              <option value="">无（顶级分类）</option>
              {categoryOptions.map(({ cat, level }) => (
                <option key={cat._id} value={cat._id}>
                  {'　'.repeat(level)}{level > 0 ? '└ ' : ''}{cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">选择父分类可创建多级子分类</p>
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2"
            >
              {isEdit ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

