import { useRef, useState, useEffect, useCallback } from 'react'
import {
  ComponentItem,
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
import { Wifi, Battery, Signal, Gift, Star, ChevronUp, ChevronDown, Copy, Trash2, ChevronLeft, Search } from 'lucide-react'

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
    <div className="px-4 py-3 bg-white">
      <div className="flex items-center gap-3">
        {cfg.logo ? (
          <img src={getFileUrl(cfg.logo)} alt="" className="w-10 h-10 rounded-full object-cover border border-gray-100" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{cfg.name?.charAt(0) || 'S'}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{cfg.name || '店铺名称'}</div>
          {cfg.description && <div className="text-[10px] text-gray-400 truncate mt-0.5">{cfg.description}</div>}
        </div>
        <div className="flex items-center gap-0.5 text-orange-400">
          <Star className="h-3 w-3 fill-current" />
          <span className="text-[10px] font-medium">4.9</span>
        </div>
      </div>
    </div>
  )

  const renderBanner = (cfg: BannerConfig) => {
    const active = (cfg.items || []).filter(b => b.status)
    return (
      <div className="relative">
        {active[0]?.image ? (
          <img src={getFileUrl(active[0].image)} alt="" className="w-full h-[150px] object-cover" />
        ) : (
          <div className="w-full h-[150px] bg-gradient-to-r from-primary-100 to-primary-50 flex items-center justify-center">
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

  const renderProductList = (cfg: ProductListConfig) => (
    <div className="px-3 py-2">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm">{cfg.title || '商品列表'}</span>
        <span className="text-[10px] text-gray-400 flex items-center">查看更多 <ChevronLeft className="h-3 w-3 rotate-180" /></span>
      </div>
      {(cfg.products?.length || 0) > 0 ? (
        cfg.displayMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-2">
            {(cfg.products || []).slice(0, cfg.limit).map((p, i) => {
              const img = p.thumbnail || p.images?.[0] || ''
              return (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="aspect-square bg-gray-100">
                    {img ? <img src={getFileUrl(img)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                  </div>
                  <div className="p-2">
                    <div className="text-xs truncate">{p.name || '商品名称'}</div>
                    <div className="text-red-500 text-xs font-bold mt-1">¥{p.basePrice || p.price || 0}</div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : cfg.displayMode === 'list' ? (
          <div className="space-y-2">
            {(cfg.products || []).slice(0, cfg.limit).map((p, i) => {
              const img = p.thumbnail || p.images?.[0] || ''
              return (
                <div key={i} className="flex gap-2 bg-white rounded-lg p-2 shadow-sm">
                  <div className="w-20 h-20 bg-gray-100 rounded flex-shrink-0">
                    {img ? <img src={getFileUrl(img)} alt="" className="w-full h-full object-cover rounded" /> : <div className="w-full h-full bg-gray-200 rounded" />}
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <div className="text-xs truncate">{p.name || '商品名称'}</div>
                    <div className="text-red-500 text-xs font-bold mt-2">¥{p.basePrice || p.price || 0}</div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {(cfg.products || []).slice(0, cfg.limit).map((p, i) => {
              const img = p.thumbnail || p.images?.[0] || ''
              return (
                <div key={i} className="flex-shrink-0 w-[110px] bg-white rounded-lg overflow-hidden shadow-sm">
                  <div className="w-full h-[110px] bg-gray-100">
                    {img ? <img src={getFileUrl(img)} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-200" />}
                  </div>
                  <div className="p-1.5">
                    <div className="text-[10px] truncate">{p.name || '商品名称'}</div>
                    <div className="text-red-500 text-[10px] font-bold mt-0.5">¥{p.basePrice || p.price || 0}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {[0, 1].map(i => (
            <div key={i} className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="aspect-square bg-gray-100 flex items-center justify-center text-gray-300 text-xs">商品图</div>
              <div className="p-2"><div className="text-xs text-gray-400">商品名称</div><div className="text-red-400 text-xs font-bold mt-1">¥0.00</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  const renderTitle = (cfg: TitleConfig) => (
    <div
      className="px-3 py-2"
      style={{ textAlign: cfg.align, fontSize: cfg.fontSize, color: cfg.color, fontWeight: cfg.bold ? 'bold' : 'normal' }}
    >
      {cfg.text || '标题'}
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
  const renderBargain = (cfg: BargainConfig) => renderActivityBlock(cfg.title || '砍价专区', cfg.bgColor)

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
                  return (
                    <div
                      key={comp.id}
                      data-comp-id={comp.id}
                      className={`relative group cursor-pointer transition-all ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : 'hover:ring-1 hover:ring-blue-300 hover:ring-inset'}`}
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
