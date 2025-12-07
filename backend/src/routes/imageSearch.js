const express = require('express');
const router = express.Router();
const ImageSearch = require('../models/ImageSearch');
const Product = require('../models/Product');
const crypto = require('crypto');

// 水印关键词配置
const WATERMARK_PATTERNS = {
  xiaohongshu: ['小红书', '红书', 'xiaohongshu', 'RED', '小红薯', '@小红书'],
  douyin: ['抖音', 'TikTok', 'douyin', '@抖音', '抖音号'],
  kuaishou: ['快手', 'kuaishou', '@快手', '快手号'],
  weibo: ['微博', 'weibo', '@微博', '新浪微博'],
  taobao: ['淘宝', 'taobao', '天猫', 'tmall', '淘宝网'],
  pinterest: ['pinterest', 'Pin']
};

// 简单的图片哈希生成（用于去重）
function generateImageHash(base64Data) {
  return crypto.createHash('md5').update(base64Data.substring(0, 10000)).digest('hex');
}

// 检测水印来源
function detectWatermarkSource(ocrText) {
  if (!ocrText) return { source: 'none', confidence: 0, text: '' };
  
  const textLower = ocrText.toLowerCase();
  
  for (const [source, patterns] of Object.entries(WATERMARK_PATTERNS)) {
    for (const pattern of patterns) {
      if (textLower.includes(pattern.toLowerCase())) {
        return {
          source,
          confidence: 0.9,
          text: pattern
        };
      }
    }
  }
  
  // 检测是否有 @ 符号（可能是用户名水印）
  if (ocrText.includes('@')) {
    return {
      source: 'unknown',
      confidence: 0.5,
      text: ocrText.match(/@[\w\u4e00-\u9fa5]+/)?.[0] || ''
    };
  }
  
  return { source: 'none', confidence: 0, text: '' };
}

// 图片搜索
router.post('/search', async (req, res) => {
  try {
    const { 
      imageData,  // base64 图片数据
      imageUrl,   // 或者图片URL
      userId, 
      channel = 'web',
      deviceInfo,
      ocrText     // 前端OCR识别的文字（如果有）
    } = req.body;
    
    if (!imageData && !imageUrl) {
      return res.status(400).json({ success: false, message: '请提供图片' });
    }
    
    // 生成图片哈希
    const imageHash = imageData ? generateImageHash(imageData) : null;
    
    // 检测水印来源
    const watermarkResult = detectWatermarkSource(ocrText || '');
    
    // 获取客户端IP
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    // 搜索相似商品（这里使用简单的随机匹配，实际应使用图像相似度算法）
    // TODO: 接入真正的图像相似度搜索服务
    const products = await Product.find({ status: 'active' })
      .limit(10)
      .select('name images price category');
    
    const matchedProducts = products.map((p, idx) => ({
      productId: p._id,
      productName: p.name,
      similarity: Math.max(30, 95 - idx * 8), // 模拟相似度
      productImage: p.images?.[0] || ''
    }));
    
    // 保存搜索记录
    const searchRecord = new ImageSearch({
      imageUrl: imageUrl || `data:image/jpeg;base64,${imageData?.substring(0, 100)}...`,
      imageHash,
      detectedSource: watermarkResult.source,
      watermarkDetails: {
        hasWatermark: watermarkResult.source !== 'none',
        watermarkText: watermarkResult.text,
        confidence: watermarkResult.confidence
      },
      matchedProducts,
      userId,
      channel,
      deviceInfo,
      ipAddress
    });
    
    await searchRecord.save();
    
    res.json({
      success: true,
      data: {
        searchId: searchRecord._id,
        detectedSource: watermarkResult.source,
        watermarkDetails: searchRecord.watermarkDetails,
        matchedProducts: matchedProducts.slice(0, 6)
      },
      message: watermarkResult.source !== 'none' 
        ? `检测到来源: ${getSourceName(watermarkResult.source)}`
        : '搜索完成'
    });
  } catch (error) {
    console.error('图片搜索失败:', error);
    res.status(500).json({ success: false, message: '搜索失败' });
  }
});

// 记录后续行为
router.post('/follow-up/:searchId', async (req, res) => {
  try {
    const { searchId } = req.params;
    const { action, productId } = req.body;
    
    await ImageSearch.findByIdAndUpdate(searchId, {
      hasFollowUp: true,
      followUpAction: action,
      followUpProductId: productId
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: '记录失败' });
  }
});

// 获取来源统计
router.get('/stats', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    
    // 按来源统计
    const sourceStats = await ImageSearch.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$detectedSource',
          count: { $sum: 1 },
          withFollowUp: { $sum: { $cond: ['$hasFollowUp', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    // 按渠道统计
    const channelStats = await ImageSearch.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$channel',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // 按日期统计趋势
    const trendStats = await ImageSearch.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            source: '$detectedSource'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);
    
    // 总计
    const total = await ImageSearch.countDocuments(matchQuery);
    
    res.json({
      success: true,
      data: {
        total,
        sourceStats: sourceStats.map(s => ({
          source: s._id,
          sourceName: getSourceName(s._id),
          count: s.count,
          followUpRate: s.count > 0 ? (s.withFollowUp / s.count * 100).toFixed(1) : 0
        })),
        channelStats,
        trendStats
      }
    });
  } catch (error) {
    console.error('获取统计失败:', error);
    res.status(500).json({ success: false, message: '获取统计失败' });
  }
});

// 获取搜索历史列表
router.get('/history', async (req, res) => {
  try {
    const { page = 1, limit = 20, source, channel } = req.query;
    
    const query = {};
    if (source) query.detectedSource = source;
    if (channel) query.channel = channel;
    
    const records = await ImageSearch.find(query)
      .populate('userId', 'nickname phone')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    const total = await ImageSearch.countDocuments(query);
    
    res.json({
      success: true,
      data: records,
      pagination: { page: parseInt(page), limit: parseInt(limit), total }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: '获取失败' });
  }
});

// 辅助函数：获取来源中文名
function getSourceName(source) {
  const names = {
    xiaohongshu: '小红书',
    douyin: '抖音',
    kuaishou: '快手',
    weibo: '微博',
    taobao: '淘宝/天猫',
    pinterest: 'Pinterest',
    unknown: '其他平台',
    none: '无水印'
  };
  return names[source] || source;
}

module.exports = router;
