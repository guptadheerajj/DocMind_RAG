/**
 * In-memory source metadata store.
 *
 * Pinecone doesn't natively support listing distinct sources from its index.
 * This module tracks all indexed sources in a Map that persists for the
 * lifetime of the server process.
 *
 * Known limitation: resets on server restart. Vectors remain in Pinecone,
 * but the source list will be empty until new sources are added.
 */

const sources = new Map();

/**
 * Register a new source after successful indexing.
 * @param {string} sourceId - Unique ID (UUID)
 * @param {object} metadata
 * @param {string} metadata.name - Filename or page title
 * @param {string} metadata.type - 'pdf' or 'web'
 * @param {string} [metadata.url] - Original URL (for web sources)
 * @param {number} metadata.chunkCount - Number of chunks indexed
 */
export function addSource(sourceId, metadata) {
  sources.set(sourceId, {
    id: sourceId,
    ...metadata,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Remove a source from the store.
 * @param {string} sourceId
 * @returns {boolean} true if the source existed and was removed
 */
export function removeSource(sourceId) {
  return sources.delete(sourceId);
}

/**
 * Get all indexed sources for a specific chat.
 * @param {string} chatId
 * @returns {Array<object>}
 */
export function getAllSources(chatId) {
  const all = Array.from(sources.values());
  return all.filter((source) => source.chatId === chatId);
}

/**
 * Get a single source by ID.
 * @param {string} sourceId
 * @returns {object|undefined}
 */
export function getSource(sourceId) {
  return sources.get(sourceId);
}
