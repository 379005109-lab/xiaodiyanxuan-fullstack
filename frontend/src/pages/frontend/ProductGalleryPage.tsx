import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Check, Download, Grid, List, Filter, X } from 'lucide-react';
import { getProductById } from '@/services/productService';
import { Product, ProductSKU } from '@/types';
import apiClient from '@/lib/apiClient';
import { getFileUrl } from '@/services/uploadService';
import { toast } from 'sonner';

const isVideoFile = (url: string): boolean => {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext || '');
};

interface VideoItem {
  url: string;
  title: string;
  duration?: string;
}

interface MaterialConfig {
  id: string;
  fabricName: string;
  fabricId: string;
  images: string[];
  price: number;
}

interface ProductReview {
  _id: string;
  images: string[];
  videos?: string[];
  userName: string;
  content: string;
  rating: number;
  skuSpec?: string;
  createdAt: string;
}

export default function ProductGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Video section state
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  
  // Category tabs state
  const [activeTab, setActiveTab] = useState<'material' | 'effect' | 'real'>('material');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Image selection for download
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  
  // Image preview modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getProductById(id);
        setProduct(data);
      } catch (error) {
        console.error('加载产品失败:', error);
        toast.error('加载产品失败');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  // Load product reviews
  useEffect(() => {
    const loadReviews = async () => {
      if (!id) return;
      try {
        const res = await apiClient.get(`/api/products/${id}/reviews`);
        setReviews(res.data.reviews || []);
      } catch (error) {
        console.error('加载评价失败:', error);
      }
    };
    loadReviews();
  }, [id]);

  // Get videos from product
  const videos = useMemo<VideoItem[]>(() => {
    if (!product) return [];
    const rawVideos = (product as any).videos || (product as any).videoUrls || [];
    const videoArray = Array.isArray(rawVideos) ? rawVideos : [rawVideos];
    const videoTitles = (product as any).videoTitles || [];
    
    return videoArray
      .filter(Boolean)
      .map((url: string, index: number) => ({
        url: typeof url === 'string' ? url : (url as any)?.url || '',
        title: videoTitles[index] || `视频 ${index + 1}`,
        duration: undefined
      }))
      .filter((v: VideoItem) => v.url);
  }, [product]);

  // Get material configs
  const materialConfigs = useMemo<MaterialConfig[]>(() => {
    if (!product) return [];
    return ((product as any).materialConfigs || []) as MaterialConfig[];
  }, [product]);

  // Get SKUs for material filtering
  const skus = useMemo(() => {
    if (!product) return [];
    return Array.isArray((product as any)?.skus) ? (product as any).skus : [];
  }, [product]);

  // Selected SKU for filtering
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);

  // Get effect images from SKUs
  const effectImages = useMemo(() => {
    if (!product) return [];
    const skus = Array.isArray((product as any)?.skus) ? ((product as any).skus as ProductSKU[]) : [];
    const images = skus.flatMap(sku => (sku as any).effectImages || []);
    return Array.from(new Set(images.filter(Boolean)));
  }, [product]);

  // Get review images (实景案例)
  const reviewImages = useMemo(() => {
    return reviews.flatMap(r => r.images || []).filter(Boolean);
  }, [reviews]);

  // Get product base images
  const productImages = useMemo(() => {
    if (!product) return [];
    return Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  }, [product]);

  // Group materials by category
  const materialCategories = useMemo(() => {
    const grouped: Record<string, MaterialConfig[]> = {};
    materialConfigs.forEach(config => {
      const categoryMatch = config.fabricName.match(/^([AB]类[^-–—]+)/);
      const category = categoryMatch ? categoryMatch[1] : config.fabricName.split(/[-–—]/)[0]?.trim() || '其他';
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(config);
    });
    return grouped;
  }, [materialConfigs]);

  // Get unique category tags
  const categoryTags = useMemo(() => {
    return Object.keys(materialCategories);
  }, [materialCategories]);

  // Get all SKU images combined
  const allSkuImages = useMemo(() => {
    return skus.flatMap((sku: any) => sku.images || []).filter(Boolean);
  }, [skus]);

  // Filter images based on selected SKU and active tab
  const filteredImages = useMemo(() => {
    if (activeTab === 'material') {
      if (!selectedSkuId) {
        // Show all SKU images
        return allSkuImages;
      }
      // Show images from selected SKU
      const selectedSku = skus.find((sku: any) => sku.id === selectedSkuId || sku._id === selectedSkuId);
      return (selectedSku?.images || []).filter(Boolean);
    } else if (activeTab === 'effect') {
      // Show effect images from SKUs
      return effectImages;
    } else {
      // Show review images (实景案例)
      return reviewImages;
    }
  }, [activeTab, selectedSkuId, skus, allSkuImages, effectImages, reviewImages]);

  // Handle video play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle video selection
  const selectVideo = (index: number) => {
    setCurrentVideoIndex(index);
    setIsPlaying(autoPlay);
  };

  // Handle video ended
  const handleVideoEnded = () => {
    if (autoPlay && currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  // Toggle tag selection
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Toggle image selection
  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // Download selected images
  const downloadSelected = () => {
    if (selectedImages.length === 0) {
      toast.error('请先选择图片');
      return;
    }
    selectedImages.forEach(imageId => {
      const link = document.createElement('a');
      link.href = getFileUrl(imageId);
      link.download = `image-${imageId}.jpg`;
      link.click();
    });
    toast.success(`已下载 ${selectedImages.length} 张图片`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">产品不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{product.name}</h1>
          <div className="w-20"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Video Section */}
        {videos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-primary-600 mb-6">精彩视频展映</h2>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              {/* Main Video Player */}
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  src={getFileUrl(videos[currentVideoIndex]?.url)}
                  className="w-full h-full object-contain"
                  onEnded={handleVideoEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  autoPlay={autoPlay}
                />
                <button
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity"
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    {isPlaying ? (
                      <Pause className="h-8 w-8 text-gray-900" />
                    ) : (
                      <Play className="h-8 w-8 text-gray-900 ml-1" />
                    )}
                  </div>
                </button>
              </div>

              {/* Video Playlist */}
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <span className="text-white font-medium">视频展播 ({videos.length})</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-gray-400 text-sm">自动播放</span>
                    <div 
                      className={`w-10 h-5 rounded-full transition-colors ${autoPlay ? 'bg-primary-500' : 'bg-gray-600'}`}
                      onClick={() => setAutoPlay(!autoPlay)}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${autoPlay ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {videos.map((video, index) => (
                    <button
                      key={index}
                      onClick={() => selectVideo(index)}
                      className={`w-full p-3 flex items-start gap-3 hover:bg-gray-800 transition-colors ${
                        currentVideoIndex === index ? 'bg-gray-800' : ''
                      }`}
                    >
                      <div className="relative w-28 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        <video
                          src={getFileUrl(video.url)}
                          className="w-full h-full object-cover"
                        />
                        {video.duration && (
                          <span className="absolute bottom-1 right-1 text-xs bg-black/80 text-white px-1 rounded">
                            {video.duration}
                          </span>
                        )}
                        {currentVideoIndex === index && isPlaying && (
                          <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-white text-sm font-medium line-clamp-2">{video.title}</p>
                        <p className="text-gray-500 text-xs mt-1">{product.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Category Section */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-6">探索全部分类</h2>
          
          {/* Tabs */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6 border-b border-gray-200">
              <button
                onClick={() => { setActiveTab('material'); setSelectedTags([]); }}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'material' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                材质分类 ({allSkuImages.length})
              </button>
              <button
                onClick={() => { setActiveTab('effect'); setSelectedTags([]); }}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'effect' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                效果图展览 ({effectImages.length})
              </button>
              <button
                onClick={() => { setActiveTab('real'); setSelectedTags([]); }}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'real' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                实景案例 ({reviewImages.length})
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* SKU Color Swatches for Material Filtering */}
          {activeTab === 'material' && skus.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">筛选材质面料：</span>
                {selectedSkuId && (
                  <button
                    onClick={() => setSelectedSkuId(null)}
                    className="text-xs text-primary-600 hover:underline ml-2"
                  >
                    清除筛选
                  </button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setSelectedSkuId(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    !selectedSkuId
                      ? 'bg-primary-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-500'
                  }`}
                >
                  全部 ({allSkuImages.length})
                </button>
                {skus.map((sku: any) => {
                  const skuId = sku.id || sku._id;
                  const isSelected = selectedSkuId === skuId;
                  const imageCount = (sku.images || []).length;
                  // Get first image as thumbnail
                  const thumbImage = sku.images?.[0];
                  const skuName = sku.specs?.map((s: any) => s.value).join(' / ') || sku.name || `SKU ${skuId?.slice(-4)}`;
                  
                  return (
                    <button
                      key={skuId}
                      onClick={() => setSelectedSkuId(isSelected ? null : skuId)}
                      className={`group relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all shadow-sm ${
                        isSelected
                          ? 'bg-primary-500 text-white ring-2 ring-primary-300 shadow-md'
                          : 'bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {thumbImage && (
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                          <img
                            src={getFileUrl(thumbImage)}
                            alt={skuName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <span className="max-w-[120px] truncate">{skuName}</span>
                      <span className={`text-xs ${
                        isSelected ? 'text-white/80' : 'text-gray-500'
                      }`}>({imageCount})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Download Bar */}
          {selectedImages.length > 0 && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6 flex items-center justify-between">
              <span className="text-primary-700">已选择 {selectedImages.length} 张图片</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedImages([])}
                  className="text-gray-500 hover:text-gray-700"
                >
                  取消选择
                </button>
                <button
                  onClick={downloadSelected}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  下载选中
                </button>
              </div>
            </div>
          )}

          {/* Image Grid */}
          <div className={`grid gap-4 ${
            viewMode === 'grid' 
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' 
              : 'grid-cols-1 md:grid-cols-2'
          }`}>
            {filteredImages.map((imageId, index) => (
              <div
                key={`${imageId}-${index}`}
                className="relative group cursor-pointer"
                onClick={(e) => {
                  // If clicking on checkbox area, toggle selection; otherwise open preview
                  if ((e.target as HTMLElement).closest('.select-checkbox')) {
                    toggleImageSelection(imageId);
                  } else {
                    setPreviewImage(imageId);
                  }
                }}
              >
                {isVideoFile(imageId) ? (
                  <div className="aspect-square bg-black rounded-xl overflow-hidden">
                    <video
                      src={getFileUrl(imageId)}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-12 w-12 text-white/80" />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={getFileUrl(imageId)}
                      alt={`图片 ${index + 1}`}
                      className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                        selectedImages.includes(imageId) ? 'ring-4 ring-primary-500' : ''
                      }`}
                    />
                  </div>
                )}
                {/* Selection checkbox */}
                <button
                  className="select-checkbox absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-sm bg-white/80 hover:bg-white"
                  style={{
                    borderColor: selectedImages.includes(imageId) ? '#3b82f6' : '#d1d5db',
                    backgroundColor: selectedImages.includes(imageId) ? '#3b82f6' : 'rgba(255,255,255,0.8)'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleImageSelection(imageId);
                  }}
                >
                  {selectedImages.includes(imageId) && <Check className="h-4 w-4 text-white" />}
                </button>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl pointer-events-none" />
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-16 text-gray-500">
              <p>暂无图片</p>
            </div>
          )}

          {/* View all products link */}
          {activeTab === 'material' && selectedTags.length > 0 && (
            <div className="text-center mt-8">
              <button className="text-primary-600 hover:text-primary-700 text-sm">
                查看全部 {selectedTags.join('、')} 系列产品 &gt;
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-black/50 hover:bg-black/70"
            onClick={() => setPreviewImage(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <div className="max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            {isVideoFile(previewImage) ? (
              <video
                src={getFileUrl(previewImage)}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg"
              />
            ) : (
              <img
                src={getFileUrl(previewImage)}
                alt="预览"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}
          </div>
          {/* Navigation arrows for browsing images */}
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filteredImages.indexOf(previewImage);
              if (currentIndex > 0) {
                setPreviewImage(filteredImages[currentIndex - 1]);
              }
            }}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/70 rotate-180"
            onClick={(e) => {
              e.stopPropagation();
              const currentIndex = filteredImages.indexOf(previewImage);
              if (currentIndex < filteredImages.length - 1) {
                setPreviewImage(filteredImages[currentIndex + 1]);
              }
            }}
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          {/* Image counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full">
            {filteredImages.indexOf(previewImage) + 1} / {filteredImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
