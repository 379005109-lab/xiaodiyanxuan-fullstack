import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFile } from '@/services/uploadService'
import { Material } from '@/types'
import { createMaterial } from '@/services/materialService'

interface MaterialSKUModalProps {
  material: Material | null
  onClose: () => void
  onSuccess?: () => void
}

export default function MaterialSKUModal({ material, onClose, onSuccess }: MaterialSKUModalProps) {
  const [formData, setFormData] = useState({
    skuName: '',
    image: '',
  })

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.skuName.trim()) {
      toast.error('请输入SKU名称')
      return
    }

    if (!formData.image) {
      toast.error('请上传SKU图片')
      return
    }

    if (!material) {
      toast.error('未选择材质')
      return
    }

    try {
      // 创建新的材质（作为SKU）
      const newSKUName = `${material.name.split('-')[0]}-${formData.skuName}`
      
      createMaterial({
        name: newSKUName,
        type: 'texture',
        image: formData.image,
        categoryId: material.categoryId,
        categoryName: material.categoryName,
        tags: material.tags || [],
        properties: material.properties || {},
        description: material.description,
        status: 'approved',
        uploadBy: '管理员',
      })

      toast.success('SKU已添加')
      onClose()
      onSuccess?.()
    } catch (error: any) {
      toast.error(error.message || '添加失败')
    }
  }

  if (!material) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">
            添加SKU - {material.name}
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
          {/* SKU图片 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              SKU图片 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-start gap-4">
              {formData.image && (
                <div className="relative w-40 h-40 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={formData.image}
                    alt="SKU图片"
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
              
              <label className={`flex-1 flex flex-col items-center justify-center ${formData.image ? 'h-40' : 'h-40'} border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors`}>
                <Upload className="h-10 w-10 text-gray-400 mb-2" />
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

          {/* SKU名称 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              SKU名称 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                {material.name.split('-')[0]}-
              </span>
              <input
                type="text"
                value={formData.skuName}
                onChange={(e) => setFormData({ ...formData, skuName: e.target.value })}
                placeholder="例如：黑色、棕色、红色"
                className="input flex-1"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              完整名称将为：{material.name.split('-')[0]}-{formData.skuName || '...'}
            </p>
          </div>

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
              添加SKU
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
