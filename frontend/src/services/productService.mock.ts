import { Product, ProductSKU } from '@/types';
import { useMockStore } from '@/store/mockStore';

const wait = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

const createEmptyMaterialSelection = () => ({
  fabric: [] as string[],
  filling: [] as string[],
  frame: [] as string[],
  leg: [] as string[],
});

// 创建默认的面料材质选择（普通皮和全青皮）
const createDefaultFabricMaterials = () => ({
  fabric: [
    '普通皮-黑色',
    '普通皮-棕色',
    '普通皮-红色',
    '普通皮-灰色',
    '全青皮-黑色',
    '全青皮-棕色',
    '全青皮-黄色',
    '全青皮-绿色',
  ] as string[],
  filling: [] as string[],
  frame: [] as string[],
  leg: [] as string[],
});

// 创建默认的材质升级价格
const createDefaultMaterialUpgradePrices = () => ({
  '普通皮-黑色': 0,
  '普通皮-棕色': 0,
  '普通皮-红色': 0,
  '普通皮-灰色': 0,
  '全青皮-黑色': 500,
  '全青皮-棕色': 500,
  '全青皮-黄色': 500,
  '全青皮-绿色': 500,
});

const normalizeSku = (sku: any, index: number, fallbackPrice: number): ProductSKU => {
  // 处理材质数据 - 保留用户输入的数据，不使用默认值
  let material = sku?.material;
  if (!material) {
    // 不使用默认材质，使用空的材质选择
    material = createEmptyMaterialSelection();
  } else if (typeof material === 'string') {
    material = { fabric: [material], filling: [], frame: [], leg: [] };
  } else {
    // 确保材质对象的每个字段都是数组
    material = {
      fabric: Array.isArray(material.fabric) ? material.fabric : (material.fabric ? [material.fabric] : []),
      filling: Array.isArray(material.filling) ? material.filling : (material.filling ? [material.filling] : []),
      frame: Array.isArray(material.frame) ? material.frame : (material.frame ? [material.frame] : []),
      leg: Array.isArray(material.leg) ? material.leg : (material.leg ? [material.leg] : []),
    };
  }

  // 处理升级价格 - 保留用户输入的数据，不使用默认值
  let materialUpgradePrices = sku?.materialUpgradePrices;
  if (!materialUpgradePrices || typeof materialUpgradePrices !== 'object') {
    // 不使用默认升级价格，使用空对象
    materialUpgradePrices = {};
  }

  return {
    _id: sku?._id ?? sku?.id ?? `sku_${Date.now()}_${index}`,
    images: Array.isArray(sku?.images) ? sku.images : [],
    code: sku?.code ?? sku?.spec ?? `SKU-${index + 1}`,
    spec: sku?.spec ?? sku?.code ?? `规格${index + 1}`,
    length: sku?.length ?? 0,
    width: sku?.width ?? 0,
    height: sku?.height ?? 0,
    material,
    materialUpgradePrices,
    stock: sku?.stock ?? 0,
    price: sku?.price ?? fallbackPrice ?? 0,
    discountPrice: sku?.discountPrice,
    sales: sku?.sales ?? 0,
    isPro: sku?.isPro ?? false,
    proFeature: sku?.proFeature ?? '',
    status: sku?.status ?? true,
  };
};

const normalizeSpecifications = (specs: any): Record<string, string> => {
  if (Array.isArray(specs)) {
    return specs.reduce((acc: Record<string, string>, spec: any, idx: number) => {
      const name = spec?.name || `规格${idx + 1}`;
      const unit = spec?.unit || 'CM';
      const length = spec?.length ?? 0;
      const width = spec?.width ?? 0;
      const height = spec?.height ?? 0;
      acc[name] = `${length}x${width}x${height}${unit}`;
      return acc;
    }, {});
  }
  return specs && typeof specs === 'object' ? specs : {};
};

