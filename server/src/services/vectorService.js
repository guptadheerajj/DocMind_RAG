import { Pinecone } from '@pinecone-database/pinecone';
import config from '../utils/config.js';

const pinecone = new Pinecone({ apiKey: config.pineconeApiKey });
const index = pinecone.index(config.pineconeIndexName);

/**
 * Upsert document chunks + their embeddings into Pinecone.
 *
 * Vector ID format: `{sourceId}_{chunkIndex}` — deterministic, so re-uploading
 * the same source overwrites old vectors rather than duplicating them.
 *
 * Metadata stored per vector:
 *   - text      : the raw chunk text (used to build LLM context)
 *   - source    : filename or URL
 *   - type      : 'pdf' | 'web'
 *   - sourceId  : used later for bulk-delete by source
 *   - page      : page number (PDFs only, omitted for web)
 *   - chunkIndex: position within the source document
 *
 * @param {Array<{ text: string, metadata: object }>} chunks
 * @param {number[][]} embeddings - parallel array of 768-dim vectors
 * @param {string} sourceId - unique ID for this source document
 * @param {string} chatId - the ID of the chat session this document belongs to
 */
export async function upsertChunks(chunks, embeddings, sourceId, chatId) {
  const vectors = chunks.map((chunk, i) => {
    const meta = {
      text: chunk.text.slice(0, 36_000), // Pinecone metadata cap: ~40KB per vector
      source: chunk.metadata.source,
      type: chunk.metadata.type,
      sourceId,
      chatId,
      chunkIndex: i,
    };

    // Only include page number for PDF chunks
    if (chunk.metadata.page !== undefined) {
      meta.page = chunk.metadata.page;
    }

    return {
      id: `${sourceId}_${i}`,
      values: embeddings[i],
      metadata: meta,
    };
  });

  // Pinecone recommends upsert batches of ≤100 vectors
  const UPSERT_BATCH = 100;
  for (let i = 0; i < vectors.length; i += UPSERT_BATCH) {
    await index.upsert(vectors.slice(i, i + UPSERT_BATCH));
  }
}

/**
 * Query Pinecone for the top-K most similar chunks to a query embedding.
 *
 * `includeMetadata: true` returns the stored text + source info alongside
 * the similarity score — this is what gets fed into the LLM prompt.
 *
 * @param {number[]} queryEmbedding - 768-dim vector from embedQuery()
 * @param {number} topK - number of results to return (default: 5)
 * @param {string} chatId - filter results by this chat session ID
 * @returns {Promise<Array<{ score: number, metadata: object }>>}
 */
export async function queryVectors(queryEmbedding, topK = 5, chatId) {
  const result = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    filter: { chatId: { $eq: chatId } },
  });

  return result.matches;
}

/**
 * Delete all vectors belonging to a specific source from Pinecone.
 *
 * Uses Pinecone's metadata filter delete — deletes every vector where
 * metadata.sourceId matches. This is how we cleanly remove a source.
 *
 * @param {string} sourceId - the ID of the source to remove
 */
export async function deleteBySource(sourceId) {
  await index.deleteMany({ sourceId });
}
