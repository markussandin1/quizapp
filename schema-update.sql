-- Sprint 2: Utöka databasschema för realtidsupplevelse

-- Lägg till realtime-fält i quiz_sessions
ALTER TABLE quiz_sessions ADD COLUMN current_question_index INTEGER DEFAULT 0;
ALTER TABLE quiz_sessions ADD COLUMN current_question_started_at TIMESTAMP;
ALTER TABLE quiz_sessions ADD COLUMN session_state TEXT DEFAULT 'waiting';

-- Skapa session_answers tabell
CREATE TABLE session_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES session_participants(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken INTEGER
);

-- Lägg till index för prestanda
CREATE INDEX idx_session_answers_session_id ON session_answers(session_id);
CREATE INDEX idx_session_answers_participant_id ON session_answers(participant_id);
CREATE INDEX idx_session_answers_question_id ON session_answers(question_id);