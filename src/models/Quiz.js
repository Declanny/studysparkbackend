import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: {
    type: String,
    required: true
  },
  explanation: String,
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 1
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  topic: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['personal', 'live'],
    required: true
  },
  // Live Quiz fields
  code: {
    type: String,
    unique: true,
    sparse: true // Only required for live quizzes
  },
  isLive: {
    type: Boolean,
    default: false
  },
  startedAt: Date,
  endedAt: Date,
  duration: {
    type: Number, // in minutes
    default: 30
  },
  // Quiz creator (admin for live, user for personal)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Questions
  questions: [questionSchema],
  // Settings
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'medium'
  },
  questionCount: {
    type: Number,
    default: 10
  },
  shuffleQuestions: {
    type: Boolean,
    default: true
  },
  showCorrectAnswers: {
    type: Boolean,
    default: true
  },
  // Participants (for live quiz)
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: Date,
    status: {
      type: String,
      enum: ['joined', 'in_progress', 'completed'],
      default: 'joined'
    }
  }],
  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  }
}, {
  timestamps: true
});

// Generate unique 6-character code for live quizzes
quizSchema.methods.generateCode = function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

// Check if quiz is expired
quizSchema.methods.isExpired = function() {
  if (!this.startedAt || !this.duration) return false;
  const endTime = new Date(this.startedAt.getTime() + this.duration * 60000);
  return new Date() > endTime;
};

// Indexes for performance
quizSchema.index({ code: 1 });
quizSchema.index({ createdBy: 1 });
quizSchema.index({ type: 1, status: 1 });
quizSchema.index({ createdAt: -1 });

export default mongoose.model('Quiz', quizSchema);
