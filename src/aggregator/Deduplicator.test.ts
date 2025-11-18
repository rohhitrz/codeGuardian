/**
 * Unit tests for Deduplicator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Deduplicator } from './Deduplicator';
import { VulnerabilityIssue, SeverityLevel } from '../models/types';

describe('Deduplicator', () => {
  let deduplicator: Deduplicator;

  beforeEach(() => {
    deduplicator = new Deduplicator();
  });

  describe('deduplicate', () => {
    it('should remove duplicate issues with same line and OWASP category', () => {
      const issue1: VulnerabilityIssue = {
        id: '1',
        title: 'SQL Injection Vulnerability',
        description: 'Static analysis found SQL injection',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 5,
        columnEnd: 20,
        fix: 'Use parameterized queries',
        source: 'static'
      };

      const issue2: VulnerabilityIssue = {
        id: '2',
        title: 'SQL Injection Vulnerability',
        description: 'LLM detected SQL injection with detailed context',
        severity: SeverityLevel.CRITICAL,
        owaspCategory: 'A03:2021 - Injection',
        line: 10,
        columnStart: 5,
        columnEnd: 20,
        fix: 'Use prepared statements with parameterized queries',
        source: 'llm'
      };

      const issues = [issue1, issue2];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].source).toBe('merged');
      expect(deduplicated[0].severity).toBe(SeverityLevel.CRITICAL);
    });

    it('should prefer LLM explanations when merging duplicates', () => {
      const staticIssue: VulnerabilityIssue = {
        id: '1',
        title: 'XSS Vulnerability',
        description: 'Short description',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 15,
        columnStart: 10,
        columnEnd: 30,
        fix: 'Sanitize input',
        source: 'static'
      };

      const llmIssue: VulnerabilityIssue = {
        id: '2',
        title: 'XSS Vulnerability',
        description: 'Detailed LLM explanation of the XSS vulnerability with context',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 15,
        columnStart: 10,
        columnEnd: 30,
        fix: 'Sanitize and encode all user input before rendering',
        source: 'llm'
      };

      const issues = [staticIssue, llmIssue];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].title).toBe(llmIssue.title);
      expect(deduplicated[0].description).toBe(llmIssue.description);
      expect(deduplicated[0].fix).toBe(llmIssue.fix);
    });

    it('should handle line number tolerance (±1 line)', () => {
      const issue1: VulnerabilityIssue = {
        id: '1',
        title: 'Hardcoded Credentials',
        description: 'API key found',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A07:2021',
        line: 20,
        columnStart: 0,
        columnEnd: 50,
        fix: 'Use environment variables',
        source: 'static'
      };

      const issue2: VulnerabilityIssue = {
        id: '2',
        title: 'Hardcoded Credentials',
        description: 'Sensitive credentials detected',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A07:2021',
        line: 21, // Within ±1 tolerance
        columnStart: 0,
        columnEnd: 50,
        fix: 'Store secrets in secure vault',
        source: 'llm'
      };

      const issues = [issue1, issue2];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].source).toBe('merged');
    });

    it('should not deduplicate issues beyond line tolerance', () => {
      const issue1: VulnerabilityIssue = {
        id: '1',
        title: 'SQL Injection',
        description: 'First issue',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix 1',
        source: 'static'
      };

      const issue2: VulnerabilityIssue = {
        id: '2',
        title: 'SQL Injection',
        description: 'Second issue',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 13, // Beyond ±1 tolerance
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix 2',
        source: 'llm'
      };

      const issues = [issue1, issue2];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(2);
    });

    it('should not deduplicate issues with different OWASP categories', () => {
      const issue1: VulnerabilityIssue = {
        id: '1',
        title: 'Security Issue',
        description: 'SQL injection',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix SQL',
        source: 'static'
      };

      const issue2: VulnerabilityIssue = {
        id: '2',
        title: 'Security Issue',
        description: 'Crypto failure',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A02:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix crypto',
        source: 'llm'
      };

      const issues = [issue1, issue2];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(2);
    });

    it('should handle empty issues array', () => {
      const issues: VulnerabilityIssue[] = [];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(0);
    });

    it('should handle single issue without duplicates', () => {
      const issue: VulnerabilityIssue = {
        id: '1',
        title: 'Single Issue',
        description: 'Only one issue',
        severity: SeverityLevel.MEDIUM,
        owaspCategory: 'A01:2021',
        line: 5,
        columnStart: 0,
        columnEnd: 10,
        fix: 'Apply fix',
        source: 'static'
      };

      const issues = [issue];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0]).toEqual(issue);
    });

    it('should handle all duplicates scenario', () => {
      const baseIssue: VulnerabilityIssue = {
        id: '1',
        title: 'XSS Vulnerability',
        description: 'Short',
        severity: SeverityLevel.MEDIUM,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix',
        source: 'static'
      };

      const duplicate1: VulnerabilityIssue = {
        ...baseIssue,
        id: '2',
        description: 'Medium length description',
        severity: SeverityLevel.HIGH,
        source: 'llm'
      };

      const duplicate2: VulnerabilityIssue = {
        ...baseIssue,
        id: '3',
        description: 'Very detailed and comprehensive description of the issue',
        severity: SeverityLevel.CRITICAL,
        fix: 'Comprehensive fix with multiple steps',
        line: 11 // Within tolerance
      };

      const issues = [baseIssue, duplicate1, duplicate2];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].severity).toBe(SeverityLevel.CRITICAL);
      expect(deduplicated[0].description).toBe(duplicate2.description);
      expect(deduplicated[0].fix).toBe(duplicate2.fix);
    });

    it('should use highest severity when merging duplicates', () => {
      const lowSeverity: VulnerabilityIssue = {
        id: '1',
        title: 'Issue',
        description: 'Desc',
        severity: SeverityLevel.LOW,
        owaspCategory: 'A01:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 10,
        fix: 'Fix',
        source: 'static'
      };

      const criticalSeverity: VulnerabilityIssue = {
        ...lowSeverity,
        id: '2',
        severity: SeverityLevel.CRITICAL,
        source: 'llm'
      };

      const mediumSeverity: VulnerabilityIssue = {
        ...lowSeverity,
        id: '3',
        severity: SeverityLevel.MEDIUM
      };

      const issues = [lowSeverity, mediumSeverity, criticalSeverity];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(1);
      expect(deduplicated[0].severity).toBe(SeverityLevel.CRITICAL);
    });

    it('should handle fuzzy title matching', () => {
      const issue1: VulnerabilityIssue = {
        id: '1',
        title: 'SQL Injection Vulnerability Detected',
        description: 'First',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix 1',
        source: 'static'
      };

      const issue2: VulnerabilityIssue = {
        id: '2',
        title: 'SQL Injection Vulnerability Found',
        description: 'Second',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix 2',
        source: 'llm'
      };

      const issues = [issue1, issue2];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(1);
    });

    it('should not deduplicate issues with very different titles', () => {
      const issue1: VulnerabilityIssue = {
        id: '1',
        title: 'SQL Injection',
        description: 'Desc',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix',
        source: 'static'
      };

      const issue2: VulnerabilityIssue = {
        id: '2',
        title: 'Completely Different Issue Type',
        description: 'Desc',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix',
        source: 'llm'
      };

      const issues = [issue1, issue2];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(2);
    });

    it('should normalize OWASP categories for comparison', () => {
      const issue1: VulnerabilityIssue = {
        id: '1',
        title: 'Issue',
        description: 'Desc',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix',
        source: 'static'
      };

      const issue2: VulnerabilityIssue = {
        id: '2',
        title: 'Issue',
        description: 'Desc',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021 - Injection',
        line: 10,
        columnStart: 0,
        columnEnd: 20,
        fix: 'Fix',
        source: 'llm'
      };

      const issues = [issue1, issue2];
      const deduplicated = deduplicator.deduplicate(issues);

      expect(deduplicated).toHaveLength(1);
    });
  });
});
