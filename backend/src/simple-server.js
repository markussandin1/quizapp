const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let quizzes = [];
let quizIdCounter = 1;

// No sample data - clean start

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Quiz API is running' });
});

app.get('/api/quiz', (req, res) => {
  res.json(quizzes.map(quiz => ({
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    created_at: new Date().toISOString()
  })));
});

app.get('/api/quiz/:id', (req, res) => {
  const quiz = quizzes.find(q => q.id === parseInt(req.params.id));
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  res.json(quiz);
});

app.listen(PORT, () => {
  console.log(`🚀 Quiz API server running on http://localhost:${PORT}`);
  console.log(`📚 Sample quiz available at: http://localhost:${PORT}/api/quiz/1`);
});