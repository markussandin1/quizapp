const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');

// Ta bort gamla databasen om den finns
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✓ Removed old database.sqlite');
} else {
  console.log('ℹ️  No existing database found');
}

console.log('✅ Database cleared! Server will create new schema with image support on next start.');
console.log('Please restart your backend server now.');