Page({
	data: {
		leftSeconds: 30 * 60,
		leftText: '00:30:00',
		timer: null,
		// 筛选相关
		activeFilter: '',
		showFilterPopup: false,
		styleOptions: ['全部', '现代简约', '北欧风', '轻奢', '中式'],
		categoryOptions: ['全部', '沙发', '床具', '餐桌椅', '柜类', '其他'],
		selectedStyle: '全部',
		selectedCategory: '全部',
		// 商品列表（带风格和品类属性）
		allGoodsList: [
			{ id: 'b1', name: '质感沙发 · 莫兰迪灰', cover: 'https://picsum.photos/400/500?random=600', origin: 3999, price: 2199, cut: 200, cutCount: 12, style: '现代简约', category: '沙发' },
			{ id: 'b2', name: '原木电视柜 · 极简主义', cover: 'https://picsum.photos/400/500?random=601', origin: 1699, price: 1099, cut: 120, cutCount: 8, style: '北欧风', category: '柜类' },
			{ id: 'b3', name: '北欧餐椅（对）· 舒适棉麻', cover: 'https://picsum.photos/400/500?random=602', origin: 799, price: 499, cut: 60, cutCount: 5, style: '北欧风', category: '餐桌椅' },
			{ id: 'b4', name: '布艺单椅 · 云朵沙发', cover: 'https://picsum.photos/400/500?random=603', origin: 1299, price: 899, cut: 80, cutCount: 4, style: '现代简约', category: '沙发' },
			{ id: 'b5', name: '轻奢真皮沙发 · 头层牛皮', cover: 'https://picsum.photos/400/500?random=604', origin: 5999, price: 3999, cut: 300, cutCount: 15, style: '轻奢', category: '沙发' },
			{ id: 'b6', name: '实木双人床 · 胡桃木', cover: 'https://picsum.photos/400/500?random=605', origin: 4599, price: 2999, cut: 250, cutCount: 10, style: '中式', category: '床具' }
		],
		goodsList: [],
		myBargains: [],
		showCancelId: '',
		cancelTimer: null
	},
	onLoad() {
		this.startTimer()
		// 加载我的砍价数据
		this.loadMyBargains()
		// 初始化商品列表
		this.filterGoods()
	},
	loadMyBargains() {
		try {
			const myBargains = wx.getStorageSync('myBargains') || []
			this.setData({ myBargains: this.normalizeMyBargains(myBargains) })
		} catch (e) {
			console.error('加载砍价数据失败:', e)
		}
	},
	ensureLogin(action = '使用砍价功能') {
		// 模拟已登录状态，直接返回true
		// 实际项目中应该检查token
		// let token = ''
		// try {
		// 	token = wx.getStorageSync('token') || ''
		// } catch (err) {
		// 	console.error('读取登录状态失败:', err)
		// }
		// if (token) return true
		// wx.showModal({...})
		return true  // 模拟已登录
	},
	normalizeMyBargains(list = []) {
		return (list || []).map((item, index) => {
			const origin = item.origin || item.price || 0
			const price = item.price || Math.max(origin - (item.cut || 0), 0)
			const remain = item.remain != null ? item.remain : Math.max(origin - price - (item.cut || 0), 0)
			const progress = item.progress != null ? item.progress : (origin > 0 ? Math.min((origin - remain) / origin, 1) : 0)
			return {
				...item,
				origin,
				price,
				remain,
				progress,
				cover: item.cover || `https://picsum.photos/400/400?random=${700 + index}`
			}
		})
	},
	onShowCancel(e) {
		const id = e.currentTarget.dataset.id
		if (!id) return
		this.clearCancelTimer()
		this.setData({ showCancelId: id })
		if (e.type === 'longpress') {
			this.scheduleHideCancel()
		}
	},
	onHideCancel() {
		if (!this.data.showCancelId) return
		this.clearCancelTimer()
		this.setData({ showCancelId: '' })
	},
	onViewMyBargain(e) {
		const id = e.currentTarget.dataset.id
		if (!id) return
		this.onHideCancel()
		// 跳转到砍价详情页
		const item = this.data.myBargains.find(b => b.id === id)
		if (item) {
			wx.navigateTo({ 
				url: `/pages/bargain/detail/index?id=${id}&name=${encodeURIComponent(item.name)}&origin=${item.origin || 0}&price=${item.price || 0}&remain=${item.remain || 0}&progress=${item.progress || 0}&cover=${encodeURIComponent(item.cover || '')}` 
			})
		}
	},
	onUnload() {
		this.clearTimer()
		this.clearCancelTimer()
	},
	startTimer() {
		this.clearTimer()
		const timer = setInterval(() => {
			const next = Math.max(this.data.leftSeconds - 1, 0)
			this.setData({ leftSeconds: next, leftText: this._formatLeftTime(next) })
			if (next === 0) this.clearTimer()
		}, 1000)
		this.setData({ timer })
	},
	clearTimer() {
		if (this.data.timer) {
			clearInterval(this.data.timer)
			this.setData({ timer: null })
		}
	},
	_formatLeftTime(s) {
		const hh = String(Math.floor(s / 3600)).padStart(2, '0')
		const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
		const ss = String(s % 60).padStart(2, '0')
		return `${hh}:${mm}:${ss}`
	},
	onShow() {
		if (this.getTabBar) {
			this.getTabBar().setData({ selected: 1 })
		}
		// 重新加载我的砍价数据
		this.loadMyBargains()
		// 从详情页带回的发起砍价
		try {
			const payload = wx.getStorageSync('bargainStart')
			if (payload && payload.id) {
				const { id, name, origin, price, cut = 0 } = payload
				const targetSave = Math.max((origin || 0) - (price || 0), 0)
				const remain = Math.max(targetSave - (cut || 0), 0)
				const progress = targetSave > 0 ? Math.min((cut / targetSave), 1) : 0
				const exists = this.data.myBargains.some(b => b.id === id)
				if (!exists) {
					const myBargains = [{ id, name, remain, progress, origin, price, cover: this.data.goodsList.find(g => g.id === id)?.cover || payload.cover || `https://picsum.photos/400/400?random=${Date.now() % 1000}` }, ...this.data.myBargains]
					const normalized = this.normalizeMyBargains(myBargains)
					this.setData({ myBargains: normalized })
					try {
						wx.setStorageSync('myBargains', normalized)
					} catch (e) {
						console.error('保存砍价数据失败:', e)
					}
				}
				wx.removeStorageSync('bargainStart')
			}
		} catch (e) {}
	},
	onTapFilter(e) {
		const key = e.currentTarget.dataset.key
		if (key === 'style' || key === 'category') {
			this.setData({ 
				activeFilter: this.data.activeFilter === key ? '' : key,
				showFilterPopup: this.data.activeFilter !== key
			})
		}
	},
	
	// 选择筛选项
	onSelectFilterOption(e) {
		const { type, value } = e.currentTarget.dataset
		if (type === 'style') {
			this.setData({ selectedStyle: value })
		} else if (type === 'category') {
			this.setData({ selectedCategory: value })
		}
		this.setData({ showFilterPopup: false, activeFilter: '' })
		this.filterGoods()
	},
	
	// 关闭筛选弹窗
	onCloseFilterPopup() {
		this.setData({ showFilterPopup: false, activeFilter: '' })
	},
	
	// 筛选商品
	filterGoods() {
		const { allGoodsList, selectedStyle, selectedCategory } = this.data
		let filtered = [...allGoodsList]
		
		if (selectedStyle && selectedStyle !== '全部') {
			filtered = filtered.filter(g => g.style === selectedStyle)
		}
		if (selectedCategory && selectedCategory !== '全部') {
			filtered = filtered.filter(g => g.category === selectedCategory)
		}
		
		this.setData({ goodsList: filtered })
	},
	onHelpCut(e) {
		if (!this.ensureLogin('帮好友助力砍价')) return
		const id = e.currentTarget.dataset.id
		const goods = this.data.goodsList.find(g => g.id === id)
		if (!goods) return
		
		// 更新商品砍价进度
		const updatedGoods = { ...goods, cut: goods.cut + 20, cutCount: goods.cutCount + 1 }
		const list = this.data.goodsList.map(g => g.id === id ? updatedGoods : g)
		this.setData({ goodsList: list })
		
		// 计算新的进度
		const targetSave = updatedGoods.origin - updatedGoods.price
		const remain = Math.max(targetSave - updatedGoods.cut, 0)
		const progress = targetSave > 0 ? Math.min(updatedGoods.cut / targetSave, 1) : 0
		
		// 检查是否在我的砍价列表中，如果不在则添加
		const exists = this.data.myBargains.some(b => b.id === id)
		let myBargains
		if (!exists) {
			myBargains = [{ id, name: updatedGoods.name, remain, progress }, ...this.data.myBargains]
		} else {
			// 如果已存在，更新进度
			myBargains = this.data.myBargains.map(b => b.id === id ? { ...b, remain, progress } : b)
		}
		
		this.setData({ myBargains })
		try {
			wx.setStorageSync('myBargains', myBargains)
		} catch (e) {
			console.error('保存砍价数据失败:', e)
		}
		
		wx.showToast({ title: '砍价成功，已省¥20', icon: 'success' })
	},
	onCancelMyBargain(e) {
		const id = e.currentTarget.dataset.id
		if (!id) return
		wx.showModal({
			title: '取消砍价',
			content: '取消后将无法继续砍价，确定要取消吗？',
			confirmText: '取消砍价',
			confirmColor: '#DC2626',
			success: (res) => {
				if (res.confirm) {
					const filtered = this.data.myBargains.filter(item => item.id !== id)
					const normalized = this.normalizeMyBargains(filtered)
					this.clearCancelTimer()
					this.setData({ myBargains: normalized, showCancelId: '' })
					try {
						wx.setStorageSync('myBargains', normalized)
					} catch (err) {
						console.error('取消砍价失败:', err)
					}
					wx.showToast({ title: '已取消砍价', icon: 'success' })
				}
			}
		})
	},
	onStartBargain(e) {
		if (!this.ensureLogin('发起砍价')) return
		const id = e.currentTarget.dataset.id
		const goods = this.data.goodsList.find(g => g.id === id)
		if (!goods) return
		const targetSave = goods.origin - goods.price
		const remain = Math.max(targetSave - goods.cut, 0)
		const progress = targetSave > 0 ? Math.min(goods.cut / targetSave, 1) : 0
		
		// 添加到我的砍价，如存在则不重复添加
		const exists = this.data.myBargains.some(b => b.id === id)
		if (!exists) {
			const myBargains = [{ id, name: goods.name, remain, progress }, ...this.data.myBargains]
			this.setData({ myBargains })
			// 保存到本地存储
			try {
				wx.setStorageSync('myBargains', myBargains)
			} catch (e) {
				console.error('保存砍价数据失败:', e)
			}
		}
		wx.showToast({ title: '已发起砍价', icon: 'success' })
	},
	onShareAppMessage(res) {
		// 获取分享来源（可能是按钮的data-id）
		let id = null
		if (res.from === 'button') {
			id = res.target && res.target.dataset && res.target.dataset.id
		}
		const item = id ? this.data.myBargains.find(b => b.id === id) : null
		return {
			title: item ? `帮我砍一刀！${item.name}还差￥${item.remain}` : '帮我砍一刀，最高省50%',
			path: '/pages/bargain/index',
			imageUrl: '' // 可以设置分享图片
		}
	}
})


