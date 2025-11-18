/**
 * Tests for StaticAnalyzer
 */

import { describe, it, expect } from 'vitest';
import { StaticAnalyzer } from './StaticAnalyzer';
import { ParsedCode, SeverityLevel } from '../models/types';

describe('StaticAnalyzer', () => {
  const analyzer = new StaticAnalyzer();

  describe('SQL Injection Detection', () => {
    it('should detect SQL injection with string concatenation', () => {
      const code: ParsedCode = {
        raw: 'const query = "SELECT * FROM users WHERE id = " + userId;',
        lines: ['const query = "SELECT * FROM users WHERE id = " + userId;']
      };

      const issues = analyzer.analyze(code);
      
      expect(issues.length).toBeGreaterThan(0);
      const sqlIssue = issues.find(i => i.title === 'SQL Injection');
      expect(sqlIssue).toBeDefined();
      expect(sqlIssue?.severity).toBe(SeverityLevel.HIGH);
      expect(sqlIssue?.owaspCategory).toBe('A03:2021 - Injection');
    });

    it('should detect SQL injection with INSERT statement', () => {
      const code: ParsedCode = {
        raw: 'db.query("INSERT INTO users VALUES (" + name + ")");',
        lines: ['db.query("INSERT INTO users VALUES (" + name + ")");']
      };

      const issues = analyzer.analyze(code);
      const sqlIssue = issues.find(i => i.title === 'SQL Injection');
      expect(sqlIssue).toBeDefined();
    });
  });

  describe('XSS Detection', () => {
    it('should detect XSS with innerHTML', () => {
      const code: ParsedCode = {
        raw: 'element.innerHTML = userInput;',
        lines: ['element.innerHTML = userInput;']
      };

      const issues = analyzer.analyze(code);
      const xssIssue = issues.find(i => i.title === 'Cross-Site Scripting (XSS)');
      expect(xssIssue).toBeDefined();
      expect(xssIssue?.severity).toBe(SeverityLevel.HIGH);
      expect(xssIssue?.owaspCategory).toBe('A03:2021 - Injection');
    });

    it('should detect XSS with dangerouslySetInnerHTML', () => {
      const code: ParsedCode = {
        raw: '<div dangerouslySetInnerHTML={{__html: content}} />',
        lines: ['<div dangerouslySetInnerHTML={{__html: content}} />']
      };

      const issues = analyzer.analyze(code);
      const xssIssue = issues.find(i => i.title === 'Cross-Site Scripting (XSS)');
      expect(xssIssue).toBeDefined();
    });

    it('should detect XSS with document.write', () => {
      const code: ParsedCode = {
        raw: 'document.write(userContent);',
        lines: ['document.write(userContent);']
      };

      const issues = analyzer.analyze(code);
      const xssIssue = issues.find(i => i.title === 'Cross-Site Scripting (XSS)');
      expect(xssIssue).toBeDefined();
    });
  });

  describe('Hardcoded Credentials Detection', () => {
    it('should detect hardcoded password', () => {
      const code: ParsedCode = {
        raw: 'const password = "MySecretPass123";',
        lines: ['const password = "MySecretPass123";']
      };

      const issues = analyzer.analyze(code);
      const credIssue = issues.find(i => i.title === 'Hardcoded Credentials');
      expect(credIssue).toBeDefined();
      expect(credIssue?.severity).toBe(SeverityLevel.HIGH);
      expect(credIssue?.owaspCategory).toBe('A07:2021 - Identification and Authentication Failures');
    });

    it('should detect hardcoded API key', () => {
      const code: ParsedCode = {
        raw: 'const apiKey = "sk-1234567890abcdef";',
        lines: ['const apiKey = "sk-1234567890abcdef";']
      };

      const issues = analyzer.analyze(code);
      const credIssue = issues.find(i => i.title === 'Hardcoded Credentials');
      expect(credIssue).toBeDefined();
    });

    it('should detect hardcoded secret', () => {
      const code: ParsedCode = {
        raw: 'const secret = "my-secret-key-12345";',
        lines: ['const secret = "my-secret-key-12345";']
      };

      const issues = analyzer.analyze(code);
      const credIssue = issues.find(i => i.title === 'Hardcoded Credentials');
      expect(credIssue).toBeDefined();
    });
  });

  describe('Insecure Cryptography Detection', () => {
    it('should detect MD5 usage', () => {
      const code: ParsedCode = {
        raw: 'const hash = crypto.createHash("md5").update(data).digest("hex");',
        lines: ['const hash = crypto.createHash("md5").update(data).digest("hex");']
      };

      const issues = analyzer.analyze(code);
      const cryptoIssue = issues.find(i => i.title === 'Insecure Cryptography');
      expect(cryptoIssue).toBeDefined();
      expect(cryptoIssue?.severity).toBe(SeverityLevel.HIGH);
      expect(cryptoIssue?.owaspCategory).toBe('A02:2021 - Cryptographic Failures');
    });

    it('should detect SHA1 usage', () => {
      const code: ParsedCode = {
        raw: 'const hash = crypto.createHash("sha1");',
        lines: ['const hash = crypto.createHash("sha1");']
      };

      const issues = analyzer.analyze(code);
      const cryptoIssue = issues.find(i => i.title === 'Insecure Cryptography');
      expect(cryptoIssue).toBeDefined();
    });

    it('should detect DES algorithm', () => {
      const code: ParsedCode = {
        raw: 'const cipher = crypto.createCipher("DES", key);',
        lines: ['const cipher = crypto.createCipher("DES", key);']
      };

      const issues = analyzer.analyze(code);
      const cryptoIssue = issues.find(i => i.title === 'Insecure Cryptography');
      expect(cryptoIssue).toBeDefined();
    });
  });

  describe('Position Tracking', () => {
    it('should track line numbers correctly', () => {
      const code: ParsedCode = {
        raw: 'line1\nconst password = "secret123";\nline3',
        lines: ['line1', 'const password = "secret123";', 'line3']
      };

      const issues = analyzer.analyze(code);
      const credIssue = issues.find(i => i.title === 'Hardcoded Credentials');
      expect(credIssue?.line).toBe(2);
    });

    it('should track column positions', () => {
      const code: ParsedCode = {
        raw: 'const password = "secret123";',
        lines: ['const password = "secret123";']
      };

      const issues = analyzer.analyze(code);
      const credIssue = issues.find(i => i.title === 'Hardcoded Credentials');
      expect(credIssue?.columnStart).toBeGreaterThanOrEqual(0);
      expect(credIssue?.columnEnd).toBeGreaterThan(credIssue?.columnStart || 0);
    });

    it('should include code snippet', () => {
      const code: ParsedCode = {
        raw: 'element.innerHTML = userInput;',
        lines: ['element.innerHTML = userInput;']
      };

      const issues = analyzer.analyze(code);
      const xssIssue = issues.find(i => i.title === 'Cross-Site Scripting (XSS)');
      expect(xssIssue?.codeSnippet).toBe('element.innerHTML = userInput;');
    });
  });

  describe('Multiple Issues', () => {
    it('should detect multiple issues in the same code', () => {
      const code: ParsedCode = {
        raw: 'const password = "secret123";\nconst hash = crypto.createHash("md5");',
        lines: [
          'const password = "secret123";',
          'const hash = crypto.createHash("md5");'
        ]
      };

      const issues = analyzer.analyze(code);
      expect(issues.length).toBeGreaterThanOrEqual(2);
      expect(issues.some(i => i.title === 'Hardcoded Credentials')).toBe(true);
      expect(issues.some(i => i.title === 'Insecure Cryptography')).toBe(true);
    });
  });

  describe('False Positive Scenarios', () => {
    it('should not flag safe SQL queries without concatenation', () => {
      const code: ParsedCode = {
        raw: 'const query = "SELECT * FROM users WHERE id = ?";',
        lines: ['const query = "SELECT * FROM users WHERE id = ?";']
      };

      const issues = analyzer.analyze(code);
      const sqlIssue = issues.find(i => i.title === 'SQL Injection');
      expect(sqlIssue).toBeUndefined();
    });

    it('should not flag textContent as XSS', () => {
      const code: ParsedCode = {
        raw: 'element.textContent = userInput;',
        lines: ['element.textContent = userInput;']
      };

      const issues = analyzer.analyze(code);
      const xssIssue = issues.find(i => i.title === 'Cross-Site Scripting (XSS)');
      expect(xssIssue).toBeUndefined();
    });

    it('should not flag short string assignments as credentials', () => {
      const code: ParsedCode = {
        raw: 'const password = "short";',
        lines: ['const password = "short";']
      };

      const issues = analyzer.analyze(code);
      const credIssue = issues.find(i => i.title === 'Hardcoded Credentials');
      expect(credIssue).toBeUndefined();
    });

    it('should not flag secure hash algorithms', () => {
      const code: ParsedCode = {
        raw: 'const hash = crypto.createHash("sha256").update(data).digest("hex");',
        lines: ['const hash = crypto.createHash("sha256").update(data).digest("hex");']
      };

      const issues = analyzer.analyze(code);
      const cryptoIssue = issues.find(i => i.title === 'Insecure Cryptography');
      expect(cryptoIssue).toBeUndefined();
    });

    it('should not flag comments containing security keywords', () => {
      const code: ParsedCode = {
        raw: '// This is a comment about password validation',
        lines: ['// This is a comment about password validation']
      };

      const issues = analyzer.analyze(code);
      expect(issues.length).toBe(0);
    });

    it('should not flag variable names without assignments', () => {
      const code: ParsedCode = {
        raw: 'function validatePassword(password) { return true; }',
        lines: ['function validatePassword(password) { return true; }']
      };

      const issues = analyzer.analyze(code);
      const credIssue = issues.find(i => i.title === 'Hardcoded Credentials');
      expect(credIssue).toBeUndefined();
    });
  });

  describe('Rule Count', () => {
    it('should have 4 rules loaded', () => {
      expect(analyzer.getRuleCount()).toBe(4);
    });
  });
});
