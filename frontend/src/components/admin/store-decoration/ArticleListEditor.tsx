import { FileText, List, LayoutGrid } from 'lucide-react'
import { ArticleListConfig, ComponentStyle } from '@/services/storeDecorationService'
import EditorTabs from './EditorTabs'
import StyleEditor from './StyleEditor'

interface ArticleListEditorProps {
  config: ArticleListConfig
  onChange: (config: ArticleListConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

export default function ArticleListEditor({ config, onChange, style, onStyleChange }: ArticleListEditorProps) {
  return (
    <EditorTabs
      title="文章列表"
      icon={<FileText className="h-4 w-4" />}
      contentPanel={
        <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">显示数量 ({config.count}篇)</label>
        <input
          type="range"
          min={1}
          max={10}
          value={config.count}
          onChange={e => onChange({ ...config, count: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">布局模式</label>
        <div className="flex gap-2">
          {[
            { key: 'list' as const, label: '列表', icon: List },
            { key: 'card' as const, label: '卡片', icon: LayoutGrid },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => onChange({ ...config, displayMode: opt.key })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm transition-colors ${
                config.displayMode === opt.key
                  ? 'border-primary bg-primary-50 text-primary font-medium'
                  : 'border-stone-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <opt.icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
      }
      stylePanel={<StyleEditor style={style} onChange={onStyleChange} />}
    />
  )
}
