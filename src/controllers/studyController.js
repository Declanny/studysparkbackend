import StudyChat from '../models/StudyChat.js';
import axios from 'axios';

/**
 * @desc    Create chat session with AI (includes question, YouTube recommendations, and AI response)
 * @route   POST /api/v1/study/chat
 * @access  Private
 */
export const createStudyChat = async (req, res) => {
  try {
    const { topic, message, subject } = req.body;

    if (!topic || !message) {
      return res.status(400).json({
        success: false,
        error: 'Topic and message are required'
      });
    }

    // Find or create study chat session
    let chat = await StudyChat.findOne({
      user: req.user.userId,
      topic,
      status: 'active'
    });

    if (!chat) {
      chat = await StudyChat.create({
        user: req.user.userId,
        topic,
        subject: subject || 'General'
      });
    }

    // Add user message
    chat.addMessage('user', message);

    // TODO: Get AI response from OpenAI/Gemini API
    // For now, return a mock response
    const aiResponse = await generateAIResponse(topic, message);
    chat.addMessage('assistant', aiResponse);

    // Get YouTube recommendations
    const recommendations = await getYouTubeRecommendations(topic, message);
    recommendations.forEach(rec => chat.addRecommendation(rec));

    await chat.save();

    res.json({
      success: true,
      message: 'AI response generated successfully',
      data: {
        chatId: chat._id,
        aiResponse,
        recommendations,
        messageCount: chat.messageCount
      }
    });
  } catch (error) {
    console.error('Create study chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate AI response'
    });
  }
};

/**
 * @desc    Get study recommendations (videos, articles, practice problems)
 * @route   GET /api/v1/study/recommendations
 * @access  Private
 */
export const getRecommendations = async (req, res) => {
  try {
    const { topic, subject } = req.query;

    if (!topic) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required'
      });
    }

    // Get recommendations from various sources
    const youtubeVideos = await getYouTubeRecommendations(topic);
    const practiceProblems = generatePracticeProblems(topic);

    const recommendations = {
      videos: youtubeVideos,
      practice: practiceProblems,
      articles: [
        {
          type: 'article',
          title: `Understanding ${topic}`,
          url: `https://www.geeksforgeeks.org/${topic.toLowerCase().replace(/\s+/g, '-')}`,
          description: `Comprehensive guide to ${topic}`,
          source: 'GeeksforGeeks'
        }
      ]
    };

    res.json({
      success: true,
      topic,
      recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recommendations'
    });
  }
};

/**
 * @desc    Get user's study chat history
 * @route   GET /api/v1/study/chats
 * @access  Private
 */
export const getStudyChats = async (req, res) => {
  try {
    const chats = await StudyChat.find({
      user: req.user.userId
    })
      .sort({ lastActivity: -1 })
      .limit(20)
      .select('-messages'); // Exclude full message history for list view

    res.json({
      success: true,
      count: chats.length,
      chats
    });
  } catch (error) {
    console.error('Get study chats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch study chats'
    });
  }
};

/**
 * @desc    Get specific chat session with full message history
 * @route   GET /api/v1/study/chat/:chatId
 * @access  Private
 */
export const getStudyChatById = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await StudyChat.findOne({
      _id: chatId,
      user: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    res.json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Get study chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch chat session'
    });
  }
};

/**
 * @desc    Continue existing chat session
 * @route   POST /api/v1/study/chat/:chatId/message
 * @access  Private
 */
export const addMessageToChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    const chat = await StudyChat.findOne({
      _id: chatId,
      user: req.user.userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat session not found'
      });
    }

    // Add user message
    chat.addMessage('user', message);

    // Get AI response
    const aiResponse = await generateAIResponse(chat.topic, message, chat.messages);
    chat.addMessage('assistant', aiResponse);

    await chat.save();

    res.json({
      success: true,
      data: {
        aiResponse,
        messageCount: chat.messageCount
      }
    });
  } catch (error) {
    console.error('Add message error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add message'
    });
  }
};

// ========== HELPER FUNCTIONS ==========

/**
 * Generate AI response (mock implementation)
 * TODO: Replace with actual AI API integration (OpenAI, Gemini, etc.)
 */
async function generateAIResponse(topic, message, conversationHistory = []) {
  // This is a mock response
  // In production, integrate with OpenAI, Google Gemini, or other AI services

  const responses = {
    'data structures': `Great question about ${topic}! Let me explain:

${topic} are fundamental concepts in computer science that organize and store data efficiently. Here's a comprehensive breakdown:

1. **Arrays**: Contiguous memory blocks for storing elements of the same type
2. **Linked Lists**: Nodes connected via pointers, allowing dynamic size
3. **Stacks**: LIFO (Last In First Out) structure
4. **Queues**: FIFO (First In First Out) structure
5. **Trees**: Hierarchical structures with parent-child relationships
6. **Graphs**: Networks of nodes and edges

Would you like me to dive deeper into any specific data structure?`,

    default: `Thank you for your question about "${message}" in the context of ${topic}!

This is a great topic to explore. Here's what you should know:

• **Key Concept**: ${topic} involves understanding the core principles and their practical applications.
• **Why It Matters**: This knowledge is essential for solving real-world problems effectively.
• **How to Master It**: Practice regularly, work through examples, and apply the concepts to projects.

I recommend watching the YouTube videos I've recommended and trying out some practice problems. Feel free to ask follow-up questions!`
  };

  // Simple keyword matching for mock responses
  const topicLower = topic.toLowerCase();
  return responses[topicLower] || responses.default;
}

/**
 * Get YouTube video recommendations
 * TODO: Replace with actual YouTube Data API integration
 */
async function getYouTubeRecommendations(topic, query = '') {
  // Mock recommendations
  // In production, integrate with YouTube Data API v3

  const searchQuery = query || topic;

  return [
    {
      type: 'video',
      title: `${topic} - Complete Tutorial`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery)}`,
      description: `Comprehensive tutorial covering ${topic}`,
      thumbnail: 'https://via.placeholder.com/320x180?text=Video+1',
      duration: '15:30',
      source: 'YouTube'
    },
    {
      type: 'video',
      title: `${topic} Explained Simply`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + ' explained')}`,
      description: `Simple explanation of ${topic} for beginners`,
      thumbnail: 'https://via.placeholder.com/320x180?text=Video+2',
      duration: '10:45',
      source: 'YouTube'
    },
    {
      type: 'video',
      title: `${topic} - Practice Problems`,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(searchQuery + ' practice')}`,
      description: `Practice problems and solutions for ${topic}`,
      thumbnail: 'https://via.placeholder.com/320x180?text=Video+3',
      duration: '20:15',
      source: 'YouTube'
    }
  ];
}

/**
 * Generate practice problems based on topic
 */
function generatePracticeProblems(topic) {
  return [
    {
      type: 'practice',
      title: `${topic} - Beginner Level`,
      description: 'Solve basic problems to understand the fundamentals',
      url: `https://leetcode.com/problemset/?search=${encodeURIComponent(topic)}`,
      source: 'LeetCode'
    },
    {
      type: 'practice',
      title: `${topic} - Intermediate Level`,
      description: 'Challenge yourself with medium difficulty problems',
      url: `https://www.hackerrank.com/domains/tutorials/10-days-of-${topic.toLowerCase().replace(/\s+/g, '-')}`,
      source: 'HackerRank'
    }
  ];
}

export default {
  createStudyChat,
  getRecommendations,
  getStudyChats,
  getStudyChatById,
  addMessageToChat
};
