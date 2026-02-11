import { useState, useEffect } from 'react'
import { Search, Check, X } from 'lucide-react'
import { getProducts } from '@/services/productService'
import { getFileUrl } from '@/services/uploadService'

interface ProductSelectModalProps {
  isOpen: boolean
  onClose: () => void
  selectedIds: string[]
  onConfirm: (ids: string[], products: any[]) => void
}

export default function ProductSelectModal({ isOpen, onClose, selectedIds, onConfirm }: ProductSelectModalProps) {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      setSelected([...selectedIds])
      loadProducts()
    }
  }, [isOpen])

  const loadProducts = async (keyword?: string) => {
    setLoading(true)
    try {
      const res = await getProducts({ page: 1, limit: 50, search: keyword || '', status: 'active' })
      const list = res.data?.data || res.data || []
      setProducts(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('加载商品失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadProducts(search)
  }

  const handleToggle = (product: any) => {
    const id = product._id
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id))
      setSelectedProducts(selectedProducts.filter(p => p._id !== id))
    } else {
      setSelected([...selected, id])
      setSelectedProducts([...selectedProducts, product])
    }
  }

  const handleConfirm = () => {
    // 合并已有的 selectedProducts 和从 products 列表中找到的
    const allProducts = [...selectedProducts]
    for (const id of selected) {
      if (!allProducts.find(p => p._id === id)) {
        const found = products.find(p => p._id === id)
        if (found) allProducts.push(found)
      }
    }
    onConfirm(selected, allProducts)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">选择商品</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 搜索 */}
        <div className="px-6 py-3 border-b">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="搜索商品名称"
                className="input pl-9"
              />
            </div>
            <button onClick={handleSearch} className="btn-primary text-sm px-4 py-2">
              搜索
            </button>
          </div>
          <div className="text-xs text-gray-400 mt-2">已选 {selected.length} 件商品</div>
        </div>

        {/* 商品列表 */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {loading ? (
            <div className="py-12 text-center text-gray-500">加载中...</div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-gray-500">未找到商品</div>
          ) : (
            <div className="space-y-2">
              {products.map(product => {
                const isSelected = selected.includes(product._id)
                const imgUrl = product.thumbnail || product.images?.[0] || ''
                return (
                  <button
                    key={product._id}
                    onClick={() => handleToggle(product)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary-50'
                        : 'border-stone-200 hover:border-primary-200 hover:bg-stone-50'
                    }`}
                  >
                    {/* 选中标记 */}
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary border-primary' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>

                    {/* 图片 */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {imgUrl ? (
                        <img src={getFileUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>

                    {/* 信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{product.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        ¥{product.basePrice || product.price || 0}
                        {product.sales > 0 && <span className="ml-2">已售 {product.sales}</span>}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <span className="text-sm text-gray-500">已选择 <strong className="text-primary">{selected.length}</strong> 件</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">
              取消
            </button>
            <button onClick={handleConfirm} className="btn-primary text-sm px-4 py-2">
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
