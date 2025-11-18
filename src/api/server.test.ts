/**
 * API Server Integration Tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ApiServer } from './server';
import * as http from 'http';

describe('ApiServer', () => {
  let server: ApiServer;
  const port = 3001; // Use different port for testing

  beforeAll(async () => {
    server = new ApiServer(port);
    await server.start();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('POST /api/scan', () => {
    it('should scan valid JavaScript code and return results', async () => {
      const code = `
        const query = "SELECT * FROM users WHERE id = " + userId;
      `;

      const response = await makeRequest('/api/scan', 'POST', {
        code,
        language: 'javascript'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('issues');
      expect(response.body).toHaveProperty('metadata');
      expect(Array.isArray(response.body.issues)).toBe(true);
    });

    it('should scan valid TypeScript code and return results', async () => {
      const code = `
        function displayMessage(msg: string): void {
          document.getElementById('output').innerHTML = msg;
        }
      `;

      const response = await makeRequest('/api/scan', 'POST', {
        code,
        language: 'typescript'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('issues');
    }, 10000);

    it('should return 400 for missing code field', async () => {
      const response = await makeRequest('/api/scan', 'POST', {
        language: 'javascript'
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('code');
    });

    it('should return 400 for empty code', async () => {
      const response = await makeRequest('/api/scan', 'POST', {
        code: '',
        language: 'javascript'
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for missing language field', async () => {
      const response = await makeRequest('/api/scan', 'POST', {
        code: 'const x = 1;'
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('language');
    });

    it('should return 400 for empty language', async () => {
      const response = await makeRequest('/api/scan', 'POST', {
        code: 'const x = 1;',
        language: ''
      });

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for invalid JSON', async () => {
      const response = await makeRawRequest('/api/scan', 'POST', 'invalid json');

      expect(response.statusCode).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle unsupported language gracefully', async () => {
      const response = await makeRequest('/api/scan', 'POST', {
        code: 'print("hello")',
        language: 'python'
      });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const code = 'const x = 1;';
      const requests = [];

      // Make 11 requests (limit is 10 per minute)
      for (let i = 0; i < 11; i++) {
        requests.push(
          makeRequest('/api/scan', 'POST', {
            code,
            language: 'javascript'
          })
        );
      }

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited
      const rateLimited = responses.some(r => r.statusCode === 429);
      expect(rateLimited).toBe(true);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await makeRequest('/health', 'GET');

      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('service');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await makeRequest('/unknown', 'GET');

      expect(response.statusCode).toBe(404);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle OPTIONS requests for CORS', async () => {
      const response = await makeRequest('/api/scan', 'OPTIONS');

      expect(response.statusCode).toBe(204);
    });
  });

  // Helper function to make HTTP requests
  function makeRequest(
    path: string,
    method: string,
    body?: any
  ): Promise<{ statusCode: number; body: any }> {
    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          let parsedBody;
          try {
            parsedBody = data ? JSON.parse(data) : {};
          } catch {
            parsedBody = { raw: data };
          }

          resolve({
            statusCode: res.statusCode || 500,
            body: parsedBody
          });
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  // Helper function to make raw HTTP requests
  function makeRawRequest(
    path: string,
    method: string,
    body: string
  ): Promise<{ statusCode: number; body: any }> {
    return new Promise((resolve, reject) => {
      const options: http.RequestOptions = {
        hostname: 'localhost',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          let parsedBody;
          try {
            parsedBody = data ? JSON.parse(data) : {};
          } catch {
            parsedBody = { raw: data };
          }

          resolve({
            statusCode: res.statusCode || 500,
            body: parsedBody
          });
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
});
