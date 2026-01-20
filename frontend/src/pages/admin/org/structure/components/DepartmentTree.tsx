
import { useState } from 'react';
import { delOrganizeAPI } from '@/services/orgService';

interface Department {
  id: string;
  name: string;
  parentId: string | null;
  children?: Department[];
  systemFlag?: string;
}

interface DepartmentTreeProps {
  onAdd: () => void;
  onEdit: (dept: Department) => void;
  onSelect: (deptId: string) => void;
  orgList: Department[];
  treeLoading: boolean;
  onRefresh: () => void;
}

export default function DepartmentTree({ onAdd, onEdit, onSelect, orgList, treeLoading, onRefresh }: DepartmentTreeProps) {
  const [searchText, setSearchText] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['1']));
  const [selectedId, setSelectedId] = useState('');

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const handleSelect = (dept: Department) => {
    setSelectedId(dept.id);
    onSelect(dept.id);
  };

  const handleDelete = async (dept: Department) => {
    if (window.confirm('此操作将永久删除该数据, 是否继续？')) {
      try {
        await delOrganizeAPI(dept.id);
        alert('删除成功！');
        onRefresh();
      } catch (error) {
        console.error('删除部门失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const renderTree = (depts: Department[], level = 0) => {
    return depts.map(dept => {
      const hasChildren = dept.children && dept.children.length > 0;
      const isExpanded = expandedIds.has(dept.id);
      const isSelected = selectedId === dept.id;

      return (
        <div key={dept.id}>
          <div
            className={`flex items-center gap-2 py-2 px-3 hover:bg-stone-50 cursor-pointer transition-colors ${
              isSelected ? 'bg-[#14B8A6]/10 text-[#14B8A6]' : ''
            }`}
            style={{ paddingLeft: `${level * 20 + 12}px` }}
            onClick={() => handleSelect(dept)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(dept.id);
                }}
                className="w-4 h-4 flex items-center justify-center"
              >
                <i className={`ri-arrow-${isExpanded ? 'down' : 'right'}-s-line text-sm`}></i>
              </button>
            ) : (
              <span className="w-4"></span>
            )}
            <i className="ri-building-line text-base"></i>
            <span className="flex-1 text-sm">{dept.name}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
              {dept.systemFlag === '0' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(dept);
                    }}
                    className="text-stone-400 hover:text-[#14B8A6] p-1"
                  >
                    <i className="ri-edit-line text-sm"></i>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(dept);
                    }}
                    className="text-stone-400 hover:text-red-500 p-1"
                  >
                    <i className="ri-delete-line text-sm"></i>
                  </button>
                </>
              )}
            </div>
          </div>
          {hasChildren && isExpanded && renderTree(dept.children!, level + 1)}
        </div>
      );
    });
  };

  return (
    <>
      <div className="p-4 border-b border-stone-200">
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"></i>
          <input
            type="text"
            placeholder="搜索部门"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 group">
        {treeLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#14B8A6]"></div>
          </div>
        ) : (
          renderTree(orgList)
        )}
      </div>

      <div className="p-4 border-t border-stone-200 flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="bg-white text-stone-600 px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50 transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap flex-1"
        >
          <i className="ri-refresh-line"></i>
          刷新
        </button>
        <button
          onClick={onAdd}
          className="bg-[#14B8A6] text-white px-4 py-2 rounded-lg hover:bg-[#0d9488] transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer whitespace-nowrap"
        >
          <i className="ri-add-line"></i>
          新增部门
        </button>
      </div>
    </>
  );
}
