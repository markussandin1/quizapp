import React, { useState, useEffect } from 'react';
import './Timer.css';

interface TimerProps {
  timeLimit: number;
  onTimeUp: () => void;
  isActive: boolean;
}

function Timer({ timeLimit, onTimeUp, isActive }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (!isActive) return;

    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, isActive, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const percentage = (timeLeft / timeLimit) * 100;
    if (percentage > 50) return '#4CAF50';
    if (percentage > 20) return '#FF9800';
    return '#F44336';
  };

  const percentage = (timeLeft / timeLimit) * 100;

  return (
    <div className="timer-container">
      <div className="timer-circle">
        <svg className="timer-svg" viewBox="0 0 100 100">
          <circle
            className="timer-background"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="8"
          />
          <circle
            className="timer-progress"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={getTimerColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - percentage / 100)}`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="timer-text">
          <div className="timer-time">{formatTime(timeLeft)}</div>
          <div className="timer-label">kvar</div>
        </div>
      </div>
    </div>
  );
}

export default Timer;