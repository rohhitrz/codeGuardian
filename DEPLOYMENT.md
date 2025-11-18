# Deployment Guide

This guide covers deploying the Security Scan Engine in production environments.

## 🚀 Deployment Options

### Option 1: Docker Container (Recommended)

**1. Create Dockerfile:**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/
COPY examples/ ./examples/

# Build TypeScript
RUN npm run build

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start server
CMD ["node", "dist/examples/api-server.js"]
```

**2. Build and run:**
```bash
# Build image
docker build -t security-scanner:latest .

# Run container
docker run -d \
  --name security-scanner \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your-key-here \
  -e PORT=3000 \
  --restart unless-stopped \
  security-scanner:latest

# Check logs
docker logs -f security-scanner

# Check health
curl http://localhost:3000/health
```

**3. Docker Compose:**
```yaml
# docker-compose.yml
version: '3.8'

services:
  security-scanner:
    build: .
    ports:
      - "3000:3000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - PORT=3000
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Option 2: Kubernetes

**1. Create deployment:**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: security-scanner
  labels:
    app: security-scanner
spec:
  replicas: 3
  selector:
    matchLabels:
      app: security-scanner
  template:
    metadata:
      labels:
        app: security-scanner
    spec:
      containers:
      - name: security-scanner
        image: security-scanner:latest
        ports:
        - containerPort: 3000
        env:
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: security-scanner-secrets
              key: openai-api-key
        - name: PORT
          value: "3000"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: security-scanner
spec:
  selector:
    app: security-scanner
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
---
apiVersion: v1
kind: Secret
metadata:
  name: security-scanner-secrets
type: Opaque
stringData:
  openai-api-key: your-key-here
```

**2. Deploy:**
```bash
# Apply configuration
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods -l app=security-scanner
kubectl get svc security-scanner

# View logs
kubectl logs -l app=security-scanner -f

# Scale
kubectl scale deployment security-scanner --replicas=5
```

### Option 3: Cloud Platforms

#### AWS (Elastic Beanstalk)

```bash
# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 security-scanner

# Create environment
eb create security-scanner-prod

# Set environment variables
eb setenv OPENAI_API_KEY=your-key-here

# Deploy
eb deploy

# Open in browser
eb open
```

#### Google Cloud Run

```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/PROJECT_ID/security-scanner

# Deploy
gcloud run deploy security-scanner \
  --image gcr.io/PROJECT_ID/security-scanner \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY=your-key-here
```

#### Azure Container Instances

```bash
# Create resource group
az group create --name security-scanner-rg --location eastus

# Deploy container
az container create \
  --resource-group security-scanner-rg \
  --name security-scanner \
  --image security-scanner:latest \
  --dns-name-label security-scanner \
  --ports 3000 \
  --environment-variables OPENAI_API_KEY=your-key-here
```

### Option 4: Traditional Server (PM2)

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'security-scanner',
    script: 'dist/examples/api-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
EOF

# Start
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Setup startup script
pm2 startup

# Monitor
pm2 monit

# View logs
pm2 logs security-scanner
```

## 🔒 Security Best Practices

### 1. API Key Management

**Use Secret Management:**
```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name security-scanner/openai-key \
  --secret-string "your-key-here"

# Retrieve in application
const secret = await secretsManager.getSecretValue({
  SecretId: 'security-scanner/openai-key'
}).promise();
```

**Environment Variables:**
```bash
# Never commit .env files
echo ".env" >> .gitignore

# Use different keys per environment
# .env.production
OPENAI_API_KEY=prod-key-here

# .env.staging
OPENAI_API_KEY=staging-key-here
```

### 2. Rate Limiting

**Adjust based on load:**
```typescript
// src/api/server.ts
const rateLimiter = new RateLimiter({
  windowMs: 60000,      // 1 minute
  maxRequests: 100      // Increase for production
});
```

