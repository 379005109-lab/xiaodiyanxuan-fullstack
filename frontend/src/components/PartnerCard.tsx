import { useState } from 'react'
import { CheckCircle } from 'lucide-react'

interface PartnerCardProps {
  partnerId: string
  partnerName: string
  partnerLogo?: string
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
  onViewProducts: () => void
  onViewTierSystem: () => void
  onClose?: () => void
}

export default function PartnerCard({
  partnerId,
  partnerName,
  partnerLogo,
  status,
  productCount,
  grantedAuth,
  receivedAuth,
  onViewProducts,
  onViewTierSystem,
  onClose
}: PartnerCardProps) {
  const [mode, setMode] = useState<'granted' | 'received'>(grantedAuth ? 'granted' : 'received')
  
  const currentAuth = mode === 'granted' ? grantedAuth : receivedAuth
  const hasGranted = !!grantedAuth
  const hasReceived = !!receivedAuth

  return (
    <div className="bg-white border-2 border-emerald-400 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all">
      {/* 状态标签 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
            {status === 'active' ? '启用中' : '已停用'}
          </span>
          {productCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              已合作 {productCount} 件商品
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
          >
            关闭
          </button>
        )}
      </div>

      {/* 合作商信息 */}
      <div className="flex items-center gap-4 mb-6">
        {partnerLogo ? (
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-gray-100">
            <img src={partnerLogo} alt={partnerName} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
            {partnerName.substring(0, 2)}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900">{partnerName}</h3>
          <p className="text-sm text-gray-400 font-mono">{partnerId}</p>
        </div>
      </div>

      {/* 授权模式切换 */}
      {hasGranted && hasReceived && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('granted')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'granted'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            授权模式
          </button>
          <button
            onClick={() => setMode('received')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
              mode === 'received'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            被授权模式
          </button>
        </div>
      )}

      {/* 折扣和返佣显示 */}
      {currentAuth && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <div className="text-xs text-emerald-700 mb-1">授权折扣(%)</div>
            <div className="text-3xl font-bold text-emerald-600">{currentAuth.minDiscountRate || 0}</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-xs text-blue-700 mb-1">授权返佣(%)</div>
            <div className="text-3xl font-bold text-blue-600">{currentAuth.commissionRate || 0}</div>
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={onViewProducts}
          className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
        >
          查看授权商品
        </button>
        {hasGranted && (
          <button
            onClick={onViewTierSystem}
            className="px-6 py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-xl font-medium hover:bg-emerald-50 transition-colors"
          >
            分成体系
          </button>
        )}
      </div>
    </div>
  )
}
