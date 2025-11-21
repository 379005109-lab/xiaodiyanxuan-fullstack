import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Package, Heart, Settings, LogOut, Gift } from 'lucide-react';
import ShareModal from '@/components/frontend/ShareModal';
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/lib/utils'

export default function UserProfilePage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile');
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const tabs = [
    { id: 'profile', name: '个人信息', icon: User },
    { id: 'orders', name: '我的订单', icon: Package },
    { id: 'favorites', name: '我的收藏', icon: Heart },
    { id: 'settings', name: '账号设置', icon: Settings },
    { id: 'share', name: '推荐好友', icon: Gift },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧边栏 */}
          <aside className="lg:col-span-1">
            <div className="card">
              {/* 用户信息 */}
              <div className="text-center mb-6 pb-6 border-b border-gray-200">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold text-lg">{user?.username}</h3>
                <p className="text-sm text-gray-600 mt-1">{user?.email}</p>
              </div>

              {/* 菜单 */}
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                    if (tab.id === 'share') {
                      setShareModalOpen(true);
                    } else {
                      setActiveTab(tab.id);
                    }
                  }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.name}</span>
                    </button>
                  )
                })}
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span>退出登录</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* 主内容区 */}
          <main className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card"
            >
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">个人信息</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm text-gray-600">用户名</span>
                        <p className="font-medium">{user?.username}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">邮箱</span>
                        <p className="font-medium">{user?.email}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">手机号</span>
                        <p className="font-medium">{user?.phone || '未设置'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">角色</span>
                        <p className="font-medium">{user?.role}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">注册时间</span>
                        <p className="font-medium">{user?.createdAt ? formatDate(user.createdAt) : '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">账户余额</span>
                        <p className="font-medium text-primary-600">¥{user?.balance || 0}</p>
                      </div>
                    </div>
                    <button className="btn-primary">编辑个人信息</button>
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">我的订单</h2>
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">暂无订单</p>
                  </div>
                </div>
              )}

              {activeTab === 'favorites' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">我的收藏</h2>
                  <div className="text-center py-12">
                    <Heart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">暂无收藏</p>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-2xl font-bold mb-6">账号设置</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-4">修改密码</h3>
                      <div className="space-y-4">
                        <input type="password" placeholder="当前密码" className="input" />
                        <input type="password" placeholder="新密码" className="input" />
                        <input type="password" placeholder="确认新密码" className="input" />
                        <button className="btn-primary">保存修改</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </main>
        </div>
      </div>
      <ShareModal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} />
    </div>
  )
}

