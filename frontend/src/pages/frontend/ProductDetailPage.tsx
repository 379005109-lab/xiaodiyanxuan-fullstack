import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById } from '@/services/productService';
import { getMaterialImagesByNames, clearMaterialImageCache } from '@/services/materialService';
import { recordBrowse } from '@/services/browseHistoryService';
import { Product, ProductSKU, ProductFile } from '@/types';
import { useCartStore } from '@/store/cartStore';
import { useFavoriteStore } from '@/store/favoriteStore';
import { useAuthStore } from '@/store/authStore';
import { useAuthModalStore } from '@/store/authModalStore';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, ChevronDown, Share2, Heart, Minus, Plus, FileText, Video, AlertCircle, X, Maximize2, Download, Check, Info, Play } from 'lucide-react';
import { cn, formatPrice } from '@/lib/utils';
import { getFileUrl, getThumbnailUrl } from '@/services/uploadService';

import ShareModal from '@/components/frontend/ShareModal';
import CustomizationForm from '@/components/frontend/CustomizationForm';
import TrackedImage from '@/components/TrackedImage';

type SkuFilter = 'all' | 'standard' | 'pro';

const PRIMARY_COLOR = '#14452F'; // 深绿色主题色

// 预设的材质类目配置（支持动态类目）
const PRESET_MATERIAL_CATEGORIES: { key: string; label: string; badgeClass: string; swatchStyle: string }[] = [
  { key: 'fabric', label: '面料', badgeClass: 'bg-blue-50 text-blue-700 border-blue-100', swatchStyle: 'from-slate-50 via-slate-100 to-slate-200' },
  { key: 'filling', label: '填充', badgeClass: 'bg-green-50 text-green-700 border-green-100', swatchStyle: 'from-emerald-50 via-emerald-100 to-emerald-200' },
  { key: 'frame', label: '骨架', badgeClass: 'bg-purple-50 text-purple-700 border-purple-100', swatchStyle: 'from-indigo-50 via-indigo-100 to-indigo-200' },
  { key: 'leg', label: '脚架', badgeClass: 'bg-orange-50 text-orange-700 border-orange-100', swatchStyle: 'from-amber-50 via-amber-100 to-amber-200' },
  { key: 'cushion', label: '坐垫', badgeClass: 'bg-pink-50 text-pink-700 border-pink-100', swatchStyle: 'from-pink-50 via-pink-100 to-pink-200' },
  { key: 'armrest', label: '扶手', badgeClass: 'bg-teal-50 text-teal-700 border-teal-100', swatchStyle: 'from-teal-50 via-teal-100 to-teal-200' },
  { key: 'backrest', label: '靠背', badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-100', swatchStyle: 'from-violet-50 via-violet-100 to-violet-200' },
  { key: 'hardware', label: '五金', badgeClass: 'bg-gray-50 text-gray-700 border-gray-100', swatchStyle: 'from-gray-50 via-gray-100 to-gray-200' },
];

// 根据类目key获取配置
const getMaterialCategoryConfig = (key: string) => {
  return PRESET_MATERIAL_CATEGORIES.find(c => c.key === key) || {
    key,
    label: key,
    badgeClass: 'bg-gray-50 text-gray-700 border-gray-100',
    swatchStyle: 'from-gray-50 via-gray-100 to-gray-200',
  };
};

const SKU_FILTERS: { key: SkuFilter; label: string }[] = [
  { key: 'all', label: '全部款式' },
  { key: 'standard', label: '标准版' },
  { key: 'pro', label: 'PRO 版' },
];

const determineDefaultFilter = (skus: ProductSKU[]): SkuFilter => {
  if (skus.some(sku => !sku.isPro)) return 'standard';
  if (skus.some(sku => sku.isPro)) return 'pro';
  return 'all';
};

const getProductDisplayPrice = (product: any): number => {
  const raw = product?.labelPrice1 ?? product?.takePrice ?? product?.basePrice ?? 0
  const n = Number(raw)
  console.log('[ProductDetailPage] 价格计算:', { labelPrice1: product?.labelPrice1, takePrice: product?.takePrice, basePrice: product?.basePrice, final: n })
  return Number.isFinite(n) ? n : 0
}

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
    // 皮革类
    '纳帕A级皮', '纳帕', '全青皮', '半青皮', '普通皮', '真皮', '牛皮', '半皮', '磨砂皮',
    // 布料类
    '磨砂布', '绒布', '麻布', '棉布', '丝绒',
    // 填充类
    '高回弹海绵', '高回弹', '高密加硬', '舒软款',
    // 骨架类
    '顶级框架', '普通框架', '顶级骨架', '标准骨架',
    // 脚架类
    '钛合金脚架', '钛合金', '高级脚架', '普通脚架',
    // 木材类
    '实木', '橡木', '胡桃木', '榉木', '松木', '落叶松', '桉木',
    // 金属类
    '不锈钢', '铁艺', '航空铝', '碳钢', '锰钢',
    // 其他
    '大理石', '岩板', '玻璃'
  ];
  
  for (const series of knownSeries) {
    if (materialName.includes(series)) {
      return series;
    }
  }
  
  // 尝试提取破折号前的部分作为系列名
  const prefix = materialName.split(/[-–—]/)[0]?.trim();
  if (prefix && prefix.length > 0) {
    return prefix;
  }
  
  const match = materialName.match(/^[\u4e00-\u9fa5]{1,5}/);
  return match ? match[0] : materialName;
};

// 计算材质加价（支持完全匹配和前缀匹配）
const getMaterialUpgradePrice = (materialName: string, upgradePrices?: Record<string, number>): number => {
  if (!upgradePrices || Object.keys(upgradePrices).length === 0) {
    return 0;
  }
  
  // 1. 完全匹配
  if (upgradePrices[materialName] !== undefined) {
    return upgradePrices[materialName];
  }
  
  // 2. 前缀匹配：检查材质名称是否以加价键开头（如"高级脚架-钛合金"以"高级脚架"开头）
  for (const [key, price] of Object.entries(upgradePrices)) {
    if (materialName.startsWith(key + '-') || materialName.startsWith(key + '—')) {
      console.log(`[加价查找] 前缀匹配: ${materialName} 以 "${key}" 开头 = ${price}`);
      return price;
    }
  }
  
  // 3. 包含匹配：检查材质名称是否包含加价键
  for (const [key, price] of Object.entries(upgradePrices)) {
    if (materialName.includes(key)) {
      console.log(`[加价查找] 包含匹配: ${materialName} 包含 "${key}" = ${price}`);
      return price;
    }
  }
  
  return 0;
};

const isVideoFileByExtension = (url: string) => /\.(mp4|webm|ogg)$/i.test(url);

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

