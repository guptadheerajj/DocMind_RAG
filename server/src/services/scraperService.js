import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import * as cheerio from 'cheerio';
import { splitText } from '../utils/chunker.js';
import config from '../utils/config.js';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000; // doubles each attempt: 1s, 2s, 3s

const MIN_CONTENT_LENGTH = 500;

/**
 * Sleep helper for retry backoff.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Scraper Service — fetches a URL and extracts clean, readable text.
 *
 * Two-stage extraction strategy:
 *
 * 1. PRIMARY — Readability.js (Mozilla):
 *    Same library Firefox uses for Reader Mode. Extracts the main article/content
 *    body, stripping ads, navbars, footers, and boilerplate. Works great on
 *    news articles, docs, Wikipedia, blog posts.
 *
 * 2. FALLBACK — Cheerio:
 *    If Readability returns null (e.g. SPAs, unusual page structures), we fall
 *    back to manually stripping noisy HTML tags (script, style, nav, footer,
 *    header, aside) and grabbing whatever text remains from <body>.
 *
 * @param {string} url - validated URL to scrape (SSRF-checked upstream by middleware)
 * @returns {Promise<Array<{ text: string, metadata: object }>>}
 *   Flat array of chunks, each with: { text, metadata: { source, type, title, chunkIndex } }
 */
export async function scrapeUrl(url) {
  // Retry loop — retries up to MAX_RETRIES times on transient failures
  // (timeouts, 500s, network blips) before giving up.
  // Uses linear backoff: waits 1s after attempt 1, 2s after attempt 2.
  let response;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await fetch(url, {
        headers: {
          // Browser-like User-Agent — some sites block default Node.js UA
          'User-Agent':
            'Mozilla/5.0 (compatible; RAGBot/1.0; +https://github.com/guptadheerajj/rag-langchain)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(15_000),
      });

      if (response.ok) break;

      // Non-retriable client errors (400, 403, 404) — no point retrying
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to fetch URL after ${MAX_RETRIES} attempts: ${response.status} ${response.statusText}`);
      }

    } catch (err) {
      // 4xx errors are not retriable — bail immediately
      if (err.message.startsWith('Failed to fetch URL:')) throw err;

      // On last attempt, give up
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to fetch URL after ${MAX_RETRIES} attempts: ${err.message}`);
      }
    }

    // Wait before retrying — linear backoff (1s, 2s)
    await sleep(RETRY_DELAY_MS * attempt);
  }

  const html = await response.text();

  // --- Primary extraction: Readability.js ---
  let title = url;
  let cleanText = null;

  try {
    const dom = new JSDOM(html, { url }); // url param needed for relative link resolution
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    // CHANGE 2: Raised minimum from 100 to MIN_CONTENT_LENGTH (500)
    if (article && article.textContent && article.textContent.trim().length > MIN_CONTENT_LENGTH) {
      cleanText = article.textContent.trim();
      title = article.title || url;
    }
  } catch {
    // Readability failed — fall through to Cheerio
  }

  // --- Fallback extraction: Cheerio ---
  if (!cleanText) {
    const $ = cheerio.load(html);

    // Remove all noise elements
    $('script, style, nav, footer, header, aside, noscript, iframe, [aria-hidden="true"]').remove();

    cleanText = $('body').text().replace(/\s+/g, ' ').trim();
    title = $('title').text().trim() || url;
  }

  // Use MIN_CONTENT_LENGTH consistently — same threshold for both
  // extraction paths so behaviour is predictable
  if (!cleanText || cleanText.length < MIN_CONTENT_LENGTH) {
    throw new Error('Could not extract meaningful text content from this URL.');
  }

  // --- Chunk the clean text ---
  const rawChunks = splitText(cleanText, {
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  });

  const chunks = rawChunks.map((chunk, i) => ({
    text: chunk.text,
    metadata: {
      source: url,
      type: 'web',
      title,
      chunkIndex: i,
    },
  }));

  return chunks;
}