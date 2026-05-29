import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { validateUrl } from '../middleware/validateUrl.js';
import { scrapeUrl } from '../services/scraperService.js';
import { embedDocuments } from '../services/embeddingService.js';
import { upsertChunks } from '../services/vectorService.js';
import { addSource } from '../services/sourceStore.js';
import { AppError, sendCreated, sendServerError } from '../utils/response.js';

const router = Router();

/**
 * POST /api/scrape
 * Body: { url: string }
 * Scrapes a URL, extracts clean text, embeds chunks, upserts to Pinecone.
 */
router.post('/scrape', validateUrl, async (req, res) => {
  try {
    const { url } = req.body;
    const sourceId = uuidv4();

    // 1. Fetch + extract clean text → tagged chunks
    const chunks = await scrapeUrl(url);
    if (chunks.length === 0) throw new AppError('No usable content found at this URL.', 400);

    // 2. Embed all chunk texts
    const embeddings = await embedDocuments(chunks.map((c) => c.text));

    // 3. Upsert into Pinecone
    await upsertChunks(chunks, embeddings, sourceId);

    // 4. Register source — use page title if scraperService extracted one
    const title = chunks[0]?.metadata?.title || url;
    addSource(sourceId, {
      name: title,
      type: 'web',
      url,
      chunkCount: chunks.length,
    });

    sendCreated(res, {
      sourceId,
      title,
      url,
      chunkCount: chunks.length,
    });
  } catch (err) {
    if (err instanceof AppError) throw err;
    sendServerError(res, err, 'scrape route');
  }
});

export default router;
