import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Camera, Upload, Loader2, Sofa } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { getFileUrl } from '@/services/uploadService'
import { formatPrice } from '@/lib/utils'

interface ImageSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface MatchedProduct {
  productId: string
  productName: string
  similarity: number
  productImage: string
}

interface SearchResult {
  searchId: string
  detectedSource: string
  watermarkDetails: {
    hasWatermark: boolean
    watermarkText: string
    confidence: number
  }
  matchedProducts: MatchedProduct[]
}

const sourceLabels: Record<string, { name: string; color: string }> = {
  xiaohongshu: { name: '小红书', color: '#FF2442' },
  douyin: { name: '抖音', color: '#1F1F1F' },
  kuaishou: { name: '快手', color: '#FF5722' },
  weibo: { name: '微博', color: '#E6162D' },
  taobao: { name: '淘宝/天猫', color: '#FF4400' },
  pinterest: { name: 'Pinterest', color: '#E60023' },
  unknown: { name: '其他平台', color: '#666666' },
  none: { name: '无水印', color: '#22C55E' }
}

export default function ImageSearchModal({ isOpen, onClose }: ImageSearchModalProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('图片大小不能超过10MB')
        return
      }
      
      const reader = new FileReader()
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string)
        setResult(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSearch = async () => {
    if (!selectedImage || searching) return

    setSearching(true)
    setError(null)

    try {
      const base64Data = selectedImage.split(',')[1]
      
      const response = await apiClient.post('/image-search/search', {
        imageData: base64Data,
        channel: 'web'
      })

      if (response.data.success) {
        const data = response.data.data
        // 处理图片URL
        if (data.matchedProducts) {
          data.matchedProducts = data.matchedProducts.map((p: MatchedProduct) => ({
            ...p,
            productImage: p.productImage && !p.productImage.startsWith('http')
              ? getFileUrl(p.productImage)
              : p.productImage
          }))
        }
        setResult(data)
      } else {
        setError(response.data.message || '搜索失败')
      }
    } catch (err: any) {
      console.error('图片搜索失败:', err)
      setError('搜索失败，请重试')
    } finally {
      setSearching(false)
    }
  }

  const handleProductClick = async (productId: string) => {
    // 记录用户行为
    if (result?.searchId) {
      try {
        await apiClient.post(`/image-search/follow-up/${result.searchId}`, {
          action: 'view_product',
          productId
        })
      } catch (e) {}
    }
    
    onClose()
    navigate(`/products/${productId}`)
  }

  const handleClear = () => {
    setSelectedImage(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClose = () => {
    handleClear()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">以图搜索</h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Upload Area */}
          {!selectedImage ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">点击上传图片</p>
              <p className="text-sm text-gray-400">支持 JPG、PNG 格式，最大 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative">
                <img 
                  src={selectedImage} 
                  alt="预览" 
                  className="w-full max-h-64 object-contain rounded-xl bg-gray-100"
                />
                <button
                  onClick={handleClear}
                  className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Button */}
              {!result && (
                <button
                  onClick={handleSearch}
                  disabled={searching}
                  className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {searching ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      搜索中...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5" />
                      开始搜索
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-6 space-y-4">
              {/* Source Detection */}
              {result.watermarkDetails?.hasWatermark && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">检测到来源：</span>
                  <span 
                    className="px-2 py-1 text-xs text-white rounded-full"
                    style={{ backgroundColor: sourceLabels[result.detectedSource]?.color || '#666' }}
                  >
                    {sourceLabels[result.detectedSource]?.name || '未知'}
                  </span>
                  {result.watermarkDetails.watermarkText && (
                    <span className="text-xs text-gray-400">
                      ({result.watermarkDetails.watermarkText})
                    </span>
                  )}
                </div>
              )}

              {/* Matched Products */}
              <div>
                <h3 className="font-medium text-gray-800 mb-3">相似商品</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {result.matchedProducts.map((product) => (
                    <div
                      key={product.productId}
                      onClick={() => handleProductClick(product.productId)}
                      className="bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-all cursor-pointer group"
                    >
                      <div className="aspect-square bg-gray-100 relative overflow-hidden">
                        {product.productImage ? (
                          <img
                            src={product.productImage}
                            alt={product.productName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Sofa className="w-12 h-12" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-1 bg-primary/90 text-white text-xs rounded-full">
                          {product.similarity}% 相似
                        </div>
                      </div>
                      <div className="p-3">
                        <h4 className="font-medium text-sm text-gray-800 line-clamp-2">
                          {product.productName}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retry Button */}
              <button
                onClick={handleClear}
                className="w-full py-3 border border-gray-300 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                换一张图片
              </button>
            </div>
          )}

          {/* Tips */}
          {!selectedImage && !result && (
            <div className="mt-6 p-4 bg-blue-50 rounded-xl">
              <h4 className="font-medium text-blue-800 mb-2">💡 使用说明</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>1. 上传您喜欢的家具图片</li>
                <li>2. 系统会自动识别图片来源（小红书、抖音等）</li>
                <li>3. 为您匹配相似的商品</li>
                <li>4. 点击商品查看详情</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