// 动态规范化材质选择，返回 Record<string, string[]>
const normalizeMaterialSelection = (material?: ProductSKU['material']): Record<string, string[]> => {
  const ensureArray = (value?: string[] | string): string[] => {
    if (!value) return [];
    return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : [];
  };

  if (!material) {
    return {};
  }

  if (typeof material === 'string') {
    return material ? { fabric: [material] } : {};
  }

  // 动态处理所有材质类目
  const result: Record<string, string[]> = {};
  Object.entries(material).forEach(([key, value]) => {
    const arr = ensureArray(value as string[] | string);
    if (arr.length > 0) {
      result[key] = arr;
    }
  });
  return result;
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

// 获取材质升级价格（支持动态材质类目）
const getUpgradePrice = (sku?: ProductSKU | null, selectedMaterials?: Record<string, string | null>) => {
  if (!sku || !selectedMaterials) return 0;
  
  const materialUpgradePrices = sku.materialUpgradePrices || {};
  let totalUpgradePrice = 0;
  
  // 获取所有选中的材质并累计加价
  const selectedMaterialList: string[] = Object.values(selectedMaterials).filter((v): v is string => !!v);
  
  // 累计每个材质的加价
  selectedMaterialList.forEach(materialName => {
    // 1. 首先尝试用完整材质名称查找加价
    if (materialUpgradePrices[materialName] !== undefined) {
      totalUpgradePrice += materialUpgradePrices[materialName];
      return;
    }
    
    // 2. 尝试用材质类别前缀查找（如"纳帕A级皮-纳帕黑" -> "纳帕A级皮"）
    const prefix = materialName.split(/[-–—]/)[0]?.trim();
    if (prefix && materialUpgradePrices[prefix] !== undefined) {
      totalUpgradePrice += materialUpgradePrices[prefix];
      return;
    }
    
    // 3. 遍历所有加价键，检查材质名称是否包含该键
    for (const [key, value] of Object.entries(materialUpgradePrices)) {
      if (materialName.includes(key) && typeof value === 'number') {
        totalUpgradePrice += value;
        return;
      }
    }
  });
  
  return totalUpgradePrice;
};

// 材质分组的介绍信息（全局共享）
const MATERIAL_GROUP_DESCRIPTIONS: Record<string, string> = {
  '磨砂皮': '磨砂皮具有细腻的磨砂质感，手感柔软舒适，外观时尚大气。',
  '纳帕A级皮': '纳帕A级皮是顶级真皮，皮质细腻柔软，触感舒适，高端品质。',
  '普通皮': '普通皮革，经济实惠，适合日常使用。具有良好的耐用性和易清洁特性。',
  '全青皮': '全青皮是高级皮革，采用天然植物鞣制工艺，具有独特的质感和气味。',
  '牛皮': '优质牛皮，纹理自然，质感细腻。具有很好的透气性和耐磨性。',
  '绒布': '柔软舒适的绒布面料，触感温暖。易于清洁，适合家庭使用。',
  '麻布': '天然麻布，环保透气，具有独特的质感。适合现代简约风格。',
  '舒软款': '舒软填充，坐感柔软舒适，适合长时间休息。',
  '高密加硬': '高密度填充，支撑性强，不易塌陷，适合喜欢硬坐感的用户。',
  '高回弹': '高回弹海绵，弹性好，久坐不变形，舒适耐用。',
  '55D高回弹海绵': '采用出口级55D高密度聚氨酯海绵，回弹率>55%，经过72小时疲劳测试，十年坐感如初，提供恰到好处的支撑力，保护脊椎健康。适合喜欢偏硬坐感的用户。',
  '70%羽绒+乳胶': '云端包裹感，轻盈柔软，透气性极佳，给您如云端般的舒适体验。',
  '标准骨架': '标准骨架配置，稳固耐用，性价比高。',
  '顶级骨架': '顶级骨架配置，采用优质材料，更加稳固耐用。',
  '俄罗斯落叶松': '采用进口俄罗斯落叶松实木，木质坚硬，纹理清晰，承重力强，使用寿命长。',
  '普通脚架': '标准脚架，稳固实用。',
  '钛合金脚架': '钛合金脚架，轻便坚固，美观大方。',
  '黑钛不锈钢': '采用304不锈钢材质，黑钛电镀工艺，耐腐蚀、耐磨损，外观时尚高端。',
  '泰迪绒': '泰迪绒面料柔软蓬松，触感细腻，保暖性好，外观时尚可爱。',
  'A类泰迪绒': 'A类泰迪绒采用优质纤维，柔软亲肤，透气性好，适合家居使用。',
  'A+泰迪绒': 'A+泰迪绒是顶级泰迪绒面料，更加柔软蓬松，触感极佳。',
  'B泰迪绒': 'B类泰迪绒性价比高，触感舒适，适合日常使用。',
};

// 获取材质描述的辅助函数
const getMaterialDescription = (materialName: string, skuDescriptions?: Record<string, string>) => {
  // 1. 首先从 SKU 配置获取
  if (skuDescriptions?.[materialName]) {
    return skuDescriptions[materialName];
  }
  // 2. 尝试用材质类别前缀匹配
  const prefix = materialName.split(/[-–—]/)[0]?.trim();
  if (prefix && MATERIAL_GROUP_DESCRIPTIONS[prefix]) {
    return MATERIAL_GROUP_DESCRIPTIONS[prefix];
  }
  // 3. 尝试模糊匹配
  for (const [key, desc] of Object.entries(MATERIAL_GROUP_DESCRIPTIONS)) {
    if (materialName.includes(key)) {
      return desc;
    }
  }
  return '';
};

const getFinalPrice = (sku?: ProductSKU | null, selectedMaterials?: Record<string, string | null>) => {
  if (!sku) return 0;
  // PRO版一口价，不加材质加价
  if (sku.isPro) {
    return getBasePrice(sku);
  }
  // 普通版：基础价 + 材质加价
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
  const [selectedSkuIds, setSelectedSkuIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SkuFilter>('all');
  const [specCollapsed, setSpecCollapsed] = useState(true);
  const [materialCollapsed, setMaterialCollapsed] = useState(false); // 默认展开
  const [materialSelections, setMaterialSelections] = useState<Record<string, string | null>>({});
  const [materialSelectionsBySku, setMaterialSelectionsBySku] = useState<Record<string, Record<string, string | null>>>({});
  const [multiSpecMode, setMultiSpecMode] = useState(false);
  const [expandedMaterialCategory, setExpandedMaterialCategory] = useState<string | null>(null);
  const [previewMaterialImage, setPreviewMaterialImage] = useState<string | null>(null);
  const [materialInfoModal, setMaterialInfoModal] = useState<{ open: boolean; section?: string; material?: string }>({ open: false });
  const [thumbPage, setThumbPage] = useState(0);
  const [thumbsPerPage, setThumbsPerPage] = useState(4);
  const [selectedDownloadImages, setSelectedDownloadImages] = useState<string[]>([]);
  const [materialAssetMap, setMaterialAssetMap] = useState<Record<string, string>>({});
  const [materialSectionReady, setMaterialSectionReady] = useState(false); // 延迟渲染材质区域
  const [selectedMaterialGroupId, setSelectedMaterialGroupId] = useState<string | null>(null); // 选中的材质分组ID

  const { addItem } = useCartStore();
  const { favorites, toggleFavorite, loadFavorites } = useFavoriteStore();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  // 滚动到页面顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (isAuthenticated) {
      loadFavorites();
    }
  }, [isAuthenticated, loadFavorites]);

  // 材质图片加载函数（按需调用）
  const loadMaterialImagesIfNeeded = async () => {
    if (!selectedSku) return;
    
    const normalizedMaterials = normalizeMaterialSelection(selectedSku.material);
    const allMaterialNames = Object.values(normalizedMaterials).flat().filter(Boolean);
    
    if (allMaterialNames.length === 0) return;
    
    const uncachedNames = allMaterialNames.filter(name => !materialAssetMap[name]);
    
    if (uncachedNames.length > 0) {
      const newImages = await getMaterialImagesByNames(uncachedNames);
      setMaterialAssetMap(prev => ({ ...prev, ...newImages }));
    }
  };
  
  // 材质图片加载状态
  const [materialImagesLoaded, setMaterialImagesLoaded] = useState(false);
  
  useEffect(() => {
    setMaterialImagesLoaded(false);
  }, [selectedSku]);
  
  const triggerLoadMaterialImages = () => {
    if (!materialImagesLoaded && selectedSku) {
      loadMaterialImagesIfNeeded();
      setMaterialImagesLoaded(true);
    }
  };
  
  // 页面加载后自动加载材质图片（如果区域展开）
  useEffect(() => {
    if (selectedSku && !materialCollapsed) {
      const timer = setTimeout(triggerLoadMaterialImages, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedSku, materialCollapsed]);

  // 材质图片缓存（合并 SKU 配置和材质库）
  const materialImageCache = useMemo(() => {
    const cache: Record<string, string> = {};
    if (!selectedSku) return cache;
    
    const normalizedMaterials = normalizeMaterialSelection(selectedSku.material);
    const allMaterialNames = Object.values(normalizedMaterials).flat();
    
    allMaterialNames.forEach(materialName => {
      if (!materialName) return;
      
      // 1. SKU材质图片配置优先
      if (selectedSku.materialImages?.[materialName]) {
        cache[materialName] = selectedSku.materialImages[materialName];
        return;
      }
      
      // 2. 材质库缓存
      if (materialAssetMap[materialName]) {
        cache[materialName] = materialAssetMap[materialName];
      }
    });
    
    return cache;
  }, [selectedSku, materialAssetMap]);

  // 获取材质分组数据
  const materialsGroups = useMemo(() => {
    if (!product) return [];
    return ((product as any).materialsGroups || []) as Array<{
      id: string;
      name: string;
      images: string[];
      price: number;
      extra?: number;
      isDefault?: boolean;
    }>;
  }, [product]);

  // 获取材质配置数据（新版：面料选择）
  const materialConfigs = useMemo(() => {
    if (!product) return [];
    const configs = ((product as any).materialConfigs || []) as Array<{
      id: string;
      fabricName: string;
      fabricId: string;
      images: string[];
      price: number;
    }>;
    console.log('🔥 [DEBUG] ProductDetailPage materialConfigs:', configs, 'count:', configs.length);
    return configs;
  }, [product]);

  // 获取所有视频ID用于视频检测
  const videoIds = useMemo(() => {
    const allVideoIds = new Set<string>();
    if (!product) return allVideoIds;
    const skus = Array.isArray((product as any).skus) ? ((product as any).skus as any[]) : [];
    skus.forEach((sku: any) => {
      (sku.videos || []).forEach((v: string) => v && allVideoIds.add(v));
    });
    // 也添加产品级别的视频
    const productVideos = (product as any).videos || (product as any).videoUrls || [];
    (Array.isArray(productVideos) ? productVideos : [productVideos]).forEach((v: string) => v && allVideoIds.add(v));
    return allVideoIds;
  }, [product]);

  // 检查文件ID是否为视频
  const isVideoFile = (fileId: string): boolean => {
    if (!fileId) return false;
    if (videoIds.has(fileId)) return true;
    return isVideoFileByExtension(fileId);
  };

  // 其他材质（固定文字）
  const otherMaterialsText = useMemo(() => {
    if (!product) return '';
    return (product as any).otherMaterialsText || '';
  }, [product]);

  const selectedMaterialDescriptionText = useMemo(() => {
    if (!product || !selectedSku) return '';
    const options = ((product as any).materialDescriptionOptions || []) as Array<{ id: string; text: string }>;
    const id = (selectedSku as any).materialDescriptionId as string | undefined;
    if (!id) return '';
    const hit = options.find(o => o.id === id);
    return hit?.text || '';
  }, [product, selectedSku]);

  // 当前选中的材质配置ID
  const [selectedMaterialConfigId, setSelectedMaterialConfigId] = useState<string | null>(null);
  
  // 材质详情弹窗
  const [showMaterialDetailModal, setShowMaterialDetailModal] = useState(false);
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<string>('');
  const [selectedCategoryConfigs, setSelectedCategoryConfigs] = useState<typeof materialConfigs>([]);
  

  // 获取选中的材质配置
  const selectedMaterialConfig = useMemo(() => {
    if (materialConfigs.length === 0) return null;
    if (selectedMaterialConfigId) {
      return materialConfigs.find(c => c.id === selectedMaterialConfigId) || null;
    }
    return materialConfigs[0] || null;
  }, [materialConfigs, selectedMaterialConfigId]);


  // 获取选中的材质分组
  const selectedMaterialGroup = useMemo(() => {
    if (materialsGroups.length === 0) return null;
    if (selectedMaterialGroupId) {
      return materialsGroups.find(g => g.id === selectedMaterialGroupId) || null;
    }
    // 默认选择isDefault为true的分组，或第一个
    return materialsGroups.find(g => g.isDefault) || materialsGroups[0] || null;
  }, [materialsGroups, selectedMaterialGroupId]);

  // 材质分组加价
  const materialGroupExtraPrice = useMemo(() => {
    if (!selectedMaterialGroup) return 0;
    return selectedMaterialGroup.price || selectedMaterialGroup.extra || 0;
  }, [selectedMaterialGroup]);

  const defaultGalleryImages = useMemo(() => {
    if (!product) return [];

    // 选择材质后，优先使用当前选中 SKU 的整组多媒体
    if (selectedSku) {
      const skuVideos = (((selectedSku as any).videos || []) as string[]).filter(Boolean);
      const skuImages = (selectedSku.images || []).filter(Boolean);
      const combined = [...skuVideos, ...skuImages].filter(Boolean);
      if (combined.length > 0) return combined;
    }

    // 其次使用选中的材质配置的图片
    if (selectedMaterialConfig && selectedMaterialConfig.images?.length > 0) {
      return selectedMaterialConfig.images;
    }

    // 再次使用材质分组的图片
    if (selectedMaterialGroup && selectedMaterialGroup.images?.length > 0) {
      return selectedMaterialGroup.images;
    }

    // 否则使用默认图片（视频优先）
    const baseImages = Array.isArray(product.images) ? product.images : [];
    const skus = Array.isArray((product as any).skus) ? ((product as any).skus as any[]) : [];
    const skuVideos = skus.flatMap((sku: any) => sku.videos || []);
    const skuImages = skus.flatMap((sku: any) => sku.images || []);
    const merged = [...skuVideos, ...baseImages, ...skuImages].filter(Boolean);
    return Array.from(new Set(merged));
  }, [product, selectedMaterialConfig, selectedMaterialGroup, selectedSku]);

  const isComboProduct = Boolean((product as any)?.isCombo);

  const selectedSkus = useMemo(() => {
    if (!product) return [] as ProductSKU[];
    const allSkus = Array.isArray((product as any).skus) ? ((product as any).skus as ProductSKU[]) : [];

    if (!multiSpecMode) {
      return selectedSku ? [selectedSku] : [];
    }

    const ids = selectedSkuIds.length
      ? selectedSkuIds
      : (selectedSku?._id ? [String(selectedSku._id)] : []);

    return ids
      .map(id => allSkus.find(sku => String(sku._id) === String(id)))
      .filter((sku): sku is ProductSKU => Boolean(sku));
  }, [product, multiSpecMode, selectedSkuIds, selectedSku]);

  const comboTotalPrice = useMemo(() => {
    if (!product || !isComboProduct) return 0;
    const allSkus = Array.isArray((product as any).skus) ? ((product as any).skus as ProductSKU[]) : [];
    const selectedSkus = allSkus.filter(s => selectedSkuIds.includes(String(s._id)));
    return selectedSkus.reduce((sum, sku) => sum + Number(getFinalPrice(sku) || 0), 0);
  }, [product, isComboProduct, selectedSkuIds]);

  const multiSpecTotalPrice = useMemo(() => {
    if (!multiSpecMode) return 0;
    if (!product) return 0;

    return selectedSkus.reduce((sum, sku) => {
      const chosen = materialSelectionsBySku[String(sku._id)] || {};
      const normalized = normalizeMaterialSelection(sku.material);
      const materialCategories = (sku as any).materialCategories || Object.keys(normalized);
      const resolved: Record<string, string | null> = {};

      materialCategories.forEach((categoryKey: string) => {
        const list = normalized[categoryKey] || [];
        resolved[categoryKey] = chosen[categoryKey] || (list.length === 1 ? list[0] : null);
      });

      return sum + Number(getFinalPrice(sku, resolved) || 0);
    }, 0);
  }, [multiSpecMode, product, selectedSkus, materialSelectionsBySku]);

  const galleryImages = useMemo(() => {
    if (isComboProduct) {
      const allSkus = Array.isArray((product as any)?.skus) ? ((product as any).skus as ProductSKU[]) : [];
      const selectedSkus = allSkus.filter(s => selectedSkuIds.includes(String(s._id)));
      const selectedImages = selectedSkus.flatMap(s => (s.images || [])).filter(Boolean);
      const baseImages = Array.isArray(product?.images) ? product!.images.filter(Boolean) : [];
      const merged = [...baseImages, ...selectedImages].filter(Boolean);
      const uniq = Array.from(new Set(merged));
      return uniq.length > 0 ? uniq : defaultGalleryImages;
    }

    if (multiSpecMode) {
      const videos = selectedSkus.flatMap(sku => (sku as any).videos || []).filter(Boolean);
      const images = selectedSkus.flatMap(sku => sku.images || []).filter(Boolean);
      const merged = [...videos, ...images];
      const unique = Array.from(new Set(merged));
      return unique.length ? unique : defaultGalleryImages;
    }

    if (selectedSku) {
      const skuVideos = ((selectedSku as any).videos || []).filter(Boolean);
      const skuImages = (selectedSku.images || []).filter(Boolean);
      const combined = [...skuVideos, ...skuImages];
      if (combined.length > 0) {
        return combined;
      }
    }

    return defaultGalleryImages;
  }, [defaultGalleryImages, isComboProduct, multiSpecMode, product, selectedSku, selectedSkuIds, selectedSkus]);

  const filteredSkus = useMemo(() => {
    if (!product) return [];
    const skus = Array.isArray((product as any).skus) ? ((product as any).skus as ProductSKU[]) : [];
    if (activeFilter === 'standard') return skus.filter(sku => !sku.isPro);
    if (activeFilter === 'pro') return skus.filter(sku => sku.isPro);
    return skus;
  }, [product, activeFilter]);

  // 合并相同规格的SKU，按面料分组
  const groupedSkus = useMemo(() => {
    const groups: Record<string, ProductSKU[]> = {};
    filteredSkus.forEach(sku => {
      const specKey = `${sku.spec || ''}-${sku.length}-${sku.width}-${sku.height}`;
      if (!groups[specKey]) {
        groups[specKey] = [];
      }
      groups[specKey].push(sku);
    });
    return groups;
  }, [filteredSkus]);

  // 当前选中的规格组
  const [selectedSpecKey, setSelectedSpecKey] = useState<string | null>(null);

  // 当前规格组的SKU列表
  const currentSpecSkus = useMemo(() => {
    if (!selectedSpecKey) {
      // 如果没有选中规格，返回第一个规格组的SKU
      const firstKey = Object.keys(groupedSkus)[0];
      return firstKey ? groupedSkus[firstKey] : [];
    }
    return groupedSkus[selectedSpecKey] || [];
  }, [groupedSkus, selectedSpecKey]);

  // 当前选中的面料SKU
  const currentMaterialSku = useMemo(() => {
    if (currentSpecSkus.length === 0) return null;
    if (selectedMaterialConfigId) {
      return currentSpecSkus.find(sku => sku.fabricMaterialId === selectedMaterialConfigId) || currentSpecSkus[0];
    }
    return currentSpecSkus[0];
  }, [currentSpecSkus, selectedMaterialConfigId]);

  // 根据商品实际的SKU动态生成可用的筛选选项
  const availableFilters = useMemo(() => {
    if (!product) return [];
    const skus = Array.isArray((product as any).skus) ? ((product as any).skus as ProductSKU[]) : [];
    if (skus.length === 0) return [];
    
    const filters: { key: SkuFilter; label: string }[] = [];
    const hasStandard = skus.some(sku => !sku.isPro);
    const hasPro = skus.some(sku => sku.isPro);
    
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
  const fileList = useMemo(() => {
    // 只显示当前选中SKU的文件，不显示所有SKU的文件
    const skuFiles: ProductFile[] = [];
    
    // 只从当前选中的SKU中获取文件
    if (selectedSku && (selectedSku as any).files && Array.isArray((selectedSku as any).files)) {
      (selectedSku as any).files.forEach((file: any) => {
        skuFiles.push({
          name: file.name || '设计文件',
          url: file.url || file.fileId,
          format: file.type || file.format || file.name?.split('.').pop() || 'unknown',
          size: file.size || 0,
          uploadTime: file.uploadTime
        });
      });
    }
    
    return skuFiles;
  }, [selectedSku]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const fetchedProduct = await getProductById(id);
        console.log('[ProductDetailPage] 获取到的商品数据:', { 
          labelPrice1: (fetchedProduct as any)?.labelPrice1, 
          takePrice: (fetchedProduct as any)?.takePrice, 
          basePrice: (fetchedProduct as any)?.basePrice 
        })
        setProduct(fetchedProduct);
        
        // 记录用户浏览历史（异步，不影响页面加载）
        if (fetchedProduct) {
          recordBrowse(id, 'web').catch(err => console.warn('记录浏览历史失败:', err));
        }
        
        if (fetchedProduct) {
          const fetchedSkus = Array.isArray((fetchedProduct as any).skus) ? ((fetchedProduct as any).skus as ProductSKU[]) : [];
          const fetchedMaterialConfigs = ((fetchedProduct as any).materialConfigs || []) as Array<{id: string; fabricName: string; fabricId: string; images: string[]; price: number}>;
          const defaultFilter = determineDefaultFilter(fetchedSkus);
          setActiveFilter(defaultFilter);
          const initialSku = getInitialSkuForFilter(fetchedSkus, defaultFilter);
          setSelectedSku(initialSku);
          setSelectedSkuIds([]);
          
          // 同步材质配置选择与SKU
          // 如果有materialConfigs，根据初始SKU的fabricMaterialId选择对应的配置
          if (fetchedMaterialConfigs.length > 0 && initialSku?.fabricMaterialId) {
            const matchingConfig = fetchedMaterialConfigs.find(c => c.id === initialSku.fabricMaterialId);
            if (matchingConfig) {
              setSelectedMaterialConfigId(matchingConfig.id);
            }
          }
          
          // 优先使用视频，然后是图片
          const skuVideos = ((initialSku as any)?.videos || []).filter(Boolean);
          const skuImages = (initialSku?.images || []).filter(Boolean);
          const firstSkuMedia = skuVideos[0] || skuImages[0];
          const firstProductImage = fetchedProduct.images?.find(Boolean);
          setMainImage(firstSkuMedia || firstProductImage || '');
        } else {
          toast.error('未找到该商品');
        }
      } finally {
        setLoading(false);
        // 立即渲染材质选择区域
        setMaterialSectionReady(true);
      }
    };
    setMaterialSectionReady(false); // 重置材质区域状态
    clearMaterialImageCache(); // 清除材质图片缓存，确保获取最新图片
    setMaterialAssetMap({}); // 清除本地缓存
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!selectedSku) return;
    if (!Array.isArray(materialConfigs) || materialConfigs.length === 0) return;
    const nextId = (selectedSku as any).fabricMaterialId as string | undefined;
    if (!nextId) return;
    if (materialConfigs.some(c => c.id === nextId)) {
      setSelectedMaterialConfigId(nextId);
    }
  }, [selectedSku, materialConfigs]);

  useEffect(() => {
    // 如果筛选后没有SKU，清空选中的SKU
    if (!filteredSkus.length) {
      setSelectedSku(null);
      setSelectedSkuIds([]);
      setMaterialSelections({});
      return;
    }

    if (isComboProduct) {
      setSelectedSkuIds(prev => prev.filter(id => filteredSkus.some(s => String(s._id) === String(id))));
      if (selectedSku && filteredSkus.some(s => s._id === selectedSku._id)) return;
      setSelectedSku(filteredSkus[0]);
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
  }, [filteredSkus, isComboProduct, selectedSku]);

  useEffect(() => {
    if (!multiSpecMode) return;
    if (selectedSkuIds.length) return;
    if (selectedSku?._id) {
      setSelectedSkuIds([String(selectedSku._id)]);
    }
  }, [multiSpecMode, selectedSkuIds.length, selectedSku?._id]);

  useEffect(() => {
    if (!galleryImages.length) return;
    setMainImage(prev => (galleryImages.includes(prev) ? prev : galleryImages[0]));
  }, [galleryImages]);

  useEffect(() => {
    if (!selectedSku || isComboProduct) {
      setMaterialSelections({});
      return;
    }
    const normalized = normalizeMaterialSelection(selectedSku.material);
    const upgradePrices = selectedSku.materialUpgradePrices || {};
    // 获取SKU已配置的材质类目列表
    const materialCategories = (selectedSku as any).materialCategories || Object.keys(normalized);
    
    setMaterialSelections(prev => {
      const fromCache = materialSelectionsBySku[String(selectedSku._id)];
      const next: Record<string, string | null> = {};
      materialCategories.forEach((categoryKey: string) => {
        const list = normalized[categoryKey] || [];
        const cached = fromCache?.[categoryKey];
        if (cached && list.includes(cached)) {
          next[categoryKey] = cached;
          return;
        }
        if (list.length === 1) {
          next[categoryKey] = list[0];
        } else if (selectedSku.isPro) {
          next[categoryKey] = pickPremiumMaterial(list, upgradePrices);
        } else if (list.length > 1 && prev[categoryKey] && list.includes(prev[categoryKey]!)) {
          next[categoryKey] = prev[categoryKey]!;
        } else {
          next[categoryKey] = null;
        }
      });

      setMaterialSelectionsBySku(prevMap => ({
        ...prevMap,
        [String(selectedSku._id)]: next,
      }));

      return next;
    });
  }, [selectedSku]);

  const handleSkuChange = (sku: ProductSKU) => {
    setSelectedSku(sku);
    const firstSkuMedia = ((sku as any).videos || []).find(Boolean) || sku.images?.find(Boolean);
    const fallbackMedia = defaultGalleryImages[0] || (product as any)?.videos?.find?.(Boolean) || product?.images?.[0] || '';
    setMainImage(firstSkuMedia || fallbackMedia);
    setQuantity(1);
  };

  const handleToggleSku = (sku: ProductSKU) => {
    setSelectedSku(sku);
    const firstSkuMedia = ((sku as any).videos || []).find(Boolean) || sku.images?.find(Boolean);
    const fallbackMedia = defaultGalleryImages[0] || (product as any)?.videos?.find?.(Boolean) || product?.images?.[0] || '';
    setMainImage(firstSkuMedia || fallbackMedia);
    setSelectedSkuIds(prev => {
      const id = String(sku._id);
      if (prev.includes(id)) return prev.filter(x => x !== id);
      return [...prev, id];
    });
  };

  const syncFilterWithSku = (sku: ProductSKU) => {
    setActiveFilter(prev => {
      if (prev === 'all') {
        return sku.isPro ? 'pro' : 'standard';
      }
      return prev;
    });
  };

  const findSkuByImage = (img: string) => {
    if (!product) return undefined;
    const allSkus = Array.isArray((product as any).skus) ? ((product as any).skus as ProductSKU[]) : [];
    return allSkus.find(sku => (sku.images || []).includes(img) || (((sku as any).videos || []) as string[]).includes(img));
  };

  const handleThumbnailClick = (img: string) => {
    setMainImage(img);
    const ownerSku = findSkuByImage(img);
    if (!ownerSku) return;

    if (multiSpecMode) {
      setSelectedSku(ownerSku);
      syncFilterWithSku(ownerSku);
      setSelectedSkuIds(prev => (prev.includes(String(ownerSku._id)) ? prev : [...prev, String(ownerSku._id)]));
      return;
    }

    setSelectedSku(ownerSku);
    syncFilterWithSku(ownerSku);
    setQuantity(1);
  };

  const toggleSkuSelection = (sku: ProductSKU) => {
    setSelectedSku(sku);
    syncFilterWithSku(sku);
    setSelectedSkuIds(prev => {
      const id = String(sku._id);
      const exists = prev.includes(id);
      if (exists) {
        const next = prev.filter(x => x !== id);
        return next.length ? next : [id];
      }
      return [...prev, id];
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
    const materialCategories = (selectedSku as any).materialCategories || Object.keys(normalizedMaterials);
    const chosenMaterials: Record<string, string | undefined> = {};

    for (const categoryKey of materialCategories) {
      const options = normalizedMaterials[categoryKey] || [];
      const selectedOption = materialSelections[categoryKey] || (options.length === 1 ? options[0] : undefined);
      // Material selection is now optional - no validation error
      chosenMaterials[categoryKey] = selectedOption;
    }
    return chosenMaterials;
  };

  const resolveSelectedMaterialsForSku = (sku: ProductSKU) => {
    const normalizedMaterials = normalizeMaterialSelection(sku.material);
    const materialCategories = (sku as any).materialCategories || Object.keys(normalizedMaterials);
    const chosenMaterials: Record<string, string | undefined> = {};
    const selection = materialSelectionsBySku[String(sku._id)] || {};

    for (const categoryKey of materialCategories) {
      const options = normalizedMaterials[categoryKey] || [];
      const selectedOption = selection[categoryKey] || (options.length === 1 ? options[0] : undefined);
      // Material selection is now optional - no validation error
      chosenMaterials[categoryKey] = selectedOption;
    }
    return chosenMaterials;
  };

  const handleAddToCart = () => {
    if (!product) {
      toast.error('商品不存在');
      return;
    }

    if (isComboProduct) {
      const allSkus = Array.isArray((product as any).skus) ? ((product as any).skus as ProductSKU[]) : [];
      const selectedSkus = allSkus.filter(s => selectedSkuIds.includes(String(s._id)));
      if (selectedSkus.length === 0) {
        toast.error('请选择商品规格');
        return;
      }
      selectedSkus.forEach((sku) => {
        addItem(product, sku, quantity, undefined, getFinalPrice(sku));
      })
      toast.success('已添加到购物车');
      return;
    }

    if (!selectedSku) {
      toast.error('请选择商品规格');
      return;
    }

    const buildMaterialConfigsSelectedMaterials = () => {
      if (!selectedMaterialConfig?.fabricName) return {}
      return {
        fabric: selectedMaterialConfig.fabricName,
        '面料': selectedMaterialConfig.fabricName,
      } as any
    }

    if (multiSpecMode && selectedSkus.length > 0) {
      for (const sku of selectedSkus) {
        // 如果使用新的材质配置系统
        if (materialConfigs.length > 0) {
          const finalPrice = getFinalPrice(sku) + (selectedMaterialConfig?.price || 0);
          addItem(product, sku, quantity, buildMaterialConfigsSelectedMaterials(), finalPrice);
        } else {
          const chosenMaterials = resolveSelectedMaterialsForSku(sku);
          // Material selection is optional - proceed with empty object if not selected
          addItem(product, sku, quantity, chosenMaterials || {}, getFinalPrice(sku, chosenMaterials || {}));
        }
      }
      toast.success('已添加到购物车');
      return;
    }

    // 如果使用新的材质配置系统
    if (materialConfigs.length > 0) {
      const finalPrice = displayPrice;
      addItem(product, selectedSku, quantity, buildMaterialConfigsSelectedMaterials(), finalPrice);
      toast.success('已添加到购物车');
      return;
    }

    // 旧的材质选择系统 - material selection is optional
    const chosenMaterials = resolveSelectedMaterials();
    // Proceed with empty object if no materials selected
    addItem(product, selectedSku, quantity, chosenMaterials || {}, getFinalPrice(selectedSku, chosenMaterials || {}));
    toast.success('已添加到购物车');
  };

  const handleBuyNow = () => {
    if (!product) {
      toast.error('商品不存在');
      return;
    }

    if (isComboProduct) {
      const allSkus = Array.isArray((product as any).skus) ? ((product as any).skus as ProductSKU[]) : [];
      const selectedSkus = allSkus.filter(s => selectedSkuIds.includes(String(s._id)));
      if (selectedSkus.length === 0) {
        toast.error('请选择商品规格');
        return;
      }
      selectedSkus.forEach((sku) => {
        addItem(product, sku, quantity, undefined, getFinalPrice(sku));
      })
      navigate('/checkout');
      return;
    }

    if (!selectedSku) {
      toast.error('请选择商品规格');
      return;
    }

    if (multiSpecMode && selectedSkus.length > 0) {
      for (const sku of selectedSkus) {
        const chosenMaterials = resolveSelectedMaterialsForSku(sku);
        // Material selection is optional, proceed even if not selected
        addItem(product, sku, quantity, chosenMaterials || {}, getFinalPrice(sku, chosenMaterials || {}));
      }
      navigate('/checkout');
      return;
    }
    // 如果使用新的材质配置系统，直接使用最终价格（已包含材质配置加价）
    if (materialConfigs.length > 0) {
      const finalPrice = displayPrice;
      try {
        const selectedMaterials = selectedMaterialConfig?.fabricName
          ? ({ fabric: selectedMaterialConfig.fabricName, '面料': selectedMaterialConfig.fabricName } as any)
          : ({} as any)
        addItem(product, selectedSku, quantity, selectedMaterials, finalPrice);
        navigate('/checkout');
      } catch (error) {
        console.error('Add to cart error:', error);
        toast.error('添加到购物车失败');
      }
      return;
    }
    
    // 旧的材质选择系统 - material selection is now optional
    const chosenMaterials = resolveSelectedMaterials();
    try {
      addItem(product, selectedSku, quantity, chosenMaterials || {}, getFinalPrice(selectedSku, chosenMaterials || {}));
      navigate('/checkout');
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error('添加到购物车失败');
    }
  };

  const handleMaterialChoice = (sectionKey: string, materialName: string) => {
    const options = normalizedSelectedMaterials?.[sectionKey] || [];
    if (options.length <= 1) return;

    const currentSelection = materialSelections[sectionKey];
    
    // 如果点击的是同一个材质，切换展开/收起状态和预览图
    if (currentSelection === materialName) {
      const shouldClose = expandedMaterialCategory === sectionKey;
      setExpandedMaterialCategory(shouldClose ? null : sectionKey);
      // 获取材质预览图片并设置到主图区域
      const materialImage = getMaterialPreviewImage(materialName);
      setPreviewMaterialImage(shouldClose ? null : materialImage || null);
    } else {
      // 选择新材质并展开详情
      setMaterialSelections(prev => ({ ...prev, [sectionKey]: materialName }));
      if (selectedSku) {
        setMaterialSelectionsBySku(prevMap => ({
          ...prevMap,
          [String(selectedSku._id)]: {
            ...(prevMap[String(selectedSku._id)] || {}),
            [sectionKey]: materialName,
          },
        }));
      }
      setExpandedMaterialCategory(sectionKey);
      // 获取材质预览图片并设置到主图区域
      const materialImage = getMaterialPreviewImage(materialName);
      setPreviewMaterialImage(materialImage || null);
    }
  };

  const openMaterialIntro = (sectionKey: string, materialName?: string) => {
    setMaterialInfoModal({ open: true, section: sectionKey, material: materialName });
  };

  const closeMaterialIntro = () => setMaterialInfoModal({ open: false });

  const currentImageIndex = useMemo(() => galleryImages.findIndex(img => img === mainImage), [galleryImages, mainImage]);

  useEffect(() => {
    const calcThumbsPerPage = () => {
      const width = window.innerWidth;
      if (width >= 1024) return 7;
      if (width >= 768) return 6;
      if (width >= 640) return 5;
      return 4;
    };

    const update = () => setThumbsPerPage(calcThumbsPerPage());
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const thumbTotalPages = useMemo(() => {
    if (!galleryImages.length) return 1;
    return Math.max(1, Math.ceil(galleryImages.length / Math.max(1, thumbsPerPage)));
  }, [galleryImages.length, thumbsPerPage]);

  const pagedThumbnails = useMemo(() => {
    const safePerPage = Math.max(1, thumbsPerPage);
    const start = thumbPage * safePerPage;
    return galleryImages.slice(start, start + safePerPage);
  }, [galleryImages, thumbPage, thumbsPerPage]);

  useEffect(() => {
    setThumbPage(prev => Math.min(prev, thumbTotalPages - 1));
  }, [thumbTotalPages]);

  useEffect(() => {
    if (!galleryImages.length) return;
    const index = galleryImages.findIndex(img => img === mainImage);
    if (index < 0) return;
    const safePerPage = Math.max(1, thumbsPerPage);
    const nextPage = Math.floor(index / safePerPage);
    setThumbPage(prev => (prev === nextPage ? prev : nextPage));
  }, [galleryImages, mainImage, thumbsPerPage]);

  const handleImageNavigate = (direction: 'prev' | 'next') => {
    if (!galleryImages.length) return;
    const index = currentImageIndex >= 0 ? currentImageIndex : 0;
    const nextIndex = direction === 'prev'
      ? (index - 1 + galleryImages.length) % galleryImages.length
      : (index + 1) % galleryImages.length;
    setMainImage(galleryImages[nextIndex]);
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧图片骨架 */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
            <div className="flex gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
          {/* 右侧信息骨架 */}
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-1/2 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return <div className="container-custom py-12 text-center">商品不存在</div>;
  }

  const productDisplayPrice = getProductDisplayPrice(product as any);
  const currentPrice = selectedSku ? selectedSku.price : productDisplayPrice;
  const discountPrice = selectedSku?.discountPrice;
  const normalizedSelectedMaterials = selectedSku ? normalizeMaterialSelection(selectedSku.material) : null;
  const baseSkuPrice = selectedSku ? getBasePrice(selectedSku) : productDisplayPrice;
  
  // 获取当前选中的材质（支持动态类目）
  const currentSelectedMaterials = (() => {
    if (!selectedSku) return undefined;
    const normalized = normalizeMaterialSelection(selectedSku.material);
    const materialCategories = (selectedSku as any).materialCategories || Object.keys(normalized);
    const result: Record<string, string | null> = {};
    
    materialCategories.forEach((categoryKey: string) => {
      const list = normalized[categoryKey] || [];
      result[categoryKey] = materialSelections[categoryKey] || (list.length === 1 ? list[0] : null);
    });
    
    return result;
  })();
  
  let finalSkuPrice = selectedSku ? getFinalPrice(selectedSku, currentSelectedMaterials) : productDisplayPrice;
  
  // 授权商品优先使用labelPrice1（覆盖价格）
  const p = product as any;
  if (p?.labelPrice1 && Number.isFinite(p.labelPrice1) && p.labelPrice1 > 0) {
    finalSkuPrice = p.labelPrice1;
  }
  
  // 添加材质配置加价
  const materialConfigPrice = selectedMaterialConfig?.price || 0;
  const finalPriceWithMaterialConfig = finalSkuPrice + materialConfigPrice;

  const displayPrice = isComboProduct ? comboTotalPrice : (multiSpecMode ? multiSpecTotalPrice : finalPriceWithMaterialConfig);

  const isFavorited = product ? favorites.some(f => {
    if (!f || !f.product) return false;
    const favProductId = typeof f.product === 'string' ? f.product : f.product._id;
    return favProductId === product._id;
  }) : false;

  // 优化：使用缓存直接获取材质图片，避免重复遍历
  const getMaterialPreviewImage = (materialName?: string) => {
    if (!materialName) return selectedSku?.images?.[0] || product.images?.[0] || '';
    
    // 直接从缓存获取（已预计算）
    if (materialImageCache[materialName]) {
      return materialImageCache[materialName];
    }
    
    // 缓存未命中时的后备方案（直接查找，不做模糊匹配）
    if (selectedSku?.materialImages?.[materialName]) {
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
    
    // 下载所有选中的图片到本地
    for (let index = 0; index < selectedDownloadImages.length; index++) {
      const img = selectedDownloadImages[index];
      try {
        const fullUrl = getFileUrl(img);
        const fileName = `${product?.name || 'product'}-${index + 1}.jpg`;
        
        // 创建隐藏的a标签触发下载
        const link = document.createElement('a');
        link.href = fullUrl;
        link.download = fileName;
        link.target = '_blank';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // 延迟避免浏览器阻止多个下载
        if (index < selectedDownloadImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
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
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-600 hover:text-primary-600 flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            返回
          </button>
          <span className="text-gray-300">|</span>
          <Link to="/" className="text-gray-600 hover:text-primary-600">首页</Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span 
            onClick={() => navigate(-1)} 
            className="text-gray-600 hover:text-primary-600 cursor-pointer"
          >
            商城
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-gray-900 font-medium">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[800px_minmax(0,1fr)] gap-8 items-start">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-8 lg:self-start min-w-0">
            <div className="relative w-full bg-white rounded-3xl shadow-lg overflow-hidden">
              <div className="relative w-full aspect-[4/3]">
                {/* 根据是否有材质预览图片决定布局 */}
                {previewMaterialImage ? (
                  // 左右分栏布局：左侧商品图50%，右侧材质图50%
                  <div className="absolute inset-0 flex">
                    {/* 左侧商品图 */}
                    <div className="w-1/2 h-full border-r border-gray-200 bg-white">
                      {mainImage ? (
                        isVideoFile(mainImage) ? (
                          <video src={getFileUrl(mainImage)} controls className="w-full h-full object-contain" />
                        ) : (
                          <TrackedImage src={getThumbnailUrl(mainImage, 800)} alt={product.name} className="w-full h-full object-contain" loading="eager" />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">暂无图片</div>
                      )}
                    </div>
                    {/* 右侧材质预览图 */}
                    <div className="w-1/2 h-full bg-gray-50 flex items-center justify-center p-4">
                      <img 
                        src={getFileUrl(previewMaterialImage)} 
                        alt="材质预览" 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                      />
                    </div>
                  </div>
                ) : (
                  // 原始单图布局
                  <>
                    {mainImage ? (
                      isVideoFile(mainImage) ? (
                        <div className="absolute inset-0 w-full h-full bg-black">
                          <video 
                            src={getFileUrl(mainImage)} 
                            controls 
                            className="w-full h-full object-contain"
                            poster=""
                          />
                        </div>
                      ) : (
                        <TrackedImage src={getThumbnailUrl(mainImage, 800)} alt={product.name} className="absolute inset-0 w-full h-full object-contain bg-white" loading="eager" />
                      )
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400">暂无图片</div>
                    )}
                  </>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/products/${id}/gallery`)}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-black/70 text-white text-xs px-4 py-2 z-10 hover:bg-black/90"
                >
                  <Maximize2 className="h-3.5 w-3.5" />查看全部图片
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
            {galleryImages.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setThumbPage(prev => Math.max(0, prev - 1))}
                    disabled={thumbTotalPages <= 1 || thumbPage === 0}
                    className={cn(
                      'h-9 w-9 rounded-full border flex items-center justify-center transition-colors',
                      thumbTotalPages <= 1 || thumbPage === 0
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                    aria-label="上一页缩略图"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center gap-3">
                      {pagedThumbnails.map((img, idx) => {
                        const absoluteIndex = thumbPage * Math.max(1, thumbsPerPage) + idx;
                        return (
                          <button
                            key={`${img}-${absoluteIndex}`}
                            type="button"
                            onClick={() => handleThumbnailClick(img)}
                            className={cn(
                              'w-20 flex-shrink-0 border rounded-xl overflow-hidden transition-all',
                              mainImage === img ? 'border-primary-600 ring-2 ring-primary-100' : 'border-gray-200'
                            )}
                          >
                            {isVideoFile(img) ? (
                              <div className="w-full h-16 relative bg-gray-900">
                                <video
                                  src={getFileUrl(img)}
                                  className="w-full h-full object-cover"
                                  preload="metadata"
                                  muted
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Play className="h-5 w-5 text-white/80" />
                                </div>
                              </div>
                            ) : (
                              <img
                                src={getThumbnailUrl(img, 100)}
                                alt={`thumbnail ${absoluteIndex + 1}`}
                                className="w-full h-16 object-cover"
                                loading="lazy"
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setThumbPage(prev => Math.min(thumbTotalPages - 1, prev + 1))}
                    disabled={thumbTotalPages <= 1 || thumbPage >= thumbTotalPages - 1}
                    className={cn(
                      'h-9 w-9 rounded-full border flex items-center justify-center transition-colors',
                      thumbTotalPages <= 1 || thumbPage >= thumbTotalPages - 1
                        ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    )}
                    aria-label="下一页缩略图"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {thumbTotalPages > 1 && (
                  <div className="mt-2 text-center text-xs text-gray-400">
                    {thumbPage + 1}/{thumbTotalPages}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col min-w-0">
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

            {/* 置顶悬浮价格和版本区域 - top-20避免Header遮挡 */}
            <div className="sticky top-20 z-40 bg-white p-4 rounded-2xl shadow-lg mb-4 border border-gray-100">
              {/* 商品名称 */}
              <p className="text-sm font-semibold text-gray-900 mb-2 truncate">{product.name}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-gray-500 text-sm">当前价格</span>
                <span className="text-2xl font-bold text-red-600">{formatPrice(displayPrice)}</span>
                {/* 只有当有折扣价且大于0，且原价大于折扣价时才显示划线价 */}
                {!isComboProduct && !multiSpecMode && !selectedSku?.isPro && discountPrice && discountPrice > 0 && currentPrice && currentPrice > discountPrice && (
                  <>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">限时优惠</span>
                    <span className="text-xs text-gray-400 line-through">{formatPrice(currentPrice)}</span>
                  </>
                )}
                {selectedSku?.isPro && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">PRO一口价</span>
                )}
                {/* 版本选择 */}
                {availableFilters.length > 1 && (
                  <div className="flex items-center gap-2 ml-auto">
                    <span className="text-xs text-gray-500">版本：</span>
                    {availableFilters.map(filter => (
                      <button
                        key={filter.key}
                        onClick={() => handleFilterChange(filter.key)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs border transition-colors',
                          activeFilter === filter.key
                            ? 'text-white'
                            : 'text-gray-600 border-gray-200 hover:border-gray-400'
                        )}
                        style={activeFilter === filter.key
                          ? { backgroundColor: PRIMARY_COLOR, borderColor: PRIMARY_COLOR }
                          : {}}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedSku?.isPro && (
                <div className="mt-2 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2">
                  <p className="text-xs font-semibold text-yellow-900">PRO 专业版: {selectedSku.proFeature || '更高端材质与功能升级'}</p>
                </div>
              )}
            </div>

            {/* Specification & SKU Selection */}
            <div className="bg-white rounded-2xl shadow-sm mb-6 p-4">
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
                      {!isComboProduct && (
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">选择模式：</span>
                            <div className="flex items-center rounded-full border border-gray-200 p-0.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setMultiSpecMode(false);
                                  if (selectedSkus.length) {
                                    handleSkuChange(selectedSkus[0]);
                                  }
                                }}
                                className={cn(
                                  'px-3 py-1 text-xs',
                                  !multiSpecMode ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                                )}
                                style={!multiSpecMode ? { backgroundColor: PRIMARY_COLOR } : {}}
                              >
                                单选
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setMultiSpecMode(true);
                                  if (selectedSku?._id) {
                                    setSelectedSkuIds(prev => (prev.length ? prev : [String(selectedSku._id)]));
                                  }
                                }}
                                className={cn(
                                  'px-3 py-1 text-xs',
                                  multiSpecMode ? 'text-white' : 'text-gray-600 hover:bg-gray-50'
                                )}
                                style={multiSpecMode ? { backgroundColor: PRIMARY_COLOR } : {}}
                              >
                                多选
                              </button>
                            </div>
                          </div>
                          {multiSpecMode && (
                            <p className="text-xs text-gray-500">多选会合并图片并合计价格，购买会分别加入购物车并一起结算</p>
                          )}
                        </div>
                      )}
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
                      {Object.entries(groupedSkus).map(([specKey, skus]) => {
                        // 使用第一个SKU作为代表显示规格信息
                        const representativeSku = skus[0];
                        const isSelected = isComboProduct
                          ? selectedSkuIds.includes(String(representativeSku._id))
                          : (multiSpecMode ? selectedSkuIds.includes(String(representativeSku._id)) : selectedSku?._id === representativeSku._id);
                        let skuFinalPrice = getFinalPrice(representativeSku);
                        // 授权商品优先使用labelPrice1
                        if (p?.labelPrice1 && Number.isFinite(p.labelPrice1) && p.labelPrice1 > 0) {
                          skuFinalPrice = p.labelPrice1;
                        }
                        const specDetail = specificationList.find(spec => spec.name === representativeSku.spec)?.value || `${representativeSku.length}x${representativeSku.width}x${representativeSku.height}cm`;
                        return (
                          <button
                            key={specKey}
                            onClick={() => {
                              syncFilterWithSku(representativeSku);
                              if (isComboProduct) {
                                handleToggleSku(representativeSku);
                              } else if (multiSpecMode) {
                                toggleSkuSelection(representativeSku);
                              } else {
                                handleSkuChange(representativeSku);
                              }
                            }}
                            className={cn(
                              'w-full px-5 py-3 rounded-xl border text-left bg-white transition-shadow hover:shadow-md flex flex-col gap-1',
                              isSelected ? 'shadow-[0_8px_24px_rgba(31,100,255,0.12)]' : 'border-gray-200'
                            )}
                            style={isSelected ? { borderColor: PRIMARY_COLOR, backgroundColor: '#f0fdf4' } : {}}
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-gray-900">
                              <div className="flex items-center gap-2">
                                {multiSpecMode && !isComboProduct && (
                                  <span
                                    className={cn(
                                      'w-4 h-4 rounded border flex items-center justify-center',
                                      isSelected ? 'border-[#1F64FF] bg-[#1F64FF]' : 'border-gray-300'
                                    )}
                                  >
                                    {isSelected && <Check className="h-3 w-3 text-white" />}
                                  </span>
                                )}
                                <span>{representativeSku.spec || representativeSku.code || '默认规格'}</span>
                                {representativeSku.isPro && <span className="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">PRO</span>}
                                {skus.length > 1 && <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{skus.length}种材质</span>}
                              </div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-lg font-bold text-red-600">{formatPrice(skuFinalPrice)}</span>
                                {representativeSku.discountPrice && representativeSku.discountPrice > 0 && representativeSku.discountPrice < representativeSku.price && (
                                  <span className="text-xs text-gray-400 line-through">{formatPrice(representativeSku.price)}</span>
                                )}
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

              {/* Material Selection - 选择材质 */}
              {materialConfigs.length > 0 && (
                <div className="border border-gray-200 rounded-2xl bg-white mt-4">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">选择材质</p>
                    <p className="text-xs text-gray-400 mt-0.5">点击图块切换整组图片</p>
                  </div>
                  <div className="p-4 space-y-3">
                    {(() => {
                      // 按材质类别分组
                      const groupedMaterials = materialConfigs.reduce((acc, config) => {
                        // 提取类别前缀（如"B类油蜡皮" 或 "B类头层真皮"）
                        const categoryMatch = config.fabricName.match(/^([AB]类[^-–—]+)/);
                        const category = categoryMatch ? categoryMatch[1] : config.fabricName.split(/[-–—]/)[0]?.trim() || '其他';
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(config);
                        return acc;
                      }, {} as Record<string, typeof materialConfigs>);
                      
                      return Object.entries(groupedMaterials).map(([category, configs]) => (
                        <div key={category}>
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-xs text-gray-500">{category}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMaterialCategory(category);
                                setSelectedCategoryConfigs(configs);
                                setShowMaterialDetailModal(true);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                              title="查看材质详情"
                            >
                              <Info className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {configs.map((config) => {
                        const isSelected = selectedMaterialConfigId === config.id || (!selectedMaterialConfigId && materialConfigs[0]?.id === config.id);
                        const tileSku = (currentSpecSkus.find(sku => sku.fabricMaterialId === config.id) || filteredSkus.find(sku => sku.fabricMaterialId === config.id) || null) as any;
                        const tileImage = tileSku?.fabricImage || config.images?.[0] || '';
                        const tileName = tileSku?.fabricName || config.fabricName;
                        return (
                          <button
                            key={config.id}
                            type="button"
                            onClick={() => {
                              setSelectedMaterialConfigId(config.id);
                              // 切换到对应材质的SKU
                              const targetSku = currentSpecSkus.find(sku => sku.fabricMaterialId === config.id) || filteredSkus.find(sku => sku.fabricMaterialId === config.id);
                              if (targetSku) {
                                handleSkuChange(targetSku);
                              }
                            }}
                            className={cn(
                              'relative w-14 h-14 rounded-lg border-2 overflow-hidden transition-all',
                              isSelected
                                ? 'border-primary-500 ring-2 ring-primary-200'
                                : 'border-gray-200 hover:border-gray-300'
                            )}
                            title={tileName}
                          >
                            {tileImage ? (
                              <img 
                                src={getFileUrl(tileImage)} 
                                alt={tileName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">{tileName?.charAt(0) || '?'}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                          </div>
                        </div>
                      ));
                    })()}
                    {/* 显示选中材质的名称和加价 */}
                    {selectedMaterialConfig && (
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{(selectedSku as any)?.fabricName || selectedMaterialConfig.fabricName}</span>
                        {selectedMaterialConfig.price > 0 && (
                          <span className="text-sm text-red-500 font-medium">+¥{selectedMaterialConfig.price}</span>
                        )}
                      </div>
                    )}
                    {selectedMaterialDescriptionText && (
                      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-600 whitespace-pre-wrap">
                          {selectedMaterialDescriptionText}
                        </p>
                      </div>
                    )}
                    {/* 其他材质文字显示在选择材质下面 */}
                    {otherMaterialsText && (
                      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-xs text-gray-600">
                          {otherMaterialsText}
                        </p>
                      </div>
                    )}
                  </div>
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
              {/* 第一行：加入购物车 和 加入对比 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAddToCart}
                  className="py-3 rounded-lg text-white font-semibold text-base hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: PRIMARY_COLOR,
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  加入购物车
                </button>
              </div>
              {/* 第二行：立即购买 */}
              <button
                onClick={handleBuyNow}
                className="w-full py-3 rounded-lg bg-red-600 text-white font-semibold text-base hover:bg-red-700 transition-all duration-200"
              >
                立即购买
              </button>
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
      {materialInfoModal.open && materialInfoModal.section && materialInfoModal.material && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-8 relative">
            <button
              type="button"
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={closeMaterialIntro}
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              {materialInfoModal.material}
            </h3>
            <div className="rounded-2xl overflow-hidden border-2 border-gray-200 mb-6 shadow-lg">
              <img
                src={getFileUrl(getMaterialPreviewImage(materialInfoModal.material))}
                alt={materialInfoModal.material}
                className="w-full h-96 object-cover"
                loading="eager"
              />
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 mb-4">
              <h4 className="text-xl font-semibold text-gray-900 mb-3">材质说明</h4>
              <p className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
                {getMaterialDescription(materialInfoModal.material, selectedSku?.materialDescriptions) || '该材质暂未提供详细说明。'}
              </p>
            </div>
            <button
              type="button"
              className="w-full py-4 rounded-xl text-white font-semibold text-lg shadow-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: PRIMARY_COLOR }}
              onClick={closeMaterialIntro}
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* Material Detail Modal */}
      {showMaterialDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowMaterialDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{selectedMaterialCategory}</h3>
                <button onClick={() => setShowMaterialDetailModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                {selectedCategoryConfigs.map((config) => (
                  <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-4">
                      {config.images?.[0] && (
                        <img 
                          src={getFileUrl(config.images[0])} 
                          alt={config.fabricName}
                          className="w-24 h-24 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-2">{config.fabricName}</h4>
                        {config.price > 0 && (
                          <p className="text-sm text-red-500 font-medium">加价：¥{config.price}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetailPage;
