import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Plus, Minus, X, AlertCircle, ChevronLeft, ChevronRight, Check, Sparkles, ShieldCheck, ArrowLeft, ImageIcon, Layers3, Loader2, Maximize2, CheckCircle2 } from 'lucide-react'
import { PackagePlan, PackageProductMaterial } from '@/types'
import { getAllPackages } from '@/services/packageService'
import { getFileUrl } from '@/services/uploadService'
import { toast } from 'sonner'
import { createCustomerOrder } from '@/services/customerOrderService'
import axios from '@/lib/axios'
import { useAuthStore } from '@/store/authStore'

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

const PRIMARY_BLUE = '#3E76FF'
const PRIMARY_BLUE_LIGHT = '#E8F0FF'
const PRIMARY_BLUE_HOVER = '#315cd1'
const PRIMARY_BLUE_BUTTON_HOVER = '#2f5cd9'
const MIN_QUANTITY = 1
const MAX_QUANTITY = 5

const formatCurrency = (value: number) => `¥${value.toLocaleString()}`

const stringToHexColor = (str: string) => {
  // 确保str是字符串
  const safeStr = String(str || 'default')
  let hash = 0
  for (let i = 0; i < safeStr.length; i += 1) {
    hash = safeStr.charCodeAt(i) + ((hash << 5) - hash)
  }
  let color = '#'
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff
    color += `00${value.toString(16)}`.slice(-2)
  }
  return color
}

