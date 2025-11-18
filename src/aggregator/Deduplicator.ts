/**
 * Deduplicator - Removes duplicate vulnerability findings
 */

import { IDeduplicator } from '../models/interfaces';
import { VulnerabilityIssue, SeverityLevel } from '../models/types';

/**
 * Deduplicator class that removes duplicate vulnerability issues
 * Uses line number tolerance and fuzzy title matching
 */
export class Deduplicator implements IDeduplicator {
  private readonly LINE_TOLERANCE = 1; // ±1 line tolerance for matching
  private readonly FUZZY_MATCH_THRESHOLD = 0.7; // 70% similarity threshold

  /**
   * Deduplicate vulnerability issues
   * @param issues Array of vulnerability issues
   * @returns Deduplicated array of issues
   */
  deduplicate(issues: VulnerabilityIssue[]): VulnerabilityIssue[] {
    if (issues.length === 0) {
      return [];
    }

    const deduplicated: VulnerabilityIssue[] = [];
    const processed = new Set<number>();

    for (let i = 0; i < issues.length; i++) {
      if (processed.has(i)) {
        continue;
      }

      const currentIssue = issues[i];
      const duplicates: number[] = [i];

      // Find all duplicates of the current issue
      for (let j = i + 1; j < issues.length; j++) {
        if (processed.has(j)) {
          continue;
        }

        if (this.isDuplicate(currentIssue, issues[j])) {
          duplicates.push(j);
          processed.add(j);
        }
      }

      // Merge duplicates and add to result
      const mergedIssue = this.mergeDuplicates(
        duplicates.map(idx => issues[idx])
      );
      deduplicated.push(mergedIssue);
      processed.add(i);
    }

    return deduplicated;
  }

  /**
   * Check if two issues are duplicates
   * @param issue1 First issue
   * @param issue2 Second issue
   * @returns True if issues are duplicates
   */
  private isDuplicate(
    issue1: VulnerabilityIssue,
    issue2: VulnerabilityIssue
  ): boolean {
    // Check line number with tolerance
    const lineMatch = Math.abs(issue1.line - issue2.line) <= this.LINE_TOLERANCE;
    
    if (!lineMatch) {
      return false;
    }

    // Check OWASP category match
    const owaspMatch = this.normalizeOwaspCategory(issue1.owaspCategory) === 
                       this.normalizeOwaspCategory(issue2.owaspCategory);
    
    if (!owaspMatch) {
      return false;
    }

    // Check fuzzy title match
    const titleSimilarity = this.calculateSimilarity(issue1.title, issue2.title);
    const titleMatch = titleSimilarity >= this.FUZZY_MATCH_THRESHOLD;

    return titleMatch;
  }

  /**
   * Merge duplicate issues, preferring LLM explanations
   * @param duplicates Array of duplicate issues
   * @returns Merged issue
   */
  private mergeDuplicates(duplicates: VulnerabilityIssue[]): VulnerabilityIssue {
    if (duplicates.length === 1) {
      return duplicates[0];
    }

    // Prefer LLM source over static
    const llmIssue = duplicates.find(issue => issue.source === 'llm');
    const baseIssue = llmIssue || duplicates[0];

    // Merge sources
    const sources = new Set(duplicates.map(issue => issue.source));
    const mergedSource = sources.size > 1 ? 'merged' : baseIssue.source;

    // Use the most detailed description (longest)
    const bestDescription = duplicates.reduce((best, current) => 
      current.description.length > best.description.length ? current : best
    ).description;

    // Use the most detailed fix (longest)
    const bestFix = duplicates.reduce((best, current) => 
      current.fix.length > best.fix.length ? current : best
    ).fix;

    // Use the highest severity
    const highestSeverity = this.getHighestSeverity(
      duplicates.map(issue => issue.severity)
    );

    return {
      ...baseIssue,
      source: mergedSource,
      description: bestDescription,
      fix: bestFix,
      severity: highestSeverity
    };
  }

  /**
   * Normalize OWASP category for comparison
   * @param category OWASP category string
   * @returns Normalized category
   */
  private normalizeOwaspCategory(category: string): string {
    // Extract just the category code (e.g., "A03:2021" from "A03:2021 - Injection")
    const match = category.match(/A\d{2}:\d{4}/);
    return match ? match[0] : category.toLowerCase().trim();
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   * @param str1 First string
   * @param str2 Second string
   * @returns Similarity score between 0 and 1
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);
    
    if (maxLength === 0) {
      return 1.0;
    }

    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein distance between two strings
   * @param str1 First string
   * @param str2 Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const m = str1.length;
    const n = str2.length;

    // Create a 2D array for dynamic programming
    const dp: number[][] = Array(m + 1)
      .fill(null)
      .map(() => Array(n + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= m; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    // Fill the dp table
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1,     // deletion
            dp[i][j - 1] + 1,     // insertion
            dp[i - 1][j - 1] + 1  // substitution
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Get the highest severity from a list
   * @param severities Array of severity levels
   * @returns Highest severity
   */
  private getHighestSeverity(severities: SeverityLevel[]): SeverityLevel {
    const severityOrder: SeverityLevel[] = [
      SeverityLevel.CRITICAL,
      SeverityLevel.HIGH,
      SeverityLevel.MEDIUM,
      SeverityLevel.LOW,
      SeverityLevel.INFO
    ];
    
    for (const level of severityOrder) {
      if (severities.includes(level)) {
        return level;
      }
    }
    
    return severities[0] || SeverityLevel.MEDIUM;
  }
}
