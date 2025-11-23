import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, Trash2, Upload, FileSpreadsheet, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import ImageUploader from '@/components/admin/ImageUploader'
import MaterialSelectModal from '@/components/admin/MaterialSelectModal'
import SkuImageManagerModal from '@/components/admin/SkuImageManagerModal'
// 使用真实的后端API服务
import { getProductById, createProduct, updateProduct } from '@/services/productService'
import { getAllCategories, Category } from '@/services/categoryService'
import { imageCache } from '@/services/imageCache'

const CATEGORY_STORAGE_KEY = 'productForm:lastCategory'

type MaterialSelection = {
  fabric: string[]
  filling: string[]
  frame: string[]
  leg: string[]
}

const createEmptyMaterialSelection = (): MaterialSelection => ({
  fabric: [],
  filling: [],
  frame: [],
  leg: [],
})


export default function ProductForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  // 分类数据
  const [categories, setCategories] = useState<Category[]>([])
  const [showMaterialSelectModal, setShowMaterialSelectModal] = useState(false)
  const [selectingMaterialForSkuIndex, setSelectingMaterialForSkuIndex] = useState<number>(-1)
  const [selectingMaterialType, setSelectingMaterialType] = useState<'fabric' | 'filling' | 'frame' | 'leg'>('fabric')
  
  // 图片管理弹窗状态
  const [showImageManager, setShowImageManager] = useState(false)
  const [managingSkuIndex, setManagingSkuIndex] = useState<number>(-1)
  
  const hasRestoredCategory = useRef(false)

  const [formData, setFormData] = useState({
    name: '',
    productCode: '',
    category: '',
    basePrice: 0,
    mainImages: [] as string[],
    videos: [] as string[],
    specifications: [
      { name: '2人位', length: 200, width: 90, height: 85, unit: 'CM' },
    ],
    skus: [
      {
        id: 'sku-1',
        images: [] as string[],
        code: 'sku-1762',
        spec: '2人位',
        length: 200,
        width: 90,
        height: 85,
        material: createEmptyMaterialSelection(),
        materialUpgradePrices: {},
        price: 0,
        discountPrice: 0,
        stock: 100,
        sales: 0,
        isPro: false,
        proFeature: '',
        status: true,
      },
    ],
    description: '',
    files: [] as { name: string; url: string; format: string; size: number; uploadTime: string }[],
  })

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

  // 如果是编辑模式，加载商品数据
  useEffect(() => {
    const loadProduct = async () => {
      if (isEdit && id) {
        const product = await getProductById(id);
        if (product) {
          setFormData({
          name: product.name,
          productCode: ((product as any).productCode || product._id || '').toString().toUpperCase(),
          category: typeof product.category === 'string'
            ? product.category
            : (product.category as any)?._id || '',
          basePrice: product.basePrice,
          mainImages: product.images || [],
          videos: ((product as any).videos || []) as string[],
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
          skus: product.skus.map((sku) => ({
            id: sku._id,
            images: sku.images || [],
            code: (sku as any).code || sku._id, // 加载SKU型号
            spec: (sku as any).spec || sku.color || '', // 加载规格
            length: (sku as any).length || 0, // 加载长度
            width: (sku as any).width || 0, // 加载宽度
            height: (sku as any).height || 0, // 加载高度
            material: (() => {
              if (typeof sku.material === 'string') {
                return { fabric: sku.material ? [sku.material] : [], filling: [], frame: [], leg: [] }
              }
              const materialObj = sku.material || { fabric: [], filling: [], frame: [], leg: [] }
              // 确保每个字段都是数组格式
              const normalized = {
                fabric: Array.isArray(materialObj.fabric) ? materialObj.fabric : (materialObj.fabric ? [materialObj.fabric] : []),
                filling: Array.isArray(materialObj.filling) ? materialObj.filling : (materialObj.filling ? [materialObj.filling] : []),
                frame: Array.isArray(materialObj.frame) ? materialObj.frame : (materialObj.frame ? [materialObj.frame] : []),
                leg: Array.isArray(materialObj.leg) ? materialObj.leg : (materialObj.leg ? [materialObj.leg] : []),
              }
              // 保留用户选择的材质，不自动填充默认值
              return normalized
            })(),
            materialUpgradePrices: (sku as any).materialUpgradePrices && Object.keys((sku as any).materialUpgradePrices).length > 0 
              ? (sku as any).materialUpgradePrices 
              : {} as Record<string, number>,
            price: sku.price,
            discountPrice: (sku as any).discountPrice || 0,
            stock: sku.stock,
            sales: 0,
            isPro: (sku as any).isPro || false,
            proFeature: (sku as any).proFeature || '',
            status: true,
          })),
          description: product.description,
          files: (product as any).files || [],
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

  // 处理材质选择（支持多选）
  const handleMaterialSelect = (material: any, materialType: 'fabric' | 'filling' | 'frame' | 'leg', upgradePrice?: number) => {
    if (selectingMaterialForSkuIndex >= 0) {
      const newSkus = [...formData.skus]
      if (!newSkus[selectingMaterialForSkuIndex].material || typeof newSkus[selectingMaterialForSkuIndex].material === 'string') {
        newSkus[selectingMaterialForSkuIndex].material = createEmptyMaterialSelection()
      }
      const materialObj = newSkus[selectingMaterialForSkuIndex].material as MaterialSelection
      const currentList = (materialObj[materialType] as string[]) || []
      
      // 初始化材质升级价格
      if (!newSkus[selectingMaterialForSkuIndex].materialUpgradePrices) {
        newSkus[selectingMaterialForSkuIndex].materialUpgradePrices = {} as Record<string, number>
      }
      
      // 如果已存在，则移除；如果不存在，则添加
      if (currentList.includes(material.name)) {
        (materialObj[materialType] as string[]) = currentList.filter(name => name !== material.name)
        toast.success(`已移除${materialType === 'fabric' ? '面料' : materialType === 'filling' ? '填充' : materialType === 'frame' ? '框架' : '脚架'}：${material.name}`)
      } else {
        (materialObj[materialType] as string[]) = [...currentList, material.name]
        toast.success(`已添加${materialType === 'fabric' ? '面料' : materialType === 'filling' ? '填充' : materialType === 'frame' ? '框架' : '脚架'}：${material.name}`)
      }
      
      setFormData({ ...formData, skus: newSkus })
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

  // 移除材质
  const handleRemoveMaterial = (skuIndex: number, materialType: 'fabric' | 'filling' | 'frame' | 'leg', materialName: string) => {
    const newSkus = [...formData.skus]
    const materialObj = newSkus[skuIndex].material as MaterialSelection
    if (materialObj && materialObj[materialType]) {
      (materialObj[materialType] as string[]) = (materialObj[materialType] as string[]).filter(name => name !== materialName)
      // 移除材质时，也移除对应的升级价格
      if (newSkus[skuIndex].materialUpgradePrices) {
        delete (newSkus[skuIndex].materialUpgradePrices as Record<string, number>)[materialName]
      }
      setFormData({ ...formData, skus: newSkus })
    }
  }

  const handleSubmit = async () => {
    // 必填字段验证
    if (!formData.name) {
      toast.error('请输入商品名称');
      return;
    }
    if (!formData.category) {
      toast.error('请选择商品分类');
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

      // 检查图片数据大小
      const totalImageSize = formData.skus.reduce((sum, sku) => {
        const skuImageSize = (sku.images || []).reduce((imgSum, img) => {
          return imgSum + (img ? img.length : 0)
        }, 0)
        return sum + skuImageSize
      }, 0)
      
      const mainImageSize = (formData.mainImages || []).reduce((sum, img) => {
        return sum + (img ? img.length : 0)
      }, 0)
      
      const totalSize = totalImageSize + mainImageSize
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)
      
      console.log(`[ProductForm] 商品数据大小: ${totalSizeMB}MB (SKU图片: ${(totalImageSize / (1024 * 1024)).toFixed(2)}MB, 主图: ${(mainImageSize / (1024 * 1024)).toFixed(2)}MB)`)
      
      if (totalSize > 5 * 1024 * 1024) {
        toast.warning(`⚠️ 图片数据过大 (${totalSizeMB}MB)，可能无法完全保存到本地存储。建议减少图片数量或使用更小的图片。`)
      }

      // 构建商品数据
      const productData: any = {
        name: formData.name,
        productCode: normalizedProductCode || formData.productCode,
        description: formData.description,
        category: formData.category as any,
        basePrice: formData.basePrice,
        images: formData.mainImages,
        // 视频和文件
        videos: formData.videos,
        files: formData.files,
        skus: formData.skus.map((sku) => ({
          // 只有在编辑模式且SKU ID不是临时ID（不以"sku-"开头）时才包含_id
          ...(isEdit && sku.id && !sku.id.startsWith('sku-') && { _id: sku.id }),
          code: sku.code, // 保存SKU型号
          color: sku.spec || '默认',
          spec: sku.spec, // 保存规格
          length: sku.length, // 保存长度
          width: sku.width, // 保存宽度
          height: sku.height, // 保存高度
          material: (() => {
            // 确保材质格式为数组
            if (typeof sku.material === 'string') {
              return { fabric: sku.material ? [sku.material] : [], filling: [], frame: [], leg: [] }
            }
            const materialObj = sku.material || { fabric: [], filling: [], frame: [], leg: [] }
            // 确保每个字段都是数组格式
            return {
              fabric: Array.isArray(materialObj.fabric) ? materialObj.fabric : (materialObj.fabric ? [materialObj.fabric] : []),
              filling: Array.isArray(materialObj.filling) ? materialObj.filling : (materialObj.filling ? [materialObj.filling] : []),
              frame: Array.isArray(materialObj.frame) ? materialObj.frame : (materialObj.frame ? [materialObj.frame] : []),
              leg: Array.isArray(materialObj.leg) ? materialObj.leg : (materialObj.leg ? [materialObj.leg] : []),
            }
          })(),
          materialUpgradePrices: sku.materialUpgradePrices || {} as Record<string, number>, // 保存材质升级价格 { [materialName]: price }
          materialId: undefined,
          stock: sku.stock,
          price: sku.price,
          images: sku.images || [],
          isPro: sku.isPro,
          proFeature: sku.proFeature,
          discountPrice: sku.discountPrice,
        })),
        isCombo: false,
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

      if (isEdit && id) {
        // 更新商品
        const result = await updateProduct(id, productData);
        if (result && result.success) {
          toast.success('商品更新成功');
          navigate('/admin/products');
        } else {
          toast.error('商品更新失败');
        }
      } else {
        // 创建新商品
        const result = await createProduct(productData);
        if (result && result.success) {
          toast.success('商品创建成功');
          navigate('/admin/products');
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
          images: [],
          code: newCode,
          spec: '',
          length: 0,
          width: 0,
          height: 0,
          material: createEmptyMaterialSelection(), // 空材质，需手动选择
          materialUpgradePrices: {}, // 空升级价格
          price: 0,
          discountPrice: 0,
          stock: 100,
          sales: 0,
          isPro: false,
          proFeature: '',
          status: true,
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

  // 从商品信息表生成SKU列表
  const generateSKUsFromSpecifications = () => {
    if (formData.specifications.length === 0) {
      toast.error('请先添加商品信息')
      return
    }

    const baseCode = normalizedProductCode || 'SKU'

    const newSkus = formData.specifications.map((spec, index) => ({
      id: `sku-${Date.now()}-${index}`,
      images: [],
      code: `${baseCode}-${String(index + 1).padStart(2, '0')}`,
      spec: spec.name,
      length: spec.length,
      width: spec.width,
      height: spec.height,
      material: createEmptyMaterialSelection(), // 空材质，需手动选择
      materialUpgradePrices: {}, // 空升级价格
      price: formData.basePrice || 0,
      discountPrice: 0,
      stock: 100,
      sales: 0,
      isPro: false,
      proFeature: '',
      status: true,
    }))

    setFormData({ ...formData, skus: newSkus })
    toast.success(`已生成 ${newSkus.length} 个SKU`)
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
        // 如果表头包含4个材质字段，或者列数>=16（新格式至少有16列），则判断为新格式
        const isNewFormat = (hasFabric && hasFilling && hasFrame && hasLeg) || (header.length >= 16)
        
        console.log('格式检测:', {
          表头完整内容: headerStr,
          表头列数: header.length,
          表头包含面料: hasFabric,
          表头包含填充: hasFilling,
          表头包含框架: hasFrame,
          表头包含脚架: hasLeg,
          判断为新格式: isNewFormat,
          判断依据: (hasFabric && hasFilling && hasFrame && hasLeg) ? '表头包含4个材质字段' : (header.length >= 16 ? '列数>=16' : '旧格式')
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
          // Excel格式v3.0（支持4个材质字段）：
          // A(0):图片 B(1):商品名称 C(2):型号 D(3):类别 E(4):规格 F(5):长宽高 
          // G(6):面料 H(7):填充 I(8):框架 J(9):脚架 
          // K(10):标价 L(11):折扣价 M(12):库存 N(13):销量 O(14):PRO P(15):PRO特性
          //
          // Excel格式v2.0（兼容）：
          // A(0):图片 B(1):商品名称 C(2):型号 D(3):类别 E(4):规格 F(5):长宽高 G(6):材质 H(7):标价 I(8):折扣价 J(9):库存 K(10):销量 L(11):PRO M(12):PRO特性
          
          const productName = row[1] || '' // B列：商品名称
          const modelCode = row[2] || '' // C列：型号
          const spec = row[4] || '' // E列：规格
          const dimensions = row[5]?.toString() || '' // F列：长宽高
          
          console.log(`=== ProductForm 第${index + 2}行数据 ===`, {
            '完整行': row,
            'B列[1]-商品名称': productName,
            'C列[2]-型号': modelCode,
            'E列[4]-规格': spec,
            'F列[5]-长宽高': dimensions,
            'G列[6]-材质': row[6],
            'H列[7]-标价': row[7],
            'I列[8]-折扣价': row[8]
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
          let material: { fabric: string[]; filling: string[]; frame: string[]; leg: string[] }
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
          
          if (isNewFormat) {
            // 新格式：G(6):面料 H(7):填充 I(8):框架 J(9):脚架
            material = {
              fabric: parseMaterialString(row[6]?.toString() || ''),
              filling: parseMaterialString(row[7]?.toString() || ''),
              frame: parseMaterialString(row[8]?.toString() || ''),
              leg: parseMaterialString(row[9]?.toString() || ''),
            }
            price = parseFloat((row[10]?.toString() || '').replace(/[^\d.]/g, '')) || 0 // K列：标价
            discountPrice = parseFloat((row[11]?.toString() || '').replace(/[^\d.]/g, '')) || 0 // L列：折扣价
            stock = parseInt(row[12]) || 0 // M列：库存
            sales = parseInt(row[13]) || 0 // N列：销量
            isPro = row[14] === '是' || row[14] === 'PRO' || false // O列：PRO
            proFeature = (row[15]?.toString() || '').trim() // P列：PRO特性
          } else {
            // 旧格式：G(6):材质（作为面料）
            material = {
              fabric: parseMaterialString(row[6]?.toString() || ''),
              filling: [],
              frame: [],
              leg: [],
            }
            price = parseFloat((row[7]?.toString() || '').replace(/[^\d.]/g, '')) || 0 // H列：标价
            discountPrice = parseFloat((row[8]?.toString() || '').replace(/[^\d.]/g, '')) || 0 // I列：折扣价
            stock = parseInt(row[9]) || 0 // J列：库存
            sales = parseInt(row[10]) || 0 // K列：销量
            isPro = row[11] === '是' || row[11] === 'PRO' || false // L列：PRO
            proFeature = (row[12]?.toString() || '').trim() // M列：PRO特性
          }
          
          console.log('材质字段映射:', {
            格式: isNewFormat ? '新格式（4个材质字段）' : '旧格式（单个材质字段）',
            行长度: row.length,
            面料: material.fabric,
            填充: material.filling,
            框架: material.frame,
            脚架: material.leg,
            'G列[6]': row[6],
            'H列[7]': row[7],
            'I列[8]': row[8],
            'J列[9]': row[9],
          })
          
          return {
            id: `sku-${Date.now()}-${index}`,
            images: [],
            code: modelCode || `SKU-${index + 1}`, // C列：型号
            spec: spec, // E列：规格
            length: length, // 长
            width: width, // 宽
            height: height, // 高
            material: material,
            materialUpgradePrices: {} as Record<string, number>, // 材质升级价格，导入时默认为0
            price: price,
            discountPrice: discountPrice,
            stock: stock,
            sales: sales,
            isPro: isPro,
            proFeature: proFeature,
            status: true,
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
            onClick={() => navigate('/admin/products')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold">{isEdit ? '编辑商品' : '新建商品'}</h1>
        </div>
      </div>

      <div className="card">
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
              <label className="block text-sm font-medium mb-2">型号</label>
              <input
                type="text"
                value={formData.productCode}
                onChange={(e) => setFormData({ ...formData, productCode: e.target.value.toUpperCase() })}
                placeholder="请输入型号"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">商品分类</label>
              <select
                value={formData.category}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="input"
              >
                <option value="">请选择分类</option>
                {categories.map(parent => (
                  <optgroup key={parent._id} label={parent.name}>
                    {parent.children && parent.children.length > 0 ? (
                      parent.children.map(child => (
                        <option key={child._id} value={child._id}>
                          {child.name}
                        </option>
                      ))
                    ) : (
                      <option key={parent._id} value={parent._id}>
                        {parent.name}（无子分类）
                      </option>
                    )}
                  </optgroup>
                ))}
              </select>
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
        </div>

        {/* 详情页头图 */}
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

        {/* SKU列表 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">SKU列表</h2>
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
            <table className="w-full min-w-[1600px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-medium">图片</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">型号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">规格</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">长(CM)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">宽(CM)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">高(CM)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">面料</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">填充</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">框架</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">脚架</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">销价(元)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">折扣价(元)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">显示价格</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">库存</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">PRO</th>
                  <th className="text-left py-3 px-4 text-sm font-medium">状态</th>
                  <th className="text-right py-3 px-4 text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {formData.skus.map((sku, index) => (
                  <tr key={sku.id} className={`border-b border-gray-100 ${sku.isPro ? 'bg-amber-50' : ''}`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {sku.images && sku.images.length > 0 ? (
                          <button
                            onClick={() => {
                              setManagingSkuIndex(index)
                              setShowImageManager(true)
                            }}
                            className="flex gap-1 hover:opacity-80 transition-opacity"
                            title="点击管理图片"
                          >
                            {sku.images.slice(0, 3).map((img, imgIndex) => (
                              <div key={imgIndex} className="relative w-10 h-10 group">
                                <img src={img} alt={`SKU ${imgIndex + 1}`} className="w-full h-full object-cover rounded border border-gray-300 cursor-pointer" />
                              </div>
                            ))}
                            {sku.images.length > 3 && (
                              <div className="w-10 h-10 bg-gray-100 rounded border border-gray-300 flex items-center justify-center text-xs text-gray-500 cursor-pointer">
                                +{sku.images.length - 3}
                              </div>
                            )}
                          </button>
                        ) : null}
                        <label className="w-10 h-10 border border-dashed border-gray-300 rounded flex items-center justify-center hover:border-primary-500 cursor-pointer flex-shrink-0">
                          <Upload className="h-3 w-3 text-gray-400" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                              const files = Array.from(e.target.files || [])
                              files.forEach((file, fileIndex) => {
                                const reader = new FileReader()
                                reader.onload = (event) => {
                                  const imageData = event.target?.result as string
                                  const newSkus = [...formData.skus]
                                  const currentImages = newSkus[index].images || []
                                  
                                  // 保存到缓存
                                  const productId = id || 'new'
                                  const skuId = newSkus[index].id
                                  imageCache.saveImage(productId, skuId, currentImages.length + fileIndex, imageData)
                                  
                                  // 添加到 formData
                                  newSkus[index].images = [...currentImages, imageData]
                                  setFormData({ ...formData, skus: newSkus })
                                  
                                  // 显示缓存统计
                                  const stats = imageCache.getStats()
                                  console.log(`[ProductForm] 图片缓存统计: ${stats.count} 张图片, ${stats.sizeMB}MB / ${stats.maxSizeMB}MB`)
                                }
                                reader.readAsDataURL(file)
                              })
                            }}
                          />
                        </label>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative">
                        <input
                          type="text"
                          value={sku.code}
                          readOnly
                          className="w-32 px-2 py-1 border border-gray-300 rounded bg-gray-50 text-gray-700"
                          placeholder="型号"
                          title="型号由上方“型号”字段自动生成"
                        />
                      </div>
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
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={sku.length}
                        onChange={(e) => {
                          const newSkus = [...formData.skus]
                          newSkus[index].length = parseFloat(e.target.value)
                          setFormData({ ...formData, skus: newSkus })
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={sku.width}
                        onChange={(e) => {
                          const newSkus = [...formData.skus]
                          newSkus[index].width = parseFloat(e.target.value)
                          setFormData({ ...formData, skus: newSkus })
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={sku.height}
                        onChange={(e) => {
                          const newSkus = [...formData.skus]
                          newSkus[index].height = parseFloat(e.target.value)
                          setFormData({ ...formData, skus: newSkus })
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    {/* 面料 */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                          {/* 已选择的材质标签 */}
                          {(() => {
                            const materialObj = typeof sku.material === 'string' 
                              ? { fabric: sku.material ? [sku.material] : [], filling: [], frame: [], leg: [] }
                              : (sku.material || { fabric: [], filling: [], frame: [], leg: [] })
                            const fabricList = Array.isArray(materialObj.fabric) ? materialObj.fabric : (materialObj.fabric ? [materialObj.fabric] : [])
                            return (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {fabricList.map((name, idx) => {
                                  return (
                                    <div
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded"
                                    >
                                      <span className="whitespace-nowrap">{name}</span>
                                      <div className="flex items-center gap-0.5">
                                        <button
                                          type="button"
                                          title={`${name}：高级皮革材质，提升家具质感`}
                                          className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                        >
                                          <span className="text-xs">ℹ️</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveMaterial(index, 'fabric', name)}
                                          className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectingMaterialForSkuIndex(index)
                            setSelectingMaterialType('fabric')
                            setShowMaterialSelectModal(true)
                          }}
                            className="px-2 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                        >
                            + 选择面料
                        </button>
                        </div>
                      </div>
                    </td>
                    {/* 填充 */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                          {/* 已选择的材质标签 */}
                          {(() => {
                            const materialObj = typeof sku.material === 'string' 
                              ? { fabric: sku.material ? [sku.material] : [], filling: [], frame: [], leg: [] }
                              : (sku.material || { fabric: [], filling: [], frame: [], leg: [] })
                            const fillingList = Array.isArray(materialObj.filling) ? materialObj.filling : (materialObj.filling ? [materialObj.filling] : [])
                            return (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {fillingList.map((name, idx) => {
                                  return (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded whitespace-nowrap"
                                    >
                                      <span className="whitespace-nowrap">{name}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMaterial(index, 'filling', name)}
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </span>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectingMaterialForSkuIndex(index)
                            setSelectingMaterialType('filling')
                            setShowMaterialSelectModal(true)
                          }}
                            className="px-2 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                        >
                            + 选择填充
                        </button>
                        </div>
                      </div>
                    </td>
                    {/* 框架 */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                          {/* 已选择的材质标签 */}
                          {(() => {
                            const materialObj = typeof sku.material === 'string' 
                              ? { fabric: sku.material ? [sku.material] : [], filling: [], frame: [], leg: [] }
                              : (sku.material || { fabric: [], filling: [], frame: [], leg: [] })
                            const frameList = Array.isArray(materialObj.frame) ? materialObj.frame : (materialObj.frame ? [materialObj.frame] : [])
                            return (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {frameList.map((name, idx) => {
                                  return (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded whitespace-nowrap"
                                    >
                                      <span className="whitespace-nowrap">{name}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMaterial(index, 'frame', name)}
                                        className="text-purple-600 hover:text-purple-800"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </span>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectingMaterialForSkuIndex(index)
                            setSelectingMaterialType('frame')
                            setShowMaterialSelectModal(true)
                          }}
                            className="px-2 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                        >
                            + 选择框架
                        </button>
                        </div>
                      </div>
                    </td>
                    {/* 脚架 */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                          {/* 已选择的材质标签 */}
                          {(() => {
                            const materialObj = typeof sku.material === 'string' 
                              ? { fabric: sku.material ? [sku.material] : [], filling: [], frame: [], leg: [] }
                              : (sku.material || { fabric: [], filling: [], frame: [], leg: [] })
                            const legList = Array.isArray(materialObj.leg) ? materialObj.leg : (materialObj.leg ? [materialObj.leg] : [])
                            return (
                              <div className="flex flex-wrap gap-1 mb-1">
                                {legList.map((name, idx) => {
                                  return (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded whitespace-nowrap"
                                    >
                                      <span className="whitespace-nowrap">{name}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveMaterial(index, 'leg', name)}
                                        className="text-orange-600 hover:text-orange-800"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </span>
                                  )
                                })}
                              </div>
                            )
                          })()}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectingMaterialForSkuIndex(index)
                            setSelectingMaterialType('leg')
                            setShowMaterialSelectModal(true)
                          }}
                            className="px-2 py-1.5 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                        >
                            + 选择脚架
                        </button>
                        </div>
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
                        {/* 显示总价 */}
                        <div className="text-xs text-gray-600 mt-1">
                          总价: ¥{(sku.price || 0).toFixed(2)}
                        </div>
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
                    <td className="py-3 px-4">
                      <div className="text-sm font-semibold text-gray-900">
                        ¥{(sku.price || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={sku.stock}
                        onChange={(e) => {
                          const newSkus = [...formData.skus]
                          newSkus[index].stock = parseInt(e.target.value)
                          setFormData({ ...formData, skus: newSkus })
                        }}
                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-2">
                        {sku.isPro ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                ⭐ PRO版
                              </span>
                            </div>
                            <input
                              type="text"
                              value={sku.proFeature}
                              onChange={(e) => {
                                const newSkus = [...formData.skus]
                                newSkus[index].proFeature = e.target.value
                                setFormData({ ...formData, skus: newSkus })
                              }}
                              placeholder="PRO特性"
                              className="w-48 px-2 py-1 text-sm border border-amber-300 rounded"
                            />
                          </>
                        ) : (
                          <button
                            onClick={() => duplicateSkuAsPro(index)}
                            className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                            title="复制并创建PRO版本"
                          >
                            <Plus className="h-3 w-3" />
                            创建PRO版
                          </button>
                        )}
                      </div>
                    </td>
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
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                视频URL
              </label>
              <input
                type="text"
                placeholder="输入视频URL (支持 YouTube, Vimeo, 优酷等视频链接)"
                value={formData.videos[0] || ''}
                onChange={(e) => {
                  const newVideos = [...formData.videos]
                  newVideos[0] = e.target.value
                  setFormData({ ...formData, videos: newVideos })
                }}
                className="input w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                💡 输入视频链接，将在商品详情页中显示视频播放器
              </p>
            </div>
            {formData.videos[0] && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <p className="text-sm font-medium text-gray-700 mb-2">预览</p>
                <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                  <p className="text-gray-400 text-sm">视频预览 (商品详情页显示)</p>
                </div>
              </div>
            )}
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
                onChange={(e) => {
                  const files = Array.from(e.target.files || [])
                  files.forEach((file) => {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                      const newFile = {
                        name: file.name,
                        url: event.target?.result as string,
                        format: file.name.split('.').pop()?.toUpperCase() || '',
                        size: file.size,
                        uploadTime: new Date().toLocaleString('zh-CN')
                      }
                      setFormData({
                        ...formData,
                        files: [...formData.files, newFile]
                      })
                    }
                    reader.readAsDataURL(file)
                  })
                  toast.success('文件上传成功')
                }}
              />
            </label>
          </div>
          {formData.files.length > 0 ? (
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
                        {(file.size / 1024).toFixed(2)} KB
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
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-1">暂无文件</p>
              <p className="text-xs text-gray-400">支持 DWG、MAX、FBX、OBJ、3DS、DXF、SKP、BLEND、MA、MB、C4D 等格式</p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => navigate('/admin/products')}
            className="btn-secondary"
          >
            取消
          </button>
          <button onClick={handleSubmit} className="btn-primary">
            确定
          </button>
        </div>
      </div>

      {/* 图片管理弹窗 */}
      {showImageManager && managingSkuIndex >= 0 && (
        <SkuImageManagerModal
          images={formData.skus[managingSkuIndex]?.images || []}
          onClose={() => {
            setShowImageManager(false)
            setManagingSkuIndex(-1)
          }}
          onSave={(images) => {
            const newSkus = [...formData.skus]
            newSkus[managingSkuIndex].images = images
            setFormData({ ...formData, skus: newSkus })
          }}
        />
      )}

      {/* 材质选择模态框 */}
      {showMaterialSelectModal && selectingMaterialForSkuIndex >= 0 && (
        <MaterialSelectModal
          multiple={true}
          materialType={selectingMaterialType}
          skuIsPro={formData.skus[selectingMaterialForSkuIndex]?.isPro || false}
          selectedMaterials={(() => {
            const sku = formData.skus[selectingMaterialForSkuIndex]
            if (!sku) return []
            const materialObj = typeof sku.material === 'string' 
              ? { fabric: sku.material ? [sku.material] : [], filling: [], frame: [], leg: [] }
              : (sku.material || { fabric: [], filling: [], frame: [], leg: [] })
            const materialList = materialObj[selectingMaterialType] || []
            return Array.isArray(materialList) ? materialList : (materialList ? [materialList] : [])
          })()}
          materialUpgradePrices={(() => {
            const sku = formData.skus[selectingMaterialForSkuIndex]
            if (!sku || !sku.materialUpgradePrices) return {}
            return sku.materialUpgradePrices as Record<string, number>
          })()}
          onSelect={(material, upgradePrice) => handleMaterialSelect(material, selectingMaterialType, upgradePrice)}
          onUpdatePrices={handleMaterialCategoryPricesUpdate}
          onClose={() => {
            setShowMaterialSelectModal(false)
            setSelectingMaterialForSkuIndex(-1)
            setSelectingMaterialType('fabric')
          }}
        />
      )}
    </div>
  )
}

