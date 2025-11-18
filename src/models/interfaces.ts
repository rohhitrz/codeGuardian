/**
 * Interface definitions for all Security Scan Engine components
 */

import {
  Language,
  ParsedCode,
  VulnerabilityIssue,
  ScanResult,
  AnalyzerResult,
  ScanMetadata
} from './types';

/**
 * Main Security Scan Engine interface
 */
export interface ISecurityScanEngine {
  scan(code: string, language: string): Promise<ScanResult>;
}

/**
 * Language detection interface
 */
export interface ILanguageDetector {
  detect(code: string, fileExtension?: string): Language;
  isSupported(language: Language): boolean;
}

/**
 * Code parsing interface
 */
export interface ICodeParser {
  parse(code: string, language: Language): ParsedCode;
}

/**
 * Static analyzer interface
 */
export interface IStaticAnalyzer {
  analyze(parsedCode: ParsedCode): VulnerabilityIssue[];
}

/**
 * LLM analyzer interface
 */
export interface ILLMAnalyzer {
  analyze(parsedCode: ParsedCode): Promise<VulnerabilityIssue[]>;
  setTimeout(ms: number): void;
}

/**
 * Result aggregation interface
 */
export interface IResultAggregator {
  aggregate(results: AnalyzerResult[]): VulnerabilityIssue[];
}

/**
 * Deduplication interface
 */
export interface IDeduplicator {
  deduplicate(issues: VulnerabilityIssue[]): VulnerabilityIssue[];
}

/**
 * Formatting interface
 */
export interface IFormatter {
  format(issues: VulnerabilityIssue[], metadata: ScanMetadata): ScanResult;
}

/**
 * Error handling interface
 */
export interface IErrorHandler {
  handleInputError(error: Error): ScanResult;
  handleAnalyzerError(analyzer: string, error: Error): void;
  handleSystemError(error: Error): ScanResult;
}
