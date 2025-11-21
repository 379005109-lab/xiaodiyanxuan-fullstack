import { X } from 'lucide-react'
import { Material } from '@/types'

interface MaterialDetailModalProps {
  material: Material | null
  onClose: () => void
}

export default function MaterialDetailModal({ material, onClose }: MaterialDetailModalProps) {
  if (!material) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg w-full max-w-md overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">材质详情</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 材质图片 */}
          <div className="mb-4">
            <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
              {material.image ? (
                <img
                  src={material.image}
                  alt={material.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  暂无图片
                </div>
              )}
            </div>
          </div>

          {/* 材质名称 */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{material.name}</h3>
            {material.categoryName && (
              <p className="text-sm text-gray-500 mt-1">{material.categoryName}</p>
            )}
          </div>

          {/* 材质介绍 */}
          {material.description && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">材质介绍</h4>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {material.description}
              </p>
            </div>
          )}

          {/* 属性 */}
          {material.properties && Object.keys(material.properties).length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">属性</h4>
              <div className="space-y-1">
                {Object.entries(material.properties).map(([key, value]) => (
                  <div key={key} className="flex text-sm">
                    <span className="text-gray-600 w-20 flex-shrink-0">{key}:</span>
                    <span className="text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 标签 */}
          {material.tags && material.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">标签</h4>
              <div className="flex flex-wrap gap-2">
                {material.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-2"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

