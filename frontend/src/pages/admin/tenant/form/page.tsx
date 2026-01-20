
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { 
  addTenantAPI, 
  updateTenantAPI, 
  getTenantDetailAPI,
  getTenantApplicationPageAPI,
  ROLE_TYPE_MAP,
  type TenantFormData 
} from '@/services/tenantService';

interface FormData extends TenantFormData {
  id?: string;
}

interface AppInfo {
  id: string;
  applicationName: string;
  createTime: string;
  expiresTime: string;
  inviteType: number;
  inviteNumber: number;
}

export default function TenantForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const isEdit = !!id;
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    code: '',
    roleType: 1,
    clientName: '',
    clientMobile: '',
    address: '',
    email: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [appList, setAppList] = useState<AppInfo[]>([]);

  useEffect(() => {
    if (isEdit && id) {
      loadTenantDetail();
      loadAppList();
    }
  }, [isEdit, id]);

  const loadTenantDetail = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const res = await getTenantDetailAPI(id);
      if (res.code === 0 || res.code === 200) {
        const data = res.data;
        setFormData({
          id: data.id,
          name: data.name || '',
          code: data.code || '',
          roleType: data.roleType || 1,
          clientName: data.clientName || '',
          clientMobile: data.clientMobile || '',
          address: data.address || '',
          email: data.email || '',
        });
      } else {
        toast.error(res.msg || '加载租户详情失败');
      }
    } catch (error: any) {
      toast.error(error.message || '加载租户详情失败');
    } finally {
      setLoading(false);
    }
  };

  const loadAppList = async () => {
    if (!id) return;
    try {
      const res = await getTenantApplicationPageAPI({ current: 1, size: 50, tenantId: id });
      if (res.code === 0 || res.code === 200) {
        setAppList(res.data?.records || []);
      }
    } catch (error) {
      console.error('获取应用列表失败', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('请输入账号名称');
      return;
    }
    if (!formData.clientName) {
      toast.error('请输入联系人');
      return;
    }
    if (!formData.clientMobile) {
      toast.error('请输入联系电话');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const submitData = {
        ...formData,
      };
      
      const res = isEdit 
        ? await updateTenantAPI(submitData)
        : await addTenantAPI(submitData);
      
      if (res.code === 0 || res.code === 200) {
        toast.success(isEdit ? '编辑成功！' : '新增成功！');
        navigate('/admin/tenant/list');
      } else {
        toast.error(res.msg || '保存失败');
      }
    } catch (error: any) {
      toast.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin/tenant/list');
  };

  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-stone-500">加载中...</div>
      </div>
    );
  }

  return (
    <div>
      {/* 页面头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-stone-900">
            {isEdit ? '编辑' : '新增'}
          </h1>
        </div>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-6 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm font-medium disabled:opacity-50"
        >
          {submitting ? '保存中...' : '保存'}
        </button>
      </div>

      {/* 表单卡片 */}
      <div className="bg-white rounded-lg shadow-sm">
        <form onSubmit={handleSubmit} className="p-6">
          {/* 基本信息 */}
          <div className="mb-8">
            <h3 className="text-base font-semibold text-stone-900 mb-4 pb-2 border-b border-stone-200">基本信息</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    账号名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm transition-colors"
                    placeholder="请输入账号名称"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">账号编号</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    disabled
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-lg bg-stone-50 text-stone-500 text-sm"
                    placeholder="系统自动生成"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    账号类型 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.roleType}
                    onChange={(e) => handleChange('roleType', parseInt(e.target.value))}
                    disabled={isEdit}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm cursor-pointer transition-colors disabled:bg-stone-50 disabled:text-stone-500"
                  >
                    <option value={1}>普通账号</option>
                    <option value={2}>设计师</option>
                    <option value={3}>分销商</option>
                    <option value={4}>特定对象</option>
                    <option value={5}>企业内部联系人</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    联系人 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => handleChange('clientName', e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm transition-colors"
                    placeholder="请输入联系人"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">
                    联系电话 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.clientMobile}
                    onChange={(e) => handleChange('clientMobile', e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm transition-colors"
                    placeholder="请输入联系电话"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">公司地址</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm transition-colors"
                    placeholder="请输入公司地址"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">电子邮箱</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] text-sm transition-colors"
                    placeholder="请输入电子邮箱"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 使用管理 - 仅编辑时显示 */}
          {isEdit && appList.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-stone-900 mb-4 pb-2 border-b border-stone-200">使用管理</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200">
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">应用名称</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">首次激活时间</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">有效期至</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">企业人数限制</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">限制人数</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {appList.map((app) => (
                      <tr key={app.id} className="hover:bg-stone-50">
                        <td className="px-4 py-3 text-sm text-stone-900">{app.applicationName}</td>
                        <td className="px-4 py-3 text-sm text-stone-600">{formatDate(app.createTime)}</td>
                        <td className="px-4 py-3 text-sm text-stone-600">{formatDate(app.expiresTime)}</td>
                        <td className="px-4 py-3 text-sm text-stone-600">
                          {app.inviteType === 2 ? '不限人数' : '限制人数'}
                        </td>
                        <td className="px-4 py-3 text-sm text-stone-600">{app.inviteNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
