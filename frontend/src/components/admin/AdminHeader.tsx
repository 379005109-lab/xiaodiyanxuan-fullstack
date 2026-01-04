import { useState, useEffect, type MouseEvent } from 'react'
import { Bell, Menu, User, LogOut, Settings, ExternalLink, X, Lock, Phone, Camera, Image, Factory } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import cloudServices from '@/services/cloudServices'
import apiClient from '@/lib/apiClient'

interface AdminHeaderProps {
  toggleSidebar: () => void
}

export default function AdminHeader({ toggleSidebar }: AdminHeaderProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'password' | 'phone' | 'avatar'>('password')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState(user?.phone || '')
  const [unreadCount, setUnreadCount] = useState(0)
  const [authTodoCount, setAuthTodoCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])

  // 加载通知数据
  useEffect(() => {
    // 延迟加载通知，避免阻塞页面渲染
    const timer = setTimeout(() => {
      loadNotifications()
      loadAuthorizationSummary()
    }, 500)
    
    // 监听通知更新事件
    const handleNotificationUpdate = () => {
      loadNotifications()
      loadAuthorizationSummary()
    }
    
    window.addEventListener('notificationUpdated', handleNotificationUpdate)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('notificationUpdated', handleNotificationUpdate)
    }
  }, [])

  const loadAuthorizationSummary = async () => {
    try {
      const response = await apiClient.get('/authorizations/summary')
      const data = response.data
      if (data?.success) {
        setAuthTodoCount(Number(data?.data?.todoCount || 0))
      } else {
        setAuthTodoCount(0)
      }
    } catch (error) {
      setAuthTodoCount(0)
    }
  }

  const loadNotifications = async () => {
    try {
      if (cloudServices?.notificationService && typeof cloudServices.notificationService.getRecentNotifications === 'function') {
        try {
          const allNotifications = await cloudServices.notificationService.getRecentNotifications(10)
          setNotifications(allNotifications || [])
        } catch (e) {
          setNotifications([])
        }
        
        try {
          const unread = await cloudServices.notificationService.getUnreadCount()
          setUnreadCount(unread || 0)
        } catch (e) {
          setUnreadCount(0)
        }
      }
    } catch (error) {
      console.error('加载通知失败:', error)
      // 如果云端失败，使用默认值
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    
    return date.toLocaleDateString('zh-CN')
  }

  const handleLogout = () => {
    logout()
    navigate('/')
    toast.success('已退出登录')
  }

  const handleChangePassword = () => {
    if (!newPassword || !confirmPassword) {
      toast.error('请输入新密码')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次密码输入不一致')
      return
    }
    if (newPassword.length < 6) {
      toast.error('密码长度至少6位')
      return
    }
    // 模拟保存密码
    toast.success('密码修改成功')
    setNewPassword('')
    setConfirmPassword('')
    setShowSettings(false)
  }

  const handleChangePhone = () => {
    if (!phone) {
      toast.error('请输入电话号码')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入有效的手机号')
      return
    }
    // 模拟保存电话
    toast.success('电话号码修改成功')
    setShowSettings(false)
  }

  const handleChangeAvatar = () => {
    toast.success('头像修改成功')
    setShowSettings(false)
  }

  const handleMarkAsRead = async () => {
    try {
      await cloudServices.notificationService.markAllAsRead()
      loadNotifications()
      toast.success('已标记为已读')
    } catch (error) {
      console.error('标记已读失败:', error)
      toast.error('标记已读失败')
    }
  }

  const handleNotificationClick = async (notificationId: string, actionUrl?: string) => {
    try {
      await cloudServices.notificationService.markAsRead(notificationId)
      loadNotifications()
      if (actionUrl) {
        navigate(actionUrl)
        setShowNotifications(false)
      }
    } catch (error) {
      console.error('标记已读失败:', error)
      toast.error('标记已读失败')
    }
  }

  const handleDeleteNotification = async (notificationId: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    try {
      await cloudServices.notificationService.deleteNotification(notificationId)
      loadNotifications()
      toast.success('通知已删除')
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  const roleBadge = user?.role === 'designer'
  const totalUnread = unreadCount + authTodoCount

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 sticky top-0 z-30">
      {/* 左侧 */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </button>
        <h1 className="text-xl font-semibold text-gray-900">
          管理后台
        </h1>
      </div>

      {/* 右侧 */}
      <div className="flex items-center space-x-4">
        {/* 返回前台网站按钮 - 所有用户可见 */}
        <button
          onClick={() => navigate('/')}
          className="hidden md:flex items-center gap-2 px-3 py-2 text-xs font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-full hover:bg-primary-100 transition-colors"
        >
          <ExternalLink className="h-4 w-4" /> 返回前台首页
        </button>

        {/* 通知 */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5 text-gray-700" />
            {totalUnread > 0 && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {totalUnread}
              </span>
            )}
          </button>

          {/* 通知下拉菜单 */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">通知</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id, notif.actionUrl)}
                      className={`px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors flex items-start justify-between group ${
                        !notif.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                          {!notif.read && (
                            <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteNotification(notif.id, e)}
                        className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <p className="text-sm">暂无通知</p>
                  </div>
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-3 border-t border-gray-100 text-center">
                  <button
                    onClick={handleMarkAsRead}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    标记全部为已读
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 设置 */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-700" />
          </button>

          {/* 设置下拉菜单 */}
          {showSettings && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">用户设置</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 功能菜单 */}
              <div className="border-b border-gray-100">
                <button
                  onClick={() => { navigate('/admin/images'); setShowSettings(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Image className="h-4 w-4" />
                  网站图片管理
                </button>

                <button
                  onClick={() => { navigate('/admin/manufacturers'); setShowSettings(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Factory className="h-4 w-4" />
                  厂家短信绑定
                </button>
              </div>

              {/* 标签页 */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => setSettingsTab('password')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    settingsTab === 'password'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Lock className="h-4 w-4 inline mr-2" />
                  修改密码
                </button>
                <button
                  onClick={() => setSettingsTab('phone')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    settingsTab === 'phone'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Phone className="h-4 w-4 inline mr-2" />
                  电话号码
                </button>
                <button
                  onClick={() => setSettingsTab('avatar')}
                  className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    settingsTab === 'avatar'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Camera className="h-4 w-4 inline mr-2" />
                  头像
                </button>
              </div>

              {/* 内容 */}
              <div className="p-4">
                {settingsTab === 'password' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        新密码
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="输入新密码"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        确认密码
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入密码"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <button
                      onClick={handleChangePassword}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
                    >
                      保存密码
                    </button>
                  </div>
                )}

                {settingsTab === 'phone' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        电话号码
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="输入电话号码"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <button
                      onClick={handleChangePhone}
                      className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium text-sm"
                    >
                      保存电话
                    </button>
                  </div>
                )}

                {settingsTab === 'avatar' && (
                  <div className="space-y-4">
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
                        <User className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <label className="block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleChangeAvatar}
                        id="avatar-upload"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.getElementById('avatar-upload') as HTMLInputElement
                          input?.click()
                        }}
                        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-600 font-medium text-sm text-gray-700 hover:text-primary-600 transition-colors"
                      >
                        点击选择头像
                      </button>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 用户菜单 */}
        <div className="relative group">
          <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500">{user?.role}</p>
            </div>
          </button>

          {/* 下拉菜单 */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              <span>个人资料</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
            >
              <LogOut className="h-4 w-4" />
              <span>退出登录</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

