import { useState, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Edit, Trash2, Eye, EyeOff, FileSpreadsheet, Download, ChevronDown, ChevronUp, BarChart3, ImageIcon, FolderOpen } from 'lucide-react'
import { formatPrice, formatDate } from '@/lib/utils'
import { Product, UserRole } from '@/types'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
// 使用后端 API 服务
import { getProducts, deleteProduct, toggleProductStatus, createProduct, updateProduct, getProductById } from '@/services/productService'
import { getAllCategories, Category } from '@/services/categoryService'
import { getAllMaterials, getAllMaterialCategories } from '@/services/materialService'
import { Material, MaterialCategory } from '@/types'
import { createCategoryLookup, getRoleDiscountMultiplier } from '@/utils/categoryHelper'
import { useAuthStore } from '@/store/authStore'
import { getFileUrl, uploadFile, getThumbnailUrl } from '@/services/uploadService'

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
  
  // 批量图片上传状态
  const [batchImageUploading, setBatchImageUploading] = useState(false)
  
  // 文件夹上传选中的商品
  const [folderUploadProductId, setFolderUploadProductId] = useState<string | null>(null)

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

      // 加载材质库数据用于自动匹配
      const allMaterials = await getAllMaterials();
      const materialCategories = await getAllMaterialCategories();
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
        
        // 方法3：模糊匹配 - 检查类别前缀是否包含关键词
        if (materialType) {
          const fuzzyMatch = categoryPrefixes.find(prefix => {
            // 检查前缀是否以 A-E 开头且包含材质类型
            const startsWithGrade = /^[A-Ea-e][+]?/.test(prefix);
            const containsType = prefix.includes(materialType);
            return startsWithGrade && containsType;
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
          
          // 直接用颜色字段值作为前缀来筛选所有材质
          // 例如：颜色="B类雪尼尔绒"，则匹配所有以"B类雪尼尔绒-"开头的材质
          const childSkus = allMaterials
            .filter(m => m.name.startsWith(colorFilterCategory + '-') || 
                         m.name.startsWith(colorFilterCategory + '—'))
            .map(m => m.name);
          
          if (childSkus.length > 0) {
            matchedNames.push(...childSkus);
            console.log(`✓ 颜色筛选匹配: "${colorFilterCategory}" -> 找到 ${childSkus.length} 个SKU`);
            console.log(`  前3个: ${childSkus.slice(0, 3).join(', ')}`);
          } else {
            console.log(`⚠️ 颜色筛选未找到匹配的SKU: "${colorFilterCategory}"`);
            console.log(`  可用材质示例: ${allMaterials.slice(0, 5).map(m => m.name).join(', ')}`);
          }
          
          // 解析面料列中的加价信息
          const entries = text.split(/[\n,，、]/).map(s => s.trim()).filter(s => s);
          entries.forEach(entry => {
            const priceMatch = entry.match(/^(.+?)\s*[+＋]\s*(\d+)$/);
            if (priceMatch) {
              totalUpgradePrice = parseInt(priceMatch[2]) || 0;
              console.log(`  解析加价: "${entry}" -> 加价=${totalUpgradePrice}元`);
            }
          });
          
          // 直接返回颜色筛选结果，不再继续处理
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
      const response = await getProducts({ pageSize: 200 });
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

  // 批量图片上传处理
  // 图片命名规则：
  // 1. 商品主图: "商品名称1.jpg", "商品名称2.jpg" 或 "商品名称_1.jpg" -> 匹配商品名称，按序号排列
  // 2. SKU图片: "型号_1.jpg", "型号_2.jpg" 或 "型号1.jpg" -> 匹配SKU的code字段
  const handleBatchImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setBatchImageUploading(true)
    const toastId = toast.loading(`正在处理 ${files.length} 张图片...`)
    
    try {
      // 解析图片文件名，提取名称、SKU型号和序号
      // 支持格式: 
      // - "008-01云沙发（1）.png" -> skuCode="008-01", productName="云沙发", index=1
      // - "劳伦斯1.jpg", "劳伦斯 1.jpg", "劳伦斯_1.jpg"
      // - "劳伦斯（1）.jpg", "劳伦斯(1).jpg"
      // - "C100-01_1.jpg", "C100-01 1.jpg"
      const parseFileName = (fileName: string) => {
        // 移除扩展名（支持更多格式）
        const nameWithoutExt = fileName.replace(/\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|svg|ico|heic|heif|avif|raw)$/i, '').trim()
        
        console.log(`解析文件名: "${fileName}" -> 去扩展名: "${nameWithoutExt}"`)
        
        // 特殊格式1: "008-SKU2云沙发（1）" 或 "008-01云沙发 (2)" -> 商品型号-SKU型号+商品名称+（序号）
        // 匹配: 数字-字母数字+任意字符+括号序号（支持括号前有空格）
        const skuFormatMatch = nameWithoutExt.match(/^(\d+[-][A-Za-z0-9]+)(.+?)\s*[（(\s]+(\d+)[）)\s]*$/)
        if (skuFormatMatch) {
          const skuCode = skuFormatMatch[1] // "008-SKU2"
          const productName = skuFormatMatch[2].trim() // "云沙发"
          const index = parseInt(skuFormatMatch[3]) // 1
          console.log(`✓ 解析SKU格式: skuCode="${skuCode}", productName="${productName}", index=${index}`)
          return { baseName: productName, skuCode, index }
        }
        
        // 特殊格式2: "008-SKU2云沙发1" 或 "008-01云沙发 1" (无括号)
        const skuFormatMatch2 = nameWithoutExt.match(/^(\d+[-][A-Za-z0-9]+)(.+?)[\s_]?(\d+)$/)
        if (skuFormatMatch2) {
          const skuCode = skuFormatMatch2[1]
          const productName = skuFormatMatch2[2].trim()
          const index = parseInt(skuFormatMatch2[3])
          console.log(`✓ 解析SKU格式2: skuCode="${skuCode}", productName="${productName}", index=${index}`)
          return { baseName: productName, skuCode, index }
        }
        
        // 特殊格式3: 兼容纯数字格式 "008-01云沙发（1）"
        const numericSkuMatch = nameWithoutExt.match(/^(\d+[-]\d+)(.+?)\s*[（(\s]+(\d+)[）)\s]*$/)
        if (numericSkuMatch) {
          const skuCode = numericSkuMatch[1] // "008-01"
          const productName = numericSkuMatch[2].trim() // "云沙发"
          const index = parseInt(numericSkuMatch[3]) // 1
          console.log(`✓ 解析数字SKU格式: skuCode="${skuCode}", productName="${productName}", index=${index}`)
          return { baseName: productName, skuCode, index }
        }
        
        // 普通格式1: 括号格式 "名称（1）" 或 "名称(1)"
        const bracketMatch = nameWithoutExt.match(/^(.+?)\s*[（(](\d+)[）)]$/)
        if (bracketMatch) {
          return { baseName: bracketMatch[1].trim(), skuCode: undefined, index: parseInt(bracketMatch[2]) }
        }
        
        // 普通格式2: 分隔符+数字 "名称_1" 或 "名称-1" 或 "名称 1"
        const separatorMatch = nameWithoutExt.match(/^(.+?)[\s_](\d+)$/)
        if (separatorMatch) {
          return { baseName: separatorMatch[1].trim(), skuCode: undefined, index: parseInt(separatorMatch[2]) }
        }
        
        // 普通格式3: 直接数字结尾 "名称1"
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
              <label className={`btn-primary flex items-center cursor-pointer ${batchImageUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <ImageIcon className="h-5 w-5 mr-2" />
                {batchImageUploading ? '上传中...' : '批量图片'}
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.tif,.svg,.ico,.heic,.heif,.avif,image/*"
                  multiple
                  className="hidden"
                  onChange={handleBatchImageUpload}
                  disabled={batchImageUploading}
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

