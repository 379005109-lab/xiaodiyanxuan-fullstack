import { useState, useEffect } from 'react'
import type { DragEvent } from 'react'
import { motion } from 'framer-motion'
import {
  Plus, Search, FolderTree, Image, ChevronRight, ChevronDown,
  Trash2, RotateCcw, Eye, EyeOff, CheckCircle, XCircle, Clock, Edit
} from 'lucide-react'
import { toast } from 'sonner'
import { Material, MaterialCategory } from '@/types'
import {
  getAllMaterials,
  getMaterialCategoryTree,
  getAllMaterialCategories,
  deleteMaterial,
  deleteMaterials,
  updateMaterial,
  getMaterialStats,
  updateMaterialCategory,
} from '@/services/materialService'
import { getFileUrl } from '@/services/uploadService'
import MaterialFormModal from '@/components/admin/MaterialFormModal'
import MaterialReviewModal from '@/components/admin/MaterialReviewModal'
import CategoryFormModal from '@/components/admin/MaterialCategoryModal'
import MaterialSKUModal from '@/components/admin/MaterialSKUModal'

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([])
  const [categories, setCategories] = useState<MaterialCategory[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [expandedMaterialGroups, setExpandedMaterialGroups] = useState<Record<string, boolean>>({})
  const [expandedSKUGroup, setExpandedSKUGroup] = useState<string | null>(null)
  const [skuListOrder, setSkuListOrder] = useState<Record<string, string[]>>({})
  
  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  
  // 批量选择
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  
  // 拖拽状态
  const [draggedCategory, setDraggedCategory] = useState<MaterialCategory | null>(null)
  const [draggedMaterial, setDraggedMaterial] = useState<Material | null>(null)
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null)
  const [dragOverMaterialIndex, setDragOverMaterialIndex] = useState<number | null>(null)
  
  // 模态框
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null)
  const [reviewingMaterial, setReviewingMaterial] = useState<Material | null>(null)
  const [editingCategory, setEditingCategory] = useState<MaterialCategory | null>(null)
  const [pendingMaterialModal, setPendingMaterialModal] = useState<Material | null>(null) // 用于记住待打开的素材表单
  const [showSKUModal, setShowSKUModal] = useState(false)
  const [selectedMaterialForSKU, setSelectedMaterialForSKU] = useState<Material | null>(null)
  
  // 统计
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    offline: 0,
  })

  useEffect(() => {
    loadMaterials()
    loadCategories()
    loadStats()
  }, [])

  const loadMaterials = async () => {
    const allMaterials = await getAllMaterials()
    setMaterials(allMaterials)
  }

  const loadCategories = async () => {
    const tree = await getMaterialCategoryTree()
    setCategories(tree)
    // 默认展开第一个分类
    if (tree.length > 0) {
      setExpandedIds([tree[0]._id])
    }
  }

  const loadStats = async () => {
    const materialStats = await getMaterialStats()
    setStats(materialStats)
  }

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedIds([])
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`确定要删除素材"${name}"吗？`)) {
      try {
        await deleteMaterial(id)
        toast.success('素材已删除')
        loadMaterials()
        loadStats()
      } catch (error) {
        toast.error('删除失败')
      }
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) {
      toast.error('请选择要删除的素材')
      return
    }
    
    if (confirm(`确定要删除选中的 ${selectedIds.length} 个素材吗？`)) {
      try {
        await deleteMaterials(selectedIds)
        toast.success(`已删除 ${selectedIds.length} 个素材`)
        setSelectedIds([])
        loadMaterials()
        loadStats()
      } catch (error) {
        toast.error('删除失败')
      }
    }
  }

  const handleSelectAll = () => {
    if (selectedIds.length === filteredMaterials.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredMaterials.map(m => m._id))
    }
  }

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleChangeStatus = async (id: string, status: 'approved' | 'offline') => {
    try {
      await updateMaterial(id, { status })
      toast.success('状态已更新')
      loadMaterials()
      loadStats()
    } catch (error) {
      toast.error('更新失败')
    }
  }

  const handleReview = (material: Material) => {
    setReviewingMaterial(material)
    setShowReviewModal(true)
  }

  const handleModalClose = () => {
    setShowMaterialModal(false)
    setShowCategoryModal(false)
    setShowReviewModal(false)
    setEditingMaterial(null)
    setEditingCategory(null)
    setReviewingMaterial(null)
    loadMaterials()
    loadCategories()
    loadStats()
  }

  // 分类拖拽处理
  const handleCategoryDragStart = (e: DragEvent, category: MaterialCategory) => {
    setDraggedCategory(category)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleCategoryDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleCategoryDrop = async (e: DragEvent, targetCategory: MaterialCategory) => {
    e.preventDefault()
    
    if (!draggedCategory || draggedCategory._id === targetCategory._id) {
      setDraggedCategory(null)
      return
    }

    if (draggedCategory.parentId !== targetCategory.parentId) {
      toast.error('只能在同级分类之间调整顺序')
      setDraggedCategory(null)
      return
    }

    try {
      const allCategories = await getAllMaterialCategories()
      let sameLevelCategories = allCategories
        .filter(cat => cat.parentId === draggedCategory.parentId)
        .sort((a, b) => a.order - b.order)

      const draggedIndex = sameLevelCategories.findIndex(cat => cat._id === draggedCategory._id)
      const targetIndex = sameLevelCategories.findIndex(cat => cat._id === targetCategory._id)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedCategory(null)
        return
      }

      const [draggedItem] = sameLevelCategories.splice(draggedIndex, 1)
      sameLevelCategories.splice(targetIndex, 0, draggedItem)

      sameLevelCategories.forEach((cat, index) => {
        updateMaterialCategory(cat._id, { order: index + 1 })
      })

      toast.success('顺序已调整')
      setTimeout(() => {
        loadCategories()
      }, 150)
    } catch (error) {
      toast.error('调整顺序失败')
    } finally {
      setDraggedCategory(null)
    }
  }

  // 素材拖拽处理
  const handleMaterialDragStart = (e: DragEvent, material: Material) => {
    setDraggedMaterial(material)
    e.dataTransfer.effectAllowed = 'move'
    // 设置拖拽预览
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', material._id)
    }
  }

  const handleMaterialDragOver = (e: DragEvent, index?: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (index !== undefined) {
      setDragOverMaterialIndex(index)
    }
  }

  const handleMaterialDragLeave = () => {
    setDragOverMaterialIndex(null)
    setDragOverCategoryId(null)
  }

  const handleMaterialDrop = async (e: DragEvent, targetMaterial?: Material, targetIndex?: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverMaterialIndex(null)
    setDragOverCategoryId(null)

    if (!draggedMaterial) return

    // 如果是拖到另一个素材上（排序）
    if (targetMaterial && targetIndex !== undefined) {
      // 如果拖拽的素材和目标素材不在同一个分类，不处理排序
      if (draggedMaterial.categoryId !== targetMaterial.categoryId) {
        setDraggedMaterial(null)
        return
      }

      // 获取同一分类的所有素材（按当前排序）
      const allMaterialsList = await getAllMaterials()
      const sameCategoryMaterials = allMaterialsList
        .filter(m => m.categoryId === draggedMaterial.categoryId)
        .sort((a, b) => {
          const orderA = a.order ?? 0
          const orderB = b.order ?? 0
          if (orderA !== orderB) {
            return orderA - orderB
          }
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        })
      
      const draggedIndex = sameCategoryMaterials.findIndex(m => m._id === draggedMaterial._id)
      const targetIndexInSameCategory = sameCategoryMaterials.findIndex(m => m._id === targetMaterial._id)
      
      if (draggedIndex === -1 || targetIndexInSameCategory === -1 || draggedIndex === targetIndexInSameCategory) {
        setDraggedMaterial(null)
        return
      }

      // 重新排序
      const reorderedMaterials = [...sameCategoryMaterials]
      const [removed] = reorderedMaterials.splice(draggedIndex, 1)
      reorderedMaterials.splice(targetIndexInSameCategory, 0, removed)

      // 更新所有同分类素材的 order 字段
      reorderedMaterials.forEach((material, index) => {
        updateMaterial(material._id, { order: index + 1 })
      })

      toast.success('素材顺序已调整')
      loadMaterials()
    }
    
    setDraggedMaterial(null)
  }

  // 素材拖到分类上
  const handleMaterialDropOnCategory = (e: DragEvent, categoryId: string, categoryName: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverCategoryId(null)

    if (!draggedMaterial) return

    // 如果已经在同一个分类，不做处理
    if (draggedMaterial.categoryId === categoryId) {
      setDraggedMaterial(null)
      return
    }

    // 获取目标分类的素材数量，用于设置 order
    const targetCategoryMaterials = materials.filter(m => m.categoryId === categoryId)
    const newOrder = targetCategoryMaterials.length + 1

    // 更新素材的分类
    updateMaterial(draggedMaterial._id, {
      categoryId,
      categoryName,
      order: newOrder,
    })

    toast.success(`素材已移动到"${categoryName}"`)
    loadMaterials()
    setDraggedMaterial(null)
  }

  // 筛选素材
  const filteredMaterials = materials
    .filter(material => {
      if (selectedCategoryId && material.categoryId !== selectedCategoryId) {
        return false
      }
      if (searchQuery && !material.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterStatus && material.status !== filterStatus) {
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

  // 渲染分类树
  const renderCategory = (category: MaterialCategory, level: number = 0) => {
    const isExpanded = expandedIds.includes(category._id)
    const hasChildren = category.children && category.children.length > 0
    const isSelected = selectedCategoryId === category._id
    const paddingLeft = level * 16
    const categoryMaterialCount = materials.filter(m => m.categoryId === category._id).length
    const isDragOver = dragOverCategoryId === category._id && draggedMaterial

    return (
      <div key={category._id}>
        <div
          className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors mb-1 ${
            isSelected ? 'bg-primary-50 text-primary-600 border border-primary-200' : 'border border-transparent'
          } ${isDragOver ? 'bg-blue-50 border-2 border-blue-400 border-dashed' : ''}`}
          style={{ paddingLeft: `${paddingLeft + 12}px` }}
          onClick={() => handleCategoryClick(category._id)}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (draggedMaterial) {
              setDragOverCategoryId(category._id)
            } else {
              handleCategoryDragOver(e)
            }
          }}
          onDragLeave={handleMaterialDragLeave}
          onDrop={(e) => {
            if (draggedMaterial) {
              handleMaterialDropOnCategory(e, category._id, category.name)
            } else if (draggedCategory) {
              handleCategoryDrop(e, category)
            }
          }}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleExpand(category._id)
                }}
                className="mr-1"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-5" />}
            <FolderTree className="h-4 w-4 mr-2" />
            <span
              className="text-sm font-medium cursor-move select-none flex-1"
              draggable
              onDragStart={(e) => {
                e.stopPropagation()
                handleCategoryDragStart(e, category)
              }}
              onDragOver={(e) => {
                e.stopPropagation()
                handleCategoryDragOver(e)
              }}
              onDrop={(e) => {
                e.stopPropagation()
                handleCategoryDrop(e, category)
              }}
            >
              {category.name}
            </span>
            <span className="ml-2 text-xs text-gray-500">{categoryMaterialCount}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditingCategory({
                ...category,
                _id: '',
                name: '',
                parentId: category._id,
                order: (category.children?.length || 0) + 1,
              } as any)
              setShowCategoryModal(true)
            }}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title="添加子分类"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {hasChildren && isExpanded && category.children && (
          <div>
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  const getStatusBadge = (status: Material['status']) => {
    const badges = {
      pending: { text: '审核中', class: 'bg-yellow-100 text-yellow-700', icon: Clock },
      approved: { text: '已上线', class: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { text: '已拒绝', class: 'bg-red-100 text-red-700', icon: XCircle },
      offline: { text: '已下线', class: 'bg-gray-100 text-gray-700', icon: EyeOff },
    }
    const badge = badges[status]
    const Icon = badge.icon
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${badge.class}`}>
        <Icon className="h-3 w-3 mr-1" />
        {badge.text}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">素材管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理和组织您的材质素材库</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="text-right">
            <div className="text-gray-600">总素材数</div>
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
          </div>
          <div className="h-12 w-px bg-gray-300"></div>
          <div className="text-right">
            <div className="text-gray-600">已上线</div>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </div>
          <div className="h-12 w-px bg-gray-300"></div>
          <div className="text-right">
            <div className="text-gray-600">待审核</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-6">
        {/* 左侧分类树 */}
        <div className="w-64 flex-shrink-0">
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">材质列表</h2>
              <button
                onClick={() => {
                  setEditingCategory(null)
                  setShowCategoryModal(true)
                }}
                className="text-primary-600 hover:text-primary-700"
                title="新建分类"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
            
            {/* 全部 */}
            <div
              className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-50 rounded transition-colors mb-2 ${
                !selectedCategoryId ? 'bg-primary-50 text-primary-600' : ''
              } ${dragOverCategoryId === 'all' && draggedMaterial ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''}`}
              onClick={() => handleCategoryClick('')}
              onDragOver={(e) => {
                e.preventDefault()
                if (draggedMaterial) {
                  setDragOverCategoryId('all')
                }
              }}
              onDragLeave={handleMaterialDragLeave}
              onDrop={(e) => {
                e.preventDefault()
                if (draggedMaterial) {
                  // 拖到"全部"不做处理
                  setDraggedMaterial(null)
                  setDragOverCategoryId(null)
                }
              }}
            >
          <FolderTree className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">全部素材</span>
          <span className="ml-auto text-xs text-gray-500">{filteredMaterials.length}</span>
        </div>

            <div className="text-xs text-gray-500 mb-2 px-3 font-medium">分类文件夹</div>
            
            {categories.map(category => renderCategory(category))}
          </div>
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1 min-w-0">
          {/* 操作栏 */}
          <div className="card p-5 mb-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setFilterStatus('')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filterStatus === '' 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  全部状态
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filterStatus === 'approved' 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  已上线
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filterStatus === 'pending' 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  审核中
                </button>
                <button
                  onClick={() => setFilterStatus('offline')}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filterStatus === 'offline' 
                      ? 'bg-primary-600 text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  已下线
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative flex-1 lg:flex-initial">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索材质..."
                    className="input pl-9 w-full lg:w-64"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  className="btn-secondary flex items-center text-sm px-4 py-2"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  批量删除 ({selectedIds.length})
                </button>
              )}
              <button className="btn-secondary flex items-center text-sm px-4 py-2">
                <RotateCcw className="h-4 w-4 mr-2" />
                清除
              </button>
              <button className="btn-secondary flex items-center text-sm px-4 py-2">
                查重
              </button>
              <button
                onClick={() => {
                  setEditingMaterial(null)
                  setShowMaterialModal(true)
                }}
                className="btn-primary flex items-center text-sm px-4 py-2 ml-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建材质
              </button>
            </div>
          </div>

          {/* 材质列表 */}
          {filteredMaterials.length > 0 ? (
            <div className="space-y-3">
              {(() => {
                // 按材质类型分组
                const materialGroups: Record<string, typeof filteredMaterials> = {};
                const groupOrder: string[] = [];
                
                filteredMaterials.forEach(material => {
                  // 不自动分组，新建材质显示为独立项
                  // 只在材质名称明确包含分类关键词时才分组
                  let groupKey = material.name; // 默认使用材质名称作为key
                  if (material.name.includes('普通皮-')) {
                    groupKey = '普通皮';
                  } else if (material.name.includes('全青皮-')) {
                    groupKey = '全青皮';
                  } else if (material.name.includes('牛皮')) {
                    groupKey = '牛皮';
                  } else if (material.name.includes('绒布')) {
                    groupKey = '绒布';
                  } else if (material.name.includes('麻布')) {
                    groupKey = '麻布';
                  }
                  
                  if (!materialGroups[groupKey]) {
                    materialGroups[groupKey] = [];
                    groupOrder.push(groupKey);
                  }
                  materialGroups[groupKey].push(material);
                });
                
                return groupOrder.map(groupKey => {
                  const groupMaterials = materialGroups[groupKey];
                  // 取第一个材质作为该类别的代表
                  const representativeMaterial = groupMaterials[0];
                  
                  const isSkuExpanded = expandedSKUGroup === groupKey
                  
                  return (
                    <div key={groupKey} className="card overflow-hidden hover:shadow-md transition-shadow">
                      <div className="p-4">
                        <div className="flex items-center gap-4">
                          {/* 材质图片 - 可点击进入编辑 */}
                          <button
                            onClick={() => {
                              setEditingMaterial(representativeMaterial)
                              setShowMaterialModal(true)
                            }}
                            className="relative w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-400 transition-colors cursor-pointer group"
                          >
                            <img
                              src={getFileUrl(representativeMaterial.image)}
                              alt={groupKey}
                              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg'
                              }}
                            />
                            {/* 状态徽章 */}
                            <div className="absolute top-1 right-1">
                              {getStatusBadge(representativeMaterial.status)}
                            </div>
                          </button>
                          
                          {/* 材质信息 - 可点击进入编辑 */}
                          <button
                            onClick={() => {
                              setEditingMaterial(representativeMaterial)
                              setShowMaterialModal(true)
                            }}
                            className="flex-1 min-w-0 text-left hover:opacity-70 transition-opacity"
                          >
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{groupKey}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              分类：{representativeMaterial.categoryName || '未分类'} | 
                              颜色数：{groupMaterials.length}
                            </p>
                            {representativeMaterial.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {representativeMaterial.description}
                              </p>
                            )}
                          </button>
                          
                          {/* 操作按钮 */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => setExpandedSKUGroup(isSkuExpanded ? null : groupKey)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="SKU预览"
                            >
                              <ChevronDown className={`h-5 w-5 transition-transform ${isSkuExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {/* 审核按钮 - 仅在审核中状态显示 */}
                            {representativeMaterial.status === 'pending' && (
                              <button
                                onClick={() => handleReview(representativeMaterial)}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                title="审核"
                              >
                                <CheckCircle className="h-5 w-5" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setEditingMaterial(representativeMaterial)
                                setShowMaterialModal(true)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="编辑"
                            >
                              <Edit className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(representativeMaterial._id, groupKey)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="删除"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                      
                      {/* SKU预览展开区域 */}
                      {isSkuExpanded && (
                        <div className="border-t bg-gray-50 p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-900">SKU列表 ({groupMaterials.length})</h4>
                            <button
                              onClick={() => {
                                setSelectedMaterialForSKU(representativeMaterial)
                                setShowSKUModal(true)
                              }}
                              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                            >
                              <Plus className="h-4 w-4" />
                              添加SKU
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {groupMaterials.map((material, index) => (
                              <div 
                                key={material._id} 
                                className="flex flex-col items-center p-2 bg-white rounded-lg border border-gray-200 hover:border-primary-300 transition-colors cursor-move"
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.effectAllowed = 'move'
                                  e.dataTransfer.setData('text/plain', JSON.stringify({
                                    groupKey,
                                    index,
                                    materialId: material._id
                                  }))
                                }}
                                onDragOver={(e) => {
                                  e.preventDefault()
                                  e.dataTransfer.dropEffect = 'move'
                                }}
                                onDrop={(e) => {
                                  e.preventDefault()
                                  try {
                                    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'))
                                    if (dragData.groupKey === groupKey && dragData.index !== index) {
                                      const newList = [...groupMaterials]
                                      const [draggedItem] = newList.splice(dragData.index, 1)
                                      newList.splice(index, 0, draggedItem)
                                      
                                      // 保存新的排序到数据库
                                      newList.forEach((mat, idx) => {
                                        updateMaterial(mat._id, { order: idx + 1 })
                                      })
                                      
                                      // 重新加载材料列表以刷新UI
                                      loadMaterials()
                                      toast.success('排序已保存')
                                    }
                                  } catch (error) {
                                    console.error('拖拽错误:', error)
                                  }
                                }}
                              >
                                <div className="relative w-full aspect-square bg-white rounded-lg border border-gray-200 overflow-hidden mb-2 hover:border-primary-300 transition-colors">
                                  <img
                                    src={getFileUrl(material.image)}
                                    alt={material.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg'
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(material._id, material.name)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                    title="删除SKU"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-600 text-center line-clamp-2 w-full">
                                  {material.name.split('-')[1] || material.name}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 材质网格 - 隐藏 */}
                      <div className="hidden">
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {groupMaterials.map((material, index) => (
                              <motion.div
                                key={material._id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.01 }}
                                className={`group relative cursor-move transition-all ${
                                  draggedMaterial?._id === material._id ? 'opacity-30 scale-90' : ''
                                } ${
                                  dragOverMaterialIndex === index ? 'ring-2 ring-blue-500 ring-offset-1 scale-110' : ''
                                }`}
                                draggable
                                onDragStart={(e) => handleMaterialDragStart(e as unknown as DragEvent, material)}
                                onDragOver={(e) => handleMaterialDragOver(e as unknown as DragEvent, index)}
                                onDragLeave={handleMaterialDragLeave}
                                onDrop={(e) => handleMaterialDrop(e as unknown as DragEvent, material, index)}
                              >
                                {/* 图片容器 - 更紧凑 */}
                                <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200 hover:border-primary-300 transition-colors">
                                  <img
                                    src={getFileUrl(material.image)}
                                    alt={material.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/placeholder.svg'
                                    }}
                                  />
                                  
                                  {/* 状态徽章 */}
                                  <div className="absolute top-1 right-1 scale-75 origin-top-right">
                                    {getStatusBadge(material.status)}
                                  </div>
                                  
                                  {/* 复选框 */}
                                  <div className="absolute top-1 left-1">
                                    <input
                                      type="checkbox"
                                      checked={selectedIds.includes(material._id)}
                                      onChange={(e) => {
                                        e.stopPropagation()
                                        handleSelectOne(material._id)
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="w-4 h-4 cursor-pointer"
                                    />
                                  </div>
                                  
                                  {/* 悬停操作菜单 */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                                    {material.status === 'pending' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleReview(material)
                                        }}
                                        className="p-1.5 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
                                        title="审核"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </button>
                                    )}
                                    {material.status === 'approved' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleChangeStatus(material._id, 'offline')
                                        }}
                                        className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                        title="下线"
                                      >
                                        <EyeOff className="h-4 w-4" />
                                      </button>
                                    )}
                                    {material.status === 'offline' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleChangeStatus(material._id, 'approved')
                                        }}
                                        className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                        title="上线"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingMaterial(material)
                                        setShowMaterialModal(true)
                                      }}
                                      className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                      title="编辑"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleDelete(material._id, material.name)
                                      }}
                                      className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                      title="删除"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                                
                                {/* 材质名称 - 显示在图片下方 */}
                                <div className="mt-1.5 text-center">
                                  <p className="text-xs font-medium text-gray-700 line-clamp-2 group-hover:text-primary-600 transition-colors">
                                    {material.name}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                    </div>
                  );
                })
              })()}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <Image className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg mb-2">暂无素材数据</p>
              <p className="text-gray-400 text-sm mb-4">点击"新建材质"按钮添加素材</p>
              <button
                onClick={() => {
                  setEditingMaterial(null)
                  setShowMaterialModal(true)
                }}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2 inline" />
                新建材质
              </button>
            </div>
          )}

          {/* 分页 */}
          {filteredMaterials.length > 0 && (
            <div className="card p-4 mt-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                显示 <span className="font-medium">{filteredMaterials.length}</span> 条素材，共 <span className="font-medium">{materials.length}</span> 条
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                  上一页
                </button>
                <button className="px-3 py-1.5 bg-primary-600 text-white rounded-lg text-sm">
                  1
                </button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                  2
                </button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                  3
                </button>
                <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors">
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 模态框 */}
      {showMaterialModal && (
        <MaterialFormModal
          key={editingMaterial?._id || 'new'} // 添加key以确保分类列表更新时重新渲染
          material={editingMaterial}
          categories={categories}
          defaultCategoryId={selectedCategoryId} // 传递当前选中的分类ID
          onClose={handleModalClose}
          onCategoryCreate={() => {
            // 记住当前编辑的素材，以便创建分类后恢复
            setPendingMaterialModal(editingMaterial)
            setShowMaterialModal(false)
            setEditingCategory(null)
            setShowCategoryModal(true)
          }}
        />
      )}

      {showCategoryModal && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
            loadCategories() // 刷新分类列表
            // 如果之前有打开的素材表单，重新打开它
            if (pendingMaterialModal !== null) {
              setTimeout(() => {
                setEditingMaterial(pendingMaterialModal)
                setShowMaterialModal(true)
                setPendingMaterialModal(null)
              }, 100)
            }
          }}
        />
      )}

      {showReviewModal && reviewingMaterial && (
        <MaterialReviewModal
          material={reviewingMaterial}
          onClose={handleModalClose}
        />
      )}

      {showSKUModal && (
        <MaterialSKUModal
          material={selectedMaterialForSKU}
          onClose={() => {
            setShowSKUModal(false)
            setSelectedMaterialForSKU(null)
          }}
          onSuccess={() => {
            loadMaterials()
            setShowSKUModal(false)
            setSelectedMaterialForSKU(null)
          }}
        />
      )}
    </div>
  )
}
