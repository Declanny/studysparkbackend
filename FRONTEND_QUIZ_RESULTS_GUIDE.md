# Quiz Results Frontend Integration Guide

## Overview
This document provides comprehensive guidance for implementing the quiz submission and results display feature on the frontend. The backend now returns enhanced data to support a rich, educational results experience.

---

## API Endpoint

### Submit Quiz
**Endpoint**: `POST /api/v1/quiz/{quizId}/submit`

**Headers**:
```json
{
  "Authorization": "Bearer {token}",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439011",
      "selectedAnswer": "O(log n)",
      "timeSpent": 45
    }
  ],
  "timeSpent": 1200
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Quiz submitted successfully",
  "results": {
    "score": 8,
    "correctAnswers": 8,
    "incorrectAnswers": 2,
    "skippedQuestions": 0,
    "percentage": "80.00"
  },
  "attemptId": "507f1f77bcf86cd799439011",
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439011",
      "questionText": "What is the time complexity of binary search?",
      "selectedAnswer": "O(log n)",
      "correctAnswer": "O(log n)",
      "isCorrect": true,
      "explanation": "Binary search divides the search space in half with each iteration, resulting in logarithmic time complexity.",
      "options": [
        { "text": "O(n)", "isCorrect": false },
        { "text": "O(log n)", "isCorrect": true },
        { "text": "O(n²)", "isCorrect": false },
        { "text": "O(1)", "isCorrect": false }
      ]
    }
  ]
}
```

---

## Frontend Implementation Requirements

### 1. Results Summary Section

Display the overall performance metrics prominently at the top:

#### Required Elements:
- **Score Display**: Large, prominent number showing points earned
- **Percentage**: Visual percentage indicator (use circular progress or gauge)
- **Correct/Incorrect Breakdown**: Visual breakdown with icons
- **Time Spent**: Total time taken to complete the quiz
- **Completion Date**: Timestamp of submission

#### Design Recommendations:
```jsx
// Pseudo-code structure
<ResultsSummary>
  <ScoreCard>
    <CircularProgress value={percentage} />
    <ScoreText>{correctAnswers}/{totalQuestions}</ScoreText>
    <PercentageText>{percentage}%</PercentageText>
  </ScoreCard>

  <StatsGrid>
    <Stat icon="✓" label="Correct" value={correctAnswers} color="green" />
    <Stat icon="✗" label="Incorrect" value={incorrectAnswers} color="red" />
    <Stat icon="⏱" label="Time" value={formatTime(timeSpent)} />
  </StatsGrid>

  <PerformanceMessage>
    {getPerformanceMessage(percentage)}
  </PerformanceMessage>
</ResultsSummary>
```

#### Performance Messages (suggestions):
- 90-100%: "🎉 Outstanding! You've mastered this topic!"
- 75-89%: "🌟 Great job! You have a strong understanding."
- 60-74%: "👍 Good work! Review the explanations to improve."
- 40-59%: "📚 Keep studying! Focus on the areas you missed."
- 0-39%: "💪 Don't give up! Review the material and try again."

---

### 2. Question-by-Question Review

Display each question with the user's answer, correct answer, and explanation.

#### Required Elements for Each Question:

**Question Card Structure**:
```jsx
<QuestionReviewCard isCorrect={answer.isCorrect}>
  <QuestionHeader>
    <QuestionNumber>Question {index + 1}</QuestionNumber>
    <StatusBadge isCorrect={answer.isCorrect}>
      {answer.isCorrect ? "✓ Correct" : "✗ Incorrect"}
    </StatusBadge>
  </QuestionHeader>

  <QuestionText>{answer.questionText}</QuestionText>

  <OptionsContainer>
    {answer.options.map(option => (
      <OptionItem
        key={option.text}
        isSelected={option.text === answer.selectedAnswer}
        isCorrect={option.text === answer.correctAnswer}
        showCorrectness={true}
      >
        <OptionIcon>
          {getOptionIcon(option, answer)}
        </OptionIcon>
        <OptionText>{option.text}</OptionText>
      </OptionItem>
    ))}
  </OptionsContainer>

  {!answer.isCorrect && (
    <CorrectAnswerCallout>
      <strong>Correct Answer:</strong> {answer.correctAnswer}
    </CorrectAnswerCallout>
  )}

  <ExplanationBox>
    <ExplanationHeader>💡 Explanation</ExplanationHeader>
    <ExplanationText>{answer.explanation}</ExplanationText>
  </ExplanationBox>
</QuestionReviewCard>
```

