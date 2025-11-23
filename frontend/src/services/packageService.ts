import apiClient from '@/lib/apiClient'
import { PackagePlan, PackageProductMaterial, PackageProductOption } from '@/types'
import { getFileUrl } from '@/services/uploadService'

interface StoredPackageProduct {
  id: number
  name: string
  price: number
  img: string
  specs?: string
  description?: string
  material?: Record<string, string | string[]>
}

interface StoredPackage {
  id: number
  name: string
  price: number
  image: string
  gallery?: string[]
  tags?: string[]
  description?: string
  status?: string
  selectedProducts?: Record<string, StoredPackageProduct[]>
  optionalQuantities?: Record<string, number>
  productCount?: number
  categoryCount?: number
}

const PACKAGE_STORAGE_KEY = 'packages'

const DEFAULT_PACKAGES: StoredPackage[] = [
  {
    id: 1,
    name: '现代客餐一体组合',
    price: 28999,
    image: 'https://images.unsplash.com/photo-1616594039964-196be3f16f3d?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1616594039964-196be3f16f3d?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80',
    ],
    tags: ['沙发', '茶几', '餐桌', '餐椅'],
    description: '为 90-120㎡ 剪力墙户型打造的现代轻奢搭配，客厅、餐厅色调统一，满足全家会客与聚餐的双重需求。',
    status: '已上架',
    selectedProducts: {
      沙发: [
        {
          id: 101,
          name: '云朵羽绒沙发',
          price: 12999,
          img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=800&q=80',
          specs: '3.2m 三人位 + 贵妃',
          description: '柔软羽绒填充，支持拆洗，附送抱枕组合',
          material: {
            fabric: ['科技绒', '高密雪尼尔'],
            filling: ['羽绒', '高弹海绵'],
            frame: ['落叶松木', '航空铝'],
            leg: ['碳素钢', '胡桃木'],
          },
        },
        {
          id: 102,
          name: '云影左贵妃沙发',
          price: 11999,
          img: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80',
          specs: '3.0m 三人位 + 贵妃',
          material: {
            fabric: ['超细纤维皮', '防污麻布'],
            filling: ['羽绒+乳胶'],
            frame: ['桦木'],
            leg: ['实木', '电镀金属'],
          },
        },
      ],
      茶几: [
        {
          id: 201,
          name: '岩板双层茶几',
          price: 3599,
          img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=700&q=80',
          specs: '120×65cm',
          material: {
            frame: ['碳素钢'],
            leg: ['碳素钢'],
          },
        },
        {
          id: 202,
          name: '胡桃木抽屉茶几',
          price: 2999,
          img: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=700&q=80',
          specs: '110×60cm',
          material: {
            frame: ['胡桃木'],
            leg: ['胡桃木'],
          },
        },
      ],
      餐桌: [
        {
          id: 301,
          name: '岩板金属餐桌',
          price: 6999,
          img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
          specs: '1.6m × 0.9m',
          material: {
            frame: ['碳素钢'],
            leg: ['碳素钢'],
          },
        },
      ],
      餐椅: [
        {
          id: 401,
          name: '半包围旋转餐椅',
          price: 1299,
          img: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=700&q=80',
          material: {
            fabric: ['科技皮'],
            frame: ['碳素钢'],
            leg: ['碳素钢'],
          },
        },
        {
          id: 402,
          name: '原木弧面餐椅',
          price: 999,
          img: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=700&q=80',
          material: {
            frame: ['胡桃木'],
            leg: ['胡桃木'],
          },
        },
      ],
    },
    optionalQuantities: {
      沙发: 1,
      茶几: 1,
      餐桌: 1,
      餐椅: 4,
    },
  },
  {
    id: 2,
    name: '静谧卧室治愈套系',
    price: 25999,
    image: 'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1400&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493666438211-43878f06f543?auto=format&fit=crop&w=1200&q=80',
    ],
    tags: ['床', '床头柜', '沙发', '茶几'],
    description: '卧室、次卧二合一的柔和配色方案，配套舒适型沙发与阅读茶几，打造可久居的疗愈场景。',
    status: '已上架',
    selectedProducts: {
      床: [
        {
          id: 501,
          name: '悬浮真皮大床',
          price: 10999,
          img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80',
          specs: '1.8m × 2.0m',
          material: {
            fabric: ['头层牛皮', '进口超纤皮'],
            filling: ['羽绒+海绵'],
            frame: ['多层实木'],
            leg: ['隐藏式碳钢'],
          },
        },
        {
          id: 502,
          name: '织物靠背电动床',
          price: 9999,
          img: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=900&q=80',
          material: {
            fabric: ['高密阳离子布'],
            filling: ['高弹海绵'],
            frame: ['桦木'],
            leg: ['橡木'],
          },
        },
      ],
      床头柜: [
        {
          id: 601,
          name: '悬空智能床头柜',
          price: 1899,
          img: 'https://images.unsplash.com/photo-1493666438211-43878f06f543?auto=format&fit=crop&w=800&q=80',
          material: {
            frame: ['胡桃木'],
            leg: ['胡桃木'],
          },
        },
        {
          id: 602,
          name: '岩板抽屉床头柜',
          price: 1599,
          img: 'https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=800&q=80',
          material: {
            frame: ['岩板', '金属'],
            leg: ['金属'],
          },
        },
      ],
      沙发: [
        {
          id: 603,
          name: '1.8m 小户沙发',
          price: 6999,
          img: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?auto=format&fit=crop&w=800&q=80',
          material: {
            fabric: ['莫兰迪色科技绒'],
            filling: ['羽绒'],
            frame: ['桦木'],
            leg: ['黑砂金属'],
          },
        },
      ],
      茶几: [
        {
          id: 604,
          name: '圆形边几',
          price: 1299,
          img: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=700&q=80',
          material: {
            frame: ['胡桃木'],
            leg: ['胡桃木'],
          },
        },
      ],
    },
    optionalQuantities: {
      床: 1,
      床头柜: 2,
      沙发: 1,
      茶几: 1,
    },
  },
]

