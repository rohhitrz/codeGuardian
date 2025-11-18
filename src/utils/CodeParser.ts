/**
 * CodeParser - Parses code into a structured format for analysis
 */

import { Language, ParsedCode, Token } from '../models/types';
import { ICodeParser } from '../models/interfaces';

export class CodeParser implements ICodeParser {
  /**
   * Parse code into a structured format
   * @param code - The source code to parse
   * @param language - The programming language
   * @returns ParsedCode object with raw code, lines, and tokens
   */
  parse(code: string, language: Language): ParsedCode {
    try {
      // Split code into lines
      const lines = this.splitIntoLines(code);

      // Perform basic tokenization
      const tokens = this.tokenize(code, language);

      return {
        raw: code,
        lines,
        tokens
      };
    } catch (error) {
      // Handle malformed code gracefully
      console.error('Error parsing code:', error);
      
      // Return minimal parsed structure on error
      return {
        raw: code,
        lines: code.split('\n'),
        tokens: []
      };
    }
  }

  /**
   * Split code into lines, preserving empty lines
   * @param code - The source code
   * @returns Array of code lines
   */
  private splitIntoLines(code: string): string[] {
    return code.split('\n');
  }

  /**
   * Tokenize code for JavaScript/TypeScript
   * @param code - The source code
   * @param language - The programming language
   * @returns Array of tokens
   */
  private tokenize(code: string, language: Language): Token[] {
    const tokens: Token[] = [];
    const lines = code.split('\n');

    // Token patterns for JavaScript/TypeScript
    const tokenPatterns = [
      { type: 'keyword', pattern: /\b(const|let|var|function|class|if|else|for|while|return|import|export|async|await|try|catch|throw|new|this|super|extends|implements|interface|type|enum|public|private|protected|static|readonly)\b/g },
      { type: 'string', pattern: /(["'`])(?:(?=(\\?))\2.)*?\1/g },
      { type: 'number', pattern: /\b\d+\.?\d*\b/g },
      { type: 'operator', pattern: /[+\-*/%=<>!&|^~?:]+/g },
      { type: 'identifier', pattern: /\b[a-zA-Z_$][a-zA-Z0-9_$]*\b/g },
      { type: 'punctuation', pattern: /[{}()\[\];,\.]/g },
      { type: 'comment', pattern: /\/\/.*$|\/\*[\s\S]*?\*\//gm }
    ];

    lines.forEach((line, lineIndex) => {
      let column = 0;
      
      // Track all matches with their positions
      const matches: Array<{ type: string; value: string; column: number }> = [];

      tokenPatterns.forEach(({ type, pattern }) => {
        const regex = new RegExp(pattern);
        let match;

        while ((match = regex.exec(line)) !== null) {
          matches.push({
            type,
            value: match[0],
            column: match.index
          });
        }
      });

      // Sort matches by column position
      matches.sort((a, b) => a.column - b.column);

      // Add tokens in order, avoiding duplicates
      const processedColumns = new Set<number>();
      
      matches.forEach(match => {
        if (!processedColumns.has(match.column)) {
          tokens.push({
            type: match.type,
            value: match.value,
            line: lineIndex + 1, // 1-indexed line numbers
            column: match.column
          });
          processedColumns.add(match.column);
        }
      });
    });

    return tokens;
  }
}
