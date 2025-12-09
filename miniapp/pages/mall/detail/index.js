// 使用全局 api，避免懒加载导致的路径问题
const app = getApp()
const api = app.api || require('../../../utils/api.js')

Page({
	data: {
		id: '',
		goods: { name: '商品', basePrice: 0, price: 0 },
		// 微信胶囊按钮位置
		statusBarHeight: 0,
		menuButtonInfo: null,
		navBarHeight: 0,
		images: [],
		detailImages: [],
		mainImage: '', // 保存原始商品主图
		loading: false,
		tabList: [], // 动态生成，根据商品是否有材质/内部结构数据
		hasMaterials: false, // 是否有材质数据
		hasStructure: false, // 是否有内部结构数据
		tabIndex: 0,
		version: 'normal',
		proEnabled: false,
		dims: { length: 2000, width: 900, height: 800 },
		materialsGroups: [
			{ name: '标准皮革', extra: 0, better: false, img: 'https://picsum.photos/800/800?random=400', colors: [{name:'经典黑'},{name:'米白色'},{name:'深棕色'}] },
			{ name: '全青皮', extra: 3000, better: true, img: 'https://picsum.photos/800/800?random=401', colors: [{name:'经典黑'},{name:'米白色'},{name:'深棕色'}] }
		],
		fills: [
			{ name: '高密度海绵', extra: 0, better: false, img: 'https://picsum.photos/800/800?random=410' },
			{ name: '海绵+羽绒', extra: 800, better: true, img: 'https://picsum.photos/800/800?random=411' }
		],
		frames: [
			{ name: '实木框架', extra: 0, better: false, img: 'https://picsum.photos/800/800?random=420' },
			{ name: '加厚实木', extra: 1200, better: true, img: 'https://picsum.photos/800/800?random=421' }
		],
		legs: [
			{ name: '木质脚', extra: 0, better: false, img: 'https://picsum.photos/800/800?random=430' },
			{ name: '金属脚', extra: 600, better: true, img: 'https://picsum.photos/800/800?random=431' }
		],
		sizes: [
			{ name: '双人位', dims: '5000×3000×1000', img: 'https://picsum.photos/800/800?random=440', extra: 0 },
			{ name: '三人位', dims: '5600×3200×1000', img: 'https://picsum.photos/800/800?random=441', extra: 1200 }
		],
		sizeIndex: 0,
		materialGroupIndex: 0,
		materialColorIndex: 0,
		fillIndex: 0,
		frameIndex: 0,
		legIndex: 0,
		totalPrice: 0,
		isFavorited: false,
		favoriteCount: 0,
		cartCount: 0,
		inCart: false,
		hasBargain: false,
		showAnimation: false,
		animationType: '', // 'favorite' or 'cart'
		// 新UI相关
		quantity: 1,
		showSpecs: false,
		showColors: false,
		selectedColorIndex: 0,
		displayColors: [],
		selectedConfigText: '默认规格',
		colors: []
	},
	onLoad(query) {
		const { id = '' } = query || {}
		if (!id) {
			wx.showToast({ title: '商品ID不能为空', icon: 'none' })
			setTimeout(() => {
				wx.navigateBack()
			}, 1500)
			return
		}
		
		// 获取微信胶囊按钮位置
		const menuButtonInfo = wx.getMenuButtonBoundingClientRect()
		const systemInfo = wx.getSystemInfoSync()
		const statusBarHeight = systemInfo.statusBarHeight
		const navBarHeight = (menuButtonInfo.top - statusBarHeight) * 2 + menuButtonInfo.height
		
		this.setData({ 
			id, 
			loading: true,
			statusBarHeight,
			menuButtonInfo,
			navBarHeight
		})
		
		// 加载商品详情
		this.loadGoodsDetail(id)
		
		// 加载收藏状态和购物车数量
		this.loadFavoriteStatus(id)
		this.loadCartCount()
		this.loadFavoriteCount()
		this.checkInCart(id)
		this.checkBargain(id)
	},
	loadGoodsDetail(id) {
		api.getGoodsDetail(id).then((data) => {
			console.log('商品详情API返回:', data)
			
			// 解析材质数据的辅助函数（带去重）
			const parseMaterialsGroups = (materialsGroups) => {
				const result = []
				const seenNames = new Set()  // 用于去重材质分组
				
				if (materialsGroups && materialsGroups.length > 0) {
					materialsGroups.forEach(mg => {
						if (mg.subGroups && mg.subGroups.length > 0) {
							mg.subGroups.forEach(sg => {
								const groupName = sg.name || mg.name
								// 跳过重复的材质分组
								if (seenNames.has(groupName)) return
								seenNames.add(groupName)
								
								// 颜色去重
								const seenColors = new Set()
								const uniqueColors = (sg.colors || []).filter(c => {
									if (seenColors.has(c.name)) return false
									seenColors.add(c.name)
									return true
								}).map(c => ({
									name: c.name,
									img: c.image || ''
								}))
								
								result.push({
									name: groupName,
									extra: 0,
									better: false,
									img: sg.colors?.[0]?.image || '',
									colors: uniqueColors
								})
							})
						}
					})
				}
				return result
			}
			
			// 处理规格数据 - 每个规格包含自己的材质
			let sizes = []
			if (data.sizes && data.sizes.length > 0) {
				sizes = data.sizes.map((s, i) => ({
					name: s.name || `规格${i+1}`,
					dims: s.dims || '',
					extra: s.extra || 0,
					price: s.price || 0,
					img: s.images?.[0] || '',
					materialsGroups: parseMaterialsGroups(s.materialsGroups)  // 保存每个规格的材质
				}))
			}
			
			// 默认显示第一个规格的材质（或全局材质）
			let materialsGroups = []
			if (sizes.length > 0 && sizes[0].materialsGroups && sizes[0].materialsGroups.length > 0) {
				materialsGroups = sizes[0].materialsGroups
			} else if (data.materialsGroups && data.materialsGroups.length > 0) {
				materialsGroups = parseMaterialsGroups(data.materialsGroups)
			}
			
			// 处理内部结构数据 - 只有后端返回了才使用
			const fills = data.fills || []
			const frames = data.frames || []
			const legs = data.legs || []
			
			const hasMaterials = materialsGroups.length > 0 || sizes.some(s => s.materialsGroups && s.materialsGroups.length > 0)
			const hasStructure = fills.length > 0 || frames.length > 0 || legs.length > 0
			
			this.setData({
				goods: {
					name: data.name || '商品',
					basePrice: data.price || data.basePrice || 0,
					price: data.price || 0
				},
				images: data.images || (data.thumb ? [data.thumb] : []),
					mainImage: (data.images && data.images[0]) || data.thumb || '', // 原始商品主图
				detailImages: data.detailImages || data.images || [],
				sizes: sizes.length > 0 ? sizes : this.data.sizes,
				materialsGroups: materialsGroups,
				fills: fills,
				frames: frames,
				legs: legs,
				hasMaterials: hasMaterials,
				hasStructure: hasStructure,
				loading: false
			}, () => {
				this.buildTabList()
				this.recalculate()
			})
		}).catch((err) => {
			console.error('加载商品详情失败:', err)
			this.setData({ loading: false })
			// 如果请求失败，使用默认数据（大多数商品都有材质选项）
			// 默认材质数据 - 每个颜色都有对应图片
			const defaultMaterials = [
				{ 
					name: '标准皮革', 
					extra: 0, 
					better: false, 
					img: 'https://picsum.photos/800/800?random=400', 
					colors: [
						{name:'经典黑', img: 'https://picsum.photos/800/800?random=4001'},
						{name:'米白色', img: 'https://picsum.photos/800/800?random=4002'},
						{name:'深棕色', img: 'https://picsum.photos/800/800?random=4003'}
					] 
				},
				{ 
					name: '全青皮', 
					extra: 3000, 
					better: true, 
					img: 'https://picsum.photos/800/800?random=401', 
					colors: [
						{name:'经典黑', img: 'https://picsum.photos/800/800?random=4011'},
						{name:'米白色', img: 'https://picsum.photos/800/800?random=4012'},
						{name:'深棕色', img: 'https://picsum.photos/800/800?random=4013'}
					] 
				}
			]
			const defaultFills = [
				{ name: '高密度海绵', extra: 0, better: false, img: 'https://picsum.photos/800/800?random=410' },
				{ name: '海绵+羽绒', extra: 800, better: true, img: 'https://picsum.photos/800/800?random=411' }
			]
			const defaultFrames = [
				{ name: '实木框架', extra: 0, better: false, img: 'https://picsum.photos/800/800?random=420' },
				{ name: '加厚实木', extra: 1200, better: true, img: 'https://picsum.photos/800/800?random=421' }
			]
			const defaultLegs = [
				{ name: '木质脚', extra: 0, better: false, img: 'https://picsum.photos/800/800?random=430' },
				{ name: '金属脚', extra: 600, better: true, img: 'https://picsum.photos/800/800?random=431' }
			]
			
			const dict = {
				g1: {
					name: '莫兰迪沙发',
					price: 2699,
					images: [
						'https://picsum.photos/1080/1080?random=500',
						'https://picsum.photos/1080/1080?random=501'
					],
					hasMaterials: true,
					hasStructure: true
				},
				g2: {
					name: '原木床具',
					price: 3599,
					images: [
						'https://picsum.photos/1080/1080?random=510',
						'https://picsum.photos/1080/1080?random=511'
					],
					hasMaterials: false,  // 床具没有材质选项
					hasStructure: false   // 床具没有内部结构选项
				},
				h1: {
					name: '北欧沙发',
					price: 2699,
					images: [
						'https://picsum.photos/1080/1080?random=520',
						'https://picsum.photos/1080/1080?random=521'
					],
					hasMaterials: true,
					hasStructure: true
				}
			}
			// 默认商品都有材质和结构选项
			const defaultData = dict[id] || { 
				name: '精选家具', 
				price: 1999, 
				images: ['https://picsum.photos/1080/1080?random=520'],
				hasMaterials: true,
				hasStructure: true
			}
			
			// 根据商品类型决定是否显示材质和内部结构
			const hasMaterials = defaultData.hasMaterials === true
			const hasStructure = defaultData.hasStructure === true
			
			this.setData({ 
				goods: { name: defaultData.name, basePrice: defaultData.price, price: defaultData.price }, 
				images: defaultData.images, 
				detailImages: defaultData.images,
				hasMaterials,
				hasStructure,
				materialsGroups: hasMaterials ? defaultMaterials : [],
				fills: hasStructure ? defaultFills : [],
				frames: hasStructure ? defaultFrames : [],
				legs: hasStructure ? defaultLegs : []
			}, () => {
				this.buildTabList()
				this.recalculate()
			})
		})
	},
	
	// 根据商品数据动态构建tab列表
	buildTabList() {
		const tabList = [{ key: 'spec', label: '规格' }]
		if (this.data.hasMaterials && this.data.materialsGroups.length > 0) {
			tabList.push({ key: 'material', label: '材质' })
		}
		if (this.data.hasStructure && (this.data.fills.length > 0 || this.data.frames.length > 0 || this.data.legs.length > 0)) {
			tabList.push({ key: 'structure', label: '内部结构' })
		}
		this.setData({ tabList, tabIndex: 0 })
	},
	loadFavoriteStatus(id) {
		// 优先从 API 获取收藏状态
		api.getFavorites().then((favorites) => {
			const favoriteList = Array.isArray(favorites) ? favorites : (favorites.list || [])
			const isFavorited = favoriteList.some(f => f.id === id || f.goodsId === id)
			this.setData({ isFavorited })
		}).catch((err) => {
			// 如果 API 失败，从本地存储获取
			try {
				const favorites = wx.getStorageSync('favorites') || []
				const isFavorited = favorites.some(f => f.id === id)
				this.setData({ isFavorited })
			} catch (e) {
				console.error('加载收藏状态失败:', e)
			}
		})
	},
	loadCartCount() {
		try {
			const cart = wx.getStorageSync('cart') || []
			const cartCount = cart.reduce((sum, item) => sum + (item.count || 1), 0)
			this.setData({ cartCount })
		} catch (e) {
			console.error('加载购物车数量失败:', e)
		}
	},
	loadFavoriteCount() {
		try {
			const favorites = wx.getStorageSync('favorites') || []
			this.setData({ favoriteCount: favorites.length })
		} catch (e) {
			console.error('加载收藏数量失败:', e)
		}
	},
	checkInCart(id) {
		try {
			const cart = wx.getStorageSync('cart') || []
			const inCart = cart.some(item => item.id === id)
			this.setData({ inCart })
		} catch (e) {
			console.error('检查购物车状态失败:', e)
		}
	},
	checkBargain(id) {
		try {
			const myBargains = wx.getStorageSync('myBargains') || []
			const hasBargain = myBargains.some(item => item.id === id)
			this.setData({ hasBargain })
		} catch (e) {
			console.error('检查砍价状态失败:', e)
		}
	},
	ensureLogin(action = '使用砍价功能') {
		let token = ''
		try {
			token = wx.getStorageSync('token') || ''
		} catch (e) {
			console.error('读取登录状态失败:', e)
		}
		if (token) return true
		wx.showModal({
			title: '请先登录',
			content: `登录后才能${action}，是否前往个人中心登录？`,
			confirmText: '去登录',
			cancelText: '稍后',
			success: (res) => {
				if (res.confirm) {
					wx.switchTab({ url: '/pages/profile/index' })
				}
			}
		})
		return false
	},
	onBack() {
		if (getCurrentPages().length > 1) {
			wx.navigateBack({ delta: 1 })
		} else {
			wx.switchTab({ url: '/pages/mall/index' })
		}
	},
	onGoToFavorites() {
		// 跳转到收藏列表页面
		wx.navigateTo({ url: '/pages/profile/favorites/index' })
	},
	onGoToCart() {
		// 跳转到购物车页面
		wx.navigateTo({ url: '/pages/profile/cart/index' })
	},
	onSwiperChange(e) { this.setData({ imageIndex: e.detail.current }) },
	onPreview(e) {
		const current = e.currentTarget.dataset.src
		wx.previewImage({ current, urls: this.data.images })
	},
	onTapThumb(e) { this.setData({ imageIndex: e.currentTarget.dataset.index }) },
	onTabChange(e) { this.setData({ tabIndex: e.currentTarget.dataset.index }) },
	onChangeVersion(e) {
		const version = e.currentTarget.dataset.key
		if (version === 'pro') {
			const materialIndex = Math.max(this.data.materialsGroups.findIndex(m => m.better), 0)
			const fillIndex = Math.max(this.data.fills.findIndex(m => m.better), 0)
			const frameIndex = Math.max(this.data.frames.findIndex(m => m.better), 0)
			const legIndex = Math.max(this.data.legs.findIndex(m => m.better), 0)
			this.setData({ version, proEnabled: true, materialGroupIndex: materialIndex, materialColorIndex: 0, fillIndex, frameIndex, legIndex }, this.recalculate)
		} else {
			this.setData({ version, proEnabled: false, materialGroupIndex: 0, materialColorIndex: 0, fillIndex: 0, frameIndex: 0, legIndex: 0 }, this.recalculate)
		}
	},
	onTogglePro(e) {
		const on = e.detail.value
		if (on) {
			const materialIndex = Math.max(this.data.materialsGroups.findIndex(m => m.better), 0)
			const fillIndex = Math.max(this.data.fills.findIndex(m => m.better), 0)
			const frameIndex = Math.max(this.data.frames.findIndex(m => m.better), 0)
			const legIndex = Math.max(this.data.legs.findIndex(m => m.better), 0)
			this.setData({ version: 'pro', proEnabled: true, materialGroupIndex: materialIndex, materialColorIndex: 0, fillIndex, frameIndex, legIndex }, this.recalculate)
		} else {
			this.setData({ version: 'normal', proEnabled: false }, this.recalculate)
		}
	},
	onSelectMaterialColor(e) {
		const gi = e.currentTarget.dataset.g
		const ci = e.currentTarget.dataset.c
		this.setData({ materialGroupIndex: gi, materialColorIndex: ci })
		if (!this.data.materialsGroups[gi]?.better && this.data.proEnabled) this.setData({ proEnabled: false, version: 'normal' })
		if (this.data.materialsGroups[gi]?.better && !this.data.proEnabled) this.setData({ proEnabled: true, version: 'pro' })
		// 切换顶部轮播图到对应材质颜色图片
		this.updateSwiperToMaterial(gi, ci)
		this.recalculate()
	},
	
	// 根据材质和颜色切换顶部轮播图
	updateSwiperToMaterial(materialIndex, colorIndex) {
		const material = this.data.materialsGroups[materialIndex]
		if (!material) return
		
		// 优先使用颜色的图片，否则使用材质的图片
		let targetImg = null
		if (material.colors && material.colors[colorIndex] && material.colors[colorIndex].img) {
			targetImg = material.colors[colorIndex].img
		} else if (material.img) {
			targetImg = material.img
		}
		
		if (targetImg) {
			// 将材质图片设置为第一张并切换
			let images = [...this.data.images]
			// 检查是否已有该图片
			const existIndex = images.indexOf(targetImg)
			if (existIndex >= 0) {
				// 已存在，直接切换
				this.setData({ imageIndex: existIndex })
			} else {
				// 不存在，添加到第一位并切换
				images.unshift(targetImg)
				this.setData({ images, imageIndex: 0 })
			}
		}
	},
	onSelectFill(e) {
		const i = e.currentTarget.dataset.index
		this.setData({ fillIndex: i })
		if (!this.data.fills[i]?.better && this.data.proEnabled) this.setData({ proEnabled: false, version: 'normal' })
		this.recalculate()
	},
	onSelectFrame(e) {
		const i = e.currentTarget.dataset.index
		this.setData({ frameIndex: i })
		if (!this.data.frames[i]?.better && this.data.proEnabled) this.setData({ proEnabled: false, version: 'normal' })
		this.recalculate()
	},
	onSelectLeg(e) {
		const i = e.currentTarget.dataset.index
		this.setData({ legIndex: i })
		if (!this.data.legs[i]?.better && this.data.proEnabled) this.setData({ proEnabled: false, version: 'normal' })
		this.recalculate()
	},
	onSelectSize(e) {
		const i = e.currentTarget.dataset.index
		const selectedSize = this.data.sizes[i]
		
		console.log('选择规格:', i, selectedSize?.name, '材质数量:', selectedSize?.materialsGroups?.length)
		
		// 如果该规格有自己的材质列表，更新显示
		const updates = { sizeIndex: i }
		if (selectedSize && selectedSize.materialsGroups && selectedSize.materialsGroups.length > 0) {
			updates.materialsGroups = selectedSize.materialsGroups
			updates.materialGroupIndex = 0  // 重置材质分组选择
			updates.materialColorIndex = 0  // 重置颜色选择
		}
		
		this.setData(updates, () => {
			this.buildTabList()  // 重新构建tab（可能材质数量变化）
			this.recalculate()
		})
		
		// 更新顶部轮播图到该规格图片
		if (selectedSize && selectedSize.img) {
			const images = [...this.data.images]
			const existIndex = images.indexOf(selectedSize.img)
			if (existIndex >= 0) {
				this.setData({ imageIndex: existIndex })
			} else {
				images.unshift(selectedSize.img)
				this.setData({ images, imageIndex: 0 })
			}
		}
	},
	recalculate() {
		const d = this.data
		const matExtra = (d.materialsGroups[d.materialGroupIndex] && d.materialsGroups[d.materialGroupIndex].extra) ? d.materialsGroups[d.materialGroupIndex].extra : 0
		const fillExtra = (d.fills[d.fillIndex] && d.fills[d.fillIndex].extra) ? d.fills[d.fillIndex].extra : 0
		const frameExtra = (d.frames[d.frameIndex] && d.frames[d.frameIndex].extra) ? d.frames[d.frameIndex].extra : 0
		const legExtra = (d.legs[d.legIndex] && d.legs[d.legIndex].extra) ? d.legs[d.legIndex].extra : 0
		const sizeExtra = (d.sizes[d.sizeIndex] && d.sizes[d.sizeIndex].extra) ? d.sizes[d.sizeIndex].extra : 0
		const base = d.goods.basePrice ? d.goods.basePrice : 0
		const total = base + matExtra + fillExtra + frameExtra + legExtra + sizeExtra
		this.setData({ totalPrice: total })
		// 更新新UI相关数据
		this.updateDisplayColors()
		this.updateSelectedConfigText()
	},
	onStartBargain() {
		if (!this.ensureLogin()) return
		// 将当前商品写入本地，切到砍价页自动加入"我的砍价"
		const { id, goods, totalPrice } = this.data
		try {
			const bargainItem = {
				id: id || `detail-${Date.now()}`,
				name: goods.name,
				origin: totalPrice + 600,
				price: totalPrice,
				cut: 0,
				cover: this.data.images[0] || 'https://picsum.photos/200/200?random=1'
			}
			wx.setStorageSync('bargainStart', bargainItem)
			
			// 添加到我的砍价列表
			let myBargains = wx.getStorageSync('myBargains') || []
			const existingIndex = myBargains.findIndex(item => item.id === id)
			if (existingIndex >= 0) {
				myBargains[existingIndex] = bargainItem
			} else {
				myBargains.unshift(bargainItem)
			}
			wx.setStorageSync('myBargains', myBargains)
			this.setData({ hasBargain: true })
		} catch (e) {
			console.error('保存砍价数据失败:', e)
		}
		wx.switchTab({ url: '/pages/bargain/index' })
	},
	onToggleFavorite() {
		const { id, goods, isFavorited, totalPrice, images } = this.data
		if (isFavorited) {
			// 取消收藏
			api.removeFavorite(id).then(() => {
				this.setData({ isFavorited: false, showAnimation: false })
				this.loadFavoriteCount()
				wx.showToast({ title: '已取消收藏', icon: 'none' })
			}).catch((err) => {
				console.error('取消收藏失败:', err)
				// 如果 API 失败，使用本地存储
				try {
					let favorites = wx.getStorageSync('favorites') || []
					favorites = favorites.filter(f => f.id !== id)
					wx.setStorageSync('favorites', favorites)
					this.setData({ isFavorited: false, showAnimation: false, favoriteCount: favorites.length })
					wx.showToast({ title: '已取消收藏', icon: 'none' })
				} catch (e) {
					console.error('取消收藏失败:', e)
				}
			})
		} else {
			// 添加收藏
			api.addFavorite(id).then(() => {
				this.setData({ isFavorited: true, showAnimation: true, animationType: 'favorite' })
				this.loadFavoriteCount()
				wx.showToast({ title: '已收藏', icon: 'success' })
				// 显示动画效果
				setTimeout(() => {
					this.setData({ showAnimation: false })
				}, 1000)
			}).catch((err) => {
				console.error('添加收藏失败:', err)
				// 如果 API 失败，使用本地存储
				try {
					let favorites = wx.getStorageSync('favorites') || []
					const favoriteItem = {
						id: id,
						name: goods.name,
						price: totalPrice,
						thumb: images[0] || 'https://picsum.photos/200/200?random=1'
					}
					favorites.unshift(favoriteItem)
					wx.setStorageSync('favorites', favorites)
					this.setData({ isFavorited: true, showAnimation: true, animationType: 'favorite', favoriteCount: favorites.length })
					wx.showToast({ title: '已收藏', icon: 'success' })
					setTimeout(() => {
						this.setData({ showAnimation: false })
					}, 1000)
				} catch (e) {
					console.error('添加收藏失败:', e)
				}
			})
		}
	},
	onAddToCart() {
		const { id, goods, totalPrice, images } = this.data
		// 组装规格信息（根据实际需求调整）
		const specs = {
			size: this.data.sizes[this.data.sizeIndex]?.name || '',
			material: this.data.materialsGroups[this.data.materialGroupIndex]?.name || '',
			materialColor: this.data.materialsGroups[this.data.materialGroupIndex]?.colors[this.data.materialColorIndex]?.name || '',
			fill: this.data.fills[this.data.fillIndex]?.name || '',
			frame: this.data.frames[this.data.frameIndex]?.name || '',
			leg: this.data.legs[this.data.legIndex]?.name || ''
		}
		
		api.addToCart({
			goodsId: id,
			count: 1,
			specs: specs
		}).then(() => {
			this.loadCartCount()
			this.checkInCart(id)
			this.setData({ 
				inCart: true,
				showAnimation: true,
				animationType: 'cart'
			})
			wx.showToast({ title: '已加入购物车', icon: 'success' })
			setTimeout(() => {
				this.setData({ showAnimation: false })
			}, 1000)
		}).catch((err) => {
			console.error('加入购物车失败:', err)
			// 如果 API 失败，使用本地存储
			try {
				let cart = wx.getStorageSync('cart') || []
				const existingItem = cart.find(item => item.id === id)
				
				if (existingItem) {
					existingItem.count = (existingItem.count || 1) + 1
				} else {
					const size = this.data.sizes[this.data.sizeIndex] || {}
					const mg = this.data.materialsGroups[this.data.materialGroupIndex] || {}
					const color = (mg.colors && mg.colors[this.data.materialColorIndex]) ? mg.colors[this.data.materialColorIndex] : {}
					const fill = this.data.fills[this.data.fillIndex] || {}
					const frame = this.data.frames[this.data.frameIndex] || {}
					const leg = this.data.legs[this.data.legIndex] || {}
					// 获取面料图片（优先使用颜色图片，其次使用材质组图片）
					const fabricImg = color.img || mg.img || ''
					cart.unshift({
						id: id,
						name: goods.name,
						price: totalPrice,
						thumb: this.data.mainImage || images[0] || 'https://picsum.photos/200/200?random=1',
						fabricImg: fabricImg,
						count: 1,
						sizeName: size.name || '',
						dims: size.dims || '',
						material: mg.name || '',
						materialColor: color.name || '',
						materialExtra: mg.extra || 0,
						fill: fill.name || '',
						fillExtra: fill.extra || 0,
						frame: frame.name || '',
						frameExtra: frame.extra || 0,
						leg: leg.name || '',
						legExtra: leg.extra || 0
					})
				}
				
				wx.setStorageSync('cart', cart)
				const cartCount = cart.reduce((sum, item) => sum + (item.count || 1), 0)
				this.setData({ 
					cartCount,
					inCart: true,
					showAnimation: true,
					animationType: 'cart'
				})
				wx.showToast({ title: '已加入购物车', icon: 'success' })
				setTimeout(() => {
					this.setData({ showAnimation: false })
				}, 1000)
			} catch (e) {
				console.error('加入购物车失败:', e)
			}
		})
	},
	onFav() {
		this.onToggleFavorite()
	},
	onAddCart() {
		this.onAddToCart()
	},
	goCart() {
		wx.navigateTo({ url: '/pages/profile/cart/index' })
	},
	onBuyNow() {
		// 组装当前选择信息并跳转至确认页
		const d = this.data
		const size = d.sizes[d.sizeIndex] || {}
		const mg = d.materialsGroups[d.materialGroupIndex] || {}
		const color = (mg.colors && mg.colors[d.materialColorIndex]) ? mg.colors[d.materialColorIndex] : {}
		const fill = d.fills[d.fillIndex] || {}
		const frame = d.frames[d.frameIndex] || {}
		const leg = d.legs[d.legIndex] || {}
		const order = {
			goodsId: d.id,  // 商品ID
			goodsName: d.goods.name,
			goodsImage: d.mainImage || d.images[0] || 'https://picsum.photos/200/200?random=1',
			sizeName: size.name || '',
			sizeDims: size.dims || '',
			materialName: mg.name || '',
			materialColor: color.name || '',
			fillName: fill.name || '',
			frameName: frame.name || '',
			legName: leg.name || '',
			// 加价信息
			materialExtra: mg.extra || 0,
			fillExtra: fill.extra || 0,
			frameExtra: frame.extra || 0,
			legExtra: leg.extra || 0,
			totalPrice: d.totalPrice
		}
		try { wx.setStorageSync('orderConfirm', order) } catch (e) {}
		wx.navigateTo({ url: '/pages/order/confirm/index' })
	},
	onShareAppMessage() {
		return {
			title: this.data.goods.name,
			path: `/pages/mall/detail/index?id=${this.data.id}`
		}
	},
	// 新UI方法
	showSpecsSheet() {
		this.setData({ showSpecs: true })
	},
	hideSpecsSheet() {
		this.setData({ showSpecs: false })
	},
	showColorSheet() {
		this.setData({ showColors: true })
	},
	hideColorSheet() {
		this.setData({ showColors: false })
	},
	increaseQty() {
		this.setData({ quantity: this.data.quantity + 1 })
	},
	decreaseQty() {
		if (this.data.quantity > 1) {
			this.setData({ quantity: this.data.quantity - 1 })
		}
	},
	onSelectColor(e) {
		const index = e.currentTarget.dataset.index
		this.setData({ selectedColorIndex: index })
	},
	onQuickSelectColor(e) {
		const ci = e.currentTarget.dataset.c
		this.setData({ materialColorIndex: ci }, () => {
			this.recalculate()
		})
	},
	updateDisplayColors() {
		// 生成显示用的颜色数组
		let colors = []
		const colorHexMap = {
			'经典黑': '#1f2937',
			'米白色': '#f5f5dc',
			'深棕色': '#654321',
			'灰色': '#9ca3af',
			'浅灰': '#d1d5db',
			'米色': '#deb887',
			'红色': '#dc2626'
		}
		if (this.data.materialsGroups && this.data.materialsGroups.length > 0) {
			this.data.materialsGroups.forEach(mg => {
				if (mg.colors) {
					mg.colors.forEach(c => {
						colors.push({ name: c.name, hex: colorHexMap[c.name] || '#deb887' })
					})
				}
			})
		}
		// 只取前6个
		colors = colors.slice(0, 6)
		this.setData({ displayColors: colors })
	},
	updateSelectedConfigText() {
		const d = this.data
		const sizeName = d.sizes[d.sizeIndex]?.name || '默认规格'
		const materialName = d.materialsGroups[d.materialGroupIndex]?.name || ''
		const colorName = d.materialsGroups[d.materialGroupIndex]?.colors?.[d.materialColorIndex]?.name || ''
		let text = sizeName
		if (materialName) text += '+' + materialName
		if (colorName) text += '+' + colorName
		this.setData({ selectedConfigText: text })
	}
})


