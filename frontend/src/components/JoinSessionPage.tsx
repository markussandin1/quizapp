import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { joinSession } from '../lib/supabase';
import DynamicBackground from './DynamicBackground';
import './JoinSessionPage.css';

function JoinSessionPage() {
  const [sessionCode, setSessionCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleJoinSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sessionCode.trim() || !participantName.trim()) {
      setError('Ange både sessionskod och ditt namn');
      return;
    }

    if (sessionCode.length !== 6 || !/^\d+$/.test(sessionCode)) {
      setError('Sessionskod måste vara 6 siffror');
      return;
    }

    setJoining(true);
    setError(null);

    try {
      const sessionId = await joinSession(sessionCode.trim(), participantName.trim());
      
      // Navigera till waiting room
      navigate(`/session/${sessionCode}/waiting`, { 
        state: { sessionId, participantName } 
      });
    } catch (err) {
      setError('Kunde inte gå med i session. Kontrollera sessionskoden.');
      console.error('Error joining session:', err);
    } finally {
      setJoining(false);
    }
  };

  const handleSessionCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setSessionCode(value);
  };

  return (
    <DynamicBackground>
      <div className="join-session-container">
        <header className="join-session-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Tillbaka
          </button>
          <h1>👋 Gå med i Session</h1>
          <p>Ange sessionskoden från din lärare för att gå med</p>
        </header>

        <main className="join-session-content">
          <form onSubmit={handleJoinSession} className="join-form">
            <div className="form-group">
              <label htmlFor="sessionCode">Sessionskod:</label>
              <input
                id="sessionCode"
                type="text"
                value={sessionCode}
                onChange={handleSessionCodeChange}
                placeholder="123456"
                className="session-code-input"
                maxLength={6}
                required
              />
              <div className="input-hint">6 siffror från din lärare</div>
            </div>

            <div className="form-group">
              <label htmlFor="participantName">Ditt namn:</label>
              <input
                id="participantName"
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder="Ange ditt namn"
                className="form-input"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="join-button"
              disabled={joining || !sessionCode || !participantName.trim()}
            >
              {joining ? 'Går med...' : '🚀 Gå med i Session'}
            </button>
          </form>

          <div className="join-info">
            <div className="info-card">
              <h3>💡 Tips</h3>
              <ul>
                <li>Be din lärare om den 6-siffriga sessionskoden</li>
                <li>Ange ditt riktiga namn så läraren känner igen dig</li>
                <li>Vänta på att läraren startar quizet</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </DynamicBackground>
  );
}

export default JoinSessionPage;