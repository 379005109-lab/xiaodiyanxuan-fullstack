import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronLeft, Save } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { uploadFile, getFileUrl } from '@/services/uploadService';
import { getAllCategories, getCategoryTree } from '@/services/categoryService';
import { getProducts } from '@/services/productService';
import { toast } from 'sonner';

// 定义商品类型
// 定义套餐类型，用于存储
interface Package {
  id: number;
  name: string;
  price: number;
  image: string;
  images?: string[];
  tags: string[];
  selectedProducts: Record<string, Product[]>;
  optionalQuantities: Record<string, number>;
  productCount: number;
  categoryCount: number;
  channelPrice?: number;
  designerPrice?: number;
  status?: string;
}

// 定义商品类型
interface Product {
  _id: string;
  name: string;
  basePrice: number;
  images: string[];
  specs?: string;
  category: string;
  categoryName?: string;
  subCategory?: string;
}

const PackageManagementPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // 在编辑模式下，我们会从API加载数据，这里用模拟数据代替
  const [packageName, setPackageName] = useState('');
  const [packagePrice, setPackagePrice] = useState(0);
  const [packageImage, setPackageImage] = useState<string>(''); // Will store base64 image string
  const [packageImages, setPackageImages] = useState<string[]>([]); // Multiple images
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Record<string, Product[]>>({});
  const [optionalQuantities, setOptionalQuantities] = useState<Record<string, number>>({});
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [categoryTree, setCategoryTree] = useState<any[]>([]);

  // 递归获取某个分类及其所有子分类的ID和名称
  const getAllSubCategoryInfo = (categoryName: string, tree: any[]): { ids: string[], names: string[], map: Record<string, string> } => {
    const ids: string[] = [];
    const names: string[] = [categoryName];
    const map: Record<string, string> = {};  // id -> name的映射
    
    const findCategory = (name: string, categories: any[]): any => {
      for (const cat of categories) {
        if (cat.name === name) return cat;
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(name, cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const category = findCategory(categoryName, tree);
    if (category) {
      ids.push(category._id);
      map[category._id] = category.name;
      
      if (category.children && category.children.length > 0) {
        const collectChildren = (children: any[]): void => {
          children.forEach(child => {
            ids.push(child._id);
            names.push(child.name);
            map[child._id] = child.name;
            if (child.children && child.children.length > 0) {
              collectChildren(child.children);
            }
          });
        };
        collectChildren(category.children);
      }
    }
    
    return { ids, names, map };
  };

  // 加载分类和商品数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        console.log('🔄 开始加载数据...');
        
        // 加载分类树
        const tree = await getCategoryTree();
        console.log('📂 分类树API返回:', tree);
        const treeArray = Array.isArray(tree) ? tree : [];
        console.log('📂 分类树数组:', treeArray.length, '个分类');
        setCategoryTree(treeArray);
        
        // 只获取顶级分类作为标签
        const topLevelCategories = treeArray.filter(cat => !cat.parentId);
        const categoryNames = topLevelCategories.map(cat => cat.name);
        console.log('🏷️ 顶级分类标签:', categoryNames);
        setAllTags(categoryNames);
        
        // 加载商品
        console.log('🔄 开始加载商品...');
        const products = await getProducts();
        console.log('📦 商品API返回:', products);
        console.log('📦 商品类型:', typeof products, Array.isArray(products));
        
        const productsArray = Array.isArray(products) ? products : [];
        console.log('✅ 商品数组:', productsArray.length, '个商品');
        if (productsArray.length > 0) {
          console.log('📦 第一个商品示例:', productsArray[0]);
        }
        setAllProducts(productsArray);
      } catch (error) {
        console.error('❌ 加载数据失败:', error);
        toast.error('加载数据失败');
        setAllProducts([]);
        setAllTags([]);
        setCategoryTree([]);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      const existingPackages: Package[] = JSON.parse(localStorage.getItem('packages') || '[]');
      const packageToEdit = existingPackages.find(p => p.id === parseInt(id, 10));
      if (packageToEdit) {
        setPackageName(packageToEdit.name);
        setPackagePrice(packageToEdit.price);
        setPackageImage(packageToEdit.image);
        setPackageImages(packageToEdit.images || []);
        const packageTags = packageToEdit.tags || [];
        setTags(packageTags);
        setSelectedProducts(packageToEdit.selectedProducts || {});
        setOptionalQuantities(packageToEdit.optionalQuantities || {});
      }
    }
  }, [id, isEditing]);
  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [activeSubFilters, setActiveSubFilters] = useState<Record<string, string | null>>({});

  const handleQuantityChange = (category: string, quantity: number) => {
    setOptionalQuantities({
      ...optionalQuantities,
      [category]: Math.max(0, quantity) // 保证数量不为负
    });
  };

  const handleSearchChange = (category: string, term: string) => {
    setSearchTerms({ ...searchTerms, [category]: term });
  };

  const handleSubFilterChange = (category: string, subCategory: string | null) => {
    setActiveSubFilters({ ...activeSubFilters, [category]: subCategory });
  };

  const handleAddProduct = (product: Product, category: string) => {
    const currentSelected = selectedProducts[category] || [];
    // Check if the product is already selected
    if (!currentSelected.find(p => p._id === product._id)) {
      setSelectedProducts(prev => ({
        ...prev,
        [category]: [...(prev[category] || []), product]
      }));
    }
  };

  const handleRemoveProduct = (product: Product, category: string) => {
    const currentSelected = selectedProducts[category] || [];
    setSelectedProducts({
      ...selectedProducts,
      [category]: currentSelected.filter(p => p._id !== product._id)
    });
  };

  const handleToggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleAddNewTag = () => {
    if (newTag && !allTags.includes(newTag)) {
      setAllTags([...allTags, newTag]);
      setTags([...tags, newTag]);
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setAllTags(allTags.filter(tag => tag !== tagToRemove));
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        toast.info('正在上传...');
        const result = await uploadFile(file);
        if (result.success) {
          setPackageImage(result.data.fileId);
          toast.success('图片上传成功');
        }
      } catch (error) {
        toast.error('图片上传失败');
      }
    }
  };

  const handleMultipleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      toast.info(`正在上传${files.length}张图片...`);
      
      for (const file of files) {
        try {
          const result = await uploadFile(file);
          if (result.success) {
            setPackageImages(prev => [...prev, result.data.fileId]);
          }
        } catch (error) {
          console.error('图片上传失败:', error);
        }
      }
      toast.success(`${files.length}张图片上传成功`);
    }
  };

  const handleRemoveImage = (index: number) => {
    setPackageImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      const newImages = [...packageImages];
      const draggedImage = newImages[draggedIndex];
      newImages.splice(draggedIndex, 1);
      newImages.splice(index, 0, draggedImage);
      setPackageImages(newImages);
    }
    setDraggedIndex(null);
  };

  const handleSave = () => {
    // 从localStorage获取现有套餐列表
    const existingPackages: Package[] = JSON.parse(localStorage.getItem('packages') || '[]');
    
    // 获取原有套餐的利润信息（如果是编辑）
    let existingProfitData = {};
    if (isEditing && id) {
      const existingPackage = existingPackages.find(p => p.id === parseInt(id, 10));
      if (existingPackage) {
        existingProfitData = {
          channelPrice: existingPackage.channelPrice,
          designerPrice: existingPackage.designerPrice,
          status: existingPackage.status,
        };
      }
    }

    const newPackage = {
      id: isEditing ? parseInt(id!, 10) : Date.now(),
      name: packageName,
      price: packagePrice,
      image: packageImage || '/placeholder.svg',
      images: packageImages.length > 0 ? packageImages : undefined,
      tags,
      selectedProducts,
      optionalQuantities,
      productCount: Object.values(selectedProducts).reduce((acc, products) => acc + products.length, 0),
      categoryCount: tags.length,
      ...existingProfitData, // 保留原有的利润信息
    };

    if (isEditing) {
      // 更新现有套餐
      const packageIndex = existingPackages.findIndex(p => p.id === newPackage.id);
      if (packageIndex > -1) {
        existingPackages[packageIndex] = newPackage;
      }
    } else {
      // 添加新套餐
      existingPackages.push(newPackage);
    }

    // 将更新后的列表存回localStorage
    localStorage.setItem('packages', JSON.stringify(existingPackages));

    alert('套餐已保存！');
    navigate('/admin/packages');
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/packages')}
          className="p-2 hover:bg-white rounded-lg transition-colors"
          title="返回套餐列表"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-3xl font-bold">{isEditing ? '编辑套餐' : '创建新套餐'}</h1>
      </div>

      {/* 1. 套餐图片 */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">套餐主图</h2>
        
        {/* 主图上传 */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">主图</label>
          <div 
            className="w-full max-w-2xl h-64 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-500 bg-gray-50 transition-colors"
            onClick={() => document.getElementById('packageImageInput')?.click()}
          >
            <input 
              type="file" 
              id="packageImageInput"
              className="hidden" 
              accept="image/*"
              onChange={handleImageChange} 
            />
            {packageImage ? (
              <img src={getFileUrl(packageImage)} alt="套餐预览" className="h-full w-full object-contain rounded-lg" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }} />
            ) : (
              <div className="text-center text-gray-500">
                <Plus className="mx-auto h-12 w-12" />
                <p className="mt-2">点击上传套餐主图</p>
                <p className="text-xs mt-1">建议尺寸：800x400px</p>
              </div>
            )}
          </div>
        </div>

        {/* 多张图片上传 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            详情图片 ({packageImages.length} 张)
          </label>
          <div 
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 bg-gray-50 transition-colors mb-4"
            onClick={() => document.getElementById('packageMultipleImagesInput')?.click()}
          >
            <input 
              type="file" 
              id="packageMultipleImagesInput"
              className="hidden" 
              accept="image/*"
              multiple
              onChange={handleMultipleImagesChange} 
            />
            <Plus className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-600 font-medium">点击或拖拽上传多张图片</p>
            <p className="text-xs text-gray-400 mt-1">支持长按拖动改变图片顺序</p>
          </div>

          {/* 图片列表 - 可拖动排序 */}
          {packageImages.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {packageImages.map((image, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                    draggedIndex === index 
                      ? 'border-primary-500 opacity-50' 
                      : 'border-gray-200 hover:border-primary-500'
                  }`}
                >
                  <img 
                    src={getFileUrl(image)} 
                    alt={`图片 ${index + 1}`}
                    className="w-full h-32 object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(index);
                        }}
                        className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                        title="删除图片"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                  {draggedIndex === index && (
                    <div className="absolute inset-0 flex items-center justify-center bg-primary-500 bg-opacity-20">
                      <span className="text-primary-600 font-semibold">拖动中...</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. 套餐基本信息 */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">基本信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">套餐名称</label>
            <input type="text" value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="例如：温馨卧室三人套餐" className="input w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">套餐价格</label>
            <input type="number" value={packagePrice} onChange={(e) => setPackagePrice(parseFloat(e.target.value))} placeholder="套餐最终售价" className="input w-full" />
          </div>
        </div>
      </div>

      {/* 3. 标签管理 */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-semibold mb-4">商品类别标签</h2>
        <div className="flex flex-wrap gap-2 items-center">
          {allTags.map(tag => (
            <button 
              key={tag} 
              onClick={() => handleToggleTag(tag)}
              className={`btn relative group ${tags.includes(tag) ? 'btn-primary' : 'btn-secondary'}`}>
              {tag}
              <span onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={12} />
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4">
          {isAddingTag ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddNewTag()}
                placeholder="新标签名称"
                className="input input-sm"
                autoFocus
              />
              <button onClick={handleAddNewTag} className="btn btn-primary btn-sm">确认</button>
              <button onClick={() => setIsAddingTag(false)} className="btn btn-secondary btn-sm">取消</button>
            </div>
          ) : (
            <button onClick={() => setIsAddingTag(true)} className="btn btn-secondary btn-sm flex items-center gap-1">
              <Plus size={16} /> 添加标签
            </button>
          )}
        </div>
      </div>

      {/* 4. 商品选择 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">选择商品组成套餐</h2>
        
        {isLoadingData ? (
          <div className="text-center py-8 text-gray-500">加载商品数据中...</div>
        ) : tags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">请先选择商品类别标签</div>
        ) : (
          tags.map(category => {
          // 获取该分类及其所有子分类的ID和名称
          const categoryInfo = getAllSubCategoryInfo(category, categoryTree);
          const { ids: allCategoryIds, names: allCategoryNames, map: categoryIdToName } = categoryInfo;
          
          // 调试输出
          console.log('===== 调试信息 =====');
          console.log('选中的分类:', category);
          console.log('所有分类ID:', allCategoryIds);
          console.log('所有分类名称:', allCategoryNames);
          console.log('所有商品数量:', allProducts.length);
          console.log('前5个商品的category:', allProducts.slice(0, 5).map(p => ({
            name: p.name,
            category: p.category,
            categoryType: typeof p.category
          })));
          
          // 尝试按分类过滤商品
          // 如果没有匹配的商品，则显示所有商品让用户选择
          let availableProducts = Array.isArray(allProducts) 
            ? allProducts.filter(p => {
                if (!p.category) return false;
                
                // 商品的category可能是：
                // 1. 字符串ID："6921ee98..."
                // 2. 对象：{id: "...", name: "..."}
                // 3. 分类名称："极简风格沙发"
                let pCategoryId = null;
                let pCategoryName = null;
                
                if (typeof p.category === 'string') {
                  // 字符串可能是ID或名称
                  pCategoryId = p.category;
                  pCategoryName = p.category;
                } else if (p.category && typeof p.category === 'object') {
                  pCategoryId = (p.category as any).id || (p.category as any)._id;
                  pCategoryName = (p.category as any).name;
                }
                
                // 按ID匹配或按名称匹配
                const matchedById = pCategoryId && allCategoryIds.includes(pCategoryId);
                const matchedByName = pCategoryName && allCategoryNames.includes(pCategoryName);
                const matched = matchedById || matchedByName;
                
                if (!matched && p.category) {
                  console.log('未匹配的商品:', p.name, '分类:', p.category, 'ID:', pCategoryId, '名称:', pCategoryName);
                }
                return matched;
              })
            : [];
          
          console.log('按分类过滤后的商品数量:', availableProducts.length);
          
          // 如果按分类过滤后没有商品，则显示所有商品
          if (availableProducts.length === 0) {
            console.log('⚠️ 没有匹配的商品，显示所有商品供选择');
            availableProducts = Array.isArray(allProducts) ? allProducts : [];
          }
          
          console.log('最终可选商品数量:', availableProducts.length);
          console.log('==================');
            
          // 按子分类分组
          const productsBySubCategory: Record<string, typeof availableProducts> = {};
          availableProducts.forEach(product => {
            // 获取商品的分类名称用于分组显示
            let displayName = '其他';
            
            if (typeof product.category === 'string') {
              // 如果是字符串，先尝试从映射表中找，找不到就直接使用该字符串
              displayName = categoryIdToName[product.category] || product.category;
            } else if (product.category && typeof product.category === 'object') {
              const catId = (product.category as any).id || (product.category as any)._id;
              const catName = (product.category as any).name;
              displayName = categoryIdToName[catId] || catName || '其他';
            }
            
            if (!productsBySubCategory[displayName]) {
              productsBySubCategory[displayName] = [];
            }
            productsBySubCategory[displayName].push(product);
          });
          const currentSelected = selectedProducts[category] || [];
          
          return (
            <div key={category} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{category}</h3>
                <div className="bg-gray-100 p-2 rounded-md flex items-center gap-2">
                  <span className="font-semibold text-gray-700">已选:</span>
                  <span className="font-bold text-blue-600 text-lg">{currentSelected.length}</span>
                  <span className="text-gray-400">/</span>
                  <span className="font-semibold text-gray-700">可选:</span>
                  <input 
                    type='number' 
                    className='w-16 text-center border rounded-md font-bold text-lg text-green-600' 
                    value={optionalQuantities[category] || 1}
                    onChange={(e) => handleQuantityChange(category, parseInt(e.target.value, 10))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左侧：可选商品列表 */}
                <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">可选商品 ({availableProducts.length})</h4>
                      {availableProducts.length === allProducts.length && allProducts.length > 0 && (
                        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          显示所有商品（未找到匹配分类的商品）
                        </span>
                      )}
                    </div>
                    <input 
                      type="text" 
                      placeholder="搜索商品..."
                      className="input input-sm w-48"
                      value={searchTerms[category] || ''}
                      onChange={(e) => handleSearchChange(category, e.target.value)}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button 
                      onClick={() => handleSubFilterChange(category, null)}
                      className={`btn btn-xs ${!activeSubFilters[category] ? 'btn-primary' : 'btn-secondary'}`}>
                      全部 ({availableProducts.length})
                    </button>
                    {Object.keys(productsBySubCategory).map(subCat => (
                      <button 
                        key={subCat} 
                        onClick={() => handleSubFilterChange(category, subCat)}
                        className={`btn btn-xs ${activeSubFilters[category] === subCat ? 'btn-primary' : 'btn-secondary'}`}>
                        {subCat} ({productsBySubCategory[subCat].length})
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableProducts
                      .filter(p => {
                        const searchTermMatch = p.name.toLowerCase().includes((searchTerms[category] || '').toLowerCase());
                        
                        // 获取商品的分类名称（用于筛选）
                        let displayName = '其他';
                        if (typeof p.category === 'string') {
                          displayName = categoryIdToName[p.category] || p.category;
                        } else if (p.category && typeof p.category === 'object') {
                          const catId = (p.category as any).id || (p.category as any)._id;
                          const catName = (p.category as any).name;
                          displayName = categoryIdToName[catId] || catName || '其他';
                        }
                        
                        const subFilterMatch = !activeSubFilters[category] || displayName === activeSubFilters[category];
                        return searchTermMatch && subFilterMatch;
                      })
                      .map(product => (
                      <div key={product._id} className="border rounded-md p-3 flex items-start gap-4 bg-white">
                        <img src={product.images?.[0] ? getFileUrl(product.images[0]) : '/placeholder.svg'} alt={product.name} className="w-20 h-20 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{product.name}</p>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {(() => {
                                if (typeof product.category === 'string') {
                                  return categoryIdToName[product.category] || product.category;
                                } else if (product.category && typeof product.category === 'object') {
                                  const catId = (product.category as any).id || (product.category as any)._id;
                                  const catName = (product.category as any).name;
                                  return categoryIdToName[catId] || catName || '未分类';
                                }
                                return '未分类';
                              })()}
                            </span>
                          </div>
                          <p className="text-sm text-red-500">{formatPrice(product.basePrice)}</p>
                          {product.specs && <p className="text-xs text-gray-500 mt-1">规格: {product.specs}</p>}
                        </div>
                        {currentSelected.find(p => p._id === product._id) ? (
                          <span className="text-sm text-green-600 font-semibold self-center">已添加</span>
                        ) : (
                          <button onClick={() => handleAddProduct(product, category)} className="btn-primary btn-sm self-center">添加</button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 右侧：已选商品列表 */}
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <h4 className="font-semibold mb-2">已选商品</h4>
                  <div className="space-y-3">
                    {currentSelected.map(product => (
                      <div key={product._id} className="border rounded-md p-3 flex items-start gap-4 bg-white">
                        <img src={product.images?.[0] ? getFileUrl(product.images[0]) : '/placeholder.svg'} alt={product.name} className="w-20 h-20 object-cover rounded" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg' }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">{product.name}</p>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              {(() => {
                                if (typeof product.category === 'string') {
                                  return categoryIdToName[product.category] || product.category;
                                } else if (product.category && typeof product.category === 'object') {
                                  const catId = (product.category as any).id || (product.category as any)._id;
                                  const catName = (product.category as any).name;
                                  return categoryIdToName[catId] || catName || '未分类';
                                }
                                return '未分类';
                              })()}
                            </span>
                          </div>
                          <p className="text-sm text-red-500">{formatPrice(product.basePrice)}</p>
                        </div>
                        <button onClick={() => handleRemoveProduct(product, category)} className="btn-danger btn-sm self-center">删除</button>
                      </div>
                    ))}
                    {currentSelected.length === 0 && <p className='text-sm text-gray-500'>暂未选择商品</p>}
                  </div>
                </div>
              </div>
            </div>
          )
        })
        )}
      </div>

      {/* 5. 操作按钮 */}
      <div className="flex justify-end gap-4 mt-8 mb-6">
        <button 
          onClick={() => navigate('/admin/packages')} 
          className="btn btn-secondary flex items-center gap-2"
        >
          取消
        </button>
        <button 
          onClick={handleSave} 
          className="btn btn-primary flex items-center gap-2"
        >
          <Save size={18} />
          保存套餐
        </button>
      </div>

    </div>
  );
};

export default PackageManagementPage;
