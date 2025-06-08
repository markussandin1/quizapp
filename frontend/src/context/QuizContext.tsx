import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  image_url?: string;
  article_url?: string;
  time_limit: number;
  points: number;
}

interface Quiz {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  questions: Question[];
}

interface QuizState {
  currentQuiz: Quiz | null;
  currentQuestionIndex: number;
  answers: Record<number, string>;
  timeRemaining: number;
  isQuizCompleted: boolean;
  score: number;
  loading: boolean;
  error: string | null;
}

type QuizAction =
  | { type: 'SET_QUIZ'; payload: Quiz }
  | { type: 'SET_ANSWER'; payload: { questionId: number; answer: string } }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREVIOUS_QUESTION' }
  | { type: 'SET_TIME_REMAINING'; payload: number }
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_QUIZ' };

const initialState: QuizState = {
  currentQuiz: null,
  currentQuestionIndex: 0,
  answers: {},
  timeRemaining: 0,
  isQuizCompleted: false,
  score: 0,
  loading: false,
  error: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'SET_QUIZ':
      return {
        ...state,
        currentQuiz: action.payload,
        currentQuestionIndex: 0,
        timeRemaining: action.payload.questions[0]?.time_limit || 30,
        isQuizCompleted: false,
        answers: {},
        score: 0,
      };
    case 'SET_ANSWER':
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.payload.questionId]: action.payload.answer,
        },
      };
    case 'NEXT_QUESTION':
      const nextIndex = state.currentQuestionIndex + 1;
      const nextQuestion = state.currentQuiz?.questions[nextIndex];
      return {
        ...state,
        currentQuestionIndex: nextIndex,
        timeRemaining: nextQuestion?.time_limit || 30,
      };
    case 'PREVIOUS_QUESTION':
      const prevIndex = Math.max(0, state.currentQuestionIndex - 1);
      const prevQuestion = state.currentQuiz?.questions[prevIndex];
      return {
        ...state,
        currentQuestionIndex: prevIndex,
        timeRemaining: prevQuestion?.time_limit || 30,
      };
    case 'SET_TIME_REMAINING':
      return {
        ...state,
        timeRemaining: action.payload,
      };
    case 'COMPLETE_QUIZ':
      return {
        ...state,
        isQuizCompleted: true,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'RESET_QUIZ':
      return initialState;
    default:
      return state;
  }
}

const QuizContext = createContext<{
  state: QuizState;
  dispatch: React.Dispatch<QuizAction>;
} | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
}