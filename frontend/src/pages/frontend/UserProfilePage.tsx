import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, Package, Heart, Settings, LogOut, Gift, Check, Save } from 'lucide-react';
import ShareModal from '@/components/frontend/ShareModal';
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function UserProfilePage() {
  const { user, logout, updateUser } = useAuthStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('profile');
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nickname: '',
    gender: '' as '' | 'male' | 'female',
    phone: ''
  });

  useEffect(() => {
    if (user) {
      setForm({
        nickname: (user as any).nickname || '',
        gender: (user as any).gender || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!form.nickname.trim()) {
      toast.error('请输入姓名');
      return;
    }
    
    try {
      setSaving(true);
      const response = await fetch('https://pkochbpmcgaa.sealoshzh.site/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nickname: form.nickname.trim(),
          gender: form.gender,
          phone: form.phone.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        updateUser({ ...user, ...form } as any);
        toast.success('保存成功');
        setIsEditing(false);
      } else {
        toast.error(data.message || '保存失败');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

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
                  {((user as any)?.nickname || user?.phone || 'U').charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold text-lg">{(user as any)?.nickname || user?.phone || '用户'}</h3>
                <p className="text-sm text-gray-600 mt-1">{user?.phone}</p>
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
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">个人信息</h2>
                    {!isEditing ? (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary text-sm"
                      >
                        编辑资料
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="btn-secondary text-sm"
                        >
                          取消
                        </button>
                        <button 
                          onClick={handleSave}
                          disabled={saving}
                          className="btn-primary text-sm flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          {saving ? '保存中...' : '保存'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                        <input
                          type="text"
                          value={form.nickname}
                          onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                          className="input w-full"
                          placeholder="请输入您的姓名"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">性别</label>
                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, gender: 'male' })}
                            className={`flex-1 py-2 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                              form.gender === 'male'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {form.gender === 'male' && <Check className="w-4 h-4" />}
                            男
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, gender: 'female' })}
                            className={`flex-1 py-2 px-4 rounded-lg border-2 flex items-center justify-center gap-2 transition-all ${
                              form.gender === 'female'
                                ? 'border-primary bg-primary/5 text-primary'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {form.gender === 'female' && <Check className="w-4 h-4" />}
                            女
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="input w-full"
                          placeholder="请输入手机号"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <span className="text-sm text-gray-600">姓名</span>
                          <p className="font-medium">{(user as any)?.nickname || '未设置'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">性别</span>
                          <p className="font-medium">
                            {(user as any)?.gender === 'male' ? '男' : 
                             (user as any)?.gender === 'female' ? '女' : '未设置'}
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">手机号</span>
                          <p className="font-medium">{user?.phone || '未设置'}</p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">角色</span>
                          <p className="font-medium">{user?.role === 'customer' ? '普通用户' : user?.role}</p>
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
                    </div>
                  )}
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

