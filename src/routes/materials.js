import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  processMaterial,
  getMaterials,
  getMaterialById,
  deleteMaterial,
  updateMaterial
} from '../controllers/materialController.js';

const router = express.Router();

/**
 * @swagger
 * /study/materials/process:
 *   post:
 *     summary: Process course material and generate embeddings
 *     description: Upload course material text chunks and generate vector embeddings for RAG
 *     tags: [Course Materials]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - topic
 *               - textChunks
 *             properties:
 *               title:
 *                 type: string
 *                 example: Data Structures Chapter 3
 *               topic:
 *                 type: string
 *                 example: Binary Trees
 *               subject:
 *                 type: string
 *                 example: Computer Science
 *               textChunks:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     content:
 *                       type: string
 *                     order:
 *                       type: integer
 *                     metadata:
 *                       type: object
 *     responses:
 *       201:
 *         description: Material processed successfully
 */
router.post('/process', protect, processMaterial);

/**
 * @swagger
 * /study/materials:
 *   get:
 *     summary: Get all course materials for user
 *     tags: [Course Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: topic
 *         schema:
 *           type: string
 *       - in: query
 *         name: subject
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [processing, ready, failed]
 *     responses:
 *       200:
 *         description: List of course materials
 */
router.get('/', protect, getMaterials);

/**
 * @swagger
 * /study/materials/{id}:
 *   get:
 *     summary: Get specific course material
 *     tags: [Course Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course material details
 */
router.get('/:id', protect, getMaterialById);

/**
 * @swagger
 * /study/materials/{id}:
 *   patch:
 *     summary: Update course material metadata
 *     tags: [Course Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               topic:
 *                 type: string
 *               subject:
 *                 type: string
 *     responses:
 *       200:
 *         description: Material updated successfully
 */
router.patch('/:id', protect, updateMaterial);

/**
 * @swagger
 * /study/materials/{id}:
 *   delete:
 *     summary: Delete course material
 *     tags: [Course Materials]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Material deleted successfully
 */
router.delete('/:id', protect, deleteMaterial);

export default router;
