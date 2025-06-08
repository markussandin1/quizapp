const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🧹 Cleaning duplicate quizzes...');

db.serialize(() => {
  // First, let's see what we have
  db.all("SELECT id, title FROM quizzes ORDER BY id", (err, rows) => {
    if (err) {
      console.error('Error:', err);
      return;
    }
    
    console.log('Current quizzes:', rows);
    
    // Keep track of titles we've seen
    const seenTitles = new Set();
    const idsToDelete = [];
    
    // Find duplicates (keep the first occurrence, delete the rest)
    rows.forEach(row => {
      if (seenTitles.has(row.title)) {
        idsToDelete.push(row.id);
      } else {
        seenTitles.add(row.title);
      }
    });
    
    console.log('IDs to delete:', idsToDelete);
    
    if (idsToDelete.length > 0) {
      // Delete questions first (foreign key constraint)
      db.run(`DELETE FROM questions WHERE quiz_id IN (${idsToDelete.join(',')})`, (err) => {
        if (err) {
          console.error('Error deleting questions:', err);
          return;
        }
        
        // Then delete the quizzes
        db.run(`DELETE FROM quizzes WHERE id IN (${idsToDelete.join(',')})`, (err) => {
          if (err) {
            console.error('Error deleting quizzes:', err);
            return;
          }
          
          console.log(`✅ Deleted ${idsToDelete.length} duplicate quizzes!`);
          
          // Show remaining quizzes
          db.all("SELECT id, title FROM quizzes ORDER BY id", (err, remainingRows) => {
            if (err) {
              console.error('Error:', err);
              return;
            }
            
            console.log('Remaining quizzes:', remainingRows);
            console.log('✅ Database cleaned! Restart your server now.');
            db.close();
          });
        });
      });
    } else {
      console.log('✅ No duplicates found!');
      db.close();
    }
  });
});