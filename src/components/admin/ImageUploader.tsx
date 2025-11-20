import { useState, useRef } from 'react'
import { Upload, X, GripVertical, Loader } from 'lucide-react'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'

interface ImageUploaderProps {
  images: string[]
  onChange: (images: string[]) => void
  multiple?: boolean
  maxImages?: number
  label?: string
}

export default function ImageUploader({
  images,
  onChange,
  multiple = false,
  maxImages = 10,
  label = '上传图片'
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    if (!multiple && files.length > 1) {
      files = [files[0]]
    }

    setIsUploading(true)
    try {
      for (const file of files) {
        if (file.type.startsWith('image/')) {
          try {
            const result = await uploadFile(file)
            if (result.success) {
              const fileId = result.data.fileId
              if (multiple) {
                if (images.length < maxImages) {
                  onChange([...images, fileId])
                }
              } else {
                onChange([fileId])
              }
              toast.success(`${file.name} 上传成功`)
            }
          } catch (error) {
            toast.error(`${file.name} 上传失败`)
            console.error('上传失败:', error)
          }
        }
      }
    } finally {
      setIsUploading(false)
      // 重置文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleImageDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleImageDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'))
    
    if (dragIndex === dropIndex) return

    const items = Array.from(images)
    const [draggedItem] = items.splice(dragIndex, 1)
    items.splice(dropIndex, 0, draggedItem)

    onChange(items)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        onClick={!isUploading ? handleClick : undefined}
        onDragOver={!isUploading ? handleDragOver : undefined}
        onDragLeave={!isUploading ? handleDragLeave : undefined}
        onDrop={!isUploading ? handleDrop : undefined}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isUploading
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : isDragging
            ? 'border-primary-500 bg-primary-50 cursor-pointer'
            : 'border-gray-300 hover:border-primary-400 cursor-pointer'
        }`}
      >
        {isUploading ? (
          <Loader className="h-12 w-12 text-primary-500 mx-auto mb-4 animate-spin" />
        ) : (
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        )}
        <p className="text-gray-600 mb-2">{isUploading ? '上传中...' : label}</p>
        <p className="text-gray-400 text-sm">
          {isUploading ? '请等待上传完成' : `点击上传或拖拽文件到此处${multiple ? ` (最多${maxImages}张)` : ''}`}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {/* 图片预览列表 */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {images.map((image, index) => (
            <div
              key={image + index}
              draggable
              onDragStart={(e) => handleImageDragStart(e, index)}
              onDragOver={handleImageDragOver}
              onDrop={(e) => handleImageDrop(e, index)}
              className="relative group cursor-move"
            >
              <div className="w-32 h-32 border-2 border-gray-200 rounded-lg overflow-hidden hover:border-primary-500 transition-colors">
                <img
                  src={getFileUrl(image)}
                  alt={`预览 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* 拖拽手柄 */}
              <div className="absolute top-2 left-2 p-1 bg-white rounded shadow-md cursor-move opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-gray-600" />
              </div>

              {/* 删除按钮 */}
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>

              {/* 主图标识 */}
              {index === 0 && multiple && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-primary-600 text-white text-xs rounded">
                  主图
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {images.length > 0 && multiple && (
        <p className="text-sm text-gray-500">
          💡 提示：长按拖动图片可改变顺序，第一张为主图
        </p>
      )}
    </div>
  )
}

