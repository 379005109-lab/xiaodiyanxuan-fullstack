import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

interface PartnerCardProps {
  partnerId: string
  partnerName: string
  partnerLogo?: string
  partnerType?: 'manufacturer' | 'designer'
  status: 'active' | 'inactive'
  productCount: number
  grantedAuth?: {
    minDiscountRate: number
    commissionRate: number
  }
  receivedAuth?: {
    minDiscountRate: number
    commissionRate: number
  }
  validFrom?: string
  validUntil?: string
  scope?: string
  onViewProducts: () => void
  onViewTierSystem: () => void
  onToggleStatus?: () => void
  onClose?: () => void
}

export default function PartnerCard({
  partnerId,
  partnerName,
  partnerLogo,
  partnerType = 'manufacturer',
  status,
  productCount,
  grantedAuth,
  receivedAuth,
  validFrom,
  validUntil,
  scope,
  onViewProducts,
  onViewTierSystem,
  onToggleStatus,
  onClose
}: PartnerCardProps) {
  const [mode, setMode] = useState<'granted' | 'received'>(grantedAuth ? 'granted' : 'received')
  const [isEnabled, setIsEnabled] = useState(status === 'active')
  
  const currentAuth = mode === 'granted' ? grantedAuth : receivedAuth
  const hasGranted = !!grantedAuth
  const hasReceived = !!receivedAuth

  const handleToggle = () => {
    setIsEnabled(!isEnabled)
    onToggleStatus?.()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
      {/* 顶部：启用开关 + 按钮 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {/* Toggle Switch */}
          <button
            onClick={handleToggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isEnabled ? 'bg-emerald-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                isEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium ${isEnabled ? 'text-emerald-600' : 'text-gray-500'}`}>
            {isEnabled ? '启用中' : '已停用'}
          </span>
        </div>
        {productCount > 0 && (
          <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-lg flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            已合作 · {productCount}件商品
          </span>
        )}
      </div>

      {/* 合作商类型标签 */}
      <div className="text-xs text-gray-400 mb-1">
        {partnerType === 'manufacturer' ? '工厂门户' : '设计师'}
      </div>

      {/* 合作商名称 */}
      <h3 className="text-2xl font-bold text-gray-900 mb-1">{partnerName}</h3>
      
      {/* ID号 */}
      <p className="text-sm text-emerald-500 font-mono mb-4">{partnerId}</p>

      {/* 合作时间段 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-3">
        <div className="text-xs text-gray-500 mb-1">合作期限</div>
        <div className="text-sm font-medium text-gray-900">
          {validFrom ? new Date(validFrom).toLocaleDateString() : '--'}
          {' ~ '}
          {validUntil ? new Date(validUntil).toLocaleDateString() : '永久'}
        </div>
      </div>

      {/* 授权协议 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4">
        <div className="text-xs text-gray-500 mb-1">授权协议</div>
        <div className="text-sm font-medium text-gray-900">
          {scope === 'all' ? '全部商品授权' : scope === 'category' ? '分类授权' : scope === 'specific' ? '指定商品授权' : scope === 'mixed' ? '混合授权' : '未设置'}
          {productCount > 0 ? ` · ${productCount}件` : ''}
        </div>
      </div>

      {/* 折扣和返佣显示 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500 mb-2">最低折扣(%)</div>
          <div className="text-3xl font-bold text-gray-900">{currentAuth?.minDiscountRate || 0}</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500 mb-2">返佣比例(%)</div>
          <div className="text-3xl font-bold text-gray-900">{currentAuth?.commissionRate || 0}</div>
        </div>
      </div>

      {/* 经营授权按钮 */}
      <button
        onClick={onViewProducts}
        className="w-full py-3.5 bg-[#153e35] text-white rounded-xl font-medium hover:bg-[#1a4d42] transition-colors mb-4"
      >
        经营授权
      </button>

      {/* 底部按钮：分成体系 + 下架停运 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onViewTierSystem}
          className="py-3 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          分成体系
        </button>
        {onClose ? (
          <button
            onClick={onClose}
            className="py-3 bg-white border border-gray-300 text-gray-500 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            关闭
          </button>
        ) : (
          <button
            className="py-3 bg-white border border-gray-300 text-emerald-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            下架停运
          </button>
        )}
      </div>
    </div>
  )
}
