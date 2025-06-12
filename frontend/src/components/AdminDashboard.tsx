import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

// Cookie utility functions
const setCookie = (name: string, value: string, days: number) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

const getCookie = (name: string): string | null => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

interface Quiz {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  created_at: string;
  questions: Question[];
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options?: string[];
  correct_answer: string;
  explanation?: string;
  image_url?: string;
  article_url?: string;
  time_limit: number;
  points: number;
}

function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Check for existing admin session on component mount
  useEffect(() => {
    const savedAdminKey = getCookie('quiz-admin-session');
    if (savedAdminKey === 'quiz-admin-2024') {
      setIsAuthenticated(true);
      fetchQuizzes();
    } else {
      setLoading(false);
    }
  }, []);

  const authenticate = () => {
    if (adminKey === 'quiz-admin-2024') {
      setIsAuthenticated(true);
      setCookie('quiz-admin-session', adminKey, 7); // Cookie expires in 7 days
      setError(null);
      fetchQuizzes();
    } else {
      setError('Felaktig admin-nyckel');
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    deleteCookie('quiz-admin-session');
    setAdminKey('');
  };

  const fetchQuizzes = async () => {
    console.log('fetchQuizzes called');
    try {
      console.log('Importing supabase...');
      const supabaseModule = await import('../lib/supabase');
      console.log('Supabase module:', supabaseModule);
      
      const data = await supabaseModule.getQuizzes();
      console.log('Quiz data:', data);
      
      setQuizzes(Array.isArray(data) ? data : []); // Ensure we always have an array
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setQuizzes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const deleteQuiz = async (quizId: number) => {
    if (!window.confirm('Är du säker på att du vill ta bort detta quiz?')) {
      return;
    }

    try {
      const { deleteQuiz } = await import('../lib/supabase');
      await deleteQuiz(quizId);
      
      // Remove from local state
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId));
      alert('Quiz borttaget!');
    } catch (err) {
      alert('Fel vid borttagning: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const editQuiz = (quizId: number) => {
    navigate(`/admin/edit/${quizId}`);
  };

  const createNewQuiz = async () => {
    try {
      console.log('Creating new empty quiz...');
      const supabaseModule = await import('../lib/supabase');
      
      // Skapa ett tomt quiz med en standardfråga
      const newQuizData = {
        title: 'Nytt Quiz',
        description: 'Beskriv ditt quiz här...',
        image_url: null,
        questions: [
          {
            question_text: 'Din första fråga här...',
            question_type: 'multiple_choice' as const,
            options: ['Alternativ A', 'Alternativ B', 'Alternativ C', 'Alternativ D'],
            correct_answer: 'Alternativ A',
            explanation: 'Förklaring till det rätta svaret...',
            image_url: null,
            article_url: null,
            time_limit: 30,
            points: 1
          }
        ]
      };
      
      const createdQuiz = await supabaseModule.createQuiz(newQuizData);
      console.log('New quiz created:', createdQuiz);
      
      // Navigera direkt till editorn för det nya quizet
      navigate(`/admin/edit/${createdQuiz.id}`);
      
    } catch (err) {
      console.error('Error creating new quiz:', err);
      setError('Kunde inte skapa nytt quiz');
    }
  };

  const exportQuizAsJson = (quiz: Quiz) => {
    // Skapa JSON-struktur för export
    const exportData = {
      title: quiz.title,
      description: quiz.description || '',
      image_url: quiz.image_url || '',
      questions: quiz.questions.map(q => ({
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation || '',
        image_url: q.image_url || '',
        article_url: q.article_url || '',
        time_limit: q.time_limit,
        points: q.points
      }))
    };

    // Skapa och ladda ner JSON-fil
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${quiz.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>🔑 Admin-inloggning</h1>
          <h2>lösen: quiz-admin-2024</h2>
          <div className="login-form">
            <input
              type="password"
              placeholder="Admin-nyckel"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && authenticate()}
            />
            <button onClick={authenticate}>Logga in</button>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="back-link">
            <button onClick={() => navigate('/')} className="back-button">
              ← Tillbaka till quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading">Laddar quiz...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>📝 Quiz Redaktör</h1>
        <div className="admin-actions">
          <button onClick={logout} className="logout-button">
            🚪 Logga ut
          </button>
          <button onClick={() => navigate('/')} className="back-button">
            ← Tillbaka till quiz
          </button>
        </div>
      </header>

      <main className="admin-content">
        {error && (
          <div className="error-banner">
            Fel: {error}
          </div>
        )}

        <div className="quiz-list">
          <div className="quiz-list-header">
            <h2>Alla Quiz ({quizzes?.length || 0})</h2>
            <div className="header-buttons">
              <button 
                onClick={createNewQuiz}
                className="create-button"
              >
                ✨ Skapa Nytt Quiz
              </button>
              <button 
                onClick={() => navigate('/admin/import')}
                className="import-button"
              >
                📋 Importera Quiz från JSON
              </button>
            </div>
          </div>
          
          {!quizzes || quizzes.length === 0 ? (
            <div className="no-quizzes">
              <p>Inga quiz hittades.</p>
            </div>
          ) : (
            <div className="quiz-cards">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="quiz-card">
                  <div className="quiz-info">
                    <h3>{quiz.title}</h3>
                    {quiz.description && <p className="description">{quiz.description}</p>}
                    <div className="quiz-stats">
                      <span className="question-count">
                        📊 {quiz.questions?.length || 0} frågor
                      </span>
                      <span className="created-date">
                        📅 {new Date(quiz.created_at).toLocaleDateString('sv-SE')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="quiz-actions">
                    <button 
                      onClick={() => editQuiz(quiz.id)}
                      className="edit-button"
                    >
                      ✏️ Redigera
                    </button>
                    <button 
                      onClick={() => deleteQuiz(quiz.id)}
                      className="delete-button"
                    >
                      🗑️ Ta bort
                    </button>
                    <button 
                      onClick={() => exportQuizAsJson(quiz)}
                      className="export-button"
                      title="Exportera som JSON"
                    >
                      📎 JSON
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;