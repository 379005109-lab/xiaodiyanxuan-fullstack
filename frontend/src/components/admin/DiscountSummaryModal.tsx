import { X, Tag, Percent } from 'lucide-react'
import { Category } from '@/types'

interface DiscountSummaryModalProps {
  categories: Category[]
  onClose: () => void
}

export default function DiscountSummaryModal({ categories, onClose }: DiscountSummaryModalProps) {
  if (!Array.isArray(categories)) {
    return null; // 或者返回一个加载/错误状态
  }
  // 按角色统计折扣信息
  const getRoleDiscountStats = () => {
    const roleStats = new Map<string, {
      roleName: string
      categories: { name: string; discount: number; level: number }[]
      avgDiscount: number
      minDiscount: number
      maxDiscount: number
    }>()

    categories.forEach(category => {
      category.discounts.forEach(discount => {
        if (!roleStats.has(discount.role)) {
          roleStats.set(discount.role, {
            roleName: discount.roleName,
            categories: [],
            avgDiscount: 0,
            minDiscount: 100,
            maxDiscount: 0,
          })
        }

        const stats = roleStats.get(discount.role)!
        stats.categories.push({
          name: category.name,
          discount: discount.discount,
          level: category.level,
        })
      })
    })

    // 计算统计值
    roleStats.forEach((stats, role) => {
      const discounts = stats.categories.map(c => c.discount)
      stats.avgDiscount = Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length)
      stats.minDiscount = Math.min(...discounts)
      stats.maxDiscount = Math.max(...discounts)
    })

    return roleStats
  }

  // 统计有折扣的分类
  const getDiscountedCategories = () => {
    return categories.filter(cat => cat.hasDiscount)
  }

  const roleStats = getRoleDiscountStats()
  const discountedCategories = getDiscountedCategories()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">总折扣信息</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6 space-y-6">
          {/* 概览统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 mb-1">总分类数</p>
                  <p className="text-2xl font-bold text-blue-900">{categories.length}</p>
                </div>
                <Tag className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 mb-1">有折扣分类</p>
                  <p className="text-2xl font-bold text-orange-900">{discountedCategories.length}</p>
                </div>
                <Percent className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 mb-1">角色类型数</p>
                  <p className="text-2xl font-bold text-green-900">{roleStats.size}</p>
                </div>
                <Tag className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>

          {/* 按角色显示折扣 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">各角色折扣统计</h3>
            <div className="space-y-4">
              {Array.from(roleStats.entries()).map(([role, stats]) => (
                <div key={role} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 角色头部 */}
                  <div className="bg-gray-50 p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{stats.roleName}</h4>
                      <p className="text-sm text-gray-600">
                        应用于 {stats.categories.length} 个分类
                      </p>
                    </div>
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">平均折扣：</span>
                        <span className="font-semibold text-blue-600">{stats.avgDiscount}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">最低：</span>
                        <span className="font-semibold text-orange-600">{stats.minDiscount}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">最高：</span>
                        <span className="font-semibold text-green-600">{stats.maxDiscount}%</span>
                      </div>
                    </div>
                  </div>

                  {/* 分类列表 */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stats.categories.map((cat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center">
                            <span className={`text-xs px-2 py-0.5 rounded mr-2 ${
                              cat.level === 1 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {cat.level === 1 ? '一级' : '二级'}
                            </span>
                            <span className="text-sm font-medium">{cat.name}</span>
                          </div>
                          <span className={`text-sm font-bold ${
                            cat.discount < 100 ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            {cat.discount}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 有折扣的分类汇总 */}
          {discountedCategories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">
                有折扣的分类明细
                <span className="text-sm text-gray-600 ml-2">
                  （共 {discountedCategories.length} 个）
                </span>
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">分类名称</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">层级</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">折扣详情</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {discountedCategories.map(category => (
                      <tr key={category._id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium">{category.name}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`text-xs px-2 py-1 rounded ${
                            category.level === 1 ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {category.level === 1 ? '一级' : '二级'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-2">
                            {category.discounts
                              .filter(d => d.discount < 100)
                              .map((discount, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded"
                                >
                                  {discount.roleName}: {discount.discount}%
                                </span>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="border-t p-4 flex justify-end">
          <button
            onClick={onClose}
            className="btn-primary px-6 py-2"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}

