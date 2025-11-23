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

  const [parentCategories, setParentCategories] = useState<MaterialCategory[]>([])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCats = await getAllMaterialCategories()
        const topLevelCats = Array.isArray(allCats) ? allCats.filter(cat => !cat.parentId) : []
        setParentCategories(topLevelCats)
      } catch (error) {
        console.error('加载分类失败:', error)
        setParentCategories([])
      }
    }
    loadCategories()
  }, [])

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
              父分类
            </label>
            <select
              value={formData.parentId || ''}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value || null })}
              className="input w-full"
            >
              <option value="">无（顶级分类）</option>
              {parentCategories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
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

