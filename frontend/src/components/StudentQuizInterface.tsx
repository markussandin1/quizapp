import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getQuiz, saveStudentAnswer } from '../lib/supabase';
import { useSession } from '../context/SessionContext';
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

function StudentQuizInterface() {
  const { quizId } = useParams<{ quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { state: sessionState, initializeSession, cleanup } = useSession();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState<string>('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answerStartTime, setAnswerStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  
  // Session data från state
  const sessionMode = location.state?.sessionMode;
  const sessionId = location.state?.sessionId;
  const participantName = location.state?.participantName;

  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      if (sessionMode && sessionId && mounted) {
        await initializeRealtimeSession();
      } else if (mounted) {
        // Fallback till individual mode
        await loadQuizData();
      }
    };
    
    initialize();
    
    return () => {
      mounted = false;
      // Rensa session när komponenten unmount
      if (sessionMode && sessionId) {
        cleanup();
      }
    };
  }, [sessionId, quizId]);

  // Lyssna på session state changes
  useEffect(() => {
    if (sessionState.session) {
      const currentQuestionIndex = sessionState.session.current_question_index;
      
      if (sessionState.session.session_state === 'ended') {
        setIsQuizEnded(true);
      } else if (sessionState.session.session_state === 'active') {
        // Ny fråga har startats
        if (quiz && currentQuestionIndex < quiz.questions.length) {
          resetForNewQuestion();
        }
      }
    }
  }, [sessionState.session?.current_question_index, sessionState.session?.session_state]);

  // Timer countdown
  useEffect(() => {
    if (sessionState.timeRemaining === 0 && !hasAnswered) {
      // Tiden har gått ut, autosubmit
      handleTimeUp();
    }
  }, [sessionState.timeRemaining]);

  const initializeRealtimeSession = async () => {
    try {
      setLoading(true);
      await initializeSession(sessionId);
      await loadQuizData();
    } catch (err) {
      setError('Kunde inte ansluta till session');
      console.error('Error initializing session:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadQuizData = async () => {
    try {
      const quizData = await getQuiz(parseInt(quizId!));
      setQuiz(quizData);
      setAnswerStartTime(Date.now());
    } catch (err) {
      setError('Kunde inte ladda quiz');
      console.error('Error loading quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForNewQuestion = () => {
    setCurrentAnswer('');
    setHasAnswered(false);
    setShowExplanation(false);
    setAnswerStartTime(Date.now());
  };

  const handleAnswerSelect = (answer: string) => {
    if (hasAnswered || isQuizEnded) return;
    setCurrentAnswer(answer);
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer || hasAnswered || !sessionState.currentQuestion) return;
    
    const timeTaken = Math.round((Date.now() - answerStartTime) / 1000);
    
    try {
      if (sessionMode && sessionId) {
        // Save to session_answers for realtime mode
        const participantId = getParticipantId();
        if (participantId) {
          await saveStudentAnswer(
            sessionId,
            participantId,
            sessionState.currentQuestion.id,
            currentAnswer,
            timeTaken
          );
        }
      }
      
      setHasAnswered(true);
      setShowExplanation(true);
      
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert('Kunde inte spara svar');
    }
  };

  const handleTimeUp = async () => {
    if (hasAnswered) return;
    
    // Auto-submit empty answer or current selection
    const finalAnswer = currentAnswer || '';
    const timeTaken = Math.round((Date.now() - answerStartTime) / 1000);
    
    try {
      if (sessionMode && sessionId && sessionState.currentQuestion) {
        const participantId = getParticipantId();
        if (participantId) {
          await saveStudentAnswer(
            sessionId,
            participantId,
            sessionState.currentQuestion.id,
            finalAnswer,
            timeTaken
          );
        }
      }
      
      setHasAnswered(true);
      setShowExplanation(true);
      
    } catch (err) {
      console.error('Error auto-submitting answer:', err);
    }
  };

  const getParticipantId = (): string | null => {
    if (!participantName) return null;
    const participant = sessionState.participants.find(p => 
      p.participant_name === participantName
    );
    return participant?.id || null;
  };

  const getCurrentQuestion = (): Question | null => {
    if (sessionMode) {
      return sessionState.currentQuestion;
    } else if (quiz) {
      return quiz.questions[0]; // Fallback for individual mode
    }
    return null;
  };

  const getAnswerButtonColor = (option: string, index: number): string => {
    const kahootColors = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];
    if (currentQuestion?.question_type === 'true_false') {
      return option === 'true' ? '#26890c' : '#e21b3c';
    }
    return kahootColors[index % kahootColors.length];
  };

  const currentQuestion = getCurrentQuestion();

  if (loading) {
    return (
      <DynamicBackground>
        <div className="student-quiz-container">
          <div className="loading">Laddar quiz...</div>
        </div>
      </DynamicBackground>
    );
  }

  if (error || !quiz || !currentQuestion) {
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

  const waitingForNextQuestion = sessionMode && 
    sessionState.session?.session_state === 'started' && 
    !sessionState.currentQuestion;

  if (waitingForNextQuestion) {
    return (
      <DynamicBackground>
        <div className="student-quiz-container">
          <div className="waiting-next-question">
            <h2>⏳ Väntar på nästa fråga...</h2>
            <p>Läraren förbereder nästa fråga</p>
            <div className="participant-info">
              <span>Du: {participantName}</span>
              <span>Session: {sessionState.session?.session_code}</span>
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
            {sessionMode && (
              <div className="session-info">
                <span>Session: {sessionState.session?.session_code}</span>
                <span>Du: {participantName}</span>
              </div>
            )}
          </div>
          
          {sessionMode && (
            <div className="timer-display">
              <div className="timer-circle">
                <span className="timer-value">{sessionState.timeRemaining}</span>
              </div>
            </div>
          )}
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

          {currentAnswer && !hasAnswered && (
            <div className="submit-section">
              <button onClick={handleSubmitAnswer} className="submit-button">
                Skicka svar
              </button>
            </div>
          )}

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
              ) : (
                <div className="feedback incorrect-feedback">
                  <span className="feedback-icon">❌</span>
                  <span>Fel svar. Rätt svar: {currentQuestion.correct_answer}</span>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </DynamicBackground>
  );
}

export default StudentQuizInterface;