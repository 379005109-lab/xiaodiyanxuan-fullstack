import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Check, Download, Grid, List, Filter, X, RotateCw, FlipHorizontal, RotateCcw } from 'lucide-react';
import { getProductById } from '@/services/productService';
import { Product, ProductSKU } from '@/types';
import apiClient from '@/lib/apiClient';
import { getFileUrl } from '@/services/uploadService';
import { toast } from 'sonner';

const isVideoFileByExtension = (url: string): boolean => {
  if (!url) return false;
  const ext = url.split('.').pop()?.toLowerCase();
  return ['mp4', 'webm', 'ogg', 'mov', 'avi'].includes(ext || '');
};

interface VideoItem { url: string; title: string; duration?: string }
interface MaterialConfig { id: string; fabricName: string; fabricId: string; images: string[]; price: number }
interface ProductReview { _id: string; images: string[]; videos?: string[]; userName: string; content: string; rating: number; skuSpec?: string; createdAt: string }

type GalleryTab = 'material' | 'effect' | 'inspection' | 'delivery' | 'real';

const MAX_VISIBLE_IMAGES = 12; // 每个分类最多显示的图片数

export default function ProductGalleryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [activeTab, setActiveTab] = useState<GalleryTab>('material');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageRotation, setImageRotation] = useState(0);
  const [imageMirror, setImageMirror] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [selectedSkuId, setSelectedSkuId] = useState<string | null>(null);
  const [showAllImages, setShowAllImages] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      try { setLoading(true); setProduct(await getProductById(id)); }
      catch { toast.error('加载产品失败'); }
      finally { setLoading(false); }
    };
    loadProduct();
  }, [id]);

  useEffect(() => {
    const loadReviews = async () => {
      if (!id) return;
      try { const res = await apiClient.get(`/api/products/${id}/reviews`); setReviews(res.data.reviews || []); }
      catch { /* ignore */ }
    };
    loadReviews();
  }, [id]);

  // Videos — collect from product-level AND all SKU-level videos
  const videos = useMemo<VideoItem[]>(() => {
    if (!product) return [];
    const items: VideoItem[] = [];
    const seen = new Set<string>();

    // 1. Product-level videos
    const rawVideos = (product as any).videos || (product as any).videoUrls || [];
    const videoArray = Array.isArray(rawVideos) ? rawVideos : [rawVideos];
    const videoTitles = (product as any).videoTitles || [];
    videoArray.filter(Boolean).forEach((url: string, i: number) => {
      const u = typeof url === 'string' ? url : (url as any)?.url || '';
      if (!u || seen.has(u)) return;
      seen.add(u);
      items.push({ url: u, title: videoTitles[i] || `视频 ${i + 1}` });
    });

    // 2. SKU-level videos
    const allS = Array.isArray((product as any)?.skus) ? (product as any).skus : [];
    allS.forEach((sku: any, si: number) => {
      (sku.videos || []).filter(Boolean).forEach((v: string) => {
        const normalized = v.replace(/\.mp4$/i, '');
        if (seen.has(v) || seen.has(normalized)) return;
        seen.add(v);
        seen.add(normalized);
        const skuName = sku.fabricName || sku.color || sku.spec || `SKU${si + 1}`;
        items.push({ url: v, title: `${skuName} 视频` });
      });
    });

    return items;
  }, [product]);

  const allSkus = useMemo(() => {
    if (!product) return [];
    return Array.isArray((product as any)?.skus) ? (product as any).skus : [];
  }, [product]);

  // Deduplicated SKUs for filter buttons
  const skus = useMemo(() => {
    if (!product) return [];
    const allS = Array.isArray((product as any)?.skus) ? (product as any).skus : [];
    const seen = new Set<string>();
    return allS.filter((sku: any) => {
      const name = sku.fabricName || sku.color || sku.spec || '';
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }, [product]);

  const videoIds = useMemo(() => {
    const ids = new Set<string>();
    allSkus.forEach((sku: any) => (sku.videos || []).forEach((v: string) => v && ids.add(v)));
    return ids;
  }, [allSkus]);

  const isVideoFile = (fileId: string): boolean => {
    if (!fileId) return false;
    return videoIds.has(fileId) || isVideoFileByExtension(fileId);
  };

  // Helper: get unique media from SKUs (images only, no videos)
  const getUniqueSkuMedia = (field: string, skuFilter?: string | null) => {
    let targetSkus = allSkus;
    if (skuFilter) {
      const selectedSku = skus.find((s: any) => (s.id || s._id) === skuFilter);
      const fabricName = selectedSku?.fabricName || selectedSku?.color || selectedSku?.spec || '';
      targetSkus = allSkus.filter((s: any) => (s.fabricName || s.color || s.spec || '') === fabricName);
    }
    const seen = new Set<string>();
    const result: string[] = [];
    targetSkus.forEach((sku: any) => {
      (sku[field] || []).forEach((id: string) => {
        if (!id) return;
        const normalized = id.replace(/\.mp4$/i, '');
        if (seen.has(normalized)) return;
        seen.add(normalized);
        // For 'images' field, skip videos (they show in the video section)
        if (field === 'images' && (videoIds.has(id) || isVideoFileByExtension(id))) return;
        result.push(id);
      });
    });
    return result;
  };

  const allSkuImages = useMemo(() => getUniqueSkuMedia('images'), [allSkus, videoIds]);
  const effectImages = useMemo(() => getUniqueSkuMedia('effectImages'), [allSkus]);
  const inspectionImages = useMemo(() => getUniqueSkuMedia('inspectionImages'), [allSkus]);
  const deliveryImages = useMemo(() => getUniqueSkuMedia('deliveryImages'), [allSkus]);
  const reviewImages = useMemo(() => reviews.flatMap(r => r.images || []).filter(Boolean), [reviews]);

  const filteredImages = useMemo(() => {
    switch (activeTab) {
      case 'material': return selectedSkuId ? getUniqueSkuMedia('images', selectedSkuId) : allSkuImages;
      case 'effect': return selectedSkuId ? getUniqueSkuMedia('effectImages', selectedSkuId) : effectImages;
      case 'inspection': return selectedSkuId ? getUniqueSkuMedia('inspectionImages', selectedSkuId) : inspectionImages;
      case 'delivery': return selectedSkuId ? getUniqueSkuMedia('deliveryImages', selectedSkuId) : deliveryImages;
      case 'real': return reviewImages;
      default: return [];
    }
  }, [activeTab, selectedSkuId, allSkuImages, effectImages, inspectionImages, deliveryImages, reviewImages, allSkus, videoIds]);

  // Determine visible images (with "show more" logic)
  const visibleImages = useMemo(() => {
    if (showAllImages || filteredImages.length <= MAX_VISIBLE_IMAGES) return filteredImages;
    return filteredImages.slice(0, MAX_VISIBLE_IMAGES);
  }, [filteredImages, showAllImages]);

  const hiddenCount = filteredImages.length - MAX_VISIBLE_IMAGES;

  // Reset showAllImages when tab or filter changes
  useEffect(() => { setShowAllImages(false); }, [activeTab, selectedSkuId]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause(); else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const selectVideo = (index: number) => { setCurrentVideoIndex(index); setIsPlaying(autoPlay); setVideoEnded(false); };

  const handleVideoEnded = () => {
    if (autoPlay && currentVideoIndex < videos.length - 1) setCurrentVideoIndex(prev => prev + 1);
    else { setIsPlaying(false); setVideoEnded(true); }
  };

  const toggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => prev.includes(imageId) ? prev.filter(id => id !== imageId) : [...prev, imageId]);
  };

  const downloadSelected = () => {
    if (selectedImages.length === 0) { toast.error('请先选择图片'); return; }
    selectedImages.forEach(imageId => {
      const link = document.createElement('a');
      link.href = getFileUrl(imageId);
      link.download = `image-${imageId}.jpg`;
      link.click();
    });
    toast.success(`已下载 ${selectedImages.length} 张图片`);
  };

  // Tab counts
  const tabCounts = useMemo(() => ({
    material: allSkuImages.length,
    effect: effectImages.length,
    inspection: inspectionImages.length,
    delivery: deliveryImages.length,
    real: reviewImages.length,
  }), [allSkuImages, effectImages, inspectionImages, deliveryImages, reviewImages]);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" /></div>;
  if (!product) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">产品不存在</p></div>;

  // Tab definitions
  const tabDefs: { key: GalleryTab; label: string; count: number }[] = [
    { key: 'material', label: '材质分类', count: tabCounts.material },
    { key: 'effect', label: '效果图展览', count: tabCounts.effect },
    { key: 'inspection', label: '验货图片', count: tabCounts.inspection },
    { key: 'delivery', label: '交付实物', count: tabCounts.delivery },
    { key: 'real', label: '实景案例', count: tabCounts.real },
  ];

  // SKU filter count for current tab
  const getSkuCountForTab = (sku: any) => {
    const fabricName = sku.fabricName || sku.color || sku.spec || '';
    const matchingSkus = allSkus.filter((s: any) => (s.fabricName || s.color || s.spec || '') === fabricName);
    const fieldMap: Record<GalleryTab, string[]> = {
      material: ['images', 'videos'],
      effect: ['effectImages'],
      inspection: ['inspectionImages'],
      delivery: ['deliveryImages'],
      real: [],
    };
    const fields = fieldMap[activeTab];
    const seen = new Set<string>();
    fields.forEach(field => {
      matchingSkus.forEach((s: any) => {
        (s[field] || []).forEach((id: string) => {
          if (id) { const n = id.replace(/\.mp4$/i, ''); if (!seen.has(n)) seen.add(n); }
        });
      });
    });
    return seen.size;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" /><span>返回</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900">{product.name}</h1>
          <div className="w-20" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Video Section - Left video, right playlist (like reference image) */}
        {videos.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-primary-600 mb-6">视频 ({videos.length})</h2>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              {/* Main Video Player - Left */}
              <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  src={getFileUrl(videos[currentVideoIndex]?.url)}
                  className="w-full h-full object-contain"
                  onEnded={handleVideoEnded}
                  onPlay={() => { setIsPlaying(true); setVideoEnded(false); }}
                  onPause={() => setIsPlaying(false)}
                  autoPlay={autoPlay}
                />
                <button onClick={togglePlay} className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 hover:opacity-100 transition-opacity">
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    {isPlaying ? <Pause className="h-8 w-8 text-gray-900" /> : <Play className="h-8 w-8 text-gray-900 ml-1" />}
                  </div>
                </button>
              </div>

              {/* Video Playlist - Right */}
              <div className="bg-gray-900 rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                  <span className="text-white font-medium">视频列表 ({videos.length})</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-gray-400 text-sm">自动播放</span>
                    <div className={`w-10 h-5 rounded-full transition-colors ${autoPlay ? 'bg-primary-500' : 'bg-gray-600'}`} onClick={() => setAutoPlay(!autoPlay)}>
                      <div className={`w-4 h-4 rounded-full bg-white mt-0.5 transition-transform ${autoPlay ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </div>
                  </label>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[400px]">
                  {videos.map((video, index) => (
                    <button key={index} onClick={() => selectVideo(index)} className={`w-full p-3 flex items-start gap-3 hover:bg-gray-800 transition-colors ${currentVideoIndex === index ? 'bg-gray-800' : ''}`}>
                      <div className="relative w-28 h-16 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                        <video src={getFileUrl(video.url)} className="w-full h-full object-cover" />
                        {currentVideoIndex === index && isPlaying && (
                          <div className="absolute inset-0 bg-primary-500/30 flex items-center justify-center"><Play className="h-6 w-6 text-white" /></div>
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
            <div className="flex items-center gap-4 border-b border-gray-200 overflow-x-auto">
              {tabDefs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); setSelectedSkuId(null); }}
                  className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><Grid className="h-4 w-4" /></button>
              <button onClick={() => setViewMode('list')} className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}><List className="h-4 w-4" /></button>
            </div>
          </div>

          {/* SKU Material Filter - shown for all tabs except 实景案例 */}
          {activeTab !== 'real' && skus.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">筛选材质面料：</span>
                {selectedSkuId && (
                  <button onClick={() => setSelectedSkuId(null)} className="text-xs text-primary-600 hover:underline ml-2">清除筛选</button>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setSelectedSkuId(null)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors shadow ${
                    !selectedSkuId ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 border-2 border-gray-400 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  全部 ({filteredImages.length})
                </button>
                {skus.map((sku: any) => {
                  const skuId = sku.id || sku._id;
                  const isSelected = selectedSkuId === skuId;
                  const count = getSkuCountForTab(sku);
                  const thumbImage = sku.images?.[0];
                  const skuName = sku.fabricName || sku.color || sku.spec || `SKU ${skuId?.slice(-4)}`;
                  if (count === 0 && activeTab !== 'material') return null;
                  return (
                    <button
                      key={skuId}
                      onClick={() => setSelectedSkuId(isSelected ? null : skuId)}
                      className={`group relative flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all shadow ${
                        isSelected ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-lg' : 'bg-gray-200 border-2 border-gray-400 text-gray-800 hover:bg-gray-300 hover:border-gray-500'
                      }`}
                    >
                      {thumbImage && (
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                          <img src={getFileUrl(thumbImage)} alt={skuName} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="max-w-[120px] truncate">{skuName}</span>
                      <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>({count})</span>
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
                <button onClick={() => setSelectedImages([])} className="text-gray-500 hover:text-gray-700">取消选择</button>
                <button onClick={downloadSelected} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2">
                  <Download className="h-4 w-4" />下载选中
                </button>
              </div>
            </div>
          )}

          {/* Image Grid */}
          <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1 md:grid-cols-2'}`}>
            {visibleImages.map((imageId, index) => (
              <div
                key={`${imageId}-${index}`}
                className="relative group cursor-pointer"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('.select-checkbox')) toggleImageSelection(imageId);
                  else setPreviewImage(imageId);
                }}
              >
                {isVideoFile(imageId) ? (
                  <div className="aspect-square bg-black rounded-xl overflow-hidden">
                    <video src={getFileUrl(imageId)} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center"><Play className="h-12 w-12 text-white/80" /></div>
                  </div>
                ) : (
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={getFileUrl(imageId)} alt={`图片 ${index + 1}`} className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${selectedImages.includes(imageId) ? 'ring-4 ring-primary-500' : ''}`} />
                  </div>
                )}
                <button
                  className="select-checkbox absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shadow-sm bg-white/80 hover:bg-white"
                  style={{ borderColor: selectedImages.includes(imageId) ? '#3b82f6' : '#d1d5db', backgroundColor: selectedImages.includes(imageId) ? '#3b82f6' : 'rgba(255,255,255,0.8)' }}
                  onClick={(e) => { e.stopPropagation(); toggleImageSelection(imageId); }}
                >
                  {selectedImages.includes(imageId) && <Check className="h-4 w-4 text-white" />}
                </button>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl pointer-events-none" />

                {/* "还有N张" overlay on last visible image */}
                {!showAllImages && hiddenCount > 0 && index === visibleImages.length - 1 && (
                  <div
                    className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setShowAllImages(true); }}
                  >
                    <span className="text-white text-lg font-bold">+{hiddenCount} 张</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredImages.length === 0 && (
            <div className="text-center py-16 text-gray-500"><p>暂无图片</p></div>
          )}

          {/* Show all / collapse button */}
          {filteredImages.length > MAX_VISIBLE_IMAGES && (
            <div className="text-center mt-6">
              <button
                onClick={() => setShowAllImages(!showAllImages)}
                className="px-6 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {showAllImages ? '收起' : `查看全部 ${filteredImages.length} 张`}
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4" onClick={() => { setPreviewImage(null); setImageRotation(0); setImageMirror(false); setVideoEnded(false); setIsPlaying(false); }}>
          <button className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-black/50 hover:bg-black/70" onClick={() => { setPreviewImage(null); setImageRotation(0); setImageMirror(false); }}>
            <X className="h-6 w-6" />
          </button>

          <div className="max-w-[90vw] max-h-[70vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {isVideoFile(previewImage) ? (
              <div className="relative group">
                <video
                  ref={videoRef}
                  src={getFileUrl(previewImage)}
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded-lg"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => { setIsPlaying(false); setVideoEnded(true); }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      if (videoEnded) { videoRef.current.currentTime = 0; videoRef.current.play(); setVideoEnded(false); }
                      else if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                    }
                  }}
                />
                <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isPlaying && !videoEnded ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (videoRef.current) {
                      if (videoEnded) { videoRef.current.currentTime = 0; videoRef.current.play(); setVideoEnded(false); }
                      else if (isPlaying) videoRef.current.pause();
                      else videoRef.current.play();
                    }
                  }}
                >
                  <div className="p-4 rounded-full bg-black/50 hover:bg-black/70 cursor-pointer">
                    {videoEnded ? <RotateCcw className="h-12 w-12 text-white" /> : isPlaying ? <Pause className="h-12 w-12 text-white" /> : <Play className="h-12 w-12 text-white" />}
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={getFileUrl(previewImage)}
                alt="预览"
                className="max-w-full max-h-[70vh] object-contain rounded-lg transition-transform duration-300"
                style={{ transform: `rotate(${imageRotation}deg) scaleX(${imageMirror ? -1 : 1})` }}
              />
            )}
          </div>

          {!isVideoFile(previewImage) && (
            <div className="flex items-center gap-4 mt-6" onClick={(e) => e.stopPropagation()}>
              <button className="text-white hover:text-white/80 p-3 rounded-full bg-white/20 hover:bg-white/30 flex items-center gap-2" onClick={() => setImageRotation(r => (r + 90) % 360)}>
                <RotateCw className="h-5 w-5" /><span className="text-sm">旋转</span>
              </button>
              <button className="text-white hover:text-white/80 p-3 rounded-full bg-white/20 hover:bg-white/30 flex items-center gap-2" onClick={() => setImageMirror(m => !m)}>
                <FlipHorizontal className="h-5 w-5" /><span className="text-sm">镜像</span>
              </button>
              <button className="text-white hover:text-white/80 p-3 rounded-full bg-white/20 hover:bg-white/30 flex items-center gap-2" onClick={() => {
                const link = document.createElement('a');
                link.href = getFileUrl(previewImage);
                link.download = `image-${Date.now()}.jpg`;
                link.click();
                toast.success('图片下载中...');
              }}>
                <Download className="h-5 w-5" /><span className="text-sm">下载</span>
              </button>
            </div>
          )}

          {/* Navigation arrows */}
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/70" onClick={(e) => {
            e.stopPropagation();
            const idx = filteredImages.indexOf(previewImage);
            if (idx > 0) { setPreviewImage(filteredImages[idx - 1]); setImageRotation(0); setImageMirror(false); }
          }}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-3 rounded-full bg-black/50 hover:bg-black/70 rotate-180" onClick={(e) => {
            e.stopPropagation();
            const idx = filteredImages.indexOf(previewImage);
            if (idx < filteredImages.length - 1) { setPreviewImage(filteredImages[idx + 1]); setImageRotation(0); setImageMirror(false); }
          }}>
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm bg-black/50 px-4 py-2 rounded-full">
            {filteredImages.indexOf(previewImage) + 1} / {filteredImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
