import { useState, useEffect, useMemo } from 'react'
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
  discountRate: number  // 折扣比例，如0.85表示85折
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
  parentId: string | null
  parentName?: string
  level: number  // 层级深度
  allocatedRate: number  // 分配的比例
  availableRate: number  // 可再分配比例
  visibleCategoryIds?: string[]
  children: AuthorizedAccount[]
  status: 'active' | 'suspended' | 'pending'
  createdAt: string
}

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

// ==================== localStorage 操作 ====================

const STORAGE_KEY = 'tier_system_data'
const STORAGE_SELECTED_MANUFACTURER_KEY = 'tier_system_selected_manufacturer'

const getTierStorageKey = (manufacturerId: string) => {
  if (!manufacturerId) return STORAGE_KEY
  return `${STORAGE_KEY}:${manufacturerId}`
}

interface TierSystemData {
  roleModules: RoleModule[]
  authorizedAccounts: AuthorizedAccount[]
}

const loadTierSystemData = (manufacturerId: string): TierSystemData => {
  try {
    const data = localStorage.getItem(getTierStorageKey(manufacturerId))
    if (data) {
      return JSON.parse(data)
    }
  } catch (e) {
    console.error('加载分层体系数据失败:', e)
  }
  
  // 初始化默认数据
  const defaultData: TierSystemData = {
    roleModules: DEFAULT_ROLE_MODULES.map((m, i) => ({
      ...m,
      _id: `role_${m.code}_${Date.now() + i}`,
      discountRules: [
        {
          _id: `rule_default_${m.code}`,
          name: '默认折扣',
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
  
  localStorage.setItem(getTierStorageKey(manufacturerId), JSON.stringify(defaultData))
  return defaultData
}

const saveTierSystemData = (manufacturerId: string, data: TierSystemData) => {
  localStorage.setItem(getTierStorageKey(manufacturerId), JSON.stringify(data))
}

// ==================== 主组件 ====================

export default function TierSystemManagement() {
  const { user } = useAuthStore()
  const lockedManufacturerId = (user as any)?.manufacturerId ? String((user as any).manufacturerId) : ''
  const isSuperAdmin = user?.role === 'super_admin' || user?.role === 'admin'

  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>(() => {
    if (lockedManufacturerId) return lockedManufacturerId
    const saved = localStorage.getItem(STORAGE_SELECTED_MANUFACTURER_KEY)
    return saved || ''
  })

  const [activeTab, setActiveTab] = useState<'modules' | 'pool' | 'hierarchy'>('modules')
  const [data, setData] = useState<TierSystemData>(() => loadTierSystemData(lockedManufacturerId || selectedManufacturerId || ''))
  const [selectedModule, setSelectedModule] = useState<RoleModule | null>(null)
  const [showModuleModal, setShowModuleModal] = useState(false)
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [editingRule, setEditingRule] = useState<DiscountRule | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

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
    setData(loadTierSystemData(mid))
    setSelectedModule(null)
    setExpandedNodes(new Set())
  }, [lockedManufacturerId, selectedManufacturerId])

  // 保存数据
  const saveData = (newData: TierSystemData) => {
    setData(newData)
    saveTierSystemData(lockedManufacturerId || selectedManufacturerId || '', newData)
  }

  // 更新角色模块
  const updateRoleModule = (moduleId: string, updates: Partial<RoleModule>) => {
    const newModules = data.roleModules.map(m => 
      m._id === moduleId 
        ? { ...m, ...updates, updatedAt: new Date().toISOString() }
        : m
    )
    saveData({ ...data, roleModules: newModules })
    if (selectedModule?._id === moduleId) {
      setSelectedModule({ ...selectedModule, ...updates })
    }
    toast.success('保存成功')
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
    if (selectedModule?._id === moduleId) {
      setSelectedModule({ ...selectedModule, discountRules: [...selectedModule.discountRules, newRule] })
    }
    toast.success('规则添加成功')
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
    if (selectedModule?._id === moduleId) {
      setSelectedModule({ 
        ...selectedModule, 
        discountRules: selectedModule.discountRules.map(r => r._id === ruleId ? { ...r, ...updates } : r)
      })
    }
    toast.success('规则更新成功')
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
    if (selectedModule?._id === moduleId) {
      setSelectedModule({ 
        ...selectedModule, 
        discountRules: selectedModule.discountRules.filter(r => r._id !== ruleId)
      })
    }
    toast.success('规则已删除')
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 页头 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">分层体系管理</h1>
        <p className="text-sm text-gray-500 mt-1">管理角色模块、毛利池配置和多层级授权关系</p>
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
            active={activeTab === 'modules'} 
            onClick={() => setActiveTab('modules')}
            icon={<Layers className="w-4 h-4" />}
            label="角色模块"
          />
          <TabButton 
            active={activeTab === 'pool'} 
            onClick={() => setActiveTab('pool')}
            icon={<BarChart3 className="w-4 h-4" />}
            label="毛利池管理"
          />
          <TabButton 
            active={activeTab === 'hierarchy'} 
            onClick={() => setActiveTab('hierarchy')}
            icon={<GitBranch className="w-4 h-4" />}
            label="授权层级"
          />
        </div>
      </div>

      {/* 内容区域 */}
      {activeTab === 'modules' && (
        <RoleModulesTab 
          modules={data.roleModules}
          selectedModule={selectedModule}
          onSelectModule={setSelectedModule}
          onUpdateModule={updateRoleModule}
          onAddRule={addDiscountRule}
          onUpdateRule={updateDiscountRule}
          onDeleteRule={deleteDiscountRule}
        />
      )}
      
      {activeTab === 'pool' && (
        <ProfitPoolTab 
          modules={data.roleModules}
          onUpdateModule={updateRoleModule}
        />
      )}
      
      {activeTab === 'hierarchy' && (
        <HierarchyTab 
          modules={data.roleModules}
          accounts={data.authorizedAccounts}
          manufacturerId={lockedManufacturerId || selectedManufacturerId || ''}
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
          onSaveAccounts={(accounts) => saveData({ ...data, authorizedAccounts: accounts })}
        />
      )}
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
                              折扣: <strong className="text-primary-600">{(rule.discountRate * 100).toFixed(0)}%</strong>
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
    discountRate: rule?.discountRate || 0.9,
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
      discountRate: formData.discountRate,
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              折扣比例 ({(formData.discountRate * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0.5"
              max="1"
              step="0.01"
              value={formData.discountRate}
              onChange={(e) => setFormData({ ...formData, discountRate: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5折</span>
              <span>原价</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              返点/佣金比例 ({(formData.commissionRate * 100).toFixed(1)}%)
            </label>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.005"
              value={formData.commissionRate}
              onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>30%</span>
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
  onUpdateModule
}: {
  modules: RoleModule[]
  onUpdateModule: (id: string, updates: Partial<RoleModule>) => void
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState(0)

  const totalMaxRate = modules.reduce((sum, m) => sum + m.maxProfitRate, 0)
  const totalAllocated = modules.reduce((sum, m) => sum + m.currentAllocatedRate, 0)

  return (
    <div className="space-y-6">
      {/* 总览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl p-6 text-white">
          <p className="text-primary-100 text-sm">总毛利池上限</p>
          <p className="text-3xl font-bold mt-1">{totalMaxRate}%</p>
          <p className="text-primary-200 text-xs mt-2">各业务线上限之和</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <p className="text-orange-100 text-sm">已分配比例</p>
          <p className="text-3xl font-bold mt-1">{totalAllocated}%</p>
          <p className="text-orange-200 text-xs mt-2">已授权给下级的比例</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <p className="text-green-100 text-sm">可分配比例</p>
          <p className="text-3xl font-bold mt-1">{totalMaxRate - totalAllocated}%</p>
          <p className="text-green-200 text-xs mt-2">剩余可授权比例</p>
        </div>
      </div>

      {/* 业务线毛利池列表 */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">业务线毛利池配置</h3>
          <p className="text-sm text-gray-500 mt-1">设置每条业务线的毛利上限，下级授权不能超过此上限</p>
        </div>
        
        <div className="divide-y divide-gray-100">
          {modules.sort((a, b) => a.sortOrder - b.sortOrder).map(module => {
            const Icon = ICON_MAP[module.icon] || Layers
            const usagePercent = module.maxProfitRate > 0 
              ? (module.currentAllocatedRate / module.maxProfitRate) * 100 
              : 0
            
            return (
              <div key={module._id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-lg ${module.isActive ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{module.name}</span>
                      <span className="text-xs text-gray-400">({module.code})</span>
                      {!module.isActive && (
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">已禁用</span>
                      )}
                    </div>
                    
                    {/* 进度条 */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all"
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-20">
                        {module.currentAllocatedRate}% / {module.maxProfitRate}%
                      </span>
                    </div>
                  </div>
                  
                  {/* 编辑毛利上限 */}
                  <div className="flex items-center gap-2">
                    {editingId === module._id ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-20 input text-center"
                          autoFocus
                        />
                        <span className="text-gray-500">%</span>
                        <button
                          onClick={() => {
                            if (editValue < module.currentAllocatedRate) {
                              toast.error('上限不能低于已分配比例')
                              return
                            }
                            onUpdateModule(module._id, { maxProfitRate: editValue })
                            setEditingId(null)
                          }}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-bold text-primary-600">{module.maxProfitRate}%</span>
                        <button
                          onClick={() => {
                            setEditingId(module._id)
                            setEditValue(module.maxProfitRate)
                          }}
                          className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">毛利池规则说明</p>
            <ul className="mt-2 space-y-1 text-blue-600">
              <li>• 每条业务线有独立的毛利池上限，如设计师业务线上限40%</li>
              <li>• 下级授权的比例之和不能超过上级的可分配比例</li>
              <li>• 已分配比例 = 已授权给下级的比例总和</li>
              <li>• 可分配比例 = 毛利池上限 - 已分配比例</li>
            </ul>
          </div>
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
  expandedNodes,
  onToggleNode,
  onSaveAccounts
}: {
  modules: RoleModule[]
  accounts: AuthorizedAccount[]
  manufacturerId: string
  expandedNodes: Set<string>
  onToggleNode: (id: string) => void
  onSaveAccounts: (accounts: AuthorizedAccount[]) => void
}) {
  const [selectedModuleCode, setSelectedModuleCode] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [parentAccount, setParentAccount] = useState<AuthorizedAccount | null>(null)
  const [manufacturerCategories, setManufacturerCategories] = useState<any[]>([])

  useEffect(() => {
    const loadCategories = async () => {
      if (!manufacturerId) {
        setManufacturerCategories([])
        return
      }
      try {
        const resp = await apiClient.get(`/manufacturers/${manufacturerId}/product-categories`)
        const list = resp.data?.data || []
        setManufacturerCategories(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('加载厂家商品分类失败:', e)
        setManufacturerCategories([])
      }
    }
    loadCategories()
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

  // 添加账号
  const handleAddAccount = (data: {
    accountId: string
    username: string
    nickname: string
    phone: string
    roleModuleId: string
    allocatedRate: number
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

    // 检查比例是否超限
    let maxAvailable = module.maxProfitRate - module.currentAllocatedRate
    if (parentAccount) {
      maxAvailable = parentAccount.availableRate
    }
    
    if (data.allocatedRate > maxAvailable) {
      toast.error(`分配比例不能超过 ${maxAvailable}%`)
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
      parentId: parentAccount?._id || null,
      parentName: parentAccount?.username,
      level: parentAccount ? parentAccount.level + 1 : 1,
      allocatedRate: data.allocatedRate,
      availableRate: data.allocatedRate,
      visibleCategoryIds: data.visibleCategoryIds,
      children: [],
      status: 'active',
      createdAt: new Date().toISOString()
    }

    onSaveAccounts([...accounts, newAccount])
    setShowAddModal(false)
    setParentAccount(null)
    toast.success('账号添加成功')
  }

  // 渲染树节点
  const renderNode = (account: AuthorizedAccount, depth: number = 0) => {
    const children = getChildren(account._id)
    const hasChildren = children.length > 0
    const isExpanded = expandedNodes.has(account._id)
    const module = modules.find(m => m._id === account.roleModuleId)
    const Icon = module ? (ICON_MAP[module.icon] || Layers) : Users
    const visibleCount = account.visibleCategoryIds?.length || 0

    return (
      <div key={account._id} className="select-none">
        <div 
          className={`flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors`}
          style={{ marginLeft: depth * 24 }}
        >
          {/* 展开/收起按钮 */}
          <button
            onClick={() => hasChildren && onToggleNode(account._id)}
            className={`p-1 rounded ${hasChildren ? 'hover:bg-gray-200' : ''}`}
            disabled={!hasChildren}
          >
            {hasChildren ? (
              isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <span className="w-4 h-4" />
            )}
          </button>
          
          {/* 图标 */}
          <div className={`p-1.5 rounded-lg ${
            account.status === 'active' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
          }`}>
            <Icon className="w-4 h-4" />
          </div>
          
          {/* 账号信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{account.nickname || account.username}</span>
              <span className="text-xs text-gray-400">@{account.username}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                account.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {account.status === 'active' ? '正常' : '暂停'}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
              <span>{module?.name}</span>
              <span>•</span>
              <span>分配: {account.allocatedRate}%</span>
              <span>•</span>
              <span>可授权: {account.availableRate}%</span>
              <span>•</span>
              <span>品类: {visibleCount > 0 ? `${visibleCount}个` : '全部'}</span>
            </div>
          </div>
          
          {/* 操作 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                setParentAccount(account)
                setShowAddModal(true)
              }}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
              title="添加下级"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="查看详情"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-gray-100 ml-5">
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
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
          <span className="text-sm text-gray-500">
            共 {filteredAccounts.length} 个账号
          </span>
        </div>
        <button
          onClick={() => {
            setParentAccount(null)
            setShowAddModal(true)
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          添加顶级账号
        </button>
      </div>

      {/* 层级树 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="mb-4 pb-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">授权层级关系</h3>
          <p className="text-sm text-gray-500 mt-1">展示多层级的授权关系，点击 + 按钮可添加下级</p>
        </div>
        
        {rootAccounts.length === 0 ? (
          <div className="text-center py-12">
            <GitBranch className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无授权账号</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 text-primary-600 hover:text-primary-700 text-sm"
            >
              添加第一个账号
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {rootAccounts.map(account => renderNode(account))}
          </div>
        )}
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
          manufacturerCategories={manufacturerCategories}
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
  manufacturerCategories,
  existingUserIds,
  onClose,
  onSave
}: {
  modules: RoleModule[]
  parentAccount: AuthorizedAccount | null
  manufacturerId: string
  manufacturerCategories: Array<{ id: string; name: string; parentId?: string | null; count: number }>
  existingUserIds: string[]
  onClose: () => void
  onSave: (data: {
    accountId: string
    username: string
    nickname: string
    phone: string
    roleModuleId: string
    allocatedRate: number
    visibleCategoryIds: string[]
  }) => void
}) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [accountKeyword, setAccountKeyword] = useState('')

  const parentHasCustomVisibility = !!(parentAccount?.visibleCategoryIds && parentAccount.visibleCategoryIds.length > 0)
  const parentVisibleCategoryIds = parentHasCustomVisibility
    ? parentAccount!.visibleCategoryIds!.map(String)
    : []

  const [formData, setFormData] = useState({
    accountId: '',
    roleModuleId: parentAccount?.roleModuleId || modules[0]?._id || '',
    allocatedRate: 5,
    visibilityMode: (parentHasCustomVisibility ? 'custom' : 'all') as 'all' | 'custom',
    visibleCategoryIds: (parentHasCustomVisibility ? parentVisibleCategoryIds : []) as string[]
  })

  useEffect(() => {
    const loadAccounts = async () => {
      if (!manufacturerId) {
        setAccounts([])
        return
      }
      try {
        const resp = await apiClient.get(`/manufacturers/${manufacturerId}/accounts`)
        const list = resp.data?.data || []
        setAccounts(Array.isArray(list) ? list : [])
      } catch (e) {
        console.error('加载厂家账号失败:', e)
        setAccounts([])
      }
    }
    loadAccounts()
  }, [manufacturerId])

  const selectedModule = modules.find(m => m._id === formData.roleModuleId)
  const maxRate = parentAccount 
    ? parentAccount.availableRate 
    : (selectedModule ? selectedModule.maxProfitRate - selectedModule.currentAllocatedRate : 0)

  const allowedCategoryIds = parentAccount?.visibleCategoryIds && parentAccount.visibleCategoryIds.length > 0
    ? new Set(parentAccount.visibleCategoryIds.map(String))
    : null
  const effectiveCategories = allowedCategoryIds
    ? manufacturerCategories.filter(c => allowedCategoryIds.has(String(c.id)))
    : manufacturerCategories

  const filteredAccounts = accounts
    .filter(a => !existingUserIds.includes(String(a._id)))
    .filter(a => {
      if (!accountKeyword.trim()) return true
      const t = `${a.username || ''} ${a.nickname || ''} ${a.phone || ''}`.toLowerCase()
      return t.includes(accountKeyword.trim().toLowerCase())
    })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const selected = accounts.find(a => String(a._id) === String(formData.accountId))
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

    onSave({
      accountId: String(selected._id),
      username: String(selected.username || ''),
      nickname: String(selected.nickname || selected.username || ''),
      phone: String(selected.phone || ''),
      roleModuleId: formData.roleModuleId,
      allocatedRate: formData.allocatedRate,
      visibleCategoryIds
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            {parentAccount ? `添加下级账号（上级: ${parentAccount.nickname || parentAccount.username}）` : '添加顶级账号'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              <option value="all" disabled={parentHasCustomVisibility}>全部品类</option>
              <option value="custom">自定义</option>
            </select>
            {parentAccount?.visibleCategoryIds && parentAccount.visibleCategoryIds.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">下级可选品类不会超出上级范围</p>
            )}
          </div>

          {formData.visibilityMode === 'custom' && (
            <div className="border border-gray-200 rounded-lg p-3 max-h-56 overflow-y-auto">
              {effectiveCategories.length === 0 ? (
                <p className="text-sm text-gray-500">该厂家暂无可选品类</p>
              ) : (
                <div className="space-y-2">
                  {effectiveCategories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={formData.visibleCategoryIds.includes(String(c.id))}
                        onChange={() => {
                          const id = String(c.id)
                          setFormData(prev => ({
                            ...prev,
                            visibleCategoryIds: prev.visibleCategoryIds.includes(id)
                              ? prev.visibleCategoryIds.filter(x => x !== id)
                              : [...prev.visibleCategoryIds, id]
                          }))
                        }}
                        className="rounded text-primary"
                      />
                      <span className="text-sm font-medium">{c.name}</span>
                      <span className="text-xs text-gray-400">({c.count})</span>
                    </label>
                  ))}
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

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
