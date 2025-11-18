/**
 * Unit tests for ErrorHandler
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ErrorHandler, ErrorType } from './ErrorHandler';
import { ScanMetadata } from '../models/types';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler(false); // Disable console logging for tests
  });

  describe('handleInputError', () => {
    it('should create error result for input validation failure', () => {
      const error = new Error('Code cannot be empty');
      const result = errorHandler.handleInputError(error);

      expect(result.success).toBe(false);
      expect(result.issues).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0]).toContain('Input validation failed');
      expect(result.errors![0]).toContain('Code cannot be empty');
      expect(result.metadata.language).toBe('unknown');
      expect(result.metadata.linesOfCode).toBe(0);
    });

    it('should log input error to error log', () => {
      const error = new Error('Invalid language');
      errorHandler.handleInputError(error);

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].type).toBe(ErrorType.INPUT_VALIDATION);
      expect(errorLog[0].message).toContain('Input validation failed');
    });
  });

  describe('handleAnalyzerError', () => {
    it('should log analyzer error without returning result', () => {
      const error = new Error('Static analysis failed');
      errorHandler.handleAnalyzerError('static', error);

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].type).toBe(ErrorType.ANALYZER);
      expect(errorLog[0].message).toContain('static analyzer failed');
    });

    it('should include analyzer name in error message', () => {
      const error = new Error('Connection timeout');
      errorHandler.handleAnalyzerError('llm', error);

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog[0].message).toContain('llm analyzer failed');
      expect(errorLog[0].message).toContain('Connection timeout');
    });
  });

  describe('handleSystemError', () => {
    it('should create error result for system failure', () => {
      const error = new Error('Out of memory');
      const result = errorHandler.handleSystemError(error);

      expect(result.success).toBe(false);
      expect(result.issues).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors![0]).toContain('System error');
      expect(result.errors![0]).toContain('Out of memory');
    });

    it('should log system error', () => {
      const error = new Error('Unexpected exception');
      errorHandler.handleSystemError(error);

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].type).toBe(ErrorType.SYSTEM);
    });
  });

  describe('handleParserError', () => {
    it('should create error result with duration', () => {
      const error = new Error('Syntax error at line 5');
      const startTime = Date.now() - 100; // 100ms ago
      const result = errorHandler.handleParserError(error, startTime);

      expect(result.success).toBe(false);
      expect(result.errors![0]).toContain('Code parsing failed');
      expect(result.errors![0]).toContain('Syntax error at line 5');
      expect(result.metadata.duration).toBeGreaterThanOrEqual(100);
    });

    it('should log parser error', () => {
      const error = new Error('Malformed code');
      errorHandler.handleParserError(error, Date.now());

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].type).toBe(ErrorType.PARSER);
    });
  });

  describe('handleTimeoutError', () => {
    it('should return formatted timeout error message', () => {
      const message = errorHandler.handleTimeoutError('llm', 30000);

      expect(message).toContain('llm analyzer timed out');
      expect(message).toContain('30000ms');
    });

    it('should log timeout error', () => {
      errorHandler.handleTimeoutError('static', 5000);

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].type).toBe(ErrorType.TIMEOUT);
    });
  });

  describe('handleNetworkError', () => {
    it('should return formatted network error message', () => {
      const error = new Error('Connection refused');
      const message = errorHandler.handleNetworkError('OpenAI API', error);

      expect(message).toContain('Network error connecting to OpenAI API');
      expect(message).toContain('Connection refused');
    });

    it('should log network error', () => {
      const error = new Error('DNS lookup failed');
      errorHandler.handleNetworkError('LLM Service', error);

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(1);
      expect(errorLog[0].type).toBe(ErrorType.NETWORK);
    });
  });

  describe('formatMultipleErrors', () => {
    it('should create result with multiple error messages', () => {
      const errors = [
        'Static analyzer failed',
        'LLM analyzer timed out',
        'Network connection lost'
      ];
      const metadata: ScanMetadata = {
        timestamp: new Date().toISOString(),
        duration: 5000,
        language: 'javascript',
        linesOfCode: 100,
        analyzersUsed: ['static', 'llm'],
        staticRulesApplied: 5
      };

      const result = errorHandler.formatMultipleErrors(errors, metadata);

      expect(result.success).toBe(false);
      expect(result.issues).toHaveLength(0);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toEqual(errors);
      expect(result.metadata).toEqual(metadata);
    });
  });

  describe('error logging', () => {
    it('should track all errors in error log', () => {
      errorHandler.handleInputError(new Error('Error 1'));
      errorHandler.handleAnalyzerError('static', new Error('Error 2'));
      errorHandler.handleSystemError(new Error('Error 3'));

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog).toHaveLength(3);
    });

    it('should include timestamp in error log entries', () => {
      errorHandler.handleInputError(new Error('Test error'));

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog[0].timestamp).toBeDefined();
      expect(new Date(errorLog[0].timestamp).getTime()).toBeGreaterThan(0);
    });

    it('should sanitize Error objects in details', () => {
      const error = new Error('Test error with stack');
      errorHandler.handleInputError(error);

      const errorLog = errorHandler.getErrorLog();
      expect(errorLog[0].details).toBeDefined();
      expect(errorLog[0].details.name).toBe('Error');
      expect(errorLog[0].details.message).toBe('Test error with stack');
    });
  });

  describe('getErrorCount', () => {
    it('should return total error count', () => {
      errorHandler.handleInputError(new Error('Error 1'));
      errorHandler.handleSystemError(new Error('Error 2'));

      expect(errorHandler.getErrorCount()).toBe(2);
    });

    it('should return error count by type', () => {
      errorHandler.handleInputError(new Error('Error 1'));
      errorHandler.handleInputError(new Error('Error 2'));
      errorHandler.handleSystemError(new Error('Error 3'));

      expect(errorHandler.getErrorCount(ErrorType.INPUT_VALIDATION)).toBe(2);
      expect(errorHandler.getErrorCount(ErrorType.SYSTEM)).toBe(1);
      expect(errorHandler.getErrorCount(ErrorType.ANALYZER)).toBe(0);
    });
  });

  describe('clearErrorLog', () => {
    it('should clear all logged errors', () => {
      errorHandler.handleInputError(new Error('Error 1'));
      errorHandler.handleSystemError(new Error('Error 2'));

      expect(errorHandler.getErrorCount()).toBe(2);

      errorHandler.clearErrorLog();

      expect(errorHandler.getErrorCount()).toBe(0);
      expect(errorHandler.getErrorLog()).toHaveLength(0);
    });
  });

  describe('logging configuration', () => {
    it('should respect enableLogging flag', () => {
      const handlerWithLogging = new ErrorHandler(true);
      const handlerWithoutLogging = new ErrorHandler(false);

      // Both should still log to internal error log
      handlerWithLogging.handleInputError(new Error('Test'));
      handlerWithoutLogging.handleInputError(new Error('Test'));

      expect(handlerWithLogging.getErrorCount()).toBe(1);
      expect(handlerWithoutLogging.getErrorCount()).toBe(1);
    });
  });
});
