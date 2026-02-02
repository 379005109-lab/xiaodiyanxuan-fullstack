import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, Trash2, Upload, FileSpreadsheet, RefreshCw, ChevronDown, ChevronRight, Edit2, FolderTree } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import ImageUploader from '@/components/admin/ImageUploader'
import MaterialSelectModal from '@/components/admin/MaterialSelectModal'
import SkuImageManagerModal from '@/components/admin/SkuImageManagerModal'
import SkuMultimediaManagerModal from '@/components/admin/SkuMultimediaManagerModal'
// 使用真实的后端API服务
import { getProductById, createProduct, updateProduct } from '@/services/productService'
import { getAllCategories, Category } from '@/services/categoryService'
import { imageCache } from '@/services/imageCache'
import { uploadFile, getFileUrl, getThumbnailUrl } from '@/services/uploadService'
import { getAllManufacturers, Manufacturer } from '@/services/manufacturerService'
import { useAuthStore } from '@/store/authStore'

const CATEGORY_STORAGE_KEY = 'productForm:lastCategory'

// 动态材质选择结构：key为类目名称，value为材质名称数组
type MaterialSelection = Record<string, string[]>

// 预设的材质类目选项
const PRESET_MATERIAL_CATEGORIES = [
  { key: 'fabric', name: '面料', color: 'blue' },
  { key: 'filling', name: '填充', color: 'green' },
  { key: 'frame', name: '框架', color: 'purple' },
  { key: 'leg', name: '脚架', color: 'orange' },
  { key: 'cushion', name: '坐垫', color: 'pink' },
  { key: 'armrest', name: '扶手', color: 'teal' },
  { key: 'backrest', name: '靠背', color: 'indigo' },
  { key: 'hardware', name: '五金', color: 'gray' },
]

