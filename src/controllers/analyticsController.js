import QuizAttempt from '../models/QuizAttempt.js';
import Quiz from '../models/Quiz.js';
import StudyChat from '../models/StudyChat.js';

/**
 * @desc    Get user performance analytics with AI analysis
 * @route   GET /api/v1/analytics/performance
 * @access  Private
 */
export const getPerformanceAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get all completed quiz attempts
    const attempts = await QuizAttempt.find({
      user: userId,
      status: 'completed'
    })
      .populate('quiz', 'title topic difficulty type')
      .sort({ createdAt: -1 })
      .limit(50);

    if (attempts.length === 0) {
      return res.json({
        success: true,
        message: 'No quiz attempts found',
        analytics: {
          totalQuizzes: 0,
          averageScore: 0,
          totalTimeSpent: 0,
          strongTopics: [],
          weakTopics: [],
          performanceTrend: []
        }
      });
    }

    // Calculate overall statistics
    const stats = calculateOverallStats(attempts);

    // Analyze performance by topic
    const topicAnalysis = analyzeByTopic(attempts);

    // Generate performance trend (last 10 attempts)
    const performanceTrend = generatePerformanceTrend(attempts.slice(0, 10));

    // Generate AI analysis
    const aiAnalysis = await generateAIAnalysis(stats, topicAnalysis, attempts);

    res.json({
      success: true,
      analytics: {
        ...stats,
        topicAnalysis,
        performanceTrend,
        aiAnalysis,
        recentAttempts: attempts.slice(0, 5).map(a => ({
          quizTitle: a.quiz.title,
          topic: a.quiz.topic,
          score: a.percentage,
          date: a.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch performance analytics'
    });
  }
};

/**
 * @desc    Get AI analysis report for specific quiz attempt
 * @route   GET /api/v1/analytics/quiz/:attemptId/analysis
 * @access  Private
 */
export const getQuizAnalysis = async (req, res) => {
  try {
    const { attemptId } = req.params;

    const attempt = await QuizAttempt.findOne({
      _id: attemptId,
      user: req.user.userId
    }).populate('quiz');

    if (!attempt) {
      return res.status(404).json({
        success: false,
        error: 'Quiz attempt not found'
      });
    }

    // Generate AI analysis if not already generated
    if (!attempt.aiAnalysis || !attempt.aiAnalysis.overallFeedback) {
      const analysis = await generateQuizAIAnalysis(attempt);
      attempt.aiAnalysis = analysis;
      await attempt.save();
    }

    res.json({
      success: true,
      attempt: {
        quiz: attempt.quiz.title,
        topic: attempt.quiz.topic,
        score: attempt.percentage,
        timeSpent: attempt.timeSpent,
        submittedAt: attempt.submittedAt
      },
      analysis: attempt.aiAnalysis
    });
  } catch (error) {
    console.error('Get quiz analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quiz analysis'
    });
  }
};

/**
 * @desc    Get study progress analytics
 * @route   GET /api/v1/analytics/study-progress
 * @access  Private
 */
export const getStudyProgress = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get study chat sessions
    const chats = await StudyChat.find({ user: userId });

    // Get quiz attempts
    const quizAttempts = await QuizAttempt.find({ user: userId, status: 'completed' });

    // Calculate study metrics
    const studyMetrics = {
      totalStudySessions: chats.length,
      totalMessagesExchanged: chats.reduce((sum, chat) => sum + chat.messageCount, 0),
      topicsStudied: [...new Set(chats.map(chat => chat.topic))],
      totalQuizzesTaken: quizAttempts.length,
      averageQuizScore: quizAttempts.reduce((sum, a) => sum + a.percentage, 0) / (quizAttempts.length || 1),
      totalStudyTime: calculateTotalStudyTime(chats, quizAttempts),
      weeklyProgress: generateWeeklyProgress(chats, quizAttempts)
    };

    res.json({
      success: true,
      studyMetrics
    });
  } catch (error) {
    console.error('Get study progress error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch study progress'
    });
  }
};

// ========== HELPER FUNCTIONS ==========

function calculateOverallStats(attempts) {
  const totalQuizzes = attempts.length;
  const totalScore = attempts.reduce((sum, a) => sum + a.percentage, 0);
  const averageScore = (totalScore / totalQuizzes).toFixed(2);
  const totalTimeSpent = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
  const totalCorrect = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
  const totalQuestions = attempts.reduce((sum, a) => sum + a.totalQuestions, 0);

  return {
    totalQuizzes,
    averageScore: parseFloat(averageScore),
    totalTimeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
    totalCorrect,
    totalQuestions,
    accuracyRate: ((totalCorrect / totalQuestions) * 100).toFixed(2)
  };
}

function analyzeByTopic(attempts) {
  const topicStats = {};

  attempts.forEach(attempt => {
    const topic = attempt.quiz.topic;
    if (!topicStats[topic]) {
      topicStats[topic] = {
        topic,
        attempts: 0,
        totalScore: 0,
        averageScore: 0
      };
    }

    topicStats[topic].attempts++;
    topicStats[topic].totalScore += attempt.percentage;
  });

  // Calculate averages and sort
  const topicArray = Object.values(topicStats).map(stat => ({
    ...stat,
    averageScore: (stat.totalScore / stat.attempts).toFixed(2)
  }));

  const strongTopics = topicArray
    .filter(t => t.averageScore >= 75)
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 5);

  const weakTopics = topicArray
    .filter(t => t.averageScore < 75)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 5);

  return {
    byTopic: topicArray,
    strongTopics,
    weakTopics
  };
}

