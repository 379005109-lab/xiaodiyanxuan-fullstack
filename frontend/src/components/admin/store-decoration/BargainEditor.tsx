import { Scissors, Upload, Link, Check, Trash2, Package } from 'lucide-react'
import { useRef, useState } from 'react'
import { BargainConfig, ComponentStyle } from '@/services/storeDecorationService'
import { uploadFile, getFileUrl } from '@/services/uploadService'
import EditorTabs from './EditorTabs'
import BargainSelectModal from './BargainSelectModal'

interface BargainEditorProps {
  config: BargainConfig
  onChange: (config: BargainConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

/* ---- 复用小控件 ---- */
function ColorRow({ label, value, defaultVal = '#FFFFFF', onChange }: { label: string; value: string; defaultVal?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
      <input type="color" value={value || defaultVal} onChange={e => onChange(e.target.value)}
        className="w-7 h-7 rounded border border-stone-200 cursor-pointer" />
      <input type="text" value={value} onChange={e => onChange(e.target.value)}
        className="flex-1 px-2 py-1 text-xs border border-stone-200 rounded-lg outline-none focus:ring-1 focus:ring-primary" maxLength={7} />
      <button onClick={() => onChange(defaultVal)} className="text-xs text-primary hover:underline whitespace-nowrap">重置</button>
    </div>
  )
}

function SliderRow({ label, value, min = 0, max = 50, onChange }: { label: string; value: number; min?: number; max?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
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

function RadioGroup({ value, options, onChange }: { value: string; options: { key: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-3">
      {options.map(opt => (
        <button key={opt.key} onClick={() => onChange(opt.key)}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
            value === opt.key ? 'border-primary bg-primary-50 text-primary' : 'border-stone-200 text-gray-400'
          }`}>
          <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${value === opt.key ? 'border-primary' : 'border-gray-300'}`}>
            {value === opt.key && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
          </span>
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function CheckboxItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded border transition-colors ${
        checked ? 'border-primary bg-primary-50 text-primary' : 'border-stone-200 text-gray-400'
      }`}>
      <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white ${checked ? 'bg-primary' : 'bg-gray-200'}`}>
        {checked && <Check className="w-2.5 h-2.5" />}
      </span>
      {label}
    </button>
  )
}

function ImageUpload({ value, onChange, tips }: { value: string; onChange: (v: string) => void; tips: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await uploadFile(file)
      if (res.data?.fileId) onChange(res.data.fileId)
    } catch { /* ignore */ }
    if (inputRef.current) inputRef.current.value = ''
  }
  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      {value ? (
        <div className="relative group w-full h-20 rounded-lg overflow-hidden border border-stone-200">
          <img src={getFileUrl(value)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button onClick={() => inputRef.current?.click()} className="text-white text-xs bg-white/20 px-2 py-1 rounded">替换</button>
            <button onClick={() => onChange('')} className="text-white text-xs bg-white/20 px-2 py-1 rounded">删除</button>
          </div>
        </div>
      ) : (
        <button onClick={() => inputRef.current?.click()}
          className="w-full h-20 border-2 border-dashed border-stone-200 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary hover:text-primary transition-colors">
          <Upload className="w-4 h-4" />
          <span className="text-[10px]">{tips}</span>
        </button>
      )}
    </div>
  )
}

export default function BargainEditor({ config, onChange, style, onStyleChange }: BargainEditorProps) {
  const set = (patch: Partial<BargainConfig>) => onChange({ ...config, ...patch })
  const [showModal, setShowModal] = useState(false)

  const handleConfirmProducts = (ids: string[], products: any[]) => {
    onChange({ ...config, productIds: ids, products })
  }

  const handleRemoveProduct = (id: string) => {
    onChange({
      ...config,
      productIds: (config.productIds || []).filter(pid => pid !== id),
      products: (config.products || []).filter(p => p._id !== id)
    })
  }

  /* ========== 内容面板 ========== */
  const contentPanel = (
    <div className="space-y-5">
      {/* 布局设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">布局设置</div>
        <div>
          <label className="block text-xs text-gray-500 mb-2">展示样式</label>
          <div className="flex gap-2">
            {([
              { key: 0, label: '横向滑动' },
              { key: 1, label: '列表' },
              { key: 2, label: '两列' },
              { key: 3, label: '三列' },
            ] as const).map(opt => (
              <button key={opt.key} onClick={() => set({ layoutStyle: opt.key, displayMode: opt.key === 0 ? 'scroll' : 'grid' })}
                className={`flex-1 py-2 rounded-lg border text-xs transition-colors ${
                  (config.layoutStyle ?? 0) === opt.key
                    ? 'border-primary bg-primary-50 text-primary font-medium'
                    : 'border-stone-200 text-gray-500 hover:border-gray-300'
                }`}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 头部设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">头部设置</div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-2">边框风格</label>
            <RadioGroup value={config.headerStyle || 'color'}
              options={[{ key: 'image', label: '背景图片' }, { key: 'color', label: '背景色' }]}
              onChange={v => set({ headerStyle: v as 'image' | 'color' })} />
          </div>

          {config.headerStyle === 'image' ? (
            <div>
              <label className="block text-xs text-gray-500 mb-1">背景图片</label>
              <div className="text-[10px] text-gray-400 mb-1">建议：710×96px</div>
              <ImageUpload value={config.headerBgImage || ''} onChange={v => set({ headerBgImage: v })} tips="上传背景图 710×96px" />
            </div>
          ) : (
            <div className="space-y-2">
              <ColorRow label="渐变起始色" value={config.headerBgColor || '#faad14'} defaultVal="#faad14" onChange={v => set({ headerBgColor: v, bgColor: v })} />
              <ColorRow label="渐变结束色" value={config.headerBgColor2 || '#FFFFFF'} onChange={v => set({ headerBgColor2: v })} />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-2">标题类型</label>
            <RadioGroup value={config.titleType || 'text'}
              options={[{ key: 'image', label: '图片' }, { key: 'text', label: '文字' }]}
              onChange={v => set({ titleType: v as 'image' | 'text' })} />
          </div>

          {config.titleType === 'image' ? (
            <div>
              <label className="block text-xs text-gray-500 mb-1">标题图片</label>
              <div className="text-[10px] text-gray-400 mb-1">建议：154×32px</div>
              <ImageUpload value={config.titleImage || ''} onChange={v => set({ titleImage: v })} tips="上传标题图 154×32px" />
            </div>
          ) : (
            <div>
              <label className="block text-xs text-gray-500 mb-1">标题内容</label>
              <input type="text" value={config.title} onChange={e => set({ title: e.target.value })}
                placeholder="砍价专区" className="input" maxLength={10} />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">更多链接</label>
            <div className="flex items-center gap-2">
              <Link className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
              <input type="text" value={config.moreLink || ''} onChange={e => set({ moreLink: e.target.value })}
                placeholder="请输入链接地址"
                className="w-full px-3 py-1.5 text-sm bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-primary focus:border-primary outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 显示内容 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">显示内容</div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-2">展示信息</label>
            <div className="flex flex-wrap gap-2">
              <CheckboxItem label="商品名称" checked={config.showName !== false} onChange={v => set({ showName: v })} />
              <CheckboxItem label="活动标签" checked={config.showTag !== false} onChange={v => set({ showTag: v })} />
              <CheckboxItem label="商品价格" checked={config.showPrice !== false} onChange={v => set({ showPrice: v })} />
              <CheckboxItem label="商品原价" checked={config.showOriginalPrice !== false} onChange={v => set({ showOriginalPrice: v })} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-500">砍价按钮</label>
            <RadioGroup value={config.showButton !== false ? 'show' : 'hide'}
              options={[{ key: 'show', label: '显示' }, { key: 'hide', label: '隐藏' }]}
              onChange={v => set({ showButton: v === 'show' })} />
          </div>
        </div>
      </div>

      {/* 砍价设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">砍价设置</div>
        <div className="space-y-3">
          {/* 选择方式 */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">选择方式</label>
            <div className="flex items-center gap-3">
              <button
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary bg-primary-50 text-primary">
                <span className="w-3 h-3 rounded-full border-2 border-primary flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                </span>
                指定商品
              </button>
            </div>
          </div>

          {/* 商品数量 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">商品数量</label>
            <div className="flex items-center gap-1">
              <button
                onClick={() => set({ limit: Math.max(1, (config.limit || 10) - 1) })}
                className="w-8 h-8 flex items-center justify-center rounded border border-stone-200 text-gray-400 hover:text-gray-600 text-sm"
              >−</button>
              <input
                type="number"
                value={config.limit || 10}
                min={1}
                max={50}
                onChange={e => set({ limit: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })}
                className="w-16 h-8 text-center text-sm border border-stone-200 rounded outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => set({ limit: Math.min(50, (config.limit || 10) + 1) })}
                className="w-8 h-8 flex items-center justify-center rounded border border-stone-200 text-gray-400 hover:text-gray-600 text-sm"
              >+</button>
            </div>
          </div>

          {/* 商品排序 */}
          <div>
            <label className="block text-xs text-gray-500 mb-2">商品排序</label>
            <div className="flex gap-2">
              {([
                { key: 'default' as const, label: '综合' },
                { key: 'sales' as const, label: '销量' },
                { key: 'price' as const, label: '价格' },
              ]).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => set({ sortBy: opt.key })}
                  className={`flex-1 py-1.5 rounded-lg border text-xs transition-colors ${
                    (config.sortBy || 'default') === opt.key
                      ? 'border-primary bg-primary-50 text-primary font-medium'
                      : 'border-stone-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 已选商品 */}
          {config.products && config.products.length > 0 && (
            <div className="space-y-2">
              <label className="block text-xs text-gray-500">已选商品</label>
              {config.products.map((product: any) => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-2 bg-stone-50 rounded-lg border border-stone-200"
                >
                  <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                    {product.coverImage ? (
                      <img src={product.coverImage.startsWith('http') ? product.coverImage : getFileUrl(product.coverImage)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{product.name}</div>
                    <div className="text-xs text-red-500">¥{product.targetPrice || product.originalPrice || 0}</div>
                  </div>
                  <button
                    onClick={() => handleRemoveProduct(product._id)}
                    className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 选择商品按钮 */}
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
          >
            <Package className="h-4 w-4" />
            选择商品
          </button>
        </div>
      </div>

      <BargainSelectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedIds={config.productIds || []}
        onConfirm={handleConfirmProducts}
      />
    </div>
  )

  /* ========== 样式面板 ========== */
  const stylePanel = (
    <div className="space-y-5">
      {/* 头部设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">头部设置</div>
        <div className="space-y-2.5">
          <ColorRow label="分割线颜色" value={config.dividerColor || '#FFFFFF'} onChange={v => set({ dividerColor: v })} />
          <ColorRow label="提示文字颜色" value={config.hintTextColor || '#FFFFFF'} onChange={v => set({ hintTextColor: v })} />
          <ColorRow label="头部按钮颜色" value={config.headerButtonColor || '#FFFFFF'} onChange={v => set({ headerButtonColor: v })} />
        </div>
      </div>

      {/* 商品设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">商品设置</div>
        <div className="space-y-2.5">
          <ColorRow label="内容背景色" value={config.contentBgColor || '#FFFFFF'} onChange={v => set({ contentBgColor: v })} />
          <ColorRow label="商品名称颜色" value={config.nameColor || '#000000'} defaultVal="#000000" onChange={v => set({ nameColor: v })} />
          <ColorRow label="商品原价颜色" value={config.originalPriceColor || '#999999'} defaultVal="#999999" onChange={v => set({ originalPriceColor: v })} />
        </div>
      </div>

      {/* 色调 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">色调</div>
        <div className="space-y-2.5">
          <RadioGroup value={config.themeMode || 'follow'}
            options={[{ key: 'follow', label: '跟随主题风格' }, { key: 'custom', label: '自定义' }]}
            onChange={v => set({ themeMode: v as 'follow' | 'custom' })} />
          <ColorRow label="按钮文字颜色" value={config.buttonTextColor || '#FFFFFF'} onChange={v => set({ buttonTextColor: v })} />
        </div>
      </div>

      {/* 边距设置 */}
      <div>
        <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">边距设置</div>
        <div className="space-y-2.5">
          <SliderRow label="上边距" value={style.marginTop} onChange={v => onStyleChange({ ...style, marginTop: v })} />
          <SliderRow label="下边距" value={style.marginBottom} onChange={v => onStyleChange({ ...style, marginBottom: v })} />
          <SliderRow label="左右边距" value={style.marginLR} max={25} onChange={v => onStyleChange({ ...style, marginLR: v })} />
        </div>
      </div>
    </div>
  )

  return (
    <EditorTabs
      title="砍价设置"
      icon={<Scissors className="h-4 w-4" />}
      contentPanel={contentPanel}
      stylePanel={stylePanel}
    />
  )
}
