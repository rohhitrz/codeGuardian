/**
 * Tests for CodeParser
 */

import { describe, it, expect } from 'vitest';
import { CodeParser } from './CodeParser';
import { Language } from '../models';

describe('CodeParser', () => {
  const parser = new CodeParser();

  describe('parse', () => {
    it('should split code into lines', () => {
      const code = 'const x = 5;\nconst y = 10;\nconst z = x + y;';
      const result = parser.parse(code, Language.JAVASCRIPT);

      expect(result.raw).toBe(code);
      expect(result.lines).toHaveLength(3);
      expect(result.lines[0]).toBe('const x = 5;');
      expect(result.lines[1]).toBe('const y = 10;');
      expect(result.lines[2]).toBe('const z = x + y;');
    });

    it('should tokenize JavaScript code', () => {
      const code = 'const x = 5;';
      const result = parser.parse(code, Language.JAVASCRIPT);

      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);
      
      // Check for keyword token
      const keywordToken = result.tokens!.find(t => t.type === 'keyword' && t.value === 'const');
      expect(keywordToken).toBeDefined();
      expect(keywordToken!.line).toBe(1);
    });

    it('should tokenize TypeScript code', () => {
      const code = 'function greet(name: string): void {}';
      const result = parser.parse(code, Language.TYPESCRIPT);

      expect(result.tokens).toBeDefined();
      expect(result.tokens!.length).toBeGreaterThan(0);
      
      // Check for function keyword
      const functionToken = result.tokens!.find(t => t.type === 'keyword' && t.value === 'function');
      expect(functionToken).toBeDefined();
    });

    it('should handle empty code', () => {
      const code = '';
      const result = parser.parse(code, Language.JAVASCRIPT);

      expect(result.raw).toBe('');
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0]).toBe('');
    });

    it('should handle malformed code gracefully', () => {
      const code = 'const x = {{{';
      const result = parser.parse(code, Language.JAVASCRIPT);

      expect(result.raw).toBe(code);
      expect(result.lines).toBeDefined();
      expect(result.tokens).toBeDefined();
    });

    it('should preserve empty lines', () => {
      const code = 'const x = 5;\n\nconst y = 10;';
      const result = parser.parse(code, Language.JAVASCRIPT);

      expect(result.lines).toHaveLength(3);
      expect(result.lines[1]).toBe('');
    });

    it('should tokenize strings correctly', () => {
      const code = 'const str = "hello world";';
      const result = parser.parse(code, Language.JAVASCRIPT);

      const stringToken = result.tokens!.find(t => t.type === 'string');
      expect(stringToken).toBeDefined();
      expect(stringToken!.value).toContain('hello world');
    });

    it('should tokenize numbers correctly', () => {
      const code = 'const num = 42;';
      const result = parser.parse(code, Language.JAVASCRIPT);

      const numberToken = result.tokens!.find(t => t.type === 'number' && t.value === '42');
      expect(numberToken).toBeDefined();
    });
  });
});
