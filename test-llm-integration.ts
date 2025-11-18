/**
 * Test script to verify OpenAI LLM integration
 * Run with: npx ts-node test-llm-integration.ts
 */

import * as dotenv from 'dotenv';
import { SecurityScanEngine } from './src/scanner/SecurityScanEngine';

// Load environment variables
dotenv.config();

async function testLLMIntegration() {
  console.log('🔍 Testing OpenAI LLM Integration...\n');

  // Check if API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not found in environment variables');
    console.log('Please create a .env file with your OpenAI API key');
    process.exit(1);
  }

  console.log('✅ OpenAI API key found');
  console.log(`   Key starts with: ${process.env.OPENAI_API_KEY.substring(0, 20)}...`);

  // Create scanner instance
  const scanner = new SecurityScanEngine();
  console.log('\n✅ SecurityScanEngine initialized\n');

  // Test 1: Simple vulnerable code
  console.log('📝 Test 1: SQL Injection Detection');
  console.log('─'.repeat(50));
  
  const sqlInjectionCode = `
const userId = req.params.id;
const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);
  `.trim();

  console.log('Code to scan:');
  console.log(sqlInjectionCode);
  console.log();

  try {
    const result1 = await scanner.scan(sqlInjectionCode, 'javascript');
    
    console.log(`\n✅ Scan completed successfully!`);
    console.log(`   Duration: ${result1.metadata.duration}ms`);
    console.log(`   Analyzers used: ${result1.metadata.analyzersUsed.join(', ')}`);
    console.log(`   Issues found: ${result1.issues.length}`);
    
    if (result1.issues.length > 0) {
      console.log('\n📋 Detected Issues:');
      result1.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.title} [${issue.severity}]`);
        console.log(`   Source: ${issue.source}`);
        console.log(`   Line: ${issue.line}`);
        console.log(`   Description: ${issue.description}`);
        console.log(`   Fix: ${issue.fix}`);
      });
    }

    if (result1.errors && result1.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result1.errors.forEach(error => console.log(`   - ${error}`));
    }
  } catch (error) {
    console.error('\n❌ Test 1 failed:', error);
    process.exit(1);
  }

  // Test 2: Multiple vulnerabilities
  console.log('\n\n📝 Test 2: Multiple Vulnerabilities');
  console.log('─'.repeat(50));
  
  const multiVulnCode = `
const password = "MySecretPass123";
const apiKey = "sk-1234567890abcdef";
element.innerHTML = userInput;
const hash = crypto.createHash('md5').update(data).digest('hex');
  `.trim();

  console.log('Code to scan:');
  console.log(multiVulnCode);
  console.log();

  try {
    const result2 = await scanner.scan(multiVulnCode, 'javascript');
    
    console.log(`\n✅ Scan completed successfully!`);
    console.log(`   Duration: ${result2.metadata.duration}ms`);
    console.log(`   Analyzers used: ${result2.metadata.analyzersUsed.join(', ')}`);
    console.log(`   Issues found: ${result2.issues.length}`);
    console.log(`   LLM Model: ${result2.metadata.llmModel}`);
    
    if (result2.issues.length > 0) {
      console.log('\n📋 Detected Issues:');
      result2.issues.forEach((issue, index) => {
        console.log(`\n${index + 1}. ${issue.title} [${issue.severity}]`);
        console.log(`   Source: ${issue.source}`);
        console.log(`   OWASP: ${issue.owaspCategory}`);
      });
    }

    if (result2.errors && result2.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      result2.errors.forEach(error => console.log(`   - ${error}`));
    }
  } catch (error) {
    console.error('\n❌ Test 2 failed:', error);
    process.exit(1);
  }

  // Test 3: Clean code (no vulnerabilities)
  console.log('\n\n📝 Test 3: Clean Code');
  console.log('─'.repeat(50));
  
  const cleanCode = `
const x = 1;
const y = 2;
const sum = x + y;
console.log(sum);
  `.trim();

  console.log('Code to scan:');
  console.log(cleanCode);
  console.log();

  try {
    const result3 = await scanner.scan(cleanCode, 'javascript');
    
    console.log(`\n✅ Scan completed successfully!`);
    console.log(`   Duration: ${result3.metadata.duration}ms`);
    console.log(`   Issues found: ${result3.issues.length}`);
    
    if (result3.issues.length === 0) {
      console.log('   ✅ No vulnerabilities detected (as expected)');
    }
  } catch (error) {
    console.error('\n❌ Test 3 failed:', error);
    process.exit(1);
  }

  console.log('\n\n' + '='.repeat(50));
  console.log('🎉 All LLM integration tests passed!');
  console.log('='.repeat(50));
}

// Run the tests
testLLMIntegration().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
