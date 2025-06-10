import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getSession, getSessionParticipants, getSessionById } from '../lib/supabase';
import DynamicBackground from './DynamicBackground';
import './SessionWaitingRoom.css';

interface Session {
  id: string;
  session_code: string;
  teacher_name: string;
  started_at?: string;
  quiz: {
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

function SessionWaitingRoom() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const sessionId = location.state?.sessionId;
  const participantName = location.state?.participantName;

  useEffect(() => {
    if (!sessionCode) {
      setError('Ingen sessionskod angiven');
      return;
    }
    
    fetchSessionData();
    
    // Poll för uppdateringar var 3:e sekund
    const interval = setInterval(fetchSessionData, 3000);
    
    return () => clearInterval(interval);
  }, [sessionCode]);

  const fetchSessionData = async () => {
    try {
      if (!sessionCode) return;
      
      // Hämta session-info
      const sessionData = await getSession(sessionCode);
      setSession(sessionData);
      
      // Kontrollera om quizet har startat
      if (sessionData.started_at) {
        // Navigera till quiz-spelning - använd quiz.id från joined data
        navigate(`/quiz/${sessionData.quiz.id}`, {
          state: { 
            sessionMode: true, 
            sessionId: sessionData.id,
            participantName 
          }
        });
        return;
      }
      
      // Hämta deltagare
      const participantsData = await getSessionParticipants(sessionData.id);
      setParticipants(participantsData);
      
    } catch (err) {
      setError('Kunde inte hämta sessiondata');
      console.error('Error fetching session data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveSession = () => {
    navigate('/session/join');
  };

  if (loading) {
    return (
      <DynamicBackground>
        <div className="waiting-room-container">
          <div className="loading">Laddar session...</div>
        </div>
      </DynamicBackground>
    );
  }

  if (error || !session) {
    return (
      <DynamicBackground>
        <div className="waiting-room-container">
          <div className="error-state">
            <h2>⚠️ Något gick fel</h2>
            <p>{error || 'Session kunde inte hittas'}</p>
            <button onClick={() => navigate('/session/join')} className="retry-button">
              Försök igen
            </button>
          </div>
        </div>
      </DynamicBackground>
    );
  }

  return (
    <DynamicBackground>
      <div className="waiting-room-container">
        <header className="waiting-header">
          <div className="session-info">
            <div className="session-code">
              <span className="code-label">Sessionskod:</span>
              <span className="code-value">{session.session_code}</span>
            </div>
            <h1>{session.quiz.title}</h1>
            <p className="teacher-name">Lärare: {session.teacher_name}</p>
          </div>
          
          {session.quiz.image_url && (
            <div className="quiz-image">
              <img src={session.quiz.image_url} alt="Quiz" />
            </div>
          )}
        </header>

        <main className="waiting-content">
          <div className="status-card">
            <div className="status-icon">⏳</div>
            <h2>Väntar på att läraren startar quizet...</h2>
            <p>Du är ansluten och redo att börja!</p>
          </div>

          <div className="participants-card">
            <h3>👥 Deltagare ({participants.length})</h3>
            <div className="participants-list">
              {participants.map((participant) => (
                <div 
                  key={participant.id} 
                  className={`participant-item ${participant.participant_name === participantName ? 'current-user' : ''}`}
                >
                  <span className="participant-name">{participant.participant_name}</span>
                  {participant.participant_name === participantName && (
                    <span className="you-indicator">(Du)</span>
                  )}
                  <span className="join-time">
                    {new Date(participant.joined_at).toLocaleTimeString('sv-SE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="quiz-info-card">
            <h3>📝 Om detta quiz</h3>
            <p>{session.quiz.description || 'Inga ytterligare detaljer tillgängliga.'}</p>
          </div>
        </main>

        <footer className="waiting-footer">
          <button onClick={handleLeaveSession} className="leave-button">
            🚪 Lämna Session
          </button>
        </footer>
      </div>
    </DynamicBackground>
  );
}

export default SessionWaitingRoom;