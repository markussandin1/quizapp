import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getQuiz, getSessionParticipants, getSessionById } from '../lib/supabase';
import DynamicBackground from './DynamicBackground';
import './TeacherQuizControl.css';

interface Quiz {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  questions: Question[];
}

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
}

function TeacherQuizControl() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [isQuizEnded, setIsQuizEnded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Session data från state
  const sessionId = location.state?.sessionId;
  const sessionCode = location.state?.sessionCode;
  const quizId = parseInt(location.pathname.split('/').pop() || '0');

  useEffect(() => {
    if (quizId) {
      fetchQuizData();
      fetchParticipants();
      
      // Poll för participant uppdateringar
      const interval = setInterval(fetchParticipants, 5000);
      return () => clearInterval(interval);
    }
  }, [quizId]);

  const fetchQuizData = async () => {
    try {
      const quizData = await getQuiz(quizId);
      setQuiz(quizData);
    } catch (err) {
      setError('Kunde inte hämta quiz-data');
      console.error('Error fetching quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!sessionId) return;
    
    try {
      const participantsData = await getSessionParticipants(sessionId);
      setParticipants(participantsData);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const handleStartQuiz = () => {
    setIsQuizStarted(true);
    setCurrentQuestionIndex(0);
  };

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleEndQuiz();
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
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
        <div className="teacher-control-container">
          <div className="loading">Laddar quiz...</div>
        </div>
      </DynamicBackground>
    );
  }

  if (error || !quiz) {
    return (
      <DynamicBackground>
        <div className="teacher-control-container">
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
      <div className="teacher-control-container">
        <header className="control-header">
          <div className="session-info">
            <h1>🏫 Lärarkontroll - {quiz.title}</h1>
            <div className="session-details">
              <span className="session-code">Kod: {sessionCode}</span>
              <span className="participant-count">👥 {participants.length} elever</span>
            </div>
          </div>
          <button onClick={handleBackToDashboard} className="back-button">
            ← Dashboard
          </button>
        </header>

        <main className="control-content">
          {!isQuizStarted ? (
            <div className="pre-start-section">
              <div className="quiz-overview">
                <h2>Redo att starta quiz</h2>
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
                <button onClick={handleStartQuiz} className="start-quiz-button">
                  🚀 Starta Quiz för alla elever
                </button>
              </div>
            </div>
          ) : (
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
                    <h3>💡 Förklaring (visas efter svar)</h3>
                    <p>{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>

              <div className="control-actions">
                <button 
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="nav-button prev-button"
                >
                  ← Föregående
                </button>
                
                <div className="timer-info">
                  <span>⏱️ {currentQuestion.time_limit}s per fråga</span>
                </div>
                
                <button 
                  onClick={handleNextQuestion}
                  className="nav-button next-button"
                >
                  {currentQuestionIndex === quiz.questions.length - 1 ? '🏁 Avsluta Quiz' : 'Nästa →'}
                </button>
              </div>
            </div>
          )}

          {isQuizEnded && (
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

          <div className="participants-sidebar">
            <h3>👥 Anslutna Elever</h3>
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

export default TeacherQuizControl;