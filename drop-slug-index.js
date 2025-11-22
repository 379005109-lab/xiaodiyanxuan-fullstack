const mongoose = require('mongoose');
const uri = process.env.MONGODB_URI;

async function dropSlugIndex() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const collection = db.collection('categories');
    
    console.log('Dropping slug_1 index...');
    await collection.dropIndex('slug_1');
    console.log('SUCCESS: Dropped slug_1 index');
    
    const indexes = await collection.indexes();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    process.exit(0);
  } catch (err) {
    console.log('WARNING:', err.message);
    process.exit(0);
  }
}

dropSlugIndex();
