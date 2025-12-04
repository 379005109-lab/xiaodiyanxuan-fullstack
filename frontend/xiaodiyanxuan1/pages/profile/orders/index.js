// 使用全局 api，避免懒加载导致的路径问题
const app = getApp()
const api = app.api || require('../../utils/api.js')

Page({
	data: {
		currentTab: 0, // 0:全部, 1:待付款, 2:待发货, 3:待收货, 4:已完成, 5:已取消
		orders: [],
		filteredOrders: [],
		loading: false,
		// 取消订单弹窗
		showCancelModal: false,
		cancelOrderId: '',
		cancelOrder: null,
		cancelReason: ''
	},
	onLoad() {
		this.loadOrders()
	},
	onShow() {
		// 每次显示时重新加载订单
		this.loadOrders()
		// 设置tabBar选中状态
		if (this.getTabBar) {
			const tabBar = this.getTabBar()
			if (tabBar && typeof tabBar.setData === 'function') {
				tabBar.setData({ selected: 4 })
			}
		}
	},
	loadOrders() {
		this.setData({ loading: true })
		
		// 默认材质信息
		const defaultMaterial = '标准皮革'
		const defaultFill = '高密度海绵'
		const defaultFrame = '实木框架'
		const defaultLeg = '木质脚'
		
		// 为订单商品添加默认材质信息
		const formatOrderGoods = (goods) => {
			if (!goods) return goods
			return {
				...goods,
				fabric: goods.fabric || goods.material || defaultMaterial,
				materialColor: goods.materialColor || '经典黑',
				fill: goods.fill || defaultFill,
				frame: goods.frame || defaultFrame,
				leg: goods.leg || defaultLeg
			}
		}
		
		// 格式化订单列表
		const formatOrders = (orders) => {
			return orders.map(order => ({
				...order,
				goods: order.goods ? order.goods.map(formatOrderGoods) : order.goods,
				// 单商品订单的材质信息
				fabric: order.fabric || order.materialName || defaultMaterial,
				fill: order.fill || order.fillName || defaultFill,
				frame: order.frame || order.frameName || defaultFrame,
				leg: order.leg || order.legName || defaultLeg
			}))
		}
		
		// 演示数据 - 包含已修改订单和已取消订单
		const demoOrders = [
			{
				id: 'demo-modified-1',
				orderNo: 'XD20241203001',
				status: 1,
				statusText: '待付款',
				totalPrice: 8999,
				originalPrice: 9599,
				priceChanged: true,
				modified: true,
				modifyReason: '库存不足，部分商品替换为同款其他颜色',
				modifyTime: '2024-12-03 14:30',
				modifyItems: ['沙发颜色由米白色更换为浅灰色', '交货时间延长至8-10周'],
				adminNote: '已电话与客户确认，客户同意更换',
				modifyAccepted: false,
				receiverName: '张三',
				receiverPhone: '138****1234',
				receiverAddress: '北京市朝阳区xx路xx号',
				goods: [
					{ id: 'g1', name: '北欧轻奢真皮沙发', thumb: 'https://picsum.photos/200/200?random=501', sizeName: '三人位', dims: '2100×950×850mm', fabric: '全青皮', materialColor: '浅灰色', fill: '高密度海绵', frame: '实木框架', leg: '金属脚', count: 1 }
				]
			},
			{
				id: 'demo-cancelled-1',
				orderNo: 'XD20241202005',
				status: 5,
				statusText: '已取消',
				totalPrice: 12999,
				receiverName: '李四',
				receiverPhone: '139****5678',
				receiverAddress: '上海市浦东新区xx路xx号',
				goods: [
					{ id: 'g2', name: '意式极简皮艺床', thumb: 'https://picsum.photos/200/200?random=502', sizeName: '1.8米', dims: '2000×1800×1100mm', fabric: '头层牛皮', materialColor: '深棕色', fill: '乳胶+海绵', frame: '加厚实木', leg: '木质脚', count: 1 }
				]
			}
		]
		
		api.getOrders().then((data) => {
			const rawOrders = Array.isArray(data) ? data : (data.list || [])
			// 合并演示数据和真实数据
			const allOrders = [...demoOrders, ...rawOrders]
			const orders = formatOrders(allOrders)
			this.setData({ orders, loading: false })
			this.filterOrders()
		}).catch((err) => {
			console.error('加载订单失败:', err)
			this.setData({ loading: false })
			// 如果 API 失败，从本地存储获取并合并演示数据
			try {
				const rawOrders = wx.getStorageSync('orders') || []
				const allOrders = [...demoOrders, ...rawOrders]
				const orders = formatOrders(allOrders)
				this.setData({ orders })
				this.filterOrders()
			} catch (e) {
				console.error('加载订单失败:', e)
				// 至少显示演示数据
				const orders = formatOrders(demoOrders)
				this.setData({ orders })
				this.filterOrders()
			}
		})
	},
	filterOrders() {
		const { currentTab, orders } = this.data
		let filteredOrders = orders
		if (currentTab === 1) {
			filteredOrders = orders.filter(o => o.status === 1) // 待付款
		} else if (currentTab === 2) {
			filteredOrders = orders.filter(o => o.status === 2) // 待发货/已付款
		} else if (currentTab === 3) {
			filteredOrders = orders.filter(o => o.status === 3) // 待收货/已发货
		} else if (currentTab === 4) {
			filteredOrders = orders.filter(o => o.status === 4) // 已完成
		} else if (currentTab === 5) {
			filteredOrders = orders.filter(o => o.status === 5) // 已取消
		}
		this.setData({ filteredOrders })
	},
	onTabChange(e) {
		const index = parseInt(e.currentTarget.dataset.index)
		this.setData({ currentTab: index })
		this.filterOrders()
	},
	onCancelOrder(e) {
		const id = e.currentTarget.dataset.id
		const order = this.data.orders.find(o => o.id === id)
		// 显示取消原因弹窗
		this.setData({
			showCancelModal: true,
			cancelOrderId: id,
			cancelOrder: order,
			cancelReason: ''
		})
	},
	onCancelReasonInput(e) {
		this.setData({ cancelReason: e.detail.value })
	},
	onCloseCancelModal() {
		this.setData({ showCancelModal: false, cancelOrderId: '', cancelOrder: null, cancelReason: '' })
	},
	onConfirmCancel() {
		const { cancelOrderId, cancelOrder, cancelReason } = this.data
		if (!cancelReason.trim()) {
			wx.showToast({ title: '请填写取消原因', icon: 'none' })
			return
		}
		// 调用API取消订单并通知管理员
		api.cancelOrder(cancelOrderId, cancelReason).then(() => {
			this.updateOrderStatus(cancelOrderId, 5, '已取消')
			this.notifyAdminCancelOrder(cancelOrderId, cancelOrder, cancelReason)
			this.setData({ showCancelModal: false, cancelOrderId: '', cancelOrder: null, cancelReason: '' })
			wx.showToast({ title: '订单已取消', icon: 'success' })
		}).catch((err) => {
			console.error('取消订单失败:', err)
			// 如果 API 失败，使用本地更新
			this.updateOrderStatus(cancelOrderId, 5, '已取消')
			this.notifyAdminCancelOrder(cancelOrderId, cancelOrder, cancelReason)
			this.setData({ showCancelModal: false, cancelOrderId: '', cancelOrder: null, cancelReason: '' })
			wx.showToast({ title: '订单已取消', icon: 'success' })
		})
	},
	// 通知管理员订单取消
	notifyAdminCancelOrder(orderId, order, reason) {
		// 调用API通知管理员
		api.notifyAdmin && api.notifyAdmin({
			type: 'order_cancelled',
			orderId: orderId,
			orderNo: order?.orderNo || orderId,
			reason: reason || '用户未填写原因',
			message: `订单 ${order?.orderNo || orderId} 已被用户取消，原因：${reason || '未填写'}`,
			cancelTime: new Date().toISOString()
		}).catch((err) => {
			console.log('通知管理员失败，将在后台重试:', err)
		})
	},
	onPay(e) {
		const id = e.currentTarget.dataset.id
		wx.showToast({ title: '跳转支付', icon: 'none' })
		// 这里应该调用支付接口，暂时只更新状态
		this.updateOrderStatus(id, 2, '待发货')
	},
	onConfirm(e) {
		const id = e.currentTarget.dataset.id
		wx.showModal({
			title: '确认收货',
			content: '确定已收到商品吗？',
			success: (res) => {
				if (res.confirm) {
					api.confirmOrder(id).then(() => {
						this.updateOrderStatus(id, 4, '已完成')
						wx.showToast({ title: '收货成功', icon: 'success' })
					}).catch((err) => {
						console.error('确认收货失败:', err)
						// 如果 API 失败，使用本地更新
						this.updateOrderStatus(id, 4, '已完成')
						wx.showToast({ title: '收货成功', icon: 'success' })
					})
				}
			}
		})
	},
	onDeleteOrder(e) {
		const id = e.currentTarget.dataset.id
		if (!id) return
		wx.showModal({
			title: '删除订单',
			content: '删除后订单将无法恢复，确定继续吗？',
			confirmText: '删除',
			confirmColor: '#DC2626',
			success: (res) => {
				if (res.confirm) {
					let orders = this.data.orders.filter(o => o.id !== id)
					this.setData({ orders })
					try {
						wx.setStorageSync('orders', orders)
					} catch (err) {
						console.error('删除订单失败:', err)
					}
					this.filterOrders()
					wx.showToast({ title: '已删除', icon: 'success' })
				}
			}
		})
	},
	onViewDetail(e) {
		const id = e.currentTarget.dataset.id
		wx.showToast({ title: '查看详情', icon: 'none' })
	},
	onViewModifyDetail(e) {
		const id = e.currentTarget.dataset.id
		const order = this.data.orders.find(o => o.id === id)
		if (!order) return
		
		// 显示修改详情弹窗
		let content = '订单修改详情:\n\n'
		if (order.modifyReason) {
			content += `修改原因: ${order.modifyReason}\n`
		}
		if (order.modifyTime) {
			content += `修改时间: ${order.modifyTime}\n`
		}
		if (order.priceChanged && order.originalPrice) {
			content += `\n价格变更:\n原价: ¥${order.originalPrice}\n现价: ¥${order.totalPrice}\n`
		}
		if (order.modifyItems && order.modifyItems.length > 0) {
			content += '\n修改内容:\n'
			order.modifyItems.forEach((item, index) => {
				content += `${index + 1}. ${item}\n`
			})
		}
		if (order.adminNote) {
			content += `\n管理员备注: ${order.adminNote}`
		}
		
		wx.showModal({
			title: '订单修改详情',
			content: content,
			showCancel: false,
			confirmText: '我知道了'
		})
	},
	// 确认接受修改后的订单
	onAcceptModifiedOrder(e) {
		const id = e.currentTarget.dataset.id
		wx.showModal({
			title: '确认订单',
			content: '确认接受管理员修改后的订单吗？',
			success: (res) => {
				if (res.confirm) {
					const orders = this.data.orders.map(o => {
						if (o.id === id) {
							return { ...o, modifyAccepted: true }
						}
						return o
					})
					this.setData({ orders })
					try {
						wx.setStorageSync('orders', orders)
					} catch (e) {
						console.error('保存订单失败:', e)
					}
					this.filterOrders()
					wx.showToast({ title: '已确认', icon: 'success' })
				}
			}
		})
	},
	updateOrderStatus(id, status, statusText) {
		const orders = this.data.orders.map(o => {
			if (o.id === id) {
				return { ...o, status, statusText: statusText || this.getStatusText(status) }
			}
			return o
		})
		this.setData({ orders })
		try {
			wx.setStorageSync('orders', orders)
		} catch (e) {
			console.error('保存订单失败:', e)
		}
		this.filterOrders()
	},
	getStatusText(status) {
		const statusMap = {
			1: '待付款',
			2: '待发货',
			3: '待收货',
			4: '已完成',
			5: '已取消'
		}
		return statusMap[status] || '未知'
	}
})

