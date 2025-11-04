/**
 * Estimate token count for text (rough approximation: 1 token ≈ 4 characters)
 * @param {string} text - Text to estimate tokens for
 * @returns {number} - Estimated token count
 */
export function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/**
 * Count words in text
 * @param {string} text - Text to count words in
 * @returns {number} - Word count
 */
export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Get the last N sentences from text (for chunk overlap)
 * @param {string} text - Text to extract from
 * @param {number} wordCount - Number of words to extract
 * @returns {string} - Last sentences
 */
function getLastWords(text, wordCount) {
  const words = text.trim().split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(-wordCount).join(' ');
}

/**
 * Split text into sentences
 * @param {string} text - Text to split
 * @returns {string[]} - Array of sentences
 */
function splitIntoSentences(text) {
  // Split by sentence boundaries (. ! ?)
  return text
    .split(/([.!?]+\s+)/)
    .reduce((acc, part, i, arr) => {
      if (i % 2 === 0 && part.trim()) {
        const sentence = part + (arr[i + 1] || '');
        acc.push(sentence.trim());
      }
      return acc;
    }, [])
    .filter(s => s.length > 0);
}

/**
 * Chunk text into smaller segments with overlap
 * Preserves paragraph and sentence boundaries for better context
 *
 * @param {string} text - Text to chunk
 * @param {number} maxTokens - Maximum tokens per chunk (default: 500)
 * @param {number} overlapWords - Number of words to overlap between chunks (default: 50)
 * @returns {Array<{content: string, order: number, wordCount: number}>} - Array of chunks
 */
export function chunkText(text, maxTokens = 500, overlapWords = 50) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean up text
  text = text.trim().replace(/\n{3,}/g, '\n\n');

  // Split by paragraphs first
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  const chunks = [];
  let currentChunk = '';
  let currentTokens = 0;

  for (const paragraph of paragraphs) {
    const paragraphTokens = estimateTokens(paragraph);

    // If single paragraph exceeds maxTokens, split by sentences
    if (paragraphTokens > maxTokens) {
      // Save current chunk if exists
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
        currentTokens = 0;
      }

      // Split large paragraph into sentences
      const sentences = splitIntoSentences(paragraph);
      let sentenceChunk = '';
      let sentenceTokens = 0;

      for (const sentence of sentences) {
        const sentenceToken = estimateTokens(sentence);

        if (sentenceTokens + sentenceToken > maxTokens && sentenceChunk) {
          chunks.push(sentenceChunk.trim());
          sentenceChunk = getLastWords(sentenceChunk, overlapWords) + ' ' + sentence;
          sentenceTokens = estimateTokens(sentenceChunk);
        } else {
          sentenceChunk += ' ' + sentence;
          sentenceTokens += sentenceToken;
        }
      }

      if (sentenceChunk.trim()) {
        chunks.push(sentenceChunk.trim());
      }

      continue;
    }

    // Check if adding this paragraph would exceed maxTokens
    if (currentTokens + paragraphTokens > maxTokens && currentChunk) {
      // Save current chunk
      chunks.push(currentChunk.trim());

      // Start new chunk with overlap from previous chunk
      const overlap = getLastWords(currentChunk, overlapWords);
      currentChunk = overlap + '\n\n' + paragraph;
      currentTokens = estimateTokens(currentChunk);
    } else {
      // Add paragraph to current chunk
      if (currentChunk) {
        currentChunk += '\n\n' + paragraph;
      } else {
        currentChunk = paragraph;
      }
      currentTokens += paragraphTokens;
    }
  }

  // Add final chunk if exists
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Format chunks with metadata
  return chunks.map((content, index) => ({
    content,
    order: index,
    wordCount: countWords(content),
    metadata: {
      startChar: text.indexOf(content.substring(0, 50)),
      endChar: text.indexOf(content.substring(0, 50)) + content.length
    }
  }));
}

/**
 * Validate chunk quality
 * @param {string} chunk - Chunk to validate
 * @returns {boolean} - True if chunk is valid
 */
export function isValidChunk(chunk) {
  if (!chunk || chunk.trim().length === 0) return false;
  if (countWords(chunk) < 10) return false; // Too short
  if (countWords(chunk) > 2000) return false; // Too long
  return true;
}

export default {
  chunkText,
  estimateTokens,
  countWords,
  isValidChunk
};
