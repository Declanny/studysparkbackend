import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const recommendationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['video', 'article', 'practice', 'reading'],
    required: true
  },
  title: String,
  url: String,
  description: String,
  thumbnail: String,
  duration: String, // for videos
  source: String // e.g., "YouTube", "Khan Academy"
});

const studyChatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  subject: String, // e.g., "Computer Science", "Mathematics"
  // Conversation history
  messages: [messageSchema],
  // AI-generated recommendations
  recommendations: [recommendationSchema],
  // Session metadata
  sessionStarted: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  messageCount: {
    type: Number,
    default: 0
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  // Summary (generated at end of session)
  summary: {
    keyPoints: [String],
    topicsDiscussed: [String],
    nextSteps: [String]
  }
}, {
  timestamps: true
});

// Add a message to the conversation
studyChatSchema.methods.addMessage = function(role, content) {
  this.messages.push({ role, content });
  this.messageCount = this.messages.length;
  this.lastActivity = new Date();
};

// Add a recommendation
studyChatSchema.methods.addRecommendation = function(recommendation) {
  this.recommendations.push(recommendation);
};

// Indexes for performance
studyChatSchema.index({ user: 1, status: 1 });
studyChatSchema.index({ topic: 1 });
studyChatSchema.index({ lastActivity: -1 });
studyChatSchema.index({ createdAt: -1 });

export default mongoose.model('StudyChat', studyChatSchema);
