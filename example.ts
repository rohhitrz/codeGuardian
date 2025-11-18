/**
 * Example usage of the Security Scan Engine
 */

import { SecurityScanEngine } from './src/scanner/SecurityScanEngine';

// Sample vulnerable code for testing
const vulnerableCode = `
// SQL Injection vulnerability
const userId = req.params.id;
const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);

// XSS vulnerability
const userInput = req.body.comment;
element.innerHTML = userInput;

// Hardcoded credentials
const apiKey = "sk-1234567890abcdefghijklmnop";
const password = "MySecretPassword123!";

// Insecure cryptography
const crypto = require('crypto');
const hash = crypto.createHash('md5').update(password).digest('hex');
`;

async function main() {
  console.log('🔍 Security Scan Engine - Example Usage\n');
  console.log('Scanning vulnerable code sample...\n');

  // Create scanner instance
  const scanner = new SecurityScanEngine();

  try {
    // Scan the code
    const result = await scanner.scan(vulnerableCode, '.js');

    // Display results
    console.log('✅ Scan completed successfully!\n');
    console.log(`📊 Scan Metadata:`);
    console.log(`   - Language: ${result.metadata.language}`);
    console.log(`   - Lines of Code: ${result.metadata.linesOfCode}`);
    console.log(`   - Duration: ${result.metadata.duration}ms`);
    console.log(`   - Analyzers Used: ${result.metadata.analyzersUsed.join(', ')}`);
    console.log(`   - Static Rules Applied: ${result.metadata.staticRulesApplied}\n`);

    console.log(`🚨 Found ${result.issues.length} security issues:\n`);

    // Display each issue
    result.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.title} [${issue.severity.toUpperCase()}]`);
      console.log(`   Line: ${issue.line}, Columns: ${issue.columnStart}-${issue.columnEnd}`);
      console.log(`   OWASP: ${issue.owaspCategory}`);
      console.log(`   Description: ${issue.description}`);
      console.log(`   Fix: ${issue.fix}`);
      console.log(`   Source: ${issue.source}`);
      if (issue.codeSnippet) {
        console.log(`   Code: ${issue.codeSnippet}`);
      }
      console.log('');
    });

    // Display any errors
    if (result.errors && result.errors.length > 0) {
      console.log('⚠️  Warnings/Errors:');
      result.errors.forEach(error => console.log(`   - ${error}`));
    }

  } catch (error) {
    console.error('❌ Error during scan:', error);
  }
}

// Run the example
main();
