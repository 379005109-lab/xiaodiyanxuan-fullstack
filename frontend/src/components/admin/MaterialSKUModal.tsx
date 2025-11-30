import { useState } from 'react'
import { X, Upload, Crop } from 'lucide-react'
import { toast } from 'sonner'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import { Material } from '@/types'
import { createMaterial } from '@/services/materialService'
import ImageCropper from './ImageCropper'

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
  
  // 图片裁剪状态
  const [showCropper, setShowCropper] = useState(false)
  const [cropperFile, setCropperFile] = useState<File | null>(null)

  // 选择图片后打开裁剪器
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setShowCropper(true)
    e.target.value = ''
  }

  // 裁剪完成后上传
  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false)
    setCropperFile(null)

    try {
      toast.info('正在上传到GridFS...')
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
      const result = await uploadFile(file)
      
      if (result.success) {
        setFormData({ ...formData, image: result.data.fileId })
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
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    e.target.value = ''
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
                <div className="relative w-32 h-32 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={getFileUrl(formData.image)}
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
              
              {/* 上传选项 */}
              <div className="flex-1 flex flex-col gap-3">
                <label className="flex flex-col items-center justify-center h-16 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <Crop className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-600">使用取景器上传</span>
                  </div>
                  <span className="text-xs text-gray-400 mt-1">支持裁剪和旋转</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center justify-center h-12 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-500">直接上传</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDirectUpload}
                    className="hidden"
                  />
                </label>
              </div>
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
