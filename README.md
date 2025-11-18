# Security Scan Engine 🛡️

An AI-powered security vulnerability scanner that combines static rule-based analysis with GPT-4 intelligence to find security issues in JavaScript and TypeScript code **before** they reach production.

## ✨ Key Features

- 🔍 **Dual Analysis**: Static rules + AI-powered detection
- ⚡ **Fast & Accurate**: Scans code in seconds with high accuracy
- 🎯 **OWASP Aligned**: Detects vulnerabilities from OWASP Top 10
- 🔧 **Easy Integration**: CLI, API, or programmatic usage
- 📊 **Detailed Reports**: Clear descriptions and actionable fixes
- 🚀 **Production Ready**: Rate limiting, error handling, and testing included

## 🚦 Quick Start

### ⚡ Super Simple (No Installation!)

```bash
# Scan any file with ONE command
npx security-scan-engine scan myfile.js

# Scan a directory
npx security-scan-engine scan src/

# That's it! No setup needed!
```

### 🔧 For Development

```bash
# Clone and install
git clone <your-repo>
cd security-scan-engine
npm install

# Set up OpenAI API key (optional, for AI analysis)
echo "OPENAI_API_KEY=your-key-here" > .env

# Build
npm run build

# Try the example
npx ts-node examples/basic-usage.ts
```

**See [QUICK_START.md](QUICK_START.md) for detailed setup instructions.**

## Project Structure

```
src/
├── models/           # Core type definitions and interfaces
│   ├── types.ts      # Data models, enums, and type definitions
│   ├── interfaces.ts # Component interfaces
│   └── index.ts      # Central export
├── scanner/          # Main orchestrator
├── analyzers/        # Static and LLM analyzers
└── utils/            # Helper functions and utilities
```

## Core Types

- **Language**: Enum for supported programming languages (JavaScript, TypeScript)
- **SeverityLevel**: Enum for vulnerability severity (Critical, High, Medium, Low, Info)
- **VulnerabilityIssue**: Detected security issue with metadata
- **ScanResult**: Complete scan output with issues and metadata
- **ParsedCode**: Structured representation of analyzed code

## Interfaces

- **ISecurityScanEngine**: Main orchestrator interface
- **ILanguageDetector**: Language detection
- **ICodeParser**: Code parsing
- **IStaticAnalyzer**: Rule-based analysis
- **ILLMAnalyzer**: LLM-powered analysis
- **IResultAggregator**: Result combination
- **IDeduplicator**: Duplicate removal
- **IFormatter**: Output formatting

## Getting Started

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Usage

### Basic Example

```typescript
import { SecurityScanEngine } from './src/scanner/SecurityScanEngine';

// Create scanner instance
const scanner = new SecurityScanEngine();

// Sample code to scan
const code = `
const userId = req.params.id;
const query = "SELECT * FROM users WHERE id = " + userId;
db.execute(query);
`;

// Scan the code
const result = await scanner.scan(code, '.js');

// Process results
console.log(`Found ${result.issues.length} security issues`);
result.issues.forEach(issue => {
  console.log(`${issue.title} [${issue.severity}] at line ${issue.line}`);
  console.log(`Fix: ${issue.fix}`);
});
```

### Configuration

The LLM analyzer requires an OpenAI API key:

```bash
export OPENAI_API_KEY="your-api-key-here"
```

The scanner uses OpenAI's GPT-4o-mini model by default. You can customize the model:

```typescript
import { LLMAnalyzer } from './src/analyzers/LLMAnalyzer';

const customAnalyzer = new LLMAnalyzer({
  model: 'gpt-4',
  temperature: 0.1,
  maxTokens: 4096,
  timeout: 30000
});
```

If the API key is not set, the scanner will still work using only the static analyzer.

### Scan Result Structure

```typescript
interface ScanResult {
  success: boolean;
  issues: VulnerabilityIssue[];
  metadata: {
    timestamp: string;
    duration: number;
    language: string;
    linesOfCode: number;
    analyzersUsed: string[];
    staticRulesApplied: number;
    llmModel?: string;
  };
  errors?: string[];
}
```

### Supported Vulnerability Types

The scanner detects:
- **SQL Injection** (OWASP A03:2021)
- **Cross-Site Scripting (XSS)** (OWASP A03:2021)
- **Hardcoded Credentials** (OWASP A07:2021)
- **Insecure Cryptography** (OWASP A02:2021)

## 💡 How It Helps

### For Developers
- Catch vulnerabilities during development, not in production
- Learn secure coding practices through detailed fix suggestions
- Save time with automated security reviews

### For Teams
- Maintain consistent security standards across the codebase
- Reduce security debt with continuous scanning
- Integrate into CI/CD for automated checks

### For Organizations
- Deploy as a centralized security service
- Track security metrics and improvements
- Comply with security standards and regulations

**See [USAGE_GUIDE.md](USAGE_GUIDE.md) for real-world use cases and integration examples.**

## 🎯 What It Detects

- **SQL Injection** (OWASP A03:2021) - Unsafe database queries
- **Cross-Site Scripting (XSS)** (OWASP A03:2021) - Unsafe HTML manipulation
- **Hardcoded Credentials** (OWASP A07:2021) - Exposed secrets in code
- **Insecure Cryptography** (OWASP A02:2021) - Weak hashing algorithms

## 📖 Documentation

| Document | Description | Best For |
|----------|-------------|----------|
| **[OVERVIEW.md](OVERVIEW.md)** | Visual overview and quick reference | Quick understanding |
| **[HOW_TO_USE.md](HOW_TO_USE.md)** | Complete guide on using the scanner | Everyone - start here! |
| **[QUICK_START.md](QUICK_START.md)** | Get started in 5 minutes | First-time users |
| **[USAGE_GUIDE.md](USAGE_GUIDE.md)** | Real-world use cases and integrations | Teams & organizations |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Production deployment guide | DevOps & infrastructure |
| **[BENEFITS.md](BENEFITS.md)** | ROI and value proposition | Decision makers |
| **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** | Complete project overview | Understanding the project |
| **[examples/README.md](examples/README.md)** | Example scripts and API usage | Developers |

## 🛠️ Usage Options

### 1. Command Line
```bash
# Scan a file
npx ts-node scripts/scan-file.ts src/app.js

# Scan a directory
npx ts-node scripts/scan-directory.ts src/
```

### 2. Programmatic API
```typescript
import { SecurityScanEngine } from './src/scanner/SecurityScanEngine';

const scanner = new SecurityScanEngine();
const result = await scanner.scan(code, 'javascript');
```

### 3. REST API
```bash
# Start server
npx ts-node examples/api-server.ts

# Make requests
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "language": "javascript"}'
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- src/scanner/SecurityScanEngine.test.ts
```

## Requirements

- Node.js 18+
- TypeScript 5.0+
- OpenAI API key (optional, for LLM analysis)

## 🤝 Contributing

Contributions are welcome! Whether it's:
- Adding new vulnerability detection rules
- Improving LLM prompts for better accuracy
- Creating integrations with popular tools
- Sharing use cases and success stories

## 📄 License

MIT

---

**Made with ❤️ for secure coding. Start scanning today!**
# codeGuardian
