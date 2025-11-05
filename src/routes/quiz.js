import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  generateQuiz,
  generateQuestions,
  createLiveQuiz,
  createPersonalQuiz,
  joinQuiz,
  startQuiz,
  endQuiz,
  getQuiz,
  saveQuizProgress,
  submitQuiz,
  getQuizAttempts,
  getPersonalQuizzes,
  getLiveQuiz
} from '../controllers/quizController.js';

const router = express.Router();

// ========== QUIZ GENERATION ==========

/**
 * @swagger
 * /quiz/generate:
 *   post:
 *     summary: Generate quiz with sample questions (deprecated - use /quiz/personal/create for AI generation)
 *     description: Creates a quiz with sample questions. This endpoint uses sample data instead of AI generation. For AI-powered quiz generation, use the /quiz/personal/create endpoint instead.
 *     tags: [Quiz]
 *     deprecated: true
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
 *                 description: The topic for the quiz
 *                 example: Data Structures
 *               type:
 *                 type: string
 *                 description: Type of quiz to create
 *                 enum: [personal, live]
 *                 example: personal
 *               title:
 *                 type: string
 *                 description: Custom title for the quiz
 *                 example: Data Structures Quiz
 *               description:
 *                 type: string
 *                 description: Description of the quiz
 *                 example: A comprehensive quiz covering data structures
 *               difficulty:
 *                 type: string
 *                 description: Difficulty level
 *                 enum: [easy, medium, hard, mixed]
 *                 default: medium
 *                 example: medium
 *               questionCount:
 *                 type: integer
 *                 description: Number of questions to generate
 *                 default: 10
 *                 example: 10
 *               duration:
 *                 type: integer
 *                 description: Duration in minutes
 *                 default: 30
 *                 example: 30
 *     responses:
 *       201:
 *         description: Quiz generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Quiz generated successfully
 *                 quiz:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     title:
 *                       type: string
 *                       example: Data Structures Quiz
 *                     topic:
 *                       type: string
 *                       example: Data Structures
 *                     type:
 *                       type: string
 *                       example: personal
 *                     questionCount:
 *                       type: integer
 *                       example: 10
 *                     difficulty:
 *                       type: string
 *                       example: medium
 *                     duration:
 *                       type: integer
 *                       example: 30
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate', protect, generateQuiz);

/**
 * @swagger
 * /quiz/questions/generate:
 *   post:
 *     summary: Generate sample questions without saving to database
 *     description: Generates sample quiz questions for preview purposes without creating a quiz in the database. This endpoint uses sample data and does not use AI generation. Useful for testing or previewing question formats.
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
 *             properties:
 *               topic:
 *                 type: string
 *                 description: Topic for the questions
 *                 example: Data Structures
 *               subject:
 *                 type: string
 *                 description: Subject or course name
 *                 example: Computer Science
 *               difficulty:
 *                 type: string
 *                 description: Difficulty level for questions
 *                 enum: [easy, medium, hard, mixed]
 *                 default: medium
 *                 example: medium
 *               questionCount:
 *                 type: integer
 *                 description: Number of questions to generate
 *                 default: 10
 *                 example: 10
 *               includeExplanations:
 *                 type: boolean
 *                 description: Whether to include explanations in the response
 *                 default: false
 *                 example: true
 *     responses:
 *       200:
 *         description: Questions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: temp-1
 *                       questionText:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/QuestionOption'
 *                       correctAnswer:
 *                         type: string
 *                       explanation:
 *                         type: string
 *                       difficulty:
 *                         type: string
 *                       points:
 *                         type: integer
 *                 metadata:
 *                   type: object
 *                   properties:
 *                     topic:
 *                       type: string
 *                       example: Data Structures
 *                     subject:
 *                       type: string
 *                       example: Computer Science
 *                     difficulty:
 *                       type: string
 *                       example: medium
 *                     count:
 *                       type: integer
 *                       example: 10
 *       400:
 *         description: Bad request - topic is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/questions/generate', protect, generateQuestions);

// ========== LIVE QUIZ ENDPOINTS ==========

/**
 * @swagger
 * /quiz/live/create:
 *   post:
 *     summary: Create live quiz with questions and generate join code
 *     description: Creates a live quiz session with a unique 6-character join code that participants can use. The quiz starts in active status, ready for participants to join.
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
 *               - title
 *               - topic
 *               - questions
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the live quiz
 *                 example: Data Structures Live Assessment
 *               topic:
 *                 type: string
 *                 description: Main topic of the quiz
 *                 example: Binary Trees
 *               subject:
 *                 type: string
 *                 description: Subject or course name
 *                 example: Computer Science
 *               difficulty:
 *                 type: string
 *                 description: Overall difficulty level
 *                 enum: [easy, medium, hard]
 *                 default: medium
 *                 example: medium
 *               questions:
 *                 type: array
 *                 description: Array of question objects
 *                 items:
 *                   $ref: '#/components/schemas/Question'
 *               timeLimit:
 *                 type: integer
 *                 description: Time limit in minutes
 *                 default: 30
 *                 example: 30
 *     responses:
 *       201:
 *         description: Live quiz created successfully with join code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Live quiz created successfully
 *                 code:
 *                   type: string
 *                   description: 6-character join code for participants
 *                   example: ABC123
 *                 quiz:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     title:
 *                       type: string
 *                       example: Data Structures Live Assessment
 *                     code:
 *                       type: string
 *                       example: ABC123
 *                     topic:
 *                       type: string
 *                       example: Binary Trees
 *                     questionCount:
 *                       type: integer
 *                       example: 10
 *                     duration:
 *                       type: integer
 *                       example: 30
 *                     isLive:
 *                       type: boolean
 *                       example: false
 *                     status:
 *                       type: string
 *                       example: active
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/live/create', protect, createLiveQuiz);

/**
 * @swagger
 * /quiz/live/join:
 *   post:
 *     summary: Join a live quiz session using a join code
 *     description: Allows a user to join an active live quiz using the 6-character join code. Users are added to the participants list and can start the quiz when the admin starts it.
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
 *                 description: 6-character join code for the live quiz
 *                 example: ABC123
 *     responses:
 *       200:
 *         description: Successfully joined the quiz
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Successfully joined quiz
 *                 quiz:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 507f1f77bcf86cd799439011
 *                     title:
 *                       type: string
 *                       example: Data Structures Live Assessment
 *                     topic:
 *                       type: string
 *                       example: Binary Trees
 *                     description:
 *                       type: string
 *                       example: A comprehensive assessment on binary trees
 *                     duration:
 *                       type: integer
 *                       example: 30
 *                     questionCount:
 *                       type: integer
 *                       example: 10
 *                     isLive:
 *                       type: boolean
 *                       description: Whether the quiz has started
 *                       example: false
 *                     participantCount:
 *                       type: integer
 *                       description: Number of participants who have joined
 *                       example: 5
 *       400:
 *         description: Missing quiz code
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Invalid quiz code or quiz not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/live/join', protect, joinQuiz);

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

/**
 * @swagger
 * /quiz/live/{quizId}:
 *   get:
 *     summary: Get live quiz details (Admin dashboard)
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
 *         description: Live quiz details with participants
 */
