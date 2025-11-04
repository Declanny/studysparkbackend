import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  getPerformanceAnalytics,
  getQuizAnalysis,
  getStudyProgress
} from '../controllers/analyticsController.js';

const router = express.Router();

/**
 * @swagger
 * /analytics/performance:
 *   get:
 *     summary: Get user performance analytics with AI analysis
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance analytics with AI insights
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 analytics:
 *                   type: object
 *                   properties:
 *                     totalQuizzes:
 *                       type: integer
 *                     averageScore:
 *                       type: number
 *                     topicAnalysis:
 *                       type: object
 *                     aiAnalysis:
 *                       type: object
 *                       properties:
 *                         performanceLevel:
 *                           type: string
 *                         strengths:
 *                           type: array
 *                           items:
 *                             type: string
 *                         weaknesses:
 *                           type: array
 *                           items:
 *                             type: string
 *                         recommendations:
 *                           type: array
 *                           items:
 *                             type: string
 */
router.get('/performance', protect, getPerformanceAnalytics);

/**
 * @swagger
 * /analytics/quiz/{attemptId}/analysis:
 *   get:
 *     summary: Get AI analysis report for specific quiz attempt
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: attemptId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: AI analysis for quiz attempt
 */
router.get('/quiz/:attemptId/analysis', protect, getQuizAnalysis);

/**
 * @swagger
 * /analytics/study-progress:
 *   get:
 *     summary: Get overall study progress metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Study progress analytics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 studyMetrics:
 *                   type: object
 */
router.get('/study-progress', protect, getStudyProgress);

export default router;
