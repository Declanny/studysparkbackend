import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /analytics/performance:
 *   get:
 *     summary: Get user performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 */
router.get('/performance', protect, (req, res) => {
  res.json({
    success: true,
    message: "Analytics endpoint - to be implemented",
    data: {}
  });
});

export default router;
