# RAG System — Task Tracker

## Phases Overview

| Phase | What | Status |
|---|---|---|
| **Phase 1** | Backend Foundation (scaffolding, config, utilities) | `[x]` Done ✅ |
| **Phase 2** | Backend Services (embeddings, vectors, PDF, scraper, LLM) | `[x]` Done ✅ |
| **Phase 3** | Backend API Routes (upload, scrape, chat, sources) | `[ ]` |
| **Phase 4** | Frontend Foundation (Vite scaffolding, design system, layout) | `[ ]` |
| **Phase 5** | Frontend Components + Integration + README | `[ ]` |

---

## Phase 1: Backend Foundation ← CURRENT

> The base everything depends on. No services, no routes — just a running Express server with config, utilities, and middleware ready.

### Micro-Steps

- `[x]` **Step 1.1** — `server/package.json` + install deps + `server/.env.example`
- `[x]` **Step 1.2** — `server/src/utils/config.js` (centralized env config)
- `[x]` **Step 1.3** — `server/src/app.js` (Express app: helmet, cors, json, error handler)
- `[x]` **Step 1.4** — `server/index.js` (entry point with `app.listen`) → **server boots** ✅
- `[x]` **Step 1.5** — `server/src/utils/chunker.js` (recursive text splitter) ✅
- `[x]` **Step 1.6** — `server/src/services/sourceStore.js` (in-memory Map) ✅
- `[x]` **Step 1.7** — `server/src/middleware/validateUrl.js` (SSRF protection) ✅

---

## Phase 2: Backend Services ← CURRENT

> The core intelligence layer: embeddings, vector DB, PDF parsing, web scraping, and LLM.

### Micro-Steps

- `[x]` **Step 2.1** — `server/src/services/embeddingService.js` (Gemini embeddings, batched + rate-limited)
- `[x]` **Step 2.2** — `server/src/services/vectorService.js` (Pinecone upsert / query / delete)
- `[x]` **Step 2.3** — `server/src/services/pdfService.js` (per-page PDF text extraction + chunking)
- `[x]` **Step 2.4** — `server/src/services/scraperService.js` (URL fetch + Readability.js + Cheerio fallback + chunking)
- `[x]` **Step 2.5** — `server/src/services/llmService.js` (Groq chat completion + RAG prompt builder)

---

## Phase 3–5: Will be broken into micro-steps when we reach them.