const getMaterialPreviewImage = (product: PackageProduct, option: string) => {
  if (product.materialImages?.[option]) return product.materialImages[option]
  // 确保option是字符串
  const safeOption = String(option || 'default')
  const color = stringToHexColor(safeOption).replace('#', '')
  const text = encodeURIComponent(safeOption)
  return `https://placehold.co/1200x800/${color}/FFFFFF?text=${text}`
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
                submitting ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-[#3E76FF] text-white hover:bg-[#2f5cd9]'
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
  const [activeImage, setActiveImage] = useState(0)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<SelectionMap>({})
  const [materialSelections, setMaterialSelections] = useState<MaterialSelectionMap>({})
  const [selectionQuantities, setSelectionQuantities] = useState<QuantityMap>({})
  const [previewContext, setPreviewContext] = useState<{ categoryKey: string; index: number } | null>(null)
  const [note, setNote] = useState('')
  const [summaryExpandedCategory, setSummaryExpandedCategory] = useState<string | null>(null)
  const [isOrderConfirmOpen, setIsOrderConfirmOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({ name: '', phone: '', address: '' })
  const [orderSubmitting, setOrderSubmitting] = useState(false)
  const [submitResultHint, setSubmitResultHint] = useState('')
  const { isAuthenticated, token } = useAuthStore()

  const getProductQuantity = (productId: string) => selectionQuantities[productId] || MIN_QUANTITY

  const getCategorySelectedQuantity = (categoryKey: string, excludeProductId?: string) => {
    const ids = selectedProducts[categoryKey] || []
    return ids.reduce((sum, id) => {
      if (excludeProductId && id === excludeProductId) return sum
      return sum + (selectionQuantities[id] || MIN_QUANTITY)
    }, 0)
  }

  useEffect(() => {
    const loadPackage = async () => {
      if (!id) return
      setLoading(true)
      const data = await getAllPackages()
      const packageData = data.find((pkg) => pkg.id === id)
      setPkg(packageData)
      setLoading(false)
      if (packageData && packageData.categories.length) {
        // 默认展开所有套餐类别
        // setExpandedCategory(packageData.categories[0].key)
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
        setSelectionQuantities(quantityDefaults)
      }
    }
    loadPackage()
  }, [id])

  const findProductIndex = (categoryKey: string, productId: string) => {
    if (!pkg) return 0
    const category = pkg.categories.find((c) => c.key === categoryKey)
    if (!category) return 0
    const productIndex = category.products.findIndex((p) => p.id === productId)
    return productIndex >= 0 ? productIndex : 0
  }

  const getOptionPremium = (option: string, basePrice: number) => {
    const matchedRule = MATERIAL_PREMIUM_RULES.find((rule) => option.includes(rule.keyword))
    if (matchedRule) return matchedRule.extra
    return Math.round(Math.max(basePrice * 0.08, 300))
  }

  const stringToHexColor = (str: string) => {
    // 确保str是字符串
    const safeStr = String(str || 'default')
    let hash = 0
    for (let i = 0; i < safeStr.length; i += 1) {
      hash = safeStr.charCodeAt(i) + ((hash << 5) - hash)
    }
    let color = '#'
    for (let i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff
      color += `00${value.toString(16)}`.slice(-2)
    }
    return color
  }

  const getMaterialPreviewImage = (product: PackageProduct, option: string) => {
    if (product.materialImages?.[option]) return product.materialImages[option]
    // 确保option是字符串
    const safeOption = String(option || 'default')
    const color = stringToHexColor(safeOption).replace('#', '')
    const text = encodeURIComponent(safeOption)
    return `https://placehold.co/1200x800/${color}/FFFFFF?text=${text}`
  }

  const calculateMaterialSurcharge = (
    product: PackageProduct,
    selections?: Record<string, string>
  ) => {
    if (!selections || !product.materials) return 0
    return Object.entries(selections).reduce((sum, [materialKey, option]) => {
      if (!option) return sum
      const options = (product.materials as PackageProductMaterial)[materialKey as keyof PackageProductMaterial]
      if (!options || !options.length) return sum
      const isUpgrade = option !== options[0]
      if (!isUpgrade) return sum
      return sum + getOptionPremium(option, product.price)
    }, 0)
  }

  const getProductMaterialSurcharge = (product: PackageProduct) => {
    const selections = materialSelections[product.id]
    return calculateMaterialSurcharge(product, selections)
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
      setExpandedCategory(incomplete.key)
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
      const otherTotal = getCategorySelectedQuantity(categoryKey, productId)
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
      const date = new Date()
      const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const orderNo = `PKG${dateStr}${random}`

      const selectionSummary = selectionGroups.reduce<Record<string, string>>((acc, group) => {
        acc[group.name] = group.products
          .map((item) => {
            const materialText = item.materials
              ? Object.entries(item.materials)
                  .map(([key, value]) => `${key.toUpperCase()}·${value}`)
                  .join(' / ')
              : '默认配置'
            return `${item.productName} ×${item.quantity}${materialText ? ` (${materialText})` : ''}`
          })
          .join(' | ')
        return acc
      }, {})

      const payload = {
        orderNo,
        title: `「${pkg.name}」套餐订单`,
        status: 'pending' as any,
        source: 'self' as const,
        totalAmount: totalPrice,
        items: [
          {
            id: pkg.id,
            name: pkg.name,
            type: 'package' as const,
            quantity: 1,
            price: totalPrice,
            selections: selectionSummary,
          },
        ],
        note,
        address: orderForm.address,
        phone: orderForm.phone,
        contactName: orderForm.name,
        packageId: pkg.id,
        packageName: pkg.name,
        packageSelections: selectionGroups,
      }
      let remoteSynced = false
      let remoteAttempted = false
      let remoteError = ''

      if (token) {
        remoteAttempted = true
        try {
          await axios.post('/orders', payload, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          remoteSynced = true
        } catch (error: any) {
          remoteError = error?.response?.data?.message || error?.message || '云端同步失败'
          console.error('云端创建套餐订单失败', error)
          toast.error(remoteError)
        }
      } else {
        toast.info('当前未登录，本次订单将暂存于本地订单中心')
      }

      await createCustomerOrder(payload)

      if (remoteSynced) {
        toast.success('套餐订单已同步至云端并保存本地')
        setSubmitResultHint('已同步至云端，后台与本地订单中心均可查看。')
      } else if (remoteAttempted) {
        toast.success('云端暂不可用，已保存到本地订单中心，可稍后重试')
        setSubmitResultHint(`云端同步失败：${remoteError}`)
      } else {
        toast.success('订单已保存到本地订单中心，可登录后再次同步')
        setSubmitResultHint('未登录状态，仅保存在本地。')
      }

      setIsOrderConfirmOpen(false)
      navigate('/orders')
    } catch (error: any) {
      console.error('创建套餐订单失败', error)
      toast.error(error?.message || '提交订单失败，请稍后重试')
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
                  <p className="text-sm text-gray-400 mt-2">套餐编号 #{pkg.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">整套基础价</p>
                  <p className="text-4xl font-bold text-[#3E76FF]">¥{pkg.price.toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-3xl overflow-hidden relative">
                <img
                  src={pkg.banner ? getFileUrl(pkg.banner) : '/placeholder.svg'}
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
                      activeImage === index ? 'border-[#3E76FF]' : 'border-transparent'
                    }`}
                  >
                    <img src={image} alt="视角" className="w-28 h-20 object-cover" />
                  </button>
                ))}
              </div>
              <p className="text-gray-600 leading-relaxed">{pkg.description}</p>
              <div className="flex flex-wrap gap-3">
                {pkg.tags.map((tag) => (
                  <span key={tag} className="px-4 py-1 rounded-full bg-[#E8F0FF] text-[#3E76FF] text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              {pkg.categories.map((category) => {
                const selectedIds = selectedProducts[category.key] || []
                const selectedCount = getCategorySelectedQuantity(category.key)
                const remaining = Math.max(category.required - selectedCount, 0)
                const isExpanded = expandedCategory === category.key

                return (
                  <div key={category.key} className="bg-white rounded-3xl shadow">
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : category.key)}
                      className="w-full flex items-center justify-between px-6 py-4 border-b text-left"
                    >
                      <div>
                        <p className="text-xs text-gray-400 tracking-widest">{category.required} 选 1</p>
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
                            const otherSelectedTotal = getCategorySelectedQuantity(category.key, product.id)
                            const canIncreaseQuantity = isSelected && productQuantity < MAX_QUANTITY && (otherSelectedTotal + productQuantity) < category.required
                            return (
                              <div
                                key={product.id}
                                className={`rounded-2xl border-2 overflow-hidden transition shadow-sm ${
                                  isSelected
                                    ? 'border-[#3E76FF] shadow-[#E8F0FF]'
                                    : 'border-transparent'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => openPreview(category.key, productIndex)}
                                  className="relative w-full focus:outline-none"
                                >
                                  <img
                                    src={product.image ? getFileUrl(product.image) : '/placeholder.svg'}
                                    alt={product.name}
                                    className="h-32 w-full object-cover rounded-xl"
                                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                                  />
                                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-white/90 text-gray-700">
                                    <ImageIcon className="h-3 w-3" /> {category.name}
                                  </span>
                                  <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full bg-gray-900/70 text-white">
                                    <Maximize2 className="h-3 w-3" /> 查看大图
                                  </span>
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
                                        <p className="text-xs text-gray-400">#{productIndex + 1}</p>
                                        <h4 className="text-lg font-semibold text-gray-900">{category.name}</h4>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-xs text-gray-400">单价</p>
                                        <p className="text-xl font-bold text-red-600">¥{(product.price || 0).toLocaleString()}</p>
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
                                    <div className="rounded-2xl bg-[#E8F0FF] text-[#3E76FF] text-xs px-4 py-2">
                                      当前材质：{getSelectedMaterialLabel(product)}
                                    </div>
                                  )}
                                  {hasMaterialUpgrade(product.id) && (
                                    <div className="text-xs text-red-500 font-medium">* 已升级材质，已计入价格</div>
                                  )}

                                  <button
                                    onClick={() => {
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
                                    className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold transition ${
                                      isSelected
                                        ? 'bg-[#3E76FF] text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                  >
                                    {isSelected ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                    {isSelected ? '取消选择' : '加入搭配'}
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
                                          !canIncreaseQuantity ? 'border-gray-200 text-gray-300' : 'border-[#3E76FF] text-[#3E76FF] hover:bg-[#E8F0FF]'
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
                    <Sparkles className="h-3.5 w-3.5 text-[#3E76FF]" /> 智能配单进度
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
                  className="h-full rounded-full bg-gradient-to-r from-[#3E76FF] to-[#6A8BFF] transition-all"
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
                          ? 'border-[#3E76FF]/30 bg-white/90'
                          : 'border-white/70 bg-white/70'
                      }`}
                    >
                      <button
                        onClick={() => setSummaryExpandedCategory(isExpanded ? null : category.key)}
                        className="w-full flex items-center justify-between px-5 py-4"
                      >
                        <div className="text-left">
                          <p className="font-medium text-gray-800 flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#E8F0FF] text-[#3E76FF] text-sm font-semibold">
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
                                    className="text-xs text-[#3E76FF] hover:text-[#315cd1]"
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
                    : 'bg-[#3E76FF] text-white hover:bg-[#2f5cd9]'
                }`}
              >
                提交套餐订单
              </button>
              {!isAuthenticated && (
                <p className="text-xs text-center text-gray-500">
                  登录后可同步到云端订单中心，<Link to="/login" className="text-[#3E76FF] hover:underline">立即登录</Link>
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
}

function ProductPreviewModal({
  pkg,
  previewContext,
  onClose,
  onNavigate,
  materialSelections,
  onConfirmSelection,
  calculateMaterialSurcharge,
}: ProductPreviewProps) {
  const category = pkg.categories.find((c) => c.key === previewContext.categoryKey)
  const product = category?.products[previewContext.index]

  if (!category || !product) return null

  const [localSelections, setLocalSelections] = useState<Record<string, string>>(materialSelections[product.id] || {})
  const [previewImage, setPreviewImage] = useState(product.image)
  useEffect(() => {
    setLocalSelections(materialSelections[product.id] || {})
    setPreviewImage(product.image)
  }, [product.id, materialSelections, product.image])
  const surcharge = calculateMaterialSurcharge(product, localSelections)

  const handleSelectMaterial = (materialKey: string, option: string) => {
    setLocalSelections((prev) => ({
      ...prev,
      [materialKey]: option,
    }))
    handlePreviewOption(option)
  }

  const handlePreviewOption = (option: string) => {
    setPreviewImage(getMaterialPreviewImage(product, option))
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
          <div className="relative min-h-[360px] bg-gray-50 rounded-2xl overflow-hidden">
            <img src={previewImage} alt={product.name} className="w-full h-full object-cover" />
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">单件价格</p>
                <p className="text-3xl font-bold text-red-600">¥{(product.price || 0).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">材质升级</p>
                <p className="text-2xl font-bold text-red-600">+¥{(surcharge || 0).toLocaleString()}</p>
              </div>
            </div>
            {product.specs && (
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                {product.specs}
              </div>
            )}
            {product.materials ? (
              Object.entries(product.materials as PackageProductMaterial).map(([materialKey, options]) => {
                const materialOptions = (options ?? []) as string[]
                const MATERIAL_NAMES: Record<string, string> = {
                  fabric: '面料',
                  filling: '填充',
                  frame: '框架',
                  leg: '脚架',
                }
                return (
                  <div key={materialKey}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-800">{MATERIAL_NAMES[materialKey] || materialKey.toUpperCase()}</p>
                      <span className="text-xs text-gray-400">可选 {materialOptions.length} 款</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {materialOptions.map((option) => {
                        const isActive = localSelections[materialKey] === option
                        const materialImage = getMaterialPreviewImage(product, option)
                        return (
                          <div key={option} className="relative">
                            <button
                              onClick={() => handleSelectMaterial(materialKey, option)}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm transition ${
                                isActive
                                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                                  : 'border-gray-200 text-gray-600 hover:border-gray-400'
                              }`}
                            >
                              <img 
                                src={materialImage}
                                alt={option}
                                className="w-6 h-6 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary-500"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handlePreviewOption(option)
                                }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg'
                                }}
                              />
                              <span>{option}</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-gray-500">该商品暂无材质可选</p>
            )}
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
