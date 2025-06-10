import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getSessionById, getSessionParticipants, updateSessionStatus } from '../lib/supabase';
import DynamicBackground from './DynamicBackground';
import './TeacherSessionDashboard.css';

interface Session {
  id: string;
  session_code: string;
  teacher_name: string;
  started_at?: string;
  ended_at?: string;
  quiz: {
    id: number;
    title: string;
    description?: string;
    image_url?: string;
  };
}

interface Participant {
  id: string;
  participant_name: string;
  joined_at: string;
}

function TeacherSessionDashboard() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingQuiz, setStartingQuiz] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionCode = location.state?.sessionCode;
  const teacherName = location.state?.teacherName;

  useEffect(() => {
    if (!sessionId) {
      setError('Ingen session-ID angiven');
      return;
    }
    
    fetchSessionData();
    
    // Poll för uppdateringar var 5:e sekund
    const interval = setInterval(fetchSessionData, 5000);
    
    return () => clearInterval(interval);
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      if (!sessionId) return;
      
      // Hämta session-info
      const sessionData = await getSessionById(sessionId);
      setSession(sessionData);
      
      // Hämta deltagare
      const participantsData = await getSessionParticipants(sessionId);
      setParticipants(participantsData);
      
    } catch (err) {
      setError('Kunde inte hämta sessiondata');
      console.error('Error fetching session data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!session || participants.length === 0) {
      alert('Vänta tills minst en elev har gått med innan du startar.');
      return;
    }

    if (!window.confirm(`Starta quizet för ${participants.length} deltagare?`)) {
      return;
    }

    setStartingQuiz(true);

    try {
      await updateSessionStatus(sessionId!, 'started');
      
      // Navigera till teacher control panel
      navigate(`/session/${sessionId}/control/${session.quiz.id}`, {
        state: { 
          sessionId,
          sessionCode: session.session_code
        }
      });
    } catch (err) {
      alert('Kunde inte starta quizet');
      console.error('Error starting quiz:', err);
    } finally {
      setStartingQuiz(false);
    }
  };

  const handleEndSession = async () => {
    if (!window.confirm('Är du säker på att du vill avsluta sessionen? Detta kan inte ångras.')) {
      return;
    }

    setEndingSession(true);

    try {
      await updateSessionStatus(sessionId!, 'ended');
      navigate('/');
    } catch (err) {
      alert('Kunde inte avsluta sessionen');
      console.error('Error ending session:', err);
    } finally {
      setEndingSession(false);
    }
  };

  const copySessionCode = () => {
    if (session?.session_code) {
      navigator.clipboard.writeText(session.session_code);
      // Visa kort feedback
      const button = document.querySelector('.copy-button');
      if (button) {
        button.textContent = '✅ Kopierat!';
        setTimeout(() => {
          button.textContent = '📋 Kopiera';
        }, 2000);
      }
    }
  };

  if (loading) {
    return (
      <DynamicBackground>
        <div className="teacher-dashboard-container">
          <div className="loading">Laddar session...</div>
        </div>
      </DynamicBackground>
    );
  }

  if (error || !session) {
    return (
      <DynamicBackground>
        <div className="teacher-dashboard-container">
          <div className="error-state">
            <h2>⚠️ Något gick fel</h2>
            <p>{error || 'Session kunde inte hittas'}</p>
            <button onClick={() => navigate('/session/create')} className="retry-button">
              Skapa ny session
            </button>
          </div>
        </div>
      </DynamicBackground>
    );
  }

  const isStarted = !!session.started_at;
  const isEnded = !!session.ended_at;

  return (
    <DynamicBackground>
      <div className="teacher-dashboard-container">
        <header className="dashboard-header">
          <div className="session-overview">
            <h1>🏫 Lärarpanel</h1>
            <div className="session-details">
              <div className="session-code-display">
                <span className="code-label">Sessionskod för elever:</span>
                <div className="code-container">
                  <span className="code-value">{session.session_code}</span>
                  <button onClick={copySessionCode} className="copy-button">
                    📋 Kopiera
                  </button>
                </div>
              </div>
              <div className="quiz-info">
                <h2>{session.quiz.title}</h2>
                <p>Lärare: {session.teacher_name}</p>
              </div>
            </div>
          </div>
          
          {session.quiz.image_url && (
            <div className="quiz-thumbnail">
              <img src={session.quiz.image_url} alt="Quiz" />
            </div>
          )}
        </header>

        <main className="dashboard-content">
          <div className="status-section">
            <div className="status-card">
              {!isStarted && !isEnded && (
                <>
                  <div className="status-icon">⏳</div>
                  <h3>Väntar på start</h3>
                  <p>Eleverna väntar på att du startar quizet</p>
                </>
              )}
              {isStarted && !isEnded && (
                <>
                  <div className="status-icon">🚀</div>
                  <h3>Quiz pågår</h3>
                  <p>Startat: {new Date(session.started_at!).toLocaleTimeString('sv-SE')}</p>
                </>
              )}
              {isEnded && (
                <>
                  <div className="status-icon">✅</div>
                  <h3>Session avslutad</h3>
                  <p>Avslutad: {new Date(session.ended_at!).toLocaleTimeString('sv-SE')}</p>
                </>
              )}
            </div>
          </div>

          <div className="participants-section">
            <div className="participants-card">
              <h3>👥 Anslutna elever ({participants.length})</h3>
              {participants.length === 0 ? (
                <div className="no-participants">
                  <p>Inga elever har gått med än...</p>
                  <p className="hint">Be dina elever gå till appen och använda sessionskod: <strong>{session.session_code}</strong></p>
                </div>
              ) : (
                <div className="participants-grid">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="participant-card">
                      <div className="participant-avatar">
                        {index + 1}
                      </div>
                      <div className="participant-info">
                        <span className="participant-name">{participant.participant_name}</span>
                        <span className="join-time">
                          Gick med: {new Date(participant.joined_at).toLocaleTimeString('sv-SE', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="dashboard-footer">
          <div className="action-buttons">
            {!isStarted && !isEnded && (
              <>
                <button 
                  onClick={handleStartQuiz}
                  className="start-button"
                  disabled={startingQuiz || participants.length === 0}
                >
                  {startingQuiz ? 'Startar...' : '🚀 Starta Quiz'}
                </button>
                <button 
                  onClick={handleEndSession}
                  className="end-button"
                  disabled={endingSession}
                >
                  {endingSession ? 'Avslutar...' : '🚪 Avsluta Session'}
                </button>
              </>
            )}
            
            {isStarted && !isEnded && (
              <button 
                onClick={handleEndSession}
                className="end-button"
                disabled={endingSession}
              >
                {endingSession ? 'Avslutar...' : '⏹️ Avsluta Session'}
              </button>
            )}
            
            {isEnded && (
              <button 
                onClick={() => navigate('/session/create')}
                className="new-session-button"
              >
                🆕 Skapa ny session
              </button>
            )}
          </div>
        </footer>
      </div>
    </DynamicBackground>
  );
}

export default TeacherSessionDashboard;