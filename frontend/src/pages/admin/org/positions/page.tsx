import { useState, useEffect } from 'react';
import PositionModal from './components/PositionModal';
import { getPositionListAPI, addPositionAPI, updatePositionAPI, delPositionAPI, updatePositionEnabledAPI } from '../../../../services/positionService';

interface Position {
  id: string;
  name: string;
  code?: string;
  level?: string;
  employeeCount?: number;
  enabled?: string;
  systemFlag?: string;
  createTime?: string;
  remark?: string;
}

export default function Positions() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 20;

  // 获取职位列表
  const fetchPositionList = async () => {
    try {
      setLoading(true);
      const response = await getPositionListAPI({
        name: searchText,
        enabled: statusFilter === '全部' ? '' : statusFilter === '正常' ? '1' : '0',
        current: currentPage,
        size: pageSize
      });
      setPositions(response.data?.records || []);
      setTotal(response.data?.total || 0);
    } catch (error) {
      console.error('获取职位列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositionList();
  }, [currentPage]);

  const handleAdd = () => {
    setEditingPosition(null);
    setIsModalOpen(true);
  };

  const handleEdit = (position: Position) => {
    setEditingPosition(position);
    setIsModalOpen(true);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchPositionList();
  };

  const handleReset = () => {
    setSearchText('');
    setStatusFilter('全部');
    setCurrentPage(1);
    fetchPositionList();
  };

  const handleDelete = async (position: Position) => {
    if (position.systemFlag === '1') {
      alert('系统职位不能删除');
      return;
    }
    if (window.confirm('此操作将永久删除该数据, 是否继续？')) {
      try {
        await delPositionAPI(position.id);
        alert('删除成功！');
        fetchPositionList();
      } catch (error) {
        console.error('删除职位失败:', error);
        alert('删除失败，请重试');
      }
    }
  };

  const handleEnabledToggle = async (position: Position) => {
    const action = position.enabled === '1' ? '禁用' : '启用';
    if (window.confirm(`是否${action}此项数据?`)) {
      try {
        await updatePositionEnabledAPI(position.id);
        alert(`${action}成功`);
        fetchPositionList();
      } catch (error) {
        console.error(`${action}失败:`, error);
        alert(`${action}失败，请重试`);
      }
    }
  };

  const handleSavePosition = async (data: any) => {
    try {
      if (editingPosition?.id) {
        await updatePositionAPI({ ...data, id: editingPosition.id });
      } else {
        await addPositionAPI(data);
      }
      alert('保存成功！');
      setIsModalOpen(false);
      fetchPositionList();
    } catch (error) {
      console.error('保存职位失败:', error);
      alert('保存失败，请重试');
    }
  };

  return (
    <div>
      {/* 页面标题 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-stone-500 mb-2">
          <span>组织管理</span>
          <i className="ri-arrow-right-s-line"></i>
          <span>职位管理</span>
        </div>
        <h1 className="text-2xl font-bold text-stone-800">职位管理</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        {/* 搜索筛选区域 */}
        <div className="p-6 border-b border-stone-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="搜索职位名称或编码"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm cursor-pointer"
            >
              <option>全部</option>
              <option>正常</option>
              <option>禁用</option>
            </select>
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
              onClick={handleAdd}
              className="bg-[#14B8A6] text-white px-5 py-2 rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line"></i>
              新增职位
            </button>
          </div>
        </div>

        {/* 表格 */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">序号</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">职位名称</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">职位编码</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">职级</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">员工人数</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">状态</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">创建时间</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-stone-200">
              {positions.map((position, index) => (
                <tr key={position.id} className="hover:bg-stone-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{index + 1}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{position.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{position.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-blue-100 text-blue-700">
                      {position.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{position.employeeCount}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {position.enabled === '1' ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-green-100 text-green-700">
                        正常
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-100 text-red-700">
                        禁用
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-stone-900">{position.createTime}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleEdit(position)}
                        className="text-[#14B8A6] hover:text-[#0d9488] text-sm cursor-pointer whitespace-nowrap"
                      >
                        编辑
                      </button>
                      {position.systemFlag === '0' && (
                        <>
                          <button
                            onClick={() => handleEnabledToggle(position)}
                            className={`text-sm cursor-pointer whitespace-nowrap ${
                              position.enabled === '1' ? 'text-red-500 hover:text-red-700' : 'text-[#14B8A6] hover:text-[#0d9488]'
                            }`}
                          >
                            {position.enabled === '1' ? '禁用' : '启用'}
                          </button>
                          <button
                            onClick={() => handleDelete(position)}
                            className="text-red-600 hover:text-red-700 text-sm cursor-pointer whitespace-nowrap"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      {total > pageSize && (
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
      )}

      {/* 职位弹窗 */}
      {isModalOpen && (
        <PositionModal
          position={editingPosition ? {
            id: editingPosition.id,
            name: editingPosition.name,
            code: editingPosition.code || '',
            level: editingPosition.level || '',
            description: editingPosition.remark || ''
          } : null}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSavePosition}
        />
      )}
    </div>
  );
}