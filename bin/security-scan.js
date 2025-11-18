#!/usr/bin/env node

/**
 * Security Scan CLI
 * Simple command-line interface for scanning code
 * 
 * Usage:
 *   npx security-scan-engine scan myfile.js
 *   npx security-scan-engine scan src/
 */

const { SecurityScanEngine } = require('../dist/scanner/SecurityScanEngine');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

function printBanner() {
  console.log(`
${colors.cyan}╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🛡️  Security Scan Engine                       ║
║           AI-Powered Vulnerability Detection             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝${colors.reset}
`);
}

function printHelp() {
  console.log(`
${colors.bold}Usage:${colors.reset}
  npx security-scan-engine scan <file-or-directory>
  npx security-scan-engine --help
  npx security-scan-engine --version

${colors.bold}Examples:${colors.reset}
  ${colors.cyan}# Scan a single file${colors.reset}
  npx security-scan-engine scan app.js

  ${colors.cyan}# Scan a directory${colors.reset}
  npx security-scan-engine scan src/

  ${colors.cyan}# Scan current directory${colors.reset}
  npx security-scan-engine scan .

${colors.bold}Options:${colors.reset}
  --help, -h     Show this help message
  --version, -v  Show version number
  --json         Output results as JSON

${colors.bold}Environment Variables:${colors.reset}
  OPENAI_API_KEY  Your OpenAI API key (optional, for AI analysis)

${colors.bold}Note:${colors.reset}
  Without OPENAI_API_KEY, only static analysis will be performed.
  With OPENAI_API_KEY, both static and AI analysis will run.
`);
}

function getSeverityIcon(severity) {
  const icons = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
    info: '⚪'
  };
  return icons[severity] || '⚪';
}

function getSeverityColor(severity) {
  const severityColors = {
    critical: colors.red,
    high: colors.yellow,
    medium: colors.blue,
    low: colors.cyan,
    info: colors.white
  };
  return severityColors[severity] || colors.white;
}

async function scanFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`${colors.red}❌ File not found: ${filePath}${colors.reset}`);
    process.exit(1);
  }

  const code = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath);
  const language = ext === '.ts' ? 'typescript' : 'javascript';

  const scanner = new SecurityScanEngine();
  return await scanner.scan(code, language);
}

async function scanDirectory(dirPath) {
  const files = getAllFiles(dirPath, ['.js', '.ts']);
  
  if (files.length === 0) {
    console.log(`${colors.yellow}⚠️  No JavaScript or TypeScript files found${colors.reset}`);
    return null;
  }

  console.log(`${colors.cyan}🔍 Scanning ${files.length} file(s)...${colors.reset}\n`);

  const scanner = new SecurityScanEngine();
  const allResults = [];

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf-8');
    const ext = path.extname(file);
    const language = ext === '.ts' ? 'typescript' : 'javascript';

    try {
      const result = await scanner.scan(code, language);
      allResults.push({ file, result });
      
      const icon = result.issues.length > 0 ? '⚠️ ' : '✅';
      const relativePath = path.relative(dirPath, file);
      console.log(`  ${icon} ${relativePath}: ${result.issues.length} issue(s)`);
    } catch (error) {
      console.error(`  ❌ ${file}: Error - ${error.message}`);
    }
  }

  return allResults;
}

