/**
 * ErrorHandler - Centralized error handling utility for Security Scan Engine
 * Provides consistent error logging and ScanResult formatting for different error types
 */

import { ScanResult, ScanMetadata } from '../models/types';
import { IErrorHandler } from '../models/interfaces';

/**
 * Error type categories for classification
 */
export enum ErrorType {
  INPUT_VALIDATION = 'INPUT_VALIDATION',
  PARSER = 'PARSER',
  ANALYZER = 'ANALYZER',
  SYSTEM = 'SYSTEM',
  TIMEOUT = 'TIMEOUT',
  NETWORK = 'NETWORK'
}

/**
 * ErrorHandler provides centralized error handling with logging and formatting
 */
export class ErrorHandler implements IErrorHandler {
  private errorLog: Array<{ timestamp: string; type: string; message: string; details?: any }> = [];
  private enableLogging: boolean;

  constructor(enableLogging: boolean = true) {
    this.enableLogging = enableLogging;
  }

  /**
   * Handle input validation errors
   * @param error Error object
   * @returns ScanResult with error information
   */
  handleInputError(error: Error): ScanResult {
    const errorMessage = `Input validation failed: ${error.message}`;
    this.logError(ErrorType.INPUT_VALIDATION, errorMessage, error);

    return this.createErrorResult(errorMessage, {
      timestamp: new Date().toISOString(),
      duration: 0,
      language: 'unknown',
      linesOfCode: 0,
      analyzersUsed: [],
      staticRulesApplied: 0
    });
  }

  /**
   * Handle analyzer-specific errors
   * Logs the error but doesn't return a result (allows graceful degradation)
   * @param analyzer Name of the analyzer that failed
   * @param error Error object
   */
  handleAnalyzerError(analyzer: string, error: Error): void {
    const errorMessage = `${analyzer} analyzer failed: ${error.message}`;
    this.logError(ErrorType.ANALYZER, errorMessage, { analyzer, error });

    if (this.enableLogging) {
      console.error(`[ErrorHandler] ${errorMessage}`, {
        analyzer,
        stack: error.stack
      });
    }
  }

  /**
   * Handle system-level errors
   * @param error Error object
   * @returns ScanResult with error information
   */
  handleSystemError(error: Error): ScanResult {
    const errorMessage = `System error: ${error.message}`;
    this.logError(ErrorType.SYSTEM, errorMessage, error);

    return this.createErrorResult(errorMessage, {
      timestamp: new Date().toISOString(),
      duration: 0,
      language: 'unknown',
      linesOfCode: 0,
      analyzersUsed: [],
      staticRulesApplied: 0
    });
  }

  /**
   * Handle parser errors
   * @param error Error object
   * @param startTime Scan start time for duration calculation
   * @returns ScanResult with error information
   */
  handleParserError(error: Error, startTime: number): ScanResult {
    const errorMessage = `Code parsing failed: ${error.message}`;
    this.logError(ErrorType.PARSER, errorMessage, error);

    return this.createErrorResult(errorMessage, {
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
      language: 'unknown',
      linesOfCode: 0,
      analyzersUsed: [],
      staticRulesApplied: 0
    });
  }

  /**
   * Handle timeout errors
   * @param analyzer Name of the analyzer that timed out
   * @param timeoutMs Timeout duration in milliseconds
   * @returns Formatted error message
   */
  handleTimeoutError(analyzer: string, timeoutMs: number): string {
    const errorMessage = `${analyzer} analyzer timed out after ${timeoutMs}ms`;
    this.logError(ErrorType.TIMEOUT, errorMessage, { analyzer, timeoutMs });
    return errorMessage;
  }

  /**
   * Handle network/API errors
   * @param service Name of the service that failed
   * @param error Error object
   * @returns Formatted error message
   */
  handleNetworkError(service: string, error: Error): string {
    const errorMessage = `Network error connecting to ${service}: ${error.message}`;
    this.logError(ErrorType.NETWORK, errorMessage, { service, error });
    return errorMessage;
  }

  /**
   * Format multiple errors into a single error result
   * @param errors Array of error messages
   * @param metadata Scan metadata
   * @returns ScanResult with all errors
   */
  formatMultipleErrors(errors: string[], metadata: ScanMetadata): ScanResult {
    this.logError(ErrorType.SYSTEM, 'Multiple errors occurred', { errorCount: errors.length });

    return {
      success: false,
      issues: [],
      metadata,
      errors
    };
  }

  /**
   * Create a standardized error result
   * @param errorMessage Error message
   * @param metadata Scan metadata
   * @returns ScanResult with error
   */
  private createErrorResult(errorMessage: string, metadata: ScanMetadata): ScanResult {
    return {
      success: false,
      issues: [],
      metadata,
      errors: [errorMessage]
    };
  }

  /**
   * Log error to internal error log
   * @param type Error type
   * @param message Error message
   * @param details Additional error details
   */
  private logError(type: ErrorType, message: string, details?: any): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      details: this.sanitizeDetails(details)
    };

    this.errorLog.push(logEntry);

    if (this.enableLogging) {
      console.error(`[ErrorHandler] [${type}] ${message}`, details);
    }
  }

  /**
   * Sanitize error details to remove sensitive information
   * @param details Error details object
   * @returns Sanitized details
   */
  private sanitizeDetails(details: any): any {
    if (!details) return undefined;

    // If it's an Error object, extract safe properties
    if (details instanceof Error) {
      return {
        name: details.name,
        message: details.message,
        stack: details.stack?.split('\n').slice(0, 3).join('\n') // Limit stack trace
      };
    }

    // For other objects, return as-is (could add more sanitization if needed)
    return details;
  }

  /**
   * Get all logged errors
   * @returns Array of error log entries
   */
  getErrorLog(): Array<{ timestamp: string; type: string; message: string; details?: any }> {
    return [...this.errorLog];
  }

  /**
   * Clear the error log
   */
  clearErrorLog(): void {
    this.errorLog = [];
  }

  /**
   * Get error count by type
   * @param type Error type to count
   * @returns Number of errors of the specified type
   */
  getErrorCount(type?: ErrorType): number {
    if (type) {
      return this.errorLog.filter(entry => entry.type === type).length;
    }
    return this.errorLog.length;
  }
}
