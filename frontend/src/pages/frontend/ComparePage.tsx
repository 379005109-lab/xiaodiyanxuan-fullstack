import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ShoppingCart, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useCompareStore } from '@/store/compareStore'
import { useCartStore } from '@/store/cartStore'

interface Product {
  _id: string
  name: string
  price: number
  images: string[]
  category: string
  style?: string
  material?: string
}

export default function ComparePage() {
  const navigate = useNavigate()
  const { compareItems, removeFromCompare, clearAll } = useCompareStore()
  const { addItem } = useCartStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompareData()
  }, [compareItems])

  const loadCompareData = async () => {
    if (!compareItems || compareItems.length === 0) {
      setProducts([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const productPromises = compareItems.map(async (item) => {
        const productId = typeof item === 'string' ? item : item._id
        const response = await fetch(`https://pkochbpmcgaa.sealoshzh.site/api/products/${productId}`)
        if (!response.ok) throw new Error('加载商品失败')
        const data = await response.json()
        return data.data
      })

      const loadedProducts = await Promise.all(productPromises)
      setProducts(loadedProducts.filter(Boolean))
    } catch (error) {
      console.error('加载对比商品失败:', error)
      toast.error('加载对比商品失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = (productId: string) => {
    removeFromCompare(productId)
    toast.success('已从对比列表移除')
  }

  const handleClearAll = () => {
    clearAll()
    toast.success('已清空对比列表')
  }

  const handleAddToCart = (product: Product) => {
    const defaultSku: any = {
      _id: 'default',
      id: 'default',
      size: '标准',
      material: product.material || '标准材质',
      color: '原色',
      price: product.price,
      stock: 999,
      imageIndex: 0,
      images: product.images || []
    }
    
    addItem(product as any, defaultSku, 1, {}, product.price)
    toast.success('已加入购物车')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">商品对比</h1>
            <p className="text-gray-600 mb-8">您还没有添加任何商品到对比列表</p>
            <button
              onClick={() => navigate('/products')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              去选购商品
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">商品对比</h1>
            <p className="text-sm text-gray-600 mt-1">对比 {products.length} 件商品</p>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleClearAll} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">清空对比</button>
            <button onClick={() => navigate('/products')} className="inline-flex items-center gap-2 px-4 py-2 bg-white border rounded-lg">
              <ArrowLeft className="w-4 h-4" />返回商城
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <tbody>
              <tr className="border-b">
                <td className="p-4 bg-gray-50 font-medium w-32">商品</td>
                {products.map((product) => (
                  <td key={product._id} className="p-4 text-center relative">
                    <button onClick={() => handleRemove(product._id)} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full">
                      <X className="w-4 h-4" />
                    </button>
                    <div className="w-40 h-40 mx-auto mb-3 rounded-lg overflow-hidden bg-gray-100">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">暂无图片</div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{product.name}</h3>
                    <p className="text-primary-600 font-bold text-lg mb-3">¥{product.price}</p>
                    <button onClick={() => handleAddToCart(product)} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
                      <ShoppingCart className="w-4 h-4" />加入购物车
                    </button>
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 bg-gray-50 font-medium">分类</td>
                {products.map((p) => (<td key={p._id} className="p-4 text-center">{p.category || '-'}</td>))}
              </tr>
              <tr className="border-b">
                <td className="p-4 bg-gray-50 font-medium">风格</td>
                {products.map((p) => (<td key={p._id} className="p-4 text-center">{p.style || '-'}</td>))}
              </tr>
              <tr className="border-b">
                <td className="p-4 bg-gray-50 font-medium">材质</td>
                {products.map((p) => (<td key={p._id} className="p-4 text-center">{p.material || '-'}</td>))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
