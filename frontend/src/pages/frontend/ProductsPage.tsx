import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Grid, List, SlidersHorizontal, Heart, Sofa, Armchair, Gem, Sparkles } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
// 使用真实API服务
import { getProducts as getAllProducts } from '@/services/productService'
import { getAllCategories } from '@/services/categoryService'
import { useFavoriteStore } from '@/store/favoriteStore'
import { useAuthStore } from '@/store/authStore'
import { useAuthModalStore } from '@/store/authModalStore'
import { toast } from 'sonner'

import { getFileUrl, getThumbnailUrl } from '@/services/uploadService'
import { getAllSiteConfigs } from '@/services/siteConfigService'
// 简化价格显示
const formatPriceSimplified = (price: number): string => {
  if (price >= 10000) {
    return `${(price / 10000).toFixed(1)}万`
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(1)}千`
  }
  return formatPrice(price)
}

const getDisplayPrice = (product: any): number => {
  const raw = product?.labelPrice1 ?? product?.takePrice ?? product?.basePrice ?? 0
  const n = Number(raw)
  return Number.isFinite(n) ? n : 0
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterOpen, setFilterOpen] = useState(false)
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null) // 鼠标悬停的商品ID
  const [previewImageIndex, setPreviewImageIndex] = useState<Record<string, number>>({}) // 每个商品的SKU预览图片索引
  const [favoriteStatuses, setFavoriteStatuses] = useState<Record<string, boolean>>({}) // 商品收藏状态
  
  const { isFavorited, toggleFavorite, loadFavorites, favorites } = useFavoriteStore()
  const { isAuthenticated, user } = useAuthStore()
  
  // 恢复滚动位置
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('productsPageScrollPosition')
    if (savedScrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition))
        sessionStorage.removeItem('productsPageScrollPosition')
      }, 100)
    }
  }, [])
  
  // 保存滚动位置（在离开页面前）
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.setItem('productsPageScrollPosition', window.scrollY.toString())
    }
    
    return () => {
      handleBeforeUnload()
    }
  }, [])

  // 厂家账号的分类列表
  const [manufacturerCategories, setManufacturerCategories] = useState<string[]>([])
  
  // 筛选条件 - 默认显示沙发类别
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    sub: searchParams.get('sub') || '',
    style: searchParams.get('style') || '',
    priceRange: searchParams.get('priceRange') || '',
    sort: searchParams.get('sort') || 'recommend',
    series: searchParams.get('series') || '',
  })
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 18

  // 价格区间拖拽条状态（初始值会在商品加载后更新）
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000])
  const [priceRangeInput, setPriceRangeInput] = useState<[number, number]>([0, 500000])

  // 风格卡片图片配置（从网站配置加载）
  const [styleCardImages, setStyleCardImages] = useState<Record<string, string>>({})
  
  // 风格筛选选项 - 从商品中动态获取
  const styleOptions = useMemo(() => {
    const stylesSet = new Set<string>()
    products.forEach(product => {
      if ((product as any).styles && Array.isArray((product as any).styles)) {
        (product as any).styles.forEach((style: string) => stylesSet.add(style))
      }
    })
    return [
      { value: '', label: '全部风格' },
      ...Array.from(stylesSet).map(style => ({ value: style, label: style }))
    ]
  }, [products])
  
  // 动态生成风格卡片数据 - 从真实商品数据中获取
  const styleCards = useMemo(() => {
    const stylesMap = new Map<string, number>()
    products.forEach(product => {
      if ((product as any).styles && Array.isArray((product as any).styles)) {
        (product as any).styles.forEach((style: string) => {
          stylesMap.set(style, (stylesMap.get(style) || 0) + 1)
        })
      }
    })
    
    const iconMap: Record<string, any> = {
      '现代': Sofa,
      '中古': Armchair,
      '轻奢': Gem,
      '极简': Sparkles,
      '简约': Sofa,
      '北欧': Sofa,
      '工业': Armchair,
      '美式': Sofa,
      '欧式': Gem,
      '日式': Sparkles,
    }
    
    return Array.from(stylesMap.entries())
      .filter(([_, count]) => count > 0) // 只显示有商品的风格
      .slice(0, 4) // 最多显示4个
      .map(([style, count]) => {
        // 根据风格名称匹配图标
        let icon = Sofa // 默认图标
        for (const [key, value] of Object.entries(iconMap)) {
          if (style.includes(key)) {
            icon = value
            break
          }
        }
        return {
          label: style,
          enLabel: style.toUpperCase(),
          value: count,
          icon,
          image: styleCardImages[style] || ''
        }
      })
  }, [products, styleCardImages])

  // 加载商品数据
  useEffect(() => {
    loadProducts()
    loadCategories()
    if (isAuthenticated) {
      loadFavorites()
    }
    loadStyleImages()
  }, [isAuthenticated])
  
  // 厂家账号：加载厂家对应的分类并设置默认筛选
  useEffect(() => {
    if (user?.manufacturerId && categories.length > 0) {
      // 找出厂家对应的分类
      const mfgCategories: string[] = []
      const findManufacturerCategories = (cats: any[]) => {
        cats.forEach(cat => {
          const catMfgId = typeof cat.manufacturerId === 'object' 
            ? cat.manufacturerId?._id 
            : cat.manufacturerId
          if (catMfgId === user.manufacturerId) {
            mfgCategories.push(cat._id)
          }
          if (cat.children) {
            findManufacturerCategories(cat.children)
          }
        })
      }
      findManufacturerCategories(categories)
      setManufacturerCategories(mfgCategories)
      
      // 如果URL没有指定分类，且找到了厂家分类，默认选中第一个
      if (!searchParams.get('category') && mfgCategories.length > 0) {
        setFilters(prev => ({ ...prev, category: mfgCategories[0] }))
      }
      console.log('🏭 厂家分类:', mfgCategories)
    }
  }, [user?.manufacturerId, categories])
  
  // 当商品或收藏列表变化时，更新收藏状态
  useEffect(() => {
    const updateFavoriteStatuses = () => {
      const statuses: Record<string, boolean> = {}
      products.forEach(product => {
        statuses[product._id] = favorites.some(fav => {
          if (!fav || !fav.product) return false
          const favProductId = typeof fav.product === 'string' ? fav.product : fav.product._id
          return favProductId === product._id
        })
      })
      setFavoriteStatuses(statuses)
      console.log('🔥 [收藏状态] 更新:', statuses)
    }
    updateFavoriteStatuses()
  }, [products, favorites])
  
  // 加载风格卡片图片
  const loadStyleImages = async () => {
    try {
      const configs = await getAllSiteConfigs()
      setStyleCardImages({
        '现代风': configs['style.modern'] || '',
        '中古风': configs['style.vintage'] || '',
        '轻奢风': configs['style.luxury'] || '',
        '极简风': configs['style.minimal'] || ''
      })
    } catch (error) {
      console.error('加载风格图片失败:', error)
    }
  }

  // 同步URL参数到筛选条件
  useEffect(() => {
    const category = searchParams.get('category') || ''
    const sub = searchParams.get('sub') || ''
    const style = searchParams.get('style') || ''
    const priceRange = searchParams.get('priceRange') || ''
    const sort = searchParams.get('sort') || 'recommend'
    
    const series = searchParams.get('series') || ''
    setFilters({
      category,
      sub,
      style,
      priceRange,
      sort,
      series,
    })
    
    // 同步价格区间
    if (priceRange) {
      const [min, max] = priceRange.split('-').map(Number)
      if (!isNaN(min) && !isNaN(max)) {
        setPriceRange([min, max])
        setPriceRangeInput([min, max])
      }
    } else if (products.length > 0) {
      // 如果没有URL参数，使用实际价格区间
      setPriceRange(actualPriceRange as [number, number])
      setPriceRangeInput(actualPriceRange as [number, number])
    }
  }, [searchParams])

  const loadProducts = async () => {
    setLoading(true);
    try {
      // 加载所有商品（移除数量限制）
      const response = await getAllProducts({ pageSize: 50000 });
      if (response.success && response.data) {
        // 只显示上架的商品
        const activeProducts = (response.data || []).filter((p: Product) => p.status !== 'inactive');
        setProducts(activeProducts);
        console.log(`[商城] 共加载 ${activeProducts.length} 个商品`);
        // 打印前3个商品的分类信息用于调试
        activeProducts.slice(0, 3).forEach((p: any, i: number) => {
          console.log(`[商城] 商品${i+1}:`, p.name, '分类:', p.category, '分类名:', p.categoryName);
        });
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error('[ProductsPage] 加载商品失败:', error);
      toast.error('加载商品失败');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const allCategories = await getAllCategories()
      setCategories(allCategories)
    } catch (error) {
      console.error('加载分类失败:', error)
    }
  }

  // 获取分类及其所有子分类的ID和名称
  const getCategoryAndChildIds = (categoryId: string): Set<string> => {
    const result = new Set<string>()
    
    // 递归添加分类及其所有后代
    const addCategoryAndDescendants = (cat: any) => {
      result.add(cat._id)
      if (cat.slug) result.add(cat.slug)
      result.add(cat.name)
      // 递归添加所有子分类
      if (cat.children && cat.children.length > 0) {
        cat.children.forEach((child: any) => addCategoryAndDescendants(child))
      }
    }
    
    // 在分类树中查找匹配的分类
    const findCategory = (cats: any[], targetId: string): any => {
      for (const cat of cats) {
        if (cat._id === targetId || cat.slug === targetId || cat.name === targetId) {
          return cat
        }
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children, targetId)
          if (found) return found
        }
      }
      return null
    }
    
    const targetCat = findCategory(categories, categoryId)
    if (targetCat) {
      addCategoryAndDescendants(targetCat)
      console.log('🔍 分类筛选:', categoryId, '包含分类IDs:', Array.from(result))
    }
    
    return result
  }

  // 获取搜索关键词
  const searchKeyword = searchParams.get('search') || ''
  const parentLabel = searchParams.get('parent') || ''

  const subLabel = useMemo(() => {
    const key = String(filters.sub || '')
    const map: Record<string, string> = {
      electric: '电动沙发',
      double: '双人沙发',
      triple: '三人沙发',
      chaise: '带贵妃沙发',
      modular: '模块沙发',
      corner: '转角沙发',
    }
    return map[key] || ''
  }, [filters.sub])

  // 递归查找分类
  const findCategoryRecursive = (cats: any[], targetId: string): any => {
    for (const cat of cats) {
      if (cat._id === targetId || cat.slug === targetId || cat.name === targetId) {
        return cat
      }
      if (cat.children && cat.children.length > 0) {
        const found = findCategoryRecursive(cat.children, targetId)
        if (found) return found
      }
    }
    return null
  }

  const categoryLabel = useMemo(() => {
    if (!filters.category) return ''
    // 等待分类数据加载完成后再显示
    if (categories.length === 0) return ''
    const cat = findCategoryRecursive(categories, filters.category)
    return cat?.name || ''
  }, [categories, filters.category])

  // 获取当前分类的子分类（用于顶部快捷标签）
  const subcategoryTabs = useMemo(() => {
    if (!filters.category) return []
    // 递归找到当前分类
    const currentCat = findCategoryRecursive(categories, filters.category)
    if (!currentCat) return []
    
    // 返回其子分类（如果有）
    if (currentCat.children && currentCat.children.length > 0) {
      return currentCat.children.map((child: any) => ({
        id: child._id,
        name: child.name,
        slug: child.slug || child._id,
        image: child.image
      }))
    }
    
    return []
  }, [categories, filters.category])

  const pageTitle = useMemo(() => {
    if (searchKeyword) return `搜索 "${searchKeyword}"`
    if (subLabel) return subLabel
    if (categoryLabel) return categoryLabel
    return '产品目录'
  }, [categoryLabel, searchKeyword, subLabel])

  const breadcrumb = useMemo(() => {
    const parts: string[] = []
    if (parentLabel) parts.push(parentLabel)
    // 避免重复：如果 categoryLabel 和 parentLabel 相同则不添加
    if (categoryLabel && categoryLabel !== parentLabel) parts.push(categoryLabel)
    if (subLabel && subLabel !== categoryLabel) parts.push(subLabel)
    return parts
  }, [categoryLabel, parentLabel, subLabel])

  // 始终使用简洁布局（无侧边栏）
  const categoryMode = true

  // 筛选商品
  const filteredProducts = products.filter(product => {
    // 搜索过滤 - 模糊匹配名称、分类、型号
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase()
      const name = (product.name || '').toLowerCase()
      const categoryName = ((product as any).categoryName || '').toLowerCase()
      const model = ((product as any).model || '').toLowerCase()
      const specs = ((product as any).specs || '').toLowerCase()
      
      // 模糊匹配
      if (!name.includes(keyword) && 
          !categoryName.includes(keyword) && 
          !model.includes(keyword) && 
          !specs.includes(keyword)) {
        return false
      }
    }
    
    // 分类筛选
    if (filters.category && categories.length > 0) {
      // 获取商品的分类ID
      const rawCategory: any = (product as any).category
      const productCategoryId = typeof rawCategory === 'object'
        ? String(rawCategory?._id || rawCategory?.id || '')
        : String(rawCategory ?? '')
      
      // 获取筛选分类及其所有子分类ID
      const validCategoryIds = getCategoryAndChildIds(filters.category)
      
      // 如果找到有效分类，进行筛选
      if (validCategoryIds.size > 0) {
        // 检查商品分类是否在有效分类列表中
        if (!validCategoryIds.has(productCategoryId)) {
          // 也检查分类名称匹配
          const productCategoryName = String((product as any).categoryName || rawCategory?.name || '')
          if (!validCategoryIds.has(productCategoryName)) {
            return false
          }
        }
      }
    }

    // 风格筛选
    if (filters.style) {
      const productStyles = (product as any).styles || []
      // 检查商品的styles数组是否包含筛选的风格
      if (!Array.isArray(productStyles) || !productStyles.includes(filters.style)) {
        return false
      }
    }

    // 价格筛选
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number)
      const price = getDisplayPrice(product as any)
      if (price < min || price > max) {
        return false
      }
    }

    // 系列筛选
    if (filters.series) {
      const productSeries = (product as any).series || (product as any).productSeries || ''
      if (productSeries !== filters.series) {
        return false
      }
    }
    
    return true
  })

  // 调试日志
  useEffect(() => {
    console.log(`🔍 商品筛选结果: 总商品=${products.length}, 筛选后=${filteredProducts.length}, 筛选条件=`, filters)
    if (filters.category) {
      const validIds = getCategoryAndChildIds(filters.category)
      console.log(`📋 有效分类ID列表:`, Array.from(validIds))
      // 显示前5个商品的分类信息
      products.slice(0, 5).forEach((product, index) => {
        const rawCategory = (product as any).category
        const categoryId = typeof rawCategory === 'object'
          ? String(rawCategory?._id || rawCategory?.id || '')
          : String(rawCategory ?? '')
        const categoryName = String((product as any).categoryName || rawCategory?.name || '')
        console.log(`📦 商品${index + 1}: ID=${categoryId}, Name=${categoryName}`)
      })
    }
  }, [products.length, filteredProducts.length, filters])

  // 获取系列选项（从商品数据中动态获取）
  const seriesOptions = useMemo(() => {
    const seriesSet = new Set<string>()
    filteredProducts.forEach(product => {
      const series = (product as any).series || (product as any).productSeries
      if (series && typeof series === 'string') {
        seriesSet.add(series)
      }
    })
    return Array.from(seriesSet).sort()
  }, [filteredProducts])

  // 动态计算价格区间
  const actualPriceRange = useMemo(() => {
    if (products.length === 0) return [0, 500000]
    const prices = products.map(p => getDisplayPrice(p as any)).filter(p => Number.isFinite(p) && p >= 0)
    const minPrice = Math.floor(Math.min(...prices) / 1000) * 1000 // 向下取整到千位
    const maxPrice = Math.ceil(Math.max(...prices) / 1000) * 1000 // 向上取整到千位
    return [minPrice, maxPrice]
  }, [products])
  
  // 当商品加载后，更新价格区间初始值
  useEffect(() => {
    if (products.length > 0 && !searchParams.get('priceRange')) {
      setPriceRange(actualPriceRange as [number, number])
      setPriceRangeInput(actualPriceRange as [number, number])
    }
  }, [actualPriceRange, searchParams, products.length])

  // 计算商品热度评分（综合浏览、销量、收藏）
  const calculateHotScore = (product: Product): number => {
    const views = product.views || 0
    const sales = product.sales || 0 // 下单数量
    // 注：收藏数需要后端聚合，暂时使用views作为用户兴趣指标
    
    // 计算商品天数（用于新品加权）
    const daysSinceCreated = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    const isNewProduct = daysSinceCreated <= 30 // 30天内为新品
    const newProductBonus = isNewProduct ? 1.5 : 1 // 新品加权1.5倍
    
    // 综合评分：浏览量30% + 销量（下单）50% + 浏览转化率20%
    const score = (
      (views * 0.3) +
      (sales * 15 * 0.5) + // 销量（实际下单）权重最高
      (views * 0.2) // 用户兴趣度
    ) * newProductBonus
    
    return score
  }

  const categoryNameLookup = useMemo(() => {
    const map = new Map<string, string>()
    const walk = (cat: any) => {
      if (!cat) return
      const id = String(cat?._id || cat?.id || '')
      const slug = String(cat?.slug || '')
      const name = String(cat?.name || cat?.title || '')
      if (id && name) map.set(id, name)
      if (slug && name) map.set(slug, name)
      if (name) map.set(name, name)
      const children = Array.isArray(cat?.children) ? cat.children : []
      children.forEach(walk)
    }
    ;(categories || []).forEach(walk)
    return map
  }, [categories])

  const isLargeItemProduct = (product: Product): boolean => {
    const name = String(product?.name || '')
    const rawCategory: any = (product as any).category
    const categoryNameFromProduct = String((product as any).categoryName || rawCategory?.name || rawCategory?.title || '')
    const categoryKey = typeof rawCategory === 'object'
      ? String(rawCategory?._id || rawCategory?.id || rawCategory?.slug || rawCategory?.name || '')
      : String(rawCategory ?? '')
    const categoryName = categoryNameFromProduct || (categoryKey ? (categoryNameLookup.get(categoryKey) || '') : '')
    const tags: string[] = Array.isArray((product as any).tags) ? (product as any).tags : []
    const joined = `${name} ${categoryName} ${tags.join(' ')}`

    const keywords = ['沙发', '床', '床垫', '茶几', '餐桌', '餐椅', '书桌', '衣柜', '柜']
    return keywords.some(k => joined.includes(k))
  }
  
  // 计算推荐评分（偏向新品和热门）
  const calculateRecommendScore = (product: Product): number => {
    const views = product.views || 0
    const sales = product.sales || 0
    
    // 计算商品天数
    const daysSinceCreated = (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    
    // 新品加权（30天内2倍，60天内1.5倍，90天内1.2倍）
    let newProductBonus = 1
    if (daysSinceCreated <= 30) newProductBonus = 2.0
    else if (daysSinceCreated <= 60) newProductBonus = 1.5
    else if (daysSinceCreated <= 90) newProductBonus = 1.2
    
    // 推荐评分：新品40% + 销量35% + 浏览25%
    const score = (
      (sales * 12 * 0.35) + // 销量权重
      (views * 0.25) + // 浏览量
      100 // 基础分，让新品加权生效
    ) * newProductBonus
    
    return score
  }

  // 排序
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const shouldPrioritizeLarge = !filters.category && !searchKeyword && filters.sort === 'recommend'
    if (shouldPrioritizeLarge) {
      const ar = isLargeItemProduct(a) ? 0 : 1
      const br = isLargeItemProduct(b) ? 0 : 1
      if (ar !== br) return ar - br
    }
    switch (filters.sort) {
      case 'price-asc':
        return getDisplayPrice(a as any) - getDisplayPrice(b as any)
      case 'price-desc':
        return getDisplayPrice(b as any) - getDisplayPrice(a as any)
      case 'sales':
        return (b.sales || 0) - (a.sales || 0)
      case 'views':
        return (b.views || 0) - (a.views || 0)
      case 'hot':
        return calculateHotScore(b) - calculateHotScore(a)
      case 'recommend':
        return calculateRecommendScore(b) - calculateRecommendScore(a)
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

  // 分页计算
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage)
  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // 当筛选条件变化时重置页码
  useEffect(() => {
    setCurrentPage(1)
  }, [filters, priceRange])

  // 切换收藏
  const handleToggleFavorite = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 检查是否登录
    if (!isAuthenticated) {
      toast.error('请先登录后再收藏商品')
      useAuthModalStore.getState().openLogin()
      return
    }
    
    try {
      const currentlyFavorited = favoriteStatuses[product._id]
      const result = await toggleFavorite(product)
      
      // 立即更新本地状态，不等待重新加载
      setFavoriteStatuses(prev => ({
        ...prev,
        [product._id]: !currentlyFavorited
      }))
      
      if (!currentlyFavorited) {
        toast.success('已添加到收藏')
      } else {
        toast.success('已取消收藏')
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
      toast.error('操作失败，请重试')
    }
  }

  // 获取商品预览图（优先使用商品主图，其次使用SKU图片）
  const getProductPreviewImages = (product: Product) => {
    const skuImages = (product.skus || [])
      .map(sku => sku.images && sku.images[0])
      .filter(Boolean)
    if (skuImages.length > 0) {
      return skuImages
    }

    const mainFirstImage = (product.images || []).filter(Boolean)[0]
    return [mainFirstImage || '/placeholder.png']
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={categoryMode ? 'min-h-screen bg-white' : 'min-h-screen bg-[#F2F4F3]'}>
      {categoryMode ? (
        <div className="max-w-[1800px] mx-auto px-4 lg:px-8 pt-10">
          {breadcrumb.length > 0 && (
            <div className="text-sm text-stone-500">
              {breadcrumb.join(' > ')}
            </div>
          )}
          <div className="mt-4 flex items-end justify-between gap-4">
            <h1 className="text-4xl font-semibold text-stone-900">{pageTitle}</h1>
          </div>

          {/* 子分类图片卡片 */}
          {subcategoryTabs.length > 0 && (
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {subcategoryTabs.map((tab) => (
                <div
                  key={tab.id}
                  onClick={() => {
                    setSearchParams({ ...Object.fromEntries(searchParams), category: tab.slug })
                    setFilters({ ...filters, category: tab.slug })
                  }}
                  className={`cursor-pointer group ${
                    filters.category === tab.slug || filters.category === tab.id
                      ? 'ring-2 ring-primary rounded-lg'
                      : ''
                  }`}
                >
                  <div className="aspect-[4/3] bg-stone-100 rounded-lg overflow-hidden mb-2">
                    {tab.image ? (
                      <img
                        src={getFileUrl(tab.image)}
                        alt={tab.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Grid className="w-8 h-8 text-stone-300" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-stone-700 group-hover:text-primary transition-colors">{tab.name}</p>
                </div>
              ))}
            </div>
          )}

          {/* 系列筛选 */}
          {seriesOptions.length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-stone-500">系列:</span>
              <select
                value={filters.series}
                onChange={(e) => {
                  setFilters({ ...filters, series: e.target.value })
                  if (e.target.value) {
                    setSearchParams({ ...Object.fromEntries(searchParams), series: e.target.value })
                  } else {
                    const params = new URLSearchParams(searchParams.toString())
                    params.delete('series')
                    setSearchParams(params)
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-stone-100 text-sm text-stone-700 border-none"
              >
                <option value="">全部系列</option>
                {seriesOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <div className="mt-6 pb-4 border-b border-stone-200 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={filters.sort}
                onChange={(e) => {
                  setFilters({ ...filters, sort: e.target.value })
                  setSearchParams({ ...Object.fromEntries(searchParams), sort: e.target.value })
                }}
                className="px-4 py-2 rounded-full bg-stone-100 text-sm text-stone-700"
              >
                <option value="recommend">价格排序</option>
                <option value="hot">综合热度</option>
                <option value="newest">最新上架</option>
                <option value="sales">销量最高</option>
                <option value="views">浏览最多</option>
                <option value="price-asc">价格从低到高</option>
                <option value="price-desc">价格从高到低</option>
              </select>

              <select
                value={filters.priceRange}
                onChange={(e) => {
                  setFilters({ ...filters, priceRange: e.target.value })
                  setSearchParams({ ...Object.fromEntries(searchParams), priceRange: e.target.value })
                }}
                className="px-4 py-2 rounded-full bg-stone-100 text-sm text-stone-700"
              >
                <option value="">价格</option>
                <option value="0-3000">0-3000</option>
                <option value="3000-6000">3000-6000</option>
                <option value="6000-10000">6000-10000</option>
                <option value="10000-20000">10000-20000</option>
                <option value="20000-">20000+</option>
              </select>

              <select
                value={filters.style}
                onChange={(e) => {
                  setFilters({ ...filters, style: e.target.value })
                  setSearchParams({ ...Object.fromEntries(searchParams), style: e.target.value })
                }}
                className="px-4 py-2 rounded-full bg-stone-100 text-sm text-stone-700"
              >
                {styleOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label || '风格'}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setFilterOpen(v => !v)}
                className="px-4 py-2 rounded-full bg-stone-100 text-sm text-stone-700 hover:bg-stone-200"
              >
                +更多筛选
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {filterOpen && (
            <div className="mt-6 bg-white rounded-xl p-4 shadow-sm border border-stone-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">设计风格 STYLE</h4>
                  <div className="flex flex-wrap gap-2">
                    {styleOptions.map((style) => (
                      <button
                        key={style.value}
                        type="button"
                        onClick={() => {
                          setFilters({ ...filters, style: style.value })
                          setSearchParams({ ...Object.fromEntries(searchParams), style: style.value })
                        }}
                        className={`px-3 py-2 rounded-full text-sm transition-colors ${
                          filters.style === style.value
                            ? 'bg-primary text-white font-medium'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">价格区间</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">最低价</label>
                        <input
                          type="number"
                          value={priceRangeInput[0]}
                          onChange={(e) => {
                            const value = Math.max(actualPriceRange[0], Math.min(Number(e.target.value), priceRangeInput[1] - 1))
                            setPriceRangeInput([value, priceRangeInput[1]])
                            setPriceRange([value, priceRangeInput[1]])
                            setFilters({ ...filters, priceRange: `${value}-${priceRangeInput[1]}` })
                          }}
                          className="input text-sm w-full"
                          min={actualPriceRange[0]}
                          max={priceRangeInput[1] - 1}
                          placeholder={`最低${actualPriceRange[0]}`}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">最高价</label>
                        <input
                          type="number"
                          value={priceRangeInput[1]}
                          onChange={(e) => {
                            const value = Math.max(priceRangeInput[0] + 1, Math.min(Number(e.target.value), actualPriceRange[1]))
                            setPriceRangeInput([priceRangeInput[0], value])
                            setPriceRange([priceRangeInput[0], value])
                            setFilters({ ...filters, priceRange: `${priceRangeInput[0]}-${value}` })
                          }}
                          className="input text-sm w-full"
                          min={priceRangeInput[0] + 1}
                          max={actualPriceRange[1]}
                          placeholder={`最高${actualPriceRange[1]}`}
                        />
                      </div>
                    </div>

                    <div className="relative h-2">
                      <div className="absolute w-full h-2 bg-gray-200 rounded-lg"></div>
                      <div
                        className="absolute h-2 bg-primary-600 rounded-lg"
                        style={{
                          left: `${((priceRange[0] - actualPriceRange[0]) / (actualPriceRange[1] - actualPriceRange[0])) * 100}%`,
                          width: `${((priceRange[1] - priceRange[0]) / (actualPriceRange[1] - actualPriceRange[0])) * 100}%`,
                        }}
                      ></div>
                      <input
                        type="range"
                        min={actualPriceRange[0]}
                        max={actualPriceRange[1]}
                        step="1000"
                        value={priceRange[0]}
                        onChange={(e) => {
                          const min = Number(e.target.value)
                          const max = Math.max(min, priceRange[1])
                          setPriceRange([min, max])
                          setPriceRangeInput([min, max])
                          setFilters({ ...filters, priceRange: `${min}-${max}` })
                        }}
                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
                        style={{ zIndex: 2 }}
                      />
                      <input
                        type="range"
                        min={actualPriceRange[0]}
                        max={actualPriceRange[1]}
                        step="1000"
                        value={priceRange[1]}
                        onChange={(e) => {
                          const max = Number(e.target.value)
                          const min = Math.min(max, priceRange[0])
                          setPriceRange([min, max])
                          setPriceRangeInput([min, max])
                          setFilters({ ...filters, priceRange: `${min}-${max}` })
                        }}
                        className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
                        style={{ zIndex: 2 }}
                      />
                    </div>

                    <div className="text-center text-sm text-gray-600">
                      {formatPriceSimplified(priceRange[0])} - {formatPriceSimplified(priceRange[1])}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">系列 SERIES</h4>
                  <div className="flex flex-wrap gap-2">
                    {seriesOptions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setFilters({ ...filters, series: s })
                          setSearchParams({ ...Object.fromEntries(searchParams), series: s })
                        }}
                        className={`px-3 py-2 rounded-full text-sm transition-colors ${
                          filters.series === s
                            ? 'bg-primary text-white font-medium'
                            : 'bg-stone-50 hover:bg-stone-100 text-stone-600'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ category: filters.category, sub: filters.sub, style: '', priceRange: '', sort: 'recommend', series: '' })
                    setPriceRange(actualPriceRange as [number, number])
                    setPriceRangeInput(actualPriceRange as [number, number])
                    const params = new URLSearchParams(searchParams.toString())
                    params.delete('style')
                    params.delete('priceRange')
                    params.delete('sort')
                    setSearchParams(params)
                  }}
                  className="btn-secondary"
                >
                  重置筛选
                </button>
              </div>
            </div>
          )}

          {/* 商品列表 - categoryMode布局 */}
          <div className="mt-8">
            {sortedProducts.length === 0 ? (
              <div className="card py-16 text-center">
                <p className="text-gray-500 text-lg">暂无商品</p>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5' : 'space-y-3'}>
                  {paginatedProducts.map((product, index) => (
                    <motion.div
                      key={product._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={viewMode === 'grid' ? 'card hover:shadow-lg transition-shadow' : 'bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow border border-stone-100'}
                    >
                      {(() => {
                        const skus = Array.isArray((product as any).skus) ? (product as any).skus : []
                        const displayPrice = getDisplayPrice(product as any)
                        const firstSku = skus[0]
                        return (
                          <div
                            onMouseEnter={() => setHoveredProductId(product._id)}
                            onMouseLeave={() => {
                              setHoveredProductId(null)
                              setPreviewImageIndex(prev => {
                                const newState = { ...prev }
                                delete newState[product._id]
                                return newState
                              })
                            }}
                            className={viewMode === 'list' ? 'flex gap-4' : ''}
                          >
                            <Link to={`/products/${product._id}`} className={viewMode === 'list' ? 'flex gap-4 w-full' : ''}>
                              {/* 商品图片 */}
                              <div className={`relative overflow-hidden rounded-lg bg-gray-100 group ${viewMode === 'grid' ? 'aspect-square mb-4' : 'w-24 h-24 flex-shrink-0'}`}>
                                <img
                                  src={getThumbnailUrl(getProductPreviewImages(product)[previewImageIndex[product._id] || 0] || (product.images && product.images[0]) || '/placeholder.png', 280)}
                                  alt={product.name}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                  decoding="async"
                                />
                                
                                {/* SKU预览小方块 */}
                                {viewMode === 'grid' && getProductPreviewImages(product).length > 1 && (
                                  <div className="absolute bottom-2 left-2 flex gap-1 z-10" onClick={(e) => e.preventDefault()}>
                                    {getProductPreviewImages(product).slice(0, 4).map((img, idx) => (
                                      <div
                                        key={idx}
                                        onMouseEnter={(e) => {
                                          e.stopPropagation()
                                          setPreviewImageIndex(prev => ({ ...prev, [product._id]: idx }))
                                        }}
                                        className={`w-8 h-8 rounded border-2 shadow-sm overflow-hidden bg-white cursor-pointer transition-all hover:scale-110 ${
                                          previewImageIndex[product._id] === idx ? 'border-primary ring-1 ring-primary' : 'border-white hover:border-gray-300'
                                        }`}
                                      >
                                        <img src={getThumbnailUrl(img, 40)} alt="" className="w-full h-full object-cover pointer-events-none" loading="lazy" decoding="async" />
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* 操作按钮 */}
                                <div className={`absolute top-2 right-2 flex flex-col gap-2 transition-opacity duration-200 ${hoveredProductId === product._id ? 'opacity-100' : 'opacity-0'}`}>
                                  <button
                                    onClick={(e) => { e.preventDefault(); handleToggleFavorite(e, product) }}
                                    className={`p-2 rounded-full shadow-md transition-colors ${favoriteStatuses[product._id] ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:text-red-500'}`}
                                  >
                                    <Heart className={`h-4 w-4 ${favoriteStatuses[product._id] ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                              </div>

                              {/* 商品信息 */}
                              <div className={viewMode === 'list' ? 'flex-1 min-w-0 flex items-center justify-between' : ''}>
                                <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                                  <h3 className={`font-semibold hover:text-primary-600 transition-colors line-clamp-1 ${viewMode === 'grid' ? 'text-lg mb-2' : 'text-sm'}`}>
                                    {product.name}
                                  </h3>
                                  {viewMode === 'grid' && firstSku && ((firstSku as any).length || (firstSku as any).width || (firstSku as any).height) && (
                                    <div className="text-xs text-gray-500 mb-2">
                                      尺寸: {(firstSku as any).length || '-'}×{(firstSku as any).width || '-'}×{(firstSku as any).height || '-'} CM
                                    </div>
                                  )}
                                  {viewMode === 'list' && <div className="text-xs text-gray-400">{skus.length} 个规格</div>}
                                </div>
                                
                                <div className={viewMode === 'list' ? 'text-right ml-4' : 'flex items-baseline gap-2 mb-2'}>
                                  <span className={`font-bold text-red-600 ${viewMode === 'grid' ? 'text-2xl' : 'text-base'}`}>
                                    {formatPrice(displayPrice)}
                                  </span>
                                  {skus.length > 1 && <span className="text-xs text-gray-500">起</span>}
                                </div>
                                
                                {viewMode === 'grid' && (
                                  <div className="flex items-center justify-between text-xs">
                                    {product.style && <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded-full font-medium">{product.style}</span>}
                                    <span className="text-gray-500 ml-auto">{skus.length} 个规格</span>
                                  </div>
                                )}
                              </div>
                            </Link>
                          </div>
                        )
                      })()}
                    </motion.div>
                  ))}
                </div>

                {/* 分页控件 */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      上一页
                    </button>
                    <div className="flex gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-10 h-10 rounded-lg ${currentPage === page ? 'bg-primary-600 text-white' : 'border hover:bg-gray-50'}`}
                            >
                              {page}
                            </button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="w-10 h-10 flex items-center justify-center">...</span>
                        }
                        return null
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* 深绿色头部 */}
          <div className="bg-primary py-16 text-center">
            <h1 className="text-4xl font-serif font-bold text-white mb-2">{pageTitle}</h1>
            <p className="text-white/60 uppercase tracking-[0.3em] text-sm">
              {searchKeyword ? `找到 ${filteredProducts.length} 个商品` : 'PRODUCT CATALOG 2024'}
            </p>
          </div>

          <div className="max-w-[1800px] mx-auto px-4 lg:px-8 py-8">
            <div className="flex gap-8">
              {/* 侧边栏筛选 */}
              <aside className="w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 sticky top-24">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h3 className="font-serif font-bold text-lg text-primary">目录筛选 Catalog</h3>
              </div>

              {/* 风格筛选 */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-3">设计风格 STYLE</h4>
                <div className="space-y-1">
                  {styleOptions.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => {
                        setFilters({ ...filters, style: style.value })
                        setSearchParams({ ...Object.fromEntries(searchParams), style: style.value })
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 ${
                        filters.style === style.value
                          ? 'bg-primary text-white font-medium'
                          : 'hover:bg-stone-50 text-stone-600'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${filters.style === style.value ? 'bg-white' : 'border border-stone-300'}`}></div>
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 价格区间 */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">价格区间</h4>
                <div className="space-y-4">
                  {/* 价格输入框 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">最低价</label>
                      <input
                        type="number"
                        value={priceRangeInput[0]}
                        onChange={(e) => {
                          const value = Math.max(actualPriceRange[0], Math.min(Number(e.target.value), priceRangeInput[1] - 1))
                          setPriceRangeInput([value, priceRangeInput[1]])
                          setPriceRange([value, priceRangeInput[1]])
                          setFilters({ ...filters, priceRange: `${value}-${priceRangeInput[1]}` })
                        }}
                        className="input text-sm w-full"
                        min={actualPriceRange[0]}
                        max={priceRangeInput[1] - 1}
                        placeholder={`最低${actualPriceRange[0]}`}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">最高价</label>
                      <input
                        type="number"
                        value={priceRangeInput[1]}
                        onChange={(e) => {
                          const value = Math.max(priceRangeInput[0] + 1, Math.min(Number(e.target.value), actualPriceRange[1]))
                          setPriceRangeInput([priceRangeInput[0], value])
                          setPriceRange([priceRangeInput[0], value])
                          setFilters({ ...filters, priceRange: `${priceRangeInput[0]}-${value}` })
                        }}
                        className="input text-sm w-full"
                        min={priceRangeInput[0] + 1}
                        max={actualPriceRange[1]}
                        placeholder={`最高${actualPriceRange[1]}`}
                      />
                    </div>
                  </div>
                  
                  {/* 拖拽条 */}
                  <div className="relative h-2">
                    <div className="absolute w-full h-2 bg-gray-200 rounded-lg"></div>
                    <div 
                      className="absolute h-2 bg-primary-600 rounded-lg"
                      style={{
                        left: `${((priceRange[0] - actualPriceRange[0]) / (actualPriceRange[1] - actualPriceRange[0])) * 100}%`,
                        width: `${((priceRange[1] - priceRange[0]) / (actualPriceRange[1] - actualPriceRange[0])) * 100}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min={actualPriceRange[0]}
                      max={actualPriceRange[1]}
                      step="1000"
                      value={priceRange[0]}
                      onChange={(e) => {
                        const min = Number(e.target.value)
                        const max = Math.max(min, priceRange[1])
                        setPriceRange([min, max])
                        setPriceRangeInput([min, max])
                        setFilters({ ...filters, priceRange: `${min}-${max}` })
                      }}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
                      style={{ zIndex: 2 }}
                    />
                    <input
                      type="range"
                      min={actualPriceRange[0]}
                      max={actualPriceRange[1]}
                      step="1000"
                      value={priceRange[1]}
                      onChange={(e) => {
                        const max = Number(e.target.value)
                        const min = Math.min(max, priceRange[0])
                        setPriceRange([min, max])
                        setPriceRangeInput([min, max])
                        setFilters({ ...filters, priceRange: `${min}-${max}` })
                      }}
                      className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider"
                      style={{ zIndex: 2 }}
                    />
                  </div>
                  
                  {/* 显示当前价格区间 - 简化显示 */}
                  <div className="text-center text-sm text-gray-600">
                    {formatPriceSimplified(priceRange[0])} - {formatPriceSimplified(priceRange[1])}
                  </div>
                </div>
              </div>

              {/* 重置筛选 */}
              <button
                onClick={() => {
                  setFilters({ category: '', sub: '', style: '', priceRange: '', sort: 'recommend', series: '' })
                  setPriceRange(actualPriceRange as [number, number])
                  setPriceRangeInput(actualPriceRange as [number, number])
                }}
                className="w-full btn-secondary"
              >
                重置筛选
              </button>
            </div>
          </aside>

              {/* 主内容区 */}
              <main className="flex-1">
                {/* 风格卡片 - 从真实数据动态生成 */}
                {styleCards.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {styleCards.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => {
                      setFilters({ ...filters, style: stat.label })
                      setSearchParams({ ...Object.fromEntries(searchParams), style: stat.label })
                      setCurrentPage(1)
                    }}
                    className="relative overflow-hidden rounded-2xl cursor-pointer group aspect-[4/3] shadow-lg hover:shadow-xl transition-all"
                  >
                    {/* 背景图片 */}
                    {stat.image ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                        style={{ backgroundImage: `url(${getFileUrl(stat.image)})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary to-green-800" />
                    )}
                    
                    {/* 深色遮罩 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    
                    {/* 左上角图标 */}
                    <div className="absolute top-4 left-4 w-10 h-10 bg-primary/80 backdrop-blur rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    
                    {/* 右上角数量 */}
                    <div className="absolute top-4 right-4 w-7 h-7 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{stat.value}</span>
                    </div>
                    
                    {/* 底部文字 */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h3 className="text-xl font-serif font-bold mb-1">{stat.label}</h3>
                      <p className="text-xs text-white/60 uppercase tracking-wider">{stat.enLabel}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            )}

            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-6 bg-white rounded-xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-stone-600">
                  共 <span className="font-bold text-primary">{sortedProducts.length}</span> 个商品
                </span>
                
                {/* 筛选条件提示 */}
                {(filters.category || filters.sub || filters.style || searchKeyword) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {searchKeyword && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1">
                        搜索: {searchKeyword}
                        <button onClick={() => {
                          const params = new URLSearchParams(searchParams.toString())
                          params.delete('search')
                          setSearchParams(params)
                        }} className="hover:text-blue-900">×</button>
                      </span>
                    )}
                    {filters.category && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1">
                        分类: {categories.find(c => c._id === filters.category || c.slug === filters.category || c.name === filters.category)?.name || filters.category}
                        <button onClick={() => {
                          setFilters({ ...filters, category: '', sub: '' })
                          const params = new URLSearchParams(searchParams.toString())
                          params.delete('category')
                          params.delete('sub')
                          setSearchParams(params)
                        }} className="hover:text-primary/80">×</button>
                      </span>
                    )}
                    {filters.sub && (
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs flex items-center gap-1">
                        细分: {subLabel || filters.sub}
                        <button onClick={() => {
                          setFilters({ ...filters, sub: '' })
                          const params = new URLSearchParams(searchParams.toString())
                          params.delete('sub')
                          setSearchParams(params)
                        }} className="hover:text-indigo-900">×</button>
                      </span>
                    )}
                    {filters.style && (
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs flex items-center gap-1">
                        风格: {filters.style}
                        <button onClick={() => {
                          setFilters({ ...filters, style: '' })
                          const params = new URLSearchParams(searchParams.toString())
                          params.delete('style')
                          setSearchParams(params)
                        }} className="hover:text-amber-900">×</button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* 排序 */}
                <select
                  value={filters.sort}
                  onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                  className="input py-2"
                >
                  <option value="recommend">智能推荐</option>
                  <option value="hot">综合热度</option>
                  <option value="newest">最新上架</option>
                  <option value="sales">销量最高</option>
                  <option value="views">浏览最多</option>
                  <option value="price-asc">价格从低到高</option>
                  <option value="price-desc">价格从高到低</option>
                </select>

                {/* 视图切换 */}
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <Grid className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 商品列表 */}
            {sortedProducts.length === 0 ? (
              <div className="card py-16 text-center">
                <p className="text-gray-500 text-lg">暂无商品</p>
              </div>
            ) : (
              <>
              <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5' : 'space-y-3'}>
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={viewMode === 'grid' ? 'card hover:shadow-lg transition-shadow' : 'bg-white rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow border border-stone-100'}
                  >
                    {(() => {
                      const skus = Array.isArray((product as any).skus) ? (product as any).skus : []
                      const displayPrice = getDisplayPrice(product as any)
                      const firstSku = skus[0]
                      return (
                    <div
                      onMouseEnter={() => setHoveredProductId(product._id)}
                      onMouseLeave={() => {
                        setHoveredProductId(null)
                        setPreviewImageIndex(prev => {
                          const newState = { ...prev }
                          delete newState[product._id]
                          return newState
                        })
                      }}
                      className={viewMode === 'list' ? 'flex gap-4' : ''}
                    >
                      <Link to={`/products/${product._id}`} className={viewMode === 'list' ? 'flex gap-4 w-full' : ''}>
                        {/* 商品图片 */}
                        <div className={`relative overflow-hidden rounded-lg bg-gray-100 group ${viewMode === 'grid' ? 'aspect-square mb-4' : 'w-24 h-24 flex-shrink-0'}`}>
                          {/* 主图 - 根据预览索引显示 */}
                          <img
                            src={getThumbnailUrl(getProductPreviewImages(product)[previewImageIndex[product._id] || 0] || (product.images && product.images[0]) || '/placeholder.png', 280)}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            decoding="async"
                          />
                          
                          {/* SKU预览小方块 - 只在网格模式显示 */}
                          {viewMode === 'grid' && getProductPreviewImages(product).length > 1 && (
                            <div 
                              className="absolute bottom-2 left-2 flex gap-1 z-10"
                              onClick={(e) => e.preventDefault()}
                            >
                              {getProductPreviewImages(product).slice(0, 4).map((img, idx) => (
                                <div
                                  key={idx}
                                  onMouseEnter={(e) => {
                                    e.stopPropagation()
                                    setPreviewImageIndex(prev => ({ ...prev, [product._id]: idx }))
                                  }}
                                  className={`w-8 h-8 rounded border-2 shadow-sm overflow-hidden bg-white cursor-pointer transition-all hover:scale-110 ${
                                    previewImageIndex[product._id] === idx
                                      ? 'border-primary ring-1 ring-primary'
                                      : 'border-white hover:border-gray-300'
                                  }`}
                                >
                                  <img
                                    src={getThumbnailUrl(img, 40)}
                                    alt=""
                                    className="w-full h-full object-cover pointer-events-none"
                                    loading="lazy"
                                    decoding="async"
                                  />
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 操作按钮 - 只在鼠标悬停时显示 */}
                          <div className={`absolute top-2 right-2 flex flex-col gap-2 transition-opacity duration-200 ${
                            hoveredProductId === product._id ? 'opacity-100' : 'opacity-0'
                          }`}>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                handleToggleFavorite(e, product)
                              }}
                              className={`p-2 rounded-full shadow-md transition-colors ${
                                favoriteStatuses[product._id]
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white text-gray-600 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${favoriteStatuses[product._id] ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>

                      {/* 商品信息 */}
                      <div className={viewMode === 'list' ? 'flex-1 min-w-0 flex items-center justify-between' : ''}>
                        <div className={viewMode === 'list' ? 'flex-1 min-w-0' : ''}>
                          <h3 className={`font-semibold hover:text-primary-600 transition-colors line-clamp-1 ${viewMode === 'grid' ? 'text-lg mb-2' : 'text-sm'}`}>
                            {product.name}
                          </h3>
                          
                          {/* 显示尺寸信息 - 列表模式下显示更紧凑 */}
                          {viewMode === 'grid' && firstSku && ((firstSku as any).length || (firstSku as any).width || (firstSku as any).height) && (
                            <div className="text-xs text-gray-500 mb-2">
                              尺寸: {(firstSku as any).length || '-'}×{(firstSku as any).width || '-'}×{(firstSku as any).height || '-'} CM
                            </div>
                          )}
                          {viewMode === 'list' && (
                            <div className="text-xs text-gray-400">
                              {skus.length} 个规格
                            </div>
                          )}
                        </div>
                        
                        <div className={viewMode === 'list' ? 'text-right ml-4' : 'flex items-baseline gap-2 mb-2'}>
                          <span className={`font-bold text-red-600 ${viewMode === 'grid' ? 'text-2xl' : 'text-base'}`}>
                            {formatPrice(displayPrice)}
                          </span>
                          {skus.length > 1 && (
                            <span className="text-xs text-gray-500">起</span>
                          )}
                        </div>
                        
                        {/* 网格模式下显示风格标签 */}
                        {viewMode === 'grid' && (
                          <div className="flex items-center justify-between text-xs">
                            {product.style && (
                              <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded-full font-medium">
                                {product.style}
                              </span>
                            )}
                            <span className="text-gray-500 ml-auto">{skus.length} 个规格</span>
                          </div>
                        )}
                      </div>
                      </Link>
                    </div>
                      )
                    })()}
                  </motion.div>
                ))}
              </div>

              {/* 分页控件 */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    上一页
                  </button>
                  
                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-lg ${
                              currentPage === page
                                ? 'bg-primary-600 text-white'
                                : 'border hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="w-10 h-10 flex items-center justify-center">...</span>
                      }
                      return null
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    下一页
                  </button>
                </div>
            )}
          </>
        )}
      </main>
    </div>
  </div>
        </>
      )}
    </div>
  )

}
