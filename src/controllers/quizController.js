import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';
import { generateValidatedQuiz } from '../services/generatequiz.js';

// ========== LIVE QUIZ ENDPOINTS ==========

/**
 * @desc    Generate questions and save to database (Admin & User)
 * @route   POST /api/v1/quiz/generate
 * @access  Private
 */
export const generateQuiz = async (req, res) => {
  try {
    const { topic, difficulty, questionCount, type, title, description, duration } = req.body;

    // Validate required fields
    if (!topic || !type) {
      return res.status(400).json({
        success: false,
        error: 'Topic and type are required'
      });
    }

    // For now, we'll create sample questions
    // TODO: Integrate with AI service (OpenAI, Gemini) to generate questions
    const sampleQuestions = generateSampleQuestions(topic, questionCount || 10, difficulty || 'medium');

    // Create quiz
    const quiz = await Quiz.create({
      title: title || `${topic} Quiz`,
      description: description || `A quiz about ${topic}`,
      topic,
      type, // 'personal' or 'live'
      createdBy: req.user.userId,
      questions: sampleQuestions,
      difficulty: difficulty || 'medium',
      questionCount: questionCount || 10,
      duration: duration || 30,
      status: type === 'live' ? 'draft' : 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Quiz generated successfully',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        topic: quiz.topic,
        type: quiz.type,
        questionCount: quiz.questions.length,
        difficulty: quiz.difficulty,
        duration: quiz.duration
      }
    });
  } catch (error) {
    console.error('Generate quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate quiz'
    });
  }
};

/**
 * @desc    Generate questions only (without saving to database)
 * @route   POST /api/v1/quiz/questions/generate
 * @access  Private
 */
export const generateQuestions = async (req, res) => {
  try {
    const { topic, subject, difficulty, questionCount, includeExplanations } = req.body;

    // Validate required fields
    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    // Generate sample questions
    // TODO: Integrate with AI service (OpenAI, Gemini) to generate questions
    const questions = generateSampleQuestions(
      topic,
      questionCount || 10,
      difficulty || 'medium'
    );

    // Format questions for frontend
    const formattedQuestions = questions.map((q, index) => ({
      id: `temp-${index + 1}`,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: includeExplanations ? q.explanation : undefined,
      difficulty: q.difficulty,
      points: q.points
    }));

    res.status(200).json({
      success: true,
      questions: formattedQuestions,
      metadata: {
        topic,
        subject: subject || topic,
        difficulty: difficulty || 'medium',
        count: formattedQuestions.length
      }
    });
  } catch (error) {
    console.error('Generate questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate questions'
    });
  }
};

/**
 * @desc    Create live quiz and generate code for users to join (Admin)
 * @route   POST /api/v1/quiz/live/create
 * @access  Private (Admin)
 */
export const createLiveQuiz = async (req, res) => {
  try {
    const { title, topic, subject, difficulty, questions, timeLimit } = req.body;

    if (!title || !topic || !questions || questions.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Title, topic, and questions are required'
      });
    }

    // Create quiz with live type
    const quiz = await Quiz.create({
      title,
      topic,
      subject,
      type: 'live',
      createdBy: req.user.userId,
      questions,
      difficulty: difficulty || 'medium',
      questionCount: questions.length,
      duration: timeLimit || 30,
      status: 'draft', // Start as draft, admin will activate
      isLive: false
    });

    // Generate unique code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = quiz.generateCode();
      const existing = await Quiz.findOne({ code });
      if (!existing) isUnique = true;
    }

    // Update quiz with code and make it active (ready for participants to join)
    quiz.code = code;
    quiz.status = 'active'; // Active means participants can join, but quiz hasn't started
    await quiz.save();

    res.status(201).json({
      success: true,
      message: 'Live quiz created successfully',
      code: quiz.code,
      quiz: {
        id: quiz._id,
        title: quiz.title,
        code: quiz.code,
        topic: quiz.topic,
        questionCount: quiz.questions.length,
        duration: quiz.duration,
        isLive: quiz.isLive,
        status: quiz.status
      }
    });
  } catch (error) {
    console.error('Create live quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create live quiz'
    });
  }
};

/**
 * @desc    Join live quiz with code (User)
 * @route   POST /api/v1/quiz/join
 * @access  Private
 */
