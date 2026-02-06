const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI || 'mongodb://root:g7d6ckdq@jianron-mongodb.ns-cxxiwxce.svc:27017/xiaodiyanxuan?authSource=admin';
mongoose.connect(uri).then(async function() {
  const Authorization = require('./src/models/Authorization');
  const doc = await Authorization.findById('6984f99508b221295a4cd766');
  console.log('Before:', JSON.stringify(doc.tierCommissionRuleSets));
  doc.tierCommissionRuleSets = [{name: 'test', rules: [{depth: 0, commissionRate: 0.1, description: ''}], partnerRules: []}];
  try {
    await doc.save();
    console.log('Save OK');
  } catch(e) {
    console.log('Save error:', e.message);
  }
  const doc2 = await Authorization.findById('6984f99508b221295a4cd766').lean();
  console.log('After save:', JSON.stringify(doc2.tierCommissionRuleSets));

  // Try raw updateOne
  const result = await Authorization.updateOne(
    {_id: '6984f99508b221295a4cd766'},
    {$set: {tierCommissionRuleSets: [{name: 'raw', rules: [{depth: 0, commissionRate: 0.2, description: ''}], partnerRules: []}]}}
  );
  console.log('updateOne result:', JSON.stringify(result));

  const doc3 = await Authorization.findById('6984f99508b221295a4cd766').lean();
  console.log('After updateOne:', JSON.stringify(doc3.tierCommissionRuleSets));

  // Try direct MongoDB
  const raw = await mongoose.connection.db.collection('authorizations').findOne(
    {_id: new mongoose.Types.ObjectId('6984f99508b221295a4cd766')},
    {projection: {tierCommissionRuleSets: 1}}
  );
  console.log('Raw MongoDB:', JSON.stringify(raw));

  process.exit(0);
}).catch(function(e) { console.error(e.message); process.exit(1); });
