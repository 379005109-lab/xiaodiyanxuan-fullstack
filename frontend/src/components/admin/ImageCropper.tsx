import { useState, useRef, useCallback, useEffect } from 'react'
import { X, RotateCw, RotateCcw, ZoomIn, ZoomOut, Check, Maximize2, Square, RectangleHorizontal } from 'lucide-react'

interface ImageCropperProps {
  imageFile: File
  onCrop: (croppedBlob: Blob) => void
  onCancel: () => void
  aspectRatios?: { label: string; value: number | null }[]
}

export default function ImageCropper({ imageFile, onCrop, onCancel, aspectRatios }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [imageSrc, setImageSrc] = useState<string>('')
  const [imageLoaded, setImageLoaded] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedRatio, setSelectedRatio] = useState<number | null>(1) // 默认1:1
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null)
  
  // 默认比例选项
  const defaultRatios = aspectRatios || [
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4/3 },
    { label: '3:4', value: 3/4 },
    { label: '16:9', value: 16/9 },
    { label: '自由', value: null },
  ]

  // 加载图片
  useEffect(() => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string)
    }
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  // 图片加载完成
  useEffect(() => {
    if (!imageSrc) return
    
    const img = new Image()
    img.onload = () => {
      setImageElement(img)
      setImageLoaded(true)
      
      // 计算初始缩放以适应容器
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 40
        const containerHeight = containerRef.current.clientHeight - 40
        const imgRatio = img.width / img.height
        const containerRatio = containerWidth / containerHeight
        
        let initialScale: number
        if (imgRatio > containerRatio) {
          initialScale = containerWidth / img.width
        } else {
          initialScale = containerHeight / img.height
        }
        setScale(Math.min(initialScale, 1))
      }
    }
    img.src = imageSrc
  }, [imageSrc])

  // 旋转
  const handleRotate = (direction: 'cw' | 'ccw') => {
    setRotation(prev => prev + (direction === 'cw' ? 90 : -90))
  }

  // 缩放
  const handleZoom = (delta: number) => {
    setScale(prev => Math.max(0.1, Math.min(3, prev + delta)))
  }

  // 拖拽开始
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  // 拖拽移动
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  // 拖拽结束
  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 触摸事件支持
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    setIsDragging(true)
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y })
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const touch = e.touches[0]
    setPosition({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    })
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
  }

  // 滚轮缩放
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    handleZoom(delta)
  }

  // 计算裁剪区域尺寸
  const getCropAreaSize = useCallback(() => {
    if (!containerRef.current) return { width: 300, height: 300 }
    
    const maxWidth = containerRef.current.clientWidth - 80
    const maxHeight = containerRef.current.clientHeight - 80
    
    if (selectedRatio === null) {
      // 自由裁剪，使用正方形
      const size = Math.min(maxWidth, maxHeight)
      return { width: size, height: size }
    }
    
    let width: number, height: number
    if (selectedRatio >= 1) {
      width = Math.min(maxWidth, maxHeight * selectedRatio)
      height = width / selectedRatio
    } else {
      height = Math.min(maxHeight, maxWidth / selectedRatio)
      width = height * selectedRatio
    }
    
    // 确保不超出容器
    if (width > maxWidth) {
      width = maxWidth
      height = width / selectedRatio
    }
    if (height > maxHeight) {
      height = maxHeight
      width = height * selectedRatio
    }
    
    return { width, height }
  }, [selectedRatio])

  // 执行裁剪
  const handleCrop = () => {
    if (!imageElement || !canvasRef.current || !containerRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const cropSize = getCropAreaSize()
    const containerRect = containerRef.current.getBoundingClientRect()
    
    // 设置输出画布大小
    const outputSize = Math.max(cropSize.width, cropSize.height)
    canvas.width = cropSize.width
    canvas.height = cropSize.height
    
    // 清除画布
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 计算变换
    ctx.save()
    
    // 移动到裁剪区域中心
    ctx.translate(canvas.width / 2, canvas.height / 2)
    
    // 应用旋转
    ctx.rotate((rotation * Math.PI) / 180)
    
    // 计算图片在画布中的位置
    const imgWidth = imageElement.width * scale
    const imgHeight = imageElement.height * scale
    
    // 计算相对于裁剪框中心的偏移
    const offsetX = position.x
    const offsetY = position.y
    
    ctx.drawImage(
      imageElement,
      -imgWidth / 2 + offsetX,
      -imgHeight / 2 + offsetY,
      imgWidth,
      imgHeight
    )
    
    ctx.restore()
    
    // 导出为 Blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onCrop(blob)
        }
      },
      'image/jpeg',
      0.9
    )
  }

  const cropSize = getCropAreaSize()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-lg">图片取景器</h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 裁剪区域 */}
        <div 
          ref={containerRef}
          className="flex-1 bg-gray-900 relative overflow-hidden flex items-center justify-center min-h-[400px]"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {/* 遮罩层 */}
          <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none" />
          
          {/* 裁剪框 */}
          <div 
            className="relative bg-transparent border-2 border-white shadow-lg pointer-events-none z-10"
            style={{ 
              width: cropSize.width, 
              height: cropSize.height,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)'
            }}
          >
            {/* 网格线 */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="border border-white border-opacity-30" />
              ))}
            </div>
            
            {/* 角标 */}
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white" />
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white" />
          </div>

          {/* 图片 */}
          {imageLoaded && (
            <img
              src={imageSrc}
              alt="裁剪预览"
              className="absolute max-w-none pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                transformOrigin: 'center center',
              }}
              draggable={false}
            />
          )}
        </div>

        {/* 工具栏 */}
        <div className="p-4 bg-gray-50 border-t space-y-4">
          {/* 比例选择 */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600 mr-2">比例：</span>
            {defaultRatios.map((ratio) => (
              <button
                key={ratio.label}
                onClick={() => setSelectedRatio(ratio.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedRatio === ratio.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {ratio.label}
              </button>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 旋转 */}
              <button
                onClick={() => handleRotate('ccw')}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                title="逆时针旋转90°"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleRotate('cw')}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                title="顺时针旋转90°"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              
              <div className="w-px h-6 bg-gray-300 mx-2" />
              
              {/* 缩放 */}
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                title="缩小"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600 w-12 text-center">{Math.round(scale * 100)}%</span>
              <button
                onClick={() => handleZoom(0.1)}
                className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                title="放大"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              
              <div className="w-px h-6 bg-gray-300 mx-2" />
              
              {/* 重置 */}
              <button
                onClick={() => {
                  setRotation(0)
                  setScale(1)
                  setPosition({ x: 0, y: 0 })
                }}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                重置
              </button>
            </div>

            {/* 确认按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCrop}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                确认裁剪
              </button>
            </div>
          </div>
        </div>

        {/* 隐藏的画布用于导出 */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
