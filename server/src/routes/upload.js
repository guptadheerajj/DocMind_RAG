import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { processPdf } from '../services/pdfService.js';
import { embedDocuments } from '../services/embeddingService.js';
import { upsertChunks } from '../services/vectorService.js';
import { addSource } from '../services/sourceStore.js';
import { AppError, sendCreated, sendServerError } from '../utils/response.js';
import config from '../utils/config.js';

const router = Router();

// Memory storage — PDF buffer is passed directly to pdf-parse, never written to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSize },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new AppError('Only PDF files are supported.', 400));
    }
  },
});

/**
 * POST /api/upload
 * Accepts a PDF file, extracts text per-page, embeds chunks, upserts to Pinecone.
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new AppError('No file uploaded.', 400);
    if (!req.body.chatId) throw new AppError('chatId is required.', 400);

    const { buffer, originalname } = req.file;
    const { chatId } = req.body;
    const sourceId = uuidv4();

    // 1. Extract text per-page → tagged chunks
    const chunks = await processPdf(buffer, originalname);
    if (chunks.length === 0) throw new AppError('PDF appears to be empty or unreadable.', 400);

    // 2. Embed all chunk texts (batched, rate-limited internally)
    const embeddings = await embedDocuments(chunks.map((c) => c.text));

    // 3. Upsert vectors + metadata into Pinecone
    await upsertChunks(chunks, embeddings, sourceId, chatId);

    // 4. Register source in the in-memory store
    addSource(sourceId, {
      name: originalname,
      type: 'pdf',
      chatId,
      chunkCount: chunks.length,
    });

    sendCreated(res, {
      sourceId,
      filename: originalname,
      chunkCount: chunks.length,
    });
  } catch (err) {
    if (err instanceof AppError) throw err; // let global handler deal with it
    sendServerError(res, err, 'upload route');
  }
});

export default router;
