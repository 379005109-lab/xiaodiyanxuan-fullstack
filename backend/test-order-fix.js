const mongoose = require("mongoose");
require("dotenv").config();
const jwt = require('jsonwebtoken');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const User = require("./src/models/User");
  const Order = require("./src/models/Order");
  const ManufacturerOrder = require("./src/models/ManufacturerOrder");
  const { createOrder } = require("./src/services/orderService");
  
  // 获取恩都用户
  const edUser = await User.findOne({ username: 'ed' }).lean();
  if (!edUser) {
    console.log("未找到用户 ed");
    process.exit(1);
  }
  
  console.log("=== 测试用户信息 ===");
  console.log("用户ID:", edUser._id);
  console.log("用户名:", edUser.username);
  console.log("manufacturerId:", edUser.manufacturerId);
  
  // 模拟订单创建
  const testItems = [{
    productId: "69644fb829b97d03ce7617a4",
    productName: "测试商品",
    skuId: "test-sku",
    skuName: "测试SKU",
    quantity: 1,
    price: 100,
    subtotal: 100,
    manufacturerId: "69593aab361d49f2ea692fbf", // 柏胜的厂家ID
    manufacturerName: "柏胜"
  }];
  
  const recipient = {
    name: "测试收货人",
    phone: "13800138000",
    address: "测试地址"
  };
  
  console.log("\n=== 创建测试订单 ===");
  console.log("ownerManufacturerId (应该是恩都):", edUser.manufacturerId);
  
  try {
    const order = await createOrder(edUser._id, {
      items: testItems,
      recipient,
      couponCode: null,
      ownerManufacturerId: edUser.manufacturerId  // 关键：传入用户的 manufacturerId
    });
    
    console.log("\n=== 订单创建结果 ===");
    console.log("订单号:", order.orderNo);
    console.log("订单ID:", order._id);
    console.log("ownerManufacturerId:", order.ownerManufacturerId);
    
    // 检查厂家订单
    const mOrders = await ManufacturerOrder.find({ orderId: order._id }).lean();
    console.log("\n=== 厂家订单分配 ===");
    for (const mo of mOrders) {
      console.log("分配给厂家:", mo.manufacturerName, "ID:", mo.manufacturerId);
    }
    
    // 验证结果
    const ownerIdStr = order.ownerManufacturerId ? order.ownerManufacturerId.toString() : null;
    const userMfgIdStr = edUser.manufacturerId ? edUser.manufacturerId.toString() : null;
    
    if (ownerIdStr === userMfgIdStr) {
      console.log("\n✅ ownerManufacturerId 正确保存!");
    } else {
      console.log("\n❌ ownerManufacturerId 未正确保存!");
      console.log("期望:", userMfgIdStr);
      console.log("实际:", ownerIdStr);
    }
    
    // 检查分配是否正确
    if (mOrders.length > 0 && mOrders[0].manufacturerId) {
      const mOrderMfgIdStr = mOrders[0].manufacturerId.toString();
      if (mOrderMfgIdStr === userMfgIdStr) {
        console.log("✅ 订单正确分配给恩都!");
      } else {
        console.log("❌ 订单分配给了错误的厂家!");
        console.log("期望分配给恩都:", userMfgIdStr);
        console.log("实际分配给:", mOrderMfgIdStr);
      }
    }
    
  } catch (err) {
    console.error("订单创建失败:", err);
  }
  
  process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
