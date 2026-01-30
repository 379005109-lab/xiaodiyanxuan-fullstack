import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, Plus, Edit2, Trash2, Users, Package, 
  ChevronDown, ChevronRight, Building2, User, Settings,
  Eye, EyeOff, Check, X
} from 'lucide-react'
import { toast } from 'sonner'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { getFileUrl, getThumbnailUrl } from '@/services/uploadService'

// 层级节点数据结构
interface TierNode {
  _id: string
  tierDisplayName: string
  tierRole: 'company' | 'person' | 'channel' | 'designer' | null
  tierDiscountRate: number  // 自有产品返佣率
  tierDelegatedRate: number // 自有产品下放给下级的比例
  tierCommissionRate: number // 自有产品自留 = discountRate - delegatedRate
  tierPartnerDiscountRate?: number  // 合作商产品返佣率
  tierPartnerDelegatedRate?: number // 合作商产品下放给下级的比例
  tierPartnerCommissionRate?: number // 合作商产品自留
  ownProductMinDiscount?: number
  ownProductCommission?: number
  partnerProductMinDiscount?: number
  partnerProductCommission?: number
  tierLevel: number
  childCount: number
  productCount: number
  parentAuthorizationId: string | null
  fromManufacturer: any
  toDesigner?: any
  toManufacturer?: any
  createdBy: string
  status: string
  children?: TierNode[]
  // 可见性控制
  isOwner: boolean  // 是否是自己创建的
  allowSubAuthorization?: boolean
  isVirtual?: boolean
}

