// index.js
const app = getApp()
const api = app.api || require('../../utils/api.js')

Page({
	data: {
		// Hero Banner
		banners: [],
		currentBanner: 0,
		autoPlay: true,

		// 砍价专区
		bargainProducts: [],

		// 新品推荐
		recommendProducts: [],

		// 空间灵感（静态数据）
		spaces: [
			{
				id: 1,
				title: '奶油风客厅',
				subtitle: '展厅实景方案',
				image: 'https://picsum.photos/800/600?random=space1',
				link: '/pages/mall/index'
			},
			{
				id: 2,
				title: '温馨卧室',
				subtitle: '软装搭配方案',
				image: 'https://picsum.photos/800/600?random=space2',
				link: '/pages/mall/index'
			},
			{
				id: 3,
				title: '雅致餐厅',
				subtitle: '材质甄选方案',
				image: 'https://picsum.photos/800/600?random=space3',
				link: '/pages/mall/index'
			},
			{
				id: 4,
				title: '简约书房',
				subtitle: '定制收纳方案',
				image: 'https://picsum.photos/800/600?random=space4',
				link: '/pages/mall/index'
			}
		],

		// 精选好物
		featuredProducts: [],

		// 店铺信息（静态数据）
		shopInfo: {
			logo: '',
			name: '小迪严选',
			address: '广东省佛山市顺德区十里家私城325国道辅道3537号',
			contactName: '小迪',
			phone: '13000000000',
			isVerified: true
		}
	},

	onLoad() {
		this.loadHomeData()
		this.loadBargainProducts()
		this.loadFeaturedProducts()
	},

	onShow() {
		if (typeof this.getTabBar === 'function' && this.getTabBar()) {
			this.getTabBar().setData({ selected: 0 })
		}
	},

	onPullDownRefresh() {
		Promise.all([
			this.loadHomeData(),
			this.loadBargainProducts(),
			this.loadFeaturedProducts()
		]).finally(() => {
			wx.stopPullDownRefresh()
		})
	},

	// ==================== 数据加载 ====================

	loadHomeData() {
		return api.getHomeData().then((data) => {
			const banners = (data.banners || []).map((b, i) => ({
				id: b._id || `banner-${i}`,
				image: b.imageUrl || b.image || `https://picsum.photos/1080/1920?random=${100 + i}`,
				title: b.title || '小迪严选',
				subtitle: b.subtitle || '源头工厂 · 品质保障',
				link: b.link || '/pages/mall/index'
			}))

			// 如果没有 banner 数据，用默认数据
			if (banners.length === 0) {
				banners.push(
					{ id: 'b1', image: 'https://picsum.photos/1080/1920?random=100', title: '现代自然', subtitle: '新季搭配灵感', link: '/pages/mall/index' },
					{ id: 'b2', image: 'https://picsum.photos/1080/1920?random=101', title: '源头工厂', subtitle: '品质保障 · 工厂直发', link: '/pages/mall/index' },
					{ id: 'b3', image: 'https://picsum.photos/1080/1920?random=102', title: '意式轻奢', subtitle: '进口材质 · 匠心工艺', link: '/pages/mall/index' }
				)
			}

			const recommendProducts = (data.hotGoods || []).map(g => ({
				id: g._id,
				name: g.name,
				price: g.price,
				originalPrice: g.originalPrice,
				image: g.thumbnail || g.images?.[0] || '',
				highlight: g.description || '',
				sales: g.sold || 0
			}))

			this.setData({ banners, recommendProducts })
		}).catch((err) => {
			console.error('加载首页数据失败:', err)
			// 使用默认 banner
			this.setData({
				banners: [
					{ id: 'b1', image: 'https://picsum.photos/1080/1920?random=100', title: '现代自然', subtitle: '新季搭配灵感', link: '/pages/mall/index' },
					{ id: 'b2', image: 'https://picsum.photos/1080/1920?random=101', title: '源头工厂', subtitle: '品质保障 · 工厂直发', link: '/pages/mall/index' }
				]
			})
		})
	},

	loadBargainProducts() {
		const mockBargainProducts = [
			{
				id: '1',
				name: '北欧简约布艺沙发三人位',
				image: 'https://readdy.ai/api/search-image?query=luxury%20cream%20white%20fabric%20sofa%20on%20dark%20gradient%20background%2C%20single%20side%20backlight%20creating%20rim%20light%20on%20edges%2C%20dark%20matte%20concrete%20floor%20with%20subtle%20reflection%2C%20clean%20centered%20composition%20with%20negative%20space%2C%20ultra%20realistic%20photography%2C%20low%20saturation%20warm%20neutral%20tones%2C%20cinematic%20lighting%20with%20soft%20volumetric%20light%2C%20premium%20material%20detail%20visible%2C%20shallow%20depth%20of%20field%20f2.8%2C%20subtle%20film%20grain%2C%20no%20text%20no%20logo%20no%20watermark&width=600&height=600&seq=bargain001&orientation=squarish',
				originalPrice: 4999,
				currentPrice: 2899,
				progress: 68,
				endTime: Date.now() + 3600000 * 12,
				countdown: '00:00:00'
			},
			{
				id: '2',
				name: '实木餐桌椅组合现代简约',
				image: 'https://readdy.ai/api/search-image?query=white%20oak%20wood%20dining%20table%20editorial%20shot%2C%20dark%20background%20with%20warm%20side%20lighting%20highlighting%20wood%20grain%20and%20beveled%20edges%2C%20sharp%20detail%20on%20texture%20but%20soft%20overall%20mood%2C%20clean%20blurred%20background%2C%20light%20fog%20volumetric%20light%2C%20low%20saturation%20taupe%20and%20walnut%20tones%2C%20high-end%20furniture%20photography%2C%20ultra%20realistic%2C%20no%20text%20no%20logo%20no%20watermark&width=600&height=600&seq=bargain002&orientation=squarish',
				originalPrice: 3299,
				currentPrice: 1899,
				progress: 72,
				endTime: Date.now() + 3600000 * 8,
				countdown: '00:00:00'
			},
			{
				id: '3',
				name: '轻奢真皮床现代简约双人床',
				image: 'https://readdy.ai/api/search-image?query=luxury%20light%20grey%20leather%20bed%20frame%20on%20black%20gradient%20background%2C%20cinematic%20chiaroscuro%20lighting%20from%20left%20side%2C%20premium%20leather%20texture%20detail%20visible%2C%20dark%20matte%20floor%20with%20minimal%20reflection%2C%20centered%20composition%20with%20breathing%20space%2C%20ultra%20realistic%20editorial%20photography%2C%20low%20saturation%20neutral%20tones%2C%20soft%20volumetric%20light%2C%20shallow%20depth%20of%20field%20f2.0%2C%20subtle%20film%20grain%2C%20no%20text%20no%20logo%20no%20watermark&width=600&height=600&seq=bargain003&orientation=squarish',
				originalPrice: 6999,
				currentPrice: 3999,
				progress: 55,
				endTime: Date.now() + 3600000 * 15,
				countdown: '00:00:00'
			},
			{
				id: '4',
				name: '意式极简岩板茶几',
				image: 'https://readdy.ai/api/search-image?query=minimalist%20Italian%20sintered%20stone%20coffee%20table%20on%20dark%20background%2C%20single%20backlight%20creating%20dramatic%20rim%20light%20on%20edges%20and%20corners%2C%20premium%20stone%20texture%20with%20natural%20veining%20visible%2C%20dark%20concrete%20floor%20subtle%20reflection%2C%20clean%20composition%20with%20negative%20space%2C%20ultra%20realistic%20furniture%20photography%2C%20low%20saturation%20sand%20and%20taupe%20tones%2C%20cinematic%20lighting%2C%20shallow%20depth%20of%20field%20f2.8%2C%20subtle%20film%20grain%2C%20no%20text%20no%20logo%20no%20watermark&width=600&height=600&seq=bargain004&orientation=squarish',
				originalPrice: 2599,
				currentPrice: 1499,
				progress: 81,
				endTime: Date.now() + 3600000 * 6,
				countdown: '00:00:00'
			},
			{
				id: '5',
				name: '高端乳胶床垫独立袋装弹簧',
				image: 'https://readdy.ai/api/search-image?query=premium%20white%20latex%20mattress%20editorial%20shot%2C%20dark%20gradient%20background%2C%20warm%20side%20lighting%20highlighting%20fabric%20texture%20and%20quilted%20details%2C%20material%20layers%20visible%20on%20side%20view%2C%20clean%20centered%20composition%2C%20ultra%20realistic%20photography%2C%20low%20saturation%20warm%20neutral%20tones%2C%20cinematic%20soft%20volumetric%20light%2C%20shallow%20depth%20of%20field%20f2.0%2C%20subtle%20film%20grain%2C%20no%20text%20no%20logo%20no%20watermark&width=600&height=600&seq=bargain005&orientation=squarish',
				originalPrice: 4599,
				currentPrice: 2699,
				progress: 63,
				endTime: Date.now() + 3600000 * 10,
				countdown: '00:00:00'
			}
		]

		return api.getBargainList({ pageSize: 6 }).then((data) => {
			const list = (data.list || data || []).map(item => ({
				id: item._id,
				name: item.name || item.productName,
				image: item.coverImage || item.image || '',
				currentPrice: item.currentPrice || item.targetPrice,
				originalPrice: item.originalPrice,
				progress: item.progress || Math.round(((item.originalPrice - (item.currentPrice || item.targetPrice)) / (item.originalPrice - item.targetPrice)) * 100),
				endTime: item.endTime,
				countdown: '00:00:00'
			}))
			const finalList = list.length > 0 ? list : mockBargainProducts
			this.setData({ bargainProducts: finalList })
			if (finalList.length > 0) {
				this.startCountdown()
			}
		}).catch((err) => {
			console.error('加载砍价商品失败:', err)
			this.setData({ bargainProducts: mockBargainProducts })
			this.startCountdown()
		})
	},

	loadFeaturedProducts() {
		return api.getGoodsList({ page: 1, pageSize: 6, sort: 'sales' }).then((data) => {
			const list = (data.list || data || []).map(g => ({
				id: g._id,
				name: g.name,
				price: g.price,
				originalPrice: g.originalPrice,
				image: g.thumbnail || g.images?.[0] || '',
				highlight: g.description || '',
				sold: g.sold || 0
			}))
			this.setData({ featuredProducts: list })
		}).catch((err) => {
			console.error('加载精选好物失败:', err)
		})
	},

	// ==================== 倒计时 ====================

	startCountdown() {
		if (this._countdownTimer) clearInterval(this._countdownTimer)
		this._countdownTimer = setInterval(() => {
			const { bargainProducts } = this.data
			let hasActive = false
			const updated = bargainProducts.map(item => {
				if (!item.endTime) return item
				const remaining = new Date(item.endTime).getTime() - Date.now()
				if (remaining <= 0) {
					return { ...item, countdown: '00:00:00' }
				}
				hasActive = true
				const h = Math.floor(remaining / 3600000)
				const m = Math.floor((remaining % 3600000) / 60000)
				const s = Math.floor((remaining % 60000) / 1000)
				const countdown = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
				return { ...item, countdown }
			})
			this.setData({ bargainProducts: updated })
			if (!hasActive) clearInterval(this._countdownTimer)
		}, 1000)
	},

	onUnload() {
		if (this._countdownTimer) clearInterval(this._countdownTimer)
	},

	// ==================== Banner 事件 ====================

	onBannerChange(e) {
		this.setData({ currentBanner: e.detail.current })
	},

	goToSlide(e) {
		this.setData({ currentBanner: e.currentTarget.dataset.index })
	},

	onBannerTap(e) {
		const item = e.currentTarget.dataset.item
		if (item && item.link) {
			wx.navigateTo({ url: item.link }).catch(() => {
				wx.switchTab({ url: item.link }).catch(() => {})
			})
		}
	},

	// ==================== 导航事件 ====================

	goMoreBargain() {
		wx.navigateTo({ url: '/pages/bargain/index' })
	},

	goBargainDetail(e) {
		const id = e.currentTarget.dataset.id
		wx.navigateTo({ url: `/pages/bargain/detail/index?id=${id}` })
	},

	goMoreProducts() {
		wx.switchTab({ url: '/pages/mall/index' })
	},

	goProductDetail(e) {
		const id = e.currentTarget.dataset.id
		wx.navigateTo({ url: `/pages/mall/detail/index?id=${id}` })
	},

	goCategory() {
		wx.switchTab({ url: '/pages/mall/index' })
	},

	goSpaceDetail(e) {
		wx.switchTab({ url: '/pages/mall/index' })
	},

	goShopInfo() {
		wx.showToast({ title: '店铺详情', icon: 'none' })
	},

	callShop() {
		const phone = this.data.shopInfo.phone
		if (phone) {
			wx.makePhoneCall({ phoneNumber: phone })
		}
	},

	onReachBottom() {
		// 首页暂无加载更多逻辑
	}
})
