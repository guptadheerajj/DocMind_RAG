# Interview Task

## RAG-Based PDF Query System

### Objective

Build a simple RAG application that allows users to upload PDF documents and ask questions based on the uploaded content and a predefined external source.

---

## Requirements

### PDF Upload & Processing

- Upload PDF files.
- Extract text from PDFs.
- Split content into chunks.
- Generate embeddings.
- Store embeddings in a vector database.

### Query System

- Provide a chat interface.
- Accept natural language questions.
- Retrieve relevant content from uploaded PDFs.
- Search relevant information from a predefined source (website, documentation, knowledge base, etc.).

### Response Generation

- Combine PDF results and source results.
- Send context to an LLM.
- Generate an accurate response.
- Display sources used for the answer.

---

## Tech Stack

### Backend

- Node.js
- Express.js

### Frontend

- React.js / Next.js

### AI Components

- OpenRouter (Free Models) / Gemini / Groq
- ChromaDB / Pinecone for vector storage

---

## Expected Workflow

1. Upload PDF.
2. Parse and index content.
3. User asks a question.
4. Retrieve relevant PDF chunks.
5. Search the predefined source.
6. Generate answer using retrieved context.
7. Display answer with source references.

---

## Deliverables

- Working application.
- Source code.
- README with setup instructions.
- Deploy on Vercel.

---

## Bonus (Optional)

- Multiple PDF support.
- Chat history.
- Source citations.
- PDF page references.
- Clean responsive UI.

---

## API Specification

### Ask Question

**Endpoint**

```http
POST /api/chat
```

### Request

```json
{
  "question": "What is RAG?"
}
```

### Response

```json
{
  "answer": "RAG stands for Retrieval Augmented Generation...",
  "sources": [
    "Page 3"
  ]
}
```