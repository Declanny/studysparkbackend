import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createStudyChat,
  getRecommendations,
  getStudyChats,
  getStudyChatById,
  addMessageToChat,
  chatWithContext,
  searchMaterials
} from '../controllers/studyController.js';
import materialsRouter from './materials.js';

const router = express.Router();

// Mount materials routes
router.use('/materials', materialsRouter);

/**
 * @swagger
 * /study/chat:
 *   post:
 *     summary: Create or continue chat with AI study assistant (includes AI response and YouTube recommendations)
 *     tags: [Study AI]
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
 *               - message
 *             properties:
 *               topic:
 *                 type: string
 *                 example: Data Structures
 *               message:
 *                 type: string
 *                 example: Explain binary search trees
 *               subject:
 *                 type: string
 *                 example: Computer Science
 *     responses:
 *       200:
 *         description: AI response with recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     chatId:
 *                       type: string
 *                     aiResponse:
 *                       type: string
 *                     recommendations:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/chat', protect, createStudyChat);

/**
 * @swagger
 * /study/chats:
 *   get:
 *     summary: Get user's study chat sessions
 *     tags: [Study AI]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat sessions
 */
router.get('/chats', protect, getStudyChats);

/**
 * @swagger
 * /study/chat/{chatId}:
 *   get:
 *     summary: Get specific chat session with full history
 *     tags: [Study AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat session details
 */
router.get('/chat/:chatId', protect, getStudyChatById);

/**
 * @swagger
 * /study/chat/{chatId}/message:
 *   post:
 *     summary: Add message to existing chat session
 *     tags: [Study AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
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
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: Can you explain more about time complexity?
 *     responses:
 *       200:
 *         description: AI response added to chat
 */
router.post('/chat/:chatId/message', protect, addMessageToChat);

/**
 * @swagger
 * /study/recommendations:
 *   get:
 *     summary: Get study recommendations (videos, articles, practice problems)
 *     tags: [Study AI]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic
 *         required: true
 *         schema:
 *           type: string
 *           example: Data Structures
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *           example: Computer Science
 *     responses:
 *       200:
 *         description: Study recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 recommendations:
 *                   type: object
 *                   properties:
 *                     videos:
 *                       type: array
 *                       items:
 *                         type: object
 *                     articles:
 *                       type: array
 *                       items:
 *                         type: object
 *                     practice:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.get('/recommendations', protect, getRecommendations);

/**
 * @swagger
 * /study/chat-with-context:
 *   post:
 *     summary: Chat with AI using course material context (RAG)
 *     description: Get AI responses enhanced with relevant context from uploaded course materials
 *     tags: [Study AI - RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 example: Explain binary search tree insertion
 *               materialIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of material IDs to search within
 *               topic:
 *                 type: string
 *                 example: Data Structures
 *               subject:
 *                 type: string
 *                 example: Computer Science
 *     responses:
 *       200:
 *         description: AI response with context from course materials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     chatId:
 *                       type: string
 *                     aiResponse:
 *                       type: string
 *                     contextUsed:
 *                       type: boolean
 *                     chunksUsed:
 *                       type: array
 *                       items:
 *                         type: object
 */
router.post('/chat-with-context', protect, chatWithContext);

/**
 * @swagger
 * /study/materials/search:
 *   post:
 *     summary: Search for similar content in course materials
 *     description: Semantic search using vector embeddings to find relevant content
 *     tags: [Study AI - RAG]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 example: How does insertion work in BST?
 *               materialIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional array of material IDs to search within
 *               limit:
 *                 type: integer
 *                 default: 10
 *                 description: Maximum number of results
 *     responses:
 *       200:
 *         description: Search results with similarity scores
 */
router.post('/materials/search', protect, searchMaterials);

export default router;
