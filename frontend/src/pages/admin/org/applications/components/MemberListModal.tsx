import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { getUserAppPageAPI } from '@/services/applicationService';

interface MemberListModalProps {
  applicationId: string;
  onClose: () => void;
}

interface MemberInfo {
  id: string;
  userName: string;
  phone: string;
  organizeName: string;
  positionName: string;
  enabled: string;
  createTime: string;
}

export default function MemberListModal({
  applicationId,
  onClose,
}: MemberListModalProps) {
  const [loading, setLoading] = useState(false);
  const [memberList, setMemberList] = useState<MemberInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    fetchMemberList();
  }, [applicationId, currentPage]);

  const fetchMemberList = async () => {
    try {
      setLoading(true);
      const res = await getUserAppPageAPI({
        applicationId,
        current: currentPage,
        size: pageSize,
      });
      if (res.code === 0 || res.code === 200) {
        setMemberList(res.data?.records || []);
        setTotal(res.data?.total || 0);
      }
    } catch (error: any) {
      toast.error(error.message || '获取成员列表失败');
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h3 className="text-lg font-semibold text-stone-900">平台成员</h3>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-130px)]">
          {loading ? (
            <div className="text-center py-8 text-stone-500">加载中...</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-4 py-2 text-left text-sm font-medium text-stone-600">用户名</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-stone-600">手机号</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-stone-600">所属部门</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-stone-600">职位</th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-stone-600">状态</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-stone-600">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {memberList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  memberList.map((member) => (
                    <tr key={member.id} className="hover:bg-stone-50">
                      <td className="px-4 py-2 text-sm text-stone-900">{member.userName}</td>
                      <td className="px-4 py-2 text-sm text-stone-600">{member.phone || '-'}</td>
                      <td className="px-4 py-2 text-sm text-stone-600">{member.organizeName || '-'}</td>
                      <td className="px-4 py-2 text-sm text-stone-600">{member.positionName || '-'}</td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            member.enabled === '1'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {member.enabled === '1' ? '正常' : '禁用'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-stone-600">{member.createTime || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* 分页 */}
          {total > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-stone-600">共 {total} 条</div>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-3 py-1 border border-stone-300 rounded text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="px-3 py-1 bg-[#14B8A6] text-white rounded text-sm">
                  {currentPage}
                </span>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-3 py-1 border border-stone-300 rounded text-sm hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-stone-200 bg-stone-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 transition-colors text-sm"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
