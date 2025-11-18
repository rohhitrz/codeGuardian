/**
 * API Server Example
 * 
 * This example demonstrates how to run the Security Scan Engine as an API server.
 * 
 * Usage:
 *   ts-node examples/api-server.ts
 * 
 * Then make requests to:
 *   POST http://localhost:3000/api/scan
 *   Body: { "code": "...", "language": "javascript" }
 */

import { ApiServer } from '../src/api/server';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new ApiServer(port);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down server...');
    await server.stop();
    console.log('Server stopped');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\nShutting down server...');
    await server.stop();
    console.log('Server stopped');
    process.exit(0);
  });

  // Start server
  await server.start();
  console.log('\nAPI Endpoints:');
  console.log(`  POST http://localhost:${port}/api/scan`);
  console.log(`  GET  http://localhost:${port}/health`);
  console.log('\nExample request:');
  console.log(`  curl -X POST http://localhost:${port}/api/scan \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"code": "const x = 1;", "language": "javascript"}'`);
}

main().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
