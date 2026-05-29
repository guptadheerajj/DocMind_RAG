import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../utils/config.js';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);
const model = genAI.getGenerativeModel({ model: config.embeddingModel });

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
// Gemini free tier: 100 embed requests / minute → ~600ms per request minimum.
// We use 700ms to stay safely under the limit.
//
// IMPORTANT: this is a MODULE-LEVEL singleton. Every call — whether from
// PDF upload 1, PDF upload 2, or URL scraping — shares the same limiter.
// Without this, concurrent uploads multiply the rate and hit 429 instantly.

const INTERVAL_MS = 700; // 1000ms / (100 req/min / 60s) = 600ms, +100ms buffer

class RateLimiter {
  constructor(intervalMs) {
    this.intervalMs = intervalMs;
    this.lastCallAt = 0;
  }

  async wait() {
    const now = Date.now();
    const elapsed = now - this.lastCallAt;
    if (elapsed < this.intervalMs) {
      await sleep(this.intervalMs - elapsed);
    }
    this.lastCallAt = Date.now();
  }
}

const rateLimiter = new RateLimiter(INTERVAL_MS);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse the suggested retry delay from a 429 error message.
 * Gemini errors contain: "Please retry in 40.517112771s."
 * Falls back to exponential backoff if not found.
 */
function parseRetryDelayMs(errMessage, attempt) {
  const match = errMessage?.match(/Please retry in ([\d.]+)s/);
  if (match) {
    // Add 2s buffer on top of the suggested delay
    return Math.ceil(parseFloat(match[1]) * 1000) + 2000;
  }
  // Exponential backoff fallback: 5s, 10s, 20s
  return 5000 * Math.pow(2, attempt);
}

/**
 * Embed a single text with rate limiting + automatic retry on 429.
 * Goes through the shared rateLimiter before every attempt.
 */
async function embedWithRetry(text, taskType, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    await rateLimiter.wait(); // shared slot — blocks if another call is in progress
    try {
      const result = await model.embedContent({
        content: { parts: [{ text }], role: 'user' },
        taskType,
      });
      return result.embedding.values;
    } catch (err) {
      const is429 = err?.status === 429 || err?.message?.includes('429');
      if (is429 && attempt < maxRetries) {
        const delayMs = parseRetryDelayMs(err.message, attempt);
        console.warn(
          `[embedding] 429 rate-limit hit (attempt ${attempt + 1}/${maxRetries}). ` +
          `Waiting ${Math.round(delayMs / 1000)}s before retry…`
        );
        await sleep(delayMs);
        // After the long wait, reset lastCallAt so the next wait() call
        // doesn't add an extra INTERVAL_MS on top of the penalty wait.
        rateLimiter.lastCallAt = 0;
      } else {
        throw err; // non-429 or out of retries — propagate
      }
    }
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Embed an array of document text strings.
 * Each chunk goes through the shared rate limiter sequentially.
 *
 * Uses taskType 'RETRIEVAL_DOCUMENT' — Gemini optimises the embedding for
 * document storage when this is set (better recall at query time).
 *
 * @param {string[]} texts - Array of chunk texts to embed
 * @returns {Promise<number[][]>} - Array of 768-dimensional float vectors
 */
export async function embedDocuments(texts) {
  const embeddings = [];
  for (const text of texts) {
    const vector = await embedWithRetry(text, 'RETRIEVAL_DOCUMENT');
    embeddings.push(vector);
  }
  return embeddings;
}

/**
 * Embed a single query string.
 * Uses taskType 'RETRIEVAL_QUERY' — Gemini optimises for similarity search.
 *
 * @param {string} query - The user's question
 * @returns {Promise<number[]>} - A single 768-dimensional float vector
 */
export async function embedQuery(query) {
  return embedWithRetry(query, 'RETRIEVAL_QUERY');
}
