import { useState } from 'react'
import { motion } from 'framer-motion'
import { Unlock, AlertCircle, CheckCircle2, Copy } from 'lucide-react'
import { unbanUser, getBannedUsers, unbanXiaodi, createOrUpdateSuperAdmin } from '@/utils/userUnban'
import { toast } from 'sonner'

export default function UserUnbanPage() {
  const [username, setUsername] = useState('xiaodi')
  const [bannedUsers, setBannedUsers] = useState<any[]>([])
  const [showBannedList, setShowBannedList] = useState(false)

  const handleUnbanXiaodi = () => {
    const success = unbanXiaodi()
    if (success) {
      toast.success('xiaodi 账号已解禁！正在跳转...')
      setUsername('')
    } else {
      toast.error('解禁失败，请检查用户是否存在')
    }
  }

  const handleUnbanUser = () => {
    if (!username.trim()) {
      toast.error('请输入用户名')
      return
    }
    const success = unbanUser(username)
    if (success) {
      toast.success(`${username} 已解禁！`)
      setUsername('')
    } else {
      toast.error('解禁失败，请检查用户是否存在')
    }
  }

  const handleShowBannedUsers = () => {
    const users = getBannedUsers()
    setBannedUsers(users)
    setShowBannedList(true)
  }

  const handleCreateSuperAdmin = () => {
    const success = createOrUpdateSuperAdmin('xiaodi', 'xiaodi@admin.com', 'admin123')
    if (success) {
      toast.success('超级管理员账号已创建/更新！')
    } else {
      toast.error('创建/更新失败')
    }
  }

  const copyCommand = (command: string) => {
    navigator.clipboard.writeText(command)
    toast.success('命令已复制到剪贴板')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 页头 */}
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Unlock className="h-8 w-8 text-blue-600" />
              用户解禁工具
            </h1>
            <p className="text-gray-600 mt-1">快速解禁被封禁的用户账号</p>
          </div>

          {/* 快速解禁 xiaodi */}
          <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-blue-900 mb-2">快速解禁 xiaodi</h2>
                <p className="text-sm text-blue-700 mb-4">
                  xiaodi 是超级管理员账号，点击下方按钮快速解禁
                </p>
                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={handleUnbanXiaodi}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center gap-2"
                  >
                    <Unlock className="h-4 w-4" />
                    解禁 xiaodi
                  </button>
                  <button
                    onClick={handleCreateSuperAdmin}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold transition-colors"
                  >
                    创建/更新超级管理员
                  </button>
                </div>
              </div>
              <CheckCircle2 className="h-12 w-12 text-blue-600 flex-shrink-0" />
            </div>
          </div>

          {/* 手动解禁 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">手动解禁用户</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入用户名
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入要解禁的用户名"
                    className="input flex-1"
                  />
                  <button
                    onClick={handleUnbanUser}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition-colors"
                  >
                    解禁
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 查看被封禁用户 */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">被封禁的用户</h2>
              <button
                onClick={handleShowBannedUsers}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
              >
                刷新列表
              </button>
            </div>
            
            {showBannedList && bannedUsers.length > 0 ? (
              <div className="space-y-3">
                {bannedUsers.map((user) => (
                  <div key={user._id} className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{user.username}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">角色: {user.role}</p>
                    </div>
                    <button
                      onClick={() => {
                        unbanUser(user.username)
                        toast.success(`${user.username} 已解禁`)
                        handleShowBannedUsers()
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors"
                    >
                      解禁
                    </button>
                  </div>
                ))}
              </div>
            ) : showBannedList ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-green-700">暂无被封禁的用户</p>
              </div>
            ) : (
              <p className="text-gray-600">点击"刷新列表"查看被封禁的用户</p>
            )}
          </div>

          {/* 控制台命令 */}
          <div className="card bg-gray-900 text-gray-100">
            <h2 className="text-xl font-bold mb-4">控制台命令</h2>
            <p className="text-sm text-gray-400 mb-4">
              也可以在浏览器开发者工具的 Console 中执行以下命令：
            </p>
            <div className="space-y-3">
              {[
                { label: '快速解禁 xiaodi', command: "import { unbanXiaodi } from '@/utils/userUnban'; unbanXiaodi()" },
                { label: '解禁指定用户', command: "import { unbanUser } from '@/utils/userUnban'; unbanUser('username')" },
                { label: '查看被封禁用户', command: "import { getBannedUsers } from '@/utils/userUnban'; getBannedUsers()" },
                { label: '创建超级管理员', command: "import { createOrUpdateSuperAdmin } from '@/utils/userUnban'; createOrUpdateSuperAdmin('xiaodi', 'xiaodi@admin.com', 'admin123')" },
              ].map((item) => (
                <div key={item.label} className="p-3 bg-gray-800 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-300">{item.label}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">{item.command}</p>
                  </div>
                  <button
                    onClick={() => copyCommand(item.command)}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                    title="复制命令"
                  >
                    <Copy className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* 使用说明 */}
          <div className="card bg-amber-50 border-l-4 border-amber-500">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">使用说明</h3>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>点击"解禁 xiaodi"按钮快速解禁超级管理员账号</li>
                  <li>或在"手动解禁用户"中输入用户名进行解禁</li>
                  <li>点击"刷新列表"查看当前被封禁的所有用户</li>
                  <li>解禁后需要刷新页面才能看到更新</li>
                  <li>也可以在浏览器控制台中执行命令进行操作</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
