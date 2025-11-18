/**
 * Unit tests for ResultAggregator
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ResultAggregator } from './ResultAggregator';
import { AnalyzerResult, VulnerabilityIssue, SeverityLevel } from '../models/types';

describe('ResultAggregator', () => {
  let aggregator: ResultAggregator;
  let consoleWarnSpy: any;

  beforeEach(() => {
    aggregator = new ResultAggregator();
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  describe('aggregate', () => {
    it('should aggregate results from multiple analyzers', () => {
      const staticIssue: VulnerabilityIssue = {
        id: '1',
        title: 'SQL Injection',
        description: 'Potential SQL injection vulnerability',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 5,
        columnEnd: 20,
        fix: 'Use parameterized queries',
        source: 'static'
      };

      const llmIssue: VulnerabilityIssue = {
        id: '2',
        title: 'XSS Vulnerability',
        description: 'Cross-site scripting vulnerability detected',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 15,
        columnStart: 10,
        columnEnd: 30,
        fix: 'Sanitize user input',
        source: 'llm'
      };

      const results: AnalyzerResult[] = [
        {
          source: 'static',
          issues: [staticIssue]
        },
        {
          source: 'llm',
          issues: [llmIssue]
        }
      ];

      const aggregated = aggregator.aggregate(results);

      expect(aggregated).toHaveLength(2);
      expect(aggregated[0]).toEqual(staticIssue);
      expect(aggregated[1]).toEqual(llmIssue);
    });

    it('should preserve source information from analyzer results', () => {
      const issueWithoutSource: VulnerabilityIssue = {
        id: '1',
        title: 'Test Issue',
        description: 'Test description',
        severity: SeverityLevel.MEDIUM,
        owaspCategory: 'A01:2021',
        line: 5,
        columnStart: 0,
        columnEnd: 10,
        fix: 'Fix it',
        source: 'static' // This should be overridden by result.source if missing
      };

      const results: AnalyzerResult[] = [
        {
          source: 'llm',
          issues: [{ ...issueWithoutSource, source: undefined as any }]
        }
      ];

      const aggregated = aggregator.aggregate(results);

      expect(aggregated).toHaveLength(1);
      expect(aggregated[0].source).toBe('llm');
    });

    it('should handle partial failures with one analyzer succeeding', () => {
      const successIssue: VulnerabilityIssue = {
        id: '1',
        title: 'Valid Issue',
        description: 'This analyzer succeeded',
        severity: SeverityLevel.HIGH,
        owaspCategory: 'A03:2021',
        line: 10,
        columnStart: 5,
        columnEnd: 20,
        fix: 'Apply fix',
        source: 'static'
      };

      const results: AnalyzerResult[] = [
        {
          source: 'static',
          issues: [successIssue]
        },
        {
          source: 'llm',
          issues: [],
          errors: ['LLM API timeout', 'Connection failed']
        }
      ];

      const aggregated = aggregator.aggregate(results);

      expect(aggregated).toHaveLength(1);
      expect(aggregated[0]).toEqual(successIssue);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        "Analyzer 'llm' reported errors:",
        ['LLM API timeout', 'Connection failed']
      );
    });

    it('should handle empty results array', () => {
      const results: AnalyzerResult[] = [];
      const aggregated = aggregator.aggregate(results);

      expect(aggregated).toHaveLength(0);
    });

    it('should handle results with no issues', () => {
      const results: AnalyzerResult[] = [
        {
          source: 'static',
          issues: []
        },
        {
          source: 'llm',
          issues: []
        }
      ];

      const aggregated = aggregator.aggregate(results);

      expect(aggregated).toHaveLength(0);
    });

    it('should handle results with invalid issues array', () => {
      const results: AnalyzerResult[] = [
        {
          source: 'static',
          issues: null as any
        },
        {
          source: 'llm',
          issues: undefined as any
        }
      ];

      const aggregated = aggregator.aggregate(results);

      expect(aggregated).toHaveLength(0);
    });
  });

  describe('getErrors', () => {
    it('should collect errors from all analyzer results', () => {
      const results: AnalyzerResult[] = [
        {
          source: 'static',
          issues: [],
          errors: ['Parse error on line 5']
        },
        {
          source: 'llm',
          issues: [],
          errors: ['API timeout', 'Rate limit exceeded']
        }
      ];

      const errors = aggregator.getErrors(results);

      expect(errors).toHaveLength(3);
      expect(errors).toContain('[static] Parse error on line 5');
      expect(errors).toContain('[llm] API timeout');
      expect(errors).toContain('[llm] Rate limit exceeded');
    });

    it('should return empty array when no errors exist', () => {
      const results: AnalyzerResult[] = [
        {
          source: 'static',
          issues: []
        },
        {
          source: 'llm',
          issues: []
        }
      ];

      const errors = aggregator.getErrors(results);

      expect(errors).toHaveLength(0);
    });

    it('should handle results with empty errors array', () => {
      const results: AnalyzerResult[] = [
        {
          source: 'static',
          issues: [],
          errors: []
        }
      ];

      const errors = aggregator.getErrors(results);

      expect(errors).toHaveLength(0);
    });
  });
});
