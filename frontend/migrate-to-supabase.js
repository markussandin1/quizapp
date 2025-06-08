const sqlite3 = require('sqlite3').verbose();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nghqzpsrvxnsrbllsrng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5naHF6cHNydnhuc3JibGxzcm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTk4MTQsImV4cCI6MjA2NDk5NTgxNH0.rFGIFSXgrR21rFjRm_mTb0Yp3FvbeRsyUVIzo9JDjoI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
  console.log('🚀 Starting migration from SQLite to Supabase...');

  // Connect to SQLite database
  const db = new sqlite3.Database('/Users/marsan/Kod-projekt/quizapp/backend/database.sqlite', (err) => {
    if (err) {
      console.error('Error opening SQLite database:', err.message);
      return;
    }
    console.log('✅ Connected to SQLite database');
  });

  try {
    // Get all quizzes from SQLite
    const quizzes = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM quizzes', [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    console.log(`📊 Found ${quizzes.length} quizzes to migrate`);

    // Migrate each quiz
    for (const quiz of quizzes) {
      console.log(`🔄 Migrating quiz: ${quiz.title}`);

      // Insert quiz into Supabase
      const { data: newQuiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          title: quiz.title,
          description: quiz.description,
          image_url: quiz.image_url,
          created_at: quiz.created_at
        })
        .select()
        .single();

      if (quizError) {
        console.error('Error inserting quiz:', quizError);
        continue;
      }

      // Get questions for this quiz from SQLite
      const questions = await new Promise((resolve, reject) => {
        db.all('SELECT * FROM questions WHERE quiz_id = ?', [quiz.id], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      console.log(`  📝 Found ${questions.length} questions`);

      // Insert questions into Supabase
      for (const question of questions) {
        const questionData = {
          quiz_id: newQuiz.id,
          question_text: question.question_text,
          question_type: question.question_type,
          options: question.options ? JSON.parse(question.options) : null,
          correct_answer: question.correct_answer,
          explanation: question.explanation,
          image_url: question.image_url,
          article_url: question.article_url,
          time_limit: question.time_limit,
          points: question.points
        };

        const { error: questionError } = await supabase
          .from('questions')
          .insert(questionData);

        if (questionError) {
          console.error('Error inserting question:', questionError);
        }
      }

      console.log(`✅ Quiz "${quiz.title}" migrated successfully`);
    }

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    db.close();
  }
}

migrateData();