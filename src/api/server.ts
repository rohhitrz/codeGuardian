/**
 * API Server for Security Scan Engine
 * Provides REST endpoints for code security scanning
 */

import * as http from 'http';
import { SecurityScanEngine } from '../scanner/SecurityScanEngine';
import { ScanResult } from '../models/types';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Simple in-memory rate limiter
 */
class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { windowMs: 60000, maxRequests: 10 }) {
    this.config = config;
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    if (!entry || now > entry.resetTime) {
      // New window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.config.windowMs
      });
      return true;
    }

    if (entry.count < this.config.maxRequests) {
      entry.count++;
      return true;
    }

    return false;
  }

  /**
   * Get remaining requests for identifier
   */
  getRemaining(identifier: string): number {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() > entry.resetTime) {
      return this.config.maxRequests;
    }
    return Math.max(0, this.config.maxRequests - entry.count);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

/**
 * API Server class
 */
export class ApiServer {
  private server: http.Server;
  private scanner: SecurityScanEngine;
  private rateLimiter: RateLimiter;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.scanner = new SecurityScanEngine();
    this.rateLimiter = new RateLimiter();
    this.server = http.createServer(this.handleRequest.bind(this));
  }

  /**
   * Start the server
   */
  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`Security Scan API server listening on port ${this.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the server
   */
  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Handle incoming HTTP requests
   */
  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle OPTIONS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Route handling
    if (req.url === '/api/scan' && req.method === 'POST') {
      await this.handleScanRequest(req, res);
    } else if (req.url === '/health' && req.method === 'GET') {
      this.handleHealthCheck(req, res);
    } else {
      this.sendError(res, 404, 'Not Found');
    }
  }

  /**
   * Handle scan requests
   */
  private async handleScanRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    try {
      // Rate limiting
      const clientIp = req.socket.remoteAddress || 'unknown';
      if (!this.rateLimiter.isAllowed(clientIp)) {
        const remaining = this.rateLimiter.getRemaining(clientIp);
        res.setHeader('X-RateLimit-Remaining', remaining.toString());
        this.sendError(res, 429, 'Too Many Requests');
        return;
      }

      // Parse request body
      let body;
      try {
        body = await this.parseBody(req);
      } catch (error) {
        this.sendError(res, 400, 'Invalid JSON in request body');
        return;
      }
      
      // Validate request
      const validation = this.validateScanRequest(body);
      if (!validation.valid) {
        this.sendError(res, 400, validation.error || 'Invalid request');
        return;
      }

      // Perform scan
      const { code, language } = body;
      const result: ScanResult = await this.scanner.scan(code, language);

      // Send response
      this.sendJson(res, 200, result);

    } catch (error) {
      console.error('Error handling scan request:', error);
      this.sendError(
        res,
        500,
        'Internal Server Error',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  /**
   * Handle health check requests
   */
  private handleHealthCheck(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): void {
    this.sendJson(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'security-scan-engine'
    });
  }

  /**
   * Parse request body
   */
  private parseBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';
      
      req.on('data', (chunk) => {
        body += chunk.toString();
        // Prevent large payloads
        if (body.length > 1e6) {
          req.socket.destroy();
          reject(new Error('Request body too large'));
        }
      });

      req.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Invalid JSON'));
        }
      });

      req.on('error', reject);
    });
  }

  /**
   * Validate scan request body
   */
  private validateScanRequest(body: any): { valid: boolean; error?: string } {
    if (!body) {
      return { valid: false, error: 'Request body is required' };
    }

    if (!body.code || typeof body.code !== 'string') {
      return { valid: false, error: 'Field "code" is required and must be a string' };
    }

    if (body.code.trim().length === 0) {
      return { valid: false, error: 'Field "code" cannot be empty' };
    }

    if (!body.language || typeof body.language !== 'string') {
      return { valid: false, error: 'Field "language" is required and must be a string' };
    }

    if (body.language.trim().length === 0) {
      return { valid: false, error: 'Field "language" cannot be empty' };
    }

    return { valid: true };
  }

  /**
   * Send JSON response
   */
  private sendJson(res: http.ServerResponse, statusCode: number, data: any): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }

  /**
   * Send error response
   */
  private sendError(
    res: http.ServerResponse,
    statusCode: number,
    message: string,
    details?: string
  ): void {
    const error: any = {
      error: message,
      statusCode
    };

    if (details) {
      error.details = details;
    }

    this.sendJson(res, statusCode, error);
  }
}

// Export for use in other modules
export default ApiServer;
