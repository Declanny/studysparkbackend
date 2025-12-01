# StudySpark Implementation Plan - Leaderboard & Pagination Features

## Project Understanding

### Current System Architecture
**StudySpark** is an AI-powered educational platform with:
- **User System**: Email/password auth with JWT tokens, refresh tokens
- **Quiz System**: Personal quizzes (AI-generated) and Live quizzes (real-time)
- **Analytics**: Performance tracking, AI-powered feedback, topic analysis
- **Study Assistant**: RAG-based AI chat for learning

### Current User Model (`src/models/User.js`)
```javascript
{
  email: String,
  password: String (hashed),
  name: String,
  school: String,           // Optional
  course: String,           // Required (e.g., "Computer Science")
  level: String,            // Required (e.g., "200", "300")
  role: String              // 'student' or 'admin'
}
```

### Current Leaderboard (Live Quiz Only)
- Exists in `src/controllers/live.quizController.js`
- **Limitation**: Only works for active live quiz sessions
- **Scope**: Per-quiz, not global or filtered by demographics
- **Data**: Real-time scores during quiz broadcast via Ably

---

## Issues Identified

### 1. Terminology Problem
❌ Current: `course` field = "Computer Science" (This is a **DEPARTMENT**)
❌ Current: `level` field = "200" (This is a **YEAR/LEVEL**)

**The naming is confusing!** In most university contexts:
- **Department** = Computer Science, Engineering, Medicine, etc.
- **Year/Level** = 100, 200, 300, 400 (or 1st year, 2nd year, etc.)
- **Course** = Individual classes like "Data Structures", "Algorithms", etc.

### 2. Missing Pagination
- `getQuizAttempts()` hardcoded to `.limit(20)` in `src/controllers/quizController.js:592`
- No way to load more than 20 attempts
- No total count returned

### 3. No Global Leaderboard
- Only live quiz has leaderboard (temporary, per-quiz)
- No way to rank students by department and year across all quizzes

---

## Proposed Solution

### PHASE 1: Database Schema Updates (Most Professional Approach)

#### Option A: Update User Model (Recommended)
Rename fields to match educational terminology properly:

```javascript
// src/models/User.js - UPDATED
{
  email: String,
  password: String,
  name: String,
  school: String,
  department: String,      // RENAMED from 'course' - e.g., "Computer Science"
  year: String,            // RENAMED from 'level' - e.g., "200", "300"
  role: String
}
```

**Migration Strategy:**
1. Add new fields (`department`, `year`)
2. Copy data from old fields (`course` → `department`, `level` → `year`)
3. Keep old fields for backwards compatibility initially
4. Deprecate old fields after frontend migration

#### Option B: Keep Current Naming (Less Professional)
Work with existing `course` and `level` fields but document them properly.

---

### PHASE 2: Add Pagination to Quiz Attempts

**Update:** `src/controllers/quizController.js` - `getQuizAttempts()`

**Current Implementation:**
```javascript
const attempts = await QuizAttempt.find({
  user: req.user.userId,
  status: 'completed'
})
  .populate('quiz', 'title topic type difficulty')
  .sort({ createdAt: -1 })
  .limit(20);  // ❌ Hardcoded
```

**New Implementation:**
```javascript
export const getQuizAttempts = async (req, res) => {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Validate limits (prevent abuse)
    const maxLimit = 100;
    const safeLimit = Math.min(limit, maxLimit);

    // Get total count for pagination metadata
    const totalAttempts = await QuizAttempt.countDocuments({
      user: req.user.userId,
      status: 'completed'
    });

    // Get paginated attempts
    const attempts = await QuizAttempt.find({
      user: req.user.userId,
      status: 'completed'
    })
      .populate('quiz', 'title topic type difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalAttempts / safeLimit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      pagination: {
        currentPage: page,
        totalPages,
        totalAttempts,
        attemptsPerPage: safeLimit,
        hasNextPage,
        hasPrevPage
      },
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
```

**API Usage:**
```bash
GET /api/v1/quiz/attempts?page=1&limit=20
GET /api/v1/quiz/attempts?page=2&limit=10
```

**Response Format:**
```json
{
  "success": true,
  "pagination": {
    "currentPage": 1,
    "totalPages": 8,
    "totalAttempts": 156,
    "attemptsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "attempts": [...]
}
```

---

### PHASE 3: Global Leaderboard System

#### 3.1 Create Leaderboard Controller

**New File:** `src/controllers/leaderboardController.js`

