import React, { useState, useEffect } from 'react';
import { Camera, TrendingUp, Users, Eye, ShoppingCart, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/lib/apiClient';

interface SourceStat {
  source: string;
  sourceName: string;
  count: number;
  followUpRate: string;
}

interface SearchRecord {
  _id: string;
  imageUrl: string;
  detectedSource: string;
  watermarkDetails: {
    hasWatermark: boolean;
    watermarkText: string;
  };
  channel: string;
  hasFollowUp: boolean;
  followUpAction: string;
  createdAt: string;
  userId?: { nickname: string; phone: string };
}

const sourceColors: Record<string, string> = {
  xiaohongshu: 'bg-red-500',
  douyin: 'bg-gray-900',
  kuaishou: 'bg-orange-500',
  weibo: 'bg-red-600',
  taobao: 'bg-orange-600',
  pinterest: 'bg-red-700',
  unknown: 'bg-gray-500',
  none: 'bg-green-500'
};

export default function ImageSearchStats() {
  const [stats, setStats] = useState<{
    total: number;
    sourceStats: SourceStat[];
    channelStats: { _id: string; count: number }[];
  } | null>(null);
  const [records, setRecords] = useState<SearchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterSource, setFilterSource] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      
      const res = await apiClient.get(`/image-search/stats?${params}`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error('获取统计失败:', error);
    }
  };

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (filterSource) params.append('source', filterSource);
      
      const res = await apiClient.get(`/image-search/history?${params}`);
      if (res.data.success) {
        setRecords(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch (error) {
      console.error('获取记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRecords();
  }, [page, filterSource, dateRange]);

  const getSourceName = (source: string) => {
    const names: Record<string, string> = {
      xiaohongshu: '小红书',
      douyin: '抖音',
      kuaishou: '快手',
      weibo: '微博',
      taobao: '淘宝/天猫',
      pinterest: 'Pinterest',
      unknown: '其他平台',
      none: '无水印'
    };
    return names[source] || source;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Camera className="w-7 h-7 text-cyan-500" />
          以图搜图统计
        </h1>
        <p className="text-gray-500 mt-1">分析用户上传图片的来源渠道</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">总搜索次数</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-cyan-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">小红书来源</p>
                <p className="text-3xl font-bold text-red-500">
                  {stats.sourceStats.find(s => s.source === 'xiaohongshu')?.count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">📕</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">抖音来源</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.sourceStats.find(s => s.source === 'douyin')?.count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎵</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Web端</p>
                <p className="text-3xl font-bold text-blue-500">
                  {stats.channelStats.find(c => c._id === 'web')?.count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 来源分布 */}
      {stats && stats.sourceStats.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">来源分布</h3>
          <div className="space-y-3">
            {stats.sourceStats.map((item) => (
              <div key={item.source} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${sourceColors[item.source] || 'bg-gray-400'}`} />
                <span className="w-24 text-sm text-gray-600">{item.sourceName}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full ${sourceColors[item.source] || 'bg-gray-400'}`}
                    style={{ width: `${stats.total > 0 ? (item.count / stats.total * 100) : 0}%` }}
                  />
                </div>
                <span className="w-16 text-sm font-medium text-gray-900 text-right">{item.count}次</span>
                <span className="w-20 text-xs text-gray-500 text-right">转化{item.followUpRate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 筛选 */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">全部来源</option>
              <option value="xiaohongshu">小红书</option>
              <option value="douyin">抖音</option>
              <option value="kuaishou">快手</option>
              <option value="weibo">微博</option>
              <option value="taobao">淘宝/天猫</option>
              <option value="unknown">其他平台</option>
              <option value="none">无水印</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <span className="text-gray-400">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* 搜索记录列表 */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">来源</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">水印信息</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">渠道</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">后续行为</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">暂无搜索记录</td>
              </tr>
            ) : (
              records.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(record.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${sourceColors[record.detectedSource] || 'bg-gray-400'}`}>
                      {getSourceName(record.detectedSource)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.watermarkDetails?.hasWatermark ? (
                      <span className="text-gray-900">{record.watermarkDetails.watermarkText || '有水印'}</span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${record.channel === 'web' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {record.channel === 'web' ? 'Web' : '小程序'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.userId?.nickname || record.userId?.phone || '游客'}
                  </td>
                  <td className="px-4 py-3">
                    {record.hasFollowUp ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        {record.followUpAction === 'view_product' && <Eye className="w-4 h-4" />}
                        {record.followUpAction === 'add_cart' && <ShoppingCart className="w-4 h-4" />}
                        {record.followUpAction === 'view_product' ? '查看商品' : 
                         record.followUpAction === 'add_cart' ? '加入购物车' : 
                         record.followUpAction === 'purchase' ? '购买' : '有行为'}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
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
    </div>
  );
}
