import { useState } from 'react'
import { trackImageDownload } from '@/services/downloadTracker'
import { cn } from '@/lib/utils'

interface TrackedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  trackDownload?: boolean  // 是否追踪下载行为
}

/**
 * 带下载追踪的图片组件
 * 当用户右键点击图片时，会自动追踪下载行为
 */
export default function TrackedImage({ 
  trackDownload = true, 
  className, 
  ...props 
}: TrackedImageProps) {
  const [tracked, setTracked] = useState(false)

  const handleContextMenu = async (e: React.MouseEvent) => {
    if (trackDownload && !tracked) {
      // 追踪下载行为（右键菜单可能用于保存图片）
      await trackImageDownload()
      setTracked(true)
      // 3秒后重置追踪状态，避免连续右键只计算一次
      setTimeout(() => setTracked(false), 3000)
    }
  }

  const handleDragStart = async (e: React.DragEvent) => {
    if (trackDownload) {
      // 拖拽图片也可能是下载行为
      await trackImageDownload()
    }
  }

  return (
    <img
      {...props}
      className={cn(className)}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
    />
  )
}
