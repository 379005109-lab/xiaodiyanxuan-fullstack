import { useRef, useState, useEffect, useCallback } from 'react'
import {
  ComponentItem,
  ComponentStyle,
  BannerConfig,
  SearchBoxConfig,
  ImageCubeConfig,
  CouponConfig,
  ProductListConfig,
  TitleConfig,
  SpacerConfig,
  RichTextConfig,
  StoreHeaderConfig,
  VideoConfig,
  ArticleListConfig,
  MenuNavConfig,
  SeckillConfig,
  GroupBuyConfig,
  BargainConfig,
  ComponentType,
} from '@/services/storeDecorationService'
import { getFileUrl } from '@/services/uploadService'
import { Wifi, Battery, Signal, Gift, ChevronUp, ChevronDown, Copy, Trash2, ChevronLeft, Search } from 'lucide-react'

const COMPONENT_LABEL: Record<ComponentType, string> = {
  storeHeader: '店铺头部',
  banner: '轮播图',
  searchBox: '搜索框',
  imageCube: '图片魔方',
  productList: '商品列表',
  coupon: '优惠券',
  title: '标题',
  spacer: '辅助空白',
  richText: '富文本',
  navBar: '导航',
  video: '视频',
  articleList: '文章列表',
  menuNav: '导航组',
  seckill: '秒杀',
  groupBuy: '拼团',
  bargain: '砍价',
}

