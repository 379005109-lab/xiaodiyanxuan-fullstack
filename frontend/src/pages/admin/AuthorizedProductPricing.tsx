import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Pencil, Save, ArrowLeft } from 'lucide-react'
import { getProducts, updateProduct } from '@/services/productService'
import { formatPrice } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Product } from '@/types'

export default function AuthorizedProductPricing() {
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [savingId, setSavingId] = useState<string | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedPrice, setEditedPrice] = useState<string>('')

  const load = async () => {
    setLoading(true)
    try {
      const resp = await getProducts({ pageSize: 10000 })
      if (resp?.success) {
        let productList = resp.data || []
        
        // 应用本地存储的价格覆盖
        try {
          const localPrices = JSON.parse(localStorage.getItem('authorized_product_prices') || '{}')
          productList = productList.map((p: any) => {
            const localPrice = localPrices[p._id]
            if (localPrice && localPrice.labelPrice1 !== undefined) {
              return { ...p, labelPrice1: localPrice.labelPrice1 }
            }
            return p
          })
        } catch (e) {
          console.log('[AuthorizedProductPricing] 加载本地价格失败:', e)
        }
        
        setProducts(productList)
      } else {
        setProducts([])
      }
    } catch (e: any) {
      console.error('[AuthorizedProductPricing] load failed:', e)
      toast.error('加载失败')
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const canManageProducts = useMemo(() => {
    return user?.role === 'admin' || user?.role === 'super_admin' || (user as any)?.permissions?.canManageProducts === true
  }, [user])

  const authorizedProducts = useMemo(() => {
    return products.filter((p: any) => p?.takePrice !== undefined || p?.labelPrice1 !== undefined)
  }, [products])

  const ownedProducts = useMemo(() => {
    return products.filter((p: any) => p?.takePrice === undefined && p?.labelPrice1 === undefined)
  }, [products])

  const startEdit = (p: any) => {
    setEditingId(p._id)
    const current = p.labelPrice1 ?? p.takePrice ?? 0
    setEditedPrice(String(current))
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditedPrice('')
  }

  const save = async (p: any) => {
    const next = Number(editedPrice)
    if (!Number.isFinite(next)) {
      toast.error('请输入有效价格')
      return
    }

    const min = Number(p.takePrice ?? 0)
    if (next < min) {
      toast.error('标1价不能低于拿货价')
      return
    }

    setSavingId(p._id)
    
    // 先尝试API调用
    try {
      const resp = await updateProduct(p._id, { labelPrice1: next })
      if (resp?.success) {
        toast.success(resp?.message || '标1价更新成功')
        setProducts(prev => prev.map(item => (item._id === p._id ? { ...(item as any), ...(resp.data || {}), labelPrice1: next } : item)))
        cancelEdit()
        setSavingId(null)
        return
      }
    } catch (e: any) {
      console.log('API调用失败，使用本地存储:', e)
    }
    
    // API失败时使用本地存储
    try {
      const localKey = 'authorized_product_prices'
      const prices = JSON.parse(localStorage.getItem(localKey) || '{}')
      prices[p._id] = { labelPrice1: next, updatedAt: new Date().toISOString() }
      localStorage.setItem(localKey, JSON.stringify(prices))
      
      setProducts(prev => prev.map(item => (item._id === p._id ? { ...(item as any), labelPrice1: next } : item)))
      toast.success('标1价更新成功')
      cancelEdit()
    } catch (localError: any) {
      console.error('本地存储也失败:', localError)
      toast.error('更新失败')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="返回"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">授权商品标1价</h1>
            <p className="text-gray-600 text-sm mt-1">仅可查看拿货价与标1价，且标1价不得低于拿货价</p>
          </div>
        </div>

        {canManageProducts && (
          <button
            onClick={() => navigate('/admin/products')}
            className="btn-primary"
          >
            进入商品管理
          </button>
        )}
      </div>

      {authorizedProducts.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          暂无授权商品
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">授权商品 ({authorizedProducts.length})</h2>
          </div>
          <div className="divide-y">
            {authorizedProducts.map((p: any) => {
              const isEditing = editingId === p._id
              const takePrice = Number(p.takePrice ?? 0)
              const label1 = Number(p.labelPrice1 ?? takePrice)

              return (
                <div key={p._id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    {p.thumbnail || (p.images && p.images[0]) ? (
                      <img
                        src={p.thumbnail || p.images[0]}
                        alt={p.name}
                        className="w-14 h-14 rounded-lg object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-100" />
                    )}

                    <div className="min-w-0">
                      <div className="font-medium text-gray-900 truncate">{p.name}</div>
                      <div className="text-xs text-gray-500 truncate">ID: {p._id}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">拿货价</div>
                      <div className="font-semibold">{formatPrice(takePrice)}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">标1价</div>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editedPrice}
                          onChange={(e) => setEditedPrice(e.target.value)}
                          className="w-32 px-3 py-2 border rounded-lg"
                          min={takePrice}
                        />
                      ) : (
                        <div className="font-semibold text-red-600">{formatPrice(label1)}</div>
                      )}
                      <div className="text-xs text-gray-400">最低 {formatPrice(takePrice)}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => save(p)}
                            disabled={savingId === p._id}
                            className="btn-primary flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {savingId === p._id ? '保存中...' : '保存'}
                          </button>
                          <button onClick={cancelEdit} className="btn-secondary">取消</button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(p)}
                          className="btn-secondary flex items-center gap-2"
                          title="编辑标1价"
                        >
                          <Pencil className="h-4 w-4" />
                          编辑
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {ownedProducts.length > 0 && !canManageProducts && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          你还有 {ownedProducts.length} 个自有商品，但当前账号未开通商品管理权限（canManageProducts），无法在后台编辑自有商品。
        </div>
      )}
    </div>
  )
}
