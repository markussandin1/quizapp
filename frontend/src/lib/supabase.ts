// @ts-ignore
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nghqzpsrvxnsrbllsrng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5naHF6cHNydnhuc3JibGxzcm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTk4MTQsImV4cCI6MjA2NDk5NTgxNH0.rFGIFSXgrR21rFjRm_mTb0Yp3FvbeRsyUVIzo9JDjoI';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Quiz API functions
export async function getQuizzes() {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function getQuiz(id: number) {
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .single();
  
  if (quizError) throw quizError;
  
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('quiz_id', id)
    .order('id');
  
  if (questionsError) throw questionsError;
  
  return { ...quiz, questions };
}

export async function getAllImages() {
  // Get images from quizzes
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('image_url')
    .not('image_url', 'is', null);
  
  // Get images from questions
  const { data: questions } = await supabase
    .from('questions')
    .select('image_url')
    .not('image_url', 'is', null);
  
  const images = new Set<string>();
  quizzes?.forEach((q: any) => q.image_url && images.add(q.image_url));
  questions?.forEach((q: any) => q.image_url && images.add(q.image_url));
  
  return Array.from(images);
}

export async function createQuiz(quizData: any) {
  const { title, description, image_url, questions } = quizData;
  
  // Insert quiz
  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .insert({ title, description, image_url })
    .select()
    .single();
  
  if (quizError) throw quizError;
  
  // Insert questions
  const questionsToInsert = questions.map((q: any) => ({
    quiz_id: quiz.id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options || null,
    correct_answer: q.correct_answer,
    explanation: q.explanation || null,
    image_url: q.image_url || null,
    article_url: q.article_url || null,
    time_limit: q.time_limit || 30,
    points: q.points || 1
  }));
  
  const { error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert);
  
  if (questionsError) throw questionsError;
  
  return quiz;
}

export async function updateQuiz(id: number, quizData: any) {
  const { title, description, image_url, questions } = quizData;
  
  // Update quiz
  const { error: quizError } = await supabase
    .from('quizzes')
    .update({ title, description, image_url })
    .eq('id', id);
  
  if (quizError) throw quizError;
  
  // Delete old questions
  const { error: deleteError } = await supabase
    .from('questions')
    .delete()
    .eq('quiz_id', id);
  
  if (deleteError) throw deleteError;
  
  // Insert new questions
  const questionsToInsert = questions.map((q: any) => ({
    quiz_id: id,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options || null,
    correct_answer: q.correct_answer,
    explanation: q.explanation || null,
    image_url: q.image_url || null,
    article_url: q.article_url || null,
    time_limit: q.time_limit || 30,
    points: q.points || 1
  }));
  
  const { error: questionsError } = await supabase
    .from('questions')
    .insert(questionsToInsert);
  
  if (questionsError) throw questionsError;
}

export async function deleteQuiz(id: number) {
  const { error } = await supabase
    .from('quizzes')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}