import { useState } from 'react'
import { Navigation, Plus, Trash2, Link, Image } from 'lucide-react'
import { MenuNavConfig, MenuNavItem, ComponentStyle } from '@/services/storeDecorationService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'
import EditorTabs from './EditorTabs'
import StyleEditor from './StyleEditor'

interface MenuNavEditorProps {
  config: MenuNavConfig
  onChange: (config: MenuNavConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

export default function MenuNavEditor({ config, onChange, style, onStyleChange }: MenuNavEditorProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const handleImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingIndex(index)
    try {
      const res = await uploadFile(file)
      const url = res.data?.fileId || res.data?.url || res.fileId || res.url || ''
      const next = [...config.items]
      next[index] = { ...next[index], image: url }
      onChange({ ...config, items: next })
      toast.success('图标上传成功')
    } catch {
      toast.error('图标上传失败')
    } finally {
      setUploadingIndex(null)
    }
  }

  const handleAdd = () => {
    if (config.items.length >= 10) return
    onChange({ ...config, items: [...config.items, { image: '', text: `导航${config.items.length + 1}`, link: '' }] })
  }

  const handleRemove = (index: number) => {
    const next = [...config.items]
    next.splice(index, 1)
    onChange({ ...config, items: next })
  }

  const handleItemChange = (index: number, field: keyof MenuNavItem, value: string) => {
    const next = [...config.items]
    next[index] = { ...next[index], [field]: value }
    onChange({ ...config, items: next })
  }

  return (
    <EditorTabs
      title="导航组设置"
      icon={<Navigation className="h-4 w-4" />}
      contentPanel={
        <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">每行列数</label>
        <div className="flex gap-2">
          {([4, 5] as const).map(col => (
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

      <div>
        <label className="block text-sm font-medium mb-1">图标形状</label>
        <div className="flex gap-2">
          {([{ key: 'round' as const, label: '圆形' }, { key: 'square' as const, label: '方形' }]).map(opt => (
            <button
              key={opt.key}
              onClick={() => onChange({ ...config, shape: opt.key })}
              className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                config.shape === opt.key
                  ? 'border-primary bg-primary-50 text-primary font-medium'
                  : 'border-stone-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {config.items.map((item, index) => (
          <div key={index} className="flex items-start gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
            <div className={`w-12 h-12 flex-shrink-0 border border-stone-200 bg-white overflow-hidden flex items-center justify-center ${config.shape === 'round' ? 'rounded-full' : 'rounded-lg'}`}>
              {item.image ? (
                <img src={getFileUrl(item.image)} alt="" className="w-full h-full object-cover" />
              ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-300 hover:text-gray-400">
                  <Image className="h-4 w-4" />
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(index, e)} disabled={uploadingIndex === index} />
                </label>
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <input
                type="text"
                value={item.text}
                onChange={e => handleItemChange(index, 'text', e.target.value)}
                placeholder="导航名称"
                className="w-full px-2 py-1 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
              <div className="flex items-center gap-1.5">
                <Link className="h-3 w-3 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={item.link}
                  onChange={e => handleItemChange(index, 'link', e.target.value)}
                  placeholder="链接（选填）"
                  className="w-full px-2 py-1 text-xs bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                />
              </div>
            </div>
            <button onClick={() => handleRemove(index)} className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {config.items.length < 10 && (
        <button
          onClick={handleAdd}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="h-4 w-4" />
          添加导航 ({config.items.length}/10)
        </button>
      )}
    </div>
      }
      stylePanel={<StyleEditor style={style} onChange={onStyleChange} />}
    />
  )
}