function getAllFiles(dirPath, extensions) {
  const files = [];

  function traverse(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

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

function displayResults(results, isDirectory = false) {
  if (isDirectory) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.bold}📊 SCAN SUMMARY${colors.reset}`);
    console.log('='.repeat(60));

    const totalIssues = results.reduce((sum, r) => sum + r.result.issues.length, 0);
    const filesWithIssues = results.filter(r => r.result.issues.length > 0).length;

    console.log(`Files Scanned: ${results.length}`);
    console.log(`Files with Issues: ${filesWithIssues}`);
    console.log(`Total Issues: ${totalIssues}`);

    // Count by severity
    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    results.forEach(r => {
      r.result.issues.forEach(issue => {
        severityCounts[issue.severity]++;
      });
    });

    if (severityCounts.critical > 0) console.log(`  🔴 Critical: ${severityCounts.critical}`);
    if (severityCounts.high > 0) console.log(`  🟠 High: ${severityCounts.high}`);
    if (severityCounts.medium > 0) console.log(`  🟡 Medium: ${severityCounts.medium}`);
    if (severityCounts.low > 0) console.log(`  🔵 Low: ${severityCounts.low}`);

    // Show detailed issues
    const filesWithIssuesDetails = results.filter(r => r.result.issues.length > 0);
    if (filesWithIssuesDetails.length > 0) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`${colors.bold}🔍 DETAILED ISSUES${colors.reset}`);
      console.log('='.repeat(60));

      filesWithIssuesDetails.forEach(({ file, result }) => {
        console.log(`\n${colors.bold}📄 ${path.basename(file)}${colors.reset}`);
        result.issues.slice(0, 5).forEach((issue, i) => {
          const icon = getSeverityIcon(issue.severity);
          const color = getSeverityColor(issue.severity);
          console.log(`  ${icon} ${i + 1}. ${issue.title} (Line ${issue.line})`);
          console.log(`     ${color}Severity: ${issue.severity.toUpperCase()}${colors.reset}`);
          console.log(`     ${issue.description.substring(0, 100)}...`);
        });
        if (result.issues.length > 5) {
          console.log(`  ... and ${result.issues.length - 5} more issues`);
        }
      });
    }

    // Exit code
    if (severityCounts.critical > 0 || severityCounts.high > 0) {
      console.log(`\n${colors.red}❌ Security scan failed due to critical/high severity issues${colors.reset}`);
      process.exit(1);
    } else {
      console.log(`\n${colors.green}✅ Security scan completed successfully${colors.reset}`);
    }
  } else {
    // Single file results
    const result = results;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${colors.bold}📊 SCAN RESULTS${colors.reset}`);
    console.log('='.repeat(60));

    if (result.issues.length === 0) {
      console.log(`\n${colors.green}✅ No security vulnerabilities detected!${colors.reset}\n`);
      return;
    }

    console.log(`\n${colors.yellow}⚠️  Found ${result.issues.length} security issue(s)${colors.reset}\n`);

    // Group by severity
    const bySeverity = {};
    result.issues.forEach(issue => {
      if (!bySeverity[issue.severity]) bySeverity[issue.severity] = [];
      bySeverity[issue.severity].push(issue);
    });

    // Display by severity
    ['critical', 'high', 'medium', 'low', 'info'].forEach(severity => {
      const issues = bySeverity[severity];
      if (issues && issues.length > 0) {
        const icon = getSeverityIcon(severity);
        const color = getSeverityColor(severity);
        console.log(`${icon} ${color}${severity.toUpperCase()} (${issues.length})${colors.reset}`);
        console.log('─'.repeat(60));

        issues.forEach((issue, i) => {
          console.log(`\n${i + 1}. ${colors.bold}${issue.title}${colors.reset}`);
          console.log(`   Location: Line ${issue.line}, Column ${issue.columnStart}-${issue.columnEnd}`);
          console.log(`   OWASP: ${issue.owaspCategory}`);
          console.log(`   ${issue.description}`);
          console.log(`   ${colors.green}Fix: ${issue.fix}${colors.reset}`);
        });
        console.log();
      }
    });

    // Exit code
    if (bySeverity.critical || bySeverity.high) {
      console.log(`${colors.red}❌ Security scan failed due to critical/high severity issues${colors.reset}`);
      process.exit(1);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Handle help
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printBanner();
    printHelp();
    process.exit(0);
  }

  // Handle version
  if (args.includes('--version') || args.includes('-v')) {
    const pkg = require('../package.json');
    console.log(`v${pkg.version}`);
    process.exit(0);
  }

  // Handle scan command
  if (args[0] === 'scan') {
    if (args.length < 2) {
      console.error(`${colors.red}❌ Please specify a file or directory to scan${colors.reset}`);
      console.log(`\nUsage: npx security-scan-engine scan <file-or-directory>`);
      process.exit(1);
    }

    printBanner();

    const target = args[1];
    const stats = fs.statSync(target);

    if (stats.isFile()) {
      const result = await scanFile(target);
      displayResults(result, false);
    } else if (stats.isDirectory()) {
      const results = await scanDirectory(target);
      if (results) {
        displayResults(results, true);
      }
    }
  } else {
    console.error(`${colors.red}❌ Unknown command: ${args[0]}${colors.reset}`);
    console.log(`\nRun 'npx security-scan-engine --help' for usage information`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
  process.exit(1);
});
