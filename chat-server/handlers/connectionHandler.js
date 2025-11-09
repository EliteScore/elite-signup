const crypto = require('crypto');
const { handleMessage } = require('./messageRouter');
const { broadcastToAll } = require('./messageHandlers');
const SecurityUtils = require('../security/securityUtils');
const InputValidator = require('../security/inputValidator');
const { getRedisClient, isRedisConnected } = require('../config/redis');

// Performance configuration from environment
const MAX_CONNECTIONS_PER_IP = parseInt(process.env.MAX_CONNECTIONS_PER_IP) || 1000;
const MESSAGE_RATE_LIMIT = parseInt(process.env.MESSAGE_RATE_LIMIT) || 30;
const CONNECTION_TIMEOUT = parseInt(process.env.CONNECTION_TIMEOUT) || 30000;

// IP connection limiting
function checkConnectionLimit(ip, ipConnections) {
  const currentConnections = ipConnections.get(ip) || 0;
  if (currentConnections >= MAX_CONNECTIONS_PER_IP) {
    return false;
  }
  ipConnections.set(ip, currentConnections + 1);
  return true;
}

// Rate limiting function
function checkRateLimit(userId, clientId, messageRateLimit, metrics) {
  const now = Date.now();
  const userKey = `rate_limit:${userId}`;
  const clientKey = `rate_limit:${clientId}`;
  
  // Get current rate limit data
  const userMessages = messageRateLimit.get(userKey) || [];
  const clientMessages = messageRateLimit.get(clientKey) || [];
  
  // Clean old messages (older than 1 minute)
  const recentUserMessages = userMessages.filter(time => now - time < 60000);
  const recentClientMessages = clientMessages.filter(time => now - time < 60000);
  
  // Check limits
  if (recentUserMessages.length >= MESSAGE_RATE_LIMIT || recentClientMessages.length >= MESSAGE_RATE_LIMIT) {
    metrics.rateLimitHits++;
    return false;
  }
  
  // Update rate limit data
  recentUserMessages.push(now);
  recentClientMessages.push(now);
  messageRateLimit.set(userKey, recentUserMessages);
  messageRateLimit.set(clientKey, recentClientMessages);
  
  return true;
}

