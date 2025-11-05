import Ably from 'ably';
import Quiz from '../models/Quiz';
// import Quiz from '../models/Quiz.js';
import User from '../models/User.js';

const ably = new Ably.Realtime(process.env.ABLY_API_KEY);
const rest = new Ably.Rest(process.env.ABLY_API_KEY);

// Map to store active quiz sessions
const activeQuizzes = new Map();

export const liveQuizController = {
  // 1. Create Quiz
  createQuiz: async (req, res) => {
    try {
      const {
        title,
        description,
        topic,
        type,
        duration,
        questions,
        difficulty,
        questionCount,
        shuffleQuestions,
        showCorrectAnswers
      } = req.body;

      const quiz = new Quiz({
        title,
        description,
        topic,
        type,
        duration,
        questions,
        difficulty,
        questionCount,
        shuffleQuestions,
        showCorrectAnswers,
        createdBy: req.user._id,
        status: 'draft'
      });

      await quiz.save();
      res.status(201).json({
        success: true,
        data: quiz
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // 2. Start Live Quiz
  startLiveQuiz: async (req, res) => {
    try {
      const { quizId } = req.params;
      
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }

      // Check if user is the quiz creator
      if (quiz.createdBy.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to start this quiz'
        });
      }

      // Generate unique code for live quiz
      const code = quiz.generateCode();
      quiz.code = code;
      quiz.type = 'live';
      quiz.isLive = true;
      quiz.status = 'active';
      quiz.startedAt = new Date();

      await quiz.save();

      // Initialize active quiz session
      activeQuizzes.set(quizId, {
        currentQuestionIndex: 0,
        participants: new Map(),
        questionStartTime: null,
        isActive: true,
        leaderboard: []
      });

      // Create Ably channel for this quiz
      const channel = ably.channels.get(`quiz-${quizId}`);

      res.status(200).json({
        success: true,
        data: {
          quiz,
          joinLink: `${process.env.FRONTEND_URL}/join/${code}`,
          joinCode: code
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // 3. Join Live Quiz
  joinLiveQuiz: async (req, res) => {
    try {
      const { code } = req.body;
      
      const quiz = await Quiz.findOne({ code, isLive: true, status: 'active' });
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Invalid quiz code or quiz not active'
        });
      }

      // Check if quiz has ended
      if (quiz.endedAt || quiz.isExpired()) {
        return res.status(400).json({
          success: false,
          error: 'Quiz has ended'
        });
      }

      // Add participant to quiz
      const participant = {
        userId: req.user._id,
        joinedAt: new Date(),
        status: 'joined'
      };

      quiz.participants.push(participant);
      await quiz.save();

      // Add participant to active session
      const activeQuiz = activeQuizzes.get(quiz._id.toString());
      if (activeQuiz) {
        activeQuiz.participants.set(req.user._id.toString(), {
          score: 0,
          answers: new Map(),
          lastAnswerTime: null
        });
      }

      // Notify all participants via Ably
      const channel = ably.channels.get(`quiz-${quiz._id}`);
      await channel.publish('participant-joined', {
        participant: {
          userId: req.user._id,
          username: req.user.username
        },
        totalParticipants: quiz.participants.length
      });

      res.status(200).json({
        success: true,
        data: {
          quizId: quiz._id,
          title: quiz.title,
          currentQuestion: activeQuiz ? this.getCurrentQuestionForUser(quiz, activeQuiz.currentQuestionIndex) : null
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // 4. Get Current Question
  getCurrentQuestion: async (req, res) => {
    try {
      const { quizId } = req.params;
      
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }

      const activeQuiz = activeQuizzes.get(quizId);
      if (!activeQuiz) {
        return res.status(400).json({
          success: false,
          error: 'Quiz not active'
        });
      }

      const currentQuestion = this.getCurrentQuestionForUser(quiz, activeQuiz.currentQuestionIndex);
      
      res.status(200).json({
        success: true,
        data: currentQuestion
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // 5. Submit Answer
  submitAnswer: async (req, res) => {
    try {
      const { quizId } = req.params;
      const { answer, questionIndex } = req.body;
      
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }

      const activeQuiz = activeQuizzes.get(quizId);
      if (!activeQuiz) {
        return res.status(400).json({
          success: false,
          error: 'Quiz not active'
        });
      }

      // Check if user is participant
      const participantData = activeQuiz.participants.get(req.user._id.toString());
      if (!participantData) {
        return res.status(403).json({
          success: false,
          error: 'Not a participant in this quiz'
        });
      }

      // Check if answering current question
      if (questionIndex !== activeQuiz.currentQuestionIndex) {
        return res.status(400).json({
          success: false,
          error: 'Cannot answer previous or future questions'
        });
      }

      const question = quiz.questions[questionIndex];
      const isCorrect = question.correctAnswer === answer;
      
      // Store answer
      participantData.answers.set(questionIndex, {
        answer,
        isCorrect,
        submittedAt: new Date()
      });

      // Update score if correct
      if (isCorrect) {
        participantData.score += question.points || 1;
      }

      res.status(200).json({
        success: true,
        data: {
          isCorrect,
          correctAnswer: quiz.showCorrectAnswers ? question.correctAnswer : undefined
        }
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // 6. Move to Next Question (Automatically called after time elapses)
  nextQuestion: async (quizId) => {
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) return;

      const activeQuiz = activeQuizzes.get(quizId);
      if (!activeQuiz) return;

      const currentIndex = activeQuiz.currentQuestionIndex;
      
      // Calculate and broadcast leaderboard for current question
      await this.broadcastLeaderboard(quizId);

      // Check if quiz has ended
      if (currentIndex >= quiz.questions.length - 1) {
        await this.endQuiz(quizId);
        return;
      }

      // Move to next question
      activeQuiz.currentQuestionIndex++;
      activeQuiz.questionStartTime = new Date();

      const channel = ably.channels.get(`quiz-${quizId}`);
      
      // Broadcast new question
      await channel.publish('next-question', {
        questionIndex: activeQuiz.currentQuestionIndex,
        question: this.getCurrentQuestionForUser(quiz, activeQuiz.currentQuestionIndex),
        startTime: activeQuiz.questionStartTime
      });

      // Set timeout for next question (assuming 30 seconds per question)
      const questionDuration = 30000; // 30 seconds
      setTimeout(() => {
        this.nextQuestion(quizId);
      }, questionDuration);

    } catch (error) {
      console.error('Error moving to next question:', error);
    }
  },

  // 7. End Quiz
  endQuiz: async (req, res) => {
    try {
      const { quizId } = req.params;
      
      await this.endQuiz(quizId);

      res.status(200).json({
        success: true,
        message: 'Quiz ended successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // 8. Get Leaderboard
  getLeaderboard: async (req, res) => {
    try {
      const { quizId } = req.params;
      
      const leaderboard = await this.calculateLeaderboard(quizId);
      
      res.status(200).json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // Helper Methods
  getCurrentQuestionForUser: (quiz, questionIndex) => {
    if (questionIndex >= quiz.questions.length) return null;
    
    const question = quiz.questions[questionIndex];
    return {
      questionIndex,
      questionText: question.questionText,
      options: question.options.map(opt => ({ text: opt.text })),
      points: question.points,
      difficulty: question.difficulty
    };
  },

  broadcastLeaderboard: async (quizId) => {
    try {
      const leaderboard = await this.calculateLeaderboard(quizId);
      
      const channel = ably.channels.get(`quiz-${quizId}`);
      await channel.publish('leaderboard-update', {
        leaderboard,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error broadcasting leaderboard:', error);
    }
  },

  calculateLeaderboard: async (quizId) => {
    const activeQuiz = activeQuizzes.get(quizId);
    if (!activeQuiz) return [];

    const leaderboard = [];
    
    for (const [userId, data] of activeQuiz.participants.entries()) {
      const user = await User.findById(userId).select('username email');
      if (user) {
        leaderboard.push({
          userId: user._id,
          username: user.username,
          score: data.score,
          answers: data.answers.size
        });
      }
    }

    // Sort by score descending
    return leaderboard.sort((a, b) => b.score - a.score);
  },

  endQuiz: async (quizId) => {
    const quiz = await Quiz.findById(quizId);
    if (quiz) {
      quiz.endedAt = new Date();
      quiz.status = 'completed';
      quiz.isLive = false;
      await quiz.save();
    }

    const activeQuiz = activeQuizzes.get(quizId);
    if (activeQuiz) {
      activeQuiz.isActive = false;
      
      // Broadcast final leaderboard
      await this.broadcastLeaderboard(quizId);

      // Broadcast quiz end
      const channel = ably.channels.get(`quiz-${quizId}`);
      await channel.publish('quiz-ended', {
        finalLeaderboard: await this.calculateLeaderboard(quizId),
        endedAt: new Date()
      });

      // Clean up after delay
      setTimeout(() => {
        activeQuizzes.delete(quizId);
      }, 300000); // 5 minutes
    }
  }
};

export default liveQuizController;