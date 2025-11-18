/**
 * Static Analyzer for detecting security vulnerabilities using pattern matching
 */

import { IStaticAnalyzer } from '../models/interfaces';
import { ParsedCode, VulnerabilityIssue, Rule, SeverityLevel } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * StaticAnalyzer class that applies security rules to detect vulnerabilities
 */
export class StaticAnalyzer implements IStaticAnalyzer {
  private rules: Rule[];

  constructor() {
    this.rules = this.initializeRules();
  }

  /**
   * Analyze parsed code for security vulnerabilities
   */
  analyze(parsedCode: ParsedCode): VulnerabilityIssue[] {
    const issues: VulnerabilityIssue[] = [];

    // Apply each rule to each line of code
    parsedCode.lines.forEach((line, index) => {
      const lineNumber = index + 1;

      this.rules.forEach((rule) => {
        const matches = this.matchRule(line, rule, lineNumber);
        issues.push(...matches);
      });
    });

    return issues;
  }

  /**
   * Match a rule against a line of code
   */
  private matchRule(line: string, rule: Rule, lineNumber: number): VulnerabilityIssue[] {
    const issues: VulnerabilityIssue[] = [];
    const matches = line.matchAll(new RegExp(rule.pattern, 'g'));

    for (const match of matches) {
      if (match.index !== undefined) {
        issues.push({
          id: uuidv4(),
          title: rule.name,
          description: rule.description,
          severity: rule.severity,
          owaspCategory: rule.owaspCategory,
          line: lineNumber,
          columnStart: match.index,
          columnEnd: match.index + match[0].length,
          fix: rule.fix,
          source: 'static',
          codeSnippet: line.trim()
        });
      }
    }

    return issues;
  }

  /**
   * Initialize all security rules
   */
  private initializeRules(): Rule[] {
    return [
      this.createSQLInjectionRule(),
      this.createXSSRule(),
      this.createHardcodedCredentialsRule(),
      this.createInsecureCryptographyRule()
    ];
  }

  /**
   * SQL Injection detection rule
   */
  private createSQLInjectionRule(): Rule {
    return {
      id: 'sql-injection',
      name: 'SQL Injection',
      pattern: /(['"`])(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\s+[^'"`]*\1\s*\+/i,
      severity: SeverityLevel.HIGH,
      owaspCategory: 'A03:2021 - Injection',
      description: 'Potential SQL injection vulnerability detected. String concatenation in SQL queries can allow attackers to manipulate queries.',
      fix: 'Use parameterized queries or prepared statements instead of string concatenation. Example: Use placeholders like ? or $1 with parameter binding.'
    };
  }

  /**
   * XSS detection rule
   */
  private createXSSRule(): Rule {
    return {
      id: 'xss-vulnerability',
      name: 'Cross-Site Scripting (XSS)',
      pattern: /(innerHTML|dangerouslySetInnerHTML|document\.write)\s*[=\(]/i,
      severity: SeverityLevel.HIGH,
      owaspCategory: 'A03:2021 - Injection',
      description: 'Potential XSS vulnerability detected. Directly inserting user input into HTML can allow attackers to execute malicious scripts.',
      fix: 'Use safe DOM manipulation methods like textContent, or sanitize user input with a library like DOMPurify. For React, avoid dangerouslySetInnerHTML or sanitize content first.'
    };
  }

  /**
   * Hardcoded credentials detection rule
   */
  private createHardcodedCredentialsRule(): Rule {
    return {
      id: 'hardcoded-credentials',
      name: 'Hardcoded Credentials',
      pattern: /(password|apiKey|api_key|secret|token|accessToken|access_token)\s*[=:]\s*['"`][^'"`]{8,}['"`]/i,
      severity: SeverityLevel.HIGH,
      owaspCategory: 'A07:2021 - Identification and Authentication Failures',
      description: 'Hardcoded credentials detected. Storing sensitive credentials in source code exposes them to anyone with access to the codebase.',
      fix: 'Use environment variables or secure credential management systems (e.g., AWS Secrets Manager, HashiCorp Vault). Load credentials at runtime from secure storage.'
    };
  }

  /**
   * Insecure cryptography detection rule
   */
  private createInsecureCryptographyRule(): Rule {
    return {
      id: 'insecure-cryptography',
      name: 'Insecure Cryptography',
      pattern: /(MD5|SHA1|DES|RC4|createHash\(['"]md5['"]|createHash\(['"]sha1['"])/i,
      severity: SeverityLevel.HIGH,
      owaspCategory: 'A02:2021 - Cryptographic Failures',
      description: 'Insecure cryptographic algorithm detected. MD5, SHA1, DES, and RC4 are cryptographically broken and should not be used for security purposes.',
      fix: 'Use modern, secure algorithms: SHA-256 or SHA-3 for hashing, AES-256-GCM for encryption, and bcrypt/argon2 for password hashing.'
    };
  }

  /**
   * Get the number of rules currently loaded
   */
  getRuleCount(): number {
    return this.rules.length;
  }
}
