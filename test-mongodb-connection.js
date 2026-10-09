const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://malgtps_db_user:4biOQqzfOwOM4QUI@cluster0.egt9qxq.mongodb.net/bscampus?retryWrites=true&w=majority";

async function testConnection() {
  const client = new MongoClient(uri);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    const db = client.db('bscampus');
    console.log('📦 Database:', db.databaseName);
    
    const collections = await db.listCollections().toArray();
    console.log('📂 Collections:', collections.length > 0 ? collections.map(c => c.name) : 'No collections yet');
    
    console.log('\n✅ MongoDB ready for password reset feature!');
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
