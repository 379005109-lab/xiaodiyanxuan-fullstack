const mongoose = require('mongoose');
require('./src/models/Authorization');
require('./src/models/Manufacturer');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Authorization = mongoose.model('Authorization');
  const Manufacturer = mongoose.model('Manufacturer');
  
  const auth = await Authorization.findOne().lean();
  console.log('Auth sample:', JSON.stringify({
    scope: auth?.scope,
    productsCount: auth?.products?.length,
    minDiscountRate: auth?.minDiscountRate,
    commissionRate: auth?.commissionRate
  }));
  
  const mfr = await Manufacturer.findOne().select('defaultDiscount defaultCommission name').lean();
  console.log('Manufacturer defaults:', JSON.stringify(mfr));
  
  process.exit(0);
}).catch(e => { console.error(e); process.exit(1); });
