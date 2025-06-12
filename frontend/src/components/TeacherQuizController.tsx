import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getQuiz, updateSessionQuestion, getQuestionAnswers } from '../lib/supabase';
import { useSession } from '../context/SessionContext';
import DynamicBackground from './DynamicBackground';
import LiveSessionStats from './LiveSessionStats';
import './TeacherQuizController.css';

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

function TeacherQuizController() {
  const { sessionId, quizId } = useParams<{ sessionId: string; quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { state: sessionState, initializeSession, dispatch } = useSession();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showingResults, setShowingResults] = useState(false);
  
  const sessionCode = location.state?.sessionCode;
  const autoStart = location.state?.autoStart;

  useEffect(() => {
    if (sessionId && quizId) {
      initializeSessionData();
    }
  }, [sessionId, quizId]);

  const initializeSessionData = async () => {
    try {
      // Ladda session context
      await initializeSession(sessionId!);
      
      // Ladda quiz-data
      const quizData = await getQuiz(parseInt(quizId!));
      setQuiz(quizData);
      
      // Sätt aktuell fråga i state
      if (quizData.questions.length > 0) {
        dispatch({ type: 'SET_CURRENT_QUESTION', payload: quizData.questions[0] });
      }
      
      // Auto-starta quizet om flaggan är satt
      if (autoStart && quizData.questions.length > 0) {
        setTimeout(() => {
          handleStartQuiz();
        }, 1000); // Kort delay för att låta allt ladda
      }
      
    } catch (err) {
      setError('Kunde inte ladda quiz-data');
      console.error('Error initializing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quiz || !sessionId) return;
    
    try {
      setIsQuizStarted(true);
      await updateSessionQuestion(sessionId, 0);
      dispatch({ type: 'SET_CURRENT_QUESTION', payload: quiz.questions[0] });
    } catch (err) {
      console.error('Error starting quiz:', err);
      alert('Kunde inte starta quizet');
    }
  };

  const handleNextQuestion = async () => {
    if (!quiz || !sessionId) return;
    
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < quiz.questions.length) {
      try {
        await updateSessionQuestion(sessionId, nextIndex);
        setCurrentQuestionIndex(nextIndex);
        dispatch({ type: 'SET_CURRENT_QUESTION', payload: quiz.questions[nextIndex] });
        setShowingResults(false);
      } catch (err) {
        console.error('Error advancing question:', err);
      }
    } else {
      handleEndQuiz();
    }
  };

  const handlePreviousQuestion = async () => {
    if (!quiz || !sessionId) return;
    
    const prevIndex = currentQuestionIndex - 1;
    
    if (prevIndex >= 0) {
      try {
        await updateSessionQuestion(sessionId, prevIndex);
        setCurrentQuestionIndex(prevIndex);
        dispatch({ type: 'SET_CURRENT_QUESTION', payload: quiz.questions[prevIndex] });
        setShowingResults(false);
      } catch (err) {
        console.error('Error going back:', err);
      }
    }
  };

  const handleShowResults = () => {
    setShowingResults(!showingResults);
  };

  const handleEndQuiz = () => {
    setIsQuizEnded(true);
  };

  const handleBackToDashboard = () => {
    navigate(`/session/${sessionId}/dashboard`);
  };

  if (loading) {
    return (
      <DynamicBackground>
        <div className="teacher-controller-container">
          <div className="loading">Laddar quiz...</div>
        </div>
      </DynamicBackground>
    );
  }

  if (error || !quiz) {
    return (
      <DynamicBackground>
        <div className="teacher-controller-container">
          <div className="error-state">
            <h2>⚠️ Något gick fel</h2>
            <p>{error || 'Quiz kunde inte hittas'}</p>
            <button onClick={handleBackToDashboard} className="back-button">
              Tillbaka till Dashboard
            </button>
          </div>
        </div>
      </DynamicBackground>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <DynamicBackground>
      <div className="teacher-controller-container">
        <header className="controller-header">
          <div className="session-info">
            <h1>🏫 Realtids Quiz - {quiz.title}</h1>
            <div className="session-details">
              <span className="session-code">Kod: {sessionCode}</span>
              <span className="participant-count">👥 {sessionState.participants.length} elever</span>
              <span className="connection-status">
                {sessionState.isConnected ? '🟢 Ansluten' : '🔴 Frånkopplad'}
              </span>
            </div>
          </div>
          <button onClick={handleBackToDashboard} className="back-button">
            ← Dashboard
          </button>
        </header>

        <main className="controller-content">
          <div className="main-panel">
            {!isQuizStarted ? (
              <div className="pre-start-section">
                <div className="quiz-overview">
                  <h2>{autoStart ? '⚡ Startar Realtids Quiz...' : '🚀 Starta Realtids Quiz'}</h2>
                  <div className="quiz-stats">
                    <div className="stat">
                      <span className="stat-number">{quiz.questions.length}</span>
                      <span className="stat-label">Frågor</span>
                    </div>
                    <div className="stat">
                      <span className="stat-number">{sessionState.participants.length}</span>
                      <span className="stat-label">Elever anslutna</span>
                    </div>
                  </div>
                  {autoStart ? (
                    <div className="auto-starting">
                      <p>🔄 Startar automatiskt för alla elever...</p>
                    </div>
                  ) : (
                    <button 
                      onClick={handleStartQuiz} 
                      className="start-quiz-button"
                      disabled={sessionState.participants.length === 0}
                    >
                      🚀 Starta Quiz för alla elever
                    </button>
                  )}
                </div>
              </div>
            ) : !isQuizEnded ? (
              <div className="quiz-active-section">
                <div className="progress-section">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                  </div>
                  <span className="progress-text">
                    Fråga {currentQuestionIndex + 1} av {quiz.questions.length}
                  </span>
                </div>

                <div className="current-question-display">
                  <div className="question-card">
                    {currentQuestion.image_url && (
                      <div className="question-image">
                        <img src={currentQuestion.image_url} alt="Frågebild" />
                      </div>
                    )}
                    
                    <div className="question-content">
                      <h2>{currentQuestion.question_text}</h2>
                      
                      {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
                        <div className="options-display">
                          {currentQuestion.options.map((option, index) => (
                            <div 
                              key={index} 
                              className={`option-item ${option === currentQuestion.correct_answer ? 'correct' : ''}`}
                            >
                              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                              <span className="option-text">{option}</span>
                              {option === currentQuestion.correct_answer && (
                                <span className="correct-indicator">✓</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {currentQuestion.question_type === 'true_false' && (
                        <div className="true-false-display">
                          <div className={`tf-option ${currentQuestion.correct_answer === 'true' ? 'correct' : ''}`}>
                            Sant {currentQuestion.correct_answer === 'true' && '✓'}
                          </div>
                          <div className={`tf-option ${currentQuestion.correct_answer === 'false' ? 'correct' : ''}`}>
                            Falskt {currentQuestion.correct_answer === 'false' && '✓'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {currentQuestion.explanation && (
                    <div className="explanation-card">
                      <h3>💡 Förklaring</h3>
                      <p>{currentQuestion.explanation}</p>
                    </div>
                  )}
                </div>

                <div className="controller-actions">
                  <button 
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="nav-button prev-button"
                  >
                    ← Föregående
                  </button>
                  
                  <div className="center-controls">
                    <div className="timer-display">
                      <span className="timer-icon">⏱️</span>
                      <span className="timer-text">{sessionState.timeRemaining}s</span>
                    </div>
                    <button 
                      onClick={handleShowResults}
                      className="show-results-button"
                    >
                      {showingResults ? '📊 Dölj Statistik' : '📊 Visa Statistik'}
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleNextQuestion}
                    className="nav-button next-button"
                  >
                    {currentQuestionIndex === quiz.questions.length - 1 ? '🏁 Avsluta Quiz' : 'Nästa →'}
                  </button>
                </div>

                {showingResults && (
                  <LiveSessionStats 
                    sessionId={sessionId!}
                    currentQuestion={currentQuestion}
                  />
                )}
              </div>
            ) : (
              <div className="quiz-ended-section">
                <div className="end-card">
                  <h2>🎉 Quiz Avslutat!</h2>
                  <p>Alla frågor har visats för eleverna.</p>
                  <div className="end-actions">
                    <button onClick={handleBackToDashboard} className="back-button">
                      Visa Resultat
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="participants-sidebar">
            <h3>👥 Anslutna Elever ({sessionState.participants.length})</h3>
            <div className="participants-list">
              {sessionState.participants.map((participant) => (
                <div key={participant.id} className="participant-item">
                  <span className="participant-name">{participant.participant_name}</span>
                  <span className="connection-status">
                    {participant.is_connected ? '🟢' : '🔴'}
                  </span>
                </div>
              ))}
            </div>
            
            {isQuizStarted && !isQuizEnded && (
              <div className="current-answers-preview">
                <h4>📝 Svar ({sessionState.currentQuestionAnswers.length})</h4>
                <div className="answers-count">
                  {sessionState.currentQuestionAnswers.length} av {sessionState.participants.length} har svarat
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </DynamicBackground>
  );
}

export default TeacherQuizController;