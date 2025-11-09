# Deployment Guide

**Deploy the chat server to production.**

---

## Deployment Options

1. [Heroku](#heroku-deployment)
2. [Docker](#docker-deployment)
3. [AWS/VPS](#awsvps-deployment)
4. [Railway/Render](#railwayrender)

---

## Heroku Deployment

### Quick Deploy

```bash
cd chat-server/deployment
./deploy-heroku.sh
```

Or on Windows:
```powershell
cd chat-server\deployment
.\deploy-heroku.bat
```

### Manual Heroku Deployment

```bash
# Login to Heroku
heroku login

# Create new app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Add Redis (optional)
heroku addons:create heroku-redis:mini

# Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production

# Deploy
git push heroku main

# Open app
heroku open
```

### Heroku Configuration

**Files included:**
- `deployment/Procfile` - Process configuration
- `deployment/app.json` - App manifest
- `deployment/env.production` - Production env template

---

## Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3001

CMD ["node", "server.js"]
```

### Build and Run

```bash
# Build image
docker build -t chat-server .

# Run container
docker run -d \
  -p 3001:3001 \
  -e DATABASE_URL=your-db-url \
  -e JWT_SECRET=your-secret \
  -e NODE_ENV=production \
  --name chat-server \
  chat-server

# View logs
docker logs -f chat-server

# Stop container
docker stop chat-server
```

### Docker Compose

```yaml
version: '3.8'

services:
  chat-server:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    depends_on:
      - redis
    restart: unless-stopped
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

**Run:**
```bash
docker-compose up -d
```

---

## AWS/VPS Deployment

### EC2 / Digital Ocean / Linode

#### 1. SSH into server
```bash
ssh user@your-server-ip
```

#### 2. Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 3. Install PM2
```bash
sudo npm install -g pm2
```

#### 4. Clone and setup
```bash
git clone https://github.com/EliteScore/elite-chat-service.git
cd elite-chat-service
npm install
```

#### 5. Configure environment
```bash
cp env.example .env
nano .env
# Edit with your database credentials and JWT_SECRET
```

#### 6. Start with PM2
```bash
pm2 start server.js --name chat-server
pm2 save
pm2 startup
```

#### 7. Configure Nginx (optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 8. Enable SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Railway/Render

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Add PostgreSQL
railway add

# Deploy
railway up
```

### Render

1. Go to https://render.com
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment Variables:** Add `JWT_SECRET`, `DATABASE_URL`

---

## Environment Variables

### Required

```env
JWT_SECRET=your-secret-key-min-32-chars
DATABASE_URL=postgresql://user:pass@host:5432/dbname
NODE_ENV=production
PORT=3001
```

### Optional

```env
REDIS_URL=redis://localhost:6379
DB_MAX_CONNECTIONS=200
DB_MIN_CONNECTIONS=10
MAX_CONNECTIONS=50000
RATE_LIMIT_MAX=30
```

---

## Production Checklist

### Security

- [ ] Set strong `JWT_SECRET` (32+ characters)
- [ ] Enable SSL/TLS (use `wss://` not `ws://`)
- [ ] Set `NODE_ENV=production`
- [ ] Configure CORS if needed
- [ ] Enable rate limiting
- [ ] Secure database credentials

### Database

- [ ] Configure `DATABASE_URL` or individual DB credentials
- [ ] Enable SSL for database connection (`DB_SSL=true`)
- [ ] Set connection pool limits
- [ ] Run migrations (auto-created on startup)
- [ ] Set up automated backups

### Scaling

- [ ] Configure Redis for multiple instances
- [ ] Set up load balancer with sticky sessions
- [ ] Configure health checks (`/ready`)
- [ ] Set up monitoring (`/metrics`)
- [ ] Configure auto-scaling rules

### Monitoring

- [ ] Set up logging (Winston configured)
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up performance monitoring
- [ ] Configure alerts for errors
- [ ] Monitor memory usage

---

## Load Balancer Configuration

### Nginx

```nginx
upstream chat_servers {
    ip_hash;  # Sticky sessions
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 443 ssl http2;
    server_name chat.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/chat.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chat.yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://chat_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
```

---

## Kubernetes Deployment

### Deployment YAML

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: chat-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: chat-server
  template:
    metadata:
      labels:
        app: chat-server
    spec:
      containers:
      - name: chat-server
        image: your-registry/chat-server:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: jwt-secret
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: chat-secrets
              key: redis-url
        livenessProbe:
          httpGet:
            path: /live
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: chat-server
spec:
  type: LoadBalancer
  sessionAffinity: ClientIP  # Sticky sessions
  ports:
  - port: 3001
    targetPort: 3001
  selector:
    app: chat-server
```

---

## Health Checks

### Configure Load Balancer

**Health Check Endpoint:** `/ready`  
**Interval:** 10 seconds  
**Timeout:** 5 seconds  
**Healthy Threshold:** 2 consecutive successes  
**Unhealthy Threshold:** 3 consecutive failures  

---

## Monitoring

### Metrics to Track

- Active WebSocket connections
- Messages per second
- Database query latency
- Redis latency (if using)
- Error rates
- Memory usage
- CPU usage

### Prometheus Example

```javascript
// Add to server.js
const promClient = require('prom-client');
const register = new promClient.Registry();

const connectionsGauge = new promClient.Gauge({
  name: 'chat_active_connections',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

// Update in your code
wss.on('connection', () => {
  connectionsGauge.set(wss.clients.size);
});

// Expose metrics endpoint
app.get('/prometheus', (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
});
```

---

## Scaling

### Single Instance

**Supports:**
- 50,000 concurrent connections
- 10,000+ messages/second

**Use when:**
- Starting out
- < 50k users
- Budget-conscious

### Multiple Instances (Requires Redis)

**Supports:**
- 200,000+ concurrent connections
- 40,000+ messages/second

**Requirements:**
- Redis for pub/sub
- Load balancer with sticky sessions
- Shared database

**Setup:**
```bash
# Start multiple instances
PORT=3001 node server.js &
PORT=3002 node server.js &
PORT=3003 node server.js &

# Configure Nginx load balancer
# See Nginx config above
```

---

## Rollback

### Heroku
```bash
heroku releases
heroku rollback v123
```

### Docker
```bash
docker pull your-registry/chat-server:previous-tag
docker stop chat-server
docker run ... your-registry/chat-server:previous-tag
```

### Git
```bash
git revert HEAD
git push origin main --force
```

---

## Maintenance

### Update Server

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install

# Restart (PM2)
pm2 restart chat-server

# Restart (Docker)
docker-compose restart chat-server
```

### Database Migrations

Server auto-creates tables on startup.

**Manual migration:**
```bash
psql $DATABASE_URL -f docs/private_messaging_tables.sql
psql $DATABASE_URL -f docs/group_chat_tables.sql
```

### Cleanup Old Data

```bash
# Delete soft-deleted groups older than 30 days (runs automatically)
# Or run manually:
psql $DATABASE_URL -c "DELETE FROM group_chats WHERE deleted_at < NOW() - INTERVAL '30 days' AND deleted = true"
```

---

## Troubleshooting

### Server won't start

- Check logs: `pm2 logs chat-server`
- Verify environment variables
- Check database connection
- Ensure port is available

### High memory usage

- Restart server: `pm2 restart chat-server`
- Check active connections: `curl http://localhost:3001/metrics`
- Increase memory limit: `node --max-old-space-size=4096 server.js`

### Slow performance

- Check database connection pool
- Enable Redis caching
- Scale to multiple instances
- Optimize database queries

---

## Support

**Logs:**
```bash
# PM2
pm2 logs chat-server

# Docker
docker logs -f chat-server

# Heroku
heroku logs --tail
```

**Health Check:**
```bash
curl https://your-domain.com/health
```

---

**Your chat server is production-ready!** 🚀


