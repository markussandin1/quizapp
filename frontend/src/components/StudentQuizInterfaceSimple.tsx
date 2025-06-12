import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getQuiz, getSessionById, saveStudentAnswer, supabase } from '../lib/supabase';
import DynamicBackground from './DynamicBackground';
import './StudentQuizInterface.css';

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

interface Quiz {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  questions: Question[];
}

interface Session {
  id: string;
  session_code: string;
  teacher_name: string;
  current_question_index: number;
  current_question_started_at?: string;
  session_state: 'waiting' | 'started' | 'active' | 'ended';
}

function StudentQuizInterfaceSimple() {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  
  // Session data från state
  const sessionMode = location.state?.sessionMode;
  const sessionId = location.state?.sessionId;
  const participantName = location.state?.participantName;

  useEffect(() => {
    if (sessionMode && sessionId && quizId) {
      initializeQuiz();
    }
    
    return () => {
      // Cleanup när komponenten unmount
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [sessionId, quizId]);

  let subscription: any = null;

  const initializeQuiz = async () => {
    try {
      setLoading(true);
      
      // Ladda quiz-data
      const quizData = await getQuiz(parseInt(quizId!));
      setQuiz(quizData);
      
      // Ladda session-data
      const sessionData = await getSessionById(sessionId);
      setSession(sessionData);
      setCurrentQuestionIndex(sessionData.current_question_index || 0);
      
      // Sätt upp enkel realtime subscription för session-uppdateringar
      subscription = supabase
        .channel(`student_${sessionId}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'quiz_sessions',
            filter: `id=eq.${sessionId}`
          },
          handleSessionUpdate
        )
        .subscribe();
        
      // Starta timer om det finns en aktiv fråga
      if (sessionData.current_question_started_at && quizData.questions[sessionData.current_question_index]) {
        startTimer(sessionData.current_question_started_at, quizData.questions[sessionData.current_question_index].time_limit);
      }
      
    } catch (err) {
      setError('Kunde inte ladda quiz');
      console.error('Error loading quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSessionUpdate = (payload: any) => {
    console.log('Session update received:', payload);
    
    if (payload.new) {
      const newSession = payload.new;
      setSession(newSession);
      
      // Ny fråga?
      if (newSession.current_question_index !== currentQuestionIndex) {
        setCurrentQuestionIndex(newSession.current_question_index);
        resetForNewQuestion();
        
        // Starta timer för nya frågan
        if (newSession.current_question_started_at && quiz) {
          const currentQuestion = quiz.questions[newSession.current_question_index];
          if (currentQuestion) {
            startTimer(newSession.current_question_started_at, currentQuestion.time_limit);
          }
        }
      }
      
      // Quiz avslutat?
      if (newSession.session_state === 'ended') {
        setIsQuizEnded(true);
      }
    }
  };

  const resetForNewQuestion = () => {
    setCurrentAnswer('');
    setHasAnswered(false);
    setShowExplanation(false);
    setTimeRemaining(0);
  };

  const startTimer = (startedAt: string, timeLimit: number) => {
    const startTime = new Date(startedAt).getTime();
    const duration = timeLimit * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, duration - elapsed);
      
      setTimeRemaining(Math.ceil(remaining / 1000));
      
      if (remaining <= 0) {
        handleTimeUp();
      } else {
        setTimeout(updateTimer, 1000);
      }
    };
    
    updateTimer();
  };

  const handleAnswerSelect = async (answer: string) => {
    if (hasAnswered || isQuizEnded) return;
    
    // Sätt svaret och submitta direkt
    setCurrentAnswer(answer);
    setHasAnswered(true);
    
    // Submitta svaret automatiskt
    await submitAnswer(answer);
  };

  const submitAnswer = async (answer: string) => {
    if (!quiz || !session) return;
    
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const timeTaken = currentQuestion.time_limit - timeRemaining;
    
    try {
      // Hitta participant ID (enkel approach)
      const participantId = `${sessionId}_${participantName}`;
      
      await saveStudentAnswer(
        sessionId,
        participantId,
        currentQuestion.id,
        answer,
        timeTaken
      );
      
      // Visa förklaring om det finns
      if (currentQuestion.explanation) {
        setShowExplanation(true);
      }
      
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Visa ändå feedback för användaren
      if (currentQuestion.explanation) {
        setShowExplanation(true);
      }
    }
  };

  // Behåll den gamla funktionen för bakåtkompatibilitet
  const handleSubmitAnswer = async () => {
    if (!currentAnswer || hasAnswered || !quiz || !session) return;
    await submitAnswer(currentAnswer);
  };

  const handleTimeUp = async () => {
    if (hasAnswered) return;
    
    // Auto-submit current answer eller tom sträng
    const finalAnswer = currentAnswer || '';
    setHasAnswered(true);
    
    await submitAnswer(finalAnswer);
  };

  const getAnswerButtonColor = (option: string, index: number): string => {
    const kahootColors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];
    if (quiz?.questions[currentQuestionIndex]?.question_type === 'true_false') {
      return option === 'true' ? '#26890c' : '#e21b3c';
    }
    return kahootColors[index % kahootColors.length];
  };

  if (loading) {
    return (
      <DynamicBackground>
        <div className="student-quiz-container">
          <div className="loading">Laddar quiz...</div>
        </div>
      </DynamicBackground>
    );
  }

  if (error || !quiz || !session) {
    return (
      <DynamicBackground>
        <div className="student-quiz-container">
          <div className="error-state">
            <h2>⚠️ Något gick fel</h2>
            <p>{error || 'Quiz kunde inte hittas'}</p>
            <button onClick={() => navigate('/')} className="back-button">
              Tillbaka till start
            </button>
          </div>
        </div>
      </DynamicBackground>
    );
  }

  if (isQuizEnded) {
    return (
      <DynamicBackground>
        <div className="student-quiz-container">
          <div className="quiz-ended">
            <h2>🎉 Quiz Avslutat!</h2>
            <p>Tack för att du deltog!</p>
            <button onClick={() => navigate('/')} className="back-button">
              Tillbaka till start
            </button>
          </div>
        </div>
      </DynamicBackground>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return (
      <DynamicBackground>
        <div className="student-quiz-container">
          <div className="waiting-next-question">
            <h2>⏳ Väntar på nästa fråga...</h2>
            <p>Läraren förbereder nästa fråga</p>
            <div className="participant-info">
              <span>Du: {participantName}</span>
              <span>Session: {session.session_code}</span>
            </div>
          </div>
        </div>
      </DynamicBackground>
    );
  }

  return (
    <DynamicBackground>
      <div className="student-quiz-container">
        <header className="quiz-header">
          <div className="quiz-info">
            <h1>{quiz.title}</h1>
            <div className="session-info">
              <span>Session: {session.session_code}</span>
              <span>Du: {participantName}</span>
            </div>
          </div>
          
          <div className="timer-display">
            <div className="timer-circle">
              <span className="timer-value">{timeRemaining}</span>
            </div>
          </div>
        </header>

        <main className="question-section">
          {currentQuestion.image_url && (
            <div className="question-image">
              <img src={currentQuestion.image_url} alt="Frågebild" />
            </div>
          )}
          
          <div className="question-content">
            <h2>{currentQuestion.question_text}</h2>
          </div>

          <div className="answers-section">
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <div className="multiple-choice-answers">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={hasAnswered}
                    className={`answer-button ${currentAnswer === option ? 'selected' : ''} ${hasAnswered && option === currentQuestion.correct_answer ? 'correct' : ''} ${hasAnswered && currentAnswer === option && option !== currentQuestion.correct_answer ? 'incorrect' : ''}`}
                    style={{ 
                      backgroundColor: getAnswerButtonColor(option, index),
                      borderColor: getAnswerButtonColor(option, index)
                    }}
                  >
                    <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                    <span className="answer-text">{option}</span>
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'true_false' && (
              <div className="true-false-answers">
                <button
                  onClick={() => handleAnswerSelect('true')}
                  disabled={hasAnswered}
                  className={`tf-button true-button ${currentAnswer === 'true' ? 'selected' : ''} ${hasAnswered && 'true' === currentQuestion.correct_answer ? 'correct' : ''} ${hasAnswered && currentAnswer === 'true' && 'true' !== currentQuestion.correct_answer ? 'incorrect' : ''}`}
                  style={{ backgroundColor: '#26890c' }}
                >
                  <span className="tf-icon">✓</span>
                  <span className="tf-text">Sant</span>
                </button>
                
                <button
                  onClick={() => handleAnswerSelect('false')}
                  disabled={hasAnswered}
                  className={`tf-button false-button ${currentAnswer === 'false' ? 'selected' : ''} ${hasAnswered && 'false' === currentQuestion.correct_answer ? 'correct' : ''} ${hasAnswered && currentAnswer === 'false' && 'false' !== currentQuestion.correct_answer ? 'incorrect' : ''}`}
                  style={{ backgroundColor: '#e21b3c' }}
                >
                  <span className="tf-icon">✗</span>
                  <span className="tf-text">Falskt</span>
                </button>
              </div>
            )}
          </div>


          {showExplanation && currentQuestion.explanation && (
            <div className="explanation-section">
              <h3>💡 Förklaring</h3>
              <p>{currentQuestion.explanation}</p>
            </div>
          )}

          {hasAnswered && (
            <div className="answer-feedback">
              {currentAnswer === currentQuestion.correct_answer ? (
                <div className="feedback correct-feedback">
                  <span className="feedback-icon">✅</span>
                  <span>Rätt svar!</span>
                </div>
              ) : currentAnswer ? (
                <div className="feedback incorrect-feedback">
                  <span className="feedback-icon">❌</span>
                  <span>Fel svar. Rätt svar: {currentQuestion.correct_answer}</span>
                </div>
              ) : (
                <div className="feedback timeout-feedback">
                  <span className="feedback-icon">⏰</span>
                  <span>Tiden tog slut! Rätt svar: {currentQuestion.correct_answer}</span>
                </div>
              )}
              <div className="waiting-message">
                <p>⏳ Väntar på att läraren går till nästa fråga...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </DynamicBackground>
  );
}

export default StudentQuizInterfaceSimple;