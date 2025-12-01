import { useState, useEffect } from 'react'
import { X, Upload, Plus, Trash2, Crop } from 'lucide-react'
import { toast } from 'sonner'
import { Material, MaterialCategory, MaterialType } from '@/types'
import { createMaterial, updateMaterial, getAllMaterials, deleteMaterial } from '@/services/materialService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import ImageCropper from './ImageCropper'

interface MaterialFormModalProps {
  material: Material | null
  categories: MaterialCategory[]
  onClose: () => void
  onCategoryCreate?: () => void
  defaultCategoryId?: string // 新增：默认分类ID
}

export default function MaterialFormModal({ material, categories, onClose, onCategoryCreate, defaultCategoryId }: MaterialFormModalProps) {
  const isEdit = !!material

  const [formData, setFormData] = useState({
    name: material?.name || '',
    type: 'texture' as MaterialType, // 固定为材质类型
    image: material?.image || '',
    categoryId: material?.categoryId || defaultCategoryId || '', // 优先使用material的categoryId，否则使用defaultCategoryId
    tags: material?.tags || [],
    properties: material?.properties || {
      材质: '',
      工艺: ''
    },
    description: material?.description || '',  // 材质介绍
    status: material?.status || 'pending' as const,
    isCategory: material?.isCategory || false, // 是否为类别
  })

  const [tagInput, setTagInput] = useState('')
  const [skuList, setSkuList] = useState<Material[]>([])
  const [showSKUForm, setShowSKUForm] = useState(false)
  const [skuFormData, setSkuFormData] = useState({
    skuName: '',
    image: '',
  })
  
  // 图片裁剪状态
  const [showCropper, setShowCropper] = useState(false)
  const [cropperFile, setCropperFile] = useState<File | null>(null)
  const [cropperTarget, setCropperTarget] = useState<'main' | 'sku'>('main')

  // 加载SKU列表
  useEffect(() => {
    const loadSkus = async () => {
      if (material) {
        const allMaterials = await getAllMaterials()
        // 获取同类别的所有材质（SKU）
        const materialPrefix = material.name.split('-')[0]
        const relatedSkus = allMaterials.filter(m => 
          m.categoryId === material.categoryId && 
          m.name.startsWith(materialPrefix + '-')
        )
        setSkuList(relatedSkus)
      }
    }
    loadSkus()
  }, [material])

  // 重新加载SKU列表（当添加或删除SKU后）
  const reloadSkuList = async () => {
    if (material) {
      const allMaterials = await getAllMaterials()
      const materialPrefix = material.name.split('-')[0]
      const relatedSkus = allMaterials.filter(m => 
        m.categoryId === material.categoryId && 
        m.name.startsWith(materialPrefix + '-')
      )
      setSkuList(relatedSkus)
    }
  }

  // 选择图片后打开裁剪器
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'sku' = 'main') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过10MB')
      return
    }

    // 打开裁剪器
    setCropperFile(file)
    setCropperTarget(target)
    setShowCropper(true)
    
    // 清空 input 以便可以重复选择同一文件
    e.target.value = ''
  }

  // 裁剪完成后上传
  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false)
    setCropperFile(null)

    try {
      toast.info('正在上传到GridFS...')
      
      // 将 Blob 转换为 File
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
      const result = await uploadFile(file)
      
      if (result.success) {
        if (cropperTarget === 'main') {
          setFormData({ ...formData, image: result.data.fileId })
        } else {
          setSkuFormData({ ...skuFormData, image: result.data.fileId })
        }
        toast.success('图片上传成功')
      } else {
        toast.error('图片上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      toast.error('图片上传失败，请重试')
    }
  }

  // 直接上传（不裁剪）
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'sku' = 'main') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }

    try {
      toast.info('正在上传到GridFS...')
      const result = await uploadFile(file)
      if (result.success) {
        if (target === 'main') {
          setFormData({ ...formData, image: result.data.fileId })
        } else {
          setSkuFormData({ ...skuFormData, image: result.data.fileId })
        }
        toast.success('图片上传成功')
      } else {
        toast.error('图片上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      toast.error('图片上传失败，请重试')
    }
    
    e.target.value = ''
  }

  const handleAddTag = () => {
    if (!tagInput.trim()) return
    if (formData.tags.includes(tagInput.trim())) {
      toast.error('标签已存在')
      return
    }
    setFormData({
      ...formData,
      tags: [...formData.tags, tagInput.trim()]
    })
    setTagInput('')
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag)
    })
  }

  const handlePropertyChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      properties: {
        ...formData.properties,
        [key]: value
      }
    })
  }

  const handleAddProperty = () => {
    const newKey = prompt('请输入属性名称')
    if (!newKey) return
    if (formData.properties[newKey]) {
      toast.error('属性已存在')
      return
    }
    setFormData({
      ...formData,
      properties: {
        ...formData.properties,
        [newKey]: ''
      }
    })
  }

  const handleAddSKU = async () => {
    if (!skuFormData.skuName.trim()) {
      toast.error('请输入SKU名称')
      return
    }

    if (!skuFormData.image) {
      toast.error('请上传SKU图片')
      return
    }

    if (!material) {
      toast.error('请先保存材质')
      return
    }

    try {
      const newSKUName = `${material.name.split('-')[0]}-${skuFormData.skuName}`
      
      const newSKU = await createMaterial({
        name: newSKUName,
        type: 'texture',
        image: skuFormData.image,
        categoryId: material.categoryId,
        categoryName: material.categoryName,
        tags: material.tags || [],
        properties: material.properties || {},
        description: material.description,
        status: 'approved',
        uploadBy: '管理员',
      })

      // 重新加载SKU列表以确保显示最新数据
      reloadSkuList()
      setSkuFormData({ skuName: '', image: '' })
      setShowSKUForm(false)
      toast.success('SKU已添加')
    } catch (error: any) {
      toast.error(error.message || '添加失败')
    }
  }

  const handleDeleteSKU = async (skuId: string) => {
    // 从数据库中删除
    try {
      await deleteMaterial(skuId)
      // 重新加载SKU列表以确保显示最新数据
      await reloadSkuList()
      toast.success('SKU已删除')
    } catch (error) {
      toast.error('删除失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('请输入素材名称')
      return
    }

    if (!formData.image) {
      toast.error('请上传素材图片')
      return
    }

    if (!formData.categoryId) {
      toast.error('请选择分类')
      return
    }

    const category = categories.find(c => c._id === formData.categoryId)
    // 检查分类是否改变
    const categoryChanged = material && material.categoryId !== formData.categoryId

    try {
      if (isEdit && material) {
        const updateData = {
          ...formData,
          categoryName: category?.name,
          // 如果是分类编辑模式，传递原始分组名
          originalGroupName: (material as any).originalGroupName,
        }
        console.log('🔄 [MaterialFormModal] 保存数据:', {
          materialId: material._id,
          materialName: material.name,
          originalGroupName: (material as any).originalGroupName,
          updateData,
        })
        await updateMaterial(material._id, updateData)
        
        // 如果分类改变了，批量更新同组的所有SKU
        if (categoryChanged && skuList.length > 0) {
          for (const sku of skuList) {
            await updateMaterial(sku._id, {
              categoryId: formData.categoryId,
              categoryName: category?.name,
            })
          }
          toast.success(`已将${skuList.length + 1}个材质移动到新分类`)
        } else {
          // 保存SKU的排序
          for (const [index, sku] of skuList.entries()) {
            await updateMaterial(sku._id, {
              order: index + 1,
            })
          }
          toast.success('素材已更新')
        }
      } else {
        await createMaterial({
          ...formData,
          categoryName: category?.name,
          uploadBy: '管理员',
        })
        toast.success('素材已创建')
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">
            {isEdit ? '编辑素材' : '新建素材'}
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
          {/* 素材图片 - 移到最上方 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              素材图片 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-start gap-4">
              {formData.image && (
                <div className="relative w-40 h-40 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={getFileUrl(formData.image)}
                    alt="素材图片"
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
              
              <div className="flex-1 flex flex-col gap-2">
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <Crop className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">使用取景器上传</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">可裁剪、旋转图片</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, 'main')}
                    className="hidden"
                  />
                </label>
                <label className="flex flex-col items-center justify-center h-14 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600">直接上传（不裁剪）</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleDirectUpload(e, 'main')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 素材名称 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              素材名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="例如：头层牛皮-黑色、高密海绵"
              className="input w-full"
              required
            />
          </div>

          {/* 分类 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                分类 <span className="text-red-500">*</span>
              </label>
              {onCategoryCreate && (
                <button
                  type="button"
                  onClick={onCategoryCreate}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  新增分类
                </button>
              )}
            </div>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">请选择分类</option>
              {(() => {
                // 递归渲染分类选项
                const renderCategoryOptions = (cats: MaterialCategory[], level: number = 0): JSX.Element[] => {
                  const options: JSX.Element[] = []
                  cats.forEach(category => {
                    options.push(
                      <option key={category._id} value={category._id}>
                        {'　'.repeat(level)}{level > 0 ? '└ ' : ''}{category.name}
                      </option>
                    )
                    if (category.children && category.children.length > 0) {
                      options.push(...renderCategoryOptions(category.children, level + 1))
                    }
                  })
                  return options
                }
                return renderCategoryOptions(categories)
              })()}
            </select>
          </div>

          {/* 材质介绍 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              材质介绍
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入材质介绍..."
              rows={4}
              className="input w-full resize-none"
            />
          </div>


          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium mb-2">标签</label>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="输入标签后按回车或点击添加"
                className="input flex-1"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="btn-secondary px-4 py-2 whitespace-nowrap"
              >
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2 min-h-[3rem] bg-gray-50 p-3 rounded-lg border border-gray-200">
              {formData.tags.length === 0 ? (
                <div className="text-sm text-gray-500 w-full">暂无标签</div>
              ) : (
                formData.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-full text-sm shadow-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 text-gray-500 hover:text-red-600"
                      title="删除标签"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* 材质SKU列表 */}
          {material && (
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold">材质SKU列表 ({skuList.length})</label>
                <button
                  type="button"
                  onClick={() => setShowSKUForm(!showSKUForm)}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  添加SKU
                </button>
              </div>

              {/* SKU表单 */}
              {showSKUForm && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">SKU图片 *</label>
                    <div className="flex items-start gap-4">
                      {skuFormData.image && (
                        <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={getFileUrl(skuFormData.image)}
                            alt="SKU图片"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setSkuFormData({ ...skuFormData, image: '' })}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex-1 flex flex-col gap-2">
                        <label className="flex flex-col items-center justify-center h-14 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                          <div className="flex items-center gap-1">
                            <Crop className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-600">使用取景器</span>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageSelect(e, 'sku')}
                            className="hidden"
                          />
                        </label>
                        <label className="flex items-center justify-center h-8 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <span className="text-xs text-gray-500">直接上传</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleDirectUpload(e, 'sku')}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">SKU名称 *</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600 px-3 py-2 bg-white rounded-lg border border-gray-200">
                        {material.name.split('-')[0]}-
                      </span>
                      <input
                        type="text"
                        value={skuFormData.skuName}
                        onChange={(e) => setSkuFormData({ ...skuFormData, skuName: e.target.value })}
                        placeholder="例如：黑色、棕色"
                        className="input flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddSKU}
                      className="btn-primary px-4 py-2 text-sm"
                    >
                      确认添加
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSKUForm(false)
                        setSkuFormData({ skuName: '', image: '' })
                      }}
                      className="btn-secondary px-4 py-2 text-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* SKU列表 */}
              <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
                {skuList.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    暂无SKU，点击"添加SKU"按钮添加
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {skuList.map((sku, index) => (
                      <div 
                        key={sku._id} 
                        className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors cursor-move"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', index.toString())
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.dataTransfer.dropEffect = 'move'
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'))
                          if (draggedIndex !== index) {
                            const newList = [...skuList]
                            const [draggedItem] = newList.splice(draggedIndex, 1)
                            newList.splice(index, 0, draggedItem)
                            setSkuList(newList)
                            
                            // 立即保存新的排序到数据库
                            try {
                              newList.forEach((sku, idx) => {
                                updateMaterial(sku._id, { order: idx + 1 })
                              })
                              toast.success('排序已保存')
                            } catch (error) {
                              toast.error('保存排序失败')
                            }
                          }
                        }}
                      >
                        <div className="relative w-full aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden mb-2">
                          <img
                            src={getFileUrl(sku.image)}
                            alt={sku.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteSKU(sku._id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            title="删除SKU"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-600 text-center line-clamp-2 w-full">
                          {sku.name.split('-')[1] || sku.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2.5"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2.5"
            >
              {isEdit ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>

      {/* 图片取景器 */}
      {showCropper && cropperFile && (
        <ImageCropper
          imageFile={cropperFile}
          onCrop={handleCropComplete}
          onCancel={() => {
            setShowCropper(false)
            setCropperFile(null)
          }}
        />
      )}
    </div>
  )
}

