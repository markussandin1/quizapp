const fs = require('fs');
const path = require('path');

// Remove the database file to start fresh
const dbPath = path.join(__dirname, 'database.sqlite');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️  Database deleted successfully!');
} else {
  console.log('ℹ️  No database file found to delete.');
}

console.log('✅ Ready to start with a clean database. Run "npm run dev" now.');