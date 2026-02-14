const { requireLogin } = require('../../../utils/auth.js')

Page({
	data: {
		addresses: [],
		showModal: false,
		editingAddress: null,
		formData: {
			name: '',
			phone: '',
			address: '',
			isDefault: false
		}
	},
	onLoad() {
		if (!requireLogin()) return
		this.loadAddresses()
	},
	onShow() {
		this.loadAddresses()
		if (this.getTabBar) {
			this.getTabBar().setData({ selected: 4 })
		}
	},
	loadAddresses() {
		try {
			let addresses = wx.getStorageSync('addresses') || []
			// 如果没有地址，初始化一些示例数据
			if (addresses.length === 0) {
				addresses = [
					{
						id: 'a1',
						name: '张三',
						phone: '13800138000',
						address: '北京市朝阳区某某街道某某小区1号楼101室',
						isDefault: true
					}
				]
				wx.setStorageSync('addresses', addresses)
			}
			this.setData({ addresses })
		} catch (e) {
			console.error('加载地址列表失败:', e)
		}
	},
	onAddAddress() {
		this.setData({
			showModal: true,
			editingAddress: null,
			formData: {
				name: '',
				phone: '',
				address: '',
				isDefault: false
			}
		})
	},
	onEditAddress(e) {
		const id = e.currentTarget.dataset.id
		const address = this.data.addresses.find(a => a.id === id)
		if (address) {
			this.setData({
				showModal: true,
				editingAddress: address,
				formData: {
					name: address.name,
					phone: address.phone,
					address: address.address,
					isDefault: address.isDefault
				}
			})
		}
	},
	onSetDefault(e) {
		const id = e.currentTarget.dataset.id
		try {
			let addresses = wx.getStorageSync('addresses') || []
			addresses = addresses.map(addr => {
				if (addr.id === id) {
					return { ...addr, isDefault: true }
				} else {
					return { ...addr, isDefault: false }
				}
			})
			wx.setStorageSync('addresses', addresses)
			this.setData({ addresses })
			wx.showToast({ title: '已设为默认地址', icon: 'success' })
		} catch (e) {
			console.error('设置默认地址失败:', e)
		}
	},
	onDeleteAddress(e) {
		const id = e.currentTarget.dataset.id
		wx.showModal({
			title: '删除地址',
			content: '确定要删除这个地址吗？',
			success: (res) => {
				if (res.confirm) {
					try {
						let addresses = wx.getStorageSync('addresses') || []
						addresses = addresses.filter(addr => addr.id !== id)
						wx.setStorageSync('addresses', addresses)
						this.setData({ addresses })
						wx.showToast({ title: '已删除', icon: 'success' })
					} catch (e) {
						console.error('删除地址失败:', e)
					}
				}
			}
		})
	},
	onCloseModal() {
		this.setData({ showModal: false })
	},
	onNameInput(e) {
		this.setData({ 'formData.name': e.detail.value })
	},
	onPhoneInput(e) {
		this.setData({ 'formData.phone': e.detail.value })
	},
	onAddressInput(e) {
		this.setData({ 'formData.address': e.detail.value })
	},
	onToggleDefault() {
		this.setData({ 'formData.isDefault': !this.data.formData.isDefault })
	},
	onSaveAddress() {
		const { formData, editingAddress } = this.data
		if (!formData.name || !formData.phone || !formData.address) {
			wx.showToast({ title: '请完善地址信息', icon: 'none' })
			return
		}
		
		try {
			let addresses = wx.getStorageSync('addresses') || []
			
			if (editingAddress) {
				// 编辑地址
				if (formData.isDefault) {
					// 如果设为默认，先取消其他默认地址
					addresses = addresses.map(addr => {
						if (addr.id === editingAddress.id) {
							return { ...formData, id: editingAddress.id }
						} else {
							return { ...addr, isDefault: false }
						}
					})
				} else {
					addresses = addresses.map(addr => {
						if (addr.id === editingAddress.id) {
							return { ...formData, id: editingAddress.id }
						} else {
							return addr
						}
					})
				}
			} else {
				// 添加新地址
				const newAddress = {
					id: 'a' + Date.now(),
					...formData
				}
				if (formData.isDefault) {
					// 如果设为默认，先取消其他默认地址
					addresses = addresses.map(addr => ({ ...addr, isDefault: false }))
				}
				addresses.unshift(newAddress)
			}
			
			wx.setStorageSync('addresses', addresses)
			this.setData({ addresses, showModal: false })
			wx.showToast({ title: editingAddress ? '已更新' : '已添加', icon: 'success' })
		} catch (e) {
			console.error('保存地址失败:', e)
		}
	},
	stopPropagation() {
		// 阻止事件冒泡
	}
})

