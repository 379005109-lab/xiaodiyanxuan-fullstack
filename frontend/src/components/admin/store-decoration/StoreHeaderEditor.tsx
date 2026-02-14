import { Upload, User } from 'lucide-react'
import { StoreHeaderConfig, ComponentStyle } from '@/services/storeDecorationService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'
import { useState } from 'react'
import EditorTabs from './EditorTabs'
import StyleEditor from './StyleEditor'

interface StoreHeaderEditorProps {
  config: StoreHeaderConfig
  onChange: (config: StoreHeaderConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

export default function StoreHeaderEditor({ config: value, onChange, style, onStyleChange }: StoreHeaderEditorProps) {
  const [uploading, setUploading] = useState(false)

  const set = (patch: Partial<StoreHeaderConfig>) => onChange({ ...value, ...patch })

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await uploadFile(file)
      const url = res.data?.fileId || res.data?.url || res.fileId || res.url || ''
      set({ logo: url })
      toast.success('Logo 上传成功')
    } catch (err) {
      toast.error('Logo 上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <EditorTabs
      title="店铺头部"
      icon={<User className="h-4 w-4" />}
      contentPanel={
        <div className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium mb-1">店铺 Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border border-stone-200 bg-stone-50 overflow-hidden flex items-center justify-center">
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
                  onClick={() => set({ logo: '' })}
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
              onChange={e => set({ name: e.target.value })}
              placeholder="请输入店铺名称"
              className="input"
              maxLength={30}
            />
          </div>

          {/* 简介 */}
          <div>
            <label className="block text-sm font-medium mb-1">店铺简介</label>
            <textarea
              value={value.description || ''}
              onChange={e => set({ description: e.target.value })}
              placeholder="请输入店铺简介"
              className="input min-h-[80px] resize-none"
              maxLength={100}
            />
            <div className="text-xs text-gray-400 mt-1 text-right">{(value.description || '').length}/100</div>
          </div>

          {/* 联系人 */}
          <div>
            <label className="block text-sm font-medium mb-1">联系人</label>
            <input
              type="text"
              value={value.contactName || ''}
              onChange={e => set({ contactName: e.target.value })}
              placeholder="请输入联系人姓名"
              className="input"
              maxLength={20}
            />
          </div>

          {/* 联系电话 */}
          <div>
            <label className="block text-sm font-medium mb-1">联系电话</label>
            <input
              type="text"
              value={value.phone || ''}
              onChange={e => set({ phone: e.target.value })}
              placeholder="请输入联系电话"
              className="input"
              maxLength={20}
            />
          </div>

          {/* 店铺地址 */}
          <div>
            <label className="block text-sm font-medium mb-1">店铺地址</label>
            <input
              type="text"
              value={value.address || ''}
              onChange={e => set({ address: e.target.value })}
              placeholder="请输入店铺地址"
              className="input"
              maxLength={100}
            />
          </div>

          {/* 认证状态 */}
          <div>
            <label className="block text-sm font-medium mb-1">认证状态</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => set({ isVerified: !value.isVerified })}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  value.isVerified ? 'bg-primary' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                  value.isVerified ? 'translate-x-4.5' : 'translate-x-0.5'
                }`} />
              </button>
              <span className="text-sm text-gray-500">{value.isVerified ? '已认证' : '未认证'}</span>
            </div>
          </div>
        </div>
      }
      stylePanel={<StyleEditor style={style} onChange={onStyleChange} />}
    />
  )
}
