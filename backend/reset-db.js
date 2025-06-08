const fs = require('fs');

const dbPath = './database.sqlite';

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✓ Removed old database.sqlite');
} else {
  console.log('ℹ️  No database.sqlite found');
}

console.log('✅ Database cleared! Restart your server to create new schema with image_url and article_url support.');