const normalizeProduct = (raw: any): Product => {
  const normalizedSkus = Array.isArray(raw?.skus) && raw.skus.length > 0
    ? raw.skus.map((sku: any, index: number) => normalizeSku(sku, index, raw?.basePrice ?? 0))
    : [normalizeSku({}, 0, raw?.basePrice ?? 0)];

  return {
    _id: raw?._id ?? `mock_${Date.now()}`,
    productCode: raw?.productCode ?? '',
    name: raw?.name ?? '未命名商品',
    description: raw?.description ?? '暂无商品描述',
    category: raw?.category ?? 'sofa',
    style: raw?.style ?? 'modern',
    basePrice: raw?.basePrice ?? normalizedSkus[0].price ?? 0,
    images: Array.isArray(raw?.images) ? raw.images : [],
    skus: normalizedSkus,
    isCombo: raw?.isCombo ?? false,
    comboItems: raw?.comboItems ?? [],
    tags: Array.isArray(raw?.tags) ? raw.tags : [],
    specifications: normalizeSpecifications(raw?.specifications),
    status: raw?.status ?? 'active',
    views: raw?.views ?? 0,
    sales: raw?.sales ?? 0,
    rating: raw?.rating ?? 5,
    reviews: raw?.reviews ?? 0,
    order: raw?.order,
    createdAt: raw?.createdAt ?? new Date().toISOString(),
    updatedAt: raw?.updatedAt ?? new Date().toISOString(),
    videos: Array.isArray(raw?.videos) ? raw.videos : [],
    files: Array.isArray(raw?.files) ? raw.files : [],
  } as Product;
};

const ensureHydrated = async () => {
  const persist = (useMockStore as any)?.persist;
  if (persist?.rehydrate) {
    try {
      await persist.rehydrate();
    } catch (error) {
      console.warn('[mockStore] rehydrate failed:', error);
    }
  }
};

const getStoreProducts = () => useMockStore.getState().products.map(normalizeProduct);

export const getProducts = async () => {
  await ensureHydrated();
  const products = getStoreProducts();
  await wait(300);
  return {
    success: true,
    data: products,
    pagination: {
      total: products.length,
      page: 1,
      limit: 10,
      totalPages: Math.ceil(products.length / 10),
    },
  };
};

export const createProduct = async (productData: any) => {
  await ensureHydrated();
  const newId = `mock_${Date.now()}`;
  const normalized = normalizeProduct({ ...productData, _id: newId });
  
  // 添加到store
  useMockStore.getState().addProduct(normalized);
  
  // 确保数据被持久化到localStorage
  const allProducts = useMockStore.getState().products;
  console.log('[createProduct] 创建商品:', normalized.name, 'ID:', newId);
  console.log('[createProduct] 当前商品总数:', allProducts.length);
  
  await wait(500);
  return {
    success: true,
    message: '商品创建成功 (模拟)',
    data: normalized,
  };
};

export const updateProduct = async (id: string, productData: any) => {
  await ensureHydrated();
  const normalized = normalizeProduct({ ...productData, _id: id });
  
  // 更新store
  useMockStore.getState().updateProduct(id, normalized);
  
  // 确保数据被持久化到localStorage
  const allProducts = useMockStore.getState().products;
  console.log('[updateProduct] 更新商品:', normalized.name, 'ID:', id);
  console.log('[updateProduct] 当前商品总数:', allProducts.length);
  
  await wait(500);
  return {
    success: true,
    message: '商品更新成功 (模拟)',
    data: normalized,
  };
};

export const deleteProduct = async (id: string) => {
  await ensureHydrated();
  useMockStore.getState().deleteProduct(id);
  await wait(300);
  return true;
};

export const toggleProductStatus = async (id: string) => {
  await ensureHydrated();
  useMockStore.getState().toggleProductStatus(id);
  await wait(300);
  return true;
};

export const getProductById = async (id: string): Promise<Product | null> => {
  await ensureHydrated();
  const product = getStoreProducts().find(p => p._id === id) ?? null;
  await wait(500);
  return product;
};
