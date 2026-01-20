
import { useState, useEffect } from 'react';
import { addOrganizeAPI, updateOrganizeAPI } from '@/services/orgService';

interface Department {
  id?: string;
  name: string;
  parentId: string;
}

interface DepartmentModalProps {
  department: Department | null;
  orgList: any[];
  onClose: () => void;
  onSave: (data: Department) => void;
}

export default function DepartmentModal({ department, orgList, onClose, onSave }: DepartmentModalProps) {
  const [formData, setFormData] = useState<Department>({
    name: '',
    parentId: ''
  });
  const [btnLoading, setBtnLoading] = useState(false);

  // 构建上级部门选项，添加顶级节点
  const parentDepts = [
    { id: '0', name: '顶级节点' },
    ...flattenOrgList(orgList)
  ];

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

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        parentId: department.parentId || '0'
      });
    } else {
      setFormData({
        name: '',
        parentId: '0'
      });
    }
  }, [department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('请输入部门名称');
      return;
    }

    try {
      setBtnLoading(true);
      if (formData.id) {
        await updateOrganizeAPI(formData);
      } else {
        await addOrganizeAPI(formData);
      }
      alert('提交成功！');
      onSave(formData);
    } catch (error) {
      console.error('保存部门失败:', error);
      alert('保存失败，请重试');
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">
            {department ? '编辑部门' : '新增部门'}
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
                部门名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
                placeholder="请输入部门名称"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-stone-600 mb-2">
                上级部门 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
                required
              >
                {parentDepts.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
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
