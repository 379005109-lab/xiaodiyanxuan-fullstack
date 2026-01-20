
import { useState, useEffect } from 'react';

interface Position {
  id?: string;
  name: string;
  code: string;
  level: string;
  description: string;
}

interface PositionModalProps {
  position: Position | null;
  onClose: () => void;
  onSave: (data: Position) => void;
}

export default function PositionModal({ position, onClose, onSave }: PositionModalProps) {
  const [formData, setFormData] = useState<Position>({
    name: '',
    code: '',
    level: '',
    description: ''
  });

  useEffect(() => {
    if (position) {
      setFormData({
        name: position.name,
        code: position.code,
        level: position.level,
        description: position.description || ''
      });
    } else {
      setFormData({
        name: '',
        code: '',
        level: '',
        description: ''
      });
    }
  }, [position]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.code.trim() || !formData.level.trim()) {
      alert('请填写所有必填字段');
      return;
    }
    
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">
            {position ? '编辑职位' : '新增职位'}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-stone-600 mb-2">
                职位名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
                placeholder="请输入职位名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">
                职位编码 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
                placeholder="请输入职位编码"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">
                职级 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
                required
              >
                <option value="">请选择职级</option>
                <option value="P4">P4</option>
                <option value="P5">P5</option>
                <option value="P6">P6</option>
                <option value="P7">P7</option>
                <option value="P8">P8</option>
                <option value="M1">M1</option>
                <option value="M2">M2</option>
                <option value="M3">M3</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">职位描述</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm resize-none"
                placeholder="请输入职位描述"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors text-sm cursor-pointer whitespace-nowrap"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer whitespace-nowrap"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
