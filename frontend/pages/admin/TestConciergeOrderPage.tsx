import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Play, Trash2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { initAllTestData, getTestCustomer, getTestOrders, clearTestData } from '@/utils/testDataInit'
import { toast } from 'sonner'

export default function TestConciergeOrderPage() {
  const [testInitialized, setTestInitialized] = useState(false)
  const [testCustomer, setTestCustomer] = useState<any>(null)
  const [testOrders, setTestOrders] = useState<any[]>([])
  const [conciergeOrders, setConciergeOrders] = useState<any[]>([])

  useEffect(() => {
    checkTestData()
  }, [])

  const checkTestData = () => {
    const customer = getTestCustomer()
    const orders = getTestOrders()
    const concierge = JSON.parse(localStorage.getItem('concierge_orders') || '[]')
    
    setTestCustomer(customer)
    setTestOrders(orders)
    setConciergeOrders(concierge)
    setTestInitialized(!!customer)
  }

  const handleInitTestData = () => {
    try {
      initAllTestData()
      checkTestData()
      toast.success('测试数据已初始化！')
    } catch (error) {
      console.error('初始化失败:', error)
      toast.error('初始化失败')
    }
  }

  const handleClearTestData = () => {
    if (confirm('确定要清理所有测试数据吗？')) {
      try {
        clearTestData()
        checkTestData()
        toast.success('测试数据已清理！')
      } catch (error) {
        console.error('清理失败:', error)
        toast.error('清理失败')
      }
    }
  }

  const handleRefresh = () => {
    checkTestData()
    toast.success('已刷新数据！')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* 页头 */}
          <div>
            <h1 className="text-3xl font-bold">代客下单测试</h1>
            <p className="text-gray-600 mt-1">创建测试客户和订单，验证代客下单流程</p>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleInitTestData}
              className="btn-primary flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              初始化测试数据
            </button>
            <button
              onClick={handleRefresh}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              刷新数据
            </button>
            <button
              onClick={handleClearTestData}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold flex items-center gap-2 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              清理测试数据
            </button>
          </div>

          {/* 测试客户信息 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">测试客户信息</h2>
            {testCustomer ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">客户已创建</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">用户名</p>
                    <p className="text-lg font-semibold text-gray-900">{testCustomer.username}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">电话</p>
                    <p className="text-lg font-semibold text-gray-900">{testCustomer.phone}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">邮箱</p>
                    <p className="text-lg font-semibold text-gray-900">{testCustomer.email}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600">角色</p>
                    <p className="text-lg font-semibold text-gray-900">{testCustomer.role}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="h-5 w-5" />
                <span>请先初始化测试数据</span>
              </div>
            )}
          </div>

          {/* 测试订单 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">测试订单 ({testOrders.length})</h2>
            {testOrders.length > 0 ? (
              <div className="space-y-3">
                {testOrders.map((order) => (
                  <div key={order.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{order.title}</p>
                        <p className="text-xs text-gray-600">{order.orderNo}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        order.source === 'backend'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {order.source === 'backend' ? '后台推送' : '客户自己下单'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      商品数: {order.items.length} | 总价: ¥{order.totalAmount}
                    </p>
                    <p className="text-xs text-gray-500">
                      创建时间: {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600">
                <AlertCircle className="h-5 w-5" />
                <span>暂无测试订单</span>
              </div>
            )}
          </div>

          {/* 代客下单推送记录 */}
          <div className="card">
            <h2 className="text-xl font-bold mb-4">代客下单推送记录 ({conciergeOrders.length})</h2>
            {conciergeOrders.length > 0 ? (
              <div className="space-y-3">
                {conciergeOrders.map((order, index) => (
                  <div key={index} className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">订单 #{index + 1}</p>
                        <p className="text-xs text-gray-600">客户: {order.customerName}</p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        已推送
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      商品数: {order.items.length} | 总价: ¥{order.totalAmount}
                    </p>
                    <p className="text-xs text-gray-500">
                      推送时间: {new Date(order.createdAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      客户电话: {order.customerPhone}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-600">
                <AlertCircle className="h-5 w-5" />
                <span>暂无推送记录</span>
              </div>
            )}
          </div>

          {/* 测试流程说明 */}
          <div className="card bg-blue-50 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold mb-4 text-blue-900">测试流程</h2>
            <ol className="space-y-3 text-blue-900">
              <li className="flex gap-3">
                <span className="font-bold flex-shrink-0">1.</span>
                <span>点击"初始化测试数据"按钮，创建测试客户（丫丫）和测试订单</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold flex-shrink-0">2.</span>
                <span>进入前端"我的订单"页面，查看测试订单</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold flex-shrink-0">3.</span>
                <span>点击订单的"代客下单"按钮，进入代客下单模式</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold flex-shrink-0">4.</span>
                <span>在购物车页面可以编辑商品，然后输入客户电话号码（13875695196）</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold flex-shrink-0">5.</span>
                <span>点击"提交代客下单"按钮，订单会被推送</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold flex-shrink-0">6.</span>
                <span>推送的订单会显示在"代客下单推送记录"中</span>
              </li>
            </ol>
          </div>

          {/* 后台接收点 */}
          <div className="card bg-amber-50 border-l-4 border-amber-500">
            <h2 className="text-xl font-bold mb-4 text-amber-900">后台接收点</h2>
            <div className="space-y-3 text-amber-900">
              <div className="p-3 bg-white rounded-lg border border-amber-200">
                <p className="font-semibold mb-1">✅ 前端"我的订单"页面</p>
                <p className="text-sm">显示所有订单（包括后台推送和客户自己下单的订单）</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-amber-200">
                <p className="font-semibold mb-1">✅ 前端Header订单下拉菜单</p>
                <p className="text-sm">显示最近5个订单，可快速发起代客下单</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-amber-200">
                <p className="font-semibold mb-1">✅ 设计师后台"我的订单"</p>
                <p className="text-sm">设计师可以查看并发起代客下单</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-amber-200">
                <p className="font-semibold mb-1">✅ localStorage: concierge_orders</p>
                <p className="text-sm">存储所有推送的代客下单记录</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
