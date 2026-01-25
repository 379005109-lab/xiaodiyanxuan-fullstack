const ProductReview = require('../models/ProductReview');
const Product = require('../models/Product');
const Order = require('../models/Order');

// 获取商品评价列表
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const reviews = await ProductReview.find({
      productId,
      isApproved: true,
      isVisible: true
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await ProductReview.countDocuments({
      productId,
      isApproved: true,
      isVisible: true
    });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取商品评价失败:', error);
    res.status(500).json({ message: '获取评价失败', error: error.message });
  }
};

// 创建评价（用户购买后）
exports.createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { orderId, rating, content, images, videos, skuId, skuSpec } = req.body;
    const userId = req.user._id;

    // 验证订单是否存在且属于该用户
    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        userId,
        status: { $in: ['completed', 'delivered'] }
      });
      if (!order) {
        return res.status(400).json({ message: '订单不存在或未完成' });
      }

      // 检查是否已评价
      const existingReview = await ProductReview.findOne({ orderId, productId, userId });
      if (existingReview) {
        return res.status(400).json({ message: '该商品已评价' });
      }
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '商品不存在' });
    }

    const review = new ProductReview({
      productId,
      orderId,
      userId,
      userName: req.user.nickname || req.user.username || '匿名用户',
      rating: rating || 5,
      content,
      images: images || [],
      videos: videos || [],
      skuId,
      skuSpec,
      manufacturerId: product.manufacturerId,
      isApproved: true // 默认自动审核通过，可根据需求改为false
    });

    await review.save();

    res.status(201).json({
      message: '评价成功',
      review
    });
  } catch (error) {
    console.error('创建评价失败:', error);
    res.status(500).json({ message: '创建评价失败', error: error.message });
  }
};

// 获取用户的评价列表
exports.getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const reviews = await ProductReview.find({ userId })
      .populate('productId', 'name images')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await ProductReview.countDocuments({ userId });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取用户评价失败:', error);
    res.status(500).json({ message: '获取评价失败', error: error.message });
  }
};

// 管理员：获取所有评价（待审核）
exports.getAllReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20, isApproved, productId, manufacturerId } = req.query;

    const query = {};
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';
    if (productId) query.productId = productId;
    if (manufacturerId) query.manufacturerId = manufacturerId;

    const reviews = await ProductReview.find(query)
      .populate('productId', 'name images')
      .populate('userId', 'nickname username')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await ProductReview.countDocuments(query);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('获取评价列表失败:', error);
    res.status(500).json({ message: '获取评价失败', error: error.message });
  }
};

// 管理员：审核评价
exports.approveReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const review = await ProductReview.findByIdAndUpdate(
      reviewId,
      { isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: '评价不存在' });
    }

    res.json({ message: '审核成功', review });
  } catch (error) {
    console.error('审核评价失败:', error);
    res.status(500).json({ message: '审核失败', error: error.message });
  }
};

// 商家回复评价
exports.replyReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;

    const review = await ProductReview.findByIdAndUpdate(
      reviewId,
      { reply, replyAt: new Date() },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: '评价不存在' });
    }

    res.json({ message: '回复成功', review });
  } catch (error) {
    console.error('回复评价失败:', error);
    res.status(500).json({ message: '回复失败', error: error.message });
  }
};
