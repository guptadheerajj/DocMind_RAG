/**
 * Recursive Character Text Splitter
 *
 * Splits text into chunks using a hierarchy of separators.
 * Tries the "biggest" separator first (\n\n), falls back to smaller ones.
 * This preserves semantic structure (paragraphs > sentences > words).
 *
 * @param {string} text - The text to split
 * @param {object} options
 * @param {number} options.chunkSize - Max characters per chunk (default: 1000)
 * @param {number} options.chunkOverlap - Characters to overlap between chunks (default: 200)
 * @returns {Array<{ text: string, index: number }>}
 */

const SEPARATORS = ['\n\n', '\n', '. ', ' '];

export function splitText(text, { chunkSize = 1000, chunkOverlap = 200 } = {}) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Step 1: Smart split — respects paragraph and sentence boundaries
  const rawChunks = recursiveSplit(text, SEPARATORS, chunkSize);

  // Step 2: Filter empty chunks
  const filtered = rawChunks.map((c) => c.trim()).filter((c) => c.length > 0);

  // Step 3: If only one chunk, return it directly (no overlap needed)
  if (filtered.length <= 1) {
    return filtered.map((text, index) => ({ text, index }));
  }

  // Step 4: Apply overlap to the smart chunks (not the raw text)
  return applyOverlapToChunks(filtered, chunkOverlap);
}

/**
 * Recursively split text using the separator hierarchy.
 */
function recursiveSplit(text, separators, chunkSize) {
  if (text.length <= chunkSize) {
    return [text];
  }

  // Find the first separator that exists in the text
  const separator = separators.find((sep) => text.includes(sep));

  if (!separator) {
    // No separator found — hard split by character count
    return hardSplit(text, chunkSize);
  }

  const parts = text.split(separator);
  const chunks = [];
  let current = '';

  for (const part of parts) {
    const candidate = current ? current + separator + part : part;

    if (candidate.length <= chunkSize) {
      current = candidate;
    } else {
      // Push what we have
      if (current) chunks.push(current);

      // If this single part is too big, recurse with smaller separators
      if (part.length > chunkSize) {
        const remaining = separators.slice(separators.indexOf(separator) + 1);
        chunks.push(...recursiveSplit(part, remaining, chunkSize));
        current = '';
      } else {
        current = part;
      }
    }
  }

  if (current) chunks.push(current);

  return chunks;
}

/**
 * Hard split when no separators work — split at exact character boundaries.
 */
function hardSplit(text, chunkSize) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Apply overlap to already-split chunks.
 * Takes the tail of the previous chunk and prepends it to the next chunk.
 * This ensures context continuity — the end of chunk N appears at the start of chunk N+1.
 *
 * REFINEMENT: Rather than blindly taking the last N characters (which splits words in half),
 * this implementation aligns to the first whitespace/newline in the overlap segment.
 */
function applyOverlapToChunks(chunks, chunkOverlap) {
  const result = [];

  for (let i = 0; i < chunks.length; i++) {
    let chunkText = chunks[i];

    // For every chunk except the first, prepend the tail of the previous chunk
    if (i > 0) {
      const previous = chunks[i - 1];
      const rawOverlap = previous.slice(-chunkOverlap); // last N chars of previous chunk

      // Find the first space or newline to align to a clean word boundary
      const firstSpaceIndex = rawOverlap.indexOf(' ');
      const firstNewlineIndex = rawOverlap.indexOf('\n');
      let splitIndex = -1;

      if (firstSpaceIndex !== -1 && firstNewlineIndex !== -1) {
        splitIndex = Math.min(firstSpaceIndex, firstNewlineIndex);
      } else if (firstSpaceIndex !== -1) {
        splitIndex = firstSpaceIndex;
      } else if (firstNewlineIndex !== -1) {
        splitIndex = firstNewlineIndex;
      }

      // If a boundary is found, drop the broken starting word fragment
      const cleanOverlap = splitIndex !== -1 ? rawOverlap.slice(splitIndex + 1) : rawOverlap;

      if (cleanOverlap.trim().length > 0) {
        chunkText = cleanOverlap.trim() + ' ' + chunkText;
      }
    }

    result.push({
      text: chunkText.trim(),
      index: i,
    });
  }

  return result;
}
