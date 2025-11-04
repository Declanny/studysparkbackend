import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

// Import routes
import authRoutes from './routes/auth.js';
import studyRoutes from './routes/study.js';
import quizRoutes from './routes/quiz.js';
import analyticsRoutes from './routes/analytics.js';

// Import config
import connectDB from './config/database.js';
import swaggerSpec from './config/swagger.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());

// Professional CORS configuration
const allowedOrigins = [
  'http://localhost:3000',      // Frontend dev
  'http://localhost:3001',      // Backend dev (for Swagger)
  'https://studyspark.vercel.app', // Production frontend
  process.env.FRONTEND_URL      // Environment variable
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    // Allow all Vercel deployment URLs (*.vercel.app)
    if (origin && origin.match(/^https:\/\/.*\.vercel\.app$/)) {
      return callback(null, true);
    }

    console.log('Blocked by CORS:', origin);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Root route - API info
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.json({
    success: true,
    message: '🎓 Welcome to StudySpark API',
    version: '1.0.0',
    status: 'running',
    documentation: `${baseUrl}/api-docs`,
    endpoints: {
      auth: {
        register: `${baseUrl}/api/v1/auth/register`,
        login: `${baseUrl}/api/v1/auth/login`,
        logout: `${baseUrl}/api/v1/auth/logout`,
        me: `${baseUrl}/api/v1/auth/me`
      },
      study: {
        query: `${baseUrl}/api/v1/study/query`,
        recommendations: `${baseUrl}/api/v1/study/recommendations`
      },
      quiz: {
        generate: `${baseUrl}/api/v1/quiz/personal/generate`,
        join: `${baseUrl}/api/v1/quiz/join`
      },
      analytics: {
        performance: `${baseUrl}/api/v1/analytics/performance`
      }
    },
    links: {
      docs: `${baseUrl}/api-docs`,
      health: `${baseUrl}/health`,
      github: 'https://github.com/Declanny/studysparkbackend'
    }
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'StudySpark API is running!',
    timestamp: new Date().toISOString(),
    docs: '/api-docs'
  });
});

// Swagger Documentation at /api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'StudySpark API Docs',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Alias: /docs redirects to /api-docs
app.get('/docs', (req, res) => {
  res.redirect('/api-docs');
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/study', studyRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    availableRoutes: {
      root: '/',
      health: '/health',
      docs: '/api-docs or /docs',
      api: '/api/v1/*'
    }
  });
});

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 StudySpark API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;
