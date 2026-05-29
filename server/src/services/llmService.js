import Groq from 'groq-sdk';
import config from '../utils/config.js';

const groq = new Groq({ apiKey: config.groqApiKey });

/**
 * LLM Service — builds a RAG prompt and calls Groq for a grounded answer.
 *
 * RAG Prompt design decisions:
 *
 * 1. SYSTEM PROMPT pins the model to the provided context only.
 *    Without this, LLMs tend to mix their parametric knowledge with the
 *    retrieved context, making citations unreliable.
 *
 * 2. Each context chunk is prefixed with an index [1], [2]... and its source
 *    info (filename + page, or URL). This is what enables the model to say
 *    "according to [1] (report.pdf, Page 3)..." in its answer.
 *
 * 3. Temperature = 0 → deterministic, factual. No creativity needed here.
 *
 * 4. max_tokens = 1024 → caps response length, prevents runaway generation
 *    on open-ended questions.
 *
 * @param {string} question - the user's question
 * @param {Array<{ metadata: { text, source, type, page? } }>} contextChunks
 *   Top-K chunks returned by Pinecone (with metadata attached)
 * @returns {Promise<{ answer: string, sources: Array<{ source, type, page? }> }>}
 */
export async function generateAnswer(question, contextChunks) {
  // Build the numbered context block
  const contextBlock = contextChunks
    .map((match, i) => {
      const meta = match.metadata;
      const sourceLabel =
        meta.type === 'pdf'
          ? `${meta.source}, Page ${meta.page}`
          : meta.source;

      return `[${i + 1}] (source: ${sourceLabel})\n"${meta.text}"`;
    })
    .join('\n\n');

  const systemPrompt = `You are a helpful assistant that answers questions strictly based on the provided context.

Rules:
- Answer ONLY using information from the context below.
- If the context does not contain enough information to answer the question, respond with: "I don't have enough information in the provided sources to answer that."
- Always cite which source(s) you used, referencing them by their [number] label.
- Be concise and precise.`;

  const userMessage = 
  `Context: ${contextBlock}
  Question: ${question}`;

  const completion = await groq.chat.completions.create({
    model: config.llmModel,
    temperature: 0,
    max_tokens: config.llmMaxTokens,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const answer = completion.choices[0]?.message?.content?.trim() ?? 'No response generated.';

  // Deduplicate sources — show each unique source only once in the citations list
  const sourcesMap = new Map();
  for (const { metadata: meta } of contextChunks) {
    // Key by source + page so "report.pdf Page 3" and "report.pdf Page 5" are separate entries
    const key = meta.type === 'pdf' ? `${meta.source}::${meta.page}` : meta.source;
    if (!sourcesMap.has(key)) {
      sourcesMap.set(key, {
        source: meta.source,
        type: meta.type,
        ...(meta.page !== undefined && { page: meta.page }),
      });
    }
  }
  const sources = Array.from(sourcesMap.values());

  return { answer, sources };
}
