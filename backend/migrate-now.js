const sqlite3 = require('sqlite3').verbose();

// Försök hitta databasen
const possiblePaths = [
  './database.sqlite',
  '../database.sqlite', 
  './backend/database.sqlite',
  '/Users/marsan/Kod-projekt/quizapp/backend/database.sqlite'
];

function tryMigration(dbPath) {
  console.log(`Trying database at: ${dbPath}`);
  
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.log(`Failed to open ${dbPath}: ${err.message}`);
      return;
    }
    
    console.log(`✓ Connected to database at ${dbPath}`);
    
    // Lägg till image_url kolumn till quizzes
    db.run('ALTER TABLE quizzes ADD COLUMN image_url TEXT', (err) => {
      if (err && !err.message.includes('duplicate column')) {
        console.error('Error adding image_url to quizzes:', err.message);
      } else {
        console.log('✓ Added image_url column to quizzes table');
      }
      
      // Lägg till image_url kolumn till questions
      db.run('ALTER TABLE questions ADD COLUMN image_url TEXT', (err) => {
        if (err && !err.message.includes('duplicate column')) {
          console.error('Error adding image_url to questions:', err.message);
        } else {
          console.log('✓ Added image_url column to questions table');
        }
        
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('✅ Database migration completed successfully!');
          }
        });
      });
    });
  });
}

// Prova första sökvägen
tryMigration(possiblePaths[0]);