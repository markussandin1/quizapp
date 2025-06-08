const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Connected to SQLite database');
});

console.log('Adding image URL columns to database tables...');

// Add image_url column to quizzes table for cover images
db.run('ALTER TABLE quizzes ADD COLUMN image_url TEXT', (err) => {
  if (err && !err.message.includes('duplicate column')) {
    console.error('Error adding image_url to quizzes:', err.message);
  } else {
    console.log('✓ Added image_url column to quizzes table (or already exists)');
  }
  
  // Add image_url column to questions table for question images  
  db.run('ALTER TABLE questions ADD COLUMN image_url TEXT', (err) => {
    if (err && !err.message.includes('duplicate column')) {
      console.error('Error adding image_url to questions:', err.message);
    } else {
      console.log('✓ Added image_url column to questions table (or already exists)');
    }
    
    // Close database connection
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database migration completed successfully!');
      }
    });
  });
});