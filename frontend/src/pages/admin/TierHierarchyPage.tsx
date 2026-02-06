import { useState, useEffect, useMemo, useCallback, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, Plus, Edit2, Trash2, Users, Package, 
  ChevronDown, ChevronRight, Building2, User, Settings,
  Eye, EyeOff, Check, X, Search, CheckCircle
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
  boundUserId?: any
  boundUserIds?: any[]
  tierDepthBasedCommissionRules?: Array<{
    depth: number
    commissionRate: number
    description?: string
  }>
  tierCommissionRuleSets?: Array<{
    name: string
    rules: Array<{
      depth: number
      commissionRate: number
      description?: string
    }>
    partnerRules?: Array<{
      depth: number
      commissionRate: number
      description?: string
    }>
  }>
  tierPartnerDiscountRate?: number  // 合作商产品返佣率
  tierPartnerDelegatedRate?: number // 合作商产品下放给下级的比例
  tierPartnerCommissionRate?: number // 合作商产品自留
  ownProductMinDiscount?: number
  ownProductCommission?: number
  partnerProductMinDiscount?: number
  partnerProductCommission?: number
  // 授权字段（兼容旧数据）
  minDiscountRate?: number
  commissionRate?: number
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

function TierRuleModal({
  isOpen,
  onClose,
  node,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  node: TierNode | null
  onSave: (ruleSets: Array<{ name: string; rules: Array<{ depth: number; commissionRate: number; description?: string }>; partnerRules: Array<{ depth: number; commissionRate: number; description?: string }> }>) => Promise<void>
}) {
  type DepthRule = { depth: number; commissionRate: number; description?: string }
  type RuleSetType = { name: string; rules: DepthRule[]; partnerRules: DepthRule[] }
  const [ruleSets, setRuleSets] = useState<RuleSetType[]>([])
  const [currentSetIndex, setCurrentSetIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'own' | 'partner'>('own')

  useEffect(() => {
    if (!isOpen) return
    const existingSets = Array.isArray(node?.tierCommissionRuleSets) && node!.tierCommissionRuleSets!.length > 0
      ? node!.tierCommissionRuleSets! : null

    const parseRules = (arr: any[]) => (arr || []).map((r: any) => ({
      depth: Math.max(0, Number(r?.depth || 0)),
      commissionRate: Math.max(0, Math.min(1, Number(r?.commissionRate || 0))),
      description: r?.description ? String(r.description) : ''
    })).sort((a: any, b: any) => a.depth - b.depth)

    if (existingSets) {
      setRuleSets(existingSets.map(s => ({
        name: s.name || '',
        rules: parseRules(s.rules),
        partnerRules: parseRules((s as any).partnerRules || [])
      })))
    } else {
      const oldRules = parseRules(node?.tierDepthBasedCommissionRules || [])
      setRuleSets([{ name: '规则1', rules: oldRules, partnerRules: [] }])
    }
    setCurrentSetIndex(0)
    setActiveTab('own')
  }, [isOpen, node])

  const isChildNode = Boolean(node?.parentAuthorizationId)
  const ownTotal = isChildNode
    ? (node?.tierDiscountRate || node?.ownProductCommission || 0)
    : (node?.ownProductCommission || node?.commissionRate || node?.tierDiscountRate || 0)
  const partnerTotal = isChildNode
    ? (node?.tierPartnerDiscountRate || node?.partnerProductCommission || 0)
    : (node?.partnerProductCommission || node?.tierPartnerDiscountRate || 0)

  const currentSet = ruleSets[currentSetIndex] || { name: '', rules: [], partnerRules: [] }
  const isOwn = activeTab === 'own'
  const currentRules = isOwn ? (currentSet.rules || []) : (currentSet.partnerRules || [])
  const nodeTotal = isOwn ? ownTotal : partnerTotal
  const nodeTotalDec = nodeTotal / 100

  const totalPct = useMemo(() => {
    return Math.round(currentRules.reduce((sum, r) => sum + (Number(r?.commissionRate || 0) * 100), 0))
  }, [currentRules])
  const isOverBudget = nodeTotal > 0 && totalPct > nodeTotal

  const updateRules = (newRules: DepthRule[]) => {
    const key = isOwn ? 'rules' : 'partnerRules'
    setRuleSets(prev => prev.map((s, i) => i === currentSetIndex ? { ...s, [key]: newRules } : s))
  }

  const setPreset = (type: 'direct' | 'two' | 'three') => {
    const dec = nodeTotalDec
    if (type === 'direct') { updateRules([{ depth: 0, commissionRate: dec, description: '' }]); return }
    if (type === 'two') {
      const half = Math.round(dec * 50) / 100
      updateRules([{ depth: 0, commissionRate: half, description: '' }, { depth: 1, commissionRate: Math.round((dec - half) * 100) / 100, description: '' }]); return
    }
    const third = Math.round(dec * 100 / 3) / 100
    updateRules([{ depth: 0, commissionRate: third, description: '' }, { depth: 1, commissionRate: third, description: '' }, { depth: 2, commissionRate: Math.round((dec - third * 2) * 100) / 100, description: '' }])
  }

  const addDepth = () => {
    const maxD = currentRules.length > 0 ? Math.max(...currentRules.map(r => r.depth)) : -1
    updateRules([...currentRules, { depth: maxD + 1, commissionRate: 0, description: '' }])
  }
  const removeDepth = (d: number) => updateRules(currentRules.filter(r => r.depth !== d))
  const updateRate = (d: number, pct: number) => {
    const v = Math.max(0, Math.min(100, Number(pct || 0))) / 100
    updateRules(currentRules.map(r => r.depth === d ? { ...r, commissionRate: v } : r))
  }

  const addRuleSet = () => {
    setRuleSets(prev => [...prev, { name: `规则${prev.length + 1}`, rules: [], partnerRules: [] }])
    setCurrentSetIndex(ruleSets.length)
  }
  const removeCurrentRuleSet = () => {
    if (ruleSets.length <= 1) return
    setRuleSets(prev => prev.filter((_, i) => i !== currentSetIndex))
    setCurrentSetIndex(prev => Math.max(0, prev - 1))
  }

  const handleSave = async () => {
    if (!node?._id) { toast.error('节点ID无效'); return }
    for (let i = 0; i < ruleSets.length; i++) {
      const ot = Math.round((ruleSets[i].rules || []).reduce((s, r) => s + Number(r?.commissionRate || 0) * 100, 0))
      if (ownTotal > 0 && ot > ownTotal) { toast.error(`第${i+1}套自有产品返佣(${ot}%)超额`); setCurrentSetIndex(i); setActiveTab('own'); return }
      const pt = Math.round((ruleSets[i].partnerRules || []).reduce((s, r) => s + Number(r?.commissionRate || 0) * 100, 0))
      if (partnerTotal > 0 && pt > partnerTotal) { toast.error(`第${i+1}套授权产品返佣(${pt}%)超额`); setCurrentSetIndex(i); setActiveTab('partner'); return }
    }
    setSaving(true)
    try {
      const clean = (arr: DepthRule[]) => (arr || []).map(r => ({
        depth: Math.max(0, Number(r?.depth || 0)),
        commissionRate: Math.max(0, Math.min(1, Number(r?.commissionRate || 0))),
        description: r?.description ? String(r.description) : ''
      })).sort((a, b) => a.depth - b.depth)
      const cleaned = ruleSets.map((s, idx) => ({ name: s.name || `规则${idx + 1}`, rules: clean(s.rules), partnerRules: clean(s.partnerRules) }))
      await onSave(cleaned)
      onClose()
    } catch (err: any) {
      console.error('保存规则失败:', err)
      toast.error(err?.response?.data?.message || err?.message || '保存失败')
    }
    finally { setSaving(false) }
  }

  if (!isOpen || !node) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">多层级返佣规则</h2>
              <p className="text-sm text-gray-500 mt-1">{node.tierDisplayName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* 规则集导航 */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-3">
            <button
              type="button"
              onClick={() => setCurrentSetIndex(prev => Math.max(0, prev - 1))}
              disabled={currentSetIndex === 0}
              className={cn(
                "p-2 rounded-lg transition-colors",
                currentSetIndex === 0 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-white hover:text-primary-600"
              )}
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {ruleSets.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentSetIndex(idx)}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-all",
                      idx === currentSetIndex ? "bg-primary-600 scale-125" : "bg-gray-300 hover:bg-gray-400"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-gray-700">
                {currentSetIndex + 1} / {ruleSets.length} 套规则
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCurrentSetIndex(prev => Math.min(ruleSets.length - 1, prev + 1))}
              disabled={currentSetIndex === ruleSets.length - 1}
              className={cn(
                "p-2 rounded-lg transition-colors",
                currentSetIndex === ruleSets.length - 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-600 hover:bg-white hover:text-primary-600"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 新增规则集按钮 */}
          <button
            type="button"
            onClick={addRuleSet}
            className="w-full py-3 border-2 border-dashed border-primary-300 rounded-xl text-primary-600 hover:bg-primary-50 hover:border-primary-400 transition-colors flex items-center justify-center gap-2 font-medium text-sm"
          >
            <Plus className="w-5 h-5" />
            新增一套返佣规则
          </button>

          {/* 名称 + 删除 */}
          <div className="flex items-center gap-3">
            <input type="text" value={currentSet.name} onChange={(e) => setRuleSets(prev => prev.map((s, i) => i === currentSetIndex ? { ...s, name: e.target.value } : s))}
              placeholder="规则名称" className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium" />
            {ruleSets.length > 1 && (
              <button type="button" onClick={removeCurrentRuleSet} className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>

          {/* 自有/授权产品 Tab */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button type="button" onClick={() => setActiveTab('own')}
              className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors", isOwn ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              自有产品 {ownTotal > 0 && <span className="text-xs ml-1">({ownTotal}%)</span>}
            </button>
            <button type="button" onClick={() => setActiveTab('partner')}
              className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors", !isOwn ? "bg-white text-blue-700 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              授权产品 {partnerTotal > 0 && <span className="text-xs ml-1">({partnerTotal}%)</span>}
            </button>
          </div>

          {/* 预设模板 */}
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setPreset('direct')}
              className="p-4 rounded-2xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-left"
            >
              <div className="font-bold text-gray-900">直推模式</div>
              <div className="text-xs text-gray-500 mt-1">只返自己</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('two')}
              className="p-4 rounded-2xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-left"
            >
              <div className="font-bold text-gray-900">2层分佣</div>
              <div className="text-xs text-gray-500 mt-1">自己 + 1级</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('three')}
              className="p-4 rounded-2xl border border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-left"
            >
              <div className="font-bold text-gray-900">3层分佣</div>
              <div className="text-xs text-gray-500 mt-1">自己 + 1级 + 2级</div>
            </button>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">{isOwn ? '自有产品' : '授权产品'}额度</span>
              <span className="text-2xl font-bold text-amber-700">{nodeTotal}%</span>
            </div>
            <div className="flex items-center justify-between border-t border-gray-200 pt-2">
              <span className="text-sm font-bold text-gray-900">当前规则总计</span>
              <span className={cn("text-2xl font-bold", isOverBudget ? "text-red-600" : "text-green-700")}>{totalPct}%</span>
            </div>
            {isOverBudget && <p className="text-xs text-red-500">超过授权额度，请调整</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-bold text-gray-900">{isOwn ? '自有产品' : '授权产品'}层级配置</div>
              <button
                type="button"
                onClick={addDepth}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                添加层级
              </button>
            </div>

            {currentRules.length === 0 ? (
              <div className="text-sm text-gray-500 py-6 text-center">暂无配置</div>
            ) : (
              <div className="space-y-2">
                {currentRules
                  .slice()
                  .sort((a, b) => Number(a.depth) - Number(b.depth))
                  .map((r) => (
                    <div key={r.depth} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                      <div className="text-xs font-bold text-gray-700 w-24">
                        {Number(r.depth) === 0 ? '自己返佣' : `${Number(r.depth)}级返佣`}
                      </div>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={Math.round(Number(r.commissionRate || 0) * 100)}
                        onChange={(e) => updateRate(Number(r.depth), Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm text-center font-bold"
                      />
                      <div className="text-sm text-gray-500">%</div>
                      <div className="flex-1" />
                      {Number(r.depth) !== 0 && (
                        <button
                          type="button"
                          onClick={() => removeDepth(Number(r.depth))}
                          className="p-2 rounded-lg hover:bg-white text-gray-400 hover:text-red-600"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 pt-0 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "px-6 py-2.5 rounded-xl text-white",
              saving ? "bg-gray-400 cursor-not-allowed" : "bg-primary-600 hover:bg-primary-700"
            )}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// 卡片组件
function TierCard({
  node,
  isRoot,
  onAddChild,
  onBindAccount,
  onEdit,
  onOpenRules,
  onDelete,
  onViewDetails,
  expanded,
  onToggleExpand,
  currentUserId,
  isManufacturerAdmin
}: {
  node: TierNode
  isRoot?: boolean
  onAddChild: (parentId: string) => void
  onBindAccount: (parentId: string) => void
  onEdit: (node: TierNode) => void
  onOpenRules: (node: TierNode) => void
  onDelete: (nodeId: string) => void
  onViewDetails: (node: TierNode) => void
  expanded: boolean
  onToggleExpand: () => void
  currentUserId: string
  isManufacturerAdmin: boolean
}) {
  const isOwner = node.createdBy === currentUserId || node.isOwner
  const isVirtual = Boolean((node as any).isVirtual)
  const canEdit = (isOwner || isManufacturerAdmin) && !isVirtual
  const canAddChild = canEdit && node.allowSubAuthorization !== false
  const canBindAccount = canEdit  // 绑定账号只需要canEdit权限
  const hasChildren = (node.children?.length || 0) > 0 || node.childCount > 0
  const primaryBoundUserId = node.boundUserId ? String((node.boundUserId as any)?._id || node.boundUserId) : ''
  
  // 总返佣额度：根节点用授权值（ownProductCommission），子节点用tierDiscountRate（上级分配的额度）
  const totalCommission = isRoot
    ? (node.ownProductCommission || node.commissionRate || node.tierDiscountRate || 0)
    : (node.tierDiscountRate || node.ownProductCommission || 0)
  const ownCommission = node.tierCommissionRate || 0
  const delegated = node.tierDelegatedRate || 0
  const depthRules = Array.isArray(node.tierDepthBasedCommissionRules) ? node.tierDepthBasedCommissionRules.filter(r => r && r.commissionRate > 0) : []
  const ruleSets = Array.isArray(node.tierCommissionRuleSets) && node.tierCommissionRuleSets.length > 0
    ? node.tierCommissionRuleSets
    : (depthRules.length > 0 ? [{ name: '规则1', rules: depthRules, partnerRules: [] as typeof depthRules }] : [])
  const [cardRuleSetIndex, setCardRuleSetIndex] = useState(0)
  const [rulesExpanded, setRulesExpanded] = useState(false)
  const displayRuleSet = ruleSets[cardRuleSetIndex] || null
  const displayRules = displayRuleSet ? (displayRuleSet.rules || []).filter(r => r && r.commissionRate > 0) : []
  
  return (
    <div className="relative">
      {/* 卡片主体 */}
      <div className={cn(
        "bg-white rounded-2xl shadow-lg border-2 p-5 min-w-[280px] transition-all",
        isRoot ? "border-primary-300 bg-gradient-to-br from-primary-50 to-white" : "border-gray-200 hover:border-primary-200"
      )}>
        {/* 头部 - 名称和角色 */}
        <div className="flex items-center gap-3 mb-4">
          {/* 头像/图标 - 点击编辑 */}
          <button
            onClick={() => canEdit && onEdit(node)}
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg relative group",
              isRoot ? "bg-gradient-to-br from-primary-500 to-primary-700" : 
              node.tierRole === 'company' ? "bg-gradient-to-br from-blue-500 to-blue-700" :
              node.tierRole === 'designer' ? "bg-gradient-to-br from-purple-500 to-purple-700" :
              "bg-gradient-to-br from-gray-400 to-gray-600",
              canEdit && "cursor-pointer hover:opacity-90"
            )}
            title={canEdit ? "编辑层级" : undefined}
          >
            {node.tierDisplayName?.charAt(0) || '?'}
            {canEdit && (
              <div className="absolute inset-0 bg-black/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Edit2 className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
          
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
          
          {/* 右上角齿轮 - 模板设置 */}
          {canEdit && (
            <button
              onClick={() => onOpenRules(node)}
              className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="角色模板设置"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* 返佣信息 - 仅所有者可见详情 */}
        {isOwner ? (
          <>
            <div className="space-y-2 mb-4">
              <div className="bg-amber-50 rounded-xl p-3 text-center">
                <p className="text-xs text-amber-600 mb-1">总返佣额度</p>
                <p className="text-2xl font-bold text-amber-700">{totalCommission}<span className="text-sm">%</span></p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-600 mb-1">本级自留</p>
                  <p className="text-xl font-bold text-green-700">{ownCommission}<span className="text-sm">%</span></p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-600 mb-1">下放给下级</p>
                  <p className="text-xl font-bold text-blue-700">{delegated}<span className="text-sm">%</span></p>
                </div>
              </div>
            </div>
            {/* 多级返佣规则 - 收纳箭头展开 */}
            {ruleSets.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setRulesExpanded(prev => !prev) }}
                  className="w-full flex items-center justify-between bg-purple-50 rounded-xl px-3 py-2 hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-600 font-medium">多级返佣规则</span>
                    <span className="bg-purple-200 text-purple-700 text-xs font-bold px-1.5 py-0.5 rounded-full">{ruleSets.length}套</span>
                  </div>
                  <ChevronDown className={cn("w-4 h-4 text-purple-500 transition-transform", rulesExpanded && "rotate-180")} />
                </button>
                {rulesExpanded && (
                  <div className="mt-2 space-y-2">
                    {ruleSets.map((ruleSet, idx) => {
                      const rules = (ruleSet.rules || []).filter(r => r && r.commissionRate > 0)
                      const pRules = ((ruleSet as any).partnerRules || []).filter((r: any) => r && r.commissionRate > 0)
                      if (rules.length === 0 && pRules.length === 0) return null
                      return (
                        <div key={idx} className="bg-purple-50 rounded-xl p-2.5 space-y-2">
                          <p className="text-xs text-purple-500 font-medium">{ruleSet.name || `规则${idx + 1}`}</p>
                          {rules.length > 0 && (
                            <div>
                              <p className="text-xs text-green-600 mb-1">自有产品</p>
                              <div className="flex flex-wrap gap-1.5">
                                {rules.slice().sort((a, b) => Number(a.depth) - Number(b.depth)).map(r => (
                                  <div key={r.depth} className="bg-white rounded-lg px-2 py-1 text-xs border border-green-200">
                                    <span className="text-green-500">{Number(r.depth) === 0 ? '自己' : `${r.depth}级`}</span>
                                    <span className="text-green-700 font-bold ml-1">{Math.round(Number(r.commissionRate) * 100)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {pRules.length > 0 && (
                            <div>
                              <p className="text-xs text-blue-600 mb-1">授权产品</p>
                              <div className="flex flex-wrap gap-1.5">
                                {pRules.slice().sort((a: any, b: any) => Number(a.depth) - Number(b.depth)).map((r: any) => (
                                  <div key={r.depth} className="bg-white rounded-lg px-2 py-1 text-xs border border-blue-200">
                                    <span className="text-blue-500">{Number(r.depth) === 0 ? '自己' : `${r.depth}级`}</span>
                                    <span className="text-blue-700 font-bold ml-1">{Math.round(Number(r.commissionRate) * 100)}%</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
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
            {(node as any).boundUserIds?.length || node.childCount || 0}人
          </span>
          <span className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            {node.productCount || 0}商品
          </span>
        </div>
        
        {/* 已绑定的账号列表 */}
        {(node as any).boundUserIds?.length > 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
            <p className="text-xs text-gray-500 mb-2">已绑定账号:</p>
            <div className="flex flex-wrap gap-2">
              {(node as any).boundUserIds.slice(0, 5).map((user: any) => (
                <div key={user._id} className={`flex items-center gap-1 bg-white px-2 py-1 rounded-lg text-xs border ${primaryBoundUserId === String(user._id) ? 'bg-blue-100' : ''}`}>
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                    {user.nickname?.charAt(0) || user.username?.charAt(0) || '?'}
                  </div>
                  <span className="text-gray-700">{user.nickname || user.username}</span>
                </div>
              ))}
              {(node as any).boundUserIds.length > 5 && (
                <span className="text-xs text-gray-400">+{(node as any).boundUserIds.length - 5}</span>
              )}
            </div>
          </div>
        )}
        
        {/* 绑定账号 + 添加层级 */}
        {(canBindAccount || canAddChild) && (
          <div className="flex gap-2">
            {canBindAccount && (
              <button
                onClick={() => onBindAccount(node._id)}
                className="flex-1 py-2.5 border-2 border-dashed border-green-300 rounded-xl text-green-600 hover:bg-green-50 hover:border-green-400 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Users className="w-4 h-4" />
                绑定账号
              </button>
            )}
            {canAddChild && (
              <button
                onClick={() => onAddChild(node._id)}
                className="w-12 h-12 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:bg-blue-50 hover:border-blue-400 transition-colors flex items-center justify-center"
                title="添加层级"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
        
        {/* 底部操作按钮 - 只保留删除 */}
        {!isRoot && canEdit && (
          <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
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
  onBindAccount,
  onEdit,
  onOpenRules,
  onDelete,
  onViewDetails,
  expandedNodes,
  onToggleExpand,
  currentUserId,
  isManufacturerAdmin
}: {
  nodes: TierNode[]
  parentId: string | null
  level: number
  onAddChild: (parentId: string) => void
  onBindAccount: (parentId: string) => void
  onEdit: (node: TierNode) => void
  onOpenRules: (node: TierNode) => void
  onDelete: (nodeId: string) => void
  onViewDetails: (node: TierNode) => void
  expandedNodes: Set<string>
  onToggleExpand: (nodeId: string) => void
  currentUserId: string
  isManufacturerAdmin: boolean
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
              onBindAccount={onBindAccount}
              onEdit={onEdit}
              onOpenRules={onOpenRules}
              onDelete={onDelete}
              onViewDetails={onViewDetails}
              expanded={isExpanded}
              onToggleExpand={() => onToggleExpand(node._id)}
              currentUserId={currentUserId}
              isManufacturerAdmin={isManufacturerAdmin}
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
                  onBindAccount={onBindAccount}
                  onEdit={onEdit}
                  onOpenRules={onOpenRules}
                  onDelete={onDelete}
                  onViewDetails={onViewDetails}
                  expandedNodes={expandedNodes}
                  onToggleExpand={onToggleExpand}
                  currentUserId={currentUserId}
                  isManufacturerAdmin={isManufacturerAdmin}
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
    myCommission: 0      // 我的返佣
  })

  // 总返佣额度：编辑时=节点的授权返佣，新增时=上级下放额度
  const totalBudget = editingNode
    ? (editingNode.ownProductCommission || editingNode.commissionRate || editingNode.tierDiscountRate || maxDiscountRate)
    : maxDiscountRate

  // 下放给下级 = 总额度 - 我的返佣（协同关系）
  const delegateToChild = Math.max(0, totalBudget - formData.myCommission)

  useEffect(() => {
    if (editingNode) {
      setFormData({
        tierDisplayName: editingNode.tierDisplayName || '',
        tierRole: editingNode.tierRole || 'person',
        myCommission: editingNode.tierCommissionRate || 0
      })
    } else {
      setFormData({
        tierDisplayName: '',
        tierRole: 'person',
        myCommission: maxDiscountRate  // 默认全拿
      })
    }
  }, [editingNode, maxDiscountRate])
  
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!formData.tierDisplayName.trim()) {
      toast.error('请输入名称')
      return
    }

    // 转换为后端需要的字段
    const payload: any = {
      tierDisplayName: formData.tierDisplayName,
      tierRole: formData.tierRole,
      tierDiscountRate: totalBudget,                // 总额度（=授权值，固定）
      tierDelegatedRate: delegateToChild,            // 下放给下级（自动计算）
      tierCommissionRate: formData.myCommission      // 我的返佣
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
            {editingNode ? '编辑返佣设置' : '新增下级'}
          </h2>
          {parentNode && (
            <p className="text-sm text-gray-500 mt-1">
              上级: {parentNode.tierDisplayName}
            </p>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 账号名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.tierDisplayName}
              onChange={e => setFormData({ ...formData, tierDisplayName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="输入层级名称"
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
          
          {/* 总返佣额度 - 只读 */}
          <div className="bg-amber-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-700">总返佣额度</p>
                <p className="text-xs text-amber-500">{editingNode ? '授权的返佣总额，不可修改' : '上级分配的返佣额度'}</p>
              </div>
              <span className="text-2xl font-bold text-amber-700">{totalBudget}%</span>
            </div>
          </div>
          
          {/* 我的返佣 - 滑块 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              我的返佣（本级自留）
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max={totalBudget}
                value={formData.myCommission}
                onChange={e => setFormData({ ...formData, myCommission: Number(e.target.value) })}
                className="flex-1"
              />
              <span className="w-16 text-center font-bold text-lg text-green-600">
                {formData.myCommission}%
              </span>
            </div>
          </div>
          
          {/* 下放给下级 - 自动计算，只读 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              下放给下级（自动计算）
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-blue-200 rounded-full relative">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: totalBudget > 0 ? `${(delegateToChild / totalBudget) * 100}%` : '0%' }}
                />
              </div>
              <span className="w-16 text-center font-bold text-lg text-blue-600">
                {delegateToChild}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              = 总额度 ({totalBudget}%) − 我的返佣 ({formData.myCommission}%)
            </p>
          </div>
          
          {/* 分配预览 */}
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="text-green-600 font-medium">✓ 分配合理</p>
                <p className="text-green-500 text-xs mt-1">
                  本级 {formData.myCommission}% + 下放 {delegateToChild}% = {totalBudget}%
                </p>
              </div>
              {delegateToChild > 0 && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-lg">
                  可继续分配
                </span>
              )}
            </div>
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
              className="px-6 py-2.5 rounded-xl text-white bg-primary-600 hover:bg-primary-700"
            >
              {editingNode ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 绑定账号模态框
function BindAccountModal({
  isOpen,
  onClose,
  onBind,
  parentNode,
  manufacturerId
}: {
  isOpen: boolean
  onClose: () => void
  onBind: (accounts: any[], parentNode: TierNode, primaryUserId: string) => void
  parentNode: TierNode | null
  manufacturerId: string
}) {
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [primaryUserId, setPrimaryUserId] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  // 加载账号列表
  useEffect(() => {
    if (!isOpen) return
    
    const loadAccounts = async () => {
      setLoading(true)
      try {
        const resp = await apiClient.get('/accounts/users', {
          params: { 
            manufacturerId,
            limit: 100 
          }
        })
        const list = resp.data?.data?.list || resp.data?.list || []
        setAccounts(list)
        
        const existingPrimary = parentNode?.boundUserId
          ? String((parentNode.boundUserId as any)?._id || parentNode.boundUserId)
          : ''
        setPrimaryUserId(existingPrimary)

        // 预选已绑定的账号
        if (parentNode && (parentNode as any).boundUserIds?.length > 0) {
          const existingIds = new Set<string>((parentNode as any).boundUserIds.map((u: any) => String(u._id || u)))
          if (existingPrimary) existingIds.add(existingPrimary)
          setSelectedIds(existingIds)
        } else {
          const init = new Set<string>()
          if (existingPrimary) init.add(existingPrimary)
          setSelectedIds(init)
        }
      } catch (err) {
        console.error('加载账号列表失败:', err)
        toast.error('加载账号列表失败')
      } finally {
        setLoading(false)
      }
    }
    
    loadAccounts()
    setSearchKeyword('')
  }, [isOpen, manufacturerId, parentNode])

  const filteredAccounts = useMemo(() => {
    if (!searchKeyword) return accounts
    const kw = searchKeyword.toLowerCase()
    return accounts.filter(a => 
      a.username?.toLowerCase().includes(kw) ||
      a.nickname?.toLowerCase().includes(kw) ||
      a.phone?.includes(kw)
    )
  }, [accounts, searchKeyword])

  const selectedAccounts = useMemo(() => {
    return accounts.filter(a => selectedIds.has(String(a._id)))
  }, [accounts, selectedIds])

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
        if (primaryUserId && primaryUserId === id) {
          setPrimaryUserId('')
        }
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleConfirm = () => {
    if (selectedIds.size === 0) {
      toast.error('请选择至少一个账号')
      return
    }
    if (!parentNode) return
    
    const selected = accounts.filter(a => selectedIds.has(a._id))
    const primary = primaryUserId && selectedIds.has(primaryUserId) ? primaryUserId : ''
    onBind(selected, parentNode, primary)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">绑定账号</h2>
          {parentNode && (
            <p className="text-sm text-gray-500 mt-1">
              将账号绑定到: {parentNode.tierDisplayName}
            </p>
          )}
        </div>
        
        {/* 搜索框 */}
        <div className="px-6 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              placeholder="搜索账号名称、昵称、手机号..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
        
        {/* 账号列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : filteredAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无可绑定的账号</div>
          ) : (
            filteredAccounts.map(account => {
              const isBound = parentNode && (parentNode as any).boundUserIds?.some((u: any) => String(u._id || u) === String(account._id))
              return (
                <div
                  key={account._id}
                  onClick={() => toggleSelect(account._id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                    isBound
                      ? "border-green-500 bg-green-50"
                      : selectedIds.has(account._id)
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                    {account.avatar ? (
                      <img src={account.avatar.startsWith('http') ? account.avatar : `/api/files/${account.avatar}`} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      account.nickname?.charAt(0) || account.username?.charAt(0) || '?'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate flex items-center gap-2">
                      {account.nickname || account.username}
                      {isBound && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">已绑定</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {account.phone || account.username}
                      {account.role && ` · ${account.role}`}
                    </div>
                  </div>
                  {(isBound || selectedIds.has(account._id)) && (
                    <CheckCircle className={cn("w-5 h-5", isBound ? "text-green-600" : "text-primary-600")} />
                  )}
                </div>
              )
            })
          )}
        </div>
        
        {/* 底部按钮 */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">已选择 {selectedIds.size} 个账号</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">主账号</span>
              <select
                value={primaryUserId}
                onChange={(e) => setPrimaryUserId(e.target.value)}
                disabled={selectedIds.size === 0}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="">不设置（平均分）</option>
                {selectedAccounts.map(a => (
                  <option key={String(a._id)} value={String(a._id)}>
                    {a.nickname || a.username || String(a._id)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
              className={cn(
                "px-6 py-2.5 rounded-xl text-white",
                selectedIds.size === 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700"
              )}
            >
              确认绑定
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// 主组件
export default function TierHierarchyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()

  const getFallbackReturnTo = () => {
    const stored = sessionStorage.getItem('channels_return_to')
    return stored || '/admin/manufacturers?tab=channels'
  }

  const handleBack = () => {
    const returnTo = searchParams.get('returnTo')
    if (returnTo) {
      navigate(decodeURIComponent(returnTo))
    } else {
      navigate(getFallbackReturnTo(), { replace: true })
    }
  }
  
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
  const companyNameFromUrl = searchParams.get('companyName') || ''
  const effectiveCompanyName = companyId ? '' : companyNameFromUrl
  const isManufacturerAdmin = Boolean(manufacturerId) && (isPlatformAdmin || userAllManufacturerIds.includes(String(manufacturerId)))
  
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes] = useState<TierNode[]>([])
  const [rootNode, setRootNode] = useState<TierNode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [manufacturerInfo, setManufacturerInfo] = useState<any>(null)
  
  // 模态框状态
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingNode, setEditingNode] = useState<TierNode | null>(null)
  const [parentNodeForAdd, setParentNodeForAdd] = useState<TierNode | null>(null)
  const [showBindModal, setShowBindModal] = useState(false)
  const [bindParentNode, setBindParentNode] = useState<TierNode | null>(null)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleNode, setRuleNode] = useState<TierNode | null>(null)
  
  const currentUserId = (user as any)?._id || (user as any)?.id || ''
  
  // 加载层级数据
  const loadHierarchy = useCallback(async () => {
    if (!manufacturerId) return
    
    setLoading(true)
    try {
      const params: any = { manufacturerId, _t: Date.now() }
      if (companyId) params.companyId = companyId
      if (effectiveCompanyName) params.companyName = effectiveCompanyName
      
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
  }, [manufacturerId, companyId, effectiveCompanyName])
  
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

    const delegatedRate = (() => {
      const direct = (parent as any)?.tierDelegatedRate
      if (direct === undefined || direct === null) {
        const discount = (parent as any)?.tierDiscountRate ?? (parent as any)?.ownProductMinDiscount ?? (parent as any)?.minDiscountRate ?? 0
        const commission = (parent as any)?.tierCommissionRate ?? (parent as any)?.ownProductCommission ?? (parent as any)?.commissionRate ?? 0
        return Math.max(0, Number(discount) - Number(commission))
      }
      const directNum = Number(direct) || 0
      if (directNum > 0) return directNum
      const hasExplicitTierRates = (parent as any)?.tierDiscountRate !== undefined || (parent as any)?.tierCommissionRate !== undefined
      if (hasExplicitTierRates) return 0
      const discount = (parent as any)?.ownProductMinDiscount ?? (parent as any)?.minDiscountRate ?? (parent as any)?.tierDiscountRate ?? 0
      const commission = (parent as any)?.ownProductCommission ?? (parent as any)?.commissionRate ?? (parent as any)?.tierCommissionRate ?? 0
      const derived = Math.max(0, Number(discount) - Number(commission))
      return derived
    })()
    
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
  
  // 绑定账号 - 打开选择模态框
  const handleBindAccount = (parentId: string) => {
    const parent = nodes.find(n => n._id === parentId) || rootNode
    if (!parent) return
    
    setBindParentNode(parent)
    setShowBindModal(true)
  }
  
  // 执行账号绑定 - 将账号关联到现有层级
  const handleBindAccounts = async (accounts: any[], targetNode: TierNode, primaryUserId: string) => {
    try {
      // 将账号绑定到现有层级节点（使用现有PUT接口）
      const boundUserIds = accounts.map(a => a._id)
      await apiClient.put(`/authorizations/tier-node/${targetNode._id}`, {
        boundUserIds,
        boundUserId: primaryUserId ? primaryUserId : null
      })
      
      toast.success(`成功绑定 ${accounts.length} 个账号`)
      loadHierarchy()
    } catch (err: any) {
      toast.error(err?.response?.data?.message || '绑定失败')
    }
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

  const handleOpenRules = (node: TierNode) => {
    setRuleNode(node)
    setShowRuleModal(true)
  }

  const handleSaveRules = async (ruleSets: Array<{ name: string; rules: Array<{ depth: number; commissionRate: number; description?: string }>; partnerRules: Array<{ depth: number; commissionRate: number; description?: string }> }>) => {
    if (!ruleNode?._id) {
      toast.error('节点ID无效，无法保存')
      throw new Error('节点ID无效')
    }
    console.log('[handleSaveRules] Saving to node:', ruleNode._id, 'ruleSets:', JSON.stringify(ruleSets))
    const resp = await apiClient.put(`/authorizations/tier-node/${ruleNode._id}`, {
      tierCommissionRuleSets: ruleSets
    })
    console.log('[handleSaveRules] Response:', resp.data)
    toast.success('规则已保存')
    loadHierarchy()
  }
  
  // 删除节点 - 直接删除无需确认
  const handleDelete = async (nodeId: string) => {
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
          companyName: effectiveCompanyName
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
    const direct = (rootNode as any)?.tierDelegatedRate
    if (direct !== undefined && direct !== null) {
      const directNum = Number(direct) || 0
      if (directNum > 0) return directNum
      const hasExplicitTierRates = (rootNode as any)?.tierDiscountRate !== undefined || (rootNode as any)?.tierCommissionRate !== undefined
      if (hasExplicitTierRates) return 0
    }
    const discount = (rootNode as any)?.ownProductMinDiscount ?? (rootNode as any)?.minDiscountRate ?? (rootNode as any)?.tierDiscountRate ?? 0
    const commission = (rootNode as any)?.ownProductCommission ?? (rootNode as any)?.commissionRate ?? (rootNode as any)?.tierCommissionRate ?? 0
    const derived = Math.max(0, Number(discount) - Number(commission))
    return derived || 40
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
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">层级分成体系</h1>
                {manufacturerInfo && (
                  <p className="text-sm text-gray-500">
                    {manufacturerInfo.name || manufacturerInfo.fullName}
                    {effectiveCompanyName && ` - ${effectiveCompanyName}`}
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
              onBindAccount={handleBindAccount}
              onEdit={handleEdit}
              onOpenRules={handleOpenRules}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
              expanded={expandedNodes.has(rootNode._id)}
              onToggleExpand={() => handleToggleExpand(rootNode._id)}
              currentUserId={currentUserId}
              isManufacturerAdmin={isManufacturerAdmin}
            />
            
            {/* 子节点树 */}
            {expandedNodes.has(rootNode._id) && nodes.length > 0 && (
              <div className="mt-8 w-full">
                <TierTree
                  nodes={nodes}
                  parentId={rootNode._id}
                  level={1}
                  onAddChild={handleAddChild}
                  onBindAccount={handleBindAccount}
                  onEdit={handleEdit}
                  onOpenRules={handleOpenRules}
                  onDelete={handleDelete}
                  onViewDetails={handleViewDetails}
                  expandedNodes={expandedNodes}
                  onToggleExpand={handleToggleExpand}
                  currentUserId={currentUserId}
                  isManufacturerAdmin={isManufacturerAdmin}
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
        rootDiscount={rootNode?.ownProductMinDiscount || (rootNode as any)?.minDiscountRate || 0}
      />
      
      {/* 绑定账号模态框 */}
      <BindAccountModal
        isOpen={showBindModal}
        onClose={() => setShowBindModal(false)}
        onBind={handleBindAccounts}
        parentNode={bindParentNode}
        manufacturerId={manufacturerId}
      />

      <TierRuleModal
        isOpen={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        node={ruleNode}
        onSave={handleSaveRules}
      />
    </div>
  )
}
