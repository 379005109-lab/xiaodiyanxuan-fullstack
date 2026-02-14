// 使用全局 api，避免懒加载导致的路径问题
const app = getApp()
const api = app.api || require('../../utils/api.js')
const { requireLogin } = require('../../utils/auth.js')

Page({
	data: {
		favorites: [],
		filteredFavorites: [],
		loading: false,
		filters: [
			{ key: 'all', label: '全部' },
			{ key: 'recent', label: '最近加入' },
			{ key: 'price-desc', label: '价格最高' }
		],
		currentFilter: 'all'
	},
	onLoad() {
		if (!requireLogin()) return
		this.loadFavorites()
	},
	onShow() {
		this.loadFavorites()
		if (this.getTabBar) {
			const tabBar = this.getTabBar()
			if (tabBar && typeof tabBar.setData === 'function') {
				tabBar.setData({ selected: 4 })
			}
		}
	},
	loadFavorites() {
		this.setData({ loading: true })
		api.getFavorites().then((data) => {
			const favorites = this.normalizeFavorites(Array.isArray(data) ? data : (data.list || []))
			this.setStateWithFilter(favorites)
		}).catch((err) => {
			console.error('加载收藏列表失败:', err)
			this.setData({ loading: false })
			// 如果 API 失败，从本地存储获取
			try {
				const favorites = this.normalizeFavorites(wx.getStorageSync('favorites') || [])
				this.setStateWithFilter(favorites)
			} catch (e) {
				console.error('加载收藏列表失败:', e)
			}
		})
	},
	normalizeFavorites(list = []) {
		return (list || []).map((item, index) => {
			const addedAt = item.addedAt || Date.now() - index * 1000
			return {
				...item,
				subtitle: item.subtitle || '灵感搭配推荐',
				addedAt,
				addedText: this.formatRelativeTime(addedAt)
			}
		})
	},
	formatRelativeTime(timestamp) {
		const now = Date.now()
		const diff = Math.max(0, now - (timestamp || 0))
		const minute = 60 * 1000
		const hour = 60 * minute
		const day = 24 * hour
		if (diff < minute) return '刚刚'
		if (diff < hour) return `${Math.floor(diff / minute)} 分钟前`
		if (diff < day) return `${Math.floor(diff / hour)} 小时前`
		if (diff < day * 7) return `${Math.floor(diff / day)} 天前`
		const date = new Date(timestamp)
		const y = date.getFullYear()
		const m = String(date.getMonth() + 1).padStart(2, '0')
		const d = String(date.getDate()).padStart(2, '0')
		return `${y}-${m}-${d}`
	},
	setStateWithFilter(favorites = []) {
		const filtered = this.generateFilteredFavorites(favorites, this.data.currentFilter)
		this.setData({ favorites, filteredFavorites: filtered, loading: false })
	},
	generateFilteredFavorites(favorites, filterKey) {
		if (!Array.isArray(favorites)) return []
		let list = favorites.map(item => ({ ...item }))
		switch (filterKey) {
			case 'recent':
				list.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
				break
			case 'price-desc':
				list.sort((a, b) => (b.price || 0) - (a.price || 0))
				break
			default:
				break
		}
		return list
	},
	onChangeFilter(e) {
		const key = e.currentTarget.dataset.key
		if (!key || key === this.data.currentFilter) return
		const filtered = this.generateFilteredFavorites(this.data.favorites, key)
		this.setData({ currentFilter: key, filteredFavorites: filtered })
	},
	onAddToCart(e) {
		const { id, name, price, thumb } = e.currentTarget.dataset
		if (!id) return
		const payload = {
			goodsId: id,
			count: 1,
			specs: {}
		}
		api.addToCart(payload).then(() => {
			wx.showToast({ title: '已加入购物车', icon: 'success' })
			this.appendOrderFromFavorite({ id, name, price, thumb })
		}).catch((err) => {
			console.error('加入购物车失败:', err)
			try {
				let cart = wx.getStorageSync('cart') || []
				const exists = cart.find(item => item.id === id)
				if (exists) {
					exists.count = (exists.count || 1) + 1
				} else {
					cart.unshift({
						id,
						name: name || '商品',
						price: price || 0,
						thumb: thumb || '',
						count: 1
					})
				}
				wx.setStorageSync('cart', cart)
				wx.showToast({ title: '已加入购物车', icon: 'success' })
				this.appendOrderFromFavorite({ id, name, price, thumb })
			} catch (storageError) {
				console.error('本地加入购物车失败:', storageError)
				wx.showToast({ title: '加入失败', icon: 'none' })
			}
		})
	},
	appendOrderFromFavorite({ id, name, price, thumb }) {
		const goodsName = name || '商品'
		const goodsPrice = Number(price) || 0
		const order = {
			id: `fav_order_${Date.now()}`,
			orderNo: `F${Date.now()}`,
			status: 1,
			statusText: '待付款',
			totalPrice: goodsPrice,
			goods: [
				{
					id: `${id}-fav` || id,
					name: goodsName,
					code: goodsName,
					dims: '',
					categoryName: '收藏加购',
					price: goodsPrice,
					count: 1,
					thumb: thumb || ''
				}
			],
			createTime: Date.now(),
			source: 'favorite'
		}
		try {
			let orders = wx.getStorageSync('orders') || []
			orders = [order, ...orders]
			wx.setStorageSync('orders', orders)
		} catch (e) {
			console.error('保存订单失败:', e)
		}
	},
	goDetail(e) {
		const id = e.currentTarget.dataset.id
		wx.navigateTo({ url: `/pages/mall/detail/index?id=${id}` })
	},
	onDeleteFavorite(e) {
		const id = e.currentTarget.dataset.id
		wx.showModal({
			title: '删除收藏',
			content: '确定要删除这个收藏吗？',
			success: (res) => {
				if (res.confirm) {
					api.removeFavorite(id).then(() => {
						// 从列表中移除
						const favorites = this.data.favorites.filter(f => f.id !== id)
						this.setStateWithFilter(favorites)
						wx.showToast({ title: '已删除', icon: 'success' })
					}).catch((err) => {
						console.error('删除收藏失败:', err)
						// 如果 API 失败，使用本地存储
						try {
							let favorites = wx.getStorageSync('favorites') || []
							favorites = favorites.filter(f => f.id !== id)
							wx.setStorageSync('favorites', favorites)
							this.setStateWithFilter(this.normalizeFavorites(favorites))
							wx.showToast({ title: '已删除', icon: 'success' })
						} catch (e) {
							console.error('删除收藏失败:', e)
						}
					})
				}
			}
		})
	},
	onClearFavorites() {
		if (!this.data.favorites.length) return
		wx.showModal({
			title: '清空收藏',
			content: '确定要清空全部收藏吗？',
			confirmText: '清空',
			confirmColor: '#EF4444',
			success: (res) => {
				if (res.confirm) {
					const ids = this.data.favorites.map(item => item.id)
					Promise.all(ids.map(id => api.removeFavorite(id).catch(() => null))).finally(() => {
						this.setData({ favorites: [], filteredFavorites: [] })
						wx.setStorageSync('favorites', [])
						wx.showToast({ title: '已清空收藏', icon: 'success' })
					})
				}
			}
		})
	},
	stopPropagation() {
		// 阻止事件冒泡
	}
})

