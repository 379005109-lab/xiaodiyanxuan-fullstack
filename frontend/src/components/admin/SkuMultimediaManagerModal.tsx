import { useState, useRef } from 'react'
import { X, Trash2, GripVertical, Upload, Video, Image, Sparkles, Play, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { getFileUrl, uploadFile } from '@/services/uploadService'
import ImageAnnotator from './ImageAnnotator'

interface SkuMultimediaManagerModalProps {
  videos: string[]
  images: string[]
  effectImages: string[]
  onClose: () => void
  onSave: (data: { videos: string[]; images: string[]; effectImages: string[] }) => void
}

type MediaType = 'video' | 'image' | 'effect'

interface MediaItem {
  id: string
  url: string
  type: MediaType
}

export default function SkuMultimediaManagerModal({
  videos,
  images,
  effectImages,
  onClose,
  onSave,
}: SkuMultimediaManagerModalProps) {
  const [videoList, setVideoList] = useState<string[]>(videos || [])
  const [imageList, setImageList] = useState<string[]>(images || [])
  const [effectList, setEffectList] = useState<string[]>(effectImages || [])
  
  const [activeTab, setActiveTab] = useState<MediaType>('video')
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(new Set())
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [isUploading, setIsUploading] = useState(false)
  const [annotatingImage, setAnnotatingImage] = useState<string | null>(null)
  const dragRef = useRef<number | null>(null)

  // Get current list based on active tab
  const getCurrentList = () => {
    switch (activeTab) {
      case 'video': return videoList
      case 'image': return imageList
      case 'effect': return effectList
    }
  }

  const setCurrentList = (newList: string[]) => {
    switch (activeTab) {
      case 'video': setVideoList(newList); break
      case 'image': setImageList(newList); break
      case 'effect': setEffectList(newList); break
    }
  }

  const currentList = getCurrentList()

  // Toggle selection
  const toggleSelect = (index: number) => {
    const newSelected = new Set(selectedIndexes)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedIndexes(newSelected)
  }

  // Select all
  const selectAll = () => {
    if (selectedIndexes.size === currentList.length) {
      setSelectedIndexes(new Set())
    } else {
      setSelectedIndexes(new Set(currentList.map((_, i) => i)))
    }
  }

  // Delete selected
  const deleteSelected = () => {
    if (selectedIndexes.size === 0) {
      toast.error('请先选择要删除的项目')
      return
    }
    const newList = currentList.filter((_, i) => !selectedIndexes.has(i))
    setCurrentList(newList)
    setSelectedIndexes(new Set())
    toast.success(`已删除 ${selectedIndexes.size} 个项目`)
  }

  // Drag handlers
  const handleDragStart = (index: number) => {
    dragRef.current = index
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    dragRef.current = null
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    setDragOverIndex(null)
    if (dragRef.current === null || dragRef.current === dropIndex) return

    const newList = [...currentList]
    const draggedItem = newList[dragRef.current]
    newList.splice(dragRef.current, 1)
    newList.splice(dropIndex, 0, draggedItem)
    setCurrentList(newList)
    dragRef.current = dropIndex
    toast.success('顺序已更新')
  }

  // Handle file upload with progress
  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return
    
    setIsUploading(true)
    setUploadProgress(0)
    
    const isVideo = activeTab === 'video'
    const uploadType = isVideo ? '视频' : activeTab === 'effect' ? '效果图' : '图片'
    
    toast.info(`正在上传 ${files.length} 个${uploadType}...`)
    
    try {
      const newList = [...currentList]
      let completed = 0
      
      for (const file of files) {
        const result = await uploadFile(file, (progress) => {
          // Calculate overall progress
          const overallProgress = Math.round(((completed + progress / 100) / files.length) * 100)
          setUploadProgress(overallProgress)
        })
        
        if (result.success) {
          newList.push(result.data.fileId)
          completed++
          setUploadProgress(Math.round((completed / files.length) * 100))
        } else {
          toast.error(`${file.name} 上传失败`)
        }
      }
      
      setCurrentList(newList)
      toast.success(`${files.length} 个${uploadType}上传成功`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('上传失败')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Save and close
  const handleSave = () => {
    onSave({
      videos: videoList,
      images: imageList,
      effectImages: effectList,
    })
    onClose()
  }

  // Tab configuration
  const tabs = [
    { key: 'video' as MediaType, label: '视频', icon: Video, count: videoList.length, color: 'blue', accept: 'video/*' },
    { key: 'image' as MediaType, label: '图片', icon: Image, count: imageList.length, color: 'green', accept: 'image/*' },
    { key: 'effect' as MediaType, label: '效果图', icon: Sparkles, count: effectList.length, color: 'amber', accept: 'image/*' },
  ]

  const activeTabConfig = tabs.find(t => t.key === activeTab)!

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">多媒体管理</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSelectedIndexes(new Set()) }}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? `border-${tab.color}-500 text-${tab.color}-600`
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.key
                  ? `bg-${tab.color}-100 text-${tab.color}-700`
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIndexes.size === currentList.length && currentList.length > 0}
                onChange={selectAll}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <span className="text-sm text-gray-700">
                {selectedIndexes.size > 0 ? `已选 ${selectedIndexes.size}` : '全选'}
              </span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            {/* Upload button with progress */}
            <label className={`flex items-center gap-2 px-3 py-2 bg-${activeTabConfig.color}-50 text-${activeTabConfig.color}-600 rounded-lg hover:bg-${activeTabConfig.color}-100 cursor-pointer transition-colors relative overflow-hidden`}>
              {isUploading && (
                <div 
                  className={`absolute left-0 top-0 bottom-0 bg-${activeTabConfig.color}-200 transition-all`}
                  style={{ width: `${uploadProgress}%` }}
                />
              )}
              <div className="relative flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {isUploading ? `上传中 ${uploadProgress}%` : `上传${activeTabConfig.label}`}
                </span>
              </div>
              <input
                type="file"
                accept={activeTabConfig.accept}
                multiple
                disabled={isUploading}
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  handleUpload(files)
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

        {/* Media Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <activeTabConfig.icon className="w-12 h-12 mb-4 text-gray-300" />
              <p>暂无{activeTabConfig.label}</p>
              <p className="text-sm mt-2">点击上方按钮上传</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {currentList.map((item, index) => (
                <div
                  key={`${activeTab}-${index}`}
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
                  {/* Media content */}
                  {activeTab === 'video' ? (
                    <div className="relative w-full h-40 bg-black">
                      <video
                        src={getFileUrl(item)}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center">
                          <Play className="w-6 h-6 text-gray-800 ml-1" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={getFileUrl(item)}
                      alt={`${activeTabConfig.label} ${index + 1}`}
                      className="w-full h-40 object-cover"
                    />
                  )}

                  {/* Index badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs font-medium">
                    <GripVertical className="w-3 h-3" />
                    <span>{index + 1}</span>
                  </div>

                  {/* Type badge */}
                  <div className={`absolute bottom-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                    activeTab === 'video' ? 'bg-blue-500 text-white' :
                    activeTab === 'effect' ? 'bg-amber-500 text-white' :
                    'bg-green-500 text-white'
                  }`}>
                    {activeTabConfig.label}
                  </div>

                  {/* Checkbox */}
                  <div className="absolute top-2 right-2">
                    <input
                      type="checkbox"
                      checked={selectedIndexes.has(index)}
                      onChange={() => toggleSelect(index)}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {activeTab !== 'video' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAnnotatingImage(item)
                        }}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        title="标注图片"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        const newList = currentList.filter((_, i) => i !== index)
                        setCurrentList(newList)
                        setSelectedIndexes(new Set())
                        toast.success(`已删除${activeTabConfig.label}`)
                      }}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Selection indicator */}
                  {selectedIndexes.has(index) && (
                    <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600">
            视频 {videoList.length} · 图片 {imageList.length} · 效果图 {effectList.length}
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

      {/* 图片标注编辑器 */}
      {annotatingImage && (
        <ImageAnnotator
          imageUrl={getFileUrl(annotatingImage)}
          initialAnnotations={[]}
          onSave={(newAnnotations) => {
            toast.success('标注功能需要后端支持保存')
            setAnnotatingImage(null)
          }}
          onClose={() => setAnnotatingImage(null)}
        />
      )}
    </div>
  )
}
