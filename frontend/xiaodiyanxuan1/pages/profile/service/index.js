Page({
	data: {
		messages: [],
		inputText: ''
	},
	onLoad() {
		this.loadMessages()
		// 添加欢迎消息
		if (this.data.messages.length === 0) {
			this.addServiceMessage('您好，欢迎咨询客服！有什么可以帮助您的吗？')
		}
	},
	onShow() {
		if (this.getTabBar) {
			this.getTabBar().setData({ selected: 4 })
		}
	},
	loadMessages() {
		try {
			const messages = wx.getStorageSync('serviceMessages') || []
			this.setData({ messages })
		} catch (e) {
			console.error('加载消息失败:', e)
		}
	},
	saveMessages() {
		try {
			wx.setStorageSync('serviceMessages', this.data.messages)
		} catch (e) {
			console.error('保存消息失败:', e)
		}
	},
	addUserMessage(content) {
		const message = {
			id: 'm' + Date.now(),
			type: 'user',
			content: content,
			time: this.formatTime(new Date())
		}
		const messages = [...this.data.messages, message]
		this.setData({ messages }, () => {
			this.saveMessages()
			this.scrollToBottom()
			// 模拟客服回复
			setTimeout(() => {
				this.addServiceMessage(this.getAutoReply(content))
			}, 1000)
		})
	},
	addServiceMessage(content) {
		const message = {
			id: 'm' + Date.now(),
			type: 'service',
			content: content,
			time: this.formatTime(new Date())
		}
		const messages = [...this.data.messages, message]
		this.setData({ messages }, () => {
			this.saveMessages()
			this.scrollToBottom()
		})
	},
	onInput(e) {
		this.setData({ inputText: e.detail.value })
	},
	onSendMessage() {
		const { inputText } = this.data
		if (!inputText.trim()) {
			return
		}
		
		this.addUserMessage(inputText)
		this.setData({ inputText: '' })
	},
	getAutoReply(userMessage) {
		const message = userMessage.toLowerCase()
		const replies = [
			'您好，有什么可以帮助您的吗？',
			'感谢您的咨询，我们会尽快为您处理。',
			'您的问题我们已经记录，会尽快给您回复。',
			'如果还有其他问题，请随时联系我们。',
			'感谢您的反馈，我们会认真处理。'
		]
		
		// 简单的关键词匹配
		if (message.includes('退款') || message.includes('退货')) {
			return '关于退款问题，请提供订单号，我们会尽快为您处理。'
		} else if (message.includes('订单') || message.includes('物流')) {
			return '关于订单问题，请提供订单号，我们帮您查询。'
		} else if (message.includes('优惠') || message.includes('折扣')) {
			return '我们定期会推送优惠券，请关注优惠券页面。'
		} else if (message.includes('地址') || message.includes('收货')) {
			return '您可以在地址管理页面添加或修改收货地址。'
		} else {
			return replies[Math.floor(Math.random() * replies.length)]
		}
	},
	formatTime(date) {
		const hours = String(date.getHours()).padStart(2, '0')
		const minutes = String(date.getMinutes()).padStart(2, '0')
		return `${hours}:${minutes}`
	},
	scrollToBottom() {
		setTimeout(() => {
			wx.pageScrollTo({
				scrollTop: 99999,
				duration: 300
			})
		}, 100)
	}
})

