# Security Scan Engine - Usage Guide

## 🎯 What is This?

The Security Scan Engine is an AI-powered code security scanner that helps developers find vulnerabilities in JavaScript and TypeScript code **before** they reach production. It combines traditional static analysis with GPT-4 intelligence to catch security issues that other tools miss.

## 🚀 Who Can Use This?

### 1. **Individual Developers**
Scan your code locally before committing to catch security issues early.

### 2. **Development Teams**
Integrate into your workflow to maintain security standards across the team.

### 3. **DevOps/Security Teams**
Deploy as a service for organization-wide security scanning.

### 4. **Code Review Tools**
Integrate into PR review processes to automatically flag security concerns.

### 5. **Educational Institutions**
Teach students about secure coding practices with real-time feedback.

---

## 💡 Real-World Use Cases

### Use Case 1: Pre-Commit Hook
**Problem**: Developers accidentally commit code with security vulnerabilities.

**Solution**: Add a pre-commit hook that scans changed files.

```bash
# .git/hooks/pre-commit
#!/bin/bash

# Get staged JavaScript/TypeScript files
FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts)$')

if [ -n "$FILES" ]; then
  echo "🔍 Scanning files for security vulnerabilities..."
  
  for FILE in $FILES; do
    npx ts-node scripts/scan-file.js "$FILE"
    if [ $? -ne 0 ]; then
      echo "❌ Security issues found in $FILE"
      echo "Fix the issues or use 'git commit --no-verify' to skip"
      exit 1
    fi
  done
fi

echo "✅ Security scan passed!"
```

### Use Case 2: CI/CD Pipeline Integration
**Problem**: Need automated security checks in your deployment pipeline.

**Solution**: Add to your GitHub Actions, GitLab CI, or Jenkins pipeline.

**GitHub Actions Example:**
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run security scan
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          npx ts-node scripts/scan-all.js
      
      - name: Upload scan results
        uses: actions/upload-artifact@v3
        with:
          name: security-scan-results
          path: scan-results.json
```

### Use Case 3: VS Code Extension
**Problem**: Developers want real-time security feedback while coding.

**Solution**: Create a VS Code extension that uses the scanner.

```typescript
// VS Code extension example
import * as vscode from 'vscode';
import { SecurityScanEngine } from 'security-scan-engine';

export function activate(context: vscode.ExtensionContext) {
  const scanner = new SecurityScanEngine();
  
  // Scan on save
  vscode.workspace.onDidSaveTextDocument(async (document) => {
    if (document.languageId === 'javascript' || document.languageId === 'typescript') {
      const code = document.getText();
      const result = await scanner.scan(code, document.languageId);
      
      // Show diagnostics
      const diagnostics = result.issues.map(issue => {
        const range = new vscode.Range(issue.line - 1, issue.columnStart, issue.line - 1, issue.columnEnd);
        const severity = getSeverity(issue.severity);
        return new vscode.Diagnostic(range, issue.description, severity);
      });
      
      diagnosticCollection.set(document.uri, diagnostics);
    }
  });
}
```

### Use Case 4: REST API Service
**Problem**: Multiple teams need a centralized security scanning service.

**Solution**: Deploy the API server for organization-wide access.

```bash
# Start the API server
npx ts-node examples/api-server.ts

# Or with Docker
docker build -t security-scanner .
docker run -p 3000:3000 -e OPENAI_API_KEY=your-key security-scanner
```

**Client Usage:**
```bash
# Scan code via API
curl -X POST http://your-server:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const query = \"SELECT * FROM users WHERE id = \" + userId;",
    "language": "javascript"
  }'
```

### Use Case 5: Code Review Bot
**Problem**: Manual code reviews miss security issues.

**Solution**: Create a bot that comments on pull requests with security findings.

```typescript
// GitHub PR bot example
import { Octokit } from '@octokit/rest';
import { SecurityScanEngine } from 'security-scan-engine';

