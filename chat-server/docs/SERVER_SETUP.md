# Server Setup Guide

**Get the chat server running in 5 minutes.**

---

## Prerequisites

- **Node.js** 14.x or higher
- **PostgreSQL** 12 or higher
- **Redis** (optional, recommended for production)
- **Git** (to clone repository)

---

## Installation

### 1. Install Dependencies

```bash
cd chat-server
npm install
```

### 2. Configure Environment

```bash
# Copy example environment file
cp env.example .env

# Edit .env file with your settings
nano .env
```

**Required Environment Variables:**

```env
# Database (required)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_database
DB_USER=your_user
DB_PASS=your_password

# Or use DATABASE_URL
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT (required - MUST match your Java backend)
JWT_SECRET=your-secret-key-here

# Server (optional)
PORT=3001
NODE_ENV=production

# Redis (optional, for scaling)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379
```

### 3. Database Setup

The server automatically creates all required tables on startup!

**Tables Created:**
- `users_auth` - User authentication
- `user_profile_info` - User profiles
- `jwt_revocation` - Token revocation
- `private_messages` - All messages (DM + group)
- `conversations` - DM metadata
- `user_status` - Online/offline status
- `message_reactions` - Reactions
- `blocked_relationships` - User blocking
- `user_follows` - Follow relationships
- `group_chats` - Group metadata
- `group_members` - Group membership

**Manual Setup (if needed):**
```bash
psql -U your_user -d your_database -f docs/private_messaging_tables.sql
psql -U your_user -d your_database -f docs/group_chat_tables.sql
```

---

## Running the Server

### Development Mode

```bash
node server.js
```

**Output:**
```
✅ Database initialized successfully
✅ Redis initialized successfully
🚀 Enhanced private messaging server running on port 3001
```

### Production Mode

```bash
# Single instance
npm start

# Cluster mode (8 workers for high load)
node cluster-server.js
```

### Background Mode

```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name chat-server

# View logs
pm2 logs chat-server

# Stop server
pm2 stop chat-server
```

---

## Verify Server is Running

### Health Check

```bash
curl http://localhost:3001/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "uptime": 15.58,
  "connections": 0,
  "database": { "connected": true },
  "memory": { "rss": "98.77 MB" }
}
```

### Readiness Check

```bash
curl http://localhost:3001/ready
```

**Expected Response:**
```json
{
  "ready": true,
  "timestamp": "2025-10-12T15:17:16.766Z",
  "checks": [
    { "name": "database", "status": "healthy" },
    { "name": "websocket", "status": "healthy" }
  ]
}
```

---

## Testing Connection

### WebSocket Test

Create a file `test-connection.html`:

```html
<!DOCTYPE html>
<html>
<body>
  <h1>WebSocket Test</h1>
  <div id="status">Not connected</div>
  <script>
    const ws = new WebSocket('ws://localhost:3001');
    
    ws.onopen = () => {
      document.getElementById('status').textContent = 'Connected!';
      console.log('✅ Connected to chat server');
      
      // Try to authenticate
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: 'your-jwt-token-here'
      }));
    };
    
    ws.onmessage = (event) => {
      console.log('Received:', JSON.parse(event.data));
    };
    
    ws.onerror = (error) => {
      document.getElementById('status').textContent = 'Error: ' + error;
    };
  </script>
</body>
</html>
```

Open in browser to test connection.

---

## Configuration Options

### Performance Tuning

```env
# Connection settings
MAX_CONNECTIONS=50000
MAX_PAYLOAD_SIZE=1048576  # 1MB
KEEP_ALIVE_TIMEOUT=60000   # 60 seconds

# Database pooling
DB_MAX_CONNECTIONS=200
DB_MIN_CONNECTIONS=10

# Rate limiting
RATE_LIMIT_WINDOW=60000    # 60 seconds
RATE_LIMIT_MAX=30          # 30 messages per window
```

### Cluster Mode

For high-load scenarios (80,000+ concurrent users):

```bash
node cluster-server.js
```

**Features:**
- Spawns 8 worker processes
- Automatic worker restart on failure
- Load balancing across CPU cores
- Shared memory for metrics

---

## Troubleshooting

### Server Won't Start

**Problem:** Port 3001 already in use

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001  # Mac/Linux
netstat -ano | findstr :3001  # Windows

# Change port in .env
PORT=3002
```

---

**Problem:** Database connection fails

**Solution:**
- Verify PostgreSQL is running
- Check credentials in `.env`
- Test connection:
  ```bash
  psql -U your_user -d your_database -c "SELECT 1"
  ```

---

**Problem:** Redis connection fails

**Solution:**
- Server works without Redis (falls back to database-only mode)
- To use Redis, ensure it's running:
  ```bash
  redis-cli ping  # Should return "PONG"
  ```

---

### Performance Issues

**Problem:** High memory usage

**Solution:**
- Check active connections: `curl http://localhost:3001/metrics`
- Restart server: `pm2 restart chat-server`
- Increase memory limit:
  ```bash
  node --max-old-space-size=4096 server.js
  ```

---

**Problem:** Slow message delivery

**Solution:**
- Check database connection pool: `curl http://localhost:3001/health`
- Increase pool size in `.env`:
  ```env
  DB_MAX_CONNECTIONS=300
  ```
- Enable Redis for caching

---

## Development Tips

### Hot Reload

```bash
# Install nodemon
npm install -g nodemon

# Run with auto-reload
nodemon server.js
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=true node server.js
```

### Test with Multiple Users

```bash
# Generate test tokens
node tests/generate-test-tokens.js

# Insert test data
node tests/insert-test-data.js

# Run tests
node tests/test-chat-core-features.js
```

---

## Next Steps

1. ✅ Server is running
2. ✅ Database is connected
3. ✅ Health checks passing

**Now you can:**
- Read [Frontend Integration](../FRONTEND_INTEGRATION.md) to connect your app
- Check [Features List](./FEATURES.md) to see all capabilities
- Review [Testing Guide](./TESTING.md) to run tests
- See [Deployment Guide](./DEPLOYMENT.md) for production setup

---

## Quick Reference

**Start Server:**
```bash
node server.js
```

**Check Status:**
```bash
curl http://localhost:3001/health
```

**View Logs:**
```bash
pm2 logs chat-server
```

**Stop Server:**
```bash
pm2 stop chat-server
```

---

**Server is ready!** 🚀