export const joinQuiz = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Quiz code is required'
      });
    }

    // Find quiz by code
    const quiz = await Quiz.findOne({ code, status: 'active' });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Invalid quiz code or quiz is not active'
      });
    }

    // Check if user already joined
    const alreadyJoined = quiz.participants.some(
      p => p.userId.toString() === req.user.userId
    );

    if (alreadyJoined) {
      return res.json({
        success: true,
        message: 'Already joined this quiz',
        quiz: {
          id: quiz._id,
          title: quiz.title,
          topic: quiz.topic,
          isLive: quiz.isLive,
          participantCount: quiz.participants.length
        }
      });
    }

    // Add user to participants
    quiz.participants.push({
      userId: req.user.userId,
      joinedAt: new Date(),
      status: 'joined'
    });

    await quiz.save();

    res.json({
      success: true,
      message: 'Successfully joined quiz',
      quiz: {
        id: quiz._id,
        title: quiz.title,
        topic: quiz.topic,
        description: quiz.description,
        duration: quiz.duration,
        questionCount: quiz.questions.length,
        isLive: quiz.isLive,
        participantCount: quiz.participants.length
      }
    });
  } catch (error) {
    console.error('Join quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join quiz'
    });
  }
};

/**
 * @desc    Start live quiz (Admin)
 * @route   POST /api/v1/quiz/live/start/:quizId
 * @access  Private (Admin)
 */
export const startQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check if user is the creator
    if (quiz.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to start this quiz'
      });
    }

    if (quiz.isLive) {
      return res.status(400).json({
        success: false,
        error: 'Quiz is already started'
      });
    }

    // Start quiz
    quiz.isLive = true;
    quiz.startedAt = new Date();
    quiz.status = 'active';
    await quiz.save();

    // TODO: Emit Socket.io event to notify all participants

    res.json({
      success: true,
      message: 'Quiz started successfully',
      quiz: {
        id: quiz._id,
        isLive: quiz.isLive,
        startedAt: quiz.startedAt,
        participantCount: quiz.participants.length
      }
    });
  } catch (error) {
    console.error('Start quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start quiz'
    });
  }
};

/**
 * @desc    End live quiz (Admin)
 * @route   POST /api/v1/quiz/live/end/:quizId
 * @access  Private (Admin)
 */
export const endQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check if user is the creator
    if (quiz.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to end this quiz'
      });
    }

    // End quiz
    quiz.isLive = false;
    quiz.endedAt = new Date();
    quiz.status = 'completed';
    await quiz.save();

    // TODO: Emit Socket.io event to notify all participants

    res.json({
      success: true,
      message: 'Quiz ended successfully',
      quiz: {
        id: quiz._id,
        isLive: quiz.isLive,
        endedAt: quiz.endedAt,
        participantCount: quiz.participants.length
      }
    });
  } catch (error) {
    console.error('End quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end quiz'
    });
  }
};

// ========== PERSONAL QUIZ ENDPOINTS ==========

/**
 * @desc    Fetch quiz questions (User)
 * @route   GET /api/v1/quiz/:quizId
 * @access  Private
 */
export const getQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId)
      .select('-questions.correctAnswer -questions.explanation') // Hide answers initially
      .populate('createdBy', 'name email');

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check access for personal quizzes
    if (quiz.type === 'personal' && quiz.createdBy._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this quiz'
      });
    }

    // For live quizzes, check if user has joined
    if (quiz.type === 'live') {
      const hasJoined = quiz.participants.some(
        p => p.userId.toString() === req.user.userId
      );

      if (!hasJoined && quiz.createdBy._id.toString() !== req.user.userId) {
        return res.status(403).json({
          success: false,
          error: 'You must join this quiz first'
        });
      }

      if (!quiz.isLive) {
        return res.status(400).json({
          success: false,
          error: 'Quiz has not started yet'
        });
      }
    }

    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz'
    });
  }
};

/**
 * @desc    Save user quiz answers (User)
 * @route   POST /api/v1/quiz/:quizId/save
 * @access  Private
 */
export const saveQuizProgress = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers } = req.body;

    // Find or create quiz attempt
    let attempt = await QuizAttempt.findOne({
      quiz: quizId,
      user: req.user.userId,
      status: 'in_progress'
    });

    if (!attempt) {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: 'Quiz not found'
        });
      }

      attempt = await QuizAttempt.create({
        quiz: quizId,
        user: req.user.userId,
        totalQuestions: quiz.questions.length,
        answers: []
      });
    }

    // Update answers
    attempt.answers = answers;
    await attempt.save();

    res.json({
      success: true,
      message: 'Progress saved successfully',
      attemptId: attempt._id
    });
  } catch (error) {
    console.error('Save quiz progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save progress'
    });
  }
};

/**
 * @desc    Submit quiz and get results (User)
 * @route   POST /api/v1/quiz/:quizId/submit
 * @access  Private
 */
