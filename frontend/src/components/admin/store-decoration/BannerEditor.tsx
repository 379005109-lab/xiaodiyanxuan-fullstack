import { useState } from 'react'
import { Plus, GripVertical, Trash2, Image, Link, ToggleLeft, ToggleRight } from 'lucide-react'
import { BannerConfig, BannerItem } from '@/services/storeDecorationService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'

interface BannerEditorProps {
  config: BannerConfig
  onChange: (config: BannerConfig) => void
}

export default function BannerEditor({ config, onChange }: BannerEditorProps) {
  const value = config.items
  const onItemsChange = (items: BannerItem[]) => onChange({ ...config, items })
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const handleAdd = () => {
    onItemsChange([
      ...value,
      { image: '', link: '', sort: value.length, status: true }
    ])
  }

  const handleRemove = (index: number) => {
    const next = [...value]
    next.splice(index, 1)
    onItemsChange(next)
  }

  const handleChange = (index: number, field: keyof BannerItem, val: any) => {
    const next = [...value]
    next[index] = { ...next[index], [field]: val }
    onItemsChange(next)
  }

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIndex(index)
    try {
      const res = await uploadFile(file)
      const url = res.data?.fileId || res.data?.url || res.fileId || res.url || ''
      handleChange(index, 'image', url)
      toast.success('图片上传成功')
    } catch (err) {
      toast.error('图片上传失败')
    } finally {
      setUploadingIndex(null)
    }
  }

  // 拖拽排序
  const handleDragStart = (index: number) => {
    setDragIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (dragIndex === null || dragIndex === index) return
    const next = [...value]
    const [removed] = next.splice(dragIndex, 1)
    next.splice(index, 0, removed)
    onItemsChange(next)
    setDragIndex(index)
  }

  const handleDragEnd = () => {
    setDragIndex(null)
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
        <Image className="h-4 w-4" />
        轮播横幅
        <span className="text-xs text-gray-400 font-normal ml-1">({value.length} 张)</span>
      </h3>

      {value.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          暂无横幅，点击下方按钮添加
        </div>
      )}

      <div className="space-y-3">
        {value.map((item, index) => (
          <div
            key={index}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200 transition-all ${
              dragIndex === index ? 'opacity-50 scale-[0.98]' : ''
            }`}
          >
            {/* 拖拽手柄 */}
            <div className="cursor-move pt-4 text-gray-300 hover:text-gray-500">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* 图片 */}
            <div className="w-20 h-20 rounded-lg border border-stone-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
              {item.image ? (
                <img src={getFileUrl(item.image)} alt="" className="w-full h-full object-cover" />
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-300 hover:text-gray-400">
                  <Image className="h-5 w-5 mb-1" />
                  <span className="text-[10px]">
                    {uploadingIndex === index ? '上传中' : '上传'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(index, e)}
                    disabled={uploadingIndex === index}
                  />
                </label>
              )}
            </div>

            {/* 编辑区 */}
            <div className="flex-1 space-y-2">
              {/* 链接 */}
              <div className="flex items-center gap-2">
                <Link className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={item.link}
                  onChange={e => handleChange(index, 'link', e.target.value)}
                  placeholder="跳转链接（选填）"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              {/* 状态 + 替换图片 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleChange(index, 'status', !item.status)}
                  className="flex items-center gap-1 text-xs"
                >
                  {item.status ? (
                    <ToggleRight className="h-4 w-4 text-primary" />
                  ) : (
                    <ToggleLeft className="h-4 w-4 text-gray-300" />
                  )}
                  <span className={item.status ? 'text-primary' : 'text-gray-400'}>
                    {item.status ? '显示' : '隐藏'}
                  </span>
                </button>

                {item.image && (
                  <label className="cursor-pointer text-xs text-primary hover:underline">
                    替换图片
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageUpload(index, e)}
                      disabled={uploadingIndex === index}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* 删除 */}
            <button
              onClick={() => handleRemove(index)}
              className="p-1.5 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {value.length < 10 && (
        <button
          onClick={handleAdd}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="h-4 w-4" />
          添加横幅
        </button>
      )}
    </div>
  )
}
