import express, { Request, Response } from 'express';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import { QuizService } from '../services/quiz';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });
const quizService = new QuizService();

router.post('/upload', upload.single('quizFile'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const result = await quizService.uploadQuizFromFile(req.file.path);
    res.json({ message: 'Quiz uploaded successfully', quizId: result.quizId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

router.post('/create', [
  body('title').trim().isLength({ min: 1 }).escape(),
  body('description').optional().trim().escape(),
  body('questions').isArray().withMessage('Questions must be an array'),
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, image_url, questions } = req.body;
    const result = await quizService.createQuiz({ title, description, image_url, questions });
    res.json({ message: 'Quiz created successfully', quizId: result.quizId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(400).json({ error: errorMessage });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const quiz = await quizService.getQuiz(parseInt(req.params.id));
    res.json(quiz);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(404).json({ error: errorMessage });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const quizzes = await quizService.getAllQuizzes();
    res.json(quizzes);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/images/all', async (req: Request, res: Response) => {
  try {
    const images = await quizService.getAllImages();
    res.json(images);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;