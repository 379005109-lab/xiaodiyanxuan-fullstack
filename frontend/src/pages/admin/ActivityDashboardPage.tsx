import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserActivityDashboard } from '@/services/dashboardService';
import { 
  Users, Eye, Heart, GitCompare, ShoppingCart, TrendingUp,
  ArrowUpRight, ArrowDownRight, Image as ImageIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { getFileUrl } from '@/services/uploadService';

interface ActivityStats {
  today: number;
  week: number;
  month: number;
}

interface ProductRank {
  _id: string;
  productName?: string;
  thumbnail?: string;
  browseCount?: number;
  favoriteCount?: number;
  compareCount?: number;
}

interface LoginTrendPoint {
  date: string;
  dayName: string;
  count: number;
}

const StatCard = ({
  title,
  todayValue,
  weekValue,
  monthValue,
  icon: Icon,
  color,
  linkTo,
}: {
  title: string;
  todayValue: number;
  weekValue: number;
  monthValue: number;
  icon: typeof Eye;
  color: string;
  linkTo?: string;
}) => (
  <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`w-12 h-12 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {linkTo && (
        <Link 
          to={linkTo}
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
        >
          查看详情
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      )}
    </div>
    <h3 className="text-sm text-gray-600 mb-3">{title}</h3>
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">今日</span>
        <span className="text-lg font-bold text-gray-900">{todayValue.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">本周</span>
        <span className="text-sm font-semibold text-gray-700">{weekValue.toLocaleString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">本月</span>
        <span className="text-sm text-gray-600">{monthValue.toLocaleString()}</span>
      </div>
    </div>
  </div>
);

const ActivityDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getUserActivityDashboard();
        setData(result);
        setError(null);
      } catch (err: any) {
        setError(err.message || '加载失败');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">用户活跃度数据</h1>
        <p className="text-gray-600">数据加载中...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-gray-900">用户活跃度数据</h1>
        <p className="text-sm text-gray-500">用户登录、浏览、收藏、对比、加购等行为统计</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 text-sm text-red-700 px-4 py-3">
          {error}
        </div>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="用户登录"
          todayValue={data?.loginStats?.today || 0}
          weekValue={data?.loginStats?.week || 0}
          monthValue={data?.loginStats?.month || 0}
          icon={Users}
          color="bg-blue-500"
          linkTo="/admin/user-login-details?period=today"
        />
        <StatCard
          title="商品浏览"
          todayValue={data?.browseStats?.today || 0}
          weekValue={data?.browseStats?.week || 0}
          monthValue={data?.browseStats?.month || 0}
          icon={Eye}
          color="bg-green-500"
        />
        <StatCard
          title="商品收藏"
          todayValue={data?.favoriteStats?.today || 0}
          weekValue={data?.favoriteStats?.week || 0}
          monthValue={data?.favoriteStats?.month || 0}
          icon={Heart}
          color="bg-red-500"
        />
        <StatCard
          title="商品对比"
          todayValue={data?.compareStats?.today || 0}
          weekValue={data?.compareStats?.week || 0}
          monthValue={data?.compareStats?.month || 0}
          icon={GitCompare}
          color="bg-purple-500"
        />
        <StatCard
          title="加入购物车"
          todayValue={data?.cartStats?.today || 0}
          weekValue={data?.cartStats?.week || 0}
          monthValue={data?.cartStats?.month || 0}
          icon={ShoppingCart}
          color="bg-orange-500"
        />
      </div>

      {/* 7天登录趋势 */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">7天用户登录趋势</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data?.loginTrend || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eceff5" />
            <XAxis dataKey="dayName" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#3B82F6" 
              strokeWidth={2} 
              name="登录人数"
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 被浏览最多的商品 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">被浏览最多的商品</h2>
          <div className="space-y-4">
            {data?.topBrowsedProducts && data.topBrowsedProducts.length > 0 ? (
              data.topBrowsedProducts.map((product: ProductRank, index: number) => (
                <div key={product._id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {product.thumbnail ? (
                      <img
                        src={getFileUrl(product.thumbnail)}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.productName || '未知商品'}
                    </p>
                    <p className="text-xs text-gray-500">
                      浏览 {product.browseCount?.toLocaleString()} 次
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">暂无数据</p>
            )}
          </div>
        </div>

        {/* 被收藏最多的商品 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">被收藏最多的商品</h2>
          <div className="space-y-4">
            {data?.topFavoritedProducts && data.topFavoritedProducts.length > 0 ? (
              data.topFavoritedProducts.map((product: ProductRank, index: number) => (
                <div key={product._id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {product.thumbnail ? (
                      <img
                        src={getFileUrl(product.thumbnail)}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.productName || '未知商品'}
                    </p>
                    <p className="text-xs text-gray-500">
                      收藏 {product.favoriteCount?.toLocaleString()} 次
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">暂无数据</p>
            )}
          </div>
        </div>

        {/* 被对比最多的商品 */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">被对比最多的商品</h2>
          <div className="space-y-4">
            {data?.topComparedProducts && data.topComparedProducts.length > 0 ? (
              data.topComparedProducts.map((product: ProductRank, index: number) => (
                <div key={product._id} className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
                    {product.thumbnail ? (
                      <img
                        src={getFileUrl(product.thumbnail)}
                        alt={product.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {product.productName || '未知商品'}
                    </p>
                    <p className="text-xs text-gray-500">
                      对比 {product.compareCount?.toLocaleString()} 次
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">暂无数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDashboardPage;
