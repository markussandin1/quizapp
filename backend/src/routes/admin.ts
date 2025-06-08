import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { QuizService } from '../services/quiz';

const router = express.Router();
const quizService = new QuizService();

// Simple admin authentication middleware (for demo - use proper auth in production)
const adminAuth = (req: Request, res: Response, next: any) => {
  const adminKey = req.headers['admin-key'];
  if (adminKey !== 'quiz-admin-2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Get all quizzes with full details for admin
router.get('/quizzes', adminAuth, async (req: Request, res: Response) => {
  try {
    const quizzes = await quizService.getAllQuizzesWithQuestions();
    res.json(quizzes);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

// Update a quiz
router.put('/quiz/:id', adminAuth, [
  body('title').trim().isLength({ min: 1 }).escape(),
  body('description').optional().trim().escape(),
  body('questions').isArray().withMessage('Questions must be an array'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const quizId = parseInt(req.params.id);
    const { title, description, image_url, questions } = req.body;
    
    await quizService.updateQuiz(quizId, { title, description, image_url, questions });
    res.json({ message: 'Quiz updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

// Delete a quiz
router.delete('/quiz/:id', adminAuth, async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    await quizService.deleteQuiz(quizId);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

// Delete a specific question
router.delete('/quiz/:quizId/question/:questionId', adminAuth, async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.quizId);
    const questionId = parseInt(req.params.questionId);
    
    await quizService.deleteQuestion(questionId);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

export default router;