// 卡片组件
function TierCard({
  node,
  isRoot,
  onAddChild,
  onEdit,
  onDelete,
  onViewDetails,
  expanded,
  onToggleExpand,
  currentUserId
}: {
  node: TierNode
  isRoot?: boolean
  onAddChild: (parentId: string) => void
  onEdit: (node: TierNode) => void
  onDelete: (nodeId: string) => void
  onViewDetails: (node: TierNode) => void
  expanded: boolean
  onToggleExpand: () => void
  currentUserId: string
}) {
  const isOwner = node.createdBy === currentUserId || node.isOwner
  const isVirtual = Boolean((node as any).isVirtual)
  const canEdit = isOwner && !isVirtual
  const canAddChild = canEdit && node.allowSubAuthorization !== false
  const hasChildren = (node.children?.length || 0) > 0 || node.childCount > 0
  
  const ownCommission = (node.tierCommissionRate ?? node.ownProductCommission ?? 0) || 0
  
  return (
    <div className="relative">
      {/* 卡片主体 */}
      <div className={cn(
        "bg-white rounded-2xl shadow-lg border-2 p-5 min-w-[280px] transition-all",
        isRoot ? "border-primary-300 bg-gradient-to-br from-primary-50 to-white" : "border-gray-200 hover:border-primary-200"
      )}>
        {/* 头部 - 名称和角色 */}
        <div className="flex items-center gap-3 mb-4">
          {/* 头像/图标 */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg",
            isRoot ? "bg-gradient-to-br from-primary-500 to-primary-700" : 
            node.tierRole === 'company' ? "bg-gradient-to-br from-blue-500 to-blue-700" :
            node.tierRole === 'designer' ? "bg-gradient-to-br from-purple-500 to-purple-700" :
            "bg-gradient-to-br from-gray-400 to-gray-600"
          )}>
            {node.tierDisplayName?.charAt(0) || '?'}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 truncate">
                {isOwner ? node.tierDisplayName : '***'}
              </h3>
              {hasChildren && (
                <button
                  onClick={onToggleExpand}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {isRoot ? '总控节点' : 
               node.tierRole === 'company' ? '公司' :
               node.tierRole === 'designer' ? '设计师' :
               node.tierRole === 'person' ? '个人' :
               '未分配角色'}
            </p>
          </div>
          
          {/* 编辑按钮 */}
          {canEdit && (
            <button
              onClick={() => onEdit(node)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="编辑规则"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* 返佣信息 - 仅所有者可见详情 */}
        {isOwner ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600 mb-1">我的返佣</p>
              <p className="text-2xl font-bold text-green-700">{ownCommission}</p>
              <p className="text-xs text-green-500">%</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-600 mb-1">下放给下级</p>
              <p className="text-2xl font-bold text-blue-700">{node.tierDelegatedRate || 0}</p>
              <p className="text-xs text-blue-500">%</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
            <p className="text-sm text-gray-500">
              <EyeOff className="w-4 h-4 inline mr-1" />
              非本人创建，详细信息已隐藏
            </p>
          </div>
        )}
        
        {/* 统计信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {node.childCount || 0}人
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            {node.productCount || 0}商品
          </span>
        </div>
        
        {/* 添加层级按钮 */}
        {canAddChild && (
          <button
            onClick={() => onAddChild(node._id)}
            className="w-full py-2.5 border-2 border-dashed border-green-300 rounded-xl text-green-600 hover:bg-green-50 hover:border-green-400 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            添加层级
          </button>
        )}
        
        {/* 操作按钮 */}
        {!isRoot && canEdit && (
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
            {hasChildren && (
              <button
                onClick={() => onViewDetails(node)}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                title="查看详情"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
            {canAddChild && (
              <button
                onClick={() => onAddChild(node._id)}
                className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg"
                title="添加下级"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(node._id)}
              className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              title="删除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// 层级树组件
function TierTree({
  nodes,
  parentId,
  level,
  onAddChild,
  onEdit,
  onDelete,
  onViewDetails,
  expandedNodes,
  onToggleExpand,
  currentUserId
}: {
  nodes: TierNode[]
  parentId: string | null
  level: number
  onAddChild: (parentId: string) => void
  onEdit: (node: TierNode) => void
  onDelete: (nodeId: string) => void
  onViewDetails: (node: TierNode) => void
  expandedNodes: Set<string>
  onToggleExpand: (nodeId: string) => void
  currentUserId: string
}) {
  const children = nodes.filter(n => 
    (n.parentAuthorizationId || null) === parentId
  )
  
  if (children.length === 0) return null
  
  return (
    <div className={cn(
      "flex flex-wrap gap-6 justify-center",
      level > 0 && "mt-8 pt-8 border-t border-gray-200"
    )}>
      {children.map(node => {
        const isExpanded = expandedNodes.has(node._id)
        const hasChildren = nodes.some(n => n.parentAuthorizationId === node._id)
        
        return (
          <div key={node._id} className="flex flex-col items-center">
            {/* 连接线 */}
            {level > 0 && (
              <div className="w-px h-6 bg-gray-300 -mt-8 mb-2" />
            )}
            
            <TierCard
              node={node}
              isRoot={level === 0}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              expanded={isExpanded}
              onToggleExpand={() => onToggleExpand(node._id)}
              currentUserId={currentUserId}
            />
            
            {/* 子节点 */}
            {isExpanded && hasChildren && (
              <div className="relative mt-4">
                {/* 垂直连接线 */}
                <div className="absolute left-1/2 -top-4 w-px h-4 bg-gray-300" />
                
                {/* 水平连接线 */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gray-300" style={{ display: 'none' }} />
                
                <TierTree
                  nodes={nodes}
                  parentId={node._id}
                  level={level + 1}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewDetails={onViewDetails}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// 添加/编辑层级模态框 - 简化版
function TierEditModal({
  isOpen,
  onClose,
  onSave,
  parentNode,
  editingNode,
  maxDiscountRate,
  rootDiscount
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  parentNode: TierNode | null
  editingNode: TierNode | null
  maxDiscountRate: number
  rootDiscount: number  // 厂家授权的固定折扣
}) {
  const [formData, setFormData] = useState({
    tierDisplayName: '',
    tierRole: 'person' as 'company' | 'person' | 'channel' | 'designer',
    myCommission: 0,      // 我的返佣
    delegateToChild: 0    // 下放给下级
  })

  useEffect(() => {
    if (editingNode) {
      // 编辑模式：从现有数据计算
      const myComm = editingNode.tierCommissionRate || 
        (editingNode.tierDiscountRate || 0) - (editingNode.tierDelegatedRate || 0)
      setFormData({
        tierDisplayName: editingNode.tierDisplayName || '',
        tierRole: editingNode.tierRole || 'person',
        myCommission: Math.max(0, myComm),
        delegateToChild: editingNode.tierDelegatedRate || 0
      })
    } else {
      // 新增模式
      setFormData({
        tierDisplayName: '',
        tierRole: 'person',
        myCommission: maxDiscountRate,  // 默认全拿
        delegateToChild: 0              // 默认不下放
      })
    }
  }, [editingNode, maxDiscountRate])
  
  // 验证：我的返佣 + 下放 不能超过上级给的额度
  const totalUsed = formData.myCommission + formData.delegateToChild
  const isOverBudget = totalUsed > maxDiscountRate
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tierDisplayName.trim()) {
      toast.error('请输入名称')
      return
    }
    if (isOverBudget) {
      toast.error(`返佣 + 下放 (${totalUsed}%) 不能超过上级给的额度 (${maxDiscountRate}%)`)
      return
    }

    // 转换为后端需要的字段
    const payload: any = {
      tierDisplayName: formData.tierDisplayName,
      tierRole: formData.tierRole,
      tierDiscountRate: formData.myCommission + formData.delegateToChild,  // 总额度
      tierDelegatedRate: formData.delegateToChild,  // 下放给下级
      tierCommissionRate: formData.myCommission     // 我的返佣
    }

    if (!payload.tierRole) {
      delete payload.tierRole
    }

    onSave(payload)
  }
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {editingNode ? '编辑层级' : '添加下级'}
          </h2>
          {parentNode && (
            <p className="text-sm text-gray-500 mt-1">
              上级: {parentNode.tierDisplayName}
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.tierDisplayName}
              onChange={e => setFormData({ ...formData, tierDisplayName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="公司名或个人名"
            />
          </div>
          
          {/* 角色类型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">角色类型</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'company', label: '公司', icon: Building2 },
                { value: 'person', label: '个人', icon: User },
                { value: 'channel', label: '渠道', icon: Users },
                { value: 'designer', label: '设计师', icon: User }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tierRole: opt.value as any })}
                  className={cn(
                    "p-3 border-2 rounded-xl flex flex-col items-center gap-1 transition-all",
                    formData.tierRole === opt.value
                      ? "border-primary-500 bg-primary-50 text-primary-700"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <opt.icon className="w-5 h-5" />
                  <span className="text-xs">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* 固定折扣 - 只读显示 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">最低折扣</p>
                <p className="text-xs text-gray-500">继承自厂家授权，不可修改</p>
              </div>
              <span className="text-2xl font-bold text-gray-600">{rootDiscount}%</span>
            </div>
          </div>
          
          {/* 上级分配的额度 */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">上级分配的返佣额度</p>
                <p className="text-xs text-blue-500">你可以在这个范围内分配</p>
              </div>
              <span className="text-2xl font-bold text-blue-600">{maxDiscountRate}%</span>
            </div>
          </div>
          
          {/* 我的返佣 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              我的返佣
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={maxDiscountRate}
                value={formData.myCommission}
                onChange={e => setFormData({ ...formData, myCommission: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="w-16 text-center font-bold text-lg text-green-600">
                {formData.myCommission}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              下级产生订单时，我能拿到的返佣比例
            </p>
          </div>
          
          {/* 下放给下级 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              下放给下级
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={Math.max(0, maxDiscountRate - formData.myCommission)}
                value={formData.delegateToChild}
                onChange={e => setFormData({ ...formData, delegateToChild: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="w-16 text-center font-bold text-lg text-blue-600">
                {formData.delegateToChild}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              允许下级再分配的返佣额度
            </p>
          </div>
          
          {/* 分配预览 */}
          <div className={cn(
            "rounded-xl p-4",
            isOverBudget ? "bg-red-50" : "bg-green-50"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className={cn("text-sm font-medium", isOverBudget ? "text-red-700" : "text-green-700")}>
                  {isOverBudget ? '⚠️ 超出额度' : '✓ 分配合理'}
                </p>
                <p className={cn("text-xs", isOverBudget ? "text-red-500" : "text-green-500")}>
                  我的返佣 ({formData.myCommission}%) + 下放 ({formData.delegateToChild}%) = {totalUsed}%
                </p>
              </div>
              <span className={cn(
                "text-2xl font-bold",
                isOverBudget ? "text-red-600" : "text-green-600"
              )}>
                {maxDiscountRate - totalUsed}%
              </span>
            </div>
            {!isOverBudget && (
              <p className="text-xs text-green-500 mt-1">剩余未分配</p>
            )}
          </div>
          
          {/* 按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isOverBudget}
              className={cn(
                "px-6 py-2.5 rounded-xl text-white",
                isOverBudget 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-primary-600 hover:bg-primary-700"
              )}
            >
              {editingNode ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 主组件
export default function TierHierarchyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  
  const queryManufacturerId = searchParams.get('manufacturerId') || ''
  const userManufacturerRaw = (user as any)?.manufacturerId || (user as any)?.manufacturerIds?.[0] || ''
  const isPlatformAdmin =
    (user as any)?.role === 'super_admin' ||
    (user as any)?.role === 'admin' ||
    (user as any)?.role === 'platform_admin' ||
    (user as any)?.role === 'platform_staff'
  
  const queryManufacturerIdNormalized = String((queryManufacturerId as any)?._id || (queryManufacturerId as any)?.id || queryManufacturerId || '')
  const userManufacturerIdNormalized = String((userManufacturerRaw as any)?._id || (userManufacturerRaw as any)?.id || userManufacturerRaw || '')
  const userManufacturerIdsNormalized = Array.isArray((user as any)?.manufacturerIds)
    ? (user as any).manufacturerIds.map((m: any) => String(m?._id || m?.id || m || ''))
    : []
  const userAllManufacturerIds = [userManufacturerIdNormalized, ...userManufacturerIdsNormalized].filter(Boolean)
  const queryMatchesUser = Boolean(queryManufacturerIdNormalized) && userAllManufacturerIds.includes(queryManufacturerIdNormalized)

  const rawManufacturerId = isPlatformAdmin
    ? (queryManufacturerIdNormalized || userManufacturerIdNormalized || '')
    : (queryMatchesUser ? queryManufacturerIdNormalized : (userManufacturerIdNormalized || queryManufacturerIdNormalized || ''))

  const manufacturerId = String(rawManufacturerId || '')
  const companyId = searchParams.get('companyId') || ''
  const companyName = searchParams.get('companyName') || ''
  
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState<TierNode[]>([])
  const [rootNode, setRootNode] = useState<TierNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [manufacturerInfo, setManufacturerInfo] = useState<any>(null)
  
  // 模态框状态
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNode, setEditingNode] = useState<TierNode | null>(null)
  const [parentNodeForAdd, setParentNodeForAdd] = useState<TierNode | null>(null)
  
  const currentUserId = (user as any)?._id || (user as any)?.id || ''
  
  // 加载层级数据
  const loadHierarchy = useCallback(async () => {
    if (!manufacturerId) return
    
    setLoading(true)
    try {
      const params: any = { manufacturerId, _t: Date.now() }
      if (companyId) params.companyId = companyId
      if (companyName) params.companyName = companyName
      
      const resp = await apiClient.get('/authorizations/tier-hierarchy-v2', { params })
      const data = resp.data?.data || resp.data || {}
      
      setNodes(data.nodes || [])
      setRootNode(data.root || null)
      setManufacturerInfo(data.manufacturer || null)
      
      // 默认展开根节点
      if (data.root?._id) {
        setExpandedNodes(new Set([data.root._id]))
      }
    } catch (err) {
      console.error('加载层级数据失败:', err)
      toast.error('加载层级数据失败')
    } finally {
      setLoading(false)
    }
  }, [manufacturerId, companyId, companyName])
  
  useEffect(() => {
    loadHierarchy()
  }, [loadHierarchy])
  
  // 切换展开/折叠
  const handleToggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) {
        next.delete(nodeId)
      } else {
        next.add(nodeId)
      }
      return next
    })
  }
  
  // 添加子层级
  const handleAddChild = (parentId: string) => {
    const parent = nodes.find(n => n._id === parentId) || rootNode
    if (!parent) return

    const delegatedRate = parent.tierDelegatedRate || 0
    
    if (delegatedRate <= 0) {
      toast.error('此节点未设置下放额度，无法添加下级')
      return
    }
    
    setParentNodeForAdd({
      ...parent,
      tierDelegatedRate: delegatedRate
    })
    setEditingNode(null)
    setShowEditModal(true)
  }
  
  // 编辑节点
  const handleEdit = (node: TierNode) => {
    // 找到父节点以获取最大可分配率
    const parent = nodes.find(n => n._id === node.parentAuthorizationId) || rootNode
    if (parent) {
      setParentNodeForAdd({
        ...parent,
        tierDelegatedRate: parent.tierDelegatedRate || 0
      })
    } else {
      setParentNodeForAdd(parent)
    }
    setEditingNode(node)
    setShowEditModal(true)
  }
  
  // 删除节点
  const handleDelete = async (nodeId: string) => {
    if (!confirm('确定要删除此层级吗？其下级也会被删除。')) return
    
    try {
      await apiClient.delete(`/authorizations/tier-node/${nodeId}`)
      toast.success('层级已删除')
      loadHierarchy()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '删除失败')
    }
  }
  
  // 保存节点
  const handleSave = async (data: any) => {
    try {
      if (editingNode) {
        // 更新现有节点
        await apiClient.put(`/authorizations/tier-node/${editingNode._id}`, data)
        toast.success('层级已更新')
      } else if (parentNodeForAdd) {
        // 创建新节点
        await apiClient.post('/authorizations/tier-node', {
          ...data,
          parentAuthorizationId: parentNodeForAdd._id,
          manufacturerId,
          companyId,
          companyName
        })
        toast.success('层级已添加')
      }
      
      setShowEditModal(false)
      loadHierarchy()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '保存失败')
    }
  }
  
  // 查看详情
  const handleViewDetails = (node: TierNode) => {
    // 可以导航到详情页或展开子节点
    handleToggleExpand(node._id)
  }
  
  // 计算最大可分配率
  const maxDiscountRate = useMemo(() => {
    if ((rootNode as any)?.isVirtual) {
      return 0
    }
    if (editingNode && parentNodeForAdd) {
      return parentNodeForAdd.tierDelegatedRate
    }
    if (parentNodeForAdd) {
      return parentNodeForAdd.tierDelegatedRate
    }
    return rootNode?.tierDelegatedRate || 40
  }, [editingNode, parentNodeForAdd, rootNode])
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 头部 */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">层级分成体系</h1>
                {manufacturerInfo && (
                  <p className="text-sm text-gray-500">
                    {manufacturerInfo.name || manufacturerInfo.fullName}
                    {companyName && ` - ${companyName}`}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={loadHierarchy}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                刷新
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 内容区 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 根节点 */}
        {rootNode && (
          <div className="flex flex-col items-center">
            <TierCard
              node={rootNode}
              isRoot
              onAddChild={handleAddChild}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
              expanded={expandedNodes.has(rootNode._id)}
              onToggleExpand={() => handleToggleExpand(rootNode._id)}
              currentUserId={currentUserId}
            />
            
            {/* 子节点树 */}
            {expandedNodes.has(rootNode._id) && nodes.length > 0 && (
              <div className="mt-8 w-full">
                <TierTree
                  nodes={nodes}
                  parentId={rootNode._id}
                  level={1}
                  onAddChild={handleAddChild}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </div>
        )}
        
        {/* 空状态 */}
        {!rootNode && !loading && (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">暂无层级数据</h3>
            <p className="text-gray-500 mb-6">
              层级数据来源于厂家授权，请先申请厂家授权
            </p>
            <button
              onClick={() => navigate('/admin/authorizations')}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
            >
              前往授权管理
            </button>
          </div>
        )}
      </div>
      
      {/* 编辑模态框 */}
      <TierEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleSave}
        parentNode={parentNodeForAdd}
        editingNode={editingNode}
        maxDiscountRate={maxDiscountRate}
        rootDiscount={rootNode?.tierDiscountRate || rootNode?.ownProductMinDiscount || 0}
      />
    </div>
  )
}
