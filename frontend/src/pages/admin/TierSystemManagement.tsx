import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  Plus, Edit2, Trash2, ChevronDown, ChevronRight, Users, 
  Building2, Percent, Settings, Eye, Save, X, AlertCircle,
  TrendingUp, GitBranch, Layers, UserCheck, Store, Briefcase,
  BarChart3, ArrowRight, Check
} from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

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

// 分层体系存储结构
interface TierSystemData {
  profitSettings: {
    minSaleDiscountRate: number
  }
  roleModules: RoleModule[]
  authorizedAccounts: AuthorizedAccount[]
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

const createDefaultTierSystemData = (): TierSystemData => {
  return {
    profitSettings: {
      minSaleDiscountRate: 1
    },
    roleModules: DEFAULT_ROLE_MODULES.map((m, i) => ({
      ...m,
      _id: `role_${m.code}_${Date.now() + i}`,
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
    authorizedAccounts: []
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
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['__root__']))

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
        setExpandedNodes(new Set())
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
          const next: TierSystemData = {
            profitSettings: {
              minSaleDiscountRate: Number(doc?.profitSettings?.minSaleDiscountRate ?? 1)
            },
            roleModules: Array.isArray(doc.roleModules) ? doc.roleModules : [],
            authorizedAccounts: Array.isArray(doc.authorizedAccounts) ? doc.authorizedAccounts : [],
          }

          if (!next.roleModules || next.roleModules.length === 0) {
            next.roleModules = createDefaultTierSystemData().roleModules
          }

          setData(next)
        }
      } catch (e) {
        console.error('加载分层体系数据失败:', e)
        setData(createDefaultTierSystemData())
      } finally {
        setSelectedModule(null)
        setExpandedNodes(new Set())
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页头 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分层体系管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理分层组织架构、收益设置和返佣对账</p>
        <div className="mt-4 flex items-center gap-3">
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span>厂家</span>
          </div>
          {lockedManufacturerId ? (
            <span className="text-sm text-gray-900">
              {(user as any)?.manufacturerName || (user as any)?.manufacturer?.name || lockedManufacturerId}
            </span>
          ) : (
            <select
              value={selectedManufacturerId}
              onChange={(e) => setSelectedManufacturerId(e.target.value)}
              className="input"
              disabled={!isSuperAdmin}
            >
              <option value="">-- 请选择厂家 --</option>
              {manufacturers.map(m => (
                <option key={m._id} value={m._id}>
                  {m.name || m.fullName || m._id}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* 标签切换 */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-8">
          <TabButton 
            active={activeTab === 'hierarchy'} 
            onClick={() => setActiveTab('hierarchy')}
            icon={<GitBranch className="w-4 h-4" />}
            label="分层组织架构"
          />
          <TabButton 
            active={activeTab === 'pool'} 
            onClick={() => setActiveTab('pool')}
            icon={<BarChart3 className="w-4 h-4" />}
            label="收益设置"
          />
          <TabButton
            active={activeTab === 'reconciliation'}
            onClick={() => setActiveTab('reconciliation')}
            icon={<TrendingUp className="w-4 h-4" />}
            label="返佣对账"
          />
        </div>
      </div>

      {/* 内容区域 */}
      {activeTab === 'pool' && (
        <ProfitPoolTab 
          modules={data.roleModules}
          profitSettings={data.profitSettings}
          onUpdateProfitSettings={updateProfitSettings}
          onUpdateModule={updateRoleModule}
          commissionRate={selectedManufacturerCommission}
          onUpdateCommissionRate={async (rate) => {
            const mid = lockedManufacturerId || selectedManufacturerId || ''
            if (!mid) return
            if (!isSuperAdmin) return
            setSelectedManufacturerCommission(rate)
            await apiClient.put(`/manufacturers/${mid}`, { defaultCommission: rate })
          }}
          commissionEditable={isSuperAdmin && !lockedManufacturerId}
        />
      )}
      
      {activeTab === 'hierarchy' && (
        <HierarchyTab 
          modules={data.roleModules}
          accounts={data.authorizedAccounts}
          manufacturerId={lockedManufacturerId || selectedManufacturerId || ''}
          manufacturerName={selectedManufacturerMeta?.name || (user as any)?.manufacturerName || (user as any)?.manufacturer?.name || ''}
          manufacturerLogo={selectedManufacturerMeta?.logo || ''}
          profitSettings={data.profitSettings}
          commissionRate={selectedManufacturerCommission}
          onBack={() => navigate('/admin/manufacturers')}
          expandedNodes={expandedNodes}
          onToggleNode={(id) => {
            const newExpanded = new Set(expandedNodes)
            if (newExpanded.has(id)) {
              newExpanded.delete(id)
            } else {
              newExpanded.add(id)
            }
            setExpandedNodes(newExpanded)
          }}
          onSaveAccounts={(accounts) => {
            const nextModules = (data.roleModules || []).map((m) => {
              const sumRoot = (accounts || [])
                .filter(a => String(a.roleModuleId) === String(m._id) && !a.parentId)
                .reduce((s, a) => s + Number(a.allocatedRate || 0), 0)
              return { ...m, currentAllocatedRate: sumRoot }
            })
            saveData({ ...data, roleModules: nextModules, authorizedAccounts: accounts })
              .then(() => toast.success('保存成功'))
              .catch(() => toast.error('保存失败'))
          }}
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
  const [rows, setRows] = useState<ReconciliationRow[]>([])
  const [meta, setMeta] = useState<{ manufacturerName?: string; commissionRate?: number } | null>(null)

  useEffect(() => {
    const run = async () => {
      if (!manufacturerId) {
        setRows([])
        setMeta(null)
        return
      }

      setLoading(true)
      try {
        const params: any = { _ts: Date.now() }
        if (isSuperAdmin && !lockedManufacturerId) params.manufacturerId = manufacturerId
        const resp = await apiClient.get('/tier-system/reconciliation', { params })
        const data = resp.data?.data
        const list = data?.list || []
        setRows(Array.isArray(list) ? list : [])
        setMeta({ manufacturerName: data?.manufacturerName, commissionRate: data?.commissionRate })
      } catch (e) {
        setRows([])
        setMeta(null)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [manufacturerId, isSuperAdmin, lockedManufacturerId])

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">返佣对账</h3>
          <p className="text-sm text-gray-500 mt-1">
            {meta?.manufacturerName ? `厂家：${meta.manufacturerName}；` : ''}
            {meta?.commissionRate !== undefined ? `返佣比例：${meta.commissionRate}%` : '返佣比例：--'}
          </p>
        </div>

        {loading ? (
          <div className="p-6 text-gray-500">加载中...</div>
        ) : rows.length === 0 ? (
          <div className="p-6 text-gray-500">暂无对账数据（需要有已完成的厂家订单才会产生流水）</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {rows.map(r => (
              <div key={`${r.date}-${r.manufacturerId}`} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs">对账周期</div>
                    <div className="font-semibold text-gray-900">{r.date}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs">归属机构</div>
                    <div className="font-semibold text-gray-900">{r.manufacturerName || '--'}</div>
                  </div>
                  <div className="text-sm">
                    <div className="text-gray-500 text-xs">订单数</div>
                    <div className="font-semibold text-gray-900">{Number(r.orderCount || 0)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-gray-500 text-xs">成交额</div>
                    <div className="font-semibold text-gray-900">¥{Number(r.totalAmount || 0).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500 text-xs">分兑金额</div>
                    <div className="font-semibold text-emerald-600">¥{Number(r.settlementAmount || 0).toLocaleString()}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                    {r.status === 'done' ? '已核算' : '待处理'}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
      className={`pb-3 px-1 border-b-2 transition-colors flex items-center gap-2 ${
        active
          ? 'border-primary-600 text-primary-600 font-medium'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 左侧：模块列表 */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900">角色模块列表</h3>
            <p className="text-xs text-gray-500 mt-1">点击模块编辑折扣规则</p>
          </div>
          <div className="divide-y divide-gray-100">
            {modules.sort((a, b) => a.sortOrder - b.sortOrder).map(module => {
              const Icon = ICON_MAP[module.icon] || Layers
              return (
                <button
                  key={module._id}
                  onClick={() => onSelectModule(module)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedModule?._id === module._id ? 'bg-primary-50 border-l-4 border-primary-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      module.isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{module.name}</span>
                        {!module.isActive && (
                          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">已禁用</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{module.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>毛利上限: <strong className="text-primary-600">{module.maxProfitRate}%</strong></span>
                    <span>规则数: {module.discountRules.length}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 右侧：模块详情和规则编辑 */}
      <div className="lg:col-span-2">
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
                    onClick={() => onUpdateModule(selectedModule._id, { isActive: !selectedModule.isActive })}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      selectedModule.isActive 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {selectedModule.isActive ? '已启用' : '已禁用'}
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
                <button
                  onClick={() => {
                    setEditingRule(null)
                    setShowRuleModal(true)
                  }}
                  className="btn btn-primary btn-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  添加规则
                </button>
              </div>

              {selectedModule.discountRules.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Settings className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">暂无折扣规则</p>
                  <button
                    onClick={() => {
                      setEditingRule(null)
                      setShowRuleModal(true)
                    }}
                    className="mt-2 text-primary-600 hover:text-primary-700 text-sm"
                  >
                    添加第一条规则
                  </button>
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
                          {(rule.conditions.minOrderAmount || rule.conditions.minOrderCount) && (
                            <div className="mt-2 text-xs text-gray-500">
                              条件: 
                              {rule.conditions.minOrderAmount && ` 最低订单金额 ¥${rule.conditions.minOrderAmount}`}
                              {rule.conditions.minOrderCount && ` 最低订单数 ${rule.conditions.minOrderCount}`}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
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
    commissionRate: rule?.commissionRate || 0.05,
    minOrderAmount: rule?.conditions.minOrderAmount || 0,
    minOrderCount: rule?.conditions.minOrderCount || 0
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
      conditions: {
        minOrderAmount: formData.minOrderAmount || undefined,
        minOrderCount: formData.minOrderCount || undefined
      }
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低订单金额</label>
              <input
                type="number"
                min="0"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: parseInt(e.target.value) || 0 })}
                className="input w-full"
                placeholder="0表示无限制"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">最低订单数</label>
              <input
                type="number"
                min="0"
                value={formData.minOrderCount}
                onChange={(e) => setFormData({ ...formData, minOrderCount: parseInt(e.target.value) || 0 })}
                className="input w-full"
                placeholder="0表示无限制"
              />
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

// ==================== 毛利池管理标签页 ====================

function ProfitPoolTab({
  modules,
  profitSettings,
  onUpdateProfitSettings,
  onUpdateModule,
  commissionRate,
  onUpdateCommissionRate,
  commissionEditable
}: {
  modules: RoleModule[]
  profitSettings: { minSaleDiscountRate: number }
  onUpdateProfitSettings: (updates: { minSaleDiscountRate: number }) => void
  onUpdateModule: (id: string, updates: Partial<RoleModule>) => void
  commissionRate?: number
  onUpdateCommissionRate?: (rate: number) => void
  commissionEditable?: boolean
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState(0)

  const discountPercent = Math.round(Number(profitSettings?.minSaleDiscountRate ?? 1) * 100)
  const commissionPercent = Math.round(Number(commissionRate || 0))

  return (
    <div className="space-y-6">
      <div className="max-w-6xl mx-auto bg-white p-10 md:p-12 rounded-[2.5rem] border border-gray-50 shadow-sm space-y-12">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">全链条最低折扣限制 (%)</label>
              <span className="text-5xl font-black text-gray-900">{discountPercent}%</span>
            </div>
            <input
              type="range"
              className="w-full h-4 rounded-full appearance-none bg-emerald-100 accent-[#153e35]"
              min="0"
              max="100"
              step="1"
              value={discountPercent}
              onChange={(e) => onUpdateProfitSettings({ minSaleDiscountRate: (parseInt(e.target.value) || 0) / 100 })}
            />
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400">总佣金池最大占比 (%)</label>
              <span className="text-5xl font-black text-emerald-600">{commissionPercent}%</span>
            </div>
            <input
              type="range"
              className="w-full h-4 rounded-full appearance-none bg-emerald-100 accent-emerald-500"
              min="0"
              max="100"
              step="1"
              value={commissionPercent}
              onChange={(e) => {
                const v = parseInt(e.target.value) || 0
                onUpdateCommissionRate?.(v)
              }}
              disabled={!commissionEditable}
            />
            {!commissionEditable ? (
              <div className="text-xs text-gray-400">仅管理员可修改</div>
            ) : null}
          </div>
      </div>
    </div>
  )
}

// ==================== 授权层级标签页 ====================

function HierarchyTab({
  modules,
  accounts,
  manufacturerId,
  manufacturerName,
  manufacturerLogo,
  profitSettings,
  commissionRate,
  onBack,
  expandedNodes,
  onToggleNode,
  onSaveAccounts
}: {
  modules: RoleModule[]
  accounts: AuthorizedAccount[]
  manufacturerId: string
  manufacturerName: string
  manufacturerLogo: string
  profitSettings: TierSystemData['profitSettings']
  commissionRate: number
  onBack: () => void
  expandedNodes: Set<string>
  onToggleNode: (id: string) => void
  onSaveAccounts: (accounts: AuthorizedAccount[]) => void
}) {
  const [selectedModuleCode, setSelectedModuleCode] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [parentAccount, setParentAccount] = useState<AuthorizedAccount | null>(null)
  const [manufacturerCategoryTree, setManufacturerCategoryTree] = useState<any[]>([])
  const [manufacturerProducts, setManufacturerProducts] = useState<any[]>([])

  useEffect(() => {
    const loadCategoriesAndProducts = async () => {
      if (!manufacturerId) {
        setManufacturerCategoryTree([])
        setManufacturerProducts([])
        return
      }
      try {
        const [catResp, prodResp] = await Promise.all([
          apiClient.get('/categories', { params: { manufacturerId, _ts: Date.now() } }),
          apiClient.get(`/manufacturers/${manufacturerId}/products`, { params: { status: 'all', limit: 5000 } })
        ])

        const catList = catResp.data?.data || []
        setManufacturerCategoryTree(Array.isArray(catList) ? catList : [])

        const prodList = prodResp.data?.data || []
        setManufacturerProducts(Array.isArray(prodList) ? prodList : [])
      } catch (e) {
        console.error('加载厂家分类/商品失败:', e)
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

  // 添加账号
  const handleAddAccount = (data: {
    accountId: string
    username: string
    nickname: string
    phone: string
    roleModuleId: string
    discountRuleId: string
    allocatedRate: number
    distributionRate: number
    visibleCategoryIds: string[]
  }) => {
    if (!manufacturerId) {
      toast.error('请先选择厂家')
      return
    }

    if (!data.accountId) {
      toast.error('请选择要绑定的账号')
      return
    }

    if (accounts.some(a => String(a.userId) === String(data.accountId))) {
      toast.error('该账号已绑定在授权层级中')
      return
    }

    const module = modules.find(m => m._id === data.roleModuleId)
    if (!module) {
      toast.error('请选择角色模块')
      return
    }

    if (!data.discountRuleId) {
      toast.error('请选择折扣规则')
      return
    }

    const ruleExists = (module.discountRules || []).some(r => String(r._id) === String(data.discountRuleId))
    if (!ruleExists) {
      toast.error('折扣规则无效，请重新选择')
      return
    }

    // 检查比例是否超限
    let maxAvailable = module.maxProfitRate - module.currentAllocatedRate
    
    // 计算当前模块已分配的总比例
    const currentModuleAllocated = accounts
      .filter(a => a.roleModuleId === data.roleModuleId && !a.parentId)
      .reduce((sum, a) => sum + a.allocatedRate, 0)
    
    if (parentAccount) {
      maxAvailable = parentAccount.availableRate
    } else {
      maxAvailable = module.maxProfitRate - currentModuleAllocated
    }
    
    if (data.allocatedRate > maxAvailable) {
      toast.error(`分配比例不能超过可用额度 ${maxAvailable.toFixed(1)}%`)
      return
    }

    const siblingDistributionSum = accounts
      .filter(a => String(a.parentId || '') === String(parentAccount?._id || ''))
      .reduce((sum, a) => sum + Number((a as any).distributionRate ?? 0), 0)
    const maxDistribution = 100 - siblingDistributionSum
    if (data.distributionRate > maxDistribution) {
      toast.error(`垂直权重不能超过可用额度 ${Math.max(0, maxDistribution).toFixed(0)}%`)
      return
    }

    const newAccount: AuthorizedAccount = {
      _id: `account_${Date.now()}`,
      userId: data.accountId,
      username: data.username,
      nickname: data.nickname,
      phone: data.phone,
      roleModuleId: data.roleModuleId,
      roleModuleName: module.name,
      discountRuleId: data.discountRuleId,
      parentId: parentAccount?._id || null,
      parentName: parentAccount?.username,
      level: parentAccount ? parentAccount.level + 1 : 1,
      allocatedRate: data.allocatedRate,
      availableRate: data.allocatedRate,
      distributionRate: Number.isFinite(data.distributionRate) ? data.distributionRate : 0,
      visibleCategoryIds: data.visibleCategoryIds,
      children: [],
      status: 'active',
      createdAt: new Date().toISOString()
    }

    let nextAccounts = [...accounts, newAccount]
    if (parentAccount) {
      nextAccounts = nextAccounts.map(a => {
        if (String(a._id) !== String(parentAccount._id)) return a
        const prevAvail = Number(a.availableRate || 0)
        return { ...a, availableRate: Math.max(0, prevAvail - Number(data.allocatedRate || 0)) }
      })
    }

    onSaveAccounts(nextAccounts)
    setShowAddModal(false)
    setParentAccount(null)
    toast.success('账号添加成功')
  }

  const listPrice = 10000
  const minSaleDiscountRate = Number(profitSettings?.minSaleDiscountRate ?? 1)

  const calc = (dist: number) => {
    const minPrice = listPrice * minSaleDiscountRate
    const maxCommPool = minPrice * (Number(commissionRate || 0) / 100)
    const nodeCommValue = maxCommPool * (Number(dist || 0) / 100)
    return { minPrice, nodeCommValue }
  }

  const getNodeProductCount = (a: AuthorizedAccount) => {
    const ids = Array.isArray(a.visibleCategoryIds) ? a.visibleCategoryIds : []
    if (ids.length > 0) return ids.length
    return manufacturerProducts.length
  }

  const siblingsOfBubble = (account: AuthorizedAccount) => {
    return filteredAccounts.filter(a => String(a.parentId || '') === String(account.parentId || '') && String(a._id) !== String(account._id))
  }

  const renderBubbleNode = (account: AuthorizedAccount): any => {
    const children = getChildren(account._id)
    const hasChildren = children.length > 0
    const isExpanded = expandedNodes.has(account._id)
    const displayName = account.nickname || account.username

    const distributionRate = Number((account as any).distributionRate ?? 0)
    const siblings = siblingsOfBubble(account)
    const siblingsSum = siblings.reduce((s, a) => s + Number((a as any).distributionRate ?? 0), 0)
    const maxDistribution = Math.max(0, 100 - siblingsSum)
    const { minPrice, nodeCommValue } = calc(distributionRate)

    return (
      <div key={account._id} className="flex flex-col items-center shrink-0">
        <div className="w-80 p-8 rounded-[3rem] bg-white border-2 shadow-2xl relative transition-all duration-500 border-emerald-50 hover:border-[#153e35]">
          <div className="flex items-center justify-between mb-6">
            <div className="min-w-0">
              <h5 className="text-base font-black text-gray-900 truncate">{displayName}</h5>
              <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full border tracking-widest mt-1 inline-block bg-emerald-50 text-emerald-600 border-emerald-100">
                自研节点
              </span>
            </div>
            <span className="text-xs font-black text-[#153e35] bg-gray-50 px-3 py-1 rounded-xl">{distributionRate}%</span>
          </div>

          <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-4 relative overflow-hidden">
            <div className="flex justify-between items-end">
              <div className="text-[10px]">
                <p className="text-gray-400 font-bold uppercase">成交受限价</p>
                <p className="font-black text-gray-900 text-lg">¥{minPrice.toLocaleString()}</p>
              </div>
              <div className="text-[10px] text-right">
                <p className="text-gray-400 font-bold uppercase">垂直所得</p>
                <p className="font-black text-emerald-600 text-lg">¥{nodeCommValue.toLocaleString()}</p>
              </div>
            </div>
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden shadow-inner">
              <div className="bg-[#153e35] h-full transition-all duration-1000" style={{ width: `${Math.max(0, Math.min(100, distributionRate))}%` }} />
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                setParentAccount(account)
                setShowAddModal(true)
              }}
              className="text-[10px] font-black flex items-center gap-1 text-blue-500 hover:underline"
            >
              + 添加下级
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-bold text-gray-400 uppercase">垂直权重%</span>
              <input
                type="number"
                min={0}
                max={maxDistribution}
                defaultValue={distributionRate}
                onBlur={(e) => {
                  const v = Math.max(0, Math.min(maxDistribution, parseFloat(e.target.value) || 0))
                  const next = (accounts || []).map(a => {
                    if (String(a._id) !== String(account._id)) return a
                    return { ...a, distributionRate: v }
                  })
                  onSaveAccounts(next)
                }}
                className="w-12 bg-white border border-gray-100 rounded-lg text-[10px] text-center font-black outline-none"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] text-gray-400 font-bold">
            <span>管理库房 ({getNodeProductCount(account)})</span>
            <span>授权额度 {Number(account.allocatedRate || 0)}%</span>
          </div>

          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggleNode(account._id)}
              className={`absolute -bottom-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-2xl border border-gray-100 flex items-center justify-center text-[#153e35] hover:bg-[#153e35] hover:text-white transition-all ${isExpanded ? 'rotate-180' : ''}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
            </button>
          ) : null}
        </div>

        {hasChildren && isExpanded ? (
          <div className="flex flex-col items-center">
            <div className="w-px h-12 bg-emerald-100" />
            <div className="flex gap-16 relative px-12">
              <div className="absolute top-0 left-12 right-12 h-px bg-emerald-100" />
              {children.map(renderBubbleNode)}
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 筛选和操作栏 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <select
            value={selectedModuleCode}
            onChange={(e) => setSelectedModuleCode(e.target.value)}
            className="input"
          >
            <option value="all">全部业务线</option>
            {modules.filter(m => m.isActive).map(m => (
              <option key={m._id} value={m.code}>{m.name}</option>
            ))}
          </select>
          <span className="text-sm text-gray-500">共 {filteredAccounts.length} 个账号</span>
        </div>
        <button type="button" onClick={onBack} className="btn btn-secondary">
          返回管理中心
        </button>
      </div>

      {/* 层级树 */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b bg-white flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 min-w-0">
            <div className="w-16 h-16 bg-white rounded-[1.5rem] border shadow-sm p-2 flex items-center justify-center overflow-hidden">
              {manufacturerLogo ? (
                <img src={manufacturerLogo} alt={manufacturerName || 'manufacturer'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-50 rounded-xl" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight truncate">分层组织架构</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs truncate">
                {manufacturerName || manufacturerId} • 基于垂直{Number(commissionRate || 0)}%佣金池独立分发
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setParentAccount(null)
              setShowAddModal(true)
            }}
            className="bg-[#153e35] px-8 py-4 rounded-[1.5rem] text-white font-black shadow-xl"
            type="button"
          >
            + 新建垂直体系分支
          </button>
        </div>

        <div className="p-8 bg-[#fcfdfd]">
          {rootAccounts.length === 0 ? (
            <div className="text-center py-24">
              <GitBranch className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500">暂无授权账号</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="mt-3 text-primary-600 hover:text-primary-700 text-sm"
              >
                添加第一个账号
              </button>
            </div>
          ) : (
            <div className="overflow-auto border-2 border-emerald-50 border-dashed rounded-[3rem] p-16 bg-emerald-50/10 min-h-[640px] flex justify-center">
              <div className="origin-top">
                {rootAccounts.map(renderBubbleNode)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 图例说明 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">图例说明</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          {modules.filter(m => m.isActive).map(m => {
            const Icon = ICON_MAP[m.icon] || Layers
            return (
              <div key={m._id} className="flex items-center gap-2">
                <div className="p-1 bg-primary-100 text-primary-600 rounded">
                  <Icon className="w-3 h-3" />
                </div>
                <span className="text-gray-600">{m.name}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 添加账号模态框 */}
      {showAddModal && (
        <AddAccountModal
          modules={modules}
          parentAccount={parentAccount}
          manufacturerId={manufacturerId}
          manufacturerCategoryTree={manufacturerCategoryTree}
          manufacturerProducts={manufacturerProducts}
          authorizedAccounts={accounts}
          existingUserIds={accounts.map(a => String(a.userId))}
          onClose={() => {
            setShowAddModal(false)
            setParentAccount(null)
          }}
          onSave={handleAddAccount}
        />
      )}
    </div>
  )
}

// ==================== 添加账号模态框 ====================

function AddAccountModal({
  modules,
  parentAccount,
  manufacturerId,
  manufacturerCategoryTree,
  manufacturerProducts,
  authorizedAccounts,
  existingUserIds,
  onClose,
  onSave
}: {
  modules: RoleModule[]
  parentAccount: AuthorizedAccount | null
  manufacturerId: string
  manufacturerCategoryTree: any[]
  manufacturerProducts: any[]
  authorizedAccounts: AuthorizedAccount[]
  existingUserIds: string[]
  onClose: () => void
  onSave: (data: {
    accountId: string
    username: string
    nickname: string
    phone: string
    roleModuleId: string
    discountRuleId: string
    allocatedRate: number
    distributionRate: number
    visibleCategoryIds: string[]
  }) => void
}) {
  const [manufacturerAccounts, setManufacturerAccounts] = useState<any[]>([])
  const [accountKeyword, setAccountKeyword] = useState('')
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState<'multiple' | 'single'>('multiple')

  const parentHasCustomVisibility = !!(parentAccount?.visibleCategoryIds && parentAccount.visibleCategoryIds.length > 0)
  const parentVisibleCategoryIds = parentHasCustomVisibility
    ? parentAccount!.visibleCategoryIds!.map(String)
    : []

  const [formData, setFormData] = useState({
    accountId: '',
    roleModuleId: parentAccount?.roleModuleId || modules[0]?._id || '',
    discountRuleId: parentAccount?.discountRuleId || '',
    allocatedRate: 5,
    distributionRate: 0,
    visibilityMode: (parentHasCustomVisibility ? 'custom' : 'all') as 'all' | 'custom',
    visibleCategoryIds: (parentHasCustomVisibility ? parentVisibleCategoryIds : []) as string[]
  })

  const normalizeId = (x: any) => {
    if (!x) return ''
    if (typeof x === 'string') return x
    return String(x._id || x.id || '')
  }

  const getProductCategoryIds = (p: any): string[] => {
    const ids: string[] = []
    const c = p?.category

    const push = (v: any) => {
      const id = normalizeId(v)
      if (id) ids.push(id)
    }

    if (Array.isArray(p?.categories)) {
      p.categories.forEach((cc: any) => push(cc))
    } else if (Array.isArray(c)) {
      c.forEach((cc: any) => push(cc))
    } else if (c) {
      push(c)
      if (typeof c === 'object') {
        push((c as any)._id)
        push((c as any).id)
      }
    }

    return Array.from(new Set(ids.filter(Boolean)))
  }

  const productsByCategoryId = useMemo(() => {
    const map = new Map<string, any[]>()
    ;(manufacturerProducts || []).forEach((p: any) => {
      const ids = getProductCategoryIds(p)
      ids.forEach((cid) => {
        const prev = map.get(cid) || []
        prev.push(p)
        map.set(cid, prev)
      })
    })
    return map
  }, [manufacturerProducts])

  const filterTreeByAllowed = (nodes: any[], allowed: Set<string> | null): any[] => {
    return (nodes || [])
      .map((n: any) => {
        const id = normalizeId(n)
        const rawChildren = Array.isArray(n?.children) ? n.children : []
        const nextChildren = filterTreeByAllowed(rawChildren, allowed)

        const keep = !allowed || allowed.has(id) || nextChildren.length > 0
        if (!keep) return null
        return { ...n, children: nextChildren }
      })
      .filter(Boolean)
  }

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

  const selectedModule = modules.find(m => m._id === formData.roleModuleId)
  const selectedRule = selectedModule?.discountRules?.find(r => String(r._id) === String(formData.discountRuleId))
  const maxRate = parentAccount 
    ? parentAccount.availableRate 
    : (selectedModule ? selectedModule.maxProfitRate - selectedModule.currentAllocatedRate : 0)

  const siblingDistributionSum = useMemo(() => {
    const pid = String(parentAccount?._id || '')
    return (authorizedAccounts || [])
      .filter(a => String(a.parentId || '') === pid)
      .reduce((sum, a) => sum + Number((a as any).distributionRate ?? 0), 0)
  }, [authorizedAccounts, parentAccount?._id])

  const maxDistribution = Math.max(0, 100 - siblingDistributionSum)

  useEffect(() => {
    setFormData(prev => {
      if (prev.distributionRate > maxDistribution) {
        return { ...prev, distributionRate: maxDistribution }
      }
      if (prev.distributionRate === 0 && maxDistribution > 0) {
        return { ...prev, distributionRate: Math.min(100, maxDistribution) }
      }
      return prev
    })
  }, [maxDistribution])

  useEffect(() => {
    if (!selectedModule) return
    const rules = selectedModule.discountRules || []
    if (rules.length === 0) return
    const exists = rules.some(r => String(r._id) === String(formData.discountRuleId))
    if (exists) return

    const defaultRule = rules.find(r => r.isDefault) || rules[0]
    setFormData(prev => ({ ...prev, discountRuleId: String(defaultRule?._id || '') }))
  }, [selectedModule?._id])

  const allowedCategoryIds = parentAccount?.visibleCategoryIds && parentAccount.visibleCategoryIds.length > 0
    ? new Set(parentAccount.visibleCategoryIds.map(String))
    : null
  const effectiveCategoryTree = useMemo(() => {
    return filterTreeByAllowed(manufacturerCategoryTree || [], allowedCategoryIds)
  }, [manufacturerCategoryTree, allowedCategoryIds])

  const toggleExpand = (id: string) => {
    setExpandedCategoryIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCategory = (id: string) => {
    if (allowedCategoryIds && !allowedCategoryIds.has(String(id))) return
    setFormData(prev => {
      const exists = prev.visibleCategoryIds.includes(id)
      if (selectionMode === 'single') {
        return { ...prev, visibleCategoryIds: exists ? [] : [id] }
      }
      return {
        ...prev,
        visibleCategoryIds: exists
          ? prev.visibleCategoryIds.filter(x => x !== id)
          : [...prev.visibleCategoryIds, id]
      }
    })
  }

  const filteredAccounts = manufacturerAccounts
    .filter(a => !existingUserIds.includes(String(a._id)))
    .filter(a => {
      if (!accountKeyword.trim()) return true
      const t = `${a.username || ''} ${a.nickname || ''} ${a.phone || ''}`.toLowerCase()
      return t.includes(accountKeyword.trim().toLowerCase())
    })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const selected = manufacturerAccounts.find(a => String(a._id) === String(formData.accountId))
    if (!selected) {
      toast.error('请选择要绑定的账号')
      return
    }
    if (!formData.roleModuleId) {
      toast.error('请选择角色模块')
      return
    }

    let visibleCategoryIds = formData.visibilityMode === 'custom' ? formData.visibleCategoryIds : []

    if (allowedCategoryIds && formData.visibilityMode === 'all') {
      visibleCategoryIds = Array.from(allowedCategoryIds)
    }

    if (allowedCategoryIds) {
      visibleCategoryIds = visibleCategoryIds.filter(id => allowedCategoryIds.has(String(id)))
    }

    if ((formData.visibilityMode === 'custom' || allowedCategoryIds) && visibleCategoryIds.length === 0) {
      toast.error('请选择至少一个可见品类')
      return
    }

    if (formData.distributionRate > maxDistribution) {
      toast.error(`垂直权重不能超过可用额度 ${maxDistribution}%`)
      return
    }

    onSave({
      accountId: String(selected._id),
      username: String(selected.username || ''),
      nickname: String(selected.nickname || selected.username || ''),
      phone: String(selected.phone || ''),
      roleModuleId: formData.roleModuleId,
      discountRuleId: formData.discountRuleId,
      allocatedRate: formData.allocatedRate,
      distributionRate: formData.distributionRate,
      visibleCategoryIds
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-[720px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-100">
          <h3 className="text-xl font-black text-gray-900">
            {parentAccount ? '添加账号' : '添加账号'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-10 py-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">绑定账号 <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={accountKeyword}
              onChange={(e) => setAccountKeyword(e.target.value)}
              className="input w-full mb-2"
              placeholder="搜索账号（用户名/昵称/手机号）"
            />
            <select
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">-- 请选择账号 --</option>
              {filteredAccounts.map(a => (
                <option key={a._id} value={a._id}>
                  {(a.nickname || a.username) || a._id} {a.username ? `@${a.username}` : ''} {a.phone ? `(${a.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">可见品类</label>
            <select
              value={formData.visibilityMode}
              onChange={(e) => {
                const nextMode = e.target.value as any
                setFormData(prev => ({
                  ...prev,
                  visibilityMode: nextMode,
                  visibleCategoryIds: nextMode === 'custom'
                    ? (parentHasCustomVisibility ? parentVisibleCategoryIds : [])
                    : []
                }))
              }}
              className="input w-full"
            >
              <option value="all">{parentHasCustomVisibility ? '全部（继承上级范围）' : '全部品类'}</option>
              <option value="custom">自定义</option>
            </select>
            {parentAccount?.visibleCategoryIds && parentAccount.visibleCategoryIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">下级可选品类不会超出上级范围</p>
            )}
          </div>

          {formData.visibilityMode === 'custom' && (
            <div className="border border-gray-200 rounded-lg p-3 max-h-56 overflow-y-auto">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="text-xs text-gray-500">树状选择：分类 → 商品（商品仅展示，不保存）</div>
                <select
                  value={selectionMode}
                  onChange={(e) => setSelectionMode(e.target.value as any)}
                  className="input h-8 text-xs"
                >
                  <option value="multiple">多选</option>
                  <option value="single">单选</option>
                </select>
              </div>

              {effectiveCategoryTree.length === 0 ? (
                <p className="text-sm text-gray-500">该厂家暂无可选品类</p>
              ) : (
                <div className="space-y-1">
                  {(function renderTree(nodes: any[], depth: number = 0): any {
                    return nodes.map((n: any) => {
                      const id = normalizeId(n)
                      const children = Array.isArray(n?.children) ? n.children : []
                      const prods = productsByCategoryId.get(id) || []
                      const hasChildren = children.length > 0
                      const hasProducts = prods.length > 0
                      const canExpand = hasChildren || hasProducts
                      const isExpanded = expandedCategoryIds.has(id)
                      const checked = formData.visibleCategoryIds.includes(id)

                      return (
                        <div key={id} style={{ marginLeft: depth * 16 }}>
                          <div className="flex items-center gap-2 hover:bg-gray-50 p-2 rounded">
                            <button
                              type="button"
                              className={`p-1 rounded ${canExpand ? 'hover:bg-gray-200' : ''}`}
                              onClick={() => canExpand && toggleExpand(id)}
                              disabled={!canExpand}
                            >
                              {canExpand ? (
                                isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />
                              ) : (
                                <span className="w-4 h-4" />
                              )}
                            </button>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCategory(id)}
                              className="rounded text-primary"
                            />
                            <span className="text-sm font-medium text-gray-900 truncate">{n?.name || id}</span>
                            <span className="text-xs text-gray-400">
                              {hasProducts ? `${prods.length}商品` : ''}
                            </span>
                          </div>

                          {isExpanded && (
                            <div className="ml-8 border-l border-gray-100 pl-3 space-y-1">
                              {hasProducts && (
                                <div className="space-y-1">
                                  {prods.slice(0, 50).map((p: any) => (
                                    <div key={String(p._id)} className="text-xs text-gray-600 py-0.5 truncate">
                                      {p.name || p.productCode || p._id}
                                    </div>
                                  ))}
                                  {prods.length > 50 && (
                                    <div className="text-xs text-gray-400">仅展示前 50 个商品</div>
                                  )}
                                </div>
                              )}

                              {hasChildren && (
                                <div className="space-y-1">
                                  {renderTree(children, depth + 1)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })
                  })(effectiveCategoryTree)}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色模块 <span className="text-red-500">*</span></label>
            <select
              value={formData.roleModuleId}
              onChange={(e) => setFormData({ ...formData, roleModuleId: e.target.value })}
              className="input w-full"
              disabled={!!parentAccount}
            >
              {modules.filter(m => m.isActive).map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
            {parentAccount && (
              <p className="text-xs text-gray-500 mt-1">下级账号继承上级的角色模块</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              垂直权重 ({formData.distributionRate}%)
            </label>
            <input
              type="range"
              min="0"
              max={maxDistribution}
              step="1"
              value={formData.distributionRate}
              onChange={(e) => setFormData({ ...formData, distributionRate: parseInt(e.target.value) || 0 })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>可用权重: {maxDistribution}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              分配比例 ({formData.allocatedRate}%)
            </label>
            <input
              type="range"
              min="1"
              max={maxRate}
              step="1"
              value={formData.allocatedRate}
              onChange={(e) => setFormData({ ...formData, allocatedRate: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1%</span>
              <span>可分配上限: {maxRate}%</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">折扣规则 <span className="text-red-500">*</span></label>
            <select
              value={formData.discountRuleId}
              onChange={(e) => setFormData({ ...formData, discountRuleId: e.target.value })}
              className="input w-full"
              required
            >
              <option value="">-- 请选择折扣规则 --</option>
              {(selectedModule?.discountRules || []).map(r => (
                <option key={r._id} value={r._id}>
                  {r.name}{r.isDefault ? '（默认）' : ''}
                </option>
              ))}
            </select>
            {selectedRule && (
              <div className="mt-2 text-xs text-gray-500">
                <span className="mr-2">
                  {(() => {
                    const t = selectedRule.discountType || (typeof selectedRule.minDiscountPrice === 'number' ? 'minPrice' : 'rate')
                    if (t === 'minPrice') return `最低价 ¥${Number(selectedRule.minDiscountPrice || 0).toFixed(0)}`
                    const rate = typeof selectedRule.discountRate === 'number' ? selectedRule.discountRate : 1
                    return `折扣 ${(rate * 100).toFixed(0)}%`
                  })()}
                </span>
                <span>返点 {(selectedRule.commissionRate * 100).toFixed(1)}%</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-10 py-3 rounded-2xl bg-[#153e35] text-white font-black shadow-xl"
            >
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
