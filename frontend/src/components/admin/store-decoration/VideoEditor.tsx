import { useState } from 'react'
import { Video, Image } from 'lucide-react'
import { VideoConfig, ComponentStyle } from '@/services/storeDecorationService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'
import EditorTabs from './EditorTabs'
import StyleEditor from './StyleEditor'

interface VideoEditorProps {
  config: VideoConfig
  onChange: (config: VideoConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

export default function VideoEditor({ config, onChange, style, onStyleChange }: VideoEditorProps) {
  const [uploading, setUploading] = useState(false)

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadFile(file)
      const url = res.data?.fileId || res.data?.url || res.fileId || res.url || ''
      onChange({ ...config, cover: url })
      toast.success('封面上传成功')
    } catch {
      toast.error('封面上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <EditorTabs
      title="视频设置"
      icon={<Video className="h-4 w-4" />}
      contentPanel={
        <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">视频链接</label>
        <input
          type="text"
          value={config.url}
          onChange={e => onChange({ ...config, url: e.target.value })}
          placeholder="请输入视频URL"
          className="input"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">封面图</label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg border border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center">
            {config.cover ? (
              <img src={getFileUrl(config.cover)} alt="" className="w-full h-full object-cover" />
            ) : (
              <Image className="h-6 w-6 text-gray-300" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="cursor-pointer">
              <span className="text-sm text-primary hover:underline">{uploading ? '上传中...' : '上传封面'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
            </label>
            {config.cover && (
              <button onClick={() => onChange({ ...config, cover: '' })} className="text-sm text-red-500 hover:underline text-left">删除</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">自动播放</label>
        <button
          onClick={() => onChange({ ...config, autoplay: !config.autoplay })}
          className={`relative w-10 h-5 rounded-full transition-colors ${config.autoplay ? 'bg-primary' : 'bg-gray-300'}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${config.autoplay ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
      }
      stylePanel={<StyleEditor style={style} onChange={onStyleChange} />}
    />
  )
}
