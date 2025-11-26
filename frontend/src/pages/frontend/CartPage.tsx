import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ArrowRight, Package, TrendingUp, Wallet, Tag } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore()
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === items.length ? [] : items.map(item => `${item.product._id}-${item.sku._id}`)
    )
  }

  const handleClearCart = () => {
    if (window.confirm('确定要清空购物车吗？')) {
      clearCart()
      setSelectedItems([])
    }
  }

  const handleCheckout = () => {
    const selected = items.filter(item => selectedItems.includes(`${item.product._id}-${item.sku._id}`))
    if (selected.length === 0) {
      alert('请选择要结算的商品')
      return
    }
    navigate('/checkout')
  }

  // 统计数据
  const totalTypes = items.length
  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const allTotalValue = getTotalPrice()
  const avgPrice = totalCount > 0 ? Math.round(allTotalValue / totalCount) : 0

  // 已选商品统计
  const selectedCartItems = items.filter(item => selectedItems.includes(`${item.product._id}-${item.sku._id}`))
  const selectedTotal = selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="animate-fade-in-up min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-12 pb-4">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">购物车</h1>
            <p className="text-stone-500 uppercase tracking-widest text-xs">Shopping Cart ({items.length})</p>
          </div>
          {items.length > 0 && (
            <button 
              onClick={handleClearCart}
              className="text-sm text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1 border-b border-transparent hover:border-red-500 pb-0.5"
            >
              <Trash2 className="w-3 h-3" /> 清空购物车
            </button>
          )}
        </div>


        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-stone-100">
            <p className="text-stone-400 font-serif italic mb-4">您的购物车是空的</p>
            <Link 
              to="/products"
              className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full hover:bg-green-900 transition-colors"
            >
              去选购商品 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 全选控制 */}
            <div className="bg-white p-4 rounded-xl border border-stone-100 flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={selectedItems.length === items.length && items.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                />
                <span className="font-medium text-stone-700">全选 ({items.length})</span>
              </label>
              <span className="text-sm text-stone-500">已选择 {selectedItems.length} 件商品</span>
            </div>

            {items.map((item, index) => {
              const itemKey = `${item.product._id}-${item.sku._id}`
              return (
              <div key={itemKey} className="bg-white p-4 md:p-6 rounded-2xl border border-stone-100 shadow-sm flex flex-col md:flex-row gap-6 items-center group hover:border-primary/20 transition-all">
                {/* Checkbox & Image */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(itemKey)} 
                    onChange={() => toggleSelect(itemKey)}
                    className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary cursor-pointer accent-primary"
                  />
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-stone-50 rounded-xl overflow-hidden border border-stone-200">
                    <img 
                      src={item.product?.images?.[0] ? getFileUrl(item.product.images[0]) : '/placeholder.svg'} 
                      alt={item.product?.name || '商品'} 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 w-full md:w-auto text-left">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-primary">{item.product?.name || '商品名称'}</h3>
                    <button 
                      onClick={() => removeItem(item.product._id, item.sku._id, item.selectedMaterials)} 
                      className="text-stone-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1 text-sm text-stone-500 mb-4">
                    <p>规格: <span className="text-stone-800">{item.sku?.spec || '标准规格'}</span></p>
                    {(() => {
                      // 调试日志
                      console.log('购物车商品:', item.product.name)
                      console.log('SKU:', item.sku)
                      console.log('选择的材质:', item.selectedMaterials)
                      console.log('材质升级价格:', (item.sku as any).materialUpgradePrices)
                      
                      if (!item.selectedMaterials) return null
                      
                      const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                      const materialParts: React.ReactNode[] = []
                      
                      // 面料
                      if (item.selectedMaterials.fabric) {
                        const fabricPrice = materialUpgradePrices[item.selectedMaterials.fabric] || 0
                        materialParts.push(
                          <span key="fabric">
                            {item.selectedMaterials.fabric}
                            {fabricPrice > 0 && <span className="text-red-600 font-semibold ml-1">+¥{fabricPrice}</span>}
                          </span>
                        )
                      }
                      
                      // 填充
                      if (item.selectedMaterials.filling) {
                        const fillingPrice = materialUpgradePrices[item.selectedMaterials.filling] || 0
                        if (materialParts.length > 0) materialParts.push(<span key="sep1">, </span>)
                        materialParts.push(
                          <span key="filling">
                            {item.selectedMaterials.filling}
                            {fillingPrice > 0 && <span className="text-red-600 font-semibold ml-1">+¥{fillingPrice}</span>}
                          </span>
                        )
                      }
                      
                      // 框架
                      if (item.selectedMaterials.frame) {
                        const framePrice = materialUpgradePrices[item.selectedMaterials.frame] || 0
                        if (materialParts.length > 0) materialParts.push(<span key="sep2">, </span>)
                        materialParts.push(
                          <span key="frame">
                            {item.selectedMaterials.frame}
                            {framePrice > 0 && <span className="text-red-600 font-semibold ml-1">+¥{framePrice}</span>}
                          </span>
                        )
                      }
                      
                      // 脚架
                      if (item.selectedMaterials.leg) {
                        const legPrice = materialUpgradePrices[item.selectedMaterials.leg] || 0
                        if (materialParts.length > 0) materialParts.push(<span key="sep3">, </span>)
                        materialParts.push(
                          <span key="leg">
                            {item.selectedMaterials.leg}
                            {legPrice > 0 && <span className="text-red-600 font-semibold ml-1">+¥{legPrice}</span>}
                          </span>
                        )
                      }
                      
                      return (
                        <p>材质: <span className="text-stone-800">{materialParts.length > 0 ? materialParts : '默认材质'}</span></p>
                      )
                    })()}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="font-serif font-bold text-xl text-accent">{formatPrice(item.price)}</div>
                    
                    <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg">
                      <button 
                        onClick={() => updateQuantity(item.product._id, item.sku._id, Math.max(1, item.quantity - 1), item.selectedMaterials)}
                        className="p-2 text-stone-500 hover:text-primary transition-colors disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-medium text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product._id, item.sku._id, item.quantity + 1, item.selectedMaterials)}
                        className="p-2 text-stone-500 hover:text-primary transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Bottom Checkout Bar */}
      {items.length > 0 && (
        <div className="bg-white border-t border-stone-200 p-6 mt-6">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-stone-500 text-sm hidden md:inline">已选 {selectedItems.length} 件商品</span>
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-primary">合计:</span>
                <span className="font-serif font-bold text-2xl text-accent">{formatPrice(selectedTotal)}</span>
              </div>
            </div>
            <button 
              onClick={handleCheckout}
              disabled={selectedItems.length === 0}
              className="bg-primary text-white px-8 py-3 rounded-full font-bold hover:bg-green-900 shadow-lg shadow-primary/20 transition-all transform hover:-translate-y-1 flex items-center gap-2 disabled:opacity-50 disabled:transform-none disabled:shadow-none"
            >
              立即结算
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
