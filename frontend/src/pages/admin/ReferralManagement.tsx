import React, { useState, useEffect } from 'react';
import { Search, Eye, CheckCircle, DollarSign, XCircle, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

interface Referral {
  _id: string;
  referrerId: { _id: string; nickname: string; phone: string };
  referrerName: string;
  referrerPhone: string;
  orderId: { _id: string; orderNo: string; totalAmount: number };
  orderAmount: number;
  refereeName: string;
  refereePhone: string;
  refereeRemark: string;
  status: 'pending' | 'contacted' | 'converted' | 'rewarded' | 'invalid';
  convertedOrderId?: { _id: string; orderNo: string; totalAmount: number };
  convertedOrderAmount: number;
  rewardRate: number;
  rewardAmount: number;
  rewardStatus: 'pending' | 'approved' | 'paid';
  rewardPaidAt?: string;
  rewardRemark?: string;
  followUpNotes: { content: string; createdAt: string }[];
  createdAt: string;
}

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待跟进' },
  { value: 'contacted', label: '已联系' },
  { value: 'converted', label: '已成交' },
  { value: 'rewarded', label: '已发奖' },
  { value: 'invalid', label: '无效' }
];

const statusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: '待跟进', color: 'bg-yellow-100 text-yellow-800' },
  contacted: { text: '已联系', color: 'bg-blue-100 text-blue-800' },
  converted: { text: '已成交', color: 'bg-green-100 text-green-800' },
  rewarded: { text: '已发奖', color: 'bg-purple-100 text-purple-800' },
  invalid: { text: '无效', color: 'bg-gray-100 text-gray-800' }
};

const rewardStatusLabels: Record<string, { text: string; color: string }> = {
  pending: { text: '待审核', color: 'bg-yellow-100 text-yellow-800' },
  approved: { text: '已审核', color: 'bg-blue-100 text-blue-800' },
  paid: { text: '已发放', color: 'bg-green-100 text-green-800' }
};

