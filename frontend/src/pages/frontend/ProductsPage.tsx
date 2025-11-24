import { useState, useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Grid, List, SlidersHorizontal, Heart, Scale, TrendingUp, Star, Zap } from 'lucide-react'
import { Product } from '@/types'
import { formatPrice } from '@/lib/utils'
// 使用真实API服务
import { getProducts as getAllProducts } from '@/services/productService'
import { getAllCategories } from '@/services/categoryService'
import { useFavoriteStore } from '@/store/favoriteStore'
import { useCompareStore } from '@/store/compareStore'
import { toast } from 'sonner'

import { getFileUrl } from '@/services/uploadService'
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

export default function ProductsPage() {
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
  const { isInCompare, addToCompare: addToCompareStore, loadCompareItems } = useCompareStore()

  // 筛选条件
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    style: searchParams.get('style') || '',
    priceRange: searchParams.get('priceRange') || '',
    sort: searchParams.get('sort') || 'newest',
  })
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 18

  // 价格区间拖拽条状态（初始值会在商品加载后更新）
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000])
  const [priceRangeInput, setPriceRangeInput] = useState<[number, number]>([0, 500000])

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
  
  // 风格卡片图片配置（从网站配置加载）
  const [styleCardImages, setStyleCardImages] = useState<Record<string, string>>({})

  // 加载商品数据
  useEffect(() => {
    loadProducts()
    loadCategories()
    loadFavorites()
    loadCompareItems()
    loadStyleImages()
  }, [])
  
  // 当商品或收藏列表变化时，更新收藏状态
  useEffect(() => {
    const updateFavoriteStatuses = () => {
      const statuses: Record<string, boolean> = {}
      products.forEach(product => {
        statuses[product._id] = favorites.some(fav => {
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
    const style = searchParams.get('style') || ''
    const priceRange = searchParams.get('priceRange') || ''
    const sort = searchParams.get('sort') || 'newest'
    
    setFilters({
      category,
      style,
      priceRange,
      sort,
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
      const response = await getAllProducts();
      console.log('[ProductsPage] 加载商品响应:', response);
      if (response.success && response.data) {
        // 只显示上架的商品
        const activeProducts = (response.data || []).filter((p: Product) => p.status !== 'inactive');
        
        // 调试：检查商品的风格数据
        console.log('🔥 [ProductsPage] 加载商品数量:', activeProducts.length);
        console.log('🔥 [ProductsPage] 前3个商品详情:', 
          activeProducts.slice(0, 3).map((p: any) => ({ 
            id: p._id,
            name: p.name, 
            styles: p.styles,
            style: p.style,
            views: p.views,
            sales: p.sales,
            createdAt: p.createdAt
          }))
        );
        
        // 检查有风格标签的商品
        const productsWithStyles = activeProducts.filter((p: any) => p.styles && p.styles.length > 0)
        console.log('🔥 [ProductsPage] 有风格标签的商品数量:', productsWithStyles.length);
        if (productsWithStyles.length > 0) {
          console.log('🔥 [ProductsPage] 有风格标签的商品示例:', 
            productsWithStyles.slice(0, 3).map((p: any) => ({ 
              name: p.name, 
              styles: p.styles 
            }))
          );
        }
        
        setProducts(activeProducts);
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

  // 筛选商品
  const filteredProducts = products.filter(product => {
    // 分类筛选 - 支持多个分类（用逗号分隔）
    if (filters.category) {
      const categoryIds = filters.category.split(',').map(id => id.trim())
      // 如果是大类ID，需要包含该大类及其所有子分类
      const allCategoryIds = new Set<string>()
      categoryIds.forEach(catId => {
        allCategoryIds.add(catId)
        // 如果是大类，添加所有子分类
        if (catId === '3') { // 沙发大类
          ['301', '302', '303', '304', '305', '306', '307', '308'].forEach(id => allCategoryIds.add(id))
        } else if (catId === '6') { // 床大类
          ['601', '602', '603', '604', '605', '606'].forEach(id => allCategoryIds.add(id))
        } else if (catId === '4') { // 桌/几大类
          ['401', '402', '403'].forEach(id => allCategoryIds.add(id))
        } else if (catId === '5') { // 椅/凳大类
          ['501', '502', '503', '504', '505', '506', '507', '508', '509'].forEach(id => allCategoryIds.add(id))
        }
      })
      // 检查商品分类是否匹配
      const productCategoryId = String(product.category)
      if (!allCategoryIds.has(productCategoryId)) {
        return false
      }
    }
    
    // 风格筛选 - 从styles数组中匹配
    if (filters.style) {
      const productStyles = (product as any).styles || []
      
      // 添加调试日志
      console.log(`🔍 风格筛选: 商品"${product.name}" 的风格:`, productStyles, '| 筛选条件:', filters.style, '| 匹配:', productStyles.includes(filters.style))
      
      if (!Array.isArray(productStyles) || !productStyles.includes(filters.style)) {
        return false
      }
    }
    
    // 价格筛选
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number)
      if (max) {
        if (product.basePrice < min || product.basePrice > max) return false
      } else {
        if (product.basePrice < min) return false
      }
    }
    
    return true
  })

  // 动态计算价格区间
  const actualPriceRange = useMemo(() => {
    if (products.length === 0) return [0, 500000]
    const prices = products.map(p => p.basePrice)
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
    switch (filters.sort) {
      case 'price-asc':
        return a.basePrice - b.basePrice
      case 'price-desc':
        return b.basePrice - a.basePrice
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
  const handleToggleFavorite = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    const added = toggleFavorite(product)
    if (added) {
      toast.success('已添加到收藏')
    } else {
      toast.success('已取消收藏')
    }
  }

  // 添加到对比
  const handleAddToCompare = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    // 添加产品的第一个SKU到对比列表
    const firstSku = product.skus && product.skus[0]
    if (!firstSku) {
      toast.error('该商品暂无可选规格')
      return
    }
    const result = addToCompareStore(product._id, firstSku._id)
    if (result.success) {
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  // 获取商品SKU预览图
  const getProductPreviewImages = (product: Product) => {
    // 获取前4个SKU的首图
    const skuImages = (product.skus || [])
      .slice(0, 4)
      .map(sku => sku.images && sku.images[0])
      .filter(Boolean)
    
    return skuImages.length > 0 ? skuImages : [(product.images && product.images[0]) || '/placeholder.png']
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* 面包屑 */}
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-gray-600 hover:text-primary-600">首页</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-900 font-medium">商城</span>
        </div>

        <div className="flex gap-8">
          {/* 侧边栏筛选 */}
          <aside className="w-64 flex-shrink-0">
            <div className="card sticky top-24">
              <h3 className="font-semibold text-lg mb-4">筛选</h3>

              {/* 风格筛选 */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">风格</h4>
                <div className="space-y-2">
                  {styleOptions.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => {
                        setFilters({ ...filters, style: style.value })
                        setSearchParams({ ...Object.fromEntries(searchParams), style: style.value })
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        filters.style === style.value
                          ? 'bg-primary-100 text-primary-700 font-medium'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
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
                  setFilters({ category: '', style: '', priceRange: '', sort: 'newest' })
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
            {/* 商城统计卡片 - 风格展示（宽卡片带图片） */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                { label: '现代风', value: products.filter(p => (p as any).styles?.includes('现代风')).length, icon: Grid, color: 'text-blue-600', bgColor: 'from-blue-500 to-blue-600', image: styleCardImages['现代风'] },
                { label: '中古风', value: products.filter(p => (p as any).styles?.includes('中古风')).length, icon: TrendingUp, color: 'text-amber-600', bgColor: 'from-amber-500 to-amber-600', image: styleCardImages['中古风'] },
                { label: '轻奢风', value: products.filter(p => (p as any).styles?.includes('轻奢风')).length, icon: Zap, color: 'text-purple-600', bgColor: 'from-purple-500 to-purple-600', image: styleCardImages['轻奢风'] },
                { label: '极简风', value: products.filter(p => (p as any).styles?.includes('极简风')).length, icon: Star, color: 'text-gray-600', bgColor: 'from-gray-500 to-gray-600', image: styleCardImages['极简风'] },
              ].map((stat, index) => {
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
                    className="relative overflow-hidden rounded-xl cursor-pointer group h-32 shadow-md hover:shadow-xl transition-all"
                  >
                    {/* 背景图片 */}
                    {stat.image ? (
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-110"
                        style={{ backgroundImage: `url(${getFileUrl(stat.image)})` }}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-60`} />
                      </div>
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor}`} />
                    )}
                    
                    {/* 内容 */}
                    <div className="relative h-full flex flex-col justify-between p-5 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold tracking-wide">{stat.label}</h3>
                        <Icon className="h-6 w-6 opacity-80" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black">{stat.value}</span>
                        <span className="text-sm opacity-90">件商品</span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-6">
              <div className="text-sm text-gray-600">
                共 <span className="font-semibold text-gray-900">{sortedProducts.length}</span> 个商品
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
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {paginatedProducts.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card hover:shadow-lg transition-shadow"
                  >
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
                    >
                      <Link to={`/products/${product._id}`}>
                        {/* 商品图片 */}
                        <div className="relative aspect-square mb-4 overflow-hidden rounded-lg bg-gray-100 group">
                          {/* 主图 - 根据预览索引显示 */}
                          <img
                            src={getFileUrl(getProductPreviewImages(product)[previewImageIndex[product._id] || 0] || (product.images && product.images[0]) || '/placeholder.png')}
                            alt={product.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                          
                          {/* SKU预览小方块 */}
                          <div className="absolute bottom-2 left-2 flex gap-1">
                            {getProductPreviewImages(product).slice(0, 4).map((img, idx) => (
                              <div
                                key={idx}
                                onMouseEnter={() => setPreviewImageIndex(prev => ({ ...prev, [product._id]: idx }))}
                                className={`w-8 h-8 rounded border-2 shadow-sm overflow-hidden bg-white cursor-pointer transition-all ${
                                  (previewImageIndex[product._id] === idx) && hoveredProductId === product._id
                                    ? 'border-red-500 scale-110'
                                    : 'border-white'
                                }`}
                              >
                                <img
                                  src={getFileUrl(img)}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                          </div>

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
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleAddToCompare(e, product)
                              }}
                              className={`p-2 rounded-full shadow-md transition-colors ${
                                product.skus && product.skus[0] && isInCompare(product._id, product.skus[0]._id)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-white text-gray-600 hover:text-blue-500'
                              }`}
                            >
                              <Scale className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                      {/* 商品信息 */}
                      <div>
                        <h3 className="font-semibold text-lg hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-red-600">
                            {formatPrice(product.basePrice)}
                          </span>
                          {product.skus.length > 1 && (
                            <span className="text-sm text-gray-500">起</span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          {product.style && (
                            <span className="px-2 py-1 bg-primary-50 text-primary-600 rounded-full font-medium">
                              {product.style}
                            </span>
                          )}
                          <span className="text-gray-500 ml-auto">{product.skus.length} 个规格</span>
                        </div>
                      </div>
                      </Link>
                    </div>
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
    </div>
  )
}
