const ConciergeSession = require('../models/ConciergeSession');
const crypto = require('crypto');

/**
 * 创建代客下单临时会话
 * POST /api/concierge/session
 */
exports.createSession = async (req, res) => {
  try {
    const { orderId, customerName, customerPhone, orderSource, items } = req.body;

    console.log('🛒 [Concierge] 创建临时会话', { orderId, customerName });

    // 生成唯一token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // 创建会话，10分钟后过期
    const session = await ConciergeSession.create({
      sessionToken,
      orderId,
      customerName,
      customerPhone,
      orderSource: orderSource || 'self',
      items,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10分钟
    });

    console.log('✅ [Concierge] 会话已创建', { sessionToken });

    res.json({
      success: true,
      data: {
        sessionToken
      }
    });
  } catch (error) {
    console.error('❌ [Concierge] 创建会话失败:', error);
    res.status(500).json({
      success: false,
      message: '创建会话失败',
      error: error.message
    });
  }
};

/**
 * 获取代客下单临时会话
 * GET /api/concierge/session/:token
 */
exports.getSession = async (req, res) => {
  try {
    const { token } = req.params;

    console.log('🛒 [Concierge] 获取会话', { token });

    const session = await ConciergeSession.findOne({
      sessionToken: token,
      expiresAt: { $gt: new Date() }
    });

    if (!session) {
      console.log('⚠️ [Concierge] 会话不存在或已过期');
      return res.status(404).json({
        success: false,
        message: '会话不存在或已过期'
      });
    }

    console.log('✅ [Concierge] 会话数据', {
      orderId: session.orderId,
      customerName: session.customerName
    });

    // 返回数据后删除会话（一次性使用）
    await ConciergeSession.deleteOne({ _id: session._id });
    console.log('🗑️ [Concierge] 会话已删除');

    res.json({
      success: true,
      data: {
        orderId: session.orderId,
        customerName: session.customerName,
        customerPhone: session.customerPhone,
        orderSource: session.orderSource,
        items: session.items
      }
    });
  } catch (error) {
    console.error('❌ [Concierge] 获取会话失败:', error);
    res.status(500).json({
      success: false,
      message: '获取会话失败',
      error: error.message
    });
  }
};
