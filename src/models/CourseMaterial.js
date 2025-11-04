import mongoose from 'mongoose';

const chunkSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  wordCount: {
    type: Number,
    default: 0
  },
  metadata: {
    startChar: Number,
    endChar: Number
  }
});

const courseMaterialSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    default: 'General'
  },
  // Metadata
  wordCount: {
    type: Number,
    default: 0
  },
  chunkCount: {
    type: Number,
    default: 0
  },
  // Text chunks with embeddings (768 dimensions for Gemini)
  chunks: [chunkSchema],
  // Status
  status: {
    type: String,
    enum: ['processing', 'ready', 'failed'],
    default: 'processing',
    index: true
  },
  // Error tracking
  error: String
}, {
  timestamps: true
});

// Indexes for performance
courseMaterialSchema.index({ user: 1, createdAt: -1 });
courseMaterialSchema.index({ user: 1, topic: 1 });
courseMaterialSchema.index({ user: 1, status: 1 });

// Method to calculate statistics
courseMaterialSchema.methods.calculateStats = function() {
  this.chunkCount = this.chunks.length;
  this.wordCount = this.chunks.reduce((sum, chunk) => sum + chunk.wordCount, 0);
};

export default mongoose.model('CourseMaterial', courseMaterialSchema);
