const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
  const User = require("./src/models/User");
  
  const edUser = await User.findOne({ username: "ed" }).lean();
  console.log("恩都用户信息:");
  console.log("- role:", edUser.role);
  console.log("- manufacturerId:", edUser.manufacturerId);
  
  const token = jwt.sign(
    { userId: edUser._id },
    process.env.JWT_SECRET || "xiaodi-secret-key",
    { expiresIn: "1h" }
  );
  
  // 测试 API
  const response = await fetch("https://pkochbpmcgaa.sealoshzh.site/api/orders?page=1&pageSize=10000", {
    headers: { "Authorization": "Bearer " + token }
  });
  
  console.log("\nAPI 响应:");
  console.log("- Status:", response.status);
  
  const data = await response.json();
  console.log("- Total:", data.pagination?.total);
  console.log("- Count:", data.data?.length);
  
  process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
