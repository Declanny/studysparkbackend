import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  generateQuiz,
  createLiveQuiz,
  joinQuiz,
  startQuiz,
  endQuiz,
  getQuiz,
  saveQuizProgress,
  submitQuiz,
  getQuizAttempts
} from '../controllers/quizController.js';

const router = express.Router();

// ========== QUIZ GENERATION ==========

/**
 * @swagger
 * /quiz/generate:
 *   post:
 *     summary: Generate quiz questions with AI (Admin & User)
 *     tags: [Quiz]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topic
 *               - type
 *             properties:
 *               topic:
 *                 type: string
 *                 example: Data Structures
 *               type:
 *                 type: string
 *                 enum: [personal, live]
 *                 example: personal
 *               title:
 *                 type: string
 *                 example: Data Structures Quiz
 *               description:
 *                 type: string
 *               difficulty:
 *                 type: string
 *                 enum: [easy, medium, hard, mixed]
 *                 example: medium
 *               questionCount:
 *                 type: integer
 *                 example: 10
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *                 example: 30
 *     responses:
 *       201:
 *         description: Quiz generated successfully
 */
router.post('/generate', protect, generateQuiz);

// ========== LIVE QUIZ ENDPOINTS ==========

/**
 * @swagger
 * /quiz/live/create:
 *   post:
 *     summary: Create live quiz and generate join code (Admin)
 *     tags: [Quiz - Live]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quizId
 *             properties:
 *               quizId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Live quiz created with join code
 */
router.post('/live/create', protect, createLiveQuiz);

/**
 * @swagger
 * /quiz/join:
 *   post:
 *     summary: Join live quiz with code (User)
 *     tags: [Quiz - Live]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 example: ABC123
 *     responses:
 *       200:
 *         description: Joined quiz successfully
 */
router.post('/join', protect, joinQuiz);

/**
 * @swagger
 * /quiz/live/start/{quizId}:
 *   post:
 *     summary: Start live quiz (Admin)
 *     tags: [Quiz - Live]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz started successfully
 */
router.post('/live/start/:quizId', protect, startQuiz);

/**
 * @swagger
 * /quiz/live/end/{quizId}:
 *   post:
 *     summary: End live quiz (Admin)
 *     tags: [Quiz - Live]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz ended successfully
 */
router.post('/live/end/:quizId', protect, endQuiz);

// ========== PERSONAL QUIZ ENDPOINTS ==========

/**
 * @swagger
 * /quiz/{quizId}:
 *   get:
 *     summary: Fetch quiz questions (User)
 *     tags: [Quiz - Personal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Quiz details with questions
 */
router.get('/:quizId', protect, getQuiz);

/**
 * @swagger
 * /quiz/{quizId}/save:
 *   post:
 *     summary: Save quiz progress (User)
 *     tags: [Quiz - Personal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedAnswer:
 *                       type: string
 *     responses:
 *       200:
 *         description: Progress saved successfully
 */
router.post('/:quizId/save', protect, saveQuizProgress);

/**
 * @swagger
 * /quiz/{quizId}/submit:
 *   post:
 *     summary: Submit quiz and get results (User)
 *     tags: [Quiz - Personal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     questionId:
 *                       type: string
 *                     selectedAnswer:
 *                       type: string
 *                     timeSpent:
 *                       type: integer
 *               timeSpent:
 *                 type: integer
 *                 description: Total time in seconds
 *     responses:
 *       200:
 *         description: Quiz submitted with results
 */
router.post('/:quizId/submit', protect, submitQuiz);

/**
 * @swagger
 * /quiz/attempts:
 *   get:
 *     summary: Get user's quiz attempts history
 *     tags: [Quiz - Personal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quiz attempts
 */
router.get('/attempts', protect, getQuizAttempts);

export default router;
