// Load environment variables
require('dotenv').config();

const WebSocket = require('ws');
const http = require('http');
const winston = require('winston');
const os = require('os');

// Import modularized components
const { dbPool, dbConnected, initializeDatabase, getDbConnected } = require('./config/database');
const { initializeRedis, isRedisConnected, closeRedis } = require('./config/redis');
const RateLimiter = require('./security/rateLimiter');
const { setupHttpEndpoints } = require('./handlers/httpEndpoints');
const { handleWebSocketConnection } = require('./handlers/connectionHandler');

// Performance configuration from environment
const MAX_PAYLOAD_SIZE = parseInt(process.env.MAX_PAYLOAD_SIZE) || 1048576; // 1MB
const KEEP_ALIVE_TIMEOUT = parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 60000;
const MAX_CONNECTIONS = parseInt(process.env.MAX_CONNECTIONS) || 50000; // Increased from 10k to 50k (5x improvement)

// Initialize security components
const rateLimiter = new RateLimiter();

// Configure logging with better performance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Create HTTP server with performance settings
const server = http.createServer({
  maxHeaderSize: 8192,
  keepAlive: true,
  keepAliveTimeout: KEEP_ALIVE_TIMEOUT,
  maxConnections: MAX_CONNECTIONS
});

// Create WebSocket server with performance optimizations
const wss = new WebSocket.Server({ 
  server,
  clientTracking: true,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 3,        // Reduced from 7 to 3 (less memory usage)
      level: 1            // Reduced from 3 to 1 (faster compression)
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 512        // Reduced from 1024 to 512 (compress smaller messages)
  },
  maxPayload: MAX_PAYLOAD_SIZE // 1MB max message size
});

// Store connected clients and conversations with better performance
const clients = new Map(); // clientId -> { ws, user, clientIp, lastActivity }
const userConnections = new Map(); // userId -> clientId
const conversations = new Map(); // conversationId -> { participants: Set, messages: [] }
const groups = new Map(); // groupId -> { name, members: Set, messages: [] }
const ipConnections = new Map(); // Track connections per IP
const messageRateLimit = new Map(); // Rate limiting per user
const sessions = new Map(); // In-memory session storage

// Enhanced metrics for monitoring
const metrics = {
  connections: 0,
  messagesSent: 0,
  messagesReceived: 0,
  errors: 0,
  startTime: Date.now(),
  activeUsers: 0,
  conversations: 0,
  peakConcurrentUsers: 0,
  averageResponseTime: 0,
  totalDataTransferred: 0,
  rateLimitHits: 0
};

// Initialize database and Redis
async function initializeServices() {
  try {
    // Initialize database
    const dbSuccess = await initializeDatabase();
    if (dbSuccess) {
      logger.info('✅ Database initialized successfully');
    } else {
      logger.warn('⚠️ Database initialization failed, using fallback mode');
    }
    
    // Initialize Redis
    const redisSuccess = await initializeRedis();
    if (redisSuccess) {
      logger.info('✅ Redis initialized successfully');
    } else {
      logger.warn('⚠️ Redis initialization failed, using database-only mode');
    }
  } catch (error) {
    logger.error('Service initialization error:', error.message);
  }
}

// Start services
initializeServices();

// Setup HTTP endpoints with function to get current database status
setupHttpEndpoints(server, wss, dbPool, getDbConnected, metrics, clients, userConnections);

// Import cleanup function for deleted groups
const { cleanupOldDeletedGroups } = require('./database/groupOperations');

// Schedule cleanup of soft-deleted groups (runs daily)
setInterval(async () => {
  try {
    const deletedCount = await cleanupOldDeletedGroups();
    if (deletedCount > 0) {
      logger.info(`Auto-cleanup: Permanently deleted ${deletedCount} groups older than 30 days`);
    }
  } catch (error) {
    logger.error('Error in scheduled group cleanup:', error);
  }
}, 24 * 60 * 60 * 1000); // Run once per day (24 hours)

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  handleWebSocketConnection(
    ws, 
    req, 
    clients, 
    userConnections, 
    conversations,
    groups, 
    ipConnections, 
    messageRateLimit, 
    sessions, 
    metrics, 
    rateLimiter
  );
});

// Set up periodic cleanup
setInterval(() => {
  rateLimiter.cleanup();
  
  // Memory cleanup - limit in-memory message history (keep recent messages only)
  const now = Date.now();
  const maxInMemoryMessages = 100; // Keep only last 100 messages per conversation in memory
  
  for (const [convId, conversation] of conversations.entries()) {
    // Keep only recent messages in memory (older messages are in database)
    if (conversation.messages.length > maxInMemoryMessages) {
      conversation.messages = conversation.messages.slice(-maxInMemoryMessages);
    }
    
    // Don't remove conversations - users need access to them
  }
  
  // Clean up group messages in memory
  for (const [groupId, group] of groups.entries()) {
    if (group.messages.length > maxInMemoryMessages) {
      group.messages = group.messages.slice(-maxInMemoryMessages);
    }
  }
  
  // Clean up inactive clients
  for (const [clientId, client] of clients.entries()) {
    const inactiveTime = now - client.lastActivity;
    if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
      if (client.ws.readyState === require('ws').OPEN) {
        client.ws.close(1000, 'Inactive timeout');
      }
      clients.delete(clientId);
    }
  }
  
  // Log memory usage
  const memUsage = process.memoryUsage();
  logger.info(`Memory cleanup completed. RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
  
}, 30000); // Clean up every 30 seconds (faster cleanup)

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  wss.clients.forEach(client => {
    client.close(1000, 'Server shutting down');
  });
  
  await dbPool.end();
  await closeRedis();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  wss.clients.forEach(client => {
    client.close(1000, 'Server shutting down');
  });
  
  await dbPool.end();
  await closeRedis();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server
const port = process.env.PORT || 3001;
console.log('Starting enhanced private messaging server...');
console.log('Environment variables:', {
  NODE_ENV: process.env.NODE_ENV || 'production',
  REDIS: 'disabled'
});

server.listen(port, async () => {
  console.log(`🚀 Enhanced private messaging server running on port ${port}`);
  logger.info(`Enhanced private messaging server running on port ${port}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'production'}`);
  logger.info(`Active connections: ${wss.clients.size}`);
  logger.info(`Database pool: ${getDbConnected() ? 'active' : 'inactive'}`);
  logger.info(`Security: enhanced rate limiting and validation`);
  logger.info(`Health checks: available at /health, /metrics, /ready, /live`);
});

module.exports = { wss, server, metrics };
