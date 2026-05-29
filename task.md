# RAG System — Task Tracker

## Phases Overview

| Phase | What | Status |
|---|---|---|
| **Phase 1** | Backend Foundation (scaffolding, config, utilities) | `[x]` Done ✅ |
| **Phase 2** | Backend Services (embeddings, vectors, PDF, scraper, LLM) | `[x]` Done ✅ |
| **Phase 3** | Backend API Routes (upload, scrape, chat, sources) | `[x]` Done ✅ |
| **Phase 3.5**| Backend Context Isolation (`chatId` filtering) | `[x]` Done ✅ |
| **Phase 4** | Frontend Foundation (Vite + Tailwind + Shadcn setup, layout shell) | `[x]` Done ✅ |
| **Phase 5** | Frontend Components (Sidebar, Chat, Upload, Scrape, Sources) | `[x]` Done ✅ |
| **Phase 6** | API Integration + Chat History + Polish | `[ ]` |
| **Phase 7** | README + Deployment Prep | `[ ]` |

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

## Phase 3: Backend API Routes ← CURRENT

> Wire services into Express routes. Two steps: centralized helpers, then all route handlers at once.

### Micro-Steps

- `[x]` **Step 3.1** — `server/src/utils/response.js` (centralized success/error helpers + `AppError` class) + update `app.js` global error handler
- `[x]` **Step 3.2** — All 4 route files (`upload.js`, `scrape.js`, `chat.js`, `sources.js`) + wire into `app.js`

---

## Phase 3.5: Backend Context Isolation ← CURRENT

> Updating the backend to support ChatGPT-style isolated sessions. Each chat gets a unique `chatId`, and Pinecone searches are filtered so users don't see each other's test data.

### Micro-Steps

- `[x]` **Step 3.5.1** — `server/src/services/vectorService.js` (Add `chatId` to metadata upsert and query filter)
- `[x]` **Step 3.5.2** — `server/src/routes/upload.js` & `scrape.js` (Extract `chatId` from body, pass to services)
- `[x]` **Step 3.5.3** — `server/src/routes/chat.js` (Extract `chatId`, filter Pinecone query)
- `[x]` **Step 3.5.4** — `server/src/services/sourceStore.js` & `sources.js` (Group sources by `chatId`, update `GET` route to fetch by `chatId`)

---

---

## Phase 4: Frontend Foundation ← CURRENT

> Scaffold the React app with Vite, wire up Tailwind CSS + Shadcn UI, and create the
> shell layout that everything else slots into. No real logic yet — just the skeleton.

### Micro-Steps

- `[x]` **Step 4.1** — Scaffold Vite React app inside `client/` + install all deps
- `[x]` **Step 4.2** — Configure `vite.config.js` (Tailwind plugin, `/api` proxy, `@` alias)
- `[x]` **Step 4.3** — Groq-inspired dark design system in `index.css` (CSS variables, animations, prose styles)
- `[x]` **Step 4.4** — Shadcn UI initialized + components installed: `button`, `input`, `textarea`, `badge`, `dialog`, `tabs`, `scroll-area`, `separator`, `tooltip`, `sonner`
- `[x]` **Step 4.5** — `react-router-dom` installed + `jsconfig.json` added for alias resolution

---

## Phase 5: Frontend Components

> Build each UI component in isolation. Each step produces a fully working, styled,
> and wired-up piece. The order goes from the inside (chat messages) outward.

### Micro-Steps

- `[x]` **Step 5.1** — `src/hooks/useChatStore.js` (localStorage persistence = Chat History bonus)
- `[x]` **Step 5.2** — `src/lib/api.js` (centralized API client)
- `[x]` **Step 5.3** — `src/layouts/MainLayout.jsx` (state + send pipeline, sidebar + page)
- `[x]` **Step 5.4** — `src/components/sidebar/Sidebar.jsx` (Shadcn Button, Separator)
  - `[x]` `ChatList.jsx` (Shadcn ScrollArea, Button, cn)
  - `[x]` `SourcePanel.jsx` (Shadcn Badge, Button, ScrollArea, Tooltip, Separator)
- `[x]` **Step 5.5** — `src/components/upload/AddSourceDialog.jsx` (Shadcn Dialog, Tabs, Input, Button, Badge + multi-file PDF)
- `[x]` **Step 5.6** — `src/components/chat/MessageBubble.jsx` (Shadcn Badge, react-markdown)
- `[x]` **Step 5.7** — `src/components/chat/ChatArea.jsx` (Shadcn ScrollArea, typing indicator)
- `[x]` **Step 5.8** — `src/components/chat/ChatInput.jsx` (Shadcn Textarea, Button)
- `[x]` **Step 5.9** — `src/pages/ChatPage.jsx` (thin page — composes ChatArea + ChatInput)

---

## Phase 6: API Integration + Polish

> Wire every component to the real backend, test the full user flow end-to-end,
> then add final polish (loading states, error toasts, animations).

### Micro-Steps

- `[x]` **Step 6.1** — `client/src/lib/api.js` — Centralized API client (done in Phase 5)
- `[x]` **Step 6.2** — `AddSourceDialog` wired to `api.js` (done in Phase 5)
- `[x]` **Step 6.3** — `ChatInput` wired → `api.js` → messages (done in Phase 5)
- `[x]` **Step 6.4** — `SourcePanel` delete wired to `api.js` (done in Phase 5)
- `[x]` **Step 6.5** — `WelcomeScreen` concurrency fix: stale-closure bug fixed, PDF + URL uploads are fully independent parallel operations, per-file error handling (upload continues on single-file failure)
- `[ ]` **Step 6.6** — Final polish:
  - `[ ]` Scroll-to-top when switching chats in `ChatArea`
  - `[ ]` Verify chat history loads correctly on page refresh
  - `[ ]` `npm run build` — zero errors

---

## Phase 7: README + Deployment Prep

- `[ ]` **Step 7.1** — `README.md`: Project overview, architecture diagram, setup guide, API docs, known limitations
- `[ ]` **Step 7.2** — Add `client/.env.example` with `VITE_API_URL` for production deploy
- `[ ]` **Step 7.3** — Verify build: `npm run build` in `client/` — zero errors
- `[ ]` **Step 7.4** — Deploy frontend to Vercel + backend to Render, test cross-origin in production
