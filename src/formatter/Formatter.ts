/**
 * Formatter class for producing structured JSON output
 */

import {
  VulnerabilityIssue,
  ScanMetadata,
  ScanResult,
  SeverityLevel,
  IFormatter
} from '../models';

/**
 * Formatter produces the final ScanResult JSON output
 */
export class Formatter implements IFormatter {
  /**
   * Severity order for sorting (highest to lowest priority)
   */
  private readonly severityOrder: Record<SeverityLevel, number> = {
    [SeverityLevel.CRITICAL]: 0,
    [SeverityLevel.HIGH]: 1,
    [SeverityLevel.MEDIUM]: 2,
    [SeverityLevel.LOW]: 3,
    [SeverityLevel.INFO]: 4
  };

  /**
   * Format vulnerability issues and metadata into a ScanResult
   * @param issues Array of vulnerability issues to format
   * @param metadata Scan metadata
   * @returns Formatted ScanResult
   */
  format(issues: VulnerabilityIssue[], metadata: ScanMetadata): ScanResult {
    // Generate unique IDs for issues that don't have them
    const issuesWithIds = this.ensureUniqueIds(issues);

    // Sort issues by severity (Critical → Info) then by line number
    const sortedIssues = this.sortIssues(issuesWithIds);

    // Ensure all required fields are present
    const validatedIssues = this.validateIssues(sortedIssues);

    // Build the final ScanResult
    return {
      success: true,
      issues: validatedIssues,
      metadata: this.validateMetadata(metadata)
    };
  }

  /**
   * Ensure all issues have unique IDs
   * @param issues Array of issues
   * @returns Issues with guaranteed unique IDs
   */
  private ensureUniqueIds(issues: VulnerabilityIssue[]): VulnerabilityIssue[] {
    return issues.map((issue, index) => {
      if (!issue.id || issue.id.trim() === '') {
        return {
          ...issue,
          id: this.generateId(issue, index)
        };
      }
      return issue;
    });
  }

  /**
   * Generate a unique ID for an issue
   * @param issue The vulnerability issue
   * @param index The index in the array
   * @returns Unique ID string
   */
  private generateId(issue: VulnerabilityIssue, index: number): string {
    const timestamp = Date.now();
    const severityPrefix = issue.severity.substring(0, 3).toUpperCase();
    const lineNumber = issue.line;
    return `${severityPrefix}-${lineNumber}-${timestamp}-${index}`;
  }

  /**
   * Sort issues by severity (Critical → Info) then by line number
   * @param issues Array of issues to sort
   * @returns Sorted array of issues
   */
  private sortIssues(issues: VulnerabilityIssue[]): VulnerabilityIssue[] {
    return [...issues].sort((a, b) => {
      // First, sort by severity
      const severityDiff = this.severityOrder[a.severity] - this.severityOrder[b.severity];
      if (severityDiff !== 0) {
        return severityDiff;
      }

      // If severity is the same, sort by line number
      return a.line - b.line;
    });
  }

  /**
   * Validate that all required fields are present in issues
   * @param issues Array of issues to validate
   * @returns Validated issues
   */
  private validateIssues(issues: VulnerabilityIssue[]): VulnerabilityIssue[] {
    return issues.map(issue => ({
      id: issue.id || '',
      title: issue.title || 'Unknown Issue',
      description: issue.description || 'No description available',
      severity: issue.severity || SeverityLevel.INFO,
      owaspCategory: issue.owaspCategory || 'Unknown',
      line: issue.line || 0,
      columnStart: issue.columnStart || 0,
      columnEnd: issue.columnEnd || 0,
      fix: issue.fix || 'No fix recommendation available',
      source: issue.source || 'static',
      ...(issue.codeSnippet && { codeSnippet: issue.codeSnippet })
    }));
  }

  /**
   * Validate metadata has all required fields
   * @param metadata Scan metadata
   * @returns Validated metadata
   */
  private validateMetadata(metadata: ScanMetadata): ScanMetadata {
    return {
      timestamp: metadata.timestamp || new Date().toISOString(),
      duration: metadata.duration || 0,
      language: metadata.language || 'unknown',
      linesOfCode: metadata.linesOfCode || 0,
      analyzersUsed: metadata.analyzersUsed || [],
      staticRulesApplied: metadata.staticRulesApplied || 0,
      ...(metadata.llmModel && { llmModel: metadata.llmModel })
    };
  }
}
