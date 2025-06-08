const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite');

const imageUrl = "https://static.bonniernews.se/ba/0d4e97cc-f8fc-48c5-adf4-6359c4c18d0b.jpg?crop=5888%2C3312%2Cx0%2Cy619&width=1400&format=pjpg&auto=webp";

db.run('UPDATE quizzes SET image_url = ? WHERE title LIKE "%Örnsköldsvik%"', [imageUrl], function(err) {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('✅ Updated quiz with image URL!');
    console.log('Rows changed:', this.changes);
  }
  
  db.close();
});