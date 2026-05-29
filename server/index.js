import app from './src/app.js';
import config from './src/utils/config.js';

const PORT = config.port;
const HOST = '0.0.0.0'; // Must bind to all interfaces on Render/cloud
const server = app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log(`Health check: http://${HOST}:${PORT}/api/health`);
});
// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});
 