router.get('/live/:quizId', protect, getLiveQuiz);

// ========== PERSONAL QUIZ ENDPOINTS ==========

/**
 * @swagger
 * /quiz/personal/create:
 *   post:
 *     summary: Create a personal quiz with AI-generated questions
 *     description: Automatically generates quiz questions using AI based on the provided topic and parameters. Uses Groq AI with llama-3.3-70b-versatile model to create educational quiz content.
 *     tags: [Quiz - Personal]
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
 *               - numberQuestions
 *             properties:
 *               topic:
 *                 type: string
 *                 description: The topic for quiz generation
 *                 example: Binary Trees
 *               course:
 *                 type: string
 *                 description: The course name or subject
 *                 example: Computer Science
 *               difficulty:
 *                 type: string
 *                 description: Difficulty level of the quiz
 *                 enum: [easy, medium, hard]
 *                 default: medium
 *                 example: medium
 *               numberQuestions:
 *                 type: integer
 *                 description: Number of questions to generate (1-20 recommended)
 *                 minimum: 1
 *                 maximum: 50
 *                 example: 10
 *     responses:
 *       201:
 *         description: Personal quiz created successfully with AI-generated questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Personal quiz created successfully
 *                 quiz:
 *                   $ref: '#/components/schemas/Quiz'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error - failed to generate quiz
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/personal/create', protect, createPersonalQuiz);

/**
 * @swagger
 * /quiz/personal:
 *   get:
 *     summary: Get all personal quizzes for the authenticated user
 *     description: Retrieves all personal quizzes created by the authenticated user, sorted by creation date (newest first). Does not include correct answers or explanations in the response.
 *     tags: [Quiz - Personal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of personal quizzes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Total number of personal quizzes
 *                   example: 5
 *                 quizzes:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Quiz'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/personal', protect, getPersonalQuizzes);

/**
 * @swagger
 * /quiz/attempts:
 *   get:
 *     summary: Get user's quiz attempts history
 *     description: Retrieves the 20 most recent completed quiz attempts for the authenticated user, sorted by creation date (newest first). Includes quiz details and performance metrics.
 *     tags: [Quiz - Personal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of quiz attempts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Number of attempts returned
 *                   example: 10
 *                 attempts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuizAttempt'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/attempts', protect, getQuizAttempts);

/**
 * @swagger
 * /quiz/{quizId}:
 *   get:
 *     summary: Fetch quiz details and questions
 *     description: Retrieves quiz information and questions. Correct answers and explanations are hidden initially. Access is restricted based on quiz type - personal quizzes are only accessible by the creator, live quizzes require prior joining.
 *     tags: [Quiz - Personal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         description: ID of the quiz to retrieve
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Quiz details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 quiz:
 *                   $ref: '#/components/schemas/Quiz'
 *       400:
 *         description: Quiz has not started yet (for live quizzes)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Access denied - user must join quiz first or is not the creator
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Quiz not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
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
 *     summary: Submit quiz answers and get results with grading
 *     description: Submits the user's answers for grading and returns the results. Automatically calculates score, identifies correct/incorrect answers, and provides explanations if the quiz settings allow.
 *     tags: [Quiz - Personal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quizId
 *         required: true
 *         description: ID of the quiz to submit
 *         schema:
 *           type: string
 *           example: 507f1f77bcf86cd799439011
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
 *                 description: Array of user's answers to each question
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionId
 *                     - selectedAnswer
 *                   properties:
 *                     questionId:
 *                       type: string
 *                       description: ID of the question
 *                       example: 507f1f77bcf86cd799439011
 *                     selectedAnswer:
 *                       type: string
 *                       description: The selected answer text
 *                       example: O(log n)
 *                     timeSpent:
 *                       type: integer
 *                       description: Time spent on this question in seconds
 *                       example: 45
 *               timeSpent:
 *                 type: integer
 *                 description: Total time spent on the entire quiz in seconds
 *                 example: 1200
 *     responses:
 *       200:
 *         description: Quiz submitted successfully with graded results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Quiz submitted successfully
 *                 results:
 *                   type: object
 *                   description: Graded results from the quiz attempt
 *                   properties:
 *                     score:
 *                       type: number
 *                       description: Percentage score
 *                       example: 85.5
 *                     correctAnswers:
 *                       type: integer
 *                       example: 8
 *                     totalQuestions:
 *                       type: integer
 *                       example: 10
 *                 attemptId:
 *                   type: string
 *                   description: ID of the quiz attempt record
 *                   example: 507f1f77bcf86cd799439011
 *                 answers:
 *                   type: array
 *                   description: Detailed answer feedback (only if quiz.showCorrectAnswers is true)
 *                   items:
 *                     type: object
 *                     properties:
 *                       questionId:
 *                         type: string
 *                       selectedAnswer:
 *                         type: string
 *                       correctAnswer:
 *                         type: string
 *                       isCorrect:
 *                         type: boolean
 *                       explanation:
 *                         type: string
 *       404:
 *         description: Quiz not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:quizId/submit', protect, submitQuiz);

export default router;
