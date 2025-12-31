import { useMemo, useState, useEffect } from 'react'
import { X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import { Category } from '@/types'
import { createCategory, updateCategory, getAllCategories } from '@/services/categoryService'
import { getAllManufacturers } from '@/services/manufacturerService'

interface CategoryFormModalProps {
  category: Category | null
  onClose: () => void
}

export default function CategoryFormModal({ category, onClose }: CategoryFormModalProps) {
  const isEdit = !!category && category._id

  const [formData, setFormData] = useState({
    name: category?.name || '',
    image: category?.image || '',
    manufacturerId: (typeof (category as any)?.manufacturerId === 'string'
      ? ((category as any).manufacturerId as string)
      : ((category as any)?.manufacturerId?._id as string) || '') as string,
    parentId: category?.parentId || null,
    level: category?.level || 1,
    status: category?.status || 'active' as 'active' | 'inactive',
    productCount: category?.productCount || 0,
    hasDiscount: category?.hasDiscount || false,
    discounts: category?.discounts || [
      { role: 'designer' as const, roleName: '设计师', discount: 100 },
      { role: 'distributor' as const, roleName: '经销商', discount: 100 },
      { role: 'customer' as const, roleName: '普通客户', discount: 100 },
    ],
  })

  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [parentCategories, setParentCategories] = useState<Category[]>([])
  const [manufacturers, setManufacturers] = useState<any[]>([])

  const flatCategories = useMemo(() => {
    const out: any[] = []
    const walk = (nodes: any[]) => {
      nodes.forEach((n) => {
        if (!n) return
        out.push(n)
        const children = (n as any).children
        if (Array.isArray(children) && children.length > 0) {
          walk(children)
        }
      })
    }
    walk(allCategories as any)
    return out as Category[]
  }, [allCategories])

  const flattenExternalCategories = (nodes: any[]): Category[] => {
    const out: any[] = []
    const walk = (list: any[]) => {
      list.forEach((n) => {
        if (!n) return
        out.push(n)
        const children = n.children
        if (Array.isArray(children) && children.length > 0) {
          walk(children)
        }
      })
    }
    walk(nodes)
    return out
  }

  useEffect(() => {
    const loadParentCategories = async () => {
      const allCats = await getAllCategories();
      setAllCategories(allCats)
    };
    loadParentCategories();
  }, []);

  const selectedManufacturerId = useMemo(() => {
    return (formData.manufacturerId || '').trim()
  }, [formData.manufacturerId])

  const selectedParentCategory = useMemo(() => {
    if (!formData.parentId) return null
    return flatCategories.find(c => String(c._id) === String(formData.parentId)) || null
  }, [flatCategories, formData.parentId])

  const selectedParentManufacturerId = useMemo(() => {
    const mid: any = (selectedParentCategory as any)?.manufacturerId
    if (!mid) return ''
    if (typeof mid === 'string') return String(mid)
    return String(mid?._id || '')
  }, [selectedParentCategory])

  useEffect(() => {
    if (!formData.parentId) return
    const next = String(selectedParentManufacturerId || '')
    const cur = String(formData.manufacturerId || '')
    if (next !== cur) {
      setFormData(prev => ({ ...prev, manufacturerId: next }))
    }
  }, [formData.parentId, selectedParentManufacturerId])

  useEffect(() => {
    const topLevel = allCategories
      .filter(cat => !cat.parentId || cat.parentId === null)
      .filter(cat => {
        const mid: any = (cat as any).manufacturerId
        const midStr = typeof mid === 'string' ? mid : (mid?._id || '')
        return String(midStr || '') === String(selectedManufacturerId || '')
      })
    void topLevel
    const candidates = flatCategories
      .filter(cat => {
        const mid: any = (cat as any).manufacturerId
        const midStr = typeof mid === 'string' ? mid : (mid?._id || '')
        return String(midStr || '') === String(selectedManufacturerId || '')
      })
      .filter(cat => (cat.level || 1) < 3)
      .filter(cat => {
        if (!isEdit || !category?._id) return true
        return String(cat._id) !== String(category._id)
      })
    setParentCategories(candidates)
  }, [allCategories, flatCategories, selectedManufacturerId, isEdit, category?._id])

  useEffect(() => {
    if (!formData.parentId) return
    const exists = parentCategories.some(c => String(c._id) === String(formData.parentId))
    if (!exists) {
      setFormData(prev => ({ ...prev, parentId: null }))
    }
  }, [parentCategories, formData.parentId])

  useEffect(() => {
    const loadManufacturers = async () => {
      try {
        const list = await getAllManufacturers()
        setManufacturers(Array.isArray(list) ? list : [])
      } catch (e) {
        setManufacturers([])
      }
    }
    loadManufacturers()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }

    try {
      toast.info('正在上传到GridFS...')
      const result = await uploadFile(file)
      if (result.success) {
        setFormData({ ...formData, image: result.data.fileId })
        toast.success('图片上传成功')
      }
    } catch (error) {
      toast.error('图片上传失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('请输入分类名称')
      return
    }

    // 生成slug：使用拼音或保留原名，确保不为空
    let slug = formData.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5-]/g, '') // 保留字母、数字、中文、连字符
    
    // 如果slug为空（全是特殊字符），使用时间戳
    if (!slug) {
      slug = `category-${Date.now()}`
    }
    
    const allCategories = await getAllCategories();
    const allFlat = flattenExternalCategories(allCategories as any)
    const sameManufacturerCategories = allFlat.filter(cat => {
      const mid: any = (cat as any).manufacturerId
      const midStr = typeof mid === 'string' ? mid : (mid?._id || '')
      return String(midStr || '') === String(selectedManufacturerId || '')
    })

    // 检查slug唯一性
    const existingCategory = sameManufacturerCategories.find(cat => cat.slug === slug);
    if (existingCategory && (!isEdit || existingCategory._id !== category?._id)) {
      toast.error('分类名称已存在，请使用其他名称');
      return;
    }

    const computedLevel = (() => {
      if (!formData.parentId) return 1
      const parent = flatCategories.find(c => String(c._id) === String(formData.parentId))
      return (parent?.level || 1) + 1
    })()
    
    // 获取同级分类的最大order值
    const sameLevelCategories = sameManufacturerCategories.filter(
      cat => cat.parentId === formData.parentId
    )
    const maxOrder = sameLevelCategories.length > 0 
      ? Math.max(...sameLevelCategories.map(cat => cat.order))
      : 0

    try {
      // 只发送Category模型需要的字段
      const categoryData = {
        name: formData.name,
        image: formData.image,
        manufacturerId: formData.manufacturerId || null,
        parentId: formData.parentId,
        level: computedLevel,
        status: formData.status,
        slug,
      }
      
      if (isEdit && category) {
        await updateCategory(category._id, categoryData)
        toast.success('分类已更新')
      } else {
        await createCategory({
          ...categoryData,
          order: maxOrder + 1,
          productCount: 0,
          hasDiscount: false,
          discounts: [],
        } as any)
        toast.success('分类已创建')
      }
      onClose()
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(err.message || '验证失败');
        });
      } else {
        toast.error(error.message || '操作失败');
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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

          {/* 厂家 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              厂家
            </label>
            <select
              value={formData.manufacturerId || ''}
              onChange={(e) => setFormData({ ...formData, manufacturerId: e.target.value, parentId: null })}
              className="input w-full"
              disabled={!!formData.parentId}
            >
              <option value="">平台（未分配厂家）</option>
              {manufacturers.map((m: any) => (
                <option key={m._id} value={m._id}>
                  {m.name || m.fullName || m._id}
                </option>
              ))}
            </select>
          </div>

          {/* 分类图片 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              分类图片
            </label>
            <div className="flex items-start gap-4">
              {/* 图片预览 */}
              {formData.image && (
                <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden">
                  <img
                    src={getFileUrl(formData.image)}
                    alt="分类图片"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: '' })}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              {/* 上传按钮 */}
              <label className="flex-1 flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">点击上传图片</span>
                <span className="text-xs text-gray-400 mt-1">支持JPG、PNG，不超过5MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
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

          {/* 状态 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              状态
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="active"
                  checked={formData.status === 'active'}
                  onChange={(e) => setFormData({ ...formData, status: 'active' })}
                  className="mr-2"
                />
                启用
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="inactive"
                  checked={formData.status === 'inactive'}
                  onChange={(e) => setFormData({ ...formData, status: 'inactive' })}
                  className="mr-2"
                />
                禁用
              </label>
            </div>
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

