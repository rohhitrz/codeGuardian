/**
 * Security Scan Engine - Main orchestrator for code security analysis
 */

import { ISecurityScanEngine } from '../models/interfaces';
import { ScanResult, Language, AnalyzerResult, ScanMetadata } from '../models/types';
import { LanguageDetector } from '../utils/LanguageDetector';
import { CodeParser } from '../utils/CodeParser';
import { StaticAnalyzer } from '../analyzers/StaticAnalyzer';
import { LLMAnalyzer } from '../analyzers/LLMAnalyzer';
import { ResultAggregator } from '../aggregator/ResultAggregator';
import { Deduplicator } from '../aggregator/Deduplicator';
import { Formatter } from '../formatter/Formatter';

/**
 * SecurityScanEngine orchestrates the entire security scanning process
 * Coordinates language detection, parsing, analysis, aggregation, and formatting
 */
export class SecurityScanEngine implements ISecurityScanEngine {
  private languageDetector: LanguageDetector;
  private codeParser: CodeParser;
  private staticAnalyzer: StaticAnalyzer;
  private llmAnalyzer: LLMAnalyzer;
  private resultAggregator: ResultAggregator;
  private deduplicator: Deduplicator;
  private formatter: Formatter;

  constructor() {
    // Initialize all components
    this.languageDetector = new LanguageDetector();
    this.codeParser = new CodeParser();
    this.staticAnalyzer = new StaticAnalyzer();
    this.llmAnalyzer = new LLMAnalyzer();
    this.resultAggregator = new ResultAggregator();
    this.deduplicator = new Deduplicator();
    this.formatter = new Formatter();
  }

  /**
   * Scan code for security vulnerabilities
   * @param code Source code to analyze
   * @param language Programming language (or file extension)
   * @returns ScanResult with detected vulnerabilities
   */
  async scan(code: string, language: string): Promise<ScanResult> {
    const startTime = Date.now();

    try {
      // Validate input
      const validationError = this.validateInput(code, language);
      if (validationError) {
        return validationError;
      }

      // Detect language
      const detectedLanguage = this.languageDetector.detect(code, language);
      
      // Check if language is supported
      if (!this.languageDetector.isSupported(detectedLanguage)) {
        return this.createErrorResult(
          `Unsupported language: ${detectedLanguage}. Only JavaScript and TypeScript are supported.`,
          startTime
        );
      }

      // Parse code
      let parsedCode;
      try {
        parsedCode = this.codeParser.parse(code, detectedLanguage);
      } catch (error) {
        console.error('Parser error:', error);
        return this.createErrorResult(
          `Failed to parse code: ${error instanceof Error ? error.message : 'Unknown error'}`,
          startTime
        );
      }

      // Execute analyzers in parallel
      const analyzerResults = await this.executeAnalyzers(parsedCode);

      // Aggregate results from all analyzers
      const aggregatedIssues = this.resultAggregator.aggregate(analyzerResults);

      // Deduplicate issues
      const deduplicatedIssues = this.deduplicator.deduplicate(aggregatedIssues);

      // Collect any errors from analyzers
      const errors = this.resultAggregator.getErrors(analyzerResults);

      // Create metadata
      const metadata: ScanMetadata = {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        language: detectedLanguage,
        linesOfCode: parsedCode.lines.length,
        analyzersUsed: analyzerResults.map(r => r.source),
        staticRulesApplied: this.staticAnalyzer.getRuleCount(),
        llmModel: 'gpt-4o-mini'
      };

      // Format and return results
      const scanResult = this.formatter.format(deduplicatedIssues, metadata);

      // Add errors if any occurred
      if (errors.length > 0) {
        scanResult.errors = errors;
      }

      return scanResult;

    } catch (error) {
      console.error('Unexpected error during scan:', error);
      return this.createErrorResult(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        startTime
      );
    }
  }

  /**
   * Validate input parameters
   * @param code Source code
   * @param language Language identifier
   * @returns Error result if validation fails, null otherwise
   */
  private validateInput(code: string, language: string): ScanResult | null {
    // Check for empty or null code
    if (!code || code.trim().length === 0) {
      return this.createErrorResult('Invalid input: Code cannot be empty', Date.now());
    }

    // Check for language parameter
    if (!language || language.trim().length === 0) {
      return this.createErrorResult('Invalid input: Language must be specified', Date.now());
    }

    return null;
  }

  /**
   * Execute static and LLM analyzers in parallel
   * @param parsedCode Parsed code structure
   * @returns Array of analyzer results
   */
  private async executeAnalyzers(parsedCode: any): Promise<AnalyzerResult[]> {
    const results: AnalyzerResult[] = [];

    // Execute both analyzers concurrently
    const [staticResult, llmResult] = await Promise.allSettled([
      this.runStaticAnalyzer(parsedCode),
      this.runLLMAnalyzer(parsedCode)
    ]);

    // Handle static analyzer result
    if (staticResult.status === 'fulfilled') {
      results.push(staticResult.value);
    } else {
      console.error('Static analyzer failed:', staticResult.reason);
      results.push({
        source: 'static',
        issues: [],
        errors: [`Static analyzer failed: ${staticResult.reason}`]
      });
    }

    // Handle LLM analyzer result
    if (llmResult.status === 'fulfilled') {
      results.push(llmResult.value);
    } else {
      console.error('LLM analyzer failed:', llmResult.reason);
      results.push({
        source: 'llm',
        issues: [],
        errors: [`LLM analyzer failed: ${llmResult.reason}`]
      });
    }

    return results;
  }

  /**
   * Run static analyzer and wrap result
   * @param parsedCode Parsed code structure
   * @returns Analyzer result
   */
  private async runStaticAnalyzer(parsedCode: any): Promise<AnalyzerResult> {
    try {
      const issues = this.staticAnalyzer.analyze(parsedCode);
      return {
        source: 'static',
        issues,
        errors: []
      };
    } catch (error) {
      throw new Error(`Static analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Run LLM analyzer and wrap result
   * @param parsedCode Parsed code structure
   * @returns Analyzer result
   */
  private async runLLMAnalyzer(parsedCode: any): Promise<AnalyzerResult> {
    try {
      const issues = await this.llmAnalyzer.analyze(parsedCode);
      return {
        source: 'llm',
        issues,
        errors: []
      };
    } catch (error) {
      throw new Error(`LLM analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create an error result
   * @param message Error message
   * @param startTime Scan start time
   * @returns Error ScanResult
   */
  private createErrorResult(message: string, startTime: number): ScanResult {
    return {
      success: false,
      issues: [],
      metadata: {
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        language: 'unknown',
        linesOfCode: 0,
        analyzersUsed: [],
        staticRulesApplied: 0
      },
      errors: [message]
    };
  }
}
