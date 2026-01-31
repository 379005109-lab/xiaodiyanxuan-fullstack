const mongoose = require('mongoose');
require('./src/models/Authorization');
require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xiaodiyanxuan').then(async () => {
  const Authorization = mongoose.model('Authorization');
  const User = mongoose.model('User');
  
;IIIIIID (假设是zcd)
  const user = await User.findOne({ username: 'zcd' }).select('manufacturerId').lean();
  console.log('User manufacturerId:', user?.manufacturerId);
  
  if (user?.manufacturerId) {
    // 获取该厂家授权给别人的所有记录
    const auths = await Authorization.find({ fromManufacturer: user.manufacturerId })
      .select('_id status toManufacturer toDesigner authorizationType')
      .populate('toManufacturer', 'name')
      .populate('toDesigner', 'nickname username')
      .lean();
    
    console.log('Total authorizations from this manufacturer:', auths.length);
    console.log('By status:');
    const byStatus = {};
    auths.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
    });
    console.log(JSON.stringify(byStatus));
    
    console.log('\nAll authorizations:');
    auths.forEach((a, i) => {
      const target = a.toDesigner?.nickname || a.toDesigner?.username || a.toManufacturer?.name || 'unknown';
      console.log(`${i+1}. ${target} - ${a.status} (${a.authorizationType})`);
    });
  }
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
