/**
 * Centralized Response & Error Utilities
 *
 * All routes use these helpers so the API surface is consistent:
 *   - Success responses always have the same shape
 *   - Error responses always have the same shape
 *   - HTTP status codes are never scattered across route files
 */

// ---------------------------------------------------------------------------
// Success responses
// ---------------------------------------------------------------------------

/**
 * Send a 200 OK response with a data payload.
 * @param {import('express').Response} res
 * @param {object} data - the response payload
 */
export function sendSuccess(res, data) {
  res.status(200).json({ success: true, ...data });
}

/**
 * Send a 201 Created response (used after a resource is indexed).
 * @param {import('express').Response} res
 * @param {object} data - the response payload
 */
export function sendCreated(res, data) {
  res.status(201).json({ success: true, ...data });
}

// ---------------------------------------------------------------------------
// Error responses
// ---------------------------------------------------------------------------

/**
 * Send a 400 Bad Request (validation failure, missing fields, etc.)
 * @param {import('express').Response} res
 * @param {string} message - human-readable reason
 */
export function sendBadRequest(res, message) {
  res.status(400).json({ success: false, error: message });
}

/**
 * Send a 404 Not Found.
 * @param {import('express').Response} res
 * @param {string} message
 */
export function sendNotFound(res, message) {
  res.status(404).json({ success: false, error: message });
}

/**
 * Send a 500 Internal Server Error.
 * Logs the full error server-side but sends a safe message to the client.
 * @param {import('express').Response} res
 * @param {Error} err - the caught error object
 * @param {string} [context] - label for the server log (e.g. 'upload route')
 */
export function sendServerError(res, err, context = 'server') {
  console.error(`[${context}] ${err.message}`);
  res.status(500).json({ success: false, error: 'Something went wrong. Please try again.' });
}

// ---------------------------------------------------------------------------
// AppError — throw this anywhere to send a controlled HTTP error response
// ---------------------------------------------------------------------------

/**
 * Custom error class for expected, user-facing errors.
 * Throwing this in a route or service will be caught by the global error
 * handler in app.js and forwarded to the client with the given status code.
 *
 * Usage:
 *   throw new AppError('File must be a PDF', 400);
 *   throw new AppError('Source not found', 404);
 */
export class AppError extends Error {
  /**
   * @param {string} message - user-facing error message
   * @param {number} status - HTTP status code (default: 400)
   */
  constructor(message, status = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}
