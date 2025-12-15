const express = require('express');
const router = express.Router();
const ImageSearch = require('../models/ImageSearch');
const Product = require('../models/Product');
const crypto = require('crypto');
const axios = require('axios');

// 阿里云通义千问VL API配置
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY || '';
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// 使用通义千问VL分析图片
async function analyzeImageWithQwen(base64Image) {
  if (!DASHSCOPE_API_KEY) {
    console.warn('DASHSCOPE_API_KEY 未配置，使用备用方案');
    return null;
  }

  try {
    const response = await axios.post(
      DASHSCOPE_API_URL,
      {
        model: 'qwen-vl-plus',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              },
              {
                type: 'text',
                text: `请分析这张家具图片，返回JSON格式：
{
  "category": "家具类型，如：沙发、床、餐桌、椅子、柜子、茶几等",
  "color": "主要颜色，如：黑色、白色、灰色、棕色、米色等",
  "material": "主要材质，如：皮革、布艺、实木、金属等",
  "style": "风格，如：现代简约、北欧、中式、轻奢、工业风等",
  "keywords": ["关键词1", "关键词2", "关键词3"]
}
只返回JSON，不要其他内容。`
              }
            ]
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const content = response.data.choices?.[0]?.message?.content || '';
    // 尝试解析JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error('通义千问VL分析失败:', error.message);
    return null;
  }
}

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
    
    // 构建图片URL的辅助函数
    const getImageUrl = (imageId) => {
      if (!imageId) return '';
      if (imageId.startsWith('http')) return imageId;
      return `https://api.xiaodiyanxuan.com/api/files/${imageId}`;
    };

    // 使用通义千问VL分析图片
    let imageAnalysis = null;
    let matchedProducts = [];
    
    if (imageData) {
      imageAnalysis = await analyzeImageWithQwen(imageData);
      console.log('图片分析结果:', imageAnalysis);
    }

    if (imageAnalysis) {
      // 基于AI分析结果搜索商品
      const searchQuery = { status: 'active' };
      const searchKeywords = [];
      
      // 添加分类关键词
      if (imageAnalysis.category) {
        searchKeywords.push(imageAnalysis.category);
      }
      // 添加颜色关键词
      if (imageAnalysis.color) {
        searchKeywords.push(imageAnalysis.color);
      }
      // 添加材质关键词
      if (imageAnalysis.material) {
        searchKeywords.push(imageAnalysis.material);
      }
      // 添加风格关键词
      if (imageAnalysis.style) {
        searchKeywords.push(imageAnalysis.style);
      }
      // 添加其他关键词
      if (imageAnalysis.keywords && Array.isArray(imageAnalysis.keywords)) {
        searchKeywords.push(...imageAnalysis.keywords);
      }

      // 构建文本搜索条件
      if (searchKeywords.length > 0) {
        const keywordRegex = searchKeywords.map(k => new RegExp(k, 'i'));
        searchQuery.$or = [
          { name: { $in: keywordRegex } },
          { description: { $in: keywordRegex } },
          { 'category.name': { $in: keywordRegex } },
          { styles: { $in: searchKeywords } },
          { materials: { $in: searchKeywords } }
        ];
      }

      // 搜索匹配的商品
      let products = await Product.find(searchQuery)
        .populate('category', 'name')
        .limit(20)
        .select('name images basePrice category styles materials description');

      // 如果没有匹配结果，降级到分类匹配
      if (products.length === 0 && imageAnalysis.category) {
        const categoryRegex = new RegExp(imageAnalysis.category, 'i');
        products = await Product.find({
          status: 'active',
          $or: [
            { name: categoryRegex },
            { 'category.name': categoryRegex }
          ]
        })
          .populate('category', 'name')
          .limit(20)
          .select('name images basePrice category styles materials description');
      }

      // 如果还是没有结果，返回所有商品
      if (products.length === 0) {
        products = await Product.find({ status: 'active' })
          .limit(10)
          .select('name images basePrice category');
      }

      // 计算相似度分数
      matchedProducts = products.map((p) => {
        let score = 50; // 基础分
        const productName = (p.name || '').toLowerCase();
        const productDesc = (p.description || '').toLowerCase();
        const productStyles = (p.styles || []).map(s => s.toLowerCase());
        const productMaterials = (p.materials || []).map(m => m.toLowerCase());
        const categoryName = (p.category?.name || '').toLowerCase();

        // 分类匹配 +30分
        if (imageAnalysis.category && (
          productName.includes(imageAnalysis.category.toLowerCase()) ||
          categoryName.includes(imageAnalysis.category.toLowerCase())
        )) {
          score += 30;
        }

        // 颜色匹配 +10分
        if (imageAnalysis.color && (
          productName.includes(imageAnalysis.color.toLowerCase()) ||
          productDesc.includes(imageAnalysis.color.toLowerCase())
        )) {
          score += 10;
        }

        // 材质匹配 +10分
        if (imageAnalysis.material && (
          productName.includes(imageAnalysis.material.toLowerCase()) ||
          productMaterials.some(m => m.includes(imageAnalysis.material.toLowerCase()))
        )) {
          score += 10;
        }

        // 风格匹配 +10分
        if (imageAnalysis.style && (
          productStyles.some(s => s.includes(imageAnalysis.style.toLowerCase()))
        )) {
          score += 10;
        }

        return {
          productId: p._id,
          productName: p.name,
          similarity: Math.min(99, score),
          productImage: getImageUrl(p.images?.[0])
        };
      });

      // 按相似度排序
      matchedProducts.sort((a, b) => b.similarity - a.similarity);
      matchedProducts = matchedProducts.slice(0, 6);
    } else {
      // 备用方案：返回随机商品
      const products = await Product.find({ status: 'active' })
        .limit(6)
        .select('name images basePrice category');
      
      matchedProducts = products.map((p, idx) => ({
        productId: p._id,
        productName: p.name,
        similarity: Math.max(30, 80 - idx * 10),
        productImage: getImageUrl(p.images?.[0])
      }));
    }
    
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
