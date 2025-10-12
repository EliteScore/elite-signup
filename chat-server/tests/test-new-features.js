require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const WebSocket = require('ws');
const { Pool } = require('pg');

// Database setup
const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

const WS_URL = 'ws://localhost:3001';
const tokenData = require('./test-jwt-tokens.json');
const testTokens = {
  user1: tokenData.valid_tokens[0],
  user2: tokenData.valid_tokens[1],
  user3: tokenData.valid_tokens[2],
  user4: tokenData.valid_tokens[3]
};

// Helper function to connect and authenticate
function connectAndAuth(token) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let authenticated = false;
    
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'authenticate', token }));
    });
    
    ws.on('message', (data) => {
      const msg = JSON.parse(data);
      console.log(`   Received: ${msg.type}`, msg.error || msg.message || '');
      
      if (msg.type === 'auth_success') {
        authenticated = true;
        resolve({ ws, user: msg });
      } else if (msg.type === 'auth_error') {
        reject(new Error(msg.error));
      } else if (msg.type === 'error') {
        console.log(`   Error details: ${msg.details || msg.message}`);
      }
    });
    
    ws.on('error', reject);
    setTimeout(() => {
      if (!authenticated) {
        reject(new Error('Connection timeout'));
      }
    }, 10000);
  });
}

