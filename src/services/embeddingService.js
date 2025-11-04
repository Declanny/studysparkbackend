import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate embedding for a single text using Gemini
 * @param {string} text - Text to generate embedding for
 * @returns {Promise<number[]>} - 768-dimensional embedding vector
 */
export async function generateEmbedding(text) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Use Gemini's text-embedding-004 model (768 dimensions)
    const model = genAI.getGenerativeModel({
      model: 'text-embedding-004'
    });

    const result = await model.embedContent(text);

    // Gemini returns embedding in result.embedding.values
    const embedding = result.embedding.values;

    // Validate embedding
    if (!Array.isArray(embedding) || embedding.length !== 768) {
      throw new Error(`Invalid embedding dimensions: expected 768, got ${embedding?.length}`);
    }

    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * @param {string[]} texts - Array of texts to generate embeddings for
 * @returns {Promise<number[][]>} - Array of 768-dimensional embedding vectors
 */
export async function generateEmbeddings(texts) {
  try {
    if (!Array.isArray(texts) || texts.length === 0) {
      throw new Error('Texts must be a non-empty array');
    }

    // Process in batches to avoid rate limits
    const batchSize = 10;
    const embeddings = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);

      // Generate embeddings for batch in parallel
      const batchEmbeddings = await Promise.all(
        batch.map(text => generateEmbedding(text))
      );

      embeddings.push(...batchEmbeddings);

      // Small delay to respect rate limits (60 requests/minute)
      if (i + batchSize < texts.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return embeddings;
  } catch (error) {
    console.error('Error generating batch embeddings:', error);
    throw new Error(`Failed to generate batch embeddings: ${error.message}`);
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Similarity score between 0 and 1
 */
export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  if (denominator === 0) {
    return 0;
  }

  return dotProduct / denominator;
}

/**
 * Generate response using Gemini Chat
 * @param {string} prompt - The prompt to send to Gemini
 * @returns {Promise<string>} - AI generated response
 */
export async function generateChatResponse(prompt) {
  try {
    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt cannot be empty');
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-pro'
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return text;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error(`Failed to generate chat response: ${error.message}`);
  }
}

export default {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
  generateChatResponse
};
