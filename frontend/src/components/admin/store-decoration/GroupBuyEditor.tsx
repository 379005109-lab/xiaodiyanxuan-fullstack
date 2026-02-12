import { Users } from 'lucide-react'
import { GroupBuyConfig } from '@/services/storeDecorationService'

interface GroupBuyEditorProps {
  config: GroupBuyConfig
  onChange: (config: GroupBuyConfig) => void
}

export default function GroupBuyEditor({ config, onChange }: GroupBuyEditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
        <Users className="h-4 w-4" />
        拼团设置
      </h3>

      <div>
        <label className="block text-sm font-medium mb-1">标题</label>
        <input
          type="text"
          value={config.title}
          onChange={e => onChange({ ...config, title: e.target.value })}
          placeholder="拼团活动"
          className="input"
          maxLength={10}
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

      <div>
        <label className="block text-sm font-medium mb-1">展示样式</label>
        <div className="flex gap-2">
          {[
            { key: 'scroll' as const, label: '横向滑动' },
            { key: 'grid' as const, label: '网格展示' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => onChange({ ...config, displayMode: opt.key })}
              className={`flex-1 py-2 rounded-lg border text-sm transition-colors ${
                config.displayMode === opt.key
                  ? 'border-primary bg-primary-50 text-primary font-medium'
                  : 'border-stone-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
