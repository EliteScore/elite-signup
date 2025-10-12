const WebSocket = require('ws');
const fs = require('fs');
const { Pool } = require('pg');

// Load test JWT tokens
const testTokens = JSON.parse(fs.readFileSync('./test-jwt-tokens.json', 'utf8'));

// Database connection - use .env credentials
require('dotenv').config({ path: '../.env' });

const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

console.log('🔒 BLOCKING FEATURES TEST');
console.log('================================================================================\n');

const SERVER_URL = 'ws://localhost:3001';

let testResults = {
  passed: 0,
  failed: 0,
  startTime: Date.now()
};

// Helper to create user connection
async function createUserConnection(user) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(SERVER_URL);
    
    const connection = {
      ws,
      user,
      authenticated: false,
      messages: []
    };
    
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'authenticate',
        token: user.token
      }));
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          connection.messages.push(message);
          
          if (message.type === 'auth_success') {
            connection.authenticated = true;
            connection.userId = message.user.id;
            connection.username = message.user.username;
            resolve(connection);
          }
        } catch (error) {
          console.log(`Received raw message: ${data.toString()}`);
        }
      });
    });
    
    ws.on('error', (error) => {
      reject(error);
    });
    
    setTimeout(() => reject(new Error('Connection timeout')), 10000);
  });
}

