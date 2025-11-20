import { useState, useEffect } from 'react'
import { Search, Download, Trash2, Filter, Eye, EyeOff, AlertCircle, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'
import {
  getAllNotifications,
  searchNotifications,
  categorizeNotifications,
  groupNotificationsByDate,
  exportNotificationsAsJSON,
  exportNotificationsAsCSV,
  downloadNotifications,
  cleanOldNotifications,
  getDetailedStats,
  batchOperateNotifications,
  getSortedNotifications,
  getNotificationSummary,
  hasImportantNotifications,
  getImportantNotifications,
  generateNotificationReport,
  Notification
} from '@/services/notificationService'

export default function NotificationManagementPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'order' | 'system' | 'message'>('all')
  const [sortBy, setSortBy] = useState<'time' | 'type' | 'read'>('time')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState<any>(null)
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    loadNotifications()
  }, [searchQuery, filterType, sortBy])

  const loadNotifications = () => {
    let result = getAllNotifications()

    // 搜索
    if (searchQuery) {
      result = searchNotifications(searchQuery)
    }

    // 筛选
    if (filterType !== 'all') {
      result = result.filter(n => n.type === filterType)
    }

    // 排序
    result = getSortedNotifications(sortBy)

    setNotifications(result)
    setStats(getDetailedStats())
  }

  const handleSelectAll = () => {
    if (selectedIds.size === notifications.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(notifications.map(n => n.id)))
    }
  }

  const handleSelectNotification = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const handleBatchMarkAsRead = () => {
    const count = batchOperateNotifications(Array.from(selectedIds), 'read')
    toast.success(`已标记 ${count} 条通知为已读`)
    loadNotifications()
    setSelectedIds(new Set())
  }

  const handleBatchMarkAsUnread = () => {
    const count = batchOperateNotifications(Array.from(selectedIds), 'unread')
    toast.success(`已标记 ${count} 条通知为未读`)
    loadNotifications()
    setSelectedIds(new Set())
  }

  const handleBatchDelete = () => {
    if (confirm(`确定要删除 ${selectedIds.size} 条通知吗？`)) {
      const count = batchOperateNotifications(Array.from(selectedIds), 'delete')
      toast.success(`已删除 ${count} 条通知`)
      loadNotifications()
      setSelectedIds(new Set())
    }
  }

  const handleExportJSON = () => {
    downloadNotifications('json')
    toast.success('已导出为 JSON 文件')
  }

  const handleExportCSV = () => {
    downloadNotifications('csv')
    toast.success('已导出为 CSV 文件')
  }

  const handleCleanOld = () => {
    if (confirm('确定要删除7天前的通知吗？')) {
      const count = cleanOldNotifications(7)
      toast.success(`已删除 ${count} 条旧通知`)
      loadNotifications()
    }
  }

  const handleShowReport = () => {
    const report = generateNotificationReport()
    console.log(report)
    toast.success('报告已输出到控制台')
  }

  const handleShowSummary = () => {
    const summary = getNotificationSummary()
    console.log(summary)
    toast.success('摘要已输出到控制台')
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      order: '订单',
      system: '系统',
      message: '消息'
    }
    return labels[type] || type
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      order: 'bg-blue-100 text-blue-700',
      system: 'bg-yellow-100 text-yellow-700',
      message: 'bg-green-100 text-green-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">通知管理</h1>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">总通知数</p>
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">未读通知</p>
            <p className="text-2xl font-bold text-red-600">{stats.unread}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">已读通知</p>
            <p className="text-2xl font-bold text-green-600">{stats.read}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">重要通知</p>
            <p className="text-2xl font-bold text-orange-600">
              {getImportantNotifications().length}
            </p>
          </div>
        </div>
      )}

      {/* 工具栏 */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        {/* 搜索和筛选 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="搜索通知..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">所有类型</option>
            <option value="order">订单通知</option>
            <option value="system">系统通知</option>
            <option value="message">消息通知</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="time">按时间排序</option>
            <option value="type">按类型排序</option>
            <option value="read">按已读排序</option>
          </select>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <>
              <button
                onClick={handleBatchMarkAsRead}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                标记已读 ({selectedIds.size})
              </button>
              <button
                onClick={handleBatchMarkAsUnread}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm flex items-center gap-2"
              >
                <EyeOff className="h-4 w-4" />
                标记未读 ({selectedIds.size})
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                删除 ({selectedIds.size})
              </button>
            </>
          )}

          <button
            onClick={handleExportJSON}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            导出 JSON
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            导出 CSV
          </button>

          <button
            onClick={handleCleanOld}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            清理旧通知
          </button>

          <button
            onClick={handleShowReport}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            生成报告
          </button>

          <button
            onClick={handleShowSummary}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            显示摘要
          </button>
        </div>
      </div>

      {/* 通知列表 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.size === notifications.length && notifications.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold">标题</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">类型</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">内容</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">状态</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">时间</th>
            </tr>
          </thead>
          <tbody>
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <tr key={notification.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(notification.id)}
                      onChange={() => handleSelectNotification(notification.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{notification.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeColor(notification.type)}`}>
                      {getTypeLabel(notification.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {notification.message}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      notification.read
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {notification.read ? '已读' : '未读'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(notification.createdAt).toLocaleString('zh-CN')}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>没有找到匹配的通知</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 分页信息 */}
      <div className="mt-4 text-sm text-gray-600">
        显示 {notifications.length} 条通知
      </div>
    </div>
  )
}
