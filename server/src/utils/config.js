import dotenv from 'dotenv';
dotenv.config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,

  // Google Gemini
  geminiApiKey: process.env.GEMINI_API_KEY,
  embeddingModel: process.env.EMBEDDING_MODEL || 'gemini-embedding-001',

  // Groq
  groqApiKey: process.env.GROQ_API_KEY,
  llmModel: process.env.LLM_MODEL || 'llama-3.3-70b-versatile',
  llmMaxTokens: parseInt(process.env.LLM_MAX_TOKENS, 10) || 1024,

  // Pinecone
  pineconeApiKey: process.env.PINECONE_API_KEY,
  pineconeIndexName: process.env.PINECONE_INDEX_NAME || 'rag-documents',

  // Chunking
  chunkSize: parseInt(process.env.CHUNK_SIZE, 10) || 1000,
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP, 10) || 200,

  // CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // File upload limits
  maxFileSize: 10 * 1024 * 1024, // 10MB
};

// Validate required keys at startup — fail fast instead of cryptic errors later
const requiredKeys = ['geminiApiKey', 'groqApiKey', 'pineconeApiKey'];
const missing = requiredKeys.filter((key) => !config[key]);
if (missing.length > 0) {
  console.error(
    `Missing required environment variables: ${missing.join(', ')}. Check your .env file.`
  );
  process.exit(1);
}

export default config;
