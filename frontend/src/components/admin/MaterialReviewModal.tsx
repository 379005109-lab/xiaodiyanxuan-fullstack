import { useState } from 'react'
import { X, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Material } from '@/types'
import { reviewMaterial } from '@/services/materialService'

interface MaterialReviewModalProps {
  material: Material
  onClose: () => void
}

export default function MaterialReviewModal({ material, onClose }: MaterialReviewModalProps) {
  const [reviewNote, setReviewNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleApprove = async () => {
    setLoading(true)
    try {
      const result = await reviewMaterial(material._id, 'approved', '管理员', reviewNote)
      if (result) {
        toast.success('审核通过')
        onClose()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      console.error('审核失败:', error)
      toast.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!reviewNote.trim()) {
      toast.error('请输入拒绝原因')
      return
    }

    setLoading(true)
    try {
      const result = await reviewMaterial(material._id, 'rejected', '管理员', reviewNote)
      if (result) {
        toast.success('已拒绝')
        onClose()
      } else {
        toast.error('操作失败')
      }
    } catch (error) {
      console.error('拒绝失败:', error)
      toast.error('操作失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">素材审核</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 素材信息 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">素材信息</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <img
                  src={material.image}
                  alt={material.name}
                  className="w-full h-64 object-cover rounded-lg border border-gray-200"
                />
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-600">素材名称：</span>
                  <span className="font-medium">{material.name}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">素材类型：</span>
                  <span className="font-medium">
                    {material.type === 'image' && '图片'}
                    {material.type === 'texture' && '材质'}
                    {material.type === 'model' && '模型'}
                  </span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">分类：</span>
                  <span className="font-medium">{material.categoryName}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">上传者：</span>
                  <span className="font-medium">{material.uploadBy}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-600">上传时间：</span>
                  <span className="font-medium">
                    {new Date(material.createdAt).toLocaleString('zh-CN')}
                  </span>
                </div>

                {/* 属性 */}
                <div>
                  <div className="text-sm text-gray-600 mb-2">属性：</div>
                  <div className="space-y-1">
                    {Object.entries(material.properties).map(([key, value]) => (
                      <div key={key} className="flex items-center">
                        <span className="text-sm text-gray-600 mr-2">{key}:</span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 标签 */}
                {material.tags.length > 0 && (
                  <div>
                    <div className="text-sm text-gray-600 mb-2">标签：</div>
                    <div className="flex flex-wrap gap-2">
                      {material.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 审核意见 */}
          <div>
            <label className="block text-sm font-medium mb-2">
              审核意见
            </label>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="请输入审核意见（拒绝时必填）"
              className="input w-full"
              rows={4}
            />
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary px-6 py-2"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {loading ? '处理中...' : '拒绝'}
            </button>
            <button
              type="button"
              onClick={handleApprove}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? '处理中...' : '通过'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

