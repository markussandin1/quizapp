import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './QuizEditor.css';

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

interface Question {
  id?: number;
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

interface Quiz {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  questions: Question[];
}

function QuizEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const savedAdminKey = getCookie('quiz-admin-session');
    if (savedAdminKey !== 'quiz-admin-2024') {
      navigate('/admin');
      return;
    }
  }, [navigate]);

  useEffect(() => {
    if (id) {
      fetchQuiz(parseInt(id));
    }
  }, [id]);

  const fetchQuiz = async (quizId: number) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/quizzes`, {
        headers: {
          'admin-key': 'quiz-admin-2024'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch quiz');
      }
      
      const quizzes = await response.json();
      const foundQuiz = quizzes.find((q: Quiz) => q.id === quizId);
      
      if (!foundQuiz) {
        throw new Error('Quiz not found');
      }
      
      setQuiz(foundQuiz);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const updateQuizTitle = (title: string) => {
    if (quiz) {
      setQuiz({ ...quiz, title });
    }
  };

  const updateQuizDescription = (description: string) => {
    if (quiz) {
      setQuiz({ ...quiz, description });
    }
  };

  const updateQuizImageUrl = (image_url: string) => {
    if (quiz) {
      setQuiz({ ...quiz, image_url });
    }
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    if (quiz) {
      const newQuestions = [...quiz.questions];
      newQuestions[index] = updatedQuestion;
      setQuiz({ ...quiz, questions: newQuestions });
    }
  };

  const addQuestion = () => {
    if (quiz) {
      const newQuestion: Question = {
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        image_url: '',
        article_url: '',
        time_limit: 30,
        points: 1
      };
      setQuiz({ ...quiz, questions: [...quiz.questions, newQuestion] });
    }
  };

  const deleteQuestion = (index: number) => {
    if (quiz && window.confirm('Är du säker på att du vill ta bort denna fråga?')) {
      const newQuestions = quiz.questions.filter((_, i) => i !== index);
      setQuiz({ ...quiz, questions: newQuestions });
    }
  };

  const saveQuiz = async () => {
    if (!quiz) return;

    setSaving(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/quiz/${quiz.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'admin-key': 'quiz-admin-2024'
        },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          image_url: quiz.image_url,
          questions: quiz.questions
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save quiz');
      }

      alert('Quiz sparat!');
      navigate('/admin');
    } catch (err) {
      alert('Fel vid sparning: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="editor-container">
        <div className="loading">Laddar quiz...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="editor-container">
        <div className="error">Fel: {error}</div>
        <button onClick={() => navigate('/admin')}>Tillbaka till admin</button>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <h1>✏️ Redigera Quiz</h1>
        <div className="header-actions">
          <button onClick={() => navigate('/admin')} className="back-button">
            ← Tillbaka
          </button>
          <button 
            onClick={saveQuiz} 
            className="save-button"
            disabled={saving}
          >
            {saving ? 'Sparar...' : '💾 Spara Quiz'}
          </button>
        </div>
      </header>

      <main className="editor-content">
        <div className="quiz-metadata">
          <div className="field-group">
            <label htmlFor="title">Quiz-titel:</label>
            <input
              id="title"
              type="text"
              value={quiz.title}
              onChange={(e) => updateQuizTitle(e.target.value)}
              className="title-input"
            />
          </div>

          <div className="field-group">
            <label htmlFor="description">Beskrivning:</label>
            <textarea
              id="description"
              value={quiz.description || ''}
              onChange={(e) => updateQuizDescription(e.target.value)}
              className="description-input"
              rows={3}
            />
          </div>

          <div className="field-group">
            <label htmlFor="image_url">Omslagsbild URL (valfritt):</label>
            <input
              id="image_url"
              type="url"
              value={quiz.image_url || ''}
              onChange={(e) => updateQuizImageUrl(e.target.value)}
              className="title-input"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>

        <div className="questions-section">
          <div className="questions-header">
            <h2>Frågor ({quiz.questions.length})</h2>
            <button onClick={addQuestion} className="add-question-button">
              ➕ Lägg till fråga
            </button>
          </div>

          <div className="questions-list">
            {quiz.questions.map((question, index) => (
              <QuestionEditor
                key={index}
                question={question}
                index={index}
                onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                onDelete={() => deleteQuestion(index)}
              />
            ))}

            {quiz.questions.length === 0 && (
              <div className="no-questions">
                <p>Inga frågor än. Klicka "Lägg till fråga" för att börja.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

function QuestionEditor({ question, index, onUpdate, onDelete }: QuestionEditorProps) {
  const updateField = (field: keyof Question, value: any) => {
    onUpdate({ ...question, [field]: value });
  };

  const updateOption = (optionIndex: number, value: string) => {
    if (question.options) {
      const newOptions = [...question.options];
      newOptions[optionIndex] = value;
      onUpdate({ ...question, options: newOptions });
    }
  };

  const changeQuestionType = (type: 'multiple_choice' | 'true_false') => {
    if (type === 'true_false') {
      onUpdate({
        ...question,
        question_type: type,
        options: undefined,
        correct_answer: question.correct_answer === 'true' || question.correct_answer === 'false' 
          ? question.correct_answer 
          : 'true'
      });
    } else {
      onUpdate({
        ...question,
        question_type: type,
        options: question.options || ['', '', '', ''],
        correct_answer: ''
      });
    }
  };

  return (
    <div className="question-editor">
      <div className="question-header">
        <h3>Fråga {index + 1}</h3>
        <div className="question-actions">
          <select 
            value={question.question_type} 
            onChange={(e) => changeQuestionType(e.target.value as 'multiple_choice' | 'true_false')}
            className="type-select"
          >
            <option value="multiple_choice">Flerval</option>
            <option value="true_false">Sant/Falskt</option>
          </select>
          <button onClick={onDelete} className="delete-question-button">
            🗑️
          </button>
        </div>
      </div>

      <div className="question-content">
        <div className="field-group">
          <label>Frågetext:</label>
          <textarea
            value={question.question_text}
            onChange={(e) => updateField('question_text', e.target.value)}
            className="question-text-input"
            rows={3}
          />
        </div>

        {question.question_type === 'multiple_choice' && question.options && (
          <div className="field-group">
            <label>Svarsalternativ:</label>
            <div className="options-list">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="option-input-group">
                  <span className="option-label">{String.fromCharCode(65 + optionIndex)}.</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(optionIndex, e.target.value)}
                    className="option-input"
                    placeholder={`Alternativ ${String.fromCharCode(65 + optionIndex)}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="field-group">
          <label>Rätt svar:</label>
          {question.question_type === 'true_false' ? (
            <select 
              value={question.correct_answer} 
              onChange={(e) => updateField('correct_answer', e.target.value)}
              className="correct-answer-select"
            >
              <option value="true">Sant</option>
              <option value="false">Falskt</option>
            </select>
          ) : (
            <select 
              value={question.correct_answer} 
              onChange={(e) => updateField('correct_answer', e.target.value)}
              className="correct-answer-select"
            >
              <option value="">Välj rätt svar</option>
              {question.options?.map((option, index) => (
                <option key={index} value={option}>{option}</option>
              ))}
            </select>
          )}
        </div>

        <div className="field-group">
          <label>Förklaring (valfritt):</label>
          <textarea
            value={question.explanation || ''}
            onChange={(e) => updateField('explanation', e.target.value)}
            className="explanation-input"
            rows={3}
            placeholder="Förklaring till svaret som visas efter att användaren har svarat..."
          />
        </div>

        <div className="field-group">
          <label>Frågebild URL (valfritt):</label>
          <input
            type="url"
            value={question.image_url || ''}
            onChange={(e) => updateField('image_url', e.target.value)}
            className="title-input"
            placeholder="https://example.com/question-image.jpg"
          />
        </div>

        <div className="field-group">
          <label>Artikel URL (valfritt):</label>
          <input
            type="url"
            value={question.article_url || ''}
            onChange={(e) => updateField('article_url', e.target.value)}
            className="title-input"
            placeholder="https://example.com/source-article"
          />
        </div>

        <div className="question-settings">
          <div className="field-group">
            <label>Tidsgräns (sekunder):</label>
            <input
              type="number"
              value={question.time_limit}
              onChange={(e) => updateField('time_limit', parseInt(e.target.value) || 30)}
              className="time-input"
              min="10"
              max="120"
            />
          </div>

          <div className="field-group">
            <label>Poäng:</label>
            <input
              type="number"
              value={question.points}
              onChange={(e) => updateField('points', parseInt(e.target.value) || 1)}
              className="points-input"
              min="1"
              max="10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuizEditor;