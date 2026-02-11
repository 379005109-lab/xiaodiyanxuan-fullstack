import { Upload, User, Type } from 'lucide-react'
import { StoreHeaderConfig } from '@/services/storeDecorationService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'
import { useState } from 'react'

interface StoreHeaderEditorProps {
  config: StoreHeaderConfig
  onChange: (config: StoreHeaderConfig) => void
}

export default function StoreHeaderEditor({ config: value, onChange }: StoreHeaderEditorProps) {
  const [uploading, setUploading] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadFile(file)
      const url = res.data?.fileId || res.data?.url || res.fileId || res.url || ''
      onChange({ ...value, logo: url })
      toast.success('Logo 上传成功')
    } catch (err) {
      toast.error('Logo 上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
        <User className="h-4 w-4" />
        店铺头部
      </h3>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium mb-1">店铺 Logo</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg border border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center">
            {value.logo ? (
              <img src={getFileUrl(value.logo)} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Upload className="h-5 w-5 text-gray-300" />
            )}
          </div>
          <label className="cursor-pointer">
            <span className="text-sm text-primary hover:underline">
              {uploading ? '上传中...' : '上传图片'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          </label>
          {value.logo && (
            <button
              onClick={() => onChange({ ...value, logo: '' })}
              className="text-sm text-red-500 hover:underline"
            >
              删除
            </button>
          )}
        </div>
      </div>

      {/* 名称 */}
      <div>
        <label className="block text-sm font-medium mb-1">店铺名称</label>
        <input
          type="text"
          value={value.name}
          onChange={e => onChange({ ...value, name: e.target.value })}
          placeholder="请输入店铺名称"
          className="input"
          maxLength={30}
        />
      </div>

      {/* 简介 */}
      <div>
        <label className="block text-sm font-medium mb-1">店铺简介</label>
        <textarea
          value={value.description}
          onChange={e => onChange({ ...value, description: e.target.value })}
          placeholder="请输入店铺简介"
          className="input min-h-[80px] resize-none"
          maxLength={100}
        />
        <div className="text-xs text-gray-400 mt-1 text-right">{value.description.length}/100</div>
      </div>
    </div>
  )
}
