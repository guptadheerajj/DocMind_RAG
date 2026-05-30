# DocMind RAG

A full-stack Retrieval-Augmented Generation (RAG) application that lets you upload PDFs or scrape URLs and then ask questions grounded in your documents — with inline citations.

**Live Demo:** [docmind-rag.vercel.app](https://doc-mind-rag-fawn.vercel.app/)) · **Backend:** [Render](https://docmind-rag.onrender.com/api/health)

---

## Features

- **Multi-file PDF upload** — drag-and-drop multiple PDFs simultaneously
- **URL scraping** — paste any article or docs URL to index its content
- **Chat-isolated context** — each chat session filters Pinecone by `chatId`; sessions never bleed into each other
- **Inline citations** — AI answers cite source name + page number directly in text, rendered as styled chips
- **Source cards** — each answer shows the exact chunks used, grouped by source
- **Chat history** — persisted in `localStorage` across page refreshes
- **Rate-limit aware** — free-tier Gemini embedding API (100 req/min) is handled with a shared rate limiter + auto-retry on 429
- **Responsive UI** — sidebar collapses to a drawer on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Shadcn UI (Base UI) |
| **Backend** | Node.js, Express |
| **Embeddings** | Google Gemini (`gemini-embedding-001`) |
| **LLM** | Groq (`llama-3.3-70b-versatile`) |
| **Vector DB** | Pinecone |
| **PDF parsing** | `pdf-parse` |
| **Web scraping** | `jsdom` + `@mozilla/readability` |

---

## Architecture

```
User Browser
     │
     ▼
┌──────────────────────────────────────────┐
│  React Frontend (Vite)                   │
│  ┌─────────┐  ┌───────────┐  ┌────────┐ │
│  │ Sidebar │  │ ChatArea  │  │ Input  │ │
│  │ Sources │  │ Messages  │  │        │ │
│  └─────────┘  └───────────┘  └────────┘ │
└─────────────────────┬────────────────────┘
                      │ HTTP (REST)
                      ▼
┌──────────────────────────────────────────┐
│  Express Backend                         │
│  POST /api/upload   → PDF → chunks       │
│  POST /api/scrape   → HTML → chunks      │
│  POST /api/chat     → RAG pipeline       │
│  GET  /api/sources/:chatId               │
│  DELETE /api/sources/:id                 │
└──────┬──────────────┬────────────────────┘
       │              │
       ▼              ▼
┌─────────────┐  ┌─────────────────────────┐
│  Pinecone   │  │  Groq (LLaMA 3.3 70B)  │
│  Vector DB  │  │  Chat Completions       │
│  (filtered  │  │                         │
│  by chatId) │  └─────────────────────────┘
└─────────────┘
       ▲
       │ embed chunks / embed query
       ▼
┌─────────────────────────────────────────┐
│  Google Gemini Embeddings               │
│  gemini-embedding-001  (768 dims)       │
│  Rate-limited: 100 req/min free tier    │
│  → shared RateLimiter + auto-retry 429  │
└─────────────────────────────────────────┘
```

---

## Local Development

### Prerequisites

| Service | Purpose | Free tier |
|---|---|---|
| [Google AI Studio](https://aistudio.google.com/) | Gemini embeddings | ✅ 100 req/min |
| [Groq Console](https://console.groq.com/) | LLM completions | ✅ Generous limits |
| [Pinecone](https://app.pinecone.io/) | Vector database | ✅ 1 free index |

### 1. Clone & install

```bash
git clone https://github.com/guptadheerajj/DocMind_RAG.git
cd DocMind_RAG

# Backend deps
cd server && npm install

# Frontend deps
cd ../client && npm install
```

### 2. Configure environment variables

**Backend** (`server/.env`):
```bash
cp server/.env.example server/.env
# Fill in your API keys
```

**Frontend** (`client/.env`):
```bash
# Only needed for production. In dev, Vite proxies /api → localhost:3001
# Leave empty for local development
VITE_API_URL=
```

### 3. Set up Pinecone

Create a Pinecone index with these settings:
- **Dimensions:** `768`
- **Metric:** `cosine`
- **Index name:** `rag-documents` (or match your `PINECONE_INDEX_NAME`)

### 4. Run

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `server` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

4. Add Environment Variables (all from `server/.env.example`):

```
GEMINI_API_KEY       = ...
GROQ_API_KEY         = ...
PINECONE_API_KEY     = ...
PINECONE_INDEX_NAME  = rag-documents
CLIENT_URL           = https://your-app.vercel.app   ← set AFTER Vercel deploy
PORT                 = 3001
```

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `client` |
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

4. Add Environment Variable:

```
VITE_API_URL = https://your-render-service.onrender.com
```

5. Redeploy after adding the variable.

> **Cross-origin note:** After Vercel gives you the final URL, go back to Render and update `CLIENT_URL` to that Vercel URL so CORS allows your frontend.

---

## API Reference

| Method | Endpoint | Body | Response |
|---|---|---|---|
| `POST` | `/api/upload` | `FormData: file, chatId` | `{ sourceId, filename, chunkCount }` |
| `POST` | `/api/scrape` | `{ url, chatId }` | `{ sourceId, title, url, chunkCount }` |
| `POST` | `/api/chat` | `{ chatId, question }` | `{ answer, sources[] }` |
| `GET` | `/api/sources/:chatId` | — | `{ sources[] }` |
| `DELETE` | `/api/sources/:sourceId` | — | `{ success, message }` |
| `GET` | `/api/health` | — | `{ status: "ok", timestamp }` |

---

## Known Limitations

- **Gemini free tier:** 100 embedding requests/minute. Large PDFs (many chunks) take longer. The UI shows a notice explaining this.
- **Pinecone free tier:** 1 index, ~100k vectors. Suitable for demos.
- **No auth:** Chat isolation is by `chatId` (UUID), not user accounts.
- **In-memory source store:** Source metadata (`sourceStore.js`) lives in server memory — restarts clear it. Pinecone vectors persist but the source list resets. For production, use a database.

---

## Project Structure

```
DocMind_RAG/
├── client/                     # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/           # ChatArea, ChatInput, MessageBubble, WelcomeScreen
│   │   │   ├── sidebar/        # Sidebar, ChatList, SourcePanel
│   │   │   ├── upload/         # AddSourceDialog
│   │   │   └── ui/             # Shadcn UI primitives
│   │   ├── hooks/
│   │   │   └── useChatStore.js # Chat state + localStorage persistence
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx  # Root layout, responsive sidebar
│   │   ├── lib/
│   │   │   └── api.js          # Centralized API client
│   │   └── pages/
│   │       └── ChatPage.jsx    # Main chat page
│   └── vercel.json             # SPA routing
│
└── server/                     # Express backend
    ├── index.js                # Entry point (listen on 0.0.0.0)
    └── src/
        ├── app.js              # Express app, CORS, routes
        ├── routes/             # upload, scrape, chat, sources
        ├── services/
        │   ├── embeddingService.js  # Gemini embeddings + rate limiter
        │   ├── vectorService.js     # Pinecone upsert/query (chatId-scoped)
        │   ├── pdfService.js        # PDF parsing + chunking
        │   ├── scraperService.js    # URL scraping + chunking
        │   ├── llmService.js        # Groq RAG prompt + completion
        │   └── sourceStore.js       # In-memory source registry
        └── utils/
            ├── config.js            # Env var validation
            └── response.js          # AppError helper
```
