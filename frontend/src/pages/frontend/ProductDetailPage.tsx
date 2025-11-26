import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById } from '@/services/productService';
import { getAllMaterials } from '@/services/materialService';
import { Product, ProductSKU, ProductFile } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import { useCompareStore } from '@/store/compareStore';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, ChevronDown, Share2, Heart, Minus, Plus, FileText, Video, AlertCircle, X, Maximize2, Download, Check, Info } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { getFileUrl } from '@/services/uploadService';

import ShareModal from '@/components/frontend/ShareModal';
import CustomizationForm from '@/components/frontend/CustomizationForm';

type MaterialKey = 'fabric' | 'filling' | 'frame' | 'leg';
type SkuFilter = 'all' | 'standard' | 'pro';

const PRIMARY_BLUE = '#1F64FF';

const MATERIAL_SECTIONS: { key: MaterialKey; label: string; badgeClass: string }[] = [
  { key: 'fabric', label: '面料', badgeClass: 'bg-blue-50 text-blue-700 border-blue-100' },
  { key: 'filling', label: '填充', badgeClass: 'bg-green-50 text-green-700 border-green-100' },
  { key: 'frame', label: '骨架', badgeClass: 'bg-purple-50 text-purple-700 border-purple-100' },
  { key: 'leg', label: '脚架', badgeClass: 'bg-orange-50 text-orange-700 border-orange-100' },
];

const SKU_FILTERS: { key: SkuFilter; label: string }[] = [
  { key: 'all', label: '全部款式' },
  { key: 'standard', label: '标准版' },
  { key: 'pro', label: 'PRO 版' },
];

const MATERIAL_SWATCH_STYLES: Record<MaterialKey, string> = {
  fabric: 'from-slate-50 via-slate-100 to-slate-200',
  filling: 'from-emerald-50 via-emerald-100 to-emerald-200',
  frame: 'from-indigo-50 via-indigo-100 to-indigo-200',
  leg: 'from-amber-50 via-amber-100 to-amber-200',
};

const EMPTY_SELECTIONS: Record<MaterialKey, string | null> = {
  fabric: null,
  filling: null,
  frame: null,
  leg: null,
};

const determineDefaultFilter = (skus: ProductSKU[]): SkuFilter => {
  if (skus.some(sku => !sku.isPro)) return 'standard';
  if (skus.some(sku => sku.isPro)) return 'pro';
  return 'all';
};

const getInitialSkuForFilter = (skus: ProductSKU[], filter: SkuFilter) => {
  if (!skus.length) return null;
  if (filter === 'standard') return skus.find(sku => !sku.isPro) || skus[0];
  if (filter === 'pro') return skus.find(sku => sku.isPro) || skus[0];
  return skus[0];
};

const pickPremiumMaterial = (options: string[], upgradePrices?: Record<string, number | undefined>) => {
  if (!options.length) return null;
  return options.reduce<string | null>((best, current) => {
    const currentPrice = upgradePrices?.[current] ?? 0;
    if (!best) return current;
    const bestPrice = upgradePrices?.[best] ?? 0;
    return currentPrice > bestPrice ? current : best;
  }, null);
};

// 提取材质系列名称（参考PackageDetailPage的逻辑）
const extractMaterialSeries = (materialName: string): string => {
  const knownSeries = [
    '全青皮', '半青皮', '普通皮', '真皮', '牛皮', '半皮',
    '磨砂布', '绒布', '麻布', '棉布', '丝绒',
    '实木', '橡木', '胡桃木', '榉木', '松木',
    '不锈钢', '铁艺', '航空铝', '碳钢',
    '大理石', '岩板', '玻璃'
  ];
  
  for (const series of knownSeries) {
    if (materialName.includes(series)) {
      return series;
    }
  }
  
  const match = materialName.match(/^[\u4e00-\u9fa5]{1,3}/);
  return match ? match[0] : materialName;
};

// 计算材质加价（支持完全匹配和系列匹配）
const getMaterialUpgradePrice = (materialName: string, upgradePrices?: Record<string, number>): number => {
  if (!upgradePrices) return 0;
  
  // 1. 完全匹配
  if (upgradePrices[materialName] !== undefined) {
    return upgradePrices[materialName];
  }
  
  // 2. 系列匹配
  const materialSeries = extractMaterialSeries(materialName);
  if (materialSeries) {
    for (const [key, price] of Object.entries(upgradePrices)) {
      const keySeries = extractMaterialSeries(key);
      if (key.includes(materialSeries) || keySeries === materialSeries) {
        return price;
      }
    }
  }
  
  return 0;
};

const isVideoFile = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

const buildVideoEmbedUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (parsed.hostname === 'youtu.be') {
      const videoId = parsed.pathname.replace('/', '');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const segments = parsed.pathname.split('/').filter(Boolean);
      const videoId = segments.pop();
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
    return url;
  } catch {
    return url;
  }
};

const normalizeMaterialSelection = (material?: ProductSKU['material']) => {
  const ensureArray = (value?: string[] | string): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  };

  if (!material) {
    return { fabric: [], filling: [], frame: [], leg: [] };
  }

  if (typeof material === 'string') {
    return {
      fabric: material ? [material] : [],
      filling: [],
      frame: [],
      leg: [],
    };
  }

  return {
    fabric: ensureArray(material.fabric),
    filling: ensureArray(material.filling),
    frame: ensureArray(material.frame),
    leg: ensureArray(material.leg),
  };
};

