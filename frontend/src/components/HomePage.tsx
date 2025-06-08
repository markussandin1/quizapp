import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicBackground from './DynamicBackground';
import './HomePage.css';

interface Quiz {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  created_at: string;
}

function HomePage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/quiz');
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      const data = await response.json();
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = (quizId: number) => {
    navigate(`/quiz/${quizId}`);
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">Laddar quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-container">
        <div className="error">Fel: {error}</div>
        <button className="retry-button" onClick={fetchQuizzes}>
          Försök igen
        </button>
      </div>
    );
  }

  return (
    <DynamicBackground>
      <div className="home-container">
        <header className="home-header">
          <div className="header-top">
            <h1>Nutidsquiz</h1>
            <button 
              onClick={() => navigate('/admin')}
              className="admin-button"
            >
              ⚙️ Redaktör
            </button>
          </div>
          <div className="header-subtitle">
            <p>Välj ett quiz att börja med!</p>
          </div>
        </header>

        <main className="quiz-grid">
          {quizzes.length === 0 ? (
            <div className="no-quizzes">
              <p>Inga quiz tillgängliga just nu.</p>
            </div>
          ) : (
            quizzes.map((quiz) => {
              // Formatera datum för badge
              const quizDate = new Date(quiz.created_at);
              const badgeText = quizDate.toLocaleDateString('sv-SE', { 
                day: 'numeric', 
                month: 'short'
              }).toUpperCase();
              
              return (
              <div 
                key={quiz.id} 
                className={`quiz-card ${quiz.image_url ? 'has-image' : 'no-image'}`}
                onClick={() => quiz.image_url && startQuiz(quiz.id)}
              >
                {quiz.image_url ? (
                  // CNN-inspirerad fullskärms hero-design
                  <div className="quiz-hero">
                    <img src={quiz.image_url} alt={`Omslagsbild för ${quiz.title}`} className="quiz-hero-img" />
                    <div className="quiz-badge-top">{badgeText}</div>
                    <div className="quiz-overlay">
                      <h3 className="quiz-headline">{quiz.title}</h3>
                      {quiz.description && <p className="quiz-lead">{quiz.description}</p>}
                    </div>
                  </div>
                ) : (
                  // Fallback-design utan bild
                  <div className="quiz-content" onClick={() => startQuiz(quiz.id)}>
                    <h3>{quiz.title}</h3>
                    {quiz.description && <p>{quiz.description}</p>}
                  </div>
                )}
              </div>
              );
            })
          )}
        </main>
      </div>
    </DynamicBackground>
  );
}

export default HomePage;