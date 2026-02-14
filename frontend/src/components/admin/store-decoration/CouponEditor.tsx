import { useState, useEffect } from 'react'
import { Plus, Trash2, Tag, Gift } from 'lucide-react'
import { CouponConfig, CouponItem, ComponentStyle } from '@/services/storeDecorationService'
import { getAdminCoupons, Coupon } from '@/services/couponService'
import EditorTabs from './EditorTabs'
import StyleEditor from './StyleEditor'

interface CouponEditorProps {
  config: CouponConfig
  onChange: (config: CouponConfig) => void
  style: ComponentStyle
  onStyleChange: (style: ComponentStyle) => void
}

export default function CouponEditor({ config, onChange, style, onStyleChange }: CouponEditorProps) {
  const value = config.items
  const onItemsChange = (items: CouponItem[]) => onChange({ ...config, items })
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadCoupons = async () => {
    if (availableCoupons.length > 0) return
    setLoading(true)
    try {
      const res = await getAdminCoupons({ pageSize: 100 })
      setAvailableCoupons(res.data || [])
    } catch (err) {
      console.error('加载优惠券失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenPicker = () => {
    loadCoupons()
    setShowPicker(true)
  }

  const handleSelect = (coupon: Coupon) => {
    // 避免重复添加
    if (value.some(c => c.couponId === coupon._id)) return
    onItemsChange([
      ...value,
      {
        couponId: coupon._id,
        amount: coupon.value,
        threshold: coupon.minAmount
      }
    ])
    setShowPicker(false)
  }

  const handleRemove = (index: number) => {
    const next = [...value]
    next.splice(index, 1)
    onItemsChange(next)
  }

  // 获取优惠券显示名称
  const getCouponDisplay = (item: CouponItem) => {
    if (item.coupon) {
      return item.coupon.type === 'fixed'
        ? `满${item.coupon.minAmount}减${item.coupon.value}`
        : `${item.coupon.value}折券`
    }
    return item.threshold > 0
      ? `满${item.threshold}减${item.amount}`
      : `¥${item.amount}`
  }

  return (
    <EditorTabs
      title={`优惠券 (${value.length} 张)`}
      icon={<Tag className="h-4 w-4" />}
      contentPanel={
        <div className="space-y-4">
      {value.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
          暂未配置优惠券
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-red-500" />
                </div>
                <div>
                  <div className="text-sm font-medium">{getCouponDisplay(item)}</div>
                  <div className="text-xs text-gray-400">ID: {item.couponId?.toString().slice(-6) || '-'}</div>
                </div>
              </div>
              <button
                onClick={() => handleRemove(index)}
                className="p-1.5 hover:bg-red-50 rounded text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < 5 && (
        <button
          onClick={handleOpenPicker}
          className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-1"
        >
          <Plus className="h-4 w-4" />
          添加优惠券
        </button>
      )}

      {/* 优惠券选择弹窗 */}
      {showPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPicker(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[70vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">选择优惠券</h2>
            {loading ? (
              <div className="py-8 text-center text-gray-500">加载中...</div>
            ) : availableCoupons.length === 0 ? (
              <div className="py-8 text-center text-gray-500">暂无可用优惠券</div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-2">
                {availableCoupons.map(coupon => {
                  const isSelected = value.some(c => c.couponId === coupon._id)
                  return (
                    <button
                      key={coupon._id}
                      disabled={isSelected}
                      onClick={() => handleSelect(coupon)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${
                        isSelected
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-stone-200 hover:border-primary hover:bg-primary-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">
                            {coupon.type === 'fixed' ? `满${coupon.minAmount}减${coupon.value}` : `${coupon.value}折`}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{coupon.code}</div>
                        </div>
                        {isSelected && (
                          <span className="text-xs text-gray-400">已添加</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="flex justify-end mt-4 pt-4 border-t">
              <button onClick={() => setShowPicker(false)} className="btn-secondary text-sm px-4 py-2">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      }
      stylePanel={<StyleEditor style={style} onChange={onStyleChange} />}
    />
  )
}
