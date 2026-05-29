import { Router } from 'express';
import { getAllSources, getSource, removeSource } from '../services/sourceStore.js';
import { deleteBySource } from '../services/vectorService.js';
import { AppError, sendSuccess, sendNotFound, sendServerError } from '../utils/response.js';

const router = Router();

/**
 * GET /api/sources/:chatId
 * Returns all currently indexed sources for a specific chat.
 */
router.get('/sources/:chatId', (req, res) => {
  const { chatId } = req.params;
  const sources = getAllSources(chatId);
  sendSuccess(res, { sources });
});

/**
 * DELETE /api/sources/:id
 * Removes a source from the store and deletes its vectors from Pinecone.
 */
router.delete('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const source = getSource(id);
    if (!source) {
      return sendNotFound(res, `Source with id "${id}" not found.`);
    }

    // 1. Delete all vectors for this source from Pinecone
    await deleteBySource(id);

    // 2. Remove from in-memory store
    removeSource(id);

    sendSuccess(res, { message: `Source "${source.name}" deleted successfully.` });
  } catch (err) {
    if (err instanceof AppError) throw err;
    sendServerError(res, err, 'sources delete route');
  }
});

export default router;
