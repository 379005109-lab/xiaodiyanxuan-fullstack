// index.js — 动态装修首页
const app = getApp()
const api = app.api || require('../../utils/api.js')
const config = require('../../config/api.js')

Page({
	data: {
		// 装修组件数组（核心数据源）
		components: [],
		pageBgColor: '#FFFFFF',
		pageBgImage: '',
		loaded: false,
		loading: true,
		loadError: '',

		// banner 状态
		currentBanner: 0,

		// 店铺信息
		storeName: '小迪严选'
	},

	onLoad() {
		// 首次加载在 onShow 中执行，保证 tab 页可靠触发
	},

	onShow() {
		if (typeof this.getTabBar === 'function' && this.getTabBar()) {
			this.getTabBar().setData({ selected: 0 })
		}
		// 仅首次加载（或刷新后重新加载）
		if (!this.data.loaded) {
			this.loadDecoration()
		}
	},

	onPullDownRefresh() {
		this.loadDecoration().finally(() => {
			wx.stopPullDownRefresh()
		})
	},

	// ==================== 装修配置加载 ====================

	loadDecoration() {
		this.setData({ loading: true, loadError: '' })

		// 读取全局店铺上下文
		const mId = app.globalData.manufacturerId
		const params = {}
		if (mId) {
			params.manufacturerId = mId
			params.ownerType = 'manufacturer'
			console.log('[首页] 加载厂家店铺装修, manufacturerId:', mId)
		} else {
			console.log('[首页] 加载平台默认装修')
		}

		return api.getStoreDecorationDefault(params).then((data) => {
			if (!data || !data.value || !data.value.components || data.value.components.length === 0) {
				console.log('[首页] 无装修配置，使用默认数据')
				this.setData({ components: this._getDefaultComponents(), loaded: true, loading: false })
				return
			}

			const defaultStyle = { bgColor: '', marginTop: 0, marginBottom: 0, marginLR: 0, borderRadius: 0, innerRadius: 0 }
			const comps = data.value.components.filter(c => c && c.config).map(c => {
				this._fixCompImages(c)
				return { ...c, style: { ...defaultStyle, ...(c.style || {}) } }
			})

			// 为 productList category 模式加载商品
			const promises = comps.map((comp, idx) => {
				if (comp.type === 'productList' && comp.config.selectMode === 'category' && comp.config.categoryIds && comp.config.categoryIds.length > 0 && (!comp.config.products || comp.config.products.length === 0)) {
					return this._fetchProductsByCategories(comp.config.categoryIds, comp.config.limit || 10).then(products => {
						comps[idx].config.products = products
					}).catch(() => {})
				}
				return Promise.resolve()
			})

			Promise.all(promises).then(() => {
				this.setData({
					components: comps,
					pageBgColor: data.bgColor || '#FFFFFF',
					pageBgImage: data.bgImage ? this._fixUrl(data.bgImage) : '',
					loaded: true,
					loading: false,
					storeName: data.name || '小迪严选'
				})
				console.log('[首页] 装修配置已加载，组件数:', comps.length)
				// DEBUG: 输出图片URL帮助排查
				const bannerComp = comps.find(c => c.type === 'banner')
				if (bannerComp && bannerComp.config.items) {
					console.log('[首页] banner图片URL:', bannerComp.config.items.map(i => i.image))
				}
				const prodComp = comps.find(c => c.type === 'productList')
				if (prodComp && prodComp.config.products && prodComp.config.products.length > 0) {
					console.log('[首页] 第一个商品图片URL:', prodComp.config.products[0].thumbnail)
				}
			})
		}).catch((err) => {
			console.error('[首页] 加载装修配置失败:', err)
			this.setData({ components: this._getDefaultComponents(), loaded: true, loading: false, loadError: err.message || '加载失败' })
		})
	},

	// 将相对路径 /api/files/xxx 转为完整 URL
	_fixUrl(url) {
		if (!url) return ''
		if (url.startsWith('http')) return url
		return config.baseURL + url
	},

	// 递归修复组件内所有图片路径
	_fixCompImages(comp) {
		const cfg = comp.config
		if (!cfg) return
		const fix = this._fixUrl.bind(this)
		if (comp.type === 'banner' && cfg.items) {
			cfg.items.forEach(item => { item.image = fix(item.image) })
		}
		if (comp.type === 'storeHeader' && cfg.logo) {
			cfg.logo = fix(cfg.logo)
		}
		if (comp.type === 'imageCube' && cfg.images) {
			cfg.images.forEach(img => { img.url = fix(img.url) })
		}
		if (comp.type === 'video' && cfg.cover) {
			cfg.cover = fix(cfg.cover)
		}
		if (comp.type === 'menuNav' && cfg.items) {
			cfg.items.forEach(item => { item.image = fix(item.image) })
		}
		if (comp.type === 'productList' && cfg.products) {
			cfg.products.forEach(p => {
				p.thumbnail = fix(p.thumbnail)
				if (Array.isArray(p.images)) {
					p.images = p.images.map(fix)
				}
			})
		}
		if (comp.type === 'bargain' && cfg.products) {
			cfg.products.forEach(p => {
				p.coverImage = fix(p.coverImage)
			})
		}
	},

	// 根据分类 ID 获取商品
	_fetchProductsByCategories(categoryIds, limit) {
		const fetches = categoryIds.map(catId =>
			api.getGoodsList({ page: 1, pageSize: limit, categoryId: catId }).then(data => {
				const fix = this._fixUrl.bind(this)
				return (data.list || data || []).map(g => ({
					_id: g._id || g.id,
					name: g.name,
					basePrice: g.price || g.basePrice,
					thumbnail: fix(g.image || g.cover || g.thumb || g.thumbnail || ''),
					images: (g.images || []).map(fix),
					sales: g.sales || g.sold || 0
				}))
			}).catch(() => [])
		)
		return Promise.all(fetches).then(results => {
			const seen = {}
			const all = []
			results.forEach(list => {
				list.forEach(p => {
					if (!seen[p._id]) {
						seen[p._id] = true
						all.push(p)
					}
				})
			})
			return all.slice(0, limit)
		})
	},

	// 无装修配置时的默认组件
	_getDefaultComponents() {
		const defaultStyle = { bgColor: '', marginTop: 0, marginBottom: 0, marginLR: 0, borderRadius: 0, innerRadius: 0 }
		return [
			{
				id: 'default-header',
				type: 'storeHeader',
				config: {
					logo: '',
					name: '小迪严选',
					description: '',
					contactName: '小迪',
					phone: '13000000000',
					address: '广东省佛山市顺德区十里家私城325国道辅道3537号',
					isVerified: true
				},
				style: defaultStyle
			}
		]
	},

	// ==================== 事件处理 ====================

	onBannerChange(e) {
		this.setData({ currentBanner: e.detail.current })
	},

	onBannerTap(e) {
		const link = e.currentTarget.dataset.link
		if (link) {
			wx.navigateTo({ url: link }).catch(() => {
				wx.switchTab({ url: link }).catch(() => {})
			})
		}
	},

	onSearchTap() {
		wx.navigateTo({ url: '/pages/mall/index' })
	},

	goProductDetail(e) {
		const id = e.currentTarget.dataset.id
		if (id) {
			wx.navigateTo({ url: '/pages/mall/detail/index?id=' + id })
		}
	},

	goBargainDetail(e) {
		const id = e.currentTarget.dataset.id
		if (id) {
			wx.navigateTo({ url: '/pages/bargain/detail/index?id=' + id })
		}
	},

	goLink(e) {
		const link = e.currentTarget.dataset.link
		if (link) {
			wx.navigateTo({ url: link }).catch(() => {
				wx.switchTab({ url: link }).catch(() => {})
			})
		}
	},

	callPhone(e) {
		const phone = e.currentTarget.dataset.phone
		if (phone) {
			wx.makePhoneCall({ phoneNumber: phone })
		}
	},

	goShopInfo() {
		wx.navigateTo({ url: '/pages/shop/info/index' })
	},

	goShopPoster() {
		wx.navigateTo({ url: '/pages/shop/poster/index' })
	},

	retryLoad() {
		this.setData({ loaded: false })
		this.loadDecoration()
	},

	onReachBottom() {
		// 首页暂无加载更多逻辑
	},

	onUnload() {
		// 清理
	}
})
