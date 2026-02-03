import { useState, useRef, useEffect, useCallback } from 'react'
import { X, Pencil, Trash2, Save, RotateCcw, Ruler, ArrowRight, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

// 标注类型
type AnnotationType = 'line' | 'arrow' | 'dimension'

// 标注数据结构
interface Annotation {
  id: string
  type: AnnotationType
  startX: number
  startY: number
  endX: number
  endY: number
  value: string
  unit: 'CM' | 'MM' | 'M' | 'INCH'
  color: string
}

interface ImageAnnotatorProps {
  imageUrl: string
  initialAnnotations?: Annotation[]
  onSave?: (annotations: Annotation[]) => void
  onSaveImage?: (file: File) => void | Promise<void>
  onClose: () => void
}

const ANNOTATION_COLORS = [
  { name: '红色', value: '#ef4444' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '绿色', value: '#22c55e' },
  { name: '橙色', value: '#f97316' },
  { name: '紫色', value: '#a855f7' },
  { name: '黑色', value: '#1f2937' },
]

const UNITS = ['CM', 'MM', 'M', 'INCH'] as const

export default function ImageAnnotator({ 
  imageUrl, 
  initialAnnotations = [], 
  onSave, 
  onSaveImage,
  onClose 
}: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
  const [currentType, setCurrentType] = useState<AnnotationType>('dimension')
  const [currentColor, setCurrentColor] = useState('#ef4444')
  const [currentUnit, setCurrentUnit] = useState<'CM' | 'MM' | 'M' | 'INCH'>('CM')
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')
  const [showValueInput, setShowValueInput] = useState(false)
  const [pendingAnnotation, setPendingAnnotation] = useState<Omit<Annotation, 'id' | 'value'> | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [scale, setScale] = useState(1)
  const [orthogonal, setOrthogonal] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // 加载图片
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imageRef.current = img
      setImageLoaded(true)
      
      // 计算缩放比例以适应屏幕
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 80
        const containerHeight = containerRef.current.clientHeight - 80
        const scaleX = containerWidth / img.width
        const scaleY = containerHeight / img.height
        setScale(Math.min(scaleX, scaleY, 1))
      }
    }
    img.src = imageUrl
  }, [imageUrl])

  // 绘制画布
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    const img = imageRef.current
    
    if (!canvas || !ctx || !img || !imageLoaded) return

    // 设置画布大小
    canvas.width = img.width * scale
    canvas.height = img.height * scale

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 绘制图片
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    // 绘制已保存的标注
    annotations.forEach(ann => {
      drawAnnotation(ctx, ann, ann.id === selectedAnnotation)
    })

    // 绘制待确认的标注（输入数值时也可见）
    if (pendingAnnotation) {
      const pendingAnn: Annotation = {
        id: 'pending',
        ...pendingAnnotation,
        value: pendingAnnotation.type === 'dimension' ? editingValue : '',
      }
      drawAnnotation(ctx, pendingAnn, false)
    }

    // 绘制正在绘制的标注
    if (isDrawing && startPoint && currentPoint) {
      const tempAnn: Annotation = {
        id: 'temp',
        type: currentType,
        startX: startPoint.x,
        startY: startPoint.y,
        endX: currentPoint.x,
        endY: currentPoint.y,
        value: '',
        unit: currentUnit,
        color: currentColor
      }
      drawAnnotation(ctx, tempAnn, false)
    }
  }, [annotations, isDrawing, startPoint, currentPoint, currentType, currentColor, currentUnit, selectedAnnotation, imageLoaded, scale, pendingAnnotation, editingValue])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  // 绘制单个标注
  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation, isSelected: boolean, drawScale: number = scale) => {
    ctx.strokeStyle = ann.color
    ctx.fillStyle = ann.color
    ctx.lineWidth = isSelected ? 3 : 2
    ctx.font = 'bold 14px Arial'

    const startX = ann.startX * drawScale
    const startY = ann.startY * drawScale
    const endX = ann.endX * drawScale
    const endY = ann.endY * drawScale

    switch (ann.type) {
      case 'line':
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        break

      case 'arrow':
        // 绘制箭头线
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        
        // 绘制箭头头部
        const angle = Math.atan2(endY - startY, endX - startX)
        const arrowLength = 15
        ctx.beginPath()
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle - Math.PI / 6),
          endY - arrowLength * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(endX, endY)
        ctx.lineTo(
          endX - arrowLength * Math.cos(angle + Math.PI / 6),
          endY - arrowLength * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
        break

      case 'dimension':
        // 绘制尺寸标注线
        const dx = endX - startX
        const dy = endY - startY
        const lineAngle = Math.atan2(dy, dx)
        const perpAngle = lineAngle + Math.PI / 2
        const offset = 8

        // 起点端点线
        ctx.beginPath()
        ctx.moveTo(startX + offset * Math.cos(perpAngle), startY + offset * Math.sin(perpAngle))
        ctx.lineTo(startX - offset * Math.cos(perpAngle), startY - offset * Math.sin(perpAngle))
        ctx.stroke()

        // 终点端点线
        ctx.beginPath()
        ctx.moveTo(endX + offset * Math.cos(perpAngle), endY + offset * Math.sin(perpAngle))
        ctx.lineTo(endX - offset * Math.cos(perpAngle), endY - offset * Math.sin(perpAngle))
        ctx.stroke()

        // 主线
        ctx.beginPath()
        ctx.moveTo(startX, startY)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        // 绘制数值标签
        if (ann.value) {
          const midX = (startX + endX) / 2
          const midY = (startY + endY) / 2
          const label = `${ann.value} ${ann.unit}`
          
          // 背景
          ctx.fillStyle = 'white'
          const textWidth = ctx.measureText(label).width
          ctx.fillRect(midX - textWidth / 2 - 4, midY - 10, textWidth + 8, 20)
          
          // 文字
          ctx.fillStyle = ann.color
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(label, midX, midY)
        }
        break
    }

    // 如果选中，绘制端点
    if (isSelected) {
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = ann.color
      ctx.lineWidth = 2
      
      // 起点
      ctx.beginPath()
      ctx.arc(startX, startY, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      
      // 终点
      ctx.beginPath()
      ctx.arc(endX, endY, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  }

  // 获取鼠标在画布上的坐标
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale
    }
  }

  // 鼠标按下
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (showValueInput) return
    
    const coords = getCanvasCoords(e)
    
    // 检查是否点击了已有标注
    const clickedAnnotation = annotations.find(ann => {
      const distance = pointToLineDistance(
        coords.x, coords.y,
        ann.startX, ann.startY,
        ann.endX, ann.endY
      )
      return distance < 10
    })
    
    if (clickedAnnotation) {
      setSelectedAnnotation(clickedAnnotation.id)
      return
    }
    
    // 开始新的标注
    setSelectedAnnotation(null)
    setIsDrawing(true)
    setStartPoint(coords)
    setCurrentPoint(coords)
  }

  // 鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const raw = getCanvasCoords(e)
    if (orthogonal && startPoint) {
      const dx = raw.x - startPoint.x
      const dy = raw.y - startPoint.y
      if (Math.abs(dx) >= Math.abs(dy)) {
        setCurrentPoint({ x: raw.x, y: startPoint.y })
      } else {
        setCurrentPoint({ x: startPoint.x, y: raw.y })
      }
      return
    }
    setCurrentPoint(raw)
  }

  // 鼠标松开
  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return
    
    const rawEnd = getCanvasCoords(e)
    const endCoords = orthogonal
      ? (() => {
        const dx = rawEnd.x - startPoint.x
        const dy = rawEnd.y - startPoint.y
        if (Math.abs(dx) >= Math.abs(dy)) {
          return { x: rawEnd.x, y: startPoint.y }
        }
        return { x: startPoint.x, y: rawEnd.y }
      })()
      : rawEnd
    
    // 检查是否有足够的距离
    const distance = Math.sqrt(
      Math.pow(endCoords.x - startPoint.x, 2) + 
      Math.pow(endCoords.y - startPoint.y, 2)
    )
    
    if (distance < 20) {
      setIsDrawing(false)
      setStartPoint(null)
      setCurrentPoint(null)
      return
    }
    
    // 保存待确认的标注
    setPendingAnnotation({
      type: currentType,
      startX: startPoint.x,
      startY: startPoint.y,
      endX: endCoords.x,
      endY: endCoords.y,
      unit: currentUnit,
      color: currentColor
    })
    
    setIsDrawing(false)
    setStartPoint(null)
    setCurrentPoint(null)
    setShowValueInput(true)
    setEditingValue('')
  }

  // 确认标注数值
  const confirmAnnotation = () => {
    if (!pendingAnnotation) return
    
    const newAnnotation: Annotation = {
      ...pendingAnnotation,
      id: Date.now().toString(),
      value: editingValue
    }
    
    setAnnotations(prev => [...prev, newAnnotation])
    setPendingAnnotation(null)
    setShowValueInput(false)
    setEditingValue('')
  }

  // 取消标注
  const cancelAnnotation = () => {
    setPendingAnnotation(null)
    setShowValueInput(false)
    setEditingValue('')
  }

  // 删除选中的标注
  const deleteSelected = () => {
    if (!selectedAnnotation) return
    setAnnotations(prev => prev.filter(ann => ann.id !== selectedAnnotation))
    setSelectedAnnotation(null)
  }

  // 清除所有标注
  const clearAll = () => {
    if (confirm('确定要清除所有标注吗？')) {
      setAnnotations([])
      setSelectedAnnotation(null)
    }
  }

  // 保存标注
  const exportAnnotatedImageFile = async (): Promise<File | null> => {
    const img = imageRef.current
    if (!img) return null

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = img.width
    exportCanvas.height = img.height
    const exportCtx = exportCanvas.getContext('2d')
    if (!exportCtx) return null

    exportCtx.clearRect(0, 0, exportCanvas.width, exportCanvas.height)
    exportCtx.drawImage(img, 0, 0, exportCanvas.width, exportCanvas.height)
    annotations.forEach((ann) => {
      drawAnnotation(exportCtx, ann, false, 1)
    })

    const blob: Blob | null = await new Promise((resolve) => {
      exportCanvas.toBlob((b) => resolve(b), 'image/png')
    })
    if (!blob) return null

    return new File([blob], `annotated-${Date.now()}.png`, { type: 'image/png' })
  }

  const handleSave = async () => {
    if (showValueInput) return
    if (isSaving) return

    setIsSaving(true)
    try {
      onSave?.(annotations)
      if (onSaveImage) {
        const file = await exportAnnotatedImageFile()
        if (file) {
          await onSaveImage(file)
        }
      }
      onClose()
    } finally {
      setIsSaving(false)
    }
  }

  // 计算点到线段的距离
  const pointToLineDistance = (
    px: number, py: number,
    x1: number, y1: number,
    x2: number, y2: number
  ) => {
    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* 标注类型 */}
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setCurrentType('dimension')}
              className={cn(
                "px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-colors",
                currentType === 'dimension' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              <Ruler className="w-4 h-4" />
              尺寸标注
            </button>
            <button
              onClick={() => setCurrentType('line')}
              className={cn(
                "px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-colors",
                currentType === 'line' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              <span className="w-4 h-0.5 bg-current" />
              直线
            </button>
            <button
              onClick={() => setCurrentType('arrow')}
              className={cn(
                "px-3 py-1.5 rounded-md flex items-center gap-1.5 text-sm transition-colors",
                currentType === 'arrow' ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"
              )}
            >
              <ArrowRight className="w-4 h-4" />
              箭头
            </button>
          </div>

          {/* 颜色选择 */}
          <div className="flex items-center gap-1.5">
            {ANNOTATION_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => setCurrentColor(color.value)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-transform",
                  currentColor === color.value ? "border-white scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>

          {/* 单位选择 */}
          <select
            value={currentUnit}
            onChange={(e) => setCurrentUnit(e.target.value as any)}
            className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-sm border border-gray-700"
          >
            {UNITS.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>

          <button
            onClick={() => setOrthogonal((v) => !v)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm border flex items-center gap-1.5 transition-colors',
              orthogonal
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-gray-800 text-gray-200 border-gray-700 hover:text-white'
            )}
            title="正交模式（水平/垂直）"
          >
            <Square className="w-4 h-4" />
            正交
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedAnnotation && (
            <button
              onClick={deleteSelected}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm flex items-center gap-1.5 hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              删除选中
            </button>
          )}
          <button
            onClick={clearAll}
            className="px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm flex items-center gap-1.5 hover:bg-gray-600"
          >
            <RotateCcw className="w-4 h-4" />
            清除全部
          </button>
          <button
            onClick={handleSave}
            disabled={showValueInput || isSaving}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm flex items-center gap-1.5',
              showValueInput || isSaving
                ? 'bg-green-600/60 text-white cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            )}
          >
            <Save className="w-4 h-4" />
            {isSaving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 画布区域 */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center overflow-auto p-10"
      >
        {imageLoaded ? (
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              if (isDrawing) {
                setIsDrawing(false)
                setStartPoint(null)
                setCurrentPoint(null)
              }
            }}
            className="cursor-crosshair shadow-2xl"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        ) : (
          <div className="text-white">加载中...</div>
        )}
      </div>

      {/* 数值输入弹窗 */}
      {showValueInput && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[10000]">
          <div className="bg-white rounded-xl p-6 w-80 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">输入尺寸数值</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="number"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                placeholder="输入数值"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') confirmAnnotation()
                  if (e.key === 'Escape') cancelAnnotation()
                }}
              />
              <select
                value={pendingAnnotation?.unit || currentUnit}
                onChange={(e) => {
                  if (pendingAnnotation) {
                    setPendingAnnotation({
                      ...pendingAnnotation,
                      unit: e.target.value as any
                    })
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cancelAnnotation}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={confirmAnnotation}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 底部提示 */}
      <div className="bg-gray-900 px-4 py-2 text-center text-gray-400 text-sm">
        左键点击并拖拽绘制标注线 · 点击已有标注可选中 · 按 Delete 删除选中标注
      </div>
    </div>
  )
}

// 图片标注按钮组件 - 悬浮在图片上使用
interface ImageAnnotateButtonProps {
  imageUrl: string
  annotations?: Annotation[]
  onAnnotationsChange?: (annotations: Annotation[]) => void
  className?: string
}

export function ImageAnnotateButton({ 
  imageUrl, 
  annotations = [], 
  onAnnotationsChange,
  className 
}: ImageAnnotateButtonProps) {
  const [showAnnotator, setShowAnnotator] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowAnnotator(true)}
        className={cn(
          "absolute top-2 right-2 p-2 bg-black/60 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80",
          className
        )}
        title="标注图片"
      >
        <Pencil className="w-4 h-4" />
      </button>
      
      {showAnnotator && (
        <ImageAnnotator
          imageUrl={imageUrl}
          initialAnnotations={annotations}
          onSave={(newAnnotations) => {
            onAnnotationsChange?.(newAnnotations)
          }}
          onClose={() => setShowAnnotator(false)}
        />
      )}
    </>
  )
}

export type { Annotation, AnnotationType }
