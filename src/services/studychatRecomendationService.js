// studyChatService.js
import Groq from "groq-sdk";
import axios from 'axios';

import dotenv from 'dotenv';
import StudyChat from "../models/StudyChat.js";
// StudyChat
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class StudyChatService {
    constructor() {
        this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
        this.googleBooksApiKey = process.env.GOOGLE_BOOKS_API_KEY;
    }

    /**
     * Main service to handle study chat requests
     */
    async handleStudyChat(userId, topic, course, userMessage) {
        try {
            // Find or create study chat session
            let studyChat = await StudyChat.findOne({
                user: userId,
                topic: topic,
                subject: course,
                status: 'active'
            });

            if (!studyChat) {
                studyChat = new StudyChat({
                    user: userId,
                    topic: topic,
                    subject: course,
                    messages: []
                });
            }

            // Add user message to conversation
            studyChat.addMessage('user', userMessage);

            // Generate AI response
            const aiResponse = await this.generateAIResponse(topic, course, userMessage, studyChat.messages);
            studyChat.addMessage('assistant', aiResponse.content);

            // Generate recommendations based on the conversation
            const recommendations = await this.generateRecommendations(topic, course, userMessage);

            // Add recommendations to study chat
            recommendations.forEach(rec => studyChat.addRecommendation(rec));

            // Update last activity and save
            studyChat.lastActivity = new Date();
            await studyChat.save();

            return {
                studyChat,
                aiResponse: aiResponse.content,
                recommendations
            };

        } catch (error) {
            console.error('Error in handleStudyChat:', error);
            throw new Error(`Failed to process study chat: ${error.message}`);
        }
    }

    /**
     * Generate AI response using Groq
     */
    async generateAIResponse(topic, course, userMessage, conversationHistory) {
        const context = this.buildConversationContext(conversationHistory);

        const prompt = `
        You are an expert tutor in ${course}. The student is learning about ${topic}.
        
        Previous conversation context:
        ${context}
        
        Student's current message: "${userMessage}"
        
        Please provide a helpful, educational response that:
        1. Directly addresses the student's question/request
        2. Provides clear explanations and examples
        3. Suggests relevant learning resources when appropriate
        4. Encourages further learning
        
        Keep your response concise but comprehensive.
        `;

        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful, knowledgeable tutor who provides clear explanations and learning guidance."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
                max_tokens: 1024
            });
            const content = completion.choices[0].message.content;
            // console.log("content ai response", content);


            return {
                content,
                timestamp: new Date()
            };

        } catch (error) {
            console.error('Error generating AI response:', error);
            throw new Error(`Failed to generate AI response: ${error.message}`);
        }
    }

    /**
     * Generate learning recommendations
     */
    async generateRecommendations(topic, course, userMessage) {
        const recommendations = [];

        try {
            // Get YouTube video recommendations
            const youtubeVideos = await this.fetchYouTubeVideos(topic, course);
            recommendations.push(...youtubeVideos);

            // Get book recommendations
            const books = await this.fetchGoogleBooks(topic, course);
            recommendations.push(...books);

            // Add practice recommendations if appropriate
            if (this.shouldSuggestPractice(userMessage)) {
                recommendations.push({
                    type: 'practice',
                    title: `Practice Exercises for ${topic}`,
                    description: `Interactive exercises and problems to test your understanding of ${topic}`,
                    source: 'Study Platform'
                });
            }

            return recommendations;

        } catch (error) {
            console.error('Error generating recommendations:', error);
            // Return empty array if recommendations fail
            return [];
        }
    }

    /**
     * Fetch YouTube videos related to the topic
     */
    async fetchYouTubeVideos(topic, course) {
        if (!this.youtubeApiKey) {
            console.warn('YouTube API key not configured');
            return [];
        }

        try {
            const searchQuery = `${topic} ${course} tutorial education`;
            const response = await axios.get(
                `https://www.googleapis.com/youtube/v3/search`,
                {
                    params: {
                        part: 'snippet',
                        q: searchQuery,
                        type: 'video',
                        maxResults: 5,
                        key: this.youtubeApiKey,
                        relevanceLanguage: 'en',
                        videoDuration: 'medium',
                        videoEmbeddable: true
                    }
                }
            );
            const videoRecommendations = response.data.items.map(item => ({
                type: 'video',
                title: item.snippet.title,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.medium.url,
                duration: 'Medium', // YouTube search doesn't provide duration in initial response
                source: 'YouTube'
            }));
            // console.log("youtube video", videoRecommendations);

            return videoRecommendations

        } catch (error) {
            console.error('Error fetching YouTube videos:', error);
            return [];
        }
    }

    /**
     * Fetch Google Books related to the topic
     */
    async fetchGoogleBooks(topic, course) {
        if (!this.googleBooksApiKey) {
            console.warn('Google Books API key not configured');
            return [];
        }

        try {
            const searchQuery = `${topic} ${course}`;
            const response = await axios.get(
                `https://www.googleapis.com/books/v1/volumes`,
                {
                    params: {
                        q: searchQuery,
                        maxResults: 5,
                        key: this.googleBooksApiKey,
                        printType: 'books',
                        langRestrict: 'en'
                    }
                }
            );
            const bookRecommendations = response.data.items.map(item => {
                const volumeInfo = item.volumeInfo;
                return {
                    type: 'reading',
                    title: volumeInfo.title,
                    url: volumeInfo.previewLink || volumeInfo.infoLink,
                    description: volumeInfo.description ?
                        volumeInfo.description.substring(0, 200) + '...' :
                        `Book about ${topic} in ${course}`,
                    thumbnail: volumeInfo.imageLinks?.thumbnail || volumeInfo.imageLinks?.smallThumbnail,
                    source: 'Google Books',
                    authors: volumeInfo.authors || []
                };
            }).filter(book => book.thumbnail);
            // console.log("google books", bookRecommendations);
            return bookRecommendations// Only include books with thumbnails

        } catch (error) {
            console.error('Error fetching Google Books:', error);
            return [];
        }
    }

    /**
     * Build conversation context from message history
     */
    buildConversationContext(messages) {
        if (!messages || messages.length === 0) {
            return "No previous conversation.";
        }

        // Get last 5 messages for context (to avoid token limits)
        const recentMessages = messages.slice(-5);

        return recentMessages.map(msg =>
            `${msg.role}: ${msg.content}`
        ).join('\n');
    }

    /**
     * Determine if practice exercises should be suggested
     */
    shouldSuggestPractice(userMessage) {
        const practiceKeywords = [
            'practice', 'exercise', 'problem', 'quiz', 'test', 'exam',
            'homework', 'assignment', 'questions', 'problems'
        ];

        const message = userMessage.toLowerCase();
        return practiceKeywords.some(keyword => message.includes(keyword));
    }

    /**
     * Complete a study session and generate summary
     */
    async completeStudySession(studyChatId) {
        try {
            const studyChat = await StudyChat.findById(studyChatId);
            if (!studyChat) {
                throw new Error('Study chat not found');
            }

            // Generate summary using AI
            const summary = await this.generateSessionSummary(studyChat);
            studyChat.summary = summary;
            studyChat.status = 'completed';

            await studyChat.save();
            return studyChat;

        } catch (error) {
            console.error('Error completing study session:', error);
            throw new Error(`Failed to complete study session: ${error.message}`);
        }
    }

    /**
     * Generate session summary using AI
     */
    async generateSessionSummary(studyChat) {
        const conversationContext = this.buildConversationContext(studyChat.messages);

        const prompt = `
        Based on the following study session conversation, generate a comprehensive summary:
        
        Topic: ${studyChat.topic}
        Subject: ${studyChat.subject}
        
        Conversation:
        ${conversationContext}
        
        Please provide a summary with:
        1. Key points discussed
        2. Main topics covered
        3. Suggested next steps for continued learning
        
        Format your response as JSON with the following structure:
        {
            "keyPoints": ["point1", "point2", ...],
            "topicsDiscussed": ["topic1", "topic2", ...],
            "nextSteps": ["step1", "step2", ...]
        }
        `;

        try {
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                temperature: 0.5,
                max_tokens: 1024,
                response_format: { type: "json_object" }
            });

            return JSON.parse(completion.choices[0].message.content);

        } catch (error) {
            console.error('Error generating session summary:', error);
            // Return default summary if AI generation fails
            return {
                keyPoints: [`Discussed ${studyChat.topic} in ${studyChat.subject}`],
                topicsDiscussed: [studyChat.topic],
                nextSteps: ['Review the materials provided', 'Practice with exercises']
            };
        }
    }
}

export default StudyChatService;