#!/usr/bin/env ts-node
/**
 * Scan a single file for security vulnerabilities
 * Usage: npx ts-node scripts/scan-file.ts <file-path>
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { SecurityScanEngine } from '../src/scanner/SecurityScanEngine';
import { SeverityLevel } from '../src/models/types';

// Load environment variables
dotenv.config();

async function scanFile(filePath: string) {
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  // Read file content
  const code = fs.readFileSync(filePath, 'utf-8');
  
  // Determine language from extension
  const ext = path.extname(filePath);
  const language = ext === '.ts' ? 'typescript' : 'javascript';

  console.log(`🔍 Scanning ${filePath}...\n`);

  // Create scanner and scan
  const scanner = new SecurityScanEngine();
  const result = await scanner.scan(code, language);

  // Display results
  if (result.issues.length === 0) {
    console.log('✅ No security vulnerabilities detected!\n');
    process.exit(0);
  }

  console.log(`⚠️  Found ${result.issues.length} security issue(s):\n`);

  // Group by severity
  const critical = result.issues.filter(i => i.severity === SeverityLevel.CRITICAL);
  const high = result.issues.filter(i => i.severity === SeverityLevel.HIGH);
  const medium = result.issues.filter(i => i.severity === SeverityLevel.MEDIUM);
  const low = result.issues.filter(i => i.severity === SeverityLevel.LOW);

  // Display critical issues
  if (critical.length > 0) {
    console.log('🔴 CRITICAL ISSUES:');
    critical.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.title} (Line ${issue.line})`);
      console.log(`     ${issue.description}`);
      console.log(`     Fix: ${issue.fix}\n`);
    });
  }

  // Display high issues
  if (high.length > 0) {
    console.log('🟠 HIGH PRIORITY ISSUES:');
    high.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.title} (Line ${issue.line})`);
      console.log(`     ${issue.description}`);
      console.log(`     Fix: ${issue.fix}\n`);
    });
  }

  // Display medium issues
  if (medium.length > 0) {
    console.log('🟡 MEDIUM PRIORITY ISSUES:');
    medium.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.title} (Line ${issue.line})`);
    });
    console.log();
  }

  // Display low issues
  if (low.length > 0) {
    console.log('🔵 LOW PRIORITY ISSUES:');
    low.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.title} (Line ${issue.line})`);
    });
    console.log();
  }

  // Summary
  console.log('📊 SUMMARY:');
  console.log(`   Total Issues: ${result.issues.length}`);
  if (critical.length > 0) console.log(`   Critical: ${critical.length}`);
  if (high.length > 0) console.log(`   High: ${high.length}`);
  if (medium.length > 0) console.log(`   Medium: ${medium.length}`);
  if (low.length > 0) console.log(`   Low: ${low.length}`);
  console.log(`   Scan Duration: ${result.metadata.duration}ms`);

  // Exit with error code if critical or high issues found
  if (critical.length > 0 || high.length > 0) {
    console.log('\n❌ Security scan failed due to critical/high severity issues');
    process.exit(1);
  }

  process.exit(0);
}

// Get file path from command line
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npx ts-node scripts/scan-file.ts <file-path>');
  process.exit(1);
}

scanFile(filePath).catch(error => {
  console.error('Error during scan:', error);
  process.exit(1);
});
