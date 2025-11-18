/**
 * Language detection utility for identifying programming languages
 */

import { Language, ILanguageDetector } from '../models';

/**
 * LanguageDetector class for identifying JavaScript and TypeScript code
 */
export class LanguageDetector implements ILanguageDetector {
  // File extension mappings
  private static readonly EXTENSION_MAP: Record<string, Language> = {
    '.js': Language.JAVASCRIPT,
    '.jsx': Language.JAVASCRIPT,
    '.ts': Language.TYPESCRIPT,
    '.tsx': Language.TYPESCRIPT,
  };

  // Regex patterns for content-based detection
  private static readonly TYPESCRIPT_PATTERNS = [
    /\binterface\s+\w+/,           // interface declarations
    /\btype\s+\w+\s*=/,             // type aliases
    /:\s*\w+(\[\])?(\s*\|\s*\w+)*/, // type annotations
    /\benum\s+\w+/,                 // enum declarations
    /\bas\s+\w+/,                   // type assertions
    /<\w+>/,                        // generic types
    /\bprivate\s+\w+/,              // private keyword
    /\bpublic\s+\w+/,               // public keyword
    /\bprotected\s+\w+/,            // protected keyword
    /\breadonly\s+\w+/,             // readonly keyword
  ];

  private static readonly JAVASCRIPT_PATTERNS = [
    /\bfunction\s+\w+/,             // function declarations
    /\bconst\s+\w+/,                // const declarations
    /\blet\s+\w+/,                  // let declarations
    /\bvar\s+\w+/,                  // var declarations
    /\bclass\s+\w+/,                // class declarations
    /=>\s*{?/,                      // arrow functions
    /\bimport\s+.*\bfrom\b/,        // ES6 imports
    /\bexport\s+(default|const|function|class)/, // ES6 exports
  ];

  /**
   * Detect the programming language of the provided code
   * @param code - The source code to analyze
   * @param fileExtension - Optional file extension hint (e.g., '.ts', '.js')
   * @returns The detected Language enum value
   */
  detect(code: string, fileExtension?: string): Language {
    // First, try extension-based detection if provided
    if (fileExtension) {
      const normalizedExt = fileExtension.toLowerCase();
      const langFromExt = LanguageDetector.EXTENSION_MAP[normalizedExt];
      if (langFromExt) {
        return langFromExt;
      }
    }

    // Fall back to content-based detection
    return this.detectFromContent(code);
  }

  /**
   * Check if a language is supported by the scanner
   * @param language - The Language enum value to check
   * @returns true if the language is supported, false otherwise
   */
  isSupported(language: Language): boolean {
    return language === Language.JAVASCRIPT || language === Language.TYPESCRIPT;
  }

  /**
   * Detect language from code content using pattern matching
   * @param code - The source code to analyze
   * @returns The detected Language enum value
   */
  private detectFromContent(code: string): Language {
    if (!code || code.trim().length === 0) {
      return Language.UNKNOWN;
    }

    // Count TypeScript-specific pattern matches
    const tsMatches = LanguageDetector.TYPESCRIPT_PATTERNS.filter(pattern =>
      pattern.test(code)
    ).length;

    // Count JavaScript pattern matches
    const jsMatches = LanguageDetector.JAVASCRIPT_PATTERNS.filter(pattern =>
      pattern.test(code)
    ).length;

    // If we find TypeScript-specific patterns, it's TypeScript
    if (tsMatches > 0) {
      return Language.TYPESCRIPT;
    }

    // If we find JavaScript patterns but no TypeScript patterns, it's JavaScript
    if (jsMatches > 0) {
      return Language.JAVASCRIPT;
    }

    // Unable to determine language
    return Language.UNKNOWN;
  }
}
