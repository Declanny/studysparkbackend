import express from 'express';
import quizController from '../controllers/quizController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, admin, quizController.createQuiz);
router.post('/:quizId/start', protect, admin, quizController.startLiveQuiz);
router.post('/join', protect, quizController.joinLiveQuiz);
router.get('/:quizId/current-question', protect, quizController.getCurrentQuestion);
router.post('/:quizId/answer', protect, quizController.submitAnswer);
router.post('/:quizId/end', protect, admin, quizController.endQuiz);
router.get('/:quizId/leaderboard', protect, quizController.getLeaderboard);

export default router;