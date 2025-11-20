import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Edit, Ban, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { fetchUsers, updateUserProfile } from '@/services/userService'
import { User } from '@/types'
import { toast } from 'sonner'

const mockUsers: User[] = Array.from({ length: 20 }, (_, i) => ({
    _id: `user-${i + 1}`,
    username: `用户${i + 1}`,
    email: `user${i + 1}@example.com`,
    phone: `138****${String(i).padStart(4, '0')}`,
    role: (['customer', 'designer', 'distributor', 'admin'][i % 4] as User['role']),
    status: i % 7 === 0 ? 'banned' : 'active',
    balance: Math.random() * 10000,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    calculatedRole: i % 4 === 0 ? '高价值决策人' : i % 3 === 0 ? '分享达人' : '活跃用户',
    tags: i % 2 === 0 ? ['高客单', '复购'] : ['内容互动'],
    metrics: {
      orderCount: 5 + i,
      gmv: 8000 + i * 500,
      shareRate: 5 + (i % 5),
    },
  }))

const roleConfig: Record<string, { label: string; color: string }> = {
    super_admin: { label: '超级管理员', color: 'bg-red-100 text-red-700' },
    admin: { label: '管理员', color: 'bg-purple-100 text-purple-700' },
    designer: { label: '设计师', color: 'bg-blue-100 text-blue-700' },
    distributor: { label: '分销商', color: 'bg-green-100 text-green-700' },
    customer: { label: '普通用户', color: 'bg-gray-100 text-gray-700' },
  }

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editRole, setEditRole] = useState<User['role']>('customer')
  const [editStatus, setEditStatus] = useState<User['status']>('active')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const result = await fetchUsers()
        if (result?.data?.length) {
          setUsers(result.data)
        } else {
          setUsers(mockUsers)
        }
        setError(null)
      } catch (err: any) {
        console.warn('获取用户失败，使用本地数据：', err?.message)
        setError('实时用户接口暂不可用，已显示示例数据。')
        setUsers(mockUsers)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (searchQuery && !user.username.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !user.email.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      if (filterRole && user.role !== filterRole) {
        return false
      }
      return true
    })
  }, [users, searchQuery, filterRole])

  const openEditDrawer = (user: User) => {
    setEditingUser(user)
    setEditRole(user.role)
    setEditStatus(user.status)
  }

  const handleSaveUser = async () => {
    if (!editingUser) return
    try {
      await updateUserProfile(editingUser._id, { role: editRole, status: editStatus })
      setUsers((prev) =>
        prev.map((u) => (u._id === editingUser._id ? { ...u, role: editRole, status: editStatus } : u))
      )
      toast.success('账号信息已更新')
      setEditingUser(null)
    } catch (err: any) {
      toast.error(err?.message || '更新失败，稍后再试')
    }
  }

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'active' ? 'banned' : 'active'
    try {
      await updateUserProfile(user._id, { status: nextStatus })
      setUsers((prev) => prev.map((u) => (u._id === user._id ? { ...u, status: nextStatus } : u)))
      toast.success(`已将 ${user.username} 状态调整为 ${nextStatus === 'active' ? '正常' : '封禁'}`)
    } catch (err: any) {
      toast.error(err?.message || '状态更新失败')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">用户管理</h1>
        <p className="text-gray-600 mt-1">共 {users.length} 个账号{error && <span className="text-amber-600 text-xs ml-2">{error}</span>}</p>
      </div>

      {/* 统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: '普通用户', count: users.filter((u) => u.role === 'customer').length },
          { label: '设计师', count: users.filter((u) => u.role === 'designer').length },
          { label: '分销商', count: users.filter((u) => u.role === 'distributor').length },
          { label: '管理员', count: users.filter((u) => ['admin', 'super_admin'].includes(u.role)).length },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card"
          >
            <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-primary-600">{stat.count}</p>
          </motion.div>
        ))}
      </div>

      {/* 筛选 */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索用户名或邮箱..."
              className="input pl-10"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="input"
          >
            <option value="">所有角色</option>
            <option value="customer">普通用户</option>
            <option value="designer">设计师</option>
            <option value="distributor">分销商</option>
            <option value="admin">管理员</option>
          </select>
          <button className="btn-secondary flex items-center justify-center">
            <Filter className="h-5 w-5 mr-2" />
            高级筛选
          </button>
        </div>
      </div>

      {/* 用户列表 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">用户</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">角色</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">手机号</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">余额</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">状态</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">注册时间</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="py-6 text-center text-gray-500">用户信息加载中...</td></tr>
              )}
              {!loading && filteredUsers.map((user, index) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.username.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${roleConfig[user.role as keyof typeof roleConfig].color}`}>
                      {roleConfig[user.role as keyof typeof roleConfig].label}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm">{user.phone}</td>
                  <td className="py-4 px-4 text-sm font-medium">¥{(user.balance ?? 0).toFixed(2)}</td>
                  <td className="py-4 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {user.status === 'active' ? '正常' : '已封禁'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">{formatDate(user.createdAt)}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        title="编辑"
                        onClick={() => openEditDrawer(user)}
                      >
                        <Edit className="h-4 w-4 text-blue-600" />
                      </button>
                      {user.status === 'active' ? (
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="封禁"
                          onClick={() => handleToggleStatus(user)}
                        >
                          <Ban className="h-4 w-4 text-red-600" />
                        </button>
                      ) : (
                        <button
                          className="p-2 hover:bg-gray-100 rounded-lg"
                          title="解封"
                          onClick={() => handleToggleStatus(user)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">编辑账号</h3>
                <p className="text-sm text-gray-500">{editingUser.username} · {editingUser.email}</p>
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => setEditingUser(null)}>✕</button>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">角色</label>
              <select className="input w-full" value={editRole} onChange={(e) => setEditRole(e.target.value as User['role'])}>
                <option value="customer">普通用户</option>
                <option value="designer">设计师</option>
                <option value="distributor">分销商</option>
                <option value="admin">管理员</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">状态</label>
              <select className="input w-full" value={editStatus} onChange={(e) => setEditStatus(e.target.value as User['status'])}>
                <option value="active">正常</option>
                <option value="banned">封禁</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn btn-ghost" onClick={() => setEditingUser(null)}>取消</button>
              <button className="btn-primary" onClick={handleSaveUser}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

