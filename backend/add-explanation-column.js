const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('📊 Adding explanation column to questions table...');

db.serialize(() => {
  // Add the explanation column
  db.run("ALTER TABLE questions ADD COLUMN explanation TEXT", (err) => {
    if (err) {
      if (err.message.includes('duplicate column name')) {
        console.log('✅ Explanation column already exists');
      } else {
        console.error('❌ Error adding column:', err.message);
      }
    } else {
      console.log('✅ Explanation column added successfully');
    }
    
    // Verify the table structure
    db.all("PRAGMA table_info(questions)", (err, rows) => {
      if (err) {
        console.error('Error checking table structure:', err);
      } else {
        console.log('\n📋 Current questions table structure:');
        rows.forEach(row => {
          console.log(`  - ${row.name}: ${row.type}`);
        });
      }
      
      db.close();
    });
  });
});