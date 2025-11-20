import { useState } from 'react'
import { toast } from 'sonner'
import {
  createOrderNotification,
  createSystemNotification,
  createMessageNotification,
  getAllNotifications,
  getUnreadCount,
  clearAllNotifications,
  getNotificationStats
} from '@/services/notificationService'

export default function NotificationTestPage() {
  const [stats, setStats] = useState<any>(null)

  const handleCreateOrderNotification = () => {
    const notification = createOrderNotification(
      '新订单提醒',
      '您收到了一个新订单 #ORD202411070001，总金额 ¥5,999',
      'ORD202411070001'
    )
    toast.success('订单通知已创建')
    updateStats()
  }

  const handleCreateSystemNotification = () => {
    const notification = createSystemNotification(
      '系统通知',
      '系统将于今晚 22:00 进行维护，预计持续 2 小时'
    )
    toast.success('系统通知已创建')
    updateStats()
  }

  const handleCreateMessageNotification = () => {
    const notification = createMessageNotification(
      '新消息',
      '客户 张三 给您发送了一条消息'
    )
    toast.success('消息通知已创建')
    updateStats()
  }

  const handleClearAll = () => {
    clearAllNotifications()
    toast.success('所有通知已清空')
    updateStats()
  }

  const updateStats = () => {
    const newStats = getNotificationStats()
    setStats(newStats)
  }

  const handleViewNotifications = () => {
    const notifications = getAllNotifications()
    console.log('所有通知:', notifications)
    toast.success(`共有 ${notifications.length} 条通知`)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">通知系统测试</h1>

      {/* 统计信息 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">通知统计</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">总通知数</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.total || 0}</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">未读通知</p>
            <p className="text-2xl font-bold text-red-600">{stats?.unread || 0}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">已读通知</p>
            <p className="text-2xl font-bold text-green-600">{stats?.read || 0}</p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">订单通知</p>
            <p className="text-2xl font-bold text-purple-600">{stats?.byType?.order || 0}</p>
          </div>
        </div>
      </div>

      {/* 创建通知 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">创建通知</h2>
        <div className="space-y-3">
          <button
            onClick={handleCreateOrderNotification}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            创建订单通知
          </button>
          <button
            onClick={handleCreateSystemNotification}
            className="w-full px-4 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium transition-colors"
          >
            创建系统通知
          </button>
          <button
            onClick={handleCreateMessageNotification}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            创建消息通知
          </button>
        </div>
      </div>

      {/* 操作 */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">操作</h2>
        <div className="space-y-3">
          <button
            onClick={() => {
              updateStats()
              toast.success('已刷新统计信息')
            }}
            className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium transition-colors"
          >
            刷新统计
          </button>
          <button
            onClick={handleViewNotifications}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
          >
            查看所有通知（控制台）
          </button>
          <button
            onClick={handleClearAll}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
          >
            清空所有通知
          </button>
        </div>
      </div>

      {/* 说明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">使用说明</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 点击按钮创建不同类型的通知</li>
          <li>• 通知会自动保存到 localStorage</li>
          <li>• 在后台头部可以看到通知铃铛显示未读数</li>
          <li>• 点击通知可以标记为已读</li>
          <li>• 所有操作都会实时更新统计信息</li>
        </ul>
      </div>
    </div>
  )
}
