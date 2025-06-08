// Vercel Function för quiz API
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

let db = null;

async function getDatabase() {
  if (!db) {
    db = await open({
      filename: '/tmp/quiz.db',
      driver: sqlite3.Database
    });
    
    // Skapa tabeller om de inte finns
    await db.exec(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quiz_id INTEGER NOT NULL,
        question_text TEXT NOT NULL,
        question_type TEXT NOT NULL,
        options TEXT,
        correct_answer TEXT NOT NULL,
        explanation TEXT,
        image_url TEXT,
        article_url TEXT,
        time_limit INTEGER DEFAULT 30,
        points INTEGER DEFAULT 1,
        FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
      );
    `);
  }
  return db;
}

export default async function handler(req, res) {
  const database = await getDatabase();
  
  if (req.method === 'GET') {
    if (req.url === '/api/quiz') {
      // Hämta alla quizzes
      const quizzes = await database.all('SELECT * FROM quizzes ORDER BY created_at DESC');
      return res.json(quizzes);
    }
    
    if (req.url.startsWith('/api/quiz/') && !req.url.includes('images')) {
      // Hämta specifikt quiz med frågor
      const id = req.url.split('/').pop();
      const quiz = await database.get('SELECT * FROM quizzes WHERE id = ?', [id]);
      
      if (!quiz) {
        return res.status(404).json({ error: 'Quiz not found' });
      }
      
      const questions = await database.all(
        'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id',
        [id]
      );
      
      // Parse options för multiple choice frågor
      questions.forEach(question => {
        if (question.options) {
          question.options = JSON.parse(question.options);
        }
      });
      
      quiz.questions = questions;
      return res.json(quiz);
    }
    
    if (req.url === '/api/quiz/images/all') {
      // Hämta alla bilder
      const images = new Set();
      
      const quizImages = await database.all(
        'SELECT image_url FROM quizzes WHERE image_url IS NOT NULL AND image_url != ""'
      );
      quizImages.forEach(row => images.add(row.image_url));
      
      const questionImages = await database.all(
        'SELECT image_url FROM questions WHERE image_url IS NOT NULL AND image_url != ""'
      );
      questionImages.forEach(row => images.add(row.image_url));
      
      return res.json(Array.from(images));
    }
  }
  
  if (req.method === 'POST' && req.url === '/api/quiz/create') {
    // Skapa nytt quiz
    const { title, description, image_url, questions } = req.body;
    
    const result = await database.run(
      'INSERT INTO quizzes (title, description, image_url) VALUES (?, ?, ?)',
      [title, description || null, image_url || null]
    );
    
    const quizId = result.lastID;
    
    // Lägg till frågor
    for (const question of questions) {
      const options = question.options ? JSON.stringify(question.options) : null;
      
      await database.run(
        `INSERT INTO questions (
          quiz_id, question_text, question_type, options, correct_answer,
          explanation, image_url, article_url, time_limit, points
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          quizId,
          question.question_text,
          question.question_type,
          options,
          question.correct_answer,
          question.explanation || null,
          question.image_url || null,
          question.article_url || null,
          question.time_limit || 30,
          question.points || 1
        ]
      );
    }
    
    return res.json({ id: quizId, message: 'Quiz created successfully' });
  }
  
  return res.status(404).json({ error: 'Not found' });
}