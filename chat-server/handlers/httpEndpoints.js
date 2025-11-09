const os = require('os');
const {
  upsertCommunity,
  ensureCommunityMembership,
  recordChallengeEvent,
  getCommunityMembers,
  upsertUserCommunityProgress
} = require('../database/communityOperations');

const COMMUNITY_SYNC_TOKEN = process.env.COMMUNITY_SYNC_TOKEN;
const COMMUNITY_SYNC_MAX_PAYLOAD = parseInt(process.env.COMMUNITY_SYNC_MAX_PAYLOAD || '262144', 10); // 256KB default

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  });
  res.end(JSON.stringify(payload));
}

function sendError(res, statusCode, message, details) {
  sendJson(res, statusCode, {
    status: 'error',
    message,
    details,
    timestamp: new Date().toISOString()
  });
}

function readRequestBody(req, maxSize) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;
      if (body.length > maxSize) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function broadcastCommunityMessage(communityId, payload, clients, userConnections, metrics) {
  const members = await getCommunityMembers(communityId);
  const serialized = JSON.stringify(payload);
  const messageSize = Buffer.byteLength(serialized);
  let delivered = 0;

  for (const member of members) {
    const clientId = userConnections.get(member.userId);
    if (!clientId) continue;

    const client = clients.get(clientId);
    if (!client || !client.ws || client.ws.readyState !== require('ws').OPEN) continue;

    try {
      client.ws.send(serialized);
      metrics.totalDataTransferred += messageSize;
      delivered++;
    } catch (error) {
      console.warn(`Failed to deliver community message to ${member.userId}: ${error.message}`);
    }
  }

  return delivered;
}

