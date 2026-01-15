import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Search, Key, Edit, Trash2, Power, Ban } from 'lucide-react'
import * as accountService from '@/services/accountService'
import apiClient from '@/lib/apiClient'

interface ManufacturerQuota {
  accountQuota?: {
    totalAccounts?: number
    subAccounts?: number
  }
  accountUsage?: {
    subAccounts?: number
  }
}

export default function EnterpriseUserManagement() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<accountService.AccountUser[]>([])
  const [keyword, setKeyword] = useState('')
  const [quota, setQuota] = useState<ManufacturerQuota>({})

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetTarget, setResetTarget] = useState<accountService.AccountUser | null>(null)

  const [createForm, setCreateForm] = useState({
    username: '',
    password: '',
    nickname: '',
    phone: '',
    email: '',
  })

  const [resetPassword, setResetPassword] = useState('')

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await accountService.getUsers({ keyword: keyword || undefined })
      setUsers(data.list || [])
      
      // 加载厂家配额信息
      try {
        const quotaRes = await apiClient.get('/manufacturers/me')
        if (quotaRes.data.success) {
          setQuota(quotaRes.data.data)
        }
      } catch (err) {
        console.error('加载配额信息失败:', err)
      }
    } catch (error: any) {
      toast.error(error.message || '加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSearch = () => {
    loadUsers()
  }

  const handleCreate = async () => {
    if (!createForm.username.trim()) {
      toast.error('请输入用户名')
      return
    }
    if (!createForm.phone.trim()) {
      toast.error('请输入手机号')
      return
    }

    // 检查账号配额
    const maxAccounts = quota.accountQuota?.subAccounts || quota.accountQuota?.totalAccounts || 0
    const activeUsers = users.filter(u => u.status === 'active').length
    
    if (maxAccounts > 0 && activeUsers >= maxAccounts) {
      toast.error(`账号数量已达上限（${maxAccounts}个），无法创建新账号。冻结的账号不占用额度。`)
      return
    }

    setLoading(true)
    try {
      // 生成默认密码：手机号后6位
      const defaultPassword = createForm.phone.slice(-6)
      
      await accountService.createUser({
        username: createForm.username.trim(),
        password: defaultPassword,
        nickname: createForm.username.trim(),
        phone: createForm.phone.trim(),
        email: undefined,
        role: 'enterprise_staff',
      })
      toast.success(`账号创建成功！默认密码为手机号后6位：${defaultPassword}`)
      setShowCreateModal(false)
      setCreateForm({ username: '', password: '', nickname: '', phone: '', email: '' })
      await loadUsers()
    } catch (error: any) {
      toast.error(error.message || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  const openResetModal = (user: accountService.AccountUser) => {
    setResetTarget(user)
    setResetPassword('')
    setShowResetModal(true)
  }

  const handleResetPassword = async () => {
    if (!resetTarget) return
    if (!resetPassword.trim() || resetPassword.length < 6) {
      toast.error('密码至少6位')
      return
    }

    setLoading(true)
    try {
      await accountService.resetUserPassword(resetTarget._id, resetPassword)
      toast.success('密码重置成功')
      setShowResetModal(false)
      setResetTarget(null)
      setResetPassword('')
    } catch (error: any) {
      toast.error(error.message || '重置失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async (user: accountService.AccountUser) => {
    // 企业管理员账号不能被关闭
    if (user.role === 'enterprise_admin') {
      toast.error('企业管理员账号不能被关闭')
      return
    }
    
    const nextStatus = user.status === 'active' ? 'banned' : 'active'
    const actionText = nextStatus === 'banned' ? '关闭' : '开启'
    
    if (!confirm(`确定要${actionText}账号 "${user.username}" 吗？`)) {
      return
    }
    
    setLoading(true)
    try {
      await accountService.updateUser(user._id, { status: nextStatus })
      toast.success(`账号已${actionText}`)
      setUsers(prev => prev.map(u => (u._id === user._id ? { ...u, status: nextStatus } : u)))
      // 重新加载配额信息
      await loadUsers()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (user: accountService.AccountUser) => {
    if (!confirm(`确定要删除账号 "${user.username}" 吗？`)) return
    setLoading(true)
    try {
      await accountService.deleteUser(user._id)
      toast.success('已删除')
      setUsers(prev => prev.filter(u => u._id !== user._id))
    } catch (error: any) {
      toast.error(error.message || '删除失败')
    } finally {
      setLoading(false)
    }
  }

  const maxAccounts = quota.accountQuota?.subAccounts || quota.accountQuota?.totalAccounts || 0
  const activeUsers = users.filter(u => u.status === 'active').length
  const bannedUsers = users.filter(u => u.status === 'banned').length

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">账号管理</h1>
        <p className="text-gray-500 mt-1">仅管理本厂家体系下的子账号</p>
        {maxAccounts > 0 && (
          <div className="mt-3 flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              账号配额：<span className="font-semibold text-blue-600">{activeUsers}</span> / {maxAccounts}
            </span>
            {bannedUsers > 0 && (
              <span className="text-gray-500">
                冻结账号：{bannedUsers} （不占用额度）
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="搜索用户名/昵称/手机/邮箱"
                className="pl-10 pr-4 py-2 border rounded-lg w-72"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              搜索
            </button>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 shadow-sm"
            disabled={loading}
          >
            <Plus className="w-4 h-4" />
            新建子账号
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">账号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">角色</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">创建时间</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">加载中...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">暂无数据</td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{u.nickname || u.username}</div>
                      <div className="text-sm text-gray-500">{u.username}{u.phone ? ` | ${u.phone}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{accountService.ROLE_LABELS[u.role] || u.role}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          u.status === 'active' ? 'bg-green-100 text-green-700' :
                          u.status === 'banned' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {u.status === 'active' ? '正常' : u.status === 'banned' ? '已禁用' : u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role !== 'enterprise_admin' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-2 rounded-lg ${
                              u.status === 'active' 
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                            }`}
                            title={u.status === 'active' ? '关闭账号' : '开启账号'}
                            disabled={loading}
                          >
                            {u.status === 'active' ? <Power className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => openResetModal(u)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg"
                          title="重置密码"
                          disabled={loading}
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-lg"
                          title="删除"
                          disabled={loading}
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

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 mx-4">
            <h2 className="text-xl font-bold mb-4">新建子账号</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">用户名 *</label>
                <input
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="请输入用户名"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手机号 *</label>
                <input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  placeholder="请输入手机号"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  🔑 默认密码为手机号后6位，用户首次登录后可自行修改。
                </p>
              </div>

              <div className="text-sm text-gray-500">
                创建的账号角色固定为：{accountService.ROLE_LABELS['enterprise_staff']}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                disabled={loading}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetModal && resetTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 mx-4">
            <h2 className="text-xl font-bold mb-2">重置密码</h2>
            <div className="text-sm text-gray-500 mb-4">账号：{resetTarget.username}</div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新密码 *</label>
              <input
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowResetModal(false)
                  setResetTarget(null)
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                取消
              </button>
              <button
                onClick={handleResetPassword}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                disabled={loading}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
