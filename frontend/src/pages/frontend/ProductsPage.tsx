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
  
  const { isFavorited, toggleFavorite, loadFavorites } = useFavoriteStore()
  const { isInCompare, addToCompare: addToCompareStore, loadCompareItems } = useCompareStore()

  // 筛选条件
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    style: searchParams.get('style') || '',
    priceRange: searchParams.get('priceRange') || '',
    sort: searchParams.get('sort') || 'newest',
  })
  
  // 价格区间拖拽条状态
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000])
  const [priceRangeInput, setPriceRangeInput] = useState<[number, number]>([0, 500000])

  // 加载商品数据
  useEffect(() => {
    loadProducts()
    loadCategories()
    loadFavorites()
    loadCompareItems()
  }, [])

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
    } else {
      setPriceRange([0, 500000])
      setPriceRangeInput([0, 500000])
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
        console.log('[ProductsPage] 加载商品数量:', activeProducts.length);
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
    
    // 风格筛选
    if (filters.style && product.style !== filters.style) {
      return false
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

  // 排序
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (filters.sort) {
      case 'price-asc':
        return a.basePrice - b.basePrice
      case 'price-desc':
        return b.basePrice - a.basePrice
      case 'sales':
        return (b.sales || 0) - (a.sales || 0)
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
  })

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
    const firstSku = product.skus[0]
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
    
    return skuImages.length > 0 ? skuImages : [product.images[0]]
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

              {/* 热销商品排行榜 */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">热销商品</h4>
                <div className="space-y-2">
                  {products
                    .filter(p => p.status !== 'inactive' && (p.sales || 0) > 0)
                    .sort((a, b) => (b.sales || 0) - (a.sales || 0))
                    .slice(0, 10)
                    .map((product, index) => (
                      <Link
                        key={product._id}
                        to={`/products/${product._id}`}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                      >
                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-primary-600 line-clamp-1">
                            {product.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            已售 {product.sales} 件
                          </div>
                        </div>
                      </Link>
                    ))}
                  {products.filter(p => p.status !== 'inactive' && (p.sales || 0) > 0).length === 0 && (
                    <div className="text-xs text-gray-400 py-4 text-center">暂无热销商品</div>
                  )}
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
                          const value = Math.max(0, Math.min(Number(e.target.value), priceRangeInput[1] - 1))
                          setPriceRangeInput([value, priceRangeInput[1]])
                          setPriceRange([value, priceRangeInput[1]])
                          setFilters({ ...filters, priceRange: `${value}-${priceRangeInput[1]}` })
                        }}
                        className="input text-sm w-full"
                        min="0"
                        max={priceRangeInput[1] - 1}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">最高价</label>
                      <input
                        type="number"
                        value={priceRangeInput[1]}
                        onChange={(e) => {
                          const value = Math.max(priceRangeInput[0] + 1, Math.min(Number(e.target.value), 500000))
                          setPriceRangeInput([priceRangeInput[0], value])
                          setPriceRange([priceRangeInput[0], value])
                          setFilters({ ...filters, priceRange: `${priceRangeInput[0]}-${value}` })
                        }}
                        className="input text-sm w-full"
                        min={priceRangeInput[0] + 1}
                        max="500000"
                      />
                    </div>
                  </div>
                  
                  {/* 拖拽条 */}
                  <div className="relative h-2">
                    <div className="absolute w-full h-2 bg-gray-200 rounded-lg"></div>
                    <div 
                      className="absolute h-2 bg-primary-600 rounded-lg"
                      style={{
                        left: `${(priceRange[0] / 500000) * 100}%`,
                        width: `${((priceRange[1] - priceRange[0]) / 500000) * 100}%`
                      }}
                    ></div>
                    <input
                      type="range"
                      min="0"
                      max="500000"
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
                      min="0"
                      max="500000"
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
                  setPriceRange([0, 500000])
                  setPriceRangeInput([0, 500000])
                }}
                className="w-full btn-secondary"
              >
                重置筛选
              </button>
            </div>
          </aside>

          {/* 主内容区 */}
          <main className="flex-1">
            {/* 商城统计卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: '商品总数', value: products.length, icon: Grid, color: 'text-blue-600' },
                { label: '热销商品', value: products.filter(p => (p.sales || 0) > 0).length, icon: TrendingUp, color: 'text-red-600' },
                { label: '新品上架', value: products.filter(p => new Date(p.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000).length, icon: Zap, color: 'text-yellow-600' },
                { label: '平均评分', value: '4.8', icon: Star, color: 'text-orange-600' },
              ].map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gray-50`}>
                        <Icon className={`h-5 w-5 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">{stat.label}</p>
                        <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
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
                  <option value="newest">最新上架</option>
                  <option value="sales">销量最高</option>
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
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {sortedProducts.map((product, index) => (
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
                            src={getProductPreviewImages(product)[previewImageIndex[product._id] || 0] || product.images[0]}
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
                                  src={img}
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
                                e.stopPropagation()
                                handleToggleFavorite(e, product)
                              }}
                              className={`p-2 rounded-full shadow-md transition-colors ${
                                isFavorited(product._id)
                                  ? 'bg-red-500 text-white'
                                  : 'bg-white text-gray-600 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${isFavorited(product._id) ? 'fill-current' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleAddToCompare(e, product)
                              }}
                              className={`p-2 rounded-full shadow-md transition-colors ${
                                product.skus[0] && isInCompare(product._id, product.skus[0]._id)
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

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>已售 {product.sales} 件</span>
                          <span>{product.skus.length} 个规格</span>
                        </div>
                      </div>
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
