import React, { useEffect, useMemo, useState } from 'react';
import { getDashboardData } from '@/services/dashboardService';
import UserBehaviorChart, { UserBehaviorDatum } from '@/components/admin/charts/UserBehaviorChart';
import TagValueChart, { TagValueDatum } from '@/components/admin/charts/TagValueChart';
import ViralEffectChart, { ViralMetric } from '@/components/admin/charts/ViralEffectChart';
import DesignerContributionChart, { DesignerContributionDatum } from '@/components/admin/charts/DesignerContributionChart';
import StyleMatchChart, { StyleMatchDatum } from '@/components/admin/charts/StyleMatchChart';
import { TrendingUp, ShoppingCart, Users, DollarSign, Share2, Percent, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';

type TrendPoint = { date: string; orders: number; gmv: number };
type ProductRank = { name: string; gmv: number; orders: number; conversion?: number };
type FlatPriceMetric = {
  count: number;
  avgAmount: number;
  ratio: number;
  recent: { orderNo: string; customer: string; amount: number; status: string }[];
};

const fallbackData = {
  summary: {
    todayGMV: 428000,
    todayOrders: 156,
    avgOrderValue: 2740,
    activeUsers: 2380,
    flatPriceOrders: 23,
    shareConversion: 3.6,
  },
  summaryTrend: {
    todayGMVChange: 12.5,
    todayOrdersChange: 8.2,
    avgOrderChange: 3.1,
    activeChange: -1.8,
    flatPriceChange: 5.4,
    shareChange: 0.6,
  },
  orderTrend: [
    { date: '周一', orders: 120, gmv: 32000 },
    { date: '周二', orders: 150, gmv: 36000 },
    { date: '周三', orders: 140, gmv: 34500 },
    { date: '周四', orders: 180, gmv: 42000 },
    { date: '周五', orders: 210, gmv: 52000 },
    { date: '周六', orders: 260, gmv: 64000 },
    { date: '周日', orders: 190, gmv: 49800 },
  ] as TrendPoint[],
  userBehavior: undefined as UserBehaviorDatum[] | undefined,
  tagValue: undefined as TagValueDatum[] | undefined,
  viralEffect: { visits: 1250, conversionRate: 3.8, orders: 42 } as ViralMetric,
  designerContribution: undefined as DesignerContributionDatum[] | undefined,
  styleMatch: undefined as StyleMatchDatum[] | undefined,
  hotProducts: [
    { name: '云朵羽绒沙发', gmv: 168000, orders: 56, conversion: 18 },
    { name: '岩板电动餐桌', gmv: 124000, orders: 33, conversion: 21 },
    { name: '法式衣帽间套系', gmv: 98000, orders: 22, conversion: 14 },
  ] as ProductRank[],
  flatPrice: {
    count: 23,
    avgAmount: 36800,
    ratio: 18,
    recent: [
      { orderNo: 'ORD2024112108', customer: '张三', amount: 42800, status: '已支付' },
      { orderNo: 'ORD2024112106', customer: '李四', amount: 31200, status: '待支付' },
      { orderNo: 'ORD2024112102', customer: '王五', amount: 55900, status: '已支付' },
    ],
  } as FlatPriceMetric,
};

const formatCurrency = (value: number) => `¥${value.toLocaleString()}`;

const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  trend = 'up',
}: {
  title: string;
  value: string;
  change: number;
  icon: typeof ShoppingCart;
  trend?: 'up' | 'down';
}) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
    <div>
      <p className="text-sm text-gray-500 mb-2">{title}</p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <div className="flex items-center gap-1 mt-2 text-sm">
        {trend === 'up' ? (
          <ArrowUpRight className="h-4 w-4 text-green-500" />
        ) : (
          <ArrowDownRight className="h-4 w-4 text-red-500" />
        )}
        <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
          {trend === 'up' ? '+' : ''}{change.toFixed(1)}%
        </span>
        <span className="text-gray-400">vs 上周</span>
      </div>
    </div>
    <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
      <Icon className="h-6 w-6" />
    </div>
  </div>
);

const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getDashboardData();
        setData(result);
        setError(null);
      } catch (err: any) {
        setError(err.message || '加载数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const dashboard = useMemo(() => {
    if (!data) {
      return fallbackData;
    }

    const getMetric = (key: string, fallback: any) => data?.[key]?.data ?? fallback;

    return {
      summary: data.summary ?? fallbackData.summary,
      summaryTrend: data.summaryTrend ?? fallbackData.summaryTrend,
      orderTrend: getMetric('orderTrend', fallbackData.orderTrend),
      userBehavior:
        getMetric('userBehavior', undefined) ?? getMetric('userRoleBehavior', undefined) ?? fallbackData.userBehavior,
      tagValue: getMetric('tagValue', fallbackData.tagValue),
      viralEffect: data.viralEffect?.data ?? fallbackData.viralEffect,
      designerContribution: getMetric('designerContribution', fallbackData.designerContribution),
      styleMatch: getMetric('styleMatch', fallbackData.styleMatch),
      hotProducts: data.hotProducts?.data ?? fallbackData.hotProducts,
      flatPrice: data.flatPrice ?? fallbackData.flatPrice,
    };
  }, [data]);

  if (loading) {
    return <div className="p-8 text-gray-500">数据加载中...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-8">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-gray-900">运营数据总览</h1>
        <p className="text-sm text-gray-500">实时汇总订单、用户、内容与一口价策略表现</p>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 text-sm text-amber-700 px-4 py-3">
          数据接口暂不可用，当前展示本地参考数据。错误信息：{error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          title="今日 GMV"
          value={formatCurrency(dashboard.summary.todayGMV)}
          change={dashboard.summaryTrend.todayGMVChange}
          icon={TrendingUp}
        />
        <StatCard
          title="今日订单"
          value={`${dashboard.summary.todayOrders.toLocaleString()} 单`}
          change={dashboard.summaryTrend.todayOrdersChange}
          icon={ShoppingCart}
        />
        <StatCard
          title="平均客单价"
          value={formatCurrency(dashboard.summary.avgOrderValue)}
          change={dashboard.summaryTrend.avgOrderChange}
          icon={DollarSign}
        />
        <StatCard
          title="活跃用户"
          value={`${dashboard.summary.activeUsers.toLocaleString()} 人`}
          change={dashboard.summaryTrend.activeChange}
          icon={Users}
          trend={dashboard.summaryTrend.activeChange >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="一口价订单"
          value={`${dashboard.summary.flatPriceOrders} 单`}
          change={dashboard.summaryTrend.flatPriceChange}
          icon={Percent}
        />
        <StatCard
          title="分享转化率"
          value={`${dashboard.summary.shareConversion.toFixed(1)}%`}
          change={dashboard.summaryTrend.shareChange}
          icon={Share2}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">近 7 天订单与GMV 趋势</h2>
              <p className="text-xs text-gray-500">订单峰值出现在周六，GMV 与订单量保持正相关</p>
            </div>
            <span className="text-xs text-gray-400">数据来源：/dashboard</span>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={dashboard.orderTrend} margin={{ left: 6, right: 12 }}>
              <defs>
                <linearGradient id="colorGMV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3E76FF" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#3E76FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eceff5" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis yAxisId="left" tickFormatter={(value) => `${value}`}
                tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip formatter={(value: number, key) => (key === 'gmv' ? formatCurrency(value) : `${value} 单`)} />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} yAxisId="left" name="订单量" />
              <Area
                type="monotone"
                dataKey="gmv"
                stroke="#3E76FF"
                fillOpacity={1}
                fill="url(#colorGMV)"
                yAxisId="right"
                name="GMV"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">分享传播表现</h2>
          <ViralEffectChart data={dashboard.viralEffect} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">用户行为漏斗</h3>
          <p className="text-xs text-gray-500 mb-6">跟踪浏览→支付全链路，识别流失点</p>
          <UserBehaviorChart data={dashboard.userBehavior} />
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">标签价值看板</h3>
          <p className="text-xs text-gray-500 mb-6">不同标签用户的生命周期价值与客单价</p>
          <TagValueChart data={dashboard.tagValue} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">设计师贡献榜</h3>
          <DesignerContributionChart data={dashboard.designerContribution} />
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">风格匹配转化</h3>
          <StyleMatchChart data={dashboard.styleMatch} />
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">热销商品 TOP3</h3>
          <div className="space-y-4 flex-1">
            {dashboard.hotProducts.map((item: ProductRank) => (
              <div key={item.name} className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.orders} 单 · 转化 {item.conversion ?? 0}%</p>
                </div>
                <p className="text-base font-semibold text-primary-600">{formatCurrency(item.gmv)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">一口价策略表现</h3>
            <p className="text-xs text-gray-500">统计最近一周的一口价订单执行情况</p>
          </div>
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-gray-500">一口价订单数</p>
              <p className="text-xl font-semibold text-gray-900">{dashboard.flatPrice.count}</p>
            </div>
            <div>
              <p className="text-gray-500">平均金额</p>
              <p className="text-xl font-semibold text-gray-900">{formatCurrency(dashboard.flatPrice.avgAmount)}</p>
            </div>
            <div>
              <p className="text-gray-500">占订单比例</p>
              <p className="text-xl font-semibold text-gray-900">{dashboard.flatPrice.ratio}%</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">订单号</th>
                <th className="py-2">客户</th>
                <th className="py-2">金额</th>
                <th className="py-2">状态</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.flatPrice.recent.map((order: FlatPriceMetric['recent'][number]) => (
                <tr key={order.orderNo} className="border-b last:border-b-0">
                  <td className="py-2 font-medium text-gray-900">{order.orderNo}</td>
                  <td className="py-2 text-gray-600">{order.customer}</td>
                  <td className="py-2 font-semibold text-primary-600">{formatCurrency(order.amount)}</td>
                  <td className="py-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        order.status === '已支付'
                          ? 'bg-green-50 text-green-600'
                          : order.status === '待支付'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
