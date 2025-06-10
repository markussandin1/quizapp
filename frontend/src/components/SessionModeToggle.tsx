import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SessionModeToggle.css';

interface SessionModeToggleProps {
  currentMode: 'individual' | 'classroom';
  onModeChange: (mode: 'individual' | 'classroom') => void;
}

function SessionModeToggle({ currentMode, onModeChange }: SessionModeToggleProps) {
  const navigate = useNavigate();

  const handleModeChange = (mode: 'individual' | 'classroom') => {
    onModeChange(mode);
    
    if (mode === 'classroom') {
      // Navigera till classroom mode start
      navigate('/session/mode');
    }
  };

  return (
    <div className="session-mode-toggle">
      <div className="toggle-container">
        <button
          className={`toggle-button ${currentMode === 'individual' ? 'active' : ''}`}
          onClick={() => handleModeChange('individual')}
        >
          <span className="toggle-icon">👤</span>
          <span className="toggle-text">Individual</span>
        </button>
        
        <button
          className={`toggle-button ${currentMode === 'classroom' ? 'active' : ''}`}
          onClick={() => handleModeChange('classroom')}
        >
          <span className="toggle-icon">🏫</span>
          <span className="toggle-text">Classroom</span>
        </button>
      </div>
      
      <div className="mode-description">
        {currentMode === 'individual' ? (
          <p>Spela quiz på egen hand</p>
        ) : (
          <p>Skapa eller gå med i en klassrumssession</p>
        )}
      </div>
    </div>
  );
}

export default SessionModeToggle;