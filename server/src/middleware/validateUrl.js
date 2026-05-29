/**
 * URL validation middleware — SSRF protection.
 *
 * Prevents users from scraping internal/private resources by submitting
 * malicious URLs like file:///etc/passwd, http://localhost, or
 * http://169.254.169.254 (cloud metadata endpoint).
 */

// Private/reserved IPv4 ranges
const PRIVATE_IP_PATTERNS = [
  /^127\./, // Loopback
  /^10\./, // Class A private
  /^172\.(1[6-9]|2\d|3[01])\./, // Class B private
  /^192\.168\./, // Class C private
  /^169\.254\./, // Link-local
  /^0\./, // "This" network
];

const BLOCKED_HOSTNAMES = ['localhost', '0.0.0.0', '[::1]'];

/**
 * Express middleware that validates the `url` field in the request body.
 * Must be applied BEFORE the scrape route handler.
 */
export function validateUrl(req, res, next) {
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required and must be a string.' });
  }

  const trimmed = url.trim();

  // Must be http or https
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return res.status(400).json({
      error: 'Only http:// and https:// URLs are allowed.',
    });
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format.' });
  }

  // Block known private hostnames
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(hostname)) {
    return res.status(400).json({ error: 'URLs pointing to localhost are not allowed.' });
  }

  // Block private IP ranges
  const isPrivateIp = PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname));
  if (isPrivateIp) {
    return res.status(400).json({ error: 'URLs pointing to private IP addresses are not allowed.' });
  }

  // Attach the validated, trimmed URL back to the request
  req.body.url = trimmed;
  next();
}
