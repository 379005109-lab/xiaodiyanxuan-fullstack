import apiClient from '@/lib/apiClient'

// ============ 组件类型枚举 ============

export type ComponentType =
  | 'storeHeader'
  | 'banner'
  | 'searchBox'
  | 'imageCube'
  | 'productList'
  | 'coupon'
  | 'title'
  | 'spacer'
  | 'richText'
  | 'navBar'
  | 'video'
  | 'articleList'
  | 'menuNav'
  | 'seckill'
  | 'groupBuy'
  | 'bargain'

// ============ 组件配置接口 ============

export interface StoreHeaderConfig {
  logo: string
  name: string
  description: string
  contactName: string
  phone: string
  address: string
  isVerified: boolean
}

export interface BannerItem {
  _id?: string
  image: string
  link: string
  sort: number
  status: boolean
}

export interface BannerConfig {
  items: BannerItem[]
}

export interface SearchBoxConfig {
  placeholder: string
  borderRadius: number
  bgColor: string
}

export interface ImageCubeImage {
  url: string
  link: string
}

export interface ImageCubeConfig {
  images: ImageCubeImage[]
  columns: 1 | 2 | 3 | 4
}

export interface CouponItem {
  _id?: string
  couponId: string
  amount: number
  threshold: number
  coupon?: {
    code: string
    type: string
    value: number
    minAmount: number
    validFrom: string
    validTo: string
  }
}

export interface CouponConfig {
  items: CouponItem[]
}

export interface ProductListConfig {
  productIds: string[]
  displayMode: 'grid' | 'list' | 'scroll'
  limit: number
  products?: any[]
  selectMode: 'product' | 'category'
  categoryIds: string[]
  sortBy: 'default' | 'sales' | 'price'
  showName: boolean
  showPrice: boolean
  showSales: boolean
}

export interface TitleConfig {
  text: string
  fontSize: number
  align: 'left' | 'center' | 'right'
  color: string
  bold: boolean
  fontStyle: 'normal' | 'italic'
  subtitle: string
  subtitleColor: string
  subtitleFontSize: number
  showRight: boolean
  rightText: string
  rightLink: string
  rightColor: string
  rightFontSize: number
}

export interface SpacerConfig {
  height: number
  bgColor: string
}

export interface RichTextConfig {
  content: string
}

export interface NavBarItem {
  text: string
  link: string
  icon: string
}

export interface NavBarConfig {
  items: NavBarItem[]
}

export interface VideoConfig {
  url: string
  cover: string
  autoplay: boolean
}

export interface ArticleListConfig {
  count: number
  displayMode: 'list' | 'card'
}

export interface MenuNavItem {
  image: string
  text: string
  link: string
}

export interface MenuNavConfig {
  items: MenuNavItem[]
  columns: 4 | 5
  shape: 'square' | 'round'
}

export interface SeckillConfig {
  title: string
  bgColor: string
  displayMode: 'scroll' | 'grid'
}

export interface GroupBuyConfig {
  title: string
  bgColor: string
  displayMode: 'scroll' | 'grid'
}

export interface BargainConfig {
  title: string
  bgColor: string
  displayMode: 'scroll' | 'grid'
  // 布局设置
  layoutStyle: 0 | 1 | 2 | 3
  // 头部设置
  headerStyle: 'image' | 'color'
  headerBgImage: string
  headerBgColor: string
  headerBgColor2: string
  titleType: 'image' | 'text'
  titleImage: string
  // 显示内容
  showName: boolean
  showTag: boolean
  showPrice: boolean
  showOriginalPrice: boolean
  showButton: boolean
  moreLink: string
  // 砍价商品设置
  productIds: string[]
  products: any[]
  limit: number
  sortBy: 'default' | 'sales' | 'price'
  // 样式颜色
  dividerColor: string
  hintTextColor: string
  headerButtonColor: string
  contentBgColor: string
  nameColor: string
  originalPriceColor: string
  themeMode: 'follow' | 'custom'
  buttonTextColor: string
}

// ============ 组件样式配置 ============

export interface ComponentStyle {
  bgColor: string
  marginTop: number
  marginBottom: number
  marginLR: number
  borderRadius: number
  innerRadius: number
}

export const createDefaultStyle = (): ComponentStyle => ({
  bgColor: '',
  marginTop: 0,
  marginBottom: 0,
  marginLR: 0,
  borderRadius: 0,
  innerRadius: 0,
})

// ============ 动态组件 ============

export interface ComponentItem {
  id: string
  type: ComponentType
  config: any
  style?: ComponentStyle
}

export interface PageValue {
  components: ComponentItem[]
}

// ============ 装修页面 ============

export interface StoreDecoration {
  _id: string
  name: string
  title: string
  coverImage: string
  value: PageValue
  status: 'active' | 'inactive' | 'draft'
  type: 'homepage' | 'custom'
  isDefault: boolean
  merchantId: string | null
  bgColor: string
  bgImage: string
  createdAt: string
  updatedAt: string
}