export const submitQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { answers, timeSpent } = req.body;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Find or create attempt
    let attempt = await QuizAttempt.findOne({
      quiz: quizId,
      user: req.user.userId,
      status: 'in_progress'
    });

    if (!attempt) {
      attempt = await QuizAttempt.create({
        quiz: quizId,
        user: req.user.userId,
        totalQuestions: quiz.questions.length,
        answers: []
      });
    }

    // Grade answers
    const gradedAnswers = answers.map(answer => {
      const question = quiz.questions.id(answer.questionId);
      return {
        ...answer,
        isCorrect: question ? answer.selectedAnswer === question.correctAnswer : false
      };
    });

    attempt.answers = gradedAnswers;
    attempt.timeSpent = timeSpent;
    attempt.submittedAt = new Date();
    attempt.status = 'completed';

    // Calculate score
    const results = attempt.calculateScore();
    await attempt.save();

    // Return results with correct answers if quiz settings allow
    const response = {
      success: true,
      message: 'Quiz submitted successfully',
      results,
      attemptId: attempt._id
    };

    if (quiz.showCorrectAnswers) {
      response.answers = gradedAnswers.map(answer => {
        const question = quiz.questions.id(answer.questionId);
        return {
          questionId: answer.questionId,
          selectedAnswer: answer.selectedAnswer,
          correctAnswer: question?.correctAnswer,
          isCorrect: answer.isCorrect,
          explanation: question?.explanation
        };
      });
    }

    res.json(response);
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit quiz'
    });
  }
};

/**
 * @desc    Get user's quiz attempts
 * @route   GET /api/v1/quiz/attempts
 * @access  Private
 */
export const getQuizAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({
      user: req.user.userId,
      status: 'completed'
    })
      .populate('quiz', 'title topic type difficulty')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({
      success: true,
      count: attempts.length,
      attempts
    });
  } catch (error) {
    console.error('Get quiz attempts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz attempts'
    });
  }
};

/**
 * @desc    Get all personal quizzes for user
 * @route   GET /api/v1/quiz/personal
 * @access  Private
 */
export const getPersonalQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({
      createdBy: req.user.userId,
      type: 'personal'
    })
      .select('-questions.correctAnswer -questions.explanation')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: quizzes.length,
      quizzes
    });
  } catch (error) {
    console.error('Get personal quizzes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch personal quizzes'
    });
  }
};

/**
 * @desc    Get live quiz by ID (for admin dashboard)
 * @route   GET /api/v1/quiz/live/:quizId
 * @access  Private
 */
export const getLiveQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        error: 'Quiz not found'
      });
    }

    // Check if user is the creator
    if (quiz.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not authorized to view this quiz'
      });
    }

    res.json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Get live quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz'
    });
  }
};

/**
 * @desc    Create a personal quiz directly
 * @route   POST /api/v1/quiz/personal/create
 * @access  Private
 */
export const createPersonalQuiz = async (req, res) => {
  try {
    // removed title 
    // changed subject to course
    // changed questions to numberQuestions
    console.log("print user", req.user.userId);

    const { topic, course, difficulty, numberQuestions } = req.body;

    if (!topic || numberQuestions === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic, and number of questions are required'
      });
    }
    //  generate questions with AL service
    const generatedQuiz = await generateValidatedQuiz(topic, numberQuestions, difficulty || 'medium');
    if (!generatedQuiz) {
      return res.status(500).json({
        success: false,
        error: 'Failed to generate quiz questions'
      });
    }

    console.log("generated quiz in controller", generateQuiz);


    // Destructure generated quiz data



    // Note: createdBy, code, startedAt, endedAt will be handled by your application

    const quiz = await Quiz.create({

      ...generatedQuiz,
      course,
      createdBy: req.user.userId || "690a3c4582649fa9b470aa5a",

      type: 'personal', // Default to personal, can be updated later
      isLive: false,
      shuffleQuestions: true,
      showCorrectAnswers: true,
      status: 'draft',
      participants: [],
    });

    res.status(201).json({
      success: true,
      message: 'Personal quiz created successfully',
      quiz
    });
  } catch (error) {
    console.error('Create personal quiz error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create personal quiz'
    });
  }
};

// ========== HELPER FUNCTIONS ==========

function generateSampleQuestions(topic, count, difficulty) {
  const questions = [];

  for (let i = 1; i <= count; i++) {
    questions.push({
      questionText: `Sample question ${i} about ${topic}`,
      options: [
        { text: 'Option A', isCorrect: true },
        { text: 'Option B', isCorrect: false },
        { text: 'Option C', isCorrect: false },
        { text: 'Option D', isCorrect: false }
      ],
      correctAnswer: 'Option A',
      explanation: `This is the explanation for question ${i}`,
      difficulty,
      points: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3
    });
  }

  return questions;
}