const getBasePrice = (sku?: ProductSKU | null) => {
  if (!sku) return 0;
  const hasDiscount = sku.discountPrice && sku.discountPrice > 0 && (sku.discountPrice ?? 0) < sku.price;
  return hasDiscount ? sku.discountPrice! : sku.price;
};

// 获取材质所属的类别
const getMaterialCategory = (materialName: string): string => {
  if (materialName.includes('普通皮')) return '普通皮'
  if (materialName.includes('全青皮')) return '全青皮'
  if (materialName.includes('牛皮')) return '牛皮'
  if (materialName.includes('绒布')) return '绒布'
  if (materialName.includes('麻布')) return '麻布'
  return 'other'
};

// 获取材质升级价格（按类别）
const getUpgradePrice = (sku?: ProductSKU | null, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
  if (!sku || !selectedMaterials) return 0;
  
  const materialUpgradePrices = sku.materialUpgradePrices || {};
  let totalUpgradePrice = 0;
  
  // 获取所有选中的材质
  const selectedMaterialList: string[] = [];
  if (selectedMaterials.fabric) selectedMaterialList.push(selectedMaterials.fabric);
  if (selectedMaterials.filling) selectedMaterialList.push(selectedMaterials.filling);
  if (selectedMaterials.frame) selectedMaterialList.push(selectedMaterials.frame);
  if (selectedMaterials.leg) selectedMaterialList.push(selectedMaterials.leg);
  
  // 计算每个材质所属类别的加价（避免重复计算同一类别）
  const addedCategories = new Set<string>();
  selectedMaterialList.forEach(materialName => {
    const category = getMaterialCategory(materialName);
    if (!addedCategories.has(category)) {
      totalUpgradePrice += materialUpgradePrices[category] || 0;
      addedCategories.add(category);
    }
  });
  
  return totalUpgradePrice;
};

const getFinalPrice = (sku?: ProductSKU | null, selectedMaterials?: { fabric?: string; filling?: string; frame?: string; leg?: string }) => {
  if (!sku) return 0;
  return getBasePrice(sku) + getUpgradePrice(sku, selectedMaterials);
};

const normalizeVideoUrls = (rawVideos?: any): string[] => {
  if (!rawVideos) return [];
  const source = Array.isArray(rawVideos) ? rawVideos : [rawVideos];
  return source
    .map((item) => {
      if (!item) return '';
      if (typeof item === 'string') return item.trim();
      if (typeof item === 'object') {
        return item.url || item.link || item.src || '';
      }
      return '';
    })
    .filter(Boolean);
};

