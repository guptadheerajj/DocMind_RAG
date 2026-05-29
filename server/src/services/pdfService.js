import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { splitText } from '../utils/chunker.js';
import config from '../utils/config.js';

/**
 * PDF Service — extracts text page-by-page and splits into tagged chunks.
 *
 * WHY pageRender callback:
 *   The default pdf-parse call returns the full document text as one big string.
 *   That means we lose page boundaries and can't tell the LLM "this came from Page 3".
 *   The pageRender callback fires once per page, letting us collect text per-page
 *   and tag each chunk with its page number — which the task spec requires.
 *
 * @param {Buffer} buffer - raw PDF file buffer (from multer memory storage)
 * @param {string} filename - original filename, used as the source identifier
 * @returns {Promise<Array<{ text: string, metadata: object }>>}
 *   Flat array of chunks, each with: { text, metadata: { source, type, page, chunkIndex } }
 */
export async function processPdf(buffer, filename) {
  const pageTexts = []; // will be filled by the pageRender callback

  const options = {
    // pagerender fires once per page with a PDF.js pageData object.
    // We extract the text items and join them into a plain string.
    pagerender: async function (pageData) {
      const textContent = await pageData.getTextContent();
      const pageText = textContent.items
        .map((item) => item.str)
        .join(' ')
        .trim();
      pageTexts.push(pageText);
      // pdf-parse expects pagerender to return a string (used internally)
      return pageText;
    },
  };

  await pdfParse(buffer, options);

  // Now build chunks from each page's text, tagging with page number
  const allChunks = [];

  pageTexts.forEach((pageText, pageIndex) => {
    const pageNumber = pageIndex + 1; // 1-indexed, human-readable

    if (!pageText || pageText.trim().length === 0) return; // skip blank pages

    const chunks = splitText(pageText, {
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });

    chunks.forEach((chunk) => {
      allChunks.push({
        text: chunk.text,
        metadata: {
          source: filename,
          type: 'pdf',
          page: pageNumber,
          chunkIndex: allChunks.length, // global chunk index across all pages
        },
      });
    });
  });

  return allChunks;
}
