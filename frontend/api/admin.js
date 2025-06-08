// Vercel Function för admin API
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

let db = null;

async function getDatabase() {
  if (!db) {
    db = await open({
      filename: '/tmp/quiz.db',
      driver: sqlite3.Database
    });
  }
  return db;
}

function checkAdminAuth(req) {
  const adminKey = req.headers['admin-key'];
  return adminKey === 'quiz-admin-2024';
}

export default async function handler(req, res) {
  if (!checkAdminAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const database = await getDatabase();
  
  if (req.method === 'GET' && req.url === '/api/admin/quizzes') {
    // Hämta alla quizzes med frågor för admin
    const quizzes = await database.all('SELECT * FROM quizzes ORDER BY created_at DESC');
    
    for (const quiz of quizzes) {
      const questions = await database.all(
        'SELECT * FROM questions WHERE quiz_id = ? ORDER BY id',
        [quiz.id]
      );
      
      questions.forEach(question => {
        if (question.options) {
          question.options = JSON.parse(question.options);
        }
      });
      
      quiz.questions = questions;
    }
    
    return res.json(quizzes);
  }
  
  if (req.method === 'PUT' && req.url.startsWith('/api/admin/quiz/')) {
    // Uppdatera quiz
    const id = req.url.split('/').pop();
    const { title, description, image_url, questions } = req.body;
    
    // Uppdatera quiz metadata
    await database.run(
      'UPDATE quizzes SET title = ?, description = ?, image_url = ? WHERE id = ?',
      [title, description || null, image_url || null, id]
    );
    
    // Ta bort gamla frågor
    await database.run('DELETE FROM questions WHERE quiz_id = ?', [id]);
    
    // Lägg till nya frågor
    for (const question of questions) {
      const options = question.options ? JSON.stringify(question.options) : null;
      
      await database.run(
        `INSERT INTO questions (
          quiz_id, question_text, question_type, options, correct_answer,
          explanation, image_url, article_url, time_limit, points
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
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
    
    return res.json({ message: 'Quiz updated successfully' });
  }
  
  if (req.method === 'DELETE' && req.url.startsWith('/api/admin/quiz/')) {
    // Ta bort quiz
    const id = req.url.split('/').pop();
    
    await database.run('DELETE FROM questions WHERE quiz_id = ?', [id]);
    await database.run('DELETE FROM quizzes WHERE id = ?', [id]);
    
    return res.json({ message: 'Quiz deleted successfully' });
  }
  
  return res.status(404).json({ error: 'Not found' });
}