import React from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicBackground from './DynamicBackground';
import './SessionModeSelection.css';

function SessionModeSelection() {
  const navigate = useNavigate();

  return (
    <DynamicBackground>
      <div className="mode-selection-container">
        <header className="mode-selection-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Tillbaka
          </button>
          <h1>🏫 Klassrumsläge</h1>
          <p>Välj vad du vill göra</p>
        </header>

        <main className="mode-selection-content">
          <div className="mode-options">
            <div className="mode-card teacher-card">
              <div className="mode-icon">👩‍🏫</div>
              <h2>Jag är lärare</h2>
              <p>Skapa en session där elever kan gå med via sessionskod</p>
              <ul className="feature-list">
                <li>Skapa quiz-session</li>
                <li>Få sessionskod att dela</li>
                <li>Se anslutna elever</li>
                <li>Starta quiz för alla</li>
              </ul>
              <button 
                onClick={() => navigate('/session/create')}
                className="mode-button teacher-button"
              >
                🚀 Skapa Session
              </button>
            </div>

            <div className="mode-card student-card">
              <div className="mode-icon">🧑‍🎓</div>
              <h2>Jag är elev</h2>
              <p>Gå med i en session med sessionskod från din lärare</p>
              <ul className="feature-list">
                <li>Ange sessionskod</li>
                <li>Gå med i klassens session</li>
                <li>Vänta på att läraren startar</li>
                <li>Spela quiz tillsammans</li>
              </ul>
              <button 
                onClick={() => navigate('/session/join')}
                className="mode-button student-button"
              >
                👋 Gå med i Session
              </button>
            </div>
          </div>
        </main>
      </div>
    </DynamicBackground>
  );
}

export default SessionModeSelection;