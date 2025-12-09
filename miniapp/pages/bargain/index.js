const app = getApp()
const api = app.api || require('../../utils/api.js')

Page({
	data: {
		leftSeconds: 30 * 60,
		leftText: '00:30:00',
		timer: null,
		loading: false,
		// 筛选相关
		activeFilter: '',
		showFilterPopup: false,
		styleOptions: ['全部', '现代简约', '北欧风', '轻奢', '中式', '美式'],
		categoryOptions: ['全部', '沙发', '床具', '餐桌椅', '柜类', '其他'],
		selectedStyle: '全部',
		selectedCategory: '全部',
		// 商品列表（从 API 加载）
		allGoodsList: [],
		goodsList: [],
		myBargains: [],
		showCancelId: '',
		cancelTimer: null
	},
	onLoad() {
		this.startTimer()
		// 加载砍价商品列表
		this.loadBargainGoods()
		// 加载我的砍价数据
		this.loadMyBargains()
	},
	// 从 API 加载砍价商品列表
	async loadBargainGoods() {
		this.setData({ loading: true })
		try {
			const res = await api.getBargainGoods()
			// 兼容多种返回格式
			let rawList = []
			if (Array.isArray(res)) {
				rawList = res
			} else if (res && res.data && Array.isArray(res.data)) {
				rawList = res.data
			} else if (res && Array.isArray(res.list)) {
				rawList = res.list
			}
			
			const goods = rawList.map(item => {
				// 处理图片URL
				let cover = item.coverImage || item.cover || item.image || ''
				if (cover && !cover.startsWith('http')) {
					// 如果是相对路径或文件ID，添加基础URL
					const config = require('../../config/api.js')
					const baseUrl = config.baseURL.replace('/api/miniapp', '')
					cover = `${baseUrl}/api/files/${cover}`
				}
				if (!cover) {
					cover = `https://picsum.photos/400/500?random=${Date.now()}`
				}
				
				return {
					id: item._id || item.id,
					name: item.name || item.productName,
					cover: cover,
					origin: item.originalPrice || 0,
					price: item.targetPrice || 0,
					cut: 0,
					cutCount: item.totalBargains || 0,
					style: item.style || '现代简约',
					category: item.category || '沙发',
					minCut: item.minCutAmount || 1,
					maxCut: item.maxCutAmount || 50,
					// 材质信息
					materialsGroups: item.materialsGroups || [],
					materialImages: item.materialImages || null,
					materialCategories: item.materialCategories || []
				}
			})
			this.setData({ allGoodsList: goods })
			this.filterGoods()
		} catch (e) {
			console.error('加载砍价商品失败:', e)
		} finally {
			this.setData({ loading: false })
		}
	},
	// 从 API 加载我的砍价
	async loadMyBargains() {
		try {
			const token = wx.getStorageSync('token')
			if (!token) return
			
			const res = await api.getMyBargains()
			// 只显示active状态的砍价
			const myBargains = (res.data || [])
				.filter(item => item.status === 'active')
				.map(item => {
					// 处理图片URL - 使用thumbnail字段
					let cover = item.thumbnail || item.coverImage || ''
					if (cover && !cover.startsWith('http')) {
						const config = require('../../config/api.js')
						const baseUrl = config.baseURL.replace('/api/miniapp', '')
						cover = `${baseUrl}/api/files/${cover}`
					}
					if (!cover) {
						// 尝试从商品列表中获取图片
						const product = this.data.goodsList.find(g => g.id === item.productId)
						cover = product?.cover || `https://picsum.photos/400/400?random=${item._id}`
					}
					return {
						id: item._id,
						name: item.productName,
						cover: cover,
						origin: item.originalPrice || 0,
						price: item.currentPrice || item.targetPrice || 0,
						remain: (item.currentPrice || item.targetPrice || 0) - (item.targetPrice || 0),
						progress: item.originalPrice > 0 ? ((item.originalPrice - (item.currentPrice || item.originalPrice)) / (item.originalPrice - item.targetPrice)) : 0,
						status: item.status
					}
				})
			this.setData({ myBargains })
		} catch (e) {
			console.error('加载我的砍价失败:', e)
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
	// 查看材质
	onShowMaterials(e) {
		const id = e.currentTarget.dataset.id
		const goods = this.data.goodsList.find(g => g.id === id)
		if (!goods || !goods.materialsGroups || goods.materialsGroups.length === 0) {
			wx.showToast({ title: '暂无材质信息', icon: 'none' })
			return
		}
		
		// 构建材质预览内容
		const materials = goods.materialsGroups.map(mg => {
			const colorNames = (mg.colors || []).map(c => c.name).join('、')
			return `${mg.name}: ${colorNames || '多色可选'}`
		}).join('\n')
		
		wx.showModal({
			title: '可选材质',
			content: materials,
			showCancel: false,
			confirmText: '知道了'
		})
	},
	async onHelpCut(e) {
		if (!this.ensureLogin('帮好友助力砍价')) return
		const id = e.currentTarget.dataset.id
		const goods = this.data.goodsList.find(g => g.id === id)
		if (!goods) return
		
		try {
			wx.showLoading({ title: '砍价中...' })
			const res = await api.helpBargain(id)
			wx.hideLoading()
			
			if (res.code === 0 || res.success) {
				// 重新加载数据
				this.loadBargainGoods()
				this.loadMyBargains()
				wx.showToast({ title: `砍价成功！`, icon: 'success' })
			} else {
				wx.showToast({ title: res.message || '砍价失败', icon: 'none' })
			}
		} catch (e) {
			wx.hideLoading()
			wx.showToast({ title: '砍价失败', icon: 'none' })
		}
		return
		
		// 以下为旧逻辑，保留注释
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
	async onCancelMyBargain(e) {
		const id = e.currentTarget.dataset.id
		console.log('取消砍价 - 砍价ID:', id)
		if (!id) {
			wx.showToast({ title: '砍价ID无效', icon: 'none' })
			return
		}
		wx.showModal({
			title: '取消砍价',
			content: '取消后将无法继续砍价，确定要取消吗？',
			confirmText: '取消砍价',
			confirmColor: '#DC2626',
			success: async (res) => {
				if (res.confirm) {
					try {
						wx.showLoading({ title: '取消中...' })
						console.log('调用取消砍价API, ID:', id)
						const result = await api.cancelBargain(id)
						console.log('取消砍价结果:', result)
						wx.hideLoading()
						
						// 从本地列表移除（立即更新UI）
						const myBargains = this.data.myBargains.filter(b => b.id !== id)
						this.setData({ myBargains, showCancelId: '' })
						this.clearCancelTimer()
						
						// 重新从服务器加载
						this.loadMyBargains()
						wx.showToast({ title: '已取消砍价', icon: 'success' })
					} catch (err) {
						wx.hideLoading()
						console.error('取消砍价失败:', err)
						// 即使API失败，也从本地移除（用户体验）
						const myBargains = this.data.myBargains.filter(b => b.id !== id)
						this.setData({ myBargains, showCancelId: '' })
						wx.showToast({ title: '已取消', icon: 'success' })
					}
				}
			}
		})
	},
	async onStartBargain(e) {
		if (!this.ensureLogin('发起砍价')) return
		const id = e.currentTarget.dataset.id
		const goods = this.data.goodsList.find(g => g.id === id)
		if (!goods) return
		
		try {
			wx.showLoading({ title: '发起砍价中...' })
			const res = await api.startBargain(id, goods.name, goods.origin, goods.price, goods.cover)
			wx.hideLoading()
			console.log('发起砍价返回:', res)
			
			// 发起成功，跳转到砍价详情页
			const bargainId = res._id || res.id || id
			wx.showToast({ title: '发起成功', icon: 'success', duration: 1000 })
			
			// 1秒后跳转到砍价详情页
			setTimeout(() => {
				wx.navigateTo({
					url: `/pages/bargain/detail/index?id=${bargainId}&name=${encodeURIComponent(goods.name)}&origin=${goods.origin}&price=${goods.price}&remain=${goods.origin - goods.price}&progress=0&cover=${encodeURIComponent(goods.cover)}`
				})
			}, 1000)
			
			// 重新加载我的砍价列表
			this.loadMyBargains()
		} catch (e) {
			wx.hideLoading()
			console.error('发起砍价失败:', e)
			
			// 检查是否是"已有进行中砍价"的错误
			if (e.message && e.message.includes('已有') && e.message.includes('砍价')) {
				// 查找该商品的已有砍价
				const existingBargain = this.data.myBargains.find(b => b.productId === id)
				
				wx.showModal({
					title: '提示',
					content: '您已有该商品的进行中砍价，是否查看？',
					confirmText: '查看砍价',
					cancelText: '取消',
					success: (res) => {
						if (res.confirm && existingBargain) {
							// 跳转到已有砍价详情页
							wx.navigateTo({
								url: `/pages/bargain/detail/index?id=${existingBargain.id}&name=${encodeURIComponent(existingBargain.name)}&origin=${existingBargain.origin}&price=${existingBargain.price}&remain=${existingBargain.remain}&progress=${existingBargain.progress}&cover=${encodeURIComponent(existingBargain.cover)}`
							})
						} else if (res.confirm) {
							// 刷新我的砍价列表并滚动到该区域
							this.loadMyBargains()
							wx.showToast({ title: '请在下方"我的砍价"中查看', icon: 'none', duration: 2000 })
						}
					}
				})
			} else {
				wx.showToast({ title: e.message || '发起砍价失败', icon: 'none' })
			}
		}
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
	},
	// 跳转到我的砍价
	goMyBargain() {
		// 滚动到我的砍价区域或显示我的砍价列表
		if (this.data.myBargains.length > 0) {
			wx.pageScrollTo({
				selector: '.my-bargain',
				duration: 300
			})
		} else {
			wx.showToast({ title: '暂无砍价记录', icon: 'none' })
		}
	}
})


