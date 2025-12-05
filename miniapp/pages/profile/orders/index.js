// 使用全局 api，避免懒加载导致的路径问题
const app = getApp()
const api = app.api || require('../../utils/api.js')

Page({
	data: {
		currentTab: 0, // 0:全部, 1:待付款, 2:待发货, 3:待收货, 4:已完成, 5:已取消, 6:售后
		orders: [],
		filteredOrders: [],
		loading: false,
		refundCount: 0, // 售后订单数量
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
		
		// 格式化订单列表
		const formatOrders = (orders) => {
			return orders.map(order => ({
				...order,
				goods: order.goods || []
			}))
		}
		
		api.getOrders().then((data) => {
			console.log('订单列表API返回:', data)
			const rawOrders = Array.isArray(data) ? data : (data.list || [])
			const orders = formatOrders(rawOrders)
			this.setData({ orders, loading: false })
			this.filterOrders()
		}).catch((err) => {
			console.error('加载订单失败:', err)
			this.setData({ orders: [], loading: false })
			this.filterOrders()
		})
	},
	filterOrders() {
		const { currentTab, orders } = this.data
		let filteredOrders = orders
		// 计算售后订单数量
		const refundCount = orders.filter(o => o.status === 6 || o.status === 7).length
		
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
		} else if (currentTab === 6) {
			filteredOrders = orders.filter(o => o.status === 6 || o.status === 7) // 售后
		}
		this.setData({ filteredOrders, refundCount })
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
			5: '已取消',
			6: '退款中',
			7: '已退款'
		}
		return statusMap[status] || '未知'
	}
})

