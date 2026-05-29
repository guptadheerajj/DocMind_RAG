/**
 * api.js — Centralized backend API client.
 * All fetch calls go through here. Throws descriptive errors on failure.
 */

const BASE = '/api'; // proxied to http://localhost:3001 via vite.config.js

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }
  return json;
}

/** Upload a single PDF. Returns: { success, sourceId, filename, chunkCount } */
export async function uploadPdf(chatId, file) {
  const form = new FormData();
  form.append('file', file);
  form.append('chatId', chatId);
  return request('/upload', { method: 'POST', body: form });
}

/** Scrape a URL. Returns: { success, sourceId, title, url, chunkCount } */
export async function scrapeUrl(chatId, url) {
  return request('/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, url }),
  });
}

/** Send a chat message. Returns: { answer, sources } */
export async function sendMessage(chatId, question) {
  return request('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chatId, question }),
  });
}

/** Get all sources for a chat. Returns: { sources } */
export async function getSources(chatId) {
  return request(`/sources/${chatId}`);
}

/** Delete a source. Returns: { success, message } */
export async function deleteSource(sourceId) {
  return request(`/sources/${sourceId}`, { method: 'DELETE' });
}
