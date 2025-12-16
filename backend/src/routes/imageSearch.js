const express = require('express');
const router = express.Router();
const ImageSearch = require('../models/ImageSearch');
const Product = require('../models/Product');
const Category = require('../models/Category');
const FileService = require('../services/fileService');
const sharp = require('sharp');
const crypto = require('crypto');
const mongoose = require('mongoose');
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
                text: `请详细分析这张家具图片，返回JSON格式：
{
  "category": "家具类型，如：沙发、床、餐桌、椅子、柜子、茶几等",
  "color": "主要颜色，如：黑色、白色、灰色、棕色、米色等",
  "material": "主要材质，如：皮革、布艺、实木、金属等",
  "style": "风格，如：现代简约、北欧、中式、轻奢、工业风等",
  "shape": "外形特征描述，如：圆润、方正、流线型、模块化、L型、弧形等",
  "features": "独特设计特征，如：拉扣、车线、高靠背、低矮、厚垫、金属脚等",
  "seats": "座位数量，如：单人、双人、三人、四人、组合等",
  "keywords": ["尽可能多的视觉特征关键词，包括形状、纹理、设计元素等"]
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

const imageDHashCache = new Map();

function normalizeCategoryName(category) {
  if (!category || typeof category !== 'string') return '';
  const c = category.trim();
  const rules = [
    { re: /床/, value: '床' },
    { re: /沙发/, value: '沙发' },
    { re: /茶几/, value: '茶几' },
    { re: /餐桌|饭桌/, value: '餐桌' },
    { re: /椅|凳/, value: '椅' },
    { re: /柜|橱/, value: '柜' }
  ];
  for (const rule of rules) {
    if (rule.re.test(c)) return rule.value;
  }
  return c;
}

function base64ToBuffer(base64Data) {
  if (!base64Data || typeof base64Data !== 'string') return null;
  const cleaned = base64Data.includes('base64,') ? base64Data.split('base64,').pop() : base64Data;
  try {
    return Buffer.from(cleaned, 'base64');
  } catch (e) {
    return null;
  }
}

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function computeDHashFromBuffer(buffer) {
  const { data } = await sharp(buffer)
    .resize(9, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let hash = 0n;
  for (let y = 0; y < 8; y++) {
    const rowOffset = y * 9;
    for (let x = 0; x < 8; x++) {
      const left = data[rowOffset + x];
      const right = data[rowOffset + x + 1];
      hash = (hash << 1n) | (left > right ? 1n : 0n);
    }
  }
  return hash;
}

function hammingDistance64(a, b) {
  let x = a ^ b;
  let count = 0;
  while (x) {
    x &= (x - 1n);
    count++;
  }
  return count;
}

async function getImageDHashFromFileId(fileId) {
  if (!fileId || typeof fileId !== 'string') return null;
  const cached = imageDHashCache.get(fileId);
  if (cached !== undefined) return cached;
  try {
    if (mongoose.connection?.db) {
      const objectId = new mongoose.Types.ObjectId(fileId);
      const doc = await mongoose.connection.db
        .collection('uploads.files')
        .findOne({ _id: objectId }, { projection: { 'metadata.dhash': 1 } });
      if (doc?.metadata && Object.prototype.hasOwnProperty.call(doc.metadata, 'dhash')) {
        const v = doc.metadata.dhash;
        const persisted = typeof v === 'string' && v ? BigInt(v) : null;
        if (imageDHashCache.size > 5000) {
          const firstKey = imageDHashCache.keys().next().value;
          imageDHashCache.delete(firstKey);
        }
        imageDHashCache.set(fileId, persisted);
        return persisted;
      }
    }
  } catch (e) {
  }
  try {
    const fileData = await FileService.getFile(fileId);
    const buffer = await streamToBuffer(fileData.stream);
    const dhash = await computeDHashFromBuffer(buffer);
    try {
      if (mongoose.connection?.db) {
        const objectId = new mongoose.Types.ObjectId(fileId);
        await mongoose.connection.db.collection('uploads.files').updateOne(
          { _id: objectId },
          { $set: { 'metadata.dhash': dhash.toString(), 'metadata.dhashAlg': 'dhash64-v1' } }
        );
      }
    } catch (e) {
    }
    if (imageDHashCache.size > 5000) {
      const firstKey = imageDHashCache.keys().next().value;
      imageDHashCache.delete(firstKey);
    }
    imageDHashCache.set(fileId, dhash);
    return dhash;
  } catch (e) {
    try {
      if (mongoose.connection?.db) {
        const objectId = new mongoose.Types.ObjectId(fileId);
        await mongoose.connection.db.collection('uploads.files').updateOne(
          { _id: objectId },
          { $set: { 'metadata.dhash': null, 'metadata.dhashAlg': 'dhash64-v1' } }
        );
      }
    } catch (err) {
    }
    imageDHashCache.set(fileId, null);
    return null;
  }
}

async function mapLimit(items, limit, iterator) {
  const results = new Array(items.length);
  let idx = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (idx < items.length) {
      const current = idx++;
      results[current] = await iterator(items[current], current);
    }
  });
  await Promise.all(workers);
  return results;
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

    const uploadBuffer = imageData ? base64ToBuffer(imageData) : null;
    const uploadDHash = uploadBuffer ? await computeDHashFromBuffer(uploadBuffer).catch(() => null) : null;
    
    if (imageData) {
      imageAnalysis = await analyzeImageWithQwen(imageData);
      console.log('图片分析结果:', imageAnalysis);
    }

    if (imageAnalysis) {
      // 颜色关键词映射（支持部分匹配）
      const colorKeywords = {
        '黑色': ['黑', '黑色', 'black', '炭', '墨'],
        '白色': ['白', '白色', 'white', '米白', '象牙'],
        '灰色': ['灰', '灰色', 'gray', 'grey'],
        '棕色': ['棕', '棕色', 'brown', '咖', '咖啡', '胡桃'],
        '米色': ['米', '米色', 'beige', '奶', '杏'],
        '蓝色': ['蓝', '蓝色', 'blue'],
        '绿色': ['绿', '绿色', 'green'],
        '红色': ['红', '红色', 'red'],
        '黄色': ['黄', '黄色', 'yellow', '金'],
        '橙色': ['橙', '橙色', 'orange']
      };

      // 材质关键词映射
      const materialKeywords = {
        '皮革': ['皮', '皮革', '真皮', 'leather', '牛皮', '头层皮'],
        '布艺': ['布', '布艺', '绒', '麻', '棉', 'fabric'],
        '实木': ['木', '实木', '原木', 'wood', '胡桃', '橡木', '榉木'],
        '金属': ['金属', '铁', '钢', '铜', 'metal'],
        '玻璃': ['玻璃', 'glass'],
        '大理石': ['大理石', '石材', 'marble']
      };

      // 获取颜色的所有关键词
      const getColorKeywords = (color) => {
        for (const [key, values] of Object.entries(colorKeywords)) {
          if (key === color || values.includes(color)) {
            return values;
          }
        }
        return [color];
      };

      // 获取材质的所有关键词
      const getMaterialKeywords = (material) => {
        for (const [key, values] of Object.entries(materialKeywords)) {
          if (key === material || values.includes(material)) {
            return values;
          }
        }
        return [material];
      };

      const categoryExclusions = {
        '床': ['床头柜', '床边柜', '床头几', '床尾凳', '床垫'],
        '沙发': ['沙发凳', '沙发椅'],
        '椅': ['椅凳'],
        '桌': ['桌椅']
      };

      // 获取需要排除的关键词
      const getExclusions = (category) => {
        for (const [key, exclusions] of Object.entries(categoryExclusions)) {
          if (category.includes(key)) {
            return exclusions;
          }
        }
        return [];
      };

      // 先按分类搜索所有商品
      let products = [];
      if (imageAnalysis.category) {
        const category = normalizeCategoryName(imageAnalysis.category);
        const exclusions = getExclusions(category);

        const categoryRegex = new RegExp(category, 'i');
        const exclusionRegex = exclusions.length > 0 ? new RegExp(exclusions.join('|'), 'i') : null;

        const categoryQuery = {
          status: 'active',
          $and: [
            { name: categoryRegex },
            ...(exclusionRegex ? [{ name: { $not: exclusionRegex } }] : [])
          ]
        };

        const categoryDocs = await Category.find(categoryQuery).select('_id name');
        const categoryIds = categoryDocs.map(c => c._id);
        const categoryIdStrings = categoryIds.map(id => id.toString());

        const categoryMatchClauses = categoryIds.length > 0
          ? [
              { category: { $in: [...categoryIds, ...categoryIdStrings] } },
              { 'category._id': { $in: categoryIds } },
              { 'category.id': { $in: categoryIdStrings } }
            ]
          : [
              { name: categoryRegex },
              { description: categoryRegex }
            ];

        const productQuery = {
          status: 'active',
          $and: [
            { $or: categoryMatchClauses },
            ...(exclusionRegex
              ? [
                  { name: { $not: exclusionRegex } },
                  { description: { $not: exclusionRegex } }
                ]
              : [])
          ]
        };

        products = await Product.find(productQuery)
          .populate('category', 'name')
          .limit(200)
          .select('name images basePrice category styles materials description skus');
      }

      // 如果分类搜索没结果，搜索所有商品
      if (products.length === 0 && !imageAnalysis.category) {
        products = await Product.find({ status: 'active' })
          .populate('category', 'name')
          .limit(50)
          .select('name images basePrice category styles materials description skus');
      }

      console.log(`找到 ${products.length} 个候选商品`);

      // 获取搜索关键词
      const colorWords = imageAnalysis.color ? getColorKeywords(imageAnalysis.color) : [];
      const materialWords = imageAnalysis.material ? getMaterialKeywords(imageAnalysis.material) : [];
      
      // 收集所有分析关键词
      const allKeywords = [
        ...(imageAnalysis.keywords || []),
        imageAnalysis.shape,
        imageAnalysis.features,
        imageAnalysis.seats
      ].filter(k => k && typeof k === 'string').map(k => k.toLowerCase());

      console.log('分析关键词:', allKeywords);

      // 计算相似度分数
      const scoredProducts = products.map((p) => {
        let score = imageAnalysis.category ? 40 : 25;
        const productName = (p.name || '');
        const productDesc = (p.description || '');
        const productStyles = (p.styles || []);
        const skuInfo = JSON.stringify(p.skus || []);
        const fullText = `${productName} ${productDesc} ${skuInfo}`.toLowerCase();

        if (colorWords.length > 0) {
          const colorMatch = colorWords.some(c => fullText.includes(c.toLowerCase()));
          if (colorMatch) {
            score += 20;
          }
        }

        if (materialWords.length > 0) {
          const materialMatch = materialWords.some(m => fullText.includes(m.toLowerCase()));
          if (materialMatch) {
            score += 15;
          }
        }

        if (imageAnalysis.style) {
          const styleMatch = productStyles.some(s =>
            s.toLowerCase().includes(imageAnalysis.style.toLowerCase()) ||
            imageAnalysis.style.toLowerCase().includes(s.toLowerCase())
          );
          if (styleMatch) {
            score += 10;
          }
        }

        let keywordScore = 0;
        allKeywords.forEach(kw => {
          if (kw && fullText.includes(kw)) {
            keywordScore += 3;
          }
        });
        score += Math.min(15, keywordScore);

        const result = {
          productId: p._id,
          productName: p.name,
          similarity: Math.min(99, score),
          productImage: getImageUrl(p.images?.[0])
        };

        return { product: p, result };
      });

      matchedProducts = scoredProducts.map(sp => sp.result);

      if (uploadDHash) {
        const sortedForHash = scoredProducts
          .filter(sp => sp.product.images && sp.product.images.length > 0)
          .sort((a, b) => b.result.similarity - a.result.similarity);

        const maxCandidates = sortedForHash.length <= 80 ? sortedForHash.length : 60;
        const candidates = sortedForHash.slice(0, maxCandidates).map(sp => sp.product);

        const hashResults = await mapLimit(candidates, 6, async (p) => {
          const fileIds = Array.isArray(p.images) ? p.images.slice(0, 3) : [];
          let bestDist = null;

          for (const fileId of fileIds) {
            const dhash = await getImageDHashFromFileId(fileId);
            if (dhash === null) continue;
            const dist = hammingDistance64(uploadDHash, dhash);
            if (bestDist === null || dist < bestDist) bestDist = dist;
            if (bestDist === 0) break;
          }

          if (bestDist === null) return null;
          return { productId: p._id.toString(), dist: bestDist };
        });

        const validHashResults = hashResults.filter(Boolean).sort((a, b) => a.dist - b.dist);
        const best = validHashResults[0];

        if (best && best.dist <= 10) {
          const distById = new Map(validHashResults.map(r => [r.productId, r.dist]));
          matchedProducts = matchedProducts.map(mp => {
            const dist = distById.get(mp.productId.toString());
            if (dist === undefined) return mp;
            const boost = Math.max(0, 98 - dist * 4);
            return { ...mp, similarity: Math.max(mp.similarity, boost) };
          });
        }
      }

      // 按相似度排序
      matchedProducts.sort((a, b) => b.similarity - a.similarity);
      
      // 打印前6个结果
      console.log('匹配结果:', matchedProducts.slice(0, 6).map(p => `${p.productName}: ${p.similarity}%`));
      
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