export default function ReferralManagement() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [followUpNote, setFollowUpNote] = useState('');
  const [convertedOrderNo, setConvertedOrderNo] = useState('');

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (keyword) params.append('keyword', keyword);
      if (status) params.append('status', status);

      const res = await apiClient.get(`/api/referrals?${params}`);
      if (res.data.success) {
        setReferrals(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch (error) {
      console.error('获取推荐列表失败:', error);
      toast.error('获取推荐列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [page, status]);

  const handleSearch = () => {
    setPage(1);
    fetchReferrals();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await apiClient.put(`/api/referrals/${id}`, { status: newStatus });
      if (res.data.success) {
        toast.success('状态更新成功');
        fetchReferrals();
        setShowModal(false);
      }
    } catch (error) {
      toast.error('更新失败');
    }
  };

  const handleAddNote = async () => {
    if (!selectedReferral || !followUpNote.trim()) return;
    try {
      const res = await apiClient.put(`/api/referrals/${selectedReferral._id}`, { 
        followUpNote: followUpNote.trim() 
      });
      if (res.data.success) {
        toast.success('跟进记录已添加');
        setFollowUpNote('');
        fetchReferrals();
        // 更新选中的推荐信息
        setSelectedReferral(res.data.data);
      }
    } catch (error) {
      toast.error('添加失败');
    }
  };

  const handlePayReward = async (id: string) => {
    try {
      const res = await apiClient.put(`/api/referrals/${id}`, { 
        rewardStatus: 'paid',
        status: 'rewarded'
      });
      if (res.data.success) {
        toast.success('奖励已发放');
        fetchReferrals();
        setShowModal(false);
      }
    } catch (error) {
      toast.error('发放失败');
    }
  };

  const handleConvert = async () => {
    if (!selectedReferral || !convertedOrderNo.trim()) return;
    try {
      // 这里需要先通过订单号查询订单ID
      const res = await apiClient.put(`/api/referrals/${selectedReferral._id}`, { 
        status: 'converted',
        // convertedOrderId 需要后端根据订单号查询
      });
      if (res.data.success) {
        toast.success('已标记为成交');
        setConvertedOrderNo('');
        fetchReferrals();
        setShowModal(false);
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">推荐管理</h1>
        <p className="text-gray-500 mt-1">管理客户推荐记录和奖励发放</p>
      </div>

      {/* 搜索和筛选 */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索推荐人/被推荐人姓名或电话"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            搜索
          </button>
        </div>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">推荐人</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">被推荐人</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">原订单</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">奖励</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">创建时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : referrals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无推荐记录</td>
              </tr>
            ) : (
              referrals.map((item) => (
                <tr key={item._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{item.referrerName}</div>
                    <div className="text-xs text-gray-500">{item.referrerPhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium">{item.refereeName}</div>
                    <div className="text-xs text-gray-500">{item.refereePhone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{item.orderId?.orderNo || '-'}</div>
                    <div className="text-xs text-gray-500">¥{item.orderAmount}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${statusLabels[item.status]?.color}`}>
                      {statusLabels[item.status]?.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {item.status === 'converted' || item.status === 'rewarded' ? (
                      <div>
                        <div className="text-sm font-medium text-green-600">¥{item.rewardAmount.toFixed(2)}</div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${rewardStatusLabels[item.rewardStatus]?.color}`}>
                          {rewardStatusLabels[item.rewardStatus]?.text}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedReferral(item); setShowModal(true); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {item.status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(item._id, 'contacted')}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="标记已联系"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {(item.status === 'converted' && item.rewardStatus !== 'paid') && (
                        <button
                          onClick={() => handlePayReward(item._id)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title="发放奖励"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 分页 */}
        {total > 20 && (
          <div className="px-4 py-3 border-t flex justify-between items-center">
            <div className="text-sm text-gray-500">共 {total} 条记录</div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                上一页
              </button>
              <button
                disabled={page * 20 >= total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      {showModal && selectedReferral && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold">推荐详情</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">推荐人</div>
                  <div className="font-medium">{selectedReferral.referrerName}</div>
                  <div className="text-sm text-gray-500">{selectedReferral.referrerPhone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">被推荐人</div>
                  <div className="font-medium">{selectedReferral.refereeName}</div>
                  <div className="text-sm text-gray-500">{selectedReferral.refereePhone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">原订单</div>
                  <div className="font-medium">{selectedReferral.orderId?.orderNo}</div>
                  <div className="text-sm text-gray-500">¥{selectedReferral.orderAmount}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">状态</div>
                  <span className={`px-2 py-1 text-xs rounded-full ${statusLabels[selectedReferral.status]?.color}`}>
                    {statusLabels[selectedReferral.status]?.text}
                  </span>
                </div>
              </div>

              {/* 备注 */}
              {selectedReferral.refereeRemark && (
                <div>
                  <div className="text-sm text-gray-500 mb-1">推荐备注</div>
                  <div className="p-3 bg-gray-50 rounded text-sm">{selectedReferral.refereeRemark}</div>
                </div>
              )}

              {/* 奖励信息 */}
              {(selectedReferral.status === 'converted' || selectedReferral.status === 'rewarded') && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-2">奖励信息</div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">¥{selectedReferral.rewardAmount.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">奖励比例: {selectedReferral.rewardRate * 100}%</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full ${rewardStatusLabels[selectedReferral.rewardStatus]?.color}`}>
                      {rewardStatusLabels[selectedReferral.rewardStatus]?.text}
                    </span>
                  </div>
                </div>
              )}

              {/* 跟进记录 */}
              <div>
                <div className="text-sm text-gray-500 mb-2">跟进记录</div>
                <div className="space-y-2 mb-3">
                  {selectedReferral.followUpNotes.length === 0 ? (
                    <div className="text-gray-400 text-sm">暂无跟进记录</div>
                  ) : (
                    selectedReferral.followUpNotes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                        <div>{note.content}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {new Date(note.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="添加跟进记录..."
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={!followUpNote.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    添加
                  </button>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-3 pt-4 border-t">
                {selectedReferral.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReferral._id, 'contacted')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    标记已联系
                  </button>
                )}
                {selectedReferral.status === 'contacted' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReferral._id, 'converted')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    标记已成交
                  </button>
                )}
                {(selectedReferral.status === 'converted' && selectedReferral.rewardStatus !== 'paid') && (
                  <button
                    onClick={() => handlePayReward(selectedReferral._id)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    发放奖励
                  </button>
                )}
                {selectedReferral.status !== 'invalid' && selectedReferral.status !== 'rewarded' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedReferral._id, 'invalid')}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                  >
                    标记无效
                  </button>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 ml-auto"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
