const fs = require('fs');

try {
  if (fs.existsSync('./database.sqlite')) {
    fs.unlinkSync('./database.sqlite');
    console.log('✅ Database deleted successfully!');
  } else {
    console.log('ℹ️  No database.sqlite found (already deleted)');
  }
  console.log('🔄 Now restart your backend server to create fresh database with image support');
} catch (error) {
  console.error('❌ Error deleting database:', error.message);
}