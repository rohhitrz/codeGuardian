/**
 * Configuration management for Security Scan Engine
 * Supports environment variable overrides
 */

import { SeverityLevel } from '../models/types';

/**
 * LLM configuration settings
 */
export interface LLMSettings {
  apiKey: string;
  model: string;
  timeout: number;
  temperature: number;
  maxTokens: number;
}

/**
 * Static analyzer configuration settings
 */
export interface StaticAnalyzerSettings {
  enabledRules: string[];
  severityThreshold: SeverityLevel;
}

/**
 * Scan limits configuration
 */
export interface ScanLimits {
  maxCodeSize: number; // in bytes
  maxIssues: number;
}

/**
 * Complete configuration for Security Scan Engine
 */
export interface SecurityScanConfig {
  llm: LLMSettings;
  staticAnalyzer: StaticAnalyzerSettings;
  scanLimits: ScanLimits;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: SecurityScanConfig = {
  llm: {
    apiKey: '',
    model: 'gpt-4',
    timeout: 30000, // 30 seconds
    temperature: 0.3,
    maxTokens: 2000
  },
  staticAnalyzer: {
    enabledRules: ['sql-injection', 'xss', 'hardcoded-credentials', 'insecure-crypto'],
    severityThreshold: SeverityLevel.INFO
  },
  scanLimits: {
    maxCodeSize: 100 * 1024, // 100KB
    maxIssues: 1000
  }
};

/**
 * Configuration manager class
 */
export class Config {
  private config: SecurityScanConfig;

  constructor(customConfig?: Partial<SecurityScanConfig>) {
    this.config = this.loadConfig(customConfig);
  }

  /**
   * Load configuration with environment variable overrides
   */
  private loadConfig(customConfig?: Partial<SecurityScanConfig>): SecurityScanConfig {
    const config: SecurityScanConfig = {
      llm: {
        apiKey: process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || DEFAULT_CONFIG.llm.apiKey,
        model: process.env.LLM_MODEL || DEFAULT_CONFIG.llm.model,
        timeout: parseInt(process.env.LLM_TIMEOUT || '') || DEFAULT_CONFIG.llm.timeout,
        temperature: parseFloat(process.env.LLM_TEMPERATURE || '') || DEFAULT_CONFIG.llm.temperature,
        maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '') || DEFAULT_CONFIG.llm.maxTokens
      },
      staticAnalyzer: {
        enabledRules: process.env.STATIC_ENABLED_RULES
          ? process.env.STATIC_ENABLED_RULES.split(',')
          : DEFAULT_CONFIG.staticAnalyzer.enabledRules,
        severityThreshold: (process.env.STATIC_SEVERITY_THRESHOLD as SeverityLevel) || DEFAULT_CONFIG.staticAnalyzer.severityThreshold
      },
      scanLimits: {
        maxCodeSize: parseInt(process.env.SCAN_MAX_CODE_SIZE || '') || DEFAULT_CONFIG.scanLimits.maxCodeSize,
        maxIssues: parseInt(process.env.SCAN_MAX_ISSUES || '') || DEFAULT_CONFIG.scanLimits.maxIssues
      }
    };

    // Merge with custom config if provided
    if (customConfig) {
      if (customConfig.llm) {
        config.llm = { ...config.llm, ...customConfig.llm };
      }
      if (customConfig.staticAnalyzer) {
        config.staticAnalyzer = { ...config.staticAnalyzer, ...customConfig.staticAnalyzer };
      }
      if (customConfig.scanLimits) {
        config.scanLimits = { ...config.scanLimits, ...customConfig.scanLimits };
      }
    }

    return config;
  }

  /**
   * Get LLM settings
   */
  getLLMSettings(): LLMSettings {
    return { ...this.config.llm };
  }

  /**
   * Get static analyzer settings
   */
  getStaticAnalyzerSettings(): StaticAnalyzerSettings {
    return { ...this.config.staticAnalyzer };
  }

  /**
   * Get scan limits
   */
  getScanLimits(): ScanLimits {
    return { ...this.config.scanLimits };
  }

  /**
   * Get complete configuration
   */
  getConfig(): SecurityScanConfig {
    return {
      llm: { ...this.config.llm },
      staticAnalyzer: { ...this.config.staticAnalyzer },
      scanLimits: { ...this.config.scanLimits }
    };
  }

  /**
   * Update LLM settings
   */
  updateLLMSettings(settings: Partial<LLMSettings>): void {
    this.config.llm = { ...this.config.llm, ...settings };
  }

  /**
   * Update static analyzer settings
   */
  updateStaticAnalyzerSettings(settings: Partial<StaticAnalyzerSettings>): void {
    this.config.staticAnalyzer = { ...this.config.staticAnalyzer, ...settings };
  }

  /**
   * Update scan limits
   */
  updateScanLimits(limits: Partial<ScanLimits>): void {
    this.config.scanLimits = { ...this.config.scanLimits, ...limits };
  }

  /**
   * Check if a rule is enabled
   */
  isRuleEnabled(ruleId: string): boolean {
    return this.config.staticAnalyzer.enabledRules.includes(ruleId);
  }

  /**
   * Check if severity meets threshold
   */
  meetsSeverityThreshold(severity: SeverityLevel): boolean {
    const severityOrder = [
      SeverityLevel.INFO,
      SeverityLevel.LOW,
      SeverityLevel.MEDIUM,
      SeverityLevel.HIGH,
      SeverityLevel.CRITICAL
    ];

    const severityIndex = severityOrder.indexOf(severity);
    const thresholdIndex = severityOrder.indexOf(this.config.staticAnalyzer.severityThreshold);

    return severityIndex >= thresholdIndex;
  }
}

/**
 * Singleton instance for global configuration
 */
let globalConfig: Config | null = null;

/**
 * Get or create global configuration instance
 */
export function getConfig(customConfig?: Partial<SecurityScanConfig>): Config {
  if (!globalConfig) {
    globalConfig = new Config(customConfig);
  }
  return globalConfig;
}

/**
 * Reset global configuration (useful for testing)
 */
export function resetConfig(): void {
  globalConfig = null;
}