```javascript
import QuizAttempt from '../models/QuizAttempt.js';
import User from '../models/User.js';

/**
 * @desc    Get global leaderboard filtered by department and year
 * @route   GET /api/v1/leaderboard
 * @access  Public (or Private - your choice)
 * @query   ?department=Computer Science&year=200&page=1&limit=50
 */
export const getGlobalLeaderboard = async (req, res) => {
  try {
    const { department, year, page = 1, limit = 50, timeframe = 'all' } = req.query;

    // Build user filter
    const userFilter = {};
    if (department) userFilter.department = department;
    if (year) userFilter.year = year;

    // Get users matching criteria
    const users = await User.find(userFilter).select('_id');
    const userIds = users.map(u => u._id);

    if (userIds.length === 0) {
      return res.json({
        success: true,
        message: 'No users found matching criteria',
        leaderboard: [],
        pagination: { currentPage: 1, totalPages: 0, totalUsers: 0 }
      });
    }

    // Build time filter for attempts
    const attemptFilter = {
      user: { $in: userIds },
      status: 'completed'
    };

    // Add timeframe filter
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;

      if (timeframe === 'week') {
        startDate = new Date(now.setDate(now.getDate() - 7));
      } else if (timeframe === 'month') {
        startDate = new Date(now.setMonth(now.getMonth() - 1));
      } else if (timeframe === 'semester') {
        startDate = new Date(now.setMonth(now.getMonth() - 6));
      }

      if (startDate) {
        attemptFilter.createdAt = { $gte: startDate };
      }
    }

    // Aggregate leaderboard statistics
    const leaderboardData = await QuizAttempt.aggregate([
      { $match: attemptFilter },
      {
        $group: {
          _id: '$user',
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          totalScore: { $sum: '$percentage' },
          totalCorrectAnswers: { $sum: '$correctAnswers' },
          totalQuestions: { $sum: '$totalQuestions' },
          bestScore: { $max: '$percentage' },
          recentActivity: { $max: '$createdAt' }
        }
      },
      { $sort: { averageScore: -1, totalQuizzes: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);

    // Populate user details
    const leaderboard = await Promise.all(
      leaderboardData.map(async (entry, index) => {
        const user = await User.findById(entry._id).select('name school department year');
        return {
          rank: (page - 1) * limit + index + 1,
          user: {
            id: user._id,
            name: user.name,
            school: user.school,
            department: user.department,
            year: user.year
          },
          stats: {
            totalQuizzes: entry.totalQuizzes,
            averageScore: Math.round(entry.averageScore * 100) / 100,
            bestScore: Math.round(entry.bestScore * 100) / 100,
            accuracyRate: Math.round((entry.totalCorrectAnswers / entry.totalQuestions) * 100 * 100) / 100,
            recentActivity: entry.recentActivity
          }
        };
      })
    );

    // Get total count for pagination
    const totalCountResult = await QuizAttempt.aggregate([
      { $match: attemptFilter },
      { $group: { _id: '$user' } },
      { $count: 'total' }
    ]);

    const totalUsers = totalCountResult.length > 0 ? totalCountResult[0].total : 0;
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      success: true,
      filters: {
        department: department || 'All',
        year: year || 'All',
        timeframe: timeframe || 'all'
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        usersPerPage: parseInt(limit),
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      leaderboard
    });

  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
};

/**
 * @desc    Get user's rank in leaderboard
 * @route   GET /api/v1/leaderboard/my-rank
 * @access  Private
 */
export const getMyRank = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { timeframe = 'all' } = req.query;

    // Get current user to know their department and year
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Find users in same department and year
    const sameGroup = await User.find({
      department: currentUser.department,
      year: currentUser.year
    }).select('_id');

    const userIds = sameGroup.map(u => u._id);

    // Build attempt filter
    const attemptFilter = {
      user: { $in: userIds },
      status: 'completed'
    };

    if (timeframe !== 'all') {
      const now = new Date();
      let startDate;
      if (timeframe === 'week') startDate = new Date(now.setDate(now.getDate() - 7));
      else if (timeframe === 'month') startDate = new Date(now.setMonth(now.getMonth() - 1));
      else if (timeframe === 'semester') startDate = new Date(now.setMonth(now.getMonth() - 6));

      if (startDate) attemptFilter.createdAt = { $gte: startDate };
    }

    // Calculate all rankings
    const rankings = await QuizAttempt.aggregate([
      { $match: attemptFilter },
      {
        $group: {
          _id: '$user',
          totalQuizzes: { $sum: 1 },
          averageScore: { $avg: '$percentage' }
        }
      },
      { $sort: { averageScore: -1, totalQuizzes: -1 } }
    ]);

    // Find user's rank
    const userRankIndex = rankings.findIndex(r => r._id.toString() === userId.toString());
    const userRank = userRankIndex + 1;

    const userStats = rankings[userRankIndex];

    res.json({
      success: true,
      myRank: {
        rank: userRank,
        totalUsers: rankings.length,
        percentile: Math.round(((rankings.length - userRank + 1) / rankings.length) * 100),
        stats: {
          totalQuizzes: userStats?.totalQuizzes || 0,
          averageScore: Math.round((userStats?.averageScore || 0) * 100) / 100
        },
        group: {
          department: currentUser.department,
          year: currentUser.year
        }
      }
    });

  } catch (error) {
    console.error('Get my rank error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch rank'
    });
  }
};

export default {
  getGlobalLeaderboard,
  getMyRank
};
```

