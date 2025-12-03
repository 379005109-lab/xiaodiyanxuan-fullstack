import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ArrowRight, Package, TrendingUp, Wallet, Tag, Image, Download, X, Grid, List } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { getFileUrl } from '@/services/uploadService'
import html2canvas from 'html2canvas'
import { toast } from 'sonner'

export default function CartPage() {
  const navigate = useNavigate()
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore()
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  
  // 直接基于 items.length 决定是否显示结算栏，避免 useEffect 导致的闪烁
  const showCheckout = items.length > 0

  // 同步selectedItems，确保删除商品后状态正确
  useEffect(() => {
    if (items.length === 0) {
      setSelectedItems([])
      return
    }
    
    // 过滤掉已经不在购物车中的选中项
    const currentItemKeys = items.map(item => `${item.product._id}-${item.sku._id}`)
    setSelectedItems(prev => {
      const filtered = prev.filter(itemId => currentItemKeys.includes(itemId))
      // 如果过滤后为空，且购物车有商品，自动选中所有商品
      if (filtered.length === 0 && items.length > 0) {
        return currentItemKeys
      }
      return filtered
    })
  }, [items])

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

  // 生成图片相关状态
  const [showImagePreview, setShowImagePreview] = useState(false)
  const [imageOrientation, setImageOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const previewRef = useRef<HTMLDivElement>(null)

  // 生成商品图片
  const handleGenerateImage = async () => {
    if (selectedCartItems.length === 0) {
      toast.error('请选择要生成图片的商品')
      return
    }
    setShowImagePreview(true)
  }

  // 下载图片
  const handleDownloadImage = async () => {
    if (!previewRef.current) return
    
    try {
      toast.loading('正在生成图片...')
      
      const canvas = await html2canvas(previewRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      })
      
      const link = document.createElement('a')
      link.download = `商品清单_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      
      toast.dismiss()
      toast.success('图片已生成并下载')
    } catch (error) {
      toast.dismiss()
      toast.error('生成图片失败')
      console.error(error)
    }
  }

  // 计算图片尺寸和布局
  const getImageLayout = () => {
    const count = selectedCartItems.length
    if (imageOrientation === 'landscape') {
      // 横版 1280x720
      if (count <= 3) return { cols: count, width: 1280, height: 720 }
      if (count <= 6) return { cols: 3, width: 1280, height: 720 }
      return { cols: 4, width: 1280, height: 900 }
    } else {
      // 竖版 720x1280
      if (count <= 2) return { cols: 1, width: 720, height: 1280 }
      if (count <= 4) return { cols: 2, width: 720, height: 1280 }
      return { cols: 2, width: 720, height: 1600 }
    }
  }

  // 获取商品尺寸字符串
  const getProductSize = (item: typeof items[0]) => {
    const sku = item.sku
    if (sku?.length && sku?.width && sku?.height) {
      return `${sku.length}*${sku.width}*${sku.height}`
    }
    if (sku?.length && sku?.width) {
      return `${sku.length}*${sku.width}`
    }
    return sku?.spec || '标准规格'
  }

  // 判断是否为沙发类产品（作为主产品大显示）
  const isSofaProduct = (item: typeof items[0]) => {
    const name = item.product?.name?.toLowerCase() || ''
    const category = (item.product as any)?.category?.toLowerCase() || ''
    return name.includes('沙发') || category.includes('sofa') || category.includes('沙发')
  }

  // 分离主产品和普通产品
  const mainProducts = selectedCartItems.filter(isSofaProduct)
  const otherProducts = selectedCartItems.filter(item => !isSofaProduct(item))

  // 计算总价
  const totalPriceForImage = selectedCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <div className="animate-fade-in-up pb-32">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-primary mb-2">购物车</h1>
            <p className="text-stone-500 uppercase tracking-widest text-xs">Shopping Cart ({items.length})</p>
          </div>
          {items.length > 0 && (
            <div className="flex items-center gap-4">
              <button 
                onClick={handleGenerateImage}
                disabled={selectedItems.length === 0}
                className="text-sm text-primary hover:text-primary-700 transition-colors flex items-center gap-1 border border-primary rounded-lg px-3 py-1.5 hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Image className="w-4 h-4" /> 生成商品图片
              </button>
              <button 
                onClick={handleClearCart}
                className="text-sm text-stone-400 hover:text-red-500 transition-colors flex items-center gap-1 border-b border-transparent hover:border-red-500 pb-0.5"
              >
                <Trash2 className="w-3 h-3" /> 清空购物车
              </button>
            </div>
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
            {/* 全选控制 + 视图切换 */}
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
              <div className="flex items-center gap-4">
                <span className="text-sm text-stone-500">已选择 {selectedItems.length} 件商品</span>
                {/* 视图切换 */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    title="列表模式"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                    title="矩阵模式"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* 矩阵模式 */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((item) => {
                  const itemKey = `${item.product._id}-${item.sku._id}`
                  return (
                    <div key={itemKey} className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden hover:border-primary/30 transition-all group">
                      {/* 图片 */}
                      <div 
                        onClick={() => window.location.href = `/products/${item.product._id}`}
                        className="aspect-square bg-stone-50 cursor-pointer relative"
                      >
                        <img 
                          src={(item.sku?.images?.[0] || item.product?.images?.[0]) ? getFileUrl(item.sku?.images?.[0] || item.product.images[0]) : '/placeholder.svg'} 
                          alt={item.product?.name || '商品'} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                        />
                        {/* 选择框 */}
                        <div className="absolute top-2 left-2">
                          <input 
                            type="checkbox" 
                            checked={selectedItems.includes(itemKey)} 
                            onChange={() => toggleSelect(itemKey)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 rounded border-stone-300 text-primary focus:ring-primary cursor-pointer accent-primary bg-white"
                          />
                        </div>
                        {/* 删除 */}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            removeItem(item.product._id, item.sku._id, item.selectedMaterials)
                          }} 
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-stone-400 hover:text-red-500 hover:bg-white transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {/* 信息 */}
                      <div className="p-3">
                        <h3 className="font-medium text-sm text-primary line-clamp-1 mb-1">{item.product?.name}</h3>
                        <p className="text-xs text-stone-500 line-clamp-1 mb-2">{item.sku?.spec || '标准规格'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-red-600 font-bold">¥{formatPrice(item.price)}</span>
                          <span className="text-xs text-stone-400">×{item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 列表模式 */}
            {viewMode === 'list' && items.map((item, index) => {
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
                  <div 
                    onClick={() => window.location.href = `/products/${item.product._id}`}
                    className="w-24 h-24 md:w-32 md:h-32 bg-stone-50 rounded-xl overflow-hidden border border-stone-200 cursor-pointer hover:border-primary transition-colors"
                  >
                    <img 
                      src={(item.sku?.images?.[0] || item.product?.images?.[0]) ? getFileUrl(item.sku?.images?.[0] || item.product.images[0]) : '/placeholder.svg'} 
                      alt={item.product?.name || '商品'} 
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 w-full md:w-auto text-left">
                  <div className="flex justify-between items-start mb-2">
                    <h3 
                      onClick={() => window.location.href = `/products/${item.product._id}`}
                      className="font-bold text-lg text-primary cursor-pointer hover:text-accent transition-colors"
                    >
                      {item.product?.name || '商品名称'}
                    </h3>
                    <button 
                      onClick={() => removeItem(item.product._id, item.sku._id, item.selectedMaterials)} 
                      className="text-stone-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1 text-sm mb-4">
                    <p className="text-stone-500">规格: <span className="text-stone-800">{item.sku?.color || item.sku?.spec || '标准规格'}</span></p>
                    {/* 尺寸信息 */}
                    {(item.sku?.length || item.sku?.width || item.sku?.height) && (
                      <p className="text-stone-500">尺寸: <span className="text-stone-800">{item.sku.length || '-'}×{item.sku.width || '-'}×{item.sku.height || '-'} CM</span></p>
                    )}
                    {/* 材质信息 - 动态遍历所有材质类目 */}
                    {item.selectedMaterials && Object.keys(item.selectedMaterials).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(item.selectedMaterials).map(([category, material]) => {
                          if (!material) return null
                          const upgradePrice = item.materialUpgradePrices?.[category] || 0
                          return (
                            <span key={category} className="inline-flex items-center px-2 py-0.5 bg-stone-100 text-stone-600 text-xs rounded">
                              {material as string}
                              {upgradePrice > 0 && (
                                <span className="text-red-600 font-semibold ml-1">+¥{upgradePrice}</span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-red-600">{formatPrice(item.price)}</div>
                      {(() => {
                        // 计算材质升级总价
                        const materialUpgradePrices = item.materialUpgradePrices || {}  // 使用保存的升级价格
                        let totalUpgradePrice = 0
                        if (item.selectedMaterials) {
                          const selectedMaterialList: string[] = []
                          if (item.selectedMaterials.fabric) selectedMaterialList.push(item.selectedMaterials.fabric)
                          if (item.selectedMaterials.filling) selectedMaterialList.push(item.selectedMaterials.filling)
                          if (item.selectedMaterials.frame) selectedMaterialList.push(item.selectedMaterials.frame)
                          if (item.selectedMaterials.leg) selectedMaterialList.push(item.selectedMaterials.leg)
                          
                          totalUpgradePrice = selectedMaterialList.reduce((sum, matName) => {
                            return sum + (materialUpgradePrices[matName] || 0)
                          }, 0)
                        }
                        
                        if (totalUpgradePrice > 0) {
                          return (
                            <div className="text-xs text-gray-500 mt-1">
                              (含材质升级 +{formatPrice(totalUpgradePrice)})
                            </div>
                          )
                        }
                        return null
                      })()}
                    </div>
                    
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
      
      {/* 图片预览弹窗 */}
      {showImagePreview && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-2xl max-w-full max-h-[95vh] overflow-auto shadow-2xl">
            {/* 弹窗头部 */}
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <h3 className="font-bold text-lg">商品清单预览</h3>
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setImageOrientation('landscape')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      imageOrientation === 'landscape' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    横版
                  </button>
                  <button
                    onClick={() => setImageOrientation('portrait')}
                    className={`px-3 py-1 text-sm rounded-md transition-colors ${
                      imageOrientation === 'portrait' ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    竖版
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Download className="w-4 h-4" /> 下载图片
                </button>
                <button
                  onClick={() => setShowImagePreview(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* 图片预览内容 */}
            <div className="p-6 flex justify-center">
              <div
                ref={previewRef}
                style={{
                  width: getImageLayout().width,
                  minHeight: getImageLayout().height,
                  backgroundColor: '#ffffff',
                  padding: '40px'
                }}
              >
                {/* 标题 - 显示数量和总价 */}
                <div className="text-center mb-8">
                  <h1 style={{ fontSize: '48px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '8px' }}>
                    {selectedCartItems.length}件套：{totalPriceForImage.toLocaleString()}
                  </h1>
                </div>
                
                {/* 主产品（沙发类）- 大图显示 */}
                {mainProducts.length > 0 && (
                  <div className="mb-8">
                    {mainProducts.map((item) => (
                      <div key={`main-${item.product._id}-${item.sku._id}`} className="flex items-center gap-8">
                        {/* 主产品图片 - 占据大部分空间 */}
                        <div style={{ width: '60%', aspectRatio: '4/3' }} className="bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                          <img
                            src={(item.sku?.images?.[0] || item.product?.images?.[0]) ? getFileUrl(item.sku?.images?.[0] || item.product.images[0]) : '/placeholder.svg'}
                            alt={item.product?.name}
                            className="max-w-full max-h-full object-contain"
                            crossOrigin="anonymous"
                          />
                        </div>
                        {/* 主产品信息 */}
                        <div className="flex-1 text-right">
                          <h2 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '12px' }}>
                            {item.product?.name}
                          </h2>
                          <p style={{ fontSize: '20px', color: '#666', marginBottom: '8px' }}>
                            size: {getProductSize(item)}
                          </p>
                          <p style={{ fontSize: '14px', color: '#999', lineHeight: '1.6' }}>
                            Italian minimalist furniture<br/>
                            I have everything
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 其他产品 - 小图网格 */}
                {otherProducts.length > 0 && (
                  <div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: `repeat(${Math.min(otherProducts.length, 5)}, 1fr)` }}
                  >
                    {otherProducts.map((item) => (
                      <div key={`other-${item.product._id}-${item.sku._id}`} className="text-center">
                        {/* 商品图片 */}
                        <div className="bg-gray-50 rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1' }}>
                          <img
                            src={(item.sku?.images?.[0] || item.product?.images?.[0]) ? getFileUrl(item.sku?.images?.[0] || item.product.images[0]) : '/placeholder.svg'}
                            alt={item.product?.name}
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                          />
                        </div>
                        {/* 商品名称 */}
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '4px' }}>
                          {item.product?.name}
                        </h3>
                        {/* 尺寸 */}
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          size: {getProductSize(item)}
                        </p>
                        {/* 底部标识 */}
                        <p style={{ fontSize: '10px', color: '#999' }}>
                          xiaodiyanxuan
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 如果没有主产品，全部用网格显示 */}
                {mainProducts.length === 0 && (
                  <div
                    className="grid gap-6"
                    style={{ gridTemplateColumns: `repeat(${getImageLayout().cols}, 1fr)` }}
                  >
                    {selectedCartItems.map((item) => (
                      <div key={`all-${item.product._id}-${item.sku._id}`} className="text-center">
                        {/* 商品图片 */}
                        <div className="bg-gray-50 rounded-lg overflow-hidden mb-3" style={{ aspectRatio: '1' }}>
                          <img
                            src={(item.sku?.images?.[0] || item.product?.images?.[0]) ? getFileUrl(item.sku?.images?.[0] || item.product.images[0]) : '/placeholder.svg'}
                            alt={item.product?.name}
                            className="w-full h-full object-contain"
                            crossOrigin="anonymous"
                          />
                        </div>
                        {/* 商品名称 */}
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a1a1a', marginBottom: '4px' }}>
                          {item.product?.name}
                        </h3>
                        {/* 尺寸 */}
                        <p style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                          size: {getProductSize(item)}
                        </p>
                        {/* 底部标识 */}
                        <p style={{ fontSize: '10px', color: '#999' }}>
                          xiaodiyanxuan
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Checkout Bar */}
      {showCheckout && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 p-6 shadow-lg z-[100]">
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
