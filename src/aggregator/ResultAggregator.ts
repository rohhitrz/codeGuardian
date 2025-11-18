/**
 * Result Aggregator - Combines results from multiple analyzers
 */

import { IResultAggregator } from '../models/interfaces';
import { AnalyzerResult, VulnerabilityIssue } from '../models/types';

/**
 * ResultAggregator class that combines results from multiple analyzers
 * Handles partial failures and preserves source information
 */
export class ResultAggregator implements IResultAggregator {
  /**
   * Aggregate results from multiple analyzers
   * @param results Array of analyzer results (static, LLM, etc.)
   * @returns Combined array of vulnerability issues
   */
  aggregate(results: AnalyzerResult[]): VulnerabilityIssue[] {
    const allIssues: VulnerabilityIssue[] = [];
    
    // Collect issues from all analyzers
    for (const result of results) {
      if (result.issues && Array.isArray(result.issues)) {
        // Preserve source information from each analyzer
        const issuesWithSource = result.issues.map(issue => ({
          ...issue,
          source: issue.source || result.source
        }));
        
        allIssues.push(...issuesWithSource);
      }
      
      // Log errors from failed analyzers
      if (result.errors && result.errors.length > 0) {
        console.warn(`Analyzer '${result.source}' reported errors:`, result.errors);
      }
    }
    
    return allIssues;
  }
  
  /**
   * Get error messages from all analyzer results
   * @param results Array of analyzer results
   * @returns Array of error messages
   */
  getErrors(results: AnalyzerResult[]): string[] {
    const errors: string[] = [];
    
    for (const result of results) {
      if (result.errors && result.errors.length > 0) {
        errors.push(...result.errors.map(err => `[${result.source}] ${err}`));
      }
    }
    
    return errors;
  }
}