const normalizeFileList = (rawFiles?: any): ProductFile[] => {
  if (!rawFiles) return [];
  const source = Array.isArray(rawFiles) ? rawFiles : [rawFiles];
  return source
    .map((file) => {
      if (!file) return null;
      if (typeof file === 'string') {
        return {
          name: '资料文件',
          url: file,
          format: file.split('.').pop()?.toUpperCase(),
        } as ProductFile;
      }
      const url = file.url || file.link || '';
      if (!url) return null;
      return {
        name: file.name || file.title || '资料文件',
        url,
        format: file.format || file.type || undefined,
        size: file.size ?? (file.filesize ? Number(file.filesize) : undefined),
      } as ProductFile;
    })
    .filter((file): file is ProductFile => Boolean(file));
};

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState<ProductSKU | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SkuFilter>('all');
  const [specCollapsed, setSpecCollapsed] = useState(true);
  const [materialCollapsed, setMaterialCollapsed] = useState(true);
  const [materialSelections, setMaterialSelections] = useState<Record<MaterialKey, string | null>>(EMPTY_SELECTIONS);
  const [materialInfoModal, setMaterialInfoModal] = useState<{ open: boolean; section?: MaterialKey; material?: string }>({ open: false });
  const [isAllImageModalOpen, setAllImageModalOpen] = useState(false);
  const [selectedDownloadImages, setSelectedDownloadImages] = useState<string[]>([]);
  const [materialAssetMap, setMaterialAssetMap] = useState<Record<string, string>>({});

  const { addItem } = useCartStore();
  const { favorites, toggleFavorite, loadFavorites } = useFavoriteStore();
  const { addToCompare, loadCompareItems } = useCompareStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
    loadCompareItems();
  }, [loadFavorites, loadCompareItems]);

  useEffect(() => {
    const loadMaterials = async () => {
      const materials = await getAllMaterials();
      const assetMap = materials.reduce<Record<string, string>>((acc, material) => {
        if (material.name && material.image) {
          acc[material.name] = material.image;
        }
        return acc;
      }, {});
      setMaterialAssetMap(assetMap);
    };
    loadMaterials();
  }, []);

  const defaultGalleryImages = useMemo(() => {
    if (!product) return [];
    const baseImages = Array.isArray(product.images) ? product.images : [];
    const skuImages = product.skus.flatMap(sku => sku.images || []);
    const merged = [...baseImages, ...skuImages].filter(Boolean);
    return Array.from(new Set(merged));
  }, [product]);

  const galleryImages = useMemo(() => {
    if (selectedSku?.images?.length) {
      // 优先显示选中SKU的图片
      const skuImages = selectedSku.images.filter(Boolean);
      if (skuImages.length > 0) {
        return skuImages;
      }
    }
    return defaultGalleryImages;
  }, [selectedSku, defaultGalleryImages]);

  const filteredSkus = useMemo(() => {
    if (!product) return [];
    if (activeFilter === 'standard') return product.skus.filter(sku => !sku.isPro);
    if (activeFilter === 'pro') return product.skus.filter(sku => sku.isPro);
    return product.skus;
  }, [product, activeFilter]);

  // 根据商品实际的SKU动态生成可用的筛选选项
  const availableFilters = useMemo(() => {
    if (!product || !product.skus || product.skus.length === 0) return [];
    
    const filters: { key: SkuFilter; label: string }[] = [];
    const hasStandard = product.skus.some(sku => !sku.isPro);
    const hasPro = product.skus.some(sku => sku.isPro);
    
    // 只有当同时有标准版和PRO版时才显示"全部款式"
    if (hasStandard && hasPro) {
      filters.push({ key: 'all', label: '全部款式' });
    }
    
    if (hasStandard) {
      filters.push({ key: 'standard', label: '标准版' });
    }
    
    if (hasPro) {
      filters.push({ key: 'pro', label: 'PRO 版' });
    }
    
    return filters;
  }, [product]);

  const videoList = useMemo(() => normalizeVideoUrls(product?.videos || (product as any)?.videoUrls), [product]);
  const fileList = useMemo(() => normalizeFileList(product?.files || (product as any)?.fileList), [product]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchedProduct = await getProductById(id);
        setProduct(fetchedProduct);
        if (fetchedProduct) {
          const defaultFilter = determineDefaultFilter(fetchedProduct.skus);
          setActiveFilter(defaultFilter);
          const initialSku = getInitialSkuForFilter(fetchedProduct.skus, defaultFilter);
          setSelectedSku(initialSku);
          const firstSkuImage = initialSku?.images?.find(Boolean);
          const firstProductImage = fetchedProduct.images?.find(Boolean);
          setMainImage(firstSkuImage || firstProductImage || '');
        } else {
          toast.error('未找到该商品');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    // 如果筛选后没有SKU，清空选中的SKU
    if (!filteredSkus.length) {
      setSelectedSku(null);
      setMaterialSelections(EMPTY_SELECTIONS);
      return;
    }
    
    // 如果当前选中的SKU在筛选结果中，保持选中
    if (selectedSku && filteredSkus.some(s => s._id === selectedSku._id)) return;
    
    // 否则选择筛选结果中的第一个SKU
    const fallback = filteredSkus[0];
    setSelectedSku(fallback);
    if (fallback?.images?.length) {
      setMainImage(fallback.images[0]);
    }
  }, [filteredSkus, selectedSku]);

  useEffect(() => {
    if (!galleryImages.length) return;
    setMainImage(prev => (galleryImages.includes(prev) ? prev : galleryImages[0]));
  }, [galleryImages]);

  useEffect(() => {
    if (!selectedSku) {
      setMaterialSelections(EMPTY_SELECTIONS);
      return;
    }
    const normalized = normalizeMaterialSelection(selectedSku.material);
    const upgradePrices = selectedSku.materialUpgradePrices || {};
    setMaterialSelections(prev => {
      const next: Record<MaterialKey, string | null> = { ...EMPTY_SELECTIONS };
      MATERIAL_SECTIONS.forEach(({ key }) => {
        const list = normalized[key];
        if (list.length === 1) {
          next[key] = list[0];
        } else if (selectedSku.isPro) {
          next[key] = pickPremiumMaterial(list, upgradePrices);
        } else if (list.length > 1 && prev[key] && list.includes(prev[key]!)) {
          next[key] = prev[key]!;
        } else {
          next[key] = null;
        }
      });
      return next;
    });
  }, [selectedSku]);

  const handleSkuChange = (sku: ProductSKU) => {
    setSelectedSku(sku);
    const firstSkuImage = sku.images?.find(Boolean);
    const fallbackImage = defaultGalleryImages[0] || product?.images?.[0] || '';
    setMainImage(firstSkuImage || fallbackImage);
    setQuantity(1);
  };

  const syncFilterWithSku = (sku: ProductSKU) => {
    setActiveFilter(prev => {
      if (prev === 'all') {
        return sku.isPro ? 'pro' : 'standard';
      }
      return prev;
    });
  };

  const handleFileDownload = async (file: ProductFile) => {
    if (!user) {
      toast.error('请先登录账号后再下载资料');
      useAuthModalStore.getState().openLogin();
      return;
    }
    if (!file.url) {
      toast.error('文件地址不存在');
      return;
    }
    
    try {
      // 构建下载URL
      const fileUrl = file.url.startsWith('http') 
        ? file.url 
        : `/api/files/${file.url}`;
      
      // 构建文件名：商品名.扩展名
      const fileExt = file.format?.toLowerCase() || 'file';
      const fileName = `${product.name}.${fileExt}`;
      
      // 下载文件
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`正在下载 ${fileName}`);
    } catch (error) {
      console.error('下载失败:', error);
      toast.error('下载失败，请稍后重试');
    }
  };

  const handleFilterChange = (filter: SkuFilter) => {
    setActiveFilter(filter);
    const nextSku = getInitialSkuForFilter(product?.skus || [], filter);
    if (nextSku) {
      handleSkuChange(nextSku);
    }
  };

  const handleQuantityChange = (amount: number) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

  const resolveSelectedMaterials = () => {
    if (!selectedSku) return null;
    const normalizedMaterials = normalizeMaterialSelection(selectedSku.material);
    const chosenMaterials: Record<MaterialKey, string | undefined> = {
      fabric: undefined,
      filling: undefined,
      frame: undefined,
      leg: undefined,
    };

    for (const section of MATERIAL_SECTIONS) {
      const options = normalizedMaterials[section.key];
      const selectedOption = materialSelections[section.key] || (options.length === 1 ? options[0] : undefined);
      if (options.length > 1 && !selectedOption) {
        toast.error(`请选择${section.label}`);
        return undefined;
      }
      chosenMaterials[section.key] = selectedOption;
    }
    return chosenMaterials;
  };

  const handleAddToCart = () => {
    if (!product || !selectedSku) {
      toast.error('请选择商品规格');
      return;
    }

    const chosenMaterials = resolveSelectedMaterials();
    if (!chosenMaterials) return;

    addItem(product, selectedSku, quantity, chosenMaterials, getFinalPrice(selectedSku, chosenMaterials));
    toast.success('已添加到购物车');
  };

  const handleAddToCompare = () => {
    if (!product || !selectedSku) {
      toast.error('请选择商品规格');
      return;
    }
    const chosenMaterials = resolveSelectedMaterials();
    if (!chosenMaterials) return;
    const result = addToCompare(product._id, selectedSku._id, chosenMaterials);
    toast[result.success ? 'success' : 'error'](result.message);
  };

  const handleBuyNow = () => {
    if (!product || !selectedSku) {
      toast.error('请选择商品规格');
      return;
    }
    const chosenMaterials = resolveSelectedMaterials();
    if (!chosenMaterials) return;
    addItem(product, selectedSku, quantity, chosenMaterials, getFinalPrice(selectedSku, chosenMaterials));
    navigate('/checkout');
  };

  const handleMaterialChoice = (sectionKey: MaterialKey, materialName: string) => {
    const options = normalizedSelectedMaterials?.[sectionKey] || [];
    if (options.length <= 1) return;

    const upgradePrices = selectedSku?.materialUpgradePrices || {};
    const premiumOption = pickPremiumMaterial(options, upgradePrices);
    const isDowngrade =
      selectedSku?.isPro &&
      activeFilter === 'pro' &&
      premiumOption &&
      materialName !== premiumOption;

    setMaterialSelections(prev => ({ ...prev, [sectionKey]: materialName }));

    if (isDowngrade) {
      toast.info('已切换到标准版以匹配材质选择');
      handleFilterChange('standard');
    }
  };

  const openMaterialIntro = (sectionKey: MaterialKey, materialName?: string) => {
    setMaterialInfoModal({ open: true, section: sectionKey, material: materialName });
  };

  const closeMaterialIntro = () => setMaterialInfoModal({ open: false });

  const currentImageIndex = useMemo(() => galleryImages.findIndex(img => img === mainImage), [galleryImages, mainImage]);

  const handleImageNavigate = (direction: 'prev' | 'next') => {
    if (!galleryImages.length) return;
    const index = currentImageIndex >= 0 ? currentImageIndex : 0;
    const nextIndex = direction === 'prev'
      ? (index - 1 + galleryImages.length) % galleryImages.length
      : (index + 1) % galleryImages.length;
    setMainImage(galleryImages[nextIndex]);
  };

  if (loading) {
    return <div className="container-custom py-12 text-center">加载中...</div>;
  }

  if (!product) {
    return <div className="container-custom py-12 text-center">商品不存在</div>;
  }

  const currentPrice = selectedSku ? selectedSku.price : product.basePrice;
  const discountPrice = selectedSku?.discountPrice;
  const normalizedSelectedMaterials = selectedSku ? normalizeMaterialSelection(selectedSku.material) : null;
  const baseSkuPrice = selectedSku ? getBasePrice(selectedSku) : product.basePrice;
  
  // 获取当前选中的材质
  const currentSelectedMaterials = (() => {
    if (!selectedSku) return undefined;
    const normalized = normalizeMaterialSelection(selectedSku.material);
    return {
      fabric: materialSelections.fabric || (normalized.fabric.length === 1 ? normalized.fabric[0] : undefined),
      filling: materialSelections.filling || (normalized.filling.length === 1 ? normalized.filling[0] : undefined),
      frame: materialSelections.frame || (normalized.frame.length === 1 ? normalized.frame[0] : undefined),
      leg: materialSelections.leg || (normalized.leg.length === 1 ? normalized.leg[0] : undefined),
    };
  })();
  
  const finalSkuPrice = selectedSku ? getFinalPrice(selectedSku, currentSelectedMaterials) : product.basePrice;

  const isFavorited = product ? favorites.some(f => {
    if (!f || !f.product) return false;
    const favProductId = typeof f.product === 'string' ? f.product : f.product._id;
    return favProductId === product._id;
  }) : false;

  const getMaterialPreviewImage = (materialName?: string) => {
    if (!materialName) return selectedSku?.images?.[0] || product.images?.[0] || '';
    if (selectedSku?.materialImages && selectedSku.materialImages[materialName]) {
      return selectedSku.materialImages[materialName];
    }
    if (materialAssetMap[materialName]) {
      return materialAssetMap[materialName];
    }
    return selectedSku?.images?.[0] || product.images?.[0] || '';
  };

  const toggleDownloadSelection = (imageUrl: string) => {
    setSelectedDownloadImages(prev =>
      prev.includes(imageUrl) ? prev.filter(img => img !== imageUrl) : [...prev, imageUrl]
    );
  };

  const handleDownloadImages = async () => {
    if (!selectedDownloadImages.length) {
      toast.error('请先选择需要下载的图片');
      return;
    }
    if (!user) {
      toast.error('请先登录账号后再下载图片');
      useAuthModalStore.getState().openLogin();
      return;
    }
    
    toast.success(`开始下载 ${selectedDownloadImages.length} 张图片`);
    
    for (let index = 0; index < selectedDownloadImages.length; index++) {
      const img = selectedDownloadImages[index];
      try {
        // 通过fetch获取图片数据，避免跨域问题
        const response = await fetch(img);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `product-image-${index + 1}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 释放blob URL
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
        
        // 添加延迟避免浏览器阻止多个下载
        if (index < selectedDownloadImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.error('下载图片失败:', error);
        toast.error(`图片 ${index + 1} 下载失败`);
      }
    }
  };

  const formatSpecificationValue = (spec: any) => {
    if (!spec) return '';
    if (typeof spec === 'string') return spec;
    if (typeof spec.value === 'string') return spec.value;

    const hasDimensions = ['length', 'width', 'height'].every(key => spec[key] !== undefined && spec[key] !== null);
    if (hasDimensions) {
      const unitLabel = spec.unit || 'CM';
      return `${spec.length} x ${spec.width} x ${spec.height} ${unitLabel}`;
    }

    return '';
  };

  const specificationList: { name: string; value: string }[] = Array.isArray((product as any).specifications)
    ? (product as any).specifications.map((spec: any, idx: number) => ({
        name: spec?.name || `规格${idx + 1}`,
        value: formatSpecificationValue(spec),
      }))
    : Object.entries(product.specifications || {}).map(([name, value]) => ({
        name,
        value: typeof value === 'string' ? value : String(value ?? ''),
      }));

  return (
    <div className="bg-gray-50">
      <div className="container-custom max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-sm mb-6">
          <Link to="/" className="text-gray-600 hover:text-primary-600">首页</Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <Link to="/products" className="text-gray-600 hover:text-primary-600">商城</Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-12 items-start">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="relative w-full bg-white rounded-3xl shadow-lg overflow-hidden">
              <div className="relative w-full aspect-[4/3]">
                {mainImage ? (
                  isVideoFile(mainImage) ? (
                    <video src={getFileUrl(mainImage)} controls className="absolute inset-0 w-full h-full object-contain bg-black" />
                  ) : (
                    <img src={getFileUrl(mainImage)} alt={product.name} className="absolute inset-0 w-full h-full object-contain bg-white" />
                  )
                ) : (
                  <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400">暂无图片</div>
                )}
                <button
                  type="button"
                  onClick={() => setAllImageModalOpen(true)}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/70 text-white text-xs px-4 py-2"
                >
                  <Maximize2 className="h-3.5 w-3.5" />全部图片
                </button>
              </div>
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => handleImageNavigate('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow p-2 rounded-full"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleImageNavigate('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white shadow p-2 rounded-full"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                </>
              )}
              {galleryImages.length > 0 && (
                <span className="absolute bottom-4 right-4 text-xs px-3 py-1 rounded-full bg-black/60 text-white">
                  {currentImageIndex + 1}/{galleryImages.length}
                </span>
              )}
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={cn(
                    'w-24 flex-shrink-0 border rounded-xl overflow-hidden transition-all',
                    mainImage === img ? 'border-primary-600 ring-2 ring-primary-100' : 'border-gray-200'
                  )}
                >
                  {isVideoFile(img) ? (
                    <div className="w-full h-20 flex items-center justify-center bg-black text-white text-xs">视频</div>
                  ) : (
                    <img src={getFileUrl(img)} alt={`thumbnail ${idx + 1}`} className="w-full h-20 object-cover" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-400">产品系列</p>
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  className="flex items-center gap-1 text-gray-600 hover:text-gray-900"
                  aria-label="分享"
                >
                  <Share2 className="h-4 w-4" /> 分享
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!product) return;
                    
                    // 检查是否登录
                    const { isAuthenticated } = useAuthStore.getState();
                    if (!isAuthenticated) {
                      toast.error('请先登录后再收藏商品');
                      useAuthModalStore.getState().openLogin();
                      return;
                    }
                    
                    try {
                      const added = await toggleFavorite(product);
                      toast.success(added ? '已加入收藏' : '已取消收藏');
                    } catch (error) {
                      console.error('收藏操作失败:', error);
                      toast.error('操作失败，请重试');
                    }
                  }}
                  className={cn(
                    'p-2 rounded-full border transition-colors',
                    isFavorited ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 text-gray-500 hover:border-gray-400'
                  )}
                  aria-label={isFavorited ? '取消收藏' : '收藏'}
                >
                  <Heart className={cn('h-5 w-5 sm:h-6 sm:w-6', isFavorited ? 'fill-red-500 text-red-500' : '')} />
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
              <div className="flex flex-col gap-2 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">当前价格</span>
                  <span className="text-3xl font-bold text-red-600">{formatPrice(finalSkuPrice)}</span>
                  {discountPrice && (
                    <span className="text-sm px-2 py-0.5 rounded-full bg-red-50 text-red-600">限时优惠</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                  {discountPrice && <span>原价：<span className="line-through text-gray-400">{formatPrice(currentPrice)}</span></span>}
                </div>
              </div>

              {/* 只有当有多个版本时才显示版本筛选 */}
              {availableFilters.length > 1 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">选择版本</p>
                  <div className="flex gap-2">
                    {availableFilters.map(filter => (
                      <button
                        key={filter.key}
                        onClick={() => handleFilterChange(filter.key)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm border transition-colors',
                          activeFilter === filter.key
                            ? 'text-white'
                            : 'text-gray-600 border-gray-200 hover:border-gray-400'
                        )}
                        style={activeFilter === filter.key
                          ? { backgroundColor: PRIMARY_BLUE, borderColor: PRIMARY_BLUE }
                          : {}}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                  {selectedSku?.isPro && (
                    <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
                      <p className="text-sm font-semibold text-yellow-900 mb-1">PRO 专业版特性</p>
                      <p className="text-xs text-yellow-800">{selectedSku.proFeature || 'PRO 版本提供更高端材质与功能升级。'}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Specification & SKU Selection */}
              <div className="border border-gray-200 rounded-2xl bg-white">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  onClick={() => setSpecCollapsed(prev => !prev)}
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">选择规格</p>
                    <p className="text-xs text-gray-400 mt-0.5">当前 {filteredSkus.length} 款 · 支持单品 / 套餐 / 组合</p>
                  </div>
                  <ChevronDown className={cn('h-4 w-4 text-gray-500 transition-transform', specCollapsed ? '-rotate-90' : 'rotate-0')} />
                </button>
                {!specCollapsed && (
                  <div className="border-t border-gray-100 p-4">
                    <div className="flex flex-col gap-3">
                      {filteredSkus.length === 0 && (
                        <div className="p-8 rounded-xl border border-dashed border-gray-300 text-center col-span-full">
                          <div className="flex flex-col items-center gap-2">
                            <AlertCircle className="h-12 w-12 text-gray-400" />
                            <p className="text-sm font-medium text-gray-700">
                              {activeFilter === 'pro' ? '该商品暂无 PRO 版本' : 
                               activeFilter === 'standard' ? '该商品暂无标准版本' : 
                               '暂无可选规格'}
                            </p>
                            <p className="text-xs text-gray-500">请选择其他版本或联系客服咨询</p>
                          </div>
                        </div>
                      )}
                      {filteredSkus.map(sku => {
                        const isSelected = selectedSku?._id === sku._id;
                        const skuFinalPrice = getFinalPrice(sku);
                        const specDetail = specificationList.find(spec => spec.name === sku.spec)?.value || `${sku.length}x${sku.width}x${sku.height}cm`;
                        return (
                          <button
                            key={sku._id}
                            onClick={() => {
                              syncFilterWithSku(sku);
                              handleSkuChange(sku);
                            }}
                            className={cn(
                              'w-full px-5 py-3 rounded-xl border text-left bg-white transition-shadow hover:shadow-md flex flex-col gap-1',
                              isSelected ? 'shadow-[0_8px_24px_rgba(31,100,255,0.12)]' : 'border-gray-200'
                            )}
                            style={isSelected ? { borderColor: PRIMARY_BLUE, backgroundColor: '#E6EEFF' } : {}}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-gray-900">
                              <div className="flex items-center gap-2">
                                <span>{sku.spec || sku.code || '默认规格'}</span>
                                {sku.isPro && <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">PRO</span>}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-red-600">{formatPrice(skuFinalPrice)}</span>
                                {sku.discountPrice && <span className="text-xs text-gray-400 line-through">{formatPrice(sku.price)}</span>}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">尺寸：{specDetail}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Material Selection */}
              {selectedSku && (
                <div className="border border-gray-200 rounded-2xl bg-white mt-4">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-left"
                    onClick={() => setMaterialCollapsed(prev => !prev)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">选择材质</p>
                      <p className="text-xs text-gray-400 mt-0.5">参考材质卡片，点击即可切换</p>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-gray-500 transition-transform', materialCollapsed ? '-rotate-90' : 'rotate-0')} />
                  </button>
                  {!materialCollapsed && (
                    <div className="border-t border-gray-100 p-4 space-y-5">
                      {MATERIAL_SECTIONS.map(section => {
                        const list = normalizedSelectedMaterials?.[section.key] || [];
                        const selectedOption = materialSelections[section.key] || (list.length === 1 ? list[0] : null);
                        const selectedUpgrade = selectedOption ? selectedSku.materialUpgradePrices?.[selectedOption] ?? 0 : 0;
                        
                        // 按材质类型分组
                        const materialGroups: Record<string, string[]> = {};
                        const groupOrder: string[] = [];
                        
                        list.forEach(material => {
                          // 提取材质类型（如"普通皮"、"全青皮"等）
                          let groupKey = 'other';
                          if (material.includes('普通皮')) {
                            groupKey = '普通皮';
                          } else if (material.includes('全青皮')) {
                            groupKey = '全青皮';
                          } else if (material.includes('牛皮')) {
                            groupKey = '牛皮';
                          } else if (material.includes('绒布')) {
                            groupKey = '绒布';
                          } else if (material.includes('麻布')) {
                            groupKey = '麻布';
                          }
                          
                          if (!materialGroups[groupKey]) {
                            materialGroups[groupKey] = [];
                            groupOrder.push(groupKey);
                          }
                          materialGroups[groupKey].push(material);
                        });
                        
                        return (
                          <div key={section.key} className="space-y-3">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">{section.label}</p>
                              <span className="text-xs text-gray-400">{list.length ? `${list.length} 种` : '未设置'}</span>
                              {selectedOption && selectedUpgrade > 0 && (
                                <span className="text-xs text-gray-500">
                                  +{formatPrice(selectedUpgrade)}
                                </span>
                              )}
                            </div>
                            {list.length ? (
                              <div className="space-y-4">
                                {groupOrder.map(groupKey => {
                                  // 材质分组的介绍信息
                                  const groupDescriptions: Record<string, string> = {
                                    '普通皮': '普通皮革，经济实惠，适合日常使用。具有良好的耐用性和易清洁特性。',
                                    '全青皮': '全青皮是高级皮革，采用天然植物鞣制工艺，具有独特的质感和气味。随着使用时间增长，颜色会逐渐加深，形成独特的包浆效果。',
                                    '牛皮': '优质牛皮，纹理自然，质感细腻。具有很好的透气性和耐磨性。',
                                    '绒布': '柔软舒适的绒布面料，触感温暖。易于清洁，适合家庭使用。',
                                    '麻布': '天然麻布，环保透气，具有独特的质感。适合现代简约风格。',
                                  };
                                  return (
                                  <div key={groupKey}>
                                    {groupKey !== 'other' && (
                                      <div className="flex items-center gap-2 mb-2">
                                        <p className="text-xs font-medium text-gray-600">{groupKey}</p>
                                        <button
                                          type="button"
                                          onClick={() => openMaterialIntro(section.key, materialGroups[groupKey][0])}
                                          className="p-1 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                          title={`查看${groupKey}详细介绍`}
                                        >
                                          <Info className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                    <div className="flex flex-wrap gap-3">
                                      {materialGroups[groupKey].map(materialName => {
                                        const isSelected = selectedOption === materialName;
                                        const isSingle = list.length === 1;
                                        const preview = getMaterialPreviewImage(materialName);
                                        const materialUpgrade = getMaterialUpgradePrice(materialName, selectedSku.materialUpgradePrices);
                                        return (
                                          <button
                                            key={materialName}
                                            type="button"
                                            onClick={() => !isSingle && handleMaterialChoice(section.key, materialName)}
                                            className={cn(
                                              'flex flex-col items-center gap-2 relative',
                                              isSingle ? 'cursor-default' : 'cursor-pointer'
                                            )}
                                            disabled={isSingle}
                                          >
                                            {/* 加价标签 */}
                                            {materialUpgrade > 0 && (
                                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium shadow-sm z-10">
                                                +¥{materialUpgrade}
                                              </span>
                                            )}
                                            <span
                                              className={cn(
                                                'w-14 h-14 rounded-lg border-2 flex items-center justify-center overflow-hidden transition-all',
                                                isSelected ? 'border-[#1F64FF] shadow-[0_4px_12px_rgba(31,100,255,0.25)]' : 'border-transparent hover:border-gray-300'
                                              )}
                                            >
                                              {preview ? (
                                                <img src={getFileUrl(preview)} alt={materialName} className="w-full h-full object-cover" />
                                              ) : (
                                                <span
                                                  className={cn(
                                                    'w-full h-full flex items-center justify-center text-[11px] font-medium rounded-md text-gray-700',
                                                    MATERIAL_SWATCH_STYLES[section.key]
                                                  )}
                                                >
                                                  {materialName.slice(0, 2)}
                                                </span>
                                              )}
                                            </span>
                                            <span className="text-xs text-gray-600">
                                              {materialName}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">暂未配置 {section.label}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-800 mb-2">数量</h3>
                <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                  <button onClick={() => handleQuantityChange(-1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-l-md"><Minus className="h-4 w-4" /></button>
                  <span className="px-6 py-1 font-semibold text-gray-800">{quantity}</span>
                  <button onClick={() => handleQuantityChange(1)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-r-md"><Plus className="h-4 w-4" /></button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={handleAddToCart}
                className="w-full py-3 rounded-lg text-white font-semibold text-base hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: PRIMARY_BLUE,
                }}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                加入购物车
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAddToCompare}
                  className="py-2.5 rounded-lg border font-medium transition-all duration-200 text-sm"
                  style={{ borderColor: PRIMARY_BLUE, color: PRIMARY_BLUE, backgroundColor: '#f0f5ff' }}
                >
                  加入对比
                </button>
                <button
                  onClick={handleBuyNow}
                  className="py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-all duration-200 text-sm"
                >
                  立即购买
                </button>
              </div>
            </div>

          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 视频演示 - 默认收纳 */}
          <div className="card p-6 min-h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Video className="h-5 w-5" /> 视频演示</h3>
              <span className="text-xs text-gray-400">
                {videoList.length > 0 ? `${videoList.length} 个视频` : '暂无视频'}
              </span>
            </div>
            {videoList.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {videoList.map((video, index) => {
                  const videoTitle = (product as any).videoTitles?.[index] || `${product.name} - 视频${index + 1}`
                  const videoId = `video-${index}`
                  const isLocal = isVideoFile(video)
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (isLocal) {
                          // 本地视频：画中画模式
                          const videoEl = document.getElementById(videoId) as HTMLVideoElement
                          if (videoEl) {
                            if (document.pictureInPictureElement) {
                              document.exitPictureInPicture()
                            }
                            videoEl.play()
                            videoEl.requestPictureInPicture?.().catch((err: Error) => {
                              console.log('画中画模式不支持:', err)
                              // 如果不支持画中画，就全屏播放
                              videoEl.requestFullscreen?.()
                            })
                          }
                        } else {
                          // 外部链接：新窗口打开
                          window.open(video, '_blank', 'noopener,noreferrer')
                        }
                      }}
                      className="relative group aspect-video rounded-lg overflow-hidden bg-gray-900 hover:ring-2 hover:ring-primary-500 transition-all cursor-pointer"
                    >
                      {/* 缩略图/封面 */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-white/30 transition-colors">
                            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                          <p className="text-white text-sm font-medium px-2">{videoTitle}</p>
                          <p className="text-white/70 text-xs mt-1">{isLocal ? '点击播放画中画' : '点击跳转观看'}</p>
                        </div>
                      </div>
                      {/* 隐藏的video元素（仅本地视频） */}
                      {isLocal && (
                        <video 
                          id={videoId}
                          src={video}
                          className="hidden"
                          preload="metadata"
                          controls
                          onEnded={() => {
                            if (document.pictureInPictureElement) {
                              document.exitPictureInPicture()
                            }
                          }}
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <Video className="h-10 w-10 mb-3" />
                <p>暂未添加视频</p>
              </div>
            )}
          </div>

          {/* 设计文件下载 - 按类型分区 */}
          <div className="card p-6 min-h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><FileText className="h-5 w-5" /> 设计文件下载</h3>
              <span className="text-xs text-gray-400">
                {fileList.length > 0 ? `${fileList.length} 个文件` : '暂无文件'} · 登录后下载
              </span>
            </div>
            {fileList.length > 0 ? (
              <div className="space-y-4">
                {/* 按文件类型分组 */}
                {(() => {
                  const fileGroups: Record<string, typeof fileList> = {}
                  const categoryNames: Record<string, string> = {
                    'dwg': 'CAD专区',
                    'dxf': 'CAD专区',
                    'max': '3DMAX专区',
                    'fbx': 'FBX专区',
                    'obj': 'OBJ专区',
                    'skp': 'SketchUp专区',
                    'blend': 'Blender专区',
                    '3ds': '3DS专区',
                    'pdf': 'PDF文档',
                    'other': '其他文件'
                  }
                  
                  fileList.forEach(file => {
                    const ext = (file.format || file.name?.split('.').pop() || 'other').toLowerCase()
                    const category = categoryNames[ext] ? ext : 'other'
                    if (!fileGroups[category]) fileGroups[category] = []
                    fileGroups[category].push(file)
                  })
                  
                  return Object.entries(fileGroups).map(([category, files]) => (
                    <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <span className="text-sm font-medium text-gray-700">{categoryNames[category] || '其他文件'}</span>
                        <span className="text-xs text-gray-500 ml-2">({files.length})</span>
                      </div>
                      <div className="divide-y divide-gray-100">
                        {files.map((file, idx) => {
                          // 文件名默认使用商品名+扩展名
                          const fileExt = file.format?.toLowerCase() || 'file'
                          const defaultFileName = `${product.name}.${fileExt}`
                          const fileName = file.name || defaultFileName
                          
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleFileDownload(file)}
                              className="w-full flex items-center justify-between px-4 py-3 hover:bg-primary-50 text-left"
                            >
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{fileName}</p>
                                <p className="text-xs text-gray-400">
                                  {file.format?.toUpperCase() || '未知'} · {file.size ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : '大小待定'}
                                  {file.uploadTime && ` · ${file.uploadTime}`}
                                </p>
                              </div>
                              <span className="text-sm text-primary-600 font-medium">下载</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))
                })()}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <FileText className="h-10 w-10 mb-3" />
                <p>暂未上传设计文件</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12">
            <CustomizationForm productId={product._id} />
        </div>

      </div>
      <ShareModal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} />
      {isAllImageModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">全部图片</h3>
                <p className="text-xs text-gray-500">可多选下载，需登录账号才可下载</p>
              </div>
              <button onClick={() => setAllImageModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto grid grid-cols-2 md:grid-cols-3 gap-4">
              {galleryImages.map((img, idx) => {
                const checked = selectedDownloadImages.includes(img);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDownloadSelection(img)}
                    className={cn(
                      'relative rounded-2xl overflow-hidden border transition-all',
                      checked ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
                    )}
                  >
                    {isVideoFile(img) ? (
                      <div className="w-full h-40 flex items-center justify-center bg-black text-white text-sm">视频</div>
                    ) : (
                      <img src={getFileUrl(img)} alt={`gallery-${idx}`} className="w-full h-40 object-cover" />
                    )}
                    <span className="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center bg-white/90 text-gray-700 border">
                      {checked ? <Check className="h-4 w-4 text-primary-600" /> : idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between sticky bottom-0">
              <div className="text-sm font-medium text-gray-700">
                已选 <span className="text-primary-600 font-bold">{selectedDownloadImages.length}</span> 张
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                  onClick={() => {
                    setSelectedDownloadImages([]);
                    setAllImageModalOpen(false);
                  }}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    backgroundColor: selectedDownloadImages.length > 0 ? '#1F64FF' : '#e5e7eb',
                    color: selectedDownloadImages.length > 0 ? 'white' : '#9ca3af'
                  }}
                  onClick={handleDownloadImages}
                  disabled={selectedDownloadImages.length === 0}
                >
                  <Download className="h-4 w-4" /> 下载所选 ({selectedDownloadImages.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {materialInfoModal.open && materialInfoModal.section && materialInfoModal.material && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={closeMaterialIntro}
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {materialInfoModal.material}
            </h3>
            <div className="rounded-xl overflow-hidden border border-gray-100 mb-3">
              <img
                src={getFileUrl(getMaterialPreviewImage(materialInfoModal.material))}
                alt={materialInfoModal.material}
                className="w-full h-48 object-cover"
              />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {selectedSku?.materialDescriptions?.[materialInfoModal.material] || '该材质暂未提供详细说明，可在后台补充图文信息以提升展示效果。'}
            </p>
            <button
              type="button"
              className="mt-6 w-full py-2 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700"
              onClick={closeMaterialIntro}
            >
              知道了
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
