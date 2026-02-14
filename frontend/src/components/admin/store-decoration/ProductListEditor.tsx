import { useState, useEffect, useRef } from 'react'
import { Package, Trash2, Grid, List, ArrowRight, Check, ChevronDown, X } from 'lucide-react'
import { ProductListConfig, ComponentStyle } from '@/services/storeDecorationService'
import { getFileUrl } from '@/services/uploadService'
import { getAllCategories } from '@/services/categoryService'
import { getProducts } from '@/services/productService'
import ProductSelectModal from './ProductSelectModal'
import EditorTabs from './EditorTabs'
import StyleEditor from './StyleEditor'

interface ProductListEditorProps {
  config: ProductListConfig
  onChange: (config: ProductListConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
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

function CategoryMultiSelect({ categories, selectedIds, onChange }: {
  categories: any[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleCat = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(c => c !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  const removeCat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedIds.filter(c => c !== id))
  }

  const selectedCats = categories.filter(c => selectedIds.includes(c._id))

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(!open)}
        className="min-h-[36px] w-full px-2 py-1.5 text-sm bg-white border border-stone-200 rounded-lg cursor-pointer flex items-center flex-wrap gap-1 focus-within:ring-1 focus-within:ring-primary"
      >
        {selectedCats.length === 0 ? (
          <span className="text-gray-400 text-sm">请选择商品分类</span>
        ) : (
          selectedCats.map(cat => (
            <span key={cat._id} className="inline-flex items-center gap-0.5 bg-primary-50 text-primary text-xs px-2 py-0.5 rounded">
              {cat.name}
              <button onClick={(e) => removeCat(cat._id, e)} className="hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
        <ChevronDown className={`ml-auto h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-48 overflow-y-auto" style={{ zIndex: 50 }}>
          {categories.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">暂无分类</div>
          ) : (
            categories.map(cat => {
              const isChecked = selectedIds.includes(cat._id)
              return (
                <div
                  key={cat._id}
                  onClick={() => toggleCat(cat._id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-stone-50 ${isChecked ? 'text-primary' : 'text-gray-600'}`}
                >
                  <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${isChecked ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                    {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                  </span>
                  <span className="flex-1">{cat.name}</span>
                  {cat.children && cat.children.length > 0 && (
                    <ChevronDown className="w-3 h-3 text-gray-400 -rotate-90" />
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductListEditor({ config: value, onChange, style, onStyleChange }: ProductListEditorProps) {
  const [showModal, setShowModal] = useState(false)
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    getAllCategories().then(cats => setCategories(cats || [])).catch(() => {})
  }, [])

  // When categoryIds change in category mode, fetch products by category
  useEffect(() => {
    if ((value.selectMode || 'product') === 'category' && value.categoryIds && value.categoryIds.length > 0) {
      fetchProductsByCategories(value.categoryIds)
    }
  }, [value.selectMode, value.categoryIds?.join(',')])

  const fetchProductsByCategories = async (catIds: string[]) => {
    try {
      const allProducts: any[] = []
      const seen = new Set<string>()
      for (const catId of catIds) {
        const sortParam = value.sortBy === 'sales' ? '-sales' : value.sortBy === 'price' ? 'basePrice' : 'order -createdAt'
        const res = await getProducts({ page: 1, pageSize: value.limit || 10, categoryId: catId, status: 'active', sortBy: sortParam })
        const list = res.data?.data || res.data || []
        const arr = Array.isArray(list) ? list : []
        for (const p of arr) {
          if (!seen.has(p._id)) {
            seen.add(p._id)
            allProducts.push(p)
          }
        }
      }
      onChange({ ...value, products: allProducts.slice(0, value.limit || 10) })
    } catch (err) {
      console.error('按分类加载商品失败:', err)
    }
  }

  const set = (patch: Partial<ProductListConfig>) => onChange({ ...value, ...patch })

  const handleConfirm = (ids: string[], products: any[]) => {
    onChange({ ...value, productIds: ids, products })
  }

  const handleRemoveProduct = (id: string) => {
    onChange({
      ...value,
      productIds: value.productIds.filter(pid => pid !== id),
      products: value.products?.filter(p => p._id !== id)
    })
  }

  const displayModes: { key: ProductListConfig['displayMode']; label: string; icon: any }[] = [
    { key: 'grid', label: '网格', icon: Grid },
    { key: 'list', label: '列表', icon: List },
    { key: 'scroll', label: '横滑', icon: ArrowRight },
  ]

  const sortOptions: { key: ProductListConfig['sortBy']; label: string }[] = [
    { key: 'default', label: '综合' },
    { key: 'sales', label: '销量' },
    { key: 'price', label: '价格' },
  ]

  const productCount = (value.selectMode || 'product') === 'product'
    ? (value.products?.length || 0)
    : (value.products?.length || 0)

  return (
    <EditorTabs
      title={`商品列表 (${productCount} 件)`}
      icon={<Package className="h-4 w-4" />}
      contentPanel={
        <div className="space-y-5">
          {/* 展现形式 */}
          <div>
            <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">展现形式</div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">展现形式</label>
              <div className="flex gap-2">
                {displayModes.map(mode => (
                  <button
                    key={mode.key}
                    onClick={() => set({ displayMode: mode.key })}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs transition-colors ${
                      value.displayMode === mode.key
                        ? 'border-primary bg-primary-50 text-primary font-medium'
                        : 'border-stone-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <mode.icon className="h-3.5 w-3.5" />
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 显示内容 */}
          <div>
            <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">显示内容</div>
            <div>
              <label className="block text-xs text-gray-500 mb-2">展示信息</label>
              <div className="flex flex-wrap gap-2">
                <CheckboxItem label="商品名称" checked={value.showName !== false} onChange={v => set({ showName: v })} />
                <CheckboxItem label="商品价格" checked={value.showPrice !== false} onChange={v => set({ showPrice: v })} />
                <CheckboxItem label="已售数量" checked={value.showSales !== false} onChange={v => set({ showSales: v })} />
              </div>
            </div>
          </div>

          {/* 商品设置 */}
          <div>
            <div className="text-xs font-semibold text-gray-600 border-b border-stone-100 pb-2 mb-3">商品设置</div>
            <div className="space-y-3">
              {/* 选择方式 */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">选择方式</label>
                <div className="flex items-center gap-3">
                  {([
                    { key: 'product' as const, label: '指定商品' },
                    { key: 'category' as const, label: '指定分类' },
                  ]).map(opt => (
                    <button key={opt.key} onClick={() => set({ selectMode: opt.key })}
                      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        (value.selectMode || 'product') === opt.key ? 'border-primary bg-primary-50 text-primary' : 'border-stone-200 text-gray-400'
                      }`}>
                      <span className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${(value.selectMode || 'product') === opt.key ? 'border-primary' : 'border-gray-300'}`}>
                        {(value.selectMode || 'product') === opt.key && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 指定分类：多选下拉 */}
              {(value.selectMode || 'product') === 'category' && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">商品分类</label>
                  <CategoryMultiSelect
                    categories={categories}
                    selectedIds={value.categoryIds || []}
                    onChange={(ids) => set({ categoryIds: ids })}
                  />
                </div>
              )}

              {/* 商品数量 */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">商品数量</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => set({ limit: Math.max(1, (value.limit || 6) - 1) })}
                    className="w-8 h-8 flex items-center justify-center rounded border border-stone-200 text-gray-400 hover:text-gray-600 text-sm"
                  >−</button>
                  <input
                    type="number"
                    value={value.limit || 6}
                    min={1}
                    max={50}
                    onChange={e => set({ limit: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })}
                    className="w-16 h-8 text-center text-sm border border-stone-200 rounded outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => set({ limit: Math.min(50, (value.limit || 6) + 1) })}
                    className="w-8 h-8 flex items-center justify-center rounded border border-stone-200 text-gray-400 hover:text-gray-600 text-sm"
                  >+</button>
                </div>
              </div>

              {/* 商品排序 */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">商品排序</label>
                <div className="flex gap-2">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => set({ sortBy: opt.key })}
                      className={`flex-1 py-1.5 rounded-lg border text-xs transition-colors ${
                        (value.sortBy || 'default') === opt.key
                          ? 'border-primary bg-primary-50 text-primary font-medium'
                          : 'border-stone-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 指定商品模式：已选商品 + 选择按钮 */}
              {(value.selectMode || 'product') === 'product' && (
                <>
                  {value.products && value.products.length > 0 && (
                    <div className="space-y-2">
                      <label className="block text-xs text-gray-500">已选商品</label>
                      {value.products.map(product => {
                        const imgUrl = product.thumbnail || product.images?.[0] || ''
                        return (
                          <div
                            key={product._id}
                            className="flex items-center gap-3 p-2 bg-stone-50 rounded-lg border border-stone-200"
                          >
                            <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden flex-shrink-0">
                              {imgUrl ? (
                                <img src={getFileUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-gray-200" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">{product.name}</div>
                              <div className="text-xs text-gray-400">¥{product.basePrice || product.price || 0}</div>
                            </div>
                            <button
                              onClick={() => handleRemoveProduct(product._id)}
                              className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
                  >
                    <Package className="h-4 w-4" />
                    选择商品
                  </button>
                </>
              )}
            </div>
          </div>

          <ProductSelectModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            selectedIds={value.productIds}
            onConfirm={handleConfirm}
          />
        </div>
      }
      stylePanel={<StyleEditor style={style} onChange={onStyleChange} />}
    />
  )
}
