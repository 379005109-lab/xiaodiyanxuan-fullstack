const mongoose = require('mongoose');
require('dotenv').config();

async function checkManufacturers() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Manufacturer = require('../src/models/Manufacturer');
  const all = await Manufacturer.find({ status: 'active' }).select('_id name shortName').lean();
  
  console.log('活跃厂家数:', all.length);
  all.forEach(m => console.log(m._id, '|', m.name, '|', m.shortName));
  
  process.exit(0);
}

checkManufacturers().catch(e => { console.error(e); process.exit(1); });
