import { useState, useEffect } from 'react';
import DepartmentTree from './components/DepartmentTree';
import EmployeeList from './components/EmployeeList';
import DepartmentModal from './components/DepartmentModal';
import EmployeeModal from './components/EmployeeModal';
import { getOrganizeTreeAPI } from '@/services/orgService';

export default function OrgStructure() {
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [orgList, setOrgList] = useState<any[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);

  const handleAddDept = () => {
    setEditingDept(null);
    setIsDeptModalOpen(true);
  };

  const handleEditDept = (dept: any) => {
    setEditingDept(dept);
    setIsDeptModalOpen(true);
  };

  const handleAddEmployee = () => {
    setEditingEmployee(null);
    setIsEmployeeModalOpen(true);
  };

  const handleEditEmployee = (employee: any) => {
    setEditingEmployee(employee);
    setIsEmployeeModalOpen(true);
  };

  const handleDeptSelect = (deptId: string) => {
    setSelectedDeptId(deptId);
  };

  const refreshOrgTree = async () => {
    try {
      setTreeLoading(true);
      const response = await getOrganizeTreeAPI({});
      setOrgList(response.data || []);
      
      // Set the first department as selected if none is selected
      if (response.data && response.data.length > 0 && !selectedDeptId) {
        setSelectedDeptId(response.data[0].id);
      }
    } catch (error) {
      console.error('获取组织架构树失败:', error);
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    refreshOrgTree();
  }, []);

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
          <span>组织管理</span>
          <i className="ri-arrow-right-s-line"></i>
          <span>组织架构</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800">组织架构</h1>
      </div>

      <div className="flex gap-6 h-full">
        {/* 左侧部门树 */}
        <div className="w-80 bg-white rounded-lg shadow-sm flex flex-col">
          <DepartmentTree 
            onAdd={handleAddDept}
            onEdit={handleEditDept}
            onSelect={handleDeptSelect}
            orgList={orgList}
            treeLoading={treeLoading}
            onRefresh={refreshOrgTree}
          />
        </div>

        {/* 右侧员工列表 */}
        <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
          <EmployeeList 
            selectedDeptId={selectedDeptId}
            onAdd={handleAddEmployee}
            onEdit={handleEditEmployee}
            orgList={orgList}
          />
        </div>
      </div>

      {/* 部门弹窗 */}
      {isDeptModalOpen && (
        <DepartmentModal
          department={editingDept}
          orgList={orgList}
          onClose={() => setIsDeptModalOpen(false)}
          onSave={(data) => {
            setIsDeptModalOpen(false);
            refreshOrgTree();
          }}
        />
      )}

      {/* 员工弹窗 */}
      {isEmployeeModalOpen && (
        <EmployeeModal
          employee={editingEmployee}
          orgList={orgList}
          selectedDeptId={selectedDeptId}
          onClose={() => setIsEmployeeModalOpen(false)}
          onSave={(data) => {
            setIsEmployeeModalOpen(false);
          }}
        />
      )}
    </div>
  );
}