import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { 
  Plus, Edit2, Trash2, ChevronDown, ChevronRight, Users, 
  Building2, Percent, Settings, Eye, Save, X, AlertCircle,
  TrendingUp, GitBranch, Layers, UserCheck, Store, Briefcase,
  BarChart3, ArrowRight, Check, UserPlus, List, Grid
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
  productOverrides?: Array<{
    productId: string
    discountRate?: number
    commissionRate?: number
  }>
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

  const currentManufacturerName =
    selectedManufacturerMeta?.name ||
    (user as any)?.manufacturerName ||
    (user as any)?.manufacturer?.name ||
    (lockedManufacturerId || selectedManufacturerId || '')

  const currentManufacturerLogo = selectedManufacturerMeta?.logo || (user as any)?.manufacturer?.logo || ''
  const logoSrc = currentManufacturerLogo ? getLogoSrc(currentManufacturerLogo, 160) : ''

  return (
    <div className="p-6 max-w-[1600px] mx-auto">
      {/* 页头 */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mb-8">
        <div className="p-8 flex items-center justify-between gap-8">
          <div className="flex items-center gap-8 min-w-0">
            <div className="w-16 h-16 rounded-2xl border bg-white overflow-hidden flex items-center justify-center">
              {logoSrc ? (
                <img src={logoSrc} alt={currentManufacturerName || 'manufacturer'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-50" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight truncate">分层架构管控系统</h1>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2 truncate">
                {currentManufacturerName || '--'}
              </p>
              {!lockedManufacturerId ? (
                <div className="mt-4">
                  <select
                    value={selectedManufacturerId}
                    onChange={(e) => setSelectedManufacturerId(e.target.value)}
                    className="px-4 py-2 rounded-2xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-600"
                    disabled={!isSuperAdmin}
                  >
                    <option value="">-- 请选择厂家 --</option>
                    {manufacturers.map(m => (
                      <option key={m._id} value={m._id}>
                        {m.name || m.fullName || m._id}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/admin/manufacturers')}
            className="rounded-2xl px-10 py-4 font-black uppercase text-xs border-2 border-gray-100 text-gray-500 hover:text-[#153e35] hover:border-[#153e35] transition-all"
          >
            返回主控
          </button>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-3">
          <TabButton
            active={activeTab === 'hierarchy'}
            onClick={() => setActiveTab('hierarchy')}
            icon={<GitBranch className="w-4 h-4" />}
            label="公司分层"
          />
          <TabButton
            active={activeTab === 'pool'}
            onClick={() => setActiveTab('pool')}
            icon={<BarChart3 className="w-4 h-4" />}
            label="角色权限"
          />
          <TabButton
            active={activeTab === 'reconciliation'}
            onClick={() => setActiveTab('reconciliation')}
            icon={<TrendingUp className="w-4 h-4" />}
            label="分润对账"
          />
        </div>
      </div>

      {/* 内容区域 */}
      {activeTab === 'pool' && (
        <RolesPermissionTab
          modules={data.roleModules}
          profitSettings={data.profitSettings}
          onUpdateProfitSettings={updateProfitSettings}
          commissionRate={selectedManufacturerCommission}
          onUpdateCommissionRate={async (rate) => {
            const mid = lockedManufacturerId || selectedManufacturerId || ''
            if (!mid) return
            if (!isSuperAdmin) return
            setSelectedManufacturerCommission(rate)
            await apiClient.put(`/manufacturers/${mid}`, { defaultCommission: rate })
          }}
          commissionEditable={isSuperAdmin && !lockedManufacturerId}
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
          manufacturerId={lockedManufacturerId || selectedManufacturerId || ''}
          manufacturerName={currentManufacturerName}
          manufacturerLogo={logoSrc}
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
  return (
    <div className="space-y-10">
      <ProfitPoolTab
        modules={modules}
        profitSettings={profitSettings}
        onUpdateProfitSettings={(u) => onUpdateProfitSettings(u)}
        onUpdateModule={onUpdateModule}
        commissionRate={commissionRate}
        onUpdateCommissionRate={onUpdateCommissionRate}
        commissionEditable={commissionEditable}
      />
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
  const [editingRole, setEditingRole] = useState<string | null>(null)
  const [tempRates, setTempRates] = useState<{[key: string]: {sales: number, quantity: number}}>({})

  // 预设角色数据，对应图1的样式
  const roleCards = [
    { 
      id: 'regional_manager', 
      title: '大区店长', 
      icon: '🏢', 
      color: 'bg-blue-500',
      description: '负责区域管理和业务拓展',
      salesRate: 8.5, // 销售额度提成%
      quantityRate: 12.0 // 数量连单提成%
    },
    { 
      id: 'certified_designer', 
      title: '认证设计师', 
      icon: '🎨', 
      color: 'bg-purple-500',
      description: '专业设计师，提供定制方案',
      salesRate: 6.0,
      quantityRate: 8.5
    },
    { 
      id: 'senior_sales', 
      title: '高级销售', 
      icon: '⭐', 
      color: 'bg-orange-500',
      description: '资深销售专员',
      salesRate: 4.5,
      quantityRate: 6.0
    },
    { 
      id: 'regular_sales', 
      title: '普通销售', 
      icon: '👤', 
      color: 'bg-green-500',
      description: '普通销售人员',
      salesRate: 3.0,
      quantityRate: 4.0
    },
    { 
      id: 'channel_partner', 
      title: '渠道合伙人', 
      icon: '🤝', 
      color: 'bg-indigo-500',
      description: '战略合作伙伴',
      salesRate: 10.0,
      quantityRate: 15.0
    },
    { 
      id: 'vip_client', 
      title: 'VIP客户', 
      icon: '💎', 
      color: 'bg-yellow-500',
      description: '优质大客户',
      salesRate: 2.0,
      quantityRate: 3.5
    }
  ]

  const handleEditRole = (roleId: string) => {
    setEditingRole(roleId)
    const role = roleCards.find(r => r.id === roleId)
    if (role) {
      setTempRates({
        ...tempRates,
        [roleId]: {
          sales: role.salesRate,
          quantity: role.quantityRate
        }
      })
    }
  }

  const handleSaveRole = (roleId: string) => {
    // 这里可以保存到后端
    console.log('保存角色提成配置:', roleId, tempRates[roleId])
    setEditingRole(null)
  }

  const handleCancelEdit = () => {
    setEditingRole(null)
    setTempRates({})
  }

  return (
    <div className="space-y-6">
      {/* 全局配置区域 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">全局角色分润底线配置</h2>
            <p className="text-sm text-gray-500 mt-1">设置各角色的销售额度提成和数量连单提成比例</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="bg-gray-50 px-3 py-2 rounded-lg">
              <span className="text-gray-500">全链条最低折扣：</span>
              <span className="font-semibold text-gray-900">{Math.round(Number(profitSettings?.minSaleDiscountRate ?? 1) * 100)}%</span>
            </div>
            <div className="bg-emerald-50 px-3 py-2 rounded-lg">
              <span className="text-emerald-600">总佣金池占比：</span>
              <span className="font-semibold text-emerald-700">{Math.round(Number(commissionRate || 0))}%</span>
            </div>
          </div>
        </div>

        {/* 角色卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roleCards.map((role) => (
            <div key={role.id} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
              {/* 角色头部 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${role.color} rounded-lg flex items-center justify-center text-white text-lg`}>
                    {role.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{role.title}</h3>
                    <p className="text-xs text-gray-500">{role.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditRole(role.id)}
                  className="text-gray-400 hover:text-blue-600 p-1 rounded"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {/* 提成比例显示/编辑 */}
              {editingRole === role.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">销售额度提成%</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tempRates[role.id]?.sales || 0}
                      onChange={(e) => setTempRates({
                        ...tempRates,
                        [role.id]: {
                          ...tempRates[role.id],
                          sales: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">数量连单提成%</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={tempRates[role.id]?.quantity || 0}
                      onChange={(e) => setTempRates({
                        ...tempRates,
                        [role.id]: {
                          ...tempRates[role.id],
                          quantity: parseFloat(e.target.value) || 0
                        }
                      })}
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleSaveRole(role.id)}
                      className="flex-1 bg-blue-600 text-white text-xs py-2 px-3 rounded-lg hover:bg-blue-700"
                    >
                      保存
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-100 text-gray-600 text-xs py-2 px-3 rounded-lg hover:bg-gray-200"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-blue-600 font-medium">销售额度提成</span>
                      <span className="text-lg font-bold text-blue-700">{role.salesRate}%</span>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-green-600 font-medium">数量连单提成</span>
                      <span className="text-lg font-bold text-green-700">{role.quantityRate}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
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
  const [showProductModal, setShowProductModal] = useState(false)
  const [productAccount, setProductAccount] = useState<AuthorizedAccount | null>(null)

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
  const handleAddAccounts = (items: Array<{
    accountId: string
    username: string
    nickname: string
    phone: string
    roleModuleId: string
    discountRuleId: string
    allocatedRate: number
    distributionRate: number
    visibleCategoryIds: string[]
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

    const roleModuleId = String(items[0]?.roleModuleId || '')
    const module = modules.find(m => String(m._id) === roleModuleId)
    if (!module) {
      toast.error('请选择角色模块')
      return
    }

    const anyDifferentModule = items.some(it => String(it.roleModuleId) !== roleModuleId)
    if (anyDifferentModule) {
      toast.error('批量绑定仅支持同一角色模块')
      return
    }

    const invalidRule = items.find(it => {
      if (!it.discountRuleId) return true
      const ok = (module.discountRules || []).some(r => String(r._id) === String(it.discountRuleId))
      return !ok
    })
    if (invalidRule) {
      toast.error('存在无效折扣规则，请重新选择')
      return
    }

    const siblingDistributionSum = accounts
      .filter(a => String(a.parentId || '') === String(parentAccount?._id || ''))
      .reduce((sum, a) => sum + Number((a as any).distributionRate ?? 0), 0)
    const maxDistribution = Math.max(0, 100 - siblingDistributionSum)
    const sumNewDistribution = items.reduce((sum, it) => sum + Number(it.distributionRate || 0), 0)
    if (sumNewDistribution > maxDistribution) {
      toast.error(`垂直权重合计不能超过可用额度 ${maxDistribution.toFixed(0)}%`)
      return
    }

    const currentModuleAllocated = accounts
      .filter(a => a.roleModuleId === roleModuleId && !a.parentId)
      .reduce((sum, a) => sum + a.allocatedRate, 0)
    const maxAvailable = parentAccount
      ? Number(parentAccount.availableRate || 0)
      : Math.max(0, Number(module.maxProfitRate || 0) - currentModuleAllocated)
    const sumNewAllocated = items.reduce((sum, it) => sum + Number(it.allocatedRate || 0), 0)
    if (sumNewAllocated > maxAvailable) {
      toast.error(`分配比例合计不能超过可用额度 ${maxAvailable.toFixed(1)}%`)
      return
    }

    const invalidVisibility = items.find(it => {
      const ids = Array.isArray(it.visibleCategoryIds) ? it.visibleCategoryIds : []
      if (parentAccount?.visibleCategoryIds && parentAccount.visibleCategoryIds.length > 0) {
        const allowed = new Set(parentAccount.visibleCategoryIds.map(String))
        return ids.some(x => !allowed.has(String(x)))
      }
      return false
    })
    if (invalidVisibility) {
      toast.error('存在越级品类权限，请检查可见品类范围')
      return
    }

    const now = Date.now()
    const created = items.map((it, idx) => {
      const newAccount: AuthorizedAccount = {
        _id: `account_${now}_${idx}`,
        userId: String(it.accountId),
        username: String(it.username || ''),
        nickname: String(it.nickname || it.username || ''),
        phone: String(it.phone || ''),
        roleModuleId: roleModuleId,
        roleModuleName: module.name,
        discountRuleId: String(it.discountRuleId),
        parentId: parentAccount?._id || null,
        parentName: parentAccount?.username,
        level: parentAccount ? parentAccount.level + 1 : 1,
        allocatedRate: Number(it.allocatedRate || 0),
        availableRate: Number(it.allocatedRate || 0),
        distributionRate: Number.isFinite(Number(it.distributionRate)) ? Number(it.distributionRate) : 0,
        visibleCategoryIds: Array.isArray(it.visibleCategoryIds) ? it.visibleCategoryIds : [],
        children: [],
        status: 'active',
        createdAt: new Date().toISOString()
      }
      return newAccount
    })

    let nextAccounts = [...accounts, ...created]
    if (parentAccount) {
      nextAccounts = nextAccounts.map(a => {
        if (String(a._id) !== String(parentAccount._id)) return a
        const prevAvail = Number(a.availableRate || 0)
        return { ...a, availableRate: Math.max(0, prevAvail - sumNewAllocated) }
      })
    }

    onSaveAccounts(nextAccounts)
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
  const getNodeProductCount = (a: AuthorizedAccount) => {
    const ids = Array.isArray(a.visibleCategoryIds) ? a.visibleCategoryIds : []
    if (ids.length > 0) return ids.length
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
        avatar: account.avatar || `https://images.unsplash.com/photo-${1494790108755 + index}?w=150&h=150&fit=crop&crop=face`,
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
        account: account // 保存完整的account对象用于操作
      }
    })

    return { headquarters, staffNodes }
  }, [filteredAccounts, manufacturerName, manufacturerLogo, modules])

  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [zoomScale, setZoomScale] = useState(1)

  const [showProfileEditModal, setShowProfileEditModal] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)

  // 地图：平移/缩放/拖拽
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

  const staffIdsKey = useMemo(() => hierarchyData.staffNodes.map(s => String(s.id)).join('|'), [hierarchyData.staffNodes])

  useEffect(() => {
    if (viewMode !== 'map') return

    setNodePositions(prev => {
      const next = { ...prev }
      if (!next['headquarters']) next['headquarters'] = { x: 0, y: -260 }

      const n = hierarchyData.staffNodes.length
      const gapX = 380
      const baseY = 240
      hierarchyData.staffNodes.forEach((s, idx) => {
        const id = String(s.id)
        if (next[id]) return
        const offset = (idx - (n - 1) / 2) * gapX
        next[id] = { x: offset, y: baseY }
      })
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

  const commitNodeDraft = (nodeId: string) => {
    const draft = nodeDraft[String(nodeId)]
    if (!draft) return

    const targetDiscountPct = Math.max(0, Math.min(100, Math.floor(Number(draft.minDiscount) || 0)))
    const targetDist = Math.max(0, Math.min(100, Math.floor(Number(draft.distribution) || 0)))
    const targetDiscountRate = targetDiscountPct / 100

    const current = accounts.find(a => String(a._id) === String(nodeId))
    if (!current) return

    const module = modules.find(m => String(m._id) === String(current.roleModuleId))
    const rules = module?.discountRules || []
    if (rules.length === 0) {
      toast.error('当前角色未配置折扣规则，无法设置最低折扣')
      return
    }

    const selectedRule = rules
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
    setPan({ x: st.originX + dx, y: st.originY + dy })
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
    setPan(prev => ({
      x: prev.x - Number(e.deltaX || 0) * sensitivity,
      y: prev.y - Number(e.deltaY || 0) * sensitivity,
    }))
  }

  // 节点拖拽
  const onNodePointerDown = (nodeId: string) => (e: any) => {
    if (viewMode !== 'map') return
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
    const st = dragStateRef.current
    if (st.pointerId !== e.pointerId) return
    st.active = false
    st.pointerId = null
    st.nodeId = null
  }

  return (
    <div className="max-w-[1600px] mx-auto h-screen flex flex-col bg-[#fcfdfd] overflow-hidden">
      {/* duijie/nn风格的header */}
      <header className="p-8 border-b bg-white flex items-center justify-between shrink-0 shadow-sm z-[60]">
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
          <div className="relative w-full h-full overflow-hidden bg-gray-50/50">
            {/* 缩放控制面板 */}
            <div className="absolute bottom-12 left-12 flex flex-col gap-4 z-[80]">
              <button 
                onClick={() => setZoomScale(p => Math.min(2, p + 0.1))} 
                className="w-14 h-14 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-[#153e35] hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-8 h-8" strokeWidth={3} />
              </button>
              <button 
                onClick={() => setZoomScale(1)} 
                className="w-14 h-14 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-gray-400 text-xs font-black uppercase tracking-tighter"
              >
                100%
              </button>
              <button 
                onClick={() => setZoomScale(p => Math.max(0.3, p - 0.1))} 
                className="w-14 h-14 bg-white shadow-2xl rounded-2xl flex items-center justify-center text-[#153e35] hover:bg-gray-50 transition-colors"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M20 12H4" /></svg>
              </button>
            </div>

            {/* 画布层（缩放+平移） */}
            <div
              className="absolute inset-0"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
                transformOrigin: 'center center'
              }}
            >
              {/* 总部卡片（可拖拽） */}
              <div
                onPointerDown={onNodePointerDown('headquarters')}
                onPointerMove={onNodePointerMove}
                onPointerUp={onNodePointerUp}
                onPointerCancel={onNodePointerUp}
                className="w-[480px] p-12 bg-white rounded-[4.5rem] border-2 border-gray-100 shadow-2xl hover:border-[#153e35] transition-all relative"
                style={{
                  position: 'absolute',
                  left: `calc(50% + ${(nodePositions['headquarters']?.x ?? 0)}px)`,
                  top: `calc(50% + ${(nodePositions['headquarters']?.y ?? -260)}px)`,
                  transform: 'translate(-50%, -50%)',
                  touchAction: 'none'
                }}
              >
                <div className="flex justify-between items-start mb-10">
                  <div className="group w-28 h-28 rounded-[2.8rem] bg-gray-50 border shadow-inner flex items-center justify-center overflow-hidden cursor-pointer hover:scale-105 transition-transform relative">
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-black">
                      {hierarchyData.headquarters.name.charAt(0)}
                    </div>
                  </div>
                  <div className="text-right pt-2 flex-grow pl-6">
                    <h4 className="text-2xl font-black text-gray-900 mb-1 truncate">{hierarchyData.headquarters.name}</h4>
                    <div className="flex justify-end gap-2">
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-tighter">
                        已绑定 {hierarchyData.headquarters.linkedAccounts?.length || 0} 人
                      </span>
                      <span className="text-[9px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-400 uppercase tracking-tighter">
                        {hierarchyData.headquarters.role}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-10">
                  <div className="bg-[#f0fff8] p-6 rounded-[2.5rem] border border-emerald-100 text-center">
                    <p className="text-[9px] font-black text-emerald-700 uppercase mb-2">最低折扣</p>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-black text-emerald-900">{hierarchyData.headquarters.minDiscount}</span>
                      <span className="text-sm font-black text-emerald-900 ml-1">%</span>
                    </div>
                  </div>
                  <div className="bg-[#f0f9ff] p-6 rounded-[2.5rem] border border-blue-100 text-center">
                    <p className="text-[9px] font-black text-blue-700 uppercase mb-2">返佣比例</p>
                    <div className="flex items-center justify-center">
                      <span className="text-3xl font-black text-blue-900">{hierarchyData.headquarters.distribution}</span>
                      <span className="text-sm font-black text-blue-900 ml-1">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 px-2">
                  <button 
                    onClick={() => {
                      setParentAccount(null)
                      setShowAddModal(true)
                    }}
                    className="flex-grow py-5 bg-white border border-gray-100 rounded-[1.8rem] text-[10px] font-black text-gray-500 hover:text-[#153e35] transition-all uppercase tracking-widest shadow-sm hover:shadow-md"
                  >
                    绑定人员
                  </button>
                  <button 
                    onClick={() => {
                      setProductAccount(hierarchyData.headquarters as any)
                      setShowProductModal(true)
                    }}
                    className="flex-grow py-5 bg-white border border-gray-100 rounded-[1.8rem] text-[10px] font-black text-gray-500 hover:text-blue-600 transition-all uppercase tracking-widest shadow-sm hover:shadow-md"
                  >
                    绑定商品
                  </button>
                  <button
                    onClick={() => {
                      setParentAccount(null)
                      setShowAddModal(true)
                    }}
                    className="w-16 h-14 bg-[#153e35] text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-transform hover:bg-emerald-900"
                  >
                    <Plus className="w-7 h-7" strokeWidth={3} />
                  </button>
                </div>
              </div>

              {hierarchyData.staffNodes.map((staff) => (
                <div
                  key={staff.id}
                  onPointerDown={onNodePointerDown(String(staff.id))}
                  onPointerMove={onNodePointerMove}
                  onPointerUp={onNodePointerUp}
                  onPointerCancel={onNodePointerUp}
                  className="w-64 p-8 bg-white rounded-[3rem] border border-gray-100 shadow-xl hover:shadow-2xl transition-all"
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${(nodePositions[String(staff.id)]?.x ?? 0)}px)`,
                    top: `calc(50% + ${(nodePositions[String(staff.id)]?.y ?? 240)}px)`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none'
                  }}
                >
                    <div className="text-center mb-6">
                      <div 
                        onClick={() => handleAvatarClick(staff)}
                        className="w-20 h-20 mx-auto mb-4 rounded-[2rem] overflow-hidden border-2 border-gray-100 shadow-inner cursor-pointer hover:border-emerald-400 transition-all"
                      >
                        <img src={staff.avatar} alt={staff.name} className="w-full h-full object-cover" />
                      </div>
                      <h5 className="text-lg font-black text-gray-900 mb-1">{staff.name}</h5>
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full">
                        {staff.status}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#f0fff8] p-4 rounded-[1.5rem] border border-emerald-100 text-center hover:border-emerald-300 transition-all">
                        <p className="text-[8px] font-black text-emerald-700 uppercase mb-2">折扣</p>
                        <input
                          type="number"
                          value={nodeDraft[String(staff.id)]?.minDiscount ?? staff.minDiscount}
                          onChange={(e) => {
                            const v = Number(e.target.value)
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
                          className="text-2xl font-black text-emerald-900 bg-transparent text-center w-full outline-none"
                        />
                      </div>
                      <div className="bg-[#f0f9ff] p-4 rounded-[1.5rem] border border-blue-100 text-center hover:border-blue-300 transition-all">
                        <p className="text-[8px] font-black text-blue-700 uppercase mb-2">分润</p>
                        <input
                          type="number"
                          value={nodeDraft[String(staff.id)]?.distribution ?? staff.distribution}
                          onChange={(e) => {
                            const v = Number(e.target.value)
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
                          className="text-2xl font-black text-blue-900 bg-transparent text-center w-full outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const acc = accounts.find(a => String(a._id) === String(staff.id)) || null
                          setParentAccount(acc)
                          setShowAddModal(true)
                        }}
                        className="flex-grow py-3 bg-white border border-gray-100 rounded-[1.2rem] text-[9px] font-black text-gray-500 hover:text-[#153e35] transition-all uppercase tracking-widest"
                      >
                        绑定人员
                      </button>
                      <button 
                        onClick={() => {
                          const acc = accounts.find(a => String(a._id) === String(staff.id)) || null
                          if (!acc) return
                          setProductAccount(acc)
                          setShowProductModal(true)
                        }}
                        className="flex-grow py-3 bg-white border border-gray-100 rounded-[1.2rem] text-[9px] font-black text-gray-500 hover:text-blue-600 transition-all uppercase tracking-widest"
                      >
                        绑定商品
                      </button>
                      <button 
                        onClick={() => {
                          const acc = accounts.find(a => String(a._id) === String(staff.id)) || null
                          setParentAccount(acc)
                          setShowAddModal(true)
                        }}
                        className="w-12 h-10 bg-[#153e35] text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                      >
                        <Plus className="w-5 h-5" strokeWidth={3} />
                      </button>
                    </div>
                  </div>
              ))}
            </div>
            
            {/* 底部切换按钮 */}
            <button 
              onClick={() => setViewMode('list')} 
              className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-white px-12 py-5 rounded-full shadow-2xl border-2 border-emerald-500 font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:scale-105 transition-all z-[70] text-emerald-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={3} d="M4 6h16M4 12h16m-7 6h7" /></svg>
              切换目录视图
            </button>
          </div>
        )}
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
          onClose={() => {
            setShowProductModal(false)
            setProductAccount(null)
          }}
          onSave={(overrides) => {
            const next = (accounts || []).map(a => {
              if (String(a._id) !== String(productAccount._id)) return a
              return { ...a, productOverrides: overrides }
            })
            onSaveAccounts(next)
            setShowProductModal(false)
            setProductAccount(null)
            toast.success('保存成功')
          }}
        />
      )}
      
      {/* 编辑业务节点档案模态框 (参考图3) */}
      {showProfileEditModal && selectedStaff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowProfileEditModal(false)}>
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">编辑业务节点档案</h3>
              <button onClick={() => setShowProfileEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-100 cursor-pointer hover:border-emerald-400 transition-all">
                <img src={selectedStaff.avatar} alt={selectedStaff.name} className="w-full h-full object-cover" />
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
                  <label className="text-sm font-medium text-gray-700 block mb-2">职务&角色 (不可更改项目)</label>
                  <input 
                    type="text" 
                    value={selectedStaff.role}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
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
                    
                    const updatedAccounts = accounts.map(account => {
                      if (String(account._id) === String(selectedStaff.account._id)) {
                        return { 
                          ...account, 
                          nickname: nickname || account.nickname
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
    </div>
  )
}

function ProductProfitModal({
  account,
  modules,
  categoryTree,
  products,
  profitSettings,
  onClose,
  onSave
}: {
  account: AuthorizedAccount
  modules: RoleModule[]
  categoryTree: any[]
  products: any[]
  profitSettings: TierSystemData['profitSettings']
  onClose: () => void
  onSave: (overrides: NonNullable<AuthorizedAccount['productOverrides']>) => void
}) {
  const [keyword, setKeyword] = useState('')
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set())

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

  const normalizeIdLocal = (x: any) => {
    if (!x) return ''
    const id = x?._id || x?.id || x
    return id ? String(id) : ''
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

  const initialOverrides = useMemo(() => {
    const list = Array.isArray(account.productOverrides) ? account.productOverrides : []
    const map = new Map<string, { discountRate?: number; commissionRate?: number }>()
    list.forEach((o) => {
      if (!o?.productId) return
      map.set(String(o.productId), {
        discountRate: typeof o.discountRate === 'number' ? o.discountRate : undefined,
        commissionRate: typeof o.commissionRate === 'number' ? o.commissionRate : undefined,
      })
    })
    return map
  }, [account.productOverrides])

  const [draft, setDraft] = useState<Record<string, { discountPct?: string; commissionPct?: string }>>(() => {
    const obj: Record<string, { discountPct?: string; commissionPct?: string }> = {}
    initialOverrides.forEach((v, k) => {
      obj[k] = {
        discountPct: typeof v.discountRate === 'number' ? String(Math.round(v.discountRate * 100)) : undefined,
        commissionPct: typeof v.commissionRate === 'number' ? String(Math.round(v.commissionRate * 1000) / 10) : undefined
      }
    })
    return obj
  })

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
    ;(products || []).forEach((p: any) => {
      const cid = normalizeIdLocal(p?.category?._id || p?.category?.id || p?.category)
      if (!cid) return
      const arr = map.get(cid) || []
      arr.push(p)
      map.set(cid, arr)
    })
    return map
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
    if (!categoryTree || categoryTree.length === 0) return []
    return filterTreeByAllowed(categoryTree)
  }, [categoryTree, visibleCategorySet, productsByCategoryId])

  const buildOverrides = () => {
    const out: NonNullable<AuthorizedAccount['productOverrides']> = []
    Object.entries(draft).forEach(([productId, v]) => {
      const rawDiscount = v.discountPct
      const rawCommission = v.commissionPct

      const discountRate = rawDiscount === undefined || rawDiscount === ''
        ? undefined
        : Math.max(0, Math.min(1, (Number(rawDiscount) || 0) / 100))
      const commissionRate = rawCommission === undefined || rawCommission === ''
        ? undefined
        : Math.max(0, Math.min(1, (Number(rawCommission) || 0) / 100))

      if (discountRate === undefined && commissionRate === undefined) return
      out.push({ productId, ...(discountRate !== undefined ? { discountRate } : {}), ...(commissionRate !== undefined ? { commissionRate } : {}) })
    })
    return out
  }

  const renderProductRow = (p: any) => {
    const pid = String(p?._id || p?.id || '')
    if (!pid) return null
    const name = String(p?.name || p?.title || p?.productName || p?.productCode || pid)
    if (keyword.trim() && !name.toLowerCase().includes(keyword.trim().toLowerCase())) return null

    const base = basePriceOf(p)
    const existing = initialOverrides.get(pid)
    const draftV = draft[pid] || {}

    const draftDiscountRate = (() => {
      if (draftV.discountPct === undefined || draftV.discountPct === '') return undefined
      const n = Number(draftV.discountPct)
      if (!Number.isFinite(n)) return undefined
      return Math.max(0, Math.min(1, n / 100))
    })()
    const draftCommissionRate = (() => {
      if (draftV.commissionPct === undefined || draftV.commissionPct === '') return undefined
      const n = Number(draftV.commissionPct)
      if (!Number.isFinite(n)) return undefined
      return Math.max(0, Math.min(1, n / 100))
    })()

    const effectiveDiscountRate =
      typeof draftDiscountRate === 'number'
        ? draftDiscountRate
        : (typeof existing?.discountRate === 'number' ? existing.discountRate : defaultDiscountRate)
    const effectiveCommissionRate =
      typeof draftCommissionRate === 'number'
        ? draftCommissionRate
        : (typeof existing?.commissionRate === 'number' ? existing.commissionRate : defaultCommissionRate)

    const effectiveSaleRate = Math.max(effectiveDiscountRate, safeGlobalMinSaleDiscountRate)
    const minPrice = Math.round(base * effectiveSaleRate)
    const commAmt = Math.round(minPrice * effectiveCommissionRate)

    return (
      <div key={pid} className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex items-center justify-between gap-6">
        <div className="min-w-0">
          <div className="text-sm font-black text-gray-900 truncate">{name}</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            标价 ¥{Number(base || 0).toLocaleString()} • 成交受限价 ¥{Number(minPrice || 0).toLocaleString()} • 预计分佣 ¥{Number(commAmt || 0).toLocaleString()}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex flex-col items-end">
            <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">折扣(%)</div>
            <input
              value={draftV.discountPct ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setDraft(prev => ({ ...prev, [pid]: { ...prev[pid], discountPct: v } }))
              }}
              className="w-16 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-black text-center outline-none"
              placeholder="默认"
              inputMode="numeric"
            />
          </div>

          <div className="flex flex-col items-end">
            <div className="text-[9px] text-gray-400 font-black uppercase tracking-widest">返点(%)</div>
            <input
              value={draftV.commissionPct ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setDraft(prev => ({ ...prev, [pid]: { ...prev[pid], commissionPct: v } }))
              }}
              className="w-16 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-xs font-black text-center outline-none"
              placeholder="默认"
              inputMode="decimal"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setDraft(prev => {
                const next = { ...prev }
                delete next[pid]
                return next
              })
            }}
            className="w-10 h-10 rounded-xl border border-gray-100 bg-white text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-all"
            title="清除覆盖"
          >
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-[980px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-gray-900">商品分润配置</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">
              {account.nickname || account.username} • {module?.name || '未设置模块'}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              说明：此处为分层体系管理配置，暂不影响线上实际授权价/结算。
            </p>
          </div>
          <button type="button" onClick={onClose} className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 transition-all">
            <X className="w-6 h-6 mx-auto" />
          </button>
        </div>

        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索商品"
              className="input flex-1 min-w-[240px]"
            />
            <div className="text-xs text-gray-500">
              全局最低折扣保护：{Math.round(safeGlobalMinSaleDiscountRate * 100)}%
            </div>
          </div>

          {effectiveTree.length === 0 ? (
            <div className="text-sm text-gray-500">暂无可配置的品类/商品</div>
          ) : (
            <div className="space-y-4">
              {(function renderTree(nodes: any[], depth: number = 0): any {
                return nodes.map((n: any) => {
                  const id = normalizeIdLocal(n)
                  const name = String(n?.name || id)
                  const children = Array.isArray(n?.children) ? n.children : []
                  const prods = productsByCategoryId.get(id) || []
                  const canExpand = children.length > 0 || prods.length > 0
                  const isExpanded = expandedCategoryIds.has(id)

                  return (
                    <div key={id} style={{ marginLeft: depth * 12 }} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => canExpand && toggleExpand(id)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${canExpand ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-transparent text-gray-200'}`}
                          disabled={!canExpand}
                        >
                          {canExpand ? (
                            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
                          ) : (
                            <span className="w-4 h-4" />
                          )}
                        </button>
                        <div className="text-sm font-black text-gray-900">{name}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                          {prods.length > 0 ? `${prods.length} 商品` : ''}
                        </div>
                      </div>

                      {isExpanded ? (
                        <div className="space-y-3">
                          {prods.slice(0, 200).map(renderProductRow)}
                          {prods.length > 200 ? <div className="text-xs text-gray-400">仅展示前 200 个商品</div> : null}
                          {children.length > 0 ? renderTree(children, depth + 1) : null}
                        </div>
                      ) : null}
                    </div>
                  )
                })
              })(effectiveTree)}
            </div>
          )}
        </div>

        <div className="p-8 border-t border-gray-100 flex justify-end gap-4 bg-white">
          <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50">
            取消
          </button>
          <button
            type="button"
            onClick={() => {
              const next = buildOverrides()
              onSave(next)
            }}
            className="px-10 py-3 rounded-2xl bg-[#153e35] text-white font-black shadow-xl"
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
  onSave: (items: Array<{
    accountId: string
    username: string
    nickname: string
    phone: string
    roleModuleId: string
    discountRuleId: string
    allocatedRate: number
    distributionRate: number
    visibleCategoryIds: string[]
  }>) => void
}) {
  const [manufacturerAccounts, setManufacturerAccounts] = useState<any[]>([])
  const [accountKeyword, setAccountKeyword] = useState('')
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Set<string>>(new Set())
  const [expandedAccountGroups, setExpandedAccountGroups] = useState<Set<string>>(new Set(['auth', 'sub', 'designer', 'normal', 'unknown']))
  const [selectionMode, setSelectionMode] = useState<'multiple' | 'single'>('multiple')
  const [organizationsById, setOrganizationsById] = useState<Record<string, { name: string; type?: string }>>({})

  const parentHasCustomVisibility = !!(parentAccount?.visibleCategoryIds && parentAccount.visibleCategoryIds.length > 0)
  const parentVisibleCategoryIds = parentHasCustomVisibility
    ? parentAccount!.visibleCategoryIds!.map(String)
    : []

  const [formData, setFormData] = useState({
    roleModuleId: parentAccount?.roleModuleId || modules[0]?._id || '',
    visibilityMode: (parentHasCustomVisibility ? 'custom' : 'all') as 'all' | 'custom',
    visibleCategoryIds: (parentHasCustomVisibility ? parentVisibleCategoryIds : []) as string[]
  })

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([])
  const [perAccountConfig, setPerAccountConfig] = useState<Record<string, {
    discountRuleId: string
    allocatedRate: number
    distributionRate: number
  }>>({})

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

  const selectedModule = modules.find(m => String(m._id) === String(formData.roleModuleId))

  const defaultRuleId = useMemo(() => {
    const rules = selectedModule?.discountRules || []
    const def = rules.find(r => r.isDefault) || rules[0]
    return String(def?._id || '')
  }, [selectedModule?._id])

  const [batchRuleId, setBatchRuleId] = useState('')

  const siblingDistributionSum = useMemo(() => {
    const pid = String(parentAccount?._id || '')
    return (authorizedAccounts || [])
      .filter(a => String(a.parentId || '') === pid)
      .reduce((sum, a) => sum + Number((a as any).distributionRate ?? 0), 0)
  }, [authorizedAccounts, parentAccount?._id])

  const maxDistribution = Math.max(0, 100 - siblingDistributionSum)

  const currentModuleAllocated = useMemo(() => {
    const rid = String(formData.roleModuleId || '')
    return (authorizedAccounts || [])
      .filter(a => String(a.roleModuleId) === rid && !a.parentId)
      .reduce((sum, a) => sum + Number(a.allocatedRate || 0), 0)
  }, [authorizedAccounts, formData.roleModuleId])

  const maxRate = useMemo(() => {
    if (parentAccount) return Number(parentAccount.availableRate || 0)
    if (!selectedModule) return 0
    return Math.max(0, Number(selectedModule.maxProfitRate || 0) - currentModuleAllocated)
  }, [parentAccount?._id, parentAccount?.availableRate, selectedModule?._id, currentModuleAllocated])

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

  const toggleAccountGroup = (groupId: string) => {
    setExpandedAccountGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
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

  useEffect(() => {
    if (!selectedModule) return
    const rules = selectedModule.discountRules || []
    if (rules.length === 0) return

    setBatchRuleId(prev => {
      if (prev && rules.some(r => String(r._id) === String(prev))) return prev
      return defaultRuleId
    })

    setPerAccountConfig(prev => {
      let changed = false
      const next = { ...prev }
      selectedAccountIds.forEach((id) => {
        const cur = next[id]
        const ok = cur?.discountRuleId && rules.some(r => String(r._id) === String(cur.discountRuleId))
        if (!ok) {
          next[id] = {
            discountRuleId: defaultRuleId,
            allocatedRate: typeof cur?.allocatedRate === 'number' ? cur.allocatedRate : 1,
            distributionRate: typeof cur?.distributionRate === 'number' ? cur.distributionRate : 0,
          }
          changed = true
        }
      })
      return changed ? next : prev
    })
  }, [selectedModule?._id, defaultRuleId, selectedAccountIds.join('|')])

  const toggleSelectAccount = (id: string) => {
    setSelectedAccountIds(prev => {
      const exists = prev.includes(id)
      const next = exists ? prev.filter(x => x !== id) : [...prev, id]

      setPerAccountConfig(cfg => {
        const nextCfg = { ...cfg }
        if (!exists) {
          const allocated = Math.max(1, Math.floor(maxRate / Math.max(1, next.length)))
          const dist = Math.floor(maxDistribution / Math.max(1, next.length))
          nextCfg[id] = {
            discountRuleId: defaultRuleId,
            allocatedRate: allocated,
            distributionRate: dist,
          }
        } else {
          delete nextCfg[id]
        }
        return nextCfg
      })

      return next
    })
  }

  const toggleSelectGroup = (groupKey: string) => {
    const group = groupedAccounts.find(g => g.key === groupKey)
    if (!group) return
    const ids = group.accounts.map(a => String(a._id))
    setSelectedAccountIds(prev => {
      const prevSet = new Set(prev.map(String))
      const allSelected = ids.every(id => prevSet.has(id))
      const next = allSelected
        ? prev.filter(id => !ids.includes(String(id)))
        : Array.from(new Set([...prev, ...ids]))

      setPerAccountConfig(cfg => {
        const nextCfg = { ...cfg }
        if (allSelected) {
          ids.forEach((id) => {
            delete nextCfg[id]
          })
        } else {
          const allocated = Math.max(1, Math.floor(maxRate / Math.max(1, next.length)))
          const dist = Math.floor(maxDistribution / Math.max(1, next.length))
          ids.forEach((id) => {
            if (nextCfg[id]) return
            nextCfg[id] = {
              discountRuleId: defaultRuleId,
              allocatedRate: allocated,
              distributionRate: dist,
            }
          })
        }
        return nextCfg
      })

      return next
    })
  }

  const sumAllocated = useMemo(() => {
    return selectedAccountIds.reduce((sum, id) => sum + Number(perAccountConfig[id]?.allocatedRate || 0), 0)
  }, [selectedAccountIds.join('|'), perAccountConfig])

  const sumDistribution = useMemo(() => {
    return selectedAccountIds.reduce((sum, id) => sum + Number(perAccountConfig[id]?.distributionRate || 0), 0)
  }, [selectedAccountIds.join('|'), perAccountConfig])

  const applyBatchRule = (ruleId: string) => {
    setBatchRuleId(ruleId)
    setPerAccountConfig(prev => {
      const next = { ...prev }
      selectedAccountIds.forEach((id) => {
        const cur = next[id] || { discountRuleId: '', allocatedRate: 1, distributionRate: 0 }
        next[id] = { ...cur, discountRuleId: ruleId }
      })
      return next
    })
  }

  const applyBatchAllocated = (v: number) => {
    setPerAccountConfig(prev => {
      const next = { ...prev }
      selectedAccountIds.forEach((id) => {
        const cur = next[id] || { discountRuleId: defaultRuleId, allocatedRate: 1, distributionRate: 0 }
        next[id] = { ...cur, allocatedRate: v }
      })
      return next
    })
  }

  const applyBatchDistribution = (v: number) => {
    setPerAccountConfig(prev => {
      const next = { ...prev }
      selectedAccountIds.forEach((id) => {
        const cur = next[id] || { discountRuleId: defaultRuleId, allocatedRate: 1, distributionRate: 0 }
        next[id] = { ...cur, distributionRate: v }
      })
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedModule?._id) {
      toast.error('请选择角色模块')
      return
    }
    if (selectedAccountIds.length === 0) {
      toast.error('请选择要绑定的账号')
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

    if (sumAllocated > maxRate) {
      toast.error(`分配比例合计不能超过可用额度 ${maxRate.toFixed(1)}%`)
      return
    }
    if (sumDistribution > maxDistribution) {
      toast.error(`垂直权重合计不能超过可用额度 ${maxDistribution.toFixed(0)}%`)
      return
    }

    const payload = selectedAccounts.map((a) => {
      const id = String(a._id)
      const cfg = perAccountConfig[id]
      return {
        accountId: id,
        username: String(a.username || ''),
        nickname: String(a.nickname || a.username || ''),
        phone: String(a.phone || ''),
        roleModuleId: String(selectedModule._id),
        discountRuleId: String(cfg?.discountRuleId || ''),
        allocatedRate: Number(cfg?.allocatedRate || 0),
        distributionRate: Number(cfg?.distributionRate || 0),
        visibleCategoryIds
      }
    })

    onSave(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-[1200px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-black text-gray-900">绑定人员</h3>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
              已选 {selectedAccountIds.length} 人 • 分配 {sumAllocated.toFixed(1)}% / {maxRate.toFixed(1)}% • 权重 {sumDistribution.toFixed(0)}% / {maxDistribution.toFixed(0)}%
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 transition-all">
            <X className="w-6 h-6 mx-auto" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-50/50 border border-gray-100 rounded-[2rem] p-6">
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="text"
                  value={accountKeyword}
                  onChange={(e) => setAccountKeyword(e.target.value)}
                  className="input w-full"
                  placeholder="搜索账号（用户名/昵称/手机号）"
                />
              </div>

              <div className="max-h-[520px] overflow-y-auto space-y-3 pr-1">
                {groupedAccounts.length === 0 ? (
                  <div className="text-sm text-gray-500 py-10">暂无可绑定账号</div>
                ) : (
                  groupedAccounts.map(group => {
                    const groupIds = group.accounts.map(a => String(a._id))
                    const selectedSet = new Set(selectedAccountIds.map(String))
                    const groupAllSelected = groupIds.length > 0 && groupIds.every(id => selectedSet.has(id))
                    const groupExpanded = expandedAccountGroups.has(group.key)

                    return (
                      <div key={group.key} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                        <div className="px-4 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleAccountGroup(group.key)}
                              className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600"
                            >
                              {groupExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <div className="text-sm font-black text-gray-900">{group.label}</div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{group.accounts.length}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => toggleSelectGroup(group.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-black border ${groupAllSelected ? 'bg-[#153e35] text-white border-[#153e35]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                          >
                            {groupAllSelected ? '取消全选' : '全选'}
                          </button>
                        </div>

                        {groupExpanded ? (
                          <div className="px-2 pb-3">
                            {group.accounts.map((a) => {
                              const id = String(a._id)
                              const checked = selectedAccountIds.includes(id)
                              const typeLabel = getAccountTypeLabel(String(a?.accountType || 'unknown'))
                              return (
                                <label key={id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl hover:bg-gray-50">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleSelectAccount(id)}
                                    />
                                    <div className="min-w-0">
                                      <div className="text-sm font-black text-gray-900 truncate">{a.nickname || a.username || id}</div>
                                      <div className="text-[10px] text-gray-400 font-bold truncate">
                                        {a.username ? `@${a.username}` : ''}{a.phone ? ` • ${a.phone}` : ''}
                                      </div>
                                      <div className="mt-1">
                                        <span className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100 text-gray-500">
                                          {typeLabel}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  {checked ? (
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                      <Check className="w-4 h-4" />
                                    </div>
                                  ) : null}
                                </label>
                              )
                            })}
                          </div>
                        ) : null}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white border border-gray-100 rounded-[2rem] p-6 space-y-5">
                <div>
                  <div className="text-xs font-black text-gray-400 uppercase tracking-widest">角色模块</div>
                  <select
                    value={formData.roleModuleId}
                    onChange={(e) => setFormData(prev => ({ ...prev, roleModuleId: e.target.value }))}
                    className="input w-full mt-2"
                    disabled={!!parentAccount}
                  >
                    {modules.filter(m => m.isActive).map(m => (
                      <option key={m._id} value={m._id}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">批量折扣规则</div>
                    <select
                      className="input w-full mt-2"
                      value={batchRuleId}
                      onChange={(e) => applyBatchRule(e.target.value)}
                      disabled={!selectedModule}
                    >
                      {(selectedModule?.discountRules || []).map(r => (
                        <option key={r._id} value={r._id}>{r.name}{r.isDefault ? '（默认）' : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">批量分配%</div>
                    <input
                      className="input w-full mt-2"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={selectedAccountIds.length ? Math.max(1, Math.floor(maxRate / Math.max(1, selectedAccountIds.length))) : 1}
                      onBlur={(e) => {
                        const v = Math.max(0, Math.floor(Number(e.target.value) || 0))
                        applyBatchAllocated(v)
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">批量权重%</div>
                    <input
                      className="input w-full mt-2"
                      type="number"
                      min={0}
                      step={1}
                      defaultValue={selectedAccountIds.length ? Math.floor(maxDistribution / Math.max(1, selectedAccountIds.length)) : 0}
                      onBlur={(e) => {
                        const v = Math.max(0, Math.floor(Number(e.target.value) || 0))
                        applyBatchDistribution(v)
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest">可见品类</div>
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
                      className="input w-full mt-2"
                    >
                      <option value="all">{parentHasCustomVisibility ? '全部（继承上级范围）' : '全部品类'}</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>
                </div>

                {formData.visibilityMode === 'custom' ? (
                  <div className="border border-gray-100 rounded-2xl p-4 max-h-56 overflow-y-auto">
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
                      <div className="text-sm text-gray-500">该厂家暂无可选品类</div>
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
                                  />
                                  <span className="text-sm font-medium text-gray-900 truncate">{n?.name || id}</span>
                                  <span className="text-xs text-gray-400">
                                    {hasProducts ? `${prods.length}商品` : ''}
                                  </span>
                                </div>

                                {isExpanded ? (
                                  <div className="ml-8 border-l border-gray-100 pl-3 space-y-1">
                                    {hasProducts ? (
                                      <div className="space-y-1">
                                        {prods.slice(0, 20).map((p: any) => (
                                          <div key={String(p._id)} className="text-xs text-gray-600 py-0.5 truncate">
                                            {p.name || p.productCode || p._id}
                                          </div>
                                        ))}
                                        {prods.length > 20 ? <div className="text-xs text-gray-400">仅展示前 20 个商品</div> : null}
                                      </div>
                                    ) : null}
                                    {hasChildren ? (
                                      <div className="space-y-1">
                                        {renderTree(children, depth + 1)}
                                      </div>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                            )
                          })
                        })(effectiveCategoryTree)}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="text-sm font-black text-gray-900">已选人员</div>
                  <div className="text-xs text-gray-500">可用分配 {maxRate.toFixed(1)}% • 可用权重 {maxDistribution.toFixed(0)}%</div>
                </div>
                <div className="max-h-[340px] overflow-y-auto">
                  {selectedAccounts.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">请在左侧勾选要绑定的账号</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {selectedAccounts.map((a) => {
                        const id = String(a._id)
                        const cfg = perAccountConfig[id] || { discountRuleId: defaultRuleId, allocatedRate: 0, distributionRate: 0 }
                        return (
                          <div key={id} className="p-5 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-sm font-black text-gray-900 truncate">{a.nickname || a.username || id}</div>
                              <div className="text-[10px] text-gray-400 font-bold truncate">
                                {a.username ? `@${a.username}` : ''}{a.phone ? ` • ${a.phone}` : ''}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <select
                                value={cfg.discountRuleId}
                                onChange={(e) => {
                                  const v = e.target.value
                                  setPerAccountConfig(prev => ({
                                    ...prev,
                                    [id]: { ...prev[id], discountRuleId: v }
                                  }))
                                }}
                                className="input h-10 text-xs"
                              >
                                {(selectedModule?.discountRules || []).map(r => (
                                  <option key={r._id} value={r._id}>{r.name}{r.isDefault ? '（默认）' : ''}</option>
                                ))}
                              </select>
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={cfg.allocatedRate}
                                onChange={(e) => {
                                  const v = Math.max(0, Math.floor(Number(e.target.value) || 0))
                                  setPerAccountConfig(prev => ({
                                    ...prev,
                                    [id]: { ...prev[id], allocatedRate: v }
                                  }))
                                }}
                                className="input h-10 w-20 text-xs text-center"
                                title="分配比例%"
                              />
                              <input
                                type="number"
                                min={0}
                                step={1}
                                value={cfg.distributionRate}
                                onChange={(e) => {
                                  const v = Math.max(0, Math.floor(Number(e.target.value) || 0))
                                  setPerAccountConfig(prev => ({
                                    ...prev,
                                    [id]: { ...prev[id], distributionRate: v }
                                  }))
                                }}
                                className="input h-10 w-20 text-xs text-center"
                                title="垂直权重%"
                              />
                              <button
                                type="button"
                                onClick={() => toggleSelectAccount(id)}
                                className="w-10 h-10 rounded-xl border border-gray-100 bg-white text-gray-400 hover:text-rose-500 hover:border-rose-200 transition-all"
                              >
                                <X className="w-4 h-4 mx-auto" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-8">
            <button type="button" onClick={onClose} className="px-8 py-3 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50">
              取消
            </button>
            <button type="submit" className="px-10 py-3 rounded-2xl bg-[#153e35] text-white font-black shadow-xl">
              绑定
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
