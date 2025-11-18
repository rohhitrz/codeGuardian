/**
 * Core type definitions for the Security Scan Engine
 */

/**
 * Supported programming languages
 */
export enum Language {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  UNKNOWN = 'unknown'
}

/**
 * Severity levels for vulnerability issues
 */
export enum SeverityLevel {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

/**
 * Analyzer source types
 */
export type AnalyzerSource = 'static' | 'llm' | 'merged';

/**
 * Token representation from code parsing
 */
export interface Token {
  type: string;
  value: string;
  line: number;
  column: number;
}

/**
 * Parsed code structure
 */
export interface ParsedCode {
  raw: string;
  lines: string[];
  ast?: any; // Abstract Syntax Tree (optional)
  tokens?: Token[];
}

/**
 * Vulnerability issue detected in code
 */
export interface VulnerabilityIssue {
  id: string; // Unique identifier
  title: string;
  description: string;
  severity: SeverityLevel;
  owaspCategory: string;
  line: number;
  columnStart: number;
  columnEnd: number;
  fix: string;
  source: AnalyzerSource;
  codeSnippet?: string; // Optional: the actual code line
}

/**
 * Metadata about the scan execution
 */
export interface ScanMetadata {
  timestamp: string;
  duration: number; // milliseconds
  language: string;
  linesOfCode: number;
  analyzersUsed: string[];
  staticRulesApplied: number;
  llmModel?: string;
}

/**
 * Complete scan result
 */
export interface ScanResult {
  success: boolean;
  issues: VulnerabilityIssue[];
  metadata: ScanMetadata;
  errors?: string[];
}

/**
 * Result from an individual analyzer
 */
export interface AnalyzerResult {
  source: 'static' | 'llm';
  issues: VulnerabilityIssue[];
  errors?: string[];
}

/**
 * Security rule definition for static analysis
 */
export interface Rule {
  id: string;
  name: string;
  pattern: RegExp;
  severity: SeverityLevel;
  owaspCategory: string;
  description: string;
  fix: string;
}

/**
 * Configuration for LLM analyzer
 */
export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
}