interface MobilePreviewProps {
  components: ComponentItem[]
  selectedId: string | null
  bgColor?: string
  bgImage?: string
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onCopy: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export default function MobilePreview({
  components,
  selectedId,
  bgColor = '#ffffff',
  bgImage,
  onSelect,
  onDelete,
  onCopy,
  onMoveUp,
  onMoveDown,
}: MobilePreviewProps) {

  const renderStoreHeader = (cfg: StoreHeaderConfig) => (
    <div className="bg-white">
      {/* 主信息区 */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {/* Logo */}
          {cfg.logo ? (
            <img src={getFileUrl(cfg.logo)} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-orange-200 flex-shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center flex-shrink-0">
              <span className="text-primary font-bold text-base">{cfg.name?.charAt(0) || 'S'}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* 店铺名 + 认证 */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm truncate">{cfg.name || '店铺名称'}</span>
              {cfg.isVerified && (
                <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-600 text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 border border-green-200">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor"><path d="M6 0a6 6 0 110 12A6 6 0 016 0zm2.65 4.15a.5.5 0 00-.7-.7L5.5 5.9 4.05 4.45a.5.5 0 10-.7.7l1.8 1.8a.5.5 0 00.7 0l2.8-2.8z"/></svg>
                  已认证
                </span>
              )}
            </div>
            {/* 联系人 + 电话 */}
            {(cfg.contactName || cfg.phone) && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-500">
                {cfg.contactName && <span>联系人：{cfg.contactName}</span>}
                {cfg.contactName && cfg.phone && <span>·</span>}
                {cfg.phone && (
                  <span className="flex items-center gap-0.5">
                    {cfg.phone}
                    <svg className="w-2.5 h-2.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  </span>
                )}
              </div>
            )}
            {/* 地址 */}
            {cfg.address && (
              <div className="flex items-start gap-0.5 mt-1 text-[10px] text-gray-400">
                <svg className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span className="truncate">{cfg.address}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* 底部操作栏 */}
      <div className="flex border-t border-gray-100">
        <button className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] text-gray-600 hover:bg-gray-50">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          店铺信息
        </button>
        <div className="w-px bg-gray-100" />
        <button className="flex-1 flex items-center justify-center gap-1 py-2.5 text-[11px] text-gray-600 hover:bg-gray-50">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          店铺海报
        </button>
      </div>
    </div>
  )

  const renderBanner = (cfg: BannerConfig) => {
    const active = (cfg.items || []).filter(b => b.status)
    return (
      <div className="relative">
        {active[0]?.image ? (
          <img src={getFileUrl(active[0].image)} alt="" className="w-full aspect-[9/16] object-cover" />
        ) : (
          <div className="w-full aspect-[9/16] bg-gradient-to-r from-primary-100 to-primary-50 flex items-center justify-center">
            <span className="text-primary-300 text-sm">轮播图</span>
          </div>
        )}
        {active.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {active.map((_, i) => (
              <div key={i} className={`h-1 rounded-full ${i === 0 ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderSearchBox = (cfg: SearchBoxConfig) => (
    <div className="px-3 py-2">
      <div
        className="flex items-center gap-2 px-3 py-2 text-gray-400 text-sm"
        style={{ borderRadius: cfg.borderRadius, backgroundColor: cfg.bgColor }}
      >
        <Search className="h-4 w-4" />
        <span>{cfg.placeholder || '搜索商品'}</span>
      </div>
    </div>
  )

  const renderImageCube = (cfg: ImageCubeConfig) => (
    <div className="px-3 py-2">
      {cfg.images.length > 0 ? (
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cfg.columns}, 1fr)` }}>
          {cfg.images.map((img, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              {img.url ? (
                <img src={getFileUrl(img.url)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">图片</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[80px] bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
          图片魔方 - 请添加图片
        </div>
      )}
    </div>
  )

  const renderCoupon = (cfg: CouponConfig) => (
    <div className="px-3 py-2">
      {cfg.items.length > 0 ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {cfg.items.map((coupon, i) => (
            <div key={i} className="flex-shrink-0 w-[130px] bg-gradient-to-r from-red-500 to-red-400 text-white rounded-lg p-2 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-8 h-8 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="text-base font-bold">¥{coupon.amount}</div>
              <div className="text-[9px] opacity-80">{coupon.threshold > 0 ? `满${coupon.threshold}可用` : '无门槛'}</div>
              <div className="mt-1 bg-white/20 text-[9px] text-center py-0.5 rounded-full">立即领取</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="h-[60px] bg-red-50 rounded-lg flex items-center justify-center text-red-300 text-xs">
          优惠券 - 请添加
        </div>
      )}
    </div>
  )

  const renderProductList = (cfg: ProductListConfig) => {
    const showName = cfg.showName !== false
    const showPrice = cfg.showPrice !== false
    const showSales = cfg.showSales !== false
    const products = (cfg.products?.length || 0) > 0 ? cfg.products!.slice(0, cfg.limit) : null

    const renderCard = (p: any, i: number) => {
      const img = p.thumbnail || p.images?.[0] || ''
      if (cfg.displayMode === 'list') {
        return (
          <div key={i} className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
              {img ? <img src={getFileUrl(img)} alt="" className="w-full h-full object-cover rounded" /> : <div className="w-full h-full bg-gray-200 rounded" />}
            </div>
            <div className="flex-1 min-w-0 py-1">
              {showName && <div className="text-xs truncate">{p.name || '商品名称'}</div>}
              {showPrice && <div className="text-red-500 text-xs font-bold mt-1">¥{p.basePrice || p.price || 0}</div>}
              {showSales && <div className="text-[10px] text-gray-400 mt-0.5">已售 {p.sales || 999} 件</div>}
            </div>
          </div>
        )
      }
      if (cfg.displayMode === 'scroll') {
        return (
          <div key={i} className="flex-shrink-0 w-[110px] bg-white rounded-lg overflow-hidden shadow-sm">
            <div className="w-full h-[110px] bg-gray-100">
              {img ? <img src={getFileUrl(img)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
            </div>
            <div className="p-1.5">
              {showName && <div className="text-[10px] truncate">{p.name || '商品名称'}</div>}
              {showPrice && <div className="text-red-500 text-[10px] font-bold mt-0.5">¥{p.basePrice || p.price || 0}</div>}
              {showSales && <div className="text-[9px] text-gray-400 mt-0.5">已售 {p.sales || 999} 件</div>}
            </div>
          </div>
        )
      }
      // grid
      return (
        <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
          <div className="aspect-square bg-gray-100">
            {img ? <img src={getFileUrl(img)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
          </div>
          <div className="p-2">
            {showName && <div className="text-xs truncate">{p.name || '商品名称'}</div>}
            {showPrice && <div className="text-red-500 text-xs font-bold mt-1">¥{p.basePrice || p.price || 0}</div>}
            {showSales && <div className="text-[10px] text-gray-400 mt-0.5">已售 {p.sales || 999} 件</div>}
          </div>
        </div>
      )
    }

    const mockProducts = [
      { name: '商品名称', price: 199, sales: 999 },
      { name: '商品名称', price: 199, sales: 999 },
    ]
    const items = products || mockProducts

    return (
      <div className="px-3 py-2">
        {cfg.displayMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {items.map((p, i) => renderCard(p, i))}
          </div>
        ) : cfg.displayMode === 'list' ? (
          <div className="space-y-2">
            {items.map((p, i) => renderCard(p, i))}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {items.map((p, i) => renderCard(p, i))}
          </div>
        )}
      </div>
    )
  }

  const renderTitle = (cfg: TitleConfig) => (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between">
        {/* 左侧：标题 + 副标题 */}
        <div style={{ textAlign: cfg.align, flex: 1 }}>
          <div style={{
            fontSize: cfg.fontSize,
            color: cfg.color,
            fontWeight: cfg.bold ? 'bold' : 'normal',
            fontStyle: cfg.fontStyle === 'italic' ? 'italic' : 'normal',
          }}>
            {cfg.text || '标题'}
          </div>
          {cfg.subtitle && (
            <div style={{
              fontSize: cfg.subtitleFontSize || 14,
              color: cfg.subtitleColor || '#999',
              marginTop: 2,
            }}>
              {cfg.subtitle}
            </div>
          )}
        </div>
        {/* 右侧按钮 */}
        {cfg.showRight !== false && cfg.rightText && (
          <div className="flex items-center gap-0.5 flex-shrink-0" style={{
            fontSize: cfg.rightFontSize || 12,
            color: cfg.rightColor || '#999',
          }}>
            <span>{cfg.rightText}</span>
            <ChevronLeft className="h-3 w-3 rotate-180" />
          </div>
        )}
      </div>
    </div>
  )

  const renderSpacer = (cfg: SpacerConfig) => (
    <div style={{ height: cfg.height, backgroundColor: cfg.bgColor }} />
  )

  const renderRichText = (cfg: RichTextConfig) => (
    <div className="px-3 py-2">
      {cfg.content ? (
        <div className="text-sm prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: cfg.content }} />
      ) : (
        <div className="text-gray-400 text-xs text-center py-4">富文本内容</div>
      )}
    </div>
  )

  const renderVideo = (cfg: VideoConfig) => (
    <div className="px-3 py-2">
      <div className="relative rounded-lg overflow-hidden bg-black">
        {cfg.cover ? (
          <img src={getFileUrl(cfg.cover)} alt="" className="w-full h-[160px] object-cover" />
        ) : (
          <div className="w-full h-[160px] bg-gray-800 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <div className="w-0 h-0 border-l-[16px] border-l-white border-y-[10px] border-y-transparent ml-1" />
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const renderArticleList = (cfg: ArticleListConfig) => (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">文章列表</span>
        <span className="text-[10px] text-gray-400">更多</span>
      </div>
      {cfg.displayMode === 'list' ? (
        <div className="space-y-2">
          {Array.from({ length: Math.min(cfg.count, 3) }).map((_, i) => (
            <div key={i} className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 flex items-center justify-center text-gray-300 text-xs">图</div>
              <div className="flex-1 min-w-0 py-1">
                <div className="text-xs text-gray-600">文章标题示例</div>
                <div className="text-[10px] text-gray-400 mt-1">文章摘要内容...</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: Math.min(cfg.count, 4) }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="h-20 bg-gray-100 flex items-center justify-center text-gray-300 text-xs">图</div>
              <div className="p-2"><div className="text-xs text-gray-600 truncate">文章标题</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderMenuNav = (cfg: MenuNavConfig) => (
    <div className="px-3 py-3 bg-white">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cfg.columns}, 1fr)` }}>
        {cfg.items.map((item, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 bg-gray-100 flex items-center justify-center overflow-hidden ${cfg.shape === 'round' ? 'rounded-full' : 'rounded-lg'}`}>
              {item.image ? (
                <img src={getFileUrl(item.image)} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-300 text-[10px]">图标</span>
              )}
            </div>
            <span className="text-[10px] text-gray-600 truncate max-w-[56px]">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderActivityBlock = (title: string, bgColor: string) => (
    <div className="px-3 py-2">
      <div className="rounded-lg overflow-hidden" style={{ backgroundColor: bgColor }}>
        <div className="px-3 py-2 flex items-center justify-between">
          <span className="text-white text-sm font-bold">{title}</span>
          <span className="text-white/70 text-[10px] flex items-center">GO <ChevronLeft className="h-3 w-3 rotate-180" /></span>
        </div>
        <div className="flex gap-2 px-3 pb-3 overflow-x-auto scrollbar-hide">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex-shrink-0 w-[90px] bg-white rounded-lg overflow-hidden">
              <div className="w-full h-[90px] bg-gray-100 flex items-center justify-center text-gray-300 text-xs">商品图</div>
              <div className="p-1.5">
                <div className="text-[10px] text-gray-500 truncate">商品名称</div>
                <div className="text-red-500 text-[10px] font-bold">¥0.00</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderSeckill = (cfg: SeckillConfig) => renderActivityBlock(cfg.title || '限时秒杀', cfg.bgColor)
  const renderGroupBuy = (cfg: GroupBuyConfig) => renderActivityBlock(cfg.title || '拼团活动', cfg.bgColor)
  const renderBargain = (cfg: BargainConfig) => {
    const layout = cfg.layoutStyle ?? 0

    const mockProducts = [
      { _id: 'm1', name: '北欧简约布艺沙发三人位', targetPrice: 99, originalPrice: 199, coverImage: '' },
      { _id: 'm2', name: '实木餐桌椅组合现代简约', targetPrice: 59, originalPrice: 129, coverImage: '' },
      { _id: 'm3', name: '轻奢真皮办公椅电脑椅', targetPrice: 39, originalPrice: 89, coverImage: '' },
    ]

    // 优先使用已选砍价商品，无数据时 fallback 到 mock
    const displayProducts = (cfg.products && cfg.products.length > 0) ? cfg.products : mockProducts
    const hasRealProducts = cfg.products && cfg.products.length > 0

    const renderProductImage = (heightClass: string, imgUrl?: string) => (
      <div className={`relative ${heightClass} rounded-2xl overflow-hidden ${imgUrl ? 'bg-gray-100' : 'bg-gray-800'}`}>
        {imgUrl ? (
          <img src={imgUrl.startsWith('http') ? imgUrl : getFileUrl(imgUrl)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-900" />
        )}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gray-100/90 backdrop-blur-sm border border-gray-200/60">
          <svg className="w-2.5 h-2.5 text-gray-500" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="M8 4v4.5l3 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          <span className="text-[8px] text-gray-600 font-mono">00:00:00</span>
        </div>
      </div>
    )

    const progressValues = [68, 72, 55]

    const renderProgressBar = (progress: number) => (
      <div className="flex items-center gap-1.5 mt-1">
        <div className="flex-1 h-[3px] bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gray-800 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[9px] text-gray-400 font-medium flex-shrink-0">{progress}%</span>
      </div>
    )

    const renderPriceRow = (p: any) => (
      <div className="flex items-baseline gap-1.5 mt-0.5">
        {cfg.showPrice !== false && <span className="text-sm font-bold text-gray-900">¥{p.targetPrice}</span>}
        {cfg.showOriginalPrice !== false && <span className="text-[10px] line-through" style={{ color: cfg.originalPriceColor || '#999' }}>¥{p.originalPrice}</span>}
      </div>
    )

    const renderProductCard = (p: any, i: number, isHorizontal: boolean) => (
      <div key={p._id || i} className={`flex-shrink-0 overflow-hidden ${isHorizontal ? 'w-[140px]' : ''}`}
        style={{ backgroundColor: cfg.contentBgColor || '#fff' }}>
        {layout === 1 ? (
          // 列表布局：左图右文
          <div className="flex gap-2 p-2">
            <div className="w-[80px] h-[80px] flex-shrink-0">
              {renderProductImage('h-[80px]', p.coverImage)}
            </div>
            <div className="flex-1 flex flex-col justify-between py-0.5">
              {cfg.showName !== false && <div className="text-xs line-clamp-2" style={{ color: cfg.nameColor || '#000' }}>{p.name}</div>}
              {cfg.showTag !== false && <span className="inline-block w-fit text-[9px] px-1 py-0.5 rounded bg-orange-100 text-orange-500">砍价</span>}
              {renderProgressBar(progressValues[i % 3] || 50)}
              {renderPriceRow(p)}
              {cfg.showButton !== false && (
                <button className="mt-1 text-[10px] px-3 py-1 rounded-full bg-gray-900 text-white">去砍价</button>
              )}
            </div>
          </div>
        ) : (
          // 卡片布局（横向/两列/三列）
          <>
            {renderProductImage(layout === 3 ? 'h-[70px]' : (isHorizontal ? 'h-[120px]' : 'h-[90px]'), p.coverImage)}
            <div className="py-1.5 px-1">
              {cfg.showName !== false && <div className="text-[11px] truncate" style={{ color: cfg.nameColor || '#000' }}>{p.name}</div>}
              {cfg.showTag !== false && <span className="inline-block text-[8px] px-1 py-0.5 rounded bg-orange-100 text-orange-500 mt-0.5">砍价</span>}
              {renderProgressBar(progressValues[i % 3] || 50)}
              {renderPriceRow(p)}
              {cfg.showButton !== false && (
                <button className="mt-1 w-full text-[9px] py-1 rounded-full bg-gray-900 text-white">去砍价</button>
              )}
            </div>
          </>
        )}
      </div>
    )

    return (
      <div className="px-3 py-2">
        {/* 标题区 */}
        <div className="mb-2">
          <div className="flex items-start justify-between">
            <div>
              {cfg.titleType === 'image' && cfg.titleImage ? (
                <img src={getFileUrl(cfg.titleImage)} alt="" className="h-5 object-contain" />
              ) : (
                <div className="text-base font-bold text-gray-900 leading-tight">{cfg.title || '砍价专区'}</div>
              )}
              <div className="text-[10px] mt-0.5" style={{ color: cfg.hintTextColor || '#999' }}>邀请好友帮砍，超低价带回家</div>
            </div>
            <span className="text-[11px] flex items-center flex-shrink-0 mt-0.5" style={{ color: cfg.headerButtonColor || '#999' }}>
              全部 <ChevronLeft className="h-3 w-3 rotate-180" />
            </span>
          </div>
        </div>

        {/* 商品区 */}
        <div style={{ backgroundColor: cfg.contentBgColor || '#fff' }}>
          {layout === 0 ? (
            // 横向滑动
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
              {displayProducts.map((p: any, i: number) => renderProductCard(p, i, true))}
            </div>
          ) : layout === 1 ? (
            // 列表
            <div className="space-y-2">
              {displayProducts.map((p: any, i: number) => renderProductCard(p, i, false))}
            </div>
          ) : (
            // 网格 (2列 or 3列)
            <div className={`grid gap-2.5 ${layout === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {displayProducts.map((p: any, i: number) => renderProductCard(p, i, false))}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderComponent = (comp: ComponentItem) => {
    switch (comp.type) {
      case 'storeHeader': return renderStoreHeader(comp.config)
      case 'banner': return renderBanner(comp.config)
      case 'searchBox': return renderSearchBox(comp.config)
      case 'imageCube': return renderImageCube(comp.config)
      case 'productList': return renderProductList(comp.config)
      case 'coupon': return renderCoupon(comp.config)
      case 'title': return renderTitle(comp.config)
      case 'spacer': return renderSpacer(comp.config)
      case 'richText': return renderRichText(comp.config)
      case 'video': return renderVideo(comp.config)
      case 'articleList': return renderArticleList(comp.config)
      case 'menuNav': return renderMenuNav(comp.config)
      case 'seckill': return renderSeckill(comp.config)
      case 'groupBuy': return renderGroupBuy(comp.config)
      case 'bargain': return renderBargain(comp.config)
      default: return <div className="p-3 text-gray-400 text-xs text-center">未知组件</div>
    }
  }

  const componentIndex = (id: string) => components.findIndex(c => c.id === id)

  const scrollRef = useRef<HTMLDivElement>(null)
  const phoneFrameRef = useRef<HTMLDivElement>(null)
  const [toolbarTop, setToolbarTop] = useState<number | null>(null)

  const updateToolbarPosition = useCallback(() => {
    if (!selectedId || !scrollRef.current || !phoneFrameRef.current) {
      setToolbarTop(null)
      return
    }
    const el = scrollRef.current.querySelector(`[data-comp-id="${selectedId}"]`) as HTMLElement | null
    if (!el) { setToolbarTop(null); return }
    const frameRect = phoneFrameRef.current.getBoundingClientRect()
    const elRect = el.getBoundingClientRect()
    const top = elRect.top - frameRect.top + elRect.height / 2
    setToolbarTop(top)
  }, [selectedId, components])

  useEffect(() => {
    updateToolbarPosition()
  }, [updateToolbarPosition])

  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    scrollEl.addEventListener('scroll', updateToolbarPosition)
    return () => scrollEl.removeEventListener('scroll', updateToolbarPosition)
  }, [updateToolbarPosition])

  const selectedIdx = selectedId ? componentIndex(selectedId) : -1

  return (
    <div className="flex justify-center">
      {/* 左侧标签列 */}
      <div className="relative w-[100px] flex-shrink-0 mr-2" style={{ height: '680px' }}>
        {components.length > 0 && (
          <div className="h-full pt-[60px]">
            {components.map((comp) => {
              const isSelected = comp.id === selectedId
              return (
                <div
                  key={comp.id}
                  className={`flex items-center justify-end cursor-pointer py-1.5 pr-2 group`}
                  onClick={() => onSelect(comp.id)}
                >
                  <span
                    className={`text-xs px-2 py-1 rounded-md border whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-blue-500 text-white border-blue-500 font-medium shadow-sm'
                        : 'bg-white text-gray-500 border-gray-200 group-hover:border-blue-300 group-hover:text-blue-500'
                    }`}
                  >
                    {COMPONENT_LABEL[comp.type] || '组件'}
                  </span>
                  <div className={`w-3 h-px ml-1 ${isSelected ? 'bg-blue-500' : 'bg-gray-300 group-hover:bg-blue-300'}`} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 手机预览 + 右侧操作栏 */}
      <div className="relative flex-shrink-0" ref={phoneFrameRef}>
        <div className="w-[375px] bg-black rounded-[3rem] p-3 shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-2xl z-20" />
          <div className="relative rounded-[2.4rem] overflow-hidden" style={{ height: '680px' }}>
            {/* 状态栏 */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-2 bg-white/80 backdrop-blur-sm text-xs text-gray-600">
              <span className="font-semibold">9:41</span>
              <div className="flex items-center gap-1">
                <Signal className="h-3 w-3" />
                <Wifi className="h-3 w-3" />
                <Battery className="h-3.5 w-3.5" />
              </div>
            </div>

            {/* 页面内容 */}
            <div
              ref={scrollRef}
              className="h-full overflow-y-auto scrollbar-hide"
              style={{
                backgroundColor: bgColor,
                backgroundImage: bgImage ? `url(${getFileUrl(bgImage)})` : undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {components.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-gray-300">
                  <Gift className="h-12 w-12 mb-3" />
                  <p className="text-sm">点击左侧组件开始装修</p>
                </div>
              ) : (
                components.map((comp) => {
                  const isSelected = comp.id === selectedId
                  const s = comp.style as ComponentStyle | undefined
                  const wrapperStyle: React.CSSProperties = s ? {
                    marginTop: s.marginTop ? `${s.marginTop}px` : undefined,
                    marginBottom: s.marginBottom ? `${s.marginBottom}px` : undefined,
                    marginLeft: s.marginLR ? `${s.marginLR}px` : undefined,
                    marginRight: s.marginLR ? `${s.marginLR}px` : undefined,
                    backgroundColor: s.bgColor || undefined,
                    borderRadius: s.borderRadius ? `${s.borderRadius}px` : undefined,
                    overflow: s.borderRadius ? 'hidden' : undefined,
                  } : {}
                  return (
                    <div
                      key={comp.id}
                      data-comp-id={comp.id}
                      className={`relative group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : 'hover:ring-1 hover:ring-blue-300 hover:ring-inset'}`}
                      style={wrapperStyle}
                      onClick={(e) => { e.stopPropagation(); onSelect(comp.id) }}
                    >
                      {renderComponent(comp)}

                      {/* 选中标签 */}
                      {isSelected && (
                        <div className="absolute top-0 left-0 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-br-lg z-20">
                          {COMPONENT_LABEL[comp.type] || '组件'}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
              <div className="h-16" />
            </div>
          </div>
        </div>

        {/* 操作栏 — 渲染在手机外框右侧，不受 overflow-hidden 影响 */}
        {selectedId && toolbarTop !== null && (
          <div
            className="absolute z-30 flex flex-col rounded bg-[#666] py-1 px-0.5"
            style={{ left: '100%', top: toolbarTop, transform: 'translate(8px, -50%)' }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onMoveUp(selectedId) }}
              disabled={selectedIdx === 0}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="上移"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onMoveDown(selectedId) }}
              disabled={selectedIdx === components.length - 1}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed"
              title="下移"
            >
              <ChevronDown className="h-5 w-5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onCopy(selectedId) }}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-green-300"
              title="复制"
            >
              <Copy className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(selectedId) }}
              className="w-8 h-8 flex items-center justify-center text-white hover:text-red-300"
              title="删除"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
