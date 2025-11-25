import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Scale, X, ShoppingBag, Loader2 } from 'lucide-react'
import { useCompareStore } from '@/store/compareStore'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'

export default function ComparePage() {
  const { items, removeItem, clearAll, loadCompareItems } = useCompareStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      await loadCompareItems()
      setLoading(false)
    }
    load()
  }, [])

  const handleRemove = async (productId: string) => {
    try {
      await removeItem(productId)
      toast.success('已移除对比')
    } catch (error) {
      toast.error('操作失败')
    }
  }

  const handleClearAll = async () => {
    if (window.confirm('确定要清空所有对比商品吗？')) {
      try {
        await clearAll()
        toast.success('已清空对比')
      } catch (error) {
        toast.error('操作失败')
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2F4F3] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up pb-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">商品对比</h1>
            <p className="text-stone-500 uppercase tracking-widest text-xs">Product Comparison ({items.length})</p>
          </div>
          {items.length > 0 && (
            <button 
              onClick={handleClearAll}
              className="text-sm text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1 border-b border-transparent hover:border-red-500 pb-0.5"
            >
              <X className="w-3 h-3" /> 清空对比
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
            <Scale className="w-16 h-16 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-400 font-serif italic mb-4">还没有添加对比商品</p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-green-900 transition-colors"
            >
              去选择商品 <ShoppingBag className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-stone-50">
                  <tr>
                    <td className="p-6 font-bold text-primary">商品信息</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-6 text-center min-w-[200px]">
                        <div className="relative">
                          <button
                            onClick={() => handleRemove(item._id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <Link to={`/products/${item._id}`}>
                            <img
                              src={item.images?.[0] ? getFileUrl(item.images[0]) : '/placeholder.svg'}
                              alt={item.name}
                              className="w-32 h-32 object-cover rounded-lg mx-auto mb-3"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                            />
                            <h3 className="font-bold text-primary hover:text-green-900 transition-colors line-clamp-2">
                              {item.name}
                            </h3>
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-stone-100">
                    <td className="p-6 font-medium text-stone-700 bg-stone-50">价格</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-6 text-center">
                        <div className="font-serif font-bold text-xl text-accent">
                          {formatPrice(item.skus?.[0]?.price || 0)}
                        </div>
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-stone-100">
                    <td className="p-6 font-medium text-stone-700 bg-stone-50">品牌</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-6 text-center text-stone-600">
                        {item.brand || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-stone-100">
                    <td className="p-6 font-medium text-stone-700 bg-stone-50">分类</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-6 text-center text-stone-600">
                        {item.category?.name || '-'}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-stone-100">
                    <td className="p-6 font-medium text-stone-700 bg-stone-50">操作</td>
                    {items.map((item) => (
                      <td key={item._id} className="p-6 text-center">
                        <Link
                          to={`/products/${item._id}`}
                          className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-full hover:bg-green-900 transition-colors text-sm"
                        >
                          查看详情
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
