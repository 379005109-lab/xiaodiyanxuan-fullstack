import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { addTenantPackageAPI } from '@/services/tenantService';
import javaApiClient from '@/api/javaApiClient';

interface AuthorizationModalProps {
  tenantId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface Package {
  id: string;
  name: string;
  description?: string;
}

export default function AuthorizationModal({ tenantId, onClose, onSuccess }: AuthorizationModalProps) {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [inviteType, setInviteType] = useState<number>(2);
  const [inviteNumber, setInviteNumber] = useState<string>('');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await javaApiClient.get('/api/package/list');
      if (res.data.code === 0 || res.data.code === 200) {
        setPackages(res.data.data || []);
      }
    } catch (error) {
      console.error('获取套餐列表失败', error);
    }
  };

  const handleSubmit = async () => {
    if (selectedPackages.length === 0) {
      toast.error('请选择至少一个应用套餐');
      return;
    }

    if (inviteType === 1 && (!inviteNumber || parseInt(inviteNumber) <= 0)) {
      toast.error('请输入有效的限制人数');
      return;
    }

    setLoading(true);
    try {
      const data = {
        packageIds: selectedPackages,
        inviteType,
        inviteNumber: inviteType === 1 ? parseInt(inviteNumber) : null,
      };
      const res = await addTenantPackageAPI(tenantId, data);
      if (res.code === 0 || res.code === 200) {
        toast.success('添加授权成功！');
        onSuccess();
      } else {
        toast.error(res.msg || '添加授权失败');
      }
    } catch (error: any) {
      toast.error(error.message || '添加授权失败');
    } finally {
      setLoading(false);
    }
  };

  const togglePackage = (packageId: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-lg mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-800">添加授权</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 应用套餐选择 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              选择应用套餐 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-stone-200 rounded-lg p-3">
              {packages.length === 0 ? (
                <div className="text-stone-500 text-sm text-center py-4">暂无可用套餐</div>
              ) : (
                packages.map(pkg => (
                  <label
                    key={pkg.id}
                    className="flex items-center gap-3 p-2 hover:bg-stone-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPackages.includes(pkg.id)}
                      onChange={() => togglePackage(pkg.id)}
                      className="w-4 h-4 text-[#14B8A6] border-stone-300 rounded focus:ring-[#14B8A6]"
                    />
                    <span className="text-sm text-stone-700">{pkg.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* 企业人数限制 */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-3">
              企业人数限制
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="inviteType"
                  checked={inviteType === 2}
                  onChange={() => setInviteType(2)}
                  className="w-4 h-4 text-[#14B8A6] border-stone-300 focus:ring-[#14B8A6]"
                />
                <span className="text-sm text-stone-700">不限人数</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="inviteType"
                  checked={inviteType === 1}
                  onChange={() => setInviteType(1)}
                  className="w-4 h-4 text-[#14B8A6] border-stone-300 focus:ring-[#14B8A6]"
                />
                <span className="text-sm text-stone-700">限制人数</span>
                {inviteType === 1 && (
                  <input
                    type="number"
                    value={inviteNumber}
                    onChange={(e) => setInviteNumber(e.target.value)}
                    placeholder="请输入人数"
                    className="w-32 px-3 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:border-[#14B8A6]"
                  />
                )}
              </label>
            </div>
          </div>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-stone-300 rounded-lg text-stone-600 hover:bg-stone-50 transition-colors text-sm"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm disabled:opacity-50"
          >
            {loading ? '提交中...' : '确定'}
          </button>
        </div>
      </div>
    </div>
  );
}
