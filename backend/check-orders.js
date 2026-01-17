const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const Order = require("./src/models/Order");
  const User = require("./src/models/User");
  
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(3)
    .select("orderNo ownerManufacturerId createdAt userId")
    .lean();
  
  console.log("=== 最新订单详情 ===");
  for (const o of orders) {
    const user = await User.findById(o.userId).select("username manufacturerId").lean();
    console.log("订单号:", o.orderNo);
    console.log("创建时间:", o.createdAt);
    console.log("下单用户:", user ? user.username : "未知");
    console.log("用户manufacturerId:", user ? user.manufacturerId : "无");
    console.log("订单ownerManufacturerId:", o.ownerManufacturerId || "未设置");
    console.log("---");
  }
  
  process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
