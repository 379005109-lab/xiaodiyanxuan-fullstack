import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  Plus, Minus, Edit2, Trash2, ChevronDown, ChevronRight, Users, 
  Building2, Percent, Settings, Eye, Save, X, AlertCircle,
  TrendingUp, GitBranch, Layers, UserCheck, Store, Briefcase,
  BarChart3, ArrowRight, Check, UserPlus, List, Grid, FileText, CheckCircle
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { getThumbnailUrl } from '@/services/uploadService'

// ==================== 类型定义 ====================

// 角色模块类型
interface RoleModule {
  _id: string
  code: string
  name: string
  icon: string
  description: string
  maxProfitRate: number  // 毛利池上限，如40%
  currentAllocatedRate: number  // 当前已分配比例
  discountRules: DiscountRule[]
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// 折扣规则
interface DiscountRule {
  _id: string
  name: string
  discountType?: 'rate' | 'minPrice'
  discountRate?: number  // 折扣比例，如0.85表示85折
  minDiscountPrice?: number  // 最低折扣价（与折扣比例二选一）
  commissionRate: number  // 佣金/返点比例
  conditions: {
    minOrderAmount?: number
    minOrderCount?: number
    memberLevel?: string
  }
  isDefault: boolean
}

// 账号授权关系
interface AuthorizedAccount {
  _id: string
  userId: string
  username: string
  nickname?: string
  phone?: string
  roleModuleId: string
  roleModuleName: string
  discountRuleId?: string
  parentId: string | null
  parentName?: string
  level: number  // 层级深度
  allocatedRate: number  // 分配的比例
  availableRate: number  // 可再分配比例
  distributionRate?: number  // 垂直权重比例（同一父节点下子节点合计≤100）
  visibleCategoryIds?: string[]
  visibleProductIds?: string[]
  categoryOverrides?: Array<{
    categoryId: string
    discountRate?: number
    commissionRate?: number
  }>
  productOverrides?: Array<{
    productId: string
    discountRate?: number
    commissionRate?: number
  }>
  // 层级返佣规则ID（引用CommissionRule）
  commissionRuleId?: string
  // 被绑定人员的折扣设置
  boundUserDiscount?: number
  // 被绑定人员的返佣设置
  boundUserCommission?: number
  children: AuthorizedAccount[]
  status: 'active' | 'suspended' | 'pending'
  createdAt: string
}

const STORAGE_SELECTED_MANUFACTURER_KEY = 'tier_system_selected_manufacturer'

// ==================== 预设角色模块 ====================

const DEFAULT_ROLE_MODULES: Omit<RoleModule, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    code: 'designer',
    name: '设计师',
    icon: 'UserCheck',
    description: '室内设计师、软装设计师等专业设计人员',
    maxProfitRate: 40,
    currentAllocatedRate: 0,
    discountRules: [],
    isActive: true,
    sortOrder: 1
  },
  {
    code: 'channel',
    name: '渠道商',
    icon: 'GitBranch',
    description: '分销渠道、代理商等中间商',
    maxProfitRate: 35,
    currentAllocatedRate: 0,
    discountRules: [],
    isActive: true,
    sortOrder: 2
  },
  {
    code: 'owner',
    name: '业主',
    icon: 'Users',
    description: 'C端消费者、个人业主',
    maxProfitRate: 20,
    currentAllocatedRate: 0,
    discountRules: [],
    isActive: true,
    sortOrder: 3
  },
  {
    code: 'b2b',
    name: 'B端渠道',
    icon: 'Briefcase',
    description: '企业客户、批发商、工程渠道',
    maxProfitRate: 30,
    currentAllocatedRate: 0,
    discountRules: [],
    isActive: true,
    sortOrder: 4
  },
  {
    code: 'flagship',
    name: '高定旗舰店',
    icon: 'Store',
    description: '品牌直营旗舰店、高端体验店',
    maxProfitRate: 45,
    currentAllocatedRate: 0,
    discountRules: [],
    isActive: true,
    sortOrder: 5
  },
  {
    code: 'other',
    name: '其他',
    icon: 'Layers',
    description: '其他合作模式',
    maxProfitRate: 25,
    currentAllocatedRate: 0,
    discountRules: [],
    isActive: true,
    sortOrder: 6
  }
]

// 层级返佣规则模板
interface CommissionRule {
  _id: string
  name: string  // 规则名称，如"2层分佣"、"3层分佣"
  description?: string
  selfRate: number  // 自己销售的返佣比例 (%)
  subordinateRates: number[]  // 各层级下级的返佣比例 (%)，索引0=直接下级
  maxTotal: number  // 最大总返佣比例，默认40
  isDefault?: boolean
  createdAt: string
}

// 分层体系存储结构
interface TierSystemData {
  profitSettings: {
    minSaleDiscountRate: number
  }
  roleModules: RoleModule[]
  authorizedAccounts: AuthorizedAccount[]
  commissionRules?: CommissionRule[]  // 层级返佣规则模板列表
}

interface ReconciliationRow {
  date: string
  manufacturerId: string
  manufacturerName: string
  orderCount: number
  totalAmount: number
  commissionRate: number
  settlementAmount: number
  status?: string
}

// 默认层级返佣规则
const DEFAULT_COMMISSION_RULES: Omit<CommissionRule, '_id' | 'createdAt'>[] = [
  {
    name: '直销模式',
    description: '无下级，自己获得全部返佣',
    selfRate: 40,
    subordinateRates: [],
    maxTotal: 40,
    isDefault: true
  },
  {
    name: '2层分佣',
    description: '自己20%，直接下级20%',
    selfRate: 20,
    subordinateRates: [20],
    maxTotal: 40
  },
  {
    name: '3层分佣',
    description: '自己10%，一级下级15%，二级下级15%',
    selfRate: 10,
    subordinateRates: [15, 15],
    maxTotal: 40
  }
]

