/**
 * LLM Analyzer - Uses language models for contextual security analysis
 */

import { ILLMAnalyzer } from '../models/interfaces';
import { ParsedCode, VulnerabilityIssue, SeverityLevel, LLMConfig } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * LLM response structure for vulnerability detection
 */
interface LLMVulnerability {
  title: string;
  description: string;
  severity: string;
  owaspCategory: string;
  line: number;
  columnStart?: number;
  columnEnd?: number;
  fix: string;
}

/**
 * OpenAI API response structure
 */
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * LLMAnalyzer class that uses language models to detect security vulnerabilities
 */
export class LLMAnalyzer implements ILLMAnalyzer {
  private timeout: number;
  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      model: config?.model || 'gpt-4o-mini',
      temperature: config?.temperature || 0.1,
      maxTokens: config?.maxTokens || 4096,
      timeout: config?.timeout || 30000
    };
    this.timeout = this.config.timeout;
  }

  /**
   * Set timeout for LLM API calls
   */
  setTimeout(ms: number): void {
    this.timeout = ms;
    this.config.timeout = ms;
  }

  /**
   * Analyze code for security vulnerabilities using LLM
   */
  async analyze(parsedCode: ParsedCode): Promise<VulnerabilityIssue[]> {
    try {
      const prompt = this.createSecurityPrompt(parsedCode);
      const response = await this.callLLMWithTimeout(prompt);
      const vulnerabilities = this.parseResponse(response);
      return this.mapToVulnerabilityIssues(vulnerabilities, parsedCode);
    } catch (error) {
      console.error('LLM Analyzer error:', error);
      return [];
    }
  }

  /**
   * Create security analysis prompt for the LLM
   */
  private createSecurityPrompt(parsedCode: ParsedCode): string {
    return `Analyze the following code for security vulnerabilities.

For each vulnerability found, provide a JSON object with these fields:
- title: Brief title of the issue
- description: Detailed explanation of the security risk
- severity: One of: Critical, High, Medium, Low, Info
- owaspCategory: OWASP category (e.g., "A03:2021 Injection", "A07:2021 Identification and Authentication Failures")
- line: Line number where the issue occurs (1-indexed)
- columnStart: Starting column position (optional, 0-indexed)
- columnEnd: Ending column position (optional, 0-indexed)
- fix: Recommended fix or remediation guidance

Return ONLY a JSON array of vulnerability objects. If no vulnerabilities are found, return an empty array [].

Code to analyze:
\`\`\`
${parsedCode.raw}
\`\`\`

Response format:
[
  {
    "title": "SQL Injection Vulnerability",
    "description": "...",
    "severity": "High",
    "owaspCategory": "A03:2021 Injection",
    "line": 5,
    "columnStart": 10,
    "columnEnd": 45,
    "fix": "Use parameterized queries..."
  }
]`;
  }

  /**
   * Call LLM API with timeout handling
   */
  private async callLLMWithTimeout(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: 'You are a security expert analyzing code for vulnerabilities. Always respond with valid JSON arrays only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenAIResponse;
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        throw new Error('Invalid response format from LLM API');
      }

      return data.choices[0].message.content;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`LLM API timeout after ${this.timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Parse LLM response to extract vulnerability data
   */
  private parseResponse(response: string): LLMVulnerability[] {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = response.trim();
      
      // Remove markdown code blocks if present
      if (jsonStr.startsWith('```')) {
        const lines = jsonStr.split('\n');
        lines.shift(); // Remove opening ```
        if (lines[lines.length - 1].trim() === '```') {
          lines.pop(); // Remove closing ```
        }
        jsonStr = lines.join('\n').trim();
      }

      // Remove "json" language identifier if present
      if (jsonStr.startsWith('json')) {
        jsonStr = jsonStr.substring(4).trim();
      }

      const parsed = JSON.parse(jsonStr);
      
      if (!Array.isArray(parsed)) {
        console.warn('LLM response is not an array, returning empty results');
        return [];
      }

      return parsed.filter(this.isValidVulnerability);
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Response was:', response);
      return [];
    }
  }

  /**
   * Validate vulnerability object structure
   */
  private isValidVulnerability(vuln: any): vuln is LLMVulnerability {
    return (
      typeof vuln === 'object' &&
      typeof vuln.title === 'string' &&
      typeof vuln.description === 'string' &&
      typeof vuln.severity === 'string' &&
      typeof vuln.owaspCategory === 'string' &&
      typeof vuln.line === 'number' &&
      typeof vuln.fix === 'string'
    );
  }

  /**
   * Map LLM vulnerabilities to VulnerabilityIssue objects
   */
  private mapToVulnerabilityIssues(
    vulnerabilities: LLMVulnerability[],
    parsedCode: ParsedCode
  ): VulnerabilityIssue[] {
    return vulnerabilities.map(vuln => {
      const lineIndex = vuln.line - 1; // Convert to 0-indexed
      const codeLine = parsedCode.lines[lineIndex] || '';
      
      // Default column positions if not provided
      const columnStart = vuln.columnStart ?? 0;
      const columnEnd = vuln.columnEnd ?? codeLine.length;

      return {
        id: uuidv4(),
        title: vuln.title,
        description: vuln.description,
        severity: this.normalizeSeverity(vuln.severity),
        owaspCategory: vuln.owaspCategory,
        line: vuln.line,
        columnStart,
        columnEnd,
        fix: vuln.fix,
        source: 'llm',
        codeSnippet: codeLine
      };
    });
  }

  /**
   * Normalize severity string to SeverityLevel enum
   */
  private normalizeSeverity(severity: string): SeverityLevel {
    const normalized = severity.toLowerCase();
    
    switch (normalized) {
      case 'critical':
        return SeverityLevel.CRITICAL;
      case 'high':
        return SeverityLevel.HIGH;
      case 'medium':
        return SeverityLevel.MEDIUM;
      case 'low':
        return SeverityLevel.LOW;
      case 'info':
        return SeverityLevel.INFO;
      default:
        console.warn(`Unknown severity level: ${severity}, defaulting to MEDIUM`);
        return SeverityLevel.MEDIUM;
    }
  }
}
