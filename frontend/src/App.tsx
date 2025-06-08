import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizProvider } from './context/QuizContext';
import HomePage from './components/HomePage';
import QuizInterface from './components/QuizInterface';
import ResultsPage from './components/ResultsPage';
import AdminDashboard from './components/AdminDashboard';
import QuizEditor from './components/QuizEditor';
import JsonImporter from './components/JsonImporter';
import './App.css';

function App() {
  return (
    <QuizProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/quiz/:id" element={<QuizInterface />} />
            <Route path="/results/:sessionId" element={<ResultsPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/edit/:id" element={<QuizEditor />} />
            <Route path="/admin/import" element={<JsonImporter />} />
          </Routes>
        </div>
      </Router>
    </QuizProvider>
  );
}

export default App;
