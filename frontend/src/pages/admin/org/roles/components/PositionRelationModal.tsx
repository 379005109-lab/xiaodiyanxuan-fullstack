import { useState, useEffect } from 'react';
import { correlationRoleAndPositionAPI } from '../../../../../services/roleService';
import { getPositionBizEnabledListAPI } from '../../../../../services/positionService';

interface Position {
  id: string;
  name: string;
}

interface PositionRelationModalProps {
  role: { id: string; name: string };
  onClose: () => void;
  onSave: () => void;
}

export default function PositionRelationModal({ role, onClose, onSave }: PositionRelationModalProps) {
  const [searchText, setSearchText] = useState('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const response = await getPositionBizEnabledListAPI({ name: searchText });
      setPositions(response.data || []);
    } catch (error) {
      console.error('获取职位列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleSearch = () => {
    fetchPositions();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(positions.map(p => p.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      alert('请选择要关联的职位');
      return;
    }
    try {
      setBtnLoading(true);
      await correlationRoleAndPositionAPI({
        roleId: role.id,
        authIds: Array.from(selectedIds)
      });
      alert('关联成功！');
      onSave();
      onClose();
    } catch (error) {
      console.error('关联职位失败:', error);
      alert('关联失败，请重试');
    } finally {
      setBtnLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">
            【{role.name}】关联职位
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 cursor-pointer">
            <i className="ri-close-line text-xl"></i>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-4 mb-4">
            <input
              type="text"
              placeholder="请输入职位名称"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-[#14B8A6] text-sm"
            />
            <button
              onClick={handleSearch}
              className="bg-[#14B8A6] text-white px-6 py-2 rounded-lg hover:bg-[#0d9488] transition-colors flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap"
            >
              <i className="ri-search-line"></i>
              查询
            </button>
          </div>

          <div className="flex-1 overflow-auto border border-stone-200 rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#14B8A6]"></div>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 sticky top-0">
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-600 w-12">
                      <input
                        type="checkbox"
                        checked={positions.length > 0 && selectedIds.size === positions.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">职位</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-stone-200">
                  {positions.map((position) => (
                    <tr key={position.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(position.id)}
                          onChange={(e) => handleSelect(position.id, e.target.checked)}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-900">{position.name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors text-sm cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={btnLoading}
            className="px-6 py-2 bg-[#14B8A6] text-white rounded-lg hover:bg-[#0d9488] transition-colors text-sm cursor-pointer disabled:opacity-50"
          >
            {btnLoading ? '关联中...' : '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}
