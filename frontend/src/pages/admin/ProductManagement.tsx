import { useState, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff, FileSpreadsheet, Download, ChevronDown, ChevronUp, BarChart3, ImageIcon, FolderOpen, Archive } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Product, UserRole } from '@/types'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
// 使用后端 API 服务
import { getProducts, deleteProduct, toggleProductStatus, createProduct, updateProduct, getProductById } from '@/services/productService'
import { getAllCategories, Category } from '@/services/categoryService'
import { getAllMaterials, getAllMaterialCategories } from '@/services/materialService'
import { Material, MaterialCategory } from '@/types'
import { createCategoryLookup, getRoleDiscountMultiplier } from '@/utils/categoryHelper'
import { useAuthStore } from '@/store/authStore'
import { getFileUrl, uploadFile, getThumbnailUrl } from '@/services/uploadService'
import apiClient from '@/lib/apiClient'

interface Manufacturer {
  _id: string
  fullName?: string
  shortName?: string
  name: string
  code?: string
}

export default function ProductManagement() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isEnterpriseAdmin = user?.role === 'enterprise_admin'
  const canViewCostPrice = user?.role === 'super_admin' || user?.role === 'admin' || (user as any)?.permissions?.canViewCostPrice === true
  const myManufacturerId = (user as any)?.manufacturerId ? String((user as any).manufacturerId) : ''
  const isPlatformAdminUser =
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.role === 'platform_admin' ||
    user?.role === 'platform_staff'
  const [designerDiscountEdits, setDesignerDiscountEdits] = useState<Record<string, string>>({})
  const [savingDesignerDiscount, setSavingDesignerDiscount] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterManufacturer, setFilterManufacturer] = useState('')  // 厂家筛选
  const [sortBy, setSortBy] = useState('')  // 排序方式
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // 商品数据
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分类数据
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryLookup, setCategoryLookup] = useState<Map<string, Category>>(new Map())
  
  // 厂家数据
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([])
  const [editingManufacturer, setEditingManufacturer] = useState<string | null>(null) // 正在编辑厂家的商品ID
  
  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // 展开的SKU列表
  const [expandedSkus, setExpandedSkus] = useState<Set<string>>(new Set())
  
  // 拖拽状态
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null)
  const [dragOverProductIndex, setDragOverProductIndex] = useState<number | null>(null)
  
  // 批量图片上传状态
  const [batchImageUploading, setBatchImageUploading] = useState(false)
  const [showZipDropZone, setShowZipDropZone] = useState(false)
  const [isDraggingZip, setIsDraggingZip] = useState(false)
  
  // 文件夹上传选中的商品
  const [folderUploadProductId, setFolderUploadProductId] = useState<string | null>(null)
  
  // 批量图片匹配确认弹框状态
  interface PendingImageMatch {
    files: File[]
    keyword: string
    matchedProducts: Product[]
    selectedProductIds: string[]
  }
  const [pendingMatches, setPendingMatches] = useState<PendingImageMatch[]>([])
  const [showMatchConfirmModal, setShowMatchConfirmModal] = useState(false)
  
  // 批量修改厂家状态
  const [showBatchManufacturerModal, setShowBatchManufacturerModal] = useState(false)
  const [batchManufacturerId, setBatchManufacturerId] = useState('')

  // 授权商品快速编辑价格状态
  const [editingPriceProductId, setEditingPriceProductId] = useState<string | null>(null)
  const [editingPriceValue, setEditingPriceValue] = useState<string>('')
  const [savingPrice, setSavingPrice] = useState(false)

  const getProductManufacturerId = (product: any): string => {
    if (!product) return ''
    const direct = product.manufacturerId?._id || product.manufacturerId || product.manufacturer
    if (direct) return String(direct)
    const skus = product.skus || []
    return skus?.[0]?.manufacturerId || ''
  }

  const applyManufacturerToSkus = (product: any, manufacturerId: string) => {
    const selectedManufacturer = manufacturers.find(m => m._id === manufacturerId)
    const manufacturerName = selectedManufacturer?.name || selectedManufacturer?.fullName || selectedManufacturer?.shortName || ''
    const skus = product?.skus || []
    return skus.map((sku: any) => ({
      ...sku,
      manufacturerId: manufacturerId ? manufacturerId : null,
      manufacturerName: manufacturerId ? manufacturerName : null,
    }))
  }

  // 加载商品数据
  useEffect(() => {
    loadCategories()
    loadManufacturers()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [myManufacturerId, user?.role])
  
  const loadCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);
      setCategoryLookup(createCategoryLookup(allCategories));
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  }
  
  const loadManufacturers = async () => {
    try {
      const response = await apiClient.get('/manufacturers', { params: { pageSize: 100 } })
      let allManufacturers = response.data.data || []
      
      // 对于厂家账号，只显示自己的厂家和授权过来的厂家
      if (!isPlatformAdminUser && myManufacturerId) {
        try {
          // 获取授权给我的厂家列表
          const authResponse = await apiClient.get('/authorizations/summary', { params: { manufacturerId: myManufacturerId } })
          const authorizations = authResponse.data?.data || []
          
          // 收集授权方厂家ID
          const authorizedFromIds = new Set<string>()
          authorizations.forEach((auth: any) => {
            const fromId = auth.fromManufacturer?._id || auth.fromManufacturer
            if (fromId) authorizedFromIds.add(String(fromId))
          })
          
          // 过滤：只保留自己的厂家 + 授权方厂家
          allManufacturers = allManufacturers.filter((m: any) => 
            String(m._id) === myManufacturerId || authorizedFromIds.has(String(m._id))
          )
        } catch (authError) {
          console.log('加载授权厂家列表失败:', authError)
          // 如果获取授权失败，只显示自己的厂家
          allManufacturers = allManufacturers.filter((m: any) => String(m._id) === myManufacturerId)
        }
      }
      
      setManufacturers(allManufacturers)
    } catch (error) {
      console.error('加载厂家失败:', error)
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts({ pageSize: 10000 });
      console.log('[ProductManagement] 加载商品响应:', response);
      if (response.success) {
        console.log('[ProductManagement] 加载商品数量:', response.data.length);
        const rawProducts = response.data || []
        let filteredProducts = (!isPlatformAdminUser && myManufacturerId)
          ? rawProducts.filter((p: any) => String(getProductManufacturerId(p)) === String(myManufacturerId))
          : rawProducts
        
        // 对于厂家账号，也加载授权过来的商品
        if (!isPlatformAdminUser && myManufacturerId) {
          try {
            const authResponse = await apiClient.get('/authorizations/products/authorized', { params: { pageSize: 10000 } })
            const authorizedProducts = authResponse.data?.data || []
            console.log('[ProductManagement] 授权商品数量:', authorizedProducts.length)
            
            // 合并商品列表，避免重复
            const existingIds = new Set(filteredProducts.map((p: any) => p._id))
            const newAuthorizedProducts = authorizedProducts.filter((p: any) => !existingIds.has(p._id))
            // 标记为授权商品
            newAuthorizedProducts.forEach((p: any) => { p.isAuthorized = true })
            filteredProducts = [...filteredProducts, ...newAuthorizedProducts]
          } catch (authError) {
            console.log('[ProductManagement] 加载授权商品失败:', authError)
          }
        }
        
        setProducts(filteredProducts);
      }
    } catch (error) {
      console.error('[ProductManagement] 加载商品失败:', error);
      toast.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

  const saveDesignerProductDiscountOverride = async (product: Product) => {
    const role = useAuthStore.getState().user?.role as UserRole | undefined
    if (role !== 'designer') return

    const p: any = product as any
    const tierPricing = p?.tierPricing
    const authorizationId = tierPricing?.authorizationId
    if (!authorizationId) {
      toast.error('未找到授权信息，无法保存单品折扣')
      return
    }

    const raw = designerDiscountEdits[product._id]
    const trimmed = (raw ?? '').toString().trim()

    let discountRate: number | null
    if (!trimmed) {
      discountRate = null
    } else {
      const percent = Number(trimmed)
      if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
        toast.error('折扣请输入 1-100 的数字')
        return
      }
      discountRate = percent / 100
    }

    setSavingDesignerDiscount(prev => ({ ...prev, [product._id]: true }))
    try {
      const resp = await apiClient.put(
        `/authorizations/${authorizationId}/designer-product-discount/${product._id}`,
        { discountRate }
      )
      if (resp.data?.success) {
        toast.success('单品折扣已保存')
        await loadProducts()
      } else {
        toast.error(resp.data?.message || '保存失败')
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '保存失败')
    } finally {
      setSavingDesignerDiscount(prev => ({ ...prev, [product._id]: false }))
    }
  }

  const handleToggleStatus = async (id: string) => {
    if (await toggleProductStatus(id)) {
      toast.success('商品状态已更新');
      await loadProducts(); // 重新加载数据
    } else {
      toast.error('更新失败');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`确定要删除商品"${name}"吗？`)) {
      if (await deleteProduct(id)) {
        toast.success('商品已删除');
        await loadProducts(); // 重新加载数据
      } else {
        toast.error('删除失败');
      }
    }
  };

  // 批量更新商品厂家
  const handleBatchUpdateManufacturer = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要修改的商品')
      return
    }
    
    try {
      let successCount = 0
      for (const id of selectedIds) {
        try {
          const targetProduct = products.find(p => p._id === id) as any
          if (!targetProduct) {
            console.error(`未找到商品 ${id}`)
            continue
          }

          const updatedSkus = applyManufacturerToSkus(targetProduct, batchManufacturerId)
          await updateProduct(id, { skus: updatedSkus })
          successCount++
        } catch (error) {
          console.error(`更新商品 ${id} 厂家失败:`, error)
        }
      }
      
      toast.success(`成功修改 ${successCount} 个商品的厂家`)
      setShowBatchManufacturerModal(false)
      setBatchManufacturerId('')
      await loadProducts()
    } catch (error) {
      console.error('批量修改厂家失败:', error)
      toast.error('批量修改失败')
    }
  }

  // 快速更新商品厂家
  const handleUpdateManufacturer = async (productId: string, manufacturerId: string) => {
    try {
      const targetProduct = products.find(p => p._id === productId) as any
      if (!targetProduct) {
        toast.error('未找到商品')
        return
      }

      const updatedSkus = applyManufacturerToSkus(targetProduct, manufacturerId)
      await updateProduct(productId, { skus: updatedSkus })
      toast.success('厂家已更新')
      setEditingManufacturer(null)
      // 更新本地数据
      setProducts(prev => prev.map(p => 
        p._id === productId ? ({
          ...(p as any),
          skus: updatedSkus
        } as any) : p
      ))
    } catch (error) {
      console.error('更新厂家失败:', error)
      toast.error('更新失败')
    }
  }

  // 获取厂家显示名称
  const getManufacturerName = (manufacturerId: string | undefined) => {
    if (!manufacturerId) return '-'
    const m = manufacturers.find(m => m._id === manufacturerId)
    return m ? (m.shortName || m.fullName || m.name) : '-'
  }

  // 授权商品快速编辑价格
  const handleAuthorizedPriceEdit = async (product: Product) => {
    const newPrice = parseFloat(editingPriceValue)
    if (isNaN(newPrice) || newPrice <= 0) {
      toast.error('请输入有效的价格')
      return
    }

    setSavingPrice(true)
    try {
      // 使用授权商品覆盖API
      const res = await apiClient.put(`/authorizations/product-override/${product._id}`, { price: newPrice })
      if (res.data.success) {
        // 更新本地数据
        setProducts(prev => prev.map(p => {
          if (p._id === product._id) {
            return {
              ...p,
              overridePrice: newPrice
            } as any
          }
          return p
        }))
        toast.success('价格已更新')
        setEditingPriceProductId(null)
        setEditingPriceValue('')
      } else {
        toast.error(res.data.message || '更新价格失败')
      }
    } catch (error: any) {
      console.error('更新价格失败:', error)
      toast.error(error?.response?.data?.message || '更新价格失败')
    } finally {
      setSavingPrice(false)
    }
  }

  // 授权商品切换隐藏/显示
  const handleAuthorizedToggleHidden = async (product: Product) => {
    const currentHidden = (product as any).isHidden || false
    try {
      const res = await apiClient.put(`/authorizations/product-override/${product._id}`, { hidden: !currentHidden })
      if (res.data.success) {
        setProducts(prev => prev.map(p => {
          if (p._id === product._id) {
            return { ...p, isHidden: !currentHidden } as any
          }
          return p
        }))
        toast.success(currentHidden ? '商品已显示' : '商品已隐藏')
      } else {
        toast.error(res.data.message || '操作失败')
      }
    } catch (error: any) {
      console.error('切换隐藏状态失败:', error)
      toast.error(error?.response?.data?.message || '操作失败')
    }
  }

  // 下载导入模板
  const handleDownloadTemplate = () => {
    // 创建模板数据 - 动态材质列支持
    // 固定列: 商品名称、型号(主型号)、商品型号(副型号)、类别、规格、长宽高、颜色
    // 动态材质列: 面料、填充、框架、脚架（可新增座包等其他材质类目，填写材质库中的类别名即可自动关联该类别下所有材质）
    // 后续固定列: 标价、折扣价、PRO、PRO特性、风格标签、商品图片1-7
    const templateData = [
      ['商品名称', '型号(主型号)', '商品型号(副型号)', '类别', '规格', '长宽高', '颜色', '面料', '填充', '框架', '脚架', '标价', '折扣价', 'PRO', 'PRO特性', '风格标签', '商品图片1', '商品图片2', '商品图片3', '商品图片4', '商品图片5', '商品图片6', '商品图片7'],
      ['现代沙发A', 'SF-001', 'MD503-0046A', '沙发', '三人位', '200*115*77', 'A类泰迪绒', '泰迪绒', '高回弹海绵', '实木框架', '金属脚架', 13200, 0, '否', '', '北欧', 'https://example.com/img1.jpg', 'https://example.com/img2.jpg', '', '', '', '', ''],
      ['现代沙发A', 'SF-001', 'MD503-0046B', '沙发', '四人位', '200*115*77', 'B类雪尼尔绒', '雪尼尔绒', '高回弹海绵', '实木框架', '金属脚架', 17940, '', '', '', '', '', '', '', '', '', '', ''],
      ['现代沙发A', 'SF-001', 'MD503-0046C', '沙发', '五人位', '360*110*67', 'A泰迪绒', '泰迪绒', '高回弹海绵', '实木框架', '金属脚架', 20940, '', '', '', '', '', '', '', '', '', '', ''],
      ['北欧床', 'BED-001', 'BD001-A', '床', '1.5米', '150*200*45', '', '', '高回弹海绵', '实木', '金属', 2999, 2499, '否', '', '简约', '', '', '', '', '', '', ''],
      ['北欧床', 'BED-001', 'BD001-B', '床', '1.8米', '180*200*45', '', '', '高回弹海绵', '实木', '金属', 3499, 2999, '是', '加厚床板', '简约', '', '', '', '', '', '', ''],
    ]

    // 创建说明工作表
    const instructions = [
      ['商品导入模板使用说明'],
      [''],
      ['1. 型号(主型号): 商品的主型号，同一商品的多个SKU使用相同的主型号'],
      ['2. 商品型号(副型号): SKU的副型号/编码，每个SKU可以有不同的副型号'],
      ['3. 颜色字段: 用于筛选材质的类别，格式如"A类泰迪绒"或"A泰迪绒"'],
      ['   - 系统会从颜色字段中识别材质类别（如A类、B类等）'],
      ['   - 面料字段填写的材质会根据颜色字段筛选只关联对应类别的材质'],
      ['   - 例如：颜色填"A类泰迪绒"，面料填"泰迪绒"，则只关联A类泰迪绒下的材质'],
      ['4. 材质列（面料、填充、框架、脚架等）:'],
      ['   - 填写材质库中的"类别名称"，系统会自动关联该类别下的所有具体材质SKU'],
      ['   - 例如：填写"磨砂皮"，会自动关联该类别下的砂冰蓝、砂米白等所有材质'],
      ['   - 注意：只会匹配具体的材质SKU，不会匹配类别本身'],
      ['   - 支持加价格式：如"高密加硬+1000"，表示该类别所有材质加价1000元'],
      ['   - 可以在"标价"列之前新增其他材质类目列（如座包、靠背等）'],
      ['5. 风格标签: 支持多个标签，用逗号分隔，如"中古风、现代风"'],
      ['6. 商品图片: 填写图片的完整URL地址，第一张图片将作为商品头图'],
      ['7. 同一主型号的多行会自动合并为同一商品的多个SKU'],
    ]

    // 创建工作簿
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '商品导入模板')
    XLSX.utils.book_append_sheet(wb, wsInstructions, '使用说明')

    // 设置列宽
    ws['!cols'] = [
      { wch: 15 },  // 商品名称
      { wch: 15 },  // 型号(主型号)
      { wch: 18 },  // 商品型号(副型号)
      { wch: 10 },  // 类别
      { wch: 10 },  // 规格
      { wch: 15 },  // 长宽高
      { wch: 15 },  // 面料
      { wch: 12 },  // 填充
      { wch: 12 },  // 框架
      { wch: 12 },  // 脚架
      { wch: 10 },  // 标价
      { wch: 10 },  // 折扣价
      { wch: 6 },   // PRO
      { wch: 20 },  // PRO特性
      { wch: 10 },  // 风格标签
      { wch: 30 },  // 商品图片1
      { wch: 30 },  // 商品图片2
      { wch: 30 },  // 商品图片3
      { wch: 30 },  // 商品图片4
      { wch: 30 },  // 商品图片5
      { wch: 30 },  // 商品图片6
      { wch: 30 },  // 商品图片7
    ]

    // 下载文件
    XLSX.writeFile(wb, '商品导入模板.xlsx')
    toast.success('模板下载成功')
  }

  // 表格导入 - 新版模板格式（动态材质列支持）
  // 固定列: 商品名称(0)、型号(1)=主型号、商品型号(2)=副型号、类别(3)、规格(4)、长宽高(5)、颜色(6)
  // 动态材质列: 从第7列开始，直到遇到"标价"列之前都是材质列（如面料、填充、框架、脚架、座包等）
  // 后续列: 标价、折扣价、PRO、PRO特性、风格标签、商品图片1-7
  const processImportedData = async (jsonData: any[]) => {
    try {
      console.log('=== Excel导入开始 ===');
      console.log('总行数（包括表头）:', jsonData.length);

      // enterprise_admin 不允许加载全量材质库数据
      if (isEnterpriseAdmin) {
        toast.error('当前账号无权限导入材质映射，请联系管理员授权')
        return
      }

      // 加载材质库数据用于自动匹配
      let allMaterials = await getAllMaterials();
      const materialCategories = await getAllMaterialCategories();
      
      // 过滤掉名称中包含换行符的错误材质数据
      const badMaterialCount = allMaterials.filter(m => m.name && m.name.includes('\n')).length;
      if (badMaterialCount > 0) {
        console.warn(`⚠️ 发现 ${badMaterialCount} 个包含换行符的错误材质，已过滤`);
        allMaterials = allMaterials.filter(m => !m.name || !m.name.includes('\n'));
      }
      
      console.log('材质库数据:', allMaterials.length, '个材质,', materialCategories.length, '个分类');

      // 分离类别材质和SKU材质
      const categoryMaterials = allMaterials.filter(m => m.isCategory === true);
      const skuMaterials = allMaterials.filter(m => !m.isCategory);
      
      console.log('===== 材质库数据 =====');
      console.log('所有材质数量:', allMaterials.length);
      console.log('类别材质数量:', categoryMaterials.length);
      console.log('SKU材质数量:', skuMaterials.length);
      console.log('MaterialCategory分类数量:', materialCategories.length);
      
      if (categoryMaterials.length > 0) {
        console.log('类别材质列表:', categoryMaterials.map(c => c.name).join(', '));
      } else {
        console.log('⚠️ 没有找到类别材质（isCategory=true），尝试使用MaterialCategory');
      }
      
      if (materialCategories.length > 0) {
        console.log('MaterialCategory列表:', materialCategories.map(c => c.name).join(', '));
      }
      
      console.log('前20个材质:', allMaterials.slice(0, 20).map(m => `${m.name}(isCategory:${m.isCategory}, catId:${m.categoryId})`).join('\n  '));

      // 解析颜色字段，提取材质类别筛选信息
      // 支持格式：A类泰迪绒、A泰迪绒、B类雪尼尔绒等
      // 过滤掉干扰信息：展厅上样、幻影30等
      // 返回值：{ categoryPrefix, materialType, skipMaterial }
      // - skipMaterial=true 表示跳过面料匹配（干扰词）
      // - skipMaterial=false 表示正常匹配
      const parseColorField = (colorText: string): { categoryPrefix: string; materialType: string; skipMaterial: boolean } | null => {
        if (!colorText) return null;
        
        // 干扰词列表 - 需要排除的产品信息，且不应该添加任何面料
        const noiseWords = ['展厅上样', '幻影', '上样', '展厅', '样品', '测试'];
        
        // 检查是否包含干扰词 - 如果是干扰词，跳过面料匹配
        for (const noise of noiseWords) {
          if (colorText.includes(noise)) {
            console.log(`  颜色字段包含干扰词"${noise}"，跳过面料匹配: "${colorText}"`);
            return { categoryPrefix: '', materialType: '', skipMaterial: true };
          }
        }
        
        // 解析格式支持多种变体：
        // - B类雪尼尔绒、B雪尼尔绒、B类-雪尼尔绒
        // - B类布-雪尼尔绒、B布-雪尼尔绒、B类皮-纳帕皮
        // - A+类泰迪绒、A+泰迪绒、A+布-泰迪绒
        // - A+类棉麻面料、B类面料-xxx
        // 匹配规则：前缀(A-E或A+) + 可选(类) + 可选(布/皮/绒/面料等) + 可选(-) + 材质类型
        const match = colorText.match(/^([A-Ea-e][+]?)(类)?(布|皮|绒|面料)?[-—]?(.+)$/);
        if (match) {
          const categoryPrefix = match[1].toUpperCase(); // A、B、C、A+等
          const categoryType = match[2] || ''; // 类
          const materialCategory = match[3] || ''; // 布、皮、绒
          const materialType = match[4]?.trim() || ''; // 雪尼尔绒、泰迪绒等
          
          // 构建完整的材质类别前缀，如 "B类布" 或 "B类"
          let fullPrefix = categoryPrefix;
          if (categoryType) fullPrefix += categoryType;
          if (materialCategory) fullPrefix += materialCategory;
          
          console.log(`  解析颜色字段: "${colorText}" -> 前缀="${fullPrefix}", 材质类型="${materialType}"`);
          return { categoryPrefix: fullPrefix, materialType, skipMaterial: false };
        }
        
        // 如果不匹配标准格式，尝试直接使用颜色字段作为材质类别名
        // 检查材质库中是否有以此开头的材质
        console.log(`  颜色字段不是标准格式，尝试直接匹配: "${colorText}"`);
        return { categoryPrefix: '', materialType: colorText, skipMaterial: false };
      };

      // 从材质库中提取所有可能的类别名称前缀
      // 例如材质 "B类雪尼尔绒-安博-01" 的类别前缀是 "B类雪尼尔绒"
      const extractCategoryPrefixes = (): string[] => {
        const prefixes = new Set<string>();
        allMaterials.forEach(m => {
          // 查找第一个 "-" 或 "—" 的位置
          const dashIndex = Math.min(
            m.name.indexOf('-') === -1 ? Infinity : m.name.indexOf('-'),
            m.name.indexOf('—') === -1 ? Infinity : m.name.indexOf('—')
          );
          if (dashIndex !== Infinity && dashIndex > 0) {
            prefixes.add(m.name.substring(0, dashIndex));
          }
        });
        return Array.from(prefixes);
      };
      
      const categoryPrefixes = extractCategoryPrefixes();
      console.log(`  材质库中的类别前缀(前20): [${categoryPrefixes.slice(0, 20).join(', ')}]`);

      // 根据颜色字段直接在材质库中查找匹配的类别
      // 支持复杂格式如 "A类真皮头层真皮（古漆皮）"
      const findMaterialCategoryByColor = (colorInfo: { categoryPrefix: string; materialType: string; skipMaterial?: boolean } | null, originalColorText: string): string | null => {
        if (!colorInfo || colorInfo.skipMaterial) return null;
        
        const { categoryPrefix, materialType } = colorInfo;
        
        // 方法1：直接用原始颜色字段在材质库中查找
        // 如果颜色字段就是一个完整的类别名，直接使用
        if (originalColorText) {
          const directMatch = categoryPrefixes.find(prefix => 
            prefix === originalColorText || 
            prefix.toLowerCase() === originalColorText.toLowerCase()
          );
          if (directMatch) {
            console.log(`✓ 颜色字段直接匹配类别: "${directMatch}"`);
            return directMatch;
          }
          
          // 检查是否有以颜色字段开头的材质
          const startsWithMatch = categoryPrefixes.find(prefix => 
            prefix.startsWith(originalColorText) || originalColorText.startsWith(prefix)
          );
          if (startsWithMatch) {
            console.log(`✓ 颜色字段部分匹配类别: "${startsWithMatch}"`);
            return startsWithMatch;
          }
        }
        
        // 方法2：使用解析后的前缀+类型构建可能的名称
        if (!materialType && !categoryPrefix) return null;
        
        let possibleNames: string[] = [];
        
        if (categoryPrefix) {
          possibleNames = [
            `${categoryPrefix}-${materialType}`,   // B类布-雪尼尔绒
            `${categoryPrefix}${materialType}`,    // B类雪尼尔绒
            `${categoryPrefix}—${materialType}`,   // 中文破折号
          ];
          
          if (categoryPrefix.length <= 2) {
            possibleNames.push(`${categoryPrefix}类${materialType}`);
          }
        } else {
          possibleNames = [materialType];
        }
        
        possibleNames = [...new Set(possibleNames)].filter(n => n);
        console.log(`  尝试匹配类别名: [${possibleNames.join(', ')}]`);
        
        // 在类别前缀列表中查找匹配
        for (const name of possibleNames) {
          const matched = categoryPrefixes.find(prefix => 
            prefix === name || prefix.toLowerCase() === name.toLowerCase()
          );
          if (matched) {
            console.log(`✓ 颜色筛选匹配类别: "${matched}"`);
            return matched;
          }
        }
        
        // 方法3：模糊匹配 - 检查类别前缀是否包含关键词（必须等级也匹配）
        if (materialType && categoryPrefix) {
          const fuzzyMatch = categoryPrefixes.find(prefix => {
            // 必须同时满足：
            // 1. 前缀以相同的等级开头（如 A类、B类、A+类）
            // 2. 包含材质类型
            const prefixGradeMatch = prefix.match(/^([A-Ea-e][+]?)(类)?/);
            const inputGradeMatch = categoryPrefix.match(/^([A-Ea-e][+]?)(类)?/);
            if (!prefixGradeMatch || !inputGradeMatch) return false;
            
            // 等级必须完全匹配（A 只能匹配 A，不能匹配 B）
            const prefixGrade = prefixGradeMatch[1].toUpperCase();
            const inputGrade = inputGradeMatch[1].toUpperCase();
            if (prefixGrade !== inputGrade) return false;
            
            // 还需要包含材质类型
            const containsType = prefix.includes(materialType);
            return containsType;
          });
          if (fuzzyMatch) {
            console.log(`✓ 颜色筛选模糊匹配: "${fuzzyMatch}"`);
            return fuzzyMatch;
          }
        }
        
        console.log(`⚠️ 颜色筛选: 未找到匹配的材质类别`);
        return null;
      };

      // 解析材质文本，支持加价格式如 "类别名+1000" 或 "类别名"
      // colorFilterCategory: 从颜色字段解析出的材质类别（如"A类泰迪绒"），用于精确筛选
      // 返回 { names: 材质名称列表, upgradePrice: 加价金额, categoryName: 类别名称（用于加价） }
      const parseMaterialText = (text: string, colorFilterCategory: string | null = null): { names: string[], upgradePrice: number, categoryName: string } => {
        if (!text) return { names: [], upgradePrice: 0, categoryName: '' };
        
        const matchedNames: string[] = [];
        let totalUpgradePrice = 0;
        let matchedCategoryName = ''; // 记录匹配到的类别名称
        
        // 【最优先】如果有颜色筛选类别，直接使用它作为前缀来筛选材质
        if (colorFilterCategory) {
          console.log(`  使用颜色筛选: "${colorFilterCategory}"`);
          matchedCategoryName = colorFilterCategory;
          
          // 获取所有以该类别开头的材质
          // 例如：颜色="A类油蜡皮"，则获取所有以"A类油蜡皮-"开头的材质
          const allCategorySkus = allMaterials
            .filter(m => m.name.startsWith(colorFilterCategory + '-') || 
                         m.name.startsWith(colorFilterCategory + '—'))
            .map(m => m.name);
          
          console.log(`  类别 "${colorFilterCategory}" 下共有 ${allCategorySkus.length} 个SKU`);
          
          // 解析面料列中的内容，用于进一步筛选
          const entries = text.split(/[\n,，、]/).map(s => s.trim()).filter(s => s);
          const filterKeywords: string[] = [];
          
          entries.forEach(entry => {
            // 解析加价格式
            const priceMatch = entry.match(/^(.+?)\s*[+＋]\s*(\d+)$/);
            if (priceMatch) {
              totalUpgradePrice = parseInt(priceMatch[2]) || 0;
              const keyword = priceMatch[1].trim();
              if (keyword) filterKeywords.push(keyword);
              console.log(`  解析: "${entry}" -> 关键词="${keyword}", 加价=${totalUpgradePrice}元`);
            } else if (entry) {
              filterKeywords.push(entry);
              console.log(`  关键词: "${entry}"`);
            }
          });
          
          // 如果面料列有具体的筛选关键词，使用它们来筛选
          if (filterKeywords.length > 0) {
            console.log(`  使用关键词筛选: [${filterKeywords.join(', ')}]`);
            
            // 检查是否面料列内容就是类别名称本身（如面料列="A类油蜡皮"，颜色列也是"A类油蜡皮"）
            const isCategoryName = filterKeywords.some(kw => 
              kw === colorFilterCategory || 
              colorFilterCategory.includes(kw) ||
              kw.includes(colorFilterCategory.replace(/类$/, ''))
            );
            
            if (isCategoryName) {
              // 面料列填的就是类别名，返回该类别下的所有材质
              matchedNames.push(...allCategorySkus);
              console.log(`✓ 面料列内容是类别名，使用类别下所有 ${allCategorySkus.length} 个SKU`);
            } else {
              // 面料列填的是具体颜色名（如"希腊"），进行精确筛选
              filterKeywords.forEach(keyword => {
                // 筛选包含该关键词的材质（必须在类别范围内）
                const filtered = allCategorySkus.filter(sku => {
                  // 从材质名称中提取 SKU 部分（类别后面的部分）
                  const skuPart = sku.replace(colorFilterCategory + '-', '')
                                     .replace(colorFilterCategory + '—', '');
                  // 检查 SKU 部分是否以关键词开头或包含关键词
                  return skuPart.startsWith(keyword + '-') || 
                         skuPart.startsWith(keyword + '—') ||
                         skuPart === keyword ||
                         skuPart.includes('-' + keyword + '-') ||
                         skuPart.includes('-' + keyword);
                });
                
                if (filtered.length > 0) {
                  matchedNames.push(...filtered);
                  console.log(`✓ 关键词 "${keyword}" 匹配: ${filtered.length} 个SKU`);
                } else {
                  console.log(`⚠️ 关键词 "${keyword}" 未匹配到任何SKU`);
                }
              });
            }
          } else {
            // 面料列为空，不添加任何材质
            console.log(`  ⚠️ 面料列为空，不自动添加材质`);
          }
          
          if (matchedNames.length > 0) {
            console.log(`✓ 最终匹配: ${matchedNames.length} 个SKU，前3个: ${matchedNames.slice(0, 3).join(', ')}`);
          } else {
            console.log(`⚠️ 颜色筛选未找到匹配的SKU: "${colorFilterCategory}"`);
          }
          
          // 返回颜色筛选结果
          return { names: [...new Set(matchedNames)], upgradePrice: totalUpgradePrice, categoryName: matchedCategoryName };
        }
        
        // 如果没有颜色筛选或颜色筛选失败，按原有逻辑处理面料列
        // 按换行符/逗号分割多个材质条目
        const entries = text.split(/[\n,，、]/).map(s => s.trim()).filter(s => s);
        
        entries.forEach(entry => {
          // 解析加价格式，支持多种格式:
          // "纳帕A级皮+1000" / "纳帕A级皮 +1000" / "纳帕A级皮＋1000" / "纳帕A级皮 + 1000"
          const priceMatch = entry.match(/^(.+?)\s*[+＋]\s*(\d+)$/);
          let categoryName = entry;
          let upgradePrice = 0;
          
          if (priceMatch) {
            categoryName = priceMatch[1].trim();
            upgradePrice = parseInt(priceMatch[2]) || 0;
            totalUpgradePrice = upgradePrice;
            console.log(`✓ 解析加价: "${entry}" -> 类别="${categoryName}", 加价=${upgradePrice}元`);
          } else {
            console.log(`  解析材质: "${entry}" (无加价)`);
          }
          
          let found = false;
          
          // 1. 在类别材质中查找匹配的（isCategory=true的材质，如"纳帕A级皮"）
          const matchedCategory = categoryMaterials.find(m => m.name === categoryName);
          if (matchedCategory) {
            // 只要找到类别材质，就记录类别名称（用于加价），不管有没有找到SKU
            matchedCategoryName = matchedCategory.name;
            found = true; // 找到类别即视为找到
            
            // 方式1: 通过名称前缀匹配（SKU名称以类别名称开头，如"纳帕A级皮-纳帕黑"以"纳帕A级皮"开头）
            const childSkus = skuMaterials
              .filter(m => m.name.startsWith(matchedCategory.name + '-') || m.name.startsWith(matchedCategory.name + '—'))
              .map(m => m.name);
            
            if (childSkus.length > 0) {
              matchedNames.push(...childSkus);
              console.log(`✓ 类别材质匹配(名称前缀): "${categoryName}" -> 找到SKU: ${childSkus.join(', ')}`);
            } else {
              // 方式2: 通过相同categoryId匹配，且名称包含类别名称
              const sameCatSkus = skuMaterials
                .filter(m => m.categoryId === matchedCategory.categoryId && m.name.includes(matchedCategory.name))
                .map(m => m.name);
              if (sameCatSkus.length > 0) {
                matchedNames.push(...sameCatSkus);
                console.log(`✓ 类别材质匹配(同分类): "${categoryName}" -> 找到SKU: ${sameCatSkus.join(', ')}`);
              } else {
                console.log(`✓ 类别材质匹配: "${categoryName}" (无SKU，但加价已记录)`);
              }
            }
          }
          
          // 2. 如果没找到类别材质，在MaterialCategory表中查找
          if (!found) {
            materialCategories.forEach(cat => {
              if (cat.name === categoryName) {
                const catSkus = skuMaterials
                  .filter(m => m.categoryId === cat._id)
                  .map(m => m.name);
                if (catSkus.length > 0) {
                  matchedNames.push(...catSkus);
                  found = true;
                  console.log(`✓ 分类表匹配: "${categoryName}" -> 找到SKU: ${catSkus.join(', ')}`);
                }
              }
            });
          }
          
          // 3. 如果还是没找到，尝试直接匹配SKU材质名称
          if (!found) {
            const directMatch = skuMaterials.find(m => m.name === categoryName);
            if (directMatch) {
              matchedNames.push(directMatch.name);
              found = true;
              console.log(`✓ 直接匹配SKU: "${categoryName}" -> "${directMatch.name}"`);
            }
          }
          
          if (!found) {
            console.log(`❌ 未找到匹配: "${categoryName}"`);
          }
        });
        
        return { names: [...new Set(matchedNames)], upgradePrice: totalUpgradePrice, categoryName: matchedCategoryName };
      };

      const header = jsonData[0] || [];
      console.log('表头:', header);
      console.log('表头各列:', header.map((h: any, i: number) => `[${i}]${h}`).join(', '));

      // 动态解析表头，找出颜色列和材质列的位置
      // 固定列索引: 商品名称(0)、型号(1)、商品型号(2)、类别(3)、规格(4)、长宽高(5)
      // 颜色列可能在第6列，也可能不存在
      // 材质列从颜色列之后开始，直到遇到"标价"列
      let materialColumns: { index: number; name: string }[] = [];
      let priceColumnIndex = -1;
      let colorColumnIndex = -1; // 颜色列索引，-1表示不存在
      
      // 在表头中查找"颜色"列
      for (let i = 0; i < header.length; i++) {
        const colName = (header[i] || '').toString().trim();
        if (colName === '颜色') {
          colorColumnIndex = i;
          console.log(`✓ 找到颜色列: 索引=${i}`);
          break;
        }
      }
      
      const hasColorColumn = colorColumnIndex >= 0;
      // 材质列从颜色列之后开始，或从第6列开始（如果没有颜色列）
      const materialStartIndex = hasColorColumn ? colorColumnIndex + 1 : 6;
      
      console.log('颜色列索引:', colorColumnIndex, '是否有颜色列:', hasColorColumn, '材质起始列:', materialStartIndex);
      
      for (let i = materialStartIndex; i < header.length; i++) {
        const colName = (header[i] || '').toString().trim();
        if (colName === '标价') {
          priceColumnIndex = i;
          break;
        }
        if (colName && colName !== '颜色') { // 排除颜色列
          materialColumns.push({ index: i, name: colName });
        }
      }

      // 如果没找到"标价"列，使用默认位置
      if (priceColumnIndex === -1) {
        // 兼容旧模板：颜色(6)、面料(7)、填充(8)、框架(9)、脚架(10)、标价(11)
        materialColumns = [
          { index: 7, name: '面料' },
          { index: 8, name: '填充' },
          { index: 9, name: '框架' },
          { index: 10, name: '脚架' },
        ];
        priceColumnIndex = 11;
      }

      console.log('材质列:', materialColumns);
      console.log('标价列索引:', priceColumnIndex);

      // 计算后续列的索引
      const discountPriceIndex = priceColumnIndex + 1;
      const proIndex = priceColumnIndex + 2;
      const proFeatureIndex = priceColumnIndex + 3;
      const styleTagIndex = priceColumnIndex + 4;
      const imageStartIndex = priceColumnIndex + 5;

      const rows = jsonData.slice(1).filter((row: any[]) => row && row.length > 0 && row[0] && row[0].toString().trim() !== '');

      // 使用 商品名称+主型号 作为唯一键来合并SKU
      const productMap = new Map<string, any>();

      rows.forEach((row: any[], rowIndex) => {
        const productName = (row[0] || '').toString().trim();
        if (!productName) return;

        // 固定列
        const mainCode = (row[1] || '').toString().trim(); // 型号 = 主型号
        const subCode = (row[2] || '').toString().trim();  // 商品型号 = 副型号
        const categoryName = (row[3] || '').toString().trim();
        const spec = (row[4] || '').toString().trim();
        const dimensions = (row[5] || '').toString().trim();
        
        // 读取颜色字段（如果存在）
        const colorText = hasColorColumn ? (row[colorColumnIndex] || '').toString().trim() : '';
        console.log(`===== 行${rowIndex + 2} 颜色字段: "${colorText}" =====`);
        
        // 解析颜色字段，获取材质类别筛选信息
        const colorInfo = parseColorField(colorText);
        const colorFilterCategory = findMaterialCategoryByColor(colorInfo, colorText);
        console.log(`  颜色筛选类别: ${colorFilterCategory || '无（使用常规匹配）'}`);
        
        // 打印更详细的调试信息
        if (colorInfo) {
          console.log(`  颜色解析结果: 前缀="${colorInfo.categoryPrefix}", 类型="${colorInfo.materialType}", 干扰词=${colorInfo.skipMaterial}`);
        } else {
          console.log(`  颜色解析结果: null（颜色字段为空或格式不对）`);
        }

        // 动态解析材质列 - 支持加价格式如 "类别名+1000"
        const materialData: Record<string, string[]> = {};
        const materialUpgradePrices: Record<string, number> = {};
        
        console.log(`===== 行${rowIndex + 2} 材质解析 =====`);
        materialColumns.forEach(col => {
          const text = (row[col.index] || '').toString().trim();
          console.log(`  ${col.name}列(${col.index}): 原始文本="${text}"`);
          
          // 对于面料列，如果有颜色筛选类别则使用；否则使用常规匹配
          // 注意：干扰词时使用常规匹配，不跳过
          const useColorFilter = (col.name === '面料' && colorFilterCategory) ? colorFilterCategory : null;
          
          if (col.name === '面料') {
            if (colorFilterCategory) {
              console.log(`  ${col.name}列: 使用颜色筛选 "${colorFilterCategory}"`);
            } else {
              console.log(`  ${col.name}列: 无有效颜色筛选，使用常规匹配`);
            }
          }
          
          // 解析材质文本，获取材质名称和加价
          const parsed = parseMaterialText(text, useColorFilter);
          materialData[col.name] = parsed.names;
          if (parsed.upgradePrice > 0) {
            // 将加价保存到类别材质名上（如"纳帕A级皮"），而不是列名（如"面料"）
            // 这样前端才能正确匹配材质加价
            const priceKey = parsed.categoryName || col.name;
            materialUpgradePrices[priceKey] = parsed.upgradePrice;
            console.log(`  ${col.name}列 加价: ${parsed.upgradePrice}元 -> 保存到键: "${priceKey}"`);
          }
          console.log(`  ${col.name}列 匹配到的材质: [${parsed.names.join(', ')}]`);
        });
        console.log(`  材质加价汇总:`, materialUpgradePrices);

        // 后续列
        const price = parseFloat((row[priceColumnIndex]?.toString() || '').replace(/[^\d.]/g, '')) || 0;
        const discountPrice = parseFloat((row[discountPriceIndex]?.toString() || '').replace(/[^\d.]/g, '')) || 0;
        const isPro = row[proIndex] === '是' || row[proIndex] === 'PRO' || false;
        const proFeature = (row[proFeatureIndex] || '').toString().trim();
        const styleTagText = (row[styleTagIndex] || '').toString().trim();
        // 解析多个风格标签，支持逗号/顿号分隔（如：中古风、现代风）
        const styleTags = styleTagText.split(/[,，、\n]/).map(s => s.trim()).filter(s => s);

        // 收集图片列（从imageStartIndex开始，最多7张）
        const images: string[] = [];
        console.log(`===== 行${rowIndex + 2} 图片解析 =====`);
        console.log(`  标价列索引: ${priceColumnIndex}, 图片起始索引: ${imageStartIndex}, 行数据长度: ${row.length}`);
        for (let i = imageStartIndex; i < imageStartIndex + 7 && i < row.length; i++) {
          const cellValue = row[i];
          const img = (cellValue || '').toString().trim();
          if (img) {
            // 过滤掉Excel内嵌图片公式（如 =DISPIMG("ID_xxx",1)）
            if (img.startsWith('=DISPIMG') || img.startsWith('=dispimg')) {
              console.log(`  列${i}: 跳过Excel内嵌图片公式: ${img.substring(0, 30)}...`);
              continue;
            }
            // 只接受有效的URL格式
            if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('/')) {
              images.push(img);
              console.log(`  列${i}: 有效图片URL: ${img}`);
            } else {
              console.log(`  列${i}: 跳过无效图片格式: ${img.substring(0, 30)}...`);
            }
          }
        }
        console.log(`  最终收集到的图片: ${images.length}张`);

        // 解析长宽高
        const cleanDimensions = dimensions.replace(/\s+/g, '');
        const dimensionParts = cleanDimensions.split('*');
        const length = dimensionParts[0] ? parseInt(dimensionParts[0].replace(/[^\d]/g, '')) || 0 : 0;
        const width = dimensionParts[1] ? parseInt(dimensionParts[1].replace(/[^\d]/g, '')) || 0 : 0;
        const height = dimensionParts[2] ? parseInt(dimensionParts[2].replace(/[^\d]/g, '')) || 0 : 0;

        // 自动匹配分类
        let matchedCategory = '';
        let matchedCategoryName = '';
        
        // 1. 精确匹配分类名称
        const exactMatch = categories.find(cat => cat.name === categoryName);
        if (exactMatch) {
          matchedCategory = exactMatch._id;
          matchedCategoryName = exactMatch.name;
          console.log(`✓ 分类精确匹配: "${categoryName}" -> "${exactMatch.name}" (${exactMatch._id})`);
        }
        
        // 2. 模糊匹配（包含关系）
        if (!matchedCategory) {
          const fuzzyMatch = categories.find(cat => 
            cat.name.includes(categoryName) || categoryName.includes(cat.name)
          );
          if (fuzzyMatch) {
            matchedCategory = fuzzyMatch._id;
            matchedCategoryName = fuzzyMatch.name;
            console.log(`✓ 分类模糊匹配: "${categoryName}" -> "${fuzzyMatch.name}" (${fuzzyMatch._id})`);
          }
        }
        
        // 3. 使用slug匹配
        if (!matchedCategory) {
          const slugMatch = categories.find(cat => cat.slug === categoryName.toLowerCase());
          if (slugMatch) {
            matchedCategory = slugMatch._id;
            matchedCategoryName = slugMatch.name;
            console.log(`✓ 分类slug匹配: "${categoryName}" -> "${slugMatch.name}" (${slugMatch._id})`);
          }
        }
        
        // 4. 默认使用第一个分类或'sofa'
        if (!matchedCategory) {
          if (categories.length > 0) {
            matchedCategory = categories[0]._id;
            matchedCategoryName = categories[0].name;
            console.log(`⚠️ 分类未匹配，使用默认: "${categoryName}" -> "${categories[0].name}" (${categories[0]._id})`);
          } else {
            matchedCategory = 'sofa';
            console.log(`⚠️ 分类列表为空，使用默认: "${categoryName}" -> "sofa"`);
          }
        }
        
        console.log(`📋 可用分类: [${categories.map(c => c.name).join(', ')}]`);

        // 使用 商品名称+主型号 作为合并键
        const productKey = `${productName}|${mainCode}`;
        const skuIndex = productMap.has(productKey) ? productMap.get(productKey)!.skus.length + 1 : 1;

        // 构建SKU材质数据 - 使用动态材质类目，存储材质名称（不是ID）
        const skuMaterial: Record<string, string[]> = {};
        const skuMaterialCategories: string[] = [];
        
        materialColumns.forEach(col => {
          if (materialData[col.name] && materialData[col.name].length > 0) {
            skuMaterial[col.name] = materialData[col.name]; // 存储材质名称列表
            skuMaterialCategories.push(col.name); // 记录已配置的材质类目
          }
        });

        const skuData = {
          code: subCode || `${mainCode}-SKU${skuIndex}`, // 副型号作为SKU编码
          spec,
          length,
          width,
          height,
          // 动态材质字段 - 存储材质名称列表（不是ID！）
          material: skuMaterial,
          materialCategories: skuMaterialCategories, // 已配置的材质类目列表
          materialUpgradePrices: materialUpgradePrices, // 材质升级价格（如 {面料: 1000}）
          price,
          discountPrice,
          stock: 0,
          sales: 0,
          isPro,
          proFeature,
          images,
        };

        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            name: productName,
            productCode: mainCode, // 主型号
            subCodes: subCode ? [subCode] : [], // 副型号列表
            category: matchedCategory,
            categoryName,
            styleTags, // 多个风格标签
            skus: [skuData],
            specifications: [],
            firstImages: images.length > 0 ? [...images] : [], // 第一个SKU的图片作为商品主图
          });
        } else {
          const product = productMap.get(productKey)!;
          product.skus.push(skuData);
          // 收集所有副型号（去重）
          if (subCode && !product.subCodes.includes(subCode)) {
            product.subCodes.push(subCode);
          }
          // 如果商品还没有图片，使用第一个有图片的SKU
          if (product.firstImages.length === 0 && images.length > 0) {
            product.firstImages = [...images];
          }
        }

        // 添加规格信息
        const product = productMap.get(productKey)!;
        if (!product.specifications.some((s: any) => s.name === spec) && spec && length && width && height) {
          product.specifications.push({ name: spec, length, width, height, unit: 'CM' });
        }
      });

      let importedCount = 0, updatedCount = 0, totalSkuCount = 0;
      const response = await getProducts({ pageSize: 10000 });
      const allProducts = response.success ? response.data : [];

      for (const [productKey, productData] of productMap.entries()) {
        // 查找已存在的商品（按名称匹配）
        const existingProduct = allProducts.find((p: any) => p.name === productData.name);

        // 构建SKU数据 - 包含材质名称、材质类目和升级价格
        const buildSkus = (skuList: any[]) => skuList.map((sku: any, index: number) => ({
          code: sku.code || `SKU-${Date.now()}-${index + 1}`,
          color: sku.spec || '默认',
          spec: sku.spec,
          length: sku.length,
          width: sku.width,
          height: sku.height,
          material: sku.material || {}, // 材质名称列表（按类目分组）
          materialCategories: sku.materialCategories || [], // 已配置的材质类目
          materialUpgradePrices: sku.materialUpgradePrices || {}, // 材质升级价格
          stock: sku.stock || 0,
          price: sku.price,
          discountPrice: sku.discountPrice,
          images: sku.images || [],
          isPro: sku.isPro,
          proFeature: sku.proFeature,
        }));

        if (existingProduct) {
          const newSkus = buildSkus(productData.skus);
          const existingSpecs = existingProduct.specifications || {};
          const newSpecs = { ...existingSpecs };
          productData.specifications.forEach((spec: any) => {
            if (!newSpecs[spec.name]) {
              newSpecs[spec.name] = `${spec.length}x${spec.width}x${spec.height}${spec.unit}`;
            }
          });

          // 合并风格标签（支持多个标签）
          const existingStyles = existingProduct.styles || [];
          const newStyleTags = productData.styleTags || [];
          const mergedStyles = [...new Set([...existingStyles, ...newStyleTags])];

          await updateProduct(existingProduct._id, {
            productCode: productData.productCode || existingProduct.productCode, // 更新主型号
            subCodes: [...new Set([...(existingProduct.subCodes || []), ...productData.subCodes])], // 合并副型号
            skus: [...existingProduct.skus, ...newSkus],
            specifications: newSpecs,
            styles: mergedStyles, // 风格标签（多个）
            images: existingProduct.images?.length > 0 ? existingProduct.images : productData.firstImages, // 保留原图或使用新图
          });
          updatedCount++;
          totalSkuCount += newSkus.length;
        } else {
          const specifications = productData.specifications.reduce((acc: any, spec: any) => {
            acc[spec.name] = `${spec.length}x${spec.width}x${spec.height}${spec.unit}`;
            return acc;
          }, {});

          const builtSkus = buildSkus(productData.skus);
          console.log(`===== 创建商品: ${productData.name} =====`);
          console.log(`  商品主图(firstImages):`, productData.firstImages);
          console.log(`  SKU数量:`, builtSkus.length);
          builtSkus.forEach((sku: any, idx: number) => {
            console.log(`  SKU${idx + 1} 图片:`, sku.images);
          });
          
          const newProduct = {
            name: productData.name,
            productCode: productData.productCode, // 主型号
            subCodes: productData.subCodes, // 副型号列表
            description: `${productData.name}系列商品`,
            category: productData.category as any,
            basePrice: productData.skus[0].price || 0,
            images: productData.firstImages || [], // 第一个SKU的第一张图作为商品头图
            skus: builtSkus,
            isCombo: false,
            specifications,
            status: 'active' as any,
            views: 0,
            sales: 0,
            rating: 0,
            reviews: 0,
            styles: productData.styleTags || [], // 风格标签（多个）
          };

          console.log(`  📋 分类信息: productData.category="${productData.category}", categoryName="${productData.categoryName}"`);
          console.log(`  最终提交的商品数据:`, JSON.stringify(newProduct, null, 2));
          await createProduct(newProduct);
          importedCount++;
          totalSkuCount += productData.skus.length;
        }
      }

      toast.success(`成功导入 ${importedCount} 个新商品，更新 ${updatedCount} 个商品（共 ${totalSkuCount} 个SKU）`);
      await loadProducts();
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请检查文件格式');
    }
  };

  const handleImportTable = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[];
      processImportedData(jsonData);
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 批量图片上传处理 - 支持文件夹上传
  // 按文件夹名称匹配商品，图片按顺序排列
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setBatchImageUploading(true)
    const toastId = toast.loading(`正在分析 ${files.length} 张图片...`)
    
    try {
      // 图片排序函数：正视图(1) > 侧视图(2) > 背面图(3) > 4宫格细节图(4-7) > 其他
      const getImageSortOrder = (fileName: string): number => {
        const lowerName = fileName.toLowerCase()
        // 正视图
        if (lowerName.includes('正视') || lowerName.includes('正面') || lowerName.includes('front') || lowerName.includes('主图')) return 1
        // 侧视图
        if (lowerName.includes('侧视') || lowerName.includes('侧面') || lowerName.includes('side')) return 2
        // 背面图
        if (lowerName.includes('背面') || lowerName.includes('背视') || lowerName.includes('back') || lowerName.includes('后面')) return 3
        // 4宫格细节图
        if (lowerName.includes('细节') || lowerName.includes('detail') || lowerName.includes('4宫格') || lowerName.includes('宫格')) return 4
        // 按文件名中的序号排序
        const numMatch = fileName.match(/[_-]?(\d+)\./);
        if (numMatch) return 10 + parseInt(numMatch[1])
        return 100
      }
      
      // 对文件列表按图片类型排序
      const sortImageFiles = (files: File[]): File[] => {
        return [...files].sort((a, b) => getImageSortOrder(a.name) - getImageSortOrder(b.name))
      }
      
      // 按文件夹分组图片（支持文件夹上传）
      const imageGroups: Record<string, File[]> = {}
      
      for (const file of Array.from(files)) {
        // 获取文件夹名称（从 webkitRelativePath 提取）
        const relativePath = (file as any).webkitRelativePath || file.name
        const pathParts = relativePath.split('/')
        
        // 如果有文件夹路径，使用文件夹名称；否则从文件名提取关键词
        let folderName: string
        if (pathParts.length > 1) {
          // 使用第一级文件夹名称作为商品匹配关键词
          folderName = pathParts[0].trim()
        } else {
          // 兼容直接选择图片的情况，从文件名提取
          const nameWithoutExt = file.name.replace(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|svg|ico|heic|heif|avif|raw)$/i, '').trim()
          folderName = nameWithoutExt
            .replace(/[\s_-]*[（(]?\d+[）)]?$/, '')
            .replace(/[\s_-]*多角度图?$/i, '')
            .replace(/[\s_-]*效果图?$/i, '')
            .replace(/[\s_-]*[LlRr][型形]?沙发$/i, '')
            .replace(/[\s_-]*[a-zA-Z]级?$/i, '')
            .trim()
          
          // 如果包含"沙发"且后面还有内容，截取到沙发
          const sofaIndex = folderName.indexOf('沙发')
          if (sofaIndex > 0 && sofaIndex < folderName.length - 2) {
            folderName = folderName.substring(0, sofaIndex + 2)
          }
        }
        
        if (!imageGroups[folderName]) {
          imageGroups[folderName] = []
        }
        imageGroups[folderName].push(file)
      }
      
      console.log('📁 文件夹分组:', Object.keys(imageGroups).map(k => `${k} (${imageGroups[k].length}张)`))
      
      // 匹配商品
      const autoImportList: { keyword: string, files: File[], product: Product }[] = []
      const pendingList: PendingImageMatch[] = []
      const notFoundList: string[] = []
      
      for (const [keyword, groupFiles] of Object.entries(imageGroups)) {
        // 在商品库中搜索匹配的商品（优先精确匹配）
        let matchedProducts: Product[] = []
        
        // 1. 精确匹配：商品名完全等于关键词
        matchedProducts = products.filter(p => p.name === keyword)
        
        // 2. 商品名包含关键词（关键词是商品名的一部分）
        if (matchedProducts.length === 0) {
          matchedProducts = products.filter(p => p.name.includes(keyword))
        }
        
        // 3. 关键词包含商品名（商品名是关键词的一部分）- 但要求商品名至少4个字符，避免匹配太短的名称
        if (matchedProducts.length === 0) {
          matchedProducts = products.filter(p => 
            p.name.length >= 4 && keyword.includes(p.name)
          )
        }
        
        console.log(`关键词 "${keyword}" 匹配到 ${matchedProducts.length} 个商品:`, matchedProducts.map(p => p.name))
        
        if (matchedProducts.length === 0) {
          // 没有匹配
          notFoundList.push(keyword)
        } else if (matchedProducts.length === 1) {
          // 唯一匹配，自动导入
          autoImportList.push({ keyword, files: groupFiles, product: matchedProducts[0] })
        } else {
          // 多个匹配，需要手动确认
          pendingList.push({
            keyword,
            files: groupFiles,
            matchedProducts,
            selectedProductIds: [] // 默认不选中任何商品
          })
        }
      }
      
      toast.dismiss(toastId)
      
      // 自动导入唯一匹配的图片
      if (autoImportList.length > 0) {
        const uploadToastId = toast.loading(`正在上传 ${autoImportList.length} 组图片...`)
        let uploadedCount = 0
        
        for (const { keyword, files: groupFiles, product } of autoImportList) {
          const uploadedUrls: string[] = []
          // 按图片类型排序：正视图 > 侧视图 > 背面图 > 细节图 > 其他
          const sortedFiles = sortImageFiles(groupFiles)
          for (const file of sortedFiles) {
            const result = await uploadFile(file)
            const fileId = result?.fileId || result?.data?.fileId || result?.id
            if (fileId) {
              uploadedUrls.push(fileId)
              uploadedCount++
            }
          }
          
          if (uploadedUrls.length > 0) {
            // 更新商品主图
            const newImages = [...uploadedUrls, ...(product.images || [])]
            
            // 同时更新所有 SKU 的图片
            const updatedSkus = (product.skus || []).map(sku => ({
              ...sku,
              images: [...uploadedUrls, ...(sku.images || [])]
            }))
            
            await updateProduct(product._id, { 
              images: newImages,
              skus: updatedSkus
            })
            console.log(`✅ 商品 "${product.name}" 导入了 ${uploadedUrls.length} 张图片到主图和 ${updatedSkus.length} 个SKU`)
          }
        }
        
        toast.dismiss(uploadToastId)
        toast.success(`自动导入完成！${autoImportList.length} 个商品，${uploadedCount} 张图片`)
        await loadProducts()
      }
      
      // 显示未匹配的提示
      if (notFoundList.length > 0) {
        toast.warning(`${notFoundList.length} 组图片未找到匹配商品: ${notFoundList.slice(0, 3).join(', ')}${notFoundList.length > 3 ? '...' : ''}`)
      }
      
      // 如果有需要确认的，显示弹框
      if (pendingList.length > 0) {
        setPendingMatches(pendingList)
        setShowMatchConfirmModal(true)
      }
      
    } catch (error) {
      console.error('批量图片上传失败:', error)
      toast.dismiss(toastId)
      toast.error('批量图片上传失败')
    } finally {
      setBatchImageUploading(false)
      e.target.value = ''
    }
  }

  // ZIP压缩包批量图片上传
  // 压缩包结构：每个文件夹对应一个商品，文件夹名称用于匹配商品
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('请上传 ZIP 格式的压缩包')
      return
    }
    
    setBatchImageUploading(true)
    const toastId = toast.loading('正在解压压缩包...')
    
    // 从压缩包文件名提取商品名（如 "范思哲A级.zip" -> "范思哲A级"）
    const zipFileName = file.name.replace(/\.zip$/i, '').trim()
    console.log('📦 压缩包文件名:', zipFileName)
    
    try {
      const zip = await JSZip.loadAsync(file)
      
      // 图片排序函数：正视图(1) > 侧视图(2) > 背面图(3) > 4宫格细节图(4) > 其他
      const getImageSortOrder = (fileName: string): number => {
        const lowerName = fileName.toLowerCase()
        if (lowerName.includes('正视') || lowerName.includes('正面') || lowerName.includes('front') || lowerName.includes('主图')) return 1
        if (lowerName.includes('侧视') || lowerName.includes('侧面') || lowerName.includes('side')) return 2
        if (lowerName.includes('背面') || lowerName.includes('背视') || lowerName.includes('back') || lowerName.includes('后面')) return 3
        if (lowerName.includes('细节') || lowerName.includes('detail') || lowerName.includes('4宫格') || lowerName.includes('宫格')) return 4
        const numMatch = fileName.match(/[_-]?(\d+)\./);
        if (numMatch) return 10 + parseInt(numMatch[1])
        return 100
      }
      
      // 按文件夹分组图片
      const folderGroups: Record<string, { name: string, blob: Promise<Blob> }[]> = {}
      
      // 先收集所有文件路径用于调试
      const allPaths = Object.keys(zip.files).filter(p => !zip.files[p].dir)
      console.log('📦 压缩包内容:', allPaths.slice(0, 10), allPaths.length > 10 ? `...共${allPaths.length}个文件` : '')
      
      // 检查是否所有图片都在根目录（没有子文件夹）
      const hasSubfolders = allPaths.some(p => p.includes('/') && !p.startsWith('__MACOSX'))
      console.log('📁 是否有子文件夹:', hasSubfolders)
      
      for (const [path, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue
        // 跳过 Mac 系统文件
        if (path.startsWith('__MACOSX') || path.includes('/.')) continue
        
        // 只处理图片文件
        const ext = path.split('.').pop()?.toLowerCase()
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'].includes(ext || '')) continue
        
        const pathParts = path.split('/').filter(p => p && !p.startsWith('.'))
        let folderName: string
        let fileName: string = pathParts[pathParts.length - 1]
        
        if (!hasSubfolders || pathParts.length <= 1) {
          // 图片直接在根目录，使用压缩包文件名作为商品名
          folderName = zipFileName
        } else if (pathParts.length >= 2) {
          // 有子文件夹
          if (pathParts.length >= 3) {
            // 三级结构：根/商品/图片 -> 使用第二级作为商品名
            folderName = pathParts[1].trim()
          } else {
            // 两级结构：商品/图片 -> 使用第一级作为商品名
            folderName = pathParts[0].trim()
          }
        } else {
          folderName = zipFileName
        }
        
        if (!folderName) continue
        
        if (!folderGroups[folderName]) {
          folderGroups[folderName] = []
        }
        
        folderGroups[folderName].push({
          name: fileName,
          blob: zipEntry.async('blob')
        })
      }
      
      const folderCount = Object.keys(folderGroups).length
      console.log('📁 识别到的商品分组:', Object.keys(folderGroups))
      
      if (folderCount === 0) {
        toast.dismiss(toastId)
        toast.error('压缩包中没有找到有效的图片，请确保压缩包包含 jpg/png/gif/webp 格式的图片')
        return
      }
      
      console.log('📦 解压完成，发现', folderCount, '个文件夹:', Object.keys(folderGroups))
      toast.dismiss(toastId)
      
      // 匹配商品并上传
      const uploadToastId = toast.loading(`正在处理 ${folderCount} 个文件夹...`)
      let successCount = 0
      let failCount = 0
      const notMatchedFolders: string[] = []
      
      for (const [folderName, files] of Object.entries(folderGroups)) {
        // 匹配商品（优先级：精确匹配 > 商品名包含文件夹名 > 文件夹名包含商品名）
        let matchedProduct: Product | undefined
        
        // 1. 精确匹配
        matchedProduct = products.find(p => p.name === folderName)
        
        // 2. 商品名包含文件夹名（如 "月亮沙发A级" 包含 "月亮沙发"）
        if (!matchedProduct && folderName.length >= 2) {
          matchedProduct = products.find(p => p.name.includes(folderName))
        }
        
        // 3. 文件夹名包含商品名（商品名至少4个字符，避免匹配太短的名字）
        if (!matchedProduct) {
          matchedProduct = products.find(p => p.name.length >= 4 && folderName.includes(p.name))
        }
        
        // 4. 如果文件夹名只有数字，尝试匹配商品名以该数字结尾
        if (!matchedProduct && /^\d+$/.test(folderName)) {
          matchedProduct = products.find(p => p.name.endsWith(folderName))
        }
        
        if (!matchedProduct) {
          console.log(`❌ 文件夹 "${folderName}" 未找到匹配商品`)
          failCount++
          notMatchedFolders.push(folderName)
          continue
        }
        
        console.log(`✓ 文件夹 "${folderName}" 匹配到商品 "${matchedProduct.name}"`)
        
        // 按图片类型排序
        const sortedFiles = [...files].sort((a, b) => getImageSortOrder(a.name) - getImageSortOrder(b.name))
        
        // 上传图片
        const uploadedUrls: string[] = []
        for (const fileInfo of sortedFiles) {
          try {
            const blob = await fileInfo.blob
            const imageFile = new File([blob], fileInfo.name, { type: `image/${fileInfo.name.split('.').pop()}` })
            const result = await uploadFile(imageFile)
            const fileId = result?.fileId || result?.data?.fileId || result?.id
            if (fileId) {
              uploadedUrls.push(fileId)
            }
          } catch (err) {
            console.error(`上传失败: ${fileInfo.name}`, err)
          }
        }
        
        if (uploadedUrls.length > 0) {
          // 更新商品主图和所有 SKU 图片
          const newImages = [...uploadedUrls, ...(matchedProduct.images || [])]
          const updatedSkus = (matchedProduct.skus || []).map(sku => ({
            ...sku,
            images: [...uploadedUrls, ...(sku.images || [])]
          }))
          
          await updateProduct(matchedProduct._id, { 
            images: newImages,
            skus: updatedSkus
          })
          
          console.log(`✅ 商品 "${matchedProduct.name}" 导入了 ${uploadedUrls.length} 张图片`)
          successCount++
        }
      }
      
      toast.dismiss(uploadToastId)
      
      if (successCount > 0) {
        toast.success(`导入完成！${successCount} 个商品成功${failCount > 0 ? `，${failCount} 个未匹配` : ''}`)
        await loadProducts()
      } else {
        toast.error('没有成功导入任何商品，请检查文件夹名称是否与商品名称匹配')
      }
      
      // 显示未匹配的文件夹
      if (notMatchedFolders.length > 0) {
        console.log('⚠️ 未匹配的文件夹:', notMatchedFolders)
        toast.warning(`未匹配文件夹: ${notMatchedFolders.join(', ')}`, { duration: 5000 })
      }
      
    } catch (error) {
      console.error('ZIP上传失败:', error)
      toast.error('压缩包处理失败')
    } finally {
      // 确保关闭所有 loading toast
      toast.dismiss()
      setBatchImageUploading(false)
      e.target.value = ''
    }
  }

  // ZIP 拖拽处理
  const handleZipDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingZip(true)
  }

  const handleZipDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingZip(false)
  }

  const handleZipDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDraggingZip(false)
    setShowZipDropZone(false)

    const files = Array.from(e.dataTransfer.files)
    const zipFiles = files.filter(f => f.name.toLowerCase().endsWith('.zip'))
    
    if (zipFiles.length === 0) {
      toast.error('请拖入 ZIP 格式的压缩包')
      return
    }

    // 处理多个 ZIP 文件
    await handleMultipleZipUpload(zipFiles)
  }

  // 处理多个ZIP文件上传
  const handleMultipleZipUpload = async (zipFiles: File[]) => {
    if (zipFiles.length === 0) return
    
    setBatchImageUploading(true)
    const toastId = toast.loading(`正在处理 ${zipFiles.length} 个压缩包...`)
    
    let totalSuccess = 0
    let totalFail = 0
    const allNotMatched: string[] = []
    
    // 图片排序函数：正视图(1) > 侧视图(2) > 背视图(3) > 细节图(4) > 其他
    const getImageSortOrder = (fileName: string): number => {
      const lowerName = fileName.toLowerCase()
      // 1. 正视图/主图/产品图
      if (lowerName.includes('正视') || lowerName.includes('正面') || lowerName.includes('front') || 
          lowerName.includes('主图') || lowerName.includes('产品图') || lowerName.includes('封面')) return 1
      // 2. 侧视图/45度角/左侧/右侧
      if (lowerName.includes('侧视') || lowerName.includes('侧面') || lowerName.includes('side') ||
          lowerName.includes('45度') || lowerName.includes('左侧') || lowerName.includes('右侧')) return 2
      // 3. 背视图/后视图
      if (lowerName.includes('背面') || lowerName.includes('背视') || lowerName.includes('back') || 
          lowerName.includes('后面') || lowerName.includes('后视')) return 3
      // 4. 细节图/宫格图
      if (lowerName.includes('细节') || lowerName.includes('detail') || lowerName.includes('4宫格') || 
          lowerName.includes('宫格') || lowerName.includes('特写')) return 4
      // 按文件名中的数字排序
      const numMatch = fileName.match(/[_-]?(\d+)\./);
      if (numMatch) return 10 + parseInt(numMatch[1])
      return 100
    }
    
    try {
      // 并行处理所有ZIP文件
      const processZip = async (zipFile: File): Promise<{ success: number, fail: number, notMatched: string[] }> => {
        const zipFileName = zipFile.name.replace(/\.zip$/i, '').trim()
        console.log(`📦 处理压缩包: ${zipFileName}`)
        
        let success = 0
        let fail = 0
        const notMatched: string[] = []
        
        try {
          const zip = await JSZip.loadAsync(zipFile)
          
          // 按文件夹分组图片
          const folderGroups: Record<string, { name: string, blob: Promise<Blob> }[]> = {}
          const allPaths = Object.keys(zip.files).filter(p => !zip.files[p].dir)
          const hasSubfolders = allPaths.some(p => p.includes('/') && !p.startsWith('__MACOSX'))
          
          for (const [path, zipEntry] of Object.entries(zip.files)) {
            if (zipEntry.dir) continue
            if (path.startsWith('__MACOSX') || path.includes('/.')) continue
            
            const ext = path.split('.').pop()?.toLowerCase()
            if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'tiff', 'tif'].includes(ext || '')) continue
            
            const pathParts = path.split('/').filter(p => p && !p.startsWith('.'))
            let folderName: string
            let fileName: string = pathParts[pathParts.length - 1]
            
            if (!hasSubfolders || pathParts.length <= 1) {
              folderName = zipFileName
            } else if (pathParts.length >= 2) {
              if (pathParts.length >= 3) {
                folderName = pathParts[1].trim()
              } else {
                folderName = pathParts[0].trim()
              }
            } else {
              folderName = zipFileName
            }
            
            if (!folderName) continue
            
            if (!folderGroups[folderName]) {
              folderGroups[folderName] = []
            }
            
            folderGroups[folderName].push({
              name: fileName,
              blob: zipEntry.async('blob')
            })
          }
          
          // 处理每个文件夹
          for (const [folderName, files] of Object.entries(folderGroups)) {
            let matchedProduct: Product | undefined
            let matchedSkuIndex: number = -1  // 匹配到的SKU索引，-1表示匹配整个商品
            
            // 1. 优先精确匹配SKU规格（如 G621床 匹配到 spec="G621床" 的SKU）
            const cleanFolderName = folderName.trim().replace(/\s+/g, '')  // 去除所有空格
            console.log(`🔍 尝试匹配文件夹: "${folderName}" (清理后: "${cleanFolderName}")`)
            
            // 打印所有商品的SKU规格，帮助调试
            console.log('📋 所有SKU规格:', products.flatMap(p => 
              (p.skus || []).map(sku => `${p.name} -> spec="${sku.spec}" code="${sku.code}"`)
            ).slice(0, 20))
            
            for (const product of products) {
              if (product.skus && product.skus.length > 0) {
                const skuIndex = product.skus.findIndex(sku => {
                  const cleanSpec = (sku.spec || '').trim().replace(/\s+/g, '')
                  const cleanCode = (sku.code || '').trim().replace(/\s+/g, '')
                  // 精确匹配
                  if (cleanSpec === cleanFolderName || cleanCode === cleanFolderName ||
                      sku.spec === folderName || sku.code === folderName) {
                    return true
                  }
                  // 前缀匹配（如 "G621B床" 匹配 "G621B床（1.8m）"）
                  // 确保前缀后面是括号或没有更多内容，避免 G621床 匹配到 G621床头柜
                  if (cleanSpec.startsWith(cleanFolderName)) {
                    const remainder = cleanSpec.slice(cleanFolderName.length)
                    // 如果剩余部分以括号开头或为空，则匹配
                    if (remainder === '' || remainder.startsWith('（') || remainder.startsWith('(')) {
                      return true
                    }
                  }
                  return false
                })
                if (skuIndex >= 0) {
                  matchedProduct = product
                  matchedSkuIndex = skuIndex
                  console.log(`🎯 文件夹 "${folderName}" 匹配到商品 "${product.name}" 的 SKU[${skuIndex}] 规格="${product.skus[skuIndex].spec}"`)
                  break
                }
              }
            }
            
            // 2. 商品名+数字后缀匹配SKU（如 G601沙发2 → 商品"G601沙发"的SKU2，G601沙发 → SKU1）
            if (!matchedProduct) {
              // 解析文件夹名末尾的数字
              const suffixMatch = folderName.match(/^(.+?)(\d+)?$/)
              if (suffixMatch) {
                const baseName = suffixMatch[1].trim()  // 基础商品名（如 "G601沙发"）
                const skuNumber = suffixMatch[2] ? parseInt(suffixMatch[2]) : 1  // SKU编号，默认1
                
                // 查找匹配基础名或完整名的商品
                let foundProduct = products.find(p => p.name === baseName)
                // 如果基础名没找到，尝试用完整文件夹名匹配
                if (!foundProduct) {
                  foundProduct = products.find(p => p.name === folderName)
                }
                
                if (foundProduct && foundProduct.skus && foundProduct.skus.length > 0) {
                  // 如果用完整名匹配到的（没有数字后缀），默认SKU1
                  const targetSkuIndex = (foundProduct.name === folderName && !suffixMatch[2]) 
                    ? 0 
                    : (skuNumber - 1)
                  
                  if (targetSkuIndex >= 0 && targetSkuIndex < foundProduct.skus.length) {
                    matchedProduct = foundProduct
                    matchedSkuIndex = targetSkuIndex
                    console.log(`🎯 文件夹 "${folderName}" 匹配到商品 "${foundProduct.name}" 的 SKU[${targetSkuIndex}]`)
                  }
                } else if (foundProduct) {
                  // 商品没有SKU，直接匹配商品
                  matchedProduct = foundProduct
                  console.log(`🎯 文件夹 "${folderName}" 匹配到商品 "${foundProduct.name}"（无SKU）`)
                }
              }
            }
            
            // 3. 模糊匹配SKU
            if (!matchedProduct) {
              for (const product of products) {
                if (product.skus && product.skus.length > 0) {
                  const skuIndex = product.skus.findIndex(sku => 
                    (sku.code && folderName.includes(sku.code)) ||
                    (sku.code && sku.code.includes(folderName)) ||
                    (sku.spec && folderName.includes(sku.spec)) ||
                    (sku.spec && sku.spec.includes(folderName))
                  )
                  if (skuIndex >= 0) {
                    matchedProduct = product
                    matchedSkuIndex = skuIndex
                    console.log(`🎯 文件夹 "${folderName}" 模糊匹配到商品 "${product.name}" 的 SKU "${product.skus[skuIndex].code || product.skus[skuIndex].spec}"`)
                    break
                  }
                }
              }
            }
            
            // 4. 商品名包含文件夹名
            if (!matchedProduct && folderName.length >= 2) {
              matchedProduct = products.find(p => p.name.includes(folderName))
            }
            
            // 5. 文件夹名包含商品名（商品名至少4个字符）
            if (!matchedProduct) {
              matchedProduct = products.find(p => p.name.length >= 4 && folderName.includes(p.name))
            }
            
            // 6. 如果文件夹名只有数字，尝试匹配商品名以该数字结尾
            if (!matchedProduct && /^\d+$/.test(folderName)) {
              matchedProduct = products.find(p => p.name.endsWith(folderName))
            }
            
            if (!matchedProduct) {
              fail++
              notMatched.push(`${zipFileName}/${folderName}`)
              continue
            }
            
            const sortedFiles = [...files].sort((a, b) => getImageSortOrder(a.name) - getImageSortOrder(b.name))
            const uploadedUrls: string[] = []
            
            for (const fileInfo of sortedFiles) {
              try {
                const blob = await fileInfo.blob
                const imageFile = new File([blob], fileInfo.name, { type: `image/${fileInfo.name.split('.').pop()}` })
                const result = await uploadFile(imageFile)
                const fileId = result?.fileId || result?.data?.fileId || result?.id
                if (fileId) {
                  uploadedUrls.push(fileId)
                }
              } catch (err) {
                console.error(`上传失败: ${fileInfo.name}`, err)
              }
            }
            
            if (uploadedUrls.length > 0) {
              // 重新获取最新的商品数据，避免并发更新冲突
              const freshProductData = await getProductById(matchedProduct._id)
              const freshProduct = freshProductData
              if (!freshProduct) {
                console.error(`商品 ${matchedProduct.name} 不存在`)
                fail++
                continue
              }
              
              if (matchedSkuIndex >= 0) {
                // 更新匹配到的SKU图片
                const updatedSkus = freshProduct.skus!.map((sku, idx) => {
                  if (idx === matchedSkuIndex) {
                    return { ...sku, images: [...uploadedUrls, ...(sku.images || [])] }
                  }
                  return sku
                })
                
                // 如果是第一个SKU（index 0），同时更新商品主图
                if (matchedSkuIndex === 0) {
                  const mainImage = uploadedUrls[0]
                  const newImages = [mainImage, ...(freshProduct.images || []).filter(img => img !== mainImage)]
                  await updateProduct(freshProduct._id, { images: newImages, skus: updatedSkus })
                  console.log(`✅ ${zipFileName} -> "${freshProduct.name}" SKU[0] 导入 ${uploadedUrls.length} 张图片 + 更新商品主图`)
                } else {
                  await updateProduct(freshProduct._id, { skus: updatedSkus })
                  console.log(`✅ ${zipFileName} -> "${freshProduct.name}" SKU[${matchedSkuIndex}] 导入 ${uploadedUrls.length} 张图片`)
                }
              } else {
                // 更新商品主图（只用第一张）和所有SKU图片（用全部）
                const mainImage = uploadedUrls[0]  // 商品详情页主图只需要1张
                const newImages = [mainImage, ...(freshProduct.images || []).filter(img => img !== mainImage)]
                const updatedSkus = (freshProduct.skus || []).map(sku => ({
                  ...sku,
                  images: [...uploadedUrls, ...(sku.images || [])]
                }))
                
                await updateProduct(freshProduct._id, { 
                  images: newImages,
                  skus: updatedSkus
                })
                console.log(`✅ ${zipFileName} -> "${freshProduct.name}" 主图1张 + SKU各${uploadedUrls.length}张`)
              }
              success++
            }
          }
        } catch (err) {
          console.error(`处理ZIP失败: ${zipFileName}`, err)
        }
        
        return { success, fail, notMatched }
      }
      
      // 串行处理所有ZIP（避免同一商品的SKU更新冲突）
      for (let i = 0; i < zipFiles.length; i++) {
        const result = await processZip(zipFiles[i])
        totalSuccess += result.success
        totalFail += result.fail
        allNotMatched.push(...result.notMatched)
        
        // 更新进度
        toast.loading(`已处理 ${i + 1}/${zipFiles.length} 个压缩包...`, { id: toastId })
      }
      
      toast.dismiss(toastId)
      
      if (totalSuccess > 0) {
        toast.success(`🎉 导入完成！${zipFiles.length} 个压缩包，${totalSuccess} 个商品成功${totalFail > 0 ? `，${totalFail} 个未匹配` : ''}`)
        await loadProducts()
      } else {
        toast.error('没有成功导入任何商品，请检查压缩包内文件夹名称是否与商品名称匹配')
      }
      
      if (allNotMatched.length > 0) {
        console.log('⚠️ 未匹配的文件夹:', allNotMatched)
        toast.warning(`未匹配: ${allNotMatched.slice(0, 5).join(', ')}${allNotMatched.length > 5 ? ` 等${allNotMatched.length}个` : ''}`, { duration: 5000 })
      }
      
    } catch (error) {
      console.error('批量ZIP上传失败:', error)
      toast.dismiss(toastId)
      toast.error('批量处理失败')
    } finally {
      setBatchImageUploading(false)
    }
  }

  // 处理确认的图片匹配
  const handleConfirmMatches = async () => {
    const toastId = toast.loading('正在上传图片...')
    let totalUploaded = 0
    let totalProducts = 0
    
    try {
      for (const match of pendingMatches) {
        if (match.selectedProductIds.length === 0) continue
        
        // 图片排序函数：正视图 > 侧视图 > 背面图 > 细节图 > 其他
        const getImageSortOrder = (fileName: string): number => {
          const lowerName = fileName.toLowerCase()
          if (lowerName.includes('正视') || lowerName.includes('正面') || lowerName.includes('front')) return 1
          if (lowerName.includes('侧视') || lowerName.includes('侧面') || lowerName.includes('side')) return 2
          if (lowerName.includes('背面') || lowerName.includes('背视') || lowerName.includes('back')) return 3
          if (lowerName.includes('细节') || lowerName.includes('detail')) return 4
          const numMatch = fileName.match(/[_-]?(\d+)\./)
          if (numMatch) return 10 + parseInt(numMatch[1])
          return 100
        }
        
        // 按图片类型排序后上传
        const sortedFiles = [...match.files].sort((a, b) => getImageSortOrder(a.name) - getImageSortOrder(b.name))
        const uploadedUrls: string[] = []
        for (const file of sortedFiles) {
          const result = await uploadFile(file)
          const fileId = result?.fileId || result?.data?.fileId || result?.id
          if (fileId) {
            uploadedUrls.push(fileId)
          }
        }
        
        if (uploadedUrls.length === 0) continue
        
        // 更新选中的商品（主图 + 所有SKU图片）
        for (const productId of match.selectedProductIds) {
          const product = products.find(p => p._id === productId)
          if (product) {
            // 更新商品主图
            const newImages = [...uploadedUrls, ...(product.images || [])]
            
            // 同时更新所有 SKU 的图片
            const updatedSkus = (product.skus || []).map(sku => ({
              ...sku,
              images: [...uploadedUrls, ...(sku.images || [])]
            }))
            
            await updateProduct(product._id, { 
              images: newImages,
              skus: updatedSkus
            })
            totalProducts++
            console.log(`✅ 商品 "${product.name}" 导入了 ${uploadedUrls.length} 张图片到主图和 ${updatedSkus.length} 个SKU`)
          }
        }
        totalUploaded += uploadedUrls.length
      }
      
      toast.dismiss(toastId)
      if (totalProducts > 0) {
        toast.success(`导入完成！${totalProducts} 个商品，${totalUploaded} 张图片`)
        await loadProducts()
      }
    } catch (error) {
      console.error('图片导入失败:', error)
      toast.dismiss(toastId)
      toast.error('图片导入失败')
    } finally {
      setShowMatchConfirmModal(false)
      setPendingMatches([])
    }
  }
  
  // 旧版批量图片上传处理（保留兼容）
  // 图片命名规则：
  // 1. 商品主图: "商品名称1.jpg", "商品名称2.jpg" 或 "商品名称_1.jpg" -> 匹配商品名称，按序号排列
  // 2. SKU图片: "型号_1.jpg", "型号_2.jpg" 或 "型号1.jpg" -> 匹配SKU的code字段
  const handleBatchImageUploadLegacy = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setBatchImageUploading(true)
    const toastId = toast.loading(`正在处理 ${files.length} 张图片...`)
    
    try {
      // 解析图片文件名，提取名称、SKU型号和序号
      const parseFileName = (fileName: string) => {
        // 移除扩展名（支持更多格式）
        const nameWithoutExt = fileName.replace(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|svg|ico|heic|heif|avif|raw)$/i, '').trim()
        
        console.log(`解析文件名: "${fileName}" -> 去扩展名: "${nameWithoutExt}"`)
        
        // 特殊格式1: "008-SKU2云沙发（1）" 或 "008-01云沙发 (2)" -> 商品型号-SKU型号+商品名称+（序号）
        const skuFormatMatch = nameWithoutExt.match(/^(\d+[-][A-Za-z0-9]+)(.+?)\s*[（(\s]+(\d+)[）)\s]*$/)
        if (skuFormatMatch) {
          const skuCode = skuFormatMatch[1]
          const productName = skuFormatMatch[2].trim()
          const index = parseInt(skuFormatMatch[3])
          return { baseName: productName, skuCode, index }
        }
        
        // 普通格式: 括号格式 "名称（1）" 或 "名称(1)"
        const bracketMatch = nameWithoutExt.match(/^(.+?)\s*[（(](\d+)[）)]$/)
        if (bracketMatch) {
          return { baseName: bracketMatch[1].trim(), skuCode: undefined, index: parseInt(bracketMatch[2]) }
        }
        
        // 普通格式: 分隔符+数字 "名称_1" 或 "名称-1" 或 "名称 1"
        const separatorMatch = nameWithoutExt.match(/^(.+?)[\s_](\d+)$/)
        if (separatorMatch) {
          return { baseName: separatorMatch[1].trim(), skuCode: undefined, index: parseInt(separatorMatch[2]) }
        }
        
        // 普通格式: 直接数字结尾 "名称1"
        const directMatch = nameWithoutExt.match(/^(.+?)(\d+)$/)
        if (directMatch) {
          return { baseName: directMatch[1].trim(), skuCode: undefined, index: parseInt(directMatch[2]) }
        }
        
        return { baseName: nameWithoutExt.trim(), skuCode: undefined, index: 1 }
      }
      
      // 按SKU型号或基础名称分组图片
      // 优先按skuCode分组，如果没有skuCode则按baseName分组
      const skuImageGroups: Record<string, { file: File, index: number, productName: string }[]> = {}
      const productImageGroups: Record<string, { file: File, index: number }[]> = {}
      
      for (const file of Array.from(files)) {
        const { baseName, skuCode, index } = parseFileName(file.name)
        
        if (skuCode) {
          // 有SKU型号的，按SKU分组
          if (!skuImageGroups[skuCode]) {
            skuImageGroups[skuCode] = []
          }
          skuImageGroups[skuCode].push({ file, index, productName: baseName })
        } else {
          // 无SKU型号的，按商品名称分组
          if (!productImageGroups[baseName]) {
            productImageGroups[baseName] = []
          }
          productImageGroups[baseName].push({ file, index })
        }
      }
      
      // 对每组图片按序号排序
      Object.values(skuImageGroups).forEach(group => {
        group.sort((a, b) => a.index - b.index)
      })
      Object.values(productImageGroups).forEach(group => {
        group.sort((a, b) => a.index - b.index)
      })
      
      console.log('SKU图片分组:', Object.keys(skuImageGroups))
      console.log('商品图片分组:', Object.keys(productImageGroups))
      
      // 使用对象来避免闭包问题
      const counts = { updatedProductCount: 0, updatedSkuCount: 0, uploadedImageCount: 0 }
      
      // 1. 处理SKU图片组（格式如：008-01云沙发（1）.png）
      for (const [skuCode, imageGroup] of Object.entries(skuImageGroups)) {
        const productName = imageGroup[0]?.productName || ''
        console.log(`🔍 查找SKU: "${skuCode}", 商品名: "${productName}"`)
        let found = false
        
        // 方式1: 按SKU code匹配
        for (const product of products) {
          console.log(`  检查商品: "${product.name}"`)
          if (product.skus && product.skus.length > 0) {
            console.log(`    SKU列表: [${product.skus.map(s => `"${s.code}"`).join(', ')}]`)
            const matchedSku = product.skus.find(sku => sku.code === skuCode)
            if (matchedSku) {
              console.log(`    ✓ 找到匹配的SKU: "${skuCode}"`)
              found = true
              const uploadedUrls: string[] = []
              for (const { file } of imageGroup) {
                const result = await uploadFile(file)
                console.log(`📤 上传结果:`, result)
                const fileId = result?.fileId || result?.data?.fileId || result?.id || result?.data?.id
                if (fileId) {
                  uploadedUrls.push(fileId)
                  counts.uploadedImageCount++
                  console.log(`✓ 获取到fileId: ${fileId}`)
                } else {
                  console.log(`❌ 未获取到fileId, result:`, JSON.stringify(result))
                }
              }
              
              console.log(`📤 SKU匹配上传完成, uploadedUrls:`, uploadedUrls)
              if (uploadedUrls.length > 0) {
                const updatedSkus = product.skus.map(sku => {
                  if (sku.code === skuCode) {
                    return { ...sku, images: [...uploadedUrls, ...(sku.images || [])] }
                  }
                  return sku
                })
                
                // 如果是SKU1，同时更新商品主图（详情页头图）
                const updateData: any = { skus: updatedSkus }
                if (skuCode === '008-SKU1') {
                  // 使用SKU1的第一张图作为商品主图
                  const currentMainImages = product.images || []
                  updateData.images = [uploadedUrls[0], ...currentMainImages]
                  console.log(`📸 SKU1更新，同时设置商品主图: ${uploadedUrls[0]}`)
                }
                
                try {
                  await updateProduct(product._id, updateData)
                  counts.updatedSkuCount++
                  if (skuCode === '008-SKU1') {
                    counts.updatedProductCount++
                  }
                  console.log(`✅ SKU "${skuCode}" (商品: ${product.name}) 更新了 ${uploadedUrls.length} 张图片, counts.updatedSkuCount=${counts.updatedSkuCount}`)
                } catch (updateErr) {
                  console.error(`❌ 更新SKU失败:`, updateErr)
                }
              }
              break
            } else {
              console.log(`    ❌ SKU "${skuCode}" 不匹配任何现有SKU`)
            }
          } else {
            console.log(`    ⚠️ 商品没有SKU`)
          }
        }
        
        // 方式2: 如果SKU code没匹配到，尝试用商品名称匹配，更新该商品的第一个SKU
        if (!found && productName) {
          console.log(`🔍 尝试按商品名称匹配: "${productName}"`)
          console.log(`📋 系统中所有商品名称: [${products.map(p => p.name).join(', ')}]`)
          // 精确匹配或包含匹配
          let matchedProduct = products.find(p => p.name === productName)
          if (!matchedProduct) {
            // 尝试模糊匹配：商品名称包含文件名中的商品名，或反过来
            matchedProduct = products.find(p => p.name.includes(productName) || productName.includes(p.name))
            if (matchedProduct) {
              console.log(`✓ 模糊匹配成功: "${productName}" -> "${matchedProduct.name}"`)
            }
          }
          if (matchedProduct && matchedProduct.skus?.length > 0) {
            found = true
            const uploadedUrls: string[] = []
            for (const { file } of imageGroup) {
              const result = await uploadFile(file)
              console.log(`📤 上传结果:`, result)
              // 兼容多种返回格式: result.fileId 或 result.data.fileId 或 result.id
              const fileId = result?.fileId || result?.data?.fileId || result?.id || result?.data?.id
              if (fileId) {
                uploadedUrls.push(fileId)
                counts.uploadedImageCount++
                console.log(`✓ 获取到fileId: ${fileId}`)
              } else {
                console.log(`❌ 未获取到fileId, result:`, JSON.stringify(result))
              }
            }
            
            console.log(`📤 上传完成, uploadedUrls:`, uploadedUrls)
            if (uploadedUrls.length > 0) {
              // 同时更新商品主图和第一个SKU的图片
              const updatedSkus = matchedProduct.skus.map((sku, idx) => {
                if (idx === 0) {
                  return { ...sku, images: [...uploadedUrls, ...(sku.images || [])] }
                }
                return sku
              })
              // 商品主图也使用这些图片
              const updatedImages = [...uploadedUrls, ...(matchedProduct.images || [])]
              try {
                await updateProduct(matchedProduct._id, { 
                  images: updatedImages,  // 更新商品主图
                  skus: updatedSkus       // 更新SKU图片
                })
                counts.updatedSkuCount++
                counts.updatedProductCount++
                console.log(`✅ 商品 "${productName}" 更新了主图和SKU图片，共 ${uploadedUrls.length} 张`)
              } catch (updateErr) {
                console.error(`❌ 更新商品失败:`, updateErr)
              }
            }
          }
        }
        
        if (!found) {
          console.log(`❌ 未找到匹配: skuCode="${skuCode}", productName="${productName}"`)
        }
      }
      
      // 2. 处理商品图片组（格式如：劳伦斯1.jpg）
      for (const [baseName, imageGroup] of Object.entries(productImageGroups)) {
        // 先尝试匹配商品名称
        const matchedProduct = products.find(p => p.name === baseName)
        if (matchedProduct) {
          // 上传图片并更新商品主图
          const uploadedUrls: string[] = []
          for (const { file } of imageGroup) {
            const result = await uploadFile(file)
            if (result.fileId) {
              uploadedUrls.push(result.fileId)
              counts.uploadedImageCount++
            }
          }
          
          if (uploadedUrls.length > 0) {
            const newImages = [...uploadedUrls, ...(matchedProduct.images || [])]
            await updateProduct(matchedProduct._id, { images: newImages })
            counts.updatedProductCount++
            console.log(`✅ 商品 "${baseName}" 更新了 ${uploadedUrls.length} 张主图`)
          }
          continue
        }
        
        // 再尝试匹配SKU型号
        for (const product of products) {
          const matchedSku = product.skus?.find(sku => sku.code === baseName)
          if (matchedSku) {
            const uploadedUrls: string[] = []
            for (const { file } of imageGroup) {
              const result = await uploadFile(file)
              if (result.fileId) {
                uploadedUrls.push(result.fileId)
                counts.uploadedImageCount++
              }
            }
            
            if (uploadedUrls.length > 0) {
              const updatedSkus = product.skus.map(sku => {
                if (sku.code === baseName) {
                  return { ...sku, images: [...uploadedUrls, ...(sku.images || [])] }
                }
                return sku
              })
              await updateProduct(product._id, { skus: updatedSkus })
              counts.updatedSkuCount++
              console.log(`✅ SKU "${baseName}" (商品: ${product.name}) 更新了 ${uploadedUrls.length} 张图片`)
            }
            break
          }
        }
      }
      
      toast.dismiss(toastId)
      console.log(`📊 counts对象:`, counts)
      console.log(`📊 最终统计: updatedProductCount=${counts.updatedProductCount}, updatedSkuCount=${counts.updatedSkuCount}, uploadedImageCount=${counts.uploadedImageCount}`)
      if (counts.updatedProductCount > 0 || counts.updatedSkuCount > 0) {
        toast.success(`批量上传完成！更新了 ${counts.updatedProductCount} 个商品主图，${counts.updatedSkuCount} 个SKU图片，共 ${counts.uploadedImageCount} 张图片`)
        await loadProducts()
      } else {
        toast.warning('未找到匹配的商品或SKU，请检查图片命名是否与商品名称或SKU型号一致')
      }
    } catch (error) {
      console.error('批量图片上传失败:', error)
      toast.dismiss(toastId)
      toast.error('批量图片上传失败')
    } finally {
      setBatchImageUploading(false)
      e.target.value = ''
    }
  }

  // 文件夹批量图片上传处理（针对单个商品）
  // 选择文件夹后，自动将图片分配到该商品的所有SKU
  // 图片排序：正面图 > 侧面图 > 后面图 > 细节展示图 > 其他
  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>, productId: string) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    const product = products.find(p => p._id === productId)
    if (!product) {
      toast.error('未找到商品')
      return
    }
    
    setBatchImageUploading(true)
    const toastId = toast.loading(`正在处理 ${files.length} 张图片...`)
    
    try {
      // 筛选图片文件
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/') || 
        /\.(jpg|jpeg|png|gif|webp|bmp|tiff|svg|ico|heic|heif|avif)$/i.test(file.name)
      )
      
      if (imageFiles.length === 0) {
        toast.dismiss(toastId)
        toast.warning('文件夹中没有找到图片文件')
        return
      }
      
      // 图片排序函数：正面图 > 侧面图 > 后面图 > 细节展示图 > 其他
      const getImagePriority = (fileName: string): number => {
        const lowerName = fileName.toLowerCase()
        if (lowerName.includes('正面') || lowerName.includes('front') || lowerName.includes('主图')) return 1
        if (lowerName.includes('侧面') || lowerName.includes('side')) return 2
        if (lowerName.includes('后面') || lowerName.includes('back') || lowerName.includes('背面')) return 3
        if (lowerName.includes('细节') || lowerName.includes('detail') || lowerName.includes('展示')) return 4
        return 5 // 其他图片
      }
      
      // 按优先级和文件名排序
      const sortedFiles = imageFiles.sort((a, b) => {
        const priorityA = getImagePriority(a.name)
        const priorityB = getImagePriority(b.name)
        if (priorityA !== priorityB) return priorityA - priorityB
        return a.name.localeCompare(b.name, 'zh-CN', { numeric: true })
      })
      
      console.log('排序后的图片:', sortedFiles.map(f => f.name))
      
      // 上传所有图片
      const uploadedUrls: string[] = []
      for (const file of sortedFiles) {
        const result = await uploadFile(file)
        const fileId = result?.fileId || result?.data?.fileId || result?.id || result?.data?.id
        if (fileId) {
          uploadedUrls.push(fileId)
          console.log(`✓ 上传成功: ${file.name} -> ${fileId}`)
        } else {
          console.log(`❌ 上传失败: ${file.name}`)
        }
      }
      
      if (uploadedUrls.length === 0) {
        toast.dismiss(toastId)
        toast.error('图片上传失败')
        return
      }
      
      // 分配图片到SKU和商品主图
      // 第一张图作为商品头图
      const mainImages = [uploadedUrls[0], ...(product.images || []).filter(img => img !== uploadedUrls[0])]
      
      // 将所有图片分配到每个SKU
      const updatedSkus = (product.skus || []).map(sku => ({
        ...sku,
        images: [...uploadedUrls] // 每个SKU都获得所有图片
      }))
      
      // 更新商品
      await updateProduct(productId, {
        images: mainImages,
        skus: updatedSkus
      })
      
      toast.dismiss(toastId)
      toast.success(`上传成功！共 ${uploadedUrls.length} 张图片，已分配到 ${updatedSkus.length} 个SKU`)
      await loadProducts()
      
    } catch (error) {
      console.error('文件夹上传失败:', error)
      toast.dismiss(toastId)
      toast.error('上传失败')
    } finally {
      setBatchImageUploading(false)
      e.target.value = ''
      setFolderUploadProductId(null)
    }
  }

  // 执行搜索
  const handleSearch = () => {
    // 搜索功能已通过filteredProducts实现，此函数用于手动触发
    toast.info(`搜索: ${searchQuery || '全部商品'}`)
  }

  // 获取当前页商品
  const getCurrentPageProducts = () => {
    return filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  }

  // 全选/取消全选（仅当前页）
  const handleSelectAll = (checked: boolean) => {
    const currentPageIds = getCurrentPageProducts().map(p => p._id)
    if (checked) {
      // 添加当前页的ID到已选中列表（保留其他页已选中的）
      const newSelectedIds = [...new Set([...selectedIds, ...currentPageIds])]
      setSelectedIds(newSelectedIds)
    } else {
      // 从已选中列表中移除当前页的ID
      setSelectedIds(selectedIds.filter(id => !currentPageIds.includes(id)))
    }
  }

  // 检查当前页是否全选
  const isCurrentPageAllSelected = () => {
    const currentPageIds = getCurrentPageProducts().map(p => p._id)
    return currentPageIds.length > 0 && currentPageIds.every(id => selectedIds.includes(id))
  }

  // 单选
  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要删除的商品');
      return;
    }

    if (confirm(`确定要删除选中的 ${selectedIds.length} 个商品吗？`)) {
      let successCount = 0;
      for (const id of selectedIds) {
        if (await deleteProduct(id)) {
          successCount++;
        }
      }
      
      toast.success(`成功删除 ${successCount} 个商品`);
      setSelectedIds([]);
      await loadProducts();
    }
  };

  // 商品拖拽处理
  const handleProductDragStart = (e: React.DragEvent, product: Product) => {
    setDraggedProduct(product)
    e.dataTransfer.effectAllowed = 'move'
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', product._id)
    }
  }

  const handleProductDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (index !== undefined) {
      setDragOverProductIndex(index)
    }
  }

  const handleProductDragLeave = () => {
    setDragOverProductIndex(null)
  }

  const handleProductDrop = async (e: React.DragEvent, targetProduct?: Product, targetIndex?: number) => {
    e.preventDefault()
    setDragOverProductIndex(null)

    if (!draggedProduct) return

    // 如果是拖到另一个商品上（排序）
    if (targetProduct && targetIndex !== undefined) {
      const draggedIndex = filteredProducts.findIndex(p => p._id === draggedProduct._id)
      
      if (draggedIndex === -1 || draggedIndex === targetIndex) {
        setDraggedProduct(null)
        return
      }

      // 重新排序所有商品（不仅仅是过滤后的）
      const allProductsList = [...products]
      const draggedProductIndex = allProductsList.findIndex(p => p._id === draggedProduct._id)
      const targetProductIndex = allProductsList.findIndex(p => p._id === targetProduct._id)

      if (draggedProductIndex === -1 || targetProductIndex === -1) {
        setDraggedProduct(null)
        return
      }

      // 重新排序
      const reorderedProducts = [...allProductsList]
      const [removed] = reorderedProducts.splice(draggedProductIndex, 1)
      reorderedProducts.splice(targetProductIndex, 0, removed)

      // 更新所有商品的 order 字段
      for (const [index, product] of reorderedProducts.entries()) {
        await updateProduct(product._id, { order: index + 1 });
      }

      toast.success('商品顺序已调整');
      await loadProducts();
    }
    
    setDraggedProduct(null)
  }

  const currentRole = useAuthStore.getState().user?.role as UserRole | undefined
  const showCostColumn = canViewCostPrice || currentRole === 'designer'
  const getDiscountMultiplier = (categoryKey?: string) =>
    getRoleDiscountMultiplier(categoryLookup, currentRole, categoryKey)

  const filteredProducts = products
    .filter((product) => {
      if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterCategory) {
        // 匹配分类的_id、slug或name
        const categoryMatch = categories.find(cat => 
          cat._id === filterCategory || cat.slug === filterCategory || cat.name === filterCategory
        )
        if (categoryMatch) {
          // 检查商品分类是否匹配（支持_id、slug、name）
          const productCategoryMatch = 
            product.category === categoryMatch._id ||
            product.category === categoryMatch.slug ||
            product.category === categoryMatch.name
          if (!productCategoryMatch) {
            return false
          }
        } else {
          return false
        }
      }
      if (filterStatus && product.status !== filterStatus) {
        return false
      }
      // 厂家筛选
      if (filterManufacturer) {
        const productManufacturerId = getProductManufacturerId(product)
        if (productManufacturerId !== filterManufacturer) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => {
      // 根据排序方式排序
      if (sortBy === 'newest') {
        // 最新上传优先
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === 'oldest') {
        // 最早上传优先
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      if (sortBy === 'priceHigh') {
        return (b.basePrice || 0) - (a.basePrice || 0)
      }
      if (sortBy === 'priceLow') {
        return (a.basePrice || 0) - (b.basePrice || 0)
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name)
      }
      // 默认：按 order 字段排序，如果没有 order 则按创建时间排序
      const orderA = a.order ?? 0
      const orderB = b.order ?? 0
      if (orderA !== orderB) {
        return orderA - orderB
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  
  // 切换SKU展开/收起
  const toggleSkuExpansion = (productId: string) => {
    setExpandedSkus(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">商品管理</h1>
          <p className="text-gray-600 mt-1">共 {products.length} 件商品</p>
        </div>
        <div className="flex space-x-3">
          {selectedIds.length > 0 && (
            <>
              {/* 只有当选中的商品都没有厂家时才显示批量修改厂家按钮 */}
              {(() => {
                const selectedProducts = products.filter(p => selectedIds.includes(p._id))
                const allWithoutManufacturer = selectedProducts.every(p => !getProductManufacturerId(p))
                return allWithoutManufacturer
              })() && (
                <button
                  onClick={() => setShowBatchManufacturerModal(true)}
                  className="btn-secondary flex items-center bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  批量修改厂家 ({selectedIds.length})
                </button>
              )}
              <button
                onClick={handleBatchDelete}
                className="btn-secondary flex items-center bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
              >
                <Trash2 className="h-5 w-5 mr-2" />
                批量删除 ({selectedIds.length})
              </button>
            </>
          )}
          {user?.role !== 'designer' && (
            <>
              <button
                onClick={handleDownloadTemplate}
                className="btn-primary flex items-center"
              >
                <Download className="h-5 w-5 mr-2" />
                下载模板
              </button>
              <label className="btn-primary flex items-center cursor-pointer">
                <FileSpreadsheet className="h-5 w-5 mr-2" />
                表格导入
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={handleImportTable}
                />
              </label>
              <button 
                className={`btn-primary flex items-center ${batchImageUploading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => setShowZipDropZone(true)}
                disabled={batchImageUploading}
              >
                <Archive className="h-5 w-5 mr-2" />
                {batchImageUploading ? '上传中...' : '批量图片(ZIP)'}
              </button>
              <button
                onClick={() => navigate('/admin/products/new')}
                className="btn-primary flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                新建商品
              </button>
            </>
          )}
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* 搜索 */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索商品名称..."
              className="input pl-10 w-full"
            />
          </div>
          
          {/* 分类筛选 */}
          <div className="w-full md:w-40">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="input w-full"
            >
              <option value="">所有分类</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* 状态筛选 */}
          <div className="w-full md:w-40">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input w-full"
            >
              <option value="">所有状态</option>
              <option value="active">上架中</option>
              <option value="inactive">已下架</option>
              <option value="out_of_stock">缺货</option>
            </select>
          </div>

          {/* 厂家筛选 */}
          <div className="w-full md:w-40">
            <select
              value={filterManufacturer}
              onChange={(e) => setFilterManufacturer(e.target.value)}
              className="input w-full"
            >
              <option value="">所有厂家</option>
              {manufacturers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.shortName || m.fullName || m.name}
                </option>
              ))}
            </select>
          </div>

          {/* 排序 */}
          <div className="w-full md:w-40">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input w-full"
            >
              <option value="">默认排序</option>
              <option value="newest">最新上传</option>
              <option value="oldest">最早上传</option>
              <option value="priceHigh">价格从高到低</option>
              <option value="priceLow">价格从低到高</option>
              <option value="name">按名称排序</option>
            </select>
          </div>

          {/* 搜索按钮 */}
          <div className="w-full md:w-auto">
            <button
              onClick={handleSearch}
              className="btn-primary w-full md:w-auto flex items-center justify-center"
            >
              <Search className="h-5 w-5 mr-2" />
              搜索
            </button>
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-4">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 cursor-pointer"
                    checked={isCurrentPageAllSelected()}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    title="全选当前页"
                  />
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">图片</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">商品名称</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">厂家</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">分类</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">价格</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">折后价(A)</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">返佣金额(B)</th>
                {currentRole === 'designer' && false && (
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">单品折扣覆盖</th>
                )}
                {showCostColumn && currentRole !== 'designer' && (
                  <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">成本价</th>
                )}
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">SKU数量</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">状态</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">创建时间</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((product, index) => (
                <Fragment key={product._id}>
                <motion.tr
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ 
                    delay: filteredProducts.length > 100 ? 0 : index * 0.02,
                    duration: filteredProducts.length > 100 ? 0.1 : 0.3
                  }}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-move ${
                    draggedProduct?._id === product._id ? 'opacity-50' : ''
                  } ${
                    dragOverProductIndex === index ? 'bg-blue-50' : ''
                  } ${
                    (product as any).isHidden || product.status === 'inactive' ? 'opacity-50 bg-gray-100' : ''
                  }`}
                  draggable
                  onDragStart={(e: any) => handleProductDragStart(e, product)}
                  onDragOver={(e) => handleProductDragOver(e, index)}
                  onDragLeave={handleProductDragLeave}
                  onDrop={(e) => handleProductDrop(e, product, index)}
                >
                  <td className="py-4 px-4">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 cursor-pointer"
                      checked={selectedIds.includes(product._id)}
                      onChange={(e) => handleSelectOne(product._id, e.target.checked)}
                    />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <img
                        src={product.images[0] ? getThumbnailUrl(product.images[0], 100) : '/placeholder.svg'}
                        alt={product.name}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        loading="lazy"
                        style={{ imageRendering: 'auto' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          if (target.src !== window.location.origin + '/placeholder.svg' && !target.src.includes('placeholder.svg')) {
                            target.src = '/placeholder.svg'
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-1">{product.description}</p>
                    </div>
                  </td>
                  {/* 厂家列 */}
                  <td className="py-4 px-4">
                    {currentRole !== 'designer' && editingManufacturer === product._id ? (
                      <select
                        autoFocus
                        className="text-sm border border-gray-300 rounded px-2 py-1 w-24"
                        value={getProductManufacturerId(product) || ''}
                        onChange={(e) => handleUpdateManufacturer(product._id, e.target.value)}
                        onBlur={() => setEditingManufacturer(null)}
                      >
                        <option value="">无</option>
                        {manufacturers.map(m => (
                          <option key={m._id} value={m._id}>
                            {m.shortName || m.fullName || m.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        className={`text-sm text-gray-700 ${currentRole !== 'designer' ? 'cursor-pointer hover:text-primary hover:underline' : ''}`}
                        onClick={() => currentRole !== 'designer' && setEditingManufacturer(product._id)}
                        title={currentRole !== 'designer' ? "点击编辑厂家" : ""}
                      >
                        {(product as any).manufacturerDisplayName || getManufacturerName(getProductManufacturerId(product) || undefined)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-700">
                      {(() => {
                        // 优先使用后端返回的 categoryName
                        if ((product as any).categoryName) {
                          return (product as any).categoryName
                        }
                        // 如果 product.category 是对象，直接使用其 name 属性
                        if (typeof product.category === 'object' && product.category && 'name' in product.category) {
                          return (product.category as any).name
                        }
                        // 否则在分类列表中查找
                        const category = categories.find(cat => 
                          cat._id === product.category || 
                          cat.slug === product.category || 
                          cat.name === product.category
                        )
                        return category ? category.name : ''
                      })()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      {(() => {
                        const p: any = product as any
                        const isAuthorized = (product as any).isAuthorized
                        
                        // 授权商品快速编辑价格
                        if (isAuthorized && editingPriceProductId === product._id) {
                          const originalPrice = p?.skus?.[0]?.price || p.basePrice || 0
                          const minAllowed = Math.ceil(originalPrice * 0.6)
                          return (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editingPriceValue}
                                onChange={(e) => setEditingPriceValue(e.target.value)}
                                className="w-20 px-2 py-1 text-sm border rounded"
                                placeholder={`≥${minAllowed}`}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAuthorizedPriceEdit(product)
                                  if (e.key === 'Escape') {
                                    setEditingPriceProductId(null)
                                    setEditingPriceValue('')
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleAuthorizedPriceEdit(product)}
                                disabled={savingPrice}
                                className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                {savingPrice ? '...' : '✓'}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingPriceProductId(null)
                                  setEditingPriceValue('')
                                }}
                                className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
                              >
                                ✕
                              </button>
                            </div>
                          )
                        }
                        
                        // 设计师优先使用后端返回的授权价格
                        if (currentRole === 'designer') {
                          const takePrice = Number(p?.takePrice)
                          const labelPrice = Number(p?.labelPrice1)
                          if (Number.isFinite(takePrice) && takePrice > 0) {
                            return (
                              <span className="font-medium text-primary-600">
                                {formatPrice(takePrice)}
                              </span>
                            )
                          }
                          if (Number.isFinite(labelPrice) && labelPrice > 0) {
                            return (
                              <span className="font-medium text-primary-600">
                                {formatPrice(labelPrice)}
                              </span>
                            )
                          }
                        }
                        
                        // 其他角色使用 SKU 价格计算
                        const prices = (product.skus || []).map(sku => ({
                          price: sku.price || 0,
                          discountPrice: sku.discountPrice || 0
                        }))
                        const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price)) : 0
                        const minOriginalPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0
                        const hasDiscount = prices.some(p => p.discountPrice > 0 && p.discountPrice < p.price)
                        
                        const roleMultiplier = getDiscountMultiplier(product.category)
                        const finalPrice = Math.round(minPrice * roleMultiplier)
                        const finalOriginal = Math.round(minOriginalPrice * roleMultiplier)
                        
                        // 授权商品价格可点击编辑
                        if (isAuthorized) {
                          return (
                            <span 
                              className="font-medium text-primary-600 cursor-pointer hover:underline"
                              onClick={() => {
                                setEditingPriceProductId(product._id)
                                setEditingPriceValue(String(finalPrice))
                              }}
                              title="点击编辑价格（不低于标价60%）"
                            >
                              {formatPrice(finalPrice)}
                            </span>
                          )
                        }
                        
                        return (
                          <>
                            <span className="font-medium text-primary-600">
                              {formatPrice(finalPrice)}
                            </span>
                            {hasDiscount && finalOriginal > finalPrice && (
                              <span className="text-xs text-gray-400 line-through mt-0.5">
                                {formatPrice(finalOriginal)}
                              </span>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-700">
                      {(() => {
                        const p: any = product as any
                        const v = Number(p?.tierPricing?.discountedPrice)
                        if (!Number.isFinite(v) || v <= 0) return '-'
                        return formatPrice(v)
                      })()}
                    </div>
                  </td>

                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-700">
                      {(() => {
                        const p: any = product as any
                        const v = Number(p?.tierPricing?.commissionAmount)
                        if (!Number.isFinite(v) || v < 0) return '-'
                        return formatPrice(v)
                      })()}
                    </div>
                  </td>

                  {currentRole === 'designer' && false && (
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={100}
                          step={1}
                          className="input w-24"
                          placeholder="默认"
                          value={(() => {
                            const v = designerDiscountEdits[product._id]
                            if (v !== undefined) return v
                            const p: any = product as any
                            const rate = Number(p?.tierPricing?.overrideDiscountRate)
                            if (Number.isFinite(rate) && rate > 0) return String(Math.round(rate * 100))
                            return ''
                          })()}
                          onChange={(e) => {
                            const next = e.target.value
                            setDesignerDiscountEdits(prev => ({ ...prev, [product._id]: next }))
                          }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={savingDesignerDiscount[product._id] === true}
                          onClick={() => saveDesignerProductDiscountOverride(product)}
                        >
                          {savingDesignerDiscount[product._id] ? '保存中' : '保存'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">单位：%</div>
                    </td>
                  )}

                  {showCostColumn && currentRole !== 'designer' && (
                    <td className="py-4 px-4">
                      <div className="text-sm text-gray-700">
                        {(() => {
                          const p: any = product as any
                          const cost = Number(
                            p?.tierPricing?.netCostPrice ??
                            p.costPrice ??
                            p.takePrice ??
                            p?.skus?.[0]?.costPrice ??
                            0
                          )
                          return formatPrice(cost)
                        })()}
                      </div>
                    </td>
                  )}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{product.skus ? product.skus.length : 0}</span>
                      {product.skus && product.skus.length > 1 && (
                        <button
                          onClick={() => toggleSkuExpansion(product._id)}
                          className="text-primary-600 hover:text-primary-700 text-xs flex items-center gap-1"
                        >
                          {expandedSkus.has(product._id) ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              收起
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              展开
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {product.status === 'active' ? '上架中' : '已下架'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {formatDate(product.createdAt)}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end space-x-2">
                      {currentRole !== 'designer' && (
                        <button
                          onClick={() => navigate(`/admin/products/dashboard/${product._id}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="数据看板"
                        >
                          <BarChart3 className="h-4 w-4 text-purple-600" />
                        </button>
                      )}
                      {/* 隐藏/显示按钮 - 自有商品使用status，授权商品使用本地覆盖 */}
                      {currentRole !== 'designer' && (
                        <button
                          onClick={() => {
                            if ((product as any).isAuthorized) {
                              handleAuthorizedToggleHidden(product)
                            } else {
                              handleToggleStatus(product._id)
                            }
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title={(product as any).isAuthorized 
                            ? ((product as any).isHidden ? '显示商品' : '隐藏商品')
                            : (product.status === 'active' ? '下架' : '上架')
                          }
                        >
                          {(product as any).isAuthorized ? (
                            (product as any).isHidden ? (
                              <Eye className="h-4 w-4 text-gray-600" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-600" />
                            )
                          ) : (
                            product.status === 'active' ? (
                              <EyeOff className="h-4 w-4 text-gray-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-600" />
                            )
                          )}
                        </button>
                      )}
                      {/* 文件夹上传 - 授权商品不显示 */}
                      {currentRole !== 'designer' && !(product as any).isAuthorized && (
                        <label
                          className={`p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer ${batchImageUploading ? 'opacity-50 pointer-events-none' : ''}`}
                          title="选择文件夹上传图片"
                        >
                          <FolderOpen className="h-4 w-4 text-purple-600" />
                          <input
                            type="file"
                            // @ts-ignore
                            webkitdirectory=""
                            // @ts-ignore
                            directory=""
                            multiple
                            className="hidden"
                            onChange={(e) => handleFolderUpload(e, product._id)}
                            disabled={batchImageUploading}
                          />
                        </label>
                      )}
                      {/* 编辑按钮 - 授权商品不显示 */}
                      {currentRole !== 'designer' && !(product as any).isAuthorized && (
                        <button
                          onClick={() => navigate(`/admin/products/edit/${product._id}`)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit className="h-4 w-4 text-blue-600" />
                        </button>
                      )}
                      {currentRole !== 'designer' && !(product as any).isAuthorized && (
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
                {expandedSkus.has(product._id) && product.skus && product.skus.length > 1 && (
                  <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-gray-50"
                  >
                    <td colSpan={(showCostColumn ? 10 : 9) + 2 + (currentRole === 'designer' ? 1 : 0)} className="py-4 px-4">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-600 mb-2">SKU列表：</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {product.skus && product.skus.length > 0 ? (
                            product.skus.map((sku, skuIndex) => (
                              <div
                                key={sku._id || skuIndex}
                                className="bg-white p-3 rounded-lg border border-gray-200"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {sku.spec || sku.code || `SKU ${skuIndex + 1}`}
                                    </p>
                                    {sku.code && (
                                      <p className="text-xs text-gray-500 mt-0.5">型号: {sku.code}</p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    {(() => {
                                      const multiplier = getDiscountMultiplier(product.category)
                                      const base = sku.discountPrice && sku.discountPrice > 0 && sku.discountPrice < sku.price ? sku.discountPrice : sku.price || 0
                                      const original = sku.price || 0
                                      const finalBase = Math.round(base * multiplier)
                                      const finalOriginal = Math.round(original * multiplier)
                                      return (
                                        <div className="text-sm font-semibold text-primary-600">
                                          {sku.discountPrice && sku.discountPrice > 0 && sku.discountPrice < sku.price ? (
                                            <>
                                              {formatPrice(finalBase)}
                                              <span className="text-xs text-gray-400 line-through ml-1">
                                                {formatPrice(finalOriginal)}
                                              </span>
                                            </>
                                          ) : (
                                            formatPrice(finalBase)
                                          )}
                                        </div>
                                      )
                                    })()}
                                    <div className="text-sm font-semibold text-primary-600">
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">库存: {sku.stock || 0} 件</p>
                                  </div>
                                </div>
                                {(sku.length || sku.width || sku.height) && (
                                  <p className="text-xs text-gray-500">
                                    尺寸: {sku.length || 0} × {sku.width || 0} × {sku.height || 0} cm
                                  </p>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-sm text-gray-500">暂无SKU数据</div>
                          )}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {(() => {
          const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
          const startIndex = (currentPage - 1) * itemsPerPage
          const endIndex = Math.min(startIndex + itemsPerPage, filteredProducts.length)
          
          return (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                显示 {startIndex + 1}-{endIndex} 条，共 {filteredProducts.length} 条
              </p>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-lg text-sm ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="px-2 text-gray-400">...</span>
                  }
                  return null
                })}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ZIP 拖拽上传弹窗 */}
      {showZipDropZone && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowZipDropZone(false)}
        >
          <div 
            className={`bg-white rounded-xl shadow-2xl max-w-xl w-full p-8 ${isDraggingZip ? 'ring-4 ring-primary-500' : ''}`}
            onClick={e => e.stopPropagation()}
            onDragOver={handleZipDragOver}
            onDragLeave={handleZipDragLeave}
            onDrop={handleZipDrop}
          >
            <div className="text-center">
              <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${isDraggingZip ? 'bg-primary-100' : 'bg-gray-100'}`}>
                <Archive className={`w-10 h-10 ${isDraggingZip ? 'text-primary-600' : 'text-gray-400'}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">批量导入商品图片</h3>
              <p className="text-gray-500 mb-6">
                支持同时拖入多个 ZIP 压缩包，系统将并行处理
              </p>
              
              <div className={`border-2 border-dashed rounded-xl p-8 mb-6 transition-colors ${isDraggingZip ? 'border-primary-500 bg-primary-50' : 'border-gray-300'}`}>
                <p className={`text-lg ${isDraggingZip ? 'text-primary-600' : 'text-gray-400'}`}>
                  {isDraggingZip ? '松开鼠标上传' : '拖拽一个或多个 ZIP 文件到这里'}
                </p>
                <p className="text-sm text-gray-400 mt-2">支持同时选择多个压缩包</p>
              </div>

              <div className="space-y-3">
                <label className="btn-primary inline-flex items-center cursor-pointer">
                  <Archive className="w-5 h-5 mr-2" />
                  选择 ZIP 文件（支持多选）
                  <input
                    type="file"
                    accept=".zip"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) {
                        handleMultipleZipUpload(files)
                        setShowZipDropZone(false)
                      }
                      e.target.value = ''
                    }}
                  />
                </label>
                
                <div className="text-sm text-gray-500 mt-4">
                  <p className="font-medium mb-2">压缩包结构说明：</p>
                  <div className="text-left bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                    <p><strong>商品匹配:</strong> 文件夹名 = 商品名（如：G621床）→ 更新商品主图+所有SKU</p>
                    <p><strong>SKU匹配:</strong> 文件夹名 = SKU编码（如：G621A床）→ 只更新该SKU图片</p>
                    <p className="mt-2 text-gray-400">图片按 正视图→侧视图→背面图→细节图 排序</p>
                  </div>
                </div>
              </div>

              <button 
                className="mt-6 text-gray-500 hover:text-gray-700"
                onClick={() => setShowZipDropZone(false)}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量图片匹配确认弹框 */}
      {showMatchConfirmModal && pendingMatches.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">确认图片匹配</h3>
              <p className="text-sm text-gray-500 mt-1">
                以下图片匹配到多个商品，请选择要导入的商品（可多选）
              </p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh] space-y-6">
              {pendingMatches.map((match, idx) => (
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-medium text-gray-900">关键词: "{match.keyword}"</span>
                    <span className="text-sm text-gray-500">({match.files.length} 张图片)</span>
                  </div>
                  
                  {/* 图片预览 */}
                  <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                    {match.files.slice(0, 4).map((file, fileIdx) => (
                      <div key={fileIdx} className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    {match.files.length > 4 && (
                      <div className="w-16 h-16 flex-shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                        +{match.files.length - 4}
                      </div>
                    )}
                  </div>
                  
                  {/* 匹配的商品列表 */}
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-2">匹配到 {match.matchedProducts.length} 个商品:</p>
                    {match.matchedProducts.map(product => (
                      <label 
                        key={product._id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={match.selectedProductIds.includes(product._id)}
                          onChange={(e) => {
                            setPendingMatches(prev => prev.map((m, i) => {
                              if (i !== idx) return m
                              const newSelected = e.target.checked
                                ? [...m.selectedProductIds, product._id]
                                : m.selectedProductIds.filter(id => id !== product._id)
                              return { ...m, selectedProductIds: newSelected }
                            }))
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                          {product.images?.[0] ? (
                            <img 
                              src={getThumbnailUrl(product.images[0], 80)} 
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.productCode || '无型号'}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowMatchConfirmModal(false)
                  setPendingMatches([])
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmMatches}
                disabled={!pendingMatches.some(m => m.selectedProductIds.length > 0)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 批量修改厂家弹窗 */}
      {showBatchManufacturerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">批量修改厂家</h3>
            <p className="text-sm text-gray-500 mb-4">
              已选中 {selectedIds.length} 个商品，选择要设置的厂家：
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择厂家
              </label>
              <select
                value={batchManufacturerId}
                onChange={(e) => setBatchManufacturerId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value="">无（清除厂家）</option>
                {manufacturers.map(m => (
                  <option key={m._id} value={m._id}>
                    {m.shortName || m.fullName || m.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBatchManufacturerModal(false)
                  setBatchManufacturerId('')
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchUpdateManufacturer}
                className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

