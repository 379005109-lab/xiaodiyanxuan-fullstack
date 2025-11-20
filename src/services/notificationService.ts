// 通知服务 - 本地化实现

export interface Notification {
  id: string
  type: 'order' | 'system' | 'message'
  title: string
  message: string
  read: boolean
  createdAt: string
  relatedId?: string
  actionUrl?: string
}

const STORAGE_KEY = 'notifications'

// 获取所有通知
export const getAllNotifications = (): Notification[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// 获取未读通知
export const getUnreadNotifications = (): Notification[] => {
  return getAllNotifications().filter(n => !n.read)
}

// 获取未读数
export const getUnreadCount = (): number => {
  return getUnreadNotifications().length
}

// 添加通知
export const addNotification = (notification: Omit<Notification, 'id' | 'createdAt'>): Notification => {
  const newNotification: Notification = {
    ...notification,
    id: Math.random().toString(36).substr(2, 9),
    createdAt: new Date().toISOString()
  }
  const notifications = getAllNotifications()
  notifications.push(newNotification)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  return newNotification
}

// 标记已读
export const markAsRead = (id: string): void => {
  const notifications = getAllNotifications()
  const notification = notifications.find(n => n.id === id)
  if (notification) {
    notification.read = true
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }
}

// 标记全部已读
export const markAllAsRead = (): void => {
  const notifications = getAllNotifications()
  notifications.forEach(n => { n.read = true })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
}

// 删除通知
export const deleteNotification = (id: string): void => {
  const notifications = getAllNotifications()
  const filtered = notifications.filter(n => n.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

// 清空所有通知
export const clearAllNotifications = (): void => {
  localStorage.removeItem(STORAGE_KEY)
}

// 获取最近通知
export const getRecentNotifications = (limit = 10): Notification[] => {
  const notifications = getAllNotifications()
  return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit)
}

// 按类型筛选
export const getNotificationsByType = (type: 'order' | 'system' | 'message'): Notification[] => {
  return getAllNotifications().filter(n => n.type === type)
}

// 创建订单通知
export const createOrderNotification = (title: string, message: string, orderId: string): Notification => {
  return addNotification({
    type: 'order',
    title,
    message,
    read: false,
    relatedId: orderId,
    actionUrl: `/admin/orders/${orderId}`
  })
}

// 创建系统通知
export const createSystemNotification = (title: string, message: string): Notification => {
  return addNotification({
    type: 'system',
    title,
    message,
    read: false
  })
}

// 创建消息通知
export const createMessageNotification = (title: string, message: string): Notification => {
  return addNotification({
    type: 'message',
    title,
    message,
    read: false
  })
}

// 获取统计
export const getNotificationStats = () => {
  const notifications = getAllNotifications()
  return {
    total: notifications.length,
    unread: getUnreadCount(),
    order: getNotificationsByType('order').length,
    system: getNotificationsByType('system').length,
    message: getNotificationsByType('message').length
  }
}

// 搜索通知
export const searchNotifications = (query: string): Notification[] => {
  const notifications = getAllNotifications()
  const lowerQuery = query.toLowerCase()
  return notifications.filter(n =>
    n.title.toLowerCase().includes(lowerQuery) ||
    n.message.toLowerCase().includes(lowerQuery)
  )
}

// 分类通知
export const categorizeNotifications = () => {
  const notifications = getAllNotifications()
  return {
    order: notifications.filter(n => n.type === 'order'),
    system: notifications.filter(n => n.type === 'system'),
    message: notifications.filter(n => n.type === 'message')
  }
}

// 按日期分组
export const groupNotificationsByDate = () => {
  const notifications = getAllNotifications()
  const grouped: Record<string, Notification[]> = {}
  
  notifications.forEach(n => {
    const date = new Date(n.createdAt).toLocaleDateString('zh-CN')
    if (!grouped[date]) {
      grouped[date] = []
    }
    grouped[date].push(n)
  })
  
  return grouped
}

// 导出为 JSON
export const exportNotificationsAsJSON = (): string => {
  const notifications = getAllNotifications()
  return JSON.stringify(notifications, null, 2)
}

// 导出为 CSV
export const exportNotificationsAsCSV = (): string => {
  const notifications = getAllNotifications()
  const headers = ['ID', '类型', '标题', '消息', '已读', '创建时间']
  const rows = notifications.map(n => [
    n.id,
    n.type,
    n.title,
    n.message,
    n.read ? '是' : '否',
    new Date(n.createdAt).toLocaleString('zh-CN')
  ])
  
  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n')
  
  return csv
}

// 下载通知
export const downloadNotifications = (format: 'json' | 'csv' = 'json'): void => {
  const content = format === 'json' ? exportNotificationsAsJSON() : exportNotificationsAsCSV()
  const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `notifications.${format}`
  link.click()
  URL.revokeObjectURL(url)
}

// 清理旧通知
export const cleanOldNotifications = (days: number = 30): number => {
  const notifications = getAllNotifications()
  const now = new Date()
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  
  const filtered = notifications.filter(n => new Date(n.createdAt) > cutoff)
  const removed = notifications.length - filtered.length
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  return removed
}

// 获取详细统计
export const getDetailedStats = () => {
  const notifications = getAllNotifications()
  const unread = notifications.filter(n => !n.read)
  
  return {
    total: notifications.length,
    unread: unread.length,
    read: notifications.length - unread.length,
    order: notifications.filter(n => n.type === 'order').length,
    system: notifications.filter(n => n.type === 'system').length,
    message: notifications.filter(n => n.type === 'message').length,
    today: notifications.filter(n => {
      const date = new Date(n.createdAt)
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }).length
  }
}

// 批量操作通知
export const batchOperateNotifications = (ids: string[], operation: 'read' | 'unread' | 'delete'): void => {
  const notifications = getAllNotifications()
  
  if (operation === 'delete') {
    const filtered = notifications.filter(n => !ids.includes(n.id))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } else {
    notifications.forEach(n => {
      if (ids.includes(n.id)) {
        n.read = operation === 'read'
      }
    })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications))
  }
}

// 获取排序后的通知
export const getSortedNotifications = (sortBy: 'time' | 'type' | 'read'): Notification[] => {
  const notifications = getAllNotifications()
  
  if (sortBy === 'time') {
    return [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sortBy === 'type') {
    return [...notifications].sort((a, b) => a.type.localeCompare(b.type))
  } else if (sortBy === 'read') {
    return [...notifications].sort((a, b) => (a.read ? 1 : 0) - (b.read ? 1 : 0))
  }
  
  return notifications
}

// 获取通知摘要
export const getNotificationSummary = () => {
  const notifications = getAllNotifications()
  const recent = notifications.slice(-5)
  
  return {
    total: notifications.length,
    recent,
    unreadCount: notifications.filter(n => !n.read).length
  }
}

// 是否有重要通知
export const hasImportantNotifications = (): boolean => {
  const notifications = getAllNotifications()
  return notifications.some(n => n.type === 'order' && !n.read)
}

// 获取重要通知
export const getImportantNotifications = (): Notification[] => {
  const notifications = getAllNotifications()
  return notifications.filter(n => n.type === 'order' && !n.read)
}

// 生成通知报告
export const generateNotificationReport = () => {
  const stats = getDetailedStats()
  const categorized = categorizeNotifications()
  const grouped = groupNotificationsByDate()
  
  return {
    stats,
    categorized,
    grouped,
    generatedAt: new Date().toISOString()
  }
}
