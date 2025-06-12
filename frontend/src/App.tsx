import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QuizProvider } from './context/QuizContext';
import { SessionProvider } from './context/SessionContext';
import HomePage from './components/HomePage';
import QuizInterface from './components/QuizInterface';
import ResultsPage from './components/ResultsPage';
import AdminDashboard from './components/AdminDashboard';
import QuizEditor from './components/QuizEditor';
import JsonImporter from './components/JsonImporter';
// Classroom Mode Components
import SessionModeSelection from './components/SessionModeSelection';
import CreateSessionPage from './components/CreateSessionPage';
import JoinSessionPage from './components/JoinSessionPage';
import SessionWaitingRoom from './components/SessionWaitingRoom';
import TeacherSessionDashboard from './components/TeacherSessionDashboard';
import TeacherQuizControl from './components/TeacherQuizControl';
// Sprint 2: Realtime Components
import TeacherQuizController from './components/TeacherQuizController';
import TeacherQuizControllerSimple from './components/TeacherQuizControllerSimple';
import StudentQuizInterface from './components/StudentQuizInterface';
import StudentQuizInterfaceSimple from './components/StudentQuizInterfaceSimple';
import './App.css';

function App() {
  return (
    <QuizProvider>
      <SessionProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/quiz/:id" element={<QuizInterface />} />
              <Route path="/results/:sessionId" element={<ResultsPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/edit/:id" element={<QuizEditor />} />
              <Route path="/admin/import" element={<JsonImporter />} />
              
              {/* Classroom Mode Routes */}
              <Route path="/session/mode" element={<SessionModeSelection />} />
              <Route path="/session/create" element={<CreateSessionPage />} />
              <Route path="/session/join" element={<JoinSessionPage />} />
              <Route path="/session/:sessionCode/waiting" element={<SessionWaitingRoom />} />
              <Route path="/session/:sessionId/dashboard" element={<TeacherSessionDashboard />} />
              <Route path="/session/:sessionId/control/:quizId" element={<TeacherQuizControl />} />
              
              {/* Sprint 2: Realtime Routes */}
              <Route path="/session/:sessionId/realtime/:quizId" element={<TeacherQuizControllerSimple />} />
              <Route path="/quiz/:quizId/realtime" element={<StudentQuizInterfaceSimple />} />
            </Routes>
          </div>
        </Router>
      </SessionProvider>
    </QuizProvider>
  );
}

export default App;