function setupHttpEndpoints(server, wss, dbPool, getDbConnected, metrics, clients, userConnections) {
  async function handleCommunityProgression(req, res) {
    if (!COMMUNITY_SYNC_TOKEN) {
      sendError(res, 500, 'Community sync token not configured', 'Set COMMUNITY_SYNC_TOKEN in environment');
      return;
    }

    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

    if (!token || token !== COMMUNITY_SYNC_TOKEN) {
      sendError(res, 401, 'Unauthorized', 'Missing or invalid bearer token');
      return;
    }

    let rawBody;
    try {
      rawBody = await readRequestBody(req, COMMUNITY_SYNC_MAX_PAYLOAD);
    } catch (error) {
      if (error.message === 'Payload too large') {
        sendError(res, 413, 'Payload too large', `Max size ${COMMUNITY_SYNC_MAX_PAYLOAD} bytes`);
      } else {
        sendError(res, 400, 'Failed to read request body', error.message);
      }
      return;
    }

    let payload;
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch (error) {
      sendError(res, 400, 'Invalid JSON body', error.message);
      return;
    }

    const { community, members, event, progress } = payload || {};
    const derivedCommunityId = event?.communityId || progress?.communityId || community?.communityId;
    const actorUserId = event?.userId || progress?.userId;

    if (!derivedCommunityId) {
      sendError(res, 400, 'communityId required', 'Include communityId in event, progress, or community payload');
      return;
    }

    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      communityId: derivedCommunityId
    };

    try {
      if (community) {
        response.community = await upsertCommunity({
          ...community,
          communityId: derivedCommunityId
        });
      }

      const ensuredMembers = [];
      if (Array.isArray(members)) {
        for (const member of members) {
          if (!member || !member.userId) continue;
          const ensured = await ensureCommunityMembership(
            derivedCommunityId,
            member.userId,
            {
              role: member.role,
              isMuted: member.isMuted,
              joinedAt: member.joinedAt,
              lastSeenAt: member.lastSeenAt,
              metadata: member.metadata
            }
          );
          ensuredMembers.push(ensured);
        }
        response.members = ensuredMembers;
      }

      if (actorUserId) {
        await ensureCommunityMembership(derivedCommunityId, actorUserId, { role: 'member' });
      }

      let eventRecord = null;
      let progressRecord = null;

      if (event) {
        const eventPayload = {
          ...event,
          communityId: derivedCommunityId,
          userId: event.userId || actorUserId
        };

        const progressSnapshot = progress
          ? {
              ...progress,
              communityId: derivedCommunityId,
              userId: progress.userId || actorUserId,
              lastCompletedAt: progress.lastCompletedAt || event.occurredAt
            }
          : null;

        const record = await recordChallengeEvent(eventPayload, progressSnapshot);
        eventRecord = record.event;
        progressRecord = record.progress || progressRecord;
      } else if (progress) {
        progressRecord = await upsertUserCommunityProgress({
          ...progress,
          communityId: derivedCommunityId,
          userId: progress.userId || actorUserId
        });
      }

      if (eventRecord) {
        response.event = eventRecord;
      }
      if (progressRecord) {
        response.progress = progressRecord;
      }

      if (eventRecord || progressRecord) {
        const delivered = await broadcastCommunityMessage(
          derivedCommunityId,
          {
            type: 'community_progress_update',
            communityId: derivedCommunityId,
            userId: actorUserId,
            event: eventRecord,
            progress: progressRecord,
            timestamp: new Date().toISOString()
          },
          clients,
          userConnections,
          metrics
        );
        response.broadcast = { delivered };
      }

      sendJson(res, 200, response);
    } catch (error) {
      console.error('Community progression handler error:', error);
      sendError(res, 500, 'Internal server error', error.message);
    }
  }

  server.on('request', (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    
    // Set CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }
    
    if (url.pathname === '/health') {
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        connections: wss.clients.size,
        memory: process.memoryUsage(),
        platform: {
          node: process.version,
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname(),
          loadAverage: os.loadavg(),
          freeMemory: os.freemem(),
          totalMemory: os.totalmem()
        },
        metrics,
        database: {
          connected: getDbConnected(),
          pool: {
            totalCount: dbPool.totalCount,
            idleCount: dbPool.idleCount,
            waitingCount: dbPool.waitingCount
          }
        },
        security: {
          rateLimitHits: metrics.rateLimitHits || 0,
          securityWarnings: metrics.securityWarnings || 0
        },
        performance: {
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
          cpuUsage: process.cpuUsage(),
          activeConnections: wss.clients.size,
          totalConnections: metrics.connections || 0,
          messagesPerSecond: metrics.messagesReceived / (process.uptime() / 60) || 0
        }
      };
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(health, null, 2));
    } else if (url.pathname === '/metrics') {
      const detailedMetrics = {
        ...metrics,
        timestamp: new Date().toISOString(),
        system: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          cpu: process.cpuUsage(),
          platform: {
            loadAverage: os.loadavg(),
            freeMemory: os.freemem(),
            totalMemory: os.totalmem(),
            cpus: os.cpus().length
          }
        },
        database: {
          connected: getDbConnected(),
          pool: {
            totalCount: dbPool.totalCount,
            idleCount: dbPool.idleCount,
            waitingCount: dbPool.waitingCount
          }
        }
      };
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(detailedMetrics, null, 2));
    } else if (url.pathname === '/ready') {
      const readiness = {
        ready: getDbConnected() && wss.clients.size >= 0,
        timestamp: new Date().toISOString(),
        checks: [
          { name: 'database', status: getDbConnected() ? 'healthy' : 'unhealthy' },
          { name: 'websocket', status: 'healthy' },
          { name: 'memory', status: 'healthy' }
        ]
      };
      
      res.writeHead(readiness.ready ? 200 : 503, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(readiness, null, 2));
    } else if (url.pathname === '/live') {
      const liveness = {
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      };
      
      res.writeHead(200, { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(liveness, null, 2));
    } else if (url.pathname === '/community/progression' && req.method === 'POST') {
      handleCommunityProgression(req, res);
    } else if (url.pathname === '/users') {
      // This would need access to userConnections and clients
      // For now, return basic info
      const userList = [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(userList));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
}

module.exports = {
  setupHttpEndpoints
};
