import apiClient from '@/lib/axios'
import { toast } from 'sonner'

// 追踪图片下载
export const trackImageDownload = async () => {
  try {
    const response = await apiClient.post('/users/track-download')
    if (response.data.success) {
      const { consecutiveDownloads, tagAdded, warning } = response.data.data
      
      // 如果用户被标记，显示警告
      if (tagAdded) {
        toast.error('您的账号已被标记为批量下载，请注意合规使用')
      } else if (warning) {
        toast.warning(warning)
      }
      
      return response.data.data
    }
  } catch (error) {
    console.error('追踪下载失败:', error)
  }
  return null
}

// 创建带追踪的下载链接处理器
export const createTrackedDownloadHandler = (imageUrl: string, filename?: string) => {
  return async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 先追踪下载
    await trackImageDownload()
    
    // 然后执行下载
    try {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = filename || 'image.jpg'
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('下载失败:', error)
      toast.error('下载失败')
    }
  }
}

// 图片右键菜单拦截（用于拦截用户右键保存图片）
export const handleImageContextMenu = async (e: React.MouseEvent) => {
  // 追踪右键操作（可能是保存图片）
  await trackImageDownload()
}