const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

const getStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const readStoredPackages = (): StoredPackage[] => {
  const storage = getStorage()
  if (!storage) {
    return DEFAULT_PACKAGES
  }
  const raw = storage.getItem(PACKAGE_STORAGE_KEY)
  if (!raw) {
    storage.setItem(PACKAGE_STORAGE_KEY, JSON.stringify(DEFAULT_PACKAGES))
    return DEFAULT_PACKAGES
  }
  try {
    const parsed: StoredPackage[] = JSON.parse(raw)
    return parsed.length ? parsed : DEFAULT_PACKAGES
  } catch (error) {
    console.error('解析套餐数据失败', error)
    storage.setItem(PACKAGE_STORAGE_KEY, JSON.stringify(DEFAULT_PACKAGES))
    return DEFAULT_PACKAGES
  }
}

const normalizeMaterial = (material?: Record<string, string | string[]>): PackageProductMaterial => {
  const ensureArray = (value?: string | string[]) => {
    if (!value) return []
    return Array.isArray(value) ? value : [value]
  }

  return {
    fabric: ensureArray(material?.fabric),
    filling: ensureArray(material?.filling),
    frame: ensureArray(material?.frame),
    leg: ensureArray(material?.leg ?? material?.feet),
  }
}

const mapProduct = (product: StoredPackageProduct): PackageProductOption => ({
  id: String(product.id),
  name: product.name,
  price: product.price,
  image: product.img || '/placeholder.svg',
  specs: product.specs,
  description: product.description,
  materials: normalizeMaterial(product.material),
})

const mapPackage = (pkg: StoredPackage): PackagePlan => {
  const tags = pkg.tags && pkg.tags.length
    ? pkg.tags
    : Object.keys(pkg.selectedProducts || {})

  return {
    id: String(pkg.id),
    name: pkg.name,
    price: pkg.price,
    banner: pkg.image || '/placeholder.svg',
    gallery: pkg.gallery && pkg.gallery.length ? pkg.gallery : [pkg.image || '/placeholder.svg'],
    tags,
    description: pkg.description,
    status: pkg.status === '已上架' ? 'active' : 'inactive',
    categories: tags.map((tag) => ({
      key: tag,
      name: tag,
      required: pkg.optionalQuantities?.[tag] ?? 1,
      products: (pkg.selectedProducts?.[tag] || []).map(mapProduct),
    })),
  }
}

