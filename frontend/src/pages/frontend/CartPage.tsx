import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, AlertCircle, Truck, Clock, Shield, TrendingUp } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/utils'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { useState, useEffect, useMemo } from 'react'
import CheckoutModal from '@/components/frontend/CheckoutModal'
import { getFileUrl } from '@/services/uploadService'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart, conciergeMode, conciergeOrderInfo, exitConciergeMode, enterConciergeMode } = useCartStore()
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [conciergePhone, setConciergePhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 检查sessionStorage中的代客下单数据（用于跨标签页恢复）
  useEffect(() => {
    if (!conciergeMode) {
      const conciergeData = sessionStorage.getItem('conciergeOrderData')
      if (conciergeData) {
        try {
          const data = JSON.parse(conciergeData)
          enterConciergeMode(data.orderId, data.customerName, data.customerPhone, data.items, data.orderSource)
          sessionStorage.removeItem('conciergeOrderData')
        } catch (error) {
          console.error('恢复代客下单数据失败:', error)
        }
      }
    }
  }, [])

  // 计算单个商品的价格
  // 注意：现在使用保存的价格（添加时的价格），而不是动态计算
  const getItemPrice = (item: any) => {
    // 如果有保存的价格，直接使用
    if (item.price !== undefined) {
      // 为了显示折扣信息，仍然需要计算基础价格和升级价格
      const basePrice = item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price
        ? item.sku.discountPrice
        : item.sku.price
      
      const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
      let upgradePrice = 0
      if (item.selectedMaterials) {
        const selectedMaterialList: string[] = []
        if (item.selectedMaterials.fabric) selectedMaterialList.push(item.selectedMaterials.fabric)
        if (item.selectedMaterials.filling) selectedMaterialList.push(item.selectedMaterials.filling)
        if (item.selectedMaterials.frame) selectedMaterialList.push(item.selectedMaterials.frame)
        if (item.selectedMaterials.leg) selectedMaterialList.push(item.selectedMaterials.leg)
        
        upgradePrice = selectedMaterialList.reduce((sum, matName) => {
          return sum + (materialUpgradePrices[matName] || 0)
        }, 0)
      }
      
      return {
        basePrice,
        upgradePrice,
        finalPrice: item.price, // 使用保存的价格
        originalPrice: item.sku.price
      }
    }
    
    // 向后兼容：如果没有保存的价格，则动态计算
    const basePrice = item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price
      ? item.sku.discountPrice
      : item.sku.price
    
    const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
    let upgradePrice = 0
    if (item.selectedMaterials) {
      const selectedMaterialList: string[] = []
      if (item.selectedMaterials.fabric) selectedMaterialList.push(item.selectedMaterials.fabric)
      if (item.selectedMaterials.filling) selectedMaterialList.push(item.selectedMaterials.filling)
      if (item.selectedMaterials.frame) selectedMaterialList.push(item.selectedMaterials.frame)
      if (item.selectedMaterials.leg) selectedMaterialList.push(item.selectedMaterials.leg)
      
      upgradePrice = selectedMaterialList.reduce((sum, matName) => {
        return sum + (materialUpgradePrices[matName] || 0)
      }, 0)
    }
    
    return {
      basePrice,
      upgradePrice,
      finalPrice: basePrice + upgradePrice,
      originalPrice: item.sku.price
    }
  }

  const handleUpdateQuantity = (item: any, delta: number) => {
    const newQuantity = item.quantity + delta
    if (newQuantity > 0 && newQuantity <= item.sku.stock) {
      updateQuantity(item.product._id, item.sku._id, newQuantity, item.selectedMaterials)
    }
  }

  const handleRemoveItem = (item: any) => {
    removeItem(item.product._id, item.sku._id, item.selectedMaterials)
    toast.success('已从购物车删除')
  }

  const handleClearCart = () => {
    if (confirm('确定要清空购物车吗？')) {
      clearCart()
      toast.success('购物车已清空')
    }
  }

  // 计算购物车统计信息
  const cartStats = useMemo(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
    const totalPrice = getTotalPrice()
    const avgPrice = items.length > 0 ? Math.round(totalPrice / items.length) : 0
    return {
      itemCount: items.length,
      totalItems,
      totalPrice,
      avgPrice,
    }
  }, [items, getTotalPrice])

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="container-custom text-center">
          <div className="max-w-md mx-auto">
            <div className="w-32 h-32 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="h-16 w-16 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold mb-4">购物车是空的</h2>
            <p className="text-gray-600 mb-8">还没有添加任何商品，快去逛逛吧！</p>
            <Link to="/products" className="btn-primary inline-block">
              去购物
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* 代客下单提示 */}
        {conciergeMode && conciergeOrderInfo && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-blue-900">代客下单模式</p>
              <p className="text-sm text-blue-700 mt-1">
                您正在为{conciergeOrderInfo.orderSource === 'backend' ? '后台推送：' : ''}<span className="font-bold">{conciergeOrderInfo.customerName}</span> 代客下单
              </p>
            </div>
          </motion.div>
        )}

        {/* 购物车头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">购物车</h1>
          
          {/* 购物车统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '商品种类', value: cartStats.itemCount, icon: ShoppingBag, color: 'text-blue-600' },
              { label: '商品总数', value: cartStats.totalItems, icon: TrendingUp, color: 'text-green-600' },
              { label: '合计金额', value: formatPrice(cartStats.totalPrice), icon: AlertCircle, color: 'text-red-600' },
              { label: '平均价格', value: formatPrice(cartStats.avgPrice), icon: Clock, color: 'text-purple-600' },
            ].map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-lg bg-white border border-gray-200"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                    <p className="text-xs text-gray-600">{stat.label}</p>
                  </div>
                  <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 购物车列表 */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, index) => {
              const priceInfo = getItemPrice(item)
              const hasDiscount = item.sku.discountPrice && item.sku.discountPrice > 0 && item.sku.discountPrice < item.sku.price
              
              return (
                <motion.div
                  key={`${item.product._id}-${item.sku._id}-${JSON.stringify(item.selectedMaterials)}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card flex flex-col sm:flex-row gap-6"
                >
                  {/* 商品图片 */}
                  <Link to={`/products/${item.product._id}`} className="flex-shrink-0">
                    <img
                      src={getFileUrl(item.sku.images?.[0] || item.product.images?.[0] || '/placeholder.png')}
                      alt={item.product.name}
                      className="w-full sm:w-32 h-32 object-cover rounded-lg"
                    />
                  </Link>

                  {/* 商品信息 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Link to={`/products/${item.product._id}`} className="flex-1">
                        <h3 className="font-semibold text-lg hover:text-primary-600 transition-colors">
                          {item.product.name}
                        </h3>
                        {item.sku.isPro && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs rounded">
                            PRO版
                          </span>
                        )}
                      </Link>
                    </div>
                    
                    {/* 完整商品信息 */}
                    <div className="text-sm text-gray-600 space-y-1 mb-3">
                      {item.sku.code && <p>型号: {item.sku.code}</p>}
                      {item.sku.spec && <p>规格: {item.sku.spec}</p>}
                      {item.sku.length && item.sku.width && item.sku.height && (
                        <p>尺寸: {item.sku.length}×{item.sku.width}×{item.sku.height} CM</p>
                      )}
                      
                      {/* 材质信息 - 分别显示面料、填充、框架、脚架 */}
                      {item.selectedMaterials && (
                        <>
                          {item.selectedMaterials.fabric && (
                            <p>面料: 
                              <span>{item.selectedMaterials.fabric}</span>
                              {(item.sku as any).materialUpgradePrices?.[item.selectedMaterials.fabric] > 0 && (
                                <span className="text-red-600 font-semibold ml-1">(材质升级+¥{(item.sku as any).materialUpgradePrices[item.selectedMaterials.fabric]})</span>
                              )}
                            </p>
                          )}
                          {item.selectedMaterials.filling && (
                            <p>填充: 
                              <span>{item.selectedMaterials.filling}</span>
                              {(item.sku as any).materialUpgradePrices?.[item.selectedMaterials.filling] > 0 && (
                                <span className="text-red-600 font-semibold ml-1">(材质升级+¥{(item.sku as any).materialUpgradePrices[item.selectedMaterials.filling]})</span>
                              )}
                            </p>
                          )}
                          {item.selectedMaterials.frame && (
                            <p>框架: 
                              <span>{item.selectedMaterials.frame}</span>
                              {(item.sku as any).materialUpgradePrices?.[item.selectedMaterials.frame] > 0 && (
                                <span className="text-red-600 font-semibold ml-1">(材质升级+¥{(item.sku as any).materialUpgradePrices[item.selectedMaterials.frame]})</span>
                              )}
                            </p>
                          )}
                          {item.selectedMaterials.leg && (
                            <p>脚架: 
                              <span>{item.selectedMaterials.leg}</span>
                              {(item.sku as any).materialUpgradePrices?.[item.selectedMaterials.leg] > 0 && (
                                <span className="text-red-600 font-semibold ml-1">(材质升级+¥{(item.sku as any).materialUpgradePrices[item.selectedMaterials.leg]})</span>
                              )}
                            </p>
                          )}
                        </>
                      )}
                      
                      {/* 如果没有selectedMaterials，显示SKU中的材质 */}
                      {!item.selectedMaterials && (
                        <>
                          {typeof item.sku.material === 'string' ? (
                            <p>材质: {item.sku.material}</p>
                          ) : item.sku.material && typeof item.sku.material === 'object' ? (
                            <>
                              {(item.sku.material as any).fabric && (
                                <p>面料: {
                                  (() => {
                                    const fabricName = Array.isArray((item.sku.material as any).fabric) 
                                      ? (item.sku.material as any).fabric[0] 
                                      : (item.sku.material as any).fabric
                                    const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                                    
                                    // 尝试精确匹配
                                    let upgradePrice = materialUpgradePrices[fabricName]
                                    
                                    // 如果没有精确匹配，尝试模糊匹配（去除空格、颜色等）
                                    if (!upgradePrice) {
                                      const fabricBase = fabricName.split(/\s+/)[0] // 取第一个词，如"全青皮 白色" → "全青皮"
                                      upgradePrice = materialUpgradePrices[fabricBase]
                                      
                                      // 如果还是没有，遍历所有key查找包含关系
                                      if (!upgradePrice) {
                                        for (const [key, price] of Object.entries(materialUpgradePrices)) {
                                          if (fabricName.includes(key) || key.includes(fabricName)) {
                                            upgradePrice = price as number
                                            break
                                          }
                                        }
                                      }
                                    }
                                    
                                    return (
                                      <>
                                        <span>{fabricName}</span>
                                        {upgradePrice > 0 && (
                                          <span className="text-red-600 font-semibold ml-1">(材质升级+¥{upgradePrice})</span>
                                        )}
                                      </>
                                    )
                                  })()
                                }</p>
                              )}
                              {(item.sku.material as any).filling && (
                                <p>填充: {
                                  (() => {
                                    const fillingName = Array.isArray((item.sku.material as any).filling) 
                                      ? (item.sku.material as any).filling[0] 
                                      : (item.sku.material as any).filling
                                    const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                                    
                                    let upgradePrice = materialUpgradePrices[fillingName]
                                    if (!upgradePrice) {
                                      const fillingBase = fillingName.split(/\s+/)[0]
                                      upgradePrice = materialUpgradePrices[fillingBase]
                                      if (!upgradePrice) {
                                        for (const [key, price] of Object.entries(materialUpgradePrices)) {
                                          if (fillingName.includes(key) || key.includes(fillingName)) {
                                            upgradePrice = price as number
                                            break
                                          }
                                        }
                                      }
                                    }
                                    
                                    return (
                                      <>
                                        <span>{fillingName}</span>
                                        {upgradePrice > 0 && (
                                          <span className="text-red-600 font-semibold ml-1">(材质升级+¥{upgradePrice})</span>
                                        )}
                                      </>
                                    )
                                  })()
                                }</p>
                              )}
                              {(item.sku.material as any).frame && (
                                <p>框架: {
                                  (() => {
                                    const frameName = Array.isArray((item.sku.material as any).frame) 
                                      ? (item.sku.material as any).frame[0] 
                                      : (item.sku.material as any).frame
                                    const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                                    
                                    let upgradePrice = materialUpgradePrices[frameName]
                                    if (!upgradePrice) {
                                      const frameBase = frameName.split(/\s+/)[0]
                                      upgradePrice = materialUpgradePrices[frameBase]
                                      if (!upgradePrice) {
                                        for (const [key, price] of Object.entries(materialUpgradePrices)) {
                                          if (frameName.includes(key) || key.includes(frameName)) {
                                            upgradePrice = price as number
                                            break
                                          }
                                        }
                                      }
                                    }
                                    
                                    return (
                                      <>
                                        <span>{frameName}</span>
                                        {upgradePrice > 0 && (
                                          <span className="text-red-600 font-semibold ml-1">(材质升级+¥{upgradePrice})</span>
                                        )}
                                      </>
                                    )
                                  })()
                                }</p>
                              )}
                              {(item.sku.material as any).leg && (
                                <p>脚架: {
                                  (() => {
                                    const legName = Array.isArray((item.sku.material as any).leg) 
                                      ? (item.sku.material as any).leg[0] 
                                      : (item.sku.material as any).leg
                                    const materialUpgradePrices = (item.sku as any).materialUpgradePrices || {}
                                    
                                    let upgradePrice = materialUpgradePrices[legName]
                                    if (!upgradePrice) {
                                      const legBase = legName.split(/\s+/)[0]
                                      upgradePrice = materialUpgradePrices[legBase]
                                      if (!upgradePrice) {
                                        for (const [key, price] of Object.entries(materialUpgradePrices)) {
                                          if (legName.includes(key) || key.includes(legName)) {
                                            upgradePrice = price as number
                                            break
                                          }
                                        }
                                      }
                                    }
                                    
                                    return (
                                      <>
                                        <span>{legName}</span>
                                        {upgradePrice > 0 && (
                                          <span className="text-red-600 font-semibold ml-1">(材质升级+¥{upgradePrice})</span>
                                        )}
                                      </>
                                    )
                                  })()
                                }</p>
                              )}
                            </>
                          ) : null}
                        </>
                      )}
                      
                      {/* PRO特性 */}
                      {item.sku.isPro && item.sku.proFeature && (
                        <div className="mt-2 p-2 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded text-xs">
                          <span className="font-semibold">PRO特性: </span>
                          <span className="text-red-600 font-bold">{item.sku.proFeature}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 价格和操作 */}
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-bold text-red-600">
                            {formatPrice(priceInfo.finalPrice)}
                          </span>
                          {hasDiscount && (
                            <span className="text-sm text-gray-400 line-through">
                              {formatPrice(priceInfo.originalPrice + priceInfo.upgradePrice)}
                            </span>
                          )}
                        </div>
                        {priceInfo.upgradePrice > 0 && (
                          <span className="text-xs text-red-600 font-bold mt-1">
                            含材质升级 +{formatPrice(priceInfo.upgradePrice)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(item, -1)}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item, 1)}
                            className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-50"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            {/* 清空购物车 */}
            <button
              onClick={handleClearCart}
              className="text-sm text-red-600 hover:text-red-700 transition-colors"
            >
              清空购物车
            </button>
          </div>

          {/* 订单摘要 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="card sticky top-24"
            >
              <h2 className="text-xl font-semibold mb-6">订单摘要</h2>
              
              {/* 订单信息 */}
              <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">商品种类</span>
                  <span className="font-medium">{cartStats.itemCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">商品总数</span>
                  <span className="font-medium">{cartStats.totalItems}</span>
                </div>
              </div>
              
              {/* 价格明细 */}
              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>商品总计</span>
                  <span className="text-red-600 font-bold">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>运费</span>
                  <span className="text-green-600 font-medium">免费</span>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>合计</span>
                    <span className="text-red-600 font-bold">{formatPrice(getTotalPrice())}</span>
                  </div>
                </div>
              </div>

              {/* 配送信息 */}
              <div className="mb-6 p-3 bg-gray-50 rounded-lg space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Truck className="h-4 w-4" />
                  <span>免费送货</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>3-5个工作日送达</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>7天无理由退货</span>
                </div>
              </div>

              {/* 代客下单模式：提交代客下单 */}
              {conciergeMode && conciergeOrderInfo ? (
                <div className="space-y-3 mb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      输入客户电话号码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={conciergePhone}
                      onChange={(e) => setConciergePhone(e.target.value)}
                      placeholder="请输入客户电话号码"
                      maxLength={11}
                      className="input w-full mb-3"
                    />
                    <p className="text-xs text-blue-600 mb-3">
                      客户名称：{conciergeOrderInfo.customerName}
                    </p>
                    <button
                      onClick={async () => {
                        // 验证电话号码
                        const phoneRegex = /^1[3-9]\d{9}$/
                        if (!conciergePhone) {
                          toast.error('请输入客户电话号码')
                          return
                        }
                        if (!phoneRegex.test(conciergePhone)) {
                          toast.error('请输入正确的客户电话号码')
                          return
                        }
                        if (conciergePhone !== conciergeOrderInfo.customerPhone) {
                          toast.error('客户电话号码不匹配，请重新输入')
                          return
                        }

                        setSubmitting(true)
                        try {
                          // 构建订单数据
                          const orderData = {
                            id: `concierge-${Date.now()}`,
                            orderNo: `CONCIERGE${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                            items: items.map(item => ({
                              productName: item.product.name,
                              quantity: item.quantity,
                              price: item.price,
                              productId: item.product._id
                            })),
                            totalAmount: getTotalPrice(),
                            conciergeOrderId: conciergeOrderInfo.orderId,
                            customerPhone: conciergeOrderInfo.customerPhone,
                            customerName: conciergeOrderInfo.customerName,
                            status: 'pending',
                            paymentStatus: 'pending',
                            shippingStatus: 'pending',
                            source: 'backend',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          }

                          // 保存到本地订单列表（模拟后端订单）
                          const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]')
                          localOrders.push(orderData)
                          localStorage.setItem('local_orders', JSON.stringify(localOrders))
                          console.log('✅ 代客下单已保存到本地订单列表')

                          // 保存到localStorage代客订单备份
                          const conciergeOrders = JSON.parse(localStorage.getItem('concierge_orders') || '[]')
                          conciergeOrders.push(orderData)
                          localStorage.setItem('concierge_orders', JSON.stringify(conciergeOrders))

                          // 如果是通过设计师/管理员账号推送，也保存到推荐客户订单中
                          const referredOrders = JSON.parse(localStorage.getItem('designer_referred_orders') || '[]')
                          const referredOrder = {
                            id: `referred-${Date.now()}`,
                            orderNumber: `REF${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                            customerName: conciergeOrderInfo.customerName,
                            referralLink: `${window.location.origin}/share/product/concierge-${conciergeOrderInfo.orderId}`,
                            totalAmount: getTotalPrice(),
                            commission: Math.round(getTotalPrice() * 0.1 * 100) / 100, // 计算佣金但不显示比例
                            status: 'pending', // 改为待提交，等客户付款后才更新
                            createdAt: new Date().toISOString(),
                            items: orderData.items
                          }
                          referredOrders.push(referredOrder)
                          localStorage.setItem('designer_referred_orders', JSON.stringify(referredOrders))

                          toast.success(`订单已推送给客户 ${conciergeOrderInfo.customerName}`)
                          
                          // 清空购物车并退出代客模式
                          clearCart()
                          exitConciergeMode()
                          setConciergePhone('')
                        } catch (error) {
                          console.error('推送订单失败:', error)
                          toast.error('推送订单失败')
                        } finally {
                          setSubmitting(false)
                        }
                      }}
                      disabled={submitting}
                      className="btn-primary w-full"
                    >
                      {submitting ? '提交中...' : '提交代客下单'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => {
                      exitConciergeMode()
                      clearCart()
                      toast.info('已退出代客下单模式')
                    }}
                    className="btn-secondary w-full"
                  >
                    退出代客下单
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowCheckoutModal(true)}
                    className="btn-primary w-full mb-4"
                  >
                    去结算
                  </button>

                  <Link to="/products" className="btn-secondary w-full block text-center">
                    继续购物
                  </Link>
                </>
              )}

            </motion.div>
          </div>
        </div>
      </div>
      
      {/* 结算弹窗 */}
      {showCheckoutModal && !conciergeMode && (
        <CheckoutModal
          onClose={() => setShowCheckoutModal(false)}
        />
      )}
    </div>
  )
}

