import { useState, useRef, useEffect } from 'react'
import { X, Trash2, GripVertical, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { getFileUrl, uploadFile } from '@/services/uploadService'

interface SkuImageManagerModalProps {
  images: string[]
  onClose: () => void
  onSave: (images: string[]) => void
}

export default function SkuImageManagerModal({
  images,
  onClose,
  onSave,
}: SkuImageManagerModalProps) {
  const [imageList, setImageList] = useState<string[]>(images)
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set())
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragRef = useRef<number | null>(null)

  // 切换选中状态
  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndexes)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIndexes(newSelected)
  }

  // 全选
  const selectAll = () => {
    if (selectedIndexes.size === imageList.length) {
      setSelectedIndexes(new Set())
    } else {
      setSelectedIndexes(new Set(imageList.map((_, i) => i)))
    }
  }

  // 删除选中的图片
  const deleteSelected = () => {
    if (selectedIndexes.size === 0) {
      toast.error('请先选择要删除的图片')
      return
    }

    const newImages = imageList.filter((_, i) => !selectedIndexes.has(i))
    setImageList(newImages)
    setSelectedIndexes(new Set())
    toast.success(`已删除 ${selectedIndexes.size} 张图片`)
  }

  // 处理拖拽开始
  const handleDragStart = (index: number) => {
    dragRef.current = index
    setDraggedIndex(index)
  }

  // 处理拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    dragRef.current = null
  }

  // 处理拖拽悬停
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  // 处理拖拽放下
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)

    if (dragRef.current === null || dragRef.current === dropIndex) return

    const newImages = [...imageList]
    const draggedImage = newImages[dragRef.current]
    newImages.splice(dragRef.current, 1)
    newImages.splice(dropIndex, 0, draggedImage)

    setImageList(newImages)
    dragRef.current = dropIndex
    toast.success('图片顺序已更新')
  }

  // 保存并关闭
  const handleSave = () => {
    onSave(imageList)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">图片管理</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIndexes.size === imageList.length && imageList.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                {selectedIndexes.size > 0 ? `已选 ${selectedIndexes.size} 张` : '全选'}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">上传图片</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length === 0) return
                  
                  toast.info(`正在上传 ${files.length} 张图片...`)
                  
                  try {
                    const newImages = [...imageList]
                    for (const file of files) {
                      const result = await uploadFile(file)
                      if (result.success) {
                        newImages.push(result.data.fileId)
                      } else {
                        toast.error(`${file.name} 上传失败`)
                      }
                    }
                    setImageList(newImages)
                    toast.success(`${files.length} 张图片上传成功`)
                  } catch (error) {
                    toast.error('图片上传失败')
                  }
                  
                  e.target.value = ''
                }}
              />
            </label>
            <button
              onClick={deleteSelected}
              disabled={selectedIndexes.size === 0}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">删除</span>
            </button>
          </div>
        </div>

        {/* 图片网格 */}
        <div className="flex-1 overflow-y-auto p-6">
          {imageList.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>暂无图片</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imageList.map((image, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative group cursor-move rounded-lg overflow-hidden border-2 transition-all ${
                    draggedIndex === index
                      ? 'opacity-50 border-blue-400'
                      : dragOverIndex === index
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* 图片 */}
                  <img
                    src={getFileUrl(image)}
                    alt={`SKU ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />

                  {/* 序号和拖拽手柄 */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-medium">
                    <GripVertical className="w-3 h-3" />
                    <span>{index + 1}</span>
                  </div>

                  {/* 选中复选框 */}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedIndexes.has(index)}
                      onChange={() => toggleSelect(index)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* 悬停操作 */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const newImages = imageList.filter((_, i) => i !== index)
                          setImageList(newImages)
                          setSelectedIndexes(new Set())
                          toast.success('已删除图片')
                        }}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="删除此图片"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 选中状态指示 */}
                  {selectedIndexes.has(index) && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            共 {imageList.length} 张图片
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
