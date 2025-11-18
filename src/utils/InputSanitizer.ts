/**
 * Input sanitization utilities for Security Scan Engine
 * Validates and sanitizes code input before processing
 */

import { getConfig } from '../config';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Input sanitizer class
 */
export class InputSanitizer {
  /**
   * Validate code length against configured limits
   */
  static validateCodeLength(code: string): ValidationResult {
    const config = getConfig();
    const maxSize = config.getScanLimits().maxCodeSize;

    if (!code || code.length === 0) {
      return {
        valid: false,
        error: 'Code input is empty'
      };
    }

    const codeSize = Buffer.byteLength(code, 'utf8');
    if (codeSize > maxSize) {
      return {
        valid: false,
        error: `Code size (${codeSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`
      };
    }

    return { valid: true };
  }

  /**
   * Sanitize code before LLM submission
   * Removes potentially harmful content and normalizes input
   */
  static sanitizeForLLM(code: string): string {
    if (!code) {
      return '';
    }

    let sanitized = code;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Normalize line endings
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove excessive whitespace (more than 3 consecutive blank lines)
    sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');

    // Trim leading and trailing whitespace
    sanitized = sanitized.trim();

    return sanitized;
  }

  /**
   * Check for prompt injection attempts
   * Detects patterns that might manipulate LLM behavior
   */
  static detectPromptInjection(code: string): ValidationResult {
    if (!code) {
      return { valid: true };
    }

    // Patterns that might indicate prompt injection
    const suspiciousPatterns = [
      // Direct instruction attempts
      /ignore\s+(previous|all|above)\s+(instructions|prompts|commands)/i,
      /disregard\s+(previous|all|above)\s+(instructions|prompts|commands)/i,
      /forget\s+(previous|all|above)\s+(instructions|prompts|commands)/i,
      
      // Role manipulation
      /you\s+are\s+now\s+(a|an)\s+\w+/i,
      /act\s+as\s+(a|an)\s+\w+/i,
      /pretend\s+to\s+be\s+(a|an)\s+\w+/i,
      
      // System prompt manipulation
      /system\s*:\s*/i,
      /assistant\s*:\s*/i,
      /\[SYSTEM\]/i,
      /\[INST\]/i,
      
      // Output manipulation
      /output\s+only/i,
      /respond\s+with\s+only/i,
      /say\s+only/i,
      
      // Excessive special tokens
      /<\|.*?\|>/g,
      /\{.*?system.*?\}/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(code)) {
        return {
          valid: false,
          error: 'Potential prompt injection detected in code input'
        };
      }
    }

    // Check for excessive special characters that might break parsing
    const specialCharRatio = (code.match(/[<>{}[\]|]/g) || []).length / code.length;
    if (specialCharRatio > 0.3) {
      return {
        valid: false,
        error: 'Code contains excessive special characters'
      };
    }

    return { valid: true };
  }

  /**
   * Comprehensive input validation
   * Combines all validation checks
   */
  static validate(code: string): ValidationResult {
    // Check code length
    const lengthCheck = this.validateCodeLength(code);
    if (!lengthCheck.valid) {
      return lengthCheck;
    }

    // Check for prompt injection
    const injectionCheck = this.detectPromptInjection(code);
    if (!injectionCheck.valid) {
      return injectionCheck;
    }

    return { valid: true };
  }

  /**
   * Sanitize and validate code input
   * Returns sanitized code or throws error if validation fails
   */
  static sanitizeAndValidate(code: string): string {
    const validation = this.validate(code);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return this.sanitizeForLLM(code);
  }

  /**
   * Escape special characters for safe display
   */
  static escapeForDisplay(text: string): string {
    if (!text) {
      return '';
    }

    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Truncate code for preview/logging
   */
  static truncateForLogging(code: string, maxLength: number = 200): string {
    if (!code || code.length <= maxLength) {
      return code;
    }

    return code.substring(0, maxLength) + '... [truncated]';
  }
}
