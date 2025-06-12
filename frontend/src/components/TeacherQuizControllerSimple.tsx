import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getQuiz, updateSessionQuestion, endQuizSession, getSessionById, getSessionParticipants } from '../lib/supabase';
import DynamicBackground from './DynamicBackground';
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

interface Participant {
  id: string;
  participant_name: string;
  joined_at: string;
}

function TeacherQuizControllerSimple() {
  const { sessionId, quizId } = useParams<{ sessionId: string; quizId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sessionCode = location.state?.sessionCode;
  const autoStart = location.state?.autoStart;

  useEffect(() => {
    if (sessionId && quizId) {
      initializeData();
    }
  }, [sessionId, quizId]);

  const initializeData = async () => {
    try {
      setLoading(true);
      
      console.log('Initializing teacher controller with autoStart:', autoStart);
      
      // Ladda quiz-data
      const quizData = await getQuiz(parseInt(quizId!));
      setQuiz(quizData);
      
      // Ladda session och participants
      const sessionData = await getSessionById(sessionId!);
      const participantsData = await getSessionParticipants(sessionId!);
      setParticipants(participantsData);
      
      console.log('Loaded quiz with', quizData.questions.length, 'questions');
      console.log('Found', participantsData.length, 'participants');
      
      // Auto-starta quizet om flaggan är satt
      if (autoStart && quizData.questions.length > 0) {
        console.log('Auto-starting quiz in 1 second...');
        setTimeout(() => {
          console.log('Calling handleStartQuiz...');
          handleStartQuiz();
        }, 1000);
      } else {
        console.log('Not auto-starting. autoStart:', autoStart, 'questions:', quizData.questions.length);
      }
      
    } catch (err) {
      setError('Kunde inte ladda quiz-data');
      console.error('Error initializing:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    console.log('handleStartQuiz called. Quiz:', !!quiz, 'SessionId:', !!sessionId);
    
    if (!quiz || !sessionId) {
      console.log('Cannot start quiz - missing quiz or sessionId');
      return;
    }
    
    try {
      console.log('Setting quiz as started...');
      setIsQuizStarted(true);
      setCurrentQuestionIndex(0);
      
      // Uppdatera databasen med första frågan
      console.log('Updating database with first question...');
      await updateSessionQuestion(sessionId, 0);
      console.log('✅ Started quiz successfully! Updated database with question index 0');
      
    } catch (err) {
      console.error('❌ Error starting quiz:', err);
      alert('Kunde inte starta quizet');
    }
  };

  const handleNextQuestion = async () => {
    if (!quiz || !sessionId) return;
    
    const nextIndex = currentQuestionIndex + 1;
    
    if (nextIndex < quiz.questions.length) {
      try {
        setCurrentQuestionIndex(nextIndex);
        
        // Uppdatera databasen så eleverna får nya frågan
        await updateSessionQuestion(sessionId, nextIndex);
        console.log(`Advanced to question ${nextIndex + 1}/${quiz.questions.length}`);
        
      } catch (err) {
        console.error('Error advancing question:', err);
        alert('Kunde inte gå till nästa fråga');
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
        setCurrentQuestionIndex(prevIndex);
        
        // Uppdatera databasen
        await updateSessionQuestion(sessionId, prevIndex);
        console.log(`Went back to question ${prevIndex + 1}/${quiz.questions.length}`);
        
      } catch (err) {
        console.error('Error going back:', err);
        alert('Kunde inte gå tillbaka');
      }
    }
  };

  const handleEndQuiz = async () => {
    try {
      // Avsluta quiz session
      await endQuizSession(sessionId!);
      setIsQuizEnded(true);
      console.log('Quiz ended');
    } catch (err) {
      console.error('Error ending quiz:', err);
    }
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
              <span className="participant-count">👥 {participants.length} elever</span>
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
                      <span className="stat-number">{participants.length}</span>
                      <span className="stat-label">Elever anslutna</span>
                    </div>
                  </div>
                  <div className="start-controls">
                    {autoStart && (
                      <div className="auto-starting">
                        <p>🔄 Startar automatiskt för alla elever...</p>
                      </div>
                    )}
                    <button 
                      onClick={handleStartQuiz} 
                      className="start-quiz-button"
                      disabled={participants.length === 0}
                    >
                      🚀 {autoStart ? 'Starta Quiz Nu' : 'Starta Quiz för alla elever'}
                    </button>
                  </div>
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
                      <span className="timer-text">{currentQuestion.time_limit}s</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={handleNextQuestion}
                    className="nav-button next-button"
                  >
                    {currentQuestionIndex === quiz.questions.length - 1 ? '🏁 Avsluta Quiz' : 'Nästa →'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="quiz-ended-section">
                <div className="end-card">
                  <h2>🎉 Quiz Avslutat!</h2>
                  <p>Alla frågor har visats för eleverna.</p>
                  <div className="end-actions">
                    <button onClick={handleBackToDashboard} className="back-button">
                      Tillbaka till Dashboard
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="participants-sidebar">
            <h3>👥 Anslutna Elever ({participants.length})</h3>
            <div className="participants-list">
              {participants.map((participant) => (
                <div key={participant.id} className="participant-item">
                  <span className="participant-name">{participant.participant_name}</span>
                  <span className="connection-status">🟢</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </DynamicBackground>
  );
}

export default TeacherQuizControllerSimple;