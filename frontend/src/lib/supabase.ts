// @ts-ignore
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nghqzpsrvxnsrbllsrng.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5naHF6cHNydnhuc3JibGxzcm5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MTk4MTQsImV4cCI6MjA2NDk5NTgxNH0.rFGIFSXgrR21rFjRm_mTb0Yp3FvbeRsyUVIzo9JDjoI';

// Singleton pattern för Supabase client
let supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

// Quiz API functions
export async function getQuizzes() {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    // Get questions for each quiz
    if (quizzes) {
      for (const quiz of quizzes) {
        const { data: questions } = await supabase
          .from('questions')
          .select('*')
          .eq('quiz_id', quiz.id)
          .order('id');
        
        quiz.questions = questions || [];
      }
    }
    
    return quizzes || [];
  } catch (err) {
    console.error('getQuizzes error:', err);
    throw err;
  }
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

// ===============================
// CLASSROOM MODE API FUNCTIONS
// ===============================

// Generera unik 6-siffrig sessionskod
async function generateSessionCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Kontrollera om koden redan finns
    const { data } = await supabase
      .from('quiz_sessions')
      .select('session_code')
      .eq('session_code', code)
      .eq('is_active', true);
    
    if (!data || data.length === 0) {
      return code;
    }
    
    attempts++;
  }
  
  throw new Error('Could not generate unique session code');
}

// Skapa session
export async function createQuizSession(quizId: number, teacherName: string) {
  try {
    const sessionCode = await generateSessionCode();
    
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .insert({
        quiz_id: quizId,
        session_code: sessionCode,
        teacher_name: teacherName
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      sessionCode,
      sessionId: session.id
    };
  } catch (err) {
    console.error('Error creating session:', err);
    throw err;
  }
}

// Gå med i session
export async function joinSession(sessionCode: string, participantName: string) {
  try {
    // Hitta aktiv session
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .eq('is_active', true)
      .single();
    
    if (sessionError || !session) {
      throw new Error('Session not found or inactive');
    }
    
    // Kontrollera om namnet redan finns (tillåt men lägg till nummer)
    const { data: existingParticipants } = await supabase
      .from('session_participants')
      .select('participant_name')
      .eq('session_id', session.id);
    
    let finalName = participantName;
    if (existingParticipants) {
      const sameNames = existingParticipants.filter(p => 
        p.participant_name.startsWith(participantName)
      );
      if (sameNames.length > 0) {
        finalName = `${participantName} (${sameNames.length + 1})`;
      }
    }
    
    // Lägg till deltagare
    const { data: participant, error: participantError } = await supabase
      .from('session_participants')
      .insert({
        session_id: session.id,
        participant_name: finalName
      })
      .select()
      .single();
    
    if (participantError) throw participantError;
    
    return session.id;
  } catch (err) {
    console.error('Error joining session:', err);
    throw err;
  }
}

// Hämta session-info
export async function getSession(sessionCode: string) {
  try {
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .select(`
        *,
        quiz:quizzes(id, title, description, image_url)
      `)
      .eq('session_code', sessionCode)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return session;
  } catch (err) {
    console.error('Error getting session:', err);
    throw err;
  }
}

// Hämta session by ID
export async function getSessionById(sessionId: string) {
  try {
    const { data: session, error } = await supabase
      .from('quiz_sessions')
      .select(`
        *,
        quiz:quizzes(id, title, description, image_url)
      `)
      .eq('id', sessionId)
      .single();
    
    if (error) throw error;
    return session;
  } catch (err) {
    console.error('Error getting session by ID:', err);
    throw err;
  }
}

// Hämta deltagare
export async function getSessionParticipants(sessionId: string) {
  try {
    const { data: participants, error } = await supabase
      .from('session_participants')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_connected', true)
      .order('joined_at');
    
    if (error) throw error;
    return participants || [];
  } catch (err) {
    console.error('Error getting participants:', err);
    throw err;
  }
}

// Uppdatera session-status
export async function updateSessionStatus(sessionId: string, status: 'active' | 'started' | 'ended') {
  try {
    const updates: any = {};
    
    if (status === 'started') {
      updates.started_at = new Date().toISOString();
      updates.session_state = 'started';
    } else if (status === 'ended') {
      updates.ended_at = new Date().toISOString();
      updates.is_active = false;
      updates.session_state = 'ended';
    }
    
    const { error } = await supabase
      .from('quiz_sessions')
      .update(updates)
      .eq('id', sessionId);
    
    if (error) throw error;
  } catch (err) {
    console.error('Error updating session status:', err);
    throw err;
  }
}

// ===============================
// SPRINT 2: REALTIME API FUNCTIONS
// ===============================

// Uppdatera session med aktuell fråga
export async function updateSessionQuestion(sessionId: string, questionIndex: number) {
  try {
    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        current_question_index: questionIndex,
        current_question_started_at: new Date().toISOString(),
        session_state: 'active'
      })
      .eq('id', sessionId);
    
    if (error) throw error;
    console.log(`Updated session ${sessionId} to question ${questionIndex}, state: active`);
  } catch (err) {
    console.error('Error updating session question:', err);
    throw err;
  }
}

