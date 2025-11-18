/**
 * Tests for Formatter class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Formatter } from './Formatter';
import {
  VulnerabilityIssue,
  ScanMetadata,
  SeverityLevel
} from '../models';

describe('Formatter', () => {
  let formatter: Formatter;

  beforeEach(() => {
    formatter = new Formatter();
  });

  describe('format', () => {
    it('should format issues and metadata into ScanResult', () => {
      const issues: VulnerabilityIssue[] = [
        {
          id: 'test-1',
          title: 'SQL Injection',
          description: 'Potential SQL injection vulnerability',
          severity: SeverityLevel.HIGH,
          owaspCategory: 'A03:2021',
          line: 10,
          columnStart: 5,
          columnEnd: 20,
          fix: 'Use parameterized queries',
          source: 'static'
        }
      ];

      const metadata: ScanMetadata = {
        timestamp: '2024-01-01T00:00:00.000Z',
        duration: 1000,
        language: 'javascript',
        linesOfCode: 100,
        analyzersUsed: ['static', 'llm'],
        staticRulesApplied: 5
      };

      const result = formatter.format(issues, metadata);

      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].title).toBe('SQL Injection');
      expect(result.metadata.timestamp).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should sort issues by severity (Critical → Info)', () => {
      const issues: VulnerabilityIssue[] = [
        {
          id: 'test-1',
          title: 'Low Issue',
          description: 'Low severity',
          severity: SeverityLevel.LOW,
          owaspCategory: 'A01:2021',
          line: 5,
          columnStart: 0,
          columnEnd: 10,
          fix: 'Fix it',
          source: 'static'
        },
        {
          id: 'test-2',
          title: 'Critical Issue',
          description: 'Critical severity',
          severity: SeverityLevel.CRITICAL,
          owaspCategory: 'A02:2021',
          line: 10,
          columnStart: 0,
          columnEnd: 10,
          fix: 'Fix it',
          source: 'static'
        },
        {
          id: 'test-3',
          title: 'High Issue',
          description: 'High severity',
          severity: SeverityLevel.HIGH,
          owaspCategory: 'A03:2021',
          line: 15,
          columnStart: 0,
          columnEnd: 10,
          fix: 'Fix it',
          source: 'static'
        }
      ];

      const metadata: ScanMetadata = {
        timestamp: '2024-01-01T00:00:00.000Z',
        duration: 1000,
        language: 'javascript',
        linesOfCode: 100,
        analyzersUsed: ['static'],
        staticRulesApplied: 3
      };

      const result = formatter.format(issues, metadata);

      expect(result.issues[0].severity).toBe(SeverityLevel.CRITICAL);
      expect(result.issues[1].severity).toBe(SeverityLevel.HIGH);
      expect(result.issues[2].severity).toBe(SeverityLevel.LOW);
    });

    it('should sort issues by line number when severity is the same', () => {
      const issues: VulnerabilityIssue[] = [
        {
          id: 'test-1',
          title: 'Issue at line 20',
          description: 'High severity',
          severity: SeverityLevel.HIGH,
          owaspCategory: 'A01:2021',
          line: 20,
          columnStart: 0,
          columnEnd: 10,
          fix: 'Fix it',
          source: 'static'
        },
        {
          id: 'test-2',
          title: 'Issue at line 10',
          description: 'High severity',
          severity: SeverityLevel.HIGH,
          owaspCategory: 'A02:2021',
          line: 10,
          columnStart: 0,
          columnEnd: 10,
          fix: 'Fix it',
          source: 'static'
        }
      ];

      const metadata: ScanMetadata = {
        timestamp: '2024-01-01T00:00:00.000Z',
        duration: 1000,
        language: 'javascript',
        linesOfCode: 100,
        analyzersUsed: ['static'],
        staticRulesApplied: 2
      };

      const result = formatter.format(issues, metadata);

      expect(result.issues[0].line).toBe(10);
      expect(result.issues[1].line).toBe(20);
    });

    it('should generate unique IDs for issues without IDs', () => {
      const issues: VulnerabilityIssue[] = [
        {
          id: '',
          title: 'Issue without ID',
          description: 'Test',
          severity: SeverityLevel.MEDIUM,
          owaspCategory: 'A01:2021',
          line: 5,
          columnStart: 0,
          columnEnd: 10,
          fix: 'Fix it',
          source: 'static'
        }
      ];

      const metadata: ScanMetadata = {
        timestamp: '2024-01-01T00:00:00.000Z',
        duration: 1000,
        language: 'javascript',
        linesOfCode: 100,
        analyzersUsed: ['static'],
        staticRulesApplied: 1
      };

      const result = formatter.format(issues, metadata);

      expect(result.issues[0].id).toBeTruthy();
      expect(result.issues[0].id).toContain('MED');
      expect(result.issues[0].id).toContain('5');
    });

    it('should ensure all required fields are present', () => {
      const issues: VulnerabilityIssue[] = [
        {
          id: 'test-1',
          title: 'Test Issue',
          description: 'Test description',
          severity: SeverityLevel.HIGH,
          owaspCategory: 'A01:2021',
          line: 10,
          columnStart: 5,
          columnEnd: 20,
          fix: 'Fix recommendation',
          source: 'static'
        }
      ];

      const metadata: ScanMetadata = {
        timestamp: '2024-01-01T00:00:00.000Z',
        duration: 1000,
        language: 'javascript',
        linesOfCode: 100,
        analyzersUsed: ['static'],
        staticRulesApplied: 1
      };

      const result = formatter.format(issues, metadata);

      const issue = result.issues[0];
      expect(issue.id).toBeDefined();
      expect(issue.title).toBeDefined();
      expect(issue.description).toBeDefined();
      expect(issue.severity).toBeDefined();
      expect(issue.owaspCategory).toBeDefined();
      expect(issue.line).toBeDefined();
      expect(issue.columnStart).toBeDefined();
      expect(issue.columnEnd).toBeDefined();
      expect(issue.fix).toBeDefined();
      expect(issue.source).toBeDefined();
    });

    it('should include optional codeSnippet when present', () => {
      const issues: VulnerabilityIssue[] = [
        {
          id: 'test-1',
          title: 'Test Issue',
          description: 'Test',
          severity: SeverityLevel.HIGH,
          owaspCategory: 'A01:2021',
          line: 10,
          columnStart: 0,
          columnEnd: 10,
          fix: 'Fix it',
          source: 'static',
          codeSnippet: 'const password = "secret";'
        }
      ];

      const metadata: ScanMetadata = {
        timestamp: '2024-01-01T00:00:00.000Z',
        duration: 1000,
        language: 'javascript',
        linesOfCode: 100,
        analyzersUsed: ['static'],
        staticRulesApplied: 1
      };

      const result = formatter.format(issues, metadata);

      expect(result.issues[0].codeSnippet).toBe('const password = "secret";');
    });

    it('should handle empty issues array', () => {
      const issues: VulnerabilityIssue[] = [];

      const metadata: ScanMetadata = {
        timestamp: '2024-01-01T00:00:00.000Z',
        duration: 500,
        language: 'typescript',
        linesOfCode: 50,
        analyzersUsed: ['static'],
        staticRulesApplied: 0
      };

      const result = formatter.format(issues, metadata);

      expect(result.success).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.metadata).toEqual(metadata);
    });

    it('should include optional llmModel in metadata when present', () => {
      const issues: VulnerabilityIssue[] = [];

      const metadata: ScanMetadata = {
        timestamp: '2024-01-01T00:00:00.000Z',
        duration: 1000,
        language: 'javascript',
        linesOfCode: 100,
        analyzersUsed: ['static', 'llm'],
        staticRulesApplied: 5,
        llmModel: 'gpt-4'
      };

      const result = formatter.format(issues, metadata);

      expect(result.metadata.llmModel).toBe('gpt-4');
    });
  });
});