// Wait for message
function waitForMessage(ws, messageType, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${messageType}`)), timeout);
    
    const handler = (data) => {
      const msg = JSON.parse(data);
      if (msg.type === messageType) {
        clearTimeout(timer);
        ws.off('message', handler);
        resolve(msg);
      }
    };
    
    ws.on('message', handler);
  });
}

async function setupTestData() {
  console.log('\n🔧 Setting up test data...\n');
  
  // Check existing follow relationships
  const existing = await dbPool.query(`
    SELECT follower_id, followee_id FROM user_follows
    WHERE (follower_id = 1 AND followee_id IN (2, 3))
       OR (follower_id = 2 AND followee_id = 1)
  `);
  
  console.log(`✅ Found ${existing.rows.length} existing follow relationships`);
  console.log('   Assuming follow relationships already exist in database');
  console.log('   • If tests fail, ensure User 1 follows Users 2 & 3 in main app\n');
}

async function testFollowRelationships() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST 1: Follow Relationships for DMs');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let user1, user3;
  
  try {
    // Connect User 1 and User 3
    user1 = await connectAndAuth(testTokens.user1.token);
    console.log('✅ User 1 connected');
    
    user3 = await connectAndAuth(testTokens.user3.token);
    console.log('✅ User 3 connected\n');
    
    // Test 1.1: User 1 can message User 2 (follows)
    console.log('Test 1.1: User 1 messages User 2 (User 1 follows User 2)');
    user1.ws.send(JSON.stringify({
      type: 'start_conversation',
      recipientId: '2'
    }));
    
    const conv1 = await waitForMessage(user1.ws, 'conversation_started');
    console.log('✅ PASS: Conversation started (follows)\n');
    
    // Test 1.2: User 3 tries to message User 1 (doesn't follow)
    console.log('Test 1.2: User 3 tries to message User 1 (User 3 does NOT follow User 1)');
    user3.ws.send(JSON.stringify({
      type: 'start_conversation',
      recipientId: '1'
    }));
    
    const error1 = await waitForMessage(user3.ws, 'error');
    if (error1.code === 'NOT_FOLLOWING') {
      console.log('✅ PASS: Blocked (NOT_FOLLOWING error)\n');
    } else {
      console.log('❌ FAIL: Expected NOT_FOLLOWING error\n');
    }
    
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  } finally {
    if (user1) user1.ws.close();
    if (user3) user3.ws.close();
  }
}

async function testGroupCreationWithFollowing() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST 2: Group Creation with Follow Requirements');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let user1;
  
  try {
    user1 = await connectAndAuth(testTokens.user1.token);
    console.log('✅ User 1 connected\n');
    
    // Test 2.1: Create group with followed users
    console.log('Test 2.1: User 1 creates group with User 2 & 3 (both followed)');
    user1.ws.send(JSON.stringify({
      type: 'create_group',
      groupName: 'Test Follow Group',
      initialMembers: ['2', '3']
    }));
    
    const groupCreated = await waitForMessage(user1.ws, 'group_created');
    console.log(`✅ PASS: Group created`);
    console.log(`   Group ID: ${groupCreated.groupId}`);
    console.log(`   Members: ${groupCreated.members ? groupCreated.members.length : 'N/A'}\n`);
    
    global.testGroupId = groupCreated.groupId;
    
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  } finally {
    if (user1) user1.ws.close();
  }
}

async function testPromoteDemote() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST 3: Promote/Demote Members');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let user1, user2;
  
  try {
    user1 = await connectAndAuth(testTokens.user1.token);
    console.log('✅ User 1 connected (owner)');
    
    user2 = await connectAndAuth(testTokens.user2.token);
    console.log('✅ User 2 connected (member)\n');
    
    if (!global.testGroupId) {
      console.log('⚠️  No test group ID, skipping promote/demote tests\n');
      return;
    }
    
    // Test 3.1: Owner promotes member to admin
    console.log('Test 3.1: Owner (User 1) promotes User 2 to admin');
    user1.ws.send(JSON.stringify({
      type: 'promote_member',
      groupId: global.testGroupId,
      userId: '2'
    }));
    
    const promoted = await waitForMessage(user1.ws, 'member_promoted');
    if (promoted.newRole === 'admin') {
      console.log('✅ PASS: User 2 promoted to admin\n');
    } else {
      console.log('❌ FAIL: Promotion failed\n');
    }
    
    // Test 3.2: Member tries to promote (should fail)
    console.log('Test 3.2: Member (User 2 as admin) tries to promote User 3');
    user2.ws.send(JSON.stringify({
      type: 'promote_member',
      groupId: global.testGroupId,
      userId: '3'
    }));
    
    const error2 = await waitForMessage(user2.ws, 'error');
    if (error2.code === 'INSUFFICIENT_PERMISSIONS') {
      console.log('✅ PASS: Blocked (only owner can promote)\n');
    } else {
      console.log('❌ FAIL: Should have been blocked\n');
    }
    
    // Test 3.3: Owner demotes admin back to member
    console.log('Test 3.3: Owner (User 1) demotes User 2 back to member');
    user1.ws.send(JSON.stringify({
      type: 'demote_member',
      groupId: global.testGroupId,
      userId: '2'
    }));
    
    const demoted = await waitForMessage(user1.ws, 'member_demoted');
    if (demoted.newRole === 'member') {
      console.log('✅ PASS: User 2 demoted to member\n');
    } else {
      console.log('❌ FAIL: Demotion failed\n');
    }
    
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  } finally {
    if (user1) user1.ws.close();
    if (user2) user2.ws.close();
  }
}

async function testHybridDelete() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST 4: Hybrid Delete System');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let user1, user2;
  
  try {
    user1 = await connectAndAuth(testTokens.user1.token);
    console.log('✅ User 1 connected (owner)');
    
    user2 = await connectAndAuth(testTokens.user2.token);
    console.log('✅ User 2 connected (member)\n');
    
    // Create a test group for deletion
    console.log('Creating test group for deletion...');
    user1.ws.send(JSON.stringify({
      type: 'create_group',
      groupName: 'Group to Delete',
      initialMembers: ['2']
    }));
    
    const newGroup = await waitForMessage(user1.ws, 'group_created');
    const deleteGroupId = newGroup.groupId;
    console.log(`✅ Test group created: ${deleteGroupId}\n`);
    
    // Test 4.1: Member tries to delete (should fail)
    console.log('Test 4.1: Member (User 2) tries to delete group');
    user2.ws.send(JSON.stringify({
      type: 'delete_group',
      groupId: deleteGroupId
    }));
    
    const error1 = await waitForMessage(user2.ws, 'error');
    if (error1.code === 'INSUFFICIENT_PERMISSIONS') {
      console.log('✅ PASS: Blocked (only owner can delete)\n');
    } else {
      console.log('❌ FAIL: Should have been blocked\n');
    }
    
    // Test 4.2: Owner soft deletes group
    console.log('Test 4.2: Owner (User 1) soft deletes group');
    user1.ws.send(JSON.stringify({
      type: 'delete_group',
      groupId: deleteGroupId
    }));
    
    const deleted = await waitForMessage(user1.ws, 'group_deleted');
    if (deleted.permanent === false) {
      console.log('✅ PASS: Group soft deleted (30-day grace period)\n');
    } else {
      console.log('❌ FAIL: Should be soft delete\n');
    }
    
    // Verify in database
    const dbCheck = await dbPool.query(`
      SELECT is_active, deleted_at FROM group_chats WHERE group_id = $1
    `, [deleteGroupId]);
    
    if (dbCheck.rows[0]?.is_active === false && dbCheck.rows[0]?.deleted_at) {
      console.log('✅ PASS: Database shows soft delete (is_active=false, deleted_at set)\n');
    } else {
      console.log('❌ FAIL: Database not updated correctly\n');
    }
    
    // Test 4.3: Owner tries to leave (should fail)
    console.log('Test 4.3: Owner tries to leave group');
    
    // Create another group
    user1.ws.send(JSON.stringify({
      type: 'create_group',
      groupName: 'Leave Test Group',
      initialMembers: ['2']
    }));
    
    const leaveGroup = await waitForMessage(user1.ws, 'group_created');
    const leaveGroupId = leaveGroup.groupId;
    
    user1.ws.send(JSON.stringify({
      type: 'leave_group',
      groupId: leaveGroupId
    }));
    
    const error2 = await waitForMessage(user1.ws, 'error');
    if (error2.code === 'OWNER_CANNOT_LEAVE') {
      console.log('✅ PASS: Owner cannot leave (must delete instead)\n');
    } else {
      console.log('❌ FAIL: Owner should not be able to leave\n');
    }
    
    // Test 4.4: Permanent delete
    console.log('Test 4.4: Owner permanently deletes group');
    user1.ws.send(JSON.stringify({
      type: 'delete_group',
      groupId: leaveGroupId,
      permanent: true
    }));
    
    const permDeleted = await waitForMessage(user1.ws, 'group_deleted');
    if (permDeleted.permanent === true) {
      console.log('✅ PASS: Group permanently deleted\n');
    } else {
      console.log('❌ FAIL: Should be permanent delete\n');
    }
    
    // Verify hard delete in database
    const hardCheck = await dbPool.query(`
      SELECT * FROM group_chats WHERE group_id = $1
    `, [leaveGroupId]);
    
    if (hardCheck.rows.length === 0) {
      console.log('✅ PASS: Group completely removed from database (hard delete)\n');
    } else {
      console.log('❌ FAIL: Group still exists in database\n');
    }
    
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  } finally {
    if (user1) user1.ws.close();
    if (user2) user2.ws.close();
  }
}

async function testMaxMembers() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST 5: Max Members Enforcement');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  let user1;
  
  try {
    user1 = await connectAndAuth(testTokens.user1.token);
    console.log('✅ User 1 connected\n');
    
    // Test 5.1: Create group with max_members = 3
    console.log('Test 5.1: Create group with max_members = 3');
    user1.ws.send(JSON.stringify({
      type: 'create_group',
      groupName: 'Small Group',
      maxMembers: 3,
      initialMembers: ['2', '3']  // Creator + 2 members = 3 total
    }));
    
    const smallGroup = await waitForMessage(user1.ws, 'group_created');
    console.log(`✅ PASS: Group created`);
    console.log(`   Group ID: ${smallGroup.groupId}`);
    console.log(`   Max Members: 3\n`);
    
    global.smallGroupId = smallGroup.groupId;
    
    // Test 5.2: Try to add 4th member (should fail)
    console.log('Test 5.2: Try to add 4th member (group is full)');
    
    // First create follow relationship for user 4
    await dbPool.query(`
      INSERT INTO user_follows (follower_id, followee_id, created_at)
      VALUES (1, 4, NOW())
      ON CONFLICT DO NOTHING;
    `);
    
    user1.ws.send(JSON.stringify({
      type: 'add_group_member',
      groupId: global.smallGroupId,
      userId: '4'
    }));
    
    const error = await waitForMessage(user1.ws, 'error');
    if (error.code === 'GROUP_FULL') {
      console.log('✅ PASS: Blocked (GROUP_FULL error)\n');
    } else {
      console.log(`❌ FAIL: Expected GROUP_FULL, got ${error.code}\n`);
    }
    
    // Test 5.3: Try to create group with too many initial members
    console.log('Test 5.3: Try to create group with 16 members (exceeds default 15)');
    
    const tooManyMembers = Array.from({ length: 50 }, (_, i) => String(i + 2));
    user1.ws.send(JSON.stringify({
      type: 'create_group',
      groupName: 'Too Big Group',
      initialMembers: tooManyMembers
    }));
    
    const error2 = await waitForMessage(user1.ws, 'error');
    if (error2.code === 'TOO_MANY_MEMBERS') {
      console.log('✅ PASS: Blocked (TOO_MANY_MEMBERS error)\n');
    } else {
      console.log(`❌ FAIL: Expected TOO_MANY_MEMBERS, got ${error2?.code}\n`);
    }
    
  } catch (error) {
    console.log(`❌ FAIL: ${error.message}\n`);
  } finally {
    if (user1) user1.ws.close();
  }
}

async function runAllTests() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════╗');
  console.log('║                                                                   ║');
  console.log('║           NEW FEATURES COMPREHENSIVE TEST SUITE                   ║');
  console.log('║                                                                   ║');
  console.log('╚═══════════════════════════════════════════════════════════════════╝');
  
  try {
    await setupTestData();
    await testFollowRelationships();
    await testGroupCreationWithFollowing();
    await testPromoteDemote();
    await testMaxMembers();
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ ALL TESTS COMPLETED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
  } catch (error) {
    console.error('\n❌ Test suite error:', error);
  } finally {
    await dbPool.end();
    process.exit(0);
  }
}

// Run tests
runAllTests();

