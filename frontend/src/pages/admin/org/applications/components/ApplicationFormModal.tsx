import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import {
  getApplicationInfoAPI,
  addApplicationAPI,
  updateApplicationAPI,
} from '@/services/applicationService';

interface ApplicationFormModalProps {
  appId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  id?: string;
  name: string;
  code: string;
  remark: string;
}

export default function ApplicationFormModal({
  appId,
  onClose,
  onSuccess,
}: ApplicationFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    remark: '',
  });

  const isEdit = !!appId;

  useEffect(() => {
    if (appId) {
      loadAppInfo();
    }
  }, [appId]);

  const loadAppInfo = async () => {
    if (!appId) return;
    try {
      setLoading(true);
      const res = await getApplicationInfoAPI(appId);
      if (res.code === 0 || res.code === 200) {
        const data = res.data;
        setFormData({
          id: data.id,
          name: data.name || '',
          code: data.code || '',
          remark: data.remark || '',
        });
      }
    } catch (error: any) {
      toast.error(error.message || '获取应用详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('请输入应用名称');
      return;
    }

    try {
      setSubmitting(true);
      const apiFunc = isEdit ? updateApplicationAPI : addApplicationAPI;
      const res = await apiFunc(formData as any);
      if (res.code === 0 || res.code === 200) {
        toast.success(isEdit ? '修改成功' : '新增成功');
        onSuccess();
      } else {
        toast.error(res.msg || '保存失败');
      }
    } catch (error: any) {
      toast.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">
            {isEdit ? '编辑应用' : '新增应用'}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6">
          {loading ? (
            <div className="text-center py-8 text-stone-500">加载中...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  应用名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  placeholder="请输入应用名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  应用编码
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  placeholder="请输入应用编码"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  备注
                </label>
                <textarea
                  value={formData.remark}
                  onChange={(e) => handleChange('remark', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm resize-none"
                  placeholder="请输入备注"
                />
              </div>
            </div>
          )}
        </form>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200 bg-stone-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm disabled:opacity-50"
          >
            {submitting ? '保存中...' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
}
