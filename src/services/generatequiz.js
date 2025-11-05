
import Groq from "groq-sdk";

// Note: Environment variables are loaded in server.js via dotenv
// Initialize Groq client lazily to ensure env vars are loaded
let groq = null;

function getGroqClient() {
    if (!groq) {
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groq;
}

async function generateQuiz(topic, numQuestions, difficulty) {
    const prompt = `
    Generate a ${numQuestions}-question multiple choice quiz about "${topic}" with ${difficulty} difficulty level.
    
    Format your response strictly as a JSON object with the following structure:
    {
        "title": "Quiz about ${topic}",
        "description": "A ${difficulty} level quiz on ${topic}",
        "topic": "${topic}",
        "difficulty": "${difficulty}",
        "questionCount": ${numQuestions},
        "questions": [
            {
                "questionText": "Clear and concise question text",
                "options": [
                    {"text": "Option 1 text", "isCorrect": true},
                    {"text": "Option 2 text", "isCorrect": false},
                    {"text": "Option 3 text", "isCorrect": false},
                    {"text": "Option 4 text", "isCorrect": false}
                ],
                "correctAnswer": "Exact text of the correct option",
                "explanation": "Brief explanation of why the correct answer is right",
                "difficulty": "${difficulty}",
                "points": 1
            }
        ]
    }

    IMPORTANT FORMATTING RULES:
    1. For each question, exactly ONE option must have "isCorrect": true
    2. The "correctAnswer" field must contain the EXACT text of the correct option (matching one of the option texts)
    3. Use 4 options for each question
    4. Make questions appropriate for ${difficulty} difficulty level
    5. Points should be 1 for all questions
    6. Ensure explanations are clear and educational
    7. Option texts should be distinct and plausible
    8. The correct answer should not always be the first option

    Generate ${numQuestions} questions following these rules.`;

    try {
        const groqClient = getGroqClient();
        const completion = await groqClient.chat.completions.create({
            messages: [{
                role: "user",
                content: prompt
            }],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
            max_tokens: 4096,
            response_format: { type: "json_object" }
        });

        const quizData = JSON.parse(completion.choices[0].message.content);
        
        // Add additional fields required by your schema
        // return {
        //     ...quizData
        // };
        return quizData;

    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error(`Failed to generate quiz: ${error.message}`);
    }
}

// Helper function to validate the generated quiz matches your schema
function validateQuizSchema(quizData) {
    const requiredFields = ['title', 'topic', 'questions'];
    const missingFields = requiredFields.filter(field => !quizData[field]);
    
    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate each question
    quizData.questions.forEach((question, index) => {
        if (!question.questionText) {
            throw new Error(`Question ${index + 1} missing questionText`);
        }
        
        if (!Array.isArray(question.options) || question.options.length !== 4) {
            throw new Error(`Question ${index + 1} must have exactly 4 options`);
        }

        const correctOptions = question.options.filter(opt => opt.isCorrect);
        if (correctOptions.length !== 1) {
            throw new Error(`Question ${index + 1} must have exactly one correct option`);
        }

        if (!question.correctAnswer || typeof question.correctAnswer !== 'string') {
            throw new Error(`Question ${index + 1} must have a string correctAnswer`);
        }

        // Verify correctAnswer matches one of the option texts
        const optionTexts = question.options.map(opt => opt.text);
        if (!optionTexts.includes(question.correctAnswer)) {
            throw new Error(`Question ${index + 1} correctAnswer must match one of the option texts`);
        }
    });

    return true;
}

// Enhanced version with validation
async function generateValidatedQuiz(topic, numQuestions, difficulty) {
    const quizData = await generateQuiz(topic, numQuestions, difficulty);
    console.log("this generated quiz data", quizData);
    
    validateQuizSchema(quizData);
    return quizData;
}

// Usage example
async function main() {
    try {
        const quiz = await generateValidatedQuiz(
            "JavaScript Programming",
            3,
            "medium"
        );
        
        console.log("Generated Quiz:");
        console.log(JSON.stringify(quiz, null, 2));
        
        // Example of how you might use this with your Mongoose model
        // const newQuiz = new Quiz(quiz);
        // newQuiz.createdBy = userId; // Set from your auth context
        // if (type === 'live') {
        //     newQuiz.code = newQuiz.generateCode();
        //     newQuiz.isLive = true;
        // }
        // await newQuiz.save();
        
        return quiz;
    } catch (error) {
        console.error("Failed to generate quiz:", error);
    }
}

// Export functions
export { generateQuiz, generateValidatedQuiz, validateQuizSchema };
