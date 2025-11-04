import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  selectedAnswer: String,
  isCorrect: Boolean,
  timeSpent: Number, // in seconds
  answeredAt: Date
});

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Answers
  answers: [answerSchema],
  // Scoring
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    required: true
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  incorrectAnswers: {
    type: Number,
    default: 0
  },
  skippedQuestions: {
    type: Number,
    default: 0
  },
  percentage: {
    type: Number,
    default: 0
  },
  // Timing
  startedAt: {
    type: Date,
    default: Date.now
  },
  submittedAt: Date,
  timeSpent: Number, // total time in seconds
  // Status
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress'
  },
  // AI Analysis
  aiAnalysis: {
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
    overallFeedback: String,
    performanceLevel: {
      type: String,
      enum: ['excellent', 'good', 'average', 'needs_improvement']
    }
  }
}, {
  timestamps: true
});

// Calculate score and statistics
quizAttemptSchema.methods.calculateScore = function() {
  this.correctAnswers = this.answers.filter(a => a.isCorrect).length;
  this.incorrectAnswers = this.answers.filter(a => a.isCorrect === false).length;
  this.skippedQuestions = this.totalQuestions - this.answers.length;
  this.percentage = (this.correctAnswers / this.totalQuestions) * 100;
  this.score = this.correctAnswers;

  return {
    score: this.score,
    correctAnswers: this.correctAnswers,
    incorrectAnswers: this.incorrectAnswers,
    skippedQuestions: this.skippedQuestions,
    percentage: this.percentage.toFixed(2)
  };
};

// Generate performance level based on percentage
quizAttemptSchema.methods.getPerformanceLevel = function() {
  if (this.percentage >= 90) return 'excellent';
  if (this.percentage >= 75) return 'good';
  if (this.percentage >= 60) return 'average';
  return 'needs_improvement';
};

// Indexes for performance
quizAttemptSchema.index({ quiz: 1, user: 1 });
quizAttemptSchema.index({ user: 1, status: 1 });
quizAttemptSchema.index({ createdAt: -1 });

export default mongoose.model('QuizAttempt', quizAttemptSchema);
