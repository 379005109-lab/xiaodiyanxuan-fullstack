import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, ProductSKU, ProductCategory, ProductStyle } from '@/types'

export interface SimplifiedCartSourceItem {
  id?: string
  name: string
  price: number
  quantity: number
  image?: string
  description?: string
}

interface CartState {
  items: CartItem[]
  // 代客下单模式
  conciergeMode: boolean
  conciergeOrderInfo?: {
    orderId: string
    customerName: string
    customerPhone: string
    orderSource?: string // 订单来源：'backend' 或 'self'
  }
  addItem: (product: Product, sku: ProductSKU, quantity?: number, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }, price?: number) => void
  removeItem: (productId: string, skuId: string, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => void
  updateQuantity: (productId: string, skuId: string, quantity: number, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  loadFromSimpleItems: (items: SimplifiedCartSourceItem[]) => void
  // 代客下单模式方法
  enterConciergeMode: (orderId: string, customerName: string, customerPhone: string, items: SimplifiedCartSourceItem[], orderSource?: string) => void
  exitConciergeMode: () => void
}

// 获取材质类别（与ProductDetailPage保持一致）
const getMaterialCategory = (materialName: string): string => {
  if (materialName.includes('普通皮')) return '普通皮'
  if (materialName.includes('全青皮')) return '全青皮'
  if (materialName.includes('牛皮')) return '牛皮'
  if (materialName.includes('绒布')) return '绒布'
  if (materialName.includes('麻布')) return '麻布'
  return 'other'
}

// 计算商品的最终价格和材质价格映射
const calculateItemPriceAndMaterials = (sku: ProductSKU, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }): { price: number; materialPriceMap: Record<string, number> } => {
  // 计算基础价格（优先显示折扣价）
  const basePrice = sku.discountPrice && sku.discountPrice > 0 && sku.discountPrice < sku.price
    ? sku.discountPrice
    : sku.price
  
  // 计算材质升级价格（使用类别匹配）
  const materialUpgradePrices = (sku as any).materialUpgradePrices || {}
  let upgradePrice = 0
  const materialPriceMap: Record<string, number> = {} // 保存每个材质的实际加价
  
  if (selectedMaterials) {
    const selectedMaterialList: string[] = []
    if (selectedMaterials.fabric) selectedMaterialList.push(selectedMaterials.fabric)
    if (selectedMaterials.filling) selectedMaterialList.push(selectedMaterials.filling)
    if (selectedMaterials.frame) selectedMaterialList.push(selectedMaterials.frame)
    if (selectedMaterials.leg) selectedMaterialList.push(selectedMaterials.leg)
    
    // 使用类别去重计算总价，同时保存每个材质的价格
    const addedCategories = new Set<string>()
    selectedMaterialList.forEach(matName => {
      const category = getMaterialCategory(matName)
      const price = materialUpgradePrices[category] || 0
      materialPriceMap[matName] = price // 保存材质名称到价格的映射
      if (!addedCategories.has(category)) {
        upgradePrice += price
        addedCategories.add(category)
      }
    })
  }
  
  return { price: basePrice + upgradePrice, materialPriceMap }
}

