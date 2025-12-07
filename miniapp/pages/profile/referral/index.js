const api = require('../../../utils/api');
const app = getApp();

Page({
  data: {
    orderId: '',
    orderNo: '',
    orderAmount: 0,
    refereeName: '',
    refereePhone: '',
    refereeRemark: '',
    submitting: false,
    // 我的推荐列表
    referrals: [],
    stats: {
      totalReferrals: 0,
      convertedCount: 0,
      totalReward: 0,
      pendingReward: 0
    },
    loading: true,
    activeTab: 'form' // form | list
  },

  onLoad(options) {
    if (options.orderId) {
      this.setData({
        orderId: options.orderId,
        orderNo: options.orderNo || '',
        orderAmount: parseFloat(options.orderAmount) || 0
      });
    }
    this.loadMyReferrals();
  },

  onShow() {
    this.loadMyReferrals();
  },

  // 加载我的推荐列表
  async loadMyReferrals() {
    const userId = app.globalData.userId || wx.getStorageSync('userId');
    if (!userId) {
      this.setData({ loading: false });
      return;
    }

    try {
      const res = await api.get(`/api/referrals/my/${userId}`);
      if (res.success) {
        this.setData({
          referrals: res.data || [],
          stats: res.stats || { totalReferrals: 0, convertedCount: 0, totalReward: 0, pendingReward: 0 },
          loading: false
        });
      }
    } catch (error) {
      console.error('加载推荐列表失败:', error);
      this.setData({ loading: false });
    }
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ activeTab: tab });
  },

  // 输入事件
  onInputName(e) {
    this.setData({ refereeName: e.detail.value });
  },
  onInputPhone(e) {
    this.setData({ refereePhone: e.detail.value });
  },
  onInputRemark(e) {
    this.setData({ refereeRemark: e.detail.value });
  },

  // 提交推荐
  async submitReferral() {
    const { orderId, refereeName, refereePhone, refereeRemark, submitting } = this.data;
    
    if (submitting) return;

    if (!refereeName.trim()) {
      wx.showToast({ title: '请输入被推荐人姓名', icon: 'none' });
      return;
    }
    if (!refereePhone.trim() || !/^1[3-9]\d{9}$/.test(refereePhone)) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' });
      return;
    }

    const userId = app.globalData.userId || wx.getStorageSync('userId');
    if (!userId) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });

    try {
      const res = await api.post('/api/referrals', {
        orderId,
        userId,
        refereeName: refereeName.trim(),
        refereePhone: refereePhone.trim(),
        refereeRemark: refereeRemark.trim()
      });

      if (res.success) {
        wx.showToast({ title: '推荐成功', icon: 'success' });
        this.setData({
          refereeName: '',
          refereePhone: '',
          refereeRemark: '',
          activeTab: 'list'
        });
        this.loadMyReferrals();
      } else {
        wx.showToast({ title: res.message || '推荐失败', icon: 'none' });
      }
    } catch (error) {
      console.error('提交推荐失败:', error);
      wx.showToast({ title: '网络错误', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },

  // 获取状态文字
  getStatusText(status) {
    const map = {
      pending: '待跟进',
      contacted: '已联系',
      converted: '已成交',
      rewarded: '已发放奖励',
      invalid: '无效'
    };
    return map[status] || status;
  }
});
