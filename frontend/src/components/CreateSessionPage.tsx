import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuizzes, createQuizSession } from '../lib/supabase';
import DynamicBackground from './DynamicBackground';
import './CreateSessionPage.css';

interface Quiz {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  questions?: any[];
}

function CreateSessionPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [teacherName, setTeacherName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const data = await getQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError('Kunde inte hämta quiz');
      console.error('Error fetching quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedQuizId || !teacherName.trim()) {
      setError('Välj ett quiz och ange lärarnamn');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const { sessionCode, sessionId } = await createQuizSession(selectedQuizId, teacherName.trim());
      
      // Navigera till teacher dashboard
      navigate(`/session/${sessionId}/dashboard`, { 
        state: { sessionCode, teacherName } 
      });
    } catch (err) {
      setError('Kunde inte skapa session');
      console.error('Error creating session:', err);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <DynamicBackground>
        <div className="create-session-container">
          <div className="loading">Laddar quiz...</div>
        </div>
      </DynamicBackground>
    );
  }

  return (
    <DynamicBackground>
      <div className="create-session-container">
        <header className="create-session-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Tillbaka
          </button>
          <h1>🏫 Skapa Klassrumssession</h1>
          <p>Skapa en session där elever kan gå med via sessionskod</p>
        </header>

        <main className="create-session-content">
          <form onSubmit={handleCreateSession} className="session-form">
            <div className="form-group">
              <label htmlFor="teacherName">Lärarnamn:</label>
              <input
                id="teacherName"
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                placeholder="Ange ditt namn"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quizSelect">Välj Quiz:</label>
              <select
                id="quizSelect"
                value={selectedQuizId || ''}
                onChange={(e) => setSelectedQuizId(Number(e.target.value))}
                className="form-select"
                required
              >
                <option value="">-- Välj ett quiz --</option>
                {quizzes.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title} ({quiz.questions?.length || 0} frågor)
                  </option>
                ))}
              </select>
            </div>

            {selectedQuizId && (
              <div className="quiz-preview">
                {quizzes.find(q => q.id === selectedQuizId) && (
                  <>
                    <h3>{quizzes.find(q => q.id === selectedQuizId)?.title}</h3>
                    <p>{quizzes.find(q => q.id === selectedQuizId)?.description}</p>
                    {quizzes.find(q => q.id === selectedQuizId)?.image_url && (
                      <img 
                        src={quizzes.find(q => q.id === selectedQuizId)?.image_url} 
                        alt="Quiz preview" 
                        className="quiz-preview-image"
                      />
                    )}
                  </>
                )}
              </div>
            )}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="create-button"
              disabled={creating || !selectedQuizId || !teacherName.trim()}
            >
              {creating ? 'Skapar session...' : '🚀 Skapa Session'}
            </button>
          </form>
        </main>
      </div>
    </DynamicBackground>
  );
}

export default CreateSessionPage;