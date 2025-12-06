import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { X, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Category, UserRole } from '@/types'
import { setCategoryDiscount, setAllCategoriesDiscount, getAllCategories } from '@/services/categoryService'

interface DiscountModalProps {
  category: Category | null
  onClose: () => void
  isBatch?: boolean
  onSuccess?: () => void
}

// 角色选项
const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'designer', label: '设计师' },
  { value: 'distributor', label: '经销商' },
  { value: 'customer', label: '普通客户' },
  { value: 'admin', label: '管理员' },
  { value: 'super_admin', label: '超级管理员' },
]

export default function DiscountModal({ category, onClose, isBatch = false, onSuccess }: DiscountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [discounts, setDiscounts] = useState(
    category?.discounts || [
      { role: 'designer' as UserRole, roleName: '设计师', discount: 100 },
      { role: 'distributor' as UserRole, roleName: '经销商', discount: 100 },
      { role: 'customer' as UserRole, roleName: '普通客户', discount: 100 },
    ]
  )

  useEffect(() => {
    if (isBatch) {
      const fetchCurrentDiscounts = async () => {
        setIsLoading(true);
        try {
          const allCategories = await getAllCategories();
          // 查找第一个有折扣设置的分类
          const categoryWithDiscount = allCategories.find(cat => cat.discounts && cat.discounts.length > 0);
          if (categoryWithDiscount && categoryWithDiscount.discounts.length > 0) {
            setDiscounts(categoryWithDiscount.discounts);
          } else {
            // 默认折扣设置
            setDiscounts([
              { role: 'designer' as UserRole, roleName: '设计师', discount: 100 },
              { role: 'distributor' as UserRole, roleName: '经销商', discount: 100 },
              { role: 'customer' as UserRole, roleName: '普通客户', discount: 100 },
            ]);
          }
        } catch (error) {
          console.error('获取当前折扣设置失败:', error);
          toast.error('无法加载当前折扣设置');
        } finally {
          setIsLoading(false);
        }
      };
      fetchCurrentDiscounts();
    }
  }, [isBatch]);

  const handleAddDiscount = () => {
    // 找到未使用的角色
    const usedRoles = discounts.map(d => d.role)
    const availableRole = roleOptions.find(r => !usedRoles.includes(r.value))
    
    if (!availableRole) {
      toast.error('所有角色已添加')
      return
    }

    setDiscounts([
      ...discounts, 
      { role: availableRole.value, roleName: availableRole.label, discount: 100 }
    ])
  }

  const handleRemoveDiscount = (index: number) => {
    if (discounts.length <= 1) {
      toast.error('至少保留一个角色折扣设置')
      return
    }
    setDiscounts(discounts.filter((_, i) => i !== index))
  }

  const handleDiscountChange = (index: number, field: 'role' | 'discount', value: string | number) => {
    const updated = [...discounts]
    
    if (field === 'role') {
      const selectedRole = roleOptions.find(r => r.value === value)
      if (selectedRole) {
        updated[index] = {
          ...updated[index],
          role: selectedRole.value,
          roleName: selectedRole.label
        }
      }
    } else {
      updated[index] = {
        ...updated[index],
        [field]: Number(value)
      }
    }
    
    setDiscounts(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证：检查是否有重复角色
    const roles = discounts.map(d => d.role)
    const hasDuplicate = roles.length !== new Set(roles).size
    if (hasDuplicate) {
      toast.error('不能为同一角色设置多次折扣')
      return
    }

    const hasInvalidDiscount = discounts.some(d => d.discount < 0 || d.discount > 100)
    if (hasInvalidDiscount) {
      toast.error('折扣必须在0-100之间')
      return
    }

    try {
      if (isBatch) {
        // 批量设置所有分类
        await setAllCategoriesDiscount(discounts)
        toast.success('已为所有分类设置折扣')
      } else if (category) {
        // 单个分类设置
        await setCategoryDiscount(category._id, discounts)
        toast.success('折扣设置已更新')
      }
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (error: any) {
      toast.error(error.message || '操作失败')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            {isBatch ? '设置全部分类折扣' : `设置折扣 - ${category?.name}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                为不同角色设置折扣比例（100表示原价，70表示7折）
              </p>
              <button
                type="button"
                onClick={handleAddDiscount}
                className="btn-secondary flex items-center text-sm px-3 py-1.5"
              >
                <Plus className="h-4 w-4 mr-1" />
                添加角色
              </button>
            </div>

            {/* 折扣列表 */}
            <div className="space-y-3 min-h-[200px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">正在加载当前设置...</span>
                </div>
              ) : (
                discounts.map((discount, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        角色类型
                      </label>
                      <select
                        value={discount.role}
                        onChange={(e) => handleDiscountChange(index, 'role', e.target.value)}
                        className="input w-full"
                        required
                      >
                        {roleOptions.map(option => (
                          <option 
                            key={option.value} 
                            value={option.value}
                            disabled={discounts.some((d, i) => i !== index && d.role === option.value)}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="w-40">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        折扣（%）
                      </label>
                      <input
                        type="number"
                        value={discount.discount}
                        onChange={(e) => handleDiscountChange(index, 'discount', parseInt(e.target.value) || 0)}
                        placeholder="100"
                        className="input w-full"
                        min="0"
                        max="100"
                        required
                      />
                    </div>
                    <div className="flex items-end pb-1">
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscount(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        disabled={discounts.length <= 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 说明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800 mb-2 font-medium">💡 折扣说明：</p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 100% = 原价（不打折）</li>
              <li>• 90% = 9折</li>
              <li>• 80% = 8折</li>
              <li>• 70% = 7折</li>
              <li>• 50% = 5折（半价）</li>
              <li>• 不同角色可以设置不同的折扣比例</li>
            </ul>
          </div>

          {/* 按钮 */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-2"
            >
              取消
            </button>
            <button
              type="submit"
              className="btn-primary px-6 py-2"
            >
              保存设置
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
