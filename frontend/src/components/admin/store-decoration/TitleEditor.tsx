import { Type, AlignLeft, AlignCenter, AlignRight, Bold } from 'lucide-react'
import { TitleConfig } from '@/services/storeDecorationService'

interface TitleEditorProps {
  config: TitleConfig
  onChange: (config: TitleConfig) => void
}

export default function TitleEditor({ config, onChange }: TitleEditorProps) {
  const alignOptions: { key: TitleConfig['align']; label: string; icon: any }[] = [
    { key: 'left', label: '居左', icon: AlignLeft },
    { key: 'center', label: '居中', icon: AlignCenter },
    { key: 'right', label: '居右', icon: AlignRight },
  ]

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
        <Type className="h-4 w-4" />
        标题设置
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1">标题文字</label>
        <input
          type="text"
          value={config.text}
          onChange={e => onChange({ ...config, text: e.target.value })}
          placeholder="请输入标题"
          className="input"
          maxLength={30}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">字号 ({config.fontSize}px)</label>
        <input
          type="range"
          min={12}
          max={36}
          value={config.fontSize}
          onChange={e => onChange({ ...config, fontSize: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">对齐方式</label>
        <div className="flex gap-2">
          {alignOptions.map(opt => (
            <button
              key={opt.key}
              onClick={() => onChange({ ...config, align: opt.key })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm transition-colors ${
                config.align === opt.key
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

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">文字颜色</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={config.color}
              onChange={e => onChange({ ...config, color: e.target.value })}
              className="w-8 h-8 rounded border border-stone-200 cursor-pointer"
            />
            <input
              type="text"
              value={config.color}
              onChange={e => onChange({ ...config, color: e.target.value })}
              className="input flex-1 text-sm"
              maxLength={7}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">加粗</label>
          <button
            onClick={() => onChange({ ...config, bold: !config.bold })}
            className={`p-2 rounded-lg border transition-colors ${
              config.bold
                ? 'border-primary bg-primary-50 text-primary'
                : 'border-stone-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <Bold className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