async function reviewPR(owner: string, repo: string, prNumber: number) {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const scanner = new SecurityScanEngine();
  
  // Get PR files
  const { data: files } = await octokit.pulls.listFiles({
    owner, repo, pull_number: prNumber
  });
  
  // Scan each file
  for (const file of files) {
    if (file.filename.match(/\.(js|ts)$/)) {
      const { data: content } = await octokit.repos.getContent({
        owner, repo, path: file.filename, ref: file.sha
      });
      
      const code = Buffer.from(content.content, 'base64').toString();
      const result = await scanner.scan(code, file.filename);
      
      // Post comments for issues
      if (result.issues.length > 0) {
        const body = formatIssuesAsComment(result.issues);
        await octokit.issues.createComment({
          owner, repo, issue_number: prNumber, body
        });
      }
    }
  }
}
```

### Use Case 6: Security Training Platform
**Problem**: Teaching developers about secure coding.

**Solution**: Build an interactive learning platform.

```typescript
// Training platform example
import { SecurityScanEngine } from 'security-scan-engine';

class SecurityTrainingPlatform {
  private scanner = new SecurityScanEngine();
  
  async checkExercise(studentCode: string, exerciseId: string) {
    const result = await this.scanner.scan(studentCode, 'javascript');
    
    return {
      passed: result.issues.length === 0,
      issues: result.issues,
      hints: result.issues.map(issue => ({
        problem: issue.description,
        hint: issue.fix,
        severity: issue.severity
      })),
      score: this.calculateScore(result)
    };
  }
  
  private calculateScore(result: ScanResult): number {
    const maxScore = 100;
    const deductions = result.issues.reduce((total, issue) => {
      const penalties = {
        critical: 30,
        high: 20,
        medium: 10,
        low: 5,
        info: 2
      };
      return total + (penalties[issue.severity] || 0);
    }, 0);
    
    return Math.max(0, maxScore - deductions);
  }
}
```

---

## 🛠️ Integration Methods

### Method 1: NPM Package (Programmatic)
```bash
npm install security-scan-engine
```

```typescript
import { SecurityScanEngine } from 'security-scan-engine';

const scanner = new SecurityScanEngine();
const result = await scanner.scan(code, 'javascript');
```

### Method 2: CLI Tool
```bash
# Scan a single file
npx security-scan scan src/app.js

# Scan a directory
npx security-scan scan src/ --recursive

# Output to JSON
npx security-scan scan src/ --format json --output results.json
```

### Method 3: REST API
```bash
# Start server
npm start

# Make requests
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{"code": "...", "language": "javascript"}'
```

### Method 4: Docker Container
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm install && npm run build

EXPOSE 3000
CMD ["node", "dist/examples/api-server.js"]
```

```bash
docker build -t security-scanner .
docker run -p 3000:3000 -e OPENAI_API_KEY=$OPENAI_API_KEY security-scanner
```

---

## 📊 Understanding Results

### Severity Levels

- **🔴 CRITICAL**: Immediate security risk, fix ASAP
  - Example: Hardcoded production credentials
  
- **🟠 HIGH**: Serious vulnerability, high priority
  - Example: SQL injection, XSS vulnerabilities
  
- **🟡 MEDIUM**: Moderate risk, should be addressed
  - Example: Weak cryptography, insecure configurations
  
- **🔵 LOW**: Minor issue, good to fix
  - Example: Deprecated functions, minor security concerns
  
- **⚪ INFO**: Informational, best practice suggestions
  - Example: Code quality improvements

### Sample Output

```json
{
  "success": true,
  "issues": [
    {
      "id": "abc123",
      "title": "SQL Injection",
      "description": "String concatenation in SQL query allows injection attacks",
      "severity": "high",
      "owaspCategory": "A03:2021 - Injection",
      "line": 42,
      "columnStart": 15,
      "columnEnd": 50,
      "fix": "Use parameterized queries: db.query('SELECT * FROM users WHERE id = ?', [userId])",
      "source": "static",
      "codeSnippet": "const query = \"SELECT * FROM users WHERE id = \" + userId;"
    }
  ],
  "metadata": {
    "timestamp": "2025-11-18T08:00:00.000Z",
    "duration": 1234,
    "language": "javascript",
    "linesOfCode": 150,
    "analyzersUsed": ["static", "llm"],
    "staticRulesApplied": 15,
    "llmModel": "gpt-4o-mini"
  }
}
```