function generatePerformanceTrend(recentAttempts) {
  return recentAttempts.reverse().map((attempt, index) => ({
    attemptNumber: index + 1,
    score: attempt.percentage,
    topic: attempt.quiz.topic,
    date: attempt.createdAt
  }));
}

async function generateAIAnalysis(stats, topicAnalysis, attempts) {
  // This is a mock AI analysis
  // TODO: Integrate with actual AI service for more sophisticated analysis

  const performanceLevel =
    stats.averageScore >= 90 ? 'Excellent' :
    stats.averageScore >= 75 ? 'Good' :
    stats.averageScore >= 60 ? 'Average' :
    'Needs Improvement';

  const strengths = topicAnalysis.strongTopics.map(t =>
    `Strong performance in ${t.topic} (${t.averageScore}% average)`
  );

  const weaknesses = topicAnalysis.weakTopics.map(t =>
    `Need more practice in ${t.topic} (${t.averageScore}% average)`
  );

  const recommendations = [];

  if (stats.averageScore < 70) {
    recommendations.push('Focus on understanding fundamental concepts before attempting quizzes');
    recommendations.push('Review incorrect answers and explanations carefully');
  }

  if (topicAnalysis.weakTopics.length > 0) {
    recommendations.push(`Dedicate extra study time to: ${topicAnalysis.weakTopics.map(t => t.topic).join(', ')}`);
  }

  recommendations.push('Take regular breaks between study sessions to improve retention');
  recommendations.push('Use the AI study assistant to clarify difficult concepts');

  return {
    performanceLevel,
    strengths: strengths.length > 0 ? strengths : ['Keep practicing to identify your strengths'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Great job! Keep maintaining consistent performance'],
    recommendations,
    overallFeedback: generateOverallFeedback(stats, performanceLevel)
  };
}

async function generateQuizAIAnalysis(attempt) {
  const performanceLevel = attempt.getPerformanceLevel();

  // Analyze answer patterns
  const correctAnswers = attempt.answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = attempt.answers.filter(a => a.isCorrect === false).length;

  const strengths = [];
  const weaknesses = [];
  const recommendations = [];

  if (attempt.percentage >= 80) {
    strengths.push('Strong understanding of core concepts');
    strengths.push('Consistent performance across questions');
  }

  if (attempt.percentage < 60) {
    weaknesses.push('Fundamental concepts need reinforcement');
    recommendations.push('Review the topic basics before attempting more quizzes');
    recommendations.push('Use study materials and YouTube recommendations');
  }

  if (incorrectAnswers > correctAnswers) {
    weaknesses.push('More than half of the answers were incorrect');
    recommendations.push('Spend more time studying before attempting quizzes');
  }

  const timePerQuestion = (attempt.timeSpent || 0) / attempt.totalQuestions;
  if (timePerQuestion < 30) {
    recommendations.push('Take more time to read questions carefully');
  }

  return {
    performanceLevel,
    strengths: strengths.length > 0 ? strengths : ['Review your study approach'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Good job! Keep it up'],
    recommendations: recommendations.length > 0 ? recommendations : ['Continue regular practice'],
    overallFeedback: `You scored ${attempt.percentage.toFixed(2)}% on this ${attempt.quiz.topic} quiz. ${
      attempt.percentage >= 75
        ? 'Great work! Your understanding of the topic is solid.'
        : 'Keep practicing! Review the explanations for incorrect answers and try similar questions.'
    }`
  };
}

function generateOverallFeedback(stats, performanceLevel) {
  if (performanceLevel === 'Excellent') {
    return `Outstanding performance! You've completed ${stats.totalQuizzes} quizzes with an impressive ${stats.averageScore}% average. Keep up the excellent work and consider helping peers who might be struggling.`;
  } else if (performanceLevel === 'Good') {
    return `Good progress! You've maintained a ${stats.averageScore}% average across ${stats.totalQuizzes} quizzes. Focus on your weaker topics to push into the excellent range.`;
  } else if (performanceLevel === 'Average') {
    return `You're making progress with ${stats.totalQuizzes} quizzes completed and a ${stats.averageScore}% average. Consistent study and focused practice on weak areas will help you improve significantly.`;
  } else {
    return `You've completed ${stats.totalQuizzes} quizzes with a ${stats.averageScore}% average. Don't get discouraged! Focus on understanding basics, use study resources actively, and practice regularly. Improvement will come with consistent effort.`;
  }
}

function calculateTotalStudyTime(chats, quizAttempts) {
  // Estimate study time from chat sessions (assume 2 mins per message exchange)
  const chatTime = chats.reduce((sum, chat) => sum + (chat.messageCount * 2), 0);

  // Quiz time
  const quizTime = quizAttempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0) / 60;

  return Math.round(chatTime + quizTime); // in minutes
}

function generateWeeklyProgress(chats, quizAttempts) {
  // Generate last 7 days progress
  const last7Days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);

    const dayChats = chats.filter(c =>
      new Date(c.createdAt) >= date && new Date(c.createdAt) < nextDate
    ).length;

    const dayQuizzes = quizAttempts.filter(a =>
      new Date(a.createdAt) >= date && new Date(a.createdAt) < nextDate
    ).length;

    last7Days.push({
      date: date.toISOString().split('T')[0],
      studySessions: dayChats,
      quizzesTaken: dayQuizzes,
      totalActivity: dayChats + dayQuizzes
    });
  }

  return last7Days;
}

export default {
  getPerformanceAnalytics,
  getQuizAnalysis,
  getStudyProgress
};
