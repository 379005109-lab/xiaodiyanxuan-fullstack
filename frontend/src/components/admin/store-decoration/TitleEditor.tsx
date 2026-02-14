import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Link, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react'
import { TitleConfig, ComponentStyle } from '@/services/storeDecorationService'
import EditorTabs from './EditorTabs'

interface TitleEditorProps {
  config: TitleConfig
  onChange: (config: TitleConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

/* ---- 复用的小控件 ---- */
function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
      <input type="color" value={value || '#282828'} onChange={e => onChange(e.target.value)}
        className="w-7 h-7 rounded border border-stone-200 cursor-pointer" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 px-2 py-1 text-xs border border-stone-200 rounded-lg outline-none focus:ring-1 focus:ring-primary" maxLength={7} />
      <button onClick={() => onChange('#282828')} className="text-xs text-primary hover:underline whitespace-nowrap">重置</button>
    </div>
  )
}

function SliderRow({ label, value, min = 0, max = 50, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-primary h-1" />
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(Math.max(min, value - 1))}
          className="w-6 h-6 flex items-center justify-center rounded border border-stone-200 text-gray-400 hover:text-gray-600 text-xs">−</button>
        <input type="number" value={value} min={min} max={max}
          onChange={e => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))}
          className="w-12 h-6 text-center text-xs border border-stone-200 rounded outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={() => onChange(Math.min(max, value + 1))}
          className="w-6 h-6 flex items-center justify-center rounded border border-stone-200 text-gray-400 hover:text-gray-600 text-xs">+</button>
      </div>
    </div>
  )
}

export default function TitleEditor({ config, onChange, style, onStyleChange }: TitleEditorProps) {

  /* ========== 内容面板 ========== */
  const contentPanel = (
    <div className="space-y-4">
      {/* 文本标题 */}
      <div className="text-xs font-semibold text-gray-600 border-t-4 border-stone-100 pt-3">文本标题</div>

      <div>
        <label className="block text-sm font-medium mb-1">标题名称</label>
        <input type="text" value={config.text} onChange={e => onChange({ ...config, text: e.target.value })}
          placeholder="请输入标题，限制10个字以内" className="input" maxLength={10} />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">副标题</label>
        <input type="text" value={config.subtitle || ''} onChange={e => onChange({ ...config, subtitle: e.target.value })}
          placeholder="请输入副标题，限制12个字以内" className="input" maxLength={12} />
      </div>

      {/* 右侧按钮 */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">右侧按钮</label>
        <div className="flex items-center gap-3">
          <button onClick={() => onChange({ ...config, showRight: true })}
            className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-colors ${config.showRight !== false ? 'border-primary bg-primary-50 text-primary' : 'border-stone-200 text-gray-400'}`}>
            显示
          </button>
          <button onClick={() => onChange({ ...config, showRight: false })}
            className={`flex items-center gap-1 text-xs px-3 py-1 rounded-full border transition-colors ${config.showRight === false ? 'border-primary bg-primary-50 text-primary' : 'border-stone-200 text-gray-400'}`}>
            隐藏
          </button>
        </div>
      </div>

      {config.showRight !== false && (
        <>
          <div>
            <label className="block text-sm font-medium mb-1">右侧文字</label>
            <input type="text" value={config.rightText || ''} onChange={e => onChange({ ...config, rightText: e.target.value })}
              placeholder="更多" className="input" maxLength={4} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">链接</label>
            <div className="flex items-center gap-2">
              <Link className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <input type="text" value={config.rightLink || ''} onChange={e => onChange({ ...config, rightLink: e.target.value })}
                placeholder="请输入链接地址"
                className="w-full px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none" />
              <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
            </div>
          </div>
        </>
      )}
    </div>
  )

  /* ========== 样式面板 ========== */
  const stylePanel = (
    <div className="space-y-5">
      {/* 文字设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-3">文字设置</div>
        <div className="space-y-3">
          <ColorRow label="标题颜色" value={config.color} onChange={v => onChange({ ...config, color: v })} />
          <SliderRow label="标题文字" value={config.fontSize} min={12} max={36} onChange={v => onChange({ ...config, fontSize: v })} />

          {/* 文本样式: 正常 / 斜体 / 加粗 */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">文本样式</span>
            <div className="flex gap-1">
              {([
                { key: 'normal' as const, bold: false, label: 'A', title: '正常' },
                { key: 'italic' as const, bold: false, label: 'I', title: '斜体' },
                { key: 'bold' as const, bold: true, label: 'B', title: '加粗' },
              ] as const).map(opt => {
                const isActive = opt.key === 'bold'
                  ? config.bold
                  : opt.key === 'italic'
                    ? config.fontStyle === 'italic'
                    : !config.bold && config.fontStyle !== 'italic'
                return (
                  <button key={opt.key} title={opt.title}
                    onClick={() => {
                      if (opt.key === 'bold') onChange({ ...config, bold: true, fontStyle: 'normal' })
                      else if (opt.key === 'italic') onChange({ ...config, bold: false, fontStyle: 'italic' })
                      else onChange({ ...config, bold: false, fontStyle: 'normal' })
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded border text-sm transition-colors ${
                      isActive ? 'border-primary bg-primary-50 text-primary font-medium' : 'border-stone-200 text-gray-400 hover:border-gray-300'
                    }`}
                    style={{ fontStyle: opt.key === 'italic' ? 'italic' : 'normal', fontWeight: opt.key === 'bold' ? 'bold' : 'normal' }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <ColorRow label="副标题颜色" value={config.subtitleColor || '#282828'} onChange={v => onChange({ ...config, subtitleColor: v })} />
          <SliderRow label="副标题文字" value={config.subtitleFontSize || 14} min={10} max={24} onChange={v => onChange({ ...config, subtitleFontSize: v })} />

          <ColorRow label="按钮颜色" value={config.rightColor || '#282828'} onChange={v => onChange({ ...config, rightColor: v })} />
          <SliderRow label="按钮文字" value={config.rightFontSize || 12} min={10} max={20} onChange={v => onChange({ ...config, rightFontSize: v })} />
        </div>
      </div>

      {/* 边距设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-3">边距设置</div>
        <div className="space-y-2.5">
          <SliderRow label="上边距" value={style.marginTop} onChange={v => onStyleChange({ ...style, marginTop: v })} />
          <SliderRow label="下边距" value={style.marginBottom} onChange={v => onStyleChange({ ...style, marginBottom: v })} />
          <SliderRow label="左右边距" value={style.marginLR} onChange={v => onStyleChange({ ...style, marginLR: v })} />
        </div>
      </div>

      {/* 圆角设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 mb-3">圆角设置</div>
        <div className="space-y-2.5">
          <SliderRow label="页面圆角" value={style.borderRadius} max={30} onChange={v => onStyleChange({ ...style, borderRadius: v })} />
        </div>
      </div>
    </div>
  )

  return (
    <EditorTabs
      title="标题设置"
      icon={<Type className="h-4 w-4" />}
      contentPanel={contentPanel}
      stylePanel={stylePanel}
    />
  )
}