---

## 🎓 Best Practices

### 1. **Run Early and Often**
- Scan during development, not just before deployment
- Integrate into your IDE for real-time feedback

### 2. **Combine with Other Tools**
- Use alongside linters (ESLint) and formatters (Prettier)
- Complement with dependency scanners (npm audit, Snyk)

### 3. **Customize for Your Needs**
- Add custom rules for your organization's security policies
- Adjust severity levels based on your risk tolerance

### 4. **Educate Your Team**
- Use scan results as teaching moments
- Share common vulnerabilities and fixes

### 5. **Track Progress**
- Monitor security metrics over time
- Set goals for reducing vulnerabilities

---

## 🔒 Security Considerations

### API Key Management
- Never commit API keys to version control
- Use environment variables or secret management tools
- Rotate keys regularly

### Rate Limiting
- The API server includes built-in rate limiting (10 req/min)
- Adjust limits based on your needs in `src/api/server.ts`

### Data Privacy
- Code is sent to OpenAI for LLM analysis
- For sensitive code, use static-only mode
- Consider self-hosted LLM alternatives

---

## 📈 Measuring Impact

### Metrics to Track

1. **Vulnerabilities Found**: Number of issues detected
2. **Time to Fix**: How quickly issues are resolved
3. **False Positive Rate**: Accuracy of detections
4. **Coverage**: Percentage of code scanned
5. **Trend Analysis**: Are vulnerabilities decreasing over time?

### Sample Dashboard

```typescript
// Generate security metrics
const metrics = {
  totalScans: 1250,
  vulnerabilitiesFound: 342,
  criticalIssues: 12,
  highIssues: 89,
  mediumIssues: 156,
  lowIssues: 85,
  averageFixTime: '2.3 days',
  mostCommonIssue: 'SQL Injection',
  securityScore: 87 // out of 100
};
```

---

## 🤝 Contributing

Want to make this tool better? Here's how:

1. **Add New Rules**: Extend `StaticAnalyzer` with new vulnerability patterns
2. **Improve LLM Prompts**: Enhance detection accuracy
3. **Add Language Support**: Extend beyond JavaScript/TypeScript
4. **Build Integrations**: Create plugins for popular tools
5. **Share Use Cases**: Document how you're using it

---

## 📞 Support & Resources

- **Documentation**: See `README.md` and `examples/README.md`
- **Examples**: Check the `examples/` directory
- **Issues**: Report bugs or request features on GitHub
- **Community**: Join discussions and share your use cases

---

## 🎉 Success Stories

### Example 1: Startup Prevents Data Breach
A startup integrated the scanner into their CI/CD pipeline and caught a SQL injection vulnerability before it reached production, potentially preventing a major data breach.

### Example 2: Enterprise Reduces Security Debt
A large enterprise deployed the API service and scanned their entire codebase, identifying and fixing 500+ security issues over 3 months.

### Example 3: Bootcamp Improves Learning
A coding bootcamp integrated the scanner into their curriculum, helping students learn secure coding practices through immediate feedback.

---

## 🚦 Getting Started Checklist

- [ ] Install dependencies: `npm install`
- [ ] Set up OpenAI API key in `.env`
- [ ] Run example: `npx ts-node examples/basic-usage.ts`
- [ ] Try the API: `npx ts-node examples/api-server.ts`
- [ ] Scan your own code
- [ ] Integrate into your workflow
- [ ] Share with your team
- [ ] Track and improve security metrics

---

**Ready to make your code more secure? Start scanning today!** 🛡️