export const getAllPackages = async (): Promise<PackagePlan[]> => {
  try {
    // 先尝试从 API 获取套餐列表
    const response = await apiClient.get('/packages')
    const apiData = response.data.data
    
    // 如果 API 返回数据，使用 API 数据
    if (apiData && apiData.length > 0) {
      // 获取所有产品的详细信息
      const packagesWithDetails = await Promise.all(
        apiData.map(async (pkg: any) => {
          const categories: any[] = []
          
          // 按类别分组产品
          if (pkg.products && pkg.products.length > 0) {
            // 获取所有产品详情
            const productDetails = await Promise.all(
              pkg.products.map(async (item: any) => {
                try {
                  const prodResponse = await apiClient.get(`/products/${item.productId}`)
                  return {
                    ...prodResponse.data.data,
                    packageQuantity: item.quantity || 1,
                    packagePrice: item.price
                  }
                } catch (err) {
                  console.error(`获取产品${item.productId}失败:`, err)
                  return null
                }
              })
            )
            
            // 过滤掉获取失败的产品
            const validProducts = productDetails.filter(p => p !== null)
            
            // 按类别分组
            const categoryMap: Record<string, any[]> = {}
            validProducts.forEach(product => {
              const category = product.category || product.categoryName || '其他'
              if (!categoryMap[category]) {
                categoryMap[category] = []
              }
              
              // 从商品的skus中提取材质信息
              const materials: Record<string, string[]> = {}
              let specs = product.description || ''
              
              if (product.skus && product.skus.length > 0) {
                // 收集所有SKU的材质
                const fabricSet = new Set<string>()
                const fillingSet = new Set<string>()
                const frameSet = new Set<string>()
                const legSet = new Set<string>()
                
                product.skus.forEach((sku: any) => {
                  if (sku.material) {
                    if (sku.material.fabric) fabricSet.add(sku.material.fabric)
                    if (sku.material.filling) fillingSet.add(sku.material.filling)
                    if (sku.material.frame) frameSet.add(sku.material.frame)
                    if (sku.material.leg) legSet.add(sku.material.leg)
                  }
                  // 使用第一个SKU的spec作为规格
                  if (!specs && sku.spec) {
                    specs = sku.spec
                  }
                })
                
                if (fabricSet.size > 0) materials['fabric'] = Array.from(fabricSet)
                if (fillingSet.size > 0) materials['filling'] = Array.from(fillingSet)
                if (frameSet.size > 0) materials['frame'] = Array.from(frameSet)
                if (legSet.size > 0) materials['leg'] = Array.from(legSet)
              }
              
              categoryMap[category].push({
                id: product._id,
                name: product.name,
                price: product.packagePrice || product.basePrice || 0,
                image: product.images?.[0] ? getFileUrl(product.images[0]) : '/placeholder.svg',
                specs: specs,
                description: product.description || '',
                materials: materials
              })
            })
            
            // 转换为categories格式
            Object.entries(categoryMap).forEach(([categoryName, products]) => {
              // required设置为该类别的商品数量，表示可以选择多个
              categories.push({
                key: categoryName,
                name: categoryName,
                required: products.length,  // 允许选择该类别的所有商品
                products: products
              })
            })
          }
          
          return {
            id: pkg._id,
            name: pkg.name,
            price: pkg.basePrice || 0,
            banner: pkg.thumbnail ? getFileUrl(pkg.thumbnail) : (pkg.images?.[0] ? getFileUrl(pkg.images[0]) : '/placeholder.svg'),
            gallery: pkg.images && pkg.images.length > 0 ? pkg.images.map((img: string) => getFileUrl(img)) : [pkg.thumbnail ? getFileUrl(pkg.thumbnail) : '/placeholder.svg'],
            tags: categories.map(c => c.name),
            description: pkg.description || '',
            status: pkg.status || 'active',
            categories: categories
          }
        })
      )
      
      return packagesWithDetails
    }
    
    // 如果 API 返回空数据，使用本地数据
    console.warn('API 返回空数据，使用本地数据')
    const stored = readStoredPackages()
    await wait()
    return stored.map(mapPackage)
  } catch (error) {
    // 如果 API 失败，回退到本地存储
    console.warn('获取套餐列表失败，使用本地数据', error)
    const stored = readStoredPackages()
    await wait()
    return stored.map(mapPackage)
  }
}

export const getPackageById = async (id: string): Promise<PackagePlan | null> => {
  try {
    // 先尝试从 API 获取
    const response = await apiClient.get(`/api/packages/${id}`)
    const pkg = response.data.data
    return {
      id: pkg._id,
      name: pkg.name,
      price: pkg.basePrice,
      banner: pkg.image || '/placeholder.svg',
      gallery: [pkg.image || '/placeholder.svg'],
      tags: pkg.tags || [],
      description: pkg.description,
      status: pkg.status,
      categories: [],
    }
  } catch (error) {
    // 如果 API 失败，回退到本地存储
    console.warn('获取套餐详情失败，使用本地数据')
    const stored = readStoredPackages()
    const target = stored.find((pkg) => String(pkg.id) === id)
    await wait(200)
    return target ? mapPackage(target) : null
  }
}