#### 3.2 Create Leaderboard Routes

**New File:** `src/routes/leaderboard.js`

```javascript
import express from 'express';
import { getGlobalLeaderboard, getMyRank } from '../controllers/leaderboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /leaderboard:
 *   get:
 *     summary: Get global leaderboard filtered by department and year
 *     tags: [Leaderboard]
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department (e.g., Computer Science)
 *       - in: query
 *         name: year
 *         schema:
 *           type: string
 *         description: Filter by year (e.g., 200, 300)
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [all, week, month, semester]
 *         description: Time period for rankings
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Results per page (max 100)
 *     responses:
 *       200:
 *         description: Leaderboard data
 */
router.get('/', getGlobalLeaderboard);

/**
 * @swagger
 * /leaderboard/my-rank:
 *   get:
 *     summary: Get current user's rank in their department/year
 *     tags: [Leaderboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [all, week, month, semester]
 *     responses:
 *       200:
 *         description: User's rank information
 */
router.get('/my-rank', protect, getMyRank);

export default router;
```

#### 3.3 Update Server to Include Routes

**Update:** `src/server.js`

```javascript
// Add import
import leaderboardRoutes from './routes/leaderboard.js';

// Add route (around line 139)
app.use('/api/v1/leaderboard', leaderboardRoutes);
```

#### 3.4 Update User Registration/Settings

**Option 1: Update During Registration**

`src/controllers/authController.js` - Already collects `course` (department) and `level` (year) during registration at line 36.

**Option 2: Add Settings Update Endpoint**

```javascript
// src/controllers/authController.js - ADD THIS

/**
 * @desc    Update user profile
 * @route   PATCH /api/v1/auth/profile
 * @access  Private
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, school, department, year } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Update allowed fields
    if (name) user.name = name;
    if (school) user.school = school;
    if (department) user.department = department; // or course
    if (year) user.year = year; // or level

    await user.save();

    res.json({
      success: true,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};
```

---

## API Endpoints Summary

### New Endpoints:
```bash
GET  /api/v1/leaderboard?department=Computer Science&year=200&page=1&limit=50
GET  /api/v1/leaderboard/my-rank?timeframe=month
```

### Updated Endpoints:
```bash
GET  /api/v1/quiz/attempts?page=1&limit=20  # with pagination
```

### Optional Endpoint:
```bash
PATCH /api/v1/auth/profile  # update department/year in settings
```

---

## Implementation Approach Recommendations

### For Professional Standards:

#### 1. Field Naming - Choose one:
- ✅ **Recommended**: Rename `course` → `department`, `level` → `year` (clearer, professional)
- ⚠️ **Alternative**: Keep current naming but add clear documentation

#### 2. Leaderboard Privacy:
- **Option A**: Public leaderboard (anyone can view - good for competition)
- **Option B**: Protected leaderboard (must be logged in)
- **Recommended**: Public for viewing, show full names only to logged-in users

#### 3. Ranking Fairness:
- Filter by **both** department AND year (prevents comparing 1st years to final years)
- Allow filtering by timeframe (weekly, monthly, all-time)
- Use average score as primary metric (fairer than total score)

#### 4. Performance Optimization:
- Add database indexes on `User.department` and `User.year`
- Cache leaderboard results for 5-15 minutes
- Limit pagination to max 100 results per page

#### 5. Future Enhancements:
- Add badges/achievements for top performers
- Weekly/monthly leaderboard resets
- Department vs department competitions
- Notifications when users move up in rank

---

## Questions for Review

Before proceeding with implementation:

1. **User Model Fields**: Should I rename `course` → `department` and `level` → `year`? Or keep current naming?

2. **Leaderboard Access**: Should leaderboard be public or require login?

3. **Default Filters**: Should leaderboard show "all departments, all years" by default, or require users to select their filters?

4. **Ranking Metric**: Should we rank by:
   - Average score (fairness - recommended)
   - Total score (rewards quantity)
   - Weighted score (both factors)

5. **Settings Page**: Do you want a new endpoint for users to update their department/year later, or is registration-time collection sufficient?

---

## Database Indexes Recommendation

Add these indexes for performance:

```javascript
// src/models/User.js
userSchema.index({ department: 1, year: 1 });
userSchema.index({ department: 1 });
userSchema.index({ year: 1 });
```

---

## Testing Checklist

- [ ] Pagination works correctly for quiz attempts
- [ ] Leaderboard filters by department only
- [ ] Leaderboard filters by year only
- [ ] Leaderboard filters by both department and year
- [ ] Leaderboard timeframe filters work (week, month, semester, all)
- [ ] My-rank endpoint returns correct position
- [ ] Edge cases: no attempts, single user, tied scores
- [ ] Pagination limits enforced (max 100 per page)
- [ ] Performance tested with 1000+ users

---

**This plan provides a professional, scalable leaderboard system that groups students by department and year, with proper pagination and filtering. Review and provide feedback on the questions above before implementation begins.**
