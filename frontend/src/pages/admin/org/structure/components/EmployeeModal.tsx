
import { useState, useEffect } from 'react';
import { addUserAPI, updateUserAPI, getUserInfoAPI, getPositionBizEnabledListAPI } from '@/services/orgService';

interface Employee {
  id?: string;
  userName: string;
  phone: string;
  deptId: string;
  positionId: string;
  status: string;
  enabled?: string;
  systemFlag?: string;
}

interface EmployeeModalProps {
  employee: Employee | null;
  orgList: any[];
  selectedDeptId: string;
  onClose: () => void;
  onSave: (data: Employee) => void;
}

export default function EmployeeModal({ employee, orgList, selectedDeptId, onClose, onSave }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Employee>({
    userName: '',
    phone: '',
    deptId: '',
    positionId: '',
    status: '1'
  });
  const [btnLoading, setBtnLoading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [jobStatus, setJobStatus] = useState('1');
  const [initStatus, setInitStatus] = useState('1');

  // 构建部门选项
  const departments = flattenOrgList(orgList);

  // 扁平化组织列表
  function flattenOrgList(list: any[], prefix = ''): any[] {
    let result: any[] = [];
    list.forEach(item => {
      result.push({
        id: item.id,
        name: prefix ? `${prefix}/${item.name}` : item.name
      });
      if (item.children && item.children.length > 0) {
        result = [...result, ...flattenOrgList(item.children, prefix ? `${prefix}/${item.name}` : item.name)];
      }
    });
    return result;
  }

  // 获取职位数据
  const getPositionData = async () => {
    try {
      const response = await getPositionBizEnabledListAPI();
      setPositions(response.data || []);
    } catch (error) {
      console.error('获取职位列表失败:', error);
    }
  };

  useEffect(() => {
    getPositionData();
  }, []);

  useEffect(() => {
    if (employee) {
      setFormData({
        userName: employee.userName || '',
        phone: employee.phone || '',
        deptId: employee.deptId || selectedDeptId,
        positionId: employee.positionId || '',
        status: employee.status || '1'
      });
      setInitStatus(employee.status || '1');
      setJobStatus(employee.status || '1');
      
      // 如果是编辑模式，获取用户详情
      if (employee.id) {
        getUserInfoAPI(employee.id)
          .then(response => {
            setFormData(response.data);
            setJobStatus(response.data.status || '1');
            setInitStatus(response.data.status || '1');
          })
          .catch(error => {
            console.error('获取用户信息失败:', error);
          });
      }
    } else {
      setFormData({
        userName: '',
        phone: '',
        deptId: selectedDeptId,
        positionId: '',
        status: '1'
      });
      setInitStatus('1');
      setJobStatus('1');
    }
  }, [employee, selectedDeptId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.userName || !formData.phone || !formData.deptId || !formData.positionId) {
      alert('请填写所有必填字段');
      return;
    }

    try {
      setBtnLoading(true);
      const params = {
        ...formData
      };
      
      // 只有当在职状态发生变化或新增时才传递status
      if (jobStatus !== initStatus || !formData.id) {
        params.status = jobStatus;
      }

      if (formData.id) {
        await updateUserAPI(params);
      } else {
        await addUserAPI(params);
      }
      alert('提交成功！');
      onSave(params);
    } catch (error) {
      console.error('保存员工失败:', error);
      alert('保存失败，请重试');
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">
            {employee ? '编辑员工' : '新增员工'}
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
                姓名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
                placeholder="请输入员工姓名"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">
                手机号 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className={`w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm ${
                  formData.systemFlag === '1' ? 'bg-stone-50' : ''
                }`}
                placeholder="请输入手机号"
                pattern="[0-9]{11}"
                title="请输入11位手机号码"
                disabled={formData.systemFlag === '1'}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">
                部门 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.deptId}
                onChange={(e) => setFormData({ ...formData, deptId: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
                required
              >
                <option value="">请选择部门</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">
                职位 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.positionId}
                onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
                required
              >
                <option value="">请选择职位</option>
                {positions.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-stone-600">在职状态</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={jobStatus === '1'}
                    onChange={(e) => setJobStatus(e.target.checked ? '1' : '0')}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#14B8A6]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#14B8A6]"></div>
                </div>
              </label>
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
              disabled={btnLoading}
            >
              {btnLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  保存中...
                </div>
              ) : (
                '保存'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
