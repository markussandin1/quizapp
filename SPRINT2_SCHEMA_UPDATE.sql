-- Sprint 2: Database Schema Updates for Realtime Quiz Experience
-- Run this SQL in your Supabase Dashboard SQL Editor

-- Add realtime fields to quiz_sessions table
ALTER TABLE quiz_sessions 
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_question_started_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS session_state TEXT DEFAULT 'waiting';

-- Create session_answers table for tracking student answers
CREATE TABLE IF NOT EXISTS session_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES session_participants(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken INTEGER
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_session_answers_session_id ON session_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_participant_id ON session_answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_question_id ON session_answers(question_id);

-- Enable Row Level Security (RLS) for session_answers
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for session_answers
CREATE POLICY "Users can insert their own answers" ON session_answers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view session answers" ON session_answers
  FOR SELECT USING (true);

-- Update quiz_sessions RLS policies to allow realtime updates
DROP POLICY IF EXISTS "Users can update session status" ON quiz_sessions;
CREATE POLICY "Users can update session status" ON quiz_sessions
  FOR UPDATE USING (true);

-- Enable realtime for the new table
ALTER PUBLICATION supabase_realtime ADD TABLE session_answers;