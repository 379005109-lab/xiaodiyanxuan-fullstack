import { useState } from 'react'
import { X, Folder } from 'lucide-react'

interface FolderSelectionModalProps {
  categories: any[]
  onClose: () => void
  onSave: (folderId: string, folderName: string) => void
}

export default function FolderSelectionModal({ categories, onClose, onSave }: FolderSelectionModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState('')
  const [selectedFolderName, setSelectedFolderName] = useState('')

  const handleSelect = (id: string, name: string) => {
    setSelectedFolderId(id)
    setSelectedFolderName(name)
  }

  const handleSave = () => {
    if (!selectedFolderId) {
      return
    }
    onSave(selectedFolderId, selectedFolderName)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">选择保存文件夹</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-gray-600 mb-4">
            请选择一个文件夹分类来保存授权商品
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => handleSelect(category._id, category.name)}
                className={`flex items-center gap-3 p-4 border-2 rounded-lg transition-all ${
                  selectedFolderId === category._id
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  selectedFolderId === category._id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <Folder className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{category.name}</div>
                  {category.description && (
                    <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <Folder className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无可用文件夹分类</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFolderId}
            className="btn btn-primary"
          >
            确认保存
          </button>
        </div>
      </div>
    </div>
  )
}
