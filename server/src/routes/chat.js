import { Router } from 'express';
import { embedQuery } from '../services/embeddingService.js';
import { queryVectors } from '../services/vectorService.js';
import { generateAnswer } from '../services/llmService.js';
import { AppError, sendSuccess, sendServerError } from '../utils/response.js';

const router = Router();

/**
 * POST /api/chat
 * Body: { question: string }
 * Embeds the question, retrieves top-5 chunks from Pinecone, generates a grounded answer.
 */
router.post('/chat', async (req, res) => {
  try {
    const { question, chatId } = req.body;

    if (!chatId) {
      throw new AppError('chatId is required.', 400);
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new AppError('Question is required and must be a non-empty string.', 400);
    }

    const trimmedQuestion = question.trim();

    // 1. Embed the user's question
    const queryEmbedding = await embedQuery(trimmedQuestion);

    // 2. Find the top-5 most relevant chunks in Pinecone for this specific chat
    const matches = await queryVectors(queryEmbedding, 5, chatId);

    if (matches.length === 0) {
      return sendSuccess(res, {
        answer: "I don't have any sources indexed yet. Please upload a PDF or add a URL first.",
        sources: [],
      });
    }

    // 3. Generate a grounded answer using the retrieved chunks as context
    const { answer, sources } = await generateAnswer(trimmedQuestion, matches);

    sendSuccess(res, { answer, sources });
  } catch (err) {
    if (err instanceof AppError) throw err;
    sendServerError(res, err, 'chat route');
  }
});

export default router;
