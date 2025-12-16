const app = getApp();
const api = app.api || require('../../utils/api.js');

Page({
  data: {
    image: '',
    searching: false,
    result: null,
    sourceLabels: {
      xiaohongshu: { name: '小红书', color: '#FF2442' },
      douyin: { name: '抖音', color: '#1F1F1F' },
      kuaishou: { name: '快手', color: '#FF5722' },
      weibo: { name: '微博', color: '#E6162D' },
      taobao: { name: '淘宝/天猫', color: '#FF4400' },
      pinterest: { name: 'Pinterest', color: '#E60023' },
      unknown: { name: '其他平台', color: '#666666' },
      none: { name: '无水印', color: '#22C55E' }
    }
  },

  onLoad() {},

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          image: tempFilePath,
          result: null
        });
      }
    });
  },

  // 清除图片
  clearImage() {
    this.setData({
      image: '',
      result: null
    });
  },

  // 开始搜索
  async startSearch() {
    if (!this.data.image || this.data.searching) return;

    this.setData({ searching: true });

    try {
      // 将图片转为base64
      const fs = wx.getFileSystemManager();
      const base64Data = fs.readFileSync(this.data.image, 'base64');
      
      // 获取设备信息
      const systemInfo = wx.getSystemInfoSync();
      
      const result = await api.post('/image-search/search', {
        imageData: base64Data,
        channel: 'miniapp',
        deviceInfo: {
          platform: systemInfo.platform,
          brand: systemInfo.brand,
          model: systemInfo.model
        }
      });

      // api.post 返回的已经是 data 对象
      if (result && result.searchId) {
        // 处理商品图片URL
        const config = require('../../config/api.js');
        const baseUrl = config.baseURL.replace('/api', '');
        if (result.matchedProducts) {
          result.matchedProducts = result.matchedProducts.map(p => ({
            ...p,
            productImage: p.productImage && !p.productImage.startsWith('http') 
              ? `${baseUrl}/api/files/${p.productImage}` 
              : p.productImage
          }));
        }
        
        this.setData({ result: result });
        
        if (result.watermarkDetails?.hasWatermark) {
          const sourceName = this.data.sourceLabels[result.detectedSource]?.name || '未知';
          wx.showToast({
            title: `检测到来源: ${sourceName}`,
            icon: 'none',
            duration: 2000
          });
        }
      } else {
        wx.showToast({ title: '搜索失败', icon: 'none' });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      wx.showToast({ title: '搜索失败，请重试', icon: 'none' });
    } finally {
      this.setData({ searching: false });
    }
  },

  // 查看商品详情
  async viewProduct(e) {
    const { productid, searchid } = e.currentTarget.dataset;
    
    // 记录用户行为
    if (searchid) {
      try {
        await api.post(`/image-search/follow-up/${searchid}`, {
          action: 'view_product',
          productId: productid
        });
      } catch (e) {}
    }
    
    wx.navigateTo({
      url: `/pages/mall/detail/index?id=${productid}`
    });
  },

  // 获取来源样式
  getSourceStyle(source) {
    const label = this.data.sourceLabels[source];
    return label ? `background-color: ${label.color}` : 'background-color: #666';
  },

  // 获取来源名称
  getSourceName(source) {
    return this.data.sourceLabels[source]?.name || '未知';
  }
});