export type StoreDecorationCreateData = Partial<Omit<StoreDecoration, '_id' | 'createdAt' | 'updatedAt'>>

// ============ API 方法 ============

export const getDecorationList = async (params?: { type?: string; status?: string; page?: number; limit?: number }) => {
  const response = await apiClient.get('/store-decoration', { params })
  return response.data
}

export const getDecorationById = async (id: string): Promise<StoreDecoration | null> => {
  try {
    const response = await apiClient.get(`/store-decoration/${id}`)
    return response.data.data
  } catch (error) {
    console.error('获取装修页面失败:', error)
    return null
  }
}

export const getDefaultDecoration = async (merchantId?: string): Promise<StoreDecoration | null> => {
  try {
    const response = await apiClient.get('/store-decoration/default', { params: { merchantId } })
    return response.data.data
  } catch (error) {
    console.error('获取默认首页失败:', error)
    return null
  }
}

export const createDecoration = async (data: StoreDecorationCreateData) => {
  const response = await apiClient.post('/store-decoration', data)
  return response.data
}

export const updateDecoration = async (id: string, data: Partial<StoreDecorationCreateData>) => {
  const response = await apiClient.put(`/store-decoration/${id}`, data)
  return response.data
}

export const deleteDecoration = async (id: string) => {
  const response = await apiClient.delete(`/store-decoration/${id}`)
  return response.data
}

export const setDefaultDecoration = async (id: string) => {
  const response = await apiClient.put(`/store-decoration/${id}/set-default`)
  return response.data
}

// ============ 工具方法 ============

export const generateComponentId = (): string =>
  `comp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

export const createDefaultConfig = (type: ComponentType): any => {
  switch (type) {
    case 'storeHeader':
      return { logo: '', name: '', description: '', contactName: '', phone: '', address: '', isVerified: false } as StoreHeaderConfig
    case 'banner':
      return { items: [{ image: '', link: '', sort: 0, status: true }] } as BannerConfig
    case 'searchBox':
      return { placeholder: '搜索商品', borderRadius: 20, bgColor: '#f5f5f5' } as SearchBoxConfig
    case 'imageCube':
      return { images: [], columns: 2 } as ImageCubeConfig
    case 'productList':
      return { productIds: [], displayMode: 'grid', limit: 10, selectMode: 'product', categoryIds: [], sortBy: 'default', showName: true, showPrice: true, showSales: true } as ProductListConfig
    case 'coupon':
      return { items: [] } as CouponConfig
    case 'title':
      return { text: '标题', fontSize: 16, align: 'left', color: '#282828', bold: false, fontStyle: 'normal', subtitle: '', subtitleColor: '#282828', subtitleFontSize: 14, showRight: true, rightText: '更多', rightLink: '', rightColor: '#282828', rightFontSize: 12 } as TitleConfig
    case 'spacer':
      return { height: 20, bgColor: 'transparent' } as SpacerConfig
    case 'richText':
      return { content: '' } as RichTextConfig
    case 'navBar':
      return { items: [{ text: '首页', link: '/', icon: 'home' }] } as NavBarConfig
    case 'video':
      return { url: '', cover: '', autoplay: false } as VideoConfig
    case 'articleList':
      return { count: 3, displayMode: 'list' } as ArticleListConfig
    case 'menuNav':
      return { items: [{ image: '', text: '导航1', link: '' }, { image: '', text: '导航2', link: '' }, { image: '', text: '导航3', link: '' }, { image: '', text: '导航4', link: '' }], columns: 4, shape: 'round' } as MenuNavConfig
    case 'seckill':
      return { title: '限时秒杀', bgColor: '#ff4d4f', displayMode: 'scroll' } as SeckillConfig
    case 'groupBuy':
      return { title: '拼团活动', bgColor: '#ff7a45', displayMode: 'scroll' } as GroupBuyConfig
    case 'bargain':
      return { title: '砍价专区', bgColor: '#FFFFFF', displayMode: 'scroll', layoutStyle: 0, headerStyle: 'color', headerBgImage: '', headerBgColor: '#FFFFFF', headerBgColor2: '#FFFFFF', titleType: 'text', titleImage: '', showName: true, showTag: false, showPrice: true, showOriginalPrice: true, showButton: false, moreLink: '', productIds: [], products: [], limit: 10, sortBy: 'default', dividerColor: '#FFFFFF', hintTextColor: '#999999', headerButtonColor: '#999999', contentBgColor: '#FFFFFF', nameColor: '#000000', originalPriceColor: '#999999', themeMode: 'follow', buttonTextColor: '#FFFFFF' } as BargainConfig
    default:
      return {}
  }
}

export const createEmptyPageValue = (): PageValue => ({
  components: []
})

export const createComponent = (type: ComponentType): ComponentItem => ({
  id: generateComponentId(),
  type,
  config: createDefaultConfig(type),
  style: createDefaultStyle(),
})
