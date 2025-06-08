import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="progress-container">
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="progress-text">
        {Math.round(progress)}% klart
      </div>
    </div>
  );
}

export default ProgressBar;