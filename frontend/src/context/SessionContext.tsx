import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  subscribeToSession, 
  subscribeToParticipants, 
  subscribeToAnswers,
  cleanupSessionChannels,
  getSessionById,
  getSessionParticipants,
  getQuestionAnswers 
} from '../lib/supabase';

// Types
interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  image_url?: string;
  time_limit: number;
  points: number;
}

interface Participant {
  id: string;
  participant_name: string;
  joined_at: string;
  is_connected: boolean;
}

interface Answer {
  id: string;
  participant_id: string;
  question_id: number;
  answer: string;
  answered_at: string;
  time_taken: number;
  participant: {
    participant_name: string;
  };
}

interface Session {
  id: string;
  session_code: string;
  teacher_name: string;
  current_question_index: number;
  current_question_started_at?: string;
  session_state: 'waiting' | 'started' | 'active' | 'ended';
  started_at?: string;
  ended_at?: string;
  quiz: {
    id: number;
    title: string;
    description?: string;
    image_url?: string;
  };
}

interface SessionState {
  session: Session | null;
  participants: Participant[];
  currentQuestionAnswers: Answer[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  timeRemaining: number;
  currentQuestion: Question | null;
}

type SessionAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SESSION'; payload: Session }
  | { type: 'SET_PARTICIPANTS'; payload: Participant[] }
  | { type: 'SET_CURRENT_QUESTION_ANSWERS'; payload: Answer[] }
  | { type: 'SET_CURRENT_QUESTION'; payload: Question | null }
  | { type: 'UPDATE_SESSION'; payload: Partial<Session> }
  | { type: 'ADD_PARTICIPANT'; payload: Participant }
  | { type: 'REMOVE_PARTICIPANT'; payload: string }
  | { type: 'ADD_ANSWER'; payload: Answer }
  | { type: 'SET_TIME_REMAINING'; payload: number }
  | { type: 'SET_CONNECTED'; payload: boolean };

const initialState: SessionState = {
  session: null,
  participants: [],
  currentQuestionAnswers: [],
  isConnected: false,
  isLoading: true,
  error: null,
  timeRemaining: 0,
  currentQuestion: null,
};

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_SESSION':
      return { ...state, session: action.payload, isLoading: false };
    case 'SET_PARTICIPANTS':
      return { ...state, participants: action.payload };
    case 'SET_CURRENT_QUESTION_ANSWERS':
      return { ...state, currentQuestionAnswers: action.payload };
    case 'SET_CURRENT_QUESTION':
      return { ...state, currentQuestion: action.payload };
    case 'UPDATE_SESSION':
      return { 
        ...state, 
        session: state.session ? { ...state.session, ...action.payload } : null 
      };
    case 'ADD_PARTICIPANT':
      return { 
        ...state, 
        participants: [...state.participants, action.payload] 
      };
    case 'REMOVE_PARTICIPANT':
      return { 
        ...state, 
        participants: state.participants.filter(p => p.id !== action.payload) 
      };
    case 'ADD_ANSWER':
      return { 
        ...state, 
        currentQuestionAnswers: [...state.currentQuestionAnswers, action.payload] 
      };
    case 'SET_TIME_REMAINING':
      return { ...state, timeRemaining: action.payload };
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    default:
      return state;
  }
}

// Context
interface SessionContextType {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  initializeSession: (sessionId: string) => Promise<void>;
  cleanup: () => void;
  getCurrentQuestion: () => Question | null;
  isTeacher: (teacherName?: string) => boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Provider Component
interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [state, dispatch] = useReducer(sessionReducer, initialState);
  const [subscriptions, setSubscriptions] = React.useState<any[]>([]);
  const [timerInterval, setTimerInterval] = React.useState<NodeJS.Timeout | null>(null);
  const [currentSessionId, setCurrentSessionId] = React.useState<string | null>(null);

  const initializeSession = async (sessionId: string) => {
    try {
      // Förhindra dubbel-initialisering av samma session
      if (currentSessionId === sessionId && state.isConnected) {
        console.log('Session already initialized:', sessionId);
        return;
      }

      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Rensa gamla subscriptions först
      cleanup();
      
      // Använd global cleanup för att säkerställa att alla kanaler för denna session rensas
      cleanupSessionChannels(sessionId);

      // Hämta session-data
      const sessionData = await getSessionById(sessionId);
      dispatch({ type: 'SET_SESSION', payload: sessionData });

      // Hämta deltagare
      const participantsData = await getSessionParticipants(sessionId);
      dispatch({ type: 'SET_PARTICIPANTS', payload: participantsData });

      // Sätt upp realtime subscriptions med global kanal-hantering
      const sessionSub = subscribeToSession(sessionId, handleSessionUpdate);
      const participantsSub = subscribeToParticipants(sessionId, handleParticipantsUpdate);
      const answersSub = subscribeToAnswers(sessionId, handleAnswersUpdate);

      setSubscriptions([sessionSub, participantsSub, answersSub]);
      setCurrentSessionId(sessionId);
      dispatch({ type: 'SET_CONNECTED', payload: true });

    } catch (error) {
      console.error('Error initializing session:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Kunde inte ladda session' });
    }
  };

  const handleSessionUpdate = (payload: any) => {
    console.log('Session update:', payload);
    if (payload.new) {
      dispatch({ type: 'UPDATE_SESSION', payload: payload.new });
      
      // Starta timer om fråga har startat
      if (payload.new.current_question_started_at) {
        startQuestionTimer(payload.new.current_question_started_at);
      }
    }
  };

  const handleParticipantsUpdate = (payload: any) => {
    console.log('Participants update:', payload);
    if (payload.eventType === 'INSERT') {
      dispatch({ type: 'ADD_PARTICIPANT', payload: payload.new });
    } else if (payload.eventType === 'DELETE') {
      dispatch({ type: 'REMOVE_PARTICIPANT', payload: payload.old.id });
    }
  };

  const handleAnswersUpdate = (payload: any) => {
    console.log('Answers update:', payload);
    if (payload.eventType === 'INSERT') {
      dispatch({ type: 'ADD_ANSWER', payload: payload.new });
    }
  };

  const startQuestionTimer = (startedAt: string) => {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    if (!state.currentQuestion) return;

    const startTime = new Date(startedAt).getTime();
    const duration = state.currentQuestion.time_limit * 1000;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, duration - elapsed);

      dispatch({ type: 'SET_TIME_REMAINING', payload: Math.ceil(remaining / 1000) });

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    setTimerInterval(interval);
  };

  const getCurrentQuestion = (): Question | null => {
    return state.currentQuestion;
  };

  const isTeacher = (teacherName?: string): boolean => {
    if (!state.session || !teacherName) return false;
    return state.session.teacher_name === teacherName;
  };

  const cleanup = () => {
    // Rensa subscriptions
    subscriptions.forEach(sub => {
      try {
        if (sub && typeof sub.unsubscribe === 'function') {
          sub.unsubscribe();
        }
      } catch (error) {
        console.log('Error unsubscribing:', error);
      }
    });
    setSubscriptions([]);

    // Rensa timer
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    // Global cleanup för aktuell session
    if (currentSessionId) {
      cleanupSessionChannels(currentSessionId);
    }

    // Återställ state
    setCurrentSessionId(null);
    dispatch({ type: 'SET_CONNECTED', payload: false });
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const contextValue: SessionContextType = {
    state,
    dispatch,
    initializeSession,
    cleanup,
    getCurrentQuestion,
    isTeacher,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
}

// Hook
export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

export default SessionContext;