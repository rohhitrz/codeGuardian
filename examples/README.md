# Security Scan Engine Examples

This directory contains example scripts demonstrating how to use the Security Scan Engine.

## Prerequisites

Before running the examples, make sure you have:

1. Built the project:
   ```bash
   npm run build
   ```

2. Set up your environment variables (create a `.env` file in the project root):
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

## Examples

### 1. Basic Usage (`basic-usage.ts`)

Demonstrates how to use the SecurityScanEngine programmatically to scan code for vulnerabilities.

**Run:**
```bash
npx ts-node examples/basic-usage.ts
```

**Features:**
- Shows how to instantiate the scanner
- Scans sample vulnerable code
- Displays results in a formatted, readable way
- Groups issues by severity level

### 2. API Server (`api-server.ts`)

Runs the Security Scan Engine as a REST API server.

**Run:**
```bash
npx ts-node examples/api-server.ts
```

**Endpoints:**
- `POST /api/scan` - Scan code for vulnerabilities
- `GET /health` - Health check endpoint

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/scan \
  -H "Content-Type: application/json" \
  -d '{
    "code": "const query = \"SELECT * FROM users WHERE id = \" + userId;",
    "language": "javascript"
  }'
```

**Features:**
- REST API with JSON responses
- Rate limiting (10 requests per minute per IP)
- CORS support
- Error handling
- Input validation

## Sample Vulnerable Code

The examples include sample code with common security vulnerabilities:

1. **SQL Injection** - String concatenation in SQL queries
2. **XSS (Cross-Site Scripting)** - Using innerHTML with user input
3. **Hardcoded Credentials** - API keys and passwords in code
4. **Insecure Cryptography** - Using weak hashing algorithms (MD5)

## Output Format

The scan results include:

- **Metadata**: Language, lines of code, duration, analyzers used
- **Issues**: Array of detected vulnerabilities with:
  - Title and description
  - Severity level (Critical, High, Medium, Low, Info)
  - OWASP category
  - Line and column location
  - Recommended fix
  - Source (static analyzer or LLM)

## Customization

You can customize the scanner behavior by:

1. Modifying the configuration in `src/config/Config.ts`
2. Adding new static analysis rules in `src/analyzers/StaticAnalyzer.ts`
3. Adjusting the LLM prompt in `src/analyzers/LLMAnalyzer.ts`
4. Changing rate limits in the API server

## Troubleshooting

**Issue: LLM analyzer fails**
- Check that your `OPENAI_API_KEY` is set correctly
- Verify you have API credits available
- The scanner will still return static analysis results if LLM fails

**Issue: Port already in use**
- Change the port in `api-server.ts` or set the `PORT` environment variable

**Issue: Rate limit errors**
- Wait 60 seconds for the rate limit window to reset
- Adjust rate limits in `src/api/server.ts` if needed
