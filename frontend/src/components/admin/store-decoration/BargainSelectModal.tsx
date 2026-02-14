import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Check, X } from 'lucide-react'
import { getFileUrl } from '@/services/uploadService'

interface BargainProduct {
  _id: string
  name: string
  coverImage: string
  originalPrice: number
  targetPrice: number
  category: string
  status: string
}

interface BargainSelectModalProps {
  isOpen: boolean
  onClose: () => void
  selectedIds: string[]
  onConfirm: (ids: string[], products: BargainProduct[]) => void
}

export default function BargainSelectModal({ isOpen, onClose, selectedIds, onConfirm }: BargainSelectModalProps) {
  const [products, setProducts] = useState<BargainProduct[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<BargainProduct[]>([])

  useEffect(() => {
    if (isOpen) {
      setSelected([...selectedIds])
      setSearchText('')
      loadBargainProducts()
    }
  }, [isOpen])

  const loadBargainProducts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bargains/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setProducts(data.data || [])
      }
    } catch (error) {
      console.error('加载砍价商品失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (product: BargainProduct) => {
    const id = product._id
    if (selected.includes(id)) {
      setSelected(selected.filter(s => s !== id))
      setSelectedProducts(selectedProducts.filter(p => p._id !== id))
    } else {
      setSelected([...selected, id])
      setSelectedProducts([...selectedProducts, product])
    }
  }

  const toggleAll = () => {
    const filtered = filteredProducts
    const allIds = filtered.map(p => p._id)
    const allSelected = allIds.every(id => selected.includes(id))
    if (allSelected) {
      setSelected(selected.filter(id => !allIds.includes(id)))
      setSelectedProducts(selectedProducts.filter(p => !allIds.includes(p._id)))
    } else {
      const newIds = [...new Set([...selected, ...allIds])]
      const newProds = [...selectedProducts]
      for (const p of filtered) {
        if (!newProds.find(sp => sp._id === p._id)) newProds.push(p)
      }
      setSelected(newIds)
      setSelectedProducts(newProds)
    }
  }

  const handleConfirm = () => {
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

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  )

  if (!isOpen) return null

  const allChecked = filteredProducts.length > 0 && filteredProducts.every(p => selected.includes(p._id))

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex: 9999 }} onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">选择砍价商品</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 搜索区 */}
        <div className="px-6 py-3 border-b">
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索砍价商品..."
              className="w-full px-3 py-2 pl-9 text-sm border border-stone-200 rounded-lg outline-none focus:ring-1 focus:ring-primary"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
        </div>

        {/* 商品表格 */}
        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {loading ? (
            <div className="py-16 text-center text-gray-500">加载中...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center text-gray-500">暂无砍价商品</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-gray-500 text-xs">
                  <th className="py-2.5 px-4 text-left w-10">
                    <button onClick={toggleAll} className={`w-4 h-4 rounded border flex items-center justify-center ${allChecked ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                      {allChecked && <Check className="h-3 w-3 text-white" />}
                    </button>
                  </th>
                  <th className="py-2.5 px-2 text-left">商品图</th>
                  <th className="py-2.5 px-2 text-left">商品名称</th>
                  <th className="py-2.5 px-2 text-left">原价</th>
                  <th className="py-2.5 px-2 text-left">目标价</th>
                  <th className="py-2.5 px-2 text-left">状态</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const isSelected = selected.includes(product._id)
                  return (
                    <tr
                      key={product._id}
                      onClick={() => handleToggle(product)}
                      className={`border-b border-stone-100 cursor-pointer transition-colors ${isSelected ? 'bg-primary-50' : 'hover:bg-stone-50'}`}
                    >
                      <td className="py-2.5 px-4">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                          {product.coverImage ? (
                            <img src={product.coverImage.startsWith('http') ? product.coverImage : getFileUrl(product.coverImage)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 max-w-[200px]">
                        <div className="truncate text-gray-700">{product.name}</div>
                      </td>
                      <td className="py-2.5 px-2 text-gray-400 line-through">¥{product.originalPrice}</td>
                      <td className="py-2.5 px-2 text-red-600 font-medium">¥{product.targetPrice}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {product.status === 'active' ? '上架' : '已下架'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50 rounded-b-xl">
          <span className="text-sm text-gray-500">已选择 <strong className="text-primary">{selected.length}</strong> 件</span>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">取消</button>
            <button onClick={handleConfirm} className="btn-primary text-sm px-4 py-2">确认选择</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
