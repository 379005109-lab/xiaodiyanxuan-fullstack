import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Search, FolderTree, Package, Tag, TrendingUp, Edit, Trash2, 
  List, Percent, ChevronRight, ChevronDown, Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { Category } from '@/types'
import {
  getCategoryTree,
  getAllCategories,
  toggleCategoryStatus,
  deleteCategory,
  getCategoryStats,
  updateCategory,
} from '@/services/categoryService'
import { getFileUrl } from '@/services/uploadService'
import CategoryFormModal from '@/components/admin/CategoryFormModal'
import DiscountModal from '@/components/admin/DiscountModal'
import DiscountSummaryModal from '@/components/admin/DiscountSummaryModal'

export default function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  
  // 拖拽状态
  const [draggedCategory, setDraggedCategory] = useState<Category | null>(null)
  
  // 模态框状态
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showDiscountModal, setShowDiscountModal] = useState(false)
  const [showBatchDiscountModal, setShowBatchDiscountModal] = useState(false)
  const [showDiscountSummary, setShowDiscountSummary] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  
  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withDiscount: 0,
    totalProducts: 0,
  })

  useEffect(() => {
    loadCategories()
    loadStats()
  }, [])

  const loadCategories = async () => {
    const tree = await getCategoryTree();
    setCategories(tree);
    // 默认展开第一个分类
    if (tree.length > 0) {
      setExpandedIds([tree[0]._id]);
    }
  };

  const loadStats = async () => {
    const categoryStats = await getCategoryStats();
    setStats(categoryStats);
  };

  const handleToggleExpand = (id: string) => {
    setExpandedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  const handleToggleStatus = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (await toggleCategoryStatus(id)) {
      toast.success('状态已更新')
      loadCategories()
      loadStats()
    } else {
      toast.error('更新失败')
    }
  }

  const handleDelete = async (category: Category, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`确定要删除分类"${category.name}"吗？`)) {
      try {
        if (await deleteCategory(category._id)) {
          toast.success('分类已删除')
          loadCategories()
          loadStats()
        }
      } catch (error: any) {
        toast.error(error.message || '删除失败')
      }
    }
  }

  const handleEdit = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCategory(category)
    setShowCategoryModal(true)
  }

  const handleSetDiscount = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingCategory(category)
    setShowDiscountModal(true)
  }

  const handleSearch = async () => {
    // 搜索功能
    if (searchQuery.trim()) {
      const allCats = await getAllCategories()
      const filtered = allCats.filter((cat: Category) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setCategories(filtered.map((cat: Category) => ({ ...cat, children: [] })))
    } else {
      loadCategories()
    }
  }

  const handleModalClose = () => {
    setShowCategoryModal(false)
    setShowDiscountModal(false)
    setShowBatchDiscountModal(false)
    setEditingCategory(null)
    loadCategories()
    loadStats()
  }

  // 拖拽处理
  const handleDragStart = (e: React.DragEvent, category: Category) => {
    setDraggedCategory(category)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetCategory: Category) => {
    e.preventDefault()
    
    if (!draggedCategory || draggedCategory._id === targetCategory._id) {
      setDraggedCategory(null)
      return
    }

    // 只允许同级分类之间拖拽
    if (draggedCategory.parentId !== targetCategory.parentId) {
      toast.error('只能在同级分类之间调整顺序')
      setDraggedCategory(null)
      return
    }

    try {
      const allCategories = await getAllCategories()
      
      // 获取同级分类并按order排序
      let sameLevelCategories = allCategories.filter(
        (cat: Category) => cat.parentId === draggedCategory.parentId
      ).sort((a: Category, b: Category) => a.order - b.order)

      // 找到拖拽分类和目标分类的索引
      const draggedIndex = sameLevelCategories.findIndex((cat: Category) => cat._id === draggedCategory._id)
      const targetIndex = sameLevelCategories.findIndex((cat: Category) => cat._id === targetCategory._id)

      if (draggedIndex === -1 || targetIndex === -1) {
        setDraggedCategory(null)
        return
      }

      // 移除拖拽的分类
      const [draggedItem] = sameLevelCategories.splice(draggedIndex, 1)
      
      // 插入到目标位置
      sameLevelCategories.splice(targetIndex, 0, draggedItem)

      // 重新分配order值（从1开始）
      sameLevelCategories.forEach((cat: Category, index: number) => {
        updateCategory(cat._id, { order: index + 1 })
      })

      toast.success('顺序已调整')
      
      // 刷新分类列表
      setTimeout(() => {
        loadCategories()
        loadStats()
      }, 150)
    } catch (error) {
      console.error('拖拽排序失败:', error)
      toast.error('调整顺序失败')
    } finally {
      setDraggedCategory(null)
    }
  }

  // 添加子分类
  const handleAddSubCategory = (parentCategory: Category, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // 设置父分类信息并打开新建模态框
    setEditingCategory({
      ...parentCategory,
      _id: '', // 清空ID表示新建
      name: '',
      parentId: parentCategory._id,
      level: 2, // 子分类为2级
    } as any)
    setShowCategoryModal(true)
  }

  const renderCategory = (category: Category, level: number = 0) => {
    const isExpanded = expandedIds.includes(category._id)
    const hasChildren = category.children && category.children.length > 0
    const paddingLeft = level * 30

    return (
      <div key={category._id}>
        {/* 主分类行 */}
        <div
          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
          style={{ paddingLeft: `${paddingLeft}px` }}
        >
          <div className="flex items-center py-4 px-4">
            {/* 展开/折叠图标 */}
            <div className="w-8">
              {hasChildren && (
                <button
                  onClick={() => handleToggleExpand(category._id)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            {/* 分类名称 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                {/* 分类图片 */}
                {category.image && (
                  <img
                    src={getFileUrl(category.image)}
                    alt={category.name}
                    className="w-10 h-10 rounded object-cover mr-3"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
                <span 
                  className="font-medium text-gray-900 cursor-move select-none"
                  draggable
                  onDragStart={(e) => handleDragStart(e, category)}
                  onDragOver={(e) => handleDragOver(e)}
                  onDrop={(e) => handleDrop(e, category)}
                >
                  {category.name}
                </span>
                {/* 折扣标签：只有最低折扣低于60%才显示 */}
                {category.hasDiscount && category.discounts && category.discounts.length > 0 && (() => {
                  const minDiscount = Math.min(...category.discounts.map(d => d.discount))
                  if (minDiscount < 60) {
                    const discountLabel = Math.floor(minDiscount / 10)
                    return (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-600 rounded font-semibold">
                        {discountLabel}折
                      </span>
                    )
                  }
                  return null
                })()}
              </div>
            </div>

            {/* 层级 */}
            <div className="w-20 text-center text-sm text-gray-600">
              {category.level}
            </div>

            {/* 商品数量 */}
            <div className="w-20 text-center text-sm text-gray-600">
              {category.productCount}
            </div>

            {/* 状态开关 */}
            <div className="w-32 flex justify-center">
              <button
                onClick={(e) => handleToggleStatus(category._id, e)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  category.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    category.status === 'active' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 创建时间 */}
            <div className="w-40 text-sm text-gray-600">
              {new Date(category.createdAt).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {/* 角色折扣 */}
            <div className="flex-1 text-sm text-gray-600 px-4">
              {category.discounts && category.discounts.length > 0 ? (
                category.discounts.map((d: any, idx) => {
                  const roleName = d.role === 'designer' ? '设计师' : 
                                   d.role === 'distributor' ? '经销商' : 
                                   d.role === 'customer' ? '普通客户' : d.role
                  const percent = d.discountPercent ?? d.discount ?? 100
                  return (
                    <span key={idx} className={`mr-4 ${percent < 100 ? 'text-orange-600 font-medium' : ''}`}>
                      {roleName}:{percent}%
                    </span>
                  )
                })
              ) : (
                <span className="text-gray-400">%</span>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleEdit(category, e)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title="编辑"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => handleSetDiscount(category, e)}
                className="p-2 text-orange-600 hover:bg-orange-50 rounded"
                title="折扣"
              >
                <Percent className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => handleAddSubCategory(category, e)}
                className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                title="添加子分类"
              >
                <Plus className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => handleDelete(category, e)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="删除"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 子分类 */}
        {hasChildren && isExpanded && category.children && (
          <div>
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">分类管理</h1>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-50 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600 mb-1">分类总数</p>
              <p className="text-3xl font-bold text-purple-900">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FolderTree className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-green-50 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600 mb-1">商品总数</p>
              <p className="text-3xl font-bold text-green-900">{stats.totalProducts}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-orange-50 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-600 mb-1">折扣分类数</p>
              <p className="text-3xl font-bold text-orange-900">{stats.withDiscount}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Tag className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-blue-50 rounded-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 mb-1">活跃分类</p>
              <p className="text-3xl font-bold text-blue-900">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* 搜索和筛选 */}
      <div className="card">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索分类名称..."
              className="input pl-10 w-full"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="input w-40"
          >
            <option value="">全部状态</option>
            <option value="active">启用</option>
            <option value="inactive">禁用</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="input w-40"
          >
            <option value="">全部分类</option>
            <option value="1">顶级分类</option>
            <option value="2">二级分类</option>
          </select>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBatchDiscountModal(true)}
            className="btn-secondary flex items-center text-sm px-4 py-2"
          >
            <Settings className="h-4 w-4 mr-2" />
            设置全部分类折扣
          </button>
          <button 
            onClick={() => setShowDiscountSummary(true)}
            className="btn-secondary flex items-center text-sm px-4 py-2"
          >
            <Percent className="h-4 w-4 mr-2" />
            总折扣信息
          </button>
          <button
            onClick={() => {
              setEditingCategory(null)
              setShowCategoryModal(true)
            }}
            className="btn-primary flex items-center text-sm px-4 py-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            新建分类
          </button>
        </div>
      </div>

      {/* 分类列表 */}
      <div className="card overflow-hidden">
        {/* 表头 */}
        <div className="bg-gray-50 border-b border-gray-200">
          <div className="flex items-center py-3 px-4">
            <div className="w-8"></div>
            <div className="flex-1 text-sm font-medium text-gray-700">分类</div>
            <div className="w-20 text-center text-sm font-medium text-gray-700">层级</div>
            <div className="w-20 text-center text-sm font-medium text-gray-700">商品数量</div>
            <div className="w-32 text-center text-sm font-medium text-gray-700">状态</div>
            <div className="w-40 text-sm font-medium text-gray-700">创建时间</div>
            <div className="flex-1 text-sm font-medium text-gray-700 px-4">角色折扣</div>
            <div className="w-40 text-center text-sm font-medium text-gray-700">操作</div>
          </div>
        </div>

        {/* 表格内容 */}
        <div>
          {categories.map(category => renderCategory(category))}
        </div>

        {/* 分页 */}
        <div className="border-t border-gray-200 p-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            显示 1 到 {stats.total}，共 {stats.total} 条记录
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              上一页
            </button>
            <button className="px-4 py-2 bg-primary-600 text-white rounded">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              下一页
            </button>
          </div>
        </div>
      </div>

      {/* 分类表单模态框 */}
      {showCategoryModal && (
        <CategoryFormModal
          category={editingCategory}
          onClose={handleModalClose}
        />
      )}

      {/* 折扣设置模态框 */}
      {showDiscountModal && editingCategory && (
        <DiscountModal
          category={editingCategory}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}

      {/* 批量折扣设置模态框 */}
      {showBatchDiscountModal && (
        <DiscountModal
          category={null}
          onClose={handleModalClose}
          isBatch={true}
          onSuccess={handleModalClose}
        />
      )}

      {/* 总折扣信息模态框 */}
      {showDiscountSummary && (
        <DiscountSummaryModal
          categories={categories}
          onClose={() => setShowDiscountSummary(false)}
        />
      )}
    </div>
  )
}
