#!/usr/bin/env ts-node
/**
 * Scan all JavaScript/TypeScript files in a directory
 * Usage: npx ts-node scripts/scan-directory.ts <directory-path>
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { SecurityScanEngine } from '../src/scanner/SecurityScanEngine';
import { SeverityLevel, VulnerabilityIssue } from '../src/models/types';

// Load environment variables
dotenv.config();

interface ScanStats {
  filesScanned: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  filesWithIssues: string[];
}

async function scanDirectory(dirPath: string): Promise<ScanStats> {
  const stats: ScanStats = {
    filesScanned: 0,
    totalIssues: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
    filesWithIssues: []
  };

  // Check if directory exists
  if (!fs.existsSync(dirPath)) {
    console.error(`❌ Directory not found: ${dirPath}`);
    process.exit(1);
  }

  // Get all JS/TS files
  const files = getAllFiles(dirPath, ['.js', '.ts']);
  
  if (files.length === 0) {
    console.log('No JavaScript or TypeScript files found.');
    return stats;
  }

  console.log(`🔍 Scanning ${files.length} file(s) in ${dirPath}...\n`);

  const scanner = new SecurityScanEngine();
  const allIssues: Array<{ file: string; issues: VulnerabilityIssue[] }> = [];

  // Scan each file
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf-8');
    const ext = path.extname(file);
    const language = ext === '.ts' ? 'typescript' : 'javascript';

    try {
      const result = await scanner.scan(code, language);
      stats.filesScanned++;

      if (result.issues.length > 0) {
        stats.filesWithIssues.push(file);
        allIssues.push({ file, issues: result.issues });
        
        stats.totalIssues += result.issues.length;
        stats.criticalIssues += result.issues.filter(i => i.severity === SeverityLevel.CRITICAL).length;
        stats.highIssues += result.issues.filter(i => i.severity === SeverityLevel.HIGH).length;
        stats.mediumIssues += result.issues.filter(i => i.severity === SeverityLevel.MEDIUM).length;
        stats.lowIssues += result.issues.filter(i => i.severity === SeverityLevel.LOW).length;

        console.log(`  ⚠️  ${path.relative(dirPath, file)}: ${result.issues.length} issue(s)`);
      } else {
        console.log(`  ✅ ${path.relative(dirPath, file)}: No issues`);
      }
    } catch (error) {
      console.error(`  ❌ Error scanning ${file}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SCAN SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files Scanned: ${stats.filesScanned}`);
  console.log(`Files with Issues: ${stats.filesWithIssues.length}`);
  console.log(`Total Issues: ${stats.totalIssues}`);
  
  if (stats.criticalIssues > 0) {
    console.log(`  🔴 Critical: ${stats.criticalIssues}`);
  }
  if (stats.highIssues > 0) {
    console.log(`  🟠 High: ${stats.highIssues}`);
  }
  if (stats.mediumIssues > 0) {
    console.log(`  🟡 Medium: ${stats.mediumIssues}`);
  }
  if (stats.lowIssues > 0) {
    console.log(`  🔵 Low: ${stats.lowIssues}`);
  }

  // Display detailed issues
  if (allIssues.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 DETAILED ISSUES');
    console.log('='.repeat(60));

    allIssues.forEach(({ file, issues }) => {
      console.log(`\n📄 ${path.relative(dirPath, file)}`);
      
      issues.forEach((issue, i) => {
        const icon = getSeverityIcon(issue.severity);
        console.log(`  ${icon} ${i + 1}. ${issue.title} (Line ${issue.line})`);
        console.log(`     Severity: ${issue.severity.toUpperCase()}`);
        console.log(`     ${issue.description}`);
        console.log(`     Fix: ${issue.fix}`);
      });
    });
  }

  return stats;
}

function getAllFiles(dirPath: string, extensions: string[]): string[] {
  const files: string[] = [];

  function traverse(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip node_modules and hidden directories
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          traverse(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  traverse(dirPath);
  return files;
}

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

// Get directory path from command line
const dirPath = process.argv[2] || '.';

scanDirectory(dirPath).then(stats => {
  // Exit with error code if critical or high issues found
  if (stats.criticalIssues > 0 || stats.highIssues > 0) {
    console.log('\n❌ Security scan failed due to critical/high severity issues');
    process.exit(1);
  }

  console.log('\n✅ Security scan completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Error during scan:', error);
  process.exit(1);
});
