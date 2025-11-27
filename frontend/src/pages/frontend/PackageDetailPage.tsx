import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Plus, Minus, X, AlertCircle, ChevronLeft, ChevronRight, Check, Sparkles, ShieldCheck, ArrowLeft, ImageIcon, Layers3, Loader2, Maximize2, CheckCircle2 } from 'lucide-react'
import { PackagePlan, PackageProductMaterial } from '@/types'
import { getAllPackages } from '@/services/packageService'
import { getAllMaterials } from '@/services/materialService'
import { getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'
import { createCustomerOrder } from '@/services/customerOrderService'
import axios from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'

// 从PackagePlan中提取Category和Product类型
type PackageCategory = PackagePlan['categories'][number]
type PackageProduct = PackageCategory['products'][number]
type PackageProductOption = any

type SelectionMap = Record<string, string[]>
type MaterialSelectionMap = Record<string, Record<string, string>>
type QuantityMap = Record<string, number>

const MATERIAL_PREMIUM_RULES: { keyword: string; extra: number }[] = [
  { keyword: '进口', extra: 1200 },
  { keyword: '真皮', extra: 1500 },
  { keyword: '航空铝', extra: 900 },
  { keyword: '高密度', extra: 800 },
  { keyword: '实木', extra: 700 },
]

// 材质字段中英文映射
const MATERIAL_NAMES: Record<string, string> = {
  fabric: '面料',
  filling: '填充',
  frame: '框架',
  leg: '脚架',
}

// 新UI配色方案
const PRIMARY_COLOR = '#14452F' // 深森林绿
const PRIMARY_LIGHT = '#E8F5E9' // 浅绿
const ACCENT_COLOR = '#D6AD60' // 复古金
const MIN_QUANTITY = 1
const MAX_QUANTITY = 5

const formatCurrency = (value: number) => `¥${value.toLocaleString()}`

const getMaterialPreviewImage = (product: PackageProduct, option: string, materialImageMap: Record<string, string>) => {
  console.log('getMaterialPreviewImage called:', { option, materialImageMapKeys: Object.keys(materialImageMap), product: product.name })
  
  // 1. 优先从材质管理中获取图片（完全匹配）
  if (materialImageMap[option]) {
    console.log('Found exact match in materialImageMap:', materialImageMap[option])
    return getFileUrl(materialImageMap[option])
  }
  
  // 2. 尝试模糊匹配材质管理中的图片（对于"全青皮-红色"匹配"全青皮"等情况）
  for (const [materialName, imagePath] of Object.entries(materialImageMap)) {
    // 检查材质名称是否包含在选项中，或者选项是否包含材质名称
    if (option.includes(materialName) || materialName.includes(option)) {
      console.log('Found fuzzy match in materialImageMap:', materialName, '->', imagePath)
      return getFileUrl(imagePath)
    }
  }
  
  // 3. 从商品的materialImages中获取
  if (product.materialImages?.[option]) {
    console.log('Found in product.materialImages:', product.materialImages[option])
    return getFileUrl(product.materialImages[option])
  }
  
  // 4. 从SKU的materialImages中获取
  if (product.skus) {
    for (const sku of product.skus) {
      if (sku.materialImages?.[option]) {
        console.log('Found in sku.materialImages:', sku.materialImages[option])
        return getFileUrl(sku.materialImages[option])
      }
    }
  }
  
  console.log('Using fallback image for:', option)
  // 如果商品有默认图片，使用商品图片；否则使用placeholder
  if (product.image) {
    return getFileUrl(product.image)
  }
  return '/placeholder.svg'
}

interface OrderConfirmModalProps {
  pkg: PackagePlan
  selectionGroups: PackageCategory[]
  totalPrice: number
  note: string
  contact: { name: string; phone: string; address: string }
  onChange: (field: 'name' | 'phone' | 'address', value: string) => void
  onClose: () => void
  onSubmit: () => void
  submitting: boolean
}

function OrderConfirmModal({
  pkg,
  selectionGroups,
  totalPrice,
  note,
  contact,
  onChange,
  onClose,
  onSubmit,
  submitting,
}: OrderConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 py-8">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs text-gray-400">确认套餐订单</p>
            <h3 className="text-2xl font-semibold text-gray-900">{pkg.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6 p-6">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">联系信息</h4>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500 mb-1 block">联系人</label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => onChange('name', e.target.value)}
                  className="input w-full"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">联系电话</label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => onChange('phone', e.target.value)}
                  className="input w-full"
                  placeholder="请输入手机号码"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500 mb-1 block">联系地址</label>
                <textarea
                  value={contact.address}
                  onChange={(e) => onChange('address', e.target.value)}
                  className="input w-full"
                  rows={3}
                  placeholder="请输入项目地址"
                />
              </div>
            </div>
            {note && (
              <div className="p-4 rounded-2xl bg-gray-50 text-sm text-gray-600">
                <p className="font-semibold text-gray-800 mb-1">备注</p>
                {note}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">配置确认</h4>
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2">
              {selectionGroups.map((group) => (
                <div key={group.key} className="border border-gray-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-gray-900">{group.name}</p>
                    <span className="text-xs text-gray-500">需 {group.required}</span>
                  </div>
                  {group.products.length === 0 ? (
                    <p className="text-xs text-gray-400">未选择</p>
                  ) : (
                    <div className="space-y-2">
                      {group.products.map((item) => (
                        <div key={item.id} className="text-sm text-gray-600">
                          <p className="font-semibold text-gray-900">
                            {item.name} <span className="text-xs text-gray-500">× {item.quantity}</span>
                          </p>
                          {item.materials && (
                            <p className="text-xs text-gray-500">
                              {Object.entries(item.materials)
                                .map(([key, value]) => `${key.toUpperCase()}·${value}`)
                                .join(' / ')}
                            </p>
                          )}
                          {item.materialUpgrade ? (
                            <p className="text-xs text-red-600">材质升级 +{formatCurrency(item.materialUpgrade)}</p>
                          ) : (
                            <p className="text-xs text-green-600">基础配置</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>套餐基础价</span>
                <span className="font-semibold text-red-600">{formatCurrency(pkg.price)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>材质升级</span>
                <span className="font-semibold text-red-600">{formatCurrency(totalPrice - pkg.price)}</span>
              </div>
              <div className="flex items-center justify-between text-xl font-bold text-red-600">
                <span>预计合计</span>
                <span>{formatCurrency(totalPrice)}</span>
              </div>
            </div>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className={`w-full py-3 rounded-2xl font-semibold ${
                submitting ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-[#2f5cd9]'
              }`}
            >
              {submitting ? '提交中...' : '确认提交'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PackageDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pkg, setPkg] = useState<PackagePlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [materialSelections, setMaterialSelections] = useState<MaterialSelectionMap>({})
  const [quantities, setQuantities] = useState<QuantityMap>({})
  const [selectedProducts, setSelectedProducts] = useState<Record<string, string[]>>({})
  const [selectionQuantities, setSelectionQuantities] = useState<QuantityMap>({})
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [summaryExpandedCategory, setSummaryExpandedCategory] = useState<string | null>(null)
  const [activeImage, setActiveImage] = useState<number>(0)
  const [previewContext, setPreviewContext] = useState<{ categoryKey: string; index: number } | null>(null)
  const [note, setNote] = useState('')
  const [isOrderConfirmOpen, setIsOrderConfirmOpen] = useState(false)
  const [materialImageMap, setMaterialImageMap] = useState<Record<string, string>>({})
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '' })
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [submitResultHint, setSubmitResultHint] = useState('')
  const { isAuthenticated, token } = useAuthStore()

  const loadPackage = async () => {
    if (!id) return
    setLoading(true)
    console.log('🔥 PackageDetailPage - Loading packages - v20251124-1300')
    const data = await getAllPackages()
    console.log('🔥 PackageDetailPage - Loaded packages:', data)
    const packageData = data.find((pkg) => pkg.id === id)
    console.log('🔥 PackageDetailPage - Found package:', packageData)
    if (packageData && packageData.categories) {
      console.log('🔥 PackageDetailPage - Categories:', packageData.categories)
      if (packageData.categories[0] && packageData.categories[0].products) {
        console.log('🔥 PackageDetailPage - First product:', packageData.categories[0].products[0])
      }
    }
    setPkg(packageData)
    setLoading(false)
    if (packageData && packageData.categories.length) {
      // collapsedCategories默认为空，所有分类都展开
      const defaults: MaterialSelectionMap = {}
      packageData.categories.forEach((category) => {
        category.products.forEach((product) => {
          if (!product.materials) return
          const materialEntries = Object.entries(product.materials as PackageProductMaterial)
          if (!materialEntries.length) return
          defaults[product.id] = materialEntries.reduce<Record<string, string>>((acc, [key, options]) => {
            acc[key] = options?.[0] || ''
            return acc
          }, {})
        })
      })
      setMaterialSelections(defaults)

      const quantityDefaults: QuantityMap = {}
      packageData.categories.forEach((category) => {
        category.products.forEach((product) => {
          quantityDefaults[product.id] = MIN_QUANTITY
        })
      })
      setQuantities(quantityDefaults)
    }
  }

  const loadMaterialImages = async () => {
    try {
      const materials = await getAllMaterials()
      console.log('🔥 Loaded materials:', materials)
      const imageMap: Record<string, string> = {}
      materials.forEach((material: any) => {
        // 修复：Material模型中是image（单数），不是images（复数）
        if (material.name && material.image) {
          imageMap[material.name] = material.image
          console.log('🔥 Added material to map:', material.name, '->', material.image)
        }
      })
      console.log('🔥 Final material image map:', imageMap)
      setMaterialImageMap(imageMap)
    } catch (error) {
      console.error('❌ 加载材质图片失败:', error)
    }
  }

  useEffect(() => {
    loadPackage()
    loadMaterialImages()
  }, [id])

  const findProductIndex = (categoryKey: string, productId: string) => {
    if (!pkg) return 0
    const category = pkg.categories.find((c) => c.key === categoryKey)
    if (!category) return 0
    const productIndex = category.products.findIndex((p) => p.id === productId)
    return productIndex >= 0 ? productIndex : 0
  }

  const getOptionPremium = (option: string, basePrice: number, product?: PackageProduct) => {
    // 只从商品SKU的materialUpgradePrices中读取实际加价
    if (product && product.skus && product.skus.length > 0) {
      // 遍历所有SKU，查找是否有materialUpgradePrices包含此材质
      for (const sku of product.skus) {
        if (sku.materialUpgradePrices) {
          console.log(`🔥 [加价检查] 商品: ${product.name}, 材质: ${option}`)
          console.log(`📋 [SKU加价规则详情]:`, JSON.stringify(sku.materialUpgradePrices, null, 2))
          
          // 1. 首先查找完全匹配的材质名称
          if (sku.materialUpgradePrices[option]) {
            const price = sku.materialUpgradePrices[option]
            console.log(`✅ [完全匹配] ${option} = ${price}`)
            return typeof price === 'number' && !isNaN(price) ? price : 0
          }
          
          // 2. 如果没有完全匹配，查找材质系列匹配
          // 提取材质系列名（如"全青皮"、"真皮"、"航空铝"等）
          const materialSeries = extractMaterialSeries(option)
          console.log(`🔍 [系列匹配] ${option} 提取系列: ${materialSeries}`)
          
          if (materialSeries) {
            // 查找以该系列开头的任何加价规则
            for (const [materialKey, price] of Object.entries(sku.materialUpgradePrices)) {
              const keySeries = extractMaterialSeries(materialKey)
              if (materialKey.includes(materialSeries) || keySeries === materialSeries) {
                console.log(`✅ [系列匹配成功] ${option} (${materialSeries}) 匹配到 ${materialKey} = ${price}`)
                return typeof price === 'number' && !isNaN(price) ? price : 0
              }
            }
          }
          
          console.log(`❌ [无匹配] ${option} 未找到加价规则`)
        }
      }
    }
    
    // 如果没有找到SKU中的加价，返回0（用户没有设置加价）
    return 0
  }

  // 提取材质系列名称的辅助函数
  const extractMaterialSeries = (materialName: string) => {
    // 定义常见的材质系列
    const materialSeriesList = ['全青皮', '真皮', '航空铝', '进口', '实木', '布艺', '金属']
    
    for (const series of materialSeriesList) {
      if (materialName.includes(series)) {
        return series
      }
    }
    
    // 如果没有匹配到已知系列，返回材质名称的前几个字符作为系列
    // 例如："橡木浅色" -> "橡木"
    const match = materialName.match(/^[\u4e00-\u9fa5]{1,3}/)
    return match ? match[0] : materialName
  }


  const calculateMaterialSurcharge = (
    product: PackageProduct,
    selections?: Record<string, string>
  ) => {
    if (!selections || !product.materials) return 0
    const total = Object.entries(selections).reduce((sum, [materialKey, option]) => {
      if (!option) return sum
      const options = (product.materials as PackageProductMaterial)[materialKey as keyof PackageProductMaterial]
      if (!options || !options.length) return sum
      const isUpgrade = option !== options[0]
      if (!isUpgrade) return sum
      const premium = getOptionPremium(option, product.price, product)
      console.log(`💰 [材质加价计算] 商品: ${product.name}, 材质Key: ${materialKey}, 选项: ${option}, 加价: ${premium}`)
      return sum + premium
    }, 0)
    console.log(`💰 [总材质加价] 商品: ${product.name}, 总加价: ${total}`)
    return total
  }

  const getProductMaterialSurcharge = (product: PackageProduct) => {
    const selections = materialSelections[product.id]
    return calculateMaterialSurcharge(product, selections)
  }

  const getProductQuantity = (productId: string) => {
    return selectionQuantities[productId] || MIN_QUANTITY
  }

  const getCategorySelectedQuantity = (categoryKey: string) => {
    const selectedIds = selectedProducts[categoryKey] || []
    return selectedIds.reduce((sum, productId) => sum + getProductQuantity(productId), 0)
  }

  const materialSurchargeTotal = useMemo(() => {
    if (!pkg) return 0
    return pkg.categories.reduce((sum, category) => {
      const selectedIds = selectedProducts[category.key] || []
      const selectedItems = category.products.filter((product) => selectedIds.includes(product.id))
      return sum + selectedItems.reduce((subtotal, product) => {
        const qty = getProductQuantity(product.id)
        return subtotal + getProductMaterialSurcharge(product) * qty
      }, 0)
    }, 0)
  }, [pkg, selectedProducts, materialSelections, selectionQuantities])

  const productLookup = useMemo(() => {
    if (!pkg) return {}
    const map: Record<string, PackageProduct & { categoryKey: string; categoryName: string; categoryRequired: number }> = {}
    pkg.categories.forEach((category) => {
      category.products.forEach((product) => {
        map[product.id] = { ...product, categoryKey: category.key, categoryName: category.name, categoryRequired: category.required }
      })
    })
    return map
  }, [pkg])

  const hasMaterialUpgrade = (productId: string) => {
    const product = productLookup[productId]
    if (!product) return false
    return calculateMaterialSurcharge(product, materialSelections[productId]) > 0
  }

  const totalPrice = useMemo(() => {
    if (!pkg) return 0
    return pkg.price + materialSurchargeTotal
  }, [pkg, materialSurchargeTotal])

  const selectionGroups = useMemo<PackageCategory[]>(() => {
    if (!pkg) return []
    return pkg.categories.map((category) => {
      const items = (selectedProducts[category.key] || [])
        .map((productId) => {
          const product = productLookup[productId]
          if (!product) return null
          const quantity = getProductQuantity(productId)
          const materials = materialSelections[productId]
          const materialUpgrade = calculateMaterialSurcharge(product, materials) * quantity
          return {
            productId,
            productName: product.name,
            quantity,
            materials,
            materialUpgrade,
          }
        })
        .filter((item): item is any => !!item)

      return {
        key: category.key,
        name: category.name,
        required: category.required,
        products: items,
      }
    })
  }, [pkg, selectedProducts, materialSelections, selectionQuantities, productLookup])

  const isSubmitDisabled = useMemo(() => {
    if (!pkg) return true
    return pkg.categories.some((category) => getCategorySelectedQuantity(category.key) < category.required)
  }, [pkg, selectedProducts, selectionQuantities])

  const selectionProgress = useMemo(() => {
    if (!pkg) return { totalRequired: 0, totalSelected: 0 }
    return pkg.categories.reduce(
      (acc, category) => {
        acc.totalRequired += category.required
        acc.totalSelected += Math.min(getCategorySelectedQuantity(category.key), category.required)
        return acc
      },
      { totalRequired: 0, totalSelected: 0 }
    )
  }, [pkg, selectedProducts, selectionQuantities])

  const progressPercent = selectionProgress.totalRequired
    ? Math.round((selectionProgress.totalSelected / selectionProgress.totalRequired) * 100)
    : 0

  const handleSelectProduct = (categoryKey: string, product: PackageProduct) => {
    if (!pkg) return
    const category = pkg.categories.find((c) => c.key === categoryKey)
    if (!category) return

    setSelectedProducts((prev) => {
      const existing = prev[categoryKey] || []
      const hasSelected = existing.includes(product.id)

      if (hasSelected) {
        return { ...prev, [categoryKey]: existing.filter((id) => id !== product.id) }
      }

      const addition = getProductQuantity(product.id)
      if (addition > category.required) {
        toast.error(`「${category.name}」最多选择 ${category.required} 件`)
        return prev
      }

      const nextList = [...existing]
      let total = getCategorySelectedQuantity(categoryKey)
      while (total + addition > category.required && nextList.length) {
        const removedId = nextList.shift()
        if (removedId) {
          total -= getProductQuantity(removedId)
        }
      }

      if (total + addition > category.required) {
        toast.error(`「${category.name}」最多选择 ${category.required} 件`)
        return prev
      }

      return {
        ...prev,
        [categoryKey]: [...nextList, product.id],
      }
    })
  }

  const handleSelectAll = (categoryKey: string, products: PackageProduct[], required: number) => {
    const limited = products.slice(0, required).map((item) => item.id)
    setSelectedProducts((prev) => ({
      ...prev,
      [categoryKey]: limited,
    }))
    setSelectionQuantities((prev) => {
      const next = { ...prev }
      limited.forEach((id) => {
        next[id] = MIN_QUANTITY
      })
      return next
    })
  }

  const handleSubmitRequest = () => {
    if (!pkg) return
    const incomplete = pkg.categories.find((category) => {
      const picked = getCategorySelectedQuantity(category.key)
      return picked < category.required
    })

    if (incomplete) {
      toast.error(`请完成「${incomplete.name}」的 ${incomplete.required} 选 1 选择`)
      // 展开未完成的分类
      setCollapsedCategories(prev => {
        const next = new Set(prev)
        next.delete(incomplete.key)
        return next
      })
      return
    }

    setIsOrderConfirmOpen(true)
  }

  const handleMaterialModalConfirm = (categoryKey: string, product: PackageProduct, selections: Record<string, string>) => {
    setMaterialSelections((prev) => ({
      ...prev,
      [product.id]: selections,
    }))
    if (!pkg) return
    const category = pkg.categories.find((c) => c.key === categoryKey)
    if (!category) return
    setSelectedProducts((prev) => {
      const existing = prev[categoryKey] || []
      if (existing.includes(product.id)) return prev
      const addition = getProductQuantity(product.id)
      const otherTotal = getCategorySelectedQuantity(categoryKey)
      if (otherTotal + addition > category.required) {
        toast.error(`「${category.name}」最多选择 ${category.required} 件`)
        return prev
      }
      toast.success('已加入清单并保存材质配置')
      return {
        ...prev,
        [categoryKey]: [...existing, product.id],
      }
    })
  }

  const handleRemoveSelection = (categoryKey: string, productId: string) => {
    setSelectedProducts((prev) => {
      const existing = prev[categoryKey] || []
      if (!existing.length) return prev
      return { ...prev, [categoryKey]: existing.filter((id) => id !== productId) }
    })
  }

  const handleQuantityChange = (categoryKey: string, productId: string, delta: number) => {
    if (!pkg) return
    const category = pkg.categories.find((c) => c.key === categoryKey)
    if (!category) return
    if (!(selectedProducts[categoryKey] || []).includes(productId)) return

    setSelectionQuantities((prev) => {
      const current = prev[productId] || MIN_QUANTITY
      const next = Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, current + delta))
      if (next === current) return prev
      const otherTotal = getCategorySelectedQuantity(categoryKey)
      if (otherTotal + next > category.required) {
        toast.error(`「${category.name}」最多选择 ${category.required} 件`)
        return prev
      }
      return { ...prev, [productId]: next }
    })
  }

  const handleOrderFormChange = (field: 'name' | 'phone' | 'address', value: string) => {
    setOrderForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleOrderSubmit = async () => {
    if (!pkg) return
    if (!orderForm.name || !orderForm.phone || !orderForm.address) {
      toast.error('请填写完整的联系人、电话和地址')
      return
    }
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(orderForm.phone)) {
      toast.error('请输入正确的手机号码')
      return
    }
    if (selectionGroups.some((group) => group.products.length === 0)) {
      toast.error('请先完成所有类别的选择')
      return
    }

    setOrderSubmitting(true)
    setSubmitResultHint('')
    
    try {
      // 验证登录状态
      if (!token) {
        toast.error('请先登录后再提交订单')
        useAuthModalStore.getState().openLogin()
        setOrderSubmitting(false)
        return
      }

      // 计算总加价
      let totalUpgradePrice = 0
      selectionGroups.forEach(group => {
        group.products.forEach((product: any) => {
          totalUpgradePrice += (product.materialUpgrade || 0) * (product.quantity || 1)
        })
      })

      // 构建套餐订单数据
      const packageData = {
        packageId: pkg.id,
        packageName: pkg.name,
        packagePrice: pkg.price,
        totalUpgradePrice: totalUpgradePrice,
        selections: selectionGroups.map(group => ({
          categoryKey: group.key,
          categoryName: group.name,
          required: group.required,
          products: group.products.map((product: any) => {
            // 转换材质数据为统一格式
            const materials = product.materials || {}
            const selectedMaterials = {
              fabric: materials.fabric || materials['面料'] || '',
              filling: materials.filling || materials['填充'] || '',
              frame: materials.frame || materials['框架'] || '',
              leg: materials.leg || materials['脚架'] || ''
            }
            
            // 从productLookup获取完整产品信息，计算每个材质的加价
            const fullProduct = productLookup[product.productId]
            const materialUpgradePrices: Record<string, number> = {}
            
            if (fullProduct && materials) {
              // 计算每个材质类型的加价
              Object.entries(materials).forEach(([materialKey, selectedOption]) => {
                if (!selectedOption) return
                const productMaterials = (fullProduct.materials as any)?.[materialKey]
                if (!productMaterials || !Array.isArray(productMaterials)) return
                // 检查是否选择了非默认选项（第一个选项是默认的）
                const isUpgrade = selectedOption !== productMaterials[0]
                if (isUpgrade) {
                  const premium = getOptionPremium(selectedOption as string, fullProduct.basePrice || 0, fullProduct)
                  if (premium > 0) {
                    materialUpgradePrices[materialKey] = premium
                  }
                }
              })
            }
            
            // 获取SKU规格名称
            const skuName = fullProduct?.skus?.[0]?.spec || product.skuName || ''
            
            return {
              productId: product.productId,
              productName: product.productName,
              skuName: skuName,
              quantity: product.quantity || 1,
              materials: materials,
              selectedMaterials: selectedMaterials,
              materialUpgrade: product.materialUpgrade || 0,
              upgradePrice: product.materialUpgrade || 0,
              materialUpgradePrices: materialUpgradePrices
            }
          })
        }))
      }

      const recipient = {
        name: orderForm.name,
        phone: orderForm.phone,
        address: orderForm.address
      }

      const payload = {
        packageData,
        recipient,
        notes: note
      }

      console.log('📦 [PackageDetail] 提交套餐订单:', JSON.stringify(payload, null, 2))
      console.log('📦 [PackageDetail] 总价:', totalPrice)
      
      // 调用新的套餐订单API
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/orders/package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      console.log('✅ [PackageDetail] 套餐订单创建成功:', data)
      toast.success('套餐订单提交成功！')
      setSubmitResultHint('订单已提交，您可以在订单中心查看详情。')
      
      // 关闭弹窗并跳转到订单中心
      setIsOrderConfirmOpen(false)
      setTimeout(() => {
        navigate('/orders')
      }, 500)
      
    } catch (error: any) {
      console.error('❗ [PackageDetail] 创建套餐订单失败:', error)
      console.error('❗ [PackageDetail] 错误详情:', error.response?.data)
      
      const errorMsg = error?.response?.data?.message || error?.message || '提交订单失败，请稍后重试'
      toast.error(`订单提交失败：${errorMsg}`)
      setSubmitResultHint(`订单提交失败：${errorMsg}`)
    } finally {
      setOrderSubmitting(false)
    }
  }

  const openPreview = (categoryKey: string, index: number) => {
    setPreviewContext({ categoryKey, index })
  }

  const closePreview = () => setPreviewContext(null)

  const handlePreviewNavigate = (direction: 'prev' | 'next') => {
    if (!pkg || !previewContext) return
    const category = pkg.categories.find((c) => c.key === previewContext.categoryKey)
    if (!category) return
    const total = category.products.length
    const nextIndex = direction === 'prev'
      ? (previewContext.index - 1 + total) % total
      : (previewContext.index + 1) % total
    setPreviewContext({ categoryKey: previewContext.categoryKey, index: nextIndex })
  }

  const getSelectedMaterialLabel = (product: PackageProduct) => {
    const selections = materialSelections[product.id]
    if (!selections) return null
    const labels = Object.entries(selections).map(([key, value]) => `${key.toUpperCase()} · ${value}`)
    return labels.join(' | ')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-600">
        <p>未找到对应套餐</p>
        <Link to="/packages" className="mt-4 btn-primary">返回套餐列表</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="container-custom">
        <div className="flex items-center gap-2 text-sm text-gray-500 py-6">
          <Link to="/" className="hover:text-primary-600">首页</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/packages" className="hover:text-primary-600">套餐专区</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 font-medium">{pkg.name}</span>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <section className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-3xl shadow p-6 space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-semibold text-gray-900">{pkg.name}</h1>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">整套基础价</p>
                  <p className="text-4xl font-bold text-primary">¥{pkg.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-3xl overflow-hidden relative">
                <img
                  src={pkg.gallery && pkg.gallery[activeImage] ? pkg.gallery[activeImage] : (pkg.banner ? getFileUrl(pkg.banner) : '/placeholder.svg')}
                  alt={pkg.name}
                  className="w-full h-[500px] object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                />
                <button
                  onClick={() => navigate(-1)}
                  className="absolute top-4 left-4 inline-flex items-center gap-2 bg-white/80 hover:bg-white rounded-full px-4 py-2 text-sm text-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" /> 返回
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto">
                {pkg.gallery.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setActiveImage(index)}
                    className={`rounded-2xl overflow-hidden border-2 ${
                      activeImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt="视角" className="w-28 h-20 object-cover" />
                  </button>
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed">{pkg.description}</p>
            </div>

            <div className="space-y-6">
              {pkg.categories.map((category) => {
                const selectedIds = selectedProducts[category.key] || []
                const selectedCount = getCategorySelectedQuantity(category.key)
                const remaining = Math.max(category.required - selectedCount, 0)
                const isExpanded = !collapsedCategories.has(category.key)

                return (
                  <div key={category.key} className="bg-white rounded-3xl shadow">
                    <button
                      onClick={() => {
                        setCollapsedCategories(prev => {
                          const next = new Set(prev)
                          if (isExpanded) {
                            next.add(category.key)
                          } else {
                            next.delete(category.key)
                          }
                          return next
                        })
                      }}
                      className="w-full flex items-center justify-between px-6 py-4 border-b text-left"
                    >
                      <div>
                        <p className="text-xs text-gray-400 tracking-widest">{category.products.length} 选 {category.required}</p>
                        <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {remaining > 0 ? `还需选择 ${remaining} 件` : '已完成'}
                        <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="p-6 space-y-6">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleSelectAll(category.key, category.products, category.required)}
                            className="px-4 py-2 rounded-full text-sm border border-gray-200 hover:border-gray-400"
                          >
                            {selectedCount === category.required ? '清空选择' : '快速选择推荐'}
                          </button>
                          <div className="text-sm text-gray-500 flex items-center gap-2">
                            <Layers3 className="h-4 w-4" /> 共 {category.products.length} 款可选
                          </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          {category.products.map((product, productIndex) => {
                            const isSelected = selectedIds.includes(product.id)
                            const productQuantity = getProductQuantity(product.id)
                            const otherSelectedTotal = getCategorySelectedQuantity(category.key)
                            const canIncreaseQuantity = isSelected && productQuantity < MAX_QUANTITY && (otherSelectedTotal + productQuantity) < category.required
                            const isDeleted = product.isDeleted || product.status === 'inactive'
                            
                            return (
                              <div
                                key={product.id}
                                className={`rounded-2xl border-2 overflow-hidden transition shadow-sm ${
                                  isSelected
                                    ? 'border-primary shadow-[#E8F0FF]'
                                    : 'border-transparent'
                                } ${isDeleted ? 'opacity-50' : ''}`}
                              >
                                <button
                                  type="button"
                                  onClick={() => !isDeleted && openPreview(category.key, productIndex)}
                                  className="relative w-full focus:outline-none"
                                  disabled={isDeleted}
                                >
                                  <img
                                    src={product.image ? getFileUrl(product.image) : '/placeholder.svg'}
                                    alt={product.name}
                                    className="aspect-square w-full object-contain rounded-xl bg-gray-50"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                                  />
                                  {isDeleted && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                      <span className="text-white font-semibold text-lg">商品已下架</span>
                                    </div>
                                  )}
                                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-white/90 text-gray-700">
                                    <ImageIcon className="h-3 w-3" /> {category.name}
                                  </span>
                                  {!isDeleted && (
                                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-gray-900/70 text-white">
                                      <Maximize2 className="h-3 w-3" /> 查看大图
                                    </span>
                                  )}
                                </button>
                                <div className="p-4 space-y-3">
                                  <div
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openPreview(category.key, productIndex)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault()
                                        openPreview(category.key, productIndex)
                                      }
                                    }}
                                    className="text-left space-y-3 cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="text-xs text-gray-400">{category.name}</p>
                                        <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-gray-400">单价</p>
                                        <p className="text-xl font-bold text-red-600">¥{(product.basePrice || product.packagePrice || 0).toLocaleString()}</p>
                                      </div>
                                    </div>

                                    {product.specs && (
                                      <p className="text-sm text-gray-500">规格：{product.specs}</p>
                                    )}

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                      {product.materials && Object.entries(product.materials).map(([key, options]) => (
                                        <div key={key} className="bg-gray-50 rounded-xl p-3">
                                          <p className="text-gray-400 tracking-widest mb-1">{MATERIAL_NAMES[key] || key.toUpperCase()}</p>
                                          <p className="text-gray-700 font-medium line-clamp-2">{Array.isArray(options) ? options.join(' / ') : '暂无'}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {getSelectedMaterialLabel(product) && (
                                    <div className="rounded-2xl bg-[#E8F0FF] text-primary text-xs px-4 py-2">
                                      当前材质：{getSelectedMaterialLabel(product)}
                                    </div>
                                  )}
                                  {hasMaterialUpgrade(product.id) && (
                                    <div className="text-xs text-red-500 font-medium">* 已升级材质，已计入价格</div>
                                  )}

                                  <button
                                    onClick={() => {
                                      if (isDeleted) {
                                        toast.error('该商品已下架，无法选择');
                                        return;
                                      }
                                      
                                      // 检查是否有材质选项需要选择
                                      const hasMaterials = product.materials && Object.keys(product.materials).length > 0;
                                      const hasSelection = materialSelections[product.id];
                                      
                                      if (!isSelected && hasMaterials && !hasSelection) {
                                        // 如果有材质但没有选择，打开预览选择材质
                                        toast.info('请先选择规格和材质');
                                        openPreview(category.key, productIndex);
                                        return;
                                      }
                                      
                                      handleSelectProduct(category.key, product);
                                    }}
                                    disabled={isDeleted}
                                    className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold transition ${
                                      isDeleted
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : isSelected
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {isDeleted ? (
                                      <>
                                        <X className="h-4 w-4" />
                                        商品已下架
                                      </>
                                    ) : (
                                      <>
                                        {isSelected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                        {isSelected ? '取消选择' : '加入搭配'}
                                      </>
                                    )}
                                  </button>
                                  <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                                    <span>数量</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleQuantityChange(category.key, product.id, -1)}
                                        disabled={!isSelected || productQuantity <= MIN_QUANTITY}
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                                          !isSelected || productQuantity <= MIN_QUANTITY ? 'border-gray-200 text-gray-300' : 'border-gray-300 hover:bg-gray-50'
                                        }`}
                                      >
                                        <Minus className="h-4 w-4" />
                                      </button>
                                      <span className="w-10 text-center font-semibold">{productQuantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleQuantityChange(category.key, product.id, 1)}
                                        disabled={!canIncreaseQuantity}
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                                          !canIncreaseQuantity ? 'border-gray-200 text-gray-300' : 'border-primary text-primary hover:bg-[#E8F0FF]'
                                        }`}
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-b from-[#f5f8ff] via-white to-white shadow-[0_30px_80px_rgba(62,118,255,0.18)] border border-white/60 ring-1 ring-black/5 p-6 space-y-6">
              <div className="absolute inset-0 pointer-events-none" aria-hidden>
                <div className="absolute -right-10 top-10 w-36 h-36 bg-[#dfe8ff] opacity-40 blur-3xl" />
              </div>
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> 智能配单进度
                  </p>
                  <p className="text-lg font-semibold text-gray-900">已完成 {selectionProgress.totalSelected}/{selectionProgress.totalRequired}</p>
                </div>
                <span
                  className={`text-xs font-medium px-3 py-1 rounded-full ${
                    progressPercent === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {progressPercent === 100
                    ? '全部完成'
                    : `还差 ${selectionProgress.totalRequired - selectionProgress.totalSelected} 件`}
                </span>
              </div>
              <div className="relative z-[1] h-2 rounded-full bg-white/60 border border-white shadow-inner overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
              <div className="relative z-[1] space-y-3 text-sm">
                {pkg.categories.map((category) => {
                  const selectedIds = selectedProducts[category.key] || []
                  const isExpanded = summaryExpandedCategory === category.key
                  const categorySelectedCount = getCategorySelectedQuantity(category.key)
                  const categoryUpgrade = selectedIds.reduce((sum, productId) => {
                    const product = productLookup[productId]
                    if (!product) return sum
                    return sum + calculateMaterialSurcharge(product, materialSelections[productId]) * getProductQuantity(productId)
                  }, 0)
                  const categoryComplete = categorySelectedCount >= category.required
                  return (
                    <div
                      key={category.key}
                      className={`rounded-2xl border transition shadow-sm backdrop-blur ${
                        categoryComplete
                          ? 'border-primary/30 bg-white/90'
                          : 'border-white/70 bg-white/70'
                      }`}
                    >
                      <button
                        onClick={() => setSummaryExpandedCategory(isExpanded ? null : category.key)}
                        className="w-full flex items-center justify-between px-5 py-4"
                      >
                        <div className="text-left">
                          <p className="font-medium text-gray-800 flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F0FF] text-primary text-sm font-semibold">
                              {category.name.slice(0, 1)}
                            </span>
                            <span className="flex items-center gap-2">
                              {category.name}
                              {categoryUpgrade > 0 && (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-rose-50 px-2 py-0.5 rounded-full">
                                  <AlertCircle className="h-3 w-3" /> 升级 +¥{categoryUpgrade.toLocaleString()}
                                </span>
                              )}
                            </span>
                          </p>
                          <p className="text-gray-400 text-xs mt-1">{category.required} 选 1 · 保持空间统一风格</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className={`font-semibold flex items-center justify-end gap-1 ${categoryComplete ? 'text-green-600' : 'text-amber-600'}`}>
                            {categoryComplete ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                            {categorySelectedCount}/{category.required}
                          </p>
                          <p className="text-xs text-gray-400">{isExpanded ? '点击收起' : '点击展开'}</p>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t px-5 py-4 space-y-3 bg-gradient-to-b from-white to-gray-50 rounded-b-2xl">
                          {selectedIds.length === 0 && <p className="text-gray-400 text-xs">尚未选择商品</p>}
                          {selectedIds.map((productId) => {
                            const product = productLookup[productId]
                            if (!product) return null
                            const materials = materialSelections[productId]
                            const upgraded = hasMaterialUpgrade(productId)
                            const quantity = getProductQuantity(productId)
                            const productUpgrade = upgraded
                              ? calculateMaterialSurcharge(product, materials) * quantity
                              : 0
                            return (
                              <div
                                key={productId}
                                className="flex items-start justify-between gap-3 rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm"
                              >
                                <div>
                                  <p className="font-medium text-gray-900 flex items-center gap-2">
                                    <span className={upgraded ? 'text-red-600 font-semibold' : ''}>{product.name}</span>
                                    <span className="text-xs text-gray-500">× {quantity}</span>
                                  </p>
                                  {materials && (
                                    <p className="text-xs text-gray-500 space-x-1">
                                      <span>材质：</span>
                                      {Object.entries(materials).map(([key, value], idx, arr) => {
                                        const label = `${key.toUpperCase()}·${value}`
                                        const isUpgraded = product.materials?.[key as keyof PackageProductMaterial]?.[0] !== value
                                        return (
                                          <span key={`${productId}-${key}`} className={isUpgraded ? 'text-red-600 font-semibold' : ''}>
                                            {label}
                                            {idx < arr.length - 1 ? '，' : ''}
                                          </span>
                                        )
                                      })}
                                    </p>
                                  )}
                                  {productUpgrade > 0 && (
                                    <p className="text-xs text-red-600">升级费用 +¥{productUpgrade.toLocaleString()}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openPreview(product.categoryKey, findProductIndex(product.categoryKey, productId))}
                                    className="text-xs text-primary hover:text-[#315cd1]"
                                  >
                                    查看
                                  </button>
                                  <button
                                    onClick={() => handleRemoveSelection(product.categoryKey, productId)}
                                    className="text-xs text-gray-500 hover:text-red-500"
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="relative z-[1] border-t pt-4 space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>套餐基础价</span>
                  <span className="font-semibold text-red-600">¥{pkg.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>材质升级</span>
                  <span className="font-semibold text-red-600">+¥{materialSurchargeTotal.toLocaleString()}</span>
                </div>
                <div className="border-t pt-3">
                  <p className="text-sm text-gray-400">预计合计</p>
                  <p className="text-4xl font-bold text-red-600">¥{totalPrice.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">升级材质将同步影响最终成交价，基础套餐保持不变</p>
                </div>
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="备注期待的风格、预算或交付时间..."
                className="input w-full min-h-[120px]"
              />
              <button
                onClick={handleSubmitRequest}
                disabled={isSubmitDisabled}
                className={`w-full py-3 text-lg rounded-2xl font-semibold transition ${
                  isSubmitDisabled
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-[#2f5cd9]'
                }`}
              >
                提交套餐订单
              </button>
              {!isAuthenticated && (
                <p className="text-xs text-center text-gray-500">
                  登录后可同步到云端订单中心，<Link to="/login" className="text-primary hover:underline">立即登录</Link>
                </p>
              )}
              {submitResultHint && (
                <p className="text-xs text-center text-gray-400">{submitResultHint}</p>
              )}
            </div>
          </aside>
        </div>
        {previewContext && (
          <ProductPreviewModal
            pkg={pkg}
            previewContext={previewContext}
            onClose={closePreview}
            onNavigate={handlePreviewNavigate}
            materialSelections={materialSelections}
            onConfirmSelection={handleMaterialModalConfirm}
            calculateMaterialSurcharge={calculateMaterialSurcharge}
            getOptionPremium={getOptionPremium}
            materialImageMap={materialImageMap}
          />
        )}
        {isOrderConfirmOpen && (
          <OrderConfirmModal
            pkg={pkg}
            selectionGroups={selectionGroups}
            totalPrice={totalPrice}
            note={note}
            contact={orderForm}
            onChange={handleOrderFormChange}
            onClose={() => setIsOrderConfirmOpen(false)}
            onSubmit={handleOrderSubmit}
            submitting={orderSubmitting}
          />
        )}
      </div>
    </div>
  )
}

interface ProductPreviewProps {
  pkg: PackagePlan
  previewContext: { categoryKey: string; index: number }
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
  materialSelections: MaterialSelectionMap
  onConfirmSelection: (categoryKey: string, product: PackageProductOption, selections: Record<string, string>) => void
  calculateMaterialSurcharge: (
    product: PackageProductOption,
    selections?: Record<string, string>
  ) => number
  getOptionPremium: (option: string, basePrice: number, product?: PackageProduct) => number
  materialImageMap: Record<string, string>
}

function ProductPreviewModal({
  pkg,
  previewContext,
  onClose,
  onNavigate,
  materialSelections,
  onConfirmSelection,
  calculateMaterialSurcharge,
  getOptionPremium,
  materialImageMap,
}: ProductPreviewProps) {
  const category = pkg.categories.find((c) => c.key === previewContext.categoryKey)
  const product = category?.products[previewContext.index]

  if (!category || !product) return null

  const [localSelections, setLocalSelections] = useState<Record<string, string>>(materialSelections[product.id] || {})
  const [selectedSku, setSelectedSku] = useState<any>(product.skus?.[0] || null)
  const [previewImage, setPreviewImage] = useState(product.image)
  const [showAllSpecs, setShowAllSpecs] = useState(false)
  
  useEffect(() => {
    const currentSelections = materialSelections[product.id] || {}
    setLocalSelections(currentSelections)
    setSelectedSku(product.skus?.[0] || null)
    setShowAllSpecs(false)
    
    // 根据当前选中的材质设置初始图片
    const currentMaterialSelections = Object.values(currentSelections)
    if (currentMaterialSelections.length > 0) {
      // 使用第一个选中的材质来确定显示的图片
      const firstSelectedMaterial = currentMaterialSelections[0]
      const materialImage = getMaterialPreviewImage(product, firstSelectedMaterial, materialImageMap)
      setPreviewImage(materialImage)
    } else {
      // 如果没有选中材质，使用商品默认图片
      setPreviewImage(product.image ? getFileUrl(product.image) : '/placeholder.svg')
    }
  }, [product.id, materialSelections, product.image, product.skus, materialImageMap])
  
  const surcharge = calculateMaterialSurcharge(product, localSelections)

  const handleSelectMaterial = (materialKey: string, option: string) => {
    setLocalSelections((prev) => ({
      ...prev,
      [materialKey]: option,
    }))
    
    // 扩展规格字段识别：检查是否是规格选择
    const materialKeyLower = materialKey.toLowerCase()
    const isSpecSelection = 
      materialKeyLower.includes('spec') || 
      materialKeyLower.includes('size') || 
      materialKeyLower.includes('规格') || 
      materialKeyLower.includes('尺寸') ||
      materialKeyLower.includes('型号') ||
      materialKeyLower === 'specifications' ||
      materialKey === 'spec'
    
    if (isSpecSelection) {
      console.log(`📐 [规格选择] materialKey: ${materialKey}, option: ${option}, 查找SKU图片`)
      
      // 查找匹配的SKU
      if (product.skus && product.skus.length > 0) {
        const matchingSku = product.skus.find(sku => 
          sku.spec === option || 
          sku.spec?.includes(option) || 
          option.includes(sku.spec || '') ||
          sku.code === option ||
          sku._id === option
        )
        
        if (matchingSku) {
          console.log(`✅ [找到SKU] ${option}:`, matchingSku)
          setSelectedSku(matchingSku)
          
          // 优先使用SKU的图片
          if (matchingSku.images && matchingSku.images.length > 0) {
            const skuImageUrl = getFileUrl(matchingSku.images[0])
            console.log(`🖼️ [SKU图片] 使用SKU第一张图片:`, skuImageUrl)
            setPreviewImage(skuImageUrl)
          } else if (matchingSku.images && matchingSku.images.length > 0) {
            // 尝试使用SKU的单张图片字段
            const skuImageUrl = getFileUrl(matchingSku.images[0])
            console.log(`🖼️ [SKU图片] 使用SKU图片:`, skuImageUrl)
            setPreviewImage(skuImageUrl)
          } else if (product.images && product.images.length > 0) {
            // 使用商品的图片数组
            const productImageUrl = getFileUrl(product.images[0])
            console.log(`🖼️ [商品图片] 使用商品第一张图片:`, productImageUrl)
            setPreviewImage(productImageUrl)
          } else {
            console.log(`🖼️ [默认图片] SKU和商品都无图片，使用默认图`)
            setPreviewImage(product.image ? getFileUrl(product.image) : '/placeholder.svg')
          }
        } else {
          console.log(`❌ [未找到SKU] ${option}，尝试使用商品图片`)
          // 未找到匹配的SKU，使用商品图片
          if (product.images && product.images.length > 0) {
            setPreviewImage(getFileUrl(product.images[0]))
          } else {
            setPreviewImage(product.image ? getFileUrl(product.image) : '/placeholder.svg')
          }
        }
      } else {
        console.log(`⚠️ [无SKU] 商品没有SKU数据，使用商品图片`)
        if (product.images && product.images.length > 0) {
          setPreviewImage(getFileUrl(product.images[0]))
        } else {
          setPreviewImage(product.image ? getFileUrl(product.image) : '/placeholder.svg')
        }
      }
    } else {
      // 材质选择：显示材质图片
      console.log(`🖼️ [材质选择] materialKey: ${materialKey}, option: ${option}, 更新材质图`)
      handlePreviewOption(option)
    }
  }

  const handlePreviewOption = (option: string) => {
    // 使用传入的materialImageMap获取材质图片
    console.log('handlePreviewOption called with:', option)
    const newImage = getMaterialPreviewImage(product, option, materialImageMap)
    console.log('Setting preview image to:', newImage)
    setPreviewImage(newImage)
  }

  const handleConfirm = () => {
    onConfirmSelection(category.key, product, localSelections)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4 py-8">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <p className="text-xs text-gray-400">{category.name}</p>
            <h3 className="text-2xl font-semibold text-gray-900">{product.name}</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-8 p-6">
          <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden">
            <img src={previewImage && previewImage !== '/placeholder.svg' && !previewImage.startsWith('http') ? getFileUrl(previewImage) : previewImage} alt={product.name} className="w-full h-full object-cover" />
            <button
              onClick={() => onNavigate('prev')}
              className="absolute top-1/2 -translate-y-1/2 left-4 bg-white/90 hover:bg-white rounded-full p-3 shadow"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => onNavigate('next')}
              className="absolute top-1/2 -translate-y-1/2 right-4 bg-white/90 hover:bg-white rounded-full p-3 shadow"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-6">
            {/* 选择规格 */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold text-gray-900">选择规格</h4>
              
              <div className="space-y-2">
                {product.skus && product.skus.length > 0 ? (
                  <>
                    {product.skus.slice(0, showAllSpecs ? undefined : 2).map((sku: any, index: number) => {
                      const isSelected = selectedSku?.code === sku.code
                      const skuPrice = sku.price || sku.discountPrice || 0
                      const dimensions = sku.length && sku.width && sku.height
                        ? `${Math.round(sku.length / 10)}×${Math.round(sku.width / 10)}×${Math.round(sku.height / 10)}cm`
                        : sku.spec || ''
                      
                      return (
                        <button
                          key={sku.code || index}
                          type="button"
                          onClick={() => setSelectedSku(sku)}
                          className={`w-full border-2 rounded-2xl p-4 text-left transition ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900">{sku.spec || `规格${index + 1}`}</span>
                            <span className="text-red-600 font-bold text-lg">¥{skuPrice.toLocaleString()}</span>
                          </div>
                          {dimensions && (
                            <p className="text-sm text-gray-600">尺寸：{dimensions}</p>
                          )}
                        </button>
                      )
                    })}
                    {product.skus.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setShowAllSpecs(!showAllSpecs)}
                        className="w-full flex items-center justify-center gap-1 py-2 text-xs text-gray-500 hover:text-gray-700"
                      >
                        {showAllSpecs ? '收起' : `展开更多(${product.skus.length - 2}个)`}
                        <ChevronRight className={`h-3 w-3 transition-transform ${showAllSpecs ? 'rotate-90' : ''}`} />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="border-2 border-blue-500 rounded-2xl p-4 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">{product.name}</span>
                      <span className="text-red-600 font-bold text-lg">¥{(product.basePrice || product.packagePrice || 0).toLocaleString()}</span>
                    </div>
                    {product.specs && (
                      <p className="text-sm text-gray-600">规格：{product.specs}</p>
                    )}
                  </div>
                )}
              </div>
              
              {surcharge > 0 && (
                <div className="text-sm text-gray-600">
                  材质升级费用：<span className="text-red-600 font-semibold">+¥{surcharge.toLocaleString()}</span>
                </div>
              )}
            </div>
            
            {/* 选择材质 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">选择材质</h4>
                <span className="text-xs text-gray-400">套装仅能下单，点击即可切换</span>
              </div>
              {(() => {
                console.log('🔥 Rendering materials for product:', product.name)
                console.log('🔥 product.materials:', product.materials)
                console.log('🔥 materials type:', typeof product.materials)
                console.log('🔥 materials keys:', product.materials ? Object.keys(product.materials) : 'null/undefined')
                console.log('📋 materials详细内容:', JSON.stringify(product.materials, null, 2))
                return product.materials
              })() ? (
                Object.entries(product.materials as PackageProductMaterial).map(([materialKey, options]) => {
                  console.log(`🔑 [材质Key]: ${materialKey}, 选项数量: ${Array.isArray(options) ? options.length : '非数组'}`)
                  console.log(`📝 [材质选项]:`, options)
                  const materialOptions = (options ?? []) as string[]
                  const MATERIAL_NAMES: Record<string, string> = {
                    fabric: '面料',
                    filling: '填充',
                    frame: '框架',
                    leg: '脚架',
                  }
                  
                  // 按材质类型分组（如"全青皮-白色" -> 分组:"全青皮", 显示:"白色"）
                  const materialGroups: Record<string, Array<{value: string, label: string, originalIndex: number}>> = {}
                  const groupOrder: string[] = []
                  
                  materialOptions.forEach((material, originalIndex) => {
                    const materialStr = String(material || '')
                    let groupName = '其他'
                    let displayLabel = materialStr
                    
                    // 检测并提取材质类型和颜色
                    if (materialStr.includes('全青皮-')) {
                      groupName = '全青皮'
                      displayLabel = materialStr.replace('全青皮-', '')
                    } else if (materialStr === '全青皮') {
                      groupName = '全青皮'
                      displayLabel = '默认'
                    } else if (materialStr.includes('普通皮-')) {
                      groupName = '普通皮'
                      displayLabel = materialStr.replace('普通皮-', '')
                    } else if (materialStr === '普通皮') {
                      groupName = '普通皮'
                      displayLabel = '默认'
                    } else if (materialStr.includes('牛皮-')) {
                      groupName = '牛皮'
                      displayLabel = materialStr.replace('牛皮-', '')
                    } else if (materialStr === '牛皮') {
                      groupName = '牛皮'
                      displayLabel = '默认'
                    } else if (materialStr.includes('半皮-')) {
                      groupName = '半皮'
                      displayLabel = materialStr.replace('半皮-', '')
                    } else if (materialStr === '半皮') {
                      groupName = '半皮'
                      displayLabel = '默认'
                    }
                    
                    if (!materialGroups[groupName]) {
                      materialGroups[groupName] = []
                      groupOrder.push(groupName)
                    }
                    materialGroups[groupName].push({ value: material, label: displayLabel, originalIndex })
                  })
                  
                  return (
                    <div key={materialKey} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{MATERIAL_NAMES[materialKey] || materialKey.toUpperCase()}</p>
                        <span className="text-xs text-gray-400">{materialOptions.length} 种</span>
                      </div>
                      
                      {/* 按分组显示材质 */}
                      <div className="space-y-4">
                        {groupOrder.map(groupName => (
                          <div key={groupName}>
                            <p className="text-xs font-medium text-gray-500 mb-2">{groupName}</p>
                            <div className="grid grid-cols-4 gap-3">
                              {materialGroups[groupName].map(({value, label, originalIndex}) => {
                                const isSelected = localSelections[materialKey] === value
                                // 使用getMaterialPreviewImage函数获取材质图片（优先从材质管理中获取）
                                const preview = getMaterialPreviewImage(product, value, materialImageMap)
                                // 计算升级价格：只有第一个材质选项（originalIndex === 0）是基础材质，其他都需要加价
                                const isFirstOption = originalIndex === 0
                                // 获取正确的产品价格：优先使用 packagePrice，然后是 basePrice
                                const productPrice = product.packagePrice || product.basePrice || 0
                                const upgradePrice = !isFirstOption ? getOptionPremium(value, productPrice, product) : 0
                                
                                return (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => handleSelectMaterial(materialKey, value)}
                                    className="flex flex-col items-center gap-1.5 cursor-pointer relative"
                                  >
                                    {upgradePrice > 0 && (
                                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full z-10">
                                        +¥{upgradePrice}
                                      </span>
                                    )}
                                    <span
                                      className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all ${
                                        isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-gray-300'
                                      }`}
                                    >
                                      <img 
                                        src={preview || '/placeholder.svg'} 
                                        alt={label} 
                                        className="w-full h-full object-cover cursor-pointer"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = '/placeholder.svg'
                                        }}
                                      />
                                    </span>
                                    <span className={`text-xs text-center max-w-[70px] leading-tight ${
                                      isSelected ? 'text-blue-600 font-semibold' : 'text-gray-600'
                                    }`}>
                                      {label}
                                      {upgradePrice > 0 && (
                                        <span className="block text-red-500 text-xs">+¥{upgradePrice}</span>
                                      )}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-gray-500">该商品暂无材质可选</p>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-xs text-gray-400">提示：切换至更高阶材质后，会在右侧总价中自动计算加价。</p>
              <div className="flex items-center justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-gray-400">
                  取消
                </button>
                <button onClick={handleConfirm} className="px-5 py-2 rounded-full bg-primary-600 text-white text-sm font-semibold">
                  确认材质
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
