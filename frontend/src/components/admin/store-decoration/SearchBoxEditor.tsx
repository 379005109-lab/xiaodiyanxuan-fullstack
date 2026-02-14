import { Search } from 'lucide-react'
import { SearchBoxConfig, ComponentStyle } from '@/services/storeDecorationService'
import EditorTabs from './EditorTabs'
import StyleEditor from './StyleEditor'

interface SearchBoxEditorProps {
  config: SearchBoxConfig
  onChange: (config: SearchBoxConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

export default function SearchBoxEditor({ config, onChange, style, onStyleChange }: SearchBoxEditorProps) {
  return (
    <EditorTabs
      title="搜索框"
      icon={<Search className="h-4 w-4" />}
      contentPanel={
        <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">占位文字</label>
        <input
          type="text"
          value={config.placeholder}
          onChange={e => onChange({ ...config, placeholder: e.target.value })}
          placeholder="搜索商品"
          className="input"
          maxLength={30}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">圆角 ({config.borderRadius}px)</label>
        <input
          type="range"
          min={0}
          max={30}
          value={config.borderRadius}
          onChange={e => onChange({ ...config, borderRadius: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">背景颜色</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={config.bgColor}
            onChange={e => onChange({ ...config, bgColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer"
          />
          <input
            type="text"
            value={config.bgColor}
            onChange={e => onChange({ ...config, bgColor: e.target.value })}
            className="input flex-1 text-sm"
            maxLength={7}
          />
        </div>
      </div>
    </div>
      }
      stylePanel={<StyleEditor style={style} onChange={onStyleChange} />}
    />
  )
}