**Use Redis for distributed rate limiting:**
```typescript
import Redis from 'ioredis';

class DistributedRateLimiter {
  private redis: Redis;
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }
  
  async isAllowed(identifier: string): Promise<boolean> {
    const key = `rate-limit:${identifier}`;
    const count = await this.redis.incr(key);
    
    if (count === 1) {
      await this.redis.expire(key, 60); // 1 minute
    }
    
    return count <= 100;
  }
}
```

### 3. HTTPS/TLS

**Use reverse proxy (Nginx):**
```nginx
# /etc/nginx/sites-available/security-scanner
server {
    listen 443 ssl http2;
    server_name scanner.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/scanner.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/scanner.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Authentication

**Add API key authentication:**
```typescript
// src/api/middleware/auth.ts
export function authenticateApiKey(req: http.IncomingMessage): boolean {
  const apiKey = req.headers['x-api-key'];
  const validKeys = process.env.API_KEYS?.split(',') || [];
  return validKeys.includes(apiKey as string);
}

// In server.ts
if (!authenticateApiKey(req)) {
  this.sendError(res, 401, 'Unauthorized');
  return;
}
```

### 5. Logging and Monitoring

**Structured logging:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log scan requests
logger.info('Scan request', {
  timestamp: new Date().toISOString(),
  clientIp: req.socket.remoteAddress,
  language: body.language,
  codeLength: body.code.length
});
```

**Monitoring with Prometheus:**
```typescript
import promClient from 'prom-client';

const scanCounter = new promClient.Counter({
  name: 'security_scans_total',
  help: 'Total number of security scans'
});

const scanDuration = new promClient.Histogram({
  name: 'security_scan_duration_seconds',
  help: 'Duration of security scans'
});

// Expose metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});
```

## 📊 Performance Optimization

### 1. Caching

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour

async function scanWithCache(code: string, language: string) {
  const cacheKey = crypto.createHash('sha256')
    .update(code + language)
    .digest('hex');
  
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  
  const result = await scanner.scan(code, language);
  cache.set(cacheKey, result);
  return result;
}
```

### 2. Request Queuing

```typescript
import Queue from 'bull';

const scanQueue = new Queue('security-scans', process.env.REDIS_URL);

scanQueue.process(async (job) => {
  const { code, language } = job.data;
  return await scanner.scan(code, language);
});

// Add to queue
const job = await scanQueue.add({ code, language });
const result = await job.finished();
```

### 3. Load Balancing

```nginx
# Nginx load balancer
upstream security_scanner {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
}

server {
    location / {
        proxy_pass http://security_scanner;
    }
}
```

## 🔍 Monitoring and Alerts

### Health Checks

```typescript
// Enhanced health check
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    checks: {
      openai: await checkOpenAI(),
      database: await checkDatabase()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(c => c === true);
  res.status(isHealthy ? 200 : 503).json(health);
});
```

### Alerting

```typescript
// Send alerts on errors
import { SNS } from 'aws-sdk';

const sns = new SNS();

async function sendAlert(message: string) {
  await sns.publish({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Subject: 'Security Scanner Alert',
    Message: message
  }).promise();
}

// Use in error handlers
if (errorRate > threshold) {
  await sendAlert(`High error rate detected: ${errorRate}%`);
}
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer (Nginx, AWS ALB, etc.)
- Deploy multiple instances
- Share state via Redis or database

### Vertical Scaling
- Increase container resources
- Optimize Node.js memory settings
- Use clustering mode

### Cost Optimization
- Cache frequent scans
- Use static-only mode for non-critical scans
- Implement request batching
- Set up auto-scaling based on load

## 🆘 Troubleshooting

### High Memory Usage
```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" node dist/examples/api-server.js
```

### Slow Response Times
- Enable caching
- Reduce LLM timeout
- Use static-only mode
- Scale horizontally

### API Rate Limits
- Implement request queuing
- Add retry logic with exponential backoff
- Use multiple API keys with rotation

---

**Need help with deployment? Check the [USAGE_GUIDE.md](USAGE_GUIDE.md) for more examples!**
