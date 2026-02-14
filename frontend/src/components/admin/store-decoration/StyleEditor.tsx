import { ComponentStyle } from '@/services/storeDecorationService'

interface StyleEditorProps {
  style: ComponentStyle
  onChange: (style: ComponentStyle) => void
}

function SliderRow({ label, value, min = 0, max = 50, onChange }: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-primary h-1"
      />
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-6 h-6 flex items-center justify-center rounded border border-stone-200 text-gray-400 hover:text-gray-600 text-xs"
        >
          −
        </button>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          className="w-12 h-6 text-center text-xs border border-stone-200 rounded outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-6 h-6 flex items-center justify-center rounded border border-stone-200 text-gray-400 hover:text-gray-600 text-xs"
        >
          +
        </button>
      </div>
    </div>
  )
}

export default function StyleEditor({ style, onChange }: StyleEditorProps) {
  const update = (key: keyof ComponentStyle, value: any) => {
    onChange({ ...style, [key]: value })
  }

  return (
    <div className="space-y-5">
      {/* 颜色设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2">颜色设置</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-16 flex-shrink-0">背景颜色</span>
          <input
            type="color"
            value={style.bgColor || '#ffffff'}
            onChange={e => update('bgColor', e.target.value)}
            className="w-7 h-7 rounded border border-stone-200 cursor-pointer"
          />
          <input
            type="text"
            value={style.bgColor}
            onChange={e => update('bgColor', e.target.value)}
            placeholder="不设置"
            className="flex-1 px-2 py-1 text-xs border border-stone-200 rounded-lg outline-none focus:ring-1 focus:ring-primary"
            maxLength={7}
          />
          {style.bgColor && (
            <button
              onClick={() => update('bgColor', '')}
              className="text-xs text-primary hover:underline whitespace-nowrap"
            >
              重置
            </button>
          )}
        </div>
      </div>

      {/* 边距设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2">边距设置</div>
        <div className="space-y-2.5">
          <SliderRow label="上边距" value={style.marginTop} onChange={v => update('marginTop', v)} />
          <SliderRow label="下边距" value={style.marginBottom} onChange={v => update('marginBottom', v)} />
          <SliderRow label="左右边距" value={style.marginLR} onChange={v => update('marginLR', v)} />
        </div>
      </div>

      {/* 圆角设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-2">圆角设置</div>
        <div className="space-y-2.5">
          <SliderRow label="背景圆角" value={style.borderRadius} max={30} onChange={v => update('borderRadius', v)} />
          <SliderRow label="内容圆角" value={style.innerRadius} max={30} onChange={v => update('innerRadius', v)} />
        </div>
      </div>
    </div>
  )
}
