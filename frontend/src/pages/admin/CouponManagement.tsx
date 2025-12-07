import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Tag, Clock, Gift } from 'lucide-react'
import { toast } from 'sonner'
import { getAdminCoupons, createCoupon, updateCoupon, deleteCoupon, Coupon, CouponCreateData } from '@/services/couponService'
import { formatPrice } from '@/lib/utils'

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [formData, setFormData] = useState<CouponCreateData>({
    code: '',
    type: 'fixed',
    value: 0,
    minAmount: 0,
    description: '',
    validFrom: '',
    validTo: '',
    usageLimit: 1,
    status: 'active'
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const res = await getAdminCoupons({ pageSize: 100 })
      setCoupons(res.data || [])
    } catch (error) {
      console.error('加载优惠券失败:', error)
      toast.error('加载优惠券失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingCoupon(null)
    const now = new Date()
    const endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    setFormData({
      code: '',
      type: 'fixed',
      value: 100,
      minAmount: 0,
      description: '',
      validFrom: now.toISOString().slice(0, 16),
      validTo: endDate.toISOString().slice(0, 16),
      usageLimit: 100,
      status: 'active'
    })
    setShowModal(true)
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minAmount: coupon.minAmount,
      description: coupon.description || '',
      validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
      validTo: new Date(coupon.validTo).toISOString().slice(0, 16),
      usageLimit: coupon.usageLimit,
      status: coupon.status
    })
    setShowModal(true)
  }

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`确定要删除优惠券"${coupon.code}"吗？`)) return
    try {
      await deleteCoupon(coupon._id)
      toast.success('删除成功')
      loadCoupons()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon._id, formData)
        toast.success('更新成功')
      } else {
        await createCoupon(formData)
        toast.success('创建成功')
      }
      setShowModal(false)
      loadCoupons()
    } catch (error: any) {
      console.error('保存失败:', error)
      toast.error(error.response?.data?.message || '保存失败')
    }
  }

  const getStatusBadge = (coupon: Coupon) => {
    const now = new Date()
    const validFrom = new Date(coupon.validFrom)
    const validTo = new Date(coupon.validTo)
    
    if (coupon.status === 'inactive') {
      return <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">已停用</span>
    }
    if (now < validFrom) {
      return <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-600">未开始</span>
    }
    if (now > validTo) {
      return <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-600">已过期</span>
    }
    if (coupon.usageCount >= coupon.usageLimit) {
      return <span className="px-2 py-1 text-xs rounded bg-orange-100 text-orange-600">已用完</span>
    }
    return <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-600">进行中</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">优惠券管理</h1>
          <p className="text-gray-600 mt-1">管理系统优惠券，包括陪买服务核销券</p>
        </div>
        <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新建优惠券
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Tag className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">{coupons.length}</div>
              <div className="text-sm text-gray-500">全部优惠券</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {coupons.filter(c => {
                  const now = new Date()
                  return c.status === 'active' && new Date(c.validFrom) <= now && new Date(c.validTo) >= now && c.usageCount < c.usageLimit
                }).length}
              </div>
              <div className="text-sm text-gray-500">进行中</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center">
              <Gift className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {coupons.filter(c => c.code.startsWith('PM')).length}
              </div>
              <div className="text-sm text-gray-500">陪买服务券</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Tag className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {coupons.reduce((sum, c) => sum + c.usageCount, 0)}
              </div>
              <div className="text-sm text-gray-500">总使用次数</div>
            </div>
          </div>
        </div>
      </div>

      {/* 优惠券列表 */}
      <div className="card">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">优惠券码</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">类型</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">优惠</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">使用门槛</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">有效期</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">使用情况</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">状态</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">加载中...</td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">暂无优惠券</td>
              </tr>
            ) : (
              coupons.map(coupon => (
                <tr key={coupon._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-mono font-semibold text-primary-600">{coupon.code}</div>
                    {coupon.description && (
                      <div className="text-xs text-gray-500 mt-1">{coupon.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded ${coupon.type === 'fixed' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                      {coupon.type === 'fixed' ? '满减券' : '折扣券'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-lg font-bold text-red-600">
                      {coupon.type === 'fixed' ? `¥${coupon.value}` : `${coupon.value}折`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {coupon.minAmount > 0 ? `满${formatPrice(coupon.minAmount)}可用` : '无门槛'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div>{new Date(coupon.validFrom).toLocaleDateString()}</div>
                    <div className="text-gray-400">至 {new Date(coupon.validTo).toLocaleDateString()}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary-500 rounded-full" 
                          style={{ width: `${Math.min(100, (coupon.usageCount / coupon.usageLimit) * 100)}%` }}
                        />
                      </div>
                      <span className="text-sm">{coupon.usageCount}/{coupon.usageLimit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(coupon)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(coupon)} className="p-1.5 hover:bg-gray-100 rounded">
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button onClick={() => handleDelete(coupon)} className="p-1.5 hover:bg-red-50 rounded">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 创建/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">{editingCoupon ? '编辑优惠券' : '新建优惠券'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">优惠券码</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    placeholder="留空自动生成"
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">类型</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as 'fixed' | 'percent' })}
                    className="input"
                  >
                    <option value="fixed">满减券</option>
                    <option value="percent">折扣券</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    {formData.type === 'fixed' ? '减免金额 (元)' : '折扣 (如8折填80)'}
                  </label>
                  <input
                    type="number"
                    value={formData.value}
                    onChange={e => setFormData({ ...formData, value: Number(e.target.value) })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">最低消费 (元)</label>
                  <input
                    type="number"
                    value={formData.minAmount}
                    onChange={e => setFormData({ ...formData, minAmount: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">描述</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="如：陪买服务专享券 - 满5000减1000"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">开始时间</label>
                  <input
                    type="datetime-local"
                    value={formData.validFrom}
                    onChange={e => setFormData({ ...formData, validFrom: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">结束时间</label>
                  <input
                    type="datetime-local"
                    value={formData.validTo}
                    onChange={e => setFormData({ ...formData, validTo: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">发放数量</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={e => setFormData({ ...formData, usageLimit: Number(e.target.value) })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">状态</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="input"
                  >
                    <option value="active">启用</option>
                    <option value="inactive">停用</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  {editingCoupon ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
