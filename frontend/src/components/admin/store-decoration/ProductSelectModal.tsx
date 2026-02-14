import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Check, X, ChevronDown } from 'lucide-react'
import { getProducts } from '@/services/productService'
import { getAllCategories } from '@/services/categoryService'
import { getFileUrl } from '@/services/uploadService'

interface ProductSelectModalProps {
  isOpen: boolean
  onClose: () => void
  selectedIds: string[]
  onConfirm: (ids: string[], products: any[]) => void
}

export default function ProductSelectModal({ isOpen, onClose, selectedIds, onConfirm }: ProductSelectModalProps) {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      setSelected([...selectedIds])
      setSearchText('')
      setFilterCategoryId('')
      setFilterStatus('')
      getAllCategories().then(cats => setCategories(cats || [])).catch(() => {})
      loadProducts({})
    }
  }, [isOpen])

  const loadProducts = async (params: { search?: string; categoryId?: string; status?: string }) => {
    setLoading(true)
    try {
      const query: any = { page: 1, pageSize: 100 }
      if (params.search) query.search = params.search
      if (params.categoryId) query.categoryId = params.categoryId
      if (params.status) query.status = params.status
      const res = await getProducts(query)
      const list = res.data?.data || res.data || []
      setProducts(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('加载商品失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const doFilter = () => {
    loadProducts({ search: searchText, categoryId: filterCategoryId, status: filterStatus })
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

  const toggleAll = () => {
    const allIds = products.map(p => p._id)
    const allSelected = allIds.every(id => selected.includes(id))
    if (allSelected) {
      setSelected(selected.filter(id => !allIds.includes(id)))
      setSelectedProducts(selectedProducts.filter(p => !allIds.includes(p._id)))
    } else {
      const newIds = [...new Set([...selected, ...allIds])]
      const newProds = [...selectedProducts]
      for (const p of products) {
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

  if (!isOpen) return null

  const allChecked = products.length > 0 && products.every(p => selected.includes(p._id))

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex: 9999 }} onClick={onClose}>
      <div
        className="bg-white rounded-xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl mx-4"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold">商品列表</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* 筛选区 */}
        <div className="px-6 py-3 border-b space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">商品搜索:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && doFilter()}
                  placeholder="请输入商品名称"
                  className="w-48 px-3 py-1.5 text-sm border border-stone-200 rounded-lg outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={doFilter} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-gray-400 hover:text-primary" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">商品分类:</span>
              <div className="relative">
                <select
                  value={filterCategoryId}
                  onChange={e => { const val = e.target.value; setFilterCategoryId(val); loadProducts({ search: searchText, categoryId: val, status: filterStatus }) }}
                  className="appearance-none w-40 px-3 py-1.5 pr-8 text-sm border border-stone-200 rounded-lg outline-none focus:ring-1 focus:ring-primary bg-white"
                >
                  <option value="">请选择</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">商品状态:</span>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={e => { const val = e.target.value; setFilterStatus(val); loadProducts({ search: searchText, categoryId: filterCategoryId, status: val }) }}
                  className="appearance-none w-36 px-3 py-1.5 pr-8 text-sm border border-stone-200 rounded-lg outline-none focus:ring-1 focus:ring-primary bg-white"
                >
                  <option value="">请选择商品状态</option>
                  <option value="active">上架</option>
                  <option value="inactive">下架</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* 商品表格 */}
        <div className="flex-1 overflow-y-auto min-h-[200px]">
          {loading ? (
            <div className="py-16 text-center text-gray-500">加载中...</div>
          ) : products.length === 0 ? (
            <div className="py-16 text-center text-gray-500">未找到商品</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-gray-500 text-xs">
                  <th className="py-2.5 px-4 text-left w-10">
                    <button onClick={toggleAll} className={`w-4 h-4 rounded border flex items-center justify-center ${allChecked ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                      {allChecked && <Check className="h-3 w-3 text-white" />}
                    </button>
                  </th>
                  <th className="py-2.5 px-2 text-left">ID</th>
                  <th className="py-2.5 px-2 text-left">商品图</th>
                  <th className="py-2.5 px-2 text-left">商品名称</th>
                  <th className="py-2.5 px-2 text-left">商品分类</th>
                  <th className="py-2.5 px-2 text-left">商品状态</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => {
                  const isSelected = selected.includes(product._id)
                  const imgUrl = product.thumbnail || product.images?.[0] || ''
                  const catName = product.category?.name || '-'
                  const statusText = product.status === 'active' ? '上架' : '下架'
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
                      <td className="py-2.5 px-2 text-gray-400 text-xs">{product._id?.slice(-6) || '-'}</td>
                      <td className="py-2.5 px-2">
                        <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                          {imgUrl ? (
                            <img src={getFileUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gray-200" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 max-w-[200px]">
                        <div className="truncate text-gray-700">{product.name}</div>
                      </td>
                      <td className="py-2.5 px-2 text-gray-500">{catName}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                          {statusText}
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
            <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">
              取消
            </button>
            <button onClick={handleConfirm} className="btn-primary text-sm px-4 py-2">
              确认选择
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
