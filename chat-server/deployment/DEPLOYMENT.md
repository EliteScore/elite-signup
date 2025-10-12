# 🚀 Elite Chat Server - Heroku Deployment Guide

This guide will help you deploy the Elite Chat Server to Heroku with Redis support.

## 📋 Prerequisites

1. **Heroku CLI** installed ([Download here](https://devcenter.heroku.com/articles/heroku-cli))
2. **Git** installed and configured
3. **Node.js** (for local testing)
4. **Heroku account** ([Sign up here](https://signup.heroku.com/))

## 🔧 Quick Deployment

### Option 1: Automated Deployment (Recommended)

#### For Windows:
```bash
# Run the automated deployment script
deploy-heroku.bat
```

#### For Linux/Mac:
```bash
# Make the script executable
chmod +x deploy-heroku.sh

# Run the automated deployment script
./deploy-heroku.sh
```

### Option 2: Manual Deployment

#### Step 1: Login to Heroku
```bash
heroku login
```

#### Step 2: Create Heroku App
```bash
heroku create your-app-name
```

#### Step 3: Add Required Addons
```bash
# Add Heroku Postgres
heroku addons:create heroku-postgresql:mini

# Add Heroku Redis
heroku addons:create heroku-redis:mini
```

#### Step 4: Set Environment Variables
```bash
# Security keys (generate your own)
heroku config:set JWT_SECRET="your-jwt-secret-here"
heroku config:set CHAT_ENCRYPTION_KEY="your-encryption-key-here"

# Performance settings
heroku config:set NODE_ENV=production
heroku config:set RATE_LIMIT_WINDOW_MS=900000
heroku config:set RATE_LIMIT_MAX_REQUESTS=100
heroku config:set MESSAGE_RATE_LIMIT=30
heroku config:set MAX_CONNECTIONS_PER_IP=10
heroku config:set CONNECTION_TIMEOUT=30000
heroku config:set LOG_LEVEL=info
heroku config:set HEALTH_CHECK_INTERVAL=30000
heroku config:set HEALTH_CHECK_TIMEOUT=5000
heroku config:set MAX_PAYLOAD_SIZE=1048576
heroku config:set KEEP_ALIVE_TIMEOUT=60000
heroku config:set MAX_CONNECTIONS=10000
heroku config:set DB_MAX_CONNECTIONS=500
heroku config:set DB_MIN_CONNECTIONS=50
heroku config:set DB_IDLE_TIMEOUT=10000
heroku config:set DB_CONNECTION_TIMEOUT=1000
heroku config:set DB_STATEMENT_TIMEOUT=10000
```

#### Step 5: Deploy
```bash
git add .
git commit -m "Deploy to Heroku with Redis support"
git push heroku main
```

#### Step 6: Setup Database
```bash
heroku run "node -e \"require('./database/messageOperations').initializeTables()\""
```

#### Step 7: Scale the App
```bash
heroku ps:scale web=1 worker=1
```

## 🔴 Redis Configuration

The server automatically detects and uses Redis from these Heroku addons:
- **Heroku Redis** (`REDIS_URL`)
- **Redis Cloud** (`REDISCLOUD_URL`)
- **Redis To Go** (`REDISTOGO_URL`)

### Redis Features Enabled:
- ✅ **Session Management**: User sessions stored in Redis
- ✅ **Caching**: Message caching for better performance
- ✅ **Rate Limiting**: Distributed rate limiting across instances
- ✅ **Real-time Features**: Typing indicators, online status
- ✅ **Graceful Fallback**: Falls back to database-only mode if Redis unavailable

## 📊 Monitoring and Management

### View Logs
```bash
heroku logs --tail
```

### Check App Status
```bash
heroku ps
```

### View Configuration
```bash
heroku config
```

### Access App Console
```bash
heroku run bash
```

### Monitor Redis
```bash
heroku redis:cli
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `3001` |
| `JWT_SECRET` | JWT signing secret | **Required** |
| `CHAT_ENCRYPTION_KEY` | Message encryption key | **Required** |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` |
| `MESSAGE_RATE_LIMIT` | Messages per minute | `30` |
| `MAX_CONNECTIONS_PER_IP` | Max connections per IP | `10` |
| `CONNECTION_TIMEOUT` | Connection timeout | `30000` ms |
| `LOG_LEVEL` | Logging level | `info` |
| `HEALTH_CHECK_INTERVAL` | Health check interval | `30000` ms |
| `HEALTH_CHECK_TIMEOUT` | Health check timeout | `5000` ms |
| `MAX_PAYLOAD_SIZE` | Max payload size | `1048576` bytes |
| `KEEP_ALIVE_TIMEOUT` | Keep alive timeout | `60000` ms |
| `MAX_CONNECTIONS` | Max total connections | `10000` |
| `DB_MAX_CONNECTIONS` | Max DB connections | `500` |
| `DB_MIN_CONNECTIONS` | Min DB connections | `50` |
| `DB_IDLE_TIMEOUT` | DB idle timeout | `10000` ms |
| `DB_CONNECTION_TIMEOUT` | DB connection timeout | `1000` ms |
| `DB_STATEMENT_TIMEOUT` | DB statement timeout | `10000` ms |

## 🚀 Production Features

### Clustering
The app uses `cluster-server.js` for production, which:
- ✅ **Multi-process**: Utilizes all CPU cores
- ✅ **Load Balancing**: Distributes connections across workers
- ✅ **Graceful Shutdown**: Handles process restarts
- ✅ **Memory Management**: Prevents memory leaks

### Redis Integration
- ✅ **Session Persistence**: User sessions survive app restarts
- ✅ **Distributed Caching**: Shared cache across all instances
- ✅ **Real-time Features**: Enhanced with Redis pub/sub
- ✅ **Performance**: Faster response times with caching

### Security
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Rate Limiting**: Prevents abuse and spam
- ✅ **Input Validation**: Sanitizes all user input
- ✅ **Rate Limiting**: 30 messages per minute per user
- ✅ **Encryption**: Messages encrypted in transit and storage

### Monitoring
- ✅ **Health Checks**: Built-in health monitoring
- ✅ **Metrics**: Performance and usage metrics
- ✅ **Logging**: Comprehensive logging system
- ✅ **Error Handling**: Graceful error recovery

## 🔍 Troubleshooting

### Common Issues

#### Redis Connection Failed
```bash
# Check Redis status
heroku redis:info

# Restart Redis
heroku redis:restart
```

#### Database Connection Issues
```bash
# Check database status
heroku pg:info

# Reset database
heroku pg:reset DATABASE_URL
```

#### App Won't Start
```bash
# Check logs
heroku logs --tail

# Check configuration
heroku config
```

#### Performance Issues
```bash
# Check app metrics
heroku ps

# Scale up if needed
heroku ps:scale web=2 worker=2
```

## 📈 Scaling

### Horizontal Scaling
```bash
# Scale web dynos
heroku ps:scale web=3

# Scale worker dynos
heroku ps:scale worker=2
```

### Vertical Scaling
```bash
# Upgrade to larger dynos
heroku ps:type standard-1x
```

## 🔄 Updates and Maintenance

### Deploy Updates
```bash
git add .
git commit -m "Update description"
git push heroku main
```

### Database Migrations
```bash
heroku run "node -e \"require('./database/messageOperations').initializeTables()\""
```

### Restart App
```bash
heroku restart
```

## 📞 Support

For issues or questions:
1. Check the logs: `heroku logs --tail`
2. Review this documentation
3. Check Heroku status: https://status.heroku.com/
4. Contact support with app name and error details

## 🎉 Success!

Once deployed, your Elite Chat Server will be available at:
`https://your-app-name.herokuapp.com`

The server includes:
- ✅ **WebSocket support** for real-time messaging
- ✅ **Redis caching** for optimal performance
- ✅ **PostgreSQL database** for data persistence
- ✅ **JWT authentication** for security
- ✅ **Rate limiting** for abuse prevention
- ✅ **Health monitoring** for reliability
