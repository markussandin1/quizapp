import sqlite3 from 'sqlite3';
import path from 'path';

export class DatabaseService {
  private db: sqlite3.Database;

  constructor() {
    const dbPath = path.join(__dirname, '../../database.sqlite');
    this.db = new sqlite3.Database(dbPath);
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            class_name TEXT NOT NULL,
            school TEXT NOT NULL,
            password_hash TEXT,
            role TEXT DEFAULT 'student',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        this.db.run(`
          CREATE TABLE IF NOT EXISTS quizzes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            created_by INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
          )
        `);

        this.db.run(`
          CREATE TABLE IF NOT EXISTS questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_id INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            question_type TEXT DEFAULT 'multiple_choice',
            options TEXT,
            correct_answer TEXT NOT NULL,
            explanation TEXT,
            image_url TEXT,
            article_url TEXT,
            time_limit INTEGER DEFAULT 30,
            points INTEGER DEFAULT 1,
            FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
          )
        `);

        this.db.run(`
          CREATE TABLE IF NOT EXISTS quiz_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            quiz_id INTEGER NOT NULL,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME,
            total_score INTEGER DEFAULT 0,
            max_score INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (quiz_id) REFERENCES quizzes (id)
          )
        `);

        this.db.run(`
          CREATE TABLE IF NOT EXISTS user_answers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            user_answer TEXT,
            is_correct BOOLEAN,
            answered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            time_taken INTEGER,
            FOREIGN KEY (session_id) REFERENCES quiz_sessions (id),
            FOREIGN KEY (question_id) REFERENCES questions (id)
          )
        `, (err) => {
          if (err) reject(err);
          else {
            console.log('Database initialized successfully');
            resolve();
          }
        });
      });
    });
  }

  getDatabase(): sqlite3.Database {
    return this.db;
  }
}