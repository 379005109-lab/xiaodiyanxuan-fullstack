import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Clock, TrendingUp, ArrowRight, Package } from 'lucide-react'
import { getProducts } from '@/services/productService'
import { getFileUrl } from '@/services/uploadService'
import { formatPrice } from '@/lib/utils'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface Product {
  _id: string
  name: string
  basePrice: number
  images?: string[]
  category?: string
  categoryName?: string
}

// 热门搜索关键词
const hotKeywords = ['沙发', '茶几', '餐桌', '床', '衣柜', '书柜', '电视柜', '鞋柜']

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 加载最近搜索
  useEffect(() => {
    const saved = localStorage.getItem('recent_searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // 关联搜索（模糊匹配）
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSuggestions([])
      return
    }

    setLoading(true)
    try {
      const result = await getProducts({ pageSize: 10 })
      const allProducts = result.data || []
      
      // 模糊匹配：搜索名称、分类、型号
      const query = searchQuery.toLowerCase()
      const matched = allProducts.filter((p: Product) => {
        const name = (p.name || '').toLowerCase()
        const category = (p.categoryName || p.category || '').toLowerCase()
        
        // 模糊匹配逻辑
        // 1. 包含完整关键词
        if (name.includes(query) || category.includes(query)) return true
        
        // 2. 拼音首字母匹配（简化版 - 检查每个字是否匹配）
        const queryChars = query.split('')
        let nameIndex = 0
        for (const char of queryChars) {
          const foundIndex = name.indexOf(char, nameIndex)
          if (foundIndex === -1) break
          nameIndex = foundIndex + 1
          if (nameIndex >= name.length && queryChars.indexOf(char) < queryChars.length - 1) break
        }
        if (nameIndex > 0 && queryChars.length > 1) return true
        
        return false
      })
      
      setSuggestions(matched.slice(0, 8))
    } catch (error) {
      console.error('搜索失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // 防抖搜索
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(query)
    }, 300)
    
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, fetchSuggestions])

  // 执行搜索
  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return
    
    // 保存到最近搜索
    const updatedRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10)
    setRecentSearches(updatedRecent)
    localStorage.setItem('recent_searches', JSON.stringify(updatedRecent))
    
    // 跳转到商品页
    navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    onClose()
    setQuery('')
  }

  // 点击商品
  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`)
    onClose()
    setQuery('')
  }

  // 清除最近搜索
  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recent_searches')
  }

  // 按ESC关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 搜索输入框 */}
        <div className="flex items-center gap-3 p-4 border-b">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(query)
              }
            }}
            placeholder="搜索商品名称、型号、分类..."
            className="flex-1 text-lg outline-none placeholder:text-gray-400"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => handleSearch(query)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            搜索
          </button>
        </div>

        {/* 搜索内容区 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* 搜索建议 */}
          {query && suggestions.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                相关商品
              </h3>
              <div className="space-y-2">
                {suggestions.map((product) => (
                  <div
                    key={product._id}
                    onClick={() => handleProductClick(product._id)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer group transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {product.images && product.images[0] ? (
                        <img 
                          src={getFileUrl(product.images[0])} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {product.categoryName || product.category}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">¥{formatPrice(product.basePrice)}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                  </div>
                ))}
              </div>
              
              {/* 查看全部结果 */}
              <button
                onClick={() => handleSearch(query)}
                className="w-full mt-3 py-2.5 text-center text-primary hover:bg-primary/5 rounded-xl transition-colors text-sm font-medium"
              >
                查看全部 "{query}" 的搜索结果 →
              </button>
            </div>
          )}

          {/* 加载中 */}
          {loading && query && (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              搜索中...
            </div>
          )}

          {/* 无结果 */}
          {query && !loading && suggestions.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>未找到相关商品</p>
              <p className="text-sm mt-1">试试其他关键词</p>
            </div>
          )}

          {/* 默认内容 - 最近搜索和热门搜索 */}
          {!query && (
            <div className="p-4 space-y-6">
              {/* 最近搜索 */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      最近搜索
                    </h3>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      清除
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map((keyword, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(keyword)}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                      >
                        {keyword}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 热门搜索 */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" />
                  热门搜索
                </h3>
                <div className="flex flex-wrap gap-2">
                  {hotKeywords.map((keyword, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(keyword)}
                      className="px-3 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-full text-sm text-primary transition-colors"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
