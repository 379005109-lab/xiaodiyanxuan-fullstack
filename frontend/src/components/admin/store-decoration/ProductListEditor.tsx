import { useState } from 'react'
import { Package, Trash2, Grid, List, ArrowRight } from 'lucide-react'
import { ProductListConfig } from '@/services/storeDecorationService'
import { getFileUrl } from '@/services/uploadService'
import ProductSelectModal from './ProductSelectModal'

interface ProductListEditorProps {
  config: ProductListConfig
  onChange: (config: ProductListConfig) => void
}

export default function ProductListEditor({ config: value, onChange }: ProductListEditorProps) {
  const [showModal, setShowModal] = useState(false)

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

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
        <Package className="h-4 w-4" />
        商品列表
        <span className="text-xs text-gray-400 font-normal ml-1">({value.productIds.length} 件)</span>
      </h3>

      {/* 标题 */}
      <div>
        <label className="block text-sm font-medium mb-1">区域标题</label>
        <input
          type="text"
          value={value.title}
          onChange={e => onChange({ ...value, title: e.target.value })}
          placeholder="如：热销推荐"
          className="input"
          maxLength={20}
        />
      </div>

      {/* 展示模式 */}
      <div>
        <label className="block text-sm font-medium mb-1">展示方式</label>
        <div className="flex gap-2">
          {displayModes.map(mode => (
            <button
              key={mode.key}
              onClick={() => onChange({ ...value, displayMode: mode.key })}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-sm transition-colors ${
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

      {/* 数量限制 */}
      <div>
        <label className="block text-sm font-medium mb-1">显示数量</label>
        <input
          type="number"
          value={value.limit}
          onChange={e => onChange({ ...value, limit: Math.max(1, parseInt(e.target.value) || 1) })}
          min={1}
          max={50}
          className="input"
        />
      </div>

      {/* 已选商品列表 */}
      {value.products && value.products.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">已选商品</label>
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

      {/* 选择按钮 */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
      >
        <Package className="h-4 w-4" />
        选择商品
      </button>

      <ProductSelectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        selectedIds={value.productIds}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
