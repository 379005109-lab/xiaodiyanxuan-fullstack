import { useState, useEffect } from 'react'
import { X, Upload, Plus, Trash2, Crop } from 'lucide-react'
import { toast } from 'sonner'
import { Material } from '@/types'
import { updateMaterial } from '@/services/materialService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import ImageCropper from './ImageCropper'

interface SKUEditModalProps {
  material: Material
  onClose: () => void
  onSave?: () => void
}

export default function SKUEditModal({ material, onClose, onSave }: SKUEditModalProps) {
  // 从材质名称中提取前缀（类别名）和后缀（SKU名）
  const nameParts = material.name.split('-')
  const namePrefix = nameParts[0] // 固定的类别前缀，如"普通框架"
  const nameSuffix = nameParts.slice(1).join('-') // 可编辑的SKU名，如"国产桉木+普通弹簧"

  const [formData, setFormData] = useState({
    skuName: nameSuffix,
    image: material.image || '',
    tags: material.tags || [],
  })
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
      toast.loading('正在上传图片...')
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
      const result = await uploadFile(file)
      
      if (result.success) {
        setFormData({ ...formData, image: result.data.fileId })
        toast.dismiss()
        toast.success('图片上传成功')
      } else {
        toast.dismiss()
        toast.error('图片上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      toast.dismiss()
      toast.error('图片上传失败，请重试')
    }
  }

  // 直接上传（不裁剪）
  const handleDirectUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      toast.loading('正在上传图片...')
      const result = await uploadFile(file)
      if (result.success) {
        setFormData({ ...formData, image: result.data.fileId })
        toast.dismiss()
        toast.success('图片上传成功')
      } else {
        toast.dismiss()
        toast.error('图片上传失败')
      }
    } catch (error) {
      console.error('图片上传失败:', error)
      toast.dismiss()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.skuName.trim()) {
      toast.error('请输入SKU名称')
      return
    }

    if (!formData.image) {
      toast.error('请上传图片')
      return
    }

    setIsSubmitting(true)

    try {
      // 构建完整名称：前缀-后缀
      const fullName = formData.skuName ? `${namePrefix}-${formData.skuName}` : namePrefix

      await updateMaterial(material._id, {
        name: fullName,
        image: formData.image,
        tags: formData.tags,
      })

      toast.success('保存成功')
      onSave?.()
      onClose()
    } catch (error: any) {
      toast.error(error.message || '保存失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-gray-900">编辑SKU</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 图片上传 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU图片
            </label>
            <div className="flex items-start gap-4">
              {/* 图片预览 */}
              {formData.image && (
                <div className="relative w-24 h-24 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={getFileUrl(formData.image)}
                    alt="SKU图片"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg'
                    }}
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
              <div className="flex-1 flex flex-col gap-2">
                <label className="flex flex-col items-center justify-center h-14 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <div className="flex items-center gap-2">
                    <Crop className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-600">使用取景器上传</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center justify-center h-10 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4 text-gray-400" />
                    <span className="text-xs text-gray-500">直接上传</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU名称
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-200 text-sm font-medium whitespace-nowrap">
                {namePrefix}-
              </span>
              <input
                type="text"
                value={formData.skuName}
                onChange={(e) => setFormData({ ...formData, skuName: e.target.value })}
                placeholder="输入SKU名称"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              完整名称：{namePrefix}-{formData.skuName || '...'}
            </p>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="输入标签后按回车添加"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting ? '保存中...' : '保存'}
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
