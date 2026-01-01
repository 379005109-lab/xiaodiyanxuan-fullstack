import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Users, ArrowLeft, Save, Filter } from 'lucide-react'
import apiClient from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'

interface Account {
  _id: string
  username: string
  nickname?: string
  email?: string
  phone?: string
  role: string
  manufacturerId?: string
  permissions?: {
    canAccessAdmin?: boolean
    canViewCostPrice?: boolean
    canDownloadMaterial?: boolean
    canManageUsers?: boolean
    canManageProducts?: boolean
    canManageOrders?: boolean
  }
  status?: string
  createdAt?: string
}

export default function BatchAccountManagement() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin'

  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filterRole, setFilterRole] = useState('')
  const [filterStatus, setFilterStatus] = useState('active')

  const [batchForm, setBatchForm] = useState({
    role: '',
    permissions: {
      canAccessAdmin: false,
      canViewCostPrice: false,
      canDownloadMaterial: false,
      canManageUsers: false,
      canManageProducts: false,
      canManageOrders: false
    }
  })

  const loadAccounts = async () => {
    setLoading(true)
    try {
      const params: any = { pageSize: 10000 }
      if (filterRole) params.role = filterRole
      if (filterStatus) params.status = filterStatus

      const res = await apiClient.get('/users', { params })
      setAccounts(res.data?.data || [])
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '加载失败')
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadAccounts()
    }
  }, [isAdmin, filterRole, filterStatus])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(accounts.map(a => a._id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id))
    }
  }

  const handleBatchUpdate = async () => {
    if (selectedIds.length === 0) {
      toast.error('请先选择要修改的账号')
      return
    }

    if (!batchForm.role && !Object.values(batchForm.permissions).some(v => v)) {
      toast.error('请至少选择一项要修改的内容')
      return
    }

    if (!confirm(`确定要批量修改 ${selectedIds.length} 个账号吗？`)) {
      return
    }

    setLoading(true)
    try {
      const updateData: any = {}
      if (batchForm.role) updateData.role = batchForm.role
      if (Object.values(batchForm.permissions).some(v => v)) {
        updateData.permissions = batchForm.permissions
      }

      await apiClient.post('/users/batch-update', {
        userIds: selectedIds,
        updates: updateData
      })

      toast.success(`成功修改 ${selectedIds.length} 个账号`)
      setSelectedIds([])
      setBatchForm({
        role: '',
        permissions: {
          canAccessAdmin: false,
          canViewCostPrice: false,
          canDownloadMaterial: false,
          canManageUsers: false,
          canManageProducts: false,
          canManageOrders: false
        }
      })
      await loadAccounts()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || '批量修改失败')
    } finally {
      setLoading(false)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'super_admin': '超级管理员',
      'admin': '管理员',
      'enterprise_admin': '企业管理员',
      'enterprise_staff': '企业员工',
      'designer': '设计师',
      'customer': '客户',
      'user': '普通用户'
    }
    return labels[role] || role
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          只有管理员可以访问批量账号管理功能
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">批量账号管理</h1>
          <p className="text-sm text-gray-500 mt-1">批量设置账号级别、权限和折扣规则</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/users')}>
          <ArrowLeft className="w-4 h-4" />
          返回账号列表
        </button>
      </div>

      {/* 筛选栏 */}
      <div className="mb-6 card p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">角色筛选</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input w-full"
            >
              <option value="">所有角色</option>
              <option value="designer">设计师</option>
              <option value="enterprise_admin">企业管理员</option>
              <option value="enterprise_staff">企业员工</option>
              <option value="customer">客户</option>
              <option value="user">普通用户</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">状态筛选</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="input w-full"
            >
              <option value="">所有状态</option>
              <option value="active">活跃</option>
              <option value="inactive">停用</option>
              <option value="banned">封禁</option>
            </select>
          </div>
        </div>
      </div>

      {/* 批量操作面板 */}
      {selectedIds.length > 0 && (
        <div className="mb-6 card p-6 bg-blue-50 border-blue-200">
          <h3 className="text-lg font-semibold mb-4">批量修改 ({selectedIds.length} 个账号)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">修改角色</label>
              <select
                value={batchForm.role}
                onChange={(e) => setBatchForm({ ...batchForm, role: e.target.value })}
                className="input w-full"
              >
                <option value="">不修改</option>
                <option value="designer">设计师</option>
                <option value="enterprise_admin">企业管理员</option>
                <option value="enterprise_staff">企业员工</option>
                <option value="customer">客户</option>
                <option value="user">普通用户</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">权限设置</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={batchForm.permissions.canAccessAdmin}
                    onChange={(e) => setBatchForm({
                      ...batchForm,
                      permissions: { ...batchForm.permissions, canAccessAdmin: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">访问后台</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={batchForm.permissions.canViewCostPrice}
                    onChange={(e) => setBatchForm({
                      ...batchForm,
                      permissions: { ...batchForm.permissions, canViewCostPrice: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">查看成本价</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={batchForm.permissions.canManageProducts}
                    onChange={(e) => setBatchForm({
                      ...batchForm,
                      permissions: { ...batchForm.permissions, canManageProducts: e.target.checked }
                    })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">管理商品</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              onClick={() => setSelectedIds([])}
              className="btn btn-secondary"
            >
              取消选择
            </button>
            <button
              onClick={handleBatchUpdate}
              disabled={loading}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? '保存中...' : '批量保存'}
            </button>
          </div>
        </div>
      )}

      {/* 账号列表 */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === accounts.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4"
                  />
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">用户名</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">昵称</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">角色</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">权限</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">状态</th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-700">创建时间</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">暂无账号数据</p>
                  </td>
                </tr>
              ) : (
                accounts.map((account) => (
                  <tr key={account._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(account._id)}
                        onChange={(e) => handleSelectOne(account._id, e.target.checked)}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium text-gray-900">{account.username}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-700">{account.nickname || '-'}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                        {getRoleLabel(account.role)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {account.permissions?.canAccessAdmin && (
                          <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">后台</span>
                        )}
                        {account.permissions?.canViewCostPrice && (
                          <span className="px-2 py-0.5 text-xs rounded bg-purple-100 text-purple-700">成本价</span>
                        )}
                        {account.permissions?.canManageProducts && (
                          <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-700">商品</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        account.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {account.status === 'active' ? '活跃' : '停用'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {account.createdAt ? new Date(account.createdAt).toLocaleDateString() : '-'}
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
