import CourseMaterial from '../models/CourseMaterial.js';
import { cosineSimilarity } from './embeddingService.js';

/**
 * Search for similar chunks using vector similarity
 * Uses MongoDB aggregation for efficient searching
 *
 * @param {number[]} queryEmbedding - 768-dimensional embedding vector
 * @param {string} userId - User ID to filter materials
 * @param {string[]} materialIds - Optional array of material IDs to search within
 * @param {number} limit - Number of top results to return (default: 5)
 * @param {number} minSimilarity - Minimum similarity threshold (default: 0.5)
 * @returns {Promise<Array>} - Array of similar chunks with similarity scores
 */
export async function searchSimilarChunks(
  queryEmbedding,
  userId,
  materialIds = [],
  limit = 5,
  minSimilarity = 0.5
) {
  try {
    // Validate inputs
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 768) {
      throw new Error('Invalid query embedding: must be 768-dimensional array');
    }

    if (!userId) {
      throw new Error('User ID is required');
    }

    // Build query filter
    const filter = {
      user: userId,
      status: 'ready'
    };

    if (materialIds && materialIds.length > 0) {
      filter._id = { $in: materialIds };
    }

    // Fetch all materials for this user
    const materials = await CourseMaterial.find(filter)
      .select('_id title topic chunks')
      .lean();

    if (!materials || materials.length === 0) {
      return [];
    }

    // Calculate similarity for all chunks
    const allChunks = [];

    for (const material of materials) {
      for (const chunk of material.chunks) {
        // Calculate cosine similarity
        const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

        // Only include chunks above minimum similarity threshold
        if (similarity >= minSimilarity) {
          allChunks.push({
            materialId: material._id,
            materialTitle: material.title,
            materialTopic: material.topic,
            chunkId: chunk._id,
            content: chunk.content,
            order: chunk.order,
            wordCount: chunk.wordCount,
            similarity: similarity,
            relevanceScore: similarity // Alias for clarity
          });
        }
      }
    }

    // Sort by similarity (highest first) and return top K
    allChunks.sort((a, b) => b.similarity - a.similarity);

    return allChunks.slice(0, limit);
  } catch (error) {
    console.error('Error in vector search:', error);
    throw new Error(`Vector search failed: ${error.message}`);
  }
}

/**
 * Search within specific material only
 *
 * @param {number[]} queryEmbedding - 768-dimensional embedding vector
 * @param {string} materialId - Material ID to search within
 * @param {number} limit - Number of top results to return
 * @returns {Promise<Array>} - Array of similar chunks
 */
export async function searchWithinMaterial(queryEmbedding, materialId, limit = 5) {
  try {
    const material = await CourseMaterial.findById(materialId)
      .select('_id title topic chunks')
      .lean();

    if (!material) {
      throw new Error('Material not found');
    }

    const chunks = [];

    for (const chunk of material.chunks) {
      const similarity = cosineSimilarity(queryEmbedding, chunk.embedding);

      chunks.push({
        materialId: material._id,
        materialTitle: material.title,
        materialTopic: material.topic,
        chunkId: chunk._id,
        content: chunk.content,
        order: chunk.order,
        wordCount: chunk.wordCount,
        similarity: similarity
      });
    }

    // Sort and return top K
    chunks.sort((a, b) => b.similarity - a.similarity);
    return chunks.slice(0, limit);
  } catch (error) {
    console.error('Error searching within material:', error);
    throw new Error(`Material search failed: ${error.message}`);
  }
}

/**
 * Get context from top similar chunks
 * Formats chunks into a readable context string for LLM
 *
 * @param {Array} chunks - Array of chunk objects with similarity scores
 * @param {number} maxChunks - Maximum number of chunks to include
 * @returns {string} - Formatted context string
 */
export function formatContextFromChunks(chunks, maxChunks = 5) {
  if (!chunks || chunks.length === 0) {
    return '';
  }

  const topChunks = chunks.slice(0, maxChunks);

  const contextParts = topChunks.map((chunk, index) => {
    return `[Context ${index + 1} - from "${chunk.materialTitle}" (relevance: ${(chunk.similarity * 100).toFixed(1)}%)]\n${chunk.content}`;
  });

  return contextParts.join('\n\n---\n\n');
}

/**
 * Re-rank chunks using advanced scoring
 * Considers both similarity and chunk position/quality
 *
 * @param {Array} chunks - Array of chunk objects
 * @param {string} query - Original query text
 * @returns {Array} - Re-ranked chunks
 */
export function rerankChunks(chunks, query) {
  // Simple re-ranking based on keyword matching
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  return chunks.map(chunk => {
    let bonusScore = 0;

    // Keyword matching bonus
    const chunkText = chunk.content.toLowerCase();
    const matchedKeywords = queryWords.filter(word => chunkText.includes(word));
    bonusScore += (matchedKeywords.length / queryWords.length) * 0.1;

    // Position bonus (earlier chunks might be more important)
    if (chunk.order < 3) {
      bonusScore += 0.05;
    }

    // Length bonus (prefer moderately sized chunks)
    if (chunk.wordCount >= 100 && chunk.wordCount <= 500) {
      bonusScore += 0.05;
    }

    return {
      ...chunk,
      finalScore: chunk.similarity + bonusScore,
      originalSimilarity: chunk.similarity
    };
  }).sort((a, b) => b.finalScore - a.finalScore);
}

export default {
  searchSimilarChunks,
  searchWithinMaterial,
  formatContextFromChunks,
  rerankChunks
};