// Helper to wait
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runBlockingTests() {
  let alice, bob, charlie;
  
  try {
    console.log('📡 Phase 1: Setting up test users...\n');
    
    // Connect 3 users
    alice = await createUserConnection({ 
      name: 'Alice', 
      token: testTokens.valid_tokens[0].token 
    });
    console.log(`✅ Alice connected (ID: ${alice.userId})`);
    
    bob = await createUserConnection({ 
      name: 'Bob', 
      token: testTokens.valid_tokens[1]?.token || testTokens.valid_tokens[0].token 
    });
    console.log(`✅ Bob connected (ID: ${bob.userId})`);
    
    charlie = await createUserConnection({ 
      name: 'Charlie', 
      token: testTokens.valid_tokens[2]?.token || testTokens.valid_tokens[0].token 
    });
    console.log(`✅ Charlie connected (ID: ${charlie.userId})`);
    
    await wait(1000);
    testResults.passed++;
    
    // Setup: Create a blocking relationship (Alice blocks Bob)
    console.log('\n🔧 Setup: Creating blocking relationship...');
    try {
      await dbPool.query(`
        INSERT INTO blocked_relationships (blocker_id, blocked_id)
        VALUES ($1, $2)
        ON CONFLICT (blocker_id, blocked_id) DO NOTHING
      `, [parseInt(alice.userId), parseInt(bob.userId)]);
      console.log(`✅ Test data: Alice (${alice.userId}) blocked Bob (${bob.userId})`);
    } catch (error) {
      console.log(`⚠️  Could not create test block: ${error.message}`);
    }
    
    await wait(500);
    
    // Test 1: Alice tries to message Bob (should fail)
    console.log('\n📊 Test 1: Blocked user cannot send DM');
    console.log('─'.repeat(60));
    let test1Passed = false;
    
    alice.ws.send(JSON.stringify({
      type: 'send_private_message',
      recipientId: bob.userId,
      content: 'Hello Bob!'
    }));
    
    await wait(1000);
    
    const aliceError = alice.messages.find(m => 
      m.type === 'error' && m.code === 'USER_BLOCKED'
    );
    
    if (aliceError) {
      console.log('✅ Alice received USER_BLOCKED error');
      console.log(`   Error message: "${aliceError.message}"`);
      test1Passed = true;
      testResults.passed++;
    } else {
      console.log('❌ Alice did not receive blocking error');
      testResults.failed++;
    }
    
    // Test 2: Bob tries to message Alice (reverse, should also fail)
    console.log('\n📊 Test 2: Blocked user cannot receive DM (bi-directional)');
    console.log('─'.repeat(60));
    let test2Passed = false;
    
    bob.messages = []; // Clear messages
    bob.ws.send(JSON.stringify({
      type: 'send_private_message',
      recipientId: alice.userId,
      content: 'Hello Alice!'
    }));
    
    await wait(1000);
    
    const bobError = bob.messages.find(m => 
      m.type === 'error' && m.code === 'USER_BLOCKED'
    );
    
    if (bobError) {
      console.log('✅ Bob received USER_BLOCKED error (bi-directional blocking works)');
      test2Passed = true;
      testResults.passed++;
    } else {
      console.log('❌ Bob did not receive blocking error');
      testResults.failed++;
    }
    
    // Test 3: Alice and Charlie can message (no blocking)
    console.log('\n📊 Test 3: Non-blocked users can message freely');
    console.log('─'.repeat(60));
    
    alice.messages = [];
    charlie.messages = [];
    
    alice.ws.send(JSON.stringify({
      type: 'send_private_message',
      recipientId: charlie.userId,
      content: 'Hello Charlie!'
    }));
    
    await wait(1000);
    
    const aliceSuccess = alice.messages.find(m => m.type === 'private_message_sent');
    const charlieReceived = charlie.messages.find(m => m.type === 'new_private_message');
    
    if (aliceSuccess && charlieReceived) {
      console.log('✅ Non-blocked users can message successfully');
      console.log(`   Alice sent message: "${aliceSuccess.message?.content}"`);
      console.log(`   Charlie received: "${charlieReceived.message?.content}"`);
      testResults.passed++;
    } else {
      console.log('❌ Non-blocked messaging failed');
      testResults.failed++;
    }
    
    // Test 4: Blocked users don't appear in online users list
    console.log('\n📊 Test 4: Blocked users hidden from online users list');
    console.log('─'.repeat(60));
    
    alice.messages = [];
    alice.ws.send(JSON.stringify({
      type: 'get_online_users'
    }));
    
    await wait(1000);
    
    const onlineUsers = alice.messages.find(m => m.type === 'online_users');
    if (onlineUsers) {
      const bobInList = onlineUsers.users.some(u => u.id === bob.userId);
      
      if (!bobInList) {
        console.log('✅ Bob (blocked) is NOT in Alice\'s online users list');
        console.log(`   Online users for Alice: ${onlineUsers.users.map(u => u.username).join(', ')}`);
        testResults.passed++;
      } else {
        console.log('❌ Bob (blocked) is still visible to Alice');
        testResults.failed++;
      }
    } else {
      console.log('❌ Could not get online users list');
      testResults.failed++;
    }
    
    // Test 5: Cannot start conversation with blocked user
    console.log('\n📊 Test 5: Cannot start conversation with blocked user');
    console.log('─'.repeat(60));
    
    alice.messages = [];
    alice.ws.send(JSON.stringify({
      type: 'start_conversation',
      recipientId: bob.userId
    }));
    
    await wait(1000);
    
    const convError = alice.messages.find(m => 
      m.type === 'error' && m.code === 'USER_BLOCKED'
    );
    
    if (convError) {
      console.log('✅ Cannot start conversation with blocked user');
      testResults.passed++;
    } else {
      console.log('❌ Conversation with blocked user was allowed');
      testResults.failed++;
    }
    
    // Cleanup: Remove test blocking relationship
    console.log('\n🧹 Cleanup: Removing test blocking relationship...');
    try {
      await dbPool.query(`
        DELETE FROM blocked_relationships
        WHERE blocker_id = $1 AND blocked_id = $2
      `, [parseInt(alice.userId), parseInt(bob.userId)]);
      console.log('✅ Test blocking relationship removed');
    } catch (error) {
      console.log(`⚠️  Cleanup warning: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test execution error:', error);
    testResults.failed++;
  }
  
  // Cleanup connections
  console.log('\n🧹 Closing connections...');
  if (alice?.ws) alice.ws.close();
  if (bob?.ws) bob.ws.close();
  if (charlie?.ws) charlie.ws.close();
  
  await wait(500);
  
  // Print results
  const totalDuration = Date.now() - testResults.startTime;
  const successRate = (testResults.passed / (testResults.passed + testResults.failed)) * 100;
  
  console.log('\n' + '='.repeat(80));
  console.log('📊 BLOCKING FEATURES TEST RESULTS');
  console.log('='.repeat(80));
  console.log(`\n⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`📈 Success Rate: ${successRate.toFixed(2)}%`);
  
  if (successRate === 100) {
    console.log('\n🎉 EXCELLENT: All blocking features working perfectly!');
  } else if (successRate >= 80) {
    console.log('\n✅ GOOD: Most blocking features working');
  } else {
    console.log('\n❌ ISSUES: Some blocking features need attention');
  }
  
  await dbPool.end();
  process.exit(successRate === 100 ? 0 : 1);
}

runBlockingTests().catch(error => {
  console.error('❌ Fatal error:', error);
  dbPool.end();
  process.exit(1);
});

