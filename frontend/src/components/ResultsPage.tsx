import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import './ResultsPage.css';

function ResultsPage() {
  const navigate = useNavigate();
  const { state } = useQuiz();

  if (!state.currentQuiz) {
    return (
      <div className="results-container">
        <div className="error">Inga resultat tillgängliga</div>
        <button onClick={() => navigate('/')}>Tillbaka till start</button>
      </div>
    );
  }

  const calculateScore = () => {
    let correctAnswers = 0;
    let totalPoints = 0;
    let earnedPoints = 0;

    state.currentQuiz!.questions.forEach((question) => {
      totalPoints += question.points;
      const userAnswer = state.answers[question.id];
      if (userAnswer === question.correct_answer) {
        correctAnswers++;
        earnedPoints += question.points;
      }
    });

    return {
      correctAnswers,
      totalQuestions: state.currentQuiz!.questions.length,
      earnedPoints,
      totalPoints,
      percentage: Math.round((correctAnswers / state.currentQuiz!.questions.length) * 100),
    };
  };

  const score = calculateScore();

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return { emoji: '🌟', message: 'Fantastiskt! Du är en riktig expert!' };
    if (percentage >= 80) return { emoji: '🎉', message: 'Mycket bra gjort!' };
    if (percentage >= 70) return { emoji: '👍', message: 'Bra jobbat!' };
    if (percentage >= 60) return { emoji: '👌', message: 'Bra försök!' };
    return { emoji: '💪', message: 'Fortsätt träna så blir du bättre!' };
  };

  const performance = getPerformanceMessage(score.percentage);

  const restartQuiz = () => {
    window.location.reload();
  };

  return (
    <div className="results-container">
      <div className="results-card">
        <div className="results-header">
          <h1>Quiz Slutfört!</h1>
          <div className="performance-emoji">{performance.emoji}</div>
        </div>

        <div className="score-section">
          <div className="main-score">
            <div className="score-circle">
              <div className="score-percentage">{score.percentage}%</div>
              <div className="score-label">rätt</div>
            </div>
          </div>

          <div className="score-details">
            <div className="score-item">
              <span className="score-number">{score.correctAnswers}</span>
              <span className="score-text">av {score.totalQuestions} rätt</span>
            </div>
            <div className="score-item">
              <span className="score-number">{score.earnedPoints}</span>
              <span className="score-text">av {score.totalPoints} poäng</span>
            </div>
          </div>
        </div>

        <div className="performance-message">
          <h2>{performance.message}</h2>
        </div>

        <div className="quiz-summary">
          <h3>Quiz: {state.currentQuiz.title}</h3>
          {state.currentQuiz.description && (
            <p>{state.currentQuiz.description}</p>
          )}
        </div>

        <div className="action-buttons">
          <button className="primary-button" onClick={restartQuiz}>
            Gör igen
          </button>
          <button className="secondary-button" onClick={() => navigate('/')}>
            Välj nytt quiz
          </button>
        </div>

        <div className="detailed-results">
          <h3>Dina svar:</h3>
          <div className="answers-list">
            {state.currentQuiz.questions.map((question, index) => {
              const userAnswer = state.answers[question.id];
              const isCorrect = userAnswer === question.correct_answer;
              
              return (
                <div key={question.id} className={`answer-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="question-number">
                    Fråga {index + 1}
                  </div>
                  <div className="answer-content">
                    <div className="question-preview">
                      {question.question_text.length > 50 
                        ? `${question.question_text.substring(0, 50)}...`
                        : question.question_text
                      }
                    </div>
                    <div className="answer-details">
                      <div className="user-answer">
                        Ditt svar: {userAnswer || 'Inget svar'}
                      </div>
                      {!isCorrect && (
                        <div className="correct-answer">
                          Rätt svar: {question.correct_answer}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="answer-icon">
                    {isCorrect ? '✅' : '❌'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultsPage;