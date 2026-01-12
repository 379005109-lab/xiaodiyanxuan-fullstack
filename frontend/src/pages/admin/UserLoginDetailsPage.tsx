import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Clock, Eye, Heart, ShoppingCart, GitCompare } from 'lucide-react';
import { getUserLoginDetails } from '@/services/dashboardService';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface UserLoginDetail {
  _id: string;
  username: string;
  nickname?: string;
  phone?: string;
  email?: string;
  lastLoginAt: string;
  browseCount: number;
  favoriteCount: number;
  compareCount: number;
  cartCount: number;
  recentBrowse: Array<{
    productId: string;
    productName: string;
    thumbnail?: string;
    viewedAt: string;
  }>;
}

const UserLoginDetailsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const period = (searchParams.get('period') || 'today') as 'today' | 'week' | 'month';
  const [users, setUsers] = useState<UserLoginDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getUserLoginDetails(period);
        setUsers(result.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || '加载失败');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const getPeriodTitle = () => {
    switch (period) {
      case 'today':
        return '今日登录用户';
      case 'week':
        return '本周登录用户';
      case 'month':
        return '本月登录用户';
      default:
        return '登录用户';
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold">{getPeriodTitle()}</h1>
        </div>
        <p className="text-gray-600">数据加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getPeriodTitle()}</h1>
          <p className="text-sm text-gray-500 mt-1">共 {users.length} 位用户</p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-sm text-red-700 px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {users.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center">
            <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">暂无登录用户数据</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              {/* 用户基本信息 */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                    {user.nickname?.[0] || user.username?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.nickname || user.username}
                    </h3>
                    {user.phone && (
                      <p className="text-sm text-gray-500">{user.phone}</p>
                    )}
                    {user.email && (
                      <p className="text-sm text-gray-500">{user.email}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatDistanceToNow(new Date(user.lastLoginAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(user.lastLoginAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              {/* 用户行为统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <span className="text-sm text-gray-600">浏览</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{user.browseCount}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    <span className="text-sm text-gray-600">收藏</span>
                  </div>
                  <p className="text-2xl font-bold text-red-600">{user.favoriteCount}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <GitCompare className="h-5 w-5 text-purple-600" />
                    <span className="text-sm text-gray-600">对比</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">{user.compareCount}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                    <span className="text-sm text-gray-600">购物车</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">{user.cartCount}</p>
                </div>
              </div>

              {/* 最近浏览的商品 */}
              {user.recentBrowse && user.recentBrowse.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">最近浏览</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {user.recentBrowse.slice(0, 6).map((item, index) => (
                      <div key={index} className="group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.productName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Eye className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">{item.productName}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(item.viewedAt), {
                            addSuffix: true,
                            locale: zhCN,
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UserLoginDetailsPage;
