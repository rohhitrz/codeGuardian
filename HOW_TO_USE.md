# How to Use the Security Scan Engine

## 🎯 Overview

The Security Scan Engine helps you find security vulnerabilities in JavaScript and TypeScript code. It's like having a security expert review your code automatically!

## 🚀 Three Ways to Use It

### 1. **For Quick Testing** (Easiest)

Perfect for: Trying it out, scanning a few files

```bash
# Scan a single file
npx ts-node scripts/scan-file.ts src/app.js

# Scan a whole directory
npx ts-node scripts/scan-directory.ts src/
```

**What you get:**
- Immediate results in your terminal
- Color-coded severity levels
- Specific line numbers where issues are
- How to fix each issue

### 2. **For Development** (Most Common)

Perfect for: Daily development, team collaboration

**A. Pre-Commit Hook** (Catch issues before committing)
```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
npx ts-node scripts/scan-directory.ts src/
```

**B. In Your Code** (Programmatic usage)
```typescript
import { SecurityScanEngine } from './src/scanner/SecurityScanEngine';

const scanner = new SecurityScanEngine();
const result = await scanner.scan(yourCode, 'javascript');

if (result.issues.length > 0) {
  console.log('⚠️ Security issues found!');
  // Handle issues...
}
```

**C. CI/CD Pipeline** (Automated checks)
```yaml
# .github/workflows/security.yml
- name: Security Scan
  run: npx ts-node scripts/scan-directory.ts src/
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### 3. **For Production** (Enterprise)

Perfect for: Large teams, multiple projects, centralized security

**Start the API Server:**
```bash
npx ts-node examples/api-server.ts
```

**Use from anywhere:**
```bash
curl -X POST http://your-server:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "code": "your code here",
    "language": "javascript"
  }'
```

**Benefits:**
- Centralized security service
- Rate limiting built-in
- Easy to integrate with any tool
- Scalable for large organizations

## 📚 Step-by-Step Guides

### Guide 1: Scan Your First File

1. **Pick a file to scan:**
   ```bash
   # Example: scan your main app file
   npx ts-node scripts/scan-file.ts src/index.js
   ```

2. **Read the results:**
   - 🔴 **Critical**: Fix immediately!
   - 🟠 **High**: Fix soon
   - 🟡 **Medium**: Fix when you can
   - 🔵 **Low**: Nice to fix

3. **Fix the issues:**
   - Each issue shows you exactly what's wrong
   - Includes a "Fix:" section with the solution
   - Shows the line number to find it quickly

4. **Scan again to verify:**
   ```bash
   npx ts-node scripts/scan-file.ts src/index.js
   ```

### Guide 2: Integrate into Your Workflow

**Week 1: Manual Scanning**
```bash
# Before committing, scan your changes
npx ts-node scripts/scan-directory.ts src/
```

**Week 2: Add Pre-Commit Hook**
```bash
# Create the hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
npx ts-node scripts/scan-directory.ts src/
if [ $? -ne 0 ]; then
  echo "❌ Fix security issues before committing"
  exit 1
fi
EOF

# Make it executable
chmod +x .git/hooks/pre-commit
```

**Week 3: Add to CI/CD**
```yaml
# Add to your GitHub Actions, GitLab CI, etc.
- name: Security Scan
  run: npx ts-node scripts/scan-directory.ts src/
```

**Week 4: Deploy API for Team**
```bash
# Start the server
npx ts-node examples/api-server.ts

# Share with team: http://your-server:3000
```

### Guide 3: Build a Custom Integration

**Example: Slack Bot**
```typescript
import { SecurityScanEngine } from './src/scanner/SecurityScanEngine';
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_TOKEN);
const scanner = new SecurityScanEngine();

