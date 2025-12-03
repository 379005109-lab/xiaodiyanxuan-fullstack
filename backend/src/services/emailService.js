const nodemailer = require('nodemailer');

// 从环境变量读取邮箱配置
const EMAIL_USER = process.env.EMAIL_USER || '379005109@qq.com';
const EMAIL_PASS = process.env.EMAIL_PASS || ''; // 必须从环境变量设置
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || EMAIL_USER;

// QQ 邮箱 SMTP 配置
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true, // 使用 SSL
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// 检查邮箱配置
if (!EMAIL_PASS) {
  console.warn('⚠️ 邮件服务未配置：请设置 EMAIL_PASS 环境变量');
}

// 发送邮件的通用方法
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"小迪严选" <${EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('📧 邮件发送成功:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ 邮件发送失败:', error);
    return { success: false, error: error.message };
  }
};

// 新订单通知邮件
const sendNewOrderNotification = async (order) => {
  const items = order.items || [];
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName || item.name || '商品'}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">¥${(item.price || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🎉 新订单通知</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">您有一个新订单需要处理</p>
      </div>
      
      <div style="background: #fff; border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #333; font-size: 18px; margin-top: 0;">📋 订单信息</h2>
        
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #666;">订单编号：</td>
            <td style="padding: 8px 0; font-weight: bold;">${order.orderNumber || order._id}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">下单时间：</td>
            <td style="padding: 8px 0;">${new Date(order.createdAt).toLocaleString('zh-CN')}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">订单金额：</td>
            <td style="padding: 8px 0; font-size: 20px; color: #e53935; font-weight: bold;">¥${(order.totalAmount || 0).toFixed(2)}</td>
          </tr>
        </table>

        <h2 style="color: #333; font-size: 18px;">👤 客户信息</h2>
        <table style="width: 100%; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px 0; color: #666;">收货人：</td>
            <td style="padding: 8px 0; font-weight: bold;">${order.recipient?.name || order.shippingAddress?.name || '未知'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">联系电话：</td>
            <td style="padding: 8px 0; font-weight: bold;">${order.recipient?.phone || order.shippingAddress?.phone || '未知'}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #666;">收货地址：</td>
            <td style="padding: 8px 0;">${order.recipient?.address || order.shippingAddress?.fullAddress || order.shippingAddress?.address || '未知'}</td>
          </tr>
        </table>

        <h2 style="color: #333; font-size: 18px;">📦 商品清单</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f5f5f5;">
              <th style="padding: 10px; text-align: left;">商品名称</th>
              <th style="padding: 10px; text-align: center;">数量</th>
              <th style="padding: 10px; text-align: right;">单价</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="text-align: center; margin-top: 30px;">
          <a href="https://xiaodiyanxuan.com/admin/orders" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            立即处理订单
          </a>
        </div>

        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
          此邮件由系统自动发送，请勿直接回复
        </p>
      </div>
    </div>
  `;

  return sendEmail(ADMIN_EMAIL, `【新订单】${order.orderNumber || '订单'} - ¥${(order.totalAmount || 0).toFixed(2)}`, html);
};

// 订单状态更新通知（发给客户）
const sendOrderStatusNotification = async (order, customerEmail) => {
  if (!customerEmail) return { success: false, error: '无客户邮箱' };

  const statusMap = {
    'pending': '待付款',
    'paid': '已付款，等待发货',
    'shipped': '已发货',
    'completed': '已完成',
    'cancelled': '已取消',
    'refunding': '退款中',
    'refunded': '已退款'
  };

  const status = statusMap[order.status] || order.status;

  const html = `
    <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #667eea; color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0;">小迪严选</h1>
      </div>
      <div style="background: #fff; border: 1px solid #e0e0e0; border-top: none; padding: 20px; border-radius: 0 0 10px 10px;">
        <h2>订单状态更新</h2>
        <p>您的订单 <strong>${order.orderNumber}</strong> 状态已更新为：</p>
        <p style="font-size: 24px; color: #667eea; font-weight: bold;">${status}</p>
        
        ${order.status === 'shipped' ? `
          <p>物流单号：<strong>${order.trackingNumber || '暂无'}</strong></p>
          <p>物流公司：<strong>${order.shippingCompany || '暂无'}</strong></p>
        ` : ''}
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="https://xiaodiyanxuan.com/orders" 
             style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            查看订单详情
          </a>
        </div>
      </div>
    </div>
  `;

  return sendEmail(customerEmail, `【小迪严选】订单状态更新 - ${status}`, html);
};

// 测试邮件连接
const testConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ 邮件服务连接成功');
    return true;
  } catch (error) {
    console.error('❌ 邮件服务连接失败:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  sendNewOrderNotification,
  sendOrderStatusNotification,
  testConnection,
  ADMIN_EMAIL
};
