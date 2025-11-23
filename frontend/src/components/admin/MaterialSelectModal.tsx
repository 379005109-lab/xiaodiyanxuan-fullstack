import { useState, useEffect } from 'react'
import { X, Search, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Material, MaterialCategory } from '@/types'
import { getAllMaterials, getMaterialCategoryTree } from '@/services/materialService'
import { getFileUrl } from '@/services/uploadService'

interface MaterialSelectModalProps {
  onSelect: (material: Material, upgradePrice?: number) => void
  onClose: () => void
  onUpdatePrices?: (prices: Record<string, number>) => void // 更新材质类别价格
  multiple?: boolean // 是否支持多选
  selectedMaterials?: string[] // 已选择的材质名称列表
  materialUpgradePrices?: Record<string, number> // 材质升级价格 { [categoryKey]: price }
  materialType?: 'fabric' | 'filling' | 'frame' | 'leg' // 材质类型，用于自动筛选
  skuIsPro?: boolean // SKU 是否为 PRO 版本
}

export default function MaterialSelectModal({ onSelect, onClose, onUpdatePrices, multiple = false, selectedMaterials = [], materialUpgradePrices = {}, materialType, skuIsPro = false }: MaterialSelectModalProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedMaterials)
  const [categoryPrices, setCategoryPrices] = useState<Record<string, number>>(materialUpgradePrices || {})

  // 根据材质类型获取对应的分类ID映射
  const getMaterialTypeCategoryId = () => {
    const categoryMap: Record<string, string> = {
      'fabric': '7',      // 面料
      'filling': '8',     // 填充
      'frame': '9',       // 框架
      'leg': '10'         // 脚架
    }
    return materialType ? categoryMap[materialType] : ''
  }

  useEffect(() => {
    loadMaterials()
    loadCategories()
    setSelectedIds(selectedMaterials)
    setCategoryPrices(materialUpgradePrices || {})
    // 如果指定了材质类型，自动筛选对应分类
    if (materialType) {
      setSelectedCategoryId(getMaterialTypeCategoryId())
    }
  }, [selectedMaterials, materialUpgradePrices, materialType])

  const loadMaterials = async () => {
    try {
      const allMaterials = await getAllMaterials()
      // 确保allMaterials是数组，只显示已上线的材质
      const materialsArray = Array.isArray(allMaterials) ? allMaterials : []
      setMaterials(materialsArray.filter(m => m.status === 'approved'))
    } catch (error) {
      console.error('加载材质失败:', error)
      setMaterials([])
    }
  }

  const loadCategories = async () => {
    try {
      const tree = await getMaterialCategoryTree()
      setCategories(Array.isArray(tree) ? tree : [])
    } catch (error) {
      console.error('加载分类失败:', error)
      setCategories([])
    }
  }

  // 获取材质所属的类别
  const getMaterialCategory = (materialName: string): string => {
    if (materialName.includes('普通皮')) return '普通皮'
    if (materialName.includes('全青皮')) return '全青皮'
    if (materialName.includes('牛皮')) return '牛皮'
    if (materialName.includes('绒布')) return '绒布'
    if (materialName.includes('麻布')) return '麻布'
    return 'other'
  }

  // 批量设置类别价格
  const handleCategoryPriceChange = (categoryKey: string, price: number) => {
    const newPrices = { ...categoryPrices, [categoryKey]: price }
    setCategoryPrices(newPrices)
    // 不在 onChange 时立即调用 onUpdatePrices，避免触发父组件重新渲染导致模态框关闭
    // 价格会在确认选择时通过 handleConfirm 传递
  }

  // 一键全选某个类别的所有材质
  const handleSelectAllInCategory = (categoryKey: string, materialsInCategory: Material[]) => {
    if (!multiple) return
    
    const categoryMaterialNames = materialsInCategory.map(m => m.name)
    const allSelected = categoryMaterialNames.every(name => selectedIds.includes(name))
    
    if (allSelected) {
      // 如果全部已选，则取消全选
      setSelectedIds(prev => prev.filter(id => !categoryMaterialNames.includes(id)))
      toast.success(`已取消选择 ${categoryKey} 类别`)
    } else {
      // 否则全选该类别
      const newIds = new Set(selectedIds)
      categoryMaterialNames.forEach(name => newIds.add(name))
      setSelectedIds(Array.from(newIds))
      toast.success(`已全选 ${categoryKey} 类别 (${categoryMaterialNames.length} 个)`)
    }
  }

  const handleSelect = (material: Material) => {
    // 检查 PRO 限制
    if (material.isPro && !skuIsPro) {
      toast.error('此材质为 PRO 材质，需要开启 SKU 的 PRO 功能才能使用')
      return
    }

    if (multiple) {
      // 多选模式：切换选择状态
      setSelectedIds(prev => {
        if (prev.includes(material.name)) {
          // 取消选择
          return prev.filter(name => name !== material.name)
        } else {
          // 添加选择
          return [...prev, material.name]
        }
      })
    } else {
      // 单选模式：直接选择并关闭
      onSelect(material)
      onClose()
      toast.success(`已选择材质：${material.name}`)
    }
  }


  // 材质分组的介绍信息
  const groupDescriptions: Record<string, string> = {
    '普通皮': '普通皮革，经济实惠，适合日常使用。具有良好的耐用性和易清洁特性。',
    '全青皮': '全青皮是高级皮革，采用天然植物鞣制工艺，具有独特的质感和气味。随着使用时间增长，颜色会逐渐加深，形成独特的包浆效果。',
    '牛皮': '优质牛皮，纹理自然，质感细腻。具有很好的透气性和耐磨性。',
    '绒布': '柔软舒适的绒布面料，触感温暖。易于清洁，适合家庭使用。',
    '麻布': '天然麻布，环保透气，具有独特的质感。适合现代简约风格。',
  };


  const handleConfirm = () => {
    if (multiple && selectedIds.length > 0) {
      // 多选模式：返回选中的材质
      const selectedMaterials = materials.filter(m => selectedIds.includes(m.name))
      selectedMaterials.forEach(material => {
        onSelect(material)
      })
      // 在确认时才调用 onUpdatePrices，避免频繁触发父组件重新渲染
      if (onUpdatePrices) {
        onUpdatePrices(categoryPrices)
      }
      toast.success(`已选择 ${selectedIds.length} 个材质`)
      onClose()
    }
  }

  // 筛选材质
  const filteredMaterials = materials.filter(material => {
    if (selectedCategoryId && material.categoryId !== selectedCategoryId) {
      return false
    }
    if (searchQuery && !material.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  // 渲染分类选择
  const renderCategoryOptions = (cats: MaterialCategory[], level: number = 0): JSX.Element[] => {
    const elements: JSX.Element[] = []
    
    cats.forEach(cat => {
      elements.push(
        <option key={cat._id} value={cat._id}>
          {'\u00A0'.repeat(level * 4)}{cat.name}
        </option>
      )
      
      if (cat.children && cat.children.length > 0) {
        elements.push(...renderCategoryOptions(cat.children, level + 1))
      }
    })
    
    return elements
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">选择材质</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 筛选栏 */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">分类筛选</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="input w-full"
              >
                <option value="">全部分类</option>
                {renderCategoryOptions(categories)}
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">搜索材质</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="输入材质名称"
                  className="input pl-9 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 材质列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredMaterials.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>暂无可选材质</p>
              <p className="text-sm mt-2">请先在素材管理中添加并审核材质</p>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                // 按材质类型分组
                const materialGroups: Record<string, typeof filteredMaterials> = {};
                const groupOrder: string[] = [];
                
                filteredMaterials.forEach(material => {
                  // 通用分组逻辑：按"-"分隔符提取前缀
                  // 例如："全青皮-黑色" → "全青皮"
                  // "磨砂布-灰色" → "磨砂布"
                  // "单独材质" → "单独材质"（没有"-"的保持原样）
                  let groupKey = material.name;
                  const dashIndex = material.name.indexOf('-');
                  if (dashIndex > 0) {
                    // 有"-"分隔符，取前缀作为groupKey
                    groupKey = material.name.substring(0, dashIndex);
                  }
                  // 否则使用完整名称作为groupKey（独立材质）
                  
                  if (!materialGroups[groupKey]) {
                    materialGroups[groupKey] = [];
                    groupOrder.push(groupKey);
                  }
                  materialGroups[groupKey].push(material);
                });
                
                return groupOrder.map(groupKey => {
                  const materialsInGroup = materialGroups[groupKey] || [];
                  const categoryMaterialNames = materialsInGroup.map(m => m.name);
                  const allSelected = categoryMaterialNames.every(name => selectedIds.includes(name));
                  
                  return (
                  <div key={groupKey}>
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-700">{groupKey}</h3>
                        {groupKey !== 'other' && (
                          <div className="group relative">
                            <Info className="w-4 h-4 text-blue-500 cursor-help hover:text-blue-600" />
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap z-50">
                              {groupDescriptions[groupKey] || '暂无介绍'}
                            </div>
                          </div>
                        )}
                        {multiple && (
                          <button
                            onClick={() => handleSelectAllInCategory(groupKey, materialsInGroup)}
                            className={`ml-2 px-2 py-0.5 text-xs rounded border transition-colors ${
                              allSelected
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200'
                            }`}
                          >
                            {allSelected ? '✓ 已全选' : '全选'}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <span className="text-xs text-gray-500">批量设置价格：</span>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs text-gray-600">+</span>
                          <input
                            type="number"
                            placeholder="0"
                            value={categoryPrices[groupKey] ?? ''}
                            onChange={(e) => {
                              e.stopPropagation()
                              const price = parseFloat(e.target.value) || 0
                              handleCategoryPriceChange(groupKey, price)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            onKeyUp={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-xs"
                          />
                          <span className="text-xs text-gray-600">元</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {materialGroups[groupKey].map((material) => {
                        const isSelected = selectedIds.includes(material.name)
                        return (
                          <div
                            key={material._id}
                            onClick={() => handleSelect(material)}
                            className={`border rounded-lg overflow-hidden cursor-pointer hover:border-primary-500 hover:shadow-md transition-all relative ${
                              isSelected ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200' : 'border-gray-200'
                            } ${material.isPro && !skuIsPro ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {/* PRO 标识 */}
                            {material.isPro && (
                              <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-0.5 rounded text-xs font-bold z-20">
                                PRO
                              </div>
                            )}
                            
                            {/* 禁用提示 */}
                            {material.isPro && !skuIsPro && (
                              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-15">
                                <span className="text-white text-xs font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                                  需要开启 PRO
                                </span>
                              </div>
                            )}
                            
                            {multiple && isSelected && (
                              <div className="absolute top-2 right-2 bg-primary-600 text-white rounded-full p-1 z-10">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                            <div className="relative pb-[100%]">
                              <img
                                src={getFileUrl(material.image)}
                                alt={material.name}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.svg'
                                }}
                              />
                            </div>
                            <div className="p-3">
                              <h3 className="font-semibold text-sm mb-1 truncate" title={material.name}>
                                {material.name}
                              </h3>
                              <p className="text-xs text-gray-500 truncate" title={material.categoryName}>
                                {material.categoryName}
                              </p>
                              {material.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {material.tags.slice(0, 2).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {material.tags.length > 2 && (
                                    <span className="text-xs text-gray-400">+{material.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
                })
              })()}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-4 p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600 mr-auto">
            共 {filteredMaterials.length} 个材质
            {multiple && selectedIds.length > 0 && (
              <span className="ml-2 text-primary-600">已选择 {selectedIds.length} 个</span>
            )}
          </p>
          {multiple && (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.length === 0}
              className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认选择 ({selectedIds.length})
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-6 py-2"
          >
            {multiple ? '取消' : '关闭'}
          </button>
        </div>
      </div>
    </div>
  )
}