async function scanAndNotify(code: string, channel: string) {
  const result = await scanner.scan(code, 'javascript');
  
  if (result.issues.length > 0) {
    await slack.chat.postMessage({
      channel,
      text: `⚠️ Found ${result.issues.length} security issues!`,
      attachments: result.issues.map(issue => ({
        color: issue.severity === 'critical' ? 'danger' : 'warning',
        title: issue.title,
        text: issue.description,
        fields: [{
          title: 'Fix',
          value: issue.fix
        }]
      }))
    });
  }
}
```

## 🎓 Common Scenarios

### Scenario 1: "I'm a solo developer"

**What to do:**
1. Run the example to see how it works
2. Scan your current project
3. Fix critical and high issues
4. Add a pre-commit hook
5. Scan before each release

**Time investment:** 1-2 hours initially, then automatic

### Scenario 2: "I'm on a small team (2-10 people)"

**What to do:**
1. Set up the API server on a shared machine
2. Add CI/CD integration
3. Create a team guide for using it
4. Review scan results in code reviews
5. Track security metrics monthly

**Time investment:** Half day setup, 30 min/week maintenance

### Scenario 3: "I'm in a large organization"

**What to do:**
1. Deploy API server with Docker/Kubernetes
2. Integrate with existing security tools
3. Set up monitoring and alerting
4. Create dashboards for metrics
5. Train teams on secure coding
6. Enforce scanning in all pipelines

**Time investment:** 1-2 weeks setup, ongoing monitoring

### Scenario 4: "I'm teaching/learning"

**What to do:**
1. Use the example vulnerable code
2. Scan it and read the results
3. Try to fix the issues
4. Scan again to verify
5. Create your own vulnerable code
6. Learn from the AI explanations

**Time investment:** 1-2 hours per lesson

## 💡 Pro Tips

### Tip 1: Start Small
Don't try to fix everything at once. Start with:
1. Critical issues only
2. One file or directory
3. New code first, then legacy code

### Tip 2: Learn from Results
The scanner is also a teaching tool:
- Read the descriptions carefully
- Understand WHY something is vulnerable
- Apply the fixes to similar code
- Share learnings with your team

### Tip 3: Customize for Your Needs
```typescript
// Add your own rules in src/analyzers/StaticAnalyzer.ts
{
  id: 'custom-rule-1',
  name: 'Company Specific Rule',
  pattern: /your-pattern-here/,
  severity: SeverityLevel.HIGH,
  owaspCategory: 'Custom',
  description: 'Your description',
  fix: 'Your fix'
}
```

### Tip 4: Combine with Other Tools
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **npm audit**: Dependency vulnerabilities
- **Security Scanner**: Code security

Together, they cover all bases!

### Tip 5: Track Your Progress
```bash
# Create a baseline
npx ts-node scripts/scan-directory.ts src/ > baseline.txt

# After fixes
npx ts-node scripts/scan-directory.ts src/ > current.txt

# Compare
diff baseline.txt current.txt
```

## 🆘 Common Questions

**Q: Do I need the OpenAI API key?**
A: No! The static analyzer works without it. The API key enables AI-powered detection for better accuracy.

**Q: Will it slow down my development?**
A: No! Scans are fast (seconds). Plus, catching issues early saves time later.

**Q: What if I get false positives?**
A: Review the issue carefully. If it's not a real problem, you can:
- Add comments to explain why it's safe
- Adjust the rules in the code
- Report it so we can improve

**Q: Can I use this in production?**
A: Yes! See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment guides.

**Q: How accurate is it?**
A: Very! It combines:
- Proven static analysis patterns
- AI-powered contextual understanding
- OWASP security standards

**Q: Does it support other languages?**
A: Currently JavaScript and TypeScript. More languages can be added!

## 📖 Next Steps

1. ✅ **Try it**: Run `npx ts-node examples/basic-usage.ts`
2. ✅ **Scan your code**: Use the scripts on your project
3. ✅ **Fix issues**: Start with critical and high severity
4. ✅ **Integrate**: Add to your workflow (pre-commit, CI/CD)
5. ✅ **Share**: Tell your team about it
6. ✅ **Improve**: Customize rules for your needs

## 📚 More Resources

- **[QUICK_START.md](QUICK_START.md)** - Get started in 5 minutes
- **[USAGE_GUIDE.md](USAGE_GUIDE.md)** - Detailed use cases and examples
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide
- **[README.md](README.md)** - Technical documentation
- **[examples/](examples/)** - Code examples

---

**Questions? Issues? Ideas?** Open an issue on GitHub or contribute to make it better!

**Ready to secure your code? Start now!** 🛡️
