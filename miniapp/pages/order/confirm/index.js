// 使用全局 api，避免懒加载导致的路径问题
const app = getApp()
const api = app.api || require('../../utils/api.js')

Page({
	data: {
		orderType: 'normal', // normal: 普通订单, package: 套餐订单, cart: 购物车订单
		order: {
			goodsName: '',
			goodsImage: '',
			sizeName: '',
			sizeDims: '',
			materialName: '',
			materialColor: '',
			fillName: '',
			frameName: '',
			legName: '',
			materialExtra: 0,
			fillExtra: 0,
			frameExtra: 0,
			legExtra: 0,
			totalPrice: 0
		},
		cartGoodsList: [], // 购物车商品列表
		packageOrder: {
			packageId: '',
			goods: [],
			totalPrice: 0,
			originalPrice: 0,
			discount: 0,
			material: ''
		},
		packageGoodsList: [], // 套餐商品列表（排除推荐商品）
		recommendations: [
			{ id: 'r1', name: '配套茶几', price: 1299, thumb: 'https://picsum.photos/200/200?random=100', added: false, count: 1 },
			{ id: 'r2', name: '配套椅子', price: 599, thumb: 'https://picsum.photos/200/200?random=101', added: false, count: 1 },
			{ id: 'r3', name: '配套灯具', price: 899, thumb: 'https://picsum.photos/200/200?random=102', added: false, count: 1 }
		],
		addedRecommendations: [], // 已添加的推荐商品
		totalPrice: 0, // 总价（包含推荐商品）
		recommendationTotalPrice: 0, // 推荐商品总价
		// 收货信息
		name: '',
		phone: '',
		address: '',
		remark: '', // 订单备注
		defaultAddress: null, // 默认地址
		setAsDefault: true // 设为默认地址
	},
	onLoad(options) {
		const { type } = options || {}
		if (type === 'package') {
			// 套餐订单
			try {
				const data = wx.getStorageSync('packageOrder')
				if (data) {
					// 分离套餐商品和推荐商品
					const packageGoods = (data.goods || []).filter(g => g.categoryName !== '搭配推荐')
					this.setData({ 
						orderType: 'package',
						packageOrder: data,
						packageGoodsList: packageGoods
					}, () => {
						this.calculateTotalPrice()
					})
				} else {
					this.calculateTotalPrice()
				}
			} catch (e) {
				console.error('加载套餐订单失败:', e)
				this.calculateTotalPrice()
			}
		} else if (type === 'cart') {
			// 购物车订单
			try {
				const data = wx.getStorageSync('orderConfirm')
				if (data && data.isFromCart && data.cartItems) {
					// 默认材质信息
					const defaultMaterial = '标准皮革'
					const defaultFill = '高密度海绵'
					const defaultFrame = '实木框架'
					const defaultLeg = '木质脚'
					
					// 为购物车商品添加默认材质信息
					const cartGoodsList = data.cartItems.map(item => ({
						...item,
						fabric: item.fabric || item.material || defaultMaterial,
						materialColor: item.materialColor || '经典黑',
						fill: item.fill || defaultFill,
						frame: item.frame || defaultFrame,
						leg: item.leg || defaultLeg
					}))
					
					this.setData({ 
						orderType: 'cart',
						cartGoodsList: cartGoodsList,
						totalPrice: data.totalPrice || 0
					}, () => {
						this.calculateTotalPrice()
					})
				} else {
					this.calculateTotalPrice()
				}
			} catch (e) {
				console.error('加载购物车订单失败:', e)
				this.calculateTotalPrice()
			}
		} else {
			// 普通订单
			try {
				const data = wx.getStorageSync('orderConfirm')
				if (data) {
					this.setData({ order: data }, () => {
						this.calculateTotalPrice()
					})
				} else {
					this.calculateTotalPrice()
				}
			} catch (e) {
				this.calculateTotalPrice()
			}
		}
		// 加载已添加的推荐商品
		this.loadAddedRecommendations()
		// 加载默认地址
		this.loadDefaultAddress()
	},
	loadAddedRecommendations() {
		try {
			const added = wx.getStorageSync('addedRecommendations') || []
			// 更新recommendations的added状态
			const recommendations = this.data.recommendations.map(r => {
				const addedItem = added.find(a => a.id === r.id)
				if (addedItem) {
					return { ...r, added: true, count: addedItem.count || 1 }
				}
				return r
			})
			this.setData({ 
				addedRecommendations: added,
				recommendations: recommendations
			}, () => {
				this.calculateTotalPrice()
			})
		} catch (e) {
			console.error('加载推荐商品失败:', e)
		}
	},
	calculateTotalPrice() {
		let baseTotalPrice = 0
		if (this.data.orderType === 'package') {
			// 套餐一口价
			baseTotalPrice = this.data.packageOrder.totalPrice || 0
		} else if (this.data.orderType === 'cart') {
			// 购物车订单：计算所有商品价格
			baseTotalPrice = (this.data.cartGoodsList || []).reduce((sum, item) => {
				return sum + (item.price || 0) * (item.count || item.quantity || 1)
			}, 0)
		} else {
			// 普通订单
			baseTotalPrice = this.data.order.totalPrice || 0
		}
		let recommendationTotalPrice = (this.data.addedRecommendations || []).reduce((sum, r) => sum + (r.price || 0) * (r.count || 1), 0)
		this.setData({ 
			totalPrice: baseTotalPrice + recommendationTotalPrice,
			recommendationTotalPrice: recommendationTotalPrice
		})
	},
	onIncreaseQuantity(e) {
		const index = e.currentTarget.dataset.index
		const goods = this.data.packageGoodsList[index]
		if (goods) {
			goods.count = (goods.count || 1) + 1
			// 同步更新packageOrder中的商品
			const packageOrderGoods = this.data.packageOrder.goods
			const packageGoodsIndex = packageOrderGoods.findIndex(g => g.id === goods.id && g.categoryName !== '搭配推荐')
			if (packageGoodsIndex >= 0) {
				packageOrderGoods[packageGoodsIndex].count = goods.count
			}
			this.setData({
				[`packageGoodsList[${index}].count`]: goods.count,
				'packageOrder.goods': packageOrderGoods
			}, () => {
				this.calculateTotalPrice()
			})
		}
	},
	onDecreaseQuantity(e) {
		const index = e.currentTarget.dataset.index
		const goods = this.data.packageGoodsList[index]
		if (goods && goods.count > 1) {
			goods.count = goods.count - 1
			// 同步更新packageOrder中的商品
			const packageOrderGoods = this.data.packageOrder.goods
			const packageGoodsIndex = packageOrderGoods.findIndex(g => g.id === goods.id && g.categoryName !== '搭配推荐')
			if (packageGoodsIndex >= 0) {
				packageOrderGoods[packageGoodsIndex].count = goods.count
			}
			this.setData({
				[`packageGoodsList[${index}].count`]: goods.count,
				'packageOrder.goods': packageOrderGoods
			}, () => {
				this.calculateTotalPrice()
			})
		}
	},
	onPackageItemTip(e) {
		const index = e.currentTarget.dataset.index
		const goods = this.data.packageGoodsList[index]
		wx.showModal({
			title: '套餐商品',
			content: '套餐商品为整体定价，无法单独删除或修改数量。\n\n如需修改套餐内容，请返回套餐详情页重新选择。',
			showCancel: true,
			cancelText: '继续下单',
			confirmText: '返回修改',
			success: (res) => {
				if (res.confirm) {
					wx.navigateBack()
				}
			}
		})
	},
	onName(e) { this.setData({ name: e.detail.value }) },
	onPhone(e) { this.setData({ phone: e.detail.value }) },
	onAddress(e) { this.setData({ address: e.detail.value }) },
	onRemark(e) { this.setData({ remark: e.detail.value }) },
	onToggleDefault() { this.setData({ setAsDefault: !this.data.setAsDefault }) },
	onSelectAddress() {
		// 可以跳转到地址选择页面
		wx.showToast({ title: '地址选择功能开发中', icon: 'none' })
	},
	loadDefaultAddress() {
		try {
			const defaultAddress = wx.getStorageSync('defaultAddress')
			if (defaultAddress) {
				this.setData({ 
					defaultAddress,
					name: defaultAddress.name,
					phone: defaultAddress.phone,
					address: defaultAddress.address
				})
			}
		} catch (e) {
			console.error('加载默认地址失败:', e)
		}
	},
	saveAsDefaultAddress() {
		if (this.data.setAsDefault && this.data.name && this.data.phone && this.data.address) {
			const address = {
				name: this.data.name,
				phone: this.data.phone,
				address: this.data.address,
				isDefault: true
			}
			try {
				wx.setStorageSync('defaultAddress', address)
			} catch (e) {
				console.error('保存默认地址失败:', e)
			}
		}
	},
	onDeleteNormalOrder() {
		wx.showModal({
			title: '确认删除',
			content: '确定要删除该商品吗？',
			success: (res) => {
				if (res.confirm) {
					wx.navigateBack()
				}
			}
		})
	},
	onDeleteCartGoods(e) {
		const index = e.currentTarget.dataset.index
		wx.showModal({
			title: '删除商品',
			content: '确定要删除这个商品吗？',
			success: (res) => {
				if (res.confirm) {
					const cartGoodsList = this.data.cartGoodsList.filter((g, i) => i !== index)
					// 重新计算总价
					const totalPrice = cartGoodsList.reduce((sum, g) => sum + (g.price || 0) * (g.count || 1), 0)
					this.setData({ cartGoodsList, totalPrice })
					if (cartGoodsList.length === 0) {
						wx.navigateBack()
					}
					wx.showToast({ title: '已删除', icon: 'success' })
				}
			}
		})
	},
	onAddRecommendation(e) {
		const id = e.currentTarget.dataset.id
		const index = e.currentTarget.dataset.index
		const recommendation = this.data.recommendations[index]
		const count = recommendation.count || 1
		
		// 添加到已添加列表
		const recommendationToAdd = { ...recommendation, count: count }
		const addedRecommendations = [...this.data.addedRecommendations, recommendationToAdd]
		const recommendations = this.data.recommendations.map(r => r.id === id ? { ...r, added: true, count: count } : r)
		this.setData({ addedRecommendations, recommendations }, () => {
			this.calculateTotalPrice()
			this.updatePackageOrderGoods()
		})
		wx.showToast({ title: '已添加', icon: 'success' })
	},
	updatePackageOrderGoods() {
		// 更新套餐订单中的商品列表，包含推荐商品
		if (this.data.orderType === 'package') {
			const packageOrder = { ...this.data.packageOrder }
			// 移除之前的推荐商品
			packageOrder.goods = (packageOrder.goods || []).filter(g => g.categoryName !== '搭配推荐')
			// 添加新的推荐商品
			if (this.data.addedRecommendations.length > 0) {
				const recommendationGoods = this.data.addedRecommendations.map(r => ({
					id: r.id,
					code: r.name,
					name: r.name,
					dims: '',
					categoryName: '搭配推荐',
					price: r.price,
					originalPrice: r.price,
					count: r.count || 1,
					thumb: r.thumb,
					material: '',
					materialColor: '',
					fill: '',
					frame: '',
					leg: ''
				}))
				packageOrder.goods = packageOrder.goods.concat(recommendationGoods)
			}
			this.setData({ packageOrder })
		}
	},
	onIncreaseRecQuantity(e) {
		const index = e.currentTarget.dataset.index
		const recommendation = this.data.recommendations[index]
		const count = (recommendation.count || 1) + 1
		const recommendations = this.data.recommendations.map((r, i) => i === index ? { ...r, count } : r)
		let addedRecommendations = this.data.addedRecommendations
		
		if (recommendation && recommendation.added) {
			addedRecommendations = this.data.addedRecommendations.map((r, i) => {
				const recIndex = this.data.recommendations.findIndex(rec => rec.id === r.id)
				return recIndex === index ? { ...r, count } : r
			})
		}
		
		this.setData({ recommendations, addedRecommendations }, () => {
			this.calculateTotalPrice()
			if (recommendation && recommendation.added) {
				this.updatePackageOrderGoods()
			}
		})
	},
	onDecreaseRecQuantity(e) {
		const index = e.currentTarget.dataset.index
		// 判断是从recommendations还是addedRecommendations操作
		const isFromAdded = e.currentTarget.dataset.fromAdded === 'true'
		
		if (isFromAdded) {
			// 从已添加列表中操作
			const recommendation = this.data.addedRecommendations[index]
			if (recommendation && recommendation.count > 1) {
				const count = recommendation.count - 1
				const addedRecommendations = this.data.addedRecommendations.map((r, i) => i === index ? { ...r, count } : r)
				// 同步更新recommendations
				const recommendations = this.data.recommendations.map(r => {
					if (r.id === recommendation.id) {
						return { ...r, count }
					}
					return r
				})
				this.setData({ recommendations, addedRecommendations }, () => {
					this.calculateTotalPrice()
					this.updatePackageOrderGoods()
				})
			}
		} else {
			// 从推荐列表操作
			const recommendation = this.data.recommendations[index]
			const currentCount = recommendation.count || 1
			if (currentCount > 1) {
				const count = currentCount - 1
				const recommendations = this.data.recommendations.map((r, i) => i === index ? { ...r, count } : r)
				let addedRecommendations = this.data.addedRecommendations
				
				if (recommendation && recommendation.added) {
					addedRecommendations = this.data.addedRecommendations.map((r, i) => {
						if (r.id === recommendation.id) {
							return { ...r, count }
						}
						return r
					})
				}
				
				this.setData({ recommendations, addedRecommendations }, () => {
					this.calculateTotalPrice()
					if (recommendation && recommendation.added) {
						this.updatePackageOrderGoods()
					}
				})
			}
		}
	},
	onDeleteRecommendation(e) {
		// 从已添加的推荐商品中删除
		const index = e.currentTarget.dataset.index
		const recommendation = this.data.addedRecommendations[index]
		if (!recommendation) return
		
		wx.showModal({
			title: '删除商品',
			content: '确定要删除这个商品吗？',
			success: (res) => {
				if (res.confirm) {
					const addedRecommendations = this.data.addedRecommendations.filter((r, i) => i !== index)
					// 更新recommendations的added状态
					const recommendations = this.data.recommendations.map(r => {
						if (r.id === recommendation.id) {
							return { ...r, added: false, count: 1 }
						}
						return r
					})
					this.setData({ addedRecommendations, recommendations }, () => {
						this.calculateTotalPrice()
						this.updatePackageOrderGoods()
					})
					wx.showToast({ title: '已删除', icon: 'success' })
				}
			}
		})
	},
	onSubmit() {
		// 检查是否登录
		const token = wx.getStorageSync('token')
		if (!token) {
			wx.showModal({
				title: '提示',
				content: '请先登录后再提交订单',
				confirmText: '去登录',
				success: (res) => {
					if (res.confirm) {
						wx.switchTab({ url: '/pages/profile/index' })
					}
				}
			})
			return
		}
		
		if (!this.data.name || !this.data.phone || !this.data.address) {
			wx.showToast({ title: '请完善收货信息', icon: 'none' })
			return
		}
		
		// 保存为默认地址
		this.saveAsDefaultAddress()
		
		// 计算总价
		let totalPrice = this.data.totalPrice || 0
		
		// 组装商品列表
		let goods = []
		if (this.data.orderType === 'package') {
			goods = this.data.packageOrder.goods.map(g => ({
				id: g.id,
				name: g.name || g.code,
				code: g.code,
				dims: g.dims,
				categoryName: g.categoryName,
				price: g.price,
				count: g.count || 1,
				thumb: g.thumb || 'https://picsum.photos/200/200?random=1',
				fabric: g.fabric || g.material || '',
				fill: g.fill || '',
				frame: g.frame || '',
				leg: g.leg || ''
			}))
		} else if (this.data.orderType === 'cart') {
			goods = this.data.cartGoodsList.map(g => ({
				id: g.id,
				name: g.name,
				code: g.code || g.name,
				dims: g.dims,
				sizeName: g.sizeName,
				price: g.price,
				count: g.count || 1,
				thumb: g.thumb || 'https://picsum.photos/200/200?random=1',
				fabric: g.fabric || '',
				fill: g.fill || '',
				frame: g.frame || '',
				leg: g.leg || ''
			}))
		} else {
			goods = [{
				id: this.data.order.goodsId || 'g1',
				name: this.data.order.goodsName,
				code: this.data.order.goodsName,
				dims: this.data.order.sizeDims,
				sizeName: this.data.order.sizeName,
				price: this.data.order.totalPrice,
				count: 1,
				thumb: this.data.order.goodsImage || 'https://picsum.photos/200/200?random=1',
				fabric: this.data.order.materialName || '',
				fill: this.data.order.fillName || '',
				frame: this.data.order.frameName || '',
				leg: this.data.order.legName || ''
			}]
		}
		
		// 组装订单数据（与后端 API 格式匹配）
		const orderData = {
			type: this.data.orderType,
			totalPrice: totalPrice,
			goods: goods.map(g => ({
				goodsId: g.id,
				name: g.name,
				thumb: g.thumb,
				price: g.price,
				count: g.count || 1,
				specs: {
					size: g.sizeName || g.dims,
					material: g.fabric,
					materialColor: g.materialColor,
					fill: g.fill,
					frame: g.frame,
					leg: g.leg
				}
			})),
			receiver: {
				name: this.data.name,
				phone: this.data.phone,
				address: this.data.address
			},
			remark: this.data.remark
		}
		
		wx.showLoading({ title: '提交中...' })
		
		// 调用创建订单接口
		api.createOrder(orderData).then((order) => {
			wx.hideLoading()
			wx.showToast({ 
				title: '订单已提交', 
				icon: 'success',
				duration: 1500
			})
			
			// 延迟跳转到我的订单页面
			setTimeout(() => {
				wx.navigateTo({ url: '/pages/profile/orders/index' })
			}, 1500)
		}).catch((err) => {
			wx.hideLoading()
			console.error('创建订单失败:', err)
			// 如果 API 失败，保存到本地存储
			const order = {
				id: 'order_' + Date.now(),
				orderNo: 'ORD' + Date.now(),
				status: 1,
				statusText: '待付款',
				totalPrice: totalPrice,
				goods: goods,
				receiverName: this.data.name,
				receiverPhone: this.data.phone,
				receiverAddress: this.data.address,
				createTime: Date.now()
			}
			try {
				const orders = wx.getStorageSync('orders') || []
				orders.unshift(order)
				wx.setStorageSync('orders', orders)
			} catch (e) {
				console.error('保存订单失败:', e)
			}
			wx.showToast({ 
				title: '订单已提交（本地）', 
				icon: 'success',
				duration: 1500
			})
			setTimeout(() => {
				wx.navigateTo({ url: '/pages/profile/orders/index' })
			}, 1500)
		})
	}
})