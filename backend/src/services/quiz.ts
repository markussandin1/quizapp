import fs from 'fs';
import { DatabaseService } from './database';

export interface Question {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  image_url?: string;
  article_url?: string;
  time_limit?: number;
  points?: number;
}

export interface Quiz {
  title: string;
  description?: string;
  image_url?: string;
  questions: Question[];
}

export class QuizService {
  private dbService: DatabaseService;

  constructor() {
    this.dbService = new DatabaseService();
  }

  async uploadQuizFromFile(filePath: string): Promise<{ quizId: number }> {
    try {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const quizData = JSON.parse(fileContent);
      
      this.validateQuizData(quizData);
      
      const result = await this.createQuiz(quizData);
      
      fs.unlinkSync(filePath);
      
      return result;
    } catch (error) {
      fs.existsSync(filePath) && fs.unlinkSync(filePath);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to process quiz file: ${errorMessage}`);
    }
  }

  private validateQuizData(data: any): void {
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Quiz must have a valid title');
    }
    
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      throw new Error('Quiz must have at least one question');
    }
    
    data.questions.forEach((question: any, index: number) => {
      if (!question.question_text || typeof question.question_text !== 'string') {
        throw new Error(`Question ${index + 1} must have valid question text`);
      }
      
      if (!question.correct_answer) {
        throw new Error(`Question ${index + 1} must have a correct answer`);
      }
      
      if (question.question_type === 'multiple_choice' && (!question.options || !Array.isArray(question.options))) {
        throw new Error(`Question ${index + 1} must have options for multiple choice`);
      }
    });
  }

  async createQuiz(quizData: Quiz): Promise<{ quizId: number }> {
    const db = this.dbService.getDatabase();
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        db.run(
          'INSERT INTO quizzes (title, description, image_url) VALUES (?, ?, ?)',
          [quizData.title, quizData.description || '', quizData.image_url || null],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            const quizId = this.lastID;
            let questionsProcessed = 0;
            
            quizData.questions.forEach((question, index) => {
              const options = question.options ? JSON.stringify(question.options) : null;
              
              db.run(
                `INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer, explanation, image_url, article_url, time_limit, points) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                  quizId,
                  question.question_text,
                  question.question_type || 'multiple_choice',
                  options,
                  question.correct_answer,
                  question.explanation || null,
                  question.image_url || null,
                  question.article_url || null,
                  question.time_limit || 30,
                  question.points || 1
                ],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }
                  
                  questionsProcessed++;
                  if (questionsProcessed === quizData.questions.length) {
                    db.run('COMMIT', (err) => {
                      if (err) {
                        reject(err);
                      } else {
                        resolve({ quizId });
                      }
                    });
                  }
                }
              );
            });
          }
        );
      });
    });
  }

  async getQuiz(quizId: number): Promise<any> {
    const db = this.dbService.getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM quizzes WHERE id = ?', [quizId], (err, quiz) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!quiz) {
          reject(new Error('Quiz not found'));
          return;
        }
        
        db.all('SELECT * FROM questions WHERE quiz_id = ? ORDER BY id', [quizId], (err, questions) => {
          if (err) {
            reject(err);
            return;
          }
          
          const formattedQuestions = questions.map((q: any) => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : null
          }));
          
          resolve({
            ...quiz,
            questions: formattedQuestions
          });
        });
      });
    });
  }

  async getAllQuizzes(): Promise<any[]> {
    const db = this.dbService.getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all('SELECT id, title, description, image_url, created_at FROM quizzes ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async quizExistsByTitle(title: string): Promise<boolean> {
    const db = this.dbService.getDatabase();
    
    return new Promise((resolve, reject) => {
      db.get('SELECT id FROM quizzes WHERE title = ?', [title], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(!!row);
        }
      });
    });
  }

  async getAllQuizzesWithQuestions(): Promise<any[]> {
    const db = this.dbService.getDatabase();
    
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM quizzes ORDER BY created_at DESC', [], (err, quizzes) => {
        if (err) {
          reject(err);
          return;
        }
        
        const quizzesWithQuestions = Promise.all(
          quizzes.map(async (quiz: any) => {
            return new Promise((resolveQuiz, rejectQuiz) => {
              db.all('SELECT * FROM questions WHERE quiz_id = ? ORDER BY id', [quiz.id], (err, questions) => {
                if (err) {
                  rejectQuiz(err);
                  return;
                }
                
                const formattedQuestions = questions.map((q: any) => ({
                  ...q,
                  options: q.options ? JSON.parse(q.options) : null
                }));
                
                resolveQuiz({
                  ...quiz,
                  questions: formattedQuestions
                });
              });
            });
          })
        );
        
        quizzesWithQuestions.then(resolve).catch(reject);
      });
    });
  }

  async updateQuiz(quizId: number, quizData: Quiz): Promise<void> {
    const db = this.dbService.getDatabase();
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Update quiz metadata
        db.run(
          'UPDATE quizzes SET title = ?, description = ?, image_url = ? WHERE id = ?',
          [quizData.title, quizData.description || '', quizData.image_url || null, quizId],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            // Delete existing questions
            db.run('DELETE FROM questions WHERE quiz_id = ?', [quizId], (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }
              
              // Insert updated questions
              let questionsProcessed = 0;
              
              if (quizData.questions.length === 0) {
                db.run('COMMIT', (err) => {
                  if (err) reject(err);
                  else resolve();
                });
                return;
              }
              
              quizData.questions.forEach((question) => {
                const options = question.options ? JSON.stringify(question.options) : null;
                
                db.run(
                  `INSERT INTO questions (quiz_id, question_text, question_type, options, correct_answer, explanation, image_url, article_url, time_limit, points) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                  [
                    quizId,
                    question.question_text,
                    question.question_type || 'multiple_choice',
                    options,
                    question.correct_answer,
                    question.explanation || null,
                    question.image_url || null,
                    question.article_url || null,
                    question.time_limit || 30,
                    question.points || 1
                  ],
                  (err) => {
                    if (err) {
                      db.run('ROLLBACK');
                      reject(err);
                      return;
                    }
                    
                    questionsProcessed++;
                    if (questionsProcessed === quizData.questions.length) {
                      db.run('COMMIT', (err) => {
                        if (err) reject(err);
                        else resolve();
                      });
                    }
                  }
                );
              });
            });
          }
        );
      });
    });
  }

  async deleteQuiz(quizId: number): Promise<void> {
    const db = this.dbService.getDatabase();
    
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        
        // Delete questions first
        db.run('DELETE FROM questions WHERE quiz_id = ?', [quizId], (err) => {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }
          
          // Delete quiz
          db.run('DELETE FROM quizzes WHERE id = ?', [quizId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }
            
            db.run('COMMIT', (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        });
      });
    });
  }

  async deleteQuestion(questionId: number): Promise<void> {
    const db = this.dbService.getDatabase();
    
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM questions WHERE id = ?', [questionId], (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}