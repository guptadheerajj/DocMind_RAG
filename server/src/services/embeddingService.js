import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../utils/config.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: config.embeddingModel });

// Gemini free tier: 1,500 requests/min, but we batch conservatively to stay safe.
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 100; // 100ms between each embed call within a batch

/**
 * Sleep helper — used for rate limiting between Gemini API calls.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Embed an array of document text strings.
 * Splits into batches of BATCH_SIZE and inserts a small delay between each
 * call to respect the Gemini free-tier rate limit.
 *
 * Uses taskType 'RETRIEVAL_DOCUMENT' — Gemini optimises the embedding for
 * document storage when this is set (better recall at query time).
 *
 * @param {string[]} texts - Array of chunk texts to embed
 * @returns {Promise<number[][]>} - Array of 768-dimensional float vectors
 */
export async function embedDocuments(texts) {
  const embeddings = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    for (const text of batch) {
      const result = await model.embedContent({
        content: { parts: [{ text }], role: 'user' },
        taskType: 'RETRIEVAL_DOCUMENT',
      });
      embeddings.push(result.embedding.values);
      await sleep(BATCH_DELAY_MS);
    }
  }

  return embeddings;
}

/**
 * Embed a single query string.
 * Uses taskType 'RETRIEVAL_QUERY' — Gemini optimises the embedding for
 * similarity search against document embeddings (asymmetric retrieval).
 *
 * @param {string} query - The user's question
 * @returns {Promise<number[]>} - A single 768-dimensional float vector
 */
export async function embedQuery(query) {
  const result = await model.embedContent({
    content: { parts: [{ text: query }], role: 'user' },
    taskType: 'RETRIEVAL_QUERY',
  });
  return result.embedding.values;
}