const createDefaultTierSystemData = (): TierSystemData => {
  const now = Date.now()
  return {
    profitSettings: {
      minSaleDiscountRate: 1
    },
    roleModules: DEFAULT_ROLE_MODULES.map((m, i) => ({
      ...m,
      _id: `role_${m.code}_${now + i}`,
      discountRules: [
        {
          _id: `rule_default_${m.code}`,
          name: '默认折扣',
          discountType: 'rate',
          discountRate: 1 - (m.maxProfitRate / 100) * 0.5,
          commissionRate: (m.maxProfitRate / 100) * 0.3,
          conditions: {},
          isDefault: true
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })),
    authorizedAccounts: [],
    commissionRules: DEFAULT_COMMISSION_RULES.map((r, i) => ({
      ...r,
      _id: `comm_rule_${now + i}`,
      createdAt: new Date().toISOString()
    }))
  }
}

// 图标映射
const ICON_MAP: Record<string, any> = {
  UserCheck,
  GitBranch,
  Users,
  Briefcase,
  Store,
  Layers,
  Building2
}

const normalizeFileId = (v: any): string => {
  if (!v) return ''
  const raw = String(v)
  if (!raw) return ''
  if (raw.startsWith('/api/files/')) return raw.replace('/api/files/', '').split('?')[0]
  return raw
}

const getLogoSrc = (logo: any, size: number) => {
  const id = normalizeFileId(logo)
  if (!id) return ''
  if (id.startsWith('http://') || id.startsWith('https://')) return id
  return getThumbnailUrl(id, size)
}

// ==================== 主组件 ====================

export default function TierSystemManagement() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const lockedManufacturerId = (user as any)?.manufacturerId ? String((user as any).manufacturerId) : ''
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin'

  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>(() => {
    if (lockedManufacturerId) return lockedManufacturerId
    const saved = localStorage.getItem(STORAGE_SELECTED_MANUFACTURER_KEY)
    return saved || ''
  })

  const [selectedManufacturerCommission, setSelectedManufacturerCommission] = useState<number>(0)
  const [selectedManufacturerMeta, setSelectedManufacturerMeta] = useState<{ name?: string; logo?: string } | null>(null)

  const [activeTab, setActiveTab] = useState<'hierarchy' | 'pool' | 'reconciliation'>('hierarchy')
  const [data, setData] = useState<TierSystemData>(() => createDefaultTierSystemData())
  const [selectedModule, setSelectedModule] = useState<RoleModule | null>(null)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['__root__', 'headquarters']))

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const tab = String(params.get('tab') || '').trim()
      if (tab === 'hierarchy' || tab === 'pool' || tab === 'reconciliation') {
        setActiveTab(tab)
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!isSuperAdmin) return
    const loadManufacturers = async () => {
      try {
        const resp = await apiClient.get('/manufacturers/all')
        const list = resp.data?.data || resp.data?.list || resp.data || []
        setManufacturers(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('加载厂家列表失败:', e)
        setManufacturers([])
      }
    }
    loadManufacturers()
  }, [isSuperAdmin])

  useEffect(() => {
    if (lockedManufacturerId) {
      if (selectedManufacturerId !== lockedManufacturerId) {
        setSelectedManufacturerId(lockedManufacturerId)
      }
      return
    }

    if (isSuperAdmin && !selectedManufacturerId && manufacturers.length > 0) {
      setSelectedManufacturerId(String(manufacturers[0]?._id || ''))
    }
  }, [lockedManufacturerId, isSuperAdmin, manufacturers, selectedManufacturerId])

  useEffect(() => {
    if (lockedManufacturerId) return
    if (selectedManufacturerId) {
      localStorage.setItem(STORAGE_SELECTED_MANUFACTURER_KEY, selectedManufacturerId)
    }
  }, [lockedManufacturerId, selectedManufacturerId])

  useEffect(() => {
    const mid = lockedManufacturerId || selectedManufacturerId || ''
    const loadRemote = async () => {
      if (!mid) {
        setData(createDefaultTierSystemData())
        setSelectedModule(null)
        setExpandedNodes(new Set(['__root__', 'headquarters']))
        return
      }

      try {
        const params: any = { _ts: Date.now() }
        if (isSuperAdmin && !lockedManufacturerId) params.manufacturerId = mid

        const resp = await apiClient.get('/tier-system', { params })
        const doc = resp.data?.data

        if (!doc) {
          const next = createDefaultTierSystemData()
          setData(next)
          await apiClient.put('/tier-system', { manufacturerId: mid, ...next })
        } else {
          const defaultData = createDefaultTierSystemData()
          const next: TierSystemData = {
            profitSettings: {
              minSaleDiscountRate: Number(doc?.profitSettings?.minSaleDiscountRate ?? 1)
            },
            roleModules: Array.isArray(doc.roleModules) ? doc.roleModules : [],
            authorizedAccounts: Array.isArray(doc.authorizedAccounts) ? doc.authorizedAccounts : [],
            commissionRules: Array.isArray(doc.commissionRules) && doc.commissionRules.length > 0 
              ? doc.commissionRules 
              : defaultData.commissionRules,
          }

          if (!next.roleModules || next.roleModules.length === 0) {
            next.roleModules = defaultData.roleModules
          }

          setData(next)
        }
      } catch (e) {
        console.error('加载分层体系数据失败:', e)
        setData(createDefaultTierSystemData())
      } finally {
        setSelectedModule(null)
        setExpandedNodes(new Set(['__root__', 'headquarters']))
      }
    }

    loadRemote()
  }, [lockedManufacturerId, selectedManufacturerId])

  useEffect(() => {
    const mid = lockedManufacturerId || selectedManufacturerId || ''
    const run = async () => {
      if (!mid) {
        setSelectedManufacturerCommission(0)
        setSelectedManufacturerMeta(null)
        return
      }
      try {
        const params: any = { _ts: Date.now() }
        if (isSuperAdmin && !lockedManufacturerId) params.manufacturerId = mid
        const resp = await apiClient.get(`/manufacturers/${mid}`, { params })
        const m = resp.data?.data
        setSelectedManufacturerCommission(Number(m?.defaultCommission || 0))
        setSelectedManufacturerMeta({
          name: String(m?.name || m?.fullName || ''),
          logo: m?.logo ? String(m.logo) : ''
        })
      } catch {
        setSelectedManufacturerCommission(0)
        setSelectedManufacturerMeta(null)
      }
    }
    run()
  }, [lockedManufacturerId, selectedManufacturerId, isSuperAdmin])

  const updateManufacturerCommission = async (rate: number) => {
    const mid = lockedManufacturerId || selectedManufacturerId || ''
    if (!mid) return
    const v = Math.max(0, Math.min(100, Math.floor(Number(rate) || 0)))
    setSelectedManufacturerCommission(v)
    try {
      await apiClient.put(`/manufacturers/${mid}`, { defaultCommission: v })
      toast.success('保存成功')
    } catch {
      toast.error('保存失败')
    }
  }

  // 保存数据
  const saveData = async (newData: TierSystemData) => {
    const mid = lockedManufacturerId || selectedManufacturerId || ''
    setData(newData)
    if (!mid) return
    await apiClient.put('/tier-system', { manufacturerId: mid, ...newData })
  }

  // 更新角色模块
  const updateRoleModule = (moduleId: string, updates: Partial<RoleModule>) => {
    const newModules = data.roleModules.map(m => 
      m._id === moduleId 
        ? { ...m, ...updates, updatedAt: new Date().toISOString() }
        : m
    )
    saveData({ ...data, roleModules: newModules })
      .then(() => toast.success('保存成功'))
      .catch(() => toast.error('保存失败'))
    if (selectedModule?._id === moduleId) {
      setSelectedModule({ ...selectedModule, ...updates })
    }
  }

  const updateProfitSettings = (updates: Partial<TierSystemData['profitSettings']>) => {
    const next = {
      ...data,
      profitSettings: {
        ...data.profitSettings,
        ...updates
      }
    }
    saveData(next)
      .then(() => toast.success('保存成功'))
      .catch(() => toast.error('保存失败'))
  }

  // 添加折扣规则
  const addDiscountRule = (moduleId: string, rule: Omit<DiscountRule, '_id'>) => {
    const newRule = { ...rule, _id: `rule_${Date.now()}` }
    const newModules = data.roleModules.map(m => 
      m._id === moduleId 
        ? { ...m, discountRules: [...m.discountRules, newRule], updatedAt: new Date().toISOString() }
        : m
    )
    saveData({ ...data, roleModules: newModules })
      .then(() => toast.success('规则添加成功'))
      .catch(() => toast.error('保存失败'))
    if (selectedModule?._id === moduleId) {
      setSelectedModule({ ...selectedModule, discountRules: [...selectedModule.discountRules, newRule] })
    }
  }

  // 更新折扣规则
  const updateDiscountRule = (moduleId: string, ruleId: string, updates: Partial<DiscountRule>) => {
    const newModules = data.roleModules.map(m => 
      m._id === moduleId 
        ? { 
            ...m, 
            discountRules: m.discountRules.map(r => r._id === ruleId ? { ...r, ...updates } : r),
            updatedAt: new Date().toISOString()
          }
        : m
    )
    saveData({ ...data, roleModules: newModules })
      .then(() => toast.success('规则更新成功'))
      .catch(() => toast.error('保存失败'))
    if (selectedModule?._id === moduleId) {
      setSelectedModule({ 
        ...selectedModule, 
        discountRules: selectedModule.discountRules.map(r => r._id === ruleId ? { ...r, ...updates } : r)
      })
    }
  }

  // 删除折扣规则
  const deleteDiscountRule = (moduleId: string, ruleId: string) => {
    if (!confirm('确定删除此规则吗？')) return
    
    const newModules = data.roleModules.map(m => 
      m._id === moduleId 
        ? { 
            ...m, 
            discountRules: m.discountRules.filter(r => r._id !== ruleId),
            updatedAt: new Date().toISOString()
          }
        : m
    )
    saveData({ ...data, roleModules: newModules })
      .then(() => toast.success('规则已删除'))
      .catch(() => toast.error('保存失败'))
    if (selectedModule?._id === moduleId) {
      setSelectedModule({ 
        ...selectedModule, 
        discountRules: selectedModule.discountRules.filter(r => r._id !== ruleId)
      })
    }
  }

  const currentManufacturerName =
    selectedManufacturerMeta?.name ||
    (user as any)?.manufacturerName ||
    (user as any)?.manufacturer?.name ||
    (lockedManufacturerId || selectedManufacturerId || '')

  const currentManufacturerLogo = selectedManufacturerMeta?.logo || (user as any)?.manufacturer?.logo || ''
  const logoSrc = currentManufacturerLogo ? getLogoSrc(currentManufacturerLogo, 160) : ''

  // 删除层级账号
  const handleDeleteAccount = async (accountId: string) => {
    try {
      const newAccounts = data.authorizedAccounts.filter(a => String(a._id) !== accountId)
      await saveData({ ...data, authorizedAccounts: newAccounts })
      toast.success('层级已删除')
    } catch (e) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="p-4 max-w-[1600px] mx-auto">
      {/* 统一顶部栏 - 仅在非hierarchy模式显示（hierarchy模式下由HierarchyTab内部渲染） */}
      {activeTab !== 'hierarchy' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            {/* 左侧：Logo + 标题 + 厂家选择 */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border bg-white overflow-hidden flex items-center justify-center shrink-0">
                {logoSrc ? (
                  <img src={logoSrc} alt={currentManufacturerName || 'manufacturer'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gray-50" />
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-black text-gray-900 truncate">分层架构管控</h1>
                {!lockedManufacturerId ? (
                  <select
                    value={selectedManufacturerId}
                    onChange={(e) => setSelectedManufacturerId(e.target.value)}
                    className="mt-0.5 px-2 py-0.5 rounded-lg bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-600 max-w-[140px]"
                    disabled={!isSuperAdmin}
                  >
                    <option value="">选择厂家</option>
                    {manufacturers.map(m => (
                      <option key={m._id} value={m._id}>{m.name || m.fullName || m._id}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[10px] text-gray-400 font-bold truncate">{currentManufacturerName}</p>
                )}
              </div>
            </div>

            {/* 中间：模式切换按钮组 */}
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('hierarchy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'hierarchy' ? 'bg-[#153e35] text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                公司分层
              </button>
              <button
                onClick={() => setActiveTab('pool')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'pool' ? 'bg-[#153e35] text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                角色权限
              </button>
              <button
                onClick={() => setActiveTab('reconciliation')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'reconciliation' ? 'bg-[#153e35] text-white shadow-sm' : 'text-gray-600 hover:bg-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                分润对账
              </button>
            </div>

            {/* 右侧：返回按钮 */}
            <button
              type="button"
              onClick={() => navigate('/admin/manufacturers')}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:text-[#153e35] hover:border-[#153e35] transition-all"
            >
              返回主控
            </button>
          </div>
        </div>
      )}

      {/* 内容区域 */}
      {activeTab === 'pool' && (
        <RolesPermissionTab
          modules={data.roleModules}
          profitSettings={data.profitSettings}
          onUpdateProfitSettings={updateProfitSettings}
          commissionRate={selectedManufacturerCommission}
          onUpdateCommissionRate={updateManufacturerCommission}
          commissionEditable={true}
          selectedModule={selectedModule}
          onSelectModule={setSelectedModule}
          onUpdateModule={updateRoleModule}
          onAddRule={addDiscountRule}
          onUpdateRule={updateDiscountRule}
          onDeleteRule={deleteDiscountRule}
        />
      )}

      {activeTab === 'hierarchy' && (
        <HierarchyTab
          modules={data.roleModules}
          accounts={data.authorizedAccounts}
          manufacturerId={lockedManufacturerId || selectedManufacturerId}
          manufacturerName={selectedManufacturerMeta?.name || ''}
          manufacturerLogo={selectedManufacturerMeta?.logo || ''}
          profitSettings={data.profitSettings}
          commissionRate={selectedManufacturerCommission}
          commissionRules={data.commissionRules || []}
          onBack={() => navigate('/admin/manufacturers')}
          expandedNodes={expandedNodes}
          onSetExpandedNodes={setExpandedNodes}
          onToggleNode={(id) => {
            setExpandedNodes((prev) => {
              const newExpanded = new Set(prev)
              if (newExpanded.has(id)) {
                newExpanded.delete(id)
              } else {
                newExpanded.add(id)
              }
              return newExpanded
            })
          }}
          onSaveAccounts={(accounts) => {
            const nextModules = (data.roleModules || []).map((m) => {
              if (String(m._id) !== String(selectedModule?._id)) return m
              const sumRoot = (accounts || [])
                .filter(a => String(a.roleModuleId) === String(m._id) && !a.parentId)
                .reduce((s, a) => s + Number(a.allocatedRate || 0), 0)
              return { ...m, currentAllocatedRate: sumRoot }
            })
            saveData({ ...data, roleModules: nextModules, authorizedAccounts: accounts })
              .then(() => toast.success('保存成功'))
              .catch(() => toast.error('保存失败'))
          }}
          activeTab={activeTab}
          onSetActiveTab={setActiveTab}
          logoSrc={logoSrc}
          lockedManufacturerId={lockedManufacturerId}
          isSuperAdmin={isSuperAdmin}
          manufacturers={manufacturers}
          selectedManufacturerId={selectedManufacturerId}
          onSetSelectedManufacturerId={setSelectedManufacturerId}
        />
      )}

      {activeTab === 'reconciliation' && (
        <ReconciliationTab
          manufacturerId={lockedManufacturerId || selectedManufacturerId || ''}
          isSuperAdmin={isSuperAdmin}
          lockedManufacturerId={lockedManufacturerId}
        />
      )}
    </div>
  )
}

function ReconciliationTab({
  manufacturerId,
  isSuperAdmin,
  lockedManufacturerId
}: {
  manufacturerId: string
  isSuperAdmin: boolean
  lockedManufacturerId: string
}) {
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'completed' | 'rejected'>('all')
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all')

  // 模拟财务分润对账流水数据，按图2的样式
  const reconciliationRecords = [
    {
      id: 'REC001',
      orderNumber: 'ORD20241201001',
      targetUnit: '华南大区',
      targetPerson: '张经理',
      salesAmount: 58000,
      profitAmount: 8700,
      commissionRate: 15.0,
      status: 'completed',
      createTime: '2024-12-01 10:30',
      processTime: '2024-12-01 15:45',
      note: '正常结算'
    },
    {
      id: 'REC002',
      orderNumber: 'ORD20241201002',
      targetUnit: '华东大区',
      targetPerson: '李设计师',
      salesAmount: 42000,
      profitAmount: 4200,
      commissionRate: 10.0,
      status: 'processing',
      createTime: '2024-12-01 14:20',
      processTime: null,
      note: '审核中'
    },
    {
      id: 'REC003',
      orderNumber: 'ORD20241130005',
      targetUnit: '华北大区',
      targetPerson: '王销售',
      salesAmount: 25000,
      profitAmount: 1875,
      commissionRate: 7.5,
      status: 'pending',
      createTime: '2024-11-30 16:15',
      processTime: null,
      note: '待处理'
    },
    {
      id: 'REC004',
      orderNumber: 'ORD20241130003',
      targetUnit: '渠道合伙人',
      targetPerson: '陈总',
      salesAmount: 95000,
      profitAmount: 19000,
      commissionRate: 20.0,
      status: 'completed',
      createTime: '2024-11-30 09:30',
      processTime: '2024-11-30 18:20',
      note: '合伙人分润'
    },
    {
      id: 'REC005',
      orderNumber: 'ORD20241129008',
      targetUnit: '华南大区',
      targetPerson: '刘销售',
      salesAmount: 15000,
      profitAmount: 0,
      commissionRate: 5.0,
      status: 'rejected',
      createTime: '2024-11-29 11:45',
      processTime: '2024-11-29 17:30',
      note: '未达到最低分润标准'
    }
  ]

  const filteredRecords = reconciliationRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.targetUnit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.targetPerson.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter
    
    // 简单日期筛选逻辑
    let matchesDate = true
    if (dateRange === 'today') {
      matchesDate = record.createTime.startsWith('2024-12-01')
    } else if (dateRange === 'week') {
      matchesDate = record.createTime >= '2024-11-25'
    } else if (dateRange === 'month') {
      matchesDate = record.createTime >= '2024-11-01'
    }
    
    return matchesSearch && matchesStatus && matchesDate
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    }
    const labels = {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'rejected': '已拒绝'
    }
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status as keyof typeof labels] || status}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和筛选器 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">财务分润对账流水</h2>
            <p className="text-sm text-gray-500 mt-1">查看和管理分润对账记录，跟踪每笔订单的分润状态</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              导出报表
            </button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="搜索订单号、对象单位或人员..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">全部状态</option>
            <option value="pending">待处理</option>
            <option value="processing">处理中</option>
            <option value="completed">已完成</option>
            <option value="rejected">已拒绝</option>
          </select>
          <select
            className="px-4 py-2 border border-gray-300 rounded-lg"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
          >
            <option value="all">全部时间</option>
            <option value="today">今天</option>
            <option value="week">本周</option>
            <option value="month">本月</option>
          </select>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-blue-600 text-sm font-medium">总记录数</div>
            <div className="text-2xl font-bold text-blue-900">{reconciliationRecords.length}</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-green-600 text-sm font-medium">已完成</div>
            <div className="text-2xl font-bold text-green-900">
              {reconciliationRecords.filter(r => r.status === 'completed').length}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-yellow-600 text-sm font-medium">待处理</div>
            <div className="text-2xl font-bold text-yellow-900">
              {reconciliationRecords.filter(r => r.status === 'pending').length}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-purple-600 text-sm font-medium">总分润金额</div>
            <div className="text-2xl font-bold text-purple-900">
              ¥{reconciliationRecords.reduce((sum, r) => sum + r.profitAmount, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 对账流水表格 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  订单编号
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  对象单位/人员
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  销售金额
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分润金额
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分润比例
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  处理状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <div className="text-sm">暂无对账记录</div>
                    <div className="text-xs text-gray-400 mt-1">请调整筛选条件或稍后再试</div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{record.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.targetUnit}</div>
                      <div className="text-xs text-gray-500">{record.targetPerson}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">¥{record.salesAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">¥{record.profitAmount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.commissionRate}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{record.createTime}</div>
                      {record.processTime && (
                        <div className="text-xs text-gray-500">处理: {record.processTime}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        {record.status === 'pending' && (
                          <button className="text-green-600 hover:text-green-900">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function RolesPermissionTab({
  modules,
  profitSettings,
  onUpdateProfitSettings,
  commissionRate,
  onUpdateCommissionRate,
  commissionEditable,
  selectedModule,
  onSelectModule,
  onUpdateModule,
  onAddRule,
  onUpdateRule,
  onDeleteRule
}: {
  modules: RoleModule[]
  profitSettings: TierSystemData['profitSettings']
  onUpdateProfitSettings: (updates: Partial<TierSystemData['profitSettings']>) => void
  commissionRate: number
  onUpdateCommissionRate: (rate: number) => void
  commissionEditable: boolean
  selectedModule: RoleModule | null
  onSelectModule: (m: RoleModule | null) => void
  onUpdateModule: (id: string, updates: Partial<RoleModule>) => void
  onAddRule: (moduleId: string, rule: Omit<DiscountRule, '_id'>) => void
  onUpdateRule: (moduleId: string, ruleId: string, updates: Partial<DiscountRule>) => void
  onDeleteRule: (moduleId: string, ruleId: string) => void
}) {
  // 角色权限管理标签页
  return (
    <div className="space-y-10">
      <RoleModulesTab
        modules={modules}
        selectedModule={selectedModule}
        onSelectModule={onSelectModule}
        onUpdateModule={onUpdateModule}
        onAddRule={onAddRule}
        onUpdateRule={onUpdateRule}
        onDeleteRule={onDeleteRule}
      />
    </div>
  )
}

// ==================== Tab 按钮组件 ====================

function TabButton({ active, onClick, icon, label }: { 
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string 
}) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 ${
        active ? 'bg-[#153e35] text-white shadow-xl' : 'text-gray-400 hover:text-gray-600 bg-white border border-gray-100'
      }`}
      type="button"
    >
      {icon}
      {label}
    </button>
  )
}

// ==================== 角色模块标签页 ====================

function RoleModulesTab({
  modules,
  selectedModule,
  onSelectModule,
  onUpdateModule,
  onAddRule,
  onUpdateRule,
  onDeleteRule
}: {
  modules: RoleModule[]
  selectedModule: RoleModule | null
  onSelectModule: (m: RoleModule | null) => void
  onUpdateModule: (id: string, updates: Partial<RoleModule>) => void
  onAddRule: (moduleId: string, rule: Omit<DiscountRule, '_id'>) => void
  onUpdateRule: (moduleId: string, ruleId: string, updates: Partial<DiscountRule>) => void
  onDeleteRule: (moduleId: string, ruleId: string) => void
}) {
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null)

  return (
    <div className="space-y-6">
      {/* 左侧：模块列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {modules
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((module) => {
            const rules = Array.isArray(module.discountRules) ? module.discountRules : []
            const defaultRule = rules.find(r => r.isDefault) || rules[0] || null
            const defaultDiscountPct = Math.round(Math.max(0, Math.min(1, Number(defaultRule?.discountRate ?? 1))) * 100)
            const defaultCommissionPct = Math.round(Math.max(0, Math.min(1, Number(defaultRule?.commissionRate ?? 0))) * 100)
            const isSelected = selectedModule?._id === module._id
            return (
              <div
                key={module._id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectModule(module)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') onSelectModule(module)
                }}
                className={`bg-white rounded-[2.5rem] border shadow-sm hover:shadow-lg transition-all p-8 text-left cursor-pointer ${
                  isSelected ? 'border-emerald-200 ring-2 ring-emerald-100' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">系统角色及基准分润配置</div>
                    <div className="mt-2 text-2xl font-black text-gray-900 truncate">{module.name}</div>
                    <div className="mt-2 text-sm text-gray-500 line-clamp-2">{module.description}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onSelectModule(module)
                      }}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑规则"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onUpdateModule(module._id, { isActive: !module.isActive })
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-black transition-colors ${
                        module.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      激活权限
                    </button>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">最高授权折扣 (%)</div>
                    <div className="mt-2 text-3xl font-black text-gray-900">{defaultDiscountPct}</div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-5">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">默认分润比例 (%)</div>
                    <div className="mt-2 text-3xl font-black text-gray-900">{defaultCommissionPct}</div>
                  </div>
                </div>
              </div>
            )
          })}
      </div>

      {/* 右侧：模块详情和规则编辑 */}
      <div>
        {selectedModule ? (
          <div className="bg-white rounded-lg border border-gray-200">
            {/* 模块信息 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {(() => {
                    const Icon = ICON_MAP[selectedModule.icon] || Layers
                    return (
                      <div className="p-3 bg-primary-100 text-primary-600 rounded-xl">
                        <Icon className="w-8 h-8" />
                      </div>
                    )
                  })()}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedModule.name}</h2>
                    <p className="text-sm text-gray-500">{selectedModule.description}</p>
                    <p className="text-xs text-gray-400 mt-1">代码: {selectedModule.code}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateModule(selectedModule._id, { isActive: !selectedModule.isActive })}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      selectedModule.isActive 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedModule.isActive ? '已启用' : '已禁用'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectModule(null)}
                    className="px-3 py-1.5 text-sm rounded-lg transition-colors bg-gray-50 text-gray-600 hover:bg-gray-100"
                  >
                    关闭
                  </button>
                </div>
              </div>

              {/* 关键指标 */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">毛利池上限</p>
                  <p className="text-2xl font-bold text-primary-600">{selectedModule.maxProfitRate}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">已分配</p>
                  <p className="text-2xl font-bold text-orange-600">{selectedModule.currentAllocatedRate}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">可分配</p>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedModule.maxProfitRate - selectedModule.currentAllocatedRate}%
                  </p>
                </div>
              </div>
            </div>

            {/* 折扣规则列表 */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">折扣规则配置</h3>
              </div>

              {selectedModule.discountRules.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Settings className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">暂无折扣规则</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedModule.discountRules.map(rule => (
                    <div
                      key={rule._id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-primary-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{rule.name}</span>
                            {rule.isDefault && (
                              <span className="text-xs px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded">默认</span>
                            )}
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <span className="text-gray-600">
                              {(() => {
                                const t = rule.discountType || (typeof rule.minDiscountPrice === 'number' ? 'minPrice' : 'rate')
                                if (t === 'minPrice') {
                                  return (
                                    <>
                                      最低价: <strong className="text-primary-600">¥{Number(rule.minDiscountPrice || 0).toFixed(0)}</strong>
                                    </>
                                  )
                                }
                                const rate = typeof rule.discountRate === 'number' ? rule.discountRate : 1
                                return (
                                  <>
                                    折扣: <strong className="text-primary-600">{(rate * 100).toFixed(0)}%</strong>
                                  </>
                                )
                              })()}
                            </span>
                            <span className="text-gray-600">
                              返点: <strong className="text-green-600">{(rule.commissionRate * 100).toFixed(1)}%</strong>
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRule(rule)
                              setShowRuleModal(true)
                            }}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!rule.isDefault && (
                            <button
                              type="button"
                              onClick={() => onDeleteRule(selectedModule._id, rule._id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 h-96 flex items-center justify-center">
            <div className="text-center">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">请从左侧选择一个角色模块</p>
              <p className="text-sm text-gray-400 mt-1">点击模块查看和编辑折扣规则</p>
            </div>
          </div>
        )}
      </div>

      {/* 规则编辑模态框 */}
      {showRuleModal && selectedModule && (
        <RuleEditModal
          rule={editingRule}
          onClose={() => {
            setShowRuleModal(false)
            setEditingRule(null)
          }}
          onSave={(ruleData) => {
            if (editingRule) {
              onUpdateRule(selectedModule._id, editingRule._id, ruleData)
            } else {
              onAddRule(selectedModule._id, { ...ruleData, isDefault: false })
            }
            setShowRuleModal(false)
            setEditingRule(null)
          }}
        />
      )}
    </div>
  )
}

// ==================== 规则编辑模态框 ====================

function RuleEditModal({
  rule,
  onClose,
  onSave
}: {
  rule: DiscountRule | null
  onClose: () => void
  onSave: (data: Omit<DiscountRule, '_id' | 'isDefault'>) => void
}) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    discountType: (rule?.discountType || (typeof rule?.minDiscountPrice === 'number' ? 'minPrice' : 'rate')) as 'rate' | 'minPrice',
    discountRate: typeof rule?.discountRate === 'number' ? rule.discountRate : 0.9,
    minDiscountPrice: typeof rule?.minDiscountPrice === 'number' ? rule.minDiscountPrice : 0,
    commissionRate: rule?.commissionRate || 0.05
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('请输入规则名称')
      return
    }
    onSave({
      name: formData.name,
      discountType: formData.discountType,
      discountRate: formData.discountType === 'rate' ? formData.discountRate : undefined,
      minDiscountPrice: formData.discountType === 'minPrice' ? formData.minDiscountPrice : undefined,
      commissionRate: formData.commissionRate,
      conditions: {}
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {rule ? '编辑折扣规则' : '添加折扣规则'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">规则名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input w-full"
              placeholder="如：VIP折扣、新客优惠"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">折扣规格</label>
            <select
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
              className="input w-full"
            >
              <option value="rate">折扣比例</option>
              <option value="minPrice">最低折扣价</option>
            </select>
          </div>

          {formData.discountType === 'rate' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                折扣比例 ({(formData.discountRate * 100).toFixed(0)}%)
              </label>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={formData.discountRate}
                onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>1%</span>
                <span>100%</span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低折扣价</label>
              <input
                type="number"
                min="0"
                value={formData.minDiscountPrice}
                onChange={(e) => setFormData({ ...formData, minDiscountPrice: parseFloat(e.target.value) || 0 })}
                className="input w-full"
                placeholder="如：5999"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              返点/佣金比例 ({(formData.commissionRate * 100).toFixed(1)}%)
            </label>
            <input
              type="range"
              min="0.01"
              max="0.5"
              step="0.005"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1%</span>
              <span>50%</span>
            </div>
          </div>


          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ==================== 授权层级标签页 ====================

function HierarchyTab({
  modules,
  accounts,
  manufacturerId,
  profitSettings,
  manufacturerName,
  manufacturerLogo,
  commissionRate,
  commissionRules,
  onBack,
  expandedNodes,
  onSetExpandedNodes,
  onToggleNode,
  onSaveAccounts,
  activeTab,
  onSetActiveTab,
  logoSrc,
  lockedManufacturerId,
  isSuperAdmin,
  manufacturers,
  selectedManufacturerId,
  onSetSelectedManufacturerId
}: {
  modules: RoleModule[]
  accounts: AuthorizedAccount[]
  manufacturerId: string
  manufacturerName: string
  manufacturerLogo: string
  profitSettings: TierSystemData['profitSettings']
  commissionRate: number
  commissionRules: CommissionRule[]
  onBack: () => void
  expandedNodes: Set<string>
  onSetExpandedNodes: React.Dispatch<React.SetStateAction<Set<string>>>
  onToggleNode: (id: string) => void
  onSaveAccounts: (accounts: AuthorizedAccount[]) => void
  activeTab: string
  onSetActiveTab: (tab: 'hierarchy' | 'pool' | 'reconciliation') => void
  logoSrc: string
  lockedManufacturerId: string | null
  isSuperAdmin: boolean
  manufacturers: { _id: string; name?: string; fullName?: string }[]
  selectedManufacturerId: string
  onSetSelectedManufacturerId: (id: string) => void
}) {
  const [selectedModuleCode, setSelectedModuleCode] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [parentAccount, setParentAccount] = useState<AuthorizedAccount | null>(null)
  const [manufacturerCategoryTree, setManufacturerCategoryTree] = useState<any[]>([])
  const [manufacturerProducts, setManufacturerProducts] = useState<any[]>([])
  const [showProductModal, setShowProductModal] = useState(false)
  const [productAccount, setProductAccount] = useState<AuthorizedAccount | null>(null)
  
  // 层级返佣规则编辑状态
  const [editingRule, setEditingRule] = useState<CommissionRule | null>(null)
  const [showRuleEditor, setShowRuleEditor] = useState(false)
  const [localCommissionRules, setLocalCommissionRules] = useState<CommissionRule[]>(commissionRules || [])

  // 同步commissionRules prop
  useEffect(() => {
    setLocalCommissionRules(commissionRules || [])
  }, [commissionRules])

  // 保存规则
  const handleSaveRule = (rule: CommissionRule) => {
    const isNew = !localCommissionRules.find(r => r._id === rule._id)
    let newRules: CommissionRule[]
    if (isNew) {
      newRules = [...localCommissionRules, rule]
    } else {
      newRules = localCommissionRules.map(r => r._id === rule._id ? rule : r)
    }
    setLocalCommissionRules(newRules)
    // 同时保存到accounts数据
    const updatedAccounts = accounts.map(a => ({ ...a }))
    onSaveAccounts(updatedAccounts)
    setShowRuleEditor(false)
    setEditingRule(null)
  }

  // 删除规则
  const handleDeleteRule = (ruleId: string) => {
    if (!confirm('确定要删除这个规则吗？')) return
    const newRules = localCommissionRules.filter(r => r._id !== ruleId)
    setLocalCommissionRules(newRules)
  }

  // 创建新规则
  const handleCreateRule = () => {
    const newRule: CommissionRule = {
      _id: `rule_${Date.now()}`,
      name: '新规则',
      description: '',
      selfRate: 20,
      subordinateRates: [20],
      maxTotal: 40,
      createdAt: new Date().toISOString()
    }
    setEditingRule(newRule)
    setShowRuleEditor(true)
  }

  useEffect(() => {
    const loadCategoriesAndProducts = async () => {
      if (!manufacturerId) {
        setManufacturerCategoryTree([])
        setManufacturerProducts([])
        return
      }
      try {
        console.log('[TierSystem] Loading categories and products for manufacturerId:', manufacturerId)
        const [catResp, prodResp] = await Promise.all([
          apiClient.get('/categories', { params: { manufacturerId, _ts: Date.now() } }),
          apiClient.get(`/manufacturers/${manufacturerId}/products`, { params: { status: 'all', limit: 10000 } })
        ])

        const catList = catResp.data?.data || catResp.data || []
        console.log('[TierSystem] Categories loaded:', catList.length, 'items')
        setManufacturerCategoryTree(Array.isArray(catList) ? catList : [])

        const prodList = prodResp.data?.data || prodResp.data || []
        console.log('[TierSystem] Products loaded:', prodList.length, 'items')
        setManufacturerProducts(Array.isArray(prodList) ? prodList : [])
      } catch (e) {
        console.error('[TierSystem] 加载厂家分类/商品失败:', e)
        setManufacturerCategoryTree([])
        setManufacturerProducts([])
      }
    }
    loadCategoriesAndProducts()
  }, [manufacturerId])

  // 按角色模块筛选账号
  const filteredAccounts = useMemo(() => {
    if (selectedModuleCode === 'all') return accounts
    return accounts.filter(a => {
      const module = modules.find(m => m._id === a.roleModuleId)
      return module?.code === selectedModuleCode
    })
  }, [accounts, selectedModuleCode, modules])

  // 构建树形结构
  const rootAccounts = useMemo(() => {
    return filteredAccounts.filter(a => !a.parentId)
  }, [filteredAccounts])

  // 获取子节点
  const getChildren = (parentId: string) => {
    return filteredAccounts.filter(a => a.parentId === parentId)
  }

  const siblingsOf = (account: AuthorizedAccount) => {
    return filteredAccounts.filter(a => String(a.parentId || '') === String(account.parentId || '') && String(a._id) !== String(account._id))
  }

  const getMinDiscountPctFromAccount = (account: AuthorizedAccount | null, module: RoleModule | null) => {
    if (!account || !module) return 60
    const rules = module.discountRules || []
    const r = account.discountRuleId ? rules.find(x => String(x._id) === String(account.discountRuleId)) : null
    const chosen = r || rules.find(x => x.isDefault) || rules[0]
    const rate = typeof chosen?.discountRate === 'number' && Number.isFinite(chosen.discountRate) ? chosen.discountRate : 1
    return Math.round(Math.max(0, Math.min(1, rate)) * 100)
  }

  const getMaxCommissionPctFromAccount = (account: AuthorizedAccount | null) => {
    if (!account) return 40
    const v = Number((account as any).distributionRate ?? 0)
    return Number.isFinite(v) ? Math.max(0, Math.min(100, Math.floor(v))) : 0
  }

  // 添加账号
  const handleAddAccounts = (items: Array<{
    accountId: string
    username: string
    nickname: string
    phone: string
    roleModuleId: string
  }>) => {
    if (!manufacturerId) {
      toast.error('请先选择厂家')
      return
    }

    if (!Array.isArray(items) || items.length === 0) {
      toast.error('请选择要绑定的账号')
      return
    }

    const duplicated = items.find(it => accounts.some(a => String(a.userId) === String(it.accountId)))
    if (duplicated) {
      toast.error('存在已绑定账号，请取消勾选后再提交')
      return
    }

    const parentModule = parentAccount
      ? (modules.find(m => String(m._id) === String(parentAccount.roleModuleId)) || null)
      : null
    const parentMinDiscountPct = parentAccount ? getMinDiscountPctFromAccount(parentAccount, parentModule) : 60
    const parentMinRate = Math.max(0, Math.min(1, parentMinDiscountPct / 100))

    const pickDefaultRuleId = (m: RoleModule | undefined | null) => {
      const rules = Array.isArray(m?.discountRules) ? m!.discountRules : []
      const candidates = rules.filter((r) => {
        const v = typeof r.discountRate === 'number' && Number.isFinite(r.discountRate) ? r.discountRate : 1
        return v >= parentMinRate
      })
      const chosen = candidates.find(r => r.isDefault) || candidates[0] || null
      return chosen?._id ? String(chosen._id) : ''
    }

    const invalidRole = items.find((it) => {
      const roleModuleId = String(it.roleModuleId || '')
      return !modules.some((m) => m?.isActive && String(m._id) === roleModuleId)
    })
    if (invalidRole) {
      toast.error('请选择有效角色')
      return
    }

    const now = Date.now()
    const created = items.map((it, idx) => {
      const roleModuleId = String(it.roleModuleId || '')
      const module = modules.find(m => String(m._id) === roleModuleId && m.isActive)
      if (!module) return null
      const ruleId = pickDefaultRuleId(module)
      if (!ruleId) {
        toast.error(`角色「${module.name}」缺少满足上级最低折扣 ${parentMinDiscountPct}% 的规则`)
        return null
      }
      const newAccount: AuthorizedAccount = {
        _id: `account_${now}_${idx}`,
        userId: String(it.accountId),
        username: String(it.username || ''),
        nickname: String(it.nickname || it.username || ''),
        phone: String(it.phone || ''),
        roleModuleId: roleModuleId,
        roleModuleName: module.name,
        discountRuleId: ruleId,
        parentId: parentAccount?._id || null,
        parentName: parentAccount?.username,
        level: parentAccount ? parentAccount.level + 1 : 1,
        allocatedRate: 0,
        availableRate: 0,
        distributionRate: 0,
        visibleCategoryIds: parentAccount?.visibleCategoryIds ? parentAccount.visibleCategoryIds.map(String) : [],
        children: [],
        status: 'active',
        createdAt: new Date().toISOString()
      }
      return newAccount
    })

    if (created.some((x) => !x)) {
      return
    }

    onSaveAccounts([...accounts, ...(created as AuthorizedAccount[])])
    setShowAddModal(false)
    setParentAccount(null)
    toast.success('绑定成功')
  }

  const listPrice = 10000
  const minSaleDiscountRate = Number(profitSettings?.minSaleDiscountRate ?? 1)

  const calc = (dist: number) => {
    const minPrice = listPrice * minSaleDiscountRate
    const maxCommPool = minPrice * (Number(commissionRate || 0) / 100)
    const nodeCommValue = maxCommPool * (Number(dist || 0) / 100)
    return { minPrice, nodeCommValue }
  }
  const getEffectiveVisibleProductIds = (acc: AuthorizedAccount | null): string[] | null => {
    if (!acc) return null
    const visited = new Set<string>()
    let cur: AuthorizedAccount | null = acc
    while (cur && !visited.has(String(cur._id))) {
      visited.add(String(cur._id))
      if (Array.isArray(cur.visibleProductIds)) {
        return cur.visibleProductIds.map(String).filter(Boolean)
      }
      const pid = cur.parentId ? String(cur.parentId) : ''
      if (!pid) break
      cur = (accounts || []).find((x) => String(x._id) === pid) || null
    }
    return null
  }

  const getInheritedVisibleProductIds = (acc: AuthorizedAccount | null): string[] | null => {
    if (!acc) return null
    const pid = acc.parentId ? String(acc.parentId) : ''
    if (!pid) return null
    const parent = (accounts || []).find((x) => String(x._id) === pid) || null
    return getEffectiveVisibleProductIds(parent)
  }

  const getNodeProductCount = (a: AuthorizedAccount) => {
    const effective = getEffectiveVisibleProductIds(a)
    if (effective !== null) return effective.length

    const categoryIds = Array.isArray(a.visibleCategoryIds) ? a.visibleCategoryIds : []
    if (categoryIds.length > 0) {
      const set = new Set(categoryIds.map(String))
      const total = (manufacturerProducts || []).filter((p: any) => {
        const cid = String(p?.category?._id || p?.category?.id || p?.category || '')
        return cid && set.has(cid)
      }).length
      return total
    }

    return manufacturerProducts.length
  }

  // 移除重复的声明，使用上面已定义的 filteredAccounts 和 handleAddAccounts

  // duijie/nn风格的分层架构数据 - 使用真实账号数据
  const hierarchyData = useMemo(() => {
    // 总部节点
    const headquarters = {
      id: 'headquarters',
      name: `${manufacturerName}旗舰总部`,
      phone: '400-888-8888',
      role: '总控节点',
      distribution: 40,
      minDiscount: 60,
      avatar: manufacturerLogo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    }

    // 人员节点 - 使用真实filteredAccounts数据
    const staffNodes = filteredAccounts.map((account, index) => {
      const module = modules.find(m => String(m._id) === String(account.roleModuleId))
      const ruleFromAccount = (module?.discountRules || []).find(r => String(r._id) === String(account.discountRuleId))
      const defaultRule = ruleFromAccount || module?.discountRules?.find(r => r.isDefault) || module?.discountRules?.[0]
      const discountRate = typeof defaultRule?.discountRate === 'number' ? defaultRule.discountRate : 1
      
      return {
        id: String(account._id),
        name: account.nickname || account.username || `用户${index + 1}`,
        avatar: (account as any)?.avatar || (account as any)?.user?.avatar || `https://images.unsplash.com/photo-${1494790108755 + index}?w=150&h=150&fit=crop&crop=face`,
        role: module?.name || '未分配角色',
        distribution: Number(account.distributionRate || 0),
        minDiscount: Math.round(Math.max(0, Math.min(1, discountRate)) * 100),
        status: account.status === 'active' ? '正常在岗' : '暂停',
        phone: account.phone || '',
        level: account.level || 1,
        allocatedRate: Number(account.allocatedRate || 0),
        availableRate: Number(account.availableRate || 0),
        visibleCategoryIds: account.visibleCategoryIds || [],
        parentId: account.parentId,
        commissionRuleId: account.commissionRuleId,
        boundUserDiscount: account.boundUserDiscount,
        boundUserCommission: account.boundUserCommission,
        defaultCommission: Math.round(Math.max(0, Math.min(1, Number(defaultRule?.commissionRate ?? 0))) * 100),
        account: account // 保存完整的account对象用于操作
      }
    })

    return { headquarters, staffNodes }
  }, [filteredAccounts, manufacturerName, manufacturerLogo, modules])

  const getAccountMinDiscountPct = (account: AuthorizedAccount | null): number => {
    if (!account) return Number(hierarchyData.headquarters.minDiscount || 0)
    const module = modules.find(m => String(m._id) === String(account.roleModuleId))
    const rules = module?.discountRules || []
    const r = account.discountRuleId ? rules.find(x => String(x._id) === String(account.discountRuleId)) : null
    const chosen = r || rules.find(x => x.isDefault) || rules[0]
    const rate = typeof chosen?.discountRate === 'number' && Number.isFinite(chosen.discountRate) ? chosen.discountRate : 1
    return Math.round(Math.max(0, Math.min(1, rate)) * 100)
  }

  const getAccountMaxCommissionPct = (account: AuthorizedAccount | null): number => {
    if (!account) return Number(hierarchyData.headquarters.distribution || 0)
    const v = Number((account as any).distributionRate ?? 0)
    return Number.isFinite(v) ? Math.max(0, Math.min(100, Math.floor(v))) : 0
  }

  const getParentConstraints = (accountId: string) => {
    const acc = accounts.find(a => String(a._id) === String(accountId)) || null
    const parent = acc?.parentId ? (accounts.find(a => String(a._id) === String(acc.parentId)) || null) : null
    const parentMinDiscount = getAccountMinDiscountPct(parent)
    const parentMaxCommission = getAccountMaxCommissionPct(parent)
    return { parentMinDiscount, parentMaxCommission }
  }

  const getParentKeyForAccount = useCallback((a: AuthorizedAccount | null) => {
    if (!a) return 'headquarters'
    return a.parentId ? String(a.parentId) : 'headquarters'
  }, [])

  const accountsCommissionKey = useMemo(() => {
    return (accounts || [])
      .map(a => `${String(a._id)}:${String(a.parentId || '')}:${String((a as any).distributionRate ?? '')}`)
      .join('|')
  }, [accounts])

  const headquartersCommissionCapPct = useMemo(() => {
    const v = Number(commissionRate ?? 40)
    return Number.isFinite(v) ? Math.max(0, Math.min(100, Math.floor(v))) : 40
  }, [commissionRate])

  const getParentMaxCommissionPct = useCallback((parentKey: string) => {
    if (parentKey === 'headquarters') return headquartersCommissionCapPct
    const p = (accounts || []).find((x) => String(x._id) === String(parentKey)) || null
    const v = Number((p as any)?.distributionRate ?? 0)
    return Number.isFinite(v) ? Math.max(0, Math.min(100, Math.floor(v))) : 0
  }, [accounts, headquartersCommissionCapPct])

  const getChildrenSumCommissionPct = useCallback((parentKey: string, excludeId?: string) => {
    return (accounts || [])
      .filter((x) => getParentKeyForAccount(x) === String(parentKey) && (!excludeId || String(x._id) !== String(excludeId)))
      .reduce((s, x) => s + Math.max(0, Math.min(100, Math.floor(Number((x as any).distributionRate ?? 0) || 0))), 0)
  }, [accounts, getParentKeyForAccount])

  const getParentChainCommissionUsed = useCallback((accountId: string) => {
    let sum = 0
    let cur = (accounts || []).find((x) => String(x._id) === String(accountId)) || null
    
    // 从当前节点开始，向上遍历所有父节点，累加它们的返佣
    while (cur && cur.parentId) {
      const parentId = String(cur.parentId)
      const parent = (accounts || []).find((x) => String(x._id) === parentId) || null
      if (parent) {
        const commission = Math.max(0, Math.min(100, Math.floor(Number((parent as any).distributionRate ?? 0) || 0)))
        sum += commission
        cur = parent
      } else {
        break
      }
    }
    
    return sum
  }, [accounts])

  const getMaxVerticalCommissionPctForAccount = useCallback((accountId: string) => {
    const cur = (accounts || []).find((x) => String(x._id) === String(accountId)) || null
    if (!cur) return 0
    
    // 如果是顶级节点，直接从总部预算分配
    if (!cur.parentId) return headquartersCommissionCapPct
    
    // 找到父节点
    const parent = (accounts || []).find((x) => String(x._id) === String(cur.parentId)) || null
    if (!parent) return headquartersCommissionCapPct
    
    // 计算父节点的最大预算
    const parentMaxBudget = getMaxVerticalCommissionPctForAccount(String(parent._id))
    
    // 父节点自己用了多少
    const parentUsed = Math.max(0, Math.min(100, Math.floor(Number((parent as any).distributionRate ?? 0) || 0)))
    
    // 父节点剩余预算就是当前节点的最大可用预算
    return Math.max(0, parentMaxBudget - parentUsed)
  }, [accounts, headquartersCommissionCapPct])

  useEffect(() => {
    if (!accounts || accounts.length === 0) return

    const idxById = new Map<string, number>()
    accounts.forEach((a, i) => idxById.set(String(a._id), i))

    const groups = new Map<string, string[]>()
    ;(accounts || []).forEach((a) => {
      const key = getParentKeyForAccount(a)
      const arr = groups.get(key) || []
      arr.push(String(a._id))
      groups.set(key, arr)
    })

    let changed = false
    const next = accounts.slice().map((a) => ({ ...a }))

    groups.forEach((childIds, parentKey) => {
      const limit = Math.max(0, Math.min(100, Math.floor(getParentMaxCommissionPct(parentKey))))
      const items = childIds
        .map((id) => {
          const idx = idxById.get(String(id))
          const a = typeof idx === 'number' ? accounts[idx] : null
          const cur = a ? Math.max(0, Math.min(100, Math.floor(Number((a as any).distributionRate ?? 0) || 0))) : 0
          return { id: String(id), idx: typeof idx === 'number' ? idx : -1, cur }
        })
        .filter((x) => x.idx >= 0)

      const sum = items.reduce((s, x) => s + x.cur, 0)
      if (sum <= limit) return
      if (sum <= 0) {
        items.forEach((x) => {
          if (next[x.idx].distributionRate !== 0) {
            changed = true
            next[x.idx].distributionRate = 0
          }
        })
        return
      }
    })

    if (changed) onSaveAccounts(next)
  }, [accountsCommissionKey, headquartersCommissionCapPct, getParentChainCommissionUsed, getMaxVerticalCommissionPctForAccount])

  const [viewMode, setViewMode] = useState<'list' | 'map'>('map')
  const [zoomScale, setZoomScale] = useState(1)
  const enableNodeDrag = false

  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)

  const [nodeSearch, setNodeSearch] = useState('')

  const [showProfileEditModal, setShowProfileEditModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)

  // 地图：平移/缩放/拖拽
  const canvasViewportRef = useRef<HTMLDivElement | null>(null)
  const [canvasSize, setCanvasSize] = useState({ w: 1, h: 1 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({})
  const [nodeDraft, setNodeDraft] = useState<Record<string, { minDiscount: number; distribution: number }>>({})

  const panStateRef = useRef<{ active: boolean; pointerId: number | null; startClientX: number; startClientY: number; originX: number; originY: number }>({
    active: false,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    originX: 0,
    originY: 0,
  })

  const dragStateRef = useRef<{ active: boolean; pointerId: number | null; nodeId: string | null; startClientX: number; startClientY: number; originX: number; originY: number }>({
    active: false,
    pointerId: null,
    nodeId: null,
    startClientX: 0,
    startClientY: 0,
    originX: 0,
    originY: 0,
  })

  useEffect(() => {
    if (viewMode !== 'map') return
    const el = canvasViewportRef.current
    if (!el) return

    const update = () => {
      const rect = el.getBoundingClientRect()
      setCanvasSize({ w: Math.max(1, Math.floor(rect.width)), h: Math.max(1, Math.floor(rect.height)) })
    }

    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(el)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      ro.disconnect()
    }
  }, [viewMode])

  const hierarchyGraph = useMemo(() => {
    const nodes: Array<{ id: string; type: 'hq' | 'account'; parentId: string | null; data: any }> = []
    const edges: Array<{ from: string; to: string }> = []

    nodes.push({ id: 'headquarters', type: 'hq', parentId: null, data: hierarchyData.headquarters })

    filteredAccounts.forEach(a => {
      const id = String(a._id)
      const pid = a.parentId ? String(a.parentId) : 'headquarters'
      nodes.push({ id, type: 'account', parentId: pid, data: a })
      edges.push({ from: pid, to: id })
    })

    // children map
    const childrenById = new Map<string, string[]>()
    nodes.forEach(n => childrenById.set(n.id, []))
    edges.forEach(e => {
      const arr = childrenById.get(e.from) || []
      arr.push(e.to)
      childrenById.set(e.from, arr)
    })

    // bfs depths
    const depthById = new Map<string, number>()
    depthById.set('headquarters', 0)
    const q: string[] = ['headquarters']
    while (q.length) {
      const cur = q.shift()!
      const d = depthById.get(cur) || 0
      const kids = childrenById.get(cur) || []
      kids.forEach(k => {
        if (depthById.has(k)) return
        depthById.set(k, d + 1)
        q.push(k)
      })
    }

    return { nodes, edges, childrenById, depthById }
  }, [filteredAccounts, hierarchyData.headquarters])

  const parentIdById = useMemo(() => {
    const map = new Map<string, string | null>()
    hierarchyGraph.nodes.forEach((n) => {
      map.set(String(n.id), n.parentId ? String(n.parentId) : null)
    })
    return map
  }, [hierarchyGraph.nodes])

  const subtreeCountById = useMemo(() => {
    const memo = new Map<string, number>()
    const dfs = (id: string): number => {
      const key = String(id)
      if (memo.has(key)) return memo.get(key) || 0
      const kids = hierarchyGraph.childrenById.get(key) || []
      let sum = 0
      kids.forEach((k) => {
        sum += 1
        sum += dfs(String(k))
      })
      memo.set(key, sum)
      return sum
    }

    hierarchyGraph.nodes.forEach((n) => dfs(String(n.id)))
    return memo
  }, [hierarchyGraph])

  const visibleNodeIdSet = useMemo(() => {
    const set = new Set<string>()
    const stack: string[] = ['headquarters']
    const visited = new Set<string>()
    while (stack.length) {
      const id = String(stack.pop() || '')
      if (!id) continue
      if (visited.has(id)) continue
      visited.add(id)
      set.add(id)

      const isExpanded = expandedNodes?.has(id)
      if (!isExpanded) continue
      const kids = hierarchyGraph.childrenById.get(id) || []
      kids.forEach((k) => stack.push(String(k)))
    }
    return set
  }, [hierarchyGraph, expandedNodes])

  const visibleStaffNodes = useMemo(() => {
    return hierarchyData.staffNodes.filter((s) => visibleNodeIdSet.has(String(s.id)))
  }, [hierarchyData.staffNodes, visibleNodeIdSet])

  const hasChildren = (nodeId: string) => {
    const kids = hierarchyGraph.childrenById.get(String(nodeId)) || []
    return kids.length > 0
  }

  const getSubtreeCount = (nodeId: string) => subtreeCountById.get(String(nodeId)) || 0

  const staffIdsKey = useMemo(() => hierarchyData.staffNodes.map(s => String(s.id)).join('|'), [hierarchyData.staffNodes])

  useEffect(() => {
    if (viewMode !== 'map') return

    setNodePositions(() => {
      const next: Record<string, { x: number; y: number }> = {}

      const nodeById = new Map(hierarchyGraph.nodes.map(n => [String(n.id), n]))
      const childrenById = hierarchyGraph.childrenById
      const layoutMeta = new Map<string, { ux: number; depth: number }>()
      const visited = new Set<string>()
      let nextLeafX = 0

      const sortKeyForId = (id: string) => {
        if (id === 'headquarters') return '0'
        const node = nodeById.get(String(id))
        const data = (node as any)?.data || {}
        const name = String(data?.nickname || data?.username || data?.name || '')
        const level = Number(data?.level || 0)
        return `${String(level).padStart(4, '0')}-${name}-${String(id)}`
      }

      const dfs = (id: string, depth: number): number => {
        visited.add(String(id))
        const kids = (childrenById.get(String(id)) || []).slice().sort((a, b) => sortKeyForId(a).localeCompare(sortKeyForId(b)))

        if (kids.length === 0) {
          const x = nextLeafX
          nextLeafX += 1
          layoutMeta.set(String(id), { ux: x, depth })
          return x
        }

        const childXs = kids.map((k) => dfs(String(k), depth + 1))
        const x = (childXs[0] + childXs[childXs.length - 1]) / 2
        layoutMeta.set(String(id), { ux: x, depth })
        return x
      }

      dfs('headquarters', 0)

      // 兜底：如果存在孤儿节点（parentId丢失），也要摆出来
      hierarchyGraph.nodes.forEach(n => {
        const id = String(n.id)
        if (visited.has(id)) return
        const x = nextLeafX
        nextLeafX += 1
        layoutMeta.set(id, { ux: x, depth: 1 })
      })

      const gapX = 320
      const gapY = 300
      const xs = Array.from(layoutMeta.values()).map(v => v.ux)
      const minX = xs.length ? Math.min(...xs) : 0
      const maxX = xs.length ? Math.max(...xs) : 0
      const centerX = (minX + maxX) / 2

      layoutMeta.forEach((v, id) => {
        next[id] = {
          x: (v.ux - centerX) * gapX,
          y: -260 + v.depth * gapY,
        }
      })

      // 强制总部在顶部中心
      next['headquarters'] = { x: 0, y: -260 }
      return next
    })

    setNodeDraft(prev => {
      const next = { ...prev }
      hierarchyData.staffNodes.forEach((s) => {
        const id = String(s.id)
        if (next[id]) return
        next[id] = { minDiscount: Number(s.minDiscount || 0), distribution: Number(s.distribution || 0) }
      })
      return next
    })
  }, [viewMode, staffIdsKey])

  const getNodeSize = (nodeId: string) => {
    return nodeId === 'headquarters' ? { w: 280, h: 200 } : { w: 240, h: 160 }
  }

  const fitToView = (opts?: { minZoom?: number; maxZoom?: number }, idsOverride?: string[]) => {
    const ids = Array.isArray(idsOverride) && idsOverride.length > 0 ? idsOverride : Object.keys(nodePositions || {})
    if (ids.length === 0) return
    const margin = 160
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    ids.forEach((id) => {
      const pos = nodePositions[id]
      if (!pos) return
      const sz = getNodeSize(String(id))
      const bx = canvasSize.w / 2 + pos.x
      const by = canvasSize.h / 2 + pos.y
      minX = Math.min(minX, bx - sz.w / 2)
      maxX = Math.max(maxX, bx + sz.w / 2)
      minY = Math.min(minY, by - sz.h / 2)
      maxY = Math.max(maxY, by + sz.h / 2)
    })

    if (!Number.isFinite(minX) || !Number.isFinite(maxX) || !Number.isFinite(minY) || !Number.isFinite(maxY)) return

    const w = Math.max(1, maxX - minX)
    const h = Math.max(1, maxY - minY)
    const availableW = Math.max(1, canvasSize.w - margin * 2)
    const availableH = Math.max(1, canvasSize.h - margin * 2)
    const target = Math.min(availableW / w, availableH / h)
    const minZoom = typeof opts?.minZoom === 'number' ? opts!.minZoom! : 0.3
    const maxZoom = typeof opts?.maxZoom === 'number' ? opts!.maxZoom! : 2
    const nextZoom = Math.max(minZoom, Math.min(maxZoom, target))
    const cx = (minX + maxX) / 2
    const cy = (minY + maxY) / 2

    setZoomScale(nextZoom)
    setPan({ x: canvasSize.w / 2 - cx * nextZoom, y: canvasSize.h / 2 - cy * nextZoom })
  }

  const focusNode = (nodeId: string) => {
    const pos = nodePositions[String(nodeId)]
    if (!pos) return
    const bx = canvasSize.w / 2 + pos.x
    const by = canvasSize.h / 2 + pos.y
    setPan({ x: canvasSize.w / 2 - bx * zoomScale, y: canvasSize.h / 2 - by * zoomScale })
  }

  const expandPathTo = (nodeId: string) => {
    onSetExpandedNodes((prev) => {
      const next = new Set(prev)
      next.add('headquarters')
      let cur = String(nodeId)
      while (cur && cur !== 'headquarters') {
        const pid = parentIdById.get(cur)
        if (!pid) break
        next.add(String(pid))
        cur = String(pid)
      }
      return next
    })
  }

  const didAutoFitRef = useRef<string>('')

  const commitNodeDraft = (nodeId: string) => {
    const draft = nodeDraft[String(nodeId)]
    if (!draft) return

    const { parentMinDiscount } = getParentConstraints(String(nodeId))
    const maxVerticalCommissionPct = getMaxVerticalCommissionPctForAccount(String(nodeId))

    const rawDiscountPct = Math.max(0, Math.min(100, Math.floor(Number(draft.minDiscount) || 0)))
    const rawDist = Math.max(0, Math.min(100, Math.floor(Number(draft.distribution) || 0)))
    const targetDiscountPct = Math.max(parentMinDiscount, rawDiscountPct)
    const targetDist = Math.min(maxVerticalCommissionPct, rawDist)
    const targetDiscountRate = targetDiscountPct / 100

    const current = accounts.find(a => String(a._id) === String(nodeId))
    if (!current) return

    const module = modules.find(m => String(m._id) === String(current.roleModuleId))
    const rules = module?.discountRules || []
    if (rules.length === 0) {
      toast.error('当前角色未配置折扣规则，无法设置最低折扣')
      return
    }

    const parentMinRate = parentMinDiscount / 100
    const allowedRules = rules.filter(r => {
      const v = typeof r.discountRate === 'number' && Number.isFinite(r.discountRate) ? r.discountRate : 1
      return v >= parentMinRate
    })
    const pickFrom = allowedRules.length > 0 ? allowedRules : rules
    const selectedRule = pickFrom
      .slice()
      .sort((a, b) => {
        const da = Math.abs((typeof a.discountRate === 'number' ? a.discountRate : 1) - targetDiscountRate)
        const db = Math.abs((typeof b.discountRate === 'number' ? b.discountRate : 1) - targetDiscountRate)
        return da - db
      })[0]

    const nextAccounts = accounts.map(a => {
      if (String(a._id) !== String(nodeId)) return a
      return {
        ...a,
        discountRuleId: selectedRule?._id ? String(selectedRule._id) : a.discountRuleId,
        distributionRate: targetDist,
      }
    })

    onSaveAccounts(nextAccounts)
  }

  const handleAvatarClick = (staff: any) => {
    setSelectedStaff(staff)
    setShowProfileEditModal(true)
  }

  const shouldIgnoreDragStart = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    const tag = target.tagName.toLowerCase()
    if (['input', 'textarea', 'select', 'button'].includes(tag)) return true
    if (target.closest('input,textarea,select,button')) return true
    return false
  }

  const onNodeClick = (nodeId: string) => (e: any) => {
    if (shouldIgnoreDragStart(e.target)) return
    setFocusedNodeId(String(nodeId))
    focusNode(String(nodeId))
  }

  const onToggleExpandClick = (nodeId: string) => (e: any) => {
    e.stopPropagation()
    onToggleNode(String(nodeId))
  }

  const searchMatches = useMemo(() => {
    const q = nodeSearch.trim().toLowerCase()
    if (!q) return [] as Array<{ id: string; label: string; extra?: string }>
    const items: Array<{ id: string; label: string; extra?: string }> = []
    items.push({ id: 'headquarters', label: hierarchyData.headquarters?.name || '总部' })
    hierarchyData.staffNodes.forEach((s) => {
      const n = String(s.name || s.id || '').toLowerCase()
      const e = String(s.account?.email || s.email || '').toLowerCase()
      const p = String(s.phone || '').toLowerCase()
      const r = modules.find(m => String(m._id) === String(s.account?.roleModuleId))?.name || ''
      if (n.includes(q) || e.includes(q) || p.includes(q) || r.toLowerCase().includes(q)) {
        items.push({
          id: String(s.id),
          label: String(s.name || s.id || ''),
          extra: [s.account?.email || s.email, s.phone, r].filter(Boolean).join(' · ')
        })
      }
    })
    return items.slice(0, 8)
  }, [nodeSearch, hierarchyData.headquarters, hierarchyData.staffNodes, modules])

  const visibleNodeCount = visibleNodeIdSet.size
  const totalNodeCount = hierarchyGraph.nodes.length
  const totalStaffNodeCount = hierarchyData.staffNodes.length

  const MAX_VISIBLE_STAFF_NODES = 180
  const tooManyVisible = visibleStaffNodes.length > MAX_VISIBLE_STAFF_NODES
  const visibleStaffNodesForRender = tooManyVisible ? visibleStaffNodes.slice(0, MAX_VISIBLE_STAFF_NODES) : visibleStaffNodes

  const visibleRenderKey = useMemo(
    () => visibleStaffNodesForRender.map((s) => String(s.id)).join('|'),
    [visibleStaffNodesForRender]
  )

  useEffect(() => {
    if (viewMode !== 'map') return
    const key = `${visibleRenderKey}|${canvasSize.w}x${canvasSize.h}`
    if (didAutoFitRef.current === key) return
    if (!canvasSize.w || !canvasSize.h) return
    if (Object.keys(nodePositions || {}).length === 0) return
    didAutoFitRef.current = key
    fitToView({ maxZoom: 1.2 })
  }, [viewMode, visibleRenderKey, canvasSize.w, canvasSize.h, Object.keys(nodePositions || {}).length])

  const focusedNodeName = useMemo(() => {
    if (!focusedNodeId) return ''
    if (focusedNodeId === 'headquarters') return String(hierarchyData.headquarters?.name || '总部')
    const hit = hierarchyData.staffNodes.find((s) => String(s.id) === String(focusedNodeId))
    return String(hit?.name || focusedNodeId)
  }, [focusedNodeId, hierarchyData.headquarters, hierarchyData.staffNodes])

  const expandToDepth = (depth: number) => {
    onSetExpandedNodes(() => {
      const next = new Set<string>(['__root__'])
      if (depth <= 0) return next
      next.add('headquarters')

      if (depth <= 1) return next

      const level1 = hierarchyGraph.childrenById.get('headquarters') || []
      level1.forEach((id) => next.add(String(id)))
      if (depth <= 2) return next

      // depth >= 3: expand all (谨慎)
      hierarchyGraph.nodes.forEach((n) => next.add(String(n.id)))
      return next
    })
  }

  // 中键按下拖动画布
  const onCanvasPointerDown = (e: any) => {
    if (viewMode !== 'map') return
    if (e.button !== 1) return
    e.preventDefault()
    const st = panStateRef.current
    st.active = true
    st.pointerId = e.pointerId
    st.startClientX = e.clientX
    st.startClientY = e.clientY
    st.originX = pan.x
    st.originY = pan.y
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onCanvasPointerMove = (e: any) => {
    const st = panStateRef.current
    if (!st.active || st.pointerId !== e.pointerId) return
    const dx = e.clientX - st.startClientX
    const dy = e.clientY - st.startClientY
    const newY = st.originY + dy
    // 限制向上滚动
    const maxPanY = canvasSize.h * 0.3
    const constrainedY = Math.min(newY, maxPanY)
    setPan({ x: st.originX + dx, y: constrainedY })
  }

  const onCanvasPointerUp = (e: any) => {
    const st = panStateRef.current
    if (st.pointerId !== e.pointerId) return
    st.active = false
    st.pointerId = null
  }

  const onCanvasWheel = (e: any) => {
    if (viewMode !== 'map') return
    e.preventDefault()
    const sensitivity = 0.8
    const newX = pan.x - Number(e.deltaX || 0) * sensitivity
    const newY = pan.y - Number(e.deltaY || 0) * sensitivity
    
    // 限制向上滚动：顶层节点不能滚出视口顶部太多
    // 顶层节点在画布中心，所以限制 pan.y 最大值
    const maxPanY = canvasSize.h * 0.3 // 最多让顶层节点距离顶部30%的位置
    const constrainedY = Math.min(newY, maxPanY)
    
    setPan({ x: newX, y: constrainedY })
  }

  // 节点拖拽
  const onNodePointerDown = (nodeId: string) => (e: any) => {
    if (viewMode !== 'map') return
    if (!enableNodeDrag) return
    if (e.button !== 0) return
    if (shouldIgnoreDragStart(e.target)) return
    e.preventDefault()
    const pos = nodePositions[String(nodeId)] || { x: 0, y: 0 }
    const st = dragStateRef.current
    st.active = true
    st.pointerId = e.pointerId
    st.nodeId = String(nodeId)
    st.startClientX = e.clientX
    st.startClientY = e.clientY
    st.originX = pos.x
    st.originY = pos.y
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onNodePointerMove = (e: any) => {
    if (!enableNodeDrag) return
    const st = dragStateRef.current
    if (!st.active || st.pointerId !== e.pointerId || !st.nodeId) return
    const dx = (e.clientX - st.startClientX) / Math.max(0.01, zoomScale)
    const dy = (e.clientY - st.startClientY) / Math.max(0.01, zoomScale)
    const nodeId = st.nodeId
    setNodePositions(prev => ({
      ...prev,
      [nodeId]: { x: st.originX + dx, y: st.originY + dy }
    }))
  }

  const onNodePointerUp = (e: any) => {
    if (!enableNodeDrag) return
    const st = dragStateRef.current
    if (st.pointerId !== e.pointerId) return
    st.active = false
    st.pointerId = null
    st.nodeId = null
  }

  return (
    <div className="w-full h-[calc(100vh-320px)] min-h-[640px] flex flex-col bg-[#fcfdfd] overflow-hidden">
      {/* duijie/nn风格的header */}
      <header className="hidden p-8 border-b bg-white flex items-center justify-between shrink-0 shadow-sm z-[60]">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-white rounded-2xl border shadow-sm p-2 flex items-center justify-center overflow-hidden">
            {manufacturerLogo ? (
              <img src={manufacturerLogo} alt={manufacturerName || 'manufacturer'} className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-xs font-bold">
                LOGO
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">分层架构管控系统</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">{manufacturerName} • 全域部署</p>
          </div>
        </div>
        <nav className="flex gap-8">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
              viewMode === 'list' ? 'bg-[#153e35] text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            公司分层
          </button>
        </nav>
        <button
          onClick={onBack}
          className="rounded-2xl px-10 py-4 font-black uppercase text-xs border-2 border-gray-100 text-gray-500 hover:text-[#153e35] hover:border-[#153e35] transition-all"
        >
          返回主控
        </button>
      </header>

      <div 
        data-canvas="true"
        className={`flex-grow bg-gray-50/50 relative ${viewMode === 'list' ? 'overflow-auto' : 'overflow-hidden'}`}
        onPointerDown={onCanvasPointerDown}
        onPointerMove={onCanvasPointerMove}
        onPointerUp={onCanvasPointerUp}
        onPointerCancel={onCanvasPointerUp}
        onWheel={onCanvasWheel}
      >
        {viewMode === 'list' && (
          /* duijie/nn的列表视图 - 简单卡片 */
          <div className="p-20 max-w-5xl mx-auto space-y-10">
            <div className="bg-white p-12 rounded-[4rem] border border-gray-100 flex items-center justify-between shadow-2xl hover:shadow-3xl transition-all group">
              <div className="flex items-center gap-10">
                <div className="w-24 h-24 rounded-[2.5rem] bg-gray-50 flex items-center justify-center border text-3xl font-black text-gray-300 group-hover:bg-emerald-50 group-hover:text-emerald-500 transition-all">
                  {hierarchyData.headquarters.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-3xl font-black text-gray-900 mb-2">{hierarchyData.headquarters.name}</h4>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    下属业务节点: {hierarchyData.staffNodes.length} 个 • 默认分润比例 {hierarchyData.headquarters.distribution}%
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewMode('map')}
                className="rounded-[2rem] px-14 py-6 bg-[#153e35] font-black uppercase text-sm tracking-widest shadow-2xl text-white hover:bg-emerald-900 transition-colors"
              >
                部署架构地图
              </button>
            </div>
          </div>
        )}

        {viewMode === 'map' && (
          /* duijie/nn的架构地图视图 */
          <div ref={canvasViewportRef} className="relative w-full h-full overflow-hidden bg-gray-50/50">
            {/* 统一工具栏 - 融合页头和地图控制 */}
            <div
              className="absolute top-0 left-0 right-0 z-[90] bg-white border-b border-gray-200 shadow-sm"
              onWheel={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                {/* 左侧：Logo + 标题 + 厂家 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg border bg-white overflow-hidden flex items-center justify-center shrink-0">
                    {logoSrc ? (
                      <img src={logoSrc} alt={manufacturerName || 'manufacturer'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-50" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-sm font-black text-gray-900 truncate">分层架构管控</h1>
                    {!lockedManufacturerId ? (
                      <select
                        value={selectedManufacturerId}
                        onChange={(e) => onSetSelectedManufacturerId(e.target.value)}
                        className="px-1.5 py-0.5 rounded bg-gray-50 border border-gray-100 text-[10px] font-bold text-gray-600 max-w-[100px]"
                        disabled={!isSuperAdmin}
                      >
                        <option value="">厂家</option>
                        {manufacturers.map(m => (
                          <option key={m._id} value={m._id}>{m.name || m.fullName || m._id}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-[10px] text-gray-400 font-bold truncate max-w-[100px]">{manufacturerName}</p>
                    )}
                  </div>

                  {/* 分隔线 */}
                  <div className="w-px h-6 bg-gray-200 mx-1"></div>

                  {/* 模式切换 */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => onSetActiveTab('hierarchy')} className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${activeTab === 'hierarchy' ? 'bg-[#153e35] text-white' : 'text-gray-600 hover:bg-white'}`}>
                      <GitBranch className="w-3 h-3 inline mr-0.5" />分层
                    </button>
                    <button onClick={() => onSetActiveTab('pool')} className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${activeTab === 'pool' ? 'bg-[#153e35] text-white' : 'text-gray-600 hover:bg-white'}`}>
                      <BarChart3 className="w-3 h-3 inline mr-0.5" />角色
                    </button>
                    <button onClick={() => onSetActiveTab('reconciliation')} className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${activeTab === 'reconciliation' ? 'bg-[#153e35] text-white' : 'text-gray-600 hover:bg-white'}`}>
                      <TrendingUp className="w-3 h-3 inline mr-0.5" />对账
                    </button>
                  </div>
                </div>

                {/* 中间：层级展开 + 节点计数 */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => expandToDepth(0)} className="px-2 py-1 rounded text-[11px] font-medium text-gray-600 hover:bg-white transition-all">收起</button>
                    <button onClick={() => expandToDepth(1)} className="px-2 py-1 rounded text-[11px] font-medium text-gray-600 hover:bg-white transition-all">1级</button>
                    <button onClick={() => expandToDepth(2)} className="px-2 py-1 rounded text-[11px] font-medium text-gray-600 hover:bg-white transition-all">2级</button>
                    <button onClick={() => expandToDepth(3)} className="px-2 py-1 rounded text-[11px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-all">全部</button>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded border border-emerald-200">
                    <Layers className="w-3 h-3 text-emerald-600" />
                    <span className="text-[11px] font-bold text-emerald-700">
                      {tooManyVisible ? <span className="text-red-600">{MAX_VISIBLE_STAFF_NODES}/{visibleStaffNodes.length}</span> : visibleStaffNodes.length}
                    </span>
                  </div>
                  {tooManyVisible && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-red-50 rounded border border-red-200">
                      <AlertCircle className="w-3 h-3 text-red-500" />
                      <span className="text-[10px] text-red-600 font-medium">限制</span>
                    </div>
                  )}
                </div>

                {/* 右侧：缩放 + 视图切换 + 返回 */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button onClick={() => setZoomScale(p => Math.max(0.3, p - 0.1))} className="w-6 h-6 hover:bg-white rounded flex items-center justify-center text-gray-600 transition-all" title="缩小"><Minus className="w-3 h-3" /></button>
                    <span className="text-[11px] font-bold text-gray-700 px-1 min-w-[32px] text-center">{Math.round(zoomScale * 100)}%</span>
                    <button onClick={() => setZoomScale(p => Math.min(2, p + 0.1))} className="w-6 h-6 hover:bg-white rounded flex items-center justify-center text-gray-600 transition-all" title="放大"><Plus className="w-3 h-3" /></button>
                    <div className="w-px h-4 bg-gray-300 mx-0.5"></div>
                    <button onClick={() => fitToView({ maxZoom: 1.2 }, Array.from(visibleNodeIdSet))} className="px-1.5 py-1 hover:bg-white rounded text-[11px] font-medium text-gray-600 transition-all" title="适应屏幕">适应</button>
                  </div>
                  <button onClick={() => setViewMode('list')} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-[11px] font-medium hover:bg-gray-200 transition-all flex items-center gap-1">
                    <List className="w-3 h-3" />目录
                  </button>
                  <button onClick={onBack} className="px-2 py-1 border border-gray-200 text-gray-500 rounded text-[11px] font-medium hover:text-[#153e35] hover:border-[#153e35] transition-all">
                    返回
                  </button>
                </div>
              </div>
            </div>


            {/* 画布层（缩放+平移） */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
                transformOrigin: '0 0'
              }}
            >
              {/* 连接线层（随拖拽更新） */}
              <svg
                className="absolute inset-0"
                style={{ pointerEvents: 'none' }}
                viewBox={`0 0 ${canvasSize.w} ${canvasSize.h}`}
                preserveAspectRatio="none"
              >
                {hierarchyGraph.edges.map((e) => {
                  const renderNodeIdSet = new Set<string>(['headquarters', ...visibleStaffNodesForRender.map(s => String(s.id))])
                  if (!renderNodeIdSet.has(String(e.from)) || !renderNodeIdSet.has(String(e.to))) {
                    console.log('Edge filtered out:', e.from, '->', e.to, 'renderNodeIdSet:', Array.from(renderNodeIdSet))
                    return null
                  }
                  const fromPos = nodePositions[String(e.from)]
                  const toPos = nodePositions[String(e.to)]
                  if (!fromPos || !toPos) {
                    console.log('Missing positions:', e.from, fromPos, e.to, toPos)
                    return null
                  }

                  const fromSize = e.from === 'headquarters' ? { w: 280, h: 200 } : { w: 240, h: 160 }
                  const toSize = e.to === 'headquarters' ? { w: 280, h: 200 } : { w: 240, h: 160 }

                  const x1 = canvasSize.w / 2 + fromPos.x
                  const y1 = canvasSize.h / 2 + fromPos.y + fromSize.h / 2
                  const x2 = canvasSize.w / 2 + toPos.x
                  const y2 = canvasSize.h / 2 + toPos.y - toSize.h / 2

                  // 使用更自然的连接线：先垂直向下，再水平，最后垂直向下
                  const midY = y1 + (y2 - y1) * 0.4
                  const isFocused = focusedNodeId && (String(e.from) === focusedNodeId || String(e.to) === focusedNodeId)
                  return (
                    <path
                      key={`${e.from}-${e.to}`}
                      d={`M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`}
                      fill="none"
                      stroke={isFocused ? '#10b981' : '#d1d5db'}
                      strokeWidth={isFocused ? 3 : 2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity={isFocused ? 1 : 0.6}
                    />
                  )
                })}
              </svg>

              {/* 总部卡片（固定在顶部，紧贴工具栏下方） */}
              <div
                onClick={onNodeClick('headquarters')}
                className="w-[260px] p-5 bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all relative z-20"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '60px',
                  transform: 'translate(-50%, 0)',
                  touchAction: 'none'
                }}
              >
                {hasChildren('headquarters') ? (
                  <button
                    type="button"
                    onClick={onToggleExpandClick('headquarters')}
                    className="absolute top-4 right-4 w-9 h-9 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-600 hover:text-[#153e35]"
                    title={expandedNodes.has('headquarters') ? '收起下级' : '展开下级'}
                  >
                    {expandedNodes.has('headquarters') ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                  </button>
                ) : null}
                <div className="flex items-center gap-4 mb-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setParentAccount(null)
                      setShowAddModal(true)
                    }}
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden flex items-center justify-center text-white text-xl font-black hover:ring-4 hover:ring-blue-200 transition-all"
                    title="查看人员组织"
                  >
                    {manufacturerLogo ? (
                      <img src={manufacturerLogo} alt={hierarchyData.headquarters.name} className="w-full h-full object-cover" />
                    ) : (
                      hierarchyData.headquarters.name.charAt(0)
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{hierarchyData.headquarters.name}</h3>
                    <p className="text-sm text-gray-500">{hierarchyData.headquarters.role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setProductAccount(hierarchyData.headquarters as any)
                      setShowProductModal(true)
                    }}
                    className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all"
                    title="绑定商品"
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded-xl text-center">
                    <div className="text-xs text-green-600 font-medium mb-1">最低折扣</div>
                    <div className="text-xl font-bold text-green-800">{hierarchyData.headquarters.minDiscount}%</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-xl text-center">
                    <div className="text-xs text-blue-600 font-medium mb-1">返佣上限</div>
                    <div className="text-xl font-bold text-blue-800">{hierarchyData.headquarters.distribution}%</div>
                  </div>
                </div>
              </div>

              {visibleStaffNodesForRender.map((staff) => (
                <div
                  key={staff.id}
                  onPointerDown={onNodePointerDown(String(staff.id))}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={onNodePointerUp}
                  onPointerCancel={onNodePointerUp}
                  onClick={onNodeClick(String(staff.id))}
                  className="w-[240px] p-4 bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all"
                  style={{
                    position: 'absolute',
                    left: `${canvasSize.w / 2 + (nodePositions[String(staff.id)]?.x ?? 0)}px`,
                    top: `${canvasSize.h / 2 + (nodePositions[String(staff.id)]?.y ?? 240)}px`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {/* 头像和基本信息 - 水平布局 */}
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAvatarClick(staff)
                      }}
                      className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden hover:ring-4 hover:ring-emerald-300 transition-all flex-shrink-0"
                      title="编辑层级返佣配置"
                    >
                      <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-gray-900 mb-1">{staff.name}</h4>
                      <div className="text-sm text-gray-600">{staff.role}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        const acc = accounts.find(a => String(a._id) === String(staff.id)) || null
                        if (!acc) return
                        setProductAccount(acc)
                        setShowProductModal(true)
                      }}
                      className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-all flex-shrink-0"
                      title="绑定商品"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 折扣和返佣显示 - 紧凑布局 */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-green-50 p-3 rounded-xl text-center">
                      <div className="text-xs text-green-700 font-medium mb-1">最低折扣</div>
                      <input
                        type="number"
                        value={nodeDraft[String(staff.id)]?.minDiscount ?? staff.minDiscount}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(100, Number(e.target.value) || 0))
                          setNodeDraft(prev => ({
                            ...prev,
                            [String(staff.id)]: {
                              ...(prev[String(staff.id)] || { minDiscount: staff.minDiscount, distribution: staff.distribution }),
                              minDiscount: v
                            }
                          }))
                        }}
                        onBlur={() => commitNodeDraft(String(staff.id))}
                        onKeyDown={(e) => e.key === 'Enter' && commitNodeDraft(String(staff.id))}
                        className="text-xl font-bold text-green-800 bg-transparent text-center w-full outline-none"
                      />
                      <div className="text-xs text-green-600">%</div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-xl text-center">
                      <div className="text-xs text-blue-700 font-medium mb-1">返佣比例</div>
                      <input
                        type="number"
                        value={nodeDraft[String(staff.id)]?.distribution ?? staff.distribution}
                        max={getMaxVerticalCommissionPctForAccount(String(staff.id))}
                        onChange={(e) => {
                          const maxAllowed = getMaxVerticalCommissionPctForAccount(String(staff.id))
                          const v = Math.max(0, Math.min(maxAllowed, Number(e.target.value) || 0))
                          setNodeDraft(prev => ({
                            ...prev,
                            [String(staff.id)]: {
                              ...(prev[String(staff.id)] || { minDiscount: staff.minDiscount, distribution: staff.distribution }),
                              distribution: v
                            }
                          }))
                        }}
                        onBlur={() => commitNodeDraft(String(staff.id))}
                        onKeyDown={(e) => e.key === 'Enter' && commitNodeDraft(String(staff.id))}
                        className="text-xl font-bold text-blue-800 bg-transparent text-center w-full outline-none"
                      />
                      <div className="text-xs text-blue-600">%</div>
                    </div>
                  </div>

                  {/* 绑定信息和添加下级 */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {(hierarchyGraph.childrenById.get(String(staff.id)) || []).length}人
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {staff.account?.visibleProductIds?.length || 0}商品
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* 展开/收起按钮 - 移到底部避免遮挡商品图标 */}
                      {hasChildren(String(staff.id)) && (
                        <button
                          type="button"
                          onClick={onToggleExpandClick(String(staff.id))}
                          className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 flex items-center justify-center"
                          title={expandedNodes.has(String(staff.id)) ? '收起下级' : '展开下级'}
                        >
                          {expandedNodes.has(String(staff.id)) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const acc = accounts.find(a => String(a._id) === String(staff.id)) || null
                          setParentAccount(acc)
                          setShowAddModal(true)
                        }}
                        className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center"
                        title="添加下级"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm(`确定要删除层级 "${staff.name}" 吗？此操作不可恢复。`)) {
                            handleDeleteAccount(String(staff.id))
                          }
                        }}
                        className="w-6 h-6 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                        title="删除层级"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {viewMode === 'map' && (
          /* 底部切换按钮 */
            <button 
              onClick={() => setViewMode('list')} 
              className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white px-12 py-5 rounded-full shadow-2xl border-2 border-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all z-[70] text-emerald-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              切换目录视图
            </button>
        )}
      </div>

      {/* 添加账号模态框 */}
      {showAddModal && (
        <AddAccountModal
          modules={modules}
          parentAccount={parentAccount}
          parentMinDiscountPct={parentAccount ? getMinDiscountPctFromAccount(parentAccount, modules.find(m => String(m._id) === String(parentAccount.roleModuleId)) || null) : 60}
          manufacturerId={manufacturerId}
          existingUserIds={accounts.map(a => String(a.userId))}
          onClose={() => {
            setShowAddModal(false)
            setParentAccount(null)
          }}
          onSave={handleAddAccounts}
        />
      )}

      {showProductModal && productAccount && (
        <ProductProfitModal
          account={productAccount}
          modules={modules}
          categoryTree={manufacturerCategoryTree}
          products={manufacturerProducts}
          profitSettings={profitSettings}
          inheritedProductIds={getInheritedVisibleProductIds(productAccount) || []}
          getMaxVerticalCommissionPctForAccount={getMaxVerticalCommissionPctForAccount}
          onClose={() => {
            setShowProductModal(false)
            setProductAccount(null)
          }}
          onSave={({ visibleProductIds, categoryOverrides, productOverrides }) => {
            const next = (accounts || []).map(a => {
              if (String(a._id) !== String(productAccount._id)) return a

              const clone: any = { ...a }
              if (visibleProductIds === null) delete clone.visibleProductIds
              else clone.visibleProductIds = Array.isArray(visibleProductIds) ? visibleProductIds : []

              if (Array.isArray(categoryOverrides) && categoryOverrides.length > 0) clone.categoryOverrides = categoryOverrides
              else delete clone.categoryOverrides

              if (Array.isArray(productOverrides) && productOverrides.length > 0) clone.productOverrides = productOverrides
              else delete clone.productOverrides

              return clone
            })
            onSaveAccounts(next)
            setShowProductModal(false)
            setProductAccount(null)
            toast.success('保存成功')
          }}
        />
      )}
      
      {/* 编辑业务节点档案模态框 - 层级返佣配置 */}
      {showProfileEditModal && selectedStaff && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]" 
          onClick={() => setShowProfileEditModal(false)}
          onMouseDown={(e) => e.target === e.currentTarget && e.stopPropagation()}
        >
          <div 
            className="bg-white rounded-3xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">编辑业务节点档案</h3>
              <button onClick={() => setShowProfileEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-100 cursor-pointer hover:border-emerald-400 transition-all relative group">
                <img src={selectedStaff.avatar} alt={selectedStaff.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        const newAvatar = e.target?.result as string
                        setSelectedStaff({ ...selectedStaff, avatar: newAvatar })
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                />
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-1">{selectedStaff.name}</h4>
              <p className="text-sm text-gray-500">点击头像更换头像档案</p>
            </div>
            
            <form>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">姓名</label>
                  <input 
                    type="text" 
                    name="nickname"
                    defaultValue={selectedStaff.name}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">职务&角色</label>
                  <select 
                    name="role"
                    defaultValue={selectedStaff.role}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    onChange={(e) => {
                      const selectedRoleName = e.target.value
                      const selectedRoleModule = modules?.find((m: any) => m.name === selectedRoleName)
                      if (selectedRoleModule) {
                        const defaultRule = selectedRoleModule.discountRules?.find((r: any) => r.isDefault) || selectedRoleModule.discountRules?.[0]
                        if (defaultRule) {
                          // 更新选中员工的角色和默认规则
                          setSelectedStaff({
                            ...selectedStaff,
                            role: selectedRoleName,
                            defaultDiscount: Math.round(Math.max(0, Math.min(1, Number(defaultRule.discountRate ?? 1))) * 100),
                            defaultCommission: Math.round(Math.max(0, Math.min(1, Number(defaultRule.commissionRate ?? 0))) * 100)
                          })
                        }
                      }
                    }}
                  >
                    <option value="">请选择角色</option>
                    {modules?.map((roleModule: any) => (
                      <option key={roleModule._id} value={roleModule.name}>
                        {roleModule.name}
                      </option>
                    )) || [
                      <option key="销售员" value="销售员">销售员</option>,
                      <option key="区域经理" value="区域经理">区域经理</option>,
                      <option key="总监" value="总监">总监</option>,
                      <option key="合作商" value="合作商">合作商</option>
                    ]}
                  </select>
                </div>

                {/* 显示角色默认折扣和返佣 */}
                {selectedStaff.defaultDiscount && selectedStaff.defaultCommission && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">角色默认配置</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">默认折扣：</span>
                        <span className="font-semibold">{selectedStaff.defaultDiscount}%</span>
                      </div>
                      <div>
                        <span className="text-blue-700">默认返佣：</span>
                        <span className="font-semibold">{selectedStaff.defaultCommission}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 层级返佣规则选择 */}
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium text-emerald-900">层级返佣规则</h4>
                      <p className="text-xs text-emerald-700">选择适用的分佣规则（最多40%）</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCreateRule}
                      className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700"
                    >
                      + 新建规则
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {(localCommissionRules || []).map((rule: CommissionRule) => {
                      const isSelected = selectedStaff.commissionRuleId === rule._id
                      const total = rule.selfRate + (rule.subordinateRates || []).reduce((a, b) => a + b, 0)
                      return (
                        <div
                          key={rule._id}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-100' 
                              : 'border-gray-200 bg-white hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <button
                              type="button"
                              onClick={() => setSelectedStaff({ ...selectedStaff, commissionRuleId: rule._id })}
                              className="font-medium text-sm text-gray-900 text-left flex-1"
                            >
                              {rule.name}
                            </button>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold ${total > 40 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {total}%
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingRule(rule)
                                  setShowRuleEditor(true)
                                }}
                                className="p-1 text-gray-400 hover:text-emerald-600"
                                title="编辑规则"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedStaff({ ...selectedStaff, commissionRuleId: rule._id })}
                            className="w-full text-left"
                          >
                            <p className="text-xs text-gray-500 mb-2">{rule.description}</p>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded">
                                自己 {rule.selfRate}%
                              </span>
                              {(rule.subordinateRates || []).map((rate, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-blue-200 text-blue-800 rounded">
                                  {idx + 1}级下级 {rate}%
                                </span>
                              ))}
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                  
                  {(!localCommissionRules || localCommissionRules.length === 0) && (
                    <p className="text-xs text-gray-500 italic">暂无返佣规则，点击"新建规则"创建</p>
                  )}
                </div>

                {/* 被绑定人员设置 */}
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-900 mb-3">被绑定人员设置</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-amber-800 block mb-1">折扣 (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={selectedStaff.boundUserDiscount ?? 85}
                        onChange={(e) => setSelectedStaff({
                          ...selectedStaff,
                          boundUserDiscount: Math.min(100, Math.max(0, Number(e.target.value) || 0))
                        })}
                        className="w-full p-2 border border-amber-300 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-amber-800 block mb-1">返佣 (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={selectedStaff.boundUserCommission ?? 0}
                        onChange={(e) => setSelectedStaff({
                          ...selectedStaff,
                          boundUserCommission: Math.min(100, Math.max(0, Number(e.target.value) || 0))
                        })}
                        className="w-full p-2 border border-amber-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">备注说明</label>
                  <textarea 
                    placeholder="分别说明"
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </div>
            </form>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowProfileEditModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                取消修改
              </button>
              <button 
                onClick={() => {
                  // 实际保存档案修改操作
                  if (selectedStaff && selectedStaff.account) {
                    const formData = new FormData(document.querySelector('form') as HTMLFormElement)
                    const nickname = formData.get('nickname') as string
                    const role = formData.get('role') as string
                    
                    const updatedAccounts = accounts.map(account => {
                      if (String(account._id) === String(selectedStaff.account._id)) {
                        const updates: any = { 
                          nickname: nickname || account.nickname
                        }
                        
                        // 保存头像更改
                        if (selectedStaff.avatar !== (account as any).avatar) {
                          updates.avatar = selectedStaff.avatar
                        }
                        
                        // 保存角色更改并设置默认折扣和返佣
                        if (role && role !== selectedStaff.role) {
                          const roleModule = modules?.find((m: any) => m.name === role)
                          if (roleModule) {
                            updates.roleModuleId = roleModule._id
                            updates.roleModuleName = roleModule.name
                            
                            // 设置该角色的默认折扣规则
                            const defaultRule = roleModule.discountRules?.find((r: any) => r.isDefault) || roleModule.discountRules?.[0]
                            if (defaultRule) {
                              updates.discountRuleId = defaultRule._id
                              updates.distributionRate = Number(defaultRule.commissionRate ?? 0)
                            }
                          }
                        }

                        // 保存层级返佣规则ID
                        if (selectedStaff.commissionRuleId) {
                          updates.commissionRuleId = selectedStaff.commissionRuleId
                        }

                        // 保存被绑定人员设置
                        if (selectedStaff.boundUserDiscount !== undefined) {
                          updates.boundUserDiscount = selectedStaff.boundUserDiscount
                        }
                        if (selectedStaff.boundUserCommission !== undefined) {
                          updates.boundUserCommission = selectedStaff.boundUserCommission
                        }
                        
                        return { 
                          ...account, 
                          ...updates
                        }
                      }
                      return account
                    })
                    onSaveAccounts(updatedAccounts)
                  }
                  setShowProfileEditModal(false)
                }}
                className="flex-1 py-3 bg-[#153e35] text-white rounded-xl font-medium hover:bg-emerald-700"
              >
                提交档案修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 层级返佣规则编辑器 */}
      {showRuleEditor && editingRule && (
        <div 
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10000]"
          onClick={() => { setShowRuleEditor(false); setEditingRule(null) }}
        >
          <div 
            className="bg-white rounded-2xl p-6 w-full max-w-md mx-4"
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {localCommissionRules.find(r => r._id === editingRule._id) ? '编辑规则' : '新建规则'}
              </h3>
              <button 
                onClick={() => { setShowRuleEditor(false); setEditingRule(null) }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">规则名称</label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="如：3层分佣"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">规则说明</label>
                <input
                  type="text"
                  value={editingRule.description || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  placeholder="简要描述此规则"
                />
              </div>

              <div className="bg-emerald-50 p-4 rounded-lg">
                <div className="mb-3">
                  <label className="text-sm font-medium text-emerald-800 block mb-1">自己销售返佣 (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={editingRule.selfRate}
                    onChange={(e) => setEditingRule({ 
                      ...editingRule, 
                      selfRate: Math.min(40, Math.max(0, Number(e.target.value) || 0))
                    })}
                    className="w-full p-2.5 border border-emerald-300 rounded-lg text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-emerald-800">下级层级返佣</label>
                    <button
                      type="button"
                      onClick={() => setEditingRule({
                        ...editingRule,
                        subordinateRates: [...(editingRule.subordinateRates || []), 10]
                      })}
                      className="text-xs px-2 py-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                    >
                      + 添加层级
                    </button>
                  </div>

                  {(editingRule.subordinateRates || []).map((rate, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs text-emerald-700 w-20">第{idx + 1}级下级</span>
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={rate}
                        onChange={(e) => {
                          const newRates = [...(editingRule.subordinateRates || [])]
                          newRates[idx] = Math.min(40, Math.max(0, Number(e.target.value) || 0))
                          setEditingRule({ ...editingRule, subordinateRates: newRates })
                        }}
                        className="flex-1 p-2 border border-emerald-300 rounded-lg text-sm"
                      />
                      <span className="text-xs text-emerald-600">%</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newRates = (editingRule.subordinateRates || []).filter((_, i) => i !== idx)
                          setEditingRule({ ...editingRule, subordinateRates: newRates })
                        }}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {(editingRule.subordinateRates || []).length === 0 && (
                    <p className="text-xs text-emerald-600 italic">点击"添加层级"设置下级返佣</p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-emerald-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700">返佣合计：</span>
                    <span className={`font-bold ${
                      (editingRule.selfRate + (editingRule.subordinateRates || []).reduce((a, b) => a + b, 0)) > 40
                        ? 'text-red-600' : 'text-emerald-800'
                    }`}>
                      {editingRule.selfRate + (editingRule.subordinateRates || []).reduce((a, b) => a + b, 0)}%
                      {(editingRule.selfRate + (editingRule.subordinateRates || []).reduce((a, b) => a + b, 0)) > 40 && (
                        <span className="text-xs ml-1">(超过40%上限)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowRuleEditor(false); setEditingRule(null) }}
                className="flex-1 py-2.5 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={() => {
                  const total = editingRule.selfRate + (editingRule.subordinateRates || []).reduce((a, b) => a + b, 0)
                  if (total > 40) {
                    alert('返佣合计不能超过40%')
                    return
                  }
                  if (!editingRule.name.trim()) {
                    alert('请输入规则名称')
                    return
                  }
                  handleSaveRule(editingRule)
                }}
                className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700"
              >
                保存规则
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ProductProfitModal({
  account,
  modules,
  categoryTree,
  products,
  profitSettings,
  inheritedProductIds,
  getMaxVerticalCommissionPctForAccount,
  onClose,
  onSave
}: {
  account: AuthorizedAccount
  modules: RoleModule[]
  categoryTree: any[]
  products: any[]
  profitSettings: any
  inheritedProductIds: string[]
  getMaxVerticalCommissionPctForAccount: (accountId: string) => number
  onClose: () => void
  onSave: (data: { visibleProductIds: string[] | null, categoryOverrides: any, productOverrides: any }) => void
}) {
  const [keyword, setKeyword] = useState('')
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set())
  const [expandedSkuProducts, setExpandedSkuProducts] = useState<Set<string>>(new Set())

  const module = useMemo(() => {
    return modules.find(m => String(m._id) === String(account.roleModuleId)) || null
  }, [modules, account.roleModuleId])

  const defaultRule = useMemo(() => {
    const rules = Array.isArray(module?.discountRules) ? module!.discountRules : []
    const byId = account.discountRuleId ? rules.find(r => String(r._id) === String(account.discountRuleId)) : null
    return byId || rules.find(r => r.isDefault) || rules[0] || null
  }, [module, account.discountRuleId])

  const globalMinSaleDiscountRate = Number(profitSettings?.minSaleDiscountRate ?? 1)
  const safeGlobalMinSaleDiscountRate = Number.isFinite(globalMinSaleDiscountRate)
    ? Math.max(0, Math.min(1, globalMinSaleDiscountRate))
    : 1

  const defaultDiscountRate = useMemo(() => {
    const rule = defaultRule
    if (!rule) return 1
    const discountType = rule.discountType || (typeof rule.minDiscountPrice === 'number' ? 'minPrice' : 'rate')
    if (discountType === 'rate') {
      const v = typeof rule.discountRate === 'number' && Number.isFinite(rule.discountRate) ? rule.discountRate : 1
      return Math.max(0, Math.min(1, v))
    }
    return 1
  }, [defaultRule])

  const defaultCommissionRate = useMemo(() => {
    const v = typeof defaultRule?.commissionRate === 'number' && Number.isFinite(defaultRule.commissionRate)
      ? defaultRule.commissionRate
      : 0
    return Math.max(0, Math.min(1, v))
  }, [defaultRule])

  const safeCommissionMax = 0.4

  const clampRate = (v: any) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return null
    return Math.max(0, Math.min(1, n))
  }

  const clampCommissionRate = (v: any) => {
    const n = Number(v)
    if (!Number.isFinite(n)) return null
    return Math.max(0, Math.min(safeCommissionMax, n))
  }

  const pctToRate = (pct: any) => {
    const n = Number(pct)
    if (!Number.isFinite(n)) return null
    return Math.max(0, Math.min(1, n / 100))
  }

  const rateToPct = (rate: any) => {
    const n = Number(rate)
    if (!Number.isFinite(n)) return ''
    return String(Math.round(Math.max(0, Math.min(1, n)) * 100))
  }

  const commissionToPct = (rate: any) => {
    const n = Number(rate)
    if (!Number.isFinite(n)) return ''
    return String(Math.round(Math.max(0, Math.min(safeCommissionMax, n)) * 100))
  }

  const [categoryOverrideById, setCategoryOverrideById] = useState<Record<string, { discountRate?: number; commissionRate?: number }>>(() => {
    const list = Array.isArray((account as any)?.categoryOverrides) ? (account as any).categoryOverrides : []
    const next: Record<string, { discountRate?: number; commissionRate?: number }> = {}
    ;(Array.isArray(list) ? list : []).forEach((x: any) => {
      const cid = String(x?.categoryId || '')
      if (!cid) return
      const d = clampRate(x?.discountRate)
      const c = clampCommissionRate(x?.commissionRate)
      const item: any = {}
      if (d !== null) item.discountRate = d
      if (c !== null) item.commissionRate = c
      next[cid] = item
    })
    return next
  })

  const [productOverrideById, setProductOverrideById] = useState<Record<string, { discountRate?: number; commissionRate?: number }>>(() => {
    const list = Array.isArray((account as any)?.productOverrides) ? (account as any).productOverrides : []
    const next: Record<string, { discountRate?: number; commissionRate?: number }> = {}
    ;(Array.isArray(list) ? list : []).forEach((x: any) => {
      const pid = String(x?.productId || '')
      if (!pid) return
      const d = clampRate(x?.discountRate)
      const c = clampCommissionRate(x?.commissionRate)
      const item: any = {}
      if (d !== null) item.discountRate = d
      if (c !== null) item.commissionRate = c
      next[pid] = item
    })
    return next
  })

  const setCategoryOverrideField = (categoryId: string, patch: { discountRate?: number | null; commissionRate?: number | null }) => {
    setCategoryOverrideById((prev) => {
      const cur = prev[categoryId] || {}
      const nextItem: any = { ...cur }
      if ('discountRate' in patch) {
        if (patch.discountRate === null) delete nextItem.discountRate
        else nextItem.discountRate = patch.discountRate
      }
      if ('commissionRate' in patch) {
        if (patch.commissionRate === null) delete nextItem.commissionRate
        else nextItem.commissionRate = patch.commissionRate
      }
      const hasAny = typeof nextItem.discountRate === 'number' || typeof nextItem.commissionRate === 'number'
      const next = { ...prev }
      if (!hasAny) delete next[categoryId]
      else next[categoryId] = nextItem
      return next
    })
  }

  const setProductOverrideField = (productId: string, patch: { discountRate?: number | null; commissionRate?: number | null }) => {
    setProductOverrideById((prev) => {
      const cur = prev[productId] || {}
      const nextItem: any = { ...cur }
      if ('discountRate' in patch) {
        if (patch.discountRate === null) delete nextItem.discountRate
        else nextItem.discountRate = patch.discountRate
      }
      if ('commissionRate' in patch) {
        if (patch.commissionRate === null) delete nextItem.commissionRate
        else nextItem.commissionRate = patch.commissionRate
      }
      const hasAny = typeof nextItem.discountRate === 'number' || typeof nextItem.commissionRate === 'number'
      const next = { ...prev }
      if (!hasAny) delete next[productId]
      else next[productId] = nextItem
      return next
    })
  }

  const normalizeIdLocal = (x: any) => {
    if (!x) return ''
    const id = x?._id || x?.id || x
    return id ? String(id) : ''
  }

  const getProductImageSrc = (p: any, size: number = 96) => {
    const pick = (v: any) => {
      if (!v) return ''
      if (typeof v === 'string') return v
      if (typeof v?.url === 'string') return String(v.url)
      if (typeof v?.fileId === 'string') return String(v.fileId)
      if (typeof v?._id === 'string') return String(v._id)
      return ''
    }

    const img =
      (Array.isArray(p?.images) ? p.images[0] : null) ||
      p?.image ||
      p?.cover ||
      p?.thumbnail ||
      p?.mainImage ||
      ''

    let raw = pick(img)
    if (!raw) {
      const skus = Array.isArray(p?.skus) ? p.skus : []
      const skuImg = skus
        .map((s: any) => (Array.isArray(s?.images) ? s.images[0] : null) || s?.image || s?.thumbnail || '')
        .map(pick)
        .find((x: string) => !!x)
      raw = skuImg || ''
    }
    if (!raw) return ''
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/api/')) return raw
    if (raw.startsWith('/')) return raw
    return getThumbnailUrl(raw, size)
  }

  const visibleCategorySet = useMemo(() => {
    const ids = Array.isArray(account.visibleCategoryIds) ? account.visibleCategoryIds : []
    if (ids.length === 0) return null
    return new Set(ids.map(String))
  }, [account.visibleCategoryIds])

  const basePriceOf = (p: any) => {
    const fromFields = [p?.basePrice, p?.minPrice, p?.retailPrice, p?.price]
      .map((v: any) => Number(v))
      .find((v) => Number.isFinite(v) && v > 0)
    if (fromFields) return fromFields
    const skus = Array.isArray(p?.skus) ? p.skus : []
    const skuPrices = skus
      .map((s: any) => Number(s?.retailPrice ?? s?.price ?? s?.salePrice ?? s?.basePrice ?? 0))
      .filter((v: number) => Number.isFinite(v) && v > 0)
    if (skuPrices.length > 0) return Math.min(...skuPrices)
    return 0
  }

  const hasOwnProductWhitelist = Array.isArray((account as any)?.visibleProductIds)
  const normalizedInheritedProductIds = useMemo(() => {
    return (Array.isArray(inheritedProductIds) ? inheritedProductIds : []).map(String).filter(Boolean)
  }, [Array.isArray(inheritedProductIds) ? inheritedProductIds.join('|') : ''])

  const [mode, setMode] = useState<'inherit' | 'custom'>(() => (hasOwnProductWhitelist ? 'custom' : 'inherit'))
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(() => {
    if (hasOwnProductWhitelist) {
      const list = (account as any)?.visibleProductIds
      return Array.isArray(list) ? list.map(String).filter(Boolean) : []
    }
    return normalizedInheritedProductIds
  })

  const inheritedSet = useMemo(() => {
    return new Set(normalizedInheritedProductIds.map(String))
  }, [normalizedInheritedProductIds.join('|')])

  const selectedProductIdSet = useMemo(() => {
    return new Set((selectedProductIds || []).map(String))
  }, [selectedProductIds.join('|')])

  const sameAsInherited = useMemo(() => {
    if (inheritedSet.size === 0 && selectedProductIds.length === 0) return true
    if (inheritedSet.size !== selectedProductIdSet.size) return false
    for (const id of inheritedSet) {
      if (!selectedProductIdSet.has(id)) return false
    }
    return true
  }, [inheritedSet, selectedProductIdSet, selectedProductIds.length])

  const toggleExpand = (id: string) => {
    setExpandedCategoryIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const productsByCategoryId = useMemo(() => {
    const map = new Map<string, any[]>()
    const allProducts: any[] = []
    ;(products || []).forEach((p: any) => {
      allProducts.push(p)
      const raw = p?.category
      const ids: string[] = []
      const push = (v: any) => {
        const id = normalizeIdLocal(v)
        if (id) ids.push(id)
      }
      if (Array.isArray(p?.categories)) p.categories.forEach((c: any) => push(c))
      else if (Array.isArray(raw)) raw.forEach((c: any) => push(c))
      else if (raw) push(raw?._id || raw?.id || raw)
      const uniq = Array.from(new Set(ids.filter(Boolean)))
      uniq.forEach((cid) => {
        const arr = map.get(cid) || []
        arr.push(p)
        map.set(cid, arr)
      })
    })
    // 添加虚拟的"全部商品"分类
    if (allProducts.length > 0) {
      map.set('__all_products__', allProducts)
    }
    return map
  }, [products])

  const categoryIdsOfProduct = (p: any): string[] => {
    const raw = p?.category
    const ids: string[] = []
    const push = (v: any) => {
      const id = normalizeIdLocal(v)
      if (id) ids.push(id)
    }
    if (Array.isArray(p?.categories)) p.categories.forEach((c: any) => push(c))
    else if (Array.isArray(raw)) raw.forEach((c: any) => push(c))
    else if (raw) push(raw?._id || raw?.id || raw)
    return Array.from(new Set(ids.filter(Boolean)))
  }

  const productById = useMemo(() => {
    return new Map<string, any>((products || []).map((p: any) => [String(p?._id || p?.id || ''), p]))
  }, [products])

  const filterTreeByAllowed = (nodes: any[]): any[] => {
    return (nodes || [])
      .map((n: any) => {
        const id = normalizeIdLocal(n)
        const children = Array.isArray(n?.children) ? n.children : []
        const nextChildren = filterTreeByAllowed(children)

        const keepByAllowed = !visibleCategorySet || visibleCategorySet.has(id)
        const hasProducts = (productsByCategoryId.get(id) || []).length > 0
        const keep = keepByAllowed || nextChildren.length > 0 || hasProducts
        if (!keep) return null

        return { ...n, children: nextChildren }
      })
      .filter(Boolean)
  }

  const effectiveTree = useMemo(() => {
    // 如果有分类树，使用分类树
    if (categoryTree && categoryTree.length > 0) {
      return filterTreeByAllowed(categoryTree)
    }
    // 如果没有分类树但有商品，创建一个虚拟的"全部商品"分类
    if (products && products.length > 0) {
      return [{
        _id: '__all_products__',
        name: '全部商品',
        children: []
      }]
    }
    return []
  }, [categoryTree, visibleCategorySet, productsByCategoryId, products])

  const subtreeProductIdsByCategoryId = useMemo(() => {
    const map = new Map<string, string[]>()

    const walk = (node: any): string[] => {
      const id = normalizeIdLocal(node)
      const children = Array.isArray(node?.children) ? node.children : []
      const direct = (productsByCategoryId.get(id) || [])
        .map((p: any) => String(p?._id || p?.id || ''))
        .filter(Boolean)
      let all = [...direct]
      children.forEach((c: any) => {
        all = all.concat(walk(c))
      })
      const uniq = Array.from(new Set(all))
      map.set(id, uniq)
      return uniq
    }

    ;(effectiveTree || []).forEach((n: any) => walk(n))
    return map
  }, [effectiveTree, productsByCategoryId])

  const toggleSelectProducts = (ids: string[]) => {
    const uniq = Array.from(new Set((ids || []).map(String).filter(Boolean)))
    if (uniq.length === 0) return
    if (mode === 'inherit') {
      setMode('custom')
    }
    setSelectedProductIds(prev => {
      const set = new Set((prev || []).map(String))
      const allSelected = uniq.every(id => set.has(id))
      if (allSelected) {
        uniq.forEach(id => set.delete(id))
      } else {
        uniq.forEach(id => set.add(id))
      }
      return Array.from(set)
    })
  }

  const toggleSkuExpansion = (productId: string) => {
    setExpandedSkuProducts(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
      } else {
        next.add(productId)
      }
      return next
    })
  }

  const renderProductRow = (p: any) => {
    const pid = String(p?._id || p?.id || '')
    if (!pid) return null
    const name = String(p?.name || p?.title || p?.productName || p?.productCode || pid)
    if (keyword.trim() && !name.toLowerCase().includes(keyword.trim().toLowerCase())) return null

    const base = basePriceOf(p)
    const checked = selectedProductIdSet.has(pid)

    const imgUrl = getProductImageSrc(p, 120)

    const skuList = Array.isArray(p?.skus) ? p.skus : []
    const skuCodes = skuList
      .map((s: any) => String(s?.code || s?.skuCode || s?.productCode || ''))
      .map((s: string) => s.trim())
      .filter(Boolean)
    const skuSummary = skuCodes.length > 0 ? skuCodes.slice(0, 3).join(' / ') : ''
    const isSkuExpanded = expandedSkuProducts.has(pid)

    const categoryIds = categoryIdsOfProduct(p)
    const primaryCategoryId = categoryIds[0] || ''

    // 获取当前账户的最低折扣设置（从卡片读取，如60%）
    const accountMinDiscountPct = (account as any)?.minDiscount || 60
    const accountMinDiscountRate = accountMinDiscountPct / 100
    
    const catOverride = primaryCategoryId ? categoryOverrideById[primaryCategoryId] : undefined
    const prodOverride = productOverrideById[pid]
    
    // 使用账户卡片设定的最低折扣率，不允许低于此标准
    const effectiveDiscountRateRaw =
      (typeof prodOverride?.discountRate === 'number' ? prodOverride.discountRate : undefined) ??
      (typeof catOverride?.discountRate === 'number' ? catOverride.discountRate : undefined) ??
      accountMinDiscountRate
    const effectiveDiscountRate = Math.max(accountMinDiscountRate, Math.min(1, Number(effectiveDiscountRateRaw) || 0))
    const minDiscountPrice = Math.round(Number(base || 0) * effectiveDiscountRate)

    // 获取当前账户的返佣设置（从卡片读取，如40%）
    const accountCommissionPct = (account as any)?.distribution || account?.distributionRate || 0
    const accountCommissionRate = accountCommissionPct / 100
    
    const effectiveCommissionRateRaw =
      (typeof prodOverride?.commissionRate === 'number' ? prodOverride.commissionRate : undefined) ??
      (typeof catOverride?.commissionRate === 'number' ? catOverride.commissionRate : undefined) ??
      accountCommissionRate
    const effectiveCommissionRate = Math.max(0, Math.min(safeCommissionMax, Number(effectiveCommissionRateRaw) || 0))
    // 返佣基于最低折扣价计算
    const commissionAmount = Math.round(minDiscountPrice * effectiveCommissionRate)

    return (
      <div key={pid} className={`bg-white border rounded-2xl overflow-hidden hover:border-emerald-100 ${checked ? 'border-[#153e35] ring-2 ring-emerald-50' : 'border-gray-100'}`}>
        <div className="px-6 py-4">
          <div className="flex items-start gap-4 mb-4">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleSelectProducts([pid])}
              className="w-5 h-5 accent-[#153e35] mt-1 flex-shrink-0"
            />
            <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0">
              {imgUrl ? <img src={imgUrl} alt={name} className="w-full h-full object-cover" /> : null}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold text-gray-900 mb-2 leading-tight">{name}</div>
              <div className="text-sm text-gray-500 mb-2">
                标价 ¥{Number(base || 0).toLocaleString()}
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-gray-400">
                  {isSkuExpanded ? `SKU ${skuList.length}${skuSummary ? ` • ${skuSummary}` : ''}` : `${skuList.length}个SKU`}
                </span>
                {skuList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleSkuExpansion(pid)}
                    className="text-sm text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1"
                  >
                    {isSkuExpanded ? (
                      <>
                        <ChevronDown className="w-4 h-4" />
                        收起详情
                      </>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4" />
                        展开详情
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="text-xs text-gray-500 font-medium mb-1">最低折扣价</div>
              <div className="text-xl font-bold text-gray-900">¥{Number(minDiscountPrice || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">折扣 {rateToPct(effectiveDiscountRate)}%</div>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <div className="text-xs text-gray-500 font-medium mb-1">返佣金额</div>
              <div className="text-xl font-bold text-gray-900">¥{Number(commissionAmount || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-400 mt-1">返佣 {commissionToPct(effectiveCommissionRate)}%</div>
            </div>
          </div>

          {checked && (
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">自定义折扣%</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    placeholder="留空继承规则"
                    value={prodOverride?.discountRate != null ? rateToPct(prodOverride.discountRate) : ''}
                    onChange={(e) => {
                      const v = e.target.value
                      if (!v) {
                        setProductOverrideField(pid, { discountRate: null })
                        return
                      }
                      const r = pctToRate(v)
                      setProductOverrideField(pid, { discountRate: r == null ? null : Math.max(r, safeGlobalMinSaleDiscountRate) })
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#153e35] focus:ring-1 focus:ring-[#153e35]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">自定义返佣%</label>
                  <input
                    type="number"
                    min={0}
                    max={Math.round(safeCommissionMax * 100)}
                    step={1}
                    placeholder="留空继承规则"
                    value={prodOverride?.commissionRate != null ? commissionToPct(prodOverride.commissionRate) : ''}
                    onChange={(e) => {
                      const v = e.target.value
                      if (!v) {
                        setProductOverrideField(pid, { commissionRate: null })
                        return
                      }
                      const r = pctToRate(v)
                      setProductOverrideField(pid, { commissionRate: r == null ? null : Math.max(0, Math.min(safeCommissionMax, r)) })
                    }}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#153e35] focus:ring-1 focus:ring-[#153e35]"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Check className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* SKU详情展开区域 */}
        {isSkuExpanded && skuList.length > 0 && (
          <div className="px-6 pb-4 border-t border-gray-50 bg-gray-50/30">
            <div className="text-xs font-bold text-gray-600 mb-3 mt-3">SKU 详情</div>
            <div className="grid gap-3">
              {skuList.map((sku: any, index: number) => {
                const skuCode = String(sku?.code || sku?.skuCode || sku?.productCode || `SKU-${index + 1}`)
                const skuPrice = Number(sku?.retailPrice || sku?.price || sku?.salePrice || sku?.basePrice || 0)
                const skuSpec = String(sku?.spec || sku?.specification || '')
                const skuColor = String(sku?.color || '')
                const skuMaterial = String(sku?.material || '')
                const skuImg = getProductImageSrc(sku, 64)
                
                return (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                      {skuImg ? <img src={skuImg} alt={skuCode} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-gray-900 truncate">{skuCode}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {[skuSpec, skuColor, skuMaterial].filter(Boolean).join(' • ') || '暂无规格信息'}
                      </div>
                      {skuPrice > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          标价 ¥{skuPrice.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600 font-medium">
                        最低折扣价: ¥{Math.round(skuPrice * effectiveDiscountRate).toLocaleString()}
                      </div>
                      <div className="text-xs text-blue-600 font-medium mt-1">
                        返佣金额: ¥{Math.round(skuPrice * effectiveDiscountRate * effectiveCommissionRate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-[1040px] bg-white rounded-l-[3rem] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="min-w-0">
            <h3 className="text-3xl font-black text-gray-900">绑定商品</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 truncate">
              {account.nickname || account.username} • {module?.name || '未设置模块'}
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 transition-all">
            <X className="w-7 h-7 mx-auto" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-[64%] border-r border-gray-100 bg-[#fcfdfd] overflow-y-auto p-8 space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索商品"
                className="input flex-1"
              />
              {account.parentId ? (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('inherit')
                      setSelectedProductIds(normalizedInheritedProductIds)
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black border ${mode === 'inherit' ? 'bg-[#153e35] text-white border-[#153e35]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    继承上级
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('custom')}
                    className={`px-4 py-2 rounded-xl text-xs font-black border ${mode === 'custom' ? 'bg-[#153e35] text-white border-[#153e35]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    自定义
                  </button>
                </div>
              ) : null}
            </div>

            {effectiveTree.length === 0 ? (
              <div className="text-sm text-gray-500">暂无可选商品</div>
            ) : (
              <div className="space-y-6">
                {(function renderTree(nodes: any[], depth: number = 0): any {
                  return nodes.map((n: any) => {
                    const id = normalizeIdLocal(n)
                    const name = String(n?.name || id)
                    const children = Array.isArray(n?.children) ? n.children : []
                    const prods = productsByCategoryId.get(id) || []
                    const canExpand = children.length > 0 || prods.length > 0
                    const isExpanded = expandedCategoryIds.has(id)

                    const catOverride = categoryOverrideById[id]
                    const catDiscountPct = catOverride?.discountRate != null ? rateToPct(catOverride.discountRate) : ''
                    const catCommissionPct = catOverride?.commissionRate != null ? commissionToPct(catOverride.commissionRate) : ''

                    const subtreeIds = subtreeProductIdsByCategoryId.get(id) || []
                    const selectedCount = subtreeIds.reduce((sum, pid) => sum + (selectedProductIdSet.has(String(pid)) ? 1 : 0), 0)
                    const allSelected = subtreeIds.length > 0 && selectedCount === subtreeIds.length

                    return (
                      <div key={id} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => canExpand && toggleExpand(id)}
                          disabled={!canExpand}
                          className="w-full px-8 py-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                          style={{ paddingLeft: 32 + depth * 14 }}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${canExpand ? 'bg-gray-50 text-gray-600' : 'bg-gray-50 text-gray-300'}`}>
                              {canExpand ? (
                                isExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />
                              ) : (
                                <span className="w-6 h-6" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="text-lg font-black text-gray-900 truncate">{name}</div>
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {subtreeIds.length > 0 ? `已选 ${selectedCount}/${subtreeIds.length}` : (prods.length > 0 ? `${prods.length} 商品` : '暂无商品')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                step={1}
                                placeholder="品类折扣%"
                                value={catDiscountPct}
                                onChange={(e) => {
                                  const v = e.target.value
                                  if (!v) {
                                    setCategoryOverrideField(id, { discountRate: null })
                                    return
                                  }
                                  const r = pctToRate(v)
                                  setCategoryOverrideField(id, { discountRate: r == null ? null : Math.max(r, safeGlobalMinSaleDiscountRate) })
                                }}
                                className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-black text-center shadow-inner focus:ring-2 focus:ring-[#153e35] outline-none"
                                title="品类最低折扣%（留空表示继承规则）"
                              />
                              <input
                                type="number"
                                min={0}
                                max={Math.round(safeCommissionMax * 100)}
                                step={1}
                                placeholder="品类返佣%"
                                value={catCommissionPct}
                                onChange={(e) => {
                                  const v = e.target.value
                                  if (!v) {
                                    setCategoryOverrideField(id, { commissionRate: null })
                                    return
                                  }
                                  const r = pctToRate(v)
                                  setCategoryOverrideField(id, { commissionRate: r == null ? null : Math.max(0, Math.min(safeCommissionMax, r)) })
                                }}
                                className="w-24 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-black text-center shadow-inner focus:ring-2 focus:ring-[#153e35] outline-none"
                                title="品类返佣%（留空表示继承规则）"
                              />
                            </div>
                            {subtreeIds.length > 0 ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleSelectProducts(subtreeIds)
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-black border ${allSelected ? 'bg-[#153e35] text-white border-[#153e35]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                              >
                                {allSelected ? '取消全选' : '全选'}
                              </button>
                            ) : null}
                            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                              {canExpand ? (isExpanded ? '收起' : '展开') : ''}
                            </div>
                          </div>
                        </button>

                        {isExpanded ? (
                          <div className="px-8 pb-8 space-y-4 bg-gray-50/30">
                            <div className="space-y-3">
                              {prods.slice(0, 200).map(renderProductRow)}
                              {prods.length > 200 ? <div className="text-xs text-gray-400">仅展示前 200 个商品</div> : null}
                            </div>
                            {children.length > 0 ? (
                              <div className="space-y-6">
                                {renderTree(children, depth + 1)}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    )
                  })
                })(effectiveTree)}
              </div>
            )}
          </div>

          <div className="w-[36%] bg-white overflow-y-auto p-8 space-y-6">
            <div className="bg-white border border-gray-100 rounded-[2rem] p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-black text-gray-900">已选商品</div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {selectedProductIds.length} 个
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!confirm('确定清空全部选择吗？')) return
                    setSelectedProductIds([])
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-black border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                >
                  清空
                </button>
              </div>

              {selectedProductIds.length === 0 ? (
                <div className="text-sm text-gray-500 mt-6">暂无已选商品</div>
              ) : (
                <div className="mt-6 space-y-3">
                  {selectedProductIds.slice(0, 80).map((productId) => {
                    const p = productById.get(String(productId))
                    const name = String(p?.name || p?.title || p?.productName || productId)
                    return (
                      <div key={productId} className="px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-black text-gray-900 truncate">{name}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">ID: {String(productId)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSelectProducts([String(productId)])}
                            className="w-9 h-9 rounded-2xl bg-white border border-gray-200 text-gray-400 hover:text-rose-500 hover:border-rose-200 flex items-center justify-center shrink-0"
                            title="移除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  {selectedProductIds.length > 80 ? <div className="text-xs text-gray-400">仅展示前 80 条</div> : null}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-[2rem] p-6">
              <div className="text-sm font-black text-gray-900">说明</div>
              <div className="text-sm text-gray-500 mt-3 leading-relaxed">勾选后保存为该节点可见商品白名单。</div>
            </div>
          </div>
        </div>

        <div className="px-10 py-8 border-t border-gray-100 flex justify-end gap-4 bg-white">
          <button type="button" onClick={onClose} className="px-10 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50">
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              const categoryOverrides = Object.entries(categoryOverrideById)
                .map(([categoryId, v]) => {
                  const item: any = { categoryId }
                  if (typeof v?.discountRate === 'number') item.discountRate = v.discountRate
                  if (typeof v?.commissionRate === 'number') item.commissionRate = v.commissionRate
                  return item
                })
                .filter((x: any) => x.categoryId && (typeof x.discountRate === 'number' || typeof x.commissionRate === 'number'))

              const productOverrides = Object.entries(productOverrideById)
                .map(([productId, v]) => {
                  const item: any = { productId }
                  if (typeof v?.discountRate === 'number') item.discountRate = v.discountRate
                  if (typeof v?.commissionRate === 'number') item.commissionRate = v.commissionRate
                  return item
                })
                .filter((x: any) => x.productId && (typeof x.discountRate === 'number' || typeof x.commissionRate === 'number'))

              if (mode === 'inherit') {
                onSave({
                  visibleProductIds: null,
                  categoryOverrides: categoryOverrides.length > 0 ? categoryOverrides : null,
                  productOverrides: productOverrides.length > 0 ? productOverrides : null,
                })
                return
              }
              if (account.parentId && sameAsInherited) {
                onSave({
                  visibleProductIds: null,
                  categoryOverrides: categoryOverrides.length > 0 ? categoryOverrides : null,
                  productOverrides: productOverrides.length > 0 ? productOverrides : null,
                })
                return
              }
              onSave({
                visibleProductIds: Array.isArray(selectedProductIds) ? selectedProductIds : [],
                categoryOverrides: categoryOverrides.length > 0 ? categoryOverrides : null,
                productOverrides: productOverrides.length > 0 ? productOverrides : null,
              })
            }}
            className="px-12 py-3 rounded-2xl bg-[#153e35] text-white font-black shadow-xl"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}

// ==================== 添加账号模态框 ====================

function AddAccountModal({
  modules,
  parentAccount,
  parentMinDiscountPct,
  manufacturerId,
  existingUserIds,
  onClose,
  onSave
}: {
  modules: RoleModule[]
  parentAccount: AuthorizedAccount | null
  parentMinDiscountPct: number
  manufacturerId: string
  existingUserIds: string[]
  onClose: () => void
  onSave: (items: Array<{
    accountId: string
    username: string
    nickname: string
    phone: string
    roleModuleId: string
  }>) => void
}) {
  const [manufacturerAccounts, setManufacturerAccounts] = useState<any[]>([])
  const [accountKeyword, setAccountKeyword] = useState('')
  const [expandedAccountGroups, setExpandedAccountGroups] = useState<Set<string>>(new Set(['auth', 'sub', 'designer', 'normal', 'unknown']))
  const [selectionMode, setSelectionMode] = useState<'multiple' | 'single'>('multiple')
  const [organizationsById, setOrganizationsById] = useState<Record<string, { name: string; type?: string }>>({})

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])

  const activeModules = useMemo(() => {
    return (modules || []).filter((m) => m?.isActive)
  }, [modules])

  const defaultRoleModuleId = useMemo(() => {
    const byParent = parentAccount?.roleModuleId ? String(parentAccount.roleModuleId) : ''
    if (byParent && activeModules.some((m) => String(m._id) === byParent)) return byParent
    return activeModules[0]?._id ? String(activeModules[0]._id) : ''
  }, [parentAccount?._id, parentAccount?.roleModuleId, activeModules])

  const [roleByAccountId, setRoleByAccountId] = useState<Record<string, string>>({})

  useEffect(() => {
    if (selectionMode !== 'single') return
    if (selectedAccountIds.length <= 1) return
    const keep = String(selectedAccountIds[0] || '')
    if (!keep) return
    setSelectedAccountIds([keep])
    setRoleByAccountId((m) => ({ ...m, [keep]: m[keep] || defaultRoleModuleId }))
  }, [selectionMode, selectedAccountIds.join('|'), defaultRoleModuleId])

  useEffect(() => {
    const loadAccounts = async () => {
      if (!manufacturerId) {
        setManufacturerAccounts([])
        return
      }
      try {
        const resp = await apiClient.get(`/manufacturers/${manufacturerId}/accounts`)
        const list = resp.data?.data || []
        setManufacturerAccounts(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('加载厂家账号失败:', e)
        setManufacturerAccounts([])
      }
    }
    loadAccounts()
  }, [manufacturerId])

  useEffect(() => {
    const loadOrgs = async () => {
      try {
        const resp = await apiClient.get('/accounts/organizations', { params: { limit: 200 } })
        const list = resp.data?.data?.list || resp.data?.data || resp.data?.list || []
        const map: Record<string, { name: string; type?: string }> = {}
        ;(Array.isArray(list) ? list : []).forEach((o: any) => {
          const id = String(o?._id || o?.id || '')
          if (!id) return
          map[id] = { name: String(o?.name || id), type: o?.type ? String(o.type) : undefined }
        })
        setOrganizationsById(map)
      } catch {
        setOrganizationsById({})
      }
    }
    loadOrgs()
  }, [])

  const toggleAccountGroup = (groupId: string) => {
    setExpandedAccountGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const toggleSelectAccount = (id: string) => {
    setSelectedAccountIds(prev => {
      const exists = prev.includes(id)
      if (selectionMode === 'single') {
        const next = exists ? [] : [id]
        if (next.length === 1) {
          setRoleByAccountId((m) => ({ ...m, [id]: m[id] || defaultRoleModuleId }))
        }
        return next
      }
      const next = exists ? prev.filter(x => x !== id) : [...prev, id]
      if (!exists) {
        setRoleByAccountId((m) => ({ ...m, [id]: m[id] || defaultRoleModuleId }))
      }
      return next
    })
  }

  const getAccountTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      auth: '主账号',
      sub: '子账号',
      designer: '设计师',
      normal: '普通账号'
    }
    return labels[type] || '其他'
  }

  const getOrgLabel = (orgId: string) => {
    if (!orgId || orgId === 'no-org') return '未归属组织'
    return organizationsById[orgId]?.name || orgId
  }

  const availableAccounts = useMemo(() => {
    return (manufacturerAccounts || [])
      .filter(a => !existingUserIds.includes(String(a._id)))
      .filter(a => {
        if (!accountKeyword.trim()) return true
        const t = `${a.username || ''} ${a.nickname || ''} ${a.phone || ''}`.toLowerCase()
        return t.includes(accountKeyword.trim().toLowerCase())
      })
  }, [manufacturerAccounts, existingUserIds, accountKeyword])

  const groupedAccounts = useMemo(() => {
    const hasOrg = availableAccounts.some(a => !!(a?.organizationId || a?.organization?._id))

    if (hasOrg) {
      const map = new Map<string, any[]>()
      availableAccounts.forEach((a) => {
        const orgId = String(a?.organizationId || a?.organization?._id || 'no-org')
        const k = `org:${orgId}`
        const arr = map.get(k) || []
        arr.push(a)
        map.set(k, arr)
      })

      const entries = Array.from(map.entries()).map(([key, accounts]) => {
        const orgId = key.replace('org:', '')
        return {
          key,
          orgId,
          type: 'org',
          label: getOrgLabel(orgId),
          accounts,
        }
      })

      entries.sort((a, b) => getOrgLabel(a.orgId).localeCompare(getOrgLabel(b.orgId)))
      return entries
    }

    const map = new Map<string, any[]>()
    availableAccounts.forEach((a) => {
      const type = String(a?.accountType || 'unknown')
      const arr = map.get(type) || []
      arr.push(a)
      map.set(type, arr)
    })

    const order = ['auth', 'sub', 'designer', 'normal', 'unknown']
    return order
      .filter(k => map.has(k))
      .map(k => ({ key: k, orgId: '', type: k, label: getAccountTypeLabel(k), accounts: map.get(k) || [] }))
  }, [availableAccounts, organizationsById])

  const groupedKeys = useMemo(() => {
    return groupedAccounts.map((g: any) => String(g?.key || '')).filter(Boolean).join('|')
  }, [groupedAccounts])

  useEffect(() => {
    const hasOrgGroups = groupedAccounts.some((g: any) => String(g?.key || '').startsWith('org:'))
    if (!hasOrgGroups) return

    setExpandedAccountGroups(prev => {
      const anyOrgExpanded = Array.from(prev).some(k => String(k).startsWith('org:'))
      if (anyOrgExpanded) return prev
      return new Set(groupedAccounts.map((g: any) => String(g.key)))
    })
  }, [groupedKeys])

  const selectedAccounts = useMemo(() => {
    const set = new Set(selectedAccountIds.map(String))
    return (manufacturerAccounts || []).filter(a => set.has(String(a._id)))
  }, [manufacturerAccounts, selectedAccountIds])

  const toggleSelectGroup = (groupKey: string) => {
    if (selectionMode === 'single') return
    const group = groupedAccounts.find(g => g.key === groupKey)
    if (!group) return
    const ids = group.accounts.map((a: any) => String(a._id))
    setSelectedAccountIds(prev => {
      const prevSet = new Set(prev.map(String))
      const allSelected = ids.every(id => prevSet.has(id))
      const next = allSelected
        ? prev.filter(id => !ids.includes(String(id)))
        : Array.from(new Set([...prev, ...ids]))

      if (!allSelected) {
        setRoleByAccountId((m) => {
          const mm = { ...m }
          ids.forEach((id) => {
            mm[id] = mm[id] || defaultRoleModuleId
          })
          return mm
        })
      }

      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAccountIds.length === 0) {
      toast.error('请选择要绑定的账号')
      return
    }

    const missingRole = selectedAccounts.find((a) => {
      const id = String(a?._id || '')
      return !String(roleByAccountId[id] || '')
    })
    if (missingRole) {
      toast.error('请为已选账号选择角色')
      return
    }

    const payload = selectedAccounts.map((a) => {
      const id = String(a._id)
      return {
        accountId: id,
        username: String(a.username || ''),
        nickname: String(a.nickname || a.username || ''),
        phone: String(a.phone || ''),
        roleModuleId: String(roleByAccountId[id] || '')
      }
    })

    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <form onSubmit={handleSubmit} className="absolute right-0 top-0 h-full w-full max-w-[920px] bg-white rounded-l-[4rem] shadow-2xl flex flex-col overflow-hidden">
        <div className="p-12 border-b bg-white space-y-6">
          <div className="flex justify-between items-center gap-6">
            <div className="min-w-0">
              <h3 className="text-4xl font-black text-gray-900 mb-3">绑定人员</h3>
              <p className="text-sm text-gray-500 font-medium truncate">
                已选 {selectedAccountIds.length} 人 • 最低折扣继承下限 {Math.floor(Number(parentMinDiscountPct || 0))}%
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <select
                value={selectionMode}
                onChange={(e) => setSelectionMode(e.target.value as any)}
                className="px-4 py-3 rounded-2xl border border-gray-200 bg-white text-xs font-black"
              >
                <option value="multiple">多选</option>
                <option value="single">单选</option>
              </select>
              <div className="relative w-[360px]">
                <input
                  type="text"
                  value={accountKeyword}
                  onChange={(e) => setAccountKeyword(e.target.value)}
                  placeholder="搜索账号（用户名/昵称/手机号）"
                  className="w-full pl-6 pr-6 py-4 bg-gray-50 border rounded-2xl text-sm font-bold shadow-inner focus:ring-2 focus:ring-[#153e35] outline-none transition-all"
                />
              </div>
              <button type="button" onClick={onClose} className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-rose-500 transition-all">
                <X className="w-8 h-8" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 space-y-4 custom-scrollbar bg-[#fcfdfd]">
          {groupedAccounts.length === 0 ? (
            <div className="text-sm text-gray-500 py-10">暂无可绑定账号</div>
          ) : (
            groupedAccounts.map((group: any) => {
              const groupIds = group.accounts.map((a: any) => String(a._id))
              const selectedSet = new Set(selectedAccountIds.map(String))
              const groupAllSelected = selectionMode === 'multiple' && groupIds.length > 0 && groupIds.every((id: string) => selectedSet.has(id))
              const groupExpanded = expandedAccountGroups.has(group.key)

              return (
                <div key={group.key} className="bg-white border border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                  <div className="p-8 flex items-center justify-between gap-6">
                    <button
                      type="button"
                      onClick={() => toggleAccountGroup(group.key)}
                      className="flex items-center gap-4 min-w-0"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600">
                        {groupExpanded ? <ChevronDown className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xl font-black text-gray-900 truncate">{group.label}</div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{group.accounts.length} 个账号</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      disabled={selectionMode === 'single'}
                      onClick={() => toggleSelectGroup(group.key)}
                      className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectionMode === 'single' ? 'bg-gray-50 text-gray-300 border-gray-100' : (groupAllSelected ? 'bg-[#153e35] text-white border-[#153e35] shadow-lg' : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200')}`}
                    >
                      {groupAllSelected ? '取消全选' : '全选'}
                    </button>
                  </div>

                  {groupExpanded ? (
                    <div className="px-6 pb-8 space-y-3">
                      {group.accounts.map((a: any) => {
                        const id = String(a._id)
                        const checked = selectedAccountIds.includes(id)
                        const typeLabel = getAccountTypeLabel(String(a?.accountType || 'unknown'))
                        const roleId = String(roleByAccountId[id] || '')
                        return (
                          <div
                            key={id}
                            className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between gap-6 ${checked ? 'border-[#153e35] ring-4 ring-emerald-50 bg-white shadow-xl' : 'border-gray-100 bg-white hover:border-emerald-100 shadow-sm'}`}
                          >
                            <button
                              type="button"
                              onClick={() => toggleSelectAccount(id)}
                              className="flex items-center gap-6 min-w-0 text-left"
                            >
                              {selectionMode === 'single' ? (
                                <input
                                  type="radio"
                                  name="tier-bind-account"
                                  checked={checked}
                                  onChange={() => toggleSelectAccount(id)}
                                  className="w-6 h-6 accent-[#153e35]"
                                />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleSelectAccount(id)}
                                  className="w-6 h-6 accent-[#153e35]"
                                />
                              )}
                              <div className="min-w-0">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="text-base font-black text-gray-900 truncate">{a.nickname || a.username || id}</div>
                                  <span className="text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest bg-gray-50 text-gray-500 border border-gray-100">
                                    {typeLabel}
                                  </span>
                                </div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1 truncate">
                                  {a.username ? `@${a.username}` : ''}{a.phone ? ` • ${a.phone}` : ''}
                                </div>
                              </div>
                            </button>

                            <div className="flex items-center gap-3 shrink-0">
                              <select
                                value={roleId}
                                disabled={!checked || activeModules.length === 0}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setRoleByAccountId((m) => ({ ...m, [id]: v }))
                                }}
                                className={`w-56 bg-gray-50 border rounded-2xl px-4 py-3 text-xs font-black shadow-inner focus:ring-2 focus:ring-[#153e35] outline-none ${!checked ? 'opacity-50' : ''}`}
                              >
                                <option value="">选择角色</option>
                                {activeModules.map((m) => (
                                  <option key={m._id} value={m._id}>{m.name}</option>
                                ))}
                              </select>

                              {checked ? (
                                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                  <Check className="w-6 h-6" />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>

        <div className="p-12 border-t bg-white flex gap-6 shrink-0 shadow-inner">
          <button type="button" onClick={onClose} className="flex-grow rounded-3xl py-6 font-black uppercase text-xs tracking-widest border-2 border-gray-200 bg-white hover:bg-gray-50">
            取消
          </button>
          <button type="submit" className="flex-grow rounded-3xl py-6 bg-[#153e35] text-white font-black shadow-2xl uppercase text-xs tracking-widest">
            确认绑定
          </button>
        </div>
      </form>
    </div>
  )
}
