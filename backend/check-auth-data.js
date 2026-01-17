const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const Authorization = require("./src/models/Authorization");
  const Manufacturer = require("./src/models/Manufacturer");
  
  const auths = await Authorization.find({ status: "active" })
    .sort({ createdAt: -1 })
    .limit(5)
    .select("fromManufacturer toManufacturer minDiscountRate commissionRate")
    .lean();
  
  console.log("=== 最近的授权记录 ===");
  for (const a of auths) {
    const fromMfg = await Manufacturer.findById(a.fromManufacturer).select("name fullName").lean();
    const toMfg = await Manufacturer.findById(a.toManufacturer).select("name fullName").lean();
    
    console.log("\n从:", fromMfg?.fullName || fromMfg?.name || "未知");
    console.log("到:", toMfg?.fullName || toMfg?.name || "未知");
    console.log("折扣:", a.minDiscountRate || "未设置");
    console.log("返佣:", a.commissionRate || "未设置");
  }
  
  process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
