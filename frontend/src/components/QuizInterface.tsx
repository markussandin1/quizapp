import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import './QuizInterface.css';

function QuizInterface() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useQuiz();
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (id) {
      fetchQuiz(parseInt(id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchQuiz = async (quizId: number) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/quiz/${quizId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }
      const quiz = await response.json();
      dispatch({ type: 'SET_QUIZ', payload: quiz });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback || isProcessing) return; // Prevent clicking during feedback or processing
    
    setIsProcessing(true);
    setSelectedAnswer(answer);
    
    // Immediately submit the answer
    const currentQuestion = state.currentQuiz!.questions[state.currentQuestionIndex];
    const correct = answer === currentQuestion.correct_answer;
    
    setIsCorrect(correct);
    setShowFeedback(true);

    dispatch({
      type: 'SET_ANSWER',
      payload: {
        questionId: currentQuestion.id,
        answer: answer,
      },
    });

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer('');
      setIsProcessing(false);
      
      if (state.currentQuestionIndex < state.currentQuiz!.questions.length - 1) {
        dispatch({ type: 'NEXT_QUESTION' });
      } else {
        dispatch({ type: 'COMPLETE_QUIZ' });
        navigate('/results/1');
      }
    }, 2000);
  };

  const handleTimeUp = () => {
    if (showFeedback || isProcessing) return; // If already answered or processing, don't do anything
    
    setIsProcessing(true);
    
    // Auto-submit with no answer when time runs out
    setShowFeedback(true);
    setIsCorrect(false);
    setSelectedAnswer(''); // No answer selected

    const currentQuestion = state.currentQuiz!.questions[state.currentQuestionIndex];
    dispatch({
      type: 'SET_ANSWER',
      payload: {
        questionId: currentQuestion.id,
        answer: '', // Empty answer for timeout
      },
    });

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer('');
      setIsProcessing(false);
      
      if (state.currentQuestionIndex < state.currentQuiz!.questions.length - 1) {
        dispatch({ type: 'NEXT_QUESTION' });
      } else {
        dispatch({ type: 'COMPLETE_QUIZ' });
        navigate('/results/1');
      }
    }, 2000);
  };

  if (state.loading) {
    return (
      <div className="quiz-container">
        <div className="loading">Laddar quiz...</div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="quiz-container">
        <div className="error">Fel: {state.error}</div>
        <button onClick={() => navigate('/')}>Tillbaka till start</button>
      </div>
    );
  }

  if (!state.currentQuiz) {
    return (
      <div className="quiz-container">
        <div className="error">Quiz kunde inte laddas</div>
        <button onClick={() => navigate('/')}>Tillbaka till start</button>
      </div>
    );
  }

  if (state.isQuizCompleted) {
    return (
      <div className="quiz-container">
        <div className="completion-message">
          <h2>🎉 Grattis! Du har klarat quizet!</h2>
          <button onClick={() => navigate('/results/1')}>Se resultat</button>
        </div>
      </div>
    );
  }

  const currentQuestion = state.currentQuiz.questions[state.currentQuestionIndex];
  const progress = ((state.currentQuestionIndex + 1) / state.currentQuiz.questions.length) * 100;

  return (
    <div className="quiz-container">
      <header className="quiz-header">
        <span className="question-counter">
          Fråga {state.currentQuestionIndex + 1} av {state.currentQuiz.questions.length}
        </span>
        <h1>{state.currentQuiz.title}</h1>
        <Timer
          timeLimit={currentQuestion.time_limit}
          onTimeUp={handleTimeUp}
          isActive={!showFeedback && !isProcessing}
        />
        <ProgressBar progress={progress} />
      </header>

      <main className="question-area">
        <div className="question-card">
          {currentQuestion.image_url && (
            <div className="question-image">
              <img src={currentQuestion.image_url} alt="Frågebild" className="question-img" />
            </div>
          )}
          <h2 className="question-text">{currentQuestion.question_text}</h2>

          {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
            <div className="options-grid">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${selectedAnswer === option ? 'selected' : ''} ${
                    showFeedback && option === currentQuestion.correct_answer ? 'correct-answer' : ''
                  } ${
                    showFeedback && selectedAnswer === option && option !== currentQuestion.correct_answer ? 'wrong-answer' : ''
                  }`}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={showFeedback || isProcessing}
                >
                  {String.fromCharCode(65 + index)}. {option}
                </button>
              ))}
            </div>
          )}

          {currentQuestion.question_type === 'true_false' && (
            <div className="options-grid">
              <button
                className={`option-button ${selectedAnswer === 'true' ? 'selected' : ''} ${
                  showFeedback && currentQuestion.correct_answer === 'true' ? 'correct-answer' : ''
                } ${
                  showFeedback && selectedAnswer === 'true' && currentQuestion.correct_answer !== 'true' ? 'wrong-answer' : ''
                }`}
                onClick={() => handleAnswerSelect('true')}
                disabled={showFeedback || isProcessing}
              >
                Sant
              </button>
              <button
                className={`option-button ${selectedAnswer === 'false' ? 'selected' : ''} ${
                  showFeedback && currentQuestion.correct_answer === 'false' ? 'correct-answer' : ''
                } ${
                  showFeedback && selectedAnswer === 'false' && currentQuestion.correct_answer !== 'false' ? 'wrong-answer' : ''
                }`}
                onClick={() => handleAnswerSelect('false')}
                disabled={showFeedback || isProcessing}
              >
                Falskt
              </button>
            </div>
          )}

        </div>

        {showFeedback && (
          <div className={`feedback ${isCorrect ? 'correct' : 'incorrect'} ${
            currentQuestion.explanation ? 'has-explanation' : ''
          }`}>
            <div className="feedback-content">
              <div className="feedback-header">
                <span className="feedback-icon">
                  {isCorrect ? '🎉' : '😞'}
                </span>
                <span className="feedback-text">
                  {isCorrect ? 'Rätt svar!' : 'Fel svar'}
                </span>
              </div>
              
              {!isCorrect && (
                <div className="correct-answer">
                  Rätt svar: {currentQuestion.correct_answer}
                </div>
              )}
              
              {currentQuestion.explanation && (
                <div className="explanation">
                  <strong>Förklaring:</strong> {currentQuestion.explanation}
                </div>
              )}
              
              {currentQuestion.article_url && (
                <div className="article-link">
                  <a href={currentQuestion.article_url} target="_blank" rel="noopener noreferrer" className="read-more-link">
                    🔗 Läs mer i källartikeln
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default QuizInterface;