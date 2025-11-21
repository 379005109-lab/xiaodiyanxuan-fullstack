import { motion } from 'framer-motion'
import { Users, ShoppingCart, Package, TrendingUp, ArrowUp, ArrowDown, Target, Percent } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { formatPrice } from '@/lib/utils'

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">仪表板</h1>
      <p className="text-gray-600">欢迎来到管理后台！</p>
    </div>
  )
  
  // 统计数据 - 核心指标
  const stats = [
    {
      title: '今日订单',
      value: '156',
      change: '+12.5%',
      trend: 'up',
      icon: ShoppingCart,
      color: 'bg-blue-500',
    },
    {
      title: '新客数',
      value: '234',
      change: '+8.3%',
      trend: 'up',
      icon: Users,
      color: 'bg-green-500',
    },
    {
      title: '转化率',
      value: '3.8%',
      change: '+0.5%',
      trend: 'up',
      icon: Percent,
      color: 'bg-purple-500',
    },
    {
      title: '平均订单金额',
      value: '¥2,458',
      change: '+5.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
    {
      title: '本月营收',
      value: '¥458,234',
      change: '+15.8%',
      trend: 'up',
      icon: Target,
      color: 'bg-red-500',
    },
    {
      title: '商品总数',
      value: '1,245',
      change: '+8',
      trend: 'up',
      icon: Package,
      color: 'bg-indigo-500',
    },
  ]

  // 销售趋势数据
  const salesData = [
    { name: '1月', value: 45000 },
    { name: '2月', value: 52000 },
    { name: '3月', value: 48000 },
    { name: '4月', value: 61000 },
    { name: '5月', value: 55000 },
    { name: '6月', value: 67000 },
    { name: '7月', value: 72000 },
    { name: '8月', value: 68000 },
    { name: '9月', value: 75000 },
    { name: '10月', value: 81000 },
    { name: '11月', value: 89000 },
    { name: '12月', value: 95000 },
  ]

  // 订单状态分布
  const orderStatusData = [
    { name: '待付款', value: 234, color: '#FBBF24' },
    { name: '处理中', value: 456, color: '#3B82F6' },
    { name: '已付款', value: 789, color: '#10B981' },
    { name: '已发货', value: 567, color: '#8B5CF6' },
    { name: '已完成', value: 1234, color: '#06B6D4' },
    { name: '已取消', value: 123, color: '#EF4444' },
  ]

  // 商品风格分布
  const styleData = [
    { name: '中古风', value: 320, color: '#8B5CF6' },
    { name: '现代风', value: 450, color: '#3B82F6' },
    { name: '奶油风', value: 280, color: '#F59E0B' },
    { name: '极简风', value: 195, color: '#10B981' },
  ]

  // 商品价格分布
  const priceData = [
    { range: '0-2K', count: 245 },
    { range: '2-5K', count: 389 },
    { range: '5-10K', count: 234 },
    { range: '10K+', count: 156 },
  ]

  // 用户活跃度
  const activityData = [
    { day: '周一', dau: 1234, wau: 5678, mau: 8234 },
    { day: '周二', dau: 1456, wau: 5890, mau: 8456 },
    { day: '周三', dau: 1289, wau: 5745, mau: 8345 },
    { day: '周四', dau: 1534, wau: 6012, mau: 8567 },
    { day: '周五', dau: 1678, wau: 6234, mau: 8789 },
    { day: '周六', dau: 1890, wau: 6456, mau: 8901 },
    { day: '周日', dau: 1745, wau: 6345, mau: 8845 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">数据仪表盘</h1>
        <select className="input w-48">
          <option>最近7天</option>
          <option>最近30天</option>
          <option>最近90天</option>
          <option>最近一年</option>
        </select>
      </div>

      {/* 统计卡片 - 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              className="card p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1 truncate">{stat.title}</p>
                  <h3 className="text-lg font-bold mb-1 truncate">{stat.value}</h3>
                  <div className="flex items-center space-x-1">
                    {stat.trend === 'up' ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                      }`}
                    >
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0 ml-2`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 销售趋势 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card lg:col-span-2"
        >
          <h3 className="text-lg font-semibold mb-4">年度销售趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatPrice(Number(value))} />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3B82F6"
                strokeWidth={2}
                name="销售额"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 订单状态分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4">订单状态分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 商品风格分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4">商品风格分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={styleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {styleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 价格分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="card"
        >
          <h3 className="text-lg font-semibold mb-4">商品价格分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8B5CF6" name="商品数量" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 用户活跃度 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="card lg:col-span-2"
        >
          <h3 className="text-lg font-semibold mb-4">用户活跃度统计</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="dau" stroke="#3B82F6" name="日活(DAU)" />
              <Line type="monotone" dataKey="wau" stroke="#10B981" name="周活(WAU)" />
              <Line type="monotone" dataKey="mau" stroke="#F59E0B" name="月活(MAU)" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* 最新订单 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="card"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">最新订单</h3>
          <button className="text-primary-600 hover:text-primary-700 text-sm">
            查看全部 →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">订单号</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">客户</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">金额</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">状态</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">时间</th>
              </tr>
            </thead>
            <tbody>
              {[
                { no: 'ORD202411070001', customer: '张三', amount: 5999, status: '已支付', time: '10:30' },
                { no: 'ORD202411070002', customer: '李四', amount: 3499, status: '待支付', time: '10:25' },
                { no: 'ORD202411070003', customer: '王五', amount: 8888, status: '已支付', time: '10:20' },
                { no: 'ORD202411070004', customer: '赵六', amount: 12999, status: '已发货', time: '10:15' },
                { no: 'ORD202411070005', customer: '钱七', amount: 4599, status: '已支付', time: '10:10' },
              ].map((order) => (
                <tr key={order.no} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{order.no}</td>
                  <td className="py-3 px-4 text-sm">{order.customer}</td>
                  <td className="py-3 px-4 text-sm font-medium">{formatPrice(order.amount)}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        order.status === '已支付'
                          ? 'bg-green-100 text-green-700'
                          : order.status === '待支付'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{order.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}

