#!/usr/bin/env node

/**
 * Helper script to fire a sample /community/progression webhook against a running chat server.
 *
 * Usage:
 *   COMMUNITY_SYNC_TOKEN=secret node scripts/send-community-progression.js \
 *     --url http://localhost:3001/community/progression \
 *     --community community_dev_builders \
 *     --user user_demo
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const crypto = require('crypto');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    url: process.env.COMMUNITY_WEBHOOK_URL || 'http://localhost:3001/community/progression',
    communityId: null,
    userId: null
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--url' && args[i + 1]) {
      options.url = args[i + 1];
      i += 1;
    } else if (arg === '--community' && args[i + 1]) {
      options.communityId = args[i + 1];
      i += 1;
    } else if (arg === '--user' && args[i + 1]) {
      options.userId = args[i + 1];
      i += 1;
    }
  }

  if (!options.communityId) {
    options.communityId = `community_demo_${Date.now()}`;
  }

  if (!options.userId) {
    options.userId = `user_${Math.floor(Math.random() * 1000)}`;
  }

  return options;
}

async function main() {
  const { url, communityId, userId } = parseArgs();
  const syncToken = process.env.COMMUNITY_SYNC_TOKEN;

  if (!syncToken) {
    console.error('❌ COMMUNITY_SYNC_TOKEN environment variable is required.');
    process.exit(1);
  }

  const endpointUrl = new URL(url);
  const payload = {
    community: {
      communityId,
      name: `Demo Community ${communityId}`,
      description: 'Sample community created via webhook script',
      avatarUrl: null,
      defaultGroupId: `group_${communityId}`,
      isActive: true
    },
    members: [
      { userId, role: 'member' }
    ],
    event: {
      eventId: `evt_${crypto.randomUUID()}`,
      userId,
      communityId,
      challengeId: 'daily_demo_push',
      challengeType: 'daily',
      xpAwarded: 25,
      occurredAt: new Date().toISOString(),
      payload: {
        note: 'Triggered via send-community-progression.js'
      }
    },
    progress: {
      userId,
      communityId,
      totalXp: 250,
      dailyStreak: 4,
      weeklyStreak: 1,
      lastChallengeId: 'daily_demo_push',
      lastChallengeType: 'daily',
      lastCompletedAt: new Date().toISOString()
    }
  };

  const body = JSON.stringify(payload);
  const isHttps = endpointUrl.protocol === 'https:';
  const httpModule = isHttps ? https : http;

  const requestOptions = {
    hostname: endpointUrl.hostname,
    port: endpointUrl.port || (isHttps ? 443 : 80),
    path: endpointUrl.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
      Authorization: `Bearer ${syncToken}`
    }
  };

  console.log(`🚀 Sending sample progression event to ${endpointUrl.href}`);
  console.log(`   Community: ${communityId}`);
  console.log(`   User: ${userId}`);

  const req = httpModule.request(requestOptions, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`\n✅ Response Status: ${res.statusCode}`);
      try {
        const json = JSON.parse(data);
        console.log(JSON.stringify(json, null, 2));
      } catch (error) {
        console.log(data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('\n❌ Request failed:', error.message);
    process.exit(1);
  });

  req.write(body);
  req.end();
}

main();

