const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🗑️  Deleting all quizzes and questions...');

db.serialize(() => {
  // Delete all questions first (foreign key constraint)
  db.run("DELETE FROM questions", (err) => {
    if (err) {
      console.error('Error deleting questions:', err);
      return;
    }
    
    console.log('✅ All questions deleted');
    
    // Then delete all quizzes
    db.run("DELETE FROM quizzes", (err) => {
      if (err) {
        console.error('Error deleting quizzes:', err);
        return;
      }
      
      console.log('✅ All quizzes deleted');
      
      // Reset the auto-increment counters
      db.run("DELETE FROM sqlite_sequence WHERE name='quizzes' OR name='questions'", (err) => {
        if (err) {
          console.error('Error resetting counters:', err);
        } else {
          console.log('✅ ID counters reset');
        }
        
        // Verify everything is clean
        db.all("SELECT COUNT(*) as count FROM quizzes", (err, rows) => {
          if (err) {
            console.error('Error:', err);
          } else {
            console.log(`📊 Quizzes remaining: ${rows[0].count}`);
            console.log('✅ Database is now completely clean!');
            console.log('👉 Ready for new quiz data.');
          }
          
          db.close();
        });
      });
    });
  });
});