import React, { useState, useEffect } from 'react';
import { getQuestionAnswers } from '../lib/supabase';
import { useSession } from '../context/SessionContext';
import './LiveSessionStats.css';

interface Answer {
  id: string;
  participant_id: string;
  answer: string;
  answered_at: string;
  time_taken: number;
  participant: {
    participant_name: string;
  };
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options?: string[];
  correct_answer: string;
  points: number;
}

interface LiveSessionStatsProps {
  sessionId: string;
  currentQuestion: Question;
}

function LiveSessionStats({ sessionId, currentQuestion }: LiveSessionStatsProps) {
  const { state: sessionState } = useSession();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnswers();
    // Polling for real-time updates (could be improved with websockets)
    const interval = setInterval(fetchAnswers, 2000);
    return () => clearInterval(interval);
  }, [currentQuestion.id]);

  const fetchAnswers = async () => {
    try {
      const answerData = await getQuestionAnswers(sessionId, currentQuestion.id);
      setAnswers(answerData);
    } catch (err) {
      console.error('Error fetching answers:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalParticipants = sessionState.participants.length;
    const totalAnswers = answers.length;
    const responseRate = totalParticipants > 0 ? (totalAnswers / totalParticipants) * 100 : 0;

    // Calculate answer distribution
    const answerCounts: { [key: string]: number } = {};
    answers.forEach(answer => {
      answerCounts[answer.answer] = (answerCounts[answer.answer] || 0) + 1;
    });

    // Calculate correct answers
    const correctAnswers = answers.filter(answer => answer.answer === currentQuestion.correct_answer).length;
    const correctRate = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

    // Calculate average time
    const averageTime = totalAnswers > 0 
      ? answers.reduce((sum, answer) => sum + answer.time_taken, 0) / totalAnswers 
      : 0;

    return {
      totalParticipants,
      totalAnswers,
      responseRate,
      answerCounts,
      correctAnswers,
      correctRate,
      averageTime
    };
  };

  const getAnswerOptions = () => {
    if (currentQuestion.question_type === 'multiple_choice' && currentQuestion.options) {
      return currentQuestion.options;
    } else if (currentQuestion.question_type === 'true_false') {
      return ['true', 'false'];
    }
    return [];
  };

  const getAnswerColor = (option: string, index: number) => {
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
    if (currentQuestion.question_type === 'true_false') {
      return option === 'true' ? '#28a745' : '#dc3545';
    }
    return colors[index % colors.length];
  };

  const stats = calculateStats();
  const options = getAnswerOptions();

  if (loading) {
    return (
      <div className="live-stats-container">
        <div className="stats-loading">Laddar statistik...</div>
      </div>
    );
  }

  return (
    <div className="live-stats-container">
      <div className="stats-header">
        <h3>📊 Live Statistik - Fråga {currentQuestion.id}</h3>
        <div className="refresh-indicator">
          <span className="refresh-dot"></span>
          Live
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalAnswers}</div>
          <div className="stat-label">Svar</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.responseRate.toFixed(0)}%</div>
          <div className="stat-label">Svarsfrekvens</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.correctRate.toFixed(0)}%</div>
          <div className="stat-label">Rätt svar</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{stats.averageTime.toFixed(1)}s</div>
          <div className="stat-label">Genomsnitt tid</div>
        </div>
      </div>

      <div className="answer-distribution">
        <h4>Svarsfördelning</h4>
        <div className="distribution-chart">
          {options.map((option, index) => {
            const count = stats.answerCounts[option] || 0;
            const percentage = stats.totalAnswers > 0 ? (count / stats.totalAnswers) * 100 : 0;
            const isCorrect = option === currentQuestion.correct_answer;
            
            return (
              <div key={option} className="answer-bar">
                <div className="answer-info">
                  <span className="answer-label">
                    {currentQuestion.question_type === 'multiple_choice' 
                      ? `${String.fromCharCode(65 + index)}: ${option}`
                      : option === 'true' ? 'Sant' : 'Falskt'
                    }
                    {isCorrect && ' ✓'}
                  </span>
                  <span className="answer-count">{count} ({percentage.toFixed(0)}%)</span>
                </div>
                <div className="bar-container">
                  <div 
                    className={`bar-fill ${isCorrect ? 'correct' : ''}`}
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: getAnswerColor(option, index)
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="recent-answers">
        <h4>Senaste svar</h4>
        <div className="answers-list">
          {answers
            .sort((a, b) => new Date(b.answered_at).getTime() - new Date(a.answered_at).getTime())
            .slice(0, 8)
            .map((answer) => (
              <div key={answer.id} className="answer-item">
                <span className="student-name">{answer.participant.participant_name}</span>
                <span className={`answer-value ${answer.answer === currentQuestion.correct_answer ? 'correct' : 'incorrect'}`}>
                  {currentQuestion.question_type === 'multiple_choice' 
                    ? answer.answer
                    : answer.answer === 'true' ? 'Sant' : 'Falskt'
                  }
                </span>
                <span className="answer-time">{answer.time_taken}s</span>
              </div>
            ))}
          {answers.length === 0 && (
            <div className="no-answers">Inga svar än...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveSessionStats;