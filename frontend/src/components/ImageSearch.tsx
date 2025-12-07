import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, Search, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

interface MatchedProduct {
  productId: string;
  productName: string;
  similarity: number;
  productImage: string;
}

interface SearchResult {
  searchId: string;
  detectedSource: string;
  watermarkDetails: {
    hasWatermark: boolean;
    watermarkText: string;
    confidence: number;
  };
  matchedProducts: MatchedProduct[];
}

const sourceLabels: Record<string, { name: string; color: string }> = {
  xiaohongshu: { name: '小红书', color: 'bg-red-100 text-red-700' },
  douyin: { name: '抖音', color: 'bg-gray-900 text-white' },
  kuaishou: { name: '快手', color: 'bg-orange-100 text-orange-700' },
  weibo: { name: '微博', color: 'bg-red-500 text-white' },
  taobao: { name: '淘宝/天猫', color: 'bg-orange-500 text-white' },
  pinterest: { name: 'Pinterest', color: 'bg-red-600 text-white' },
  unknown: { name: '其他平台', color: 'bg-gray-100 text-gray-700' },
  none: { name: '无水印', color: 'bg-green-100 text-green-700' }
};

interface ImageSearchProps {
  onProductClick?: (productId: string) => void;
}

export default function ImageSearch({ onProductClick }: ImageSearchProps) {
  const [image, setImage] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('图片大小不能超过10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleSearch = async () => {
    if (!image) return;

    setSearching(true);
    try {
      // 提取base64数据
      const base64Data = image.split(',')[1];
      
      const response = await apiClient.post('/image-search/search', {
        imageData: base64Data,
        channel: 'web',
        deviceInfo: {
          platform: navigator.platform,
          browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
                   navigator.userAgent.includes('Firefox') ? 'Firefox' : 
                   navigator.userAgent.includes('Safari') ? 'Safari' : 'Other',
          userAgent: navigator.userAgent
        }
      });

      if (response.data.success) {
        setResult(response.data.data);
        if (response.data.data.watermarkDetails?.hasWatermark) {
          toast.success(`检测到来源: ${sourceLabels[response.data.data.detectedSource]?.name || '未知'}`);
        }
      }
    } catch (error) {
      console.error('搜索失败:', error);
      toast.error('搜索失败，请重试');
    } finally {
      setSearching(false);
    }
  };

  const handleProductClick = async (product: MatchedProduct) => {
    // 记录用户行为
    if (result?.searchId) {
      try {
        await apiClient.post(`/image-search/follow-up/${result.searchId}`, {
          action: 'view_product',
          productId: product.productId
        });
      } catch (e) {}
    }
    
    onProductClick?.(product.productId);
  };

  const clearImage = () => {
    setImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center">
          <Camera className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">以图搜图</h2>
          <p className="text-sm text-gray-500">上传图片，找到同款商品</p>
        </div>
      </div>

      {/* 上传区域 */}
      {!image ? (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
            ${dragOver ? 'border-cyan-400 bg-cyan-50' : 'border-gray-200 hover:border-cyan-300 hover:bg-gray-50'}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 font-medium mb-2">拖拽图片到这里，或点击上传</p>
          <p className="text-sm text-gray-400">支持 JPG、PNG、WEBP，最大 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 预览图片 */}
          <div className="relative rounded-xl overflow-hidden bg-gray-100">
            <img src={image} alt="预览" className="w-full max-h-80 object-contain" />
            <button
              onClick={clearImage}
              className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 搜索按钮 */}
          {!result && (
            <button
              onClick={handleSearch}
              disabled={searching}
              className="w-full py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 text-white font-semibold rounded-xl 
                hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  正在搜索...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  开始搜索
                </>
              )}
            </button>
          )}

          {/* 搜索结果 */}
          {result && (
            <div className="space-y-4">
              {/* 来源检测结果 */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">检测到的来源：</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${sourceLabels[result.detectedSource]?.color}`}>
                    {sourceLabels[result.detectedSource]?.name || '未知'}
                  </span>
                </div>
                {result.watermarkDetails?.watermarkText && (
                  <p className="text-xs text-gray-500 mt-2">
                    识别到水印文字：{result.watermarkDetails.watermarkText}
                  </p>
                )}
              </div>

              {/* 匹配的商品 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">相似商品</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {result.matchedProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="bg-white border rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleProductClick(product)}
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                        {product.productImage ? (
                          <img src={product.productImage} alt={product.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Camera className="w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">{product.productName}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-cyan-600">相似度 {product.similarity}%</span>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 重新搜索 */}
              <button
                onClick={clearImage}
                className="w-full py-2 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50"
              >
                换一张图片
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
