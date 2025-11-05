import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StudySpark API',
      version: '1.0.0',
      description: 'AI-powered study assistant API for university students',
      contact: {
        name: 'StudySpark Team',
        email: 'support@studyspark.dev'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server'
      },
      {
        url: 'https://studysparkbackend.onrender.com/api/v1',
        description: 'Production server (Render)'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email', example: 'student@studyspark.com' },
            name: { type: 'string', example: 'John Doe' },
            school: { type: 'string', example: 'University of Lagos' },
            course: { type: 'string', example: 'Computer Science' },
            level: { type: 'string', example: '200' },
            role: { type: 'string', enum: ['student', 'admin'], example: 'student' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        QuestionOption: {
          type: 'object',
          properties: {
            text: { type: 'string', example: 'Option text here' },
            isCorrect: { type: 'boolean', example: false }
          }
        },
        Question: {
          type: 'object',
          required: ['questionText', 'options', 'correctAnswer'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            questionText: { type: 'string', example: 'What is the time complexity of binary search?' },
            options: {
              type: 'array',
              items: { $ref: '#/components/schemas/QuestionOption' },
              minItems: 4,
              maxItems: 4
            },
            correctAnswer: { type: 'string', example: 'O(log n)' },
            explanation: { type: 'string', example: 'Binary search divides the search space in half with each iteration' },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], example: 'medium' },
            points: { type: 'integer', example: 1 }
          }
        },
        Quiz: {
          type: 'object',
          required: ['title', 'topic', 'type', 'createdBy', 'questions'],
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            title: { type: 'string', example: 'Data Structures Quiz' },
            description: { type: 'string', example: 'A comprehensive quiz on data structures' },
            topic: { type: 'string', example: 'Data Structures' },
            type: { type: 'string', enum: ['personal', 'live'], example: 'personal' },
            code: { type: 'string', example: 'ABC123', description: 'Join code for live quizzes only' },
            isLive: { type: 'boolean', example: false },
            startedAt: { type: 'string', format: 'date-time' },
            endedAt: { type: 'string', format: 'date-time' },
            duration: { type: 'integer', example: 30, description: 'Duration in minutes' },
            createdBy: { type: 'string', example: '507f1f77bcf86cd799439011' },
            questions: {
              type: 'array',
              items: { $ref: '#/components/schemas/Question' }
            },
            difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'mixed'], example: 'medium' },
            questionCount: { type: 'integer', example: 10 },
            shuffleQuestions: { type: 'boolean', example: true },
            showCorrectAnswers: { type: 'boolean', example: true },
            participants: {
              type: 'array',
              items: { $ref: '#/components/schemas/Participant' }
            },
            status: { type: 'string', enum: ['draft', 'active', 'completed', 'archived'], example: 'draft' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Participant: {
          type: 'object',
          properties: {
            userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
            joinedAt: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['joined', 'in_progress', 'completed'], example: 'joined' }
          }
        },
        QuizAttempt: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            quiz: { type: 'string', example: '507f1f77bcf86cd799439011' },
            user: { type: 'string', example: '507f1f77bcf86cd799439011' },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: { type: 'string' },
                  selectedAnswer: { type: 'string' },
                  isCorrect: { type: 'boolean' },
                  timeSpent: { type: 'integer' }
                }
              }
            },
            score: { type: 'number', example: 85.5 },
            totalQuestions: { type: 'integer', example: 10 },
            correctAnswers: { type: 'integer', example: 8 },
            timeSpent: { type: 'integer', example: 1200, description: 'Time in seconds' },
            status: { type: 'string', enum: ['in_progress', 'completed'], example: 'completed' },
            submittedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
