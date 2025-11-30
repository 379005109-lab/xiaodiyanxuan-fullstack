import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { 
  Building2, Users, UserPlus, Key, Search, MoreVertical,
  Edit, Trash2, RefreshCw, Shield, Eye, EyeOff, Copy,
  ChevronDown, Plus, Settings, BarChart3, TrendingUp, AlertTriangle, UserCheck
} from 'lucide-react'
import * as accountService from '@/services/accountService'
import { ROLE_LABELS, ORG_TYPE_LABELS, USER_ROLES, DashboardData } from '@/services/accountService'

type TabType = 'dashboard' | 'organizations' | 'users' | 'designers' | 'special'

export default function AccountManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [loading, setLoading] = useState(false)
  
  // 看板数据
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  
  // 组织数据
  const [organizations, setOrganizations] = useState<accountService.Organization[]>([])
  const [orgType, setOrgType] = useState<string>('')
  
  // 用户数据
  const [users, setUsers] = useState<accountService.AccountUser[]>([])
  const [userRole, setUserRole] = useState<string>('')
  const [userKeyword, setUserKeyword] = useState('')
  
  // 特殊账号数据
  const [specialAccounts, setSpecialAccounts] = useState<accountService.AccountUser[]>([])
  
  // 模态框状态
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showSpecialModal, setShowSpecialModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState<accountService.Organization | null>(null)
  const [editingUser, setEditingUser] = useState<accountService.AccountUser | null>(null)

  // 加载数据
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadDashboard()
    } else if (activeTab === 'organizations') {
      loadOrganizations()
    } else if (activeTab === 'users' || activeTab === 'designers') {
      loadUsers()
    } else if (activeTab === 'special') {
      loadSpecialAccounts()
    }
  }, [activeTab, orgType, userRole])

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const data = await accountService.getDashboard()
      setDashboard(data)
    } catch (error: any) {
      toast.error(error.message || '加载看板数据失败')
    } finally {
      setLoading(false)
    }
  }

  const loadOrganizations = async () => {
    setLoading(true)
    try {
      const data = await accountService.getOrganizations({ type: orgType || undefined })
      setOrganizations(data.list || [])
    } catch (error: any) {
      toast.error(error.message || '加载组织列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    setLoading(true)
    try {
      const role = activeTab === 'designers' ? USER_ROLES.DESIGNER : (userRole || undefined)
      const data = await accountService.getUsers({ 
        role,
        keyword: userKeyword || undefined 
      })
      setUsers(data.list || [])
    } catch (error: any) {
      toast.error(error.message || '加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const loadSpecialAccounts = async () => {
    setLoading(true)
    try {
      const data = await accountService.getSpecialAccounts()
      setSpecialAccounts(data.list || [])
    } catch (error: any) {
      toast.error(error.message || '加载特殊账号失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrg = async (org: accountService.Organization) => {
    if (!confirm(`确定要删除组织"${org.name}"吗？`)) return
    try {
      await accountService.deleteOrganization(org._id)
      toast.success('删除成功')
      loadOrganizations()
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  const handleDeleteUser = async (user: accountService.AccountUser) => {
    if (!confirm(`确定要删除用户"${user.nickname || user.username}"吗？`)) return
    try {
      await accountService.deleteUser(user._id)
      toast.success('删除成功')
      loadUsers()
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    }
  }

  const handleCreateSpecialAccount = async () => {
    try {
      const data = await accountService.createSpecialAccount({
        note: '临时访问',
        expiresInHours: 24,
        maxUsage: 10,
      })
      toast.success(`特殊账号已创建，访问码: ${data.accessCode}`)
      loadSpecialAccounts()
    } catch (error: any) {
      toast.error(error.message || '创建失败')
    }
  }

  const copyAccessCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('访问码已复制')
  }

  const tabs = [
    { id: 'dashboard', label: '用户看板', icon: BarChart3 },
    { id: 'organizations', label: '平台/企业', icon: Building2 },
    { id: 'users', label: '用户账号', icon: Users },
    { id: 'designers', label: '设计师', icon: UserPlus },
    { id: 'special', label: '特殊账号', icon: Key },
  ]

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">账号管理</h1>
        <p className="text-gray-500 mt-1">管理平台、企业、设计师和特殊账号</p>
      </div>

      {/* 标签页 */}
      <div className="bg-white rounded-xl shadow-sm mb-6">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 用户看板 */}
        {activeTab === 'dashboard' && (
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">加载中...</div>
            ) : dashboard ? (
              <div className="space-y-6">
                {/* 概览卡片 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-blue-600 mb-2">
                      <Users className="w-5 h-5" />
                      <span className="text-sm">总用户数</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{dashboard.overview.totalUsers}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-green-600 mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm">今日新增</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{dashboard.overview.todayNewUsers}</div>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-purple-600 mb-2">
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-sm">本月新增</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700">{dashboard.overview.monthNewUsers}</div>
                  </div>
                  <div className="bg-cyan-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-cyan-600 mb-2">
                      <UserCheck className="w-5 h-5" />
                      <span className="text-sm">7日活跃</span>
                    </div>
                    <div className="text-2xl font-bold text-cyan-700">{dashboard.overview.activeUsers}</div>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-orange-600 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm">被标记用户</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700">{dashboard.overview.taggedUsers}</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm">批量下载</span>
                    </div>
                    <div className="text-2xl font-bold text-red-700">{dashboard.overview.bulkDownloadUsers}</div>
                  </div>
                </div>

                {/* 角色分布 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">角色分布</h3>
                    <div className="space-y-3">
                      {dashboard.roleStats.map((stat) => (
                        <div key={stat._id} className="flex items-center justify-between">
                          <span className="text-gray-600">{ROLE_LABELS[stat._id] || stat._id || '未设置'}</span>
                          <span className="font-medium">{stat.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">被标记用户</h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {dashboard.recentTaggedUsers.length === 0 ? (
                        <p className="text-gray-400 text-sm">暂无被标记用户</p>
                      ) : (
                        dashboard.recentTaggedUsers.map((user) => (
                          <div key={user._id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <div className="font-medium text-sm">{user.nickname || user.username}</div>
                              <div className="text-xs text-gray-500">{user.phone}</div>
                            </div>
                            <div className="flex gap-1">
                              {user.tags?.map((tag, idx) => (
                                <span 
                                  key={idx} 
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    tag === '批量下载' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* 最近注册用户 */}
                <div className="bg-white rounded-xl border p-4">
                  <h3 className="font-semibold text-gray-900 mb-4">最近注册用户</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">用户</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">角色</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">状态</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-600">注册时间</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {dashboard.recentUsers.map((user) => (
                          <tr key={user._id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div className="font-medium text-sm">{user.nickname || user.username}</div>
                              <div className="text-xs text-gray-500">{user.phone}</div>
                            </td>
                            <td className="px-4 py-2">
                              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">
                                {ROLE_LABELS[user.role] || user.role}
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {user.status === 'active' ? '正常' : user.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">暂无数据</div>
            )}
          </div>
        )}

        {/* 组织管理 */}
        {activeTab === 'organizations' && (
          <div className="p-6">
            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <select
                  value={orgType}
                  onChange={(e) => setOrgType(e.target.value)}
                  className="px-4 py-2 border rounded-lg"
                >
                  <option value="">全部类型</option>
                  <option value="platform">供应链平台</option>
                  <option value="enterprise">企业</option>
                </select>
              </div>
              <button
                onClick={() => { setEditingOrg(null); setShowOrgModal(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                新建组织
              </button>
            </div>

            {/* 组织列表 */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-gray-500">加载中...</div>
              ) : organizations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无数据</div>
              ) : (
                organizations.map((org) => (
                  <div key={org._id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-primary-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{org.name}</h3>
                            <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                              {ORG_TYPE_LABELS[org.type]}
                            </span>
                            <span className="text-xs text-gray-400">{org.code}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            联系人: {org.contactPerson || '-'} | 
                            用户数: {org.quota?.usedUsers || 0}/{org.quota?.maxUsers || 50}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditingOrg(org); setShowOrgModal(true) }}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrg(org)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 用户管理 */}
        {(activeTab === 'users' || activeTab === 'designers') && (
          <div className="p-6">
            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {activeTab === 'users' && (
                  <select
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value="">全部角色</option>
                    <option value="platform_admin">平台管理员</option>
                    <option value="platform_staff">平台子账号</option>
                    <option value="enterprise_admin">企业管理员</option>
                    <option value="enterprise_staff">企业子账号</option>
                    <option value="customer">普通客户</option>
                  </select>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="搜索用户..."
                    value={userKeyword}
                    onChange={(e) => setUserKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadUsers()}
                    className="pl-10 pr-4 py-2 border rounded-lg w-64"
                  />
                </div>
              </div>
              <button
                onClick={() => { setEditingUser(null); setShowUserModal(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                {activeTab === 'designers' ? '添加设计师' : '新建账号'}
              </button>
            </div>

            {/* 用户列表 */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">角色</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">标签</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">组织</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">加载中...</td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-gray-500">暂无数据</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              {user.avatar ? (
                                <img src={user.avatar} alt="" className="w-10 h-10 rounded-full" />
                              ) : (
                                <span className="text-gray-500 font-medium">
                                  {(user.nickname || user.username)?.[0]?.toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.nickname || user.username}</div>
                              <div className="text-sm text-gray-500">{user.phone || user.email || '-'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
                            {ROLE_LABELS[user.role] || user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.tags && user.tags.length > 0 ? (
                              user.tags.map((tag, idx) => (
                                <span 
                                  key={idx} 
                                  className={`px-2 py-0.5 text-xs rounded-full ${
                                    tag === '批量下载' ? 'bg-red-100 text-red-700' :
                                    tag === '高风险' ? 'bg-orange-100 text-orange-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}
                                  title={user.downloadStats?.totalDownloads 
                                    ? `总下载: ${user.downloadStats.totalDownloads}次` 
                                    : undefined}
                                >
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {user.organizationId?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-700' :
                            user.status === 'banned' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.status === 'active' ? '正常' : 
                             user.status === 'banned' ? '已禁用' : 
                             user.status === 'expired' ? '已过期' : '未激活'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditingUser(user); setShowUserModal(true) }}
                              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 特殊账号 */}
        {activeTab === 'special' && (
          <div className="p-6">
            {/* 工具栏 */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500">
                特殊账号用于临时让客户查看成本价，有效期和使用次数可配置
              </p>
              <button
                onClick={() => setShowSpecialModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="w-4 h-4" />
                生成访问码
              </button>
            </div>

            {/* 特殊账号列表 */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-12 text-gray-500">加载中...</div>
              ) : specialAccounts.length === 0 ? (
                <div className="text-center py-12 text-gray-500">暂无特殊账号</div>
              ) : (
                specialAccounts.map((account) => (
                  <div key={account._id} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <Key className="w-6 h-6 text-amber-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-lg font-bold text-gray-900">
                              {account.specialAccountConfig?.accessCode}
                            </span>
                            <button
                              onClick={() => copyAccessCode(account.specialAccountConfig?.accessCode || '')}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              account.status === 'active' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>
                              {account.status === 'active' ? '有效' : '已失效'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            使用次数: {account.specialAccountConfig?.usedCount || 0}/{account.specialAccountConfig?.maxUsage || '∞'} | 
                            过期时间: {account.specialAccountConfig?.expiresAt 
                              ? new Date(account.specialAccountConfig.expiresAt).toLocaleString() 
                              : '永不过期'}
                            {account.specialAccountConfig?.note && ` | 备注: ${account.specialAccountConfig.note}`}
                          </p>
                        </div>
                      </div>
                      {account.status === 'active' && (
                        <button
                          onClick={async () => {
                            if (!confirm('确定要使该访问码失效吗？')) return
                            try {
                              await accountService.invalidateSpecialAccount(account._id)
                              toast.success('已使访问码失效')
                              loadSpecialAccounts()
                            } catch (error: any) {
                              toast.error(error.message || '操作失败')
                            }
                          }}
                          className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                        >
                          使其失效
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 组织编辑模态框 */}
      {showOrgModal && (
        <OrganizationModal
          organization={editingOrg}
          onClose={() => setShowOrgModal(false)}
          onSave={() => { setShowOrgModal(false); loadOrganizations() }}
        />
      )}

      {/* 用户编辑模态框 */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          organizations={organizations}
          isDesigner={activeTab === 'designers'}
          onClose={() => setShowUserModal(false)}
          onSave={() => { setShowUserModal(false); loadUsers() }}
        />
      )}

      {/* 特殊账号生成模态框 */}
      {showSpecialModal && (
        <SpecialAccountModal
          onClose={() => setShowSpecialModal(false)}
          onSave={() => { setShowSpecialModal(false); loadSpecialAccounts() }}
        />
      )}
    </div>
  )
}

// 组织编辑模态框
function OrganizationModal({ 
  organization, 
  onClose, 
  onSave 
}: { 
  organization: accountService.Organization | null
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    type: organization?.type || 'enterprise',
    contactPerson: organization?.contactPerson || '',
    contactPhone: organization?.contactPhone || '',
    contactEmail: organization?.contactEmail || '',
    description: organization?.description || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('请输入组织名称')
      return
    }
    
    setLoading(true)
    try {
      if (organization) {
        await accountService.updateOrganization(organization._id, formData)
        toast.success('更新成功')
      } else {
        await accountService.createOrganization(formData as any)
        toast.success('创建成功')
      }
      onSave()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">{organization ? '编辑组织' : '新建组织'}</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">组织名称 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              placeholder="输入组织名称"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">类型 *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg"
              disabled={!!organization}
            >
              <option value="platform">供应链平台</option>
              <option value="enterprise">企业</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系人</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              rows={3}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            取消
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 用户编辑模态框
function UserModal({ 
  user, 
  organizations,
  isDesigner,
  onClose, 
  onSave 
}: { 
  user: accountService.AccountUser | null
  organizations: accountService.Organization[]
  isDesigner: boolean
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    nickname: user?.nickname || '',
    phone: user?.phone || '',
    email: user?.email || '',
    role: user?.role || (isDesigner ? USER_ROLES.DESIGNER : USER_ROLES.CUSTOMER),
    organizationId: (user?.organizationId as any)?._id || '',
    status: user?.status || 'active',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!formData.username) {
      toast.error('请输入用户名')
      return
    }
    if (!user && !formData.password) {
      toast.error('请输入密码')
      return
    }
    
    setLoading(true)
    try {
      if (user) {
        const updateData: any = { ...formData }
        delete updateData.password
        delete updateData.username
        await accountService.updateUser(user._id, updateData)
        toast.success('更新成功')
      } else {
        await accountService.createUser(formData as any)
        toast.success('创建成功')
      }
      onSave()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold mb-4">
          {user ? '编辑用户' : (isDesigner ? '添加设计师' : '新建账号')}
        </h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
                disabled={!!user}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {user ? '新密码（留空不修改）' : '密码 *'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">昵称</label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          
          {!isDesigner && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="platform_admin">平台管理员</option>
                  <option value="platform_staff">平台子账号</option>
                  <option value="enterprise_admin">企业管理员</option>
                  <option value="enterprise_staff">企业子账号</option>
                  <option value="designer">设计师</option>
                  <option value="customer">普通客户</option>
                </select>
              </div>
              
              {['platform_admin', 'platform_staff', 'enterprise_admin', 'enterprise_staff'].includes(formData.role) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">所属组织</label>
                  <select
                    value={formData.organizationId}
                    onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="">选择组织</option>
                    {organizations.map((org) => (
                      <option key={org._id} value={org._id}>{org.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="active">正常</option>
              <option value="inactive">未激活</option>
              <option value="banned">已禁用</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            取消
          </button>
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

// 特殊账号生成模态框
function SpecialAccountModal({ 
  onClose, 
  onSave 
}: { 
  onClose: () => void
  onSave: () => void
}) {
  const [formData, setFormData] = useState({
    note: '',
    expiresInHours: 24,
    maxUsage: 10,
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ accessCode: string; expiresAt: string } | null>(null)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const data = await accountService.createSpecialAccount(formData)
      setResult(data)
      toast.success('访问码已生成')
    } catch (error: any) {
      toast.error(error.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const copyAccessCode = () => {
    if (result) {
      navigator.clipboard.writeText(result.accessCode)
      toast.success('访问码已复制')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">生成特殊访问码</h2>
        
        {result ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-500 mb-2">访问码已生成</p>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="font-mono text-3xl font-bold text-gray-900">{result.accessCode}</span>
              <button onClick={copyAccessCode} className="p-2 hover:bg-gray-100 rounded-lg">
                <Copy className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <p className="text-sm text-gray-500">
              有效期至: {new Date(result.expiresAt).toLocaleString()}
            </p>
            <button
              onClick={onSave}
              className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              完成
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="如：给XX客户看价"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">有效期（小时）</label>
                  <input
                    type="number"
                    value={formData.expiresInHours}
                    onChange={(e) => setFormData({ ...formData, expiresInHours: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大使用次数</label>
                  <input
                    type="number"
                    value={formData.maxUsage}
                    onChange={(e) => setFormData({ ...formData, maxUsage: Number(e.target.value) })}
                    className="w-full px-4 py-2 border rounded-lg"
                    min={1}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                取消
              </button>
              <button 
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? '生成中...' : '生成访问码'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
