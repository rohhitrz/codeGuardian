# Quick Start Guide

Get started with the Security Scan Engine in 5 minutes!

## 🚀 Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd security-scan-engine

# Install dependencies
npm install

# Set up your OpenAI API key
echo "OPENAI_API_KEY=your-key-here" > .env

# Build the project
npm run build
```

## 🎯 Try It Out

### Option 1: Run the Example
```bash
npx ts-node examples/basic-usage.ts
```

You'll see a scan of sample vulnerable code with detailed results!

### Option 2: Scan Your Own File
```bash
npx ts-node scripts/scan-file.ts path/to/your/file.js
```

### Option 3: Scan a Directory
```bash
npx ts-node scripts/scan-directory.ts src/
```

### Option 4: Start the API Server
```bash
# Terminal 1: Start the server
npx ts-node examples/api-server.ts

# Terminal 2: Make a request
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const query = \"SELECT * FROM users WHERE id = \" + userId;",
    "language": "javascript"
  }'
```

## 📝 Use in Your Code

```typescript
import { SecurityScanEngine } from './src/scanner/SecurityScanEngine';

const scanner = new SecurityScanEngine();

const code = `
function login(username, password) {
  const query = "SELECT * FROM users WHERE username = '" + username + "'";
  return db.execute(query);
}
`;

const result = await scanner.scan(code, 'javascript');

console.log(`Found ${result.issues.length} issues`);
result.issues.forEach(issue => {
  console.log(`- ${issue.title} at line ${issue.line}`);
  console.log(`  Fix: ${issue.fix}`);
});
```

## 🎓 What Gets Detected?

The scanner finds:

1. **SQL Injection** 💉
   ```javascript
   // BAD
   const query = "SELECT * FROM users WHERE id = " + userId;
   
   // GOOD
   const query = db.prepare("SELECT * FROM users WHERE id = ?");
   query.run(userId);
   ```

2. **Cross-Site Scripting (XSS)** 🔓
   ```javascript
   // BAD
   element.innerHTML = userInput;
   
   // GOOD
   element.textContent = userInput;
   ```

3. **Hardcoded Credentials** 🔑
   ```javascript
   // BAD
   const apiKey = "sk-1234567890";
   
   // GOOD
   const apiKey = process.env.API_KEY;
   ```

4. **Weak Cryptography** 🔐
   ```javascript
   // BAD
   crypto.createHash('md5').update(password);
   
   // GOOD
   bcrypt.hash(password, 10);
   ```

## 🔧 Common Use Cases

### Pre-Commit Hook
Add to `.git/hooks/pre-commit`:
```bash
#!/bin/bash
npx ts-node scripts/scan-directory.ts src/
```

### CI/CD Pipeline
Add to `.github/workflows/security.yml`:
```yaml
- name: Security Scan
  run: npx ts-node scripts/scan-directory.ts src/
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### VS Code Task
Add to `.vscode/tasks.json`:
```json
{
  "label": "Security Scan",
  "type": "shell",
  "command": "npx ts-node scripts/scan-file.ts ${file}"
}
```

## 📊 Understanding Results

Each issue includes:
- **Title**: What the vulnerability is
- **Severity**: Critical, High, Medium, Low, Info
- **Line Number**: Where it's located
- **Description**: Why it's a problem
- **Fix**: How to resolve it
- **OWASP Category**: Industry standard classification

## 🎯 Next Steps

1. ✅ Scan your existing codebase
2. ✅ Fix critical and high severity issues
3. ✅ Integrate into your development workflow
4. ✅ Set up automated scanning in CI/CD
5. ✅ Share with your team

## 💡 Tips

- **Start Small**: Scan one file or directory first
- **Fix High Priority First**: Focus on critical and high severity issues
- **Learn from Results**: Use the fixes as learning opportunities
- **Automate**: Integrate into your workflow for continuous security
- **Customize**: Add your own rules for organization-specific needs

## 🆘 Troubleshooting

**Issue: "OPENAI_API_KEY not set"**
- Solution: Create a `.env` file with your API key
- Or: Export it: `export OPENAI_API_KEY=your-key`

**Issue: "No issues found but I know there are problems"**
- Solution: The scanner focuses on security issues, not code quality
- Try: Adding custom rules in `src/analyzers/StaticAnalyzer.ts`

**Issue: "Too many false positives"**
- Solution: Review the LLM prompt in `src/analyzers/LLMAnalyzer.ts`
- Adjust: Temperature and model settings for more accuracy

## 📚 Learn More

- **Full Documentation**: See `README.md`
- **Usage Guide**: See `USAGE_GUIDE.md`
- **Examples**: Check the `examples/` directory
- **API Reference**: See `src/models/interfaces.ts`

---

**Ready to secure your code? Start scanning now!** 🛡️
