import { useState } from 'react'
import { LayoutGrid, Plus, Trash2, Link, Image } from 'lucide-react'
import { ImageCubeConfig, ImageCubeImage, ComponentStyle } from '@/services/storeDecorationService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'
import EditorTabs from './EditorTabs'
import StyleEditor from './StyleEditor'

interface ImageCubeEditorProps {
  config: ImageCubeConfig
  onChange: (config: ImageCubeConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

export default function ImageCubeEditor({ config, onChange, style, onStyleChange }: ImageCubeEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const columnOptions = [1, 2, 3, 4] as const

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIndex(index)
    try {
      const res = await uploadFile(file)
      const url = res.data?.fileId || res.data?.url || res.fileId || res.url || ''
      const next = [...config.images]
      next[index] = { ...next[index], url }
      onChange({ ...config, images: next })
      toast.success('图片上传成功')
    } catch (err) {
      toast.error('图片上传失败')
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleAdd = () => {
    if (config.images.length >= 4) return
    onChange({ ...config, images: [...config.images, { url: '', link: '' }] })
  }

  const handleRemove = (index: number) => {
    const next = [...config.images]
    next.splice(index, 1)
    onChange({ ...config, images: next })
  }

  const handleLinkChange = (index: number, link: string) => {
    const next = [...config.images]
    next[index] = { ...next[index], link }
    onChange({ ...config, images: next })
  }

  return (
    <EditorTabs
      title="图片魔方"
      icon={<LayoutGrid className="h-4 w-4" />}
      contentPanel={
        <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">列数</label>
        <div className="flex gap-2">
          {columnOptions.map(col => (
            <button
              key={col}
              onClick={() => onChange({ ...config, columns: col })}
              className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                config.columns === col
                  ? 'border-primary bg-primary-50 text-primary font-medium'
                  : 'border-stone-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {col}列
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {config.images.map((img, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className="w-16 h-16 rounded-lg border border-stone-200 bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
              {img.url ? (
                <img src={getFileUrl(img.url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-300 hover:text-gray-400">
                  <Image className="h-4 w-4 mb-0.5" />
                  <span className="text-[9px]">
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
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Link className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={img.link}
                  onChange={e => handleLinkChange(index, e.target.value)}
                  placeholder="跳转链接（选填）"
                  className="w-full px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
              {img.url && (
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
            <button
              onClick={() => handleRemove(index)}
              className="p-1.5 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {config.images.length < 4 && (
        <button
          onClick={handleAdd}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="h-4 w-4" />
          添加图片 ({config.images.length}/4)
        </button>
      )}
    </div>
      }
      stylePanel={<StyleEditor style={style} onChange={onStyleChange} />}
    />
  )
}
