import { useState } from 'react'
import { X, Download, CheckSquare, Square, Check } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/authStore'

interface ImageGalleryModalProps {
  images: string[]
  onClose: () => void
}

export default function ImageGalleryModal({ images, onClose }: ImageGalleryModalProps) {
  const [selectedImages, setSelectedImages] = useState<Set<number>>(new Set())
  const { user } = useAuthStore()

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedImages(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set())
    } else {
      setSelectedImages(new Set(images.map((_, idx) => idx)))
    }
  }

  const handleDownload = async () => {
    if (!user) {
      toast.error('请先登录后再下载')
      return
    }

    if (selectedImages.size === 0) {
      toast.error('请选择要下载的图片')
      return
    }

    toast.success(`正在下载 ${selectedImages.size} 张图片...`)

    // 模拟下载
    selectedImages.forEach((index) => {
      const link = document.createElement('a')
      link.href = images[index]
      link.download = `image-${index + 1}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })

    setTimeout(() => {
      toast.success('下载完成')
    }, 1000)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">全部图片 ({images.length})</h2>
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
            >
              {selectedImages.size === images.length ? (
                <>
                  <CheckSquare className="h-4 w-4" />
                  取消全选
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" />
                  全选
                </>
              )}
            </button>
            {selectedImages.size > 0 && (
              <span className="text-sm text-gray-600">
                已选择 {selectedImages.size} 张
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 图片网格 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                  selectedImages.has(index)
                    ? 'border-primary-600 ring-2 ring-primary-200'
                    : 'border-transparent hover:border-gray-300'
                }`}
                onClick={() => toggleSelection(index)}
              >
                <img
                  src={image}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* 选中标识 - 使用打勾图标 */}
                {selectedImages.has(index) && (
                  <div className="absolute inset-0 bg-blue-600 bg-opacity-30 flex items-center justify-center">
                    <div className="bg-blue-600 rounded-full p-1.5">
                      <Check className="h-5 w-5 text-white" />
                    </div>
                  </div>
                )}
                {/* 未选中时的边框提示 */}
                {!selectedImages.has(index) && (
                  <div className="absolute inset-0 border-2 border-transparent hover:border-gray-300 transition-colors" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            {user ? (
              <>点击图片选择，然后批量下载</>
            ) : (
              <span className="text-orange-600">请先登录后下载图片</span>
            )}
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="btn-secondary px-6 py-2"
            >
              关闭
            </button>
            <button
              onClick={handleDownload}
              disabled={selectedImages.size === 0 || !user}
              className="btn-primary px-6 py-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4" />
              下载选中 ({selectedImages.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

