import { useState, useEffect } from 'react';

interface PackageModalProps {
  package: any;
  onClose: () => void;
  onSave: (data: any) => void;
}

export default function PackageModal({ package: pkg, onClose, onSave }: PackageModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    enterpriseCount: '',
    notes: ''
  });

  useEffect(() => {
    if (pkg) {
      setFormData({
        name: pkg.name || '',
        price: pkg.price || '',
        enterpriseCount: pkg.enterpriseCount?.toString() || '',
        notes: pkg.notes || ''
      });
    }
  }, [pkg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('请输入服务包名称');
      return;
    }
    
    if (!formData.price.trim()) {
      alert('请输入价格');
      return;
    }
    
    if (!formData.enterpriseCount.trim()) {
      alert('请输入企业人数');
      return;
    }

    onSave({
      ...formData,
      enterpriseCount: parseInt(formData.enterpriseCount)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* 标题栏 */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            {pkg ? '编辑套餐' : '新增套餐'}
          </h2>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 cursor-pointer"
          >
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-4">
            {/* 服务包名称 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                <span className="text-red-500">*</span> 服务包名称
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入服务包名称"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent"
              />
            </div>

            {/* 价格 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                <span className="text-red-500">*</span> 价格
              </label>
              <input
                type="text"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="请输入价格（如：10000元/年）"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent"
              />
            </div>

            {/* 企业人数 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                <span className="text-red-500">*</span> 企业人数
              </label>
              <input
                type="number"
                value={formData.enterpriseCount}
                onChange={(e) => setFormData({ ...formData, enterpriseCount: e.target.value })}
                placeholder="请输入企业人数"
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent"
              />
            </div>

            {/* 备注 */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                备注
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="请输入备注信息"
                rows={4}
                className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#14B8A6] focus:border-transparent resize-none"
              />
            </div>
          </div>
        </form>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-stone-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-stone-300 text-stone-700 rounded-md text-sm hover:bg-stone-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2 bg-[#14B8A6] text-white rounded-md text-sm hover:bg-[#0d9488] transition-colors cursor-pointer whitespace-nowrap"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