// 获取材质类目的颜色样式
const getMaterialCategoryColor = (categoryKey: string): { bg: string; text: string; hover: string } => {
  const category = PRESET_MATERIAL_CATEGORIES.find(c => c.key === categoryKey)
  const colorMap: Record<string, { bg: string; text: string; hover: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-700', hover: 'hover:text-blue-800' },
    green: { bg: 'bg-green-100', text: 'text-green-700', hover: 'hover:text-green-800' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-700', hover: 'hover:text-purple-800' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-700', hover: 'hover:text-orange-800' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-700', hover: 'hover:text-pink-800' },
    teal: { bg: 'bg-teal-100', text: 'text-teal-700', hover: 'hover:text-teal-800' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', hover: 'hover:text-indigo-800' },
    gray: { bg: 'bg-gray-100', text: 'text-gray-700', hover: 'hover:text-gray-800' },
  }
  return colorMap[category?.color || 'gray'] || colorMap.gray
}

const createEmptyMaterialSelection = (): MaterialSelection => ({})

const pickMediaId = (v: any): string => {
  if (!v) return ''
  if (typeof v === 'string' || typeof v === 'number') return String(v)
  if (Array.isArray(v)) return pickMediaId(v[0])
  if (typeof v === 'object') {
    return String(
      (v as any).fileId ||
        (v as any).id ||
        (v as any)._id ||
        (v as any).url ||
        (v as any).path ||
        (v as any).image ||
        (v as any).thumbnail ||
        ''
    )
  }
  return ''
}

const normalizeFileId = (v: any): string => {
  const raw = pickMediaId(v)
  if (!raw) return ''
  // 兼容完整URL / API路径
  // - /api/files/:id?...
  // - http(s)://.../api/files/:id?...
  // - http(s)://.../files/:id?...
  const cleaned = raw.split('?')[0]
  const m = cleaned.match(/\/api\/files\/([^/]+)$/) || cleaned.match(/\/files\/([^/]+)$/)
  const id = (m && m[1]) ? m[1] : raw
  // 兼容历史数据：可能出现 6976...ab5.mp4.mp4.mp4 这种重复后缀
  return String(id).replace(/(\.(mp4|webm|ogg|mov))+$/i, '')
}


export default function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id
  const { user } = useAuthStore()
  const isEnterpriseAdmin = user?.role === 'enterprise_admin'

  // 分类数据
  const [categories, setCategories] = useState<Category[]>([])
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [showMaterialSelectModal, setShowMaterialSelectModal] = useState(false)
  const [selectingMaterialForSkuIndex, setSelectingMaterialForSkuIndex] = useState<number>(-1)
  const [selectingMaterialType, setSelectingMaterialType] = useState<string>('fabric') // 支持动态材质类型
  
  // 添加材质类目弹窗状态
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [addCategoryForSkuIndex, setAddCategoryForSkuIndex] = useState<number>(-1)
  
  // 图片管理弹窗状态
  const [showImageManager, setShowImageManager] = useState(false)
  const [managingSkuIndex, setManagingSkuIndex] = useState<number>(-1)
  
  // 分类展开状态（支持多层级）
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  // 分类选择面板展开状态
  const [showCategoryPanel, setShowCategoryPanel] = useState(false)
  
  // 系列管理状态
  const [showSeriesModal, setShowSeriesModal] = useState(false)
  const [seriesList, setSeriesList] = useState<Array<{id: string, name: string, image: string}>>(() => {
    const saved = localStorage.getItem('product_series_list')
    return saved ? JSON.parse(saved) : []
  })
  const [editingSeriesId, setEditingSeriesId] = useState<string | null>(null)
  const [newSeriesName, setNewSeriesName] = useState('')
  const [newSeriesImage, setNewSeriesImage] = useState('')
  
  const hasRestoredCategory = useRef(false)

  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    subCodes: [] as string[], // 副编号数组
    category: '', // 主分类（兼容旧数据）
    categories: [] as string[], // 多选分类数组
    basePrice: 0,
    series: '', // 系列名称
    seriesImage: '', // 系列图片
    styles: [] as string[], // 风格标签
    mainImages: [] as string[],
    videos: [] as string[], // 视频URL数组
    videoTitles: [] as string[], // 视频标题数组
    // 材质选择分组（类似保时捷配置器）
    materialsGroups: [] as Array<{
      id: string
      name: string
      images: string[]
      price: number // 加价金额
      isDefault: boolean
    }>,
    // 材质配置（面料选择 + 其他材质）
    materialConfigs: [] as Array<{
      id: string
      fabricName: string // 面料名称（从材质库选择）
      fabricId: string // 材质库ID
      images: string[] // 该材质对应的图片组
      price: number // 加价金额
    }>,
    materialDescriptionOptions: [] as Array<{ id: string; text: string }>,
    otherMaterialsText: '' as string, // 其他材质（固定文字，如：蛇形弹簧+45D海绵+不锈钢脚）
    otherMaterialsImage: '' as string, // 其他材质图片
    specifications: [
      { name: '2人位', length: 200, width: 90, height: 85, unit: 'CM' },
    ],
    skus: [
      {
        id: 'sku-1',
        videos: [] as string[],
        images: [] as string[],
        effectImages: [] as string[],
        code: 'sku-1762',
        spec: '2人位',
        specRemark: '', // 规格备注
        length: 200,
        width: 90,
        height: 85,
        // 包装信息
        packageVolume: '', // 包装体积
        packageCount: 1, // 包装件数
        // 面料选择（单选，关联materialsGroups中的材质）
        fabricMaterialId: '' as string, // 关联的材质分组ID
        fabricName: '' as string, // 面料名称（如：纳帕皮A+黑色）
        fabricImage: '' as string, // 面料缩略图（材质库图片）
        materialDescriptionId: '' as string, // 关联商品的材质描述选项ID
        // 其他材质描述（文字+图片）
        otherMaterials: '' as string, // 其他材质文字描述（如：蛇形弹簧+45D海绵+不锈钢支撑脚）
        otherMaterialsImage: '' as string, // 其他材质图片
        material: createEmptyMaterialSelection(),
        materialCategories: [] as string[], // 已启用的材质类目列表
        materialUpgradePrices: {},
        price: 0,
        discountPrice: 0,
        // 库存模式
        stockMode: false as boolean, // true=有库存模式，false=定制模式（默认定制）
        stock: 100,
        deliveryDays: 7, // 发货天数（库存模式）
        productionDays: 30, // 制作天数（定制模式）
        deliveryNote: '', // 发货备注
        arrivalDate: null as string | null, // 到货时间
        files: [] as { name: string; url: string; size: number; type: string }[], // SKU专属文件
        sales: 0,
        isPro: false,
        proFeature: '',
        status: true,
        manufacturerId: '',
        manufacturerName: '',
      },
    ],
    description: '',
    files: [] as { name: string; url: string; format: string; size: number; uploadTime: string }[],
  })

  // 文件上传进度状态
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})
  const [isUploading, setIsUploading] = useState(false)

  // 加载分类数据
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const allCategories = await getAllCategories();
        setCategories(allCategories);
      } catch (error) {
        console.error('加载分类失败:', error);
      }
    };
    loadCategories();
  }, []);

  // 加载厂家数据
  useEffect(() => {
    const loadManufacturers = async () => {
      try {
        const allManufacturers = await getAllManufacturers();
        setManufacturers(allManufacturers);
      } catch (error) {
        console.error('加载厂家失败:', error);
      }
    };
    loadManufacturers();
  }, []);

  // 恢复最近一次选择的分类
  useEffect(() => {
    if (isEdit || hasRestoredCategory.current) return
    if (typeof window === 'undefined') return
    const savedCategory = localStorage.getItem(CATEGORY_STORAGE_KEY)
    if (savedCategory) {
      setFormData(prev => ({ ...prev, category: savedCategory }))
    }
    hasRestoredCategory.current = true
  }, [isEdit, categories.length])

  const skuCount = formData.skus.length
  const normalizedProductCode = formData.productCode.trim().toUpperCase()

  // 商品型号或SKU数量变化时，同步SKU型号
  useEffect(() => {
    if (!normalizedProductCode || skuCount === 0) return
    setFormData(prev => {
      const baseCode = normalizedProductCode
      const updatedSkus = prev.skus.map((sku, index) => {
        const generated = `${baseCode}-${String(index + 1).padStart(2, '0')}`
        return sku.code === generated ? sku : { ...sku, code: generated }
      })
      const hasChanges = updatedSkus.some((sku, idx) => sku !== prev.skus[idx])
      const needsCodeNormalization = prev.productCode !== baseCode
      if (!hasChanges && !needsCodeNormalization) {
        return prev
      }
      return { ...prev, productCode: baseCode, skus: updatedSkus }
    })
  }, [normalizedProductCode, skuCount])

  useEffect(() => {
    const opts = formData.materialDescriptionOptions || []
    if (opts.length !== 1) return
    const onlyId = opts[0]?.id
    if (!onlyId) return
    setFormData(prev => {
      let changed = false
      const nextSkus = (prev.skus || []).map((sku: any) => {
        if (sku.materialDescriptionId) return sku
        changed = true
        return { ...sku, materialDescriptionId: onlyId }
      })
      if (!changed) return prev
      return { ...prev, skus: nextSkus }
    })
  }, [formData.materialDescriptionOptions])

  // 如果是编辑模式，加载商品数据
  useEffect(() => {
    const loadProduct = async () => {
      if (isEdit && id) {
        const product = await getProductById(id);
        if (product) {
          setFormData({
          name: product.name,
          productCode: ((product as any).productCode || product._id || '').toString().toUpperCase(),
          subCodes: ((product as any).subCodes || []) as string[], // 副编号
          category: typeof product.category === 'string'
            ? product.category
            : (product.category as any)?._id || '',
          categories: ((product as any).categories || []) as string[], // 多选分类
          basePrice: product.basePrice,
          series: ((product as any).series || '') as string, // 系列名称
          seriesImage: ((product as any).seriesImage || '') as string, // 系列图片
          mainImages: (product.images || []).filter((img: string) => {
            // 过滤掉Base64数据，只保留fileId
            if (img.startsWith('data:')) {
              console.warn('检测到旧Base64图片数据，已过滤');
              return false;
            }
            return true;
          }),
          videos: ((product as any).videos || []) as string[],
          videoTitles: ((product as any).videoTitles || []) as string[],
          styles: (product as any).styles || [], // 风格标签
          specifications: product.specifications ? 
            (() => {
              // 检查specifications格式
              const specs = product.specifications;
              
              // 如果是旧格式（包含sizes/materials/fills/frames/legs等数组字段）
              if (typeof specs === 'object' && 
                  ('sizes' in specs || 'materials' in specs || 'fills' in specs)) {
                // 旧格式数据，返回默认规格
                console.warn('检测到旧格式specifications数据，使用默认规格');
                return [{ name: '2人位', length: 200, width: 90, height: 85, unit: 'CM' }];
              }
              
              // 新格式：{"2人位": "200x90x85CM", "3人位": "220x95x85CM"}
              return Object.entries(specs)
                .filter(([name, value]) => typeof value === 'string') // 只处理字符串值
                .map(([name, value]) => {
                  // 解析格式: "200x90x85CM"
                  const match = (value as string).match(/(\d+)x(\d+)x(\d+)(\w+)/);
                  if (match) {
                    return {
                      name,
                      length: parseInt(match[1]),
                      width: parseInt(match[2]),
                      height: parseInt(match[3]),
                      unit: match[4]
                    };
                  }
                  return {
                    name,
                    length: 0,
                    width: 0,
                    height: 0,
                    unit: 'CM'
                  };
                });
            })() :
            [{ name: '2人位', length: 200, width: 90, height: 85, unit: 'CM' }],
          skus: product.skus.map((sku) => {
            // 解析材质数据，支持动态类目
            const parseMaterial = (): MaterialSelection => {
              if (typeof sku.material === 'string') {
                return sku.material ? { fabric: [sku.material] } : {}
              }
              if (!sku.material) return {}
              
              const result: MaterialSelection = {}
              // 遍历所有材质类目，只保留有值的
              Object.entries(sku.material).forEach(([key, value]) => {
                if (value) {
                  result[key] = Array.isArray(value) ? value : [value]
                }
              })
              return result
            }
            
            const material = parseMaterial()
            const fabricName = String((sku as any).fabricName || '')
            const fabricMaterialId = String((sku as any).fabricMaterialId || '')
            const fabricImage = normalizeFileId((sku as any).fabricImage || '')

            const baseMaterialCategories = (sku as any).materialCategories || Object.keys(material).filter(key => material[key]?.length > 0)
            const materialCategories = Array.from(new Set([
              ...baseMaterialCategories,
              ...(fabricName || fabricMaterialId || fabricImage ? ['fabric'] : [])
            ]))
            
            return {
              id: sku._id,
              videos: (((sku as any).videos || []) as any[])
                .map(normalizeFileId)
                .filter((v: string) => v && !v.startsWith('data:')),
              images: (((sku.images || []) as any[])
                .map(normalizeFileId)
                .filter((img: string) => img && !img.startsWith('data:'))),
              effectImages: (((sku as any).effectImages || []) as any[])
                .map(normalizeFileId)
                .filter((img: string) => img && !img.startsWith('data:')),
              code: (sku as any).code || sku._id,
              spec: (sku as any).spec || sku.color || '',
              specRemark: (sku as any).specRemark || '',
              length: (sku as any).length || 0,
              width: (sku as any).width || 0,
              height: (sku as any).height || 0,
              // 包装信息
              packageVolume: (sku as any).packageVolume || '',
              packageCount: (sku as any).packageCount || 1,
              // 面料选择
              fabricMaterialId,
              fabricName,
              fabricImage,
              materialDescriptionId: (sku as any).materialDescriptionId || '',
              // 其他材质
              otherMaterials: (sku as any).otherMaterials || '',
              otherMaterialsImage: (sku as any).otherMaterialsImage || '',
              material,
              materialCategories,
              materialUpgradePrices: (sku as any).materialUpgradePrices && Object.keys((sku as any).materialUpgradePrices).length > 0 
                ? (sku as any).materialUpgradePrices 
                : {} as Record<string, number>,
              price: sku.price,
              discountPrice: (sku as any).discountPrice || 0,
              // 库存模式
              stockMode: (sku as any).stockMode === true, // 默认定制模式(false)
              stock: sku.stock,
              deliveryDays: (sku as any).deliveryDays || 7,
              productionDays: (sku as any).productionDays || 30,
              deliveryNote: (sku as any).deliveryNote || '',
              arrivalDate: (sku as any).arrivalDate || null,
              files: (sku as any).files || [],
              sales: 0,
              isPro: (sku as any).isPro || false,
              proFeature: (sku as any).proFeature || '',
              status: true,
              manufacturerId: (sku as any).manufacturerId || '',
              manufacturerName: (sku as any).manufacturerName || '',
            }
          }),
          description: product.description,
          // 加载材质分组数据
          materialsGroups: ((product as any).materialsGroups || []).map((group: any, idx: number) => ({
            id: group.id || `mat-${idx}`,
            name: group.name || '',
            images: group.images || [],
            price: group.price || group.extra || 0,
            isDefault: group.isDefault || idx === 0,
          })),
          // 加载材质配置（面料选择 + 其他材质）
          materialConfigs: ((product as any).materialConfigs || []).map((config: any, idx: number) => {
            console.log('🔥 [ProductForm] 加载材质配置:', {
              id: config.id,
              fabricName: config.fabricName,
              images: config.images,
              imagesCount: config.images?.length || 0
            })
            return {
              id: config.id || `mc-${idx}`,
              fabricName: config.fabricName || '',
              fabricId: config.fabricId || '',
              images: config.images || [],
              price: config.price || 0,
            }
          }),
          materialDescriptionOptions: ((product as any).materialDescriptionOptions || []).map((opt: any, idx: number) => ({
            id: opt.id || `md-${idx}`,
            text: opt.text || '',
          })),
          otherMaterialsText: (product as any).otherMaterialsText || '',
          otherMaterialsImage: (product as any).otherMaterialsImage || '',
          files: ((product as any).files || []).filter((file: any) => {
            // 过滤掉Base64文件数据
            if (file.url && file.url.startsWith('data:')) {
              console.warn(`文件 ${file.name} 包含Base64数据，已过滤`);
              return false;
            }
            return true;
          }),
        })
      } else {
        toast.error('商品不存在')
        navigate('/admin/products')
        }
      }
    };
    loadProduct();
  }, [isEdit, id, navigate]);

  // 获取材质所属的类别
  const getMaterialCategory = (materialName: string): string => {
    if (materialName.includes('普通皮')) return '普通皮'
    if (materialName.includes('全青皮')) return '全青皮'
    if (materialName.includes('牛皮')) return '牛皮'
    if (materialName.includes('绒布')) return '绒布'
    if (materialName.includes('麻布')) return '麻布'
    return 'other'
  }

  // 获取材质类目的中文名称
  const getMaterialCategoryName = (categoryKey: string): string => {
    const category = PRESET_MATERIAL_CATEGORIES.find(c => c.key === categoryKey)
    return category?.name || categoryKey
  }

  // 处理材质选择（支持多选，支持动态类目）
  // 注意：如果是fabric类型且用于SKU面料选择，则设置fabricName（单选）
  const handleMaterialSelect = (material: any, materialType: string, upgradePrice?: number) => {
    console.log('🔥 [材质选择] 添加材质:', material.name, '类型:', materialType, 'SKU索引:', selectingMaterialForSkuIndex)
    
    // 如果是添加到materialConfigs（索引为-2）
    if (selectingMaterialForSkuIndex === -2) {
      setFormData(prev => {
        if (prev.materialConfigs.some(c => c.fabricName === material.name)) {
          toast.error('该材质已添加')
          return prev
        }
        const newConfig = {
          id: `mc-${Date.now()}`,
          fabricName: material.name,
          fabricId: material._id || material.id || '',
          images: (material.image || (material as any).img || (material as any).thumbnail || (material as any).images?.[0])
            ? [material.image || (material as any).img || (material as any).thumbnail || (material as any).images?.[0]]
            : [],
          price: upgradePrice || 0,
        }
        console.log('🔥 [DEBUG] 添加材质配置:', {
          name: material.name,
          image: material.image,
          images: newConfig.images,
          imagesCount: newConfig.images.length,
          newConfig
        })
        setShowMaterialSelectModal(false)
        setSelectingMaterialForSkuIndex(-1)
        return { ...prev, materialConfigs: [...prev.materialConfigs, newConfig] }
      })
      return
    }
    
    if (selectingMaterialForSkuIndex >= 0) {
      // 使用函数式更新确保状态正确累积
      setFormData(prev => {
        const newSkus = [...prev.skus]
        
        // 如果是fabric类型，设置为SKU的fabricName（单选替换）
        if (materialType === 'fabric') {
          newSkus[selectingMaterialForSkuIndex].fabricName = material.name
          newSkus[selectingMaterialForSkuIndex].fabricMaterialId = material._id || material.id || ''
          newSkus[selectingMaterialForSkuIndex].fabricImage = (material as any).image
            || (material as any).img
            || (material as any).thumbnail
            || ((material as any).images?.[0] || '')
          // 同时更新material.fabric数组，确保前端详情页能显示材质选择
          if (!newSkus[selectingMaterialForSkuIndex].material || typeof newSkus[selectingMaterialForSkuIndex].material === 'string') {
            newSkus[selectingMaterialForSkuIndex].material = createEmptyMaterialSelection()
          }
          const materialObj = newSkus[selectingMaterialForSkuIndex].material as MaterialSelection
          if (!materialObj.fabric) materialObj.fabric = []
          if (!materialObj.fabric.includes(material.name)) {
            materialObj.fabric = [...materialObj.fabric, material.name]
          }
          console.log('🔥 [面料选择] 设置SKU面料:', material.name, 'material.fabric:', materialObj.fabric)
          // 关闭弹窗
          setShowMaterialSelectModal(false)
          setSelectingMaterialForSkuIndex(-1)
          return { ...prev, skus: newSkus }
        }
        
        // 其他材质类型保持原有逻辑
        if (!newSkus[selectingMaterialForSkuIndex].material || typeof newSkus[selectingMaterialForSkuIndex].material === 'string') {
          newSkus[selectingMaterialForSkuIndex].material = createEmptyMaterialSelection()
        }
        const materialObj = newSkus[selectingMaterialForSkuIndex].material as MaterialSelection
        const currentList = materialObj[materialType] || []
        
        // 初始化材质升级价格
        if (!newSkus[selectingMaterialForSkuIndex].materialUpgradePrices) {
          newSkus[selectingMaterialForSkuIndex].materialUpgradePrices = {} as Record<string, number>
        }
        
        // 只添加不存在的材质（不再切换状态）
        if (!currentList.includes(material.name)) {
          materialObj[materialType] = [...currentList, material.name]
        }
        
        console.log('🔥 [材质选择] 更新后的材质数据:', materialObj)
        console.log('🔥 [材质选择] 更新后的materialCategories:', newSkus[selectingMaterialForSkuIndex].materialCategories)
        
        return { ...prev, skus: newSkus }
      })
    }
  }

  // 批量设置材质（替换整个材质列表）
  const handleSetMaterials = (materialNames: string[], materialType: string) => {
    console.log('🔥 [批量设置材质] 材质列表:', materialNames, '类型:', materialType, 'SKU索引:', selectingMaterialForSkuIndex)
    
    if (selectingMaterialForSkuIndex >= 0) {
      setFormData(prev => {
        const newSkus = [...prev.skus]
        if (!newSkus[selectingMaterialForSkuIndex].material || typeof newSkus[selectingMaterialForSkuIndex].material === 'string') {
          newSkus[selectingMaterialForSkuIndex].material = createEmptyMaterialSelection()
        }
        const materialObj = newSkus[selectingMaterialForSkuIndex].material as MaterialSelection
        
        // 直接设置材质列表（替换而不是切换）
        materialObj[materialType] = materialNames
        
        console.log('🔥 [批量设置材质] 更新后的材质数据:', materialObj)
        
        return { ...prev, skus: newSkus }
      })
    }
  }

  // 处理材质类别价格更新
  const handleMaterialCategoryPricesUpdate = (prices: Record<string, number>) => {
    if (selectingMaterialForSkuIndex >= 0) {
      const newSkus = [...formData.skus]
      newSkus[selectingMaterialForSkuIndex].materialUpgradePrices = prices
      setFormData({ ...formData, skus: newSkus })
    }
  }

  // 移除材质（支持动态类目）
  const handleRemoveMaterial = (skuIndex: number, materialType: string, materialName: string) => {
    const newSkus = [...formData.skus]
    const materialObj = newSkus[skuIndex].material as MaterialSelection
    if (materialObj && materialObj[materialType]) {
      materialObj[materialType] = materialObj[materialType].filter((name: string) => name !== materialName)
      // 如果该类目下没有材质了，从 materialCategories 中移除
      if (materialObj[materialType].length === 0) {
        delete materialObj[materialType]
        newSkus[skuIndex].materialCategories = newSkus[skuIndex].materialCategories.filter(cat => cat !== materialType)
      }
      // 移除材质时，也移除对应的升级价格
      if (newSkus[skuIndex].materialUpgradePrices) {
        delete (newSkus[skuIndex].materialUpgradePrices as Record<string, number>)[materialName]
      }
      setFormData({ ...formData, skus: newSkus })
    }
  }

  // 添加材质类目并直接打开材质选择弹窗
  const handleAddMaterialCategory = (skuIndex: number, categoryKey: string) => {
    console.log('🔥 [添加材质类目] SKU索引:', skuIndex, '类目:', categoryKey)
    
    const newSkus = [...formData.skus]
    if (!newSkus[skuIndex].materialCategories.includes(categoryKey)) {
      newSkus[skuIndex].materialCategories = [...newSkus[skuIndex].materialCategories, categoryKey]
      // 初始化该类目的材质数组
      if (!newSkus[skuIndex].material[categoryKey]) {
        newSkus[skuIndex].material[categoryKey] = []
      }
      setFormData({ ...formData, skus: newSkus })
      console.log('🔥 [添加材质类目] 更新后的materialCategories:', newSkus[skuIndex].materialCategories)
    }
    setShowAddCategoryModal(false)
    setAddCategoryForSkuIndex(-1)
    
    // 直接打开材质选择弹窗
    setSelectingMaterialForSkuIndex(skuIndex)
    setSelectingMaterialType(categoryKey)
    setShowMaterialSelectModal(true)
  }

  // 移除材质类目
  const handleRemoveMaterialCategory = (skuIndex: number, categoryKey: string) => {
    const newSkus = [...formData.skus]
    newSkus[skuIndex].materialCategories = newSkus[skuIndex].materialCategories.filter(cat => cat !== categoryKey)
    // 同时删除该类目下的材质数据
    delete newSkus[skuIndex].material[categoryKey]
    // 移除面料类目时，同步清空面料单选字段
    if (categoryKey === 'fabric') {
      newSkus[skuIndex].fabricName = ''
      newSkus[skuIndex].fabricMaterialId = ''
      newSkus[skuIndex].fabricImage = ''
    }
    setFormData({ ...formData, skus: newSkus })
    toast.success(`已移除材质类目：${getMaterialCategoryName(categoryKey)}`)
  }

  // ========== 分类树处理函数 ==========
  // 构建3层分类树结构
  const buildCategoryTree = (flatCategories: Category[]): Category[] => {
    // 如果数据已经是树状结构（第一个顶级分类有children且不为空），直接返回顶级分类
    const topLevelCategories = flatCategories.filter(cat => !cat.parentId)
    const hasExistingTree = topLevelCategories.some(cat => cat.children && cat.children.length > 0)
    
    if (hasExistingTree) {
      // 后端已返回树状结构，直接返回顶级分类
      return topLevelCategories
    }
    
    // 否则从扁平数据构建树
    const categoryMap = new Map<string, Category>()
    const rootCategories: Category[] = []
    
    // 首先将所有分类放入map，保留原有children
    flatCategories.forEach(cat => {
      categoryMap.set(cat._id, { ...cat, children: cat.children || [] })
    })
    
    // 构建树形结构
    flatCategories.forEach(cat => {
      const category = categoryMap.get(cat._id)!
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!
        if (!parent.children) parent.children = []
        // 避免重复添加
        if (!parent.children.find(c => c._id === category._id)) {
          parent.children.push(category)
        }
      } else if (!cat.parentId) {
        rootCategories.push(category)
      }
    })
    
    return rootCategories
  }

  // 获取分类的所有父级ID
  const getParentIds = (categoryId: string, flatCategories: Category[]): string[] => {
    const parentIds: string[] = []
    let current = flatCategories.find(c => c._id === categoryId)
    
    while (current && current.parentId) {
      parentIds.push(current.parentId)
      current = flatCategories.find(c => c._id === current!.parentId)
    }
    
    return parentIds
  }

  // 切换分类展开/收起
  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  // 选择分类（自动选中父级）
  const handleCategorySelect = (categoryId: string, isSelected: boolean, flatCategories: Category[]) => {
    let newCategories = [...formData.categories]
    
    if (isSelected) {
      // 添加该分类
      if (!newCategories.includes(categoryId)) {
        newCategories.push(categoryId)
      }
      // 自动添加所有父级
      const parentIds = getParentIds(categoryId, flatCategories)
      parentIds.forEach(parentId => {
        if (!newCategories.includes(parentId)) {
          newCategories.push(parentId)
        }
      })
    } else {
      // 取消选择该分类
      newCategories = newCategories.filter(id => id !== categoryId)
      // 如果取消选择父级，也要取消所有子级
      const category = flatCategories.find(c => c._id === categoryId)
      if (category) {
        const getAllChildIds = (cat: Category): string[] => {
          let ids: string[] = []
          if (cat.children) {
            cat.children.forEach(child => {
              ids.push(child._id)
              ids = ids.concat(getAllChildIds(child))
            })
          }
          return ids
        }
        const childIds = getAllChildIds(category)
        newCategories = newCategories.filter(id => !childIds.includes(id))
      }
    }
    
    setFormData({ 
      ...formData, 
      categories: newCategories, 
      category: newCategories[0] || '' 
    })
  }

  // ========== 系列管理函数 ==========
  // 保存系列列表到localStorage
  const saveSeriesList = (list: Array<{id: string, name: string, image: string}>) => {
    setSeriesList(list)
    localStorage.setItem('product_series_list', JSON.stringify(list))
  }

  // 添加新系列
  const handleAddSeries = async () => {
    if (!newSeriesName.trim()) {
      toast.error('请输入系列名称')
      return
    }
    
    const newSeries = {
      id: `series-${Date.now()}`,
      name: newSeriesName.trim(),
      image: newSeriesImage
    }
    
    const updatedList = [...seriesList, newSeries]
    saveSeriesList(updatedList)
    setNewSeriesName('')
    setNewSeriesImage('')
    toast.success('系列添加成功')
  }

  // 更新系列
  const handleUpdateSeries = (seriesId: string, name: string, image: string) => {
    const updatedList = seriesList.map(s => 
      s.id === seriesId ? { ...s, name, image } : s
    )
    saveSeriesList(updatedList)
    setEditingSeriesId(null)
    toast.success('系列更新成功')
  }

  // 删除系列
  const handleDeleteSeries = (seriesId: string) => {
    if (!confirm('确定要删除该系列吗？')) return
    const updatedList = seriesList.filter(s => s.id !== seriesId)
    saveSeriesList(updatedList)
    // 如果当前商品使用的是被删除的系列，清空选择
    const deletedSeries = seriesList.find(s => s.id === seriesId)
    if (deletedSeries && formData.series === deletedSeries.name) {
      setFormData({ ...formData, series: '', seriesImage: '' })
    }
    toast.success('系列删除成功')
  }

  const handleSubmit = async () => {
    // 必填字段验证
    if (!formData.name) {
      toast.error('请输入商品名称');
      return;
    }
    if (formData.categories.length === 0 && !formData.category) {
      toast.error('请至少选择一个商品分类');
      return;
    }
    if (!formData.description) {
      toast.error('请输入商品描述');
      return;
    }
    if (formData.basePrice <= 0) {
      toast.error('请输入有效的商品价格');
      return;
    }
    if (formData.mainImages.length === 0) {
      toast.error('请至少上传一张商品主图');
      return;
    }

    try {
      if (formData.category && typeof window !== 'undefined') {
        localStorage.setItem(CATEGORY_STORAGE_KEY, formData.category)
      }

      // 验证SKU数据
      if (!formData.skus || formData.skus.length === 0) {
        toast.error('请至少添加一个SKU')
        return
      }

      // 使用GridFS后，图片只保存fileId（24字节），不再需要计算Base64大小
      const totalImageCount = formData.skus.reduce((sum, sku) => {
        return sum + (sku.images || []).length
      }, 0) + (formData.mainImages || []).length
      
      console.log(`[ProductForm] 商品图片数量: ${totalImageCount} 张 (SKU: ${formData.skus.reduce((sum, sku) => sum + (sku.images || []).length, 0)}张, 主图: ${formData.mainImages.length}张)`)
      console.log(`[ProductForm] 使用GridFS存储，商品数据大小: < 1KB`)
      console.log(`[ProductForm] 分类数据: category="${formData.category}", categories=[${formData.categories.join(', ')}]`)
      console.log(`[ProductForm] SKU规格备注数据:`, formData.skus.map(sku => ({ spec: sku.spec, specRemark: sku.specRemark })))
      
      // 在保存前打印完整SKU数据
      console.log('🔥 [ProductForm] 完整SKU数据:', JSON.stringify(formData.skus.map(sku => ({
        code: sku.code,
        spec: sku.spec,
        specRemark: sku.specRemark,
      })), null, 2))

      // 构建商品数据
      const productData: any = {
        name: formData.name,
        productCode: normalizedProductCode || formData.productCode,
        subCodes: formData.subCodes, // 副编号数组
        description: formData.description,
        category: formData.category || formData.categories[0] || '', // 主分类（兼容旧数据）
        categories: formData.categories, // 多选分类数组
        basePrice: formData.basePrice,
        series: formData.series,
        seriesImage: formData.seriesImage,
        styles: formData.styles, // 风格标签
        images: formData.mainImages,
        // 视频和文件
        videos: formData.videos, // 视频URL数组
        videoTitles: formData.videoTitles, // 视频标题数组
        files: formData.files, // 设计文件数组
        skus: formData.skus.map((sku) => ({
          // 只有在编辑模式且SKU ID不是临时ID（不以"sku-"开头）时才包含_id
          ...(isEdit && sku.id && !sku.id.startsWith('sku-') && { _id: sku.id }),
          code: sku.code,
          color: sku.spec || '默认',
          spec: sku.spec,
          specRemark: sku.specRemark || '',
          length: sku.length,
          width: sku.width,
          height: sku.height,
          // 面料选择（单选）
          fabricMaterialId: sku.fabricMaterialId || '',
          fabricName: sku.fabricName || '',
          fabricImage: (sku as any).fabricImage || '',
          materialDescriptionId: (sku as any).materialDescriptionId || '',
          // 其他材质（文字+图片）
          otherMaterials: sku.otherMaterials || '',
          otherMaterialsImage: sku.otherMaterialsImage || '',
          material: (() => {
            if (typeof sku.material === 'string') {
              return { fabric: sku.material ? [sku.material] : [] }
            }
            if (!sku.material) return {}
            const result: Record<string, string[]> = {}
            Object.entries(sku.material).forEach(([key, value]) => {
              if (value) {
                result[key] = Array.isArray(value) ? value : [value]
              }
            })
            return result
          })(),
          materialCategories: sku.materialCategories || [],
          materialUpgradePrices: sku.materialUpgradePrices || {} as Record<string, number>,
          materialId: undefined,
          // 库存模式
          stockMode: sku.stockMode === true, // 默认定制模式
          stock: sku.stock,
          deliveryDays: sku.deliveryDays || 7,
          productionDays: sku.productionDays || 30,
          deliveryNote: sku.deliveryNote || '',
          arrivalDate: sku.arrivalDate || null,
          price: sku.price,
          videos: sku.videos || [],
          images: sku.images || [],
          effectImages: sku.effectImages || [],
          files: sku.files || [],
          isPro: sku.isPro,
          proFeature: sku.proFeature,
          discountPrice: sku.discountPrice,
          manufacturerId: sku.manufacturerId || undefined,
          manufacturerName: sku.manufacturerName || undefined,
        })),
        isCombo: false,
        // 材质分组数据（保时捷配置器风格）
        materialsGroups: formData.materialsGroups.map(group => ({
          id: group.id,
          name: group.name,
          images: group.images || [],
          price: group.price || 0,
          extra: group.price || 0, // 兼容旧字段名
          isDefault: group.isDefault || false,
        })),
        // 材质配置（面料选择 + 其他材质）
        materialConfigs: formData.materialConfigs.map(config => ({
          id: config.id,
          fabricName: config.fabricName,
          fabricId: config.fabricId,
          images: config.images || [],
          price: config.price || 0,
        })),
        materialDescriptionOptions: (formData.materialDescriptionOptions || []).map(opt => ({
          id: opt.id,
          text: opt.text,
        })),
        otherMaterialsText: formData.otherMaterialsText || '',
        otherMaterialsImage: formData.otherMaterialsImage || '',
        specifications: formData.specifications.reduce((acc, spec) => {
          if (spec.name) {
            acc[spec.name] = `${spec.length}x${spec.width}x${spec.height}${spec.unit}`
          }
          return acc
        }, {} as Record<string, string>),
        status: 'active' as any,
        views: 0,
        sales: 0,
        rating: 0,
        reviews: 0,
      }

      console.log(`[ProductForm] 最终发送的商品数据:`, JSON.stringify(productData, null, 2))
      console.log(`🔥 [ProductForm] materialConfigs数量:`, productData.materialConfigs?.length || 0)
      console.log(`🔥 [ProductForm] materialConfigs:`, JSON.stringify(productData.materialConfigs || []))
      
      if (isEdit && id) {
        // 更新商品
        console.log(`[ProductForm] 更新商品 ID: ${id}`)
        const result = await updateProduct(id, productData);
        console.log(`[ProductForm] 更新结果:`, result)
        // 兼容多种返回格式
        if (result && (result.success || result.data)) {
          toast.success('✅ 商品已保存', {
            description: `商品名称: ${formData.name}`,
            duration: 3000,
          });
          // 延迟导航，确保 toast 显示
          setTimeout(() => navigate(-1), 500);
        } else {
          toast.error('商品更新失败');
        }
      } else {
        // 创建新商品
        const result = await createProduct(productData);
        // 兼容多种返回格式
        if (result && (result.success || result.data)) {
          toast.success('✅ 商品已创建', {
            description: `商品名称: ${formData.name}`,
            duration: 3000,
          });
          // 延迟导航，确保 toast 显示
          setTimeout(() => navigate(-1), 500);
        } else {
          toast.error('商品创建失败');
        }
      }
    } catch (error: any) {
      console.error('保存商品失败:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        error.response.data.errors.forEach((err: any) => {
          toast.error(err.message || '验证失败');
        });
      } else {
        toast.error(error.message || '保存失败，请重试');
      }
    }
  }

  const addSpecification = () => {
    setFormData({
      ...formData,
      specifications: [
        ...formData.specifications,
        { name: '', length: 0, width: 0, height: 0, unit: 'CM' },
      ],
    })
  }

  const removeSpecification = (index: number) => {
    const newSpecs = formData.specifications.filter((_, i) => i !== index)
    setFormData({ ...formData, specifications: newSpecs })
  }

  // 生成下一个SKU型号
  const generateNextSkuCode = (): string => {
    const baseCode = normalizedProductCode || 'SKU'
    
    // 获取当前所有以商品型号开头的SKU
    const existingCodes = formData.skus
      .map(sku => sku.code)
      .filter(code => code.startsWith(baseCode))
    
    // 提取序号
    const numbers = existingCodes
      .map(code => {
        const match = code.match(new RegExp(`^${baseCode}-(\\d+)$`))
        return match ? parseInt(match[1]) : 0
      })
      .filter(num => num > 0)
    
    // 找到最大序号并+1
    const nextNumber = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
    
    // 格式化为两位数（01, 02, ...）
    const formattedNumber = String(nextNumber).padStart(2, '0')
    
    return `${baseCode}-${formattedNumber}`
  }

  const addSKU = () => {
    const newCode = generateNextSkuCode()
    
    setFormData({
      ...formData,
      skus: [
        ...formData.skus,
        {
          id: `sku-${Date.now()}`,
          videos: [],
          images: [],
          effectImages: [],
          code: newCode,
          spec: '',
          specRemark: '',
          length: 0,
          width: 0,
          height: 0,
          packageVolume: '',
          packageCount: 1,
          fabricMaterialId: '',
          fabricName: '',
          fabricImage: '',
          materialDescriptionId: '',
          otherMaterials: '',
          otherMaterialsImage: '',
          material: createEmptyMaterialSelection(),
          materialCategories: [],
          materialUpgradePrices: {},
          price: 0,
          discountPrice: 0,
          stockMode: false, // 默认定制模式
          stock: 0,
          deliveryDays: 7,
          productionDays: 30,
          deliveryNote: '',
          arrivalDate: null,
          files: [],
          sales: 0,
          isPro: false,
          proFeature: '',
          status: true,
          manufacturerId: '',
          manufacturerName: '',
        },
      ],
    })
    
    toast.success(`已添加SKU: ${newCode}`)
  }

  // 复制SKU并创建PRO版本
  const duplicateSkuAsPro = (index: number) => {
    const originalSku = formData.skus[index]
    
    // 深度复制材质对象，避免引用共享
    const copyMaterial = (material: any) => {
      if (!material) return createEmptyMaterialSelection()
      return {
        fabric: Array.isArray(material.fabric) ? [...material.fabric] : [],
        filling: Array.isArray(material.filling) ? [...material.filling] : [],
        frame: Array.isArray(material.frame) ? [...material.frame] : [],
        leg: Array.isArray(material.leg) ? [...material.leg] : [],
      }
    }
    
    // 深度复制升级价格对象
    const copyMaterialUpgradePrices = (prices: any) => {
      if (!prices || typeof prices !== 'object') return {}
      return { ...prices }
    }
    
    const proSku = {
      ...originalSku,
      id: `sku-${Date.now()}`,
      code: `${originalSku.code}-PRO`,
      isPro: true,
      proFeature: '高级版',
      // 深度复制材质和升级价格，避免与原SKU共享引用
      material: copyMaterial(originalSku.material),
      materialUpgradePrices: copyMaterialUpgradePrices(originalSku.materialUpgradePrices),
    }
    
    const newSkus = [...formData.skus]
    newSkus.splice(index + 1, 0, proSku)
    setFormData({ ...formData, skus: newSkus })
    toast.success('已创建PRO版本SKU')
  }

  const removeSKU = (index: number) => {
    const newSkus = formData.skus.filter((_, i) => i !== index)
    setFormData({ ...formData, skus: newSkus })
  }



  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({ ...prev, category: value }))
    if (typeof window === 'undefined') return
    if (value) {
      localStorage.setItem(CATEGORY_STORAGE_KEY, value)
    } else {
      localStorage.removeItem(CATEGORY_STORAGE_KEY)
    }
  }

  // 从商品信息表生成SKU列表（规格 × 材质）
  const generateSKUsFromSpecifications = () => {
    if (formData.specifications.length === 0) {
      toast.error('请先添加商品信息')
      return
    }

    const baseCode = normalizedProductCode || 'SKU'
    const newSkus: typeof formData.skus = []
    let skuIndex = 0

    // 如果有材质配置，生成 规格×材质 的SKU组合
    if (formData.materialConfigs.length > 0) {
      formData.specifications.forEach((spec) => {
        formData.materialConfigs.forEach((matConfig) => {
          skuIndex++
          newSkus.push({
            id: `sku-${Date.now()}-${skuIndex}`,
            videos: [], // 视频
            images: [], // 不使用材质配置图片，SKU图片独立管理
            effectImages: [], // 效果图独立管理
            code: `${baseCode}-${String(skuIndex).padStart(2, '0')}`,
            spec: spec.name,
            specRemark: '',
            length: spec.length,
            width: spec.width,
            height: spec.height,
            packageVolume: '',
            packageCount: 1,
            fabricMaterialId: matConfig.fabricId,
            fabricName: matConfig.fabricName,
            fabricImage: (matConfig.images && matConfig.images.length > 0) ? matConfig.images[0] : '',
            materialDescriptionId: formData.materialDescriptionOptions?.[0]?.id || '',
            otherMaterials: formData.otherMaterialsText, // 使用统一的其他材质
            otherMaterialsImage: '',
            material: createEmptyMaterialSelection(),
            materialCategories: ['fabric'] as string[],
            materialUpgradePrices: {},
            price: (formData.basePrice || 0) + (matConfig.price || 0), // 基础价 + 材质加价
            discountPrice: 0,
            stockMode: false, // 默认定制模式
            stock: 0,
            deliveryDays: 7,
            productionDays: 30,
            deliveryNote: '',
            arrivalDate: null,
            files: [],
            sales: 0,
            isPro: false,
            proFeature: '',
            status: true,
            manufacturerId: '',
            manufacturerName: '',
          })
        })
      })
    } else {
      // 没有材质配置，只按规格生成
      formData.specifications.forEach((spec) => {
        skuIndex++
        newSkus.push({
          id: `sku-${Date.now()}-${skuIndex}`,
          videos: [],
          images: [],
          effectImages: [],
          code: `${baseCode}-${String(skuIndex).padStart(2, '0')}`,
          spec: spec.name,
          specRemark: '',
          length: spec.length,
          width: spec.width,
          height: spec.height,
          packageVolume: '',
          packageCount: 1,
          fabricMaterialId: '',
          fabricName: '',
          fabricImage: '',
          materialDescriptionId: formData.materialDescriptionOptions?.[0]?.id || '',
          otherMaterials: formData.otherMaterialsText,
          otherMaterialsImage: '',
          material: createEmptyMaterialSelection(),
          materialCategories: [] as string[],
          materialUpgradePrices: {},
          price: formData.basePrice || 0,
          discountPrice: 0,
          stockMode: false, // 默认定制模式
          stock: 0,
          deliveryDays: 7,
          productionDays: 30,
          deliveryNote: '',
          arrivalDate: null,
          files: [],
          sales: 0,
          isPro: false,
          proFeature: '',
          status: true,
          manufacturerId: '',
          manufacturerName: '',
        })
      })
    }

    setFormData({ ...formData, skus: newSkus })
    const specCount = formData.specifications.length
    const matCount = formData.materialConfigs.length || 1
    toast.success(`已生成 ${newSkus.length} 个SKU (${specCount}规格 × ${matCount}材质)`)
  }

  // 批量导入Excel
  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = event.target?.result
        const workbook = XLSX.read(data, { type: 'binary' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[]

        // 打印表头信息（第一行）
        console.log('=== ProductForm Excel表头信息 ===')
        console.log('表头:', jsonData[0])
        console.log('列数:', jsonData[0]?.length)
        
        // 根据表头判断格式：检查是否包含"面料"、"填充"、"框架"、"脚架"
        const header = jsonData[0] || []
        const headerStr = header.map((cell: any) => cell?.toString() || '').join('|')
        const hasFabric = header.some((cell: any) => {
          const cellStr = cell?.toString() || ''
          return cellStr.includes('面料') || cellStr.includes('Fabric')
        })
        const hasFilling = header.some((cell: any) => {
          const cellStr = cell?.toString() || ''
          return cellStr.includes('填充') || cellStr.includes('Filling')
        })
        const hasFrame = header.some((cell: any) => {
          const cellStr = cell?.toString() || ''
          return cellStr.includes('框架') || cellStr.includes('Frame')
        })
        const hasLeg = header.some((cell: any) => {
          const cellStr = cell?.toString() || ''
          return cellStr.includes('脚架') || cellStr.includes('Leg')
        })
        // 如果表头包含4个材质字段，或者列数>=15（新格式至少有15列），则判断为新格式
        const isNewFormat = (hasFabric && hasFilling && hasFrame && hasLeg) || (header.length >= 15)
        
        console.log('格式检测:', {
          表头完整内容: headerStr,
          表头列数: header.length,
          表头包含面料: hasFabric,
          表头包含填充: hasFilling,
          表头包含框架: hasFrame,
          表头包含脚架: hasLeg,
          判断为新格式: isNewFormat,
          判断依据: (hasFabric && hasFilling && hasFrame && hasLeg) ? '表头包含4个材质字段' : (header.length >= 15 ? '列数>=15' : '旧格式')
        })
        
        // 打印第一条数据作为示例
        const dataRows = jsonData.slice(1).filter((row: any[]) => row.length > 0)
        if (dataRows.length > 0) {
          console.log('=== ProductForm 第一行数据示例 ===')
          console.log('完整行:', dataRows[0])
          dataRows[0].forEach((cell: any, index: number) => {
            console.log(`  [${index}] = "${cell}"`)
          })
        }

        // 跳过表头，从第二行开始读取数据
        const skuData = dataRows.map((row: any[], index) => {
          // Excel格式v6.0（含规格备注）：
          // A(0):商品名称 B(1):型号 C(2):类别 D(3):规格 E(4):规格备注 F(5):长宽高
          // G(6):材质面料 H(7):材质描述 I(8):标价 J(9):折扣价
          // K(10):库存天数 L(11):制作天数 M(12):包装体积 N(13):包装件数 O(14):厂家
          //
          // Excel格式v5.0（简化版-兼容）：
          // A(0):商品名称 B(1):型号 C(2):类别 D(3):规格 E(4):长宽高
          // F(5):材质面料 G(6):材质描述 H(7):标价 I(8):折扣价
          // J(9):库存天数 K(10):制作天数 L(11):包装体积 M(12):包装件数 N(13):厂家
          
          const productName = row[0] || '' // A列：商品名称
          const modelCode = row[1] || '' // B列：型号
          const spec = row[3] || '' // D列：规格
          
          // 判断是否有规格备注列（检查E列是否是尺寸格式如 200*100*80）
          const colE = row[4]?.toString() || ''
          const isDimensionFormat = /^\d+[*×x]\d+[*×x]\d+/.test(colE.replace(/\s/g, ''))
          
          // 如果E列不是尺寸格式，则认为E列是规格备注，F列是尺寸
          const specRemark = isDimensionFormat ? '' : colE
          const dimensions = isDimensionFormat ? colE : (row[5]?.toString() || '')
          
          // 根据是否有规格备注列，调整后续列的索引偏移
          const colOffset = isDimensionFormat ? 0 : 1
          
          console.log(`=== ProductForm 第${index + 2}行数据 ===`, {
            '完整行': row,
            'A列[0]-商品名称': productName,
            'B列[1]-型号': modelCode,
            'D列[3]-规格': spec,
            'E列[4]-规格备注或尺寸': colE,
            '是否尺寸格式': isDimensionFormat,
            '规格备注': specRemark,
            '尺寸': dimensions,
            '列偏移': colOffset
          })
          
          // 解析长宽高 - 格式: 长*宽*高
          const cleanDimensions = dimensions.trim().replace(/\s+/g, '') // 移除所有空格
          const dimensionParts = cleanDimensions.split('*')
          
          // 提取数字，移除单位等
          const length = dimensionParts[0] ? parseInt(dimensionParts[0].replace(/[^\d]/g, '')) || 0 : 0
          const width = dimensionParts[1] ? parseInt(dimensionParts[1].replace(/[^\d]/g, '')) || 0 : 0
          const height = dimensionParts[2] ? parseInt(dimensionParts[2].replace(/[^\d]/g, '')) || 0 : 0
          
          console.log('长宽高解析:', {
            清理后: cleanDimensions,
            分割: dimensionParts,
            长: length,
            宽: width,
            高: height
          })
          
          // 根据格式判断读取材质字段（支持多个材质，用逗号或分号分隔）
          let material: MaterialSelection
          let price: number
          let discountPrice: number
          let stock: number
          let sales: number
          let isPro: boolean
          let proFeature: string
          
          // 解析材质字符串为数组（支持逗号、分号、空格分隔）
          const parseMaterialString = (str: string): string[] => {
            if (!str || !str.trim()) return []
            return str.split(/[,;，；\s]+/).map(s => s.trim()).filter(s => s.length > 0)
          }
          
          // 构建动态材质对象
          const buildMaterial = (): MaterialSelection => {
            const result: MaterialSelection = {}
            // 新格式v6.0：G(6):材质面料 或 v5.0：F(5):材质面料
            const fabricColIndex = 5 + colOffset
            const fabric = parseMaterialString(row[fabricColIndex]?.toString() || '')
            if (fabric.length > 0) result.fabric = fabric
            return result
          }
          
          // 获取材质描述
          const materialDescColIndex = 6 + colOffset
          const materialDescription = isNewFormat ? (row[materialDescColIndex]?.toString() || '') : ''
          
          material = buildMaterial()
          // 从材质数据中提取已配置的类目列表
          const materialCategories = Object.keys(material).filter(key => material[key]?.length > 0)
          
          // 新格式v5.0字段解析
          let deliveryDays = 7
          let productionDays = 30
          let packageVolume = ''
          let packageCount = 1
          
          if (isNewFormat) {
            price = parseFloat((row[7 + colOffset]?.toString() || '').replace(/[^\d.]/g, '')) || 0 // 标价
            discountPrice = parseFloat((row[8 + colOffset]?.toString() || '').replace(/[^\d.]/g, '')) || 0 // 折扣价
            deliveryDays = parseInt(row[9 + colOffset]) || 7 // 库存天数
            productionDays = parseInt(row[10 + colOffset]) || 30 // 制作天数
            packageVolume = (row[11 + colOffset]?.toString() || '').trim() // 包装体积
            packageCount = parseInt(row[12 + colOffset]) || 1 // 包装件数
            sales = 0
            isPro = false
            proFeature = ''
          } else {
            price = parseFloat((row[6]?.toString() || '').replace(/[^\d.]/g, '')) || 0 // G列：标价
            discountPrice = parseFloat((row[7]?.toString() || '').replace(/[^\d.]/g, '')) || 0 // H列：折扣价
            stock = parseInt(row[8]) || 0 // I列：库存
            sales = parseInt(row[9]) || 0 // J列：销量
            isPro = row[10] === '是' || row[10] === 'PRO' || false // K列：PRO
            proFeature = (row[11]?.toString() || '').trim() // L列：PRO特性
          }
          
          console.log('材质字段映射:', {
            格式: isNewFormat ? (colOffset ? '新格式v6.0(含规格备注)' : '新格式v5.0') : '旧格式',
            行长度: row.length,
            列偏移: colOffset,
            已配置类目: materialCategories,
            material: material,
            面料列: row[5 + colOffset],
            材质描述列: row[6 + colOffset],
            厂家列: row[13 + colOffset],
          })
          
          return {
            id: `sku-${Date.now()}-${index}`,
            videos: [],
            images: [],
            effectImages: [],
            code: modelCode || `SKU-${index + 1}`,
            spec: spec,
            specRemark: specRemark,
            length: length,
            width: width,
            height: height,
            packageVolume: packageVolume,
            packageCount: packageCount,
            fabricMaterialId: '',
            fabricName: '',
            fabricImage: '',
            materialDescriptionId: formData.materialDescriptionOptions?.[0]?.id || '',
            otherMaterials: materialDescription,
            otherMaterialsImage: '',
            material: material,
            materialCategories: materialCategories,
            materialUpgradePrices: {} as Record<string, number>,
            price: price,
            discountPrice: discountPrice,
            stockMode: false, // 默认定制模式
            stock: 0,
            deliveryDays: deliveryDays,
            productionDays: productionDays,
            deliveryNote: '',
            arrivalDate: null,
            files: [],
            sales: sales,
            isPro: isPro,
            proFeature: proFeature,
            status: true,
            manufacturerId: '',
            manufacturerName: isNewFormat ? (row[13 + colOffset]?.toString() || '') : (row[15]?.toString() || ''),
          }
        })

        setFormData({ ...formData, skus: skuData })
        toast.success(`成功导入 ${skuData.length} 条SKU数据`)
      } catch (error) {
        console.error('导入失败:', error)
        toast.error('导入失败，请检查文件格式')
      }
    }
    reader.readAsBinaryString(file)
    
    // 重置input，允许重复选择同一文件
    e.target.value = ''
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold">{isEdit ? '编辑商品' : '新建商品'}</h1>
        </div>
      </div>

      <div className="card">
        {/* 详情页头图 - 放在最上方 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">详情页头图</h2>
          <ImageUploader
            images={formData.mainImages}
            onChange={(images) => setFormData({ ...formData, mainImages: images })}
            multiple={true}
            maxImages={10}
            label="点击上传或拖拽商品图片到此处"
          />
        </div>

        {/* 基本信息 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                商品名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入商品名称"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">主型号</label>
              <input
                type="text"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
                placeholder="请输入主型号，如: SF-2024-001"
                className="input"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">
                副型号 <span className="text-gray-500 text-xs ml-2">(可选，用于关联其他型号)</span>
              </label>
              <div className="space-y-2">
                {formData.subCodes.length > 0 ? (
                  formData.subCodes.map((subCode, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={subCode}
                        onChange={(e) => {
                          const newSubCodes = [...formData.subCodes]
                          newSubCodes[index] = e.target.value.toUpperCase()
                          setFormData({ ...formData, subCodes: newSubCodes })
                        }}
                        placeholder={`副型号 ${index + 1}，如: SF-2024-001-A`}
                        className="input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSubCodes = formData.subCodes.filter((_, i) => i !== index)
                          setFormData({ ...formData, subCodes: newSubCodes })
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200"
                      >
                        删除
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">暂无副型号，点击下方按钮添加</p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, subCodes: [...formData.subCodes, ''] })
                  }}
                  className="btn-secondary px-4 py-2 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  添加副型号
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                <FolderTree className="inline w-4 h-4 mr-1" />
                商品分类（可多选，选择子级自动选中父级）
              </label>
              {/* 点击展开分类选择 */}
              <button
                type="button"
                onClick={() => setShowCategoryPanel(!showCategoryPanel)}
                className={`w-full px-4 py-3 border rounded-lg text-left flex items-center justify-between transition-colors ${
                  showCategoryPanel ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className="text-gray-700">
                  {formData.categories.length > 0 
                    ? `已选择 ${formData.categories.length} 个分类` 
                    : '点击选择分类（支持3层树状结构）'}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showCategoryPanel ? 'rotate-180' : ''}`} />
              </button>
              {/* 3层树状分类选择面板 */}
              {showCategoryPanel && (
              <div className="p-3 border border-t-0 rounded-b-lg bg-gray-50 max-h-96 overflow-y-auto">
                {buildCategoryTree(categories).map(level1 => {
                  const isLevel1Expanded = expandedCategories.has(level1._id)
                  const isLevel1Selected = formData.categories.includes(level1._id)
                  const hasLevel1SelectedChild = level1.children?.some(l2 => 
                    formData.categories.includes(l2._id) || l2.children?.some(l3 => formData.categories.includes(l3._id))
                  )
                  
                  return (
                    <div key={level1._id} className="mb-2">
                      {/* 第1层分类 */}
                      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        isLevel1Selected || hasLevel1SelectedChild ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                      }`}>
                        <button
                          type="button"
                          onClick={() => toggleCategoryExpand(level1._id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {level1.children && level1.children.length > 0 ? (
                            isLevel1Expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                          ) : <span className="w-4 h-4" />}
                        </button>
                        <input
                          type="checkbox"
                          checked={isLevel1Selected}
                          onChange={(e) => handleCategorySelect(level1._id, e.target.checked, categories)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300"
                        />
                        <span className="font-medium text-gray-800">{level1.name}</span>
                        {(isLevel1Selected || hasLevel1SelectedChild) && (
                          <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full ml-auto">
                            {isLevel1Selected ? '已选' : '子项已选'}
                          </span>
                        )}
                      </div>
                      
                      {/* 第2层分类 */}
                      {isLevel1Expanded && level1.children && level1.children.length > 0 && (
                        <div className="ml-6 mt-1 space-y-1">
                          {level1.children.map(level2 => {
                            const isLevel2Expanded = expandedCategories.has(level2._id)
                            const isLevel2Selected = formData.categories.includes(level2._id)
                            const hasLevel2SelectedChild = level2.children?.some(l3 => formData.categories.includes(l3._id))
                            
                            return (
                              <div key={level2._id}>
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                                  isLevel2Selected || hasLevel2SelectedChild ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
                                }`}>
                                  <button
                                    type="button"
                                    onClick={() => toggleCategoryExpand(level2._id)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    {level2.children && level2.children.length > 0 ? (
                                      isLevel2Expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />
                                    ) : <span className="w-3 h-3" />}
                                  </button>
                                  <input
                                    type="checkbox"
                                    checked={isLevel2Selected}
                                    onChange={(e) => handleCategorySelect(level2._id, e.target.checked, categories)}
                                    className="w-4 h-4 text-green-600 rounded border-gray-300"
                                  />
                                  <span className="text-sm text-gray-700">{level2.name}</span>
                                  {(isLevel2Selected || hasLevel2SelectedChild) && (
                                    <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded-full ml-auto">
                                      {isLevel2Selected ? '✓' : '子项'}
                                    </span>
                                  )}
                                </div>
                                
                                {/* 第3层分类 */}
                                {isLevel2Expanded && level2.children && level2.children.length > 0 && (
                                  <div className="ml-6 mt-1 flex flex-wrap gap-1">
                                    {level2.children.map(level3 => {
                                      const isLevel3Selected = formData.categories.includes(level3._id)
                                      return (
                                        <label
                                          key={level3._id}
                                          className={`
                                            inline-flex items-center gap-1 px-2 py-1 rounded border cursor-pointer text-xs transition-all
                                            ${isLevel3Selected
                                              ? 'bg-purple-600 text-white border-purple-600'
                                              : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'
                                            }
                                          `}
                                        >
                                          <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isLevel3Selected}
                                            onChange={(e) => handleCategorySelect(level3._id, e.target.checked, categories)}
                                          />
                                          {level3.name}
                                          {isLevel3Selected && <span>✓</span>}
                                        </label>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              )}
              {formData.categories.length === 0 && (
                <p className="text-xs text-red-500 mt-1">请至少选择一个分类</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">商品价格</label>
              <input
                type="number"
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) })}
                placeholder="请输入商品价格"
                className="input"
              />
            </div>
          </div>

          {/* 系列管理 */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">系列</label>
              <button
                type="button"
                onClick={() => setShowSeriesModal(true)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Edit2 className="w-3 h-3" />
                管理系列
              </button>
            </div>
            
            {/* 系列选择和显示 */}
            <div className="border rounded-lg p-4 bg-gray-50">
              {/* 已选系列显示 */}
              {formData.series ? (
                <div className="flex items-center gap-4 mb-3">
                  {formData.seriesImage && (
                    <img
                      src={getFileUrl(formData.seriesImage)}
                      alt={formData.series}
                      className="w-16 h-16 rounded-lg object-cover border"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{formData.series}</p>
                    <p className="text-xs text-gray-500">已选系列</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, series: '', seriesImage: '' })}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : null}
              
              {/* 系列列表选择 */}
              <div className="flex flex-wrap gap-2">
                {seriesList.length === 0 ? (
                  <p className="text-sm text-gray-500">暂无系列，点击"管理系列"添加</p>
                ) : (
                  seriesList.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, series: s.name, seriesImage: s.image })}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        formData.series === s.name
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      {s.image && (
                        <img src={getFileUrl(s.image)} alt={s.name} className="w-6 h-6 rounded object-cover" />
                      )}
                      <span className="text-sm">{s.name}</span>
                    </button>
                  ))
                )}
              </div>
              
              {/* 快速添加系列 */}
              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                <input
                  type="text"
                  value={formData.series}
                  onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                  placeholder="或输入新系列名称"
                  className="input flex-1 text-sm"
                />
                <label className="flex items-center justify-center w-10 h-10 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        try {
                          const result = await uploadFile(file)
                          if (result.success && result.data?.fileId) {
                            setFormData({ ...formData, seriesImage: result.data.fileId })
                            toast.success('系列图片上传成功')
                          } else {
                            toast.error('上传失败')
                          }
                        } catch (error) {
                          toast.error('上传失败')
                        }
                      }
                    }}
                  />
                  {formData.seriesImage ? (
                    <img src={getFileUrl(formData.seriesImage)} alt="" className="w-full h-full rounded object-cover" />
                  ) : (
                    <Upload className="w-4 h-4 text-gray-400" />
                  )}
                </label>
              </div>
            </div>
          </div>
          
          {/* 系列管理弹窗 */}
          {showSeriesModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold">系列管理</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSeriesModal(false)
                      setEditingSeriesId(null)
                      setNewSeriesName('')
                      setNewSeriesImage('')
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-96">
                  {/* 添加新系列 */}
                  <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm font-medium mb-2">添加新系列</p>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors flex-shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              try {
                                const result = await uploadFile(file)
                                if (result.success && result.data?.fileId) {
                                  setNewSeriesImage(result.data.fileId)
                                  toast.success('图片上传成功')
                                } else {
                                  toast.error('上传失败')
                                }
                              } catch (error) {
                                toast.error('上传失败')
                              }
                            }
                          }}
                        />
                        {newSeriesImage ? (
                          <img src={getFileUrl(newSeriesImage)} alt="" className="w-full h-full rounded object-cover" />
                        ) : (
                          <Upload className="w-4 h-4 text-gray-400" />
                        )}
                      </label>
                      <input
                        type="text"
                        value={newSeriesName}
                        onChange={(e) => setNewSeriesName(e.target.value)}
                        placeholder="输入系列名称"
                        className="input flex-1"
                      />
                      <button
                        type="button"
                        onClick={handleAddSeries}
                        className="btn-primary px-4 py-2 whitespace-nowrap"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                  
                  {/* 系列列表 */}
                  <div className="space-y-2">
                    {seriesList.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">暂无系列</p>
                    ) : (
                      seriesList.map(s => (
                        <div key={s.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                          {editingSeriesId === s.id ? (
                            <>
                              <label className="flex items-center justify-center w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors flex-shrink-0">
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      try {
                                        const result = await uploadFile(file)
                                        if (result.success && result.data?.fileId) {
                                          const updatedList = seriesList.map(item => 
                                            item.id === s.id ? { ...item, image: result.data.fileId } : item
                                          )
                                          saveSeriesList(updatedList)
                                          toast.success('图片更新成功')
                                        } else {
                                          toast.error('上传失败')
                                        }
                                      } catch (error) {
                                        toast.error('上传失败')
                                      }
                                    }
                                  }}
                                />
                                {s.image ? (
                                  <img src={getFileUrl(s.image)} alt="" className="w-full h-full rounded object-cover" />
                                ) : (
                                  <Upload className="w-4 h-4 text-gray-400" />
                                )}
                              </label>
                              <input
                                type="text"
                                defaultValue={s.name}
                                className="input flex-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateSeries(s.id, (e.target as HTMLInputElement).value, s.image)
                                  }
                                }}
                                onBlur={(e) => handleUpdateSeries(s.id, e.target.value, s.image)}
                                autoFocus
                              />
                              <button
                                type="button"
                                onClick={() => setEditingSeriesId(null)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                取消
                              </button>
                            </>
                          ) : (
                            <>
                              {s.image ? (
                                <img src={getFileUrl(s.image)} alt={s.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                                  <span className="text-gray-400 text-xs">无图</span>
                                </div>
                              )}
                              <span className="flex-1 font-medium">{s.name}</span>
                              <button
                                type="button"
                                onClick={() => setEditingSeriesId(s.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSeries(s.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div className="px-6 py-4 border-t bg-gray-50">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSeriesModal(false)
                      setEditingSeriesId(null)
                    }}
                    className="w-full btn-secondary py-2"
                  >
                    完成
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* 风格标签 */}
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">风格标签</label>
            <div className="space-y-3">
              {/* 默认风格快捷选择 */}
              <div className="flex flex-wrap gap-2">
                {['现代风', '轻奢风', '极简风', '中古风'].map((style) => (
                  <label
                    key={style}
                    className={`
                      px-4 py-2 rounded-lg border-2 cursor-pointer transition-all
                      ${formData.styles.includes(style)
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-primary-300'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={formData.styles.includes(style)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, styles: [...formData.styles, style] })
                        } else {
                          setFormData({ ...formData, styles: formData.styles.filter(s => s !== style) })
                        }
                      }}
                      className="hidden"
                    />
                    <span className="text-sm font-medium">{style}</span>
                  </label>
                ))}
              </div>
              
              {/* 已选风格标签显示 */}
              {formData.styles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.styles.map((style) => (
                    <span
                      key={style}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                    >
                      {style}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, styles: formData.styles.filter(s => s !== style) })}
                        className="hover:text-primary-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              
              {/* 自定义风格输入 */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="输入自定义风格，按回车添加"
                  className="input flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      const input = e.currentTarget
                      const newStyle = input.value.trim()
                      if (newStyle && !formData.styles.includes(newStyle)) {
                        setFormData({ ...formData, styles: [...formData.styles, newStyle] })
                        input.value = ''
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement
                    const newStyle = input.value.trim()
                    if (newStyle && !formData.styles.includes(newStyle)) {
                      setFormData({ ...formData, styles: [...formData.styles, newStyle] })
                      input.value = ''
                    }
                  }}
                  className="btn-secondary px-4 py-2 whitespace-nowrap"
                >
                  添加风格
                </button>
              </div>
            </div>
          </div>
          
        </div>

        {/* 商品信息表 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">商品信息表</h2>
            <button
              onClick={addSpecification}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加规格
            </button>
          </div>
          <div className="space-y-4">
            {formData.specifications.map((spec, index) => (
              <div key={index} className="grid grid-cols-6 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium mb-2">规格号</label>
                  <input
                    type="text"
                    value={spec.name}
                    onChange={(e) => {
                      const newSpecs = [...formData.specifications]
                      newSpecs[index].name = e.target.value
                      setFormData({ ...formData, specifications: newSpecs })
                    }}
                    placeholder="2人位"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">长</label>
                  <input
                    type="number"
                    value={spec.length}
                    onChange={(e) => {
                      const newSpecs = [...formData.specifications]
                      newSpecs[index].length = parseFloat(e.target.value)
                      setFormData({ ...formData, specifications: newSpecs })
                    }}
                    placeholder="长"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">宽</label>
                  <input
                    type="number"
                    value={spec.width}
                    onChange={(e) => {
                      const newSpecs = [...formData.specifications]
                      newSpecs[index].width = parseFloat(e.target.value)
                      setFormData({ ...formData, specifications: newSpecs })
                    }}
                    placeholder="宽"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">高</label>
                  <input
                    type="number"
                    value={spec.height}
                    onChange={(e) => {
                      const newSpecs = [...formData.specifications]
                      newSpecs[index].height = parseFloat(e.target.value)
                      setFormData({ ...formData, specifications: newSpecs })
                    }}
                    placeholder="高"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">单位</label>
                  <select
                    value={spec.unit}
                    onChange={(e) => {
                      const newSpecs = [...formData.specifications]
                      newSpecs[index].unit = e.target.value
                      setFormData({ ...formData, specifications: newSpecs })
                    }}
                    className="input"
                  >
                    <option value="CM">CM</option>
                    <option value="M">M</option>
                  </select>
                </div>
                <div>
                  <button
                    onClick={() => removeSpecification(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 材质描述 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">材质描述</h2>
            <button
              type="button"
              onClick={() => {
                const next = [...(formData.materialDescriptionOptions || [])]
                next.push({ id: `md-${Date.now()}`, text: '' })
                setFormData({ ...formData, materialDescriptionOptions: next })
              }}
              className="text-primary-600 hover:text-primary-700 text-sm flex items-center"
            >
              <Plus className="h-4 w-4 mr-1" />
              添加描述
            </button>
          </div>
          <div className="space-y-4">
            {(formData.materialDescriptionOptions || []).length === 0 ? (
              <div className="text-sm text-gray-400">暂无材质描述</div>
            ) : (
              (formData.materialDescriptionOptions || []).map((opt, idx) => (
                <div key={opt.id} className="grid grid-cols-12 gap-4 items-start">
                  <div className="col-span-11">
                    <label className="block text-sm font-medium mb-2">描述内容</label>
                    <textarea
                      value={opt.text}
                      onChange={(e) => {
                        const next = [...(formData.materialDescriptionOptions || [])]
                        next[idx].text = e.target.value
                        setFormData({ ...formData, materialDescriptionOptions: next })
                      }}
                      placeholder="输入材质描述文字"
                      className="input min-h-[80px]"
                    />
                  </div>
                  <div className="col-span-1 pt-7">
                    <button
                      type="button"
                      onClick={() => {
                        const nextOptions = (formData.materialDescriptionOptions || []).filter((_, i) => i !== idx)
                        const newSkus = formData.skus.map(sku => ({
                          ...sku,
                          materialDescriptionId: (sku as any).materialDescriptionId === opt.id ? '' : (sku as any).materialDescriptionId,
                        }))
                        setFormData({
                          ...formData,
                          materialDescriptionOptions: nextOptions,
                          skus: newSkus,
                        })
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SKU列表 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold">SKU列表</h2>
              {/* 统一厂家选择 - 同步到所有SKU */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">统一厂家:</span>
                <select
                  value=""
                  onChange={(e) => {
                    const manufacturerId = e.target.value
                    if (!manufacturerId) return
                    const selectedManufacturer = manufacturers.find(m => m._id === manufacturerId)
                    const newSkus = formData.skus.map(sku => ({
                      ...sku,
                      manufacturerId,
                      manufacturerName: selectedManufacturer?.name || ''
                    }))
                    setFormData({ ...formData, skus: newSkus })
                    toast.success(`已将所有SKU的厂家设置为: ${selectedManufacturer?.name}`)
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="">选择厂家批量设置</option>
                  {manufacturers.map((m) => (
                    <option key={m._id} value={m._id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={generateSKUsFromSpecifications}
                className="btn-secondary flex items-center text-sm px-4 py-2"
                title="从商品信息表生成SKU列表"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                生成列表
              </button>
              <label className="btn-secondary flex items-center text-sm px-4 py-2 cursor-pointer" title="批量导入Excel文件">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                导入Excel
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImportExcel}
                />
              </label>
              <button
                onClick={addSKU}
                className="btn-primary flex items-center text-sm px-4 py-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加SKU
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">厂家</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">多媒体</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">型号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">规格</th>
                  <th className="text-left py-3 px-4 text-sm font-medium min-w-[150px]">规格备注</th>
                  <th className="text-left py-3 px-4 text-sm font-medium min-w-[200px]">尺寸</th>
                  <th className="text-left py-3 px-4 text-sm font-medium min-w-[180px]">材质面料</th>
                  <th className="text-left py-3 px-4 text-sm font-medium min-w-[220px]">材质描述</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">销价(元)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">折扣价(元)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium min-w-[140px]">库存/发货</th>
                  <th className="text-left py-3 px-4 text-sm font-medium min-w-[120px]">包装</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">文件</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {formData.skus.map((sku, index) => (
                  <tr key={sku.id} className={`border-b border-gray-100 transition-opacity ${!sku.status ? 'opacity-40 bg-gray-100' : ''} ${sku.isPro ? 'bg-amber-50' : ''}`}>
                    {/* 状态开关 - 放在最前面 */}
                    <td className="py-3 px-4">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sku.status}
                          onChange={(e) => {
                            const newSkus = [...formData.skus]
                            newSkus[index].status = e.target.checked
                            setFormData({ ...formData, skus: newSkus })
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </td>
                    {/* 厂家 - 放在第二位 */}
                    <td className="py-3 px-4">
                      <select
                        value={sku.manufacturerId || ''}
                        onChange={(e) => {
                          const newSkus = [...formData.skus]
                          const selectedManufacturer = manufacturers.find(m => m._id === e.target.value)
                          newSkus[index].manufacturerId = e.target.value
                          newSkus[index].manufacturerName = selectedManufacturer?.name || ''
                          setFormData({ ...formData, skus: newSkus })
                        }}
                        className="w-28 px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="">选择厂家</option>
                        {manufacturers.map((m) => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))}
                      </select>
                    </td>
                    {/* 多媒体 - 视频+图片+效果图 */}
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => {
                          setManagingSkuIndex(index)
                          setShowImageManager(true)
                        }}
                        className="relative flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors group"
                      >
                        {/* 显示第一个媒体预览 */}
                        {(sku.videos?.length > 0 || sku.images?.length > 0 || sku.effectImages?.length > 0) ? (
                          <>
                            <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                              {sku.videos?.length > 0 ? (
                                <video
                                  src={getFileUrl(normalizeFileId(sku.videos[0]))}
                                  preload="metadata"
                                  playsInline
                                  className="w-full h-full object-cover"
                                />
                              ) : sku.images?.length > 0 ? (
                                <img src={getThumbnailUrl(normalizeFileId(sku.images[0]), 80)} alt="预览" className="w-full h-full object-cover" />
                              ) : (
                                <img src={getThumbnailUrl(normalizeFileId(sku.effectImages[0]), 80)} alt="预览" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex flex-col text-left text-xs">
                              {sku.videos?.length > 0 && <span className="text-blue-600">视频 {sku.videos.length}</span>}
                              {sku.images?.length > 0 && <span className="text-gray-600">图片 {sku.images.length}</span>}
                              {sku.effectImages?.length > 0 && <span className="text-amber-600">效果 {sku.effectImages.length}</span>}
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
                              <span className="text-white text-xs">管理</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-gray-400 py-1">
                            <Upload className="h-4 w-4" />
                            <span className="text-xs">上传多媒体</span>
                          </div>
                        )}
                      </button>
                    </td>
                    {/* 型号 */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={sku.code}
                        readOnly
                        className="w-28 px-2 py-1 border border-gray-300 rounded bg-gray-50 text-gray-700 text-sm"
                        placeholder="型号"
                        title="型号由上方型号字段自动生成"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={sku.spec}
                        onChange={(e) => {
                          const newSkus = [...formData.skus]
                          newSkus[index].spec = e.target.value
                          setFormData({ ...formData, skus: newSkus })
                        }}
                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                      >
                        <option value="">选择规格</option>
                        {formData.specifications.map((spec) => (
                          <option key={spec.name} value={spec.name}>
                            {spec.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    {/* 规格备注 */}
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={sku.specRemark || ''}
                        onChange={(e) => {
                          const newSkus = [...formData.skus]
                          newSkus[index].specRemark = e.target.value
                          console.log(`[specRemark] SKU${index} 规格备注更新为:`, e.target.value)
                          setFormData({ ...formData, skus: newSkus })
                        }}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        placeholder="如：外径尺寸227*187"
                      />
                    </td>
                    {/* 尺寸（长×宽×高）合并为一列 */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={sku.length}
                          onChange={(e) => {
                            const newSkus = [...formData.skus]
                            newSkus[index].length = parseFloat(e.target.value) || 0
                            setFormData({ ...formData, skus: newSkus })
                          }}
                          className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                          placeholder="长"
                        />
                        <span className="text-gray-400">×</span>
                        <input
                          type="number"
                          value={sku.width}
                          onChange={(e) => {
                            const newSkus = [...formData.skus]
                            newSkus[index].width = parseFloat(e.target.value) || 0
                            setFormData({ ...formData, skus: newSkus })
                          }}
                          className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                          placeholder="宽"
                        />
                        <span className="text-gray-400">×</span>
                        <input
                          type="number"
                          value={sku.height}
                          onChange={(e) => {
                            const newSkus = [...formData.skus]
                            newSkus[index].height = parseFloat(e.target.value) || 0
                            setFormData({ ...formData, skus: newSkus })
                          }}
                          className="w-14 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                          placeholder="高"
                        />
                      </div>
                    </td>
                    {/* 材质面料列 */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {/* 已配置的材质类目 */}
                        {sku.materialCategories && sku.materialCategories.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {sku.materialCategories.map((catKey: string) => {
                              const colorStyle = getMaterialCategoryColor(catKey)
                              const materials = catKey === 'fabric'
                                ? (sku.fabricName ? [sku.fabricName] : [])
                                : ((sku.material as Record<string, string[]>)?.[catKey] || [])
                              return (
                                <div key={catKey} className="group relative">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectingMaterialForSkuIndex(index)
                                      setSelectingMaterialType(catKey)
                                      setShowMaterialSelectModal(true)
                                    }}
                                    className={catKey === 'fabric'
                                      ? `w-full text-left p-2 rounded border border-gray-200 hover:border-primary-400 bg-white hover:bg-gray-50 transition-colors`
                                      : `text-xs px-2 py-1 rounded ${colorStyle.bg} ${colorStyle.text} hover:opacity-80`
                                    }
                                  >
                                    {catKey === 'fabric' ? (
                                      <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                                          {sku.fabricImage ? (
                                            <img
                                              src={getThumbnailUrl(normalizeFileId(sku.fabricImage), 160)}
                                              alt={sku.fabricName}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">无图</div>
                                          )}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="text-xs text-gray-500">{getMaterialCategoryName(catKey)}</div>
                                          <div className="text-sm font-medium text-gray-900 truncate">{sku.fabricName || '未选'}</div>
                                        </div>
                                      </div>
                                    ) : (
                                      <span>
                                        {getMaterialCategoryName(catKey)}: {materials.length > 0 ? materials.join(', ') : '未选'}
                                      </span>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMaterialCategory(index, catKey)}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    ×
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">未配置</span>
                        )}
                        {/* 添加材质类目按钮 */}
                        <button
                          type="button"
                          onClick={() => {
                            setAddCategoryForSkuIndex(index)
                            setShowAddCategoryModal(true)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          添加材质
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {(() => {
                          const options = formData.materialDescriptionOptions || []
                          const selectedId = (sku as any).materialDescriptionId || (options.length === 1 ? options[0]?.id : '')
                          const selected = options.find(o => o.id === selectedId)
                          // 优先显示当前选项的实时文本，而非 SKU 存储的历史数据
                          const currentOptionText = String(selected?.text || '').trim()
                          if (options.length <= 1) {
                            if (!currentOptionText) return <div className="text-xs text-gray-400">暂无</div>
                            return <div className="text-xs text-gray-500 line-clamp-3">{currentOptionText}</div>
                          }
                          return (
                            <>
                              <select
                                value={selectedId}
                                onChange={(e) => {
                                  const newSkus = [...formData.skus]
                                  ;(newSkus[index] as any).materialDescriptionId = e.target.value
                                  setFormData({ ...formData, skus: newSkus })
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="">未选择</option>
                                {options.map((opt, i) => {
                                  const label = (opt.text || '').trim().slice(0, 12)
                                  return (
                                    <option key={opt.id} value={opt.id}>
                                      {label ? `${i + 1}. ${label}` : `描述${i + 1}`}
                                    </option>
                                  )
                                })}
                              </select>
                              {currentOptionText ? (
                                <div className="text-xs text-gray-500 line-clamp-2">{currentOptionText}</div>
                              ) : null}
                            </>
                          )
                        })()}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={sku.price}
                          onChange={(e) => {
                            const newSkus = [...formData.skus]
                            newSkus[index].price = parseFloat(e.target.value) || 0
                            setFormData({ ...formData, skus: newSkus })
                          }}
                          placeholder="基础价格"
                          className={`w-20 px-2 py-1 border border-gray-300 rounded ${sku.discountPrice > 0 ? 'line-through text-gray-400' : ''}`}
                        />
                        {sku.discountPrice > 0 && (
                          <span className="text-xs text-gray-500">原价</span>
                        )}
                        {/* 材质加价显示在售价下方 */}
                        {(() => {
                          const selectedConfig = formData.materialConfigs.find(c => c.id === sku.fabricMaterialId)
                          if (selectedConfig?.price > 0) {
                            return <span className="text-xs text-red-500 font-medium">+¥{selectedConfig.price}</span>
                          }
                          return null
                        })()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        <input
                          type="number"
                          value={sku.discountPrice}
                          onChange={(e) => {
                            const newSkus = [...formData.skus]
                            newSkus[index].discountPrice = parseFloat(e.target.value)
                            setFormData({ ...formData, skus: newSkus })
                          }}
                          placeholder="0"
                          className="w-20 px-2 py-1 border border-gray-300 rounded"
                        />
                        {sku.discountPrice > 0 && (
                          <span className="text-xs text-red-600 font-medium">折后价</span>
                        )}
                      </div>
                    </td>
                    {/* 库存/发货 - 合并为一列 */}
                    <td className="py-3 px-4">
                      <div className="space-y-2">
                        {/* 库存模式切换 */}
                        <div className="flex items-center gap-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sku.stockMode === true}
                              onChange={(e) => {
                                const newSkus = [...formData.skus]
                                newSkus[index].stockMode = e.target.checked
                                setFormData({ ...formData, skus: newSkus })
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                          </label>
                          <span className={`text-xs ${sku.stockMode === true ? 'text-emerald-600' : 'text-orange-600'}`}>
                            {sku.stockMode === true ? '有库存' : '定制'}
                          </span>
                        </div>
                        
                        {sku.stockMode === true ? (
                          /* 库存模式：显示库存数量和发货天数 */
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">库存:</span>
                              <input
                                type="number"
                                value={sku.stock}
                                onChange={(e) => {
                                  const newSkus = [...formData.skus]
                                  newSkus[index].stock = parseInt(e.target.value) || 0
                                  setFormData({ ...formData, skus: newSkus })
                                }}
                                className={`w-14 px-1 py-0.5 border rounded text-center text-sm ${
                                  sku.stock === 0 ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300'
                                }`}
                                min="0"
                              />
                              {sku.stock === 0 && (
                                <span className="text-xs text-red-500 font-medium">⚠️</span>
                              )}
                            </div>
                            {sku.stock === 0 && (
                              <div className="text-xs text-red-500 font-medium">请补充库存!</div>
                            )}
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-gray-500">发货:</span>
                              <input
                                type="number"
                                value={sku.deliveryDays || 7}
                                onChange={(e) => {
                                  const newSkus = [...formData.skus]
                                  newSkus[index].deliveryDays = parseInt(e.target.value) || 7
                                  setFormData({ ...formData, skus: newSkus })
                                }}
                                className="w-10 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                                min="1"
                              />
                              <span className="text-xs text-gray-500">天</span>
                            </div>
                          </div>
                        ) : (
                          /* 定制模式：显示制作天数 */
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-orange-500">制作:</span>
                              <input
                                type="number"
                                value={sku.productionDays || 30}
                                onChange={(e) => {
                                  const newSkus = [...formData.skus]
                                  newSkus[index].productionDays = parseInt(e.target.value) || 30
                                  setFormData({ ...formData, skus: newSkus })
                                }}
                                className="w-10 px-1 py-0.5 border border-orange-300 rounded text-center text-sm"
                                min="1"
                              />
                              <span className="text-xs text-orange-500">天</span>
                            </div>
                            <p className="text-[10px] text-orange-400">下单后开始制作</p>
                          </div>
                        )}
                      </div>
                    </td>
                    {/* 包装信息 */}
                    <td className="py-3 px-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">体积:</span>
                          <input
                            type="text"
                            value={sku.packageVolume || ''}
                            onChange={(e) => {
                              const newSkus = [...formData.skus]
                              newSkus[index].packageVolume = e.target.value
                              setFormData({ ...formData, skus: newSkus })
                            }}
                            className="w-16 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                            placeholder="0.5m³"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">件数:</span>
                          <input
                            type="number"
                            value={sku.packageCount || 1}
                            onChange={(e) => {
                              const newSkus = [...formData.skus]
                              newSkus[index].packageCount = parseInt(e.target.value) || 1
                              setFormData({ ...formData, skus: newSkus })
                            }}
                            className="w-12 px-1 py-0.5 border border-gray-300 rounded text-center text-sm"
                            min="1"
                          />
                        </div>
                      </div>
                    </td>
                    {/* SKU文件上传 */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1">
                        {((sku as any).files || []).length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1">
                            {((sku as any).files || []).map((file: any, fileIdx: number) => (
                              <div key={fileIdx} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                <span className="max-w-[60px] truncate" title={file.name}>{file.name}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newSkus = [...formData.skus]
                                    const files = [...((newSkus[index] as any).files || [])]
                                    files.splice(fileIdx, 1)
                                    ;(newSkus[index] as any).files = files
                                    setFormData({ ...formData, skus: newSkus })
                                  }}
                                  className="text-blue-500 hover:text-red-500"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <label className="flex items-center gap-1 px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 rounded cursor-pointer text-xs text-gray-600">
                          <Upload className="h-3 w-3" />
                          <span>上传</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              try {
                                const result = await uploadFile(file)
                                if (result.success) {
                                  const newSkus = [...formData.skus]
                                  const files = [...((newSkus[index] as any).files || [])]
                                  files.push({
                                    name: file.name,
                                    url: result.data.fileId,
                                    size: file.size,
                                    type: file.name.split('.').pop() || 'unknown'
                                  })
                                  ;(newSkus[index] as any).files = files
                                  setFormData({ ...formData, skus: newSkus })
                                  toast.success('文件上传成功')
                                }
                              } catch (err) {
                                toast.error('文件上传失败')
                              }
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => removeSKU(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 商品详情 */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">商品详情</h2>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="请输入商品的详细描述信息，包括商品参数、使用说明、领取方法等"
            rows={6}
            className="input resize-none"
          />
        </div>

        {/* 视频演示 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">视频演示</h2>
            <button
              type="button"
              onClick={() => {
                setFormData({
                  ...formData,
                  videos: [...formData.videos, ''],
                  videoTitles: [...formData.videoTitles, `${formData.name} - 视频${formData.videos.length + 1}`]
                })
              }}
              className="btn-secondary text-sm"
            >
              + 添加视频
            </button>
          </div>
          <div className="space-y-4">
            {formData.videos.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-500">暂无视频，点击"添加视频"按钮添加</p>
              </div>
            ) : (
              formData.videos.map((video, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">视频 {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const newVideos = formData.videos.filter((_, i) => i !== index)
                        const newTitles = formData.videoTitles.filter((_, i) => i !== index)
                        setFormData({ ...formData, videos: newVideos, videoTitles: newTitles })
                      }}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      删除
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">视频标题（显示在详情页）</label>
                      <input
                        type="text"
                        placeholder={`${formData.name} - 视频${index + 1}`}
                        value={formData.videoTitles[index] || ''}
                        onChange={(e) => {
                          const newTitles = [...formData.videoTitles]
                          newTitles[index] = e.target.value
                          setFormData({ ...formData, videoTitles: newTitles })
                        }}
                        className="input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">视频（上传文件或输入URL）</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="输入视频URL 或上传视频文件"
                          value={video}
                          onChange={(e) => {
                            const newVideos = [...formData.videos]
                            newVideos[index] = e.target.value
                            setFormData({ ...formData, videos: newVideos })
                          }}
                          className="input flex-1 text-sm"
                        />
                        <label className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer text-sm">
                          <Upload className="h-4 w-4" />
                          上传
                          <input
                            type="file"
                            accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo,video/x-flv,.mp4,.webm,.ogg,.mov,.avi,.flv"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              toast.info(`正在上传视频: ${file.name}...`)
                              try {
                                const result = await uploadFile(file, (progress) => {
                                  console.log(`视频上传进度: ${progress}%`)
                                })
                                if (result.success) {
                                  const newVideos = [...formData.videos]
                                  newVideos[index] = result.data.fileId
                                  setFormData({ ...formData, videos: newVideos })
                                  toast.success('视频上传成功')
                                } else {
                                  toast.error('视频上传失败')
                                }
                              } catch (err) {
                                toast.error('视频上传失败')
                              }
                              e.target.value = ''
                            }}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">支持 MP4, WebM, OGG, MOV, AVI, FLV 格式</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <p className="text-xs text-gray-500">
              💡 视频将在商品详情页以收纳列表形式展示，点击展开播放
            </p>
          </div>
        </div>

        {/* 文件上传 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">文件上传</h2>
            <label className="btn-primary flex items-center cursor-pointer text-sm px-4 py-2">
              <Upload className="h-4 w-4 mr-2" />
              上传文件
              <input
                type="file"
                accept=".dwg,.max,.fbx,.obj,.3ds,.dxf,.skp,.blend,.ma,.mb,.c4d"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || [])
                  if (files.length === 0) return

                  setIsUploading(true)
                  toast.info(`正在上传 ${files.length} 个文件...`)
                  
                  try {
                    for (const file of files) {
                      const fileName = file.name
                      
                      // 上传到GridFS，带进度回调
                      const result = await uploadFile(file, (progress) => {
                        setUploadProgress(prev => ({
                          ...prev,
                          [fileName]: progress
                        }))
                      })
                      
                      if (result.success) {
                        const fileId = result.data.fileId
                        const newFile = {
                          name: file.name,
                          url: fileId,
                          format: file.name.split('.').pop()?.toUpperCase() || '',
                          size: file.size,
                          uploadTime: new Date().toLocaleString('zh-CN')
                        }
                        setFormData(prev => ({
                          ...prev,
                          files: [...prev.files, newFile]
                        }))
                        console.log(`✅ 文件上传成功: ${file.name} -> ${fileId}`)
                        
                        // 清除进度
                        setUploadProgress(prev => {
                          const newProgress = { ...prev }
                          delete newProgress[fileName]
                          return newProgress
                        })
                      } else {
                        toast.error(`${file.name} 上传失败`)
                      }
                    }
                    toast.success(`${files.length} 个文件上传成功`)
                  } catch (error: any) {
                    console.error('❌ 文件上传失败:', error)
                    toast.error(`文件上传失败: ${error.message || '请重试'}`)
                  } finally {
                    setIsUploading(false)
                    setUploadProgress({})
                  }
                  
                  // 重置文件输入
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          
          {/* 上传进度显示 */}
          {Object.keys(uploadProgress).length > 0 && (
            <div className="mt-4 space-y-2">
              {Object.entries(uploadProgress).map(([fileName, progress]) => (
                <div key={fileName} className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{fileName}</span>
                    <span className="text-sm font-semibold text-blue-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 可点击上传区域 */}
          <label className="block cursor-pointer mb-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-primary-400 hover:bg-primary-50/50 transition-colors text-center">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">点击此处上传设计文件</p>
              <p className="text-xs text-gray-400">支持 DWG、MAX、FBX、OBJ、3DS、DXF、SKP、BLEND、MA、MB、C4D 等格式</p>
              <p className="text-xs text-gray-400 mt-1">最大支持 2GB</p>
            </div>
            <input
              type="file"
              accept=".dwg,.max,.fbx,.obj,.3ds,.dxf,.skp,.blend,.ma,.mb,.c4d,.pdf"
              multiple
              className="hidden"
              onChange={async (e) => {
                const files = Array.from(e.target.files || [])
                if (files.length === 0) return

                setIsUploading(true)
                toast.info(`正在上传 ${files.length} 个文件...`)
                
                try {
                  for (const file of files) {
                    const fileName = file.name
                    
                    const result = await uploadFile(file, (progress) => {
                      setUploadProgress(prev => ({
                        ...prev,
                        [fileName]: progress
                      }))
                    })
                    
                    if (result.success) {
                      const fileId = result.data.fileId
                      const newFile = {
                        name: file.name,
                        url: fileId,
                        format: file.name.split('.').pop()?.toUpperCase() || '',
                        size: file.size,
                        uploadTime: new Date().toLocaleString('zh-CN')
                      }
                      setFormData(prev => ({
                        ...prev,
                        files: [...prev.files, newFile]
                      }))
                      console.log(`✅ 文件上传成功: ${file.name} -> ${fileId}`)
                      
                      setUploadProgress(prev => {
                        const newProgress = { ...prev }
                        delete newProgress[fileName]
                        return newProgress
                      })
                    } else {
                      toast.error(`${file.name} 上传失败`)
                    }
                  }
                  toast.success(`${files.length} 个文件上传成功`)
                } catch (error: any) {
                  console.error('❌ 文件上传失败:', error)
                  toast.error(`文件上传失败: ${error.message || '请重试'}`)
                } finally {
                  setIsUploading(false)
                  setUploadProgress({})
                }
                
                e.target.value = ''
              }}
            />
          </label>
          
          {formData.files.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">文件名称</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">格式</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">大小</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">上传时间</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.files.map((file, index) => (
                    <tr key={index} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">📄</span>
                          <span className="text-sm text-gray-900">{file.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                          {file.format}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : `${(file.size / 1024).toFixed(2)} KB`}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {file.uploadTime}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            const newFiles = formData.files.filter((_, i) => i !== index)
                            setFormData({ ...formData, files: newFiles })
                            toast.success('文件已删除')
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            确定
          </button>
        </div>
      </div>

      {/* 多媒体管理弹窗 - SKU视频+图片+效果图 */}
      {showImageManager && managingSkuIndex >= 0 && managingSkuIndex < 10000 && (
        <SkuMultimediaManagerModal
          videos={formData.skus[managingSkuIndex]?.videos || []}
          images={formData.skus[managingSkuIndex]?.images || []}
          effectImages={formData.skus[managingSkuIndex]?.effectImages || []}
          onClose={() => {
            setShowImageManager(false)
            setManagingSkuIndex(-1)
          }}
          onSave={(data) => {
            const newSkus = [...formData.skus]
            newSkus[managingSkuIndex].videos = data.videos
            newSkus[managingSkuIndex].images = data.images
            newSkus[managingSkuIndex].effectImages = data.effectImages
            setFormData({ ...formData, skus: newSkus })
          }}
        />
      )}

      {/* 图片管理弹窗 - 材质配置图片 */}
      {showImageManager && managingSkuIndex < -99 && (
        <SkuImageManagerModal
          images={formData.materialConfigs[-100 - managingSkuIndex]?.images || []}
          onClose={() => {
            setShowImageManager(false)
            setManagingSkuIndex(-1)
          }}
          onSave={(images) => {
            const configIndex = -100 - managingSkuIndex
            const newConfigs = [...formData.materialConfigs]
            newConfigs[configIndex].images = images
            setFormData({ ...formData, materialConfigs: newConfigs })
          }}
        />
      )}

      {/* 材质选择模态框 */}
      {showMaterialSelectModal && (selectingMaterialForSkuIndex >= 0 || selectingMaterialForSkuIndex === -2) && (
        <MaterialSelectModal
          multiple={selectingMaterialForSkuIndex !== -2 && selectingMaterialType !== 'fabric'}
          materialType={selectingMaterialType}
          skuIsPro={selectingMaterialForSkuIndex >= 0 ? (formData.skus[selectingMaterialForSkuIndex]?.isPro || false) : false}
          selectedMaterials={(() => {
            if (selectingMaterialForSkuIndex === -2) return [] // 添加材质配置时不需要已选列表
            const sku = formData.skus[selectingMaterialForSkuIndex]
            if (!sku) return []
            // 面料：单选字段回显
            if (selectingMaterialType === 'fabric') {
              return sku.fabricName ? [sku.fabricName] : []
            }
            // 其他材质：从 material 对象回显，防止 material 为 string 时读取报错
            const materialObj = sku.material && typeof sku.material === 'object' ? (sku.material as any) : {}
            const materialList = materialObj?.[selectingMaterialType] || []
            return Array.isArray(materialList) ? materialList : (materialList ? [materialList] : [])
          })()}
          materialUpgradePrices={(() => {
            if (selectingMaterialForSkuIndex === -2) return {} // 添加材质配置时不需要价格
            const sku = formData.skus[selectingMaterialForSkuIndex]
            if (!sku || !sku.materialUpgradePrices) return {}
            return sku.materialUpgradePrices as Record<string, number>
          })()}
          onSelect={(material, upgradePrice) => handleMaterialSelect(material, selectingMaterialType, upgradePrice)}
          onBatchSelect={(materialNames) => handleSetMaterials(materialNames, selectingMaterialType)}
          onUpdatePrices={handleMaterialCategoryPricesUpdate}
          onClose={() => {
            setShowMaterialSelectModal(false)
            setSelectingMaterialForSkuIndex(-1)
            setSelectingMaterialType('fabric')
          }}
        />
      )}

      {/* 添加材质类目弹窗 */}
      {showAddCategoryModal && addCategoryForSkuIndex >= 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">添加材质类目</h3>
              <button
                onClick={() => {
                  setShowAddCategoryModal(false)
                  setAddCategoryForSkuIndex(-1)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">选择要添加的材质类目，添加后可在该类目下配置具体材质和加价规则</p>
            <div className="grid grid-cols-2 gap-3">
              {PRESET_MATERIAL_CATEGORIES.map((category) => {
                const sku = formData.skus[addCategoryForSkuIndex]
                const isAdded = sku?.materialCategories?.includes(category.key)
                const colorStyle = getMaterialCategoryColor(category.key)
                
                return (
                  <button
                    key={category.key}
                    onClick={() => !isAdded && handleAddMaterialCategory(addCategoryForSkuIndex, category.key)}
                    disabled={isAdded}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      isAdded 
                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50' 
                        : `border-gray-200 hover:border-primary-400 ${colorStyle.bg} hover:shadow-md`
                    }`}
                  >
                    <span className={`text-sm font-medium ${isAdded ? 'text-gray-400' : colorStyle.text}`}>
                      {category.name}
                    </span>
                    {isAdded && (
                      <span className="ml-2 text-xs text-gray-400">已添加</span>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t">
              <button
                onClick={() => {
                  setShowAddCategoryModal(false)
                  setAddCategoryForSkuIndex(-1)
                }}
                className="w-full btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Build trigger: 1768150098
