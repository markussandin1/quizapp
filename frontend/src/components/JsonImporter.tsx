import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './JsonImporter.css';

// Cookie utility function
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

function JsonImporter() {
  const [jsonInput, setJsonInput] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewQuiz, setPreviewQuiz] = useState<any>(null);
  const navigate = useNavigate();

  // Check authentication
  useEffect(() => {
    const savedAdminKey = getCookie('quiz-admin-session');
    if (savedAdminKey !== 'quiz-admin-2024') {
      navigate('/admin');
      return;
    }
  }, [navigate]);

  const validateAndPreviewJson = () => {
    setError(null);
    setPreviewQuiz(null);

    if (!jsonInput.trim()) {
      setError('Ange JSON-data för quizet');
      return;
    }

    try {
      const quizData = JSON.parse(jsonInput);
      
      // Validate required fields
      if (!quizData.title || typeof quizData.title !== 'string') {
        throw new Error('Quiz måste ha en titel');
      }
      
      if (!Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        throw new Error('Quiz måste ha minst en fråga');
      }
      
      // Validate each question
      quizData.questions.forEach((question: any, index: number) => {
        if (!question.question_text || typeof question.question_text !== 'string') {
          throw new Error(`Fråga ${index + 1} måste ha frågetext`);
        }
        
        if (!question.correct_answer) {
          throw new Error(`Fråga ${index + 1} måste ha ett rätt svar`);
        }
        
        if (question.question_type === 'multiple_choice' && (!question.options || !Array.isArray(question.options))) {
          throw new Error(`Fråga ${index + 1} måste ha svarsalternativ för flervalsfrågor`);
        }
      });
      
      setPreviewQuiz(quizData);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Ogiltig JSON-format. Kontrollera att JSON:en är korrekt formaterad.');
      } else {
        setError(err instanceof Error ? err.message : 'Okänt fel vid validering');
      }
    }
  };

  const importQuiz = async () => {
    if (!previewQuiz) return;

    setImporting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/quiz/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(previewQuiz)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import quiz');
      }

      await response.json(); // Response handled but not used
      alert(`Quiz "${previewQuiz.title}" importerat framgångsrikt!`);
      navigate('/admin');
    } catch (err) {
      setError('Fel vid import: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setImporting(false);
    }
  };

  const clearForm = () => {
    setJsonInput('');
    setPreviewQuiz(null);
    setError(null);
  };

  const exampleJson = `{
  "title": "Exempel Quiz",
  "description": "Ett exempel på hur JSON-formatet ska se ut",
  "image_url": "https://example.com/cover-image.jpg",
  "questions": [
    {
      "question_text": "Vad är huvudstaden i Sverige?",
      "question_type": "multiple_choice",
      "options": ["Stockholm", "Göteborg", "Malmö", "Uppsala"],
      "correct_answer": "Stockholm",
      "explanation": "Stockholm har varit Sveriges huvudstad sedan 1523 och är landets politiska och ekonomiska centrum.",
      "image_url": "https://example.com/stockholm.jpg",
      "article_url": "https://example.com/stockholm-article",
      "time_limit": 30,
      "points": 1
    },
    {
      "question_text": "Sverige är ett nordiskt land",
      "question_type": "true_false",
      "correct_answer": "true",
      "explanation": "Sverige tillhör de nordiska länderna tillsammans med Norge, Danmark, Finland och Island.",
      "image_url": "https://example.com/nordic-countries.jpg",
      "article_url": "https://example.com/nordic-article",
      "time_limit": 20,
      "points": 1
    }
  ]
}`;

  return (
    <div className="importer-container">
      <header className="importer-header">
        <h1>📋 Importera Quiz från JSON</h1>
        <button onClick={() => navigate('/admin')} className="back-button">
          ← Tillbaka till admin
        </button>
      </header>

      <main className="importer-content">
        <div className="importer-section">
          <h2>Klistra in JSON-data</h2>
          <div className="json-input-area">
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Klistra in JSON-data för ditt quiz här..."
              className="json-textarea"
              rows={15}
            />
            
            <div className="input-actions">
              <button 
                onClick={validateAndPreviewJson}
                className="validate-button"
                disabled={!jsonInput.trim()}
              >
                🔍 Förhandsgranska
              </button>
              <button 
                onClick={clearForm}
                className="clear-button"
                disabled={!jsonInput.trim()}
              >
                🗑️ Rensa
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <strong>Fel:</strong> {error}
            </div>
          )}
        </div>

        {previewQuiz && (
          <div className="preview-section">
            <h2>Förhandsgranskning</h2>
            <div className="preview-card">
              <div className="preview-header">
                {previewQuiz.image_url && (
                  <div className="preview-cover-image">
                    <img src={previewQuiz.image_url} alt="Omslagsbild" className="cover-img" />
                  </div>
                )}
                <h3>{previewQuiz.title}</h3>
                {previewQuiz.description && (
                  <p className="preview-description">{previewQuiz.description}</p>
                )}
                <div className="preview-stats">
                  📊 {previewQuiz.questions.length} frågor
                </div>
              </div>

              <div className="preview-questions">
                <h4>Frågor:</h4>
                {previewQuiz.questions.map((question: any, index: number) => (
                  <div key={index} className="preview-question">
                    <div className="question-number">Fråga {index + 1}</div>
                    <div className="question-text">{question.question_text}</div>
                    <div className="question-details">
                      <span className="question-type">
                        {question.question_type === 'multiple_choice' ? 'Flerval' : 'Sant/Falskt'}
                      </span>
                      <span className="question-time">{question.time_limit}s</span>
                      <span className="question-points">{question.points}p</span>
                    </div>
                    {question.options && (
                      <div className="question-options">
                        {question.options.map((option: string, optIndex: number) => (
                          <span 
                            key={optIndex} 
                            className={`option ${option === question.correct_answer ? 'correct' : ''}`}
                          >
                            {String.fromCharCode(65 + optIndex)}. {option}
                          </span>
                        ))}
                      </div>
                    )}
                    {question.image_url && (
                      <div className="question-preview-image">
                        <img src={question.image_url} alt={`Bild för fråga ${index + 1}`} className="preview-question-img" />
                      </div>
                    )}
                    {question.explanation && (
                      <div className="question-explanation">
                        <strong>Förklaring:</strong> {question.explanation}
                      </div>
                    )}
                    {question.article_url && (
                      <div className="question-article-link">
                        <strong>Källartikel:</strong> <a href={question.article_url} target="_blank" rel="noopener noreferrer">{question.article_url}</a>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="import-actions">
                <button 
                  onClick={importQuiz}
                  className="import-button"
                  disabled={importing}
                >
                  {importing ? 'Importerar...' : '✅ Importera Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="example-section">
          <h2>JSON-format exempel</h2>
          <div className="example-card">
            <pre className="example-json">{exampleJson}</pre>
            <button 
              onClick={() => setJsonInput(exampleJson)}
              className="use-example-button"
            >
              📋 Använd detta exempel
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default JsonImporter;