async function handleWebSocketConnection(ws, req, clients, userConnections, conversations, groups, ipConnections, messageRateLimit, sessions, metrics, rateLimiter) {
  const clientId = crypto.randomUUID();
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  // Enhanced IP validation
  if (!SecurityUtils.validateIP(clientIp)) {
    console.warn(`Invalid IP address: ${clientIp}`);
    ws.close(1008, 'Invalid IP address');
    return;
  }
  
  // Check connection limits with enhanced rate limiting
  if (!checkConnectionLimit(clientIp, ipConnections)) {
    console.warn(`Connection limit exceeded for IP: ${clientIp}`);
    ws.close(1008, 'Connection limit exceeded');
    return;
  }
  
  // Check IP-based rate limiting
  if (!rateLimiter.checkIPRateLimit(clientIp)) {
    console.warn(`Rate limit exceeded for IP: ${clientIp}`);
    ws.close(1008, 'Rate limit exceeded');
    return;
  }
  
  console.log(`New WebSocket connection: ${clientId} from ${clientIp}`);
  metrics.connections++;
  
  // Store initial client information with IP
  const clientData = {
    ws,
    clientIp,
    lastActivity: Date.now()
  };
  
  clients.set(clientId, clientData);
  
  // Store session in Redis for distributed access
  if (isRedisConnected()) {
    try {
      const redisClient = getRedisClient();
      await redisClient.setEx(`session:${clientId}`, 3600, JSON.stringify({
        clientIp,
        lastActivity: Date.now(),
        connected: true
      }));
    } catch (redisError) {
      console.warn('Failed to store session in Redis:', redisError.message);
    }
  }
  
  // Set connection timeout
  const connectionTimeout = setTimeout(() => {
    if (ws.readyState === require('ws').OPEN) {
      console.warn(`Connection timeout for client: ${clientId}`);
      ws.close(1000, 'Connection timeout');
    }
  }, CONNECTION_TIMEOUT);
  
  ws.on('message', async (data) => {
    try {
      const startTime = Date.now();
      
      // Enhanced JSON parsing with graceful error handling
      let message;
      try {
        message = JSON.parse(data);
      } catch (jsonError) {
        console.warn(`Malformed JSON received from client ${clientId}: ${jsonError.message}`);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid JSON format. Please check your message structure.',
          details: 'The message must be valid JSON with proper syntax.'
        }));
        return;
      }
      
      metrics.messagesReceived++;
      
      // Update client activity
      const currentClient = clients.get(clientId);
      if (currentClient) {
        currentClient.lastActivity = Date.now();
        currentClient.messageCount = (currentClient.messageCount || 0) + 1;
        
        // Update Redis session
        if (isRedisConnected()) {
          try {
            const redisClient = getRedisClient();
            await redisClient.setEx(`session:${clientId}`, 3600, JSON.stringify({
              clientIp: currentClient.clientIp,
              lastActivity: currentClient.lastActivity,
              connected: true,
              messageCount: currentClient.messageCount,
              user: currentClient.user || null
            }));
          } catch (redisError) {
            console.warn('Failed to update session in Redis:', redisError.message);
          }
        }
      }
      
      // Enhanced input validation with specific error messages
      if (message.type === 'send_private_message') {
        const validation = InputValidator.validateMessage(message);
        if (!validation.isValid) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Missing required fields',
            details: validation.errors.join('; '),
            field: validation.field || 'general'
          }));
          return;
        }
        // Use sanitized content
        message.content = validation.sanitizedContent;
      }
      
      // Check message rate limiting for authenticated users (more lenient for large messages)
      if (currentClient && currentClient.user) {
        const messageLength = message.content ? message.content.length : 0;
        const rateLimitThreshold = messageLength > 500 ? MESSAGE_RATE_LIMIT * 2 : MESSAGE_RATE_LIMIT;
        
        if (!rateLimiter.checkMessageRateLimit(currentClient.user.userId, rateLimitThreshold)) {
          metrics.rateLimitHits = (metrics.rateLimitHits || 0) + 1;
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Rate limit exceeded',
            details: 'You are sending messages too quickly. Please wait a moment before sending another message.',
            retryAfter: 30
          }));
          return;
        }
      }
      
      // Check if user is authenticated for protected operations
      const protectedOperations = [
        'get_online_users',
        'start_conversation',
        'send_private_message',
        'mark_message_read',
        'typing',
        'add_reaction',
        'remove_reaction',
        'edit_message',
        'delete_message',
        'delete_conversation',
        'get_private_messages',
        'get_communities',
        'get_community_members',
        'get_community_progress'
      ];
      
      if (protectedOperations.includes(message.type) && (!currentClient || !currentClient.user)) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Authentication required',
          details: 'You must authenticate before performing this action. Send an authenticate message with your JWT token.',
          requiresAuth: true
        }));
        return;
      }
      
      await handleMessage(ws, message, clientId, clients, userConnections, conversations, sessions, metrics, groups);
      
      // Update average response time
      const responseTime = Date.now() - startTime;
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
      
    } catch (error) {
      console.error('Error processing message:', error);
      metrics.errors++;
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Internal server error',
        details: 'An unexpected error occurred while processing your request.',
        errorId: crypto.randomUUID()
      }));
    }
  });
  
  ws.on('close', async () => {
    clearTimeout(connectionTimeout);
    console.log(`Client disconnected: ${clientId}`);
    
    // Update connection count for IP
    const currentConnections = ipConnections.get(clientIp) || 0;
    ipConnections.set(clientIp, Math.max(0, currentConnections - 1));
    
    // Get client info before deleting
    const client = clients.get(clientId);
    
    // Remove user from online users
    if (client && client.user) {
      userConnections.delete(client.user.userId);
      sessions.delete(client.user.userId);
      
      // Notify other users that this user went offline
      broadcastToAll({
        type: 'user_offline',
        user: {
          id: client.user.userId,
          username: client.user.username
        },
        timestamp: new Date().toISOString()
      }, clientId, clients, metrics);
    }
    
    clients.delete(clientId);
    
    // Clean up Redis session
    if (isRedisConnected()) {
      try {
        const redisClient = getRedisClient();
        await redisClient.del(`session:${clientId}`);
        
        // Also clean up user session mapping if user was authenticated
        if (client && client.user) {
          await redisClient.del(`user_session:${client.user.userId}`);
        }
      } catch (redisError) {
        console.warn('Failed to clean up Redis session:', redisError.message);
      }
    }
    
    // Update metrics
    metrics.activeUsers = clients.size;
    if (metrics.activeUsers > metrics.peakConcurrentUsers) {
      metrics.peakConcurrentUsers = metrics.activeUsers;
    }
    
    // Clean up rate limiting
    messageRateLimit.delete(`rate_limit:${clientId}`);
  });
  
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    metrics.errors++;
  });
  
  // Send welcome message requiring authentication
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: 'Please authenticate to continue',
    requiresAuth: true,
    timestamp: new Date().toISOString()
  }));
}

module.exports = {
  handleWebSocketConnection,
  checkConnectionLimit,
  checkRateLimit
};
