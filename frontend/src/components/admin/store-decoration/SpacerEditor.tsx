import { Minus } from 'lucide-react'
import { SpacerConfig } from '@/services/storeDecorationService'

interface SpacerEditorProps {
  config: SpacerConfig
  onChange: (config: SpacerConfig) => void
}

export default function SpacerEditor({ config, onChange }: SpacerEditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
        <Minus className="h-4 w-4" />
        辅助空白
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1">高度 ({config.height}px)</label>
        <input
          type="range"
          min={10}
          max={200}
          value={config.height}
          onChange={e => onChange({ ...config, height: Number(e.target.value) })}
          className="w-full accent-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">背景颜色</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={config.bgColor === 'transparent' ? '#ffffff' : config.bgColor}
            onChange={e => onChange({ ...config, bgColor: e.target.value })}
            className="w-8 h-8 rounded border border-stone-200 cursor-pointer"
          />
          <input
            type="text"
            value={config.bgColor}
            onChange={e => onChange({ ...config, bgColor: e.target.value })}
            className="input flex-1 text-sm"
          />
          <button
            onClick={() => onChange({ ...config, bgColor: 'transparent' })}
            className="text-xs text-primary hover:underline whitespace-nowrap"
          >
            透明
          </button>
        </div>
      </div>
    </div>
  )
}
