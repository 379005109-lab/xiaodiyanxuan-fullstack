
import { useState, useEffect } from 'react';
import { getUserListAPI, delUserAPI, updateUserEnabledAPI } from '@/services/orgService';

interface Employee {
  id: string;
  userName: string;
  organizeName: string;
  phone: string;
  positionName: string;
  status: string;
  enabled: string;
  systemFlag?: string;
}

interface EmployeeListProps {
  selectedDeptId: string;
  onAdd: () => void;
  onEdit: (employee: Employee) => void;
  orgList: any[];
}

export default function EmployeeList({ selectedDeptId, onAdd, onEdit, orgList }: EmployeeListProps) {
  const [nameFilter, setNameFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [employmentFilter, setEmploymentFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);

  const params = {
    organizeId: selectedDeptId,
    name: nameFilter,
    phone: phoneFilter,
    enabled: statusFilter === '全部' ? '' : statusFilter === '正常' ? '1' : '0',
    current: currentPage,
    size: pageSize
  };

  const getUserList = async () => {
    try {
      setPageLoading(true);
      const response = await getUserListAPI(params);
      setEmployees(response.data.records || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('获取员工列表失败:', error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDeptId) {
      getUserList();
    }
  }, [selectedDeptId, currentPage, nameFilter, phoneFilter, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    getUserList();
  };

  const handleReset = () => {
    setNameFilter('');
    setPhoneFilter('');
    setEmploymentFilter('全部');
    setStatusFilter('全部');
    setCurrentPage(1);
    getUserList();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('此操作将永久删除该数据, 是否继续？')) {
      try {
        await delUserAPI(id);
        alert('删除成功！');
        getUserList();
      } catch (error) {
        console.error('删除员工失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleEnabledToggle = async (employee: Employee) => {
    const enabled = employee.enabled === '1' ? '禁用' : '启用';
    if (window.confirm(`是否${enabled}此项数据?`)) {
      try {
        await updateUserEnabledAPI(employee.id);
        alert(`${enabled}成功`);
        getUserList();
      } catch (error) {
        console.error(`${enabled}失败:`, error);
        alert(`${enabled}失败，请重试`);
      }
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize;

  return (
    <div className="flex flex-col h-full">
      {/* 搜索筛选区域 */}
      <div className="p-6 border-b border-stone-200">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-stone-600 mb-2">姓名</label>
            <input
              type="text"
              placeholder="请输入姓名"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm text-stone-600 mb-2">手机号</label>
            <input
              type="text"
              placeholder="请输入手机号"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm text-stone-600 mb-2">在职状态</label>
            <select
              value={employmentFilter}
              onChange={(e) => setEmploymentFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
            >
              <option>全部</option>
              <option>在职</option>
              <option>离职</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm text-stone-600 mb-2">状态</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
            >
              <option>全部</option>
              <option>正常</option>
              <option>禁用</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleSearch}
            className="bg-[#14B8A6] text-white px-6 py-2 rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
          >
            <i className="ri-search-line"></i>
            查询
          </button>
          <button
            onClick={handleReset}
            className="bg-white text-stone-600 px-6 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
          >
            <i className="ri-refresh-line"></i>
            重置
          </button>
          <div className="flex-1"></div>
          <button
            onClick={onAdd}
            className="bg-[#14B8A6] text-white px-5 py-2 rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line"></i>
            新增员工
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto">
        {pageLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#14B8A6]"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200 sticky top-0">
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">序号</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">姓名</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">部门</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">手机号</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">职位</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">在职状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {employees.map((employee, index) => (
                <tr key={employee.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{startIndex + index + 1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{employee.userName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{employee.organizeName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{employee.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{employee.positionName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.status === '0' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-stone-100 text-stone-700">
                        离职
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-700">
                        在职
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {employee.enabled === '1' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-[#14B8A6]/10 text-[#14B8A6]">
                        正常
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-700">
                        禁用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => onEdit(employee)}
                        className="text-[#14B8A6] hover:text-[#0d9488] text-sm cursor-pointer whitespace-nowrap"
                      >
                        编辑
                      </button>
                      {employee.systemFlag === '0' && employee.status === '1' && (
                        <button
                          onClick={() => handleEnabledToggle(employee)}
                          className={`text-sm cursor-pointer whitespace-nowrap ${
                            employee.enabled === '1' ? 'text-red-500 hover:text-red-700' : 'text-[#14B8A6] hover:text-[#0d9488]'
                          }`}
                        >
                          {employee.enabled === '1' ? '禁用' : '启用'}
                        </button>
                      )}
                      {employee.systemFlag === '0' && (
                        <button
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-500 hover:text-red-700 text-sm cursor-pointer whitespace-nowrap"
                        >
                          删除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 分页 */}
      <div className="p-4 border-t border-stone-200 flex items-center justify-between">
        <div className="text-sm text-stone-600">
          共 {total} 条记录，当前第 {currentPage}/{Math.ceil(total / pageSize)} 页
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-stone-300 rounded-lg text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            上一页
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(Math.ceil(total / pageSize), currentPage + 1))}
            disabled={currentPage === Math.ceil(total / pageSize)}
            className="px-3 py-1 border border-stone-300 rounded-lg text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
}
