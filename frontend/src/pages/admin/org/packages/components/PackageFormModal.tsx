import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import {
  getTenantPackageInfoAPI,
  addTenantPackageAPI,
  updateTenantPackageAPI,
  type ApplicationInfo,
} from '@/services/applicationService';

interface PackageFormModalProps {
  packageId: string | null;
  applicationId: string;
  appList: ApplicationInfo[];
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  id?: string;
  name: string;
  price: number;
  expiresType: string;
  inviteType: number;
  inviteNumber: number;
  applicationId: string;
  remark: string;
}

export default function PackageFormModal({
  packageId,
  applicationId,
  appList,
  onClose,
  onSuccess,
}: PackageFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    price: 0,
    expiresType: 'year',
    inviteType: 1,
    inviteNumber: 0,
    applicationId: applicationId,
    remark: '',
  });

  const isEdit = !!packageId;

  useEffect(() => {
    if (packageId) {
      loadPackageInfo();
    }
  }, [packageId]);

  const loadPackageInfo = async () => {
    if (!packageId) return;
    try {
      setLoading(true);
      const res = await getTenantPackageInfoAPI(packageId);
      if (res.code === 0 || res.code === 200) {
        const data = res.data;
        setFormData({
          id: data.id,
          name: data.name || '',
          price: data.price || 0,
          expiresType: data.expiresType || 'year',
          inviteType: data.inviteType || 1,
          inviteNumber: data.inviteNumber || 0,
          applicationId: data.applicationId || applicationId,
          remark: data.remark || '',
        });
      }
    } catch (error: any) {
      toast.error(error.message || '获取套餐详情失败');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('请输入服务包名称');
      return;
    }

    try {
      setSubmitting(true);
      const apiFunc = isEdit ? updateTenantPackageAPI : addTenantPackageAPI;
      const res = await apiFunc(formData);
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">
            {isEdit ? '编辑套餐' : '新增套餐'}
          </h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
          {loading ? (
            <div className="text-center py-8 text-stone-500">加载中...</div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  所属应用 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.applicationId}
                  onChange={(e) => handleChange('applicationId', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  disabled={isEdit}
                >
                  {appList.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  服务包名称 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  placeholder="请输入服务包名称"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    价格 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                    placeholder="请输入价格"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    有效期类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.expiresType}
                    onChange={(e) => handleChange('expiresType', e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                  >
                    <option value="year">年</option>
                    <option value="month">月</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">
                  企业人数限制 <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inviteType"
                      value={1}
                      checked={formData.inviteType === 1}
                      onChange={() => handleChange('inviteType', 1)}
                      className="text-[#14B8A6]"
                    />
                    <span className="text-sm text-stone-700">限制人数</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="inviteType"
                      value={2}
                      checked={formData.inviteType === 2}
                      onChange={() => handleChange('inviteType', 2)}
                      className="text-[#14B8A6]"
                    />
                    <span className="text-sm text-stone-700">不限人数</span>
                  </label>
                </div>
              </div>

              {formData.inviteType === 1 && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1">
                    限制人数
                  </label>
                  <input
                    type="number"
                    value={formData.inviteNumber}
                    onChange={(e) => handleChange('inviteNumber', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm"
                    placeholder="请输入限制人数"
                    min="0"
                  />
                </div>
              )}

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
