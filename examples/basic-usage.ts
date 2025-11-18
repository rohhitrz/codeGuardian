/**
 * Basic Usage Example for Security Scan Engine
 * 
 * This example demonstrates how to use the SecurityScanEngine to scan code
 * for security vulnerabilities.
 */

import * as dotenv from 'dotenv';
import { SecurityScanEngine } from '../src/scanner/SecurityScanEngine';
import { ScanResult, SeverityLevel, VulnerabilityIssue } from '../src/models/types';

// Load environment variables
dotenv.config();

// Sample vulnerable code for testing
const vulnerableCode = `
// SQL Injection vulnerability
function getUserData(userId) {
  const query = "SELECT * FROM users WHERE id = " + userId;
  return db.execute(query);
}

// XSS vulnerability
function displayMessage(message) {
  document.getElementById('output').innerHTML = message;
}

// Hardcoded credentials
const config = {
  apiKey: "sk-1234567890abcdef",
  password: "admin123"
};

// Insecure cryptography
const crypto = require('crypto');
function hashPassword(password) {
  return crypto.createHash('md5').update(password).digest('hex');
}
`;

async function main() {
  console.log('=== Security Scan Engine - Basic Usage Example ===\n');

  // Create scanner instance
  const scanner = new SecurityScanEngine();

  try {
    // Scan the vulnerable code
    console.log('Scanning code for security vulnerabilities...\n');
    const result: ScanResult = await scanner.scan(vulnerableCode, 'javascript');

    // Display results
    displayResults(result);

  } catch (error) {
    console.error('Error during scan:', error);
    process.exit(1);
  }
}

/**
 * Display scan results in a readable format
 */
function displayResults(result: ScanResult) {
  console.log('=== Scan Results ===\n');

  // Display metadata
  console.log('Metadata:');
  console.log(`  Language: ${result.metadata.language}`);
  console.log(`  Lines of Code: ${result.metadata.linesOfCode}`);
  console.log(`  Duration: ${result.metadata.duration}ms`);
  console.log(`  Analyzers Used: ${result.metadata.analyzersUsed.join(', ')}`);
  console.log(`  Timestamp: ${result.metadata.timestamp}\n`);

  // Display errors if any
  if (result.errors && result.errors.length > 0) {
    console.log('⚠️  Errors:');
    result.errors.forEach(error => console.log(`  - ${error}`));
    console.log();
  }

  // Display issues
  if (result.issues.length === 0) {
    console.log('✅ No security vulnerabilities detected!\n');
    return;
  }

  console.log(`🔍 Found ${result.issues.length} security issue(s):\n`);

  // Group issues by severity
  const issuesBySeverity = groupBySeverity(result.issues);

  // Display issues grouped by severity
  const severityOrder: SeverityLevel[] = [
    SeverityLevel.CRITICAL,
    SeverityLevel.HIGH,
    SeverityLevel.MEDIUM,
    SeverityLevel.LOW,
    SeverityLevel.INFO
  ];

  severityOrder.forEach(severity => {
    const issues = issuesBySeverity[severity];
    if (issues && issues.length > 0) {
      console.log(`${getSeverityIcon(severity)} ${severity.toUpperCase()} (${issues.length}):`);
      console.log('─'.repeat(60));

      issues.forEach((issue: VulnerabilityIssue, index: number) => {
        console.log(`\n${index + 1}. ${issue.title}`);
        console.log(`   Location: Line ${issue.line}, Column ${issue.columnStart}-${issue.columnEnd}`);
        console.log(`   OWASP: ${issue.owaspCategory}`);
        console.log(`   Description: ${issue.description}`);
        console.log(`   Fix: ${issue.fix}`);
        console.log(`   Source: ${issue.source}`);
      });

      console.log('\n');
    }
  });

  // Summary
  console.log('=== Summary ===');
  console.log(`Total Issues: ${result.issues.length}`);
  severityOrder.forEach(severity => {
    const count = issuesBySeverity[severity]?.length || 0;
    if (count > 0) {
      console.log(`  ${severity}: ${count}`);
    }
  });
}

/**
 * Group issues by severity level
 */
function groupBySeverity(issues: VulnerabilityIssue[]) {
  return issues.reduce((acc, issue) => {
    const severity = issue.severity;
    if (!acc[severity]) {
      acc[severity] = [];
    }
    acc[severity].push(issue);
    return acc;
  }, {} as Record<SeverityLevel, VulnerabilityIssue[]>);
}

/**
 * Get icon for severity level
 */
function getSeverityIcon(severity: SeverityLevel): string {
  const icons = {
    [SeverityLevel.CRITICAL]: '🔴',
    [SeverityLevel.HIGH]: '🟠',
    [SeverityLevel.MEDIUM]: '🟡',
    [SeverityLevel.LOW]: '🔵',
    [SeverityLevel.INFO]: '⚪'
  };
  return icons[severity] || '⚪';
}

// Run the example
main();