#### Visual Indicators:

**Option States**:
1. **Correct Answer** (when user selected it):
   - Background: Light green (#E8F5E9)
   - Border: Green (#4CAF50)
   - Icon: ✓ Green checkmark

2. **Correct Answer** (when user didn't select it):
   - Background: Light green (#E8F5E9)
   - Border: Green (#4CAF50)
   - Icon: ✓ Green checkmark
   - Label: "Correct Answer"

3. **User's Wrong Answer**:
   - Background: Light red (#FFEBEE)
   - Border: Red (#F44336)
   - Icon: ✗ Red X
   - Label: "Your Answer"

4. **Other Options**:
   - Background: Light gray (#F5F5F5)
   - Border: Gray (#E0E0E0)
   - Icon: None

---

### 3. Color Coding System

Use consistent colors throughout:

```css
/* Color Variables */
--color-correct: #4CAF50;
--color-correct-bg: #E8F5E9;
--color-incorrect: #F44336;
--color-incorrect-bg: #FFEBEE;
--color-neutral: #9E9E9E;
--color-neutral-bg: #F5F5F5;
--color-info: #2196F3;
--color-info-bg: #E3F2FD;
```

**Usage**:
- **Green**: Correct answers, success states, positive feedback
- **Red**: Incorrect answers, error states
- **Blue**: Explanations, informational content
- **Gray**: Neutral/unselected options

---

### 4. Interactive Features

#### Filtering Options:
```jsx
<FilterButtons>
  <FilterButton
    active={filter === 'all'}
    onClick={() => setFilter('all')}
  >
    All Questions ({answers.length})
  </FilterButton>

  <FilterButton
    active={filter === 'correct'}
    onClick={() => setFilter('correct')}
  >
    Correct ({correctAnswers})
  </FilterButton>

  <FilterButton
    active={filter === 'incorrect'}
    onClick={() => setFilter('incorrect')}
  >
    Incorrect ({incorrectAnswers})
  </FilterButton>
</FilterButtons>
```

#### Navigation:
- **Quick Jump**: Add navigation to specific questions
- **Previous/Next**: Buttons to move between questions
- **Back to Top**: Floating button when scrolling

---

### 5. Responsive Design Guidelines

**Mobile (<768px)**:
- Stack all elements vertically
- Full-width question cards
- Larger touch targets (min 44px)
- Collapsible explanations (tap to expand)

**Tablet (768px-1024px)**:
- Two-column layout for stats
- Full-width question cards
- Side-by-side summary cards

**Desktop (>1024px)**:
- Sticky summary sidebar
- Main content area for questions
- Hover effects on options
- Larger typography

---

### 6. Accessibility (A11Y) Requirements

#### ARIA Labels:
```jsx
<QuestionCard
  role="article"
  aria-labelledby={`question-${index}`}
  aria-describedby={`explanation-${index}`}
>
  <h3 id={`question-${index}`}>{questionText}</h3>

  <OptionsList role="radiogroup" aria-label="Answer options">
    <Option
      role="radio"
      aria-checked={isSelected}
      aria-label={`${option.text}${isCorrect ? ' - Correct answer' : ''}`}
    />
  </OptionsList>

  <Explanation id={`explanation-${index}`}>
    {explanation}
  </Explanation>
</QuestionCard>
```

#### Keyboard Navigation:
- Tab through questions
- Arrow keys to navigate options
- Enter/Space to expand/collapse explanations
- Escape to close modals

#### Screen Reader Support:
- Announce quiz completion: "Quiz submitted successfully. You scored 8 out of 10."
- Announce each question status: "Question 1, Incorrect"
- Read explanations clearly

---

### 7. User Actions

#### Primary Actions:
```jsx
<ActionButtons>
  <PrimaryButton onClick={viewDetailedReport}>
    📊 View Detailed Report
  </PrimaryButton>

  <SecondaryButton onClick={retakeQuiz}>
    🔄 Retake Quiz
  </SecondaryButton>

  <SecondaryButton onClick={goToDashboard}>
    🏠 Back to Dashboard
  </SecondaryButton>

  <SecondaryButton onClick={shareResults}>
    📤 Share Results
  </SecondaryButton>
</ActionButtons>
```

#### Additional Features:
- **Download PDF**: Export results as PDF
- **Print**: Print-friendly version
- **Save for Later**: Bookmark to review history
- **Study Mode**: Generate flashcards from missed questions

---

### 8. Data Processing Example

```javascript
// Process quiz results
const processQuizResults = (response) => {
  const { results, answers, attemptId } = response;

  return {
    // Summary metrics
    summary: {
      score: results.score,
      percentage: parseFloat(results.percentage),
      correctCount: results.correctAnswers,
      incorrectCount: results.incorrectAnswers,
      totalQuestions: results.correctAnswers + results.incorrectAnswers,
      attemptId: attemptId
    },

    // Categorized questions
    questions: {
      all: answers,
      correct: answers.filter(a => a.isCorrect),
      incorrect: answers.filter(a => !a.isCorrect)
    },

    // Performance level
    performance: getPerformanceLevel(parseFloat(results.percentage))
  };
};

const getPerformanceLevel = (percentage) => {
  if (percentage >= 90) return { level: 'excellent', color: 'green', message: 'Outstanding!' };
  if (percentage >= 75) return { level: 'good', color: 'blue', message: 'Great job!' };
  if (percentage >= 60) return { level: 'fair', color: 'orange', message: 'Good work!' };
  if (percentage >= 40) return { level: 'needs-improvement', color: 'yellow', message: 'Keep studying!' };
  return { level: 'poor', color: 'red', message: 'Review and retry!' };
};

const getOptionIcon = (option, answer) => {
  const isSelected = option.text === answer.selectedAnswer;
  const isCorrect = option.text === answer.correctAnswer;

  if (isCorrect && isSelected) return '✓'; // Correct choice
  if (isCorrect && !isSelected) return '✓'; // Missed correct answer
  if (!isCorrect && isSelected) return '✗'; // Wrong choice
  return null; // Unselected incorrect option
};
```

---

### 9. Animation Recommendations

**Page Load**:
- Fade in summary with celebration animation (confetti for high scores)
- Stagger question cards appearing (50ms delay between each)

**Interactions**:
- Smooth scroll to question on filter change
- Pulse animation on correct answers
- Shake animation on incorrect answers (subtle)

**Transitions**:
```css
.question-card {
  transition: all 0.3s ease-in-out;
}

.option-item {
  transition: background-color 0.2s, border-color 0.2s, transform 0.1s;
}

.option-item:hover {
  transform: translateX(4px);
}
```

---

### 10. Error Handling

```javascript
const submitQuiz = async (quizId, answers) => {
  try {
    setLoading(true);
    setError(null);

    const response = await fetch(`/api/v1/quiz/${quizId}/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ answers, timeSpent })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to submit quiz');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Quiz submission error:', error);
    setError(error.message);

    // Show user-friendly error message
    showToast({
      type: 'error',
      message: 'Failed to submit quiz. Please try again.',
      duration: 5000
    });

    return null;
  } finally {
    setLoading(false);
  }
};
```

**Error States to Handle**:
- Network errors
- Quiz not found (404)
- Unauthorized access (401, 403)
- Server errors (500)
- Timeout errors

---

### 11. Loading States

```jsx
<ResultsContainer>
  {loading && (
    <LoadingState>
      <Spinner />
      <LoadingText>Grading your quiz...</LoadingText>
      <ProgressBar value={gradingProgress} />
    </LoadingState>
  )}

  {error && (
    <ErrorState>
      <ErrorIcon>⚠️</ErrorIcon>
      <ErrorMessage>{error}</ErrorMessage>
      <RetryButton onClick={handleRetry}>Try Again</RetryButton>
    </ErrorState>
  )}

  {data && <ResultsDisplay data={data} />}
</ResultsContainer>
```

---

### 12. Performance Optimization

**Best Practices**:
1. **Virtualization**: Use react-window or react-virtualized for long quiz lists
2. **Lazy Loading**: Load explanations on demand (expand to view)
3. **Memoization**: Memoize question cards to prevent re-renders
4. **Image Optimization**: Compress and lazy-load any images in questions
5. **Code Splitting**: Load results page separately

```javascript
// Memoization example
const QuestionCard = React.memo(({ answer, index }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  return prevProps.answer.questionId === nextProps.answer.questionId;
});

// Lazy loading
const [expandedQuestions, setExpandedQuestions] = useState(new Set());

const toggleExplanation = (questionId) => {
  setExpandedQuestions(prev => {
    const newSet = new Set(prev);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    return newSet;
  });
};
```

---

### 13. Testing Checklist

- [ ] Quiz submits successfully with valid data
- [ ] Correct/incorrect answers display with proper colors
- [ ] Explanations are visible and readable
- [ ] All options show with correct indicators
- [ ] Percentage calculation is accurate
- [ ] Filter buttons work correctly
- [ ] Responsive design works on all screen sizes
- [ ] Keyboard navigation works
- [ ] Screen readers can access all content
- [ ] Loading states display properly
- [ ] Error states are handled gracefully
- [ ] Performance is smooth with 50+ questions
- [ ] Animations are smooth and not jarring
- [ ] Print/PDF export works
- [ ] Share functionality works

---

### 14. Sample React Component

```jsx
import React, { useState, useEffect } from 'react';
import './QuizResults.css';

const QuizResults = ({ quizId, submittedAnswers, timeSpent }) => {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    submitQuiz();
  }, []);

  const submitQuiz = async () => {
    try {
      const response = await fetch(`/api/v1/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: submittedAnswers,
          timeSpent: timeSpent
        })
      });

      if (!response.ok) throw new Error('Submission failed');

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!results) return null;

  const filteredAnswers =
    filter === 'all' ? results.answers :
    filter === 'correct' ? results.answers.filter(a => a.isCorrect) :
    results.answers.filter(a => !a.isCorrect);

  return (
    <div className="quiz-results">
      {/* Summary Section */}
      <div className="results-summary">
        <div className="score-card">
          <div className="circular-progress"
               data-percentage={results.results.percentage}>
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" />
              <circle
                cx="50"
                cy="50"
                r="45"
                strokeDasharray={`${results.results.percentage * 2.83} 283`}
              />
            </svg>
            <div className="score-text">
              {results.results.percentage}%
            </div>
          </div>
          <h2>Quiz Complete!</h2>
        </div>

        <div className="stats-grid">
          <div className="stat correct">
            <span className="icon">✓</span>
            <span className="value">{results.results.correctAnswers}</span>
            <span className="label">Correct</span>
          </div>
          <div className="stat incorrect">
            <span className="icon">✗</span>
            <span className="value">{results.results.incorrectAnswers}</span>
            <span className="label">Incorrect</span>
          </div>
          <div className="stat time">
            <span className="icon">⏱</span>
            <span className="value">{Math.floor(timeSpent / 60)}m</span>
            <span className="label">Time Spent</span>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Questions ({results.answers.length})
        </button>
        <button
          className={filter === 'correct' ? 'active' : ''}
          onClick={() => setFilter('correct')}
        >
          Correct ({results.results.correctAnswers})
        </button>
        <button
          className={filter === 'incorrect' ? 'active' : ''}
          onClick={() => setFilter('incorrect')}
        >
          Incorrect ({results.results.incorrectAnswers})
        </button>
      </div>

      {/* Questions Review */}
      <div className="questions-review">
        {filteredAnswers.map((answer, index) => (
          <div
            key={answer.questionId}
            className={`question-card ${answer.isCorrect ? 'correct' : 'incorrect'}`}
          >
            <div className="question-header">
              <span className="question-number">Question {index + 1}</span>
              <span className={`status-badge ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
              </span>
            </div>

            <h3 className="question-text">{answer.questionText}</h3>

            <div className="options-container">
              {answer.options.map((option) => {
                const isSelected = option.text === answer.selectedAnswer;
                const isCorrect = option.text === answer.correctAnswer;

                let className = 'option-item';
                if (isCorrect) className += ' correct-answer';
                if (isSelected && !isCorrect) className += ' wrong-answer';
                if (isSelected) className += ' selected';

                return (
                  <div key={option.text} className={className}>
                    <span className="option-icon">
                      {isCorrect && '✓'}
                      {isSelected && !isCorrect && '✗'}
                    </span>
                    <span className="option-text">{option.text}</span>
                    {isCorrect && !isSelected && (
                      <span className="label">Correct Answer</span>
                    )}
                    {isSelected && !isCorrect && (
                      <span className="label">Your Answer</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="explanation-box">
              <div className="explanation-header">💡 Explanation</div>
              <p className="explanation-text">{answer.explanation}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button className="btn-primary" onClick={() => window.location.href = '/dashboard'}>
          Back to Dashboard
        </button>
        <button className="btn-secondary" onClick={() => window.location.reload()}>
          Retake Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizResults;
```

---

### 15. CSS Starter Template

```css
/* QuizResults.css */

.quiz-results {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Summary Section */
.results-summary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 3rem;
  color: white;
  margin-bottom: 2rem;
  text-align: center;
}

.score-card {
  margin-bottom: 2rem;
}

.circular-progress {
  width: 200px;
  height: 200px;
  margin: 0 auto 1rem;
  position: relative;
}

.circular-progress svg {
  transform: rotate(-90deg);
}

.circular-progress circle {
  fill: none;
  stroke-width: 8;
}

.circular-progress circle:first-child {
  stroke: rgba(255, 255, 255, 0.2);
}

.circular-progress circle:last-child {
  stroke: white;
  transition: stroke-dasharray 1s ease-in-out;
}

.score-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 3rem;
  font-weight: bold;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stat {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
}

.stat .icon {
  font-size: 2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.stat .value {
  font-size: 2rem;
  font-weight: bold;
  display: block;
}

.stat .label {
  opacity: 0.9;
  font-size: 0.9rem;
}

/* Filter Buttons */
.filter-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.filter-buttons button {
  padding: 0.75rem 1.5rem;
  border: 2px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.filter-buttons button.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.filter-buttons button:hover {
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

/* Question Cards */
.questions-review {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.question-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #e0e0e0;
  transition: transform 0.2s;
}

.question-card.correct {
  border-left-color: #4CAF50;
}

.question-card.incorrect {
  border-left-color: #F44336;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-number {
  font-weight: 600;
  color: #666;
}

.status-badge {
  padding: 0.25rem 1rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.correct {
  background: #E8F5E9;
  color: #4CAF50;
}

.status-badge.incorrect {
  background: #FFEBEE;
  color: #F44336;
}

.question-text {
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  color: #333;
  line-height: 1.6;
}

/* Options */
.options-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.option-item {
  padding: 1rem 1.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #f5f5f5;
  transition: all 0.2s;
}

.option-item.correct-answer {
  background: #E8F5E9;
  border-color: #4CAF50;
}

.option-item.wrong-answer {
  background: #FFEBEE;
  border-color: #F44336;
}

.option-icon {
  font-weight: bold;
  font-size: 1.25rem;
}

.option-item.correct-answer .option-icon {
  color: #4CAF50;
}

.option-item.wrong-answer .option-icon {
  color: #F44336;
}

.option-text {
  flex: 1;
}

.option-item .label {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.05);
  font-weight: 600;
}

/* Explanation */
.explanation-box {
  background: #E3F2FD;
  border-left: 4px solid #2196F3;
  border-radius: 8px;
  padding: 1.5rem;
}

.explanation-header {
  font-weight: 600;
  color: #1976D2;
  margin-bottom: 0.5rem;
}

.explanation-text {
  color: #333;
  line-height: 1.6;
  margin: 0;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 3rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
  padding: 1rem 2rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background: white;
  border: 2px solid #667eea;
  color: #667eea;
}

.btn-secondary:hover {
  background: #f5f7ff;
  transform: translateY(-2px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .quiz-results {
    padding: 1rem;
  }

  .results-summary {
    padding: 2rem 1rem;
  }

  .circular-progress {
    width: 150px;
    height: 150px;
  }

  .score-text {
    font-size: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .question-card {
    padding: 1.5rem;
  }

  .question-text {
    font-size: 1.1rem;
  }

  .filter-buttons {
    flex-direction: column;
  }

  .filter-buttons button {
    width: 100%;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
```

---

## Summary

This guide provides everything your frontend team needs to implement a professional, educational, and user-friendly quiz results experience. The key focus is on:

1. **Clear Visual Feedback**: Users immediately see what they got right/wrong
2. **Educational Value**: Explanations help users learn from mistakes
3. **Professional Design**: Modern, clean UI with smooth animations
4. **Accessibility**: WCAG compliant, keyboard navigable, screen reader friendly
5. **Responsive**: Works seamlessly across all devices
6. **Performance**: Optimized for quizzes of any size

For questions or clarifications, please refer to the API documentation or contact the backend team.

---

**Version**: 1.0
**Last Updated**: 2025
**Backend API Version**: v1