// 生成材质组合的唯一标识
const getMaterialKey = (materials?: { fabric?: string; filling?: string; frame?: string; leg?: string }): string => {
  if (!materials) return ''
  const parts: string[] = []
  if (materials.fabric) parts.push(`fabric:${materials.fabric}`)
  if (materials.filling) parts.push(`filling:${materials.filling}`)
  if (materials.frame) parts.push(`frame:${materials.frame}`)
  if (materials.leg) parts.push(`leg:${materials.leg}`)
  return parts.join('|')
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      conciergeMode: false,
      conciergeOrderInfo: undefined,
      
      addItem: (product, sku, quantity = 1, selectedMaterials, price) => {
        set((state) => {
          // 计算价格和材质价格映射
          const calculated = calculateItemPriceAndMaterials(sku, selectedMaterials)
          const itemPrice = price !== undefined ? price : calculated.price
          const materialPriceMap = calculated.materialPriceMap
          
          const materialKey = getMaterialKey(selectedMaterials)
          const existingItem = state.items.find(item => {
            const itemMaterialKey = getMaterialKey(item.selectedMaterials)
            return item.product._id === product._id && item.sku._id === sku._id && itemMaterialKey === materialKey
          })
          
          if (existingItem) {
            return {
              items: state.items.map(item => {
                const itemMaterialKey = getMaterialKey(item.selectedMaterials)
                return item.product._id === product._id && item.sku._id === sku._id && itemMaterialKey === materialKey
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              })
            }
          }
          
          return {
            items: [...state.items, { 
              product, 
              sku, 
              quantity, 
              price: itemPrice, 
              selectedMaterials,
              materialUpgradePrices: materialPriceMap // 保存每个材质的实际加价映射
            }]
          }
        })
      },
      
      removeItem: (productId, skuId, selectedMaterials) => {
        set((state) => {
          const materialKey = getMaterialKey(selectedMaterials)
          return {
            items: state.items.filter(item => {
              const itemMaterialKey = getMaterialKey(item.selectedMaterials)
              return !(item.product._id === productId && item.sku._id === skuId && itemMaterialKey === materialKey)
            })
          }
        })
      },
      
      updateQuantity: (productId, skuId, quantity, selectedMaterials) => {
        set((state) => {
          const materialKey = getMaterialKey(selectedMaterials)
          return {
            items: state.items.map(item => {
              const itemMaterialKey = getMaterialKey(item.selectedMaterials)
              return item.product._id === productId && item.sku._id === skuId && itemMaterialKey === materialKey
                ? { ...item, quantity }
                : item
            })
          }
        })
      },
      
      clearCart: () => set({ items: [] }),
      
      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0)
      },
      
      getTotalPrice: () => {
        return get().items.reduce((total, item) => {
          // 使用保存的价格（添加时的价格）
          return total + item.price * item.quantity
        }, 0)
      },

      loadFromSimpleItems: (simpleItems) => {
        const timestamp = new Date().toISOString()
        const mapped = simpleItems.map((item, index) => {
          const fallbackImage = item.image || '/placeholder.svg'
          const productId = item.id || `temp-product-${Date.now()}-${index}`
          const skuId = `${productId}-sku`
          const mockSku: ProductSKU = {
            _id: skuId,
            material: '默认',
            stock: 999,
            price: item.price,
            discountPrice: item.price,
            images: [fallbackImage],
          }

          const mockProduct: Product = {
            _id: productId,
            name: item.name,
            description: item.description || '代客下单生成的临时商品，修改后即可再次提交。',
            category: 'sofa' as ProductCategory,
            style: 'modern' as ProductStyle,
            basePrice: item.price,
            images: [fallbackImage],
            skus: [mockSku],
            isCombo: false,
            tags: ['代客下单'],
            specifications: {},
            status: 'active',
            views: 0,
            sales: 0,
            rating: 5,
            reviews: 0,
            order: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          }

          return {
            product: mockProduct,
            sku: mockSku,
            quantity: item.quantity,
            price: item.price,
          }
        })

        set({ items: mapped })
      },

      enterConciergeMode: (orderId, customerName, customerPhone, items, orderSource) => {
        // 清空购物车并加载订单商品
        const simpleItems = items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          description: item.description
        }))
        
        set((state) => {
          const timestamp = new Date().toISOString()
          const mapped = simpleItems.map((item, index) => {
            const fallbackImage = item.image || '/placeholder.svg'
            const productId = item.id || `temp-product-${Date.now()}-${index}`
            const skuId = `${productId}-sku`
            const mockSku: ProductSKU = {
              _id: skuId,
              material: '默认',
              stock: 999,
              price: item.price,
              discountPrice: item.price,
              images: [fallbackImage],
            }

            const mockProduct: Product = {
              _id: productId,
              name: item.name,
              description: item.description || '代客下单生成的临时商品，修改后即可再次提交。',
              category: 'sofa' as ProductCategory,
              style: 'modern' as ProductStyle,
              basePrice: item.price,
              images: [fallbackImage],
              skus: [mockSku],
              isCombo: false,
              tags: ['代客下单'],
              specifications: {},
              status: 'active',
              views: 0,
              sales: 0,
              rating: 5,
              reviews: 0,
              order: 0,
              createdAt: timestamp,
              updatedAt: timestamp,
            }

            return {
              product: mockProduct,
              sku: mockSku,
              quantity: item.quantity,
              price: item.price,
            }
          })

          return {
            items: mapped,
            conciergeMode: true,
            conciergeOrderInfo: {
              orderId,
              customerName,
              customerPhone,
              orderSource
            }
          }
        })
      },

      exitConciergeMode: () => {
        set({
          items: [],
          conciergeMode: false,
          conciergeOrderInfo: undefined
        })
      },
    }),
    {
      name: 'cart-storage',
    }
  )
)

