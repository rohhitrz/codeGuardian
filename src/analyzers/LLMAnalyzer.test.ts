/**
 * Tests for LLMAnalyzer with OpenAI API
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LLMAnalyzer } from './LLMAnalyzer';
import { ParsedCode, SeverityLevel } from '../models/types';

// Mock fetch globally
global.fetch = vi.fn();

// Helper function to create OpenAI-style mock responses
function createMockOpenAIResponse(content: string) {
  return {
    id: 'chatcmpl-test',
    object: 'chat.completion',
    created: 1677652288,
    model: 'gpt-4o-mini',
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content
      },
      finish_reason: 'stop'
    }],
    usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 }
  };
}

describe('LLMAnalyzer', () => {
  let analyzer: LLMAnalyzer;
  const mockApiKey = 'sk-test-key-12345';

  beforeEach(() => {
    process.env.OPENAI_API_KEY = mockApiKey;
    analyzer = new LLMAnalyzer();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should parse valid LLM response with vulnerabilities', async () => {
      const mockResponse = createMockOpenAIResponse(JSON.stringify([
        {
          title: 'SQL Injection Vulnerability',
          description: 'String concatenation in SQL query',
          severity: 'High',
          owaspCategory: 'A03:2021 Injection',
          line: 1,
          fix: 'Use parameterized queries'
        }
      ]));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const code: ParsedCode = {
        raw: 'const query = "SELECT * FROM users WHERE id = " + userId;',
        lines: ['const query = "SELECT * FROM users WHERE id = " + userId;']
      };

      const issues = await analyzer.analyze(code);

      expect(issues).toHaveLength(1);
      expect(issues[0].title).toBe('SQL Injection Vulnerability');
      expect(issues[0].severity).toBe(SeverityLevel.HIGH);
      expect(issues[0].source).toBe('llm');
    });

    it('should handle empty vulnerability array', async () => {
      const mockResponse = createMockOpenAIResponse('[]');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const code: ParsedCode = {
        raw: 'const x = 1;',
        lines: ['const x = 1;']
      };

      const issues = await analyzer.analyze(code);
      expect(issues).toHaveLength(0);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const code: ParsedCode = {
        raw: 'const x = 1;',
        lines: ['const x = 1;']
      };

      const issues = await analyzer.analyze(code);
      expect(issues).toHaveLength(0);
    });

    it('should handle network errors', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const code: ParsedCode = {
        raw: 'const x = 1;',
        lines: ['const x = 1;']
      };

      const issues = await analyzer.analyze(code);
      expect(issues).toHaveLength(0);
    });

    it('should handle missing API key', async () => {
      delete process.env.OPENAI_API_KEY;
      const analyzerNoKey = new LLMAnalyzer();

      const code: ParsedCode = {
        raw: 'const x = 1;',
        lines: ['const x = 1;']
      };

      const issues = await analyzerNoKey.analyze(code);
      expect(issues).toHaveLength(0);
      
      // Restore API key
      process.env.OPENAI_API_KEY = mockApiKey;
    });
  });

  describe('Response Parsing', () => {
    it('should parse markdown code blocks', async () => {
      const mockResponse = createMockOpenAIResponse('```json\n' + JSON.stringify([
        {
          title: 'XSS Vulnerability',
          description: 'Unsafe HTML injection',
          severity: 'High',
          owaspCategory: 'A03:2021 Injection',
          line: 1,
          fix: 'Use textContent'
        }
      ]) + '\n```');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const code: ParsedCode = {
        raw: 'element.innerHTML = userInput;',
        lines: ['element.innerHTML = userInput;']
      };

      const issues = await analyzer.analyze(code);
      expect(issues).toHaveLength(1);
      expect(issues[0].title).toBe('XSS Vulnerability');
    });

    it('should normalize severity levels', async () => {
      const mockResponse = createMockOpenAIResponse(JSON.stringify([
        {
          title: 'Test Critical',
          description: 'Test',
          severity: 'critical',
          owaspCategory: 'A01:2021',
          line: 1,
          fix: 'Fix it'
        },
        {
          title: 'Test Medium',
          description: 'Test',
          severity: 'Medium',
          owaspCategory: 'A02:2021',
          line: 2,
          fix: 'Fix it'
        }
      ]));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const code: ParsedCode = {
        raw: 'line1\nline2',
        lines: ['line1', 'line2']
      };

      const issues = await analyzer.analyze(code);
      expect(issues).toHaveLength(2);
      expect(issues[0].severity).toBe(SeverityLevel.CRITICAL);
      expect(issues[1].severity).toBe(SeverityLevel.MEDIUM);
    });
  });

  describe('Configuration', () => {
    it('should use custom configuration', () => {
      const customAnalyzer = new LLMAnalyzer({
        model: 'gpt-4',
        temperature: 0.5,
        maxTokens: 2048,
        timeout: 5000
      });

      expect(customAnalyzer).toBeDefined();
    });

    it('should allow timeout modification', () => {
      const testAnalyzer = new LLMAnalyzer();
      testAnalyzer.setTimeout(15000);
      expect(testAnalyzer).toBeDefined();
    });
  });
});