// Avsluta quiz session
export async function endQuizSession(sessionId: string) {
  try {
    const { error } = await supabase
      .from('quiz_sessions')
      .update({
        session_state: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    if (error) throw error;
    console.log(`Quiz session ${sessionId} ended`);
  } catch (err) {
    console.error('Error ending quiz session:', err);
    throw err;
  }
}

// Spara elevens svar
export async function saveStudentAnswer(
  sessionId: string, 
  participantId: string, 
  questionId: number, 
  answer: string, 
  timeTaken: number
) {
  try {
    // För den enkla versionen, skapa en fake participant record om den inte finns
    const { data: existingParticipant } = await supabase
      .from('session_participants')
      .select('id')
      .eq('session_id', sessionId)
      .eq('participant_name', participantId.split('_').pop())
      .single();
    
    let finalParticipantId = participantId;
    
    if (!existingParticipant) {
      // Skapa en temporary participant record
      const { data: newParticipant, error: participantError } = await supabase
        .from('session_participants')
        .insert({
          session_id: sessionId,
          participant_name: participantId.split('_').pop() || 'Unknown'
        })
        .select('id')
        .single();
      
      if (!participantError && newParticipant) {
        finalParticipantId = newParticipant.id;
      }
    } else {
      finalParticipantId = existingParticipant.id;
    }

    const { error } = await supabase
      .from('session_answers')
      .insert({
        session_id: sessionId,
        participant_id: finalParticipantId,
        question_id: questionId,
        answer,
        time_taken: timeTaken
      });
    
    if (error) throw error;
  } catch (err) {
    console.error('Error saving student answer:', err);
    // Don't throw error to avoid disrupting student experience
    console.log('Answer save failed, but continuing...');
  }
}

// Hämta svar för aktuell fråga
export async function getQuestionAnswers(sessionId: string, questionId: number) {
  try {
    const { data: answers, error } = await supabase
      .from('session_answers')
      .select(`
        *,
        participant:session_participants(participant_name)
      `)
      .eq('session_id', sessionId)
      .eq('question_id', questionId)
      .order('answered_at');
    
    if (error) throw error;
    return answers || [];
  } catch (err) {
    console.error('Error getting question answers:', err);
    throw err;
  }
}

// Hämta alla session-svar för resultat
export async function getSessionResults(sessionId: string) {
  try {
    const { data: answers, error } = await supabase
      .from('session_answers')
      .select(`
        *,
        participant:session_participants(participant_name),
        question:questions(question_text, correct_answer, points)
      `)
      .eq('session_id', sessionId)
      .order('answered_at');
    
    if (error) throw error;
    return answers || [];
  } catch (err) {
    console.error('Error getting session results:', err);
    throw err;
  }
}

// Global channel tracking to prevent duplicate subscriptions
const activeChannels = new Map<string, any>();

// Helper function to safely remove channel
function removeChannel(channelId: string) {
  if (activeChannels.has(channelId)) {
    const channel = activeChannels.get(channelId);
    try {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe();
      }
    } catch (error) {
      console.log('Error removing channel:', error);
    }
    activeChannels.delete(channelId);
  }
}

// Realtime subscription för session-uppdateringar
export function subscribeToSession(sessionId: string, callback: (payload: any) => void) {
  const channelId = `session_${sessionId}`;
  
  // Remove existing channel if it exists
  removeChannel(channelId);
  
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quiz_sessions',
        filter: `id=eq.${sessionId}`
      },
      callback
    )
    .subscribe();
    
  activeChannels.set(channelId, channel);
  return channel;
}

// Realtime subscription för participant-uppdateringar
export function subscribeToParticipants(sessionId: string, callback: (payload: any) => void) {
  const channelId = `participants_${sessionId}`;
  
  // Remove existing channel if it exists
  removeChannel(channelId);
  
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_participants',
        filter: `session_id=eq.${sessionId}`
      },
      callback
    )
    .subscribe();
    
  activeChannels.set(channelId, channel);
  return channel;
}

// Realtime subscription för svar-uppdateringar
export function subscribeToAnswers(sessionId: string, callback: (payload: any) => void) {
  const channelId = `answers_${sessionId}`;
  
  // Remove existing channel if it exists
  removeChannel(channelId);
  
  const channel = supabase
    .channel(channelId)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'session_answers',
        filter: `session_id=eq.${sessionId}`
      },
      callback
    )
    .subscribe();
    
  activeChannels.set(channelId, channel);
  return channel;
}

// Function to cleanup all channels for a session
export function cleanupSessionChannels(sessionId: string) {
  removeChannel(`session_${sessionId}`);
  removeChannel(`participants_${sessionId}`);
  removeChannel(`answers_${sessionId}`);
}