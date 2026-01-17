// 更新现有订单的定金和尾款字段
const mongoose = require('mongoose');
require('dotenv').config();

const OrderSchema = new mongoose.Schema({}, { strict: false });
const Order = mongoose.model('Order', OrderSchema);

async function updateOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // 查找所有返佣模式订单
    const orders = await Order.find({ 
      settlementMode: 'commission_mode'
    });
    
    console.log('找到返佣模式订单:', orders.length);
    
    let updated = 0;
    for (const order of orders) {
      const total = order.minDiscountPrice || order.totalAmount || 0;
      const ratio = order.paymentRatio || 50;
      const depositAmt = Math.round(total * ratio / 100);
      const finalAmt = total - depositAmt;
      
      if (!order.depositAmount || order.depositAmount === 0) {
        await Order.updateOne(
          { _id: order._id },
          { 
            $set: { 
              paymentRatioEnabled: true,
              depositAmount: depositAmt,
              finalPaymentAmount: finalAmt
            }
          }
        );
        console.log(`更新订单 ${order.orderNo}: 定金=${depositAmt}, 尾款=${finalAmt}`);
        updated++;
      }
    }
    
    console.log(`更新完成，共更新 ${updated} 个订单`);
    process.exit(0);
  } catch (error) {
    console.error('更新失败:', error.message);
    process.exit(1);
  }
}

updateOrders();
