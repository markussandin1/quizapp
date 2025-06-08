const fs = require('fs');
const path = require('path');

console.log('🔥 FORCE CLEANING - Removing database file completely...');

const dbPath = path.join(__dirname, 'database.sqlite');

try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    console.log('✅ Database file deleted successfully!');
  } else {
    console.log('ℹ️  No database file found.');
  }
  
  console.log('🎯 Database completely removed!');
  console.log('👉 Now restart your server - it will create a fresh empty database.');
  
} catch (error) {
  console.error('❌ Error deleting database:', error.message);
  console.log('💡 Try manually deleting the file: database.sqlite');
}