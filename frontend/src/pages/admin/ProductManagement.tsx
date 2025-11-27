import { useState, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff, FileSpreadsheet, Download, ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Product, UserRole } from '@/types'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
// 使用后端 API 服务
import { getProducts, deleteProduct, toggleProductStatus, createProduct, updateProduct, getProductById } from '@/services/productService'
import { getAllCategories, Category } from '@/services/categoryService'
import { createCategoryLookup, getRoleDiscountMultiplier } from '@/utils/categoryHelper'
import { useAuthStore } from '@/store/authStore'
import { getFileUrl } from '@/services/uploadService'

export default function ProductManagement() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // 商品数据
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分类数据
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryLookup, setCategoryLookup] = useState<Map<string, Category>>(new Map())
  
  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // 展开的SKU列表
  const [expandedSkus, setExpandedSkus] = useState<Set<string>>(new Set())
  
  // 拖拽状态
  const [draggedProduct, setDraggedProduct] = useState<Product | null>(null)
  const [dragOverProductIndex, setDragOverProductIndex] = useState<number | null>(null)

  // 加载商品数据
  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [])
  
  const loadCategories = async () => {
    try {
      const allCategories = await getAllCategories();
      setCategories(allCategories);
      setCategoryLookup(createCategoryLookup(allCategories));
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await getProducts({ pageSize: 200 });
      console.log('[ProductManagement] 加载商品响应:', response);
      if (response.success) {
        console.log('[ProductManagement] 加载商品数量:', response.data.length);
        setProducts(response.data);
      }
    } catch (error) {
      console.error('[ProductManagement] 加载商品失败:', error);
      toast.error('加载商品失败');
    } finally {
      setLoading(false);
    }
  };

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

  // 下载导入模板
  const handleDownloadTemplate = () => {
    // 创建模板数据（已删除"图片"和"销量"列）
    const templateData = [
      ['商品名称', '型号', '类别', '规格', '长宽高', '材质', '标价', '折扣价', '库存', 'PRO', 'PRO特性'],
      ['现代沙发A', 'SF-001', 'sofa', '单人位', '200*90*85', '布艺', 3999, 2999, 100, '否', ''],
      ['现代沙发A', 'SF-002', 'sofa', '双人位', '250*90*85', '布艺', 4999, 3999, 80, '否', ''],
      ['现代沙发A', 'SF-003', 'sofa', '三人位', '300*90*85', '布艺', 5999, 4999, 60, '是', '升级版高密度海绵'],
      ['北欧床', 'BED-001', 'bed', '1.5米', '150*200*45', '实木', 2999, 2499, 50, '否', ''],
      ['北欧床', 'BED-002', 'bed', '1.8米', '180*200*45', '实木', 3499, 2999, 40, '是', '加厚床板'],
      ['简约餐桌', 'TABLE-001', 'table', '四人位', '120*80*75', '实木', 1999, '', 30, '否', ''],
      ['办公桌', 'DESK-001', 'desk', '单人', '120*60*75', '钢木', 899, 699, 100, '否', ''],
      ['人体工学椅', 'CHAIR-001', 'chair', '标准款', '60*60*120', '网布', 599, 499, 200, '否', ''],
      ['墙面装饰画', 'DECO-001', 'decoration', '50x70cm', '50*70*2', '画框', 299, '', 50, '否', '']
    ]

    // 创建工作簿
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '商品导入模板')

    // 设置列宽
    ws['!cols'] = [
      { wch: 15 },  // 商品名称
      { wch: 12 },  // 型号
      { wch: 10 },  // 类别
      { wch: 10 },  // 规格
      { wch: 15 },  // 长宽高
      { wch: 10 },  // 材质
      { wch: 8 },   // 标价
      { wch: 8 },   // 折扣价
      { wch: 8 },   // 库存
      { wch: 6 },   // PRO
      { wch: 20 }   // PRO特性
    ]

    // 下载文件
    XLSX.writeFile(wb, '商品导入模板.xlsx')
    toast.success('模板下载成功')
  }

  // 表格导入
  const processImportedData = async (jsonData: any[]) => {
    try {
      console.log('=== Excel导入开始 ===');
      console.log('总行数（包括表头）:', jsonData.length);

      const header = jsonData[0] || [];
      const isNewFormat = (header.includes('面料') && header.includes('填充') && header.includes('框架') && header.includes('脚架')) || header.length >= 14;

      const rows = jsonData.slice(1).filter((row: any[]) => row && row.length > 0 && row[0] && row[0].toString().trim() !== '');

      const productMap = new Map<string, any>();

      rows.forEach((row: any[], rowIndex) => {
        const productName = row[0] || '';
        if (!productName) return;

        const productCode = row[1] || '';
        const category = row[2] || 'sofa';
        const spec = row[3] || '';
        const dimensions = row[4]?.toString() || '';
        const cleanDimensions = dimensions.trim().replace(/\s+/g, '');
        const dimensionParts = cleanDimensions.split('*');
        const length = dimensionParts[0] ? parseInt(dimensionParts[0].replace(/[^\d]/g, '')) || 0 : 0;
        const width = dimensionParts[1] ? parseInt(dimensionParts[1].replace(/[^\d]/g, '')) || 0 : 0;
        const height = dimensionParts[2] ? parseInt(dimensionParts[2].replace(/[^\d]/g, '')) || 0 : 0;

        let material: { fabric: string; filling: string; frame: string; leg: string } | string;
        let price: number, discountPrice: number, stock: number, isPro: boolean, proFeature: string;

        if (isNewFormat) {
          material = { fabric: (row[5]?.toString() || '').trim(), filling: (row[6]?.toString() || '').trim(), frame: (row[7]?.toString() || '').trim(), leg: (row[8]?.toString() || '').trim() };
          price = parseFloat((row[9]?.toString() || '').replace(/[^\d.]/g, '')) || 0;
          discountPrice = parseFloat((row[10]?.toString() || '').replace(/[^\d.]/g, '')) || 0;
          stock = parseInt(row[11]) || 0;
          isPro = row[12] === '是' || row[12] === 'PRO' || false;
          proFeature = (row[13]?.toString() || '').trim();
        } else {
          material = row[5]?.toString() || '';
          price = parseFloat((row[6]?.toString() || '').replace(/[^\d.]/g, '')) || 0;
          discountPrice = parseFloat((row[7]?.toString() || '').replace(/[^\d.]/g, '')) || 0;
          stock = parseInt(row[8]) || 0;
          isPro = row[9] === '是' || row[9] === 'PRO' || false;
          proFeature = (row[10]?.toString() || '').trim();
        }

        const skuData = { code: productCode, spec, length, width, height, material, price, discountPrice, stock, sales: 0, isPro, proFeature };

        if (!productMap.has(productName)) {
          productMap.set(productName, { name: productName, productCode, category, skus: [skuData], specifications: [] });
        } else {
          productMap.get(productName)!.skus.push(skuData);
        }

        const product = productMap.get(productName)!;
        if (!product.specifications.some((s: any) => s.name === spec) && spec && length && width && height) {
          product.specifications.push({ name: spec, length, width, height, unit: 'CM' });
        }
      });

      let importedCount = 0, updatedCount = 0, totalSkuCount = 0;
      const response = await getProducts({ pageSize: 200 });
      const allProducts = response.success ? response.data : [];

      for (const [productName, productData] of productMap.entries()) {
        const existingProduct = allProducts.find((p: any) => p.name === productName);

        if (existingProduct) {
          const newSkus = productData.skus.map((sku: any, index: number) => ({ code: sku.code || `SKU-${Date.now()}-${index}`, color: sku.spec || '默认', spec: sku.spec, length: sku.length, width: sku.width, height: sku.height, material: typeof sku.material === 'string' ? { fabric: sku.material || '', filling: '', frame: '', leg: '' } : (sku.material || { fabric: '', filling: '', frame: '', leg: '' }), stock: sku.stock, price: sku.price, images: [], isPro: sku.isPro, proFeature: sku.proFeature, discountPrice: sku.discountPrice }));
          const existingSpecs = existingProduct.specifications || {};
          const newSpecs = { ...existingSpecs };
          productData.specifications.forEach((spec: any) => { if (!newSpecs[spec.name]) { newSpecs[spec.name] = `${spec.length}x${spec.width}x${spec.height}${spec.unit}`; } });
          await updateProduct(existingProduct._id, { skus: [...existingProduct.skus, ...newSkus], specifications: newSpecs });
          updatedCount++;
          totalSkuCount += newSkus.length;
        } else {
          const specifications = productData.specifications.reduce((acc: any, spec: any) => { acc[spec.name] = `${spec.length}x${spec.width}x${spec.height}${spec.unit}`; return acc; }, {});
          const newProduct = { name: productData.name, description: `${productData.name}系列商品`, category: productData.category as any, basePrice: productData.skus[0].price || 0, images: [], skus: productData.skus.map((sku: any, index: number) => ({ code: sku.code || `SKU-${Date.now()}-${index}`, color: sku.spec || '默认', spec: sku.spec, length: sku.length, width: sku.width, height: sku.height, material: typeof sku.material === 'string' ? { fabric: sku.material || '', filling: '', frame: '', leg: '' } : (sku.material || { fabric: '', filling: '', frame: '', leg: '' }), stock: sku.stock, price: sku.price, images: [], isPro: sku.isPro, proFeature: sku.proFeature, discountPrice: sku.discountPrice })), isCombo: false, specifications, status: 'active' as any, views: 0, sales: 0, rating: 0, reviews: 0 };
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

  // 执行搜索
  const handleSearch = () => {
    // 搜索功能已通过filteredProducts实现，此函数用于手动触发
    toast.info(`搜索: ${searchQuery || '全部商品'}`)
  }

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredProducts.map(p => p._id))
    } else {
      setSelectedIds([])
    }
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
      return true
    })
    .sort((a, b) => {
      // 按 order 字段排序，如果没有 order 则按创建时间排序
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
            <button
              onClick={handleBatchDelete}
              className="btn-secondary flex items-center bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              批量删除 ({selectedIds.length})
            </button>
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
                    checked={selectedIds.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">图片</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">商品名称</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">分类</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">价格</th>
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
                  transition={{ delay: index * 0.02 }}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-move ${
                    draggedProduct?._id === product._id ? 'opacity-50' : ''
                  } ${
                    dragOverProductIndex === index ? 'bg-blue-50' : ''
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
                        src={getFileUrl(product.images[0] || '/placeholder.svg')}
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
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-700">
                      {(() => {
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
                        return category ? category.name : String(product.category || '')
                      })()}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-col">
                      {(() => {
                        // 获取所有SKU的价格
                        const prices = (product.skus || []).map(sku => ({
                          price: sku.price || 0,
                          discountPrice: sku.discountPrice || 0
                        }))
                        // 找到最低价格
                        const minPrice = prices.length > 0 ? Math.min(...prices.map(p => p.discountPrice > 0 && p.discountPrice < p.price ? p.discountPrice : p.price)) : 0
                        // 找到最低的划线价（原价）
                        const minOriginalPrice = prices.length > 0 ? Math.min(...prices.map(p => p.price)) : 0
                        const hasDiscount = prices.some(p => p.discountPrice > 0 && p.discountPrice < p.price)
                        
                          const roleMultiplier = getDiscountMultiplier(product.category)
                        const finalPrice = Math.round(minPrice * roleMultiplier)
                        const finalOriginal = Math.round(minOriginalPrice * roleMultiplier)
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
                      <button
                        onClick={() => navigate(`/admin/products/dashboard/${product._id}`)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="数据看板"
                      >
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(product._id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title={product.status === 'active' ? '下架' : '上架'}
                      >
                        {product.status === 'active' ? (
                          <EyeOff className="h-4 w-4 text-gray-600" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-600" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (currentRole === 'designer') {
                            navigate(`/admin/products/designer-edit/${product._id}`)
                          } else {
                            navigate(`/admin/products/edit/${product._id}`)
                          }
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(product._id, product.name)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
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
                    <td colSpan={9} className="py-4 px-4">
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
    </div>
  